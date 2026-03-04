import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { PrivyClientProvider } from "@/components/PrivyClientProvider";
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

export const metadata: Metadata = {
  title: "Blinkit",
  description: "Blink to win. Every blink is a transaction on MegaETH.",
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
        <PrivyClientProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </PrivyClientProvider>
      </body>
    </html>
  );
}
