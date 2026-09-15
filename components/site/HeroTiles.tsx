"use client";
import { Theme, TileGrid, TileLink, RevealTile } from "@windows-phone/react";
import { FlipArtwork, TileMotion } from "../tiles/TileArtwork";
import { Portrait, Landscape } from "../phone/PhoneIcons";
import { Glyph } from "./Glyph";
import styles from "./site.module.css";
export function HeroTiles() {
  return (
    <TileMotion className={styles.heroDisplay}>
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
              {Array.from({ length: 9 }, (_, i) => (
                <FlipArtwork
                  key={i}
                  delay={[0.4, 2.1, 4.4, 1.2, 3.3, 0.8, 4.9, 2.6, 1.8][i]}
                  duration={11 + (i % 3)}
                  front={<Portrait index={i} />}
                  back={<Portrait index={(i + 3) % 6} />}
                />
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
            aria-label="Photos — explore tiles"
            className={`${styles.photoTile} ${styles.wholeFlip}`}
          >
            <FlipArtwork
              delay={0.8}
              front={
                <>
                  <Landscape variant={1} />
                  <span className={styles.flipCaption}>photos</span>
                </>
              }
              back={
                <>
                  <Landscape variant={2} />
                  <span className={styles.flipCaption}>weekend memories</span>
                </>
              }
            />
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
    </TileMotion>
  );
}
