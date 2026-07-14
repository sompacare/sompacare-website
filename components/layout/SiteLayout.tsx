import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/legal/CookieConsent";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="pt-[72px]">{children}</div>
      <Footer />
      <CookieConsent />
    </>
  );
}
