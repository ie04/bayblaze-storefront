"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function OrderCancelAction({
  orderReference,
}: {
  orderReference: string;
}) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  async function cancelOrder() {
    const confirmed = window.confirm(
      "Cancel this order? BayBlaze will remove it and release the items back to inventory.",
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setIsCancelling(true);

    try {
      const response = await fetch(
        `/api/orders/${encodeURIComponent(orderReference)}`,
        {
          method: "POST",
        },
      );
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          readString(payload?.error, payload?.message) ||
            "Order cancellation failed.",
        );
      }

      router.push("/orders");
      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Order cancellation failed.",
      );
      setIsCancelling(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        className="bayblaze-sharp-button bayblaze-sharp-button--outline w-full border-red-700 px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-red-800 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-[#d8d1c6] disabled:text-[#8a8a8a]"
        disabled={isCancelling}
        onClick={cancelOrder}
      >
        {isCancelling ? "Canceling..." : "Cancel order"}
      </button>
      {error ? (
        <p className="mt-3 text-[14px] font-medium leading-[1.45] text-red-800">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function readString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return "";
}
