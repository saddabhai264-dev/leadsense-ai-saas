import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getOpenAI, openAIModel, parseModelJson } from "@/lib/openai";
import { prisma } from "@/lib/prisma";
import type { EmailDraft } from "@/lib/types";

const schema = z.object({
  leadId: z.string().optional(),
  recipient: z.object({
    name: z.string().min(1),
    jobTitle: z.string().optional(),
    company: z.string().min(1),
    industry: z.string().optional(),
  }),
  offer: z.string().min(3).max(1000),
  tone: z.enum(["professional", "friendly", "direct", "curious"]).default("professional"),
  goal: z.string().max(500).default("Book a 15-minute discovery call"),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = schema.parse(await request.json());
    const openai = getOpenAI();
    if (!openai) return NextResponse.json({ error: "OpenAI is not configured" }, { status: 503 });

    const response = await openai.responses.create({
      model: openAIModel,
      input: [
        {
          role: "system",
          content: "Write a concise B2B cold email under 120 words. Use only supplied facts. Avoid hype, fake familiarity, clichés, and unsupported claims. Include one low-friction CTA.",
        },
        { role: "user", content: JSON.stringify(input) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "cold_email",
          strict: true,
          schema: {
            type: "object",
            properties: {
              subject: { type: "string" },
              body: { type: "string" },
              angle: { type: "string" },
              confidence: { type: "integer", minimum: 0, maximum: 100 },
            },
            required: ["subject", "body", "angle", "confidence"],
            additionalProperties: false,
          },
        },
      },
    });
    const draft = parseModelJson<EmailDraft>(response.output_text);
    await prisma.emailDraft.create({
      data: {
        userId: user.id,
        leadId: input.leadId ?? null,
        subject: draft.subject,
        body: draft.body,
        tone: input.tone,
      },
    });
    return NextResponse.json(draft);
  } catch (error) {
    return apiError(error);
  }
}
