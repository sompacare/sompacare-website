import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { buildCareerApplicantEmail, buildCareerStaffEmail } from "@/lib/career-emails";
import {
  getPositionLabel,
  validateCareerFields,
  validateCareerFiles,
} from "@/lib/career-validation";
import { getCareersEmail } from "@/lib/contact-server";
import { sendNotificationPair } from "@/lib/email/send";
import {
  insertApplication,
  isSupabaseConfigured,
  updateApplicationFiles,
  uploadApplicationFile,
} from "@/lib/supabase/admin";
import { ingestCareerApplicationToPlatform } from "@/lib/career-funnel";

export const runtime = "nodejs";

function supabaseErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Unknown Supabase error";
}

function formatApplicationId(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Application service is not configured. Please call us directly to apply." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form submission." }, { status: 400 });
  }

  const fieldValidation = validateCareerFields(formData);
  if (!fieldValidation.success) {
    return NextResponse.json({ errors: fieldValidation.errors }, { status: 400 });
  }

  const fileValidation = validateCareerFiles(formData);
  if (!fileValidation.success) {
    return NextResponse.json({ errors: fileValidation.errors }, { status: 400 });
  }

  const data = fieldValidation.data;
  const { resume, certificationFiles } = fileValidation;
  const applicationId = randomUUID();
  const reference = formatApplicationId(applicationId);

  let resumePath: string | null = null;
  let resumeFileName: string | null = null;
  const certificationUrls: { url: string; fileName: string }[] = [];

  if (isSupabaseConfigured()) {
    try {
      await insertApplication({
        id: applicationId,
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        address_line1: data.addressLine1,
        city: data.city,
        state: data.state,
        zip: data.zip,
        position: data.position,
        position_label: getPositionLabel(data.position),
        license_number: data.licenseNumber,
        license_state: data.licenseState,
        certifications: data.certifications,
        experience: data.experience,
        availability: data.availability,
        additional_notes: data.additionalNotes || null,
        resume_url: null,
        resume_file_name: null,
        certification_urls: [],
      });

      try {
        const resumeUpload = await uploadApplicationFile(resume, "resumes", applicationId);
        resumePath = resumeUpload.path;
        resumeFileName = resumeUpload.fileName;

        for (const file of certificationFiles) {
          const uploaded = await uploadApplicationFile(file, "certifications", applicationId);
          certificationUrls.push({ url: uploaded.path, fileName: uploaded.fileName });
        }

        await updateApplicationFiles(applicationId, {
          resume_url: resumePath,
          resume_file_name: resumeFileName,
          certification_urls: certificationUrls,
        });
      } catch (fileError) {
        console.error("Supabase file upload error:", fileError);
      }
    } catch (error) {
      console.error("Supabase error:", supabaseErrorMessage(error), error);
      const hint = supabaseErrorMessage(error).includes("Bucket not found")
        ? " Create the storage bucket 'application-files' in Supabase."
        : "";
      return NextResponse.json(
        {
          error: `Unable to save your application.${hint} Please try again or email careers@sompacare.com.`,
        },
        { status: 502 },
      );
    }
  }

  const staffEmail = getCareersEmail();
  const staffMessage = buildCareerStaffEmail(data, {
    applicationId: reference,
    resumeFileName: resumeFileName ?? resume.name,
    certCount: certificationUrls.length,
  });
  const applicantMessage = buildCareerApplicantEmail(data, reference);

  const delivery = await sendNotificationPair({
    staff: {
      to: staffEmail,
      intendedRecipient: staffEmail,
      replyTo: data.email,
      subject: staffMessage.subject,
      html: staffMessage.html,
      text: staffMessage.text,
      tags: [
        { name: "category", value: "careers" },
        { name: "type", value: "staff" },
      ],
    },
    recipient: {
      to: data.email,
      intendedRecipient: data.email,
      subject: applicantMessage.subject,
      html: applicantMessage.html,
      text: applicantMessage.text,
      tags: [
        { name: "category", value: "careers" },
        { name: "type", value: "applicant" },
      ],
    },
  });

  if (!delivery.allOk) {
    console.error("Email delivery error:", delivery.staff.error ?? delivery.recipient.error);
  }

  void ingestCareerApplicationToPlatform({
    applicationId,
    firstName: data.firstName,
    lastName: data.lastName,
    email: data.email,
    phone: data.phone,
    position: data.position,
    positionLabel: getPositionLabel(data.position),
    resumeUrl: resumePath,
    resumeFileName: resumeFileName ?? resume.name,
    licenseNumber: data.licenseNumber,
    licenseState: data.licenseState,
    experience: data.experience,
    availability: data.availability,
    referralCode: data.referralCode || undefined,
  });

  return NextResponse.json({
    success: true,
    applicationId,
    reference,
    position: getPositionLabel(data.position),
    timeline: "2–3 business days",
    emailDelivered: delivery.allOk,
    emailRelayed: delivery.staff.relayed || delivery.recipient.relayed,
  });
}
