import "server-only";

import { getCareersEmail } from "@/lib/contact-server";
import { sendTransactionalEmail } from "@/lib/email/send";
import {
  buildOrientationPackageApplicantEmail,
  buildOrientationPackageStaffEmail,
} from "@/lib/orientation-package-email";
import { markOnboardingSent, markOrientationPackageSent } from "@/lib/supabase/admin";
import type { ApplicationRecord } from "@/lib/supabase/types";

export type OrientationPackageResult = {
  sent: boolean;
  relayed: boolean;
  error?: string;
};

export async function sendOrientationPackage(
  application: ApplicationRecord,
): Promise<OrientationPackageResult> {
  const applicantEmail = buildOrientationPackageApplicantEmail(application);
  const staffEmail = buildOrientationPackageStaffEmail(application);
  const careersEmail = getCareersEmail();

  const [applicant, staff] = await Promise.all([
    sendTransactionalEmail({
      to: application.email,
      intendedRecipient: application.email,
      replyTo: careersEmail,
      subject: applicantEmail.subject,
      html: applicantEmail.html,
      text: applicantEmail.text,
      tags: [
        { name: "category", value: "careers" },
        { name: "type", value: "orientation-package" },
      ],
    }),
    sendTransactionalEmail({
      to: careersEmail,
      intendedRecipient: careersEmail,
      replyTo: application.email,
      subject: staffEmail.subject,
      html: staffEmail.html,
      text: staffEmail.text,
      tags: [
        { name: "category", value: "careers" },
        { name: "type", value: "orientation-package-staff" },
      ],
    }),
  ]);

  const sent = applicant.ok;
  if (sent) {
    try {
      await markOrientationPackageSent(application.id);
      if (!application.onboarding_sent_at) {
        await markOnboardingSent(application.id);
      }
    } catch (error) {
      console.error("Unable to record orientation package delivery:", error);
    }
  }

  return {
    sent,
    relayed: Boolean(applicant.relayed || staff.relayed),
    error: sent ? undefined : applicant.error ?? staff.error,
  };
}
