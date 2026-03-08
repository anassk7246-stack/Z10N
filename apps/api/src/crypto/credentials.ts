import { createCipheriv, createDecipheriv, randomBytes, timingSafeEqual } from 'node:crypto';

const ALGORITHM     = 'aes-256-gcm' as const;
const KEY_BYTES     = 32;
const IV_BYTES      = 12;

function loadEncryptionKey(): Buffer {
  const hexKey = process.env.CREDENTIAL_ENCRYPTION_KEY;
  if (!hexKey) throw new Error('[Z10N Crypto] CREDENTIAL_ENCRYPTION_KEY is not set.');
  if (hexKey.length !== KEY_BYTES * 2) throw new Error('[Z10N Crypto] Key must be 64 hex chars.');
  if (!/^[0-9a-fA-F]+$/.test(hexKey)) throw new Error('[Z10N Crypto] Key contains non-hex chars.');
  return Buffer.from(hexKey, 'hex');
}

const ENCRYPTION_KEY: Buffer = loadEncryptionKey();

export interface EncryptedCredential {
  encryptedData: string;
  iv: string;
  authTag: string;
}

export function encryptCredential(plaintext: string): EncryptedCredential {
  if (!plaintext || plaintext.length === 0) throw new Error('[Z10N Crypto] Cannot encrypt empty credential.');
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  cipher.setAAD(Buffer.from('z10n-credential', 'utf8'));
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return {
    encryptedData: encrypted.toString('base64'),
    iv:            iv.toString('base64'),
    authTag:       authTag.toString('base64'),
  };
}

export function decryptCredential(stored: EncryptedCredential): string {
  let ivBuffer: Buffer, encryptedBuffer: Buffer, authTagBuffer: Buffer;
  try {
    ivBuffer        = Buffer.from(stored.iv, 'base64');
    encryptedBuffer = Buffer.from(stored.encryptedData, 'base64');
    authTagBuffer   = Buffer.from(stored.authTag, 'base64');
  } catch {
    throw new Error('[Z10N Crypto] Malformed credential: invalid base64.');
  }
  const decipher = createDecipheriv(ALGORITHM, ENCRYPTION_KEY, ivBuffer);
  decipher.setAAD(Buffer.from('z10n-credential', 'utf8'));
  decipher.setAuthTag(authTagBuffer);
  try {
    const decrypted = Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
    return decrypted.toString('utf8');
  } catch {
    throw new Error('[Z10N Crypto] Decryption failed. Key may have changed.');
  }
}

export function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  return timingSafeEqual(Buffer.from(a, 'utf8'), Buffer.from(b, 'utf8'));
}
