import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Attach git commit SHA for release tracking
  release: process.env.NEXT_PUBLIC_APP_VERSION,

  // Sample 10% of transactions in prod; 100% in dev for local debugging
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Capture full session replay only on errors
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,

  enabled: process.env.NODE_ENV === 'production',

  // Don't report noise from browser extensions, bots, or expected errors
  ignoreErrors: [
    'ResizeObserver loop limit exceeded',
    'ResizeObserver loop completed with undelivered notifications',
    'Non-Error promise rejection captured',
    /^Loading chunk \d+ failed/,
    /^NetworkError/,
    'AbortError',
  ],

  beforeSend(event) {
    // Strip PII from breadcrumb URLs
    const crumbs = event.breadcrumbs?.values;
    if (Array.isArray(crumbs)) {
      for (const b of crumbs) {
        if (b.data?.url && typeof b.data.url === 'string') {
          try {
            const url = new URL(b.data.url);
            url.searchParams.delete('email');
            url.searchParams.delete('token');
            b.data.url = url.toString();
          } catch {
            // not a valid URL — leave as-is
          }
        }
      }
    }
    return event;
  },
});
