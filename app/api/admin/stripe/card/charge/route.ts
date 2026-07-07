import { NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import { createCardPaymentIntent } from "@/lib/payment-service";

export async function POST(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const { clientId, invoiceId, amount } = (await request.json()) as {
      clientId?: string;
      invoiceId?: string;
      amount?: number;
    };

    if (!clientId || !invoiceId || !amount) {
      return NextResponse.json({ error: "clientId, invoiceId, and amount are required." }, { status: 400 });
    }

    const result = await createCardPaymentIntent({ clientId, invoiceId, amount });
    return NextResponse.json({ clientSecret: result.clientSecret, paymentId: result.paymentId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Payment failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
