import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/data";

export const alt = `${siteConfig.name} — Healthcare Staffing, Nurse Staffing Agency & Medical Staffing Agency`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  const logoUrl = `${siteConfig.url}/images/sompacare-logo.png`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0c1e3d 0%, #084298 50%, #059669 100%)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoUrl}
          alt="Sompacare Solutions"
          width={320}
          height={160}
          style={{
            objectFit: "contain",
          }}
        />
        <p
          style={{
            fontSize: 34,
            fontWeight: 600,
            color: "rgba(255,255,255,0.92)",
            lineHeight: 1.35,
            maxWidth: 820,
            marginTop: 40,
          }}
        >
          Healthcare Staffing, Home Care & Workforce Solutions Nationwide
        </p>
        <p style={{ fontSize: 22, color: "rgba(255,255,255,0.65)", marginTop: 20, maxWidth: 760 }}>
          {siteConfig.description.slice(0, 140)}...
        </p>
      </div>
    ),
    { ...size },
  );
}
