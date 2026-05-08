"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";

export type CartItem = {
  id: string;
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
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
};

const CART_STORAGE_KEY = "bayblaze-cart-items";
const EMPTY_CART_ITEMS: CartItem[] = [];

const CartContext = createContext<CartContextValue | null>(null);

let cartSnapshot = EMPTY_CART_ITEMS;
let cartSnapshotRaw = "";

const cartListeners = new Set<() => void>();

function readStoredCartItems() {
  if (typeof window === "undefined") {
    return EMPTY_CART_ITEMS;
  }

  try {
    const savedCart = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!savedCart) {
      cartSnapshot = EMPTY_CART_ITEMS;
      cartSnapshotRaw = "";
      return cartSnapshot;
    }

    if (savedCart === cartSnapshotRaw) {
      return cartSnapshot;
    }

    const parsedCart = JSON.parse(savedCart);

    cartSnapshot = Array.isArray(parsedCart)
      ? (parsedCart as CartItem[])
      : EMPTY_CART_ITEMS;
    cartSnapshotRaw = savedCart;
  } catch {
    cartSnapshot = EMPTY_CART_ITEMS;
    cartSnapshotRaw = "";
  }

  return cartSnapshot;
}

function getCartSnapshot() {
  return readStoredCartItems();
}

function getCartServerSnapshot() {
  return EMPTY_CART_ITEMS;
}

function emitCartChange() {
  cartListeners.forEach((listener) => listener());
}

function subscribeToCart(listener: () => void) {
  cartListeners.add(listener);

  function handleStorage(event: StorageEvent) {
    if (event.key === CART_STORAGE_KEY) {
      cartSnapshotRaw = "";
      emitCartChange();
    }
  }

  window.addEventListener("storage", handleStorage);

  return () => {
    cartListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

function saveCartItems(items: CartItem[]) {
  cartSnapshot = items;
  cartSnapshotRaw = JSON.stringify(items);

  window.localStorage.setItem(CART_STORAGE_KEY, cartSnapshotRaw);
  emitCartChange();
}

function updateCartItems(updater: (items: CartItem[]) => CartItem[]) {
  saveCartItems(updater(readStoredCartItems()));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(
    subscribeToCart,
    getCartSnapshot,
    getCartServerSnapshot,
  );
  const [isCartOpen, setIsCartOpen] = useState(false);

  const cartCount = useMemo(() => {
    return items.reduce((total, item) => total + item.quantity, 0);
  }, [items]);

  function addItem(item: CartItem) {
    updateCartItems((currentItems) => {
      const existingItem = currentItems.find(
        (currentItem) => currentItem.id === item.id
      );

      if (existingItem) {
        return currentItems.map((currentItem) =>
          currentItem.id === item.id
            ? {
                ...currentItem,
                quantity: currentItem.quantity + item.quantity,
              }
            : currentItem
        );
      }

      return [...currentItems, item];
    });

    setIsCartOpen(true);
  }

  function removeItem(id: string) {
    updateCartItems((currentItems) =>
      currentItems.filter((item) => item.id !== id)
    );
  }

  function clearCart() {
    saveCartItems(EMPTY_CART_ITEMS);
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
