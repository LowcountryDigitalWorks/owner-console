import { describe, expect, it, vi } from "vitest";
import {
  loadPrivateOwnerSnapshot,
  nextPrivateExpiry,
  parsePrivateOwnerSnapshot,
  privateCardTrust,
} from "./privateOwnerSnapshot";

const observed = "2026-01-01T12:00:00Z";
const authority =
  "https://github.com/LowcountryDigitalWorks/business-operations";
const modules: Record<string, string[]> = {
  portfolio: ["portfolio-workstream-counts", "portfolio-material-exceptions"],
  github_work: ["github-open-pr-queue", "github-ci-exceptions"],
  capacity: ["capacity-entitlement-metadata", "capacity-runtime-exceptions"],
  automation: ["automation-flow-exceptions"],
  security: ["security-poam-summary"],
  growth: ["growth-actionable-leads"],
  clients_engagements: ["clients-engagement-references"],
  quick_actions: ["quick-action-deep-links"],
};

function fixture() {
  return {
    schema_version: "ldw.owner-snapshot.v1",
    source_manifest_version: "ldw.owner-snapshot-manifest.v1",
    generated_at: observed,
    data_classification: "internal-sanitized",
    summary: {
      total_cards: 11,
      healthy: 0,
      attention: 0,
      blocked: 1,
      waiting: 0,
      unknown: 10,
      stale_sources: 0,
    },
    modules: Object.fromEntries(
      Object.entries(modules).map(([name, ids]) => [
        name,
        {
          title: "Synthetic " + name,
          cards: ids.map((id) => {
            const ci = id === "github-ci-exceptions";
            const portfolio = name === "portfolio";
            return {
              schema_version: "ldw.owner-snapshot.v1",
              card_id: id,
              title: "Synthetic " + id,
              state: ci ? "blocked" : "unknown",
              summary: ci ? "Synthetic scan cancelled" : "Synthetic unknown",
              source: {
                system: ci ? "github" : portfolio ? "portfolio" : "synthetic",
                authority_ref: ci
                  ? "github:checks/failing"
                  : portfolio
                    ? "portfolio/CONTROL_TOWER.yaml"
                    : "synthetic",
                observed_at: ci ? observed : null,
                freshness: ci ? "fresh" : "unknown",
              },
              evidence_refs: ["synthetic-evidence"],
              deep_link: ci
                ? authority + "/actions"
                : portfolio
                  ? authority + "/blob/main/portfolio/CONTROL_TOWER.yaml"
                  : "https://example.invalid/synthetic",
              action_mode: portfolio ? "read-only" : "link-only",
              data_classification: "internal-sanitized",
            };
          }),
        },
      ]),
    ),
  };
}

describe("private one-shot snapshot renderer boundary", () => {
  it("maps only approved cards with unknown coverage and no owner escalation", () => {
    const value = parsePrivateOwnerSnapshot(fixture());
    expect(value.items.map((item) => item.id)).toEqual([
      "github-ci-exceptions",
      "portfolio-workstream-counts",
      "portfolio-material-exceptions",
    ]);
    expect(value.omittedUnknown).toBe(8);
    expect(value.items[0]).toMatchObject({
      condition: "blocked",
      escalation: "none",
      relevance: "BRIEF",
      observedAt: observed,
    });
    expect(value.items[1]).toMatchObject({
      trust: "Unknown",
      observedAt: null,
    });
  });

  it("ages the selected GitHub card at its accepted six-hour boundary", () => {
    const value = parsePrivateOwnerSnapshot(fixture());
    const time = Date.parse(observed);
    const item = value.items[0]!;
    expect(privateCardTrust(value, item, time)).toBe("Fresh");
    expect(nextPrivateExpiry(value, time)).toBe(time + 21600000);
    expect(privateCardTrust(value, item, time + 21600000)).toBe("Stale");
    expect(privateCardTrust(value, item, time - 1)).toBe("Unknown");
    expect(item.condition).toBe("blocked");
  });

  it("rejects duplicate, malformed, missing or unapproved live cards", () => {
    const duplicate = fixture();
    duplicate.modules.github_work!.cards[0] =
      duplicate.modules.github_work!.cards[1]!;
    expect(() => parsePrivateOwnerSnapshot(duplicate)).toThrow();

    const wrongSource = fixture();
    wrongSource.modules.github_work!.cards[1]!.source.authority_ref = "wrong";
    expect(() => parsePrivateOwnerSnapshot(wrongSource)).toThrow();

    const wrongLink = fixture();
    wrongLink.modules.github_work!.cards[1]!.deep_link =
      "https://example.invalid";
    expect(() => parsePrivateOwnerSnapshot(wrongLink)).toThrow();

    const missing = fixture();
    delete missing.modules.capacity;
    expect(() => parsePrivateOwnerSnapshot(missing)).toThrow();

    const extraLive = fixture();
    extraLive.modules.capacity!.cards[0]!.state = "blocked";
    extraLive.summary.blocked++;
    extraLive.summary.unknown--;
    expect(() => parsePrivateOwnerSnapshot(extraLive)).toThrow();

    const badCount = fixture();
    badCount.summary.unknown = 0;
    expect(() => parsePrivateOwnerSnapshot(badCount)).toThrow();

    expect(() => parsePrivateOwnerSnapshot(null)).toThrow();
  });

  it("requires a fresh network read of the protected JSON and no-store", async () => {
    const fetcher = vi.fn(async () => {
      return new Response(JSON.stringify(fixture()), {
        headers: {
          "content-type": "application/json",
          "cache-control": "private, no-store, max-age=0",
        },
      });
    });
    const signal = new AbortController().signal;
    const value = await loadPrivateOwnerSnapshot(signal, fetcher);
    expect(value.items[0]?.condition).toBe("blocked");
    expect(fetcher).toHaveBeenCalledWith("/owner-snapshot.json", {
      cache: "no-store",
      credentials: "same-origin",
      redirect: "error",
      signal,
    });
  });

  it("rejects Access HTML, denied responses, invalid JSON and cacheable JSON", async () => {
    const signal = new AbortController().signal;
    const cases = [
      new Response("<html>Login</html>", {
        headers: { "content-type": "text/html", "cache-control": "no-store" },
      }),
      new Response(null, { status: 403 }),
      new Response("invalid", {
        headers: {
          "content-type": "application/json",
          "cache-control": "no-store",
        },
      }),
      new Response(JSON.stringify(fixture()), {
        headers: {
          "content-type": "application/json",
          "cache-control": "public, max-age=60",
        },
      }),
    ];
    for (const response of cases) {
      await expect(
        loadPrivateOwnerSnapshot(signal, async () => response),
      ).rejects.toThrow();
    }
  });
});
