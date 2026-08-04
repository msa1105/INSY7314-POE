'use strict';

/**
 * generate-certs.js
 *
 * Generates a self-signed SSL certificate for local HTTPS development
 * using the `selfsigned` npm package (no OpenSSL binary required).
 *
 * Run: node generate-certs.js
 */

const fs   = require('fs');
const path = require('path');

const SSL_DIR   = path.join(__dirname, 'ssl');
const KEY_FILE  = path.join(SSL_DIR, 'server.key');
const CERT_FILE = path.join(SSL_DIR, 'server.cert');

if (!fs.existsSync(SSL_DIR)) {
  fs.mkdirSync(SSL_DIR, { recursive: true });
}

console.log('Generating self-signed SSL certificate...');

async function main() {
  const selfsigned = require('selfsigned');

  const attrs = [{ name: 'commonName', value: 'localhost' }];
  const opts  = {
    days:      365,
    keySize:   2048,
    algorithm: 'sha256',
    extensions: [
      { name: 'subjectAltName', altNames: [{ type: 2, value: 'localhost' }] },
    ],
  };

  // selfsigned.generate may be sync or return a Promise depending on version
  let pems = selfsigned.generate(attrs, opts);
  if (pems && typeof pems.then === 'function') {
    pems = await pems;
  }

  // Handle both { private, cert } and { privateKey, certificate } shapes
  const key  = pems.private   || pems.privateKey   || pems.key;
  const cert = pems.cert      || pems.certificate  || pems.public;

  if (!key || !cert) {
    console.error('❌ Unexpected output from selfsigned:', Object.keys(pems));
    process.exit(1);
  }

  fs.writeFileSync(KEY_FILE,  key,  'utf8');
  fs.writeFileSync(CERT_FILE, cert, 'utf8');

  console.log('\n✅ SSL certificate generated successfully!');
  console.log(`   Key:  ${KEY_FILE}`);
  console.log(`   Cert: ${CERT_FILE}`);
  console.log('\n⚠️  Self-signed certificate – DEVELOPMENT ONLY.');
  console.log('   Postman: Settings → disable "SSL certificate verification".');
  console.log('   Browser: Advanced → Proceed to localhost (unsafe).');
}

main().catch((err) => {
  console.error('❌ Failed:', err.message);
  process.exit(1);
});
