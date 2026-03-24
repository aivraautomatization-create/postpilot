/**
 * Migration runner — applies supabase/migrations/20260323_ai_brain.sql
 * to your hosted Supabase project via the Management API.
 *
 * Usage:
 *   SUPABASE_ACCESS_TOKEN=your_pat node scripts/apply-migration.mjs
 *
 * Get your PAT at: https://supabase.com/dashboard/account/tokens
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const PROJECT_REF = 'ovkfmipfmizcxzkqqmte';

if (!ACCESS_TOKEN) {
  console.error('❌  SUPABASE_ACCESS_TOKEN is not set.');
  console.error('');
  console.error('   Get your personal access token at:');
  console.error('   https://supabase.com/dashboard/account/tokens');
  console.error('');
  console.error('   Then run:');
  console.error('   SUPABASE_ACCESS_TOKEN=sbp_xxxx node scripts/apply-migration.mjs');
  process.exit(1);
}

const sqlPath = join(__dirname, '..', 'supabase', 'migrations', '20260323_ai_brain.sql');
const sql = readFileSync(sqlPath, 'utf8');

console.log('🚀  Applying migration to project:', PROJECT_REF);
console.log('📄  SQL file:', sqlPath);
console.log('');

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ query: sql }),
});

const data = await res.json();

if (!res.ok) {
  console.error('❌  Migration failed:', data);
  process.exit(1);
}

console.log('✅  Migration applied successfully!');
console.log('');
console.log('Tables created:');
console.log('  • brand_memory');
console.log('  • strategy_reports');
console.log('  • post_variants');
console.log('');
console.log('Columns added to profiles: goals, industry');
console.log('Columns added to posts: review_status, ai_feedback, journey_stage');
