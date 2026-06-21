import { NextResponse } from "next/server";
import {
  buildStaffNotificationEmail,
  buildVisitorConfirmationEmail,
} from "@/lib/contact-emails";
import { getInfoEmail } from "@/lib/contact-server";
import { validateContactForm } from "@/lib/contact-validation";
import { sendNotificationPair } from "@/lib/email/send";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email service is not configured. Please try again later." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const validation = validateContactForm(body);
  if (!validation.success) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  const data = validation.data;
  const staffEmail = getInfoEmail();
  const staffMessage = buildStaffNotificationEmail(data);
  const visitorMessage = buildVisitorConfirmationEmail(data);

  const delivery = await sendNotificationPair({
    staff: {
      to: staffEmail,
      intendedRecipient: staffEmail,
      replyTo: data.email,
      subject: staffMessage.subject,
      html: staffMessage.html,
      text: staffMessage.text,
      tags: [{ name: "category", value: "contact" }],
    },
    recipient: {
      to: data.email,
      intendedRecipient: data.email,
      subject: visitorMessage.subject,
      html: visitorMessage.html,
      text: visitorMessage.text,
      tags: [{ name: "category", value: "contact" }],
    },
  });

  if (!delivery.allOk) {
    console.error("Resend error:", delivery.staff.error ?? delivery.recipient.error);
    return NextResponse.json(
      { error: "Unable to send your message right now. Please try again or call us directly." },
      { status: 502 },
    );
  }

  return NextResponse.json({ success: true });
}
