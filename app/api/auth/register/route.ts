import bcrypt from "bcryptjs";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { apiError } from "@/lib/api";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export async function POST(request: NextRequest) {
  try {
    const input = schema.parse(await request.json());
    const email = input.email.toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Account already exists. Please sign in." }, { status: 409 });
    await prisma.user.create({
      data: {
        email,
        name: email.split("@")[0],
        passwordHash: await bcrypt.hash(input.password, 12),
      },
    });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
