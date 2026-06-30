import { DashboardOverview } from "@/components/dashboard-overview";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLead } from "@/lib/db-mappers";
import { DataErrorState } from "@/components/data-error-state";

export default async function DashboardPage() {
  const user = await requireUser();
  try {
    const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: [{ score: "desc" }, { createdAt: "desc" }], take: 100 });
    return <DashboardOverview leads={leads.map(toLead)} userName={user.name || user.email?.split("@")[0] || "User"} />;
  } catch (error) {
    console.error("Failed to load dashboard", error);
    return <DataErrorState title="Could not load dashboard" />;
  }
}
