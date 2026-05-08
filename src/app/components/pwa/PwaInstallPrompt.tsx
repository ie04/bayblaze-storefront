"use client";

import { useEffect, useMemo, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

const DISMISS_STORAGE_KEY = "bayblaze-pwa-install-dismissed";

function isBeforeInstallPromptEvent(
  event: Event,
): event is BeforeInstallPromptEvent {
  return "prompt" in event && "userChoice" in event;
}

function isIosDevice() {
  if (typeof window === "undefined") {
    return false;
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneDisplay() {
  if (typeof window === "undefined") {
    return false;
  }

  const navigatorWithStandalone = window.navigator as Navigator & {
    standalone?: boolean;
  };

  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigatorWithStandalone.standalone === true
  );
}

export default function PwaInstallPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState(true);
  const [showIosPrompt, setShowIosPrompt] = useState(false);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // The site still works if the browser blocks service workers.
      });
    }

    const promptStateTimer = window.setTimeout(() => {
      const dismissed =
        window.localStorage.getItem(DISMISS_STORAGE_KEY) === "true";
      const shouldShowIosPrompt =
        isIosDevice() && !isStandaloneDisplay() && !dismissed;

      setIsDismissed(dismissed);
      setShowIosPrompt(shouldShowIosPrompt);
    }, 0);

    function handleBeforeInstallPrompt(event: Event) {
      if (!isBeforeInstallPromptEvent(event)) {
        return;
      }

      event.preventDefault();
      setInstallPrompt(event);
      setIsDismissed(
        window.localStorage.getItem(DISMISS_STORAGE_KEY) === "true",
      );
    }

    function handleAppInstalled() {
      setInstallPrompt(null);
      setShowIosPrompt(false);
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.clearTimeout(promptStateTimer);
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const canShowPrompt = useMemo(() => {
    return !isDismissed && (installPrompt !== null || showIosPrompt);
  }, [installPrompt, isDismissed, showIosPrompt]);

  if (!canShowPrompt) {
    return null;
  }

  async function handleInstallClick() {
    if (!installPrompt) {
      return;
    }

    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;

    if (choice.outcome === "accepted") {
      window.localStorage.setItem(DISMISS_STORAGE_KEY, "true");
      setIsDismissed(true);
    }

    setInstallPrompt(null);
  }

  function handleDismiss() {
    window.localStorage.setItem(DISMISS_STORAGE_KEY, "true");
    setIsDismissed(true);
  }

  return (
    <aside className="fixed bottom-4 left-4 right-4 z-[70] mx-auto max-w-[420px] border-2 border-black bg-white p-4 font-[var(--font-jost)] shadow-[5px_5px_0_rgba(0,0,0,0.22)] sm:left-auto sm:mx-0">
      <p className="text-[18px] font-semibold leading-tight text-black">
        Add Bayblaze to your home screen.
      </p>
      <p className="mt-2 text-[15px] leading-[1.45] text-[#585858]">
        {showIosPrompt
          ? "On iPhone, tap Share, then Add to Home Screen."
          : "Quick access when you want to order again."}
      </p>

      <div className="mt-4 flex gap-3">
        {installPrompt ? (
          <button
            type="button"
            className="h-10 border border-black bg-[var(--ast-global-color-0)] px-4 text-[15px] font-semibold uppercase tracking-[0.08em] text-white transition-colors hover:bg-black"
            onClick={handleInstallClick}
          >
            Add app
          </button>
        ) : null}

        <button
          type="button"
          className="h-10 border border-black bg-white px-4 text-[15px] font-semibold uppercase tracking-[0.08em] text-black transition-colors hover:bg-black hover:text-white"
          onClick={handleDismiss}
        >
          Not now
        </button>
      </div>
    </aside>
  );
}
