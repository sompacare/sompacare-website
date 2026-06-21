import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { GlobalSchema } from "@/components/seo/GlobalSchema";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { defaultSiteMetadata } from "@/lib/seo";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = defaultSiteMetadata;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <GlobalSchema />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
