import type { Metadata, Viewport } from "next";
import { Jost } from "next/font/google";
import Providers from "@/app/providers";
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
  width: "device-width",
  initialScale: 1,
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
