import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/data";

export const alt = `${siteConfig.name} — Healthcare Staffing, Nurse Staffing Agency & Medical Staffing Agency`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0c1e3d 0%, #084298 50%, #059669 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 16,
              background: "linear-gradient(135deg, #0B5ED7, #059669)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 36,
              color: "white",
              fontWeight: 700,
            }}
          >
            +
          </div>
          <span style={{ fontSize: 48, fontWeight: 700, color: "white" }}>
            {siteConfig.name}
          </span>
        </div>
        <p style={{ fontSize: 36, fontWeight: 600, color: "rgba(255,255,255,0.9)", lineHeight: 1.3, maxWidth: 800 }}>
          Healthcare Staffing & Workforce Solutions You Can Trust
        </p>
        <p style={{ fontSize: 22, color: "rgba(255,255,255,0.6)", marginTop: 24, maxWidth: 700 }}>
          {siteConfig.description.slice(0, 120)}...
        </p>
      </div>
    ),
    { ...size },
  );
}
