const $ = (selector) => document.querySelector(selector);
const clamp = (x, min, max) => Math.min(max, Math.max(min, x));
let time = 4200,
  playing = false,
  last = 0,
  raf = 0;
const tracks = [];
function track(element, keyframes, options) {
  const animation = element.animate(keyframes, { ...options, fill: "both" });
  animation.pause();
  tracks.push(animation);
  return animation;
}
try {
  const response = await fetch(".local/manifest.json");
  if (!response.ok)
    throw new Error(
      "Run prepare.mjs with the supplied recording first. See README.md.",
    );
  const manifest = await response.json();
  // Decode the small reference set before enabling playback; source frame times stay intact.
  const images = await Promise.all(
    manifest.frames.map(async (f) => {
      const image = new Image();
      image.src = `.local/reference-${f.n}.png`;
      await image.decode();
      return { ...f, image };
    }),
  );
  const start = manifest.baseline * 1000;
  const appMarkup =
    '<h3>▧ Office</h3><div class="app-columns"><div class="notes"><span>School supplies</span><span>Notes</span><span>Bills this month</span><span>Colors</span></div><div class="documents"><h4>Documents</h4><p>⊕ New document</p><ul><li>Budget details</li><li>Half yearly sales</li><li>Marketing plan</li><li>Job waiver</li><li>Interview questions</li></ul></div></div>';
  for (const kind of ["existing", "proposed"]) {
    const root = $(`#${kind}`);
    root.classList.add("use-artwork");
    root.querySelector(".app-content").innerHTML = appMarkup;
    manifest.tiles.forEach((tile, i) => {
      const element = document.createElement("div");
      element.className = "tile";
      element.dataset.name = tile.name;
      const x = tile.x / 2,
        y = tile.y / 2;
      Object.assign(element.style, {
        left: `${x - (kind === "existing" ? 13.5 : 0)}px`,
        top: `${y - (kind === "existing" ? 52 : 0)}px`,
        width: `${tile.w / 2}px`,
        height: `${tile.h / 2}px`,
      });
      element.innerHTML = `<img src=".local/tile-${i}.png" alt=""><i>${i + 1}</i><span>${tile.name}</span>`;
      root.querySelector(".tiles").append(element);
      const rank = manifest.tiles.length - 1 - i;
      if (kind === "existing") {
        track(
          element,
          [
            { transform: "none", opacity: 1, transformOrigin: "left center" },
            {
              transform: "perspective(1200px) rotateY(78deg)",
              opacity: 0,
              transformOrigin: "left center",
            },
          ],
          {
            duration: 260,
            delay: rank * 26,
            easing: "cubic-bezier(0.55,0,0.85,0.35)",
          },
        );
      } else {
        // Each tile's local origin resolves to the same viewport-left hinge.
        // The camera is expressed in each plane matrix at one screen-relative origin.
        // This avoids a WebKit ancestor-perspective paint discrepancy.
        element.style.transformOrigin = `${-x}px ${228.5 - y}px`;
        track(
          element,
          [
            {
              transform: "perspective(500px) translateX(0px) rotateY(0deg)",
              opacity: 1,
            },
            {
              transform: "perspective(500px) translateX(-22px) rotateY(-88deg)",
              opacity: 0,
            },
          ],
          {
            duration: 220,
            delay: rank * 33,
            easing: "cubic-bezier(0.42,0,1,1)",
          },
        );
      }
    });
  }
  track(
    $("#existing .tiles"),
    [
      { transform: "none", transformOrigin: "left center" },
      {
        transform: "perspective(1200px) translateX(-8%) rotateY(10deg)",
        transformOrigin: "left center",
      },
    ],
    { duration: 416, easing: "cubic-bezier(0.55,0,0.85,0.35)" },
  );
  // The old phone wraps the entire app in a turnstile; use that entrance as a schematic comparison.
  track(
    $("#existing .app"),
    [
      {
        transform: "perspective(1200px) rotateY(78deg)",
        opacity: 0,
        transformOrigin: "left center",
      },
      { transform: "none", opacity: 1, transformOrigin: "left center" },
    ],
    { duration: 260, delay: 416, easing: "cubic-bezier(0.15,0.7,0.25,1)" },
  );
  // The reference replaces the surface first, then reveals a wider panorama that settles left.
  track(
    $("#proposed .app-content"),
    [
      {
        transform:
          "translateX(0px) perspective(500px) rotateY(-20deg) scale(.82)",
        opacity: 0,
      },
      {
        transform:
          "translateX(-38px) perspective(500px) rotateY(-7deg) scale(.94)",
        opacity: 1,
        offset: 0.35,
      },
      {
        transform:
          "translateX(-116px) perspective(500px) rotateY(0deg) scale(1)",
        opacity: 1,
      },
    ],
    { duration: 475, delay: 450, easing: "cubic-bezier(.15,.55,.25,1)" },
  );
  const notes = [
    [
      4325,
      "Before launch",
      "The top rows are still square. The Me tile also has an ambient flip; that is distinct from navigation.",
    ],
    [
      4492,
      "The wave starts at the bottom right",
      "The lower tiles advance first. Upper tiles remain nearly stationary, so a rigid parent turn alone cannot explain the sequence.",
    ],
    [
      4617,
      "Shared perspective becomes visible",
      "The lower row leans down while the upper row stretches up. Right edges come toward the camera, and all tiles sweep toward a shared left edge.",
    ],
    [
      4742,
      "The last top tiles leave",
      "Phone is last. The captured frames contain blur; this study keeps crisp geometry so the hinge and direction can be inspected.",
    ],
    [
      4783,
      "The app surface is already flat",
      "The whole viewport is light in frames 211–212 before readable app content appears. This is not a white card rotating in from black.",
    ],
    [
      5301,
      "The app content settles",
      "Office content arrives with perspective and a horizontal panorama settle. This entrance is specific to this reference; it should not be forced on every app.",
    ],
  ];
  function render(value) {
    time = clamp(value, 4200, 5300);
    $("#scrub").value = String(time);
    $("#time").value = `${(time / 1000).toFixed(3)} s`;
    const f =
      images.findLast((frame) => frame.seconds * 1000 <= time + 0.001) ??
      images[0];
    if ($("#reference").src !== f.image.src) $("#reference").src = f.image.src;
    $("#frame").textContent =
      `Captured frame ${f.n} · ${f.seconds.toFixed(6)} s · held until next source timestamp`;
    tracks.forEach((animation) => {
      animation.currentTime = time - start;
    });
    $("#existing .app").style.visibility =
      time >= start + 416 ? "visible" : "hidden";
    $("#existing .world").style.visibility =
      time < start + 416 ? "visible" : "hidden";
    $("#proposed .app").style.visibility =
      time >= 4741.667 ? "visible" : "hidden";
    $("#proposed .world").style.visibility =
      time < 4741.667 ? "visible" : "hidden";
    const note = notes.find((n) => time < n[0]) ?? notes.at(-1);
    $("#phase").textContent = note[1];
    $("#observation").textContent = note[2];
  }
  function pause() {
    playing = false;
    cancelAnimationFrame(raf);
    $("#play").textContent = "Play";
  }
  function tick(now) {
    if (!playing) return;
    const dt = now - last;
    last = now;
    render(time + dt * Number($("#speed").value));
    if (time >= 5300) pause();
    else raf = requestAnimationFrame(tick);
  }
  $("#play").onclick = () => {
    if (playing) return pause();
    if (time >= 5300) render(4200);
    playing = true;
    last = performance.now();
    $("#play").textContent = "Pause";
    raf = requestAnimationFrame(tick);
  };
  $("#reset").onclick = () => {
    pause();
    render(4200);
  };
  $("#scrub").oninput = (e) => {
    pause();
    render(Number(e.target.value));
  };
  $("#previous").onclick = () => {
    pause();
    render(
      (images.findLast((f) => f.seconds * 1000 < time - 0.5) ?? images[0])
        .seconds * 1000,
    );
  };
  $("#next").onclick = () => {
    pause();
    render(
      (images.find((f) => f.seconds * 1000 > time + 0.5) ?? images.at(-1))
        .seconds * 1000,
    );
  };
  $("#artwork").onchange = (e) => {
    for (const kind of ["existing", "proposed"]) {
      const root = $(`#${kind}`);
      root.classList.toggle("use-artwork", e.target.checked);
      root.classList.toggle("plain-artwork", !e.target.checked);
    }
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) pause();
  });
  window.study = { seek: render, pause, tracks, frames: manifest.frames };
  render(4200);
} catch (error) {
  $("#error").textContent = error.message;
}
