import assert from 'node:assert/strict';
import { test } from 'node:test';
import { decryptPayload, encryptPayload } from '../src/utils/cryptoEngine';

test('encrypts and decrypts unicode text with the same passphrase', async () => {
  const plainText = 'Wellness notes: café 🌱 心拍';
  const ciphertext = await encryptPayload(plainText, 'correct horse battery staple');

  assert.equal(await decryptPayload(ciphertext, 'correct horse battery staple'), plainText);
});

test('uses a fresh 12-byte initialization vector for each encryption', async () => {
  const first = await encryptPayload('same input', 'passphrase');
  const second = await encryptPayload('same input', 'passphrase');
  const firstIv = first.split(':')[0];
  const secondIv = second.split(':')[0];

  assert.equal(firstIv.length, 24);
  assert.equal(secondIv.length, 24);
  assert.notEqual(firstIv, secondIv);
  assert.notEqual(first, second);
});

test('rejects decryption with the wrong passphrase', async () => {
  const ciphertext = await encryptPayload('private biometric data', 'right passphrase');

  await assert.rejects(decryptPayload(ciphertext, 'wrong passphrase'));
});

test('rejects modified ciphertext', async () => {
  const ciphertext = await encryptPayload('authenticated payload', 'passphrase');
  const [iv, encrypted] = ciphertext.split(':');
  const changedByte = encrypted.slice(0, 2) === '00' ? '01' : '00';

  await assert.rejects(decryptPayload(`${iv}:${changedByte}${encrypted.slice(2)}`, 'passphrase'));
});

test('rejects malformed encryption envelopes before attempting decryption', async () => {
  await assert.rejects(
    decryptPayload('missing-separator', 'passphrase'),
    /Invalid stored database encryption envelope format/
  );
  await assert.rejects(
    decryptPayload('not-hex:01234567', 'passphrase'),
    /Malformed hexadecimal stream representation/
  );
  await assert.rejects(
    decryptPayload('abcd:01234567', 'passphrase'),
    /Invalid initialization vector length/
  );
  await assert.rejects(
    decryptPayload(`${'00'.repeat(12)}:abc`, 'passphrase'),
    /Malformed hexadecimal stream representation/
  );
});
