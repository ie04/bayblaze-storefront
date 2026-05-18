"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type HomeCategoryItem,
  shopByCategoryCarousel,
} from "@/app/domain/home-carousels";
import HomeCarousel from "./HomeCarousel";

export default function HomeShopByCategory() {
  return (
    <section className="bayblaze-category-section">
      <div className="mx-auto w-full max-w-[1180px] px-4 sm:px-5">
        <div className="bayblaze-category-carousel">
          <HomeCarousel
            definition={shopByCategoryCarousel}
            renderItem={(category) => <CategoryCard category={category} />}
          />
        </div>
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: HomeCategoryItem }) {
  return (
    <Link href={category.href} className="bayblaze-category-card">
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
  );
}
