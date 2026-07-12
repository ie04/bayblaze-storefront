import type { Metadata, Viewport } from "next";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "@fontsource/jost/600.css";
import "@fontsource/jost/700.css";
import "@fontsource/jost/800.css";
import "@fontsource/jost/900.css";
import {
  getStorefrontCartCatalogVersion,
  getStorefrontPriceAdjustmentCents,
} from "@/app/lib/medusa-products";
import Providers from "@/app/providers";
import "./globals.css";


const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bayblaze.net";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Bayblaze",
  description: "Tampa Bay mobile smoke shop",
  applicationName: "BAYBLAZE",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BAYBLAZE",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#56833e",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [catalogVersion, priceAdjustmentCents] = await Promise.all([
    getStorefrontCartCatalogVersion(),
    getStorefrontPriceAdjustmentCents(),
  ]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <Providers catalogVersion={catalogVersion} priceAdjustmentCents={priceAdjustmentCents}>{children}</Providers>
      </body>
    </html>
  );
}
