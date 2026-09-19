import { ImageResponse } from "next/og";
export const alt = "Pane UI — Software that feels alive";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          background: "#0b0d0f",
          color: "#f5f5f5",
          padding: 64,
          flexDirection: "column",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 18,
            fontSize: 32,
          }}
        >
          <svg width="42" height="42" viewBox="0 0 25 25" fill="#4ab7f5">
            <path fillRule="evenodd" d="M3 0h20v17H9v8H3V0Zm6 6v5h8V6H9Z" />
          </svg>
          Pane UI
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 76,
              letterSpacing: -4,
              lineHeight: 1.1,
            }}
          >
            <span>Software that</span>
            <span style={{ color: "#64c8ee" }}>feels alive.</span>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <div
              style={{
                display: "flex",
                width: 155,
                height: 240,
                padding: 18,
                background: "#007fa3",
                alignItems: "flex-end",
                fontSize: 23,
              }}
            >
              live tiles
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  width: 115,
                  height: 115,
                  background: "#006dc0",
                  padding: 14,
                  fontSize: 40,
                }}
              >
                24°
              </div>
              <div
                style={{
                  display: "flex",
                  width: 115,
                  height: 115,
                  background: "#923153",
                  padding: 14,
                  fontSize: 40,
                }}
              >
                Aa
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            color: "#b3bdc7",
            fontSize: 22,
          }}
        >
          <span>Tiles. Typography. Motion. Built for React.</span>
          <span>pane.ajmalhassan.com</span>
        </div>
      </div>
    ),
    size,
  );
}
