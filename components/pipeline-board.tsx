"use client";

import { useState } from "react";
import { Building2, ChevronRight, MoreHorizontal, Plus, Sparkles } from "lucide-react";
import type { Lead, LeadStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

const columns: { id: LeadStatus; label: string; color: string; dot: string }[] = [
  { id: "new", label: "New leads", color: "bg-violet-50/60", dot: "bg-violet-500" },
  { id: "contacted", label: "Contacted", color: "bg-blue-50/60", dot: "bg-blue-500" },
  { id: "interested", label: "Interested", color: "bg-amber-50/60", dot: "bg-amber-500" },
  { id: "closed", label: "Closed", color: "bg-emerald-50/60", dot: "bg-emerald-500" },
];

export function PipelineBoard({ initialLeads }: { initialLeads: Lead[] }) {
  const [leads, setLeads] = useState(initialLeads);
  function advance(lead: Lead) {
    const order: LeadStatus[] = ["new", "contacted", "interested", "closed"];
    const next = order[Math.min(order.indexOf(lead.status) + 1, 3)];
    setLeads((current) => current.map((item) => item.id === lead.id ? { ...item, status: next } : item));
    fetch(`/api/leads/${lead.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: next }) }).catch(() => undefined);
  }
  return <div className="mx-auto max-w-[1600px] animate-fade-up">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><h2 className="text-2xl font-bold tracking-tight">CRM pipeline</h2><p className="mt-1 text-sm text-muted-foreground">Keep real deals moving from first signal to closed won.</p></div><div className="flex gap-2"><Button variant="outline">Pipeline settings</Button><Button><Plus className="h-4 w-4" />Add opportunity</Button></div></div>
    <div className="mt-6 grid auto-cols-[290px] grid-flow-col gap-4 overflow-x-auto pb-5 xl:grid-cols-4 xl:grid-flow-row">
      {columns.map((column) => {
        const stageLeads = leads.filter((lead) => lead.status === column.id);
        return <section key={column.id} className={`min-h-[620px] rounded-xl border p-3 ${column.color}`}>
          <header className="mb-3 flex items-center justify-between px-1 py-2"><div className="flex items-center gap-2"><i className={`h-2.5 w-2.5 rounded-full ${column.dot}`} /><h3 className="text-sm font-bold">{column.label}</h3><span className="grid h-5 min-w-5 place-items-center rounded-full bg-white px-1 text-[10px] font-semibold">{stageLeads.length}</span></div><div className="flex gap-1"><button><Plus className="h-4 w-4 text-slate-400" /></button><button><MoreHorizontal className="h-4 w-4 text-slate-400" /></button></div></header>
          <div className="space-y-3">{stageLeads.map((lead) => <article key={lead.id} className="rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-start justify-between"><div className="flex items-center gap-2.5"><Avatar className="h-9 w-9"><AvatarFallback>{initials(`${lead.first_name} ${lead.last_name}`)}</AvatarFallback></Avatar><div><p className="text-sm font-semibold">{lead.first_name} {lead.last_name}</p><p className="text-[10px] text-muted-foreground">{lead.job_title}</p></div></div><button><MoreHorizontal className="h-4 w-4 text-slate-400" /></button></div>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-slate-600"><Building2 className="h-3.5 w-3.5" />{lead.company_name}</div>
            <div className="mt-4 flex items-center justify-between"><Badge variant={lead.score >= 85 ? "success" : "warning"}><Sparkles className="mr-1 h-3 w-3" />{lead.score} fit</Badge>{lead.status !== "closed" && <button onClick={() => advance(lead)} title="Move to next stage" className="grid h-7 w-7 place-items-center rounded-lg bg-slate-100 hover:bg-primary hover:text-white"><ChevronRight className="h-4 w-4" /></button>}</div>
          </article>)}{!stageLeads.length && <div className="rounded-xl border border-dashed bg-white/70 p-4 text-center text-xs text-muted-foreground">No real leads in this stage yet.</div>}</div>
        </section>;
      })}
    </div>
  </div>;
}
