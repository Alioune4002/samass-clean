type SkeletonProps = {
  className?: string;
  lines?: number;
};

export default function Skeleton({ className = "", lines = 1 }: SkeletonProps) {
  if (lines > 1) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-emerald-50/70 border border-emerald-100 rounded h-3"
          />
        ))}
      </div>
    );
  }
  return (
    <div
      className={`animate-pulse bg-emerald-50/70 border border-emerald-100 rounded ${className}`}
    />
  );
}
