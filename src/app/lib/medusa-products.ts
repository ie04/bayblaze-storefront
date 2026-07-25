import { connection } from "next/server";

import { getPublicStorefrontSettings } from "@/app/lib/storefront-settings";

type InventoryState = "ON_VEHICLE" | "IN_WAREHOUSE";
type ProductStatus = "draft" | "published";

type InventoryProductImage = {
  id?: string;
  url?: string;
};

type InventoryVariant = {
  id: string;
  productId: string;
  productTitle: string;
  title: string;
  sku: string;
  priceCents: number;
  imageUrl?: string;
  imageUrls?: string[];
  images?: Array<string | InventoryProductImage>;
  metadata: {
    assignedVehicleId?: string;
    availableQuantity?: number | string;
    barcode?: string;
    brand?: string;
    inventoryState?: InventoryState;
  };
  updatedAt: string;
};

type InventoryProduct = {
  id: string;
  collectionId?: string;
  collectionTitle?: string;
  description: string;
  title: string;
  handle: string;
  metadata: Record<string, string>;
  status: ProductStatus;
  category: string;
  thumbnail?: string;
  imageUrl?: string;
  imageUrls?: string[];
  images?: Array<string | InventoryProductImage>;
  productImages?: Array<string | InventoryProductImage>;
  variants: InventoryVariant[];
};

type InventorySnapshot = {
  products: InventoryProduct[];
};

export type InventoryLocationState = "ON_VEHICLE" | "IN_WAREHOUSE";

export type StorefrontProduct = {
  id: string;
  handle: string;
  name: string;
  variantId: string;
  inventoryState?: InventoryLocationState;
  availableQuantity?: number;
  sku: string;
  brand: string;
  collectionTitle: string;
  categories: { name: string; handle: string }[];
  originalPrice?: string;
  salePrice: string;
  saleBadge?: string;
  images: { src: string; alt: string }[];
  flavors: string[];
  variants: {
    id: string;
    title: string;
    sku: string;
    flavor?: string;
    inventoryState?: InventoryLocationState;
    availableQuantity?: number;
    images: { src: string; alt: string }[];
    optionValues: string[];
  }[];
  details: string[];
  specs: [string, string][];
};

type StorefrontVariant = StorefrontProduct["variants"][number];

export type ProductPreviewItem = {
  name: string;
  brand: string;
  image: string;
  href: string;
  originalPrice?: string;
  salePrice: string;
  position: string;
  isSale?: boolean;
  variantName?: string;
};

export type CheckoutDrinkUpsellItem = {
  availableQuantity?: number;
  flavor?: string;
  id: string;
  image: string;
  inventoryState?: InventoryLocationState;
  name: string;
  price: string;
  productHandle: string;
  productId: string;
  variantId: string;
};

export type ShopProductItem = {
  name: string;
  brand: string;
  inventoryState?: InventoryLocationState;
  availableQuantity?: number;
  flavor?: string;
  image: string;
  href: string;
  productHandle: string;
  productId: string;
  variantId: string;
  categories: string[];
  originalPrice?: string;
  salePrice: string;
  price: string;
  sortPrice: number;
  action: "Add to cart" | "Select options";
  isSale?: boolean;
  description: string;
  variantSearchTerms: string[];
};

const assetOrigin =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
  "https://api.bayblaze.net";

type StorefrontPricing = {
  priceAdjustmentCents: number;
};

const defaultStorefrontCategory = {
  name: "Uncategorized",
  handle: "uncategorized",
};

const storefrontCategoryBuckets = [
  {
    name: "Vapes",
    handle: "vapes",
    terms: ["vape", "vapes", "disposable"],
  },
  {
    name: "Cones & Wraps",
    handle: "cones-and-wraps",
    terms: ["cone", "cones", "wrap", "wraps", "paper", "papers", "rolling"],
  },
  {
    name: "Smoking Accessories",
    handle: "smoking-accessories",
    terms: ["accessory", "accessories", "lighter", "lighters", "tool", "tools"],
  },
];

const knownProductCopy: Record<
  string,
  Pick<StorefrontProduct, "brand" | "details">
> = {
  "lost-mary-mt35k-turbo": {
    brand: "Lost Mary",
    details: [
      "The MT35000 Turbo is a long-lasting disposable built for steady flavor, smooth vapor, and extended battery life.",
      "Regular mode reaches up to 35,000 puffs, while Turbo Mode is tuned for stronger output with up to 20,000 puffs.",
      "An 18mL capacity, mesh coil system, anti-burn support, USB-C charging, and a discreet smart display keep the device practical for daily use.",
    ],
  },
};

const metadataSpecFields: { key: string; label: string }[] = [
  { key: "spec_puffs", label: "Puffs" },
  { key: "spec_capacity", label: "Capacity" },
  { key: "spec_battery", label: "Battery" },
  { key: "spec_charging", label: "Charging" },
  { key: "spec_nicotine", label: "Nicotine" },
];

function normalizeInventoryAssetUrl(url: string) {
  if (!url) {
    return url;
  }

  if (url.startsWith("/")) {
    return `${assetOrigin}${url}`;
  }

  return url.replace(/^https?:\/\/localhost:9000(?=\/)/, assetOrigin);
}

function formatPrice(cents: number | undefined, pricing: StorefrontPricing) {
  if (!Number.isFinite(cents ?? Number.NaN)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(getAdjustedPriceCents(cents ?? 0, pricing) / 100);
}

function hasSalePrice(pricing: StorefrontPricing) {
  return pricing.priceAdjustmentCents > 0;
}

function getSaleBadge(pricing: StorefrontPricing) {
  return pricing.priceAdjustmentCents > 0
    ? `${formatPriceWithoutAdjustment(pricing.priceAdjustmentCents)} off`
    : undefined;
}

function getOriginalPrice(cents: number | undefined, pricing: StorefrontPricing) {
  return pricing.priceAdjustmentCents > 0 && Number.isFinite(cents ?? Number.NaN)
    ? formatPriceWithoutAdjustment(cents ?? 0)
    : undefined;
}

function getAdjustedPriceCents(cents: number, pricing: StorefrontPricing) {
  return Math.max(0, Math.round(cents) - pricing.priceAdjustmentCents);
}

function formatPriceWithoutAdjustment(cents: number) {
  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format(Math.max(0, Math.round(cents)) / 100);
}

function getFlavorValues(product: InventoryProduct) {
  if (product.variants.length <= 1) {
    return [];
  }

  return Array.from(
    new Set(
      product.variants.flatMap((variant) => splitOptionValue(variant.title)),
    ),
  );
}

function getVariantFlavor(product: InventoryProduct, variant: InventoryVariant) {
  return product.variants.length > 1 ? variant.title : undefined;
}

function getStorefrontVariants(product: InventoryProduct) {
  return product.variants.map((variant) => {
    const flavor = getVariantFlavor(product, variant);
    const variantImages = getVariantImages(product, variant);

    return {
      id: variant.id,
      title: variant.title,
      sku: variant.sku ?? "",
      flavor,
      inventoryState: getVariantInventoryState(variant),
      availableQuantity: getVariantAvailableQuantity(variant),
      images: variantImages.map((src, index) => ({
        src,
        alt:
          index === 0
            ? `${product.title} ${variant.title} image`
            : `${product.title} ${variant.title} image ${index + 1}`,
      })),
      optionValues: flavor ? splitOptionValue(flavor) : [],
    };
  });
}

function getVariantDisplayName(variant: StorefrontVariant) {
  return variant.flavor?.trim() || variant.title?.trim() || variant.sku?.trim() || "";
}

function getVariantImages(product: InventoryProduct, variant: InventoryVariant) {
  const urls = [
    ...(variant.imageUrls ?? []),
    variant.imageUrl,
    ...readInventoryImageValues(variant.images),
  ];

  return dedupeStrings(urls.map(readImageUrl).filter(Boolean));
}

function splitOptionValue(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getMetadataValue(product: InventoryProduct, key: string) {
  return (
    product.metadata?.[key] ??
    product.variants?.[0]?.metadata?.[
      key as keyof InventoryVariant["metadata"]
    ]
  );
}

function getVariantInventoryState(
  variant: InventoryVariant,
): InventoryLocationState | undefined {
  const value = variant.metadata?.inventoryState;

  return value === "ON_VEHICLE" || value === "IN_WAREHOUSE"
    ? value
    : undefined;
}

function getVariantAvailableQuantity(variant: InventoryVariant) {
  return normalizeInventoryQuantity(variant.metadata?.availableQuantity);
}

function normalizeInventoryQuantity(value: unknown) {
  if (typeof value === "string" && !value.trim()) {
    return undefined;
  }

  const quantity =
    typeof value === "number" || typeof value === "string"
      ? Number(value)
      : Number.NaN;

  return Number.isInteger(quantity) && quantity >= 0 ? quantity : undefined;
}

function getBrand(product: InventoryProduct) {
  const metadataBrand = getMetadataValue(product, "brand");

  if (typeof metadataBrand === "string" && metadataBrand.trim()) {
    return metadataBrand;
  }

  return knownProductCopy[product.handle]?.brand ?? "";
}

function getMetadataSpecs(product: InventoryProduct) {
  const specs: [string, string][] = [];

  metadataSpecFields.forEach(({ key, label }) => {
    const value = getMetadataValue(product, key);

    if (typeof value === "string" && value.trim()) {
      specs.push([label, value.trim()]);
    }
  });

  return specs;
}

function getCanonicalStorefrontCategories(product: InventoryProduct) {
  const metadataCategory = getMetadataValue(product, "inventoryCategory");
  const rawName =
    typeof metadataCategory === "string" && metadataCategory.trim()
      ? metadataCategory.trim()
      : product.category?.trim() || defaultStorefrontCategory.name;
  const bucket = getStorefrontCategoryBucket(rawName);
  const name = bucket?.name ?? rawName;

  return [
    {
      name,
      handle: bucket?.handle ?? toCategoryHandle(name),
    },
  ];
}

function getStorefrontCategoryBucket(categoryName: string) {
  const normalized = toCategoryHandle(categoryName);

  return storefrontCategoryBuckets.find((bucket) => {
    return (
      bucket.handle === normalized ||
      bucket.terms.some((term) => normalized.includes(term))
    );
  });
}

function toCategoryHandle(categoryName: string) {
  return categoryName
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function toStorefrontProduct(product: InventoryProduct, pricing: StorefrontPricing): StorefrontProduct {
  const firstVariant = product.variants?.[0];
  const variants = getStorefrontVariants(product);
  const priceCents = firstVariant?.priceCents;
  const knownCopy = knownProductCopy[product.handle];
  const metadataSpecs = getMetadataSpecs(product);
  const images = getProductImages(product);
  const categories = getCanonicalStorefrontCategories(product);

  return {
    id: product.id,
    handle: product.handle,
    name: product.title,
    variantId: firstVariant?.id ?? "",
    inventoryState: firstVariant
      ? getVariantInventoryState(firstVariant)
      : undefined,
    availableQuantity: firstVariant
      ? getVariantAvailableQuantity(firstVariant)
      : undefined,
    sku: firstVariant?.sku ?? "",
    brand: getBrand(product),
    collectionTitle: product.collectionTitle ?? categories[0]?.name ?? "",
    categories,
    originalPrice: getOriginalPrice(priceCents, pricing),
    salePrice: formatPrice(priceCents, pricing) || "Price unavailable",
    saleBadge: getSaleBadge(pricing),
    images: images.map((src, index) => ({
      src,
      alt:
        index === 0
          ? `${product.title} product image`
          : `${product.title} product image ${index + 1}`,
    })),
    flavors: getFlavorValues(product),
    variants,
    details: knownCopy?.details ?? [product.description ?? ""],
    specs: metadataSpecs,
  };
}

function getProductImages(product: InventoryProduct) {
  const fullResolutionUrls = [
    ...(product.imageUrls ?? []),
    product.imageUrl,
    ...readInventoryImageValues(product.images),
    ...readInventoryImageValues(product.productImages),
  ];

  const fallbackUrls = [product.thumbnail];

  return dedupeStrings(
    [...fullResolutionUrls, ...fallbackUrls].map(readImageUrl).filter(Boolean),
  );
}

function readInventoryImageValues(
  images?: Array<string | InventoryProductImage>,
) {
  return (images ?? []).flatMap((image) => {
    if (typeof image === "string") {
      return [image];
    }

    return image.url ? [image.url] : [];
  });
}

function readImageUrl(value: unknown) {
  return typeof value === "string" && value.trim()
    ? normalizeInventoryAssetUrl(value.trim())
    : "";
}

function dedupeStrings(values: string[]) {
  return Array.from(new Set(values));
}

function getShopVariantName(product: StorefrontProduct, variant: StorefrontVariant) {
  const variantName = getVariantDisplayName(variant);

  if (!variantName || product.variants.length <= 1) {
    return product.name;
  }

  return `${product.name} - ${variantName}`;
}

function getShopVariantSearchTerms(
  product: StorefrontProduct,
  variant: StorefrontVariant,
) {
  const variantName = getVariantDisplayName(variant);

  return Array.from(
    new Set(
      [
        variantName,
        variant.sku,
        ...variant.optionValues,
        variantName ? `${product.name} ${variantName}` : "",
        variantName && product.brand ? `${product.brand} ${variantName}` : "",
      ]
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  );
}

function toShopVariantItem(
  product: InventoryProduct,
  storefrontProduct: StorefrontProduct,
  variant: StorefrontVariant,
  pricing: StorefrontPricing,
): ShopProductItem {
  const priceCents = product.variants.find(
    (item) => item.id === variant.id,
  )?.priceCents;
  const formattedPrice = formatPrice(priceCents, pricing) || "Price unavailable";
  const image = variant.images[0]?.src ?? storefrontProduct.images[0]?.src ?? "";
  const variantName = getVariantDisplayName(variant);

  return {
    name: getShopVariantName(storefrontProduct, variant),
    brand: storefrontProduct.brand || "BayBlaze",
    inventoryState: variant.inventoryState,
    availableQuantity: variant.availableQuantity,
    flavor: variantName || undefined,
    image,
    href: `/product/${product.handle}?variant=${encodeURIComponent(variant.id)}`,
    productHandle: storefrontProduct.handle,
    productId: storefrontProduct.id,
    variantId: variant.id,
    categories: storefrontProduct.categories.map((category) => category.name),
    originalPrice: getOriginalPrice(priceCents, pricing),
    salePrice: formattedPrice,
    price: formattedPrice,
    sortPrice: Number.isFinite(priceCents ?? Number.NaN)
      ? getAdjustedPriceCents(priceCents ?? 0, pricing)
      : Number.MAX_SAFE_INTEGER,
    action: "Select options",
    isSale: hasSalePrice(pricing),
    description:
      product.description ??
      storefrontProduct.details.find(Boolean) ??
      "BayBlaze product available for local delivery.",
    variantSearchTerms: getShopVariantSearchTerms(storefrontProduct, variant),
  };
}

function toProductPreviewItem(
  product: InventoryProduct,
  index: number,
  pricing: StorefrontPricing,
): ProductPreviewItem {
  const priceCents = product.variants?.[0]?.priceCents;
  const image = getProductImages(product)[0] ?? "";
  const positions = ["left", "center", "right"];

  return {
    name: product.title,
    brand: getBrand(product) || "BayBlaze",
    image,
    href: `/product/${product.handle}`,
    originalPrice: getOriginalPrice(priceCents, pricing),
    salePrice: formatPrice(priceCents, pricing) || "Price unavailable",
    position: positions[index % positions.length],
    isSale: hasSalePrice(pricing),
  };
}

function toVariantProductPreviewItem(
  product: InventoryProduct,
  variant: InventoryVariant,
  index: number,
  pricing: StorefrontPricing,
): ProductPreviewItem {
  const storefrontProduct = toStorefrontProduct(product, pricing);
  const storefrontVariant = storefrontProduct.variants.find((item) => item.id === variant.id);
  const variantName = storefrontVariant ? getVariantDisplayName(storefrontVariant) : variant.title;
  const variantImages = getVariantImages(product, variant);
  const image = variantImages[0] ?? getProductImages(product)[0] ?? "";
  const positions = ["left", "center", "right"];

  return {
    name: variantName ? `${product.title} - ${variantName}` : product.title,
    brand: storefrontProduct.brand || "BayBlaze",
    image,
    href: `/product/${product.handle}?variant=${encodeURIComponent(variant.id)}`,
    originalPrice: getOriginalPrice(variant.priceCents, pricing),
    salePrice: formatPrice(variant.priceCents, pricing) || "Price unavailable",
    position: positions[index % positions.length],
    isSale: hasSalePrice(pricing),
    variantName: variantName || undefined,
  };
}

function toCheckoutDrinkUpsellItems(product: InventoryProduct, pricing: StorefrontPricing) {
  const storefrontProduct = toStorefrontProduct(product, pricing);

  return storefrontProduct.variants
    .map((variant): CheckoutDrinkUpsellItem => {
      const image = variant.images[0]?.src ?? storefrontProduct.images[0]?.src ?? "";
      const flavor = variant.flavor || (storefrontProduct.variants.length > 1 ? variant.title : undefined);

      return {
        availableQuantity: variant.availableQuantity,
        flavor,
        id: [variant.id, flavor || "default"].join("::"),
        image,
        inventoryState: variant.inventoryState,
        name: storefrontProduct.name,
        price: formatPrice(
          product.variants.find((item) => item.id === variant.id)?.priceCents,
          pricing,
        ) || storefrontProduct.salePrice,
        productHandle: storefrontProduct.handle,
        productId: storefrontProduct.id,
        variantId: variant.id,
      };
    })
    .filter((item) => {
      return (
        Boolean(item.variantId) &&
        Boolean(item.image) &&
        Boolean(item.inventoryState) &&
        (item.availableQuantity ?? 0) > 0
      );
    });
}

function isDrinkProduct(product: InventoryProduct) {
  const values = [
    product.category,
    product.collectionTitle,
    product.metadata?.inventoryCategory,
    product.metadata?.category,
  ];

  return values.some((value) => {
    if (typeof value !== "string") {
      return false;
    }

    const handle = toCategoryHandle(value);

    return handle.includes("drink") || handle.includes("beverage");
  });
}

async function getPublishedInventoryProducts() {
  const snapshot = await fetchInventorySnapshot();

  return snapshot.products.filter((product) => product.status === "published");
}

async function fetchInventorySnapshot() {
  await connection();

  const { bayblazeApiToken, bayblazeApiUrl } = getBayBlazeApiConfig();

  if (!bayblazeApiToken) {
    throw new Error("BAYBLAZE_API_SERVICE_TOKEN is not configured for storefront inventory fetches.");
  }

  const response = await fetch(`${bayblazeApiUrl}/v1/inventory`, {
    headers: {
      Authorization: `Bearer ${bayblazeApiToken}`,
      "x-bayblaze-api-token": bayblazeApiToken,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Unable to load inventory from BayBlaze API: HTTP ${response.status}.`,
    );
  }

  return (await response.json()) as InventorySnapshot;
}

export async function getStorefrontPriceAdjustmentCents() {
  return (await getStorefrontPricing()).priceAdjustmentCents;
}

export async function getStorefrontCartCatalogVersion() {
  try {
    const products = await getPublishedInventoryProducts();

    return products
      .flatMap((product) =>
        product.variants.map((variant) =>
          [
            product.id,
            product.status,
            variant.id,
            variant.priceCents,
            variant.metadata?.inventoryState ?? "",
            variant.metadata?.availableQuantity ?? "",
            variant.updatedAt,
          ].join(":"),
        ),
      )
      .sort()
      .join("|");
  } catch {
    return "";
  }
}

async function getStorefrontPricing(): Promise<StorefrontPricing> {
  const settings = await getPublicStorefrontSettings();
  return { priceAdjustmentCents: settings.priceAdjustmentCents };
}

function getBayBlazeApiConfig() {
  const bayblazeApiUrl =
    process.env.BAYBLAZE_API_URL?.trim().replace(/\/$/, "") ??
    "https://api.bayblaze.net";
  const bayblazeApiToken =
    process.env.BAYBLAZE_API_SERVICE_TOKEN?.trim() ?? "";

  return { bayblazeApiToken, bayblazeApiUrl };
}

export async function getProductByStorefrontHandle(handle: string) {
  const [products, pricing] = await Promise.all([
    getPublishedInventoryProducts(),
    getStorefrontPricing(),
  ]);
  const product = products.find((item) => item.handle === handle);

  return product ? toStorefrontProduct(product, pricing) : undefined;
}

export async function getFastDeliveryProductPreviews() {
  let products: InventoryProduct[];
  let pricing: StorefrontPricing;

  try {
    [products, pricing] = await Promise.all([
      getPublishedInventoryProducts(),
      getStorefrontPricing(),
    ]);
  } catch {
    return [];
  }

  return products
    .flatMap((product) => {
      return product.variants
        .filter((variant) => {
          return (
            getVariantInventoryState(variant) === "ON_VEHICLE" &&
            (getVariantAvailableQuantity(variant) ?? 0) > 0
          );
        })
        .map((variant) => ({ product, variant }));
    })
    .map(({ product, variant }, index) => toVariantProductPreviewItem(product, variant, index, pricing))
    .filter((product) => Boolean(product.image));
}

export async function getShopProducts() {
  let products: InventoryProduct[];
  let pricing: StorefrontPricing;

  try {
    [products, pricing] = await Promise.all([
      getPublishedInventoryProducts(),
      getStorefrontPricing(),
    ]);
  } catch {
    return [];
  }

  return products
    .flatMap((product) => {
      const storefrontProduct = toStorefrontProduct(product, pricing);

      return storefrontProduct.variants.map((variant) =>
        toShopVariantItem(product, storefrontProduct, variant, pricing),
      );
    })
    .filter((product) => {
      return Boolean(product.image);
    });
}

export async function getCheckoutDrinkUpsellItems() {
  let products: InventoryProduct[];
  let pricing: StorefrontPricing;

  try {
    [products, pricing] = await Promise.all([
      getPublishedInventoryProducts(),
      getStorefrontPricing(),
    ]);
  } catch {
    return [];
  }

  return products
    .filter(isDrinkProduct)
    .flatMap((product) => toCheckoutDrinkUpsellItems(product, pricing))
    .slice(0, 6);
}

export function getShopSearchSuggestions(products: ShopProductItem[]) {
  return Array.from(
    new Set(
      products
        .flatMap((product) => [
          product.name,
          product.brand,
          ...product.categories,
          ...product.variantSearchTerms,
        ])
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  ).slice(0, 80);
}

export async function getProductPreviewsByCategoryHandle(
  categoryHandle: string,
) {
  let products: InventoryProduct[];
  let pricing: StorefrontPricing;

  try {
    [products, pricing] = await Promise.all([
      getPublishedInventoryProducts(),
      getStorefrontPricing(),
    ]);
  } catch {
    return [];
  }

  return products
    .filter((product) => {
      return getCanonicalStorefrontCategories(product).some(
        (category) => category.handle === categoryHandle,
      );
    })
    .slice(0, 12)
    .map((product, index) => toProductPreviewItem(product, index, pricing))
    .filter((product) => {
      return Boolean(product.image);
    });
}
