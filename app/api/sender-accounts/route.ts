import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { encryptSecret } from "@/lib/encryption";
import { prisma } from "@/lib/prisma";
import { toSenderAccount } from "@/lib/db-mappers";

export const runtime = "nodejs";

const senderSchema = z.object({
  provider: z.enum(["gmail", "outlook", "smtp"]).default("smtp"),
  from_name: z.string().trim().min(2).max(100),
  from_email: z.string().trim().email(),
  reply_to: z.string().trim().email().nullable().optional(),
  smtp_host: z.string().trim().min(3).max(255),
  smtp_port: z.number().int().min(1).max(65535),
  smtp_username: z.string().trim().min(2).max(255),
  smtp_password: z.string().min(4).max(1000).optional(),
  daily_limit: z.number().int().min(1).max(2000).default(50),
});

export async function GET() {
  try {
    const user = await requireUser();
    const data = await prisma.senderAccount.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ senderAccounts: data.map((item) => ({ ...toSenderAccount(item), smtp_password_encrypted: null })) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = senderSchema.parse(await request.json());
    const data = await prisma.senderAccount.create({
      data: {
        userId: user.id,
        provider: input.provider,
        fromName: input.from_name,
        fromEmail: input.from_email,
        replyTo: input.reply_to ?? null,
        smtpHost: input.smtp_host,
        smtpPort: input.smtp_port,
        smtpUsername: input.smtp_username,
        smtpPasswordEncrypted: input.smtp_password ? encryptSecret(input.smtp_password) : null,
        dailyLimit: input.daily_limit,
      },
    });
    return NextResponse.json({ senderAccount: { ...toSenderAccount(data), smtp_password_encrypted: null } }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
