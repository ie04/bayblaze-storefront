"use client";

import Link from "next/link";
import { useState } from "react";

export default function PartnerApplicationAction() {
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function submit() {
    if (state === "saving") return;
    setState("saving");
    setMessage("");
    try {
      const response = await fetch("/api/partners/application", { method: "POST" });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Application could not be submitted.");
      setState("success");
      setMessage("Your application is in. BayBlaze will review it and set up your local offer.");
    } catch (caught) {
      setState("error");
      setMessage(caught instanceof Error ? caught.message : "Application could not be submitted.");
    }
  }

  return (
    <div>
      {state === "success" ? (
        <Link className="bayblaze-sharp-button bayblaze-sharp-button--primary" href="/partners/dashboard">Check Application</Link>
      ) : (
        <button className="bayblaze-sharp-button bayblaze-sharp-button--primary" disabled={state === "saving"} onClick={submit} type="button">
          {state === "saving" ? "Submitting..." : "Submit Application"}
        </button>
      )}
      <p aria-live="polite" className={`mt-3 text-sm font-bold ${state === "error" ? "text-[#b42318]" : "text-[var(--ast-global-color-1)]"}`}>{message}</p>
    </div>
  );
}
