import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import { CartProvider } from "@/app/components/cart/CartContext";
import PwaInstallPrompt from "@/app/components/pwa/PwaInstallPrompt";
import "./globals.css";

const jost = Jost({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jost",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bayblaze.net";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Bayblaze",
  description: "Tampa Bay mobile smoke shop",
  applicationName: "Bayblaze",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Bayblaze",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#56833e",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jost.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <CartProvider>{children}</CartProvider>
        <PwaInstallPrompt />
      </body>
    </html>
  );
}
