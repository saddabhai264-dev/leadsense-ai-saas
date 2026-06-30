import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret || !verifyStripeSignature(payload, signature, secret)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(payload);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id || session.client_reference_id;
    if (userId) {
      await prisma.subscription.upsert({
        where: { stripeSubscriptionId: session.subscription },
        update: { stripeCustomerId: session.customer, status: "active" },
        create: { userId, stripeCustomerId: session.customer, stripeSubscriptionId: session.subscription, plan: "pro", status: "active" },
      });
      await prisma.user.update({ where: { id: userId }, data: { plan: "pro" } });
    }
  }

  if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    const userId = subscription.metadata?.user_id;
    if (userId) {
      const periodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null;
      await prisma.subscription.upsert({
        where: { stripeSubscriptionId: subscription.id },
        update: { stripeCustomerId: subscription.customer, status: subscription.status, currentPeriodEnd: periodEnd },
        create: { userId, stripeCustomerId: subscription.customer, stripeSubscriptionId: subscription.id, plan: "pro", status: subscription.status, currentPeriodEnd: periodEnd },
      });
      await prisma.user.update({ where: { id: userId }, data: { plan: subscription.status === "active" ? "pro" : "free" } });
    }
  }

  return NextResponse.json({ received: true });
}

function verifyStripeSignature(payload: string, header: string, secret: string) {
  const parts = Object.fromEntries(header.split(",").map((item) => {
    const [key, value] = item.split("=");
    return [key, value];
  }));
  if (!parts.t || !parts.v1) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${parts.t}.${payload}`).digest("hex");
  const expectedBuffer = Buffer.from(expected);
  const actualBuffer = Buffer.from(parts.v1);
  return expectedBuffer.length === actualBuffer.length && crypto.timingSafeEqual(expectedBuffer, actualBuffer);
}
