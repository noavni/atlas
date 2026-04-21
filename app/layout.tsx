import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Source_Serif_4, Heebo, Noto_Serif_Hebrew } from "next/font/google";
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
const notoSerifHebrew = Noto_Serif_Hebrew({
  subsets: ["hebrew"],
  variable: "--font-noto-serif-hebrew",
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
    notoSerifHebrew.variable,
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
