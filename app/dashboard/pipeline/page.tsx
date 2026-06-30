import { PipelineBoard } from "@/components/pipeline-board";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLead } from "@/lib/db-mappers";

export default async function PipelinePage(){
  const user = await requireUser();
  const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
  return <PipelineBoard initialLeads={leads.map(toLead)} />;
}
