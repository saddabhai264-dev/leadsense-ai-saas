"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import { AlertCircle, Building2, Check, ChevronDown, Download, Filter, Mail, MapPin, MoreHorizontal, Plus, Search, ShieldCheck, Sparkles, Upload, Users, X } from "lucide-react";
import type { Lead } from "@/lib/types";
import { parseLeadsCsv } from "@/lib/csv";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { initials } from "@/lib/utils";

export function LeadsWorkspace({ initialLeads }: { initialLeads: Lead[] }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [importing, setImporting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [importErrors, setImportErrors] = useState<Array<{ row: number; message: string }>>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const filtered = useMemo(() => leads.filter(l => {
    const match = `${l.first_name} ${l.last_name} ${l.company_name} ${l.job_title}`.toLowerCase().includes(query.toLowerCase());
    return match && (status === "all" || l.status === status);
  }), [query, status, leads]);

  function saveLead(id: string) {
    setLeads(current => current.map(l => l.id === id ? {...l, source: "Saved"} : l));
  }

  async function verifyEmails() {
    const candidates = filtered.filter(lead => lead.email).slice(0, 50);
    if (!candidates.length) {
      setImportMessage("No email addresses found in the current lead list.");
      return;
    }

    setVerifying(true);
    setImportMessage(null);
    setImportErrors([]);

    try {
      const response = await fetch("/api/leads/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadIds: candidates.map(lead => lead.id).filter(id => !id.startsWith("lead-") && !id.startsWith("csv-")) }),
      });

      if (response.ok) {
        const result = await response.json();
        const updates = new Map<string, { status: Lead["email_status"]; confidence: number; reason: string }>(
          result.verified.map((item: { id: string; status: Lead["email_status"]; confidence: number; reason: string }) => [item.id, item]),
        );
        setLeads(current => current.map(lead => updates.has(lead.id) ? {
          ...lead,
          email_status: updates.get(lead.id)!.status,
          email_confidence: updates.get(lead.id)!.confidence,
          email_verification_reason: updates.get(lead.id)!.reason,
          email_verified_at: new Date().toISOString(),
        } : lead));
        setImportMessage(`Verified ${result.verified.length} email addresses.`);
        return;
      }

      const result = await response.json().catch(() => null);
      setImportMessage(result?.error ?? "Email verification failed.");
    } catch {
      setImportMessage("Email verification could not run right now.");
    } finally {
      setVerifying(false);
    }
  }

  async function importCsv(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportMessage(null);
    setImportErrors([]);

    try {
      const csv = await file.text();
      const preview = parseLeadsCsv(csv);
      if (!preview.leads.length) {
        setImportErrors(preview.errors);
        setImportMessage("No valid leads found. Check your CSV headers and required fields.");
        return;
      }

      const response = await fetch("/api/leads/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });

      if (response.ok) {
        const result = await response.json();
        setLeads(current => [...result.leads, ...current]);
        setImportErrors(result.errors ?? []);
        setImportMessage(`Imported ${result.imported} leads into Neon.`);
        return;
      }

      const result = await response.json().catch(() => null);
      setImportErrors(result?.errors ?? preview.errors);
      setImportMessage(result?.error ?? "CSV import failed.");
    } catch {
      setImportMessage("Could not read this file. Please upload a valid .csv file.");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-up">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><h2 className="text-2xl font-bold tracking-tight">Find your next customer</h2><p className="mt-1 text-sm text-muted-foreground">Search millions of decision-makers and let AI surface the strongest matches.</p></div>
        <div className="flex flex-wrap gap-2">
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} />
          <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={importing}>
            <Upload className="h-4 w-4" /> {importing ? "Importing..." : "Import CSV"}
          </Button>
          <Button variant="outline" onClick={verifyEmails} disabled={verifying}>
            <ShieldCheck className="h-4 w-4" /> {verifying ? "Verifying..." : "Verify emails"}
          </Button>
          <Button asChild variant="outline"><a href="/api/export"><Download className="h-4 w-4" /> Export CSV</a></Button>
          <Button><Plus className="h-4 w-4" /> Add lead</Button>
        </div>
      </div>
      {importMessage && <div className="mt-4 rounded-xl border bg-white p-4 text-sm shadow-sm">
        <div className="flex items-start gap-3">
          {importErrors.length ? <AlertCircle className="mt-0.5 h-4 w-4 text-amber-500" /> : <Check className="mt-0.5 h-4 w-4 text-emerald-600" />}
          <div>
            <p className="font-semibold text-slate-900">{importMessage}</p>
            <p className="mt-1 text-xs text-muted-foreground">Accepted headers include name, first_name, last_name, email, phone, title, company, domain, company_size, industry, location, linkedin, status.</p>
            {importErrors.length > 0 && <div className="mt-3 max-h-24 overflow-y-auto rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
              {importErrors.slice(0, 6).map(error => <p key={`${error.row}-${error.message}`}>Row {error.row}: {error.message}</p>)}
              {importErrors.length > 6 && <p>+ {importErrors.length - 6} more rows skipped</p>}
            </div>}
          </div>
        </div>
      </div>}
      <Card className="mt-6 overflow-hidden">
        <div className="border-b bg-gradient-to-r from-violet-50/70 to-fuchsia-50/40 p-5">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={query} onChange={e=>setQuery(e.target.value)} className="h-11 bg-white pl-10" placeholder="Search by name, title, company, or industry..." /></div>
            <select value={status} onChange={e=>setStatus(e.target.value)} className="h-11 rounded-lg border bg-white px-3 text-sm outline-none">
              <option value="all">All stages</option><option value="new">New</option><option value="contacted">Contacted</option><option value="interested">Interested</option><option value="closed">Closed</option>
            </select>
            <Button variant="outline" className="h-11 bg-white"><Filter className="h-4 w-4" /> More filters <ChevronDown className="h-3.5 w-3.5" /></Button>
            <Button className="h-11 px-6"><Sparkles className="h-4 w-4" /> AI search</Button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs"><span className="text-muted-foreground">Popular:</span>{["SaaS founders","VP Sales · US","Recently funded","50–200 employees"].map(x=><button key={x} onClick={()=>setQuery(x.split(" ")[0])} className="rounded-full border bg-white px-2.5 py-1 text-slate-600 hover:border-primary hover:text-primary">{x}</button>)}</div>
        </div>
        <div className="flex items-center justify-between border-b px-5 py-3"><p className="text-xs text-muted-foreground"><b className="text-foreground">{filtered.length}</b> real prospects match your search</p><div className="flex items-center gap-2 text-xs text-muted-foreground"><Sparkles className="h-3.5 w-3.5 text-primary" /> Ranked by AI fit</div></div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-500"><tr>{["Prospect","Company","Location","Stage","AI score","Email","Action",""].map(x=><th className="px-5 py-3 font-semibold" key={x}>{x}</th>)}</tr></thead>
            <tbody>{filtered.map(lead=><tr key={lead.id} onClick={()=>setSelected(lead)} className="cursor-pointer border-t text-xs hover:bg-violet-50/30">
              <td className="px-5 py-4"><div className="flex items-center gap-3"><Avatar><AvatarFallback>{initials(`${lead.first_name} ${lead.last_name}`)}</AvatarFallback></Avatar><div><p className="font-semibold text-slate-900">{lead.first_name} {lead.last_name}</p><p className="mt-0.5 text-muted-foreground">{lead.job_title}</p></div></div></td>
              <td className="px-5 py-4"><p className="font-medium">{lead.company_name}</p><p className="mt-0.5 text-muted-foreground">{lead.company_size} · {lead.industry}</p></td>
              <td className="px-5 py-4 text-muted-foreground"><span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{lead.location}</span></td>
              <td className="px-5 py-4"><Badge variant="secondary" className="capitalize">{lead.status}</Badge></td>
              <td className="px-5 py-4"><div className="flex items-center gap-2"><span className={`grid h-8 w-8 place-items-center rounded-full font-bold ${lead.score>=85?"bg-emerald-50 text-emerald-700":"bg-amber-50 text-amber-700"}`}>{lead.score}</span><div className="h-1.5 w-12 overflow-hidden rounded-full bg-slate-100"><div style={{width:`${lead.score}%`}} className="h-full bg-emerald-500" /></div></div></td>
              <td className="px-5 py-4"><EmailBadge lead={lead} /></td>
              <td className="px-5 py-4"><Button size="sm" variant={lead.source==="Saved"?"secondary":"outline"} onClick={e=>{e.stopPropagation();saveLead(lead.id)}}>{lead.source==="Saved"?<Check className="h-3.5 w-3.5" />:<Plus className="h-3.5 w-3.5" />}{lead.source==="Saved"?"Saved":"Save lead"}</Button></td>
              <td className="px-5 py-4"><MoreHorizontal className="h-4 w-4 text-slate-400" /></td>
            </tr>)}</tbody>
          </table>
          {!filtered.length && <div className="p-10 text-center text-sm text-muted-foreground">No real leads yet. Import a CSV to populate this workspace.</div>}
        </div>
      </Card>
      {selected && <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/25 backdrop-blur-sm" onClick={()=>setSelected(null)}><aside className="h-full w-full max-w-md overflow-y-auto bg-white p-6 shadow-2xl" onClick={e=>e.stopPropagation()}>
        <div className="flex justify-between"><Badge><Sparkles className="mr-1 h-3 w-3" />AI score {selected.score}</Badge><button onClick={()=>setSelected(null)}><X className="h-5 w-5" /></button></div>
        <div className="mt-7 flex items-center gap-4"><Avatar className="h-14 w-14"><AvatarFallback className="text-base">{initials(`${selected.first_name} ${selected.last_name}`)}</AvatarFallback></Avatar><div><h3 className="text-xl font-bold">{selected.first_name} {selected.last_name}</h3><p className="text-sm text-muted-foreground">{selected.job_title}</p></div></div>
        <div className="mt-6 grid grid-cols-2 gap-3"><Button><Mail className="h-4 w-4" /> Generate email</Button><Button variant="outline"><Plus className="h-4 w-4" /> Add to list</Button></div>
        <div className="mt-5 rounded-xl border p-4"><h4 className="flex items-center gap-2 text-sm font-bold"><ShieldCheck className="h-4 w-4 text-primary" /> Email verification</h4><div className="mt-3"><EmailBadge lead={selected} /></div><p className="mt-2 text-sm leading-6 text-muted-foreground">{selected.email_verification_reason || "Run verification to check email quality."}</p></div>
        <div className="mt-7 rounded-xl border p-4"><h4 className="flex items-center gap-2 text-sm font-bold"><Sparkles className="h-4 w-4 text-primary" /> Why this lead</h4><p className="mt-2 text-sm leading-6 text-muted-foreground">{selected.score_reason}</p></div>
        <div className="mt-7 space-y-4"><h4 className="text-sm font-bold">Company intelligence</h4><Info icon={Building2} label="Company" value={selected.company_name}/><Info icon={Users} label="Company size" value={selected.company_size || "Unknown"}/><Info icon={MapPin} label="Location" value={selected.location || "Unknown"}/></div>
      </aside></div>}
    </div>
  );
}

function Info({icon:Icon,label,value}:{icon:typeof Building2;label:string;value:string}) {
  return <div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100"><Icon className="h-4 w-4 text-slate-500" /></div><div><p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p><p className="text-sm font-medium">{value}</p></div></div>;
}

function EmailBadge({ lead }: { lead: Lead }) {
  const styles: Record<Lead["email_status"], string> = {
    valid: "border-emerald-200 bg-emerald-50 text-emerald-700",
    risky: "border-amber-200 bg-amber-50 text-amber-700",
    invalid: "border-rose-200 bg-rose-50 text-rose-700",
    unknown: "border-slate-200 bg-slate-50 text-slate-600",
  };

  return <div className="space-y-1">
    <p className="max-w-[190px] truncate font-medium text-slate-800">{lead.email || "No email"}</p>
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles[lead.email_status]}`}>
      {lead.email_status}{typeof lead.email_confidence === "number" ? ` · ${lead.email_confidence}%` : ""}
    </span>
  </div>;
}
