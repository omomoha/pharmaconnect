export default function DashboardLoading() {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Skeleton */}
      <div className="w-64 bg-white border-r border-gray-200">
        {/* Sidebar Header Skeleton */}
        <div className="p-6 border-b border-gray-200">
          <div className="h-8 bg-gray-200 rounded animate-pulse w-3/4" />
        </div>

        {/* Sidebar Menu Skeleton */}
        <div className="p-4 space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-10 bg-gray-100 rounded animate-pulse"
            />
          ))}
        </div>

        {/* Sidebar Footer Skeleton */}
        <div className="absolute bottom-6 left-6 right-6 space-y-3">
          <div className="h-10 bg-gray-100 rounded animate-pulse" />
          <div className="h-10 bg-gray-100 rounded animate-pulse w-2/3" />
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* Top Bar Skeleton */}
        <div className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
            </div>
          </div>
        </div>

        {/* Page Content Skeleton */}
        <div className="p-6 space-y-6">
          {/* Header Section */}
          <div className="space-y-2">
            <div className="h-8 bg-gray-200 rounded animate-pulse w-1/2" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-lg border border-gray-200 p-6 space-y-4"
              >
                {/* Card Header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                  </div>
                  <div className="h-10 w-10 bg-gray-200 rounded animate-pulse" />
                </div>

                {/* Card Content */}
                <div className="space-y-2 pt-4 border-t border-gray-100">
                  <div className="h-6 bg-gray-200 rounded animate-pulse w-1/3" />
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                </div>

                {/* Card Footer */}
                <div className="h-10 bg-gray-100 rounded animate-pulse w-full mt-4" />
              </div>
            ))}
          </div>

          {/* Large Content Section */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="h-6 bg-gray-200 rounded animate-pulse w-1/4" />
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="h-10 bg-gray-100 rounded animate-pulse"
                />
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
