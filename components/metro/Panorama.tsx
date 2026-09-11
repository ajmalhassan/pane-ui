import {
  Children,
  cloneElement,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import {
  PIVOT_IDS,
  pivotIndex,
  pivotPanelId,
  pivotTabId,
  type PivotId,
} from "@/lib/content/pivots";
import type { PanoramaMotion } from "./usePanoramaMotion";
import styles from "./Panorama.module.css";

type Props = {
  active: PivotId;
  navigation?: ReactNode;
  motion?: PanoramaMotion;
  children: ReactNode;
};

type PanelProps = HTMLAttributes<HTMLElement> & {
  "data-pivot": PivotId;
  "data-active"?: "true" | "false";
  "data-painted"?: "true" | "false";
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

export function Panorama({ active, navigation, children, motion }: Props) {
  if (process.env.NODE_ENV !== "production") assertPanels(children);

  const panoramaStyle: PanoramaStyle = {
    "--panorama-index": pivotIndex(active),
  };

  return (
    <div
      className={styles.panorama}
      data-panorama
      data-motion-state={motion?.phase ?? "idle"}
      style={panoramaStyle}
    >
      {navigation}
      <div
        className={styles.surface}
        data-panorama-surface
        data-motion-ready={motion?.ready ?? false}
        ref={motion?.surfaceRef}
        {...motion?.handlers}
      >
        <div className={styles.plane}>
          {Children.map(children, (child) => {
            if (!isValidElement<PanelProps>(child) || child.type !== "section")
              return child;

            const pivot = child.props["data-pivot"];
            const isActive = pivot === active;
            const isPainted =
              isActive || (motion?.visualPivots.includes(pivot) ?? false);
            const className = [styles.panel, child.props.className]
              .filter(Boolean)
              .join(" ");
            const panelStyle = isPainted
              ? child.props.style
              : { ...child.props.style, height: 0, overflow: "hidden" };

            return cloneElement(child, {
              "aria-hidden": !isActive,
              "aria-labelledby": pivotTabId(pivot),
              "data-active": isActive ? "true" : "false",
              "data-painted": isPainted ? "true" : "false",
              className,
              id: pivotPanelId(pivot),
              inert: !isActive,
              role: "tabpanel",
              style: panelStyle,
            });
          })}
        </div>
      </div>
    </div>
  );
}
