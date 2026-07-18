import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkProviderProps } from "@/lib/clerk-config";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sompacare — Facility Portal",
  description: "Post shifts and manage healthcare staffing",
  icons: {
    icon: "/images/sompacare-logo.png",
    apple: "/images/sompacare-logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider {...clerkProviderProps()}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
