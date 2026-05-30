import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512,
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 55%, #f59e0b 100%)",
          color: "#fef3c7",
          display: "flex",
          fontSize: 164,
          fontWeight: 800,
          height: "100%",
          justifyContent: "center",
          letterSpacing: 0,
          width: "100%",
        }}
      >
        B
      </div>
    ),
    size,
  );
}
