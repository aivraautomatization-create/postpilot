export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Stats skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 space-y-4"
          >
            <div className="w-10 h-10 bg-white/[0.04] rounded-lg" />
            <div className="space-y-2">
              <div className="h-8 w-20 bg-white/[0.06] rounded" />
              <div className="h-4 w-28 bg-white/[0.04] rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Usage bar skeleton */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
        <div className="flex justify-between mb-3">
          <div className="h-4 w-24 bg-white/[0.06] rounded" />
          <div className="h-4 w-20 bg-white/[0.04] rounded" />
        </div>
        <div className="w-full h-2.5 bg-white/[0.04] rounded-full" />
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6"
          >
            <div className="h-5 w-32 bg-white/[0.06] rounded mb-6" />
            <div className="h-72 bg-white/[0.02] rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
