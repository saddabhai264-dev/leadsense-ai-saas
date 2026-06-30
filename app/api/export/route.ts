import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { apiError } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { toLead } from "@/lib/db-mappers";

const csvCell = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export async function GET() {
  try {
    const user = await requireUser();
    const data = await prisma.lead.findMany({ where: { userId: user.id }, orderBy: { createdAt: "asc" } });
    const headers = ["First name", "Last name", "Email", "Email status", "Email confidence", "Title", "Company", "Domain", "Industry", "Location", "Status", "Score", "Source", "Created"];
    const rows = data.map(toLead).map((lead) => [
      lead.first_name, lead.last_name, lead.email, lead.email_status, lead.email_confidence, lead.job_title, lead.company_name, lead.company_domain,
      lead.industry, lead.location, lead.status, lead.score, lead.source, lead.created_at,
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="leadsense-leads-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return apiError(error);
  }
}
