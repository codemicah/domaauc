import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WalletProvider } from "@/components/wallet/wallet-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "DomaAuc - Domain Auction Platform",
    template: "%s | DomaAuc"
  },
  description: "Trade tokenized domains through Dutch auctions on DomaAuc. Discover, bid, and sell domain NFTs with transparent pricing and secure blockchain transactions.",
  keywords: ["domain auction", "NFT marketplace", "tokenized domains", "Dutch auction", "blockchain", "Web3", "domain trading"],
  authors: [{ name: "DomaAuc Team" }],
  creator: "DomaAuc",
  publisher: "DomaAuc",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://domaauc.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://domaauc.com",
    title: "DomaAuc - Domain Auction Platform",
    description: "Trade tokenized domains through Dutch auctions on DomaAuc. Discover, bid, and sell domain NFTs with transparent pricing and secure blockchain transactions.",
    siteName: "DomaAuc",
  },
  twitter: {
    card: "summary_large_image",
    title: "DomaAuc - Domain Auction Platform",
    description: "Trade tokenized domains through Dutch auctions on DomaAuc. Discover, bid, and sell domain NFTs with transparent pricing and secure blockchain transactions.",
    creator: "@domaauc",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <WalletProvider>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
