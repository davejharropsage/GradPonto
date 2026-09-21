"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";

const TABS = [
  { key: "find", label: "Find" },
  { key: "match", label: "Match" },
  { key: "apply", label: "Apply" },
  { key: "track", label: "Track" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/**
 * The Find / Match / Apply / Track switcher. The panel contents are rendered on the server and
 * passed in, so this component only owns which tab is showing. Follows the WAI-ARIA tabs pattern:
 * arrow keys, Home and End move between tabs.
 */
export function FeatureTabs({ panels }: { panels: Record<TabKey, ReactNode> }) {
  const [active, setActive] = useState<TabKey>("find");
  const buttons = useRef<Record<string, HTMLButtonElement | null>>({});

  function select(key: TabKey, focus: boolean) {
    setActive(key);
    if (focus) buttons.current[key]?.focus();
  }

  function onKeyDown(event: KeyboardEvent, index: number) {
    let next: number | null = null;
    if (event.key === "ArrowRight") next = (index + 1) % TABS.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    if (next === null) return;
    event.preventDefault();
    select(TABS[next].key, true);
  }

  return (
    <div className="tabs">
      <div className="tabs__list gp-tabs" role="tablist" aria-label="What GradPonto does">
        {TABS.map((tab, index) => (
          <button
            key={tab.key}
            ref={(element) => {
              buttons.current[tab.key] = element;
            }}
            type="button"
            role="tab"
            id={`tab-${tab.key}`}
            aria-controls={`panel-${tab.key}`}
            aria-selected={active === tab.key}
            tabIndex={active === tab.key ? 0 : -1}
            className="gp-tab"
            onClick={() => select(tab.key, false)}
            onKeyDown={(event) => onKeyDown(event, index)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="tabs__panels gp-panel gp-panel--mint">
        {TABS.map((tab) => (
          <div
            key={tab.key}
            className="tpanel"
            role="tabpanel"
            id={`panel-${tab.key}`}
            aria-labelledby={`tab-${tab.key}`}
            hidden={active !== tab.key}
          >
            {panels[tab.key]}
          </div>
        ))}
      </div>
    </div>
  );
}
