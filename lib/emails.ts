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

const APP_URL = process.env.APP_URL || 'https://postpilot.ai';
const FROM_EMAIL = 'PostPilot <notifications@postpilot.ai>';

export async function sendWelcomeEmail(email: string, name?: string) {
  try {
    const resend = getResend();
    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: 'Welcome to PostPilot — Your AI Social Media Autopilot',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">Welcome to PostPilot${name ? `, ${name}` : ''}!</h1>
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
            <p style="color: #444; margin-top: 24px;">Best,<br/>The PostPilot Team</p>
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
      subject: `Your PostPilot trial ends in ${daysLeft} days`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">Your trial is almost over</h1>
            <p style="color: #444; line-height: 1.6;">Hi there,</p>
            <p style="color: #444; line-height: 1.6;">We hope you're enjoying PostPilot! This is a friendly reminder that your 14-day free trial will end in <strong>${daysLeft} days</strong>.</p>
            <p style="color: #444; line-height: 1.6;">To keep using all our AI features and automated publishing, upgrade to a paid plan now.</p>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/#pricing" style="background: #ffffff; color: #000; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Upgrade Now</a>
            </div>
            <p style="color: #888; font-size: 14px;">If you have any questions, just reply to this email!</p>
            <p style="color: #444; margin-top: 24px;">Best,<br/>The PostPilot Team</p>
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
      subject: `You're now on the ${planName} plan — PostPilot`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #000; font-size: 24px; margin-bottom: 16px;">Subscription Confirmed</h1>
            <p style="color: #444; line-height: 1.6;">You're now subscribed to the <strong>${planName}</strong> plan. Thank you for choosing PostPilot!</p>
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
            <p style="color: #444; margin-top: 24px;">Best,<br/>The PostPilot Team</p>
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
      subject: 'Action required: Payment failed — PostPilot',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #fafafa; padding: 40px 20px;">
          <div style="background: #fff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h1 style="color: #dc2626; font-size: 24px; margin-bottom: 16px;">Payment Failed</h1>
            <p style="color: #444; line-height: 1.6;">We weren't able to process your latest payment for PostPilot.</p>
            <p style="color: #444; line-height: 1.6;">To avoid any interruption in service, please update your payment method as soon as possible.</p>
            <div style="margin: 32px 0;">
              <a href="${APP_URL}/dashboard/settings" style="background: #dc2626; color: #fff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; display: inline-block;">Update Payment Method</a>
            </div>
            <p style="color: #888; font-size: 14px;">If you believe this is an error, please check with your bank or reply to this email for help.</p>
            <p style="color: #444; margin-top: 24px;">Best,<br/>The PostPilot Team</p>
          </div>
        </div>
      `,
    });
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
  }
}
