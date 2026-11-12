'use strict';

const User = require('../models/User');

/**
 * Parse admin accounts from SEED_ADMINS env var.
 * Expected format: JSON array of { name, email, password } objects.
 * Example: SEED_ADMINS=[{"name":"Admin","email":"admin@example.com","password":"SecureP@ss1"}]
 */
function loadAdmins() {
  const raw = process.env.SEED_ADMINS;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((a) => a.name && a.email && a.password)
      .map((a) => ({ ...a, role: 'admin' }));
  } catch (err) {
    console.error('[SEED] Failed to parse SEED_ADMINS env var:', err.message);
    return [];
  }
}

async function seedAdmins() {
  const admins = loadAdmins();
  if (admins.length === 0) {
    console.log('[SEED] No SEED_ADMINS configured — skipping admin seeding.');
    return;
  }
  for (const admin of admins) {
    const exists = await User.findOne({ email: admin.email });
    if (!exists) {
      await User.create(admin);
      console.log(`[SEED] Admin seeded: ${admin.email}`);
    }
  }
}

module.exports = seedAdmins;
