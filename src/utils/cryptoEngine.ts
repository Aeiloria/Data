// Client-Side Symmetric Security Utility Engine Using Browser Web Crypto API (AES-GCM)

/**
 * Derives a secure cryptographic CryptoKey item from a raw passphrase string
 */
async function deriveSymmetricKey(passphraseToken: string): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const rawKeyData = encoder.encode(passphraseToken);

  // Hash the passphrase input payload to uniform 256-bit layout
  const hashBuffer = await crypto.subtle.digest('SHA-256', rawKeyData);

  return await crypto.subtle.importKey(
    'raw',
    hashBuffer,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts an input plain text payload using a secure user secret token/PIN.
 * Returns a composite hex string formatting both initialization vector (IV) and ciphertext: `${ivHex}:${cipherHex}`
 */
export async function encryptPayload(plainText: string, secretKeyToken: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataToEncrypt = encoder.encode(plainText);
  const key = await deriveSymmetricKey(secretKeyToken);

  // Generate a distinct 12-byte initialization vector array for individual record
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    dataToEncrypt
  );

  // Convert binary array buffers into structured hexadecimal
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const cipherHex = Array.from(new Uint8Array(encryptedBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  return `${ivHex}:${cipherHex}`;
}

/**
 * Decrypts a compound hex string retrieved from database memory tables
 */
export async function decryptPayload(compoundHexString: string, secretKeyToken: string): Promise<string> {
  const [ivHex, cipherHex] = compoundHexString.split(':');
  if (!ivHex || !cipherHex) {
    throw new Error('Invalid stored database encryption envelope format');
  }

  if (!/^(?:[0-9a-fA-F]{2})+$/.test(ivHex) || !/^(?:[0-9a-fA-F]{2})+$/.test(cipherHex)) {
    throw new Error('Malformed hexadecimal stream representation');
  }

  if (ivHex.length !== 24) {
    throw new Error('Invalid initialization vector length');
  }

  const iv = new Uint8Array(ivHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));
  const cipherData = new Uint8Array(cipherHex.match(/.{2}/g)!.map(byte => parseInt(byte, 16)));

  const key = await deriveSymmetricKey(secretKeyToken);

  const decryptedBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    cipherData
  );

  const decoder = new TextDecoder();
  return decoder.decode(decryptedBuffer);
}
