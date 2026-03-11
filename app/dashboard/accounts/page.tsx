"use client";

import { useState, useEffect } from "react";
import { CheckCircle2, Link as LinkIcon, AlertCircle, Loader2, Linkedin, Twitter, Instagram, Facebook } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function AccountsPage() {
  const [connecting, setConnecting] = useState<string | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const platforms = [
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'bg-[#0A66C2]', hover: 'hover:bg-[#004182]' },
    { id: 'twitter', name: 'X (Twitter)', icon: Twitter, color: 'bg-black', hover: 'hover:bg-gray-900', border: 'border border-white/20' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888]', hover: 'opacity-90' },
    { id: 'facebook', name: 'Facebook Page', icon: Facebook, color: 'bg-[#1877F2]', hover: 'hover:bg-[#0C5ECA]' },
    { id: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: 'bg-black', hover: 'hover:bg-gray-900', border: 'border border-white/20' },
  ];

  useEffect(() => {
    // Load connected accounts from Supabase on mount
    const fetchAccounts = async () => {
      const supabase = getSupabase();
      if (!supabase) return;
      
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await (supabase as any)
          .from('social_accounts')
          .select('provider')
          .eq('user_id', user.id);
          
        if (data) {
          setConnectedAccounts(data.map((a: any) => a.provider));
        }
      }
    };
    
    fetchAccounts();

    const handleMessage = async (event: MessageEvent) => {
      // Validate origin is from AI Studio preview or localhost
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS') {
        const provider = event.data.provider;
        const tokens = event.data.tokens;
        
        const supabase = getSupabase();
        if (supabase && tokens?.accessToken) {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Save to Supabase
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
        
        setConnectedAccounts(prev => {
          const newAccounts = prev.includes(provider) ? prev : [...prev, provider];
          // Fallback
          localStorage.setItem('connectedSocialAccounts', JSON.stringify(newAccounts));
          return newAccounts;
        });
        
        setConnecting(null);
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleConnect = async (platformId: string) => {
    try {
      setConnecting(platformId);
      setError(null);
      
      // 1. Fetch the OAuth URL from the server
      const response = await fetch(`/api/auth/url?provider=${platformId}`);
      if (!response.ok) {
        throw new Error('Failed to get auth URL');
      }
      const { url } = await response.json();

      // 2. Open the OAuth PROVIDER's URL directly in a popup
      const authWindow = window.open(
        url,
        'oauth_popup',
        'width=600,height=700'
      );

      if (!authWindow) {
        // Popup was blocked
        setError('Please allow popups for this site to connect your account.');
        setConnecting(null);
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.message || 'An error occurred while connecting.');
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

    setConnectedAccounts(prev => {
      const newAccounts = prev.filter(id => id !== platformId);
      localStorage.setItem('connectedSocialAccounts', JSON.stringify(newAccounts));
      return newAccounts;
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-light tracking-tight text-white mb-2">Connected Accounts</h2>
        <p className="text-white/50">Link your social media profiles to enable one-click auto-publishing.</p>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
        <div className="flex items-start gap-3 mb-6 p-4 bg-emerald-400/10 border border-emerald-400/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-2">
            <p className="text-sm text-emerald-400/90 font-medium">
              Connect your accounts securely via OAuth.
            </p>
            <p className="text-xs text-emerald-400/70">
              We never store your passwords, only secure access tokens to publish on your behalf. 
              This uses real OAuth flows. To fully configure, you need to add the callback URL to your provider&apos;s dashboard.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {platforms.map((platform) => {
            const isConnected = connectedAccounts.includes(platform.id);
            const isConnecting = connecting === platform.id;
            const Icon = platform.icon;

            return (
              <div 
                key={platform.id} 
                className="flex items-center justify-between p-4 border border-white/10 rounded-xl bg-black/20 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${platform.color} ${platform.border || ''}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{platform.name}</h3>
                    <p className="text-sm text-white/50">
                      {isConnected ? 'Connected and ready to publish' : 'Not connected'}
                    </p>
                  </div>
                </div>

                {isConnected ? (
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1 text-sm text-emerald-400 font-medium">
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
                ) : (
                  <button
                    onClick={() => handleConnect(platform.id)}
                    disabled={isConnecting}
                    className="flex items-center gap-2 bg-white text-black px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-white/90 disabled:opacity-50 transition-all"
                  >
                    {isConnecting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <LinkIcon className="w-4 h-4" />
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

      <div className="bg-[#111] border border-white/10 rounded-2xl p-8">
        <h3 className="text-xl font-medium text-white mb-4">OAuth Setup Instructions</h3>
        <p className="text-white/60 mb-6 text-sm">
          To make these connections work, you need to configure the OAuth apps in each provider&apos;s developer portal.
        </p>
        
        <div className="space-y-6">
          <div>
            <h4 className="text-white font-medium mb-2 text-sm">1. Your Callback URL</h4>
            <p className="text-white/50 text-xs mb-2">Copy this exact URL and paste it into the &quot;Redirect URI&quot; or &quot;Callback URL&quot; field in your provider&apos;s dashboard:</p>
            <div className="bg-black/50 border border-white/10 rounded-lg p-3 flex items-center justify-between">
              <code className="text-emerald-400 text-sm">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/auth/callback` : 'https://your-app-url.run.app/api/auth/callback'}
              </code>
              <button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    navigator.clipboard.writeText(`${window.location.origin}/api/auth/callback`);
                    alert('Copied to clipboard!');
                  }
                }}
                className="text-xs bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded transition-colors"
              >
                Copy
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-white font-medium mb-2 text-sm">2. Required Environment Variables</h4>
            <p className="text-white/50 text-xs mb-3">Set these variables in your AI Studio environment settings:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                <h5 className="text-white/80 text-xs font-medium mb-1">X (Twitter)</h5>
                <code className="block text-white/50 text-xs">TWITTER_CLIENT_ID</code>
                <code className="block text-white/50 text-xs">TWITTER_CLIENT_SECRET</code>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                <h5 className="text-white/80 text-xs font-medium mb-1">LinkedIn</h5>
                <code className="block text-white/50 text-xs">LINKEDIN_CLIENT_ID</code>
                <code className="block text-white/50 text-xs">LINKEDIN_CLIENT_SECRET</code>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                <h5 className="text-white/80 text-xs font-medium mb-1">Facebook / Instagram</h5>
                <code className="block text-white/50 text-xs">FACEBOOK_CLIENT_ID</code>
                <code className="block text-white/50 text-xs">FACEBOOK_CLIENT_SECRET</code>
              </div>
              <div className="bg-black/30 border border-white/5 rounded-lg p-3">
                <h5 className="text-white/80 text-xs font-medium mb-1">TikTok</h5>
                <code className="block text-white/50 text-xs">TIKTOK_CLIENT_KEY</code>
                <code className="block text-white/50 text-xs">TIKTOK_CLIENT_SECRET</code>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
