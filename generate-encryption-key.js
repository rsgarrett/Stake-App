// Generate a secure 32-character encryption key
const crypto = require('crypto');

const key = crypto.randomBytes(16).toString('hex');
console.log('\nGenerated Encryption Key:');
console.log(key);
console.log('\nAdd this to your .env.local file as ENCRYPTION_KEY\n');


