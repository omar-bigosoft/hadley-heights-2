import type { Metadata } from "next";
import "lenis/dist/lenis.css";
import "./globals.css";

const assetBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: "Hadley Heights 2 | Olympic Champion Edition",
  description:
    "Discover Hadley Heights 2 by LEOS Developments—an Olympic champion edition in Dubai Sports City.",
  keywords: [
    "Hadley Heights 2",
    "LEOS Developments",
    "Dubai Sports City",
    "Dubai residences",
  ],
  openGraph: {
    title: "Hadley Heights 2 | Olympic Champion Edition",
    description:
      "A new expression of performance-led living in Dubai Sports City.",
    type: "website",
    images: [
      {
        url: `${assetBasePath}/og.png`,
        width: 1731,
        height: 909,
        alt: "Hadley Heights 2 — Olympic Champion Edition",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hadley Heights 2 | Olympic Champion Edition",
    description:
      "A new expression of performance-led living in Dubai Sports City.",
    images: [`${assetBasePath}/og.png`],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="antialiased">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
