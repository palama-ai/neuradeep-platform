// f:/palama-persona-v1/neuradeepai-platform/server/test_decryption.js

const { encrypt, decrypt } = require('./src/utils/encryption');
require('dotenv').config();

console.log('--- Encryption/Decryption Test ---');
console.log('ENCRYPTION_KEY:', process.env.ENCRYPTION_KEY);

const original = 'sk-test-12345';
const encrypted = encrypt(original);
console.log('Original:', original);
console.log('Encrypted:', encrypted);

const decrypted = decrypt(encrypted);
console.log('Decrypted:', decrypted);

if (original === decrypted) {
    console.log('✅ Success: Encryption/Decryption roundtrip works!');
} else {
    console.log('❌ Failure: Decryption failed.');
}
