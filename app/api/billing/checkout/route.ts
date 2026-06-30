import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";

export async function POST() {
  try {
    const user = await requireUser();
    const secretKey = process.env.STRIPE_SECRET_KEY;
    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    if (!secretKey || !priceId) {
      return NextResponse.json({ error: "Stripe is not configured" }, { status: 503 });
    }

    const body = new URLSearchParams({
      mode: "subscription",
      success_url: `${appUrl}/dashboard/billing?success=true`,
      cancel_url: `${appUrl}/dashboard/billing?canceled=true`,
      client_reference_id: user.id,
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      "metadata[user_id]": user.id,
      "subscription_data[metadata][user_id]": user.id,
      allow_promotion_codes: "true",
    });

    if (user.email) body.set("customer_email", user.email);

    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    const session = await response.json();
    if (!response.ok) {
      return NextResponse.json({ error: session.error?.message ?? "Stripe checkout failed" }, { status: 400 });
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    return apiError(error);
  }
}
