"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

import {
  FIRST_ORDER_QR_OFFER_CODE,
  getFirstOrderQrPromoUrl,
} from "@/app/domain/referral-offers";

type CopyState = "idle" | "copied" | "failed";

const qrCanvasSize = 1200;
const qrBorderRadius = 28;
const qrLogoMaxSize = 330;
const qrLogoHorizontalPadding = 12;
const qrLogoPath = "/icons/bayblaze-flame-qr.png";

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
    <main className="bayblaze-promo-qr-page min-h-screen bg-[#f3f5f1] px-4 py-6 text-black sm:px-6 lg:py-8">
      <section className="mx-auto grid w-full max-w-[1240px] gap-6">
        <header className="bayblaze-promo-qr-header flex flex-col gap-4 border-b-2 border-black bg-white px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
              Internal
            </p>
            <h1 className="mt-1 text-[30px] font-semibold leading-none sm:text-[40px]">
              Promo QR Generator
            </h1>
          </div>
          <p className="max-w-[500px] text-[15px] font-medium leading-[1.45] text-[#585858] sm:text-right">
            Canonical offer:{" "}
            <span className="font-semibold text-black">
              ?promo={FIRST_ORDER_QR_OFFER_CODE}
            </span>
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_460px]">
          <section className="bayblaze-promo-qr-controls grid content-start gap-5 border border-[#d0d0d0] bg-white p-5 sm:p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-[14px] font-semibold text-black">
                Storefront origin
                <input
                  className="h-12 min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black"
                  onChange={(event) => setOrigin(event.target.value)}
                  value={origin}
                />
              </label>

              <label className="grid gap-2 text-[14px] font-semibold text-black">
                Landing path
                <input
                  className="h-12 min-w-0 border border-[#d6d6d6] bg-white px-4 text-[16px] font-normal text-black outline-none transition focus:border-black"
                  onChange={(event) => setLandingPath(event.target.value)}
                  value={landingPath}
                />
              </label>
            </div>

            <div className="grid gap-2">
              <p className="text-[14px] font-semibold text-black">Promo link</p>
              <div className="break-all border border-[#d6d6d6] bg-[var(--ast-global-color-4)] px-4 py-3 text-[15px] font-medium leading-[1.5] text-[#242424]">
                {promoUrl}
              </div>
            </div>

            {renderError ? (
              <p className="border border-red-200 bg-red-50 px-4 py-3 text-[15px] font-semibold leading-[1.5] text-red-700">
                {renderError}
              </p>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-3">
              <button
                className="h-12 border border-black bg-black px-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-white transition-colors hover:bg-[var(--ast-global-color-1)]"
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
                className="h-12 border border-black bg-white px-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[var(--ast-global-color-4)]"
                onClick={downloadPng}
                type="button"
              >
                Download PNG
              </button>
              <button
                className="h-12 border border-black bg-white px-4 text-[13px] font-semibold uppercase tracking-[0.12em] text-black transition-colors hover:bg-[var(--ast-global-color-4)]"
                onClick={printQr}
                type="button"
              >
                Print
              </button>
            </div>

            <dl className="grid gap-3 border-t border-[#e4e4e4] pt-5 text-[14px] leading-[1.5] sm:grid-cols-3">
              <div>
                <dt className="font-semibold text-black">Offer</dt>
                <dd className="text-[#585858]">30% first order</dd>
              </div>
              <div>
                <dt className="font-semibold text-black">QR size</dt>
                <dd className="text-[#585858]">1200px PNG</dd>
              </div>
              <div>
                <dt className="font-semibold text-black">Style</dt>
                <dd className="text-[#585858]">Label printer match</dd>
              </div>
            </dl>
          </section>

          <aside className="bayblaze-promo-qr-print h-fit border-2 border-black bg-white p-5 text-center lg:sticky lg:top-6">
            <p className="text-[14px] font-semibold uppercase tracking-[0.14em] text-[var(--ast-global-color-1)]">
              BayBlaze
            </p>
            <h2 className="mt-2 text-[28px] font-semibold leading-none">
              30% Off First Order
            </h2>
            <div className="mx-auto mt-5 grid size-[min(100%,390px)] place-items-center bg-white">
              <canvas
                aria-label="BayBlaze first-order promo QR code"
                className="h-full w-full rounded-[28px]"
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
        </div>
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

  applyCanvasBorderRadius(canvas, context, qrBorderRadius);

  const centeredLogo = await buildCenteredLogoCanvas(qrLogoPath);
  const logoX = (qrCanvasSize - centeredLogo.width) / 2;
  const logoY = (qrCanvasSize - centeredLogo.height) / 2;

  context.drawImage(centeredLogo, logoX, logoY);
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load the QR logo."));
    image.src = src;
  });
}

async function buildCenteredLogoCanvas(src: string) {
  const logo = await loadImage(src);
  const scale = Math.min(
    qrLogoMaxSize / logo.naturalWidth,
    qrLogoMaxSize / logo.naturalHeight,
  );
  const logoWidth = Math.round(logo.naturalWidth * scale);
  const logoHeight = Math.round(logo.naturalHeight * scale);
  const logoCanvas = document.createElement("canvas");
  const logoContext = logoCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  if (!logoContext) {
    throw new Error("Could not prepare the QR logo.");
  }

  logoCanvas.width = logoWidth;
  logoCanvas.height = logoHeight;
  logoContext.drawImage(logo, 0, 0, logoWidth, logoHeight);

  const imageData = logoContext.getImageData(0, 0, logoWidth, logoHeight);
  const data = imageData.data;

  for (let index = 0; index < data.length; index += 4) {
    const red = data[index] ?? 255;
    const green = data[index + 1] ?? 255;
    const blue = data[index + 2] ?? 255;
    const alpha = data[index + 3] ?? 0;
    const luminance = red * 0.299 + green * 0.587 + blue * 0.114;

    data[index] = 0;
    data[index + 1] = 0;
    data[index + 2] = 0;
    data[index + 3] = alpha > 0 && luminance < 250 ? 255 : 0;
  }

  logoContext.putImageData(imageData, 0, 0);

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Could not prepare the QR logo frame.");
  }

  canvas.width = logoWidth + qrLogoHorizontalPadding * 2;
  canvas.height = logoHeight;
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(logoCanvas, qrLogoHorizontalPadding, 0);

  return canvas;
}

function applyCanvasBorderRadius(
  canvas: HTMLCanvasElement,
  context: CanvasRenderingContext2D,
  radius: number,
) {
  const sourceCanvas = document.createElement("canvas");
  const sourceContext = sourceCanvas.getContext("2d");

  if (!sourceContext) {
    return;
  }

  sourceCanvas.width = canvas.width;
  sourceCanvas.height = canvas.height;
  sourceContext.drawImage(canvas, 0, 0);

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.save();
  context.beginPath();
  context.roundRect(0, 0, canvas.width, canvas.height, radius);
  context.clip();
  context.drawImage(sourceCanvas, 0, 0);
  context.restore();
}
