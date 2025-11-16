// crypto-utils.js
const crypto = require('crypto');

// Derive a 32-byte AES key from password
function deriveKeyFromPasswordSync(password, salt = 'fixedsalt123') {
  if (!password || typeof password !== 'string') {
    throw new Error('Password for key derivation is missing or invalid');
  }

  // scryptSync returns a Buffer (key)
  return crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
}

// Encrypt plaintext using AES-256-CBC
function encrypt(text, key) {
  const iv = crypto.randomBytes(16); // Initialization Vector
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted; // store IV with ciphertext
}

// Decrypt ciphertext using AES-256-CBC
function decrypt(encryptedData, key) {
  const [ivHex, encryptedText] = encryptedData.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

module.exports = { deriveKeyFromPasswordSync, encrypt, decrypt };
