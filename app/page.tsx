import Link from "next/link";
import { ArrowRight, BarChart3, Check, Mail, Search, Sparkles, Target, Zap } from "lucide-react";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const features = [
  { icon: Search, title: "Discover your next best accounts", copy: "Filter prospects by role, company, industry and buying intent in seconds." },
  { icon: Target, title: "Score leads with real context", copy: "Prioritize every lead with transparent AI scoring and actionable fit signals." },
  { icon: Mail, title: "Write outreach that sounds human", copy: "Generate concise, personalized cold emails built around the right sales angle." },
  { icon: BarChart3, title: "Move deals through one pipeline", copy: "Keep every new, contacted, interested and closed lead visible to your team." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white">
      <nav className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 lg:px-8">
        <Logo />
        <div className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <a href="#features" className="hover:text-slate-950">Features</a>
          <a href="#how" className="hover:text-slate-950">How it works</a>
          <a href="#pricing" className="hover:text-slate-950">Pricing</a>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex"><Link href="/login">Log in</Link></Button>
          <Button asChild><Link href="/login">Start for free <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </nav>

      <section className="relative px-5 pb-24 pt-20 lg:pt-28">
        <div className="grid-fade absolute inset-x-0 top-0 -z-0 h-[650px]" />
        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <Badge className="mb-6 gap-1.5 border border-primary/15 bg-white px-3 py-1.5 shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> Your AI sales intelligence workspace
          </Badge>
          <h1 className="text-balance text-5xl font-bold tracking-[-0.045em] text-slate-950 sm:text-6xl lg:text-7xl">
            Find the leads that are <span className="bg-gradient-to-r from-primary to-fuchsia-500 bg-clip-text text-transparent">ready to buy.</span>
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-balance text-lg leading-8 text-slate-600">
            LeadSense combines prospecting, AI research, scoring, and personalized outreach so your team spends less time searching and more time closing.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 px-7 shadow-xl shadow-primary/20">
              <Link href="/login">Build your pipeline <ArrowRight className="h-4 w-4" /></Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 bg-white px-7">
              <Link href="/dashboard">Open dashboard</Link>
            </Button>
          </div>
          <p className="mt-4 text-xs text-slate-500">No credit card required · Set up in 2 minutes</p>
        </div>

        <div className="relative z-10 mx-auto mt-16 max-w-6xl rounded-2xl border border-slate-200 bg-slate-950 p-2 shadow-2xl shadow-slate-300/70">
          <div className="overflow-hidden rounded-xl border border-white/10 bg-slate-50">
            <div className="flex h-11 items-center gap-2 border-b bg-white px-4">
              <i className="h-2.5 w-2.5 rounded-full bg-rose-400" /><i className="h-2.5 w-2.5 rounded-full bg-amber-400" /><i className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
              <div className="mx-auto h-6 w-52 rounded-md bg-slate-100" />
            </div>
            <div className="grid min-h-[420px] grid-cols-[160px_1fr] sm:grid-cols-[210px_1fr]">
              <div className="border-r bg-white p-4">
                <Logo compact className="mb-8" />
                {["Overview", "Lead search", "Pipeline", "AI tools"].map((item, i) => (
                  <div key={item} className={`mb-2 rounded-lg px-3 py-2 text-xs font-medium ${i === 0 ? "bg-primary/10 text-primary" : "text-slate-500"}`}>{item}</div>
                ))}
              </div>
              <div className="p-4 sm:p-7">
                <div className="mb-6 flex items-center justify-between"><div><p className="text-xs text-slate-500">Good morning, Alex</p><h3 className="font-bold sm:text-xl">Your pipeline at a glance</h3></div><span className="rounded-lg bg-primary px-3 py-2 text-[10px] font-semibold text-white">Find leads</span></div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {[["Total leads","2,847","+12%"],["Qualified","1,204","+18%"],["Reply rate","18.4%","+4.2%"],["Won deals","$84k","+22%"]].map(([label,value,growth]) => (
                    <div key={label} className="rounded-xl border bg-white p-3 sm:p-4"><p className="text-[10px] text-slate-500">{label}</p><p className="mt-2 text-lg font-bold sm:text-2xl">{value}</p><p className="mt-1 text-[9px] font-semibold text-emerald-600">{growth} this month</p></div>
                  ))}
                </div>
                <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
                  <div className="h-48 rounded-xl border bg-white p-4">
                    <p className="text-xs font-semibold">Lead growth</p>
                    <div className="mt-8 flex h-24 items-end gap-2">
                      {[36,52,44,72,58,86,76,94,70,100].map((h, i) => <div key={i} style={{height:`${h}%`}} className="flex-1 rounded-t bg-gradient-to-t from-primary to-violet-300" />)}
                    </div>
                  </div>
                  <div className="h-48 rounded-xl border bg-white p-4"><p className="text-xs font-semibold">Lead quality</p><div className="mx-auto mt-5 grid h-24 w-24 place-items-center rounded-full border-[12px] border-primary border-r-violet-200 border-t-violet-100"><b>82</b></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="bg-slate-50 px-5 py-24">
        <div className="mx-auto max-w-6xl">
          <div className="max-w-2xl"><p className="text-sm font-bold text-primary">EVERYTHING IN ONE PLACE</p><h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">A sharper way to build pipeline</h2><p className="mt-4 text-slate-600">From first search to signed deal, every workflow is designed to keep your team focused on the leads that matter.</p></div>
          <div className="mt-12 grid gap-4 md:grid-cols-2">
            {features.map(({icon:Icon,title,copy}) => (
              <div key={title} className="rounded-2xl border bg-white p-7 shadow-sm transition-transform hover:-translate-y-1">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-5 text-lg font-bold">{title}</h3><p className="mt-2 leading-7 text-slate-600">{copy}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="px-5 py-24">
        <div className="mx-auto max-w-4xl rounded-3xl bg-slate-950 px-6 py-16 text-center text-white sm:px-16">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary"><Zap className="h-6 w-6" /></div>
          <h2 className="mt-6 text-3xl font-bold sm:text-4xl">Turn research into revenue.</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">Start with 100 free lead credits. Upgrade when your pipeline starts moving.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm text-slate-300">
            {["No setup fees","Cancel anytime","Export your data"].map(x => <span key={x} className="flex items-center gap-1.5"><Check className="h-4 w-4 text-emerald-400" />{x}</span>)}
          </div>
          <Button asChild size="lg" className="mt-8 bg-white text-slate-950 hover:bg-slate-100"><Link href="/login">Start free today <ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
      </section>
    </main>
  );
}
