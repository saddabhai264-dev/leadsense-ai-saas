import Link from "next/link";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-2.5 font-bold tracking-tight", className)}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-white shadow-lg shadow-primary/20">
        <Sparkles className="h-4 w-4" />
      </span>
      {!compact && <span className="text-lg">LeadSense<span className="text-primary"> AI</span></span>}
    </Link>
  );
}
