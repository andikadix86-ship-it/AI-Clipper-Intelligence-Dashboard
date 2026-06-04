export function WorkspaceSkeleton() {
  return (
    <div className="space-y-6" aria-label="Loading workspace">
      <div className="skeleton-panel h-64 rounded-2xl" />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton-panel h-28 rounded-2xl" />)}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <div key={index} className="skeleton-panel h-44 rounded-2xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <div className="skeleton-panel h-72 rounded-2xl" />
        <div className="skeleton-panel h-72 rounded-2xl" />
      </div>
    </div>
  );
}
