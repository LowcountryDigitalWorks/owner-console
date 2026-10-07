import { useEffect, useMemo, useRef, useState } from "react";
import {
  fixturesForScenario,
  scenarioProfiles,
  type ScenarioId,
} from "./data/scenarios";
import {
  browseItems,
  businessPulseState,
  hasMoreFx19Exceptions,
  HOME_OWNER_LIMIT,
  ownerItemCountLabel,
  visibleHomeOwnerItems,
  visibleFx19Exceptions,
} from "./lib/contracts";
import type { DestinationId, FixtureItem, TrustState } from "./lib/types";
import "./styles.css";

const destinations: {
  id: DestinationId;
  label: string;
  group: "primary" | "browse";
}[] = [
  { id: "home", label: "Home", group: "primary" },
  { id: "today", label: "Today", group: "primary" },
  { id: "more", label: "More", group: "primary" },
  { id: "clients", label: "Clients", group: "browse" },
  { id: "gm", label: "GM", group: "browse" },
  { id: "systems", label: "Systems", group: "browse" },
  { id: "finance", label: "Finance", group: "browse" },
  { id: "growth", label: "Growth", group: "browse" },
  { id: "security", label: "Security", group: "browse" },
];

const trustNames: Record<TrustState, string> = {
  Fresh: "Fresh",
  Stale: "Stale",
  Unknown: "Unknown",
  Unavailable: "Unavailable",
  Partial: "Partial",
};

function routeFromHash(): string {
  return window.location.hash.replace(/^#\/?/, "") || "home";
}

function TrustLabel({ state }: { state: TrustState }) {
  return (
    <span className={`trust trust-${state.toLowerCase()}`}>
      {trustNames[state]}
    </span>
  );
}

function SourceLine({ item }: { item: FixtureItem }) {
  return (
    <p className="source-line">
      <span>{item.source}</span>
      <span aria-hidden="true">·</span>
      <time dateTime={item.observedAt}>
        {new Date(item.observedAt).toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
        })}
      </time>
      <TrustLabel state={item.trust} />
    </p>
  );
}

function FixtureLink({
  item,
  children,
}: {
  item: FixtureItem;
  children?: React.ReactNode;
}) {
  const target = item.packet
    ? `#packet/${item.id}`
    : `#${destinationFor(item.area)}`;
  return (
    <a
      className="item-link"
      href={target}
      aria-label={`${item.title}${item.packet ? ", open owner packet" : ", browse details"}`}
    >
      {children ?? "View details"}
    </a>
  );
}

function destinationFor(area: FixtureItem["area"]): DestinationId {
  if (
    [
      "Agenda",
      "People",
      "Deliverables",
      "Reports",
      "Communications",
      "Marketing",
    ].includes(area)
  )
    return "today";
  if (area === "Clients") return "clients";
  if (area === "Finance") return "finance";
  if (area === "Growth") return "growth";
  if (area === "Security") return "security";
  if (area === "Systems" || area === "Web / Services") return "systems";
  return "gm";
}

function FixtureRow({
  item,
  compact = false,
}: {
  item: FixtureItem;
  compact?: boolean;
}) {
  return (
    <article className={`fixture-row${compact ? " fixture-compact" : ""}`}>
      <div className="row-heading">
        <div>
          <p className="eyebrow">
            {item.area}
            {item.provider ? ` · ${item.provider}` : ""}
          </p>
          <h3>{item.title}</h3>
        </div>
        <TrustLabel state={item.trust} />
      </div>
      <p>{item.summary}</p>
      {item.commitment && <p className="commitment">{item.commitment}</p>}
      <SourceLine item={item} />
      <FixtureLink item={item} />
    </article>
  );
}

function PacketDetail({
  item,
  onCopy,
  backHref,
}: {
  item: FixtureItem;
  onCopy: (value: string) => void;
  backHref: string;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => headingRef.current?.focus(), []);
  const packet = item.packet;
  return (
    <div className="page-width detail-page">
      <a className="back-link" href={backHref}>
        ← Back
      </a>
      <p className="eyebrow">
        Owner action packet · {packet?.category ?? item.area}
      </p>
      <h1 ref={headingRef} tabIndex={-1}>
        {item.title}
      </h1>
      <div className="detail-meta">
        <TrustLabel state={item.trust} />
        <span>{item.source}</span>
        <time dateTime={item.observedAt}>
          {new Date(item.observedAt).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
          })}
        </time>
      </div>
      <p className="detail-intro">{item.summary}</p>
      {packet ? (
        <div className="packet-grid">
          <section className="panel packet-primary">
            <h2>Owner decision</h2>
            <dl className="packet-fields">
              <dt>Why Eddie is required</dt>
              <dd>{packet.whyOwnerRequired}</dd>
              <dt>One question or action</dt>
              <dd>{packet.questionOrAction}</dd>
              <dt>Current state</dt>
              <dd>{packet.currentState}</dd>
              <dt>Proposed state</dt>
              <dd>{packet.proposedState}</dd>
              <dt>Recommended approach</dt>
              <dd>{packet.recommendation}</dd>
              <dt>Why this approach</dt>
              <dd>{packet.rationale}</dd>
            </dl>
          </section>
          <section className="panel">
            <h2>Tradeoffs and risk</h2>
            <ul>
              {packet.tradeoffs.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ul>
            <p>
              <strong>Risk:</strong> {packet.risk}
            </p>
            <p>
              <strong>Reversibility:</strong> {packet.reversibility}
            </p>
            <p>
              <strong>Alternatives:</strong> {packet.alternatives.join(" · ")}
            </p>
          </section>
          <section className="panel">
            <h2>Steps and validation</h2>
            <ol>
              {packet.steps.map((value) => (
                <li key={value}>{value}</li>
              ))}
            </ol>
            <p>
              <strong>Expected result:</strong> {packet.expectedResult}
            </p>
            <p>
              <strong>Recheck:</strong> {packet.validation}
            </p>
          </section>
          <section className="panel">
            <h2>Cost and recovery</h2>
            <p>
              <strong>Cost / ceiling:</strong> {packet.costCeiling}
            </p>
            <p>
              <strong>Rollback / recovery:</strong> {packet.rollback}
            </p>
            <p>
              <strong>Safe while waiting:</strong> {packet.safeWhileWaiting}
            </p>
          </section>
          <section className="panel packet-evidence">
            <h2>Authority and evidence</h2>
            <p>
              <a
                href={packet.authoritativeLink}
                target="_blank"
                rel="noreferrer"
              >
                Open synthetic authoritative reference{" "}
                <span aria-hidden="true">↗</span>
              </a>
            </p>
            {packet.copyValue && (
              <p className="copy-row">
                <code>{packet.copyValue}</code>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => onCopy(packet.copyValue!)}
                >
                  Copy synthetic value
                </button>
              </p>
            )}
            {(item.evidence ?? []).map((evidence) => (
              <div className="evidence-row" key={evidence.label}>
                <strong>{evidence.label}</strong>
                <p>{evidence.detail}</p>
                <p className="source-line">
                  {evidence.source} · {evidence.observedAt} ·{" "}
                  <TrustLabel state={evidence.trust} />
                </p>
              </div>
            ))}
            {item.evidence?.length === 0 && (
              <p>
                Evidence: synthetic scenario record · Source: {item.source} ·
                Observed: {item.observedAt}
              </p>
            )}
          </section>
        </div>
      ) : (
        <section className="panel">
          <h2>Current state</h2>
          <p>{item.summary}</p>
          <SourceLine item={item} />
        </section>
      )}
      <p className="prototype-note">
        Prototype only · no production action is available from this screen.
      </p>
    </div>
  );
}

function Home({
  items,
  onFxToggle,
  onOwnerToggle,
  showAllOwner,
  showAllFx,
}: {
  items: FixtureItem[];
  onFxToggle: () => void;
  onOwnerToggle: () => void;
  showAllOwner: boolean;
  showAllFx: boolean;
}) {
  const allOwnerItems = visibleHomeOwnerItems(items, true);
  const ownerItems = visibleHomeOwnerItems(items, showAllOwner);
  const nextCommitment = items.find(
    (item) => item.commitment && item.id !== "external-busy",
  );
  const pulseAreas: FixtureItem["area"][] = [
    "Clients",
    "Finance",
    "Web / Services",
    "Security",
    "Growth",
    "GM",
  ];
  return (
    <div className="page-width home-page">
      <header className="welcome-row">
        <div>
          <p className="eyebrow">Wednesday · October 7, 2026</p>
          <h1>Good morning, Eddie.</h1>
          <p className="muted">
            A clear view of what needs you and what comes next.
          </p>
        </div>
        <span className="prototype-pill">Fixture preview</span>
      </header>
      <section className="section-block" aria-labelledby="now-heading">
        <div className="section-title">
          <div>
            <p className="eyebrow">Priority</p>
            <h2 id="now-heading">NOW</h2>
          </div>
          <span className="section-hint">
            {ownerItemCountLabel(allOwnerItems.length)}
          </span>
        </div>
        {ownerItems.length === 0 ? (
          <div className="calm-card">
            <span className="calm-dot" aria-hidden="true">
              ✓
            </span>
            <div>
              <h3>No owner action required</h3>
              <p>
                The owner queue is clear. Your next meaningful commitment is
                ready below.
              </p>
            </div>
          </div>
        ) : (
          <div className="owner-list">
            {ownerItems.map((item) => (
              <article className="owner-card" key={item.id}>
                <div className="owner-card-top">
                  <span className="owner-tag">Needs Eddie</span>
                  <TrustLabel state={item.trust} />
                </div>
                <h3>{item.title}</h3>
                <p>{item.nextStep ?? item.summary}</p>
                {item.id === "fx-19" && (
                  <div
                    className="exception-list"
                    aria-label="FX-19 exception summaries"
                  >
                    {visibleFx19Exceptions(item, showAllFx).map(
                      (label, index) => (
                        <div className="exception-line" key={label}>
                          <span className="exception-index">{index + 1}</span>
                          <span>{label}</span>
                        </div>
                      ),
                    )}
                    {hasMoreFx19Exceptions(item) && (
                      <button
                        className="text-button"
                        type="button"
                        onClick={onFxToggle}
                      >
                        {showAllFx ? "Show first 3" : "View all 5"}
                      </button>
                    )}
                  </div>
                )}
                <SourceLine item={item} />
                <a className="primary-link" href={`#packet/${item.id}`}>
                  Review recommendation <span aria-hidden="true">→</span>
                </a>
              </article>
            ))}
            {!showAllOwner && allOwnerItems.length > HOME_OWNER_LIMIT && (
              <button
                className="text-button owner-more"
                type="button"
                onClick={onOwnerToggle}
              >
                View all {allOwnerItems.length} owner items
              </button>
            )}
            {showAllOwner && (
              <button
                className="text-button owner-more"
                type="button"
                onClick={onOwnerToggle}
              >
                Show fewer owner items
              </button>
            )}
          </div>
        )}
      </section>
      {nextCommitment && (
        <section className="next-commitment panel">
          <div>
            <p className="eyebrow">NEXT COMMITMENT</p>
            <h2>{nextCommitment.title}</h2>
            <p>
              {nextCommitment.commitment} · {nextCommitment.summary}
            </p>
          </div>
          <FixtureLink item={nextCommitment} />{" "}
        </section>
      )}
      <section className="section-block" aria-labelledby="today-glance-heading">
        <div className="section-title">
          <div>
            <p className="eyebrow">Owner day</p>
            <h2 id="today-glance-heading">TODAY</h2>
          </div>
          <a href="#today" className="section-hint">
            Open Today →
          </a>
        </div>
        <div className="today-glance">
          {[
            "Agenda",
            "People",
            "Deliverables",
            "Reports",
            "Communications",
            "Marketing",
          ].map((area) => {
            const matching = items.filter((item) => item.area === area);
            const first = matching[0];
            return (
              <a className="glance-row" href="#today" key={area}>
                <span>{area}</span>
                <strong>
                  {first
                    ? `${first.title}${first.trust === "Fresh" ? "" : ` · ${first.trust}`}`
                    : "No new update"}
                </strong>
                <span aria-hidden="true">→</span>
              </a>
            );
          })}
        </div>
      </section>
      <section className="section-block" aria-labelledby="pulse-heading">
        <div className="section-title">
          <div>
            <p className="eyebrow">Calm awareness</p>
            <h2 id="pulse-heading">BUSINESS PULSE</h2>
          </div>
          <span className="section-hint">Current state at a glance</span>
        </div>
        <div className="pulse-grid">
          {pulseAreas.map((area) => (
            <article className="pulse-row" key={area}>
              <h3>{area}</h3>
              <p>{businessPulseState(items, area)}</p>
            </article>
          ))}
        </div>
      </section>
      <p className="data-boundary">
        Synthetic items only · No live accounts, business records, or provider
        data are connected.
      </p>
    </div>
  );
}

function Today({ items }: { items: FixtureItem[] }) {
  const areas: FixtureItem["area"][] = [
    "Agenda",
    "People",
    "Deliverables",
    "Reports",
    "Communications",
    "Marketing",
  ];
  const labels: Record<string, string> = { People: "People to Contact" };
  const active = items.filter((item) => areas.includes(item.area));
  return (
    <div className="page-width">
      <header className="page-heading">
        <p className="eyebrow">Wednesday · October 7, 2026</p>
        <h1>Today</h1>
        <p className="muted">
          Your LDW day, with external availability shown as busy time only.
        </p>
      </header>
      <div className="today-layout">
        <section className="today-main" aria-labelledby="agenda-heading">
          <div className="section-title">
            <h2 id="agenda-heading">Agenda</h2>
            <span className="section-hint">Local owner view</span>
          </div>
          <div className="agenda-list">
            {active
              .filter((item) => item.area === "Agenda")
              .map((item) => (
                <FixtureRow item={item} key={item.id} />
              ))}
            {!active.some((item) => item.area === "Agenda") && (
              <p className="empty-row">No current agenda update.</p>
            )}
          </div>
          {areas.slice(1).map((area) => {
            const entries = active.filter((item) => item.area === area);
            return (
              <section className="today-group" key={area}>
                <div className="section-title">
                  <h2>{labels[area] ?? area}</h2>
                  <span className="section-hint">
                    {entries.length
                      ? `${entries.length} update${entries.length === 1 ? "" : "s"}`
                      : "Clear"}
                  </span>
                </div>
                {entries.length ? (
                  entries.map((item) => (
                    <FixtureRow item={item} key={item.id} compact />
                  ))
                ) : (
                  <p className="empty-row">No current update.</p>
                )}
              </section>
            );
          })}
        </section>
        <aside className="today-aside">
          <section className="panel">
            <p className="eyebrow">Day shape</p>
            <h2>One clear next step</h2>
            <p>
              Meeting preparation and external busy time are shown only when
              included in the active synthetic profile.
            </p>
            <a href="#home">Return Home →</a>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Browse({
  destination,
  items,
}: {
  destination: DestinationId;
  items: FixtureItem[];
}) {
  if (destination === "more")
    return (
      <div className="page-width">
        <header className="page-heading">
          <p className="eyebrow">Explore</p>
          <h1>More</h1>
          <p className="muted">
            Detailed views start here. Browse only when you need the context.
          </p>
        </header>
        <div className="browse-grid">
          {destinations
            .filter((entry) => entry.group === "browse")
            .map((entry) => (
              <a className="browse-card" href={`#${entry.id}`} key={entry.id}>
                <span className="browse-label">Browse</span>
                <h2>{entry.label}</h2>
                <p>
                  {entry.id === "clients"
                    ? "Provider-neutral client operations summaries."
                    : `Open the ${entry.label} detail view.`}
                </p>
                <span>Explore →</span>
              </a>
            ))}
        </div>
        <section className="panel browse-note">
          <h2>Fixture coverage</h2>
          <p>
            All synthetic scenarios are available in their relevant view.
            Routine PR / CI recovery stays suppressed, and generic quick-action
            metadata remains Browse.
          </p>
        </section>
      </div>
    );
  const areaFor: Partial<Record<DestinationId, FixtureItem["area"][]>> = {
    clients: ["Clients"],
    gm: ["GM"],
    systems: ["Systems", "Web / Services"],
    finance: ["Finance"],
    growth: ["Growth", "Marketing"],
    security: ["Security"],
  };
  const browseRows = browseItems(items).filter((item) =>
    areaFor[destination]?.includes(item.area),
  );
  const title =
    destinations.find((entry) => entry.id === destination)?.label ?? "Browse";
  return (
    <div className="page-width">
      <header className="page-heading">
        <a className="back-link" href="#more">
          ← Back to More
        </a>
        <p className="eyebrow">Browse</p>
        <h1>{title}</h1>
        <p className="muted">
          A focused read of synthetic state, provenance, and freshness.
        </p>
      </header>
      <div className="browse-list">
        {destination === "finance" &&
          items.some(
            (item) => item.area === "Finance" && item.escalation !== "none",
          ) && (
            <section className="panel">
              <h2>Owner item shown above</h2>
              <p>
                Finance exceptions stay in the primary Needs Eddie queue so one
                decision has one actionable presentation.
              </p>
            </section>
          )}
        {browseRows.map((item) => (
          <FixtureRow item={item} key={item.id} />
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [route, setRoute] = useState(routeFromHash);
  const [scenario, setScenario] = useState<ScenarioId>("calm");
  const activeFixtures = useMemo(
    () => fixturesForScenario(scenario),
    [scenario],
  );
  const [showAllFx, setShowAllFx] = useState(false);
  const [showAllOwner, setShowAllOwner] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    try {
      return localStorage.getItem("owner-console-theme") === "light"
        ? "light"
        : "dark";
    } catch {
      return "dark";
    }
  });
  const lastFocus = useRef<string | null>(null);
  const returnRoute = useRef("home");
  const item = useMemo(
    () =>
      route.startsWith("packet/")
        ? activeFixtures.find((entry) => entry.id === route.slice(7))
        : undefined,
    [route, activeFixtures],
  );
  const activeDestination = destinations.find(
    (entry) => entry.id === route,
  )?.id;

  useEffect(() => {
    const sync = () => setRoute(routeFromHash());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);
  useEffect(() => {
    if (item) document.querySelector<HTMLElement>(".detail-page h1")?.focus();
    else if (lastFocus.current && route === returnRoute.current) {
      document
        .querySelector<HTMLElement>(`a[href="${lastFocus.current}"]`)
        ?.focus();
      lastFocus.current = null;
    } else document.querySelector<HTMLElement>("main h1")?.focus();
  }, [route, item]);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try {
      localStorage.setItem("owner-console-theme", theme);
    } catch {
      /* Theme remains usable without storage. */
    }
  }, [theme]);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && item) {
        window.location.hash = `#${returnRoute.current}`;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item]);

  const toggleTheme = () =>
    setTheme((value) => (value === "dark" ? "light" : "dark"));
  const scenarioPicker = (
    <label className="scenario-picker">
      <span>Prototype scenario</span>
      <select
        value={scenario}
        onChange={(event) => {
          setScenario(event.target.value as ScenarioId);
          setShowAllOwner(false);
          setShowAllFx(false);
          window.location.hash = "#home";
        }}
      >
        {scenarioProfiles.map((profile) => (
          <option key={profile.id} value={profile.id}>
            {profile.label}
          </option>
        ))}
      </select>
    </label>
  );
  const copySynthetic = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      /* Non-secret fixture value remains visible for manual copying. */
    }
  };
  const nav = (
    <nav aria-label="Primary navigation" className="primary-nav">
      {destinations
        .filter((entry) => entry.group === "primary")
        .map((entry) => (
          <a
            className={activeDestination === entry.id ? "active" : ""}
            aria-current={activeDestination === entry.id ? "page" : undefined}
            href={`#${entry.id}`}
            key={entry.id}
          >
            {entry.label}
          </a>
        ))}
    </nav>
  );

  return (
    <div
      className="app-shell"
      onClick={(event) => {
        const link = (event.target as HTMLElement).closest<HTMLAnchorElement>(
          'a[href^="#packet/"]',
        );
        if (link) {
          lastFocus.current = link.getAttribute("href");
          returnRoute.current = route;
        }
      }}
    >
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <aside className="desktop-rail">
        <a href="#home" className="brand-lockup">
          <span className="brand-mark" aria-hidden="true">
            L
          </span>
          <span>
            <strong>Lowcountry</strong>
            <small>Digital Works</small>
          </span>
        </a>
        {nav}
        <div className="rail-foot">
          <span className="rail-status">
            <span aria-hidden="true">●</span> Fixture preview
          </span>
          {scenarioPicker}
          <button
            type="button"
            className="theme-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☼" : "◐"}
            <span>{theme === "dark" ? "Light mode" : "Dark mode"}</span>
          </button>
        </div>
      </aside>
      <div className="app-main">
        <header className="mobile-header">
          <a href="#home" className="mobile-brand">
            <span className="brand-mark" aria-hidden="true">
              L
            </span>
            <span>Owner Console</span>
          </a>
          <button
            type="button"
            className="theme-button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? "☼" : "◐"}
            <span>{theme === "dark" ? "Light" : "Dark"}</span>
          </button>
        </header>
        <div className="mobile-scenario">{scenarioPicker}</div>
        <main id="main-content" tabIndex={-1}>
          {item ? (
            <PacketDetail
              item={item}
              onCopy={(value) => void copySynthetic(value)}
              backHref={`#${returnRoute.current}`}
            />
          ) : route === "home" ? (
            <Home
              items={activeFixtures}
              onFxToggle={() => setShowAllFx((value) => !value)}
              onOwnerToggle={() => setShowAllOwner((value) => !value)}
              showAllOwner={showAllOwner}
              showAllFx={showAllFx}
            />
          ) : route === "today" ? (
            <Today items={activeFixtures} />
          ) : (
            <Browse
              destination={activeDestination ?? "more"}
              items={activeFixtures}
            />
          )}
          <div className="sr-only" role="status" aria-live="polite">
            {theme === "dark" ? "Dark" : "Light"} appearance selected.
          </div>
        </main>
        <footer className="site-footer">
          <span>Owner Console · Release 0.1</span>
          <span>Synthetic fixtures · No live actions</span>
        </footer>
      </div>
      <div className="mobile-bottom-nav">
        {nav}
        <span className="safe-area-spacer" aria-hidden="true" />
      </div>
    </div>
  );
}
