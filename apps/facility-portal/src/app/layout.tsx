import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { clerkProviderProps, clerkPublishableKey } from "@/lib/clerk-config";
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

function missingClerkKeyPage() {
  return (
    <html lang="en">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-6">
        <div className="max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-lg font-bold text-slate-900">Portal not configured</h1>
          <p className="mt-3 text-sm text-slate-600">
            This deployment was built without{" "}
            <code className="rounded bg-slate-100 px-1">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</code>.
            On Render, link the <strong>sompacare-portal-auth</strong> environment group to this
            service, then redeploy with <strong>Clear build cache</strong>.
          </p>
        </div>
      </body>
    </html>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  if (!clerkPublishableKey()) {
    return missingClerkKeyPage();
  }

  return (
    <ClerkProvider {...clerkProviderProps()}>
      <html lang="en">
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
