import Header from "@/app/components/layout/Header";
import HomeAbout from "@/app/home/HomeAbout";
import HomeContact from "@/app/home/HomeContact";
import HomeExploreProducts from "@/app/home/HomeExploreProducts";
import HomeFooter from "@/app/home/HomeFooter";
import HomeHero from "@/app/home/HomeHero";
import { getProductPreviewsByCategoryHandle } from "@/app/lib/medusa-products";

export default async function Home() {
  const vapeProducts = await getProductPreviewsByCategoryHandle("vapes");

  return (
    <main className="relative">
      <Header />
      <HomeHero />
      <HomeExploreProducts vapeProducts={vapeProducts} />
      <HomeAbout />
      <HomeContact />
      <HomeFooter />
    </main>
  );
}
