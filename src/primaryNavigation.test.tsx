/** @vitest-environment jsdom */
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import App from "./App";

describe("Owner Console primary navigation scroll reset", () => {
  let host: HTMLDivElement;
  let root: Root;
  let scrollSpy: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
    window.history.replaceState(null, "", "#home");
    scrollSpy = vi.fn();
    vi.stubGlobal("scrollTo", scrollSpy);
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(<App />);
    });
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    host.remove();
    vi.unstubAllGlobals();
    window.history.replaceState(null, "", "#home");
  });

  function primaryLink(destination: string, placement = "mobile-bottom-nav") {
    const link = host.querySelector<HTMLAnchorElement>(
      `.${placement} .primary-nav a[href="#${destination}"]`,
    );
    if (!link) throw new Error(`Missing ${placement} ${destination} link`);
    return link;
  }

  async function tap(link: HTMLAnchorElement, options: MouseEventInit = {}) {
    await act(async () => {
      link.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          cancelable: true,
          button: 0,
          ...options,
        }),
      );
    });
  }

  const top = { top: 0, left: 0, behavior: "instant" };

  it("returns to top on repeat taps of the active mobile tab", async () => {
    await tap(primaryLink("home"));
    expect(scrollSpy).toHaveBeenLastCalledWith(top);
    await tap(primaryLink("home"));
    expect(scrollSpy).toHaveBeenCalledTimes(2);
  });

  it("returns to top when switching routes and after the new heading renders", async () => {
    await tap(primaryLink("today"));
    expect(scrollSpy).toHaveBeenCalledTimes(1);
    await act(async () => {
      window.location.hash = "#today";
      window.dispatchEvent(new HashChangeEvent("hashchange"));
    });
    expect(host.querySelector("main h1")?.textContent).toBe("Today");
    expect(scrollSpy).toHaveBeenCalledTimes(2);
    expect(scrollSpy).toHaveBeenLastCalledWith(top);

    await tap(primaryLink("today"));
    expect(scrollSpy).toHaveBeenCalledTimes(3);
  });

  it("keeps the desktop rail on the same shared scroll-to-top contract", async () => {
    await tap(primaryLink("more", "desktop-rail"));
    expect(scrollSpy).toHaveBeenLastCalledWith(top);
  });

  it("does not scroll the current page for a modified click", async () => {
    await tap(primaryLink("today"), { ctrlKey: true });
    expect(scrollSpy).not.toHaveBeenCalled();
  });
});
