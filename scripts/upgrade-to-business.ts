// Run with: export $(grep -v '^#' .env.local | xargs) && npx tsx scripts/upgrade-to-business.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function upgradeUser() {
  const { data: profiles, error: listErr } = await supabase
    .from('profiles')
    .select('*')
    .limit(10);

  if (listErr) { console.error('Error listing profiles:', listErr); return; }
  console.log('Existing profiles:', profiles?.map(p => ({ id: p.id, subscription_status: p.subscription_status, subscription_tier: p.subscription_tier })));

  if (!profiles || profiles.length === 0) {
    console.log('No profiles found. Sign up first, then re-run.');
    return;
  }

  const targetId = profiles[0].id;
  console.log(`Upgrading profile ${targetId} to business tier...`);

  const { error } = await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_tier: 'tier-business',
      trial_claimed: true,
      onboarding_completed: true,
      stripe_customer_id: 'cus_test_admin_' + targetId.substring(0, 8),
    })
    .eq('id', targetId);

  if (error) { console.error('Upgrade failed:', error); return; }
  console.log('Done! Profile upgraded to business tier.');
}

upgradeUser();
