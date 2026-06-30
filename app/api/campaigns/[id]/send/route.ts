import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { decryptSecret } from "@/lib/encryption";
import { sendSmtpMail } from "@/lib/smtp";
import { prisma } from "@/lib/prisma";
import type { Lead } from "@/lib/types";
import { toLead } from "@/lib/db-mappers";

export const runtime = "nodejs";

const schema = z.object({
  senderAccountId: z.string().optional(),
  limit: z.number().int().min(1).max(25).default(10),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id: campaignId } = await params;
    const input = schema.parse(await request.json().catch(() => ({})));
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId, userId: user.id },
      include: { steps: { orderBy: { stepOrder: "asc" } } },
    });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (!campaign.steps.length) return NextResponse.json({ error: "Campaign has no email steps" }, { status: 400 });
    const sender = input.senderAccountId
      ? await prisma.senderAccount.findFirst({ where: { id: input.senderAccountId, userId: user.id } })
      : await prisma.senderAccount.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    if (!sender) return NextResponse.json({ error: "No sender account found. Connect one first." }, { status: 400 });
    if (!sender.smtpPasswordEncrypted) return NextResponse.json({ error: "Sender account is missing an SMTP password." }, { status: 400 });

    const queue = await prisma.campaignLead.findMany({
      where: { campaignId, status: "queued" },
      include: { lead: true },
      take: input.limit,
    });
    if (!queue.length) return NextResponse.json({ sent: 0, failed: 0, message: "No queued leads found." });

    const password = decryptSecret(sender.smtpPasswordEncrypted);
    let sent = 0;
    let failed = 0;

    for (const item of queue) {
      const step = campaign.steps.find((candidate) => candidate.stepOrder === item.currentStep) ?? campaign.steps[0];
      const lead = toLead(item.lead);
      if (!lead.email || !step) {
        failed++;
        continue;
      }
      const subject = personalize(step.subject, lead);
      const body = `${personalize(step.body, lead)}\n\n--\nSent with LeadSense AI`;
      try {
        await sendSmtpMail({
          host: sender.smtpHost,
          port: sender.smtpPort,
          username: sender.smtpUsername,
          password,
          fromName: sender.fromName,
          fromEmail: sender.fromEmail,
          replyTo: sender.replyTo,
        }, {
          to: lead.email,
          subject,
          text: body,
          headers: { "X-LeadSense-Campaign": campaignId, "X-LeadSense-Lead": lead.id },
        });
        sent++;
        const now = new Date();
        await prisma.campaignLead.update({ where: { id: item.id }, data: { status: "sent", sentAt: now } });
        await prisma.lead.update({ where: { id: lead.id }, data: { status: "contacted", lastContactedAt: now } });
        await prisma.emailEvent.create({ data: { userId: user.id, campaignId, leadId: lead.id, senderAccountId: sender.id, eventType: "sent", subject, metadata: { step: step.stepOrder, to: lead.email } } });
      } catch (error) {
        failed++;
        await prisma.emailEvent.create({ data: { userId: user.id, campaignId, leadId: lead.id, senderAccountId: sender.id, eventType: "failed", subject, metadata: { error: error instanceof Error ? error.message : "Unknown SMTP error" } } });
      }
    }
    return NextResponse.json({ sent, failed });
  } catch (error) {
    return apiError(error);
  }
}

function personalize(template: string, lead: Lead) {
  return template
    .replaceAll("{{first_name}}", lead.first_name)
    .replaceAll("{{last_name}}", lead.last_name)
    .replaceAll("{{company}}", lead.company_name)
    .replaceAll("{{title}}", lead.job_title ?? "your role")
    .replaceAll("{{industry}}", lead.industry ?? "your industry");
}
