const fs = require("node:fs");
const path = require("node:path");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const aliases = {
  firstname: "firstName",
  first_name: "firstName",
  first: "firstName",
  lastname: "lastName",
  last_name: "lastName",
  last: "lastName",
  name: "name",
  fullname: "name",
  full_name: "name",
  email: "email",
  workemail: "email",
  work_email: "email",
  phone: "phone",
  title: "jobTitle",
  jobtitle: "jobTitle",
  job_title: "jobTitle",
  role: "jobTitle",
  company: "companyName",
  companyname: "companyName",
  company_name: "companyName",
  domain: "companyDomain",
  companydomain: "companyDomain",
  company_domain: "companyDomain",
  website: "companyDomain",
  companysize: "companySize",
  company_size: "companySize",
  employees: "companySize",
  industry: "industry",
  location: "location",
  city: "location",
  linkedin: "linkedinUrl",
  linkedinurl: "linkedinUrl",
  linkedin_url: "linkedinUrl",
  status: "status",
  source: "source",
  notes: "notes",
};

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.user || !args.file) {
    console.error("Usage: npm run seed:leads -- --user you@company.com --file ./real-leads.csv");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: args.user.toLowerCase() } });
  if (!user) {
    console.error(`No user found for ${args.user}. Create/register this user first, then run the import.`);
    process.exit(1);
  }

  const csvPath = path.resolve(process.cwd(), args.file);
  const csv = fs.readFileSync(csvPath, "utf8");
  const { leads, errors } = parseLeadsCsv(csv);

  let imported = 0;
  let skipped = 0;

  for (const lead of leads) {
    if (lead.email) {
      const existing = await prisma.lead.findFirst({
        where: { userId: user.id, email: lead.email },
        select: { id: true },
      });
      if (existing) {
        skipped++;
        continue;
      }
    }

    await prisma.lead.create({
      data: {
        userId: user.id,
        firstName: lead.firstName,
        lastName: lead.lastName || "",
        email: lead.email || null,
        phone: lead.phone || null,
        jobTitle: lead.jobTitle || null,
        companyName: lead.companyName,
        companyDomain: lead.companyDomain || null,
        companySize: lead.companySize || null,
        industry: lead.industry || null,
        location: lead.location || null,
        linkedinUrl: lead.linkedinUrl || null,
        status: lead.status,
        source: lead.source || "Real CSV Seed",
        notes: lead.notes || null,
      },
    });
    imported++;
  }

  console.log(`Imported real leads: ${imported}`);
  console.log(`Skipped existing leads: ${skipped}`);
  if (errors.length) {
    console.log(`Rows with errors: ${errors.length}`);
    errors.slice(0, 20).forEach((error) => console.log(`Row ${error.row}: ${error.message}`));
    if (errors.length > 20) console.log(`...and ${errors.length - 20} more`);
  }
}

function parseArgs(args) {
  const result = {};
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const value = args[i + 1];
    if (key && value) result[key] = value;
  }
  return result;
}

function parseLeadsCsv(csv) {
  const rows = parseCsvRows(csv);
  if (rows.length < 2) return { leads: [], errors: [{ row: 1, message: "CSV needs a header row and at least one lead row." }] };

  const headers = rows[0].map(normalizeHeader);
  const leads = [];
  const errors = [];
  const seen = new Set();

  rows.slice(1).forEach((row, index) => {
    const rowNumber = index + 2;
    if (row.every((value) => !value.trim())) return;

    const raw = {};
    headers.forEach((header, headerIndex) => {
      if (header) raw[header] = cleanCell(row[headerIndex] || "");
    });

    const lead = normalizeLead(raw);
    const validationError = validateLead(lead);
    if (validationError) {
      errors.push({ row: rowNumber, message: validationError });
      return;
    }

    const key = (lead.email || `${lead.firstName}-${lead.lastName}-${lead.companyName}`).toLowerCase();
    if (seen.has(key)) {
      errors.push({ row: rowNumber, message: "Duplicate lead skipped in this CSV." });
      return;
    }
    seen.add(key);
    leads.push(lead);
  });

  return { leads, errors };
}

function parseCsvRows(csv) {
  const rows = [];
  let cell = "";
  let row = [];
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

function normalizeHeader(header) {
  const key = header.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return aliases[key] || key;
}

function cleanCell(value) {
  return value.trim().replace(/^"|"$/g, "");
}

function normalizeLead(raw) {
  const nameParts = raw.name?.split(/\s+/).filter(Boolean) || [];
  return {
    firstName: raw.firstName || nameParts[0] || "",
    lastName: raw.lastName || nameParts.slice(1).join(" "),
    email: nullIfEmpty(raw.email)?.toLowerCase(),
    phone: nullIfEmpty(raw.phone),
    jobTitle: nullIfEmpty(raw.jobTitle),
    companyName: raw.companyName || "",
    companyDomain: nullIfEmpty(raw.companyDomain),
    companySize: nullIfEmpty(raw.companySize),
    industry: nullIfEmpty(raw.industry),
    location: nullIfEmpty(raw.location),
    linkedinUrl: nullIfEmpty(raw.linkedinUrl),
    status: normalizeStatus(raw.status),
    source: raw.source || "Real CSV Seed",
    notes: nullIfEmpty(raw.notes),
  };
}

function validateLead(lead) {
  if (!lead.firstName) return "firstName/name is required.";
  if (!lead.companyName) return "company/companyName is required.";
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return "email is invalid.";
  if (lead.linkedinUrl && !/^https?:\/\//i.test(lead.linkedinUrl)) return "linkedinUrl must start with http:// or https://.";
  return null;
}

function normalizeStatus(status) {
  const value = status?.trim().toLowerCase();
  if (["new", "contacted", "interested", "closed"].includes(value)) return value;
  return "new";
}

function nullIfEmpty(value) {
  return value && value.trim() ? value.trim() : null;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
