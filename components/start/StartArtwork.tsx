import { FlipArtwork } from "@/components/tiles/TileArtwork";
import s from "./start.module.css";

function Face({ index }: { index: number }) {
  return (
    <span
      className={s.face}
      style={{
        backgroundImage: `url(/images/start/contact-${index}.webp)`,
      }}
    />
  );
}
export function PeopleArtwork() {
  return (
    <div className={s.mosaic}>
      {Array.from({ length: 9 }, (_, i) => (
        <FlipArtwork
          key={i}
          delay={i * 0.63}
          duration={11 + (i % 3)}
          front={<Face index={i} />}
          back={<Face index={(i + 4) % 9} />}
        />
      ))}
    </div>
  );
}
