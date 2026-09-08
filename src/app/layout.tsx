import type { Metadata } from "next";
import { Instrument_Serif, Inter } from "next/font/google";
import { APP_THEME_STORAGE_KEY } from "@/shared/lib/app-theme";
import "./globals.css";
import InlineScript from "./inline-script";
import Providers from "./providers";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
});

const instrument_serif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
});

export const metadata: Metadata = {
  title: "EqauliLearn",
  description: "Inclusive Friendly Learning Platform",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      data-app-theme="dark"
      suppressHydrationWarning
      className={`${inter.variable} ${instrument_serif.variable} no-scrollbar`}
    >
      <head>
        <InlineScript
          html={`(function(){try{var t=localStorage.getItem("${APP_THEME_STORAGE_KEY}");if(t==="light"||t==="dark")document.documentElement.dataset.appTheme=t}catch(e){}})()`}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
