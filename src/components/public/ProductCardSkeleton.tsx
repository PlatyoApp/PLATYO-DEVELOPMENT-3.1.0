interface ProductCardSkeletonProps {
  viewMode?: 'list' | 'grid' | 'editorial';
}

export default function ProductCardSkeleton({ viewMode = 'grid' }: ProductCardSkeletonProps) {
  if (viewMode === 'list') {
    return (
      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 animate-pulse">
        <div className="flex gap-4 p-4">
          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-full mb-3" />
            <div className="flex items-center justify-between">
              <div className="h-6 bg-gray-200 rounded w-20" />
              <div className="h-9 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (viewMode === 'editorial') {
    return (
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 animate-pulse">
        <div className="aspect-[4/3] bg-gray-200" />
        <div className="p-6">
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
          <div className="h-4 bg-gray-200 rounded w-full mb-2" />
          <div className="h-4 bg-gray-200 rounded w-5/6 mb-4" />
          <div className="flex items-center justify-between">
            <div className="h-7 bg-gray-200 rounded w-24" />
            <div className="h-10 bg-gray-200 rounded w-32" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 transition-all animate-pulse">
      <div className="aspect-square bg-gray-200" />
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-full mb-1" />
        <div className="h-4 bg-gray-200 rounded w-5/6 mb-3" />
        <div className="flex items-center justify-between">
          <div className="h-6 bg-gray-200 rounded w-20" />
          <div className="h-9 bg-gray-200 rounded w-24" />
        </div>
      </div>
    </div>
  );
}
