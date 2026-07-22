export default function PartnerDashboardLoading() {
  return (
    <div aria-busy="true" aria-label="Loading partner portal" className="mx-auto max-w-7xl animate-pulse px-4 py-7 sm:px-6">
      <div className="h-8 w-52 bg-black/15" />
      <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {Array.from({ length: 5 }, (_, index) => <div className="h-28 border-2 border-black bg-white" key={index} />)}
      </div>
      <div className="mt-5 h-72 border-2 border-black bg-white" />
    </div>
  );
}
