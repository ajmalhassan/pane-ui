import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it } from "vitest";
import { TileMotion, FlipArtwork } from "../../components/tiles/TileArtwork";

it("lets the user pause decorative flips without changing the tile action", () => {
  const { container } = render(
    <TileMotion>
      <button aria-label="Open Photos">
        <FlipArtwork front="landscape" back="another landscape" />
      </button>
    </TileMotion>,
  );
  expect(container.querySelector("[data-tile-motion]")).toHaveAttribute(
    "data-paused",
    "false",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Pause tile flips" }),
  );
  expect(container.querySelector("[data-tile-motion]")).toHaveAttribute(
    "data-paused",
    "true",
  );
  expect(screen.getByRole("button", { name: "Open Photos" })).toBeEnabled();
  expect(container.querySelector("[data-flip-artwork]")).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Resume tile flips" }),
  );
  expect(container.querySelector("[data-tile-motion]")).toHaveAttribute(
    "data-paused",
    "false",
  );
});
