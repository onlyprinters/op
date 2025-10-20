import type { Metadata } from "next";
import { Fjalla_One } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { WalletContextProvider } from "@/contexts/WalletContextProvider";
import Header from "@/components/Header";
import SecurityBadge from "@/components/SecurityBadge";

const fjallaOne = Fjalla_One({
  variable: "--font-fjalla-one",
  subsets: ["latin"],
  weight: ["400"],
});

const astronBoy = localFont({
  src: "../../public/astron-boy.rg-regular.otf",
  variable: "--font-astron-boy",
});

export const metadata: Metadata = {
  title: "OnlyPrinters",
  description: "OnlyPrinters.fun is the place where all printers meet.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fjallaOne.variable} ${astronBoy.variable} font-[family-name:var(--font-fjalla-one)] antialiased`}
      >
        <WalletContextProvider>
          <Header />
          {children}
          <SecurityBadge />
        </WalletContextProvider>
      </body>
    </html>
  );
}
