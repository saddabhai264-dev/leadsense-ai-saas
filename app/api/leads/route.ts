import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toLead } from "@/lib/db-mappers";

const createLeadSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().max(100).default(""),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(40).nullable().optional(),
  job_title: z.string().max(150).nullable().optional(),
  company_name: z.string().trim().min(1).max(200),
  company_domain: z.string().max(255).nullable().optional(),
  company_size: z.string().max(50).nullable().optional(),
  industry: z.string().max(100).nullable().optional(),
  location: z.string().max(150).nullable().optional(),
  linkedin_url: z.string().url().nullable().optional(),
  source: z.string().max(50).default("Manual"),
  status: z.enum(["new", "contacted", "interested", "closed"]).default("new"),
});

export async function GET(request: NextRequest) {
  try {
    const user = await requireUser();
    const search = request.nextUrl.searchParams.get("search")?.trim();
    const status = request.nextUrl.searchParams.get("status");
    const leads = await prisma.lead.findMany({
      where: {
        userId: user.id,
        ...(status && ["new", "contacted", "interested", "closed"].includes(status) ? { status: status as any } : {}),
        ...(search ? {
          OR: [
            { firstName: { contains: search, mode: "insensitive" } },
            { lastName: { contains: search, mode: "insensitive" } },
            { companyName: { contains: search, mode: "insensitive" } },
            { jobTitle: { contains: search, mode: "insensitive" } },
          ],
        } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ leads: leads.map(toLead) });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = createLeadSchema.parse(await request.json());
    const lead = await prisma.lead.create({
      data: {
        userId: user.id,
        firstName: input.first_name,
        lastName: input.last_name,
        email: input.email ?? null,
        phone: input.phone ?? null,
        jobTitle: input.job_title ?? null,
        companyName: input.company_name,
        companyDomain: input.company_domain ?? null,
        companySize: input.company_size ?? null,
        industry: input.industry ?? null,
        location: input.location ?? null,
        linkedinUrl: input.linkedin_url ?? null,
        source: input.source,
        status: input.status,
      },
    });
    return NextResponse.json({ lead: toLead(lead) }, { status: 201 });
  } catch (error) {
    return apiError(error);
  }
}
