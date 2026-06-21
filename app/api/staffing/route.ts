import { NextResponse } from "next/server";
import { getStaffingEmail } from "@/lib/contact-server";
import { sendNotificationPair } from "@/lib/email/send";
import {
  buildStaffingConfirmationEmail,
  buildStaffingStaffEmail,
} from "@/lib/staffing-emails";
import { validateStaffingForm } from "@/lib/staffing-validation";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Staffing request service is not configured. Please call us directly." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validation = validateStaffingForm(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const data = validation.data;
  const staffEmail = getStaffingEmail();
  const staffMessage = buildStaffingStaffEmail(data);
  const confirmMessage = buildStaffingConfirmationEmail(data);

  const delivery = await sendNotificationPair({
    staff: {
      to: staffEmail,
      intendedRecipient: staffEmail,
      replyTo: data.email,
      subject: staffMessage.subject,
      html: staffMessage.html,
      text: staffMessage.text,
      tags: [{ name: "category", value: "staffing" }],
    },
    recipient: {
      to: data.email,
      intendedRecipient: data.email,
      subject: confirmMessage.subject,
      html: confirmMessage.html,
      text: confirmMessage.text,
      tags: [{ name: "category", value: "staffing" }],
    },
  });

  if (!delivery.allOk) {
    console.error("Resend error:", delivery.staff.error ?? delivery.recipient.error);
    return NextResponse.json(
      { error: "Unable to send your request right now. Please call us directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
