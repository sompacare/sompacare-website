import { SiteLayout } from "@/components/layout/SiteLayout";
import { AnimatedStatsSection } from "@/components/sections/AnimatedStatsSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ConversionCTASection } from "@/components/sections/ConversionCTASection";
import { FAQSection } from "@/components/sections/FAQSection";
import { FastPaySection } from "@/components/sections/FastPaySection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { LocationsSection } from "@/components/sections/LocationsSection";
import { NurseTestimonialsSection } from "@/components/sections/NurseTestimonialsSection";
import { SolutionsHubSection } from "@/components/sections/SolutionsHubSection";
import { StaffingServicesSection } from "@/components/sections/StaffingServicesSection";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { TrustedBySection } from "@/components/sections/TrustedBySection";
import { WhyChooseSection } from "@/components/sections/WhyChooseSection";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { homePageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Healthcare Staffing Agency — CNAs, LPNs & RNs Nationwide",
  description:
    "Sompacare connects CNAs, LPNs, and RNs to per diem, contract, and travel shifts at hospitals and long-term care facilities nationwide. Plus home care and HR workforce solutions.",
  path: "/",
  keywords: [
    "Healthcare Staffing Agency",
    "Nurse Staffing Agency",
    "Per Diem Nursing",
    "CNA Staffing",
    "LPN Staffing",
    "RN Staffing",
    "Travel Nurse Staffing",
    "Healthcare Staffing",
    "In-Home Care Services",
    "Nationwide Healthcare Staffing",
  ],
});

export default function HomePage() {
  return (
    <SiteLayout>
      <JsonLd data={homePageSchema()} />
      <main>
        <HeroSection />
        <TrustedBySection />
        <HowItWorksSection variant="staffing" />
        <StaffingServicesSection />
        <FastPaySection />
        <NurseTestimonialsSection />
        <LocationsSection />
        <SolutionsHubSection />
        <AnimatedStatsSection />
        <TestimonialsSection limit={3} />
        <WhyChooseSection />
        <FAQSection />
        <ConversionCTASection />
        <ContactSection />
      </main>
    </SiteLayout>
  );
}
