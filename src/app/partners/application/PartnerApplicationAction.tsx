"use client";

import Link from "next/link";
import { useState } from "react";

export default function PartnerApplicationAction() {
  const [state, setState] = useState<"idle" | "saving" | "success" | "error">("idle");
  const [message, setMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  async function submit() {
    if (state === "saving") return;
    setState("saving");
    setMessage("");
    try {
      if (!acceptedTerms) throw new Error("Accept the partner terms to continue.");
      const response = await fetch("/api/partners/enrollment", {
        body: JSON.stringify({ acceptedTerms }),
        headers: { "content-type": "application/json" },
        method: "POST",
      });
      const payload = (await response.json().catch(() => ({}))) as { message?: string };
      if (!response.ok) throw new Error(payload.message || "Partner signup could not be completed.");
      setState("success");
      setMessage("Your partner account is ready. BayBlaze will add your coupon code before referrals go live.");
    } catch (caught) {
      setState("error");
      setMessage(caught instanceof Error ? caught.message : "Partner signup could not be completed.");
    }
  }

  return (
    <div>
      <label className="mb-5 flex gap-3 text-sm font-bold leading-[1.55] text-[#585858]">
        <input
          checked={acceptedTerms}
          className="mt-1 size-5 shrink-0 accent-[var(--ast-global-color-1)]"
          onChange={(event) => setAcceptedTerms(event.target.checked)}
          type="checkbox"
        />
        <span>I understand BayBlaze manually assigns the coupon code and referrals cannot track until that code is active.</span>
      </label>
      {state === "success" ? (
        <Link className="bayblaze-sharp-button bayblaze-sharp-button--primary" href="/partners/dashboard">Open Dashboard</Link>
      ) : (
        <button className="bayblaze-sharp-button bayblaze-sharp-button--primary" disabled={state === "saving"} onClick={submit} type="button">
          {state === "saving" ? "Creating..." : "Create Partner Account"}
        </button>
      )}
      <p aria-live="polite" className={`mt-3 text-sm font-bold ${state === "error" ? "text-[#b42318]" : "text-[var(--ast-global-color-1)]"}`}>{message}</p>
    </div>
  );
}
