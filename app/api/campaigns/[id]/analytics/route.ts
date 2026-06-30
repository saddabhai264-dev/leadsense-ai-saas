import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id: campaignId } = await params;
    const campaign = await prisma.campaign.findFirst({ where: { id: campaignId, userId: user.id }, select: { id: true, totalLeads: true } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    const campaignLeads = await prisma.campaignLead.findMany({ where: { campaignId }, select: { status: true } });
    const events = await prisma.emailEvent.findMany({ where: { campaignId, userId: user.id }, select: { eventType: true } });
    const statuses = countBy(campaignLeads, "status");
    const eventCounts = countBy(events, "eventType");
    const sent = Number(statuses.sent ?? 0) + Number(statuses.replied ?? 0) + Number(statuses.bounced ?? 0);
    const replied = Number(statuses.replied ?? 0);
    const bounced = Number(statuses.bounced ?? 0);
    const queued = Number(statuses.queued ?? 0);
    const replyRate = sent ? Number(((replied / sent) * 100).toFixed(1)) : 0;
    const bounceRate = sent ? Number(((bounced / sent) * 100).toFixed(1)) : 0;
    await prisma.campaign.update({ where: { id: campaignId }, data: { replyRate } });
    return NextResponse.json({
      analytics: { total: campaignLeads.length || campaign.totalLeads, queued, sent, replied, bounced, failed: Number(eventCounts.failed ?? 0), opened: Number(eventCounts.opened ?? 0), clicked: Number(eventCounts.clicked ?? 0), replyRate, bounceRate },
    });
  } catch (error) {
    return apiError(error);
  }
}

function countBy<T extends Record<string, unknown>>(rows: T[], key: keyof T) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    const value = String(row[key] ?? "unknown");
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
}
