import type { Metadata } from "next";
import { Manrope, Inter } from "next/font/google";
import "./globals.css";


const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Molfi | The Most Profitable Way to Trade for Degens",
  description: "Advanced AI-powered trading on 0G Ethereum. Research, trade, and deploy with Molfi.",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${manrope.variable} ${inter.variable} antialiased bg-background font-body`}
      >
        {children}
      </body>
    </html>
  );
}
