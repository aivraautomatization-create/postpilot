import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white tracking-tighter">PostPilot</h1>
          <p className="text-white/50 mt-2">Automate your social presence with AI</p>
        </div>
        {children}
      </div>
    </div>
  );
}
