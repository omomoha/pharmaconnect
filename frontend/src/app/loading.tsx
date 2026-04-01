export default function RootLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="flex justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-green-600 rounded-full animate-spin" />
        </div>

        {/* Loading Text */}
        <div>
          <p className="text-gray-600 font-medium">Loading PharmaConnect...</p>
          <p className="text-gray-500 text-sm mt-2">Please wait while we prepare everything for you</p>
        </div>
      </div>
    </div>
  );
}
