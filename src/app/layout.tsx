import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { Web3ProviderWrapper } from "@/components/Web3ProviderWrapper";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "sonner";
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
    "Open a duel. Deposit USDM. Most blinks wins the pool. The first real-time PvP blink-to-earn game on MegaETH.",
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
  metadataBase: new URL("https://winky-duel.vercel.app"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://winky-duel.vercel.app",
    siteName: "Blinkit",
    title: "Blinkit — Bet. Blink. Win the Pool.",
    description:
      "The first PvP blink-to-earn game. Open a duel, deposit USDM, most blinks takes it all. Built on MegaETH.",
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
      "The first PvP blink-to-earn game. Open a duel, deposit USDM, most blinks takes it all.",
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
        <Web3ProviderWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
            <Toaster
              theme="dark"
              position="bottom-right"
              toastOptions={{
                style: {
                  background: "var(--card)",
                  border: "1px solid var(--wink-border)",
                  color: "var(--foreground)",
                  fontSize: "13px",
                  borderRadius: "12px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
                },
              }}
              closeButton
            />
          </ThemeProvider>
        </Web3ProviderWrapper>
      </body>
    </html>
  );
}
