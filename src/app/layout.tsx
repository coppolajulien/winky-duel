import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Web3Provider } from "@/components/Web3Provider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: {
    default: "Blinkit — The First PvP Blink-to-Earn Game",
    template: "%s | Blinkit",
  },
  description:
    "Bet USDM. Blink against your opponent. Most blinks wins the pool. The first real-time PvP blink-to-earn game on MegaETH.",
  keywords: [
    "blinkit",
    "blink to earn",
    "PvP game",
    "MegaETH",
    "crypto game",
    "USDM",
    "web3 game",
    "onchain game",
  ],
  authors: [{ name: "Blinkit" }],
  creator: "Blinkit",
  metadataBase: new URL("https://blinkit.gg"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://blinkit.gg",
    siteName: "Blinkit",
    title: "Blinkit — Bet. Blink. Win the Pool.",
    description:
      "The first PvP blink-to-earn game. Stake USDM, face your opponent, most blinks takes it all. Built on MegaETH.",
    images: [
      {
        url: "/card.jpg",
        width: 1200,
        height: 630,
        alt: "Blinkit — Bet. Blink. Win the Pool.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blinkit — Bet. Blink. Win the Pool.",
    description:
      "The first PvP blink-to-earn game. Stake USDM, face your opponent, most blinks takes it all.",
    images: ["/card.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: "/logo-blinkit.svg",
    apple: "/logo-blinkit.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} antialiased`}>
        <Web3Provider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Web3Provider>
      </body>
    </html>
  );
}
