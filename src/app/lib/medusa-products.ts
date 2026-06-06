type MedusaCategory = {
  name: string;
  handle: string;
};

type MedusaCollection = {
  title: string;
  handle: string;
};

type MedusaImage = {
  url: string;
};

type MedusaOptionValue = {
  value: string;
};

type MedusaOption = {
  title: string;
  values?: MedusaOptionValue[];
};

type MedusaVariantOption = {
  value: string;
  option?: {
    title: string;
  };
};

type MedusaCalculatedPrice = {
  calculated_amount: number;
  original_amount: number;
  currency_code: string;
};

type MedusaVariant = {
  id: string;
  title: string;
  sku?: string | null;
  metadata?: Record<string, unknown> | null;
  options?: MedusaVariantOption[];
  calculated_price?: MedusaCalculatedPrice;
};

type MedusaProduct = {
  id: string;
  title: string;
  handle: string;
  subtitle?: string | null;
  description?: string | null;
  thumbnail?: string | null;
  metadata?: Record<string, unknown> | null;
  collection?: MedusaCollection | null;
  categories?: MedusaCategory[];
  images?: MedusaImage[];
  options?: MedusaOption[];
  variants?: MedusaVariant[];
};

type MedusaProductsResponse = {
  products: MedusaProduct[];
};

type MedusaProductCategoriesResponse = {
  product_categories: MedusaProductCategory[];
};

type MedusaProductCategory = {
  id: string;
  parent_category_id?: string | null;
  mpath?: string | null;
  category_children?: MedusaProductCategory[];
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
    optionValues: string[];
  }[];
  details: string[];
  specs: [string, string][];
};

export type ProductPreviewItem = {
  name: string;
  image: string;
  href: string;
  originalPrice?: string;
  salePrice: string;
  position: string;
  isSale?: boolean;
};

const backendUrl =
  process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL?.replace(/\/$/, "") ??
  "http://localhost:9000";

const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;

const defaultRegionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID;

const defaultStorefrontCategory = {
  name: "Vapes",
  handle: "vapes",
};

const storefrontCategoryAliases = [
  {
    name: "Vapes",
    handle: "vapes",
    aliases: ["vape", "vapes", "disposable vape", "disposable vapes"],
  },
  {
    name: "Cones & Wraps",
    handle: "cones-wraps",
    aliases: [
      "cones",
      "cone",
      "wraps",
      "wrap",
      "papers",
      "rolling papers",
      "rolling paper",
      "pre rolled cones",
      "pre rolled cone",
      "pre-rolled cones",
      "pre-rolled cone",
      "cones and wraps",
      "cones wraps",
      "wraps papers",
      "cones and rolling papers",
    ],
  },
  {
    name: "Smoking Accessories",
    handle: "smoking-accessories",
    aliases: [
      "smoking accessories",
      "accessories",
      "accessory",
      "lighters",
      "lighter",
      "tools",
      "nicotine pouches",
      "nicotine pouch",
      "pouches",
      "zyn",
    ],
  },
];


function normalizeMedusaAssetUrl(url: string) {
  if (!url) {
    return url;
  }

  return url.replace(/^https?:\/\/localhost:9000(?=\/)/, backendUrl);
}

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

const placeholderSpecs: [string, string][] = [
  ["Placeholder fact", "Add spec_puffs metadata"],
  ["Placeholder detail", "Add spec_capacity metadata"],
  ["Placeholder spec", "Add spec_battery metadata"],
];

function getHeaders() {
  const headers = new Headers();

  if (publishableKey) {
    headers.set("x-publishable-api-key", publishableKey);
  }

  return headers;
}

async function getDefaultRegionId() {
  if (defaultRegionId) {
    return defaultRegionId;
  }

  let response: Response;

  try {
    response = await fetch(`${backendUrl}/store/regions?limit=1`, {
      headers: getHeaders(),
      cache: "no-store",
    });
  } catch {
    return undefined;
  }

  if (!response.ok) {
    return undefined;
  }

  const data = (await response.json()) as { regions?: { id: string }[] };
  return data.regions?.[0]?.id;
}

function formatPrice(price?: MedusaCalculatedPrice) {
  if (!price) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency_code.toUpperCase(),
  }).format(price.calculated_amount);
}

function getOriginalPrice(price?: MedusaCalculatedPrice) {
  if (!price || price.original_amount <= price.calculated_amount) {
    return undefined;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: price.currency_code.toUpperCase(),
  }).format(price.original_amount);
}

function getSaleBadge(price?: MedusaCalculatedPrice) {
  if (!price || price.original_amount <= price.calculated_amount) {
    return undefined;
  }

  const percentOff = Math.round(
    ((price.original_amount - price.calculated_amount) / price.original_amount) *
      100,
  );

  return `${percentOff}% OFF`;
}

function hasSalePrice(price?: MedusaCalculatedPrice) {
  return Boolean(price && price.original_amount > price.calculated_amount);
}

function getFlavorValues(product: MedusaProduct) {
  const flavorOption = product.options?.find(
    (option) => option.title.toLowerCase() === "flavor",
  );

  const values =
    flavorOption?.values?.map((value) => value.value) ??
    product.variants
      ?.flatMap((variant) => variant.options ?? [])
      .filter((option) => option.option?.title.toLowerCase() === "flavor")
      .map((option) => option.value) ??
    [];

  return [...new Set(values.flatMap((value) => splitOptionValue(value)))];
}

function getVariantFlavor(variant: MedusaVariant) {
  const flavorOption = variant.options?.find(
    (option) => option.option?.title.toLowerCase() === "flavor",
  );

  return flavorOption?.value;
}

function getStorefrontVariants(product: MedusaProduct) {
  return (product.variants ?? []).map((variant) => {
    const flavor = getVariantFlavor(variant);
    const inventoryState = getVariantInventoryState(variant);
    const availableQuantity = getVariantAvailableQuantity(variant);

    return {
      id: variant.id,
      title: variant.title,
      sku: variant.sku ?? "",
      flavor,
      inventoryState,
      availableQuantity,
      optionValues: flavor ? splitOptionValue(flavor) : [],
    };
  });
}

function splitOptionValue(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getMetadataValue(product: MedusaProduct, key: string) {
  return product.metadata?.[key] ?? product.variants?.[0]?.metadata?.[key];
}

function getVariantMetadataValue(variant: MedusaVariant, ...keys: string[]) {
  for (const key of keys) {
    const value = variant.metadata?.[key];

    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return undefined;
}

function getVariantInventoryState(
  variant: MedusaVariant,
): InventoryLocationState | undefined {
  const value = getVariantMetadataValue(
    variant,
    "inventoryState",
    "inventory_state",
  );

  return value === "ON_VEHICLE" || value === "IN_WAREHOUSE"
    ? value
    : undefined;
}

function getVariantAvailableQuantity(variant: MedusaVariant) {
  const value = getVariantMetadataValue(
    variant,
    "availableQuantity",
    "available_quantity",
  );

  return normalizeInventoryQuantity(value);
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

function getBrand(product: MedusaProduct) {
  const metadataBrand = getMetadataValue(product, "brand");

  if (typeof metadataBrand === "string" && metadataBrand.trim()) {
    return metadataBrand;
  }

  return knownProductCopy[product.handle]?.brand ?? "";
}

function getMetadataSpecs(product: MedusaProduct) {
  const specs: [string, string][] = [];

  metadataSpecFields.forEach(({ key, label }) => {
    const value = getMetadataValue(product, key);

    if (typeof value === "string" && value.trim()) {
      specs.push([label, value.trim()]);
    }
  });

  return specs;
}

function getCanonicalStorefrontCategories(product: MedusaProduct) {
  const rawCategoryText = [
    product.collection?.title,
    ...(product.categories ?? []).flatMap((category) => [
      category.name,
      category.handle,
    ]),
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeCategoryText)
    .join(" ");

  const category =
    storefrontCategoryAliases.find((candidate) => {
      return candidate.aliases.some((alias) =>
        rawCategoryText.includes(normalizeCategoryText(alias)),
      );
    }) ?? defaultStorefrontCategory;

  return [
    {
      name: category.name,
      handle: category.handle,
    },
  ];
}

function normalizeCategoryText(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function toStorefrontProduct(product: MedusaProduct): StorefrontProduct {
  const firstVariant = product.variants?.[0];
  const variants = getStorefrontVariants(product);
  const price = firstVariant?.calculated_price;
  const knownCopy = knownProductCopy[product.handle];
  const metadataSpecs = getMetadataSpecs(product);
  const images = product.images?.length
    ? product.images.map((image) => normalizeMedusaAssetUrl(image.url))
    : [product.thumbnail]
        .filter((image): image is string => Boolean(image))
        .map(normalizeMedusaAssetUrl);
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
    collectionTitle: product.collection?.title ?? categories[0]?.name ?? "",
    categories,
    originalPrice: getOriginalPrice(price),
    salePrice: formatPrice(price) || "Price unavailable",
    saleBadge: getSaleBadge(price),
    images: images.map((src, index) => ({
      src,
      alt:
        index === 0
          ? `${product.title} product image`
          : `${product.title} product image ${index + 1}`,
    })),
    flavors: getFlavorValues(product),
    variants,
    details: knownCopy?.details ?? [product.description ?? product.subtitle ?? ""],
    specs: metadataSpecs.length ? metadataSpecs : placeholderSpecs,
  };
}

function toProductPreviewItem(
  product: MedusaProduct,
  index: number,
): ProductPreviewItem {
  const price = product.variants?.[0]?.calculated_price;
  const image = normalizeMedusaAssetUrl(
    product.thumbnail ?? product.images?.[0]?.url ?? "",
  );
  const positions = ["left", "center", "right"];

  return {
    name: product.title,
    image,
    href: `/product/${product.handle}`,
    originalPrice: getOriginalPrice(price),
    salePrice: formatPrice(price) || "Price unavailable",
    position: positions[index % positions.length],
    isSale: hasSalePrice(price),
  };
}

function getCategoryIdsWithChildren(category: MedusaProductCategory): string[] {
  const childIds: string[] =
    category.category_children?.flatMap(getCategoryIdsWithChildren) ?? [];

  return [category.id, ...childIds];
}

async function getAllProductCategories() {
  const categoryParams = new URLSearchParams({
    limit: "100",
    fields: "id,parent_category_id,mpath,*category_children",
  });
  let categoryResponse: Response;

  try {
    categoryResponse = await fetch(
      `${backendUrl}/store/product-categories?${categoryParams.toString()}`,
      {
        headers: getHeaders(),
        cache: "no-store",
      },
    );
  } catch {
    return [];
  }

  if (!categoryResponse.ok) {
    return [];
  }

  const categoryData =
    (await categoryResponse.json()) as MedusaProductCategoriesResponse;

  return categoryData.product_categories;
}

async function getCategoryIdsWithDescendants(category: MedusaProductCategory) {
  const allCategories = await getAllProductCategories();

  if (!allCategories.length) {
    return getCategoryIdsWithChildren(category);
  }

  return allCategories
    .filter((candidate) => {
      return (
        candidate.id === category.id ||
        candidate.parent_category_id === category.id ||
        candidate.mpath?.split(".").includes(category.id)
      );
    })
    .map((candidate) => candidate.id);
}

export async function getProductByStorefrontHandle(handle: string) {
  const regionId = await getDefaultRegionId();
  const searchParams = new URLSearchParams({
    handle,
    fields:
      "*variants.calculated_price,*variants,*variants.metadata,*variants.options,*options,*options.values,*images,*categories,*collection,*metadata",
  });

  if (regionId) {
    searchParams.set("region_id", regionId);
  }

  const response = await fetch(
    `${backendUrl}/store/products?${searchParams.toString()}`,
    {
      headers: getHeaders(),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Unable to load product "${handle}" from Medusa.`);
  }

  const data = (await response.json()) as MedusaProductsResponse;
  const product = data.products[0];

  return product ? toStorefrontProduct(product) : undefined;
}

export async function getProductPreviewsByCategoryHandle(
  categoryHandle: string,
) {
  const categoryParams = new URLSearchParams({
    handle: categoryHandle,
    limit: "1",
  });
  let categoryResponse: Response;

  try {
    categoryResponse = await fetch(
      `${backendUrl}/store/product-categories?${categoryParams.toString()}`,
      {
        headers: getHeaders(),
        cache: "no-store",
      },
    );
  } catch {
    return [];
  }

  if (!categoryResponse.ok) {
    return [];
  }

  const categoryData =
    (await categoryResponse.json()) as MedusaProductCategoriesResponse;
  const category = categoryData.product_categories[0];

  if (!category) {
    return [];
  }

  const categoryIds = await getCategoryIdsWithDescendants(category);

  const regionId = await getDefaultRegionId();
  const productParams = new URLSearchParams({
    limit: "12",
    fields: "title,handle,thumbnail,*images,*variants.calculated_price",
  });

  categoryIds.forEach((categoryId) => {
    productParams.append("category_id[]", categoryId);
  });

  if (regionId) {
    productParams.set("region_id", regionId);
  }

  let productResponse: Response;

  try {
    productResponse = await fetch(
      `${backendUrl}/store/products?${productParams.toString()}`,
      {
        headers: getHeaders(),
        cache: "no-store",
      },
    );
  } catch {
    return [];
  }

  if (!productResponse.ok) {
    return [];
  }

  const data = (await productResponse.json()) as MedusaProductsResponse;

  return data.products.map(toProductPreviewItem).filter((product) => {
    return Boolean(product.image);
  });
}
