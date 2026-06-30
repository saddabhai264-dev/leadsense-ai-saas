"use client";

import Link from "next/link";
import { ArrowUpRight, Building2, Mail, MoreHorizontal, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Lead } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { initials } from "@/lib/utils";

export function DashboardOverview({ leads, userName }: { leads: Lead[]; userName: string }) {
  const qualified = leads.filter((lead) => lead.score >= 80).length;
  const contacted = leads.filter((lead) => ["contacted", "interested", "closed"].includes(lead.status)).length;
  const closed = leads.filter((lead) => lead.status === "closed").length;
  const chartData = buildChartData(leads);
  const pipeline = buildPipeline(leads);
  const highIntent = leads.filter((lead) => lead.score >= 70).slice(0, 5);
  const stats = [
    { label: "Total leads", value: String(leads.length), change: "Live", icon: Users, color: "text-violet-600 bg-violet-50" },
    { label: "AI qualified", value: String(qualified), change: "Score 80+", icon: Sparkles, color: "text-fuchsia-600 bg-fuchsia-50" },
    { label: "Contacted", value: String(contacted), change: "CRM", icon: Mail, color: "text-blue-600 bg-blue-50" },
    { label: "Closed", value: String(closed), change: "Won", icon: Target, color: "text-emerald-600 bg-emerald-50" },
  ];

  return (
    <div className="mx-auto max-w-[1500px] animate-fade-up space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Good morning, {userName}</h2>
          <p className="mt-1 text-sm text-muted-foreground">Here&apos;s what&apos;s happening with your real pipeline today.</p>
        </div>
        <p className="text-xs text-muted-foreground">Last updated just now</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, change, icon: Icon, color }, index) => (
          <Card key={label} className="animate-fade-up" style={{ animationDelay: `${index * 70}ms` }}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></div>
                <Badge variant="success" className="gap-1"><TrendingUp className="h-3 w-3" />{change}</Badge>
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight">{value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.65fr_1fr]">
        <Card>
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <div><CardTitle>Lead activity</CardTitle><p className="mt-1 text-xs text-muted-foreground">Real new and qualified leads over the last 7 days</p></div>
          </CardHeader>
          <CardContent className="h-[290px] pl-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs><linearGradient id="leads" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#7559ee" stopOpacity={0.25} /><stop offset="95%" stopColor="#7559ee" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef0f4" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e5e7eb", boxShadow: "0 10px 30px rgba(0,0,0,.08)", fontSize: 12 }} />
                <Area type="monotone" dataKey="leads" stroke="#7559ee" strokeWidth={2.5} fill="url(#leads)" />
                <Area type="monotone" dataKey="qualified" stroke="#d946ef" strokeWidth={2} fill="transparent" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Pipeline breakdown</CardTitle><p className="text-xs text-muted-foreground">Real leads by current stage</p></CardHeader>
          <CardContent className="space-y-5">
            {pipeline.map(({ label, pct, count, color }) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-xs"><span className="font-medium">{label}</span><span className="text-muted-foreground">{count} · {pct}%</span></div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div style={{ width: `${pct}%` }} className={`h-full rounded-full ${color}`} /></div>
              </div>
            ))}
            <Button asChild variant="outline" className="mt-2 w-full"><Link href="/dashboard/pipeline">View full pipeline <ArrowUpRight className="h-4 w-4" /></Link></Button>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div><CardTitle>High-intent leads</CardTitle><p className="mt-1 text-xs text-muted-foreground">Real AI-qualified prospects most likely to convert</p></div>
          <Button asChild variant="ghost" size="sm"><Link href="/dashboard/leads">View all <ArrowUpRight className="h-4 w-4" /></Link></Button>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-y bg-slate-50/70 text-[10px] uppercase tracking-wider text-slate-500"><tr>{["Lead", "Company", "Status", "AI score", "Source", ""].map((x) => <th key={x} className="px-5 py-3 font-semibold">{x}</th>)}</tr></thead>
            <tbody>{highIntent.map((lead) => <tr key={lead.id} className="border-b last:border-0 hover:bg-slate-50/60"><td className="px-5 py-3"><div className="flex items-center gap-3"><Avatar className="h-8 w-8"><AvatarFallback>{initials(`${lead.first_name} ${lead.last_name}`)}</AvatarFallback></Avatar><div><p className="text-xs font-semibold">{lead.first_name} {lead.last_name}</p><p className="text-[10px] text-muted-foreground">{lead.job_title}</p></div></div></td><td className="px-5 py-3"><span className="flex items-center gap-2 text-xs"><Building2 className="h-3.5 w-3.5 text-slate-400" />{lead.company_name}</span></td><td className="px-5 py-3"><Badge variant={lead.status === "interested" ? "warning" : "secondary"} className="capitalize">{lead.status}</Badge></td><td className="px-5 py-3"><span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-50 text-xs font-bold text-emerald-700">{lead.score}</span></td><td className="px-5 py-3 text-xs text-muted-foreground">{lead.source}</td><td><button><MoreHorizontal className="h-4 w-4 text-slate-400" /></button></td></tr>)}</tbody>
          </table>
          {!highIntent.length && <div className="p-8 text-center text-sm text-muted-foreground">No real high-intent leads yet. Import a CSV or add leads to start.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function buildChartData(leads: Lead[]) {
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - index));
    const key = date.toISOString().slice(0, 10);
    return { key, day: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }), leads: 0, qualified: 0 };
  });
  for (const lead of leads) {
    const item = days.find((day) => day.key === lead.created_at.slice(0, 10));
    if (item) {
      item.leads++;
      if (lead.score >= 80) item.qualified++;
    }
  }
  return days;
}

function buildPipeline(leads: Lead[]) {
  const total = Math.max(leads.length, 1);
  return [
    { label: "New leads", count: leads.filter((lead) => lead.status === "new").length, color: "bg-violet-500" },
    { label: "Contacted", count: leads.filter((lead) => lead.status === "contacted").length, color: "bg-blue-500" },
    { label: "Interested", count: leads.filter((lead) => lead.status === "interested").length, color: "bg-amber-400" },
    { label: "Closed", count: leads.filter((lead) => lead.status === "closed").length, color: "bg-emerald-500" },
  ].map((item) => ({ ...item, pct: Math.round((item.count / total) * 100) }));
}
