/**
 * AES-256-GCM encryption for vault secrets stored in PostgreSQL.
 *
 * Uses VAULT_ENCRYPTION_KEY env var (32 bytes hex = 64 chars).
 * If not set, falls back to deriving a key from SMYTHOS_JWT_SECRET via HKDF.
 *
 * Format: base64(iv:authTag:ciphertext)
 * - iv: 12 bytes random
 * - authTag: 16 bytes GCM authentication tag
 * - ciphertext: variable length
 */

import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

let encryptionKey: Buffer | null = null;

function getKey(): Buffer {
  if (encryptionKey) return encryptionKey;

  const envKey = process.env.VAULT_ENCRYPTION_KEY;
  if (envKey && envKey.length >= 64) {
    // Direct hex key (preferred)
    encryptionKey = Buffer.from(envKey.slice(0, 64), 'hex');
    return encryptionKey;
  }

  // Derive from SMYTHOS_JWT_SECRET via HKDF-like construction
  const baseSecret = process.env.SMYTHOS_JWT_SECRET || process.env.SESSION_SECRET;
  if (!baseSecret) {
    throw new Error('VAULT_ENCRYPTION_KEY or SMYTHOS_JWT_SECRET must be set for vault encryption');
  }

  encryptionKey = crypto
    .createHash('sha256')
    .update(`zappstudio-vault-encryption:${baseSecret}`)
    .digest();
  return encryptionKey;
}

/**
 * Encrypt a plaintext value.
 * Returns a base64 string containing iv + authTag + ciphertext.
 */
export function encrypt(plaintext: string): string {
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: iv (12) + authTag (16) + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString('base64');
}

/**
 * Decrypt a value previously encrypted with encrypt().
 * Returns the original plaintext.
 */
export function decrypt(encoded: string): string {
  const key = getKey();
  const packed = Buffer.from(encoded, 'base64');

  if (packed.length < IV_LENGTH + AUTH_TAG_LENGTH + 1) {
    throw new Error('Invalid encrypted data: too short');
  }

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const ciphertext = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Check if a value looks like it's encrypted (base64 with minimum length).
 */
export function isEncrypted(value: string): boolean {
  if (!value || value.length < 40) return false; // min: 12+16+1 = 29 bytes -> ~40 base64 chars
  try {
    const buf = Buffer.from(value, 'base64');
    return buf.length >= IV_LENGTH + AUTH_TAG_LENGTH + 1;
  } catch {
    return false;
  }
}

/**
 * Decrypt if encrypted, return as-is if plaintext (migration compat).
 */
export function decryptSafe(value: string): string {
  if (!value) return value;
  try {
    if (isEncrypted(value)) {
      return decrypt(value);
    }
  } catch {
    // If decryption fails, assume plaintext (backward compat during migration)
  }
  return value;
}
