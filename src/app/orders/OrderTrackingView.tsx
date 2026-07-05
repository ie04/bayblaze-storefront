import type { CustomerOrder, CustomerOrderItem } from "@/app/lib/medusa-auth";
import OrderLiveMap from "./OrderLiveMap";
import {
  formatDeliveryAddress,
  formatOrderDate,
  formatOrderNumber,
  formatOrderStatus,
  formatOrderTotal,
  getOrderDiscountSummary,
  getOrderDisplayTotal,
  getOrderItemTotal,
  getOrderItemTitle,
  getOrderLifecycleStatus,
  getOrderReference,
  getOrderRecipient,
  getScheduledDeliveryDisplay,
  getVariantLabel,
  isCompletedOrder,
} from "@/app/domain/orders";
import OrderCancelAction from "./OrderCancelAction";

export default function OrderTrackingView({
  mode = "page",
  onClose,
  order,
}: {
  mode?: "modal" | "page";
  onClose?: () => void;
  order: CustomerOrder;
}) {
  const isComplete = isCompletedOrder(order);
  const lifecycleStatus = getOrderLifecycleStatus(order);

  return (
    <section
      className={[
        "bayblaze-sharp-card overflow-hidden text-[#585858]",
        mode === "modal"
          ? "max-h-[calc(100vh-48px)] overflow-y-auto"
          : "",
      ].join(" ")}
    >
      <header className="flex flex-col gap-5 border-b border-[#e8e2d8] bg-[#f7f6f2] px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-7 sm:py-6">
        <div>
          <p className="text-[12px] font-semibold uppercase tracking-[0.16em] text-[var(--ast-global-color-1)]">
            Order Tracking
          </p>
          <h1 className="mt-2 text-[30px] font-semibold leading-none text-black sm:text-[42px]">
            {formatOrderNumber(order)}
          </h1>
          <p className="mt-3 text-[16px] font-medium leading-[1.5] text-black">
            {formatOrderStatus(lifecycleStatus)} - {formatOrderDate(order.created_at)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="bayblaze-sharp-badge bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.1em]">
            {isComplete ? formatOrderStatus(lifecycleStatus) : "Pending"}
          </span>
          {onClose ? (
            <button
              type="button"
              className="bayblaze-sharp-button bayblaze-sharp-button--outline px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.1em]"
              onClick={onClose}
            >
              Close
            </button>
          ) : null}
        </div>
      </header>

      <div className="grid gap-6 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid gap-6">
          {!isComplete ? <OrderProgress order={order} /> : null}
          {!isComplete ? <DriverMap order={order} /> : null}
          <OrderItems order={order} />
        </div>

        <aside className="grid h-fit gap-5">
          <OrderSummary order={order} />
          {!isComplete ? <DriverChat /> : null}
          {!isComplete ? (
            <OrderCancelAction orderReference={getOrderReference(order)} />
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function OrderSummary({ order }: { order: CustomerOrder }) {
  const scheduledDelivery = getScheduledDeliveryDisplay(order);
  const discount = getOrderDiscountSummary(order);
  const total = getOrderDisplayTotal(order);
  const currencyCode = order.currency_code ?? "usd";

  return (
    <section className="bayblaze-sharp-card bayblaze-sharp-card bayblaze-sharp-card--cream p-5">
      <h2 className="text-[20px] font-semibold leading-tight text-black">
        Summary
      </h2>
      <dl className="mt-4 grid gap-4 text-[15px] leading-[1.45]">
        <div>
          <dt className="font-semibold text-black">Customer</dt>
          <dd>{getOrderRecipient(order)}</dd>
        </div>
        <div>
          <dt className="font-semibold text-black">Delivery address</dt>
          <dd className="whitespace-pre-line">{formatDeliveryAddress(order)}</dd>
        </div>
        {scheduledDelivery ? (
          <div>
            <dt className="font-semibold text-black">Scheduled delivery</dt>
            <dd>{scheduledDelivery}</dd>
          </div>
        ) : null}
        <div>
          <dt className="font-semibold text-black">Payment</dt>
          <dd>Cash, Cash App, or Zelle on delivery</dd>
        </div>
        <div className="grid gap-2 border-t border-[#ded8cf] pt-4">
          {discount?.subtotal !== null && discount?.subtotal !== undefined ? (
            <div className="flex justify-between gap-4">
              <dt className="font-semibold text-black">Subtotal</dt>
              <dd>{formatOrderTotal(discount.subtotal, currencyCode)}</dd>
            </div>
          ) : null}
          {discount ? (
            <div className="flex justify-between gap-4 text-[var(--ast-global-color-1)]">
              <dt className="font-semibold">{discount.label}</dt>
              <dd className="font-semibold">
                -{formatOrderTotal(discount.amount, currencyCode)}
              </dd>
            </div>
          ) : null}
          <dt className="font-semibold text-black">Total</dt>
          <dd className="text-[22px] font-semibold text-black">
            {formatOrderTotal(total, currencyCode)}
          </dd>
        </div>
      </dl>
    </section>
  );
}

function OrderProgress({ order }: { order: CustomerOrder }) {
  const currentStep = getCurrentDeliveryStep(order);
  const steps = [
    { key: "placed", label: "Placed" },
    { key: "fulfilling", label: "Fulfilling" },
    { key: "out_for_delivery", label: "Out for delivery" },
    { key: "delivered", label: "Delivered" },
  ];
  const activeIndex = steps.findIndex((step) => step.key === currentStep);

  return (
    <section className="bayblaze-sharp-card p-5">
      <h2 className="text-[20px] font-semibold leading-tight text-black">
        Delivery timeline
      </h2>
      <ol className="mt-5 grid gap-4 sm:grid-cols-4">
        {steps.map((step, index) => {
          const isActive = index <= activeIndex;

          return (
            <li key={step.key} className="flex items-center gap-3 sm:block">
              <span
                className={[
                  "flex size-8 items-center justify-center rounded-full border text-[12px] font-semibold",
                  isActive
                    ? "border-[var(--ast-global-color-1)] bg-[var(--ast-global-color-1)] text-white"
                    : "border-[#d8d1c6] bg-[#f7f6f2] text-[#777]",
                ].join(" ")}
              >
                {index + 1}
              </span>
              <p className="mt-0 text-[14px] font-semibold leading-tight text-black sm:mt-3">
                {step.label}
              </p>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function DriverMap({ order }: { order: CustomerOrder }) {
  return (
    <OrderLiveMap
      fallbackAddress={formatDeliveryAddress(order)}
      orderReference={
        order.custom_display_id ??
        String(order.display_id ?? order.id)
      }
    />
  );
}

function DriverChat() {
  return (
    <section className="bayblaze-sharp-card p-5">
      <h2 className="text-[20px] font-semibold leading-tight text-black">
        Driver chat
      </h2>
      <div className="mt-4 grid gap-3">
        <div className="max-w-[85%] rounded-[8px] border border-[#ded8cf] bg-[#f7f6f2] px-4 py-3 text-[14px] leading-[1.45]">
          Driver assignment pending.
        </div>
        <label className="sr-only" htmlFor="driver-chat-message">
          Message driver
        </label>
        <div className="flex gap-2">
          <input
            id="driver-chat-message"
            className="bayblaze-sharp-input h-11 min-w-0 flex-1 px-3 text-[14px] outline-none"
            disabled
            placeholder="Message driver"
            type="text"
          />
          <button
            type="button"
            className="bayblaze-sharp-button bayblaze-sharp-button--outline px-3 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#777]"
            disabled
          >
            Send
          </button>
        </div>
      </div>
    </section>
  );
}

function OrderItems({ order }: { order: CustomerOrder }) {
  return (
    <section className="bayblaze-sharp-card p-5">
      <h2 className="text-[20px] font-semibold leading-tight text-black">
        Items
      </h2>
      {order.items?.length ? (
        <ul className="mt-5 grid gap-3">
          {order.items.map((item, index) => (
            <OrderItemRow
              currencyCode={order.currency_code}
              item={item}
              key={item.id ?? `${getOrderItemTitle(item)}-${index}`}
            />
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[15px] leading-[1.6]">Items unavailable.</p>
      )}
    </section>
  );
}

function OrderItemRow({
  currencyCode,
  item,
}: {
  currencyCode?: string | null;
  item: CustomerOrderItem;
}) {
  const itemTotal = getOrderItemTotal(item);

  return (
    <li className="flex gap-3 rounded-[8px] border border-[#eeeeee] bg-[#f7f6f2] p-3">
      {item.thumbnail ? (
        <img
          src={item.thumbnail}
          alt={getOrderItemTitle(item)}
          className="size-14 shrink-0 rounded-[8px] border border-[#e3ded5] bg-white object-contain p-1"
        />
      ) : (
        <div className="flex size-14 shrink-0 items-center justify-center rounded-[8px] border border-[#e3ded5] bg-white text-[10px] font-semibold uppercase tracking-[0.08em] text-[#8a8a8a]">
          Item
        </div>
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-semibold leading-snug text-black">
          {getOrderItemTitle(item)}
        </p>
        {getVariantLabel(item) ? (
          <p className="mt-1 text-[14px] leading-snug">
            {getVariantLabel(item)}
          </p>
        ) : null}
        <p className="mt-1 text-[14px] leading-snug">
          Qty: {item.quantity ?? 1}
        </p>
      </div>

      {itemTotal !== null && currencyCode ? (
        <p className="shrink-0 text-[14px] font-semibold text-black">
          {formatOrderTotal(itemTotal, currencyCode)}
        </p>
      ) : null}
    </li>
  );
}

function getCurrentDeliveryStep(order: CustomerOrder) {
  const lifecycleStatus = getOrderLifecycleStatus(order);

  if (lifecycleStatus === "completed") {
    return "delivered";
  }

  if (lifecycleStatus === "out_for_delivery") {
    return "out_for_delivery";
  }

  if (order.fulfillment_status === "shipped") {
    return "out_for_delivery";
  }

  if (order.fulfillment_status === "fulfilled") {
    return "delivered";
  }

  if (order.status === "pending") {
    return "fulfilling";
  }

  return "placed";
}
