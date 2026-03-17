import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabase';
import { sendSubscriptionConfirmationEmail, sendPaymentFailedEmail } from '@/lib/emails';
import { getPlanName } from '@/lib/plan-limits';

let stripeClient: Stripe | null = null;

function getStripe(): Stripe {
  if (!stripeClient) {
    let key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY is required');
    key = key.replace(/^.*(sk_live_|sk_test_)/i, '$1').trim();
    stripeClient = new Stripe(key, { apiVersion: '2026-02-25.clover' });
  }
  return stripeClient;
}

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;

  try {
    if (!webhookSecret || !signature) {
      throw new Error('Missing stripe signature or webhook secret');
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return NextResponse.json({ error: "Webhook verification failed" }, { status: 400 });
  }

  const supabaseAdmin = getSupabaseAdmin();
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;
        
        // Get subscription details to find the trial end date
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const userId = subscription.metadata.supabase_user_id;

        if (userId) {
          const tierId = subscription.metadata.tierId || 'tier-entry';
          await (supabaseAdmin as any)
            .from('profiles')
            .update({
              stripe_customer_id: customerId,
              subscription_status: subscription.status,
              subscription_tier: tierId,
              trial_claimed: true,
              trial_ends_at: subscription.trial_end
                ? new Date(subscription.trial_end * 1000).toISOString()
                : null,
            })
            .eq('id', userId);

          // Send subscription confirmation email
          try {
            const { data: authUser } = await (supabaseAdmin as any).auth.admin.getUserById(userId);
            if (authUser?.user?.email) {
              await sendSubscriptionConfirmationEmail(authUser.user.email, getPlanName(tierId));
            }
          } catch (emailErr) {
            console.error('Failed to send subscription confirmation email:', emailErr);
          }
        }
        break;
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata.supabase_user_id;

        if (userId) {
          const tierId = subscription.metadata.tierId;
          const updateData: Record<string, any> = {
            subscription_status: subscription.status,
            trial_ends_at: subscription.trial_end
              ? new Date(subscription.trial_end * 1000).toISOString()
              : null,
          };
          if (tierId) updateData.subscription_tier = tierId;

          await (supabaseAdmin as any)
            .from('profiles')
            .update(updateData)
            .eq('id', userId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          const { data: failedProfile } = await (supabaseAdmin as any)
            .from('profiles')
            .update({ subscription_status: 'past_due' })
            .eq('stripe_customer_id', customerId)
            .select('id')
            .single();

          // Send payment failed email
          if (failedProfile?.id) {
            try {
              const { data: authUser } = await (supabaseAdmin as any).auth.admin.getUserById(failedProfile.id);
              if (authUser?.user?.email) {
                await sendPaymentFailedEmail(authUser.user.email);
              }
            } catch (emailErr) {
              console.error('Failed to send payment failed email:', emailErr);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
