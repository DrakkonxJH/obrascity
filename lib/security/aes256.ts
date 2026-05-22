import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const PREFIX = "enc:v1";

function decodeKey(input: string) {
  const raw = input.trim();
  if (!raw) {
    throw new Error("DATA_ENCRYPTION_KEY não configurada");
  }

  const base64 = Buffer.from(raw, "base64");
  if (base64.length === 32) return base64;

  const hex = Buffer.from(raw, "hex");
  if (hex.length === 32) return hex;

  const utf8 = Buffer.from(raw, "utf8");
  if (utf8.length === 32) return utf8;

  throw new Error("DATA_ENCRYPTION_KEY invalida. Use 32 bytes (base64, hex ou utf8).");
}

function getKey() {
  return decodeKey(process.env.DATA_ENCRYPTION_KEY ?? "");
}

export function encryptField(value: string | null | undefined) {
  if (!value) return null;

  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${PREFIX}:${iv.toString("base64")}:${tag.toString("base64")}:${encrypted.toString("base64")}`;
}

export function decryptField(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith(`${PREFIX}:`)) return value;

  const key = getKey();
  const [, ivB64, tagB64, encryptedB64] = value.split(":");
  if (!ivB64 || !tagB64 || !encryptedB64) {
    throw new Error("Payload criptografado invalido");
  }

  const iv = Buffer.from(ivB64, "base64");
  const tag = Buffer.from(tagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const plain = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return plain.toString("utf8");
}
