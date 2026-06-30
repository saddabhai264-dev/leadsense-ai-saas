import { z } from "zod";
import type { LeadStatus } from "@/lib/types";

const headerAliases: Record<string, string> = {
  firstname: "first_name",
  first_name: "first_name",
  first: "first_name",
  lastname: "last_name",
  last_name: "last_name",
  last: "last_name",
  name: "name",
  fullname: "name",
  full_name: "name",
  email: "email",
  workemail: "email",
  work_email: "email",
  phone: "phone",
  title: "job_title",
  jobtitle: "job_title",
  job_title: "job_title",
  role: "job_title",
  company: "company_name",
  companyname: "company_name",
  company_name: "company_name",
  domain: "company_domain",
  companydomain: "company_domain",
  company_domain: "company_domain",
  website: "company_domain",
  companysize: "company_size",
  company_size: "company_size",
  employees: "company_size",
  industry: "industry",
  location: "location",
  city: "location",
  linkedin: "linkedin_url",
  linkedinurl: "linkedin_url",
  linkedin_url: "linkedin_url",
  status: "status",
  source: "source",
  notes: "notes",
};

export const csvLeadSchema = z.object({
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().max(100).default(""),
  email: z.string().trim().email().nullable().optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  job_title: z.string().trim().max(150).nullable().optional(),
  company_name: z.string().trim().min(1).max(200),
  company_domain: z.string().trim().max(255).nullable().optional(),
  company_size: z.string().trim().max(50).nullable().optional(),
  industry: z.string().trim().max(100).nullable().optional(),
  location: z.string().trim().max(150).nullable().optional(),
  linkedin_url: z.string().trim().url().nullable().optional(),
  source: z.string().trim().max(50).default("CSV Import"),
  status: z.enum(["new", "contacted", "interested", "closed"]).default("new"),
  notes: z.string().trim().max(1000).nullable().optional(),
});

export type CsvLeadInput = z.infer<typeof csvLeadSchema>;

export type CsvParseResult = {
  leads: CsvLeadInput[];
  errors: Array<{ row: number; message: string }>;
  totalRows: number;
};

export function parseLeadsCsv(csv: string): CsvParseResult {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) {
    return { leads: [], errors: [{ row: 1, message: "CSV needs a header row and at least one lead row." }], totalRows: 0 };
  }

  const headers = rows[0].map(normalizeHeader);
  const leads: CsvLeadInput[] = [];
  const errors: CsvParseResult["errors"] = [];
  const seen = new Set<string>();

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    if (row.every((value) => !value.trim())) return;

    const raw: Record<string, string> = {};
    headers.forEach((header, headerIndex) => {
      if (header) raw[header] = cleanCell(row[headerIndex] ?? "");
    });

    const normalized = normalizeLead(raw);
    const parsed = csvLeadSchema.safeParse(normalized);
    if (!parsed.success) {
      errors.push({
        row: rowNumber,
        message: parsed.error.issues.map((issue) => `${issue.path.join(".") || "row"} ${issue.message}`).join(", "),
      });
      return;
    }

    const key = (parsed.data.email || `${parsed.data.first_name}-${parsed.data.last_name}-${parsed.data.company_name}`).toLowerCase();
    if (seen.has(key)) {
      errors.push({ row: rowNumber, message: "Duplicate lead skipped in this CSV." });
      return;
    }

    seen.add(key);
    leads.push(parsed.data);
  });

  return { leads, errors, totalRows: rows.length - 1 };
}

function parseCsvRows(csv: string) {
  const rows: string[][] = [];
  let cell = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    const next = csv[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((items) => items.some((value) => value.trim()));
}

function normalizeHeader(header: string) {
  const key = header.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return headerAliases[key] ?? key;
}

function cleanCell(value: string) {
  return value.trim().replace(/^"|"$/g, "");
}

function nullIfEmpty(value?: string) {
  return value?.trim() ? value.trim() : null;
}

function normalizeLead(raw: Record<string, string>) {
  const nameParts = raw.name?.split(/\s+/).filter(Boolean) ?? [];
  const firstName = raw.first_name || nameParts[0] || "";
  const lastName = raw.last_name || nameParts.slice(1).join(" ");
  const status = normalizeStatus(raw.status);

  return {
    first_name: firstName,
    last_name: lastName,
    email: nullIfEmpty(raw.email),
    phone: nullIfEmpty(raw.phone),
    job_title: nullIfEmpty(raw.job_title),
    company_name: raw.company_name || "",
    company_domain: nullIfEmpty(raw.company_domain),
    company_size: nullIfEmpty(raw.company_size),
    industry: nullIfEmpty(raw.industry),
    location: nullIfEmpty(raw.location),
    linkedin_url: nullIfEmpty(raw.linkedin_url),
    source: raw.source || "CSV Import",
    status,
    notes: nullIfEmpty(raw.notes),
  };
}

function normalizeStatus(status?: string): LeadStatus {
  const value = status?.trim().toLowerCase();
  if (value === "contacted" || value === "interested" || value === "closed") return value;
  return "new";
}
