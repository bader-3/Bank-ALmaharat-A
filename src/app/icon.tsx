import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

const NAVY = "#0b1b2b";
const GOLD = "#c49a2c";
const SAGE = "#2d6a4f";

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
            alignItems: "center",
            justifyContent: "center",
            width: 24,
            height: 24,
            borderRadius: 6,
            background: SAGE,
            color: GOLD,
            fontSize: 16,
            fontWeight: 700,
            lineHeight: 1,
          }}
        >
          ب
        </div>
      </div>
    ),
    { ...size },
  );
}
