export type FeatureStatus = {
  name: string;
  configured: boolean;
  missing: string[];
};

const coreEnv = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "AUTH_URL",
  "NEXT_PUBLIC_APP_URL",
  "APP_ENCRYPTION_KEY",
] as const;

const featureEnv: Record<string, string[]> = {
  googleAuth: ["AUTH_GOOGLE_ID", "AUTH_GOOGLE_SECRET"],
  openai: ["OPENAI_API_KEY"],
  r2Storage: ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"],
  cloudinaryStorage: ["CLOUDINARY_CLOUD_NAME", "CLOUDINARY_API_KEY", "CLOUDINARY_API_SECRET"],
  stripe: ["STRIPE_SECRET_KEY", "STRIPE_PRO_PRICE_ID", "STRIPE_WEBHOOK_SECRET"],
};

export function missingCoreEnv() {
  return coreEnv.filter((key) => !process.env[key]);
}

export function featureStatuses(): FeatureStatus[] {
  return Object.entries(featureEnv).map(([name, keys]) => {
    const missing = keys.filter((key) => !process.env[key]);
    return { name, configured: missing.length === 0, missing };
  });
}

export function assertProductionEncryptionKey() {
  if (process.env.NODE_ENV !== "production") return;
  const key = process.env.APP_ENCRYPTION_KEY;
  if (!key || key.length < 32) {
    throw new Error("APP_ENCRYPTION_KEY must be set to a strong 32+ character secret in production.");
  }
}
