// f:/palama-persona-v1/neuradeepai-platform/server/src/utils/encryption.js

const crypto = require('crypto');

const ALGORITHM = 'aes-256-cbc';
// Hash the raw string key into a 32-byte buffer for AES-256-CBC
const RAW_KEY = process.env.ENCRYPTION_KEY || 'default_32_char_encryption_key_!!!';
const ENCRYPTION_KEY = crypto.createHash('sha256').update(RAW_KEY).digest();
const IV_LENGTH = 16;

/**
 * Encrypt a string (e.g. API Key)
 */
const encrypt = (text) => {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch (err) {
    console.error('[Encryption] Encrypt Error:', err.message);
    throw err;
  }
};

/**
 * Decrypt a string
 */
const decrypt = (text) => {
  try {
    if (!text || !text.includes(':')) return null;
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('[Encryption] Decrypt Error:', err.message);
    return null;
  }
};

module.exports = { encrypt, decrypt };
