import { LeadsWorkspace } from "@/components/leads-workspace";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLead } from "@/lib/db-mappers";

export default async function LeadsPage() {
  const user = await requireUser();
  const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
  return <LeadsWorkspace initialLeads={leads.map(toLead)} />;
}
