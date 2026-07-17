import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const alt = SITE.name;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const NAVY = "#0b1b2b";
const GOLD = "#c49a2c";
const SAGE = "#2d6a4f";
const CREAM = "#f2eee6";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: `linear-gradient(145deg, ${NAVY} 0%, #152d45 55%, ${SAGE} 140%)`,
          color: CREAM,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 72,
              height: 72,
              borderRadius: 18,
              background: SAGE,
              color: GOLD,
              fontSize: 40,
              fontWeight: 700,
            }}
          >
            ب
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            <div style={{ fontSize: 28, color: GOLD, fontWeight: 600 }}>{SITE.tagline}</div>
            <div style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.1 }}>{SITE.name}</div>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            maxWidth: 900,
            fontSize: 30,
            lineHeight: 1.45,
            color: "rgba(242,238,230,0.88)",
          }}
        >
          {SITE.description}
        </div>
      </div>
    ),
    { ...size },
  );
}
