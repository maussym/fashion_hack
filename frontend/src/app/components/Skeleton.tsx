export function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[3/4] bg-stone-100 rounded" />
      <div className="mt-3 space-y-2 px-1">
        <div className="h-3 bg-stone-100 rounded w-3/4" />
        <div className="h-3 bg-stone-100 rounded w-1/3" />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-0.5 sm:gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonOutfitCard() {
  return (
    <div className="animate-pulse">
      <div className="aspect-[4/5] bg-stone-100 rounded" />
      <div className="mt-4 space-y-2">
        <div className="h-4 bg-stone-100 rounded w-2/3" />
        <div className="h-3 bg-stone-100 rounded w-1/2" />
      </div>
    </div>
  );
}
