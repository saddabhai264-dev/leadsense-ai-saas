import { LeadsWorkspace } from "@/components/leads-workspace";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLead } from "@/lib/db-mappers";
import { DataErrorState } from "@/components/data-error-state";

export default async function LeadsPage() {
  const user = await requireUser();
  try {
    const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return <LeadsWorkspace initialLeads={leads.map(toLead)} />;
  } catch (error) {
    console.error("Failed to load leads", error);
    return <DataErrorState title="Could not load leads" />;
  }
}
