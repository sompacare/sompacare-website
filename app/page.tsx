import { SiteLayout } from "@/components/layout/SiteLayout";
import { AnimatedStatsSection } from "@/components/sections/AnimatedStatsSection";
import { CaseStudiesSection } from "@/components/sections/CaseStudiesSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { ConversionCTASection } from "@/components/sections/ConversionCTASection";
import { FAQSection } from "@/components/sections/FAQSection";
import { HeroSection } from "@/components/sections/HeroSection";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { HRSolutionsSection } from "@/components/sections/HRSolutionsSection";
import { IndustriesSection, WhyChooseSection } from "@/components/sections/WhyChooseSection";
import { MissionVisionSection } from "@/components/sections/MissionVisionSection";
import { HomeCareSection } from "@/components/sections/HomeCareSection";
import { StaffingServicesSection } from "@/components/sections/StaffingServicesSection";
import { SuccessStoriesSection } from "@/components/sections/SuccessStoriesSection";
import { TrustedBySection } from "@/components/sections/TrustedBySection";
import { JsonLd } from "@/components/seo/JsonLd";
import { createMetadata } from "@/lib/seo";
import { homePageSchema } from "@/lib/schema";

export const metadata = createMetadata({
  title: "Healthcare Staffing Agency & Nurse Staffing Nationwide",
  description:
    "Sompacare is a trusted healthcare staffing agency and nurse staffing agency providing RN, LPN, CNA, and travel nurse staffing, medical staffing, in-home care, and healthcare workforce solutions nationwide for hospitals, senior living, and families.",
  path: "/",
  keywords: [
    "Healthcare Staffing Agency",
    "Medical Staffing Agency",
    "Nurse Staffing Agency",
    "Healthcare Staffing",
    "Healthcare Workforce Solutions",
    "RN Staffing",
    "LPN Staffing",
    "CNA Staffing",
    "Travel Nurse Staffing",
    "Hospital Staffing Agency",
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
        <AnimatedStatsSection />
        <HomeCareSection />
        <StaffingServicesSection />
        <IndustriesSection />
        <CaseStudiesSection limit={3} />
        <SuccessStoriesSection />
        <HRSolutionsSection />
        <WhyChooseSection />
        <HowItWorksSection />
        <MissionVisionSection />
        <FAQSection />
        <ConversionCTASection />
        <ContactSection />
      </main>
    </SiteLayout>
  );
}
