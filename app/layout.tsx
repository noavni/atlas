import type { Metadata, Viewport } from "next";
import {
  Frank_Ruhl_Libre,
  Heebo,
  Inter,
  JetBrains_Mono,
  Source_Serif_4,
} from "next/font/google";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-source-serif",
  display: "swap",
});
const heebo = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
});
const frankRuhlLibre = Frank_Ruhl_Libre({
  subsets: ["hebrew", "latin"],
  weight: ["400", "500", "700"],
  variable: "--font-frank-ruhl-libre",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Atlas",
  description: "A private knowledge workspace for two.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FBFAF7" },
    { media: "(prefers-color-scheme: dark)", color: "#0E1012" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const fontClasses = [
    inter.variable,
    jetbrains.variable,
    sourceSerif.variable,
    heebo.variable,
    frankRuhlLibre.variable,
  ].join(" ");

  return (
    <html lang="en" dir="ltr" data-theme="light" suppressHydrationWarning className={fontClasses}>
      <body>
        <QueryProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
