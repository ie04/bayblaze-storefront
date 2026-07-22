"use client";

import Image from "next/image";
import { useState } from "react";

export default function PartnerReferralTools({ code, link, qrDataUrl }: { code: string; link: string; qrDataUrl: string }) {
  const [message, setMessage] = useState("");

  async function copy(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setMessage(`${label} copied.`);
    } catch {
      setMessage("Copy did not work. Select the text and copy it manually.");
    }
  }

  async function share() {
    if (!navigator.share) {
      await copy(link, "Referral link");
      return;
    }

    try {
      await navigator.share({
        text: `Use my BayBlaze code ${code} when you shop local.`,
        title: "My BayBlaze referral",
        url: link,
      });
      setMessage("Share sheet opened.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Sharing is unavailable right now.");
    }
  }

  function downloadQr() {
    const anchor = document.createElement("a");
    anchor.download = `bayblaze-${code}-qr.png`;
    anchor.href = qrDataUrl;
    anchor.click();
    setMessage("QR code downloaded.");
  }

  return (
    <section className="bayblaze-sharp-panel" aria-labelledby="share-referral-title">
      <div className="bayblaze-sharp-panel-header">
        <h2 className="text-sm font-black uppercase tracking-wider" id="share-referral-title">Your referral</h2>
        <span className="bayblaze-sharp-badge bayblaze-sharp-badge--green ml-auto">Active</span>
      </div>

      <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_248px] lg:items-start">
        <div className="min-w-0">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#585858]">Referral code</p>
            <div className="mt-2 flex min-w-0">
              <output className="min-w-0 flex-1 overflow-hidden border-2 border-r-0 border-black bg-[var(--ast-global-color-4)] px-3 py-2 font-mono text-lg font-black tracking-wider text-ellipsis">{code}</output>
              <button className="bayblaze-sharp-button bayblaze-sharp-button--dark shrink-0 px-4" onClick={() => copy(code, "Code")} type="button">Copy</button>
            </div>
          </div>

          <div className="mt-5">
            <p className="text-xs font-black uppercase tracking-widest text-[#585858]">Share link</p>
            <div className="mt-2 flex min-w-0">
              <output className="min-w-0 flex-1 overflow-hidden border-2 border-r-0 border-black bg-white px-3 py-2 text-sm font-semibold text-ellipsis whitespace-nowrap">{link}</output>
              <button className="bayblaze-sharp-button bayblaze-sharp-button--dark shrink-0 px-4" onClick={() => copy(link, "Link")} type="button">Copy</button>
            </div>
          </div>

          <button className="bayblaze-sharp-button bayblaze-sharp-button--primary mt-4 w-full sm:w-auto" onClick={share} type="button">Share Referral</button>
          <p aria-live="polite" className="mt-2 min-h-5 text-sm font-bold text-[var(--ast-global-color-1)]">{message}</p>
        </div>

        <div className="border-2 border-black bg-white p-3 text-center">
          <Image
            alt={`QR code for referral code ${code}`}
            className="mx-auto h-auto max-w-full"
            height={232}
            src={qrDataUrl}
            unoptimized
            width={232}
          />
          <button className="bayblaze-sharp-button bayblaze-sharp-button--outline mt-2 w-full" onClick={downloadQr} type="button">Download QR</button>
        </div>
      </div>
    </section>
  );
}
