import { Suspense } from "react";
import { CheckCircle2 } from "lucide-react";
import { Logo } from "@/components/logo";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex flex-col bg-white p-6 sm:p-10">
        <Logo />
        <div className="mx-auto my-auto w-full max-w-sm py-16">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to LeadSense</h1>
          <p className="mt-2 text-muted-foreground">Build a higher-quality pipeline with less busywork.</p>
          <div className="mt-8"><Suspense><AuthForm /></Suspense></div>
          <p className="mt-7 text-center text-xs leading-5 text-muted-foreground">By continuing, you agree to our Terms of Service and Privacy Policy.</p>
        </div>
      </section>
      <section className="relative hidden overflow-hidden bg-slate-950 p-12 text-white lg:flex lg:flex-col lg:justify-center">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-fuchsia-600/20 blur-3xl" />
        <div className="relative mx-auto max-w-lg">
          <div className="mb-8 inline-flex rounded-2xl bg-white/10 p-3"><span className="text-2xl">✦</span></div>
          <blockquote className="text-balance text-3xl font-semibold leading-tight">“LeadSense gives us the context to know who to contact, why now, and exactly what to say.”</blockquote>
          <div className="mt-8 flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 font-bold">RT</div><div><p className="font-semibold">Revenue team</p><p className="text-sm text-slate-400">B2B growth workspace</p></div></div>
          <div className="mt-12 grid grid-cols-3 gap-3">
            {[["3.2×","more replies"],["42%","less research"],["18h","saved weekly"]].map(([value,label]) => <div key={label} className="rounded-xl border border-white/10 bg-white/5 p-4"><p className="text-xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-400">{label}</p></div>)}
          </div>
          <p className="mt-8 flex items-center gap-2 text-sm text-slate-400"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Trusted by 1,200+ revenue teams</p>
        </div>
      </section>
    </main>
  );
}
