import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  loadPrivateOwnerSnapshot,
  nextPrivateExpiry,
  privateCardTrust,
  type PrivateOwnerSnapshot,
} from "./lib/privateOwnerSnapshot";
import "./styles.css";

type ViewState =
  | { kind: "loading" }
  | { kind: "unavailable" }
  | { kind: "ready"; snapshot: PrivateOwnerSnapshot };

/** Explicit private proof mode. Never fall back to a synthetic scenario. */
export default function PrivateSnapshotView() {
  const [state, setState] = useState<ViewState>({ kind: "loading" });
  const [now, setNow] = useState(Date.now);
  const content = useRef<HTMLElement>(null);
  const controls = useRef<{ reload: () => void; conceal: () => void } | null>(
    null,
  );

  useEffect(() => {
    let generation = 0;
    let pending: AbortController | null = null;

    function invalidate(synchronous: boolean) {
      generation++;
      pending?.abort();
      pending = null;
      // Hide immediately before a history/cache capture or sign-out.
      if (content.current) content.current.style.display = "none";
      const clear = () => setState({ kind: "loading" });
      if (synchronous) flushSync(clear);
      else clear();
    }

    function reload() {
      invalidate(false);
      if (document.visibilityState === "hidden") return;
      const run = generation;
      const request = new AbortController();
      pending = request;
      void loadPrivateOwnerSnapshot(request.signal)
        .then((snapshot) => {
          if (run !== generation || request.signal.aborted) return;
          pending = null;
          setNow(Date.now());
          setState({ kind: "ready", snapshot });
        })
        .catch(() => {
          if (run !== generation || request.signal.aborted) return;
          pending = null;
          setState({ kind: "unavailable" });
        });
    }

    const conceal = () => invalidate(true);
    const onVisibility = () => {
      if (document.visibilityState === "hidden") conceal();
      else reload();
    };
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) reload();
    };
    controls.current = { reload, conceal };
    window.addEventListener("pagehide", conceal);
    window.addEventListener("pageshow", onPageShow);
    document.addEventListener("visibilitychange", onVisibility);
    reload();
    return () => {
      generation++;
      pending?.abort();
      controls.current = null;
      window.removeEventListener("pagehide", conceal);
      window.removeEventListener("pageshow", onPageShow);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (state.kind !== "ready") return;
    const expiry = nextPrivateExpiry(state.snapshot, now);
    if (expiry === null) return;
    // Recompute local presentation only; never poll provider data.
    const timer = window.setTimeout(
      () => setNow(Date.now()),
      Math.max(1, expiry - now),
    );
    return () => window.clearTimeout(timer);
  }, [state, now]);

  return (
    <main className="page-width home-page">
      <header className="page-heading">
        <p className="eyebrow">Lowcountry Digital Works</p>
        <h1>Owner Console</h1>
        <p className="muted">Private one-shot snapshot proof · Read only</p>
      </header>
      <section className="panel">
        <h2>Owner attention</h2>
        <p>
          Owner escalation evidence is not connected in this proof. A clear
          owner queue cannot be inferred.
        </p>
        <p>
          <button
            className="secondary-button"
            type="button"
            onClick={() => controls.current?.reload()}
          >
            Re-read protected snapshot
          </button>{" "}
          <a
            href="/cdn-cgi/access/logout"
            onClick={() => controls.current?.conceal()}
          >
            Sign out of Cloudflare Access
          </a>
        </p>
        <p className="muted">
          Access sign-out may also sign you out of other protected applications.
          Re-reading does not regenerate the one-shot source.
        </p>
      </section>
      {state.kind === "loading" && (
        <p role="status">Checking protected snapshot. Current state unknown.</p>
      )}
      {state.kind === "unavailable" && (
        <p role="status">
          Protected snapshot unavailable or invalid. Current state unknown.
          No synthetic or previously loaded data is shown.
        </p>
      )}
      {state.kind === "ready" && (
        <section ref={content} className="section-block">
          <h2>Operational evidence</h2>
          <p>
            Snapshot generated:{" "}
            <time dateTime={state.snapshot.generatedAt}>
              {state.snapshot.generatedAt}
            </time>
          </p>
          {state.snapshot.items.map((item) => {
            const trust = privateCardTrust(state.snapshot, item, now);
            return (
              <article className="fixture-row" key={item.id}>
                <div className="row-heading">
                  <h3>{item.title}</h3>
                  <span className={"trust trust-" + trust.toLowerCase()}>
                    {trust}
                  </span>
                </div>
                <p>
                  {trust === "Fresh"
                    ? "Reported condition: " + item.condition
                    : "Current condition not established"}
                </p>
                <p>
                  {trust === "Fresh"
                    ? item.summary
                    : "Last reported summary: " + item.summary}
                </p>
                <p className="source-line">
                  {item.sourceSystem} · {item.authorityRef} ·{" "}
                  {item.observedAt ? (
                    <time dateTime={item.observedAt}>{item.observedAt}</time>
                  ) : (
                    "Observation time unknown"
                  )}
                </p>
                <p>
                  <a href={item.deepLink} target="_blank" rel="noreferrer">
                    Authoritative source
                  </a>
                </p>
                <details>
                  <summary>Evidence references</summary>
                  <ul>
                    {item.evidenceRefs?.map((ref) => <li key={ref}>{ref}</li>)}
                  </ul>
                </details>
              </article>
            );
          })}
          <p className="muted">
            {state.snapshot.omittedUnknown} other manifest cards remain UNKNOWN
            and are not connected in this proof.
          </p>
        </section>
      )}
      <footer className="site-footer">
        <span>One-shot source · No runtime provider collector</span>
      </footer>
    </main>
  );
}
