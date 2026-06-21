import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

export function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <div className="pt-[72px]">{children}</div>
      <Footer />
    </>
  );
}
