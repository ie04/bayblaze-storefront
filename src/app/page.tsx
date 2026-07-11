import Header from "@/app/components/layout/Header";
import HomeAbout from "@/app/home/HomeAbout";
import HomeContact from "@/app/home/HomeContact";
import HomeExploreProducts from "@/app/home/HomeExploreProducts";
import HomeFooter from "@/app/home/HomeFooter";
import HomeHero from "@/app/home/HomeHero";
import HomeShopByNeed from "@/app/home/HomeShopByNeed";
import { getFastDeliveryProductPreviews } from "@/app/lib/medusa-products";

export default async function Home() {
  const fastDeliveryProducts = await getFastDeliveryProductPreviews();
  const searchSuggestions = fastDeliveryProducts.map((product) => product.name);

  return (
    <main className="bayblaze-home-page relative">
      <Header searchSuggestions={searchSuggestions} />
      <HomeHero searchSuggestions={searchSuggestions} />
      <HomeShopByNeed />
      <HomeExploreProducts
        fastDeliveryProducts={fastDeliveryProducts}
      />
      <HomeAbout />
      <HomeContact />
      <HomeFooter />
    </main>
  );
}
