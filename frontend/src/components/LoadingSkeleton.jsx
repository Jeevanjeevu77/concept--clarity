export default function LoadingSkeleton() {
  return (
    <div className="card p-6 space-y-5 animate-fade-in">
      {/* Header skeleton */}
      <div className="flex items-center gap-3">
        <div className="shimmer-line h-4 w-16" />
        <div className="shimmer-line h-4 w-24" />
      </div>

      {/* Title skeleton */}
      <div className="space-y-2">
        <div className="shimmer-line h-7 w-3/4" />
        <div className="shimmer-line h-4 w-1/2" />
      </div>

      {/* Short explanation */}
      <div className="space-y-2 pt-1">
        <div className="shimmer-line h-4 w-full" />
        <div className="shimmer-line h-4 w-full" />
        <div className="shimmer-line h-4 w-2/3" />
      </div>

      <hr style={{ borderColor: 'var(--border)' }} />

      {/* Sections */}
      {['Example', 'Summary'].map((label) => (
        <div key={label} className="space-y-2">
          <div className="shimmer-line h-3 w-20" />
          <div className="shimmer-line h-4 w-full" />
          <div className="shimmer-line h-4 w-4/5" />
        </div>
      ))}

      {/* Tags */}
      <div className="flex gap-2 flex-wrap pt-1">
        {[80, 110, 90, 120, 70].map((w, i) => (
          <div key={i} className="shimmer-line h-7 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Spinner message */}
      <div className="flex items-center gap-2 pt-2">
        <svg className="animate-spin w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }}
          fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Generating structured explanation…
        </span>
      </div>
    </div>
  );
}
