"use client";

export default function PartnerDashboardError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6" role="alert">
      <div className="bayblaze-sharp-card bg-white p-7">
        <p className="text-xs font-black uppercase tracking-widest text-[#b42318]">Could not load partner data</p>
        <h1 className="mt-2 text-3xl font-black uppercase">Give it another shot.</h1>
        <p className="mt-3 text-sm font-medium text-[#585858]">Your account is still signed in. No information was changed.</p>
        <button className="bayblaze-sharp-button bayblaze-sharp-button--primary mt-5" onClick={reset} type="button">Try Again</button>
      </div>
    </section>
  );
}
