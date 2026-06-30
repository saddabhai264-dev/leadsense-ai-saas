"use client";

import { useState } from "react";
import { Check, Copy, Loader2, Mail, RefreshCw, Send, Sparkles, WandSparkles } from "lucide-react";
import type { EmailDraft } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function EmailGenerator() {
  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [offer, setOffer] = useState("LeadSense helps B2B revenue teams find, score, and contact high-intent leads with AI.");
  const [tone, setTone] = useState("professional");
  const [draft, setDraft] = useState<EmailDraft | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/ai/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { name, jobTitle: title, company },
          offer,
          tone,
          goal: "Book a short discovery call",
        }),
      });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        setDraft(result);
      } else {
        setError(result?.error ?? "Email generation is not configured yet. Add OPENAI_API_KEY in production env vars.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function copy() {
    if (!draft) return;
    await navigator.clipboard.writeText(`Subject: ${draft.subject}\n\n${draft.body}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-up">
      <div>
        <Badge className="gap-1"><WandSparkles className="h-3.5 w-3.5" />AI writer</Badge>
        <h2 className="mt-4 text-2xl font-bold tracking-tight">Cold email generator</h2>
        <p className="mt-1 text-sm text-muted-foreground">Create concise, relevant outreach grounded in real lead context.</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[.85fr_1.15fr]">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Personalization inputs</CardTitle>
            <p className="text-xs text-muted-foreground">Give the AI enough context to write something worth reading.</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Recipient name"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Khan" /></Field>
              <Field label="Job title"><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Head of Growth" /></Field>
            </div>
            <Field label="Company"><Input value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g. Acme SaaS" /></Field>
            <Field label="What are you offering?">
              <Textarea className="min-h-28" value={offer} onChange={(e) => setOffer(e.target.value)} />
              <p className="mt-1 text-[10px] text-muted-foreground">Keep it plain: who you help, what improves, and why it matters.</p>
            </Field>
            <Field label="Tone">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                {["professional", "friendly", "direct", "curious"].map((x) => (
                  <button
                    type="button"
                    onClick={() => setTone(x)}
                    key={x}
                    className={`rounded-lg border px-2 py-2 text-xs capitalize ${tone === x ? "border-primary bg-primary/5 font-semibold text-primary" : "bg-white text-slate-600"}`}
                  >
                    {x}
                  </button>
                ))}
              </div>
            </Field>
            {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">{error}</div>}
            <Button className="h-11 w-full" onClick={generate} disabled={loading || !name || !company || !offer}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {loading ? "Writing your email..." : "Generate email"}
            </Button>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b bg-slate-50 px-5 py-3">
            <span className="flex items-center gap-2 text-xs font-semibold"><Mail className="h-4 w-4 text-primary" />Email preview</span>
            {draft && (
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={generate}><RefreshCw className="h-3.5 w-3.5" />Rewrite</Button>
                <Button variant="ghost" size="sm" onClick={copy}>{copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied ? "Copied" : "Copy"}</Button>
              </div>
            )}
          </div>
          <CardContent className="p-0">
            {!draft && !loading && (
              <div className="grid min-h-[520px] place-items-center p-8 text-center">
                <div>
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10"><Mail className="h-6 w-6 text-primary" /></div>
                  <h3 className="mt-5 font-bold">Your draft will appear here</h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-muted-foreground">Add recipient context and generate a personalized email in one click.</p>
                </div>
              </div>
            )}
            {loading && <div className="min-h-[520px] space-y-5 p-8"><div className="h-5 w-2/3 animate-pulse rounded bg-slate-100" /><div className="h-px bg-slate-100" />{[90, 75, 95, 60].map((w, i) => <div key={i} style={{ width: `${w}%` }} className="h-3 animate-pulse rounded bg-slate-100" />)}</div>}
            {draft && !loading && (
              <div className="min-h-[520px] p-6 sm:p-8">
                <div className="border-b pb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Subject</p>
                  <input value={draft.subject} onChange={(e) => setDraft({ ...draft, subject: e.target.value })} className="mt-2 w-full bg-transparent text-base font-semibold outline-none" />
                </div>
                <textarea value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} className="mt-6 min-h-[300px] w-full resize-none bg-transparent text-sm leading-7 text-slate-700 outline-none" />
                <div className="mt-5 flex flex-col justify-between gap-3 rounded-xl bg-violet-50 p-4 sm:flex-row sm:items-center">
                  <div>
                    <p className="text-xs font-bold text-primary">AI angle · {draft.confidence}% confidence</p>
                    <p className="mt-1 text-xs text-slate-600">{draft.angle}</p>
                  </div>
                  <Button size="sm"><Send className="h-3.5 w-3.5" />Use draft</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-semibold">{label}</label>{children}</div>;
}
