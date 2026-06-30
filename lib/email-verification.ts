export const emailStatuses = ["unknown", "valid", "risky", "invalid"] as const;
export type EmailStatus = (typeof emailStatuses)[number];

export type EmailVerificationResult = {
  status: EmailStatus;
  confidence: number;
  reason: string;
};

const disposableDomains = new Set([
  "10minutemail.com",
  "guerrillamail.com",
  "mailinator.com",
  "tempmail.com",
  "yopmail.com",
  "throwawaymail.com",
]);

const freeDomains = new Set([
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "proton.me",
  "protonmail.com",
]);

export function verifyEmailFormat(email: string | null | undefined): EmailVerificationResult {
  if (!email) {
    return { status: "unknown", confidence: 0, reason: "No email address available." };
  }

  const normalized = email.trim().toLowerCase();
  const parts = normalized.split("@");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { status: "invalid", confidence: 95, reason: "Email format is invalid." };
  }

  const domain = parts[1];
  const validFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized);
  if (!validFormat) {
    return { status: "invalid", confidence: 95, reason: "Email format is invalid." };
  }

  if (disposableDomains.has(domain)) {
    return { status: "risky", confidence: 80, reason: "Disposable email domain detected." };
  }

  if (freeDomains.has(domain)) {
    return { status: "risky", confidence: 65, reason: "Free inbox domain; usable but weaker for B2B outreach." };
  }

  return { status: "unknown", confidence: 45, reason: "Format looks good. Domain mailbox records need verification." };
}
