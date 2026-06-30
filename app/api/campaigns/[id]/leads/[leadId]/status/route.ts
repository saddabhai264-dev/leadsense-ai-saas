import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCampaignLead } from "@/lib/db-mappers";

const schema = z.object({ status: z.enum(["replied", "bounced", "unsubscribed"]) });

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; leadId: string }> }) {
  try {
    const user = await requireUser();
    const { id: campaignId, leadId } = await params;
    const { status } = schema.parse(await request.json());
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id }, select: { id: true } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const now = new Date();
    const update = status === "replied" ? { status, repliedAt: now } : status === "bounced" ? { status, bouncedAt: now } : { status };
    const campaignLead = await prisma.campaignLead.update({
      where: { campaignId_leadId: { campaignId, leadId } },
      data: update,
    });
    await prisma.emailEvent.create({
      data: {
        userId: user.id,
        campaignId,
        leadId,
        senderAccountId: null,
        eventType: status === "replied" ? "replied" : status === "bounced" ? "bounced" : "failed",
        metadata: { source: "manual" },
      },
    });
    return NextResponse.json({ campaignLead: toCampaignLead(campaignLead) });
  } catch (error) {
    return apiError(error);
  }
}
