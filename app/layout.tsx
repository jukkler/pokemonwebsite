import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";

const poppins = Poppins({
  weight: ['400', '500', '600'],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "PokéTool by Lukas",
  description: "Dokumentation eines Parallel-Playthroughs",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body
        className={`${poppins.variable} font-sans antialiased`}
      >
        <Navigation />
        <main className="min-h-screen bg-gray-50 pb-16 md:pb-0">
        {children}
        </main>
        <BottomNavigation />
      </body>
    </html>
  );
}
