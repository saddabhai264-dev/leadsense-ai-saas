import { PipelineBoard } from "@/components/pipeline-board";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toLead } from "@/lib/db-mappers";
import { DataErrorState } from "@/components/data-error-state";

export default async function PipelinePage(){
  const user = await requireUser();
  try {
    const leads = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { updatedAt: "desc" } });
    return <PipelineBoard initialLeads={leads.map(toLead)} />;
  } catch (error) {
    console.error("Failed to load pipeline", error);
    return <DataErrorState title="Could not load pipeline" />;
  }
}
