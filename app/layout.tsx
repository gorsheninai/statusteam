import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import "./site-v4.css";

const tenor = localFont({
  src: "./fonts/TenorSans-Regular.woff2",
  variable: "--ff-tenor",
  weight: "400",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Times New Roman",
  fallback: ["Georgia", "serif"],
});

const onest = localFont({
  src: "./fonts/Onest-Variable.woff2",
  variable: "--ff-onest",
  weight: "100 900",
  style: "normal",
  display: "swap",
  adjustFontFallback: "Arial",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://statusteam.show"),
  title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
  description:
    "Пульс Континента — fashion-шоу нижнего белья и аксессуаров от STATUS TEAM. Москва, 07 ноября 2026, Kinema.",
  openGraph: {
    title: "ПУЛЬС КОНТИНЕНТА — fashion show by STATUS TEAM",
    description:
      "Fashion-шоу нижнего белья и аксессуаров от STATUS TEAM. Москва, 07 ноября 2026, Kinema.",
    locale: "ru_RU",
    type: "website",
    images: ["/media/header_16_9.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#100d0c",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru" className={`${tenor.variable} ${onest.variable}`}>
      <body>
        <a className="skip-link" href="#statusteam">К содержанию</a>
        {children}
      </body>
    </html>
  );
}
