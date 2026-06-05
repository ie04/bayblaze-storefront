"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

import {
  FIRST_ORDER_QR_OFFER_CODE,
  getFirstOrderQrPromoUrl,
} from "@/app/domain/referral-offers";

type CopyState = "idle" | "copied" | "failed";

const qrCanvasSize = 1200;
const qrLogoSize = 210;
const qrLogoPadding = 26;
const qrLogoPath = "/icons/bayblaze-logo-source.png";

export default function PromoQrGenerator({ siteUrl }: { siteUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const [landingPath, setLandingPath] = useState("/");
  const [origin, setOrigin] = useState(siteUrl);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setOrigin(window.location.origin);
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  const promoUrl = useMemo(() => {
    return getFirstOrderQrPromoUrl({ landingPath, origin });
  }, [landingPath, origin]);

  useEffect(() => {
    let isActive = true;

    renderPromoQr(canvasRef.current, promoUrl)
      .then(() => {
        if (isActive) {
          setRenderError("");
        }
      })
      .catch((error) => {
        if (isActive) {
          setRenderError(
            error instanceof Error
              ? error.message
              : "Could not render the QR code.",
          );
        }
      });

    return () => {
      isActive = false;
    };
  }, [promoUrl]);

  async function copyPromoUrl() {
    try {
      await navigator.clipboard.writeText(promoUrl);
      setCopyState("copied");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("failed");
    }
  }

  function downloadPng() {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const link = document.createElement("a");
    link.download = `bayblaze-${FIRST_ORDER_QR_OFFER_CODE}-qr.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }

  function printQr() {
    window.print();
  }

  return (
    <main className="bayblaze-promo-qr-page min-h-screen bg-[var(--ast-global-color-4)] px-4 py-8 text-black sm:px-6 sm:py-10">
      <section className="mx-auto grid w-full max-w-[1100px] gap-7 lg:grid-cols-[minmax(0,1fr)_420px]">
        <div className="grid content-start gap-6">
          <header className="border-2 border-black bg-white p-5 shadow-[8px_8px_0_rgba(0,0,0,0.12)] sm:p-7">
            <p className="text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
              Internal
            </p>
            <h1 className="mt-2 text-[34px] font-semibold leading-none sm:text-[46px]">
              Promo QR Generator
            </h1>
            <p className="mt-4 max-w-[620px] text-[17px] font-medium leading-[1.55] text-[#585858]">
              BayBlaze first-order QR offer: 30% off through the canonical{" "}
              <span className="font-semibold text-black">
                ?promo={FIRST_ORDER_QR_OFFER_CODE}
              </span>{" "}
              link.
            </p>
          </header>

          <section className="grid gap-5 border border-[#d0d0d0] bg-white p-5 sm:p-6">
            <label className="grid gap-2 text-[15px] font-semibold text-black">
              Storefront origin
              <input
                className="h-12 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black"
                onChange={(event) => setOrigin(event.target.value)}
                value={origin}
              />
            </label>

            <label className="grid gap-2 text-[15px] font-semibold text-black">
              Landing path
              <input
                className="h-12 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black"
                onChange={(event) => setLandingPath(event.target.value)}
                value={landingPath}
              />
            </label>

            <div className="grid gap-2">
              <p className="text-[15px] font-semibold text-black">Promo link</p>
              <div className="break-all border border-[#d6d6d6] bg-[var(--ast-global-color-4)] px-4 py-3 text-[15px] font-medium leading-[1.5] text-[#242424]">
                {promoUrl}
              </div>
            </div>

            {renderError ? (
              <p className="border border-red-200 bg-red-50 px-4 py-3 text-[15px] font-semibold leading-[1.5] text-red-700">
                {renderError}
              </p>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                className="h-12 border border-black bg-black px-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--ast-global-color-1)]"
                onClick={copyPromoUrl}
                type="button"
              >
                {copyState === "copied"
                  ? "Copied"
                  : copyState === "failed"
                    ? "Copy Failed"
                    : "Copy Link"}
              </button>
              <button
                className="h-12 border border-black bg-white px-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[var(--ast-global-color-4)]"
                onClick={downloadPng}
                type="button"
              >
                Download PNG
              </button>
              <button
                className="h-12 border border-black bg-white px-5 text-[13px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[var(--ast-global-color-4)]"
                onClick={printQr}
                type="button"
              >
                Print
              </button>
            </div>
          </section>
        </div>

        <aside className="bayblaze-promo-qr-print h-fit border-2 border-black bg-white p-5 text-center shadow-[8px_8px_0_rgba(0,0,0,0.12)]">
          <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--ast-global-color-1)]">
            BayBlaze
          </p>
          <h2 className="mt-2 text-[28px] font-semibold leading-none">
            30% Off First Order
          </h2>
          <div className="mx-auto mt-5 grid size-[min(100%,360px)] place-items-center border border-[#eeeeee] bg-white p-3">
            <canvas
              aria-label="BayBlaze first-order promo QR code"
              className="h-full w-full"
              height={qrCanvasSize}
              ref={canvasRef}
              width={qrCanvasSize}
            />
          </div>
          <p className="mx-auto mt-4 max-w-[320px] text-[15px] font-medium leading-[1.45] text-[#585858]">
            Scan to claim 30% off your first BayBlaze order.
          </p>
          <p className="mt-3 break-all text-[11px] font-medium leading-[1.35] text-[#777]">
            {promoUrl}
          </p>
        </aside>
      </section>
    </main>
  );
}

async function renderPromoQr(
  canvas: HTMLCanvasElement | null,
  promoUrl: string,
) {
  if (!canvas) {
    return;
  }

  await QRCode.toCanvas(canvas, promoUrl, {
    color: {
      dark: "#000000",
      light: "#ffffff",
    },
    errorCorrectionLevel: "H",
    margin: 0,
    width: qrCanvasSize,
  });

  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare the QR canvas.");
  }

  const logo = await loadImage(qrLogoPath);
  const logoFrameSize = qrLogoSize + qrLogoPadding * 2;
  const logoFrameX = (qrCanvasSize - logoFrameSize) / 2;
  const logoFrameY = (qrCanvasSize - logoFrameSize) / 2;
  const logoX = (qrCanvasSize - qrLogoSize) / 2;
  const logoY = (qrCanvasSize - qrLogoSize) / 2;

  context.fillStyle = "#ffffff";
  context.fillRect(logoFrameX, logoFrameY, logoFrameSize, logoFrameSize);
  context.drawImage(logo, logoX, logoY, qrLogoSize, qrLogoSize);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the QR logo."));
    image.src = src;
  });
}
