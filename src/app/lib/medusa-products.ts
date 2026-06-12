import { connection } from "next/server";

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

export type ProductPreviewItem = {
  name: string;
  brand: string;
  image: string;
  href: string;
  originalPrice?: string;
  salePrice: string;
  position: string;
  isSale?: boolean;
};

export type ShopProductItem = {
  name: string;
  brand: string;
  inventoryState?: InventoryLocationState;
  availableQuantity?: number;
  image: string;
  href: string;
  categories: string[];
  originalPrice?: string;
  salePrice: string;
  price: string;
  sortPrice: number;
  action: "Add to cart" | "Select options";
  isSale?: boolean;
  description: string;
};

const assetOrigin =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
  "https://api.bayblaze.net";

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

function formatPrice(cents?: number) {
  if (!Number.isFinite(cents ?? Number.NaN)) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    currency: "USD",
    style: "currency",
  }).format((cents ?? 0) / 100);
}

function hasSalePrice() {
  return false;
}

function getSaleBadge() {
  return undefined;
}

function getOriginalPrice() {
  return undefined;
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

function toStorefrontProduct(product: InventoryProduct): StorefrontProduct {
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
    originalPrice: getOriginalPrice(),
    salePrice: formatPrice(priceCents) || "Price unavailable",
    saleBadge: getSaleBadge(),
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

function toShopProductItem(product: InventoryProduct): ShopProductItem {
  const storefrontProduct = toStorefrontProduct(product);
  const priceCents = product.variants?.[0]?.priceCents;
  const formattedPrice = formatPrice(priceCents) || "Price unavailable";

  return {
    name: product.title,
    brand: storefrontProduct.brand || "BayBlaze",
    inventoryState: storefrontProduct.inventoryState,
    availableQuantity: storefrontProduct.availableQuantity,
    image: storefrontProduct.images[0]?.src ?? "",
    href: `/product/${product.handle}`,
    categories: storefrontProduct.categories.map((category) => category.name),
    originalPrice: getOriginalPrice(),
    salePrice: formattedPrice,
    price: formattedPrice,
    sortPrice: priceCents ?? Number.MAX_SAFE_INTEGER,
    action: "Select options",
    isSale: hasSalePrice(),
    description:
      product.description ??
      storefrontProduct.details.find(Boolean) ??
      "BayBlaze product available for local delivery.",
  };
}

function hasFastDeliveryInventory(product: InventoryProduct) {
  return product.variants.some((variant) => {
    return (
      getVariantInventoryState(variant) === "ON_VEHICLE" &&
      (getVariantAvailableQuantity(variant) ?? 0) > 0
    );
  });
}

function toProductPreviewItem(
  product: InventoryProduct,
  index: number,
): ProductPreviewItem {
  const priceCents = product.variants?.[0]?.priceCents;
  const image = getProductImages(product)[0] ?? "";
  const positions = ["left", "center", "right"];

  return {
    name: product.title,
    brand: getBrand(product) || "BayBlaze",
    image,
    href: `/product/${product.handle}`,
    originalPrice: getOriginalPrice(),
    salePrice: formatPrice(priceCents) || "Price unavailable",
    position: positions[index % positions.length],
    isSale: hasSalePrice(),
  };
}

async function getPublishedInventoryProducts() {
  const snapshot = await fetchInventorySnapshot();

  return snapshot.products.filter((product) => product.status === "published");
}

async function fetchInventorySnapshot() {
  await connection();

  const bayblazeApiUrl =
    process.env.BAYBLAZE_API_URL?.trim().replace(/\/$/, "") ??
    "https://api.bayblaze.net";
  const bayblazeApiToken =
    process.env.BAYBLAZE_API_SERVICE_TOKEN?.trim() ?? "";

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

export async function getProductByStorefrontHandle(handle: string) {
  const products = await getPublishedInventoryProducts();
  const product = products.find((item) => item.handle === handle);

  return product ? toStorefrontProduct(product) : undefined;
}

export async function getFastDeliveryProductPreviews() {
  let products: InventoryProduct[];

  try {
    products = await getPublishedInventoryProducts();
  } catch {
    return [];
  }

  return products
    .filter(hasFastDeliveryInventory)
    .map((product, index) => toProductPreviewItem(product, index));
}

export async function getShopProducts() {
  let products: InventoryProduct[];

  try {
    products = await getPublishedInventoryProducts();
  } catch {
    return [];
  }

  return products.map(toShopProductItem).filter((product) => {
    return Boolean(product.image);
  });
}

export async function getProductPreviewsByCategoryHandle(
  categoryHandle: string,
) {
  let products: InventoryProduct[];

  try {
    products = await getPublishedInventoryProducts();
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
    .map(toProductPreviewItem)
    .filter((product) => {
      return Boolean(product.image);
    });
}
