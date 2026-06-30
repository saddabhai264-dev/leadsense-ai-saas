import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { apiError } from "@/lib/api";
import { requireUser } from "@/lib/auth";
import { getOpenAI, openAIModel, parseModelJson } from "@/lib/openai";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  leadId: z.string().optional(),
  lead: z.object({
    firstName: z.string(),
    lastName: z.string().optional(),
    jobTitle: z.string().nullable().optional(),
    companyName: z.string(),
    companySize: z.string().nullable().optional(),
    industry: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
  }),
});

type ScoreResult = { score: number; reason: string; signals: string[] };

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
          content: "You are a B2B sales intelligence analyst. Score the lead from 0-100 for likely value and purchase intent. Be specific, sober, and concise. Never invent facts not present in the lead.",
        },
        { role: "user", content: JSON.stringify(input.lead) },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "lead_score",
          strict: true,
          schema: {
            type: "object",
            properties: {
              score: { type: "integer", minimum: 0, maximum: 100 },
              reason: { type: "string" },
              signals: { type: "array", items: { type: "string" }, maxItems: 4 },
            },
            required: ["score", "reason", "signals"],
            additionalProperties: false,
          },
        },
      },
    });
    const result = parseModelJson<ScoreResult>(response.output_text);

    if (input.leadId) {
      await prisma.lead.updateMany({ where: { id: input.leadId, userId: user.id }, data: { score: result.score, scoreReason: result.reason } });
    }
    return NextResponse.json(result);
  } catch (error) {
    return apiError(error);
  }
}
