export const Skeleton = ({ className = "" }) => (
  <div className={`bg-slate-200 animate-pulse rounded ${className}`} />
);

export const CardSkeleton = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
    <Skeleton className="h-8 w-1/3" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const TableSkeleton = () => (
  <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-4">
    {[...Array(5)].map((_, i) => (
      <div key={i} className="flex gap-4">
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
        <Skeleton className="h-10 flex-1" />
      </div>
    ))}
  </div>
);
