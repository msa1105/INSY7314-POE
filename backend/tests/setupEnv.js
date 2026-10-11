'use strict';

// Runs before every test file (jest "setupFiles"), before app modules load.
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'local-test-secret-that-is-long-enough-for-hs256-signing';
process.env.BCRYPT_SALT_ROUNDS = process.env.BCRYPT_SALT_ROUNDS || '4'; // fast hashing in tests
