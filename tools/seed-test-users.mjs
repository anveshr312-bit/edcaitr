/**
 * Seed script to create test accounts using the Supabase Admin API (service-role key).
 * Users created here are automatically confirmed.
 *
 * Usage:
 *   1. Create `backend/.env` with:
 *        SUPABASE_URL=...
 *        SUPABASE_SERVICE_ROLE_KEY=...
 *   2. Run from project root:
 *        node tools/seed-test-users.mjs
 */

import * as fs from 'fs';
import * as path from 'path';
import { pathToFileURL } from 'url';

// Resolve @supabase/supabase-js directly from frontend/node_modules
const frontendSupabasePath = path.resolve(
  process.cwd(),
  'frontend',
  'node_modules',
  '@supabase',
  'supabase-js',
  'dist',
  'index.mjs'
);

const { createClient } = await import(pathToFileURL(frontendSupabasePath).href);

// Parse backend/.env or backend/.env.local
function loadEnv() {
  const envPaths = [
    path.resolve(process.cwd(), 'backend', '.env.local'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), 'frontend', '.env.local'),
  ];

  const env = {};
  for (const p of envPaths) {
    if (fs.existsSync(p)) {
      const content = fs.readFileSync(p, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...rest] = trimmed.split('=');
        if (key && rest.length > 0) {
          env[key.trim()] = rest.join('=').trim().replace(/^["']|["']$/g, '');
        }
      }
    }
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('\x1b[31mError:\x1b[0m Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  console.log('Please ensure `backend/.env` contains:');
  console.log('  SUPABASE_URL=https://your-project-id.supabase.co');
  console.log('  SUPABASE_SERVICE_ROLE_KEY=eyJh...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const testAccounts = [
  {
    email: 'director@ecell-aitr.ac.in',
    password: 'Password@123',
    role: 'Director',
    displayName: 'Director Test Account',
  },
  {
    email: 'advisor@ecell-aitr.ac.in',
    password: 'Password@123',
    role: 'Advisor',
    displayName: 'Advisor Test Account',
  },
  {
    email: 'core@ecell-aitr.ac.in',
    password: 'Password@123',
    role: 'Core Team',
    displayName: 'Core Team Test Account',
  },
];

async function seed() {
  console.log('\x1b[36m--- Seeding E-Cell Test Accounts ---\x1b[0m\n');

  for (const acc of testAccounts) {
    console.log(`Processing: ${acc.email} (${acc.role})...`);

    // Check if user already exists
    const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) {
      console.error(`  \x1b[31mFailed to list users:\x1b[0m ${listError.message}`);
      break;
    }

    const existing = usersData.users.find((u) => u.email === acc.email);

    if (existing) {
      // Update password and ensure email_confirm is true
      const { error: updateError } = await supabase.auth.admin.updateUserById(existing.id, {
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          role: acc.role,
          full_name: acc.displayName,
        },
      });

      if (updateError) {
        console.error(`  \x1b[31mFailed to update user:\x1b[0m ${updateError.message}`);
      } else {
        console.log(`  \x1b[32m✔ User updated & auto-confirmed successfully.\x1b[0m`);
      }
    } else {
      // Create user
      const { data, error: createError } = await supabase.auth.admin.createUser({
        email: acc.email,
        password: acc.password,
        email_confirm: true,
        user_metadata: {
          role: acc.role,
          full_name: acc.displayName,
        },
      });

      if (createError) {
        console.error(`  \x1b[31mFailed to create user:\x1b[0m ${createError.message}`);
      } else {
        console.log(`  \x1b[32m✔ User created & auto-confirmed (ID: ${data.user.id}).\x1b[0m`);
      }
    }
  }

  console.log('\n\x1b[32mCompleted seeding test accounts!\x1b[0m');
  console.log('You can now log in at http://localhost:3000/account with:');
  for (const acc of testAccounts) {
    console.log(`  • ${acc.role.padEnd(12)}: ${acc.email} / ${acc.password}`);
  }
}

seed().catch((err) => {
  console.error('\x1b[31mUnexpected error:\x1b[0m', err);
  process.exit(1);
});
