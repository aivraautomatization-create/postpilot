import { Resend } from 'resend';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (!resendClient) {
    const key = process.env.RESEND_API_KEY;
    if (!key) throw new Error('RESEND_API_KEY is required');
    resendClient = new Resend(key);
  }
  return resendClient;
}

const APP_URL = process.env.APP_URL || 'https://puls.work';
const FROM_EMAIL = 'Puls <notifications@puls.work>';

export async function sendWelcomeEmail(email: string, name?: string) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to Puls — Your AI Social Media Autopilot',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">Welcome to Puls${name ? `, ${name}` : ''}!</h1>
            <p style="color: #444; line-height: 1.6;">You've just unlocked the fastest way to create and publish social media content with AI.</p>
            <p style="color: #444; line-height: 1.6;">Here's what you can do right away:</p>
            <ul style="color: #444; line-height: 1.8; padding-left: 20px;">
              <li><strong>Generate posts</strong> — AI writes engaging content tailored to your brand</li>
              <li><strong>Create images</strong> — Generate eye-catching visuals with a single prompt</li>
              <li><strong>Auto-publish</strong> — Post to Instagram, Facebook, LinkedIn, TikTok, and X</li>
              <li><strong>Schedule ahead</strong> — Plan your content calendar in advance</li>
            </ul>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/dashboard" style="background: #ffffff; color: #000; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Go to Dashboard</a>
            </div>
            <p style="color: #888; font-size: 14px;">Your 14-day free trial is now active. Enjoy!</p>
            <p style="color: #444; margin-top: 24px;">Best,<br/>The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

export async function sendTrialWarningEmail(email: string, daysLeft: number) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Your Puls trial ends in ${daysLeft} days`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">Your trial is almost over</h1>
            <p style="color: #444; line-height: 1.6;">Hi there,</p>
            <p style="color: #444; line-height: 1.6;">We hope you're enjoying Puls! This is a friendly reminder that your 14-day free trial will end in <strong>${daysLeft} days</strong>.</p>
            <p style="color: #444; line-height: 1.6;">To keep using all our AI features and automated publishing, upgrade to a paid plan now.</p>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/#pricing" style="background: #ffffff; color: #000; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Upgrade Now</a>
            </div>
            <p style="color: #888; font-size: 14px;">If you have any questions, just reply to this email!</p>
            <p style="color: #444; margin-top: 24px;">Best,<br/>The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send trial warning email:', error);
  }
}

export async function sendSubscriptionConfirmationEmail(email: string, planName: string) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `You're now on the ${planName} plan — Puls`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">Subscription Confirmed</h1>
            <p style="color: #444; line-height: 1.6;">You're now subscribed to the <strong>${planName}</strong> plan. Thank you for choosing Puls!</p>
            <p style="color: #444; line-height: 1.6;">Your full suite of features is now unlocked:</p>
            <ul style="color: #444; line-height: 1.8; padding-left: 20px;">
              <li>AI text, image, and video generation</li>
              <li>Auto-publishing to all connected platforms</li>
              <li>Scheduled posts and content calendar</li>
              <li>Analytics and performance tracking</li>
            </ul>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/dashboard" style="background: #ffffff; color: #000; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Go to Dashboard</a>
            </div>
            <p style="color: #888; font-size: 14px;">You can manage your subscription anytime from your dashboard settings.</p>
            <p style="color: #444; margin-top: 24px;">Best,<br/>The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send subscription confirmation email:', error);
  }
}

export async function sendPaymentFailedEmail(email: string) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Action required: Payment failed — Puls',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">Payment Failed</h1>
            <p style="color: #444; line-height: 1.6;">We weren't able to process your latest payment for Puls.</p>
            <p style="color: #444; line-height: 1.6;">To avoid any interruption in service, please update your payment method as soon as possible.</p>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/dashboard/settings" style="background: #dc2626; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Update Payment Method</a>
            </div>
            <p style="color: #888; font-size: 14px;">If you believe this is an error, please check with your bank or reply to this email for help.</p>
            <p style="color: #444; margin-top: 24px;">Best,<br/>The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
  }
}

export async function sendWinBackEmail(email: string, name?: string) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'We miss you — here\'s 20% off to come back',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">We'd love to have you back${name ? `, ${name}` : ''}</h1>
            <p style="color: #444; line-height: 1.6;">Your trial ended, but the content ideas haven't stopped. Your competitors are posting daily — don't fall behind.</p>
            <p style="color: #444; line-height: 1.6;">Come back now and get <strong>20% off your first 3 months</strong> on any plan.</p>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/#pricing" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Claim 20% Off</a>
            </div>
            <p style="color: #888; font-size: 14px;">This offer expires in 48 hours.</p>
            <p style="color: #444; margin-top: 24px;">Best,<br/>The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send win-back email:', error);
  }
}

export async function sendReferralSuccessEmail(
  referrerEmail: string,
  referrerName?: string,
  inviteeEmail?: string,
  bonusPosts: number = 10,
) {
  try {
    const resend = getResend();
    const inviteeDisplay = inviteeEmail
      ? inviteeEmail.replace(/(.{2}).*(@.*)/, '$1***$2')
      : 'your friend';

    await resend.emails.send({
      from: FROM_EMAIL,
      to: referrerEmail,
      subject: `You earned ${bonusPosts} bonus posts — Puls`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">Your referral worked${referrerName ? `, ${referrerName}` : ''}!</h1>
            <p style="color: #444; line-height: 1.6;">${inviteeDisplay} just signed up using your referral link.</p>
            <p style="color: #444; line-height: 1.6;">We've added <strong>${bonusPosts} bonus posts</strong> to your monthly limit. These bonus posts never expire and stack with every referral.</p>
            <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0; text-align: center;">
              <p style="color: #888; font-size: 13px; margin: 0 0 8px;">Your bonus posts</p>
              <p style="color: #000; font-size: 32px; font-weight: 600; margin: 0;">+${bonusPosts}</p>
            </div>
            <p style="color: #444; line-height: 1.6;">Keep sharing — the more friends you invite, the more you can create.</p>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/dashboard/referrals" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">View Your Referrals</a>
            </div>
            <p style="color: #444; margin-top: 24px;">Best,<br/>The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send referral success email:', error);
  }
}

/**
 * Day 1 drip — sent ~24h after signup.
 * Goal: get them to generate their first post (activation).
 * Psychology: "First win" within 24h reduces day-7 churn by 3x.
 */
export async function sendDripDay1Email(email: string, name?: string) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Your first AI post takes 30 seconds — here\'s how',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 22px; margin-bottom: 16px;">Hey${name ? ` ${name}` : ''} — have you tried it yet?</h1>
            <p style="color: #444; line-height: 1.6;">Most people generate their first post within 60 seconds. Here's all you need to do:</p>
            <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <ol style="color: #444; line-height: 2; margin: 0; padding-left: 20px;">
                <li>Go to <strong>Create</strong> in your dashboard</li>
                <li>Type a topic (e.g. "Monday motivation for fitness coaches")</li>
                <li>Pick your platform and hit <strong>Generate</strong></li>
              </ol>
            </div>
            <p style="color: #444; line-height: 1.6;">That's it. Your AI writes the hook, body, and CTA — you just copy, tweak if you want, and post.</p>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/dashboard/create" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Generate My First Post →</a>
            </div>
            <p style="color: #888; font-size: 13px;">You have 13 days left on your free trial. No credit card needed to start.</p>
            <p style="color: #444; margin-top: 24px;">— The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send day-1 drip email:', error);
  }
}

/**
 * Day 3 drip — sent ~72h after signup.
 * Goal: get them to connect a social account + publish (activation depth).
 * If they've already published, this reinforces the habit.
 */
export async function sendDripDay3Email(email: string, name?: string, postsGenerated: number = 0) {
  try {
    const resend = getResend();
    const hasGenerated = postsGenerated > 0;
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: hasGenerated ? 'Ready to auto-publish? Here\'s how' : 'Day 3: Let\'s unlock your full content pipeline',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            ${hasGenerated
              ? `<h1 style="color: #000; font-size: 22px; margin-bottom: 16px;">Nice work${name ? ` ${name}` : ''} — you've generated ${postsGenerated} post${postsGenerated > 1 ? 's' : ''}!</h1>
                 <p style="color: #444; line-height: 1.6;">Now let's take it further. Connect your social accounts so Puls can publish directly — no more copy-pasting.</p>`
              : `<h1 style="color: #000; font-size: 22px; margin-bottom: 16px;">Haven't generated a post yet${name ? `, ${name}` : ''}?</h1>
                 <p style="color: #444; line-height: 1.6;">No worries — it takes under a minute. Just pick a topic and let the AI do the writing.</p>`
            }
            <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
              <p style="color: #000; font-weight: 600; margin: 0 0 12px;">Unlock the full pipeline:</p>
              <div style="color: #444; line-height: 2; font-size: 14px;">
                ✅ &nbsp;Generate posts with AI<br/>
                🔗 &nbsp;Connect Instagram, LinkedIn, TikTok, X<br/>
                🚀 &nbsp;Auto-publish or schedule ahead<br/>
                📊 &nbsp;Track engagement in one dashboard
              </div>
            </div>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/dashboard/accounts" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Connect My Accounts →</a>
            </div>
            <p style="color: #888; font-size: 13px;">11 days left on your free trial.</p>
            <p style="color: #444; margin-top: 24px;">— The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send day-3 drip email:', error);
  }
}

/**
 * Day 7 drip — sent ~7 days after signup.
 * Goal: push toward upgrade before the "half-trial" psychological checkpoint.
 * Psychology: Social proof + loss aversion ("7 days left").
 */
export async function sendDripDay7Email(email: string, name?: string, postsPublished: number = 0) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: '7 days in — here\'s what successful users do differently',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 22px; margin-bottom: 16px;">One week in${name ? `, ${name}` : ''}</h1>
            ${postsPublished > 0
              ? `<p style="color: #444; line-height: 1.6;">You've published <strong>${postsPublished} post${postsPublished > 1 ? 's' : ''}</strong> — you're ahead of 70% of new users. The creators who see the biggest growth publish at least 3x per week.</p>`
              : `<p style="color: #444; line-height: 1.6;">Here's what we see from creators who grow fastest: they publish within the first 7 days and never stop. Consistency is the only algorithm.</p>`
            }
            <div style="background: #000; border-radius: 8px; padding: 20px; margin: 24px 0; color: #fff;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #888;">What top Puls users do in week 1</p>
              <div style="line-height: 2; font-size: 14px;">
                📝 &nbsp;Generate 5-10 posts<br/>
                🔗 &nbsp;Connect 2+ social accounts<br/>
                📅 &nbsp;Schedule a week of content ahead<br/>
                🧠 &nbsp;Let the AI Brain learn their voice
              </div>
            </div>
            <p style="color: #444; line-height: 1.6;">You have 7 days left on your trial. Upgrade now to keep your AI Brain, scheduled posts, and publishing history.</p>
            <div style="margin: 32px 0; display: flex; gap: 12px; flex-wrap: wrap;">
              <a href="${APP_URL}/#pricing" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Upgrade — from $15/mo →</a>
            </div>
            <p style="color: #888; font-size: 13px;">No pressure — your data is safe and your trial continues for 7 more days.</p>
            <p style="color: #444; margin-top: 24px;">— The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send day-7 drip email:', error);
  }
}

export async function sendMilestoneEmail(email: string, milestone: string, detail: string) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `${milestone} — Puls`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">${milestone}</h1>
            <p style="color: #444; line-height: 1.6;">${detail}</p>
            <p style="color: #444; line-height: 1.6;">Keep the momentum going — consistency is the #1 growth factor on social media.</p>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/dashboard/create" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Create Next Post</a>
            </div>
            <p style="color: #444; margin-top: 24px;">Best,<br/>The Puls Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send milestone email:', error);
  }
}
