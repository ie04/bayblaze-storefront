import Image from "next/image";
import Link from "next/link";

const categories = [
  {
    name: "Vapes",
    description: "Disposable devices",
    href: "/shop?q=vapes",
    image: "/images/categories/vapes.svg",
  },
  {
    name: "Nicotine Pouches",
    description: "ZYNs and pouches",
    href: "/shop?q=ZYN",
    image: "/images/categories/nicotine-pouches.svg",
  },
  {
    name: "Wraps & Papers",
    description: "Rolling essentials",
    href: "/shop?q=wraps",
    image: "/images/categories/wraps-papers.svg",
  },
  {
    name: "Pre-Rolled Cones",
    description: "Ready-to-pack cones",
    href: "/shop?q=cones",
    image: "/images/categories/cones.svg",
  },
  {
    name: "Lighters",
    description: "Everyday fire",
    href: "/shop?q=lighters",
    image: "/images/categories/lighters.svg",
  },
  {
    name: "Accessories",
    description: "Tools and add-ons",
    href: "/shop?q=accessories",
    image: "/images/categories/accessories.svg",
  },
];

export default function HomeShopByCategory() {
  return (
    <section className="bayblaze-category-section" aria-labelledby="shop-by-category-title">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
        <div className="bayblaze-category-section-header">
          <h2 id="shop-by-category-title" className="bayblaze-category-section-title">
            Shop by Category
          </h2>

          <Link href="/shop" className="bayblaze-category-section-link">
            <span>View All</span>
            <ChevronRightIcon />
          </Link>
        </div>

        <div className="bayblaze-category-grid">
          {categories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="bayblaze-category-card"
            >
              <div className="bayblaze-category-card-image">
                <Image
                  src={category.image}
                  alt=""
                  width={600}
                  height={600}
                  className="h-full w-full object-cover"
                  unoptimized
                />
              </div>

              <div className="bayblaze-category-card-info">
                <h3 className="bayblaze-category-card-name">{category.name}</h3>
                <span className="bayblaze-category-card-description">
                  {category.description}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ChevronRightIcon() {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
    >
      <path d="m9 18 6-6-6-6" />
    </svg>
  );
}
