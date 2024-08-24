export default function Loading() {
    return (
      <main className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-white text-3xl font-semibold mb-4 animate-pulse">Loading...</h2>
          <div className="w-20 h-20 border-t-4 border-b-4 border-white rounded-full animate-spin"></div>
        </div>
      </main>
    );
  }
  