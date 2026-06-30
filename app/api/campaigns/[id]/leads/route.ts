import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const assignSchema = z.object({
  leadIds: z.array(z.string()).min(1).max(100),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id: campaignId } = await params;
    const { leadIds } = assignSchema.parse(await request.json());
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id }, select: { id: true } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const ownedLeads = await prisma.lead.findMany({ where: { userId: user.id, id: { in: leadIds } }, select: { id: true } });
    if (!ownedLeads.length) return NextResponse.json({ added: 0, total: 0 });

    await prisma.$transaction(ownedLeads.map((lead) => prisma.campaignLead.upsert({
      where: { campaignId_leadId: { campaignId, leadId: lead.id } },
      update: {},
      create: { campaignId, leadId: lead.id },
    })));
    const total = await prisma.campaignLead.count({ where: { campaignId } });
    await prisma.campaign.update({ where: { id: campaignId }, data: { totalLeads: total } });
    return NextResponse.json({ added: ownedLeads.length, total });
  } catch (error) {
    return apiError(error);
  }
}
