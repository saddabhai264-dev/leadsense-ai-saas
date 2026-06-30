"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  BarChart3, Bell, ChevronDown, CreditCard, Globe2, LayoutDashboard, LogOut, Mail, Menu,
  Search, Settings, Sparkles, Target, Users, X,
} from "lucide-react";
import { Logo } from "@/components/logo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, initials } from "@/lib/utils";

const nav = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Lead search", href: "/dashboard/leads", icon: Search },
  { label: "Campaigns", href: "/dashboard/campaigns", icon: Mail },
  { label: "Pipeline", href: "/dashboard/pipeline", icon: BarChart3 },
];
const aiNav = [
  { label: "Website analyzer", href: "/dashboard/analyzer", icon: Globe2 },
  { label: "Email generator", href: "/dashboard/email-generator", icon: Mail },
  { label: "Sending accounts", href: "/dashboard/sending", icon: Settings },
  { label: "Billing", href: "/dashboard/billing", icon: CreditCard },
];

export function AppShell({ children, user }: { children: React.ReactNode; user: { name: string; email: string } }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const title = [...nav, ...aiNav].find((item) => item.href === pathname)?.label || "Overview";

  async function logout() {
    await signOut({ callbackUrl: "/" });
  }

  const Sidebar = () => (
    <div className="flex h-full flex-col">
      <div className="flex h-20 items-center justify-between px-5"><Logo /><button className="lg:hidden" onClick={() => setMobileOpen(false)}><X className="h-5 w-5" /></button></div>
      <nav className="flex-1 space-y-7 px-3 py-3">
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Workspace</p>
          {nav.map(({label,href,icon:Icon}) => {
            const active = pathname === href;
            return <Link key={href} onClick={() => setMobileOpen(false)} href={href} className={cn("mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors", active ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><Icon className="h-[18px] w-[18px]" />{label}{label === "Lead search" && <span className="ml-auto rounded bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">AI</span>}</Link>;
          })}
        </div>
        <div>
          <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">AI tools</p>
          {aiNav.map(({label,href,icon:Icon}) => <Link key={href} onClick={() => setMobileOpen(false)} href={href} className={cn("mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium", pathname === href ? "bg-primary/10 text-primary" : "text-slate-600 hover:bg-slate-100 hover:text-slate-950")}><Icon className="h-[18px] w-[18px]" />{label}</Link>)}
        </div>
      </nav>
      <div className="m-3 rounded-xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-4">
        <div className="flex items-center gap-2 text-xs font-semibold"><Sparkles className="h-4 w-4 text-primary" /> Free plan</div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white"><div className="h-full w-[62%] rounded-full bg-primary" /></div>
        <p className="mt-2 text-[10px] text-slate-500">62 of 100 AI credits used</p>
        <button className="mt-3 text-xs font-bold text-primary">Upgrade plan →</button>
      </div>
      <div className="border-t p-3">
        <button className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-slate-100">
          <Avatar><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar>
          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{user.name}</span><span className="block truncate text-[11px] text-slate-500">{user.email}</span></span>
          <ChevronDown className="h-4 w-4 text-slate-400" />
        </button>
        <button onClick={logout} className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs text-slate-500 hover:bg-rose-50 hover:text-rose-600"><LogOut className="h-4 w-4" /> Sign out</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r bg-white lg:block"><Sidebar /></aside>
      {mobileOpen && <div className="fixed inset-0 z-50 lg:hidden"><button aria-label="Close menu" className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} /><aside className="relative h-full w-72 bg-white shadow-2xl"><Sidebar /></aside></div>}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b bg-white/90 px-4 backdrop-blur-xl sm:px-7">
          <div className="flex items-center gap-3"><button className="lg:hidden" onClick={() => setMobileOpen(true)}><Menu className="h-5 w-5" /></button><div><p className="text-xs text-muted-foreground">Workspace</p><h1 className="font-bold">{title}</h1></div></div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="relative rounded-full"><Bell className="h-4 w-4" /><i className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" /></Button>
            <Button asChild className="hidden sm:flex"><Link href="/dashboard/leads"><Target className="h-4 w-4" /> Find leads</Link></Button>
            <button className="ml-1 hidden rounded-full sm:block"><Avatar><AvatarFallback>{initials(user.name)}</AvatarFallback></Avatar></button>
          </div>
        </header>
        <main className="p-4 sm:p-7">{children}</main>
      </div>
    </div>
  );
}
