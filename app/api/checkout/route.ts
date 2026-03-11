import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSupabaseServer } from '@/lib/supabase-server';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    let key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error('STRIPE_SECRET_KEY environment variable is required');
    }
    key = key.replace(/^.*(sk_live_|sk_test_)/i, '$1').trim();
    stripeClient = new Stripe(key, { apiVersion: '2026-02-25.clover' });
  }
  return stripeClient;
}

export async function POST(req: Request) {
  try {
    const { tierId } = await req.json();
    const stripe = getStripe();
    const supabase = await getSupabaseServer();
    const supabaseAdmin = getSupabaseAdmin();

    if (!supabase || !supabaseAdmin) {
      return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
    }

    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has a Stripe customer ID or has claimed a trial
    const { data: profile, error: profileError } = await (supabaseAdmin as any)
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

    const userProfile = profile as any;

    // Mapping tier IDs to the user's actual Stripe Product IDs
    const products: Record<string, string> = {
      'tier-entry': 'prod_U6EnvTN871rLJr',
      'tier-pro': 'prod_U6EorgeBGdq0Qf',
      'tier-business': 'prod_U6EqD3vE5B7mkd',
    };

    const prices: Record<string, number> = {
      'tier-entry': 6900,     // $69.00
      'tier-pro': 9900,       // $99.00
      'tier-business': 19900, // $199.00
    };

    const productId = products[tierId] || products['tier-entry'];
    const amount = prices[tierId] || 6900;
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    let customerId = userProfile.stripe_customer_id;

    if (!customerId) {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: userProfile.full_name || user.user_metadata?.full_name || user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      });
      customerId = customer.id;

      // Update profile with customer ID
      await (supabaseAdmin as any)
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Determine if we should offer a trial
    const shouldOfferTrial = !userProfile.trial_claimed;

    // Create a Checkout Session for a subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product: productId,
            recurring: {
              interval: 'month',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      subscription_data: shouldOfferTrial ? {
        trial_period_days: 7,
        metadata: {
          supabase_user_id: user.id,
          tierId: tierId,
        }
      } : {
        metadata: {
          supabase_user_id: user.id,
          tierId: tierId,
        }
      },
      success_url: `${origin}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/#pricing`,
    });

    // Mark trial as claimed immediately to prevent trial abuse via abandoned checkouts
    if (shouldOfferTrial) {
      await (supabaseAdmin as any)
        .from('profiles')
        .update({ trial_claimed: true })
        .eq('id', user.id);
    }

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
