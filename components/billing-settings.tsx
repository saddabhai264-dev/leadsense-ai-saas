"use client";

import { useState } from "react";
import { CheckCircle2, CreditCard, Loader2, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function BillingSettings() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function checkout() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/billing/checkout", { method: "POST" });
      const result = await response.json().catch(() => null);
      if (response.ok && result?.url) {
        window.location.href = result.url;
        return;
      }
      if (response.status === 401) {
        setMessage("Log in first, then upgrade your workspace.");
      } else {
        setMessage(result?.error ?? "Stripe checkout is not configured yet.");
      }
    } finally {
      setLoading(false);
    }
  }

  return <div className="mx-auto max-w-5xl animate-fade-up">
    <Badge className="gap-1"><Sparkles className="h-3.5 w-3.5" /> Monetization</Badge>
    <h2 className="mt-4 text-2xl font-bold tracking-tight">Billing & subscriptions</h2>
    <p className="mt-1 text-sm text-muted-foreground">Launch paid plans with Stripe Checkout and subscription webhooks.</p>

    {message && <div className="mt-5 rounded-xl border bg-white p-4 text-sm font-medium shadow-sm">{message}</div>}

    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <Card className="border-primary/30 bg-gradient-to-br from-white to-violet-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Pro plan</CardTitle>
          <p className="text-sm text-muted-foreground">For agencies and outbound teams ready to run campaigns.</p>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-1"><span className="text-4xl font-black">$49</span><span className="pb-1 text-sm text-muted-foreground">/month</span></div>
          <div className="mt-6 space-y-3 text-sm">
            {["CSV import + email verification", "AI scoring and email generation", "Campaign sequences", "SMTP sending accounts", "Analytics and reply tracking"].map(item => <p key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</p>)}
          </div>
          <Button className="mt-7 h-11 w-full" onClick={checkout} disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
            Upgrade with Stripe
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Stripe setup checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Create a recurring Stripe Price.</p>
          <p>2. Add `STRIPE_SECRET_KEY` and `STRIPE_PRO_PRICE_ID` to Vercel env vars.</p>
          <p>3. Add webhook endpoint: `/api/billing/webhook`.</p>
          <p>4. Add `STRIPE_WEBHOOK_SECRET` from Stripe webhook settings.</p>
          <p>5. Run `npm run db:push` so subscription tables exist in Neon.</p>
        </CardContent>
      </Card>
    </div>
  </div>;
}
