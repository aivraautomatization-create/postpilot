import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getSupabaseServer } from '@/lib/supabase-server';
import { getStripe } from '@/lib/stripe';
import { checkoutSchema } from '@/lib/validations';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tierId, billingCycle = 'monthly' } = body;

    const parsed = checkoutSchema.safeParse({ tierId, billingCycle });
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid plan selected.' }, { status: 400 });
    }

    const isAnnual = billingCycle === 'annual';
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
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile fetch error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch user profile' }, { status: 500 });
    }

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

    // Monthly prices
    const monthlyPrices: Record<string, number> = {
      'tier-entry': 1900,     // $19.00
      'tier-pro': 4900,       // $49.00
      'tier-business': 9700,  // $97.00
    };

    // Annual prices (20% discount — psychology: anchoring + commitment bias)
    const annualPrices: Record<string, number> = {
      'tier-entry': 15 * 12 * 100,    // $15/mo × 12 = $180/year
      'tier-pro': 39 * 12 * 100,      // $39/mo × 12 = $468/year
      'tier-business': 78 * 12 * 100,  // $78/mo × 12 = $936/year
    };

    const productId = products[tierId] || products['tier-entry'];
    const amount = isAnnual
      ? (annualPrices[tierId] || annualPrices['tier-entry'])
      : (monthlyPrices[tierId] || monthlyPrices['tier-entry']);
    const origin = req.headers.get('origin') || 'http://localhost:3000';

    let customerId = profile.stripe_customer_id;

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
      await supabaseAdmin
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    // Free 14-day trial available on all tiers
    const shouldOfferTrial = !profile.trial_claimed;

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
              interval: isAnnual ? 'year' : 'month',
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
          billingCycle: billingCycle,
        }
      } : {
        metadata: {
          supabase_user_id: user.id,
          tierId: tierId,
          billingCycle: billingCycle,
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
