import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';
import { checkoutSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const { tierId } = await req.json();

    const parsed = checkoutSchema.safeParse({ tierId });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }
    const stripe = getStripe();
    const supabase = await getSupabaseServer();
    const supabaseAdmin = getSupabaseAdmin();

    if (!stripe) {
      return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
    }

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

    // Mapping tier IDs to Stripe Product IDs from environment variables
    const products: Record<string, string> = {
      'tier-entry': process.env.STRIPE_PRODUCT_ENTRY || '',
      'tier-pro': process.env.STRIPE_PRODUCT_PRO || '',
      'tier-business': process.env.STRIPE_PRODUCT_BUSINESS || '',
    };

    if (!products['tier-entry'] || !products['tier-pro'] || !products['tier-business']) {
      console.error('Missing Stripe product IDs in environment variables');
      return NextResponse.json({ error: 'Payment configuration incomplete' }, { status: 500 });
    }

    const prices: Record<string, number> = {
      'tier-entry': 1900,     // $19.00
      'tier-pro': 4900,       // $49.00
      'tier-business': 9700,  // $97.00
    };

    const productId = products[tierId] || products['tier-entry'];
    const amount = prices[tierId] || 6900;
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    let customerId = userProfile.stripe_customer_id;

    if (!customerId) {
      // Create a new customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
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

    // Free 14-day trial available on all tiers
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
        trial_period_days: 14,
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

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Stripe Checkout error:', error);
    return NextResponse.json({ error: "Failed to create checkout session. Please try again." }, { status: 500 });
  }
}
