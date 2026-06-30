import crypto from "node:crypto";
import { assertProductionEncryptionKey } from "@/lib/env";

const algorithm = "aes-256-gcm";

export function encryptSecret(value: string) {
  const key = getKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv.toString("hex"), tag.toString("hex"), encrypted.toString("hex")].join(":");
}

export function decryptSecret(value: string) {
  const key = getKey();
  const [ivHex, tagHex, encryptedHex] = value.split(":");
  if (!ivHex || !tagHex || !encryptedHex) throw new Error("Invalid encrypted secret");
  const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(encryptedHex, "hex")), decipher.final()]).toString("utf8");
}

function getKey() {
  assertProductionEncryptionKey();
  const secret = process.env.APP_ENCRYPTION_KEY || process.env.NEXTAUTH_SECRET || "leadsense-dev-only-change-me";
  return crypto.createHash("sha256").update(secret).digest();
}
