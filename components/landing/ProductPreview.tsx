import Image from "next/image";

export default function ProductPreview() {
  return (
    <div className="py-24 sm:py-32 relative z-10">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl sm:text-center mb-16">
          <h2 className="text-base font-medium leading-7 text-emerald-400">Dashboard</h2>
          <p className="mt-2 text-3xl font-light tracking-tight text-white sm:text-4xl">
            Powerful analytics & creation
          </p>
        </div>
        <div className="relative overflow-hidden rounded-2xl bg-[#111] border border-white/10 shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
          <div className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-2">Premium AI Generation</h3>
                  <p className="text-white/60 text-sm">Generate excellent, high-converting text, images, and videos in seconds using state-of-the-art AI models.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-2">Multi-Platform Publishing</h3>
                  <p className="text-white/60 text-sm">One click publishes your content to all of your social media accounts. Maximize your ROI and save countless hours.</p>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                  <h3 className="text-lg font-medium text-white mb-2">AI Analyst</h3>
                  <p className="text-white/60 text-sm">Get deep insights into your audience engagement and growth metrics.</p>
                </div>
              </div>
              <div className="relative aspect-square lg:aspect-auto lg:h-[500px] rounded-xl overflow-hidden border border-white/10 bg-black">
                <Image 
                  src="https://picsum.photos/seed/minimalist/800/1000" 
                  alt="Dashboard Preview" 
                  fill 
                  className="object-cover opacity-80"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
