import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const NAVY = "#0b1b2b";
const GOLD = "#c49a2c";
const SAGE = "#2d6a4f";

/** Compact brand mark — geometric only so Satori prerender stays reliable. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: NAVY,
          borderRadius: 8,
        }}
      >
        <div
          style={{
            display: "flex",
            width: 18,
            height: 18,
            borderRadius: 5,
            background: SAGE,
            border: `2px solid ${GOLD}`,
          }}
        />
      </div>
    ),
    { ...size },
  );
}
