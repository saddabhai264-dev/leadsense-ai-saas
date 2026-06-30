import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { toCampaign } from "@/lib/db-mappers";

const stepSchema = z.object({
  delay_days: z.number().int().min(0).max(60),
  subject: z.string().trim().min(3).max(200),
  body: z.string().trim().min(20).max(4000),
});

const createCampaignSchema = z.object({
  name: z.string().trim().min(2).max(120),
  audience: z.string().trim().min(2).max(240),
  offer: z.string().trim().min(10).max(1000),
  goal: z.string().trim().min(2).max(180).default("Book a discovery call"),
  status: z.enum(["draft", "active", "paused", "completed"]).default("draft"),
  steps: z.array(stepSchema).min(1).max(5),
});

export async function GET() {
  try {
    const user = await requireUser();
    const campaigns = await prisma.campaign.findMany({
      where: { userId: user.id },
      include: { steps: { orderBy: { stepOrder: "asc" } }, campaignLeads: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ campaigns: campaigns.map(toCampaign) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = createCampaignSchema.parse(await request.json());
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: input.name,
        audience: input.audience,
        offer: input.offer,
        goal: input.goal,
        status: input.status,
        steps: {
          create: input.steps.map((step, index) => ({
            stepOrder: index + 1,
            delayDays: step.delay_days,
            subject: step.subject,
            body: step.body,
          })),
        },
      },
      include: { steps: { orderBy: { stepOrder: "asc" } }, campaignLeads: true },
    });
    return NextResponse.json({ campaign: toCampaign(campaign) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
