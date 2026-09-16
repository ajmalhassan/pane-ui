import { LiveTile, Pressable, Tile, TileSequence } from "@pane-ui/react";
import { Landscape, PhoneIcon, Portrait, type IconName } from "./PhoneIcons";
import type { Screen } from "./state";
import { FlipArtwork } from "../tiles/TileArtwork";
import s from "./phone.module.css";
export function StartScreen({
  show,
  direction,
  onEntered,
  onExited,
  open,
}: {
  show: boolean;
  direction: "forward" | "backward";
  onEntered: () => void;
  onExited: () => void;
  open: (screen: Screen, trigger?: string) => void;
}) {
  const app = (
    id: Screen,
    label: string,
    icon: IconName,
    size: "small" | "wide" = "small",
    children?: React.ReactNode,
  ) => ({
    id,
    size,
    content: (
      <Pressable
        className={s.tileButton}
        data-phone-focus={`tile-${id}`}
        aria-label={`Open ${label}`}
        onClick={() => open(id, `tile-${id}`)}
      >
        {id === "photos" ? (
          <FlipArtwork
            delay={0.8}
            front={
              <Tile label="Photos" size={size} className={s.tile}>
                <Landscape />
              </Tile>
            }
            back={
              <Tile label="Weekend memories" size={size} className={s.tile}>
                <Landscape variant={2} />
              </Tile>
            }
          />
        ) : (
          <Tile label={label} size={size} className={s.tile}>
            {children ?? <PhoneIcon name={icon} />}
          </Tile>
        )}
      </Pressable>
    ),
  });
  return (
    <div className={s.start}>
      <h2 className={s.srOnly} tabIndex={-1} data-phone-heading>
        Start
      </h2>
      <TileSequence
        show={show}
        mode="layered"
        direction={direction}
        onEntered={onEntered}
        onExited={onExited}
        className={s.tiles}
        items={[
          app(
            "messages",
            "Messaging",
            "messages",
            "small",
            <>
              <PhoneIcon name="messages" />
              <span className={s.tileCount}>2</span>
            </>,
          ),
          app(
            "people",
            "People",
            "people",
            "small",
            <div className={s.faces}>
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <FlipArtwork
                  key={i}
                  delay={[0.2, 2.1, 0.9, 3.6, 1.4, 4.2][i]}
                  duration={10 + (i % 3)}
                  front={<Portrait index={i} />}
                  back={<Portrait index={(i + 3) % 6} />}
                />
              ))}
            </div>,
          ),
          app("photos", "Photos", "photos", "wide", <Landscape />),
          {
            id: "weather",
            size: "wide",
            content: (
              <LiveTile
                className={`${s.tile} ${s.weather}`}
                label="Weather"
                accessibleLabel="Bengaluru. 24 degrees, clear skies."
                items={[
                  <div className={s.weatherContent} key="today">
                    <PhoneIcon name="sun" />
                    <span>
                      24°<small>Bengaluru · clear</small>
                    </span>
                  </div>,
                  <div className={s.weatherContent} key="tomorrow">
                    <span>
                      26°<small>Tomorrow · a little sunshine</small>
                    </span>
                  </div>,
                ]}
              />
            ),
          },
          app("settings", "Settings", "settings"),
          {
            id: "calendar",
            content: (
              <Tile className={`${s.tile} ${s.calendar}`} label="Tuesday">
                <span>15</span>
                <small>September</small>
              </Tile>
            ),
          },
        ]}
      />
      <Pressable
        data-phone-focus="all-apps"
        className={s.allApps}
        onClick={() => open("apps", "all-apps")}
      >
        all apps{" "}
        <span>
          <PhoneIcon name="arrow" />
        </span>
      </Pressable>
    </div>
  );
}
