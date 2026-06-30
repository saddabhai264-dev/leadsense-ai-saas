"use client";

import { useState } from "react";
import { CheckCircle2, KeyRound, Loader2, MailCheck, PlugZap, Server, ShieldCheck } from "lucide-react";
import type { SenderAccount } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type SafeSenderAccount = Omit<SenderAccount, "smtp_password_encrypted">;

const presets = {
  gmail: { host: "smtp.gmail.com", port: 587 },
  outlook: { host: "smtp.office365.com", port: 587 },
  smtp: { host: "smtp.yourdomain.com", port: 587 },
};

export function SendingSettings({ initialAccounts }: { initialAccounts: SafeSenderAccount[] }) {
  const [accounts, setAccounts] = useState<SafeSenderAccount[]>(initialAccounts);
  const [provider, setProvider] = useState<SenderAccount["provider"]>("gmail");
  const [fromName, setFromName] = useState("");
  const [fromEmail, setFromEmail] = useState("");
  const [replyTo, setReplyTo] = useState("");
  const [smtpHost, setSmtpHost] = useState(presets.gmail.host);
  const [smtpPort, setSmtpPort] = useState(presets.gmail.port);
  const [smtpUsername, setSmtpUsername] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [dailyLimit, setDailyLimit] = useState(50);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  function chooseProvider(value: SenderAccount["provider"]) {
    setProvider(value);
    setSmtpHost(presets[value].host);
    setSmtpPort(presets[value].port);
  }

  async function saveAccount() {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/sender-accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider,
          from_name: fromName,
          from_email: fromEmail,
          reply_to: replyTo || null,
          smtp_host: smtpHost,
          smtp_port: smtpPort,
          smtp_username: smtpUsername,
          smtp_password: smtpPassword || undefined,
          daily_limit: dailyLimit,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAccounts(current => [result.senderAccount, ...current]);
        setMessage("Sender account saved. Test it before launching campaigns.");
        setSmtpPassword("");
        return;
      }

      const result = await response.json().catch(() => null);
      setMessage(result?.error ?? "Could not save sender account.");
    } finally {
      setSaving(false);
    }
  }

  async function testAccount(account: SafeSenderAccount) {
    setTesting(account.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/sender-accounts/${account.id}/test`, { method: "POST" });
      const result = await response.json().catch(() => null);
      setAccounts(current => current.map(item => item.id === account.id ? {
        ...item,
        status: response.ok && result?.ok ? "connected" : "error",
        last_tested_at: new Date().toISOString(),
      } : item));
      setMessage(result?.message ?? "Test completed.");
    } finally {
      setTesting(null);
    }
  }

  return <div className="mx-auto max-w-[1300px] animate-fade-up">
    <div>
      <Badge className="gap-1"><PlugZap className="h-3.5 w-3.5" /> Sending infrastructure</Badge>
      <h2 className="mt-4 text-2xl font-bold tracking-tight">Connect your sending account</h2>
      <p className="mt-1 text-sm text-muted-foreground">Add Gmail, Outlook, or SMTP credentials so campaigns can send from your own domain.</p>
    </div>

    {message && <div className="mt-5 rounded-xl border bg-white p-4 text-sm font-medium shadow-sm">{message}</div>}

    <div className="mt-6 grid gap-6 lg:grid-cols-[.9fr_1.1fr]">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Server className="h-4 w-4 text-primary" /> SMTP setup</CardTitle>
          <p className="text-xs text-muted-foreground">For Gmail use an App Password, not your normal login password.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="Provider">
            <div className="grid grid-cols-3 gap-2">
              {(["gmail", "outlook", "smtp"] as const).map(item => <button key={item} onClick={() => chooseProvider(item)} className={`rounded-lg border px-3 py-2 text-xs font-semibold capitalize ${provider === item ? "border-primary bg-primary/5 text-primary" : "bg-white text-slate-600"}`}>{item}</button>)}
            </div>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="From name"><Input value={fromName} onChange={event => setFromName(event.target.value)} /></Field>
            <Field label="From email"><Input value={fromEmail} onChange={event => setFromEmail(event.target.value)} /></Field>
          </div>
          <Field label="Reply-to email"><Input value={replyTo} onChange={event => setReplyTo(event.target.value)} /></Field>
          <div className="grid gap-3 sm:grid-cols-[1fr_120px]">
            <Field label="SMTP host"><Input value={smtpHost} onChange={event => setSmtpHost(event.target.value)} /></Field>
            <Field label="Port"><Input type="number" value={smtpPort} onChange={event => setSmtpPort(Number(event.target.value))} /></Field>
          </div>
          <Field label="SMTP username"><Input value={smtpUsername} onChange={event => setSmtpUsername(event.target.value)} /></Field>
          <Field label="SMTP password / app password"><Input type="password" value={smtpPassword} onChange={event => setSmtpPassword(event.target.value)} placeholder="Stored encrypted on the server" /></Field>
          <Field label="Daily send limit"><Input type="number" min={1} max={2000} value={dailyLimit} onChange={event => setDailyLimit(Number(event.target.value))} /></Field>
          <Button className="h-11 w-full" onClick={saveAccount} disabled={saving || !fromEmail || !smtpHost || !smtpUsername}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
            Save sender account
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="h-4 w-4 text-primary" /> Deliverability checklist</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            {["Use a dedicated sending inbox", "Set SPF, DKIM, and DMARC on your domain", "Start with 20-50 emails/day", "Avoid unverified or risky emails", "Keep unsubscribe handling clear"].map(item => <div key={item} className="flex items-center gap-2 rounded-xl border bg-white p-3"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</div>)}
          </CardContent>
        </Card>

        {accounts.map(account => <Card key={account.id}>
          <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-bold">{account.from_name}</h3>
                <StatusBadge status={account.status} />
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{account.from_email} via {account.smtp_host}:{account.smtp_port}</p>
              <p className="mt-1 text-xs text-muted-foreground">{account.daily_limit} emails/day · {account.provider}</p>
            </div>
            <Button variant="outline" onClick={() => testAccount(account)} disabled={testing === account.id}>
              {testing === account.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailCheck className="h-4 w-4" />}
              Test
            </Button>
          </CardContent>
        </Card>)}
        {!accounts.length && <Card><CardContent className="p-6 text-center text-sm text-muted-foreground">No real sender accounts connected yet.</CardContent></Card>}
      </div>
    </div>
  </div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1.5 block text-xs font-semibold">{label}</label>{children}</div>;
}

function StatusBadge({ status }: { status: SafeSenderAccount["status"] }) {
  const styles = {
    connected: "bg-emerald-50 text-emerald-700",
    draft: "bg-slate-100 text-slate-700",
    error: "bg-rose-50 text-rose-700",
  };
  return <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}>{status}</span>;
}
