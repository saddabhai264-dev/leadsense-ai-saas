import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toLead } from "@/lib/db-mappers";

const updateSchema = z.object({
  status: z.enum(["new", "contacted", "interested", "closed"]).optional(),
  notes: z.string().nullable().optional(),
  score: z.number().int().min(0).max(100).optional(),
  score_reason: z.string().nullable().optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    const input = updateSchema.parse(await request.json());
    const lead = await prisma.lead.update({
      where: { id, userId: user.id },
      data: {
        status: input.status,
        notes: input.notes,
        score: input.score,
        scoreReason: input.score_reason,
      },
    });
    return NextResponse.json({ lead: toLead(lead) });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    const { id } = await params;
    await prisma.lead.delete({ where: { id, userId: user.id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return apiError(error);
  }
}
