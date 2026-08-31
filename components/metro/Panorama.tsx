"use client";

import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { PIVOT_IDS, type PivotId } from "@/lib/content/pivots";
import { pivotPanelId, pivotTabId } from "./PivotList";
import styles from "./Panorama.module.css";

type Props = {
  active: PivotId;
  heading: string;
  children: ReactNode;
};

type PanelProps = HTMLAttributes<HTMLElement> & {
  "data-pivot": PivotId;
  "data-active"?: "true" | "false";
  inert?: "";
};

type PanoramaStyle = CSSProperties & {
  "--panorama-index": number;
};

function assertPanels(children: ReactNode) {
  const panels = Children.toArray(children);
  const panelIds = panels.map((panel) => {
    if (!isValidElement<PanelProps>(panel) || panel.type !== "section")
      return undefined;
    return panel.props["data-pivot"];
  });
  const hasEveryPanel = PIVOT_IDS.every(
    (id) => panelIds.filter((panelId) => panelId === id).length === 1,
  );

  if (panels.length !== PIVOT_IDS.length || !hasEveryPanel) {
    throw new Error("Panorama requires exactly one section for each pivot.");
  }
}

export function Panorama({ active, heading, children }: Props) {
  if (process.env.NODE_ENV !== "production") assertPanels(children);

  const activeIndex = PIVOT_IDS.indexOf(active);
  const panoramaStyle: PanoramaStyle = { "--panorama-index": activeIndex };

  return (
    <div className={styles.panorama} style={panoramaStyle}>
      <div aria-hidden="true" className={styles.heading}>
        {heading}
      </div>
      <div className={styles.plane}>
        {Children.map(children, (child) => {
          if (!isValidElement<PanelProps>(child) || child.type !== "section")
            return child;

          const pivot = child.props["data-pivot"];
          const isActive = pivot === active;
          const className = [styles.panel, child.props.className]
            .filter(Boolean)
            .join(" ");

          return cloneElement(child, {
            "aria-hidden": !isActive,
            "aria-labelledby": pivotTabId(pivot),
            "data-active": isActive ? "true" : "false",
            className,
            id: pivotPanelId(pivot),
            inert: isActive ? undefined : "",
            role: "tabpanel",
          });
        })}
      </div>
    </div>
  );
}
