"use client";

import { useRef, useState } from "react";
import {
  AppBar,
  AppBarAction,
  Panorama,
  Pivot,
  PivotList,
  PivotPanel,
  PivotTrigger,
  Pressable,
  TileSequence,
  Transition,
} from "@windows-phone/react";
import styles from "./navigationWorkshop.module.css";

const discoveries = [
  {
    id: "small",
    title: "a small discovery",
    caption: "notice what others miss",
    symbol: "01",
  },
  {
    id: "pause",
    title: "room to breathe",
    caption: "space is part of the design",
    symbol: "02",
  },
  {
    id: "rhythm",
    title: "find a rhythm",
    caption: "a little movement, a clear purpose",
    symbol: "03",
  },
  {
    id: "light",
    title: "a change of light",
    caption: "a new way to see the familiar",
    symbol: "04",
  },
];

function SequenceJourney() {
  const [showTiles, setShowTiles] = useState(true);
  const [selected, setSelected] = useState("small");
  const [detail, setDetail] = useState<string | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const sourceRefs = useRef(new Map<string, HTMLButtonElement>());
  const titleRef = useRef<HTMLHeadingElement>(null);
  const chosen = discoveries.find((item) => item.id === detail);
  return (
    <div className={styles.sequenceExample}>
      <div className={styles.exampleMeta}>
        <span>03 / TILE SEQUENCE</span>
        <span>A TURN WITHIN A TURN</span>
      </div>
      <div className={styles.sequenceStage}>
        <TileSequence
          data-testid="sequence-demo"
          show={showTiles}
          duration={220}
          interval={35}
          direction={showTiles ? "backward" : "forward"}
          onExited={() => {
            setDetail(selected);
            setShowDetail(true);
          }}
          onEntered={() =>
            sourceRefs.current.get(selected)?.focus({ preventScroll: true })
          }
          items={discoveries.map((item, index) => ({
            id: item.id,
            size: "wide",
            content: (
              <Pressable
                ref={(node) => {
                  if (node) sourceRefs.current.set(item.id, node);
                  else sourceRefs.current.delete(item.id);
                }}
                className={styles.discovery}
                data-tone={index % 2 ? "subtle" : "accent"}
                aria-label={`Open ${item.title}`}
                onClick={() => {
                  setSelected(item.id);
                  setShowTiles(false);
                }}
              >
                <span className={styles.discoveryNumber}>{item.symbol}</span>
                <span className={styles.discoveryTitle}>{item.title}</span>
                <span className={styles.discoveryCaption}>
                  {item.caption}
                  <span aria-hidden="true">↗</span>
                </span>
              </Pressable>
            ),
          }))}
        />
        <Transition
          show={showDetail}
          preset="continuum"
          duration={280}
          onEntered={() => titleRef.current?.focus({ preventScroll: true })}
          onExited={() => {
            setDetail(null);
            setShowTiles(true);
          }}
        >
          {chosen && (
            <div className={styles.detail}>
              <p className={styles.kicker}>DISCOVERY / {chosen.symbol}</p>
              <h4 ref={titleRef} tabIndex={-1}>
                {chosen.title}
              </h4>
              <p>
                {chosen.caption}. A group of tiles turns away, the selected one
                follows, and the reading surface arrives. Returning restores the
                same collection and your place in it.
              </p>
              <AppBar className={styles.returnBar}>
                <AppBarAction
                  label="Back to discoveries"
                  icon={<span aria-hidden="true">←</span>}
                  onClick={() => setShowDetail(false)}
                />
              </AppBar>
            </div>
          )}
        </Transition>
      </div>
      <p className={styles.note}>
        A shared movement, with a turn inside each tile. Open a discovery, then
        return to the collection and your place among it.
      </p>
    </div>
  );
}

export function NavigationWorkshop() {
  return (
    <section
      id="navigation"
      className={styles.section}
      aria-labelledby="navigation-title"
    >
      <div className={styles.heading}>
        <div>
          <p className={styles.kicker}>03 / THE SIGNATURE EXPERIENCE</p>
          <h2 id="navigation-title">
            a sense
            <br />
            of place.
          </h2>
        </div>
        <p>
          Move between related views, travel across a wider canvas, and follow a
          tile into its story. Three components, each with a distinct job.
        </p>
      </div>
      <div className={styles.pivotExample}>
        <div className={styles.exampleMeta}>
          <span>01 / PIVOT</span>
          <span>TRY THE ARROW KEYS</span>
        </div>
        <Pivot defaultValue="signature">
          <PivotList aria-label="Library priorities">
            <PivotTrigger value="signature">signature</PivotTrigger>
            <PivotTrigger value="everyday">everyday</PivotTrigger>
            <PivotTrigger value="composed">composed</PivotTrigger>
          </PivotList>
          <PivotPanel value="signature">
            <div className={styles.pivotContent}>
              <strong>the things you recognize.</strong>
              <p>
                Living tiles, generous headings, spatial navigation, and
                transitions that keep their sense of direction.
              </p>
              <span className={styles.status}>BUILD FIRST / IDENTITY</span>
            </div>
          </PivotPanel>
          <PivotPanel value="everyday">
            <div className={styles.pivotContent}>
              <strong>the things you reach for.</strong>
              <p>
                Buttons, labeled fields, selection controls, and progress.
                Native form behavior comes before styling variants.
              </p>
              <span className={styles.status}>BUILD NEXT / UTILITY</span>
            </div>
          </PivotPanel>
          <PivotPanel value="composed">
            <div className={styles.pivotContent}>
              <strong>the things that work together.</strong>
              <p>
                Dialogs, menus, notifications, and complete application
                patterns. Built on consistent focus, dismissal, and motion.
              </p>
              <span className={styles.status}>BUILD ON / COMPOSITION</span>
            </div>
          </PivotPanel>
        </Pivot>
      </div>
      <div className={styles.panoramaExample}>
        <div className={styles.exampleMeta}>
          <span>02 / PANORAMA</span>
          <span>SWIPE OR DRAG ACROSS</span>
        </div>
        <Panorama
          data-testid="panorama-demo"
          aria-label="A day in motion"
          className={styles.panorama}
          items={[
            {
              id: "today",
              label: "today",
              children: (
                <div className={styles.panoramaCard}>
                  <div>
                    <p className={styles.kicker}>THE DAY IS YOURS</p>
                    <h3>
                      make room
                      <br />
                      for a little wonder.
                    </h3>
                    <p>
                      Related views share a canvas. Move across it with your
                      hand, the headings, or your keyboard.
                    </p>
                    <a href="#start">
                      Build your own <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                  <span className={styles.dayNumber} aria-hidden="true">
                    24<span>hours of possibility</span>
                  </span>
                </div>
              ),
            },
            {
              id: "people",
              label: "people",
              children: (
                <div className={styles.panoramaCard}>
                  <div>
                    <p className={styles.kicker}>GOOD COMPANY</p>
                    <h3>
                      people make
                      <br />
                      the place.
                    </h3>
                    <p>
                      The next view arrives from the same direction as your
                      gesture. There is always a way back.
                    </p>
                    <a href="#start">
                      Bring your content <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                  <div
                    className={styles.people}
                    aria-label="Friends: Alex, Sam, and Jo"
                  >
                    <span>A</span>
                    <span>S</span>
                    <span>J</span>
                  </div>
                </div>
              ),
            },
            {
              id: "places",
              label: "places",
              children: (
                <div className={styles.panoramaCard}>
                  <div>
                    <p className={styles.kicker}>SOMEWHERE NEW</p>
                    <h3>
                      take the
                      <br />
                      scenic route.
                    </h3>
                    <p>
                      A finite journey, with clear edges. Vertical scrolling and
                      zoom still belong to your browser.
                    </p>
                    <a href="#start">
                      Explore the API <span aria-hidden="true">↗</span>
                    </a>
                  </div>
                  <div className={styles.landscape} aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                </div>
              ),
            },
          ]}
        />
        <p className={styles.note}>
          Headings and content move together. Inactive panels stay out of the
          keyboard and accessibility paths.
        </p>
      </div>
      <SequenceJourney />
    </section>
  );
}
