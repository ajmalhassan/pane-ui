import Image from "next/image";
import { Fragment, type ReactNode } from "react";
import {
  MetroIcon,
  MetroTile,
  TileGrid,
  tileTextClass,
} from "@/components/metro";
import { profile, type ProfileClaim } from "@/content/profile";
import styles from "./PortfolioPanorama.module.css";

const { start } = profile;

/**
 * The capability graph's own shape, drawn once and never animated: three
 * corpora feed one model, and the model feeds assessment and placement. The
 * current node is the only lit one -- the Start screen's single moving graphic
 * is the assessment waveform, so this stays a state, not an animation.
 *
 * It is rendered after the copy so that below 48rem it can be the flex item
 * that takes whatever height the title and body leave: on a 320px frame the
 * hero is 141px tall and a lit cyan ring drawn across the whole of it lands on
 * a word. `meet` rather than `slice` because that band is far wider than the
 * viewBox is -- at the hero's own 2:1 proportion the two are indistinguishable.
 */
function GraphMotif(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className={styles.graphMotif}
      focusable="false"
      preserveAspectRatio="xMidYMid meet"
      viewBox="0 0 240 120"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className={styles.graphTrace}>
        <path d="M24 24 120 60M24 60h96M24 96 120 60M120 60 216 36M120 60 216 84" />
        <circle cx="24" cy="24" r="4" />
        <circle cx="24" cy="60" r="4" />
        <circle cx="24" cy="96" r="4" />
        <circle cx="216" cy="36" r="4" />
        <circle cx="216" cy="84" r="4" />
      </g>
      <circle className={styles.graphNode} cx="120" cy="60" r="7" />
    </svg>
  );
}

/**
 * Two periods of a low-amplitude wave, the second one parked off the right edge
 * so a shift of exactly one viewBox width loops seamlessly. The shift itself is
 * driven from the tile root (`--wave-shift`), because the claim under it is
 * replaced every six seconds and an animation declared in here would restart
 * with it.
 *
 * Its height is the band the claim leaves (`--wave-band`), so the wave never
 * crosses a claim that has wrapped to two lines.
 */
function Waveform(): ReactNode {
  return (
    <svg
      aria-hidden="true"
      className={styles.wave}
      focusable="false"
      preserveAspectRatio="none"
      viewBox="0 0 120 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g className={styles.waveDrift}>
        <path d="M0 12q15-5 30 0t30 0t30 0t30 0" />
        <path d="M120 12q15-5 30 0t30 0t30 0t30 0" />
      </g>
    </svg>
  );
}

/**
 * A live tile's faces. Each claim stands alone on the face; its note is the
 * line the tile grows into once it is tall enough to hold one.
 */
function claimFaces(
  claims: readonly ProfileClaim[],
  motif?: ReactNode,
): ReactNode[] {
  return claims.map(({ claim, note }) => (
    // A fragment, so the face adds no box of its own: the motif's containing
    // block stays the tile's own content region. The motif follows the copy,
    // which is both its paint order and its place on the tile -- it occupies
    // the band under the claim, never the claim's own lines.
    <Fragment key={claim}>
      <span className={styles.tileCopy}>
        <span className={tileTextClass.title}>{claim}</span>
        <span className={styles.tileNote}>{note}</span>
      </span>
      {motif}
    </Fragment>
  ));
}

/**
 * Me as a personal Start screen. The order is the reading order: current work
 * first, then who is making it and the evidence beside them, then the shipped
 * AI work, then craft, the Lumia that started it, and the way the team is led.
 *
 * It is also the packing order. The grid places tiles in DOM order without
 * dense flow, so the sizes below fill 24 units exactly -- six complete rows of
 * four on a phone, three complete rows of eight on a wide canvas -- with no
 * hole in either.
 *
 * The four-column phone grid is what forces the hero to lead, not the
 * eight-column one: at eight columns a 2x2 portrait ahead of the 4x2 hero
 * packs into the same three rows (large@r1c1, hero@r1c3, wide@r1c7,
 * wide@r2c7, ...), measured identical in height. At four columns it does not
 * -- portrait-then-hero costs a seventh row and opens a 2x2 interior hole at
 * r1-2 c3-4 -- and the one portrait-first order that is optimal at four
 * columns costs an extra row at eight. Hero-first is the only tested order
 * that is optimal at both counts.
 *
 * Résumé and contact are app-bar commands and are deliberately absent here.
 */
export function ProfileTiles(): ReactNode {
  return (
    <TileGrid>
      <MetroTile
        accent="blue"
        label={start.capabilityGraph.label}
        role="display"
        size="hero"
      >
        <span className={styles.tileCopy}>
          <strong className={tileTextClass.title}>
            {start.capabilityGraph.title}
          </strong>
          <span className={tileTextClass.body}>
            {start.capabilityGraph.note}
          </span>
        </span>
        <GraphMotif />
      </MetroTile>

      <MetroTile
        accent="photo"
        label={start.portrait.label}
        /* The image is the tile, so it belongs in the media slot rather than in
           the content region: against `.content` it was inset by the tile's ink
           padding on three sides and by the caption band on the fourth, which
           is a framed photo, not a Windows Phone picture tile. */
        media={
          <>
            <Image
              alt={start.portrait.alt}
              className={styles.portrait}
              height={512}
              priority
              sizes="(min-width: 48rem) 25vw, 50vw"
              src={start.portrait.src}
              width={512}
            />
            {/* Monochrome under a cyan blend: the restrained treatment, one asset. */}
            <span aria-hidden="true" className={styles.portraitWash} />
          </>
        }
        role="display"
        size="large"
      />

      <MetroTile
        accent="cyan"
        accessibleLabel={start.evidence.summary}
        className={styles.unitTile}
        items={claimFaces(start.evidence.claims)}
        label={start.evidence.label}
        role="live"
        size="wide"
      />

      <MetroTile
        accent="ink"
        className={styles.unitTile}
        label={start.team.label}
        role="display"
        size="wide"
      >
        <span className={styles.tileCopy}>
          <span className={tileTextClass.value}>{start.team.value}</span>
          <span className={styles.tileNote}>{start.team.note}</span>
        </span>
      </MetroTile>

      <MetroTile
        accent="ink"
        className={styles.unitTile}
        label={start.squads.label}
        role="display"
        size="wide"
      >
        <span className={styles.tileCopy}>
          <span className={tileTextClass.value}>{start.squads.value}</span>
          <span className={styles.tileNote}>{start.squads.note}</span>
        </span>
      </MetroTile>

      <MetroTile
        accent="blue"
        accessibleLabel={start.assessment.summary}
        className={`${styles.unitTile} ${styles.assessmentTile}`}
        items={claimFaces(start.assessment.claims, <Waveform />)}
        label={start.assessment.label}
        role="live"
        size="wide"
      />

      <MetroTile
        accent="ink"
        className={styles.unitTile}
        label={start.craft.label}
        role="display"
        size="small"
      >
        <span className={styles.tileCopy}>
          <span className={styles.motif}>
            <MetroIcon name="arrow-east" />
          </span>
          <span className={styles.tileNote}>{start.craft.equivalent}</span>
        </span>
      </MetroTile>

      <MetroTile
        accent="cyan"
        className={styles.unitTile}
        label={start.lumia.label}
        role="display"
        size="small"
      >
        <span className={styles.tileCopy}>
          <span className={tileTextClass.value}>{start.lumia.value}</span>
          <span className={styles.tileNote}>{start.lumia.note}</span>
        </span>
      </MetroTile>

      <MetroTile
        accent="ink"
        className={styles.unitTile}
        label={start.leadership.label}
        role="display"
        size="wide"
      >
        <span className={styles.tileCopy}>
          <strong className={tileTextClass.title}>
            {start.leadership.title}
          </strong>
          <span className={styles.tileNote}>{start.leadership.note}</span>
        </span>
      </MetroTile>
    </TileGrid>
  );
}
