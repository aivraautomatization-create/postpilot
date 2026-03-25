import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';

export async function POST(req: Request) {
  try {
    const supabase = await getSupabaseServer();
    if (!supabase) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Fetch profile to get Stripe customer ID
    const { data: profile } = await supabaseAdmin!
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    // Cancel Stripe subscriptions if customer exists
    if (profile?.stripe_customer_id) {
      const stripe = getStripe();
      if (stripe) {
        try {
          const subs = await stripe.subscriptions.list({ customer: profile.stripe_customer_id, status: 'active' });
          for (const sub of subs.data) {
            await stripe.subscriptions.cancel(sub.id);
          }
        } catch (err: any) {
          console.error('Error canceling subscription:', err.message);
        }
      }
    }

    // Delete the Supabase auth user (cascade deletes profiles, social_accounts, posts, usage)
    const { error: deleteError } = await supabaseAdmin!.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error('Error deleting user:', deleteError);
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: "Failed to delete account. Please try again." }, { status: 500 });
  }
}
