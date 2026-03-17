"use client";

import { useState, useEffect, useRef } from "react";
import { CheckCircle2, Link as LinkIcon, AlertCircle, Loader2, Linkedin, Twitter, Instagram, Facebook, Clock, Shield, ExternalLink, X, Youtube } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

type ConnectedAccount = {
  provider: string;
  provider_account_name: string | null;
};

export default function AccountsPage() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [configuredProviders, setConfiguredProviders] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const platforms = [
    {
      id: 'twitter',
      name: 'X (Twitter)',
      icon: Twitter,
      color: 'bg-black',
      hover: 'hover:bg-gray-900',
      border: 'border border-white/20',
      description: 'Post tweets and threads automatically',
      connectHint: 'A window will open — log in to X and click "Authorize app"',
    },
    {
      id: 'linkedin',
      name: 'LinkedIn',
      icon: Linkedin,
      color: 'bg-[#0A66C2]',
      hover: 'hover:bg-[#004182]',
      description: 'Share professional updates and articles',
      connectHint: 'A window will open — log in to LinkedIn and click "Allow"',
    },
    {
      id: 'instagram',
      name: 'Instagram',
      icon: Instagram,
      color: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]',
      hover: 'opacity-90',
      description: 'Publish photos and reels to your page',
      connectHint: 'A window will open — log in to Facebook and grant page access',
    },
    {
      id: 'facebook',
      name: 'Facebook Page',
      icon: Facebook,
      color: 'bg-[#1877F2]',
      hover: 'hover:bg-[#0C5ECA]',
      description: 'Publish to your Facebook Page feed',
      connectHint: 'A window will open — log in to Facebook and grant page access',
    },
    {
      id: 'tiktok',
      name: 'TikTok',
      icon: TikTokIcon,
      color: 'bg-black',
      hover: 'hover:bg-gray-900',
      border: 'border border-white/20',
      description: 'Upload videos and photo posts',
      connectHint: 'A window will open — log in to TikTok and click "Authorize"',
    },
    {
      id: 'google',
      name: 'YouTube',
      icon: Youtube,
      color: 'bg-[#FF0000]',
      hover: 'hover:bg-[#CC0000]',
      description: 'Upload videos and Shorts to your channel',
      connectHint: 'A window will open — log in to Google and click "Allow"',
    },
  ];

  // Cleanup popup polling on unmount
  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  useEffect(() => {
    // Fetch which providers are configured
    fetch('/api/auth/providers')
      .then(r => r.json())
      .then(data => {
        setConfiguredProviders(data.providers || {});
        setLoadingProviders(false);
      })
      .catch(() => setLoadingProviders(false));

    // Load connected accounts from Supabase (with account names)
    const fetchAccounts = async () => {
      const supabase = getSupabase();
      if (!supabase) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await (supabase as any)
          .from('social_accounts')
          .select('provider, provider_account_name')
          .eq('user_id', user.id);

        if (data) {
          setConnectedAccounts(data as ConnectedAccount[]);
        }
      }
    };

    fetchAccounts();

    const handleMessage = async (event: MessageEvent) => {
      // Only accept messages from same origin
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const provider = event.data.provider;
        const tokens = event.data.tokens;

        const supabase = getSupabase();
        if (supabase && tokens?.accessToken) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await (supabase as any)
              .from('social_accounts')
              .upsert({
                user_id: user.id,
                provider: provider,
                access_token: tokens.accessToken,
                refresh_token: tokens.refreshToken || null,
                provider_account_id: tokens.providerAccountId || null,
                provider_account_name: tokens.providerAccountName || null,
                updated_at: new Date().toISOString()
              }, { onConflict: 'user_id,provider' });
          }
        }

        const accountName = tokens?.providerAccountName || null;
        setConnectedAccounts(prev => {
          const filtered = prev.filter(a => a.provider !== provider);
          return [...filtered, { provider, provider_account_name: accountName }];
        });

        const platformName = platforms.find(p => p.id === provider)?.name || provider;
        setSuccessMessage(`${platformName} connected successfully! You're all set to publish.`);
        setTimeout(() => setSuccessMessage(null), 5000);

        setConnecting(null);
        setError(null);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }

      if (event.data?.type === 'OAUTH_AUTH_ERROR') {
        setError(event.data.error || 'Connection failed. Please try again.');
        setConnecting(null);
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async (platformId: string) => {
    try {
      setConnecting(platformId);
      setError(null);
      setSuccessMessage(null);

      const response = await fetch(`/api/auth/url?provider=${platformId}`);
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to start connection. Please try again.');
      }
      const { url } = await response.json();

      const width = 600;
      const height = 700;
      const left = window.screenX + (window.innerWidth - width) / 2;
      const top = window.screenY + (window.innerHeight - height) / 2;

      const authWindow = window.open(
        url,
        'oauth_popup',
        `width=${width},height=${height},left=${left},top=${top},scrollbars=yes`
      );

      if (!authWindow) {
        setError('Pop-up was blocked by your browser. Please allow pop-ups for this site and try again.');
        setConnecting(null);
        return;
      }

      // Poll for popup close to reset connecting state
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        if (authWindow.closed) {
          if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
          // Give a small delay for postMessage to arrive before resetting
          setTimeout(() => {
            setConnecting(prev => {
              if (prev === platformId) return null;
              return prev;
            });
          }, 500);
        }
      }, 1000);

    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.message || 'An error occurred while connecting. Please try again.');
      setConnecting(null);
    }
  };

  const handleDisconnect = async (platformId: string) => {
    try {
      const supabase = getSupabase();
      if (supabase) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await (supabase as any)
            .from('social_accounts')
            .delete()
            .eq('user_id', user.id)
            .eq('provider', platformId);
        }
      }
    } catch (err) {
      console.error('Failed to disconnect account:', err);
    }

    setConnectedAccounts(prev => prev.filter(a => a.provider !== platformId));
  };

  const connectedProviders = connectedAccounts.map(a => a.provider);
  const connectedCount = connectedAccounts.length;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">Connected Accounts</h2>
        <p className="text-white/50">
          Connect your social media accounts in one click — PostPilot handles publishing for you automatically.
        </p>
      </div>

      {/* How it works — for non-technical users */}
      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-glass-card rounded-2xl p-6 hover:border-white/30 transition-colors duration-500 transition-colors">
        <h3 className="text-sm font-medium text-white/70 uppercase tracking-wider mb-4">How it works</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">1</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Click Connect</p>
              <p className="text-xs text-white/40 mt-0.5">A secure login window opens</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">2</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Authorize access</p>
              <p className="text-xs text-white/40 mt-0.5">Log in and click &quot;Allow&quot; or &quot;Authorize&quot;</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-white text-sm font-bold">3</span>
            </div>
            <div>
              <p className="text-sm font-medium text-white">Done!</p>
              <p className="text-xs text-white/40 mt-0.5">The window closes and you&apos;re connected</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white/[0.02] backdrop-blur-xl border border-white/[0.08] shadow-glass-card rounded-2xl p-8 mt-8">
        {/* Security notice */}
        <div className="flex items-start gap-3 mb-6 p-4 bg-white/10 border border-white/20 rounded-xl">
          <Shield className="w-5 h-5 text-white shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-white/80 font-medium">
              Your accounts are secure
            </p>
            <p className="text-xs text-white/60 mt-1">
              We never see or store your passwords. You&apos;re granting PostPilot permission to publish on your behalf — you can revoke access at any time by clicking Disconnect.
            </p>
          </div>
        </div>

        {/* Success toast */}
        {successMessage && (
          <div className="mb-6 p-4 bg-white/10 border border-white/20 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <span className="text-sm text-white">{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-white/50 hover:text-white/80">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-400">{error}</p>
                <p className="text-xs text-red-400/60 mt-1">
                  If the problem persists, try refreshing the page or using a different browser.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Connected count */}
        {connectedCount > 0 && (
          <div className="mb-6 text-sm text-white/40">
            {connectedCount} of {platforms.length} platform{connectedCount !== 1 ? 's' : ''} connected
          </div>
        )}

        <div className="space-y-4">
          {platforms.map((platform) => {
            const account = connectedAccounts.find(a => a.provider === platform.id);
            const isConnected = !!account;
            const isConnecting = connecting === platform.id;
            const isConfigured = configuredProviders[platform.id] !== false;
            const Icon = platform.icon;

            return (
              <div
                key={platform.id}
                className={`flex items-center justify-between p-4 border rounded-xl transition-all ${
                  isConnected
                    ? 'border-white/[0.2] bg-white/[0.05] shadow-[inset_0_0_20px_rgba(255,255,255,0.02)]'
                    : 'border-white/[0.08] bg-white/[0.01] hover:bg-white/[0.03] hover:border-white/30 transition-colors duration-500'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${platform.color} ${platform.border || ''}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{platform.name}</h3>
                    <p className="text-sm text-white/50">
                      {isConnected
                        ? account.provider_account_name
                          ? `@${account.provider_account_name} · Connected`
                          : 'Connected and ready to publish'
                        : isConnecting
                          ? platform.connectHint
                          : !isConfigured && !loadingProviders
                            ? 'Coming soon'
                            : platform.description}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-white font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      Connected
                    </span>
                    <button
                      onClick={() => handleDisconnect(platform.id)}
                      className="text-sm text-white/40 hover:text-red-400 transition-colors px-3 py-1.5 rounded-md hover:bg-red-400/10"
                    >
                      Disconnect
                    </button>
                  </div>
                ) : !isConfigured && !loadingProviders ? (
                  <span className="flex items-center gap-1.5 text-sm text-white/30 font-medium px-4 py-2">
                    <Clock className="w-4 h-4" />
                    Coming Soon
                  </span>
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting || loadingProviders}
                    className="flex items-center gap-2 bg-white text-black backdrop-blur-md px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-all min-w-[130px] justify-center"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        Connect
                      </>
                    )}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
