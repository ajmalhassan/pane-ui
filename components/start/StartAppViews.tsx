import Link from "next/link";
import Image from "next/image";
import { Switch, Slider, Field } from "@pane-ui/react";
import { PhoneDemo } from "@/components/phone/PhoneDemo";
import { PeopleArtwork } from "./StartArtwork";
import s from "./start.module.css";
export type StartApp = "people" | "components" | "photos" | "phone" | "music";
export const appNames: Record<StartApp, string> = {
  people: "people",
  components: "components",
  photos: "photos",
  phone: "my first phone",
  music: "music",
};
interface Props {
  app: StartApp | null;
  quiet: boolean;
  onQuietChange: (value: boolean) => void;
  volume: number;
  onVolumeChange: (value: number) => void;
}
export function StartAppViews({
  app,
  quiet,
  onQuietChange,
  volume,
  onVolumeChange,
}: Props) {
  return (
    <>
      {app === "people" && (
        <div className={s.peopleApp}>
          <div>
            <h2>
              everyone.
              <br />
              right here.
            </h2>
            <p>
              The People tile is built from nine independent faces, moving
              together and on their own.
            </p>
            <Link href="/docs/live-tile">Build with live tiles →</Link>
          </div>
          <PeopleArtwork />
        </div>
      )}
      {app === "photos" && (
        <div>
          <div className={s.photoAlbum}>
            <figure className={s.footballPhoto}>
              <Image
                src="/images/start/football.png"
                alt="The Windows Phone sample photo: a child in a red shirt kicking a football"
                width={768}
                height={575}
                sizes="(max-width: 600px) 90vw, 55vw"
              />
              <figcaption>kick-off</figcaption>
            </figure>
            <figure className={s.lumiaPhoto}>
              <Image
                src="/images/start/lumia-1020.png"
                alt="The yellow Nokia Lumia 1020 and its black PureView camera"
                width={1274}
                height={1336}
                sizes="(max-width: 600px) 90vw, 35vw"
              />
              <figcaption>41 megapixels.</figcaption>
            </figure>
            <figure className={s.weddingPhoto}>
              <Image
                src="/images/start/wedding.png"
                alt="Rival phone owners at the wedding in the Lumia 920 commercial"
                width={1022}
                height={574}
                sizes="(max-width: 600px) 90vw, 35vw"
              />
              <figcaption>the wedding</figcaption>
            </figure>
          </div>
          <Link className={s.albumDocs} href="/docs/reveal-tile">
            Build with reveal tiles →
          </Link>
        </div>
      )}
      {app === "music" && (
        <div className={s.musicApp}>
          <div
            className={s.musicArt}
            role="img"
            aria-label="Lenka, Everything at Once video artwork"
          />
          <div>
            <span className={s.musicEyebrow}>LENKA</span>
            <h2>
              Everything
              <br />
              at Once
            </h2>
            <a
              className={s.listen}
              href="https://www.youtube.com/watch?v=eE9tV1WGTgE"
              target="_blank"
              rel="noopener noreferrer"
            >
              ▷ Listen on YouTube ↗
            </a>
          </div>
        </div>
      )}
      {app === "phone" && (
        <>
          <div className={s.phoneOrigin}>
            <span>2013 / NOKIA LUMIA 520</span>
            <p>My first smartphone. Cyan shell. A screen full of people.</p>
          </div>
          <PhoneDemo />
        </>
      )}
      {app === "components" && (
        <div className={s.componentSection}>
          <div>
            <h2>A little more you.</h2>
            <p>
              Set quiet hours and adjust the sound. Your settings stay here when
              you return.
            </p>
            <Link href="/docs/fields">Explore the components →</Link>
          </div>
          <div className={s.controls}>
            <Switch
              label="Quiet hours"
              checked={quiet}
              onChange={(e) => onQuietChange(e.target.checked)}
            />
            <Field label="Sound level" description={`${volume}%`}>
              <Slider
                value={volume}
                onChange={(e) => onVolumeChange(Number(e.target.value))}
              />
            </Field>
          </div>
        </div>
      )}
    </>
  );
}
