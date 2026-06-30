"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AuthForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/dashboard";

  async function googleLogin() {
    await signIn("google", { callbackUrl: next });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (mode === "signup") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        if (!response.ok) {
          const result = await response.json().catch(() => null);
          setMessage(result?.error ?? "Could not create account.");
          return;
        }
      }

      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) setMessage("Invalid email or password.");
      else router.push(next);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <Button type="button" variant="outline" className="h-11 w-full bg-white" onClick={googleLogin}>
        <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.9h5.4a4.6 4.6 0 0 1-2 3v2.6h3.2c1.9-1.8 3-4.3 3-7.5Z"/><path fill="#34A853" d="M12 22c2.7 0 5-.9 6.6-2.3l-3.2-2.6c-.9.6-2 1-3.4 1a5.8 5.8 0 0 1-5.5-4H3.2v2.6A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.5 14a6 6 0 0 1 0-4V7.4H3.2a10 10 0 0 0 0 9.2L6.5 14Z"/><path fill="#EA4335" d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.8A9.7 9.7 0 0 0 3.2 7.4L6.5 10A5.8 5.8 0 0 1 12 6Z"/></svg>
        Continue with Google
      </Button>
      <div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-border" /><span className="text-xs text-muted-foreground">OR CONTINUE WITH EMAIL</span><div className="h-px flex-1 bg-border" /></div>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="mb-1.5 block text-sm font-medium">Work email</label><Input type="email" placeholder="you@company.com" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div><div className="mb-1.5 flex justify-between"><label className="text-sm font-medium">Password</label>{mode === "login" && <span className="text-xs font-medium text-primary">Forgot password?</span>}</div><Input type="password" placeholder="At least 8 characters" minLength={8} value={password} onChange={e => setPassword(e.target.value)} required /></div>
        {message && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{message}</p>}
        <Button className="h-11 w-full" disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}{mode === "login" ? "Sign in" : "Create free account"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {mode === "login" ? "New to LeadSense?" : "Already have an account?"}{" "}
        <button onClick={() => setMode(mode === "login" ? "signup" : "login")} className="font-semibold text-primary hover:underline">{mode === "login" ? "Create an account" : "Sign in"}</button>
      </p>
    </div>
  );
}
