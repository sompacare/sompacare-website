import "server-only";

import { getCareersEmail } from "@/lib/contact-server";
import { sendTransactionalEmail, type EmailDeliveryResult } from "@/lib/email/send";
import {
  buildOnboardingStaffNotification,
  buildOnboardingWelcomeEmail,
} from "@/lib/onboarding-email";
import { markOnboardingSent } from "@/lib/supabase/admin";
import type { ApplicationRecord } from "@/lib/supabase/types";

export type OnboardingDeliveryResult = {
  sent: boolean;
  relayed: boolean;
  applicant: EmailDeliveryResult;
  staff: EmailDeliveryResult;
  error?: string;
};

export async function sendApplicantOnboarding(
  application: ApplicationRecord,
): Promise<OnboardingDeliveryResult> {
  const welcome = buildOnboardingWelcomeEmail(application);
  const staffNotice = buildOnboardingStaffNotification(application);
  const careersEmail = getCareersEmail();

  const [applicant, staff] = await Promise.all([
    sendTransactionalEmail({
      to: application.email,
      intendedRecipient: application.email,
      replyTo: careersEmail,
      subject: welcome.subject,
      html: welcome.html,
      text: welcome.text,
      tags: [
        { name: "category", value: "careers" },
        { name: "type", value: "onboarding-welcome" },
      ],
    }),
    sendTransactionalEmail({
      to: careersEmail,
      intendedRecipient: careersEmail,
      replyTo: application.email,
      subject: staffNotice.subject,
      html: staffNotice.html,
      text: staffNotice.text,
      tags: [
        { name: "category", value: "careers" },
        { name: "type", value: "onboarding-staff" },
      ],
    }),
  ]);

  const sent = applicant.ok;

  if (sent) {
    try {
      await markOnboardingSent(application.id);
    } catch (error) {
      console.error("Unable to record onboarding_sent_at:", error);
    }
  }

  return {
    sent,
    relayed: Boolean(applicant.relayed || staff.relayed),
    applicant,
    staff,
    error: sent ? undefined : applicant.error ?? staff.error,
  };
}
