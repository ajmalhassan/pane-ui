"use client";
import { Theme, TileGrid, TileLink, RevealTile } from "@windows-phone/react";
import { Glyph } from "./Glyph";
import styles from "./site.module.css";
export function HeroTiles() {
  return (
    <div className={styles.heroDisplay}>
      <div className={styles.displayCaption}>
        <span>START SOMETHING DIFFERENT</span>
        <span>09:41</span>
      </div>
      <Theme mode="dark" accent="blue" className={styles.heroTheme}>
        <TileGrid className={styles.heroTiles}>
          <TileLink
            size="large"
            href="/phone"
            label="people"
            className={styles.peopleTile}
          >
            <div className={styles.peopleMosaic} aria-hidden="true">
              {[
                "#007ca8",
                "#0099b3",
                "#014b77",
                "#355d96",
                "#008995",
                "#2456a2",
                "#007091",
                "#399aa6",
                "#114073",
              ].map((color, i) => (
                <span key={color} style={{ background: color }}>
                  <svg viewBox="0 0 60 60">
                    <circle
                      cx={30 + (i % 3) * 2}
                      cy="22"
                      r="10"
                      fill="white"
                      opacity=".6"
                    />
                    <path
                      d="M10 60V48c0-18 40-18 40 0v12"
                      fill="white"
                      opacity=".6"
                    />
                  </svg>
                </span>
              ))}
            </div>
          </TileLink>
          <TileLink
            size="wide"
            href="/examples/inbox"
            label="mail"
            className={styles.mailTile}
          >
            <div className={styles.tileValue}>
              <Glyph name="mail" size={46} />
              <span>3</span>
            </div>
          </TileLink>
          <RevealTile
            size="wide"
            label="calendar"
            className={styles.calendarTile}
            front={
              <div className={styles.calendar}>
                <span>tuesday</span>
                <strong>18</strong>
              </div>
            }
            back={
              <div className={styles.calendarBack}>
                <strong>
                  Make something
                  <br />
                  worth feeling.
                </strong>
                <span>Your next project starts here.</span>
              </div>
            }
          />
          <TileLink
            size="wide"
            href="/docs/tiles"
            label="photos"
            className={styles.photoTile}
          >
            <div className={styles.landscape} aria-hidden="true">
              <i />
              <b />
              <span />
            </div>
          </TileLink>
          <TileLink
            size="wide"
            href="/docs/tiles"
            label="weather"
            className={styles.weatherTile}
          >
            <div className={styles.tileValue}>
              <Glyph name="sun" size={44} />
              <span>24°</span>
            </div>
          </TileLink>
          <TileLink
            size="small"
            href="/docs"
            label="build"
            className={styles.codeTile}
          >
            <Glyph name="code" size={37} />
          </TileLink>
          <TileLink
            size="small"
            href="/phone"
            label="music"
            className={styles.musicTile}
          >
            <Glyph name="music" size={34} />
          </TileLink>
          <TileLink
            size="wide"
            href="/docs/transition"
            label="motion"
            className={styles.motionTile}
          >
            <div className={styles.motionLines} aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          </TileLink>
        </TileGrid>
      </Theme>
      <div className={styles.displayCaption}>
        <span>REAL COMPONENTS. TRY A TILE.</span>
        <span>REACT 19</span>
      </div>
    </div>
  );
}
