"use client";

import { useMemo, useState } from "react";
import { BarChart3, CalendarClock, Check, Copy, Loader2, MailPlus, MessageSquareReply, Pause, Play, Plus, Rocket, Send, Sparkles, Trash2, UserPlus } from "lucide-react";
import type { Campaign, Lead } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type DraftStep = { delay_days: number; subject: string; body: string };

const defaultSteps: DraftStep[] = [
  { delay_days: 0, subject: "Quick idea for {{company}}", body: "Hi {{first_name}},\n\nI noticed {{company}} fits the type of team we usually help.\n\nLeadSense helps teams identify high-fit leads and create relevant outreach without manual research.\n\nWorth a quick look?" },
  { delay_days: 3, subject: "Should I send details?", body: "Hi {{first_name}},\n\nFollowing up because this tends to be useful when teams want more qualified pipeline without adding more manual prospecting.\n\nShould I send over a quick example?" },
  { delay_days: 7, subject: "Close the loop", body: "Hi {{first_name}},\n\nI do not want to crowd your inbox. If improving lead quality and outreach speed is not a priority right now, totally fair.\n\nShould I close the loop for now?" },
];

export function CampaignsWorkspace({ initialCampaigns, initialLeadCandidates }: { initialCampaigns: Campaign[]; initialLeadCandidates: Lead[] }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialCampaigns);
  const [name, setName] = useState("AI qualified lead campaign");
  const [audience, setAudience] = useState("Verified B2B leads with score above 80");
  const [offer, setOffer] = useState("LeadSense helps revenue teams import leads, verify emails, score fit with AI, and write personalized outbound.");
  const [goal, setGoal] = useState("Book a discovery call");
  const [steps, setSteps] = useState<DraftStep[]>(defaultSteps);
  const [saving, setSaving] = useState(false);
  const [assigning, setAssigning] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState<string | null>(null);
  const [selectedLeads, setSelectedLeads] = useState<Record<string, string[]>>({});
  const [analytics, setAnalytics] = useState<Record<string, { sent: number; replied: number; bounced: number; failed: number; replyRate: number; bounceRate: number }>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const leadCandidates = useMemo(() => initialLeadCandidates, [initialLeadCandidates]);
  const stats = useMemo(() => ({
    active: campaigns.filter((campaign) => campaign.status === "active").length,
    steps: campaigns.reduce((sum, campaign) => sum + (campaign.campaign_steps?.length ?? 0), 0),
    leads: campaigns.reduce((sum, campaign) => sum + campaign.total_leads, 0),
  }), [campaigns]);

  function updateStep(index: number, patch: Partial<DraftStep>) {
    setSteps((current) => current.map((step, stepIndex) => stepIndex === index ? { ...step, ...patch } : step));
  }
  function addStep() {
    setSteps((current) => [...current, { delay_days: 10, subject: "One more thought", body: "Hi {{first_name}},\n\nOne more quick thought for {{company}}...\n\nWould this be worth revisiting later?" }]);
  }
  function removeStep(index: number) {
    setSteps((current) => current.filter((_, stepIndex) => stepIndex !== index));
  }
  async function createCampaign(status: Campaign["status"]) {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetch("/api/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, audience, offer, goal, status, steps }) });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        setCampaigns((current) => [result.campaign, ...current]);
        setMessage(status === "active" ? "Campaign saved and marked active." : "Campaign draft saved.");
      } else setMessage(result?.error ?? "Could not save campaign.");
    } finally {
      setSaving(false);
    }
  }
  async function copySequence(campaign: Campaign) {
    const text = (campaign.campaign_steps ?? []).map((step) => `Day ${step.delay_days}\nSubject: ${step.subject}\n\n${step.body}`).join("\n\n---\n\n");
    await navigator.clipboard.writeText(text);
    setCopied(campaign.id);
    setTimeout(() => setCopied(null), 1500);
  }
  function toggleLead(campaignId: string, leadId: string) {
    setSelectedLeads((current) => {
      const selected = new Set(current[campaignId] ?? []);
      if (selected.has(leadId)) selected.delete(leadId); else selected.add(leadId);
      return { ...current, [campaignId]: Array.from(selected) };
    });
  }
  async function assignLeads(campaign: Campaign) {
    const selected = selectedLeads[campaign.id] ?? [];
    if (!selected.length) return setMessage("Select at least one lead to add to this campaign.");
    setAssigning(campaign.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/leads`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadIds: selected }) });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        setCampaigns((current) => current.map((item) => item.id === campaign.id ? { ...item, total_leads: result.total } : item));
        setSelectedLeads((current) => ({ ...current, [campaign.id]: [] }));
        setMessage(`Queued ${result.added} leads in ${campaign.name}.`);
      } else setMessage(result?.error ?? "Could not assign leads to campaign.");
    } finally {
      setAssigning(null);
    }
  }
  async function sendBatch(campaign: Campaign) {
    setSending(campaign.id);
    setMessage(null);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/send`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ limit: 10 }) });
      const result = await response.json().catch(() => null);
      if (response.ok) {
        setCampaigns((current) => current.map((item) => item.id === campaign.id ? { ...item, campaign_leads: item.campaign_leads?.map((lead) => lead.status === "queued" ? { ...lead, status: "sent", sent_at: new Date().toISOString() } : lead) } : item));
        setMessage(`Sent ${result.sent} emails. Failed ${result.failed}.`);
        await refreshAnalytics(campaign.id);
      } else setMessage(result?.error ?? "Could not send campaign emails.");
    } finally {
      setSending(null);
    }
  }
  async function refreshAnalytics(campaignId: string) {
    setLoadingAnalytics(campaignId);
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/analytics`);
      const result = await response.json().catch(() => null);
      if (response.ok) setAnalytics((current) => ({ ...current, [campaignId]: result.analytics }));
    } finally {
      setLoadingAnalytics(null);
    }
  }
  async function markReply(campaign: Campaign) {
    const target = campaign.campaign_leads?.find((lead) => lead.status === "sent");
    if (!target) return setMessage("No sent leads found to mark as replied.");
    await fetch(`/api/campaigns/${campaign.id}/leads/${target.lead_id}/status`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "replied" }) }).catch(() => undefined);
    setCampaigns((current) => current.map((item) => item.id === campaign.id ? { ...item, campaign_leads: item.campaign_leads?.map((lead) => lead.id === target.id ? { ...lead, status: "replied", replied_at: new Date().toISOString() } : lead) } : item));
    setMessage("Reply tracked.");
    await refreshAnalytics(campaign.id);
  }

  return <div className="mx-auto max-w-[1500px] animate-fade-up">
    <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
      <div><Badge className="gap-1"><Rocket className="h-3.5 w-3.5" /> Outreach engine</Badge><h2 className="mt-4 text-2xl font-bold tracking-tight">Campaign sequences</h2><p className="mt-1 text-sm text-muted-foreground">Build multi-step cold email campaigns using verified real leads.</p></div>
      <div className="grid gap-2 sm:grid-cols-3"><MiniStat label="Active campaigns" value={stats.active} /><MiniStat label="Sequence steps" value={stats.steps} /><MiniStat label="Leads queued" value={stats.leads} /></div>
    </div>
    {message && <div className="mt-5 rounded-xl border bg-white p-4 text-sm font-medium shadow-sm">{message}</div>}
    <div className="mt-6 grid gap-6 xl:grid-cols-[.9fr_1.1fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><MailPlus className="h-4 w-4 text-primary" /> Campaign builder</CardTitle><p className="text-xs text-muted-foreground">Use variables like {"{{first_name}}"} and {"{{company}}"}.</p></CardHeader><CardContent className="space-y-4">
        <Field label="Campaign name"><Input value={name} onChange={(event) => setName(event.target.value)} /></Field>
        <Field label="Audience"><Input value={audience} onChange={(event) => setAudience(event.target.value)} /></Field>
        <Field label="Offer"><Textarea className="min-h-24" value={offer} onChange={(event) => setOffer(event.target.value)} /></Field>
        <Field label="Goal"><Input value={goal} onChange={(event) => setGoal(event.target.value)} /></Field>
        <div className="flex flex-col gap-2 sm:flex-row"><Button className="flex-1" onClick={() => createCampaign("active")} disabled={saving || !name || !audience || !offer}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Launch campaign</Button><Button className="flex-1" variant="outline" onClick={() => createCampaign("draft")} disabled={saving || !name || !audience || !offer}>Save draft</Button></div>
      </CardContent></Card>
      <Card><CardHeader className="flex flex-row items-center justify-between"><div><CardTitle className="text-base">Email sequence</CardTitle><p className="mt-1 text-xs text-muted-foreground">Start simple: opener, value follow-up, breakup email.</p></div><Button size="sm" variant="outline" onClick={addStep}><Plus className="h-3.5 w-3.5" /> Add step</Button></CardHeader><CardContent className="space-y-4">
        {steps.map((step, index) => <div key={index} className="rounded-2xl border bg-slate-50/60 p-4"><div className="mb-3 flex items-center justify-between gap-3"><Badge variant="secondary">Step {index + 1}</Badge><div className="flex items-center gap-2"><CalendarClock className="h-4 w-4 text-slate-400" /><Input type="number" min={0} max={60} value={step.delay_days} onChange={(event) => updateStep(index, { delay_days: Number(event.target.value) })} className="h-8 w-20 bg-white text-xs" /><span className="text-xs text-muted-foreground">days</span>{steps.length > 1 && <Button size="icon" variant="ghost" onClick={() => removeStep(index)}><Trash2 className="h-4 w-4 text-rose-500" /></Button>}</div></div><Input value={step.subject} onChange={(event) => updateStep(index, { subject: event.target.value })} className="bg-white font-semibold" /><Textarea value={step.body} onChange={(event) => updateStep(index, { body: event.target.value })} className="mt-3 min-h-32 bg-white text-sm leading-6" /></div>)}
      </CardContent></Card>
    </div>
    <div className="mt-6 grid gap-4 xl:grid-cols-2">
      {campaigns.map((campaign) => <Card key={campaign.id} className="overflow-hidden"><div className="flex items-start justify-between gap-3 border-b bg-white p-5"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold">{campaign.name}</h3><StatusBadge status={campaign.status} /></div><p className="mt-1 text-xs text-muted-foreground">{campaign.audience}</p></div><Button size="sm" variant="outline" onClick={() => copySequence(campaign)}>{copied === campaign.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}{copied === campaign.id ? "Copied" : "Copy"}</Button></div>
        <CardContent className="p-5"><div className="grid grid-cols-3 gap-3 text-center"><MiniStat label="Steps" value={campaign.campaign_steps?.length ?? 0} /><MiniStat label="Leads" value={campaign.total_leads} /><MiniStat label="Reply rate" value={`${campaign.reply_rate}%`} /></div>
          <div className="mt-4 rounded-2xl border bg-gradient-to-r from-violet-50 to-fuchsia-50 p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h4 className="flex items-center gap-2 text-sm font-bold"><BarChart3 className="h-4 w-4 text-primary" /> Sending queue & analytics</h4><p className="mt-1 text-xs text-muted-foreground">Send queued leads and track replies.</p></div><div className="flex flex-wrap gap-2"><Button size="sm" onClick={() => sendBatch(campaign)} disabled={sending === campaign.id}>{sending === campaign.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />} Send batch</Button><Button size="sm" variant="outline" onClick={() => refreshAnalytics(campaign.id)} disabled={loadingAnalytics === campaign.id}>{loadingAnalytics === campaign.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <BarChart3 className="h-3.5 w-3.5" />} Analytics</Button><Button size="sm" variant="outline" onClick={() => markReply(campaign)}><MessageSquareReply className="h-3.5 w-3.5" /> Mark reply</Button></div></div><div className="mt-4 grid grid-cols-3 gap-2 text-center sm:grid-cols-6"><MiniStat label="Sent" value={analytics[campaign.id]?.sent ?? campaign.campaign_leads?.filter((lead) => lead.status === "sent" || lead.status === "replied").length ?? 0} /><MiniStat label="Replies" value={analytics[campaign.id]?.replied ?? campaign.campaign_leads?.filter((lead) => lead.status === "replied").length ?? 0} /><MiniStat label="Bounces" value={analytics[campaign.id]?.bounced ?? campaign.campaign_leads?.filter((lead) => lead.status === "bounced").length ?? 0} /><MiniStat label="Failed" value={analytics[campaign.id]?.failed ?? 0} /><MiniStat label="Reply %" value={`${analytics[campaign.id]?.replyRate ?? campaign.reply_rate}%`} /><MiniStat label="Bounce %" value={`${analytics[campaign.id]?.bounceRate ?? 0}%`} /></div></div>
          <div className="mt-5 space-y-3">{(campaign.campaign_steps ?? []).map((step) => <div key={step.id} className="rounded-xl border bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Day {step.delay_days} · Step {step.step_order}</p><p className="mt-1 text-sm font-semibold">{step.subject}</p><p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{step.body}</p></div>)}</div>
          <div className="mt-5 rounded-2xl border bg-white p-4"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h4 className="flex items-center gap-2 text-sm font-bold"><UserPlus className="h-4 w-4 text-primary" /> Add leads to campaign</h4><p className="mt-1 text-xs text-muted-foreground">Pick real verified/high-score leads.</p></div><Button size="sm" onClick={() => assignLeads(campaign)} disabled={assigning === campaign.id}>{assigning === campaign.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <UserPlus className="h-3.5 w-3.5" />} Queue leads</Button></div><div className="mt-4 grid gap-2">{leadCandidates.slice(0, 4).map((lead) => <LeadChoice key={`${campaign.id}-${lead.id}`} lead={lead} checked={(selectedLeads[campaign.id] ?? []).includes(lead.id)} onChange={() => toggleLead(campaign.id, lead.id)} />)}{!leadCandidates.length && <div className="rounded-xl border border-dashed p-4 text-center text-xs text-muted-foreground">No real leads available. Import leads first.</div>}</div></div>
        </CardContent></Card>)}
      {!campaigns.length && <Card className="xl:col-span-2"><CardContent className="p-10 text-center text-sm text-muted-foreground">No real campaigns yet. Create your first campaign above.</CardContent></Card>}
    </div>
  </div>;
}

function LeadChoice({ lead, checked, onChange }: { lead: Lead; checked: boolean; onChange: () => void }) {
  return <label className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors ${checked ? "border-primary bg-primary/5" : "bg-slate-50 hover:bg-slate-100"}`}><input type="checkbox" checked={checked} onChange={onChange} className="h-4 w-4 accent-violet-600" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{lead.first_name} {lead.last_name} <span className="font-normal text-muted-foreground">· {lead.company_name}</span></p><p className="truncate text-xs text-muted-foreground">{lead.email} · score {lead.score} · {lead.email_status}</p></div><Badge variant="secondary">{lead.status}</Badge></label>;
}
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div><label className="mb-1.5 block text-xs font-semibold">{label}</label>{children}</div>; }
function MiniStat({ label, value }: { label: string; value: string | number }) { return <div className="rounded-xl border bg-white px-4 py-3 shadow-sm"><p className="text-lg font-bold">{value}</p><p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p></div>; }
function StatusBadge({ status }: { status: Campaign["status"] }) {
  const icon = status === "active" ? Play : status === "paused" ? Pause : Sparkles;
  const Icon = icon;
  const styles: Record<Campaign["status"], string> = { active: "bg-emerald-50 text-emerald-700", draft: "bg-slate-100 text-slate-700", paused: "bg-amber-50 text-amber-700", completed: "bg-violet-50 text-violet-700" };
  return <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold uppercase tracking-wide ${styles[status]}`}><Icon className="h-3 w-3" />{status}</span>;
}
