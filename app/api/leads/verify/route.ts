import { promises as dns } from "node:dns";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { verifyEmailFormat, type EmailVerificationResult } from "@/lib/email-verification";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const schema = z.object({
  leadIds: z.array(z.string()).max(50).optional(),
});

type VerifiedLead = { id: string; email: string | null };

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = schema.parse(await request.json().catch(() => ({})));
    const leads = await prisma.lead.findMany({
      where: { userId: user.id, email: { not: null }, ...(input.leadIds?.length ? { id: { in: input.leadIds } } : {}) },
      take: 50,
      select: { id: true, email: true },
    });
    const verified = await Promise.all(leads.map((lead) => verifyLead(lead)));

    await prisma.$transaction(verified.map((lead) => prisma.lead.update({
      where: { id: lead.id },
      data: {
        emailStatus: lead.status,
        emailConfidence: lead.confidence,
        emailVerificationReason: lead.reason,
        emailVerifiedAt: new Date(),
      },
    })));

    return NextResponse.json({ verified });
  } catch (error) {
    return apiError(error);
  }
}

async function verifyLead(lead: VerifiedLead) {
  const base = verifyEmailFormat(lead.email);
  if (base.status === "invalid" || base.status === "risky" || !lead.email) return { id: lead.id, ...base };
  const domain = lead.email.split("@")[1]?.toLowerCase();
  return { id: lead.id, ...(await verifyDomain(domain)) };
}

async function verifyDomain(domain?: string): Promise<EmailVerificationResult> {
  if (!domain) return { status: "invalid", confidence: 95, reason: "Email domain is missing." };
  try {
    const records = await dns.resolveMx(domain);
    if (records.length > 0) return { status: "valid", confidence: 88, reason: "Domain has active MX records for receiving email." };
  } catch {
    try {
      await dns.resolve4(domain);
      return { status: "risky", confidence: 55, reason: "Domain exists, but no MX records were found." };
    } catch {
      return { status: "invalid", confidence: 90, reason: "Domain could not be resolved." };
    }
  }
  return { status: "risky", confidence: 55, reason: "Domain exists, but no MX records were found." };
}
