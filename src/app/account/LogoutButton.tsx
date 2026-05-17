"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  async function handleLogout() {
    setIsLoggingOut(true);

    await fetch("/api/auth/logout", {
      method: "POST",
    });

    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      disabled={isLoggingOut}
      className="bayblaze-soft-button w-full px-5 py-3 text-[15px] font-semibold leading-none disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
      onClick={handleLogout}
    >
      {isLoggingOut ? "Signing out..." : "Sign Out"}
    </button>
  );
}
