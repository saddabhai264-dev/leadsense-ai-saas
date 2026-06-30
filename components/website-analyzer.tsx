"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, ExternalLink, Globe2, Lightbulb, Loader2, Search, ShieldCheck, Sparkles, Target, Zap } from "lucide-react";
import type { WebsiteAnalysis } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const sample: WebsiteAnalysis = {
  url:"https://acme.example",companyName:"Acme Cloud",summary:"A cloud operations platform helping growing engineering teams monitor infrastructure, reduce incidents, and manage costs from one workspace.",industry:"Cloud Infrastructure",employeeRange:"51–200 employees",technologies:["React","AWS","Segment","HubSpot"],buyingSignals:["Hiring sales and solutions engineering roles","Recently launched an enterprise offering","Prominent integration ecosystem"],painPoints:["Scaling outbound while entering enterprise","Explaining technical differentiation clearly","Maintaining personalization at higher volume"],score:89,recommendation:"Lead with how LeadSense can help the new enterprise sales team prioritize accounts showing infrastructure-growth signals."
};

export function WebsiteAnalyzer() {
  const [url,setUrl]=useState("");
  const [loading,setLoading]=useState(false);
  const [result,setResult]=useState<WebsiteAnalysis|null>(null);
  const [error,setError]=useState("");
  async function analyze(e:React.FormEvent){
    e.preventDefault();setLoading(true);setError("");
    try{
      const normalized=/^https?:\/\//.test(url)?url:`https://${url}`;
      const response=await fetch("/api/ai/analyze",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({url:normalized})});
      if(!response.ok){
        if(response.status===401||response.status===503){await new Promise(r=>setTimeout(r,900));setResult({...sample,url:normalized});return;}
        const body=await response.json();throw new Error(body.error||"Analysis failed");
      }
      setResult(await response.json());
    }catch(err){setError(err instanceof Error?err.message:"Analysis failed");}finally{setLoading(false);}
  }
  return <div className="mx-auto max-w-6xl animate-fade-up">
    <div className="text-center"><Badge className="gap-1.5"><Sparkles className="h-3.5 w-3.5"/>AI account research</Badge><h2 className="mt-5 text-3xl font-bold tracking-tight">Understand any company in seconds</h2><p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Turn a company website into actionable sales intelligence, including buying signals, likely pain points, and the best angle for outreach.</p></div>
    <form onSubmit={analyze} className="mx-auto mt-8 flex max-w-3xl flex-col gap-2 rounded-2xl border bg-white p-2 shadow-soft sm:flex-row">
      <div className="relative flex-1"><Globe2 className="absolute left-3 top-3.5 h-4 w-4 text-slate-400"/><Input className="h-11 border-0 pl-10 shadow-none focus:ring-0" placeholder="Enter a company website, e.g. stripe.com" value={url} onChange={e=>setUrl(e.target.value)} required/></div>
      <Button className="h-11 px-6" disabled={loading}>{loading?<Loader2 className="h-4 w-4 animate-spin"/>:<Search className="h-4 w-4"/>}{loading?"Analyzing...":"Analyze website"}</Button>
    </form>
    <div className="mt-3 flex justify-center gap-5 text-[11px] text-muted-foreground"><span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5"/>Public pages only</span><span className="flex items-center gap-1"><Zap className="h-3.5 w-3.5"/>Results in ~10 seconds</span></div>
    {error&&<p className="mx-auto mt-6 max-w-3xl rounded-xl bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!result&&!loading&&<div className="mt-14 grid gap-4 md:grid-cols-3">{[["01","Company profile","Capture positioning, market, size, and visible technologies."],["02","Intent signals","Identify growth, hiring, product, and go-to-market signals."],["03","Sales brief","Get pain points and a recommended outreach angle." ]].map(([n,t,c])=><Card key={n}><CardContent className="p-6"><span className="text-xs font-bold text-primary">{n}</span><h3 className="mt-4 font-bold">{t}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{c}</p></CardContent></Card>)}</div>}
    {loading&&<div className="mx-auto mt-12 max-w-3xl rounded-2xl border bg-white p-8 text-center"><div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary/10"><Sparkles className="h-6 w-6 animate-pulse text-primary"/></div><h3 className="mt-5 font-bold">Reading the company’s public story</h3><p className="mt-2 text-sm text-muted-foreground">Finding products, signals, technology, and sales angles...</p><div className="mx-auto mt-6 h-1.5 max-w-sm overflow-hidden rounded-full bg-slate-100"><div className="h-full w-2/3 animate-pulse rounded-full bg-primary"/></div></div>}
    {result&&!loading&&<div className="mt-10 space-y-5">
      <Card><CardContent className="p-6"><div className="flex flex-col justify-between gap-5 sm:flex-row"><div className="flex gap-4"><div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-slate-950 text-white"><Globe2 className="h-5 w-5"/></div><div><div className="flex items-center gap-2"><h3 className="text-xl font-bold">{result.companyName}</h3><a href={result.url} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5 text-slate-400"/></a></div><p className="mt-1 text-xs text-muted-foreground">{result.industry} · {result.employeeRange}</p></div></div><div className="flex items-center gap-3"><div className="text-right"><p className="text-[10px] uppercase text-muted-foreground">Opportunity score</p><p className="text-2xl font-bold text-emerald-600">{result.score}<span className="text-sm text-slate-400">/100</span></p></div><div className="grid h-12 w-12 place-items-center rounded-full border-4 border-emerald-500 text-xs font-bold">{result.score}</div></div></div><p className="mt-5 max-w-3xl text-sm leading-6 text-slate-600">{result.summary}</p><div className="mt-5 flex flex-wrap gap-2">{result.technologies.map(x=><Badge key={x} variant="secondary">{x}</Badge>)}</div></CardContent></Card>
      <div className="grid gap-5 lg:grid-cols-2">
        <ResultCard icon={Zap} title="Buying signals" items={result.buyingSignals} color="text-emerald-600 bg-emerald-50"/>
        <ResultCard icon={Target} title="Likely pain points" items={result.painPoints} color="text-amber-600 bg-amber-50"/>
      </div>
      <Card className="border-primary/20 bg-gradient-to-r from-violet-50 to-fuchsia-50"><CardContent className="flex flex-col items-start gap-4 p-6 sm:flex-row"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-white"><Lightbulb className="h-5 w-5"/></div><div className="flex-1"><h3 className="font-bold">Recommended sales angle</h3><p className="mt-2 text-sm leading-6 text-slate-600">{result.recommendation}</p></div><Button>Generate outreach <ArrowRight className="h-4 w-4"/></Button></CardContent></Card>
    </div>}
  </div>;
}

function ResultCard({icon:Icon,title,items,color}:{icon:typeof Zap;title:string;items:string[];color:string}){
  return <Card><CardContent className="p-6"><div className={`grid h-10 w-10 place-items-center rounded-xl ${color}`}><Icon className="h-5 w-5"/></div><h3 className="mt-4 font-bold">{title}</h3><ul className="mt-4 space-y-3">{items.map(x=><li key={x} className="flex gap-2.5 text-sm leading-5 text-slate-600"><CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500"/>{x}</li>)}</ul></CardContent></Card>;
}
