import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { parseLeadsCsv } from "@/lib/csv";
import { prisma } from "@/lib/prisma";
import { toLead } from "@/lib/db-mappers";
import { isFileStorageConfigured, uploadFileToStorage } from "@/lib/storage";

const importSchema = z.object({
  csv: z.string().min(1).max(1024 * 1024),
});

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const { csv } = importSchema.parse(await request.json());
    const result = parseLeadsCsv(csv);
    if (!result.leads.length) {
      return NextResponse.json({ imported: 0, errors: result.errors, totalRows: result.totalRows }, { status: 400 });
    }

    const created = await prisma.$transaction(result.leads.map((lead) => prisma.lead.create({
      data: {
        userId: user.id,
        firstName: lead.first_name,
        lastName: lead.last_name,
        email: lead.email ?? null,
        phone: lead.phone ?? null,
        jobTitle: lead.job_title ?? null,
        companyName: lead.company_name,
        companyDomain: lead.company_domain ?? null,
        companySize: lead.company_size ?? null,
        industry: lead.industry ?? null,
        location: lead.location ?? null,
        linkedinUrl: lead.linkedin_url ?? null,
        source: lead.source,
        status: lead.status,
        notes: lead.notes ?? null,
      },
    })));

    let archivedCsv: { id: string; url: string | null } | null = null;
    if (isFileStorageConfigured()) {
      const uploaded = await uploadFileToStorage({
        userId: user.id,
        filename: `leads-import-${new Date().toISOString().slice(0, 10)}.csv`,
        contentType: "text/csv",
        body: Buffer.from(csv, "utf8"),
        purpose: "lead-import",
      });

      const storedFile = await prisma.storedFile.create({
        data: {
          userId: user.id,
          bucket: uploaded.bucket,
          key: uploaded.key,
          filename: uploaded.filename,
          contentType: uploaded.contentType,
          size: uploaded.size,
          url: uploaded.url,
          purpose: "lead-import",
        },
        select: { id: true, url: true },
      });
      archivedCsv = storedFile;
    }

    return NextResponse.json({
      imported: created.length,
      leads: created.map(toLead),
      errors: result.errors,
      totalRows: result.totalRows,
      archivedCsv,
    });
  } catch (error) {
    return apiError(error);
  }
}
