import { AppShell } from "@/components/app-shell";
import { getUser } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();
  if (!user) redirect("/login?next=/dashboard");
  return (
    <AppShell user={{
      name: user.name || user.email?.split("@")[0] || "User",
      email: user.email || "",
    }}>
      {children}
    </AppShell>
  );
}
