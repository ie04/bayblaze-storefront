"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export type CartItem = {
  id: string;
  availableQuantity?: number;
  variantId?: string;
  productId?: string;
  productHandle?: string;
  inventoryState?: "ON_VEHICLE" | "IN_WAREHOUSE";
  name: string;
  flavor?: string;
  image?: string;
  price?: string;
  quantity: number;
};

type CartContextValue = {
  items: CartItem[];
  cartCount: number;
  isCartOpen: boolean;
  addItem: (item: CartItem, options?: { openCart?: boolean }) => void;
  removeItem: (id: string) => void;
  setItemQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CART_STORAGE_KEY = "bayblaze-cart-items";
const CART_PRICE_ADJUSTMENT_STORAGE_KEY = "bayblaze-cart-price-adjustment-cents";
const EMPTY_CART_ITEMS: CartItem[] = [];
const SITEWIDE_PRICE_ADJUSTMENT_CENTS = normalizePriceAdjustmentCents(
  process.env.NEXT_PUBLIC_BAYBLAZE_PRICE_ADJUSTMENT_CENTS,
);

const CartContext = createContext<CartContextValue | null>(null);

function readStoredCartItems() {
  if (typeof window === "undefined") {
    return EMPTY_CART_ITEMS;
  }

  try {
    const savedAdjustment = window.localStorage.getItem(
      CART_PRICE_ADJUSTMENT_STORAGE_KEY,
    );

    if (savedAdjustment !== String(SITEWIDE_PRICE_ADJUSTMENT_CENTS)) {
      window.localStorage.removeItem(CART_STORAGE_KEY);
      window.localStorage.setItem(
        CART_PRICE_ADJUSTMENT_STORAGE_KEY,
        String(SITEWIDE_PRICE_ADJUSTMENT_CENTS),
      );
      return EMPTY_CART_ITEMS;
    }

    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      return EMPTY_CART_ITEMS;
    }

    const parsedCart = JSON.parse(savedCart);

    return Array.isArray(parsedCart)
      ? (parsedCart as CartItem[])
      : EMPTY_CART_ITEMS;
  } catch {
    return EMPTY_CART_ITEMS;
  }
}

function saveCartItems(items: CartItem[]) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      CART_PRICE_ADJUSTMENT_STORAGE_KEY,
      String(SITEWIDE_PRICE_ADJUSTMENT_CENTS),
    );
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }
}

function normalizePriceAdjustmentCents(value: unknown) {
  const number =
    typeof value === "string" || typeof value === "number"
      ? Number(value)
      : Number.NaN;

  return Number.isInteger(number) && number > 0
    ? Math.min(number, 1_000_000_00)
    : 0;
}

function getLimitedQuantity(quantity: number, availableQuantity?: number) {
  const safeQuantity = Math.max(0, quantity);

  if (typeof availableQuantity !== "number") {
    return safeQuantity;
  }

  return Math.min(safeQuantity, Math.max(0, availableQuantity));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(EMPTY_CART_ITEMS);
  const [isCartOpen, setIsCartOpen] = useState(false);

  useEffect(() => {
    const hydrationTimer = window.setTimeout(() => {
      setItems(readStoredCartItems());
    }, 0);

    function handleStorage(event: StorageEvent) {
      if (event.key === CART_STORAGE_KEY) {
        setItems(readStoredCartItems());
      }
    }

    window.addEventListener("storage", handleStorage);

    return () => {
      window.clearTimeout(hydrationTimer);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const cartCount = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  function addItem(item: CartItem, options: { openCart?: boolean } = {}) {
    setItems((currentItems) => {
      const existingItem = currentItems.find(
        (currentItem) => currentItem.id === item.id
      );

      if (existingItem) {
        const nextItems = currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                ...item,
                quantity: getLimitedQuantity(
                  currentItem.quantity + item.quantity,
                  item.availableQuantity ?? currentItem.availableQuantity,
                ),
              }
            : currentItem
        );

        saveCartItems(nextItems);
        return nextItems;
      }

      const limitedItem = {
        ...item,
        quantity: getLimitedQuantity(item.quantity, item.availableQuantity),
      };

      if (limitedItem.quantity <= 0) {
        return currentItems;
      }

      const nextItems = [...currentItems, limitedItem];

      saveCartItems(nextItems);
      return nextItems;
    });

    if (options.openCart !== false) {
      setIsCartOpen(true);
    }
  }

  function removeItem(id: string) {
    setItems((currentItems) => {
      const nextItems = currentItems.filter((item) => item.id !== id);

      saveCartItems(nextItems);
      return nextItems;
    });
  }

  function setItemQuantity(id: string, quantity: number) {
    setItems((currentItems) => {
      const nextItems = currentItems
        .map((item) =>
          item.id === id
            ? {
                ...item,
                quantity: getLimitedQuantity(quantity, item.availableQuantity),
              }
            : item
        )
        .filter((item) => item.quantity > 0);

      saveCartItems(nextItems);
      return nextItems;
    });
  }

  function clearCart() {
    saveCartItems(EMPTY_CART_ITEMS);
    setItems(EMPTY_CART_ITEMS);
  }

  function openCart() {
    setIsCartOpen(true);
  }

  function closeCart() {
    setIsCartOpen(false);
  }

  return (
    <CartContext.Provider
      value={{
        items,
        cartCount,
        isCartOpen,
        addItem,
        removeItem,
        setItemQuantity,
        clearCart,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("useCart must be used inside CartProvider");
  }

  return context;
}
