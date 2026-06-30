import { CampaignsWorkspace } from "@/components/campaigns-workspace";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCampaign, toLead } from "@/lib/db-mappers";
import { DataErrorState } from "@/components/data-error-state";

export default async function CampaignsPage() {
  const user = await requireUser();
  try {
    const [campaigns, leads] = await Promise.all([
      prisma.campaign.findMany({
        where: { userId: user.id },
        include: { steps: { orderBy: { stepOrder: "asc" } }, campaignLeads: { include: { lead: true } } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.lead.findMany({ where: { userId: user.id, email: { not: null } }, orderBy: [{ score: "desc" }, { createdAt: "desc" }], take: 25 }),
    ]);
    return <CampaignsWorkspace initialCampaigns={campaigns.map(toCampaign)} initialLeadCandidates={leads.map(toLead)} />;
  } catch (error) {
    console.error("Failed to load campaigns", error);
    return <DataErrorState title="Could not load campaigns" />;
  }
}
