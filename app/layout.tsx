import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navigation from "@/components/Navigation";
import BottomNavigation from "@/components/BottomNavigation";
import { SpriteProvider } from "@/lib/contexts/SpriteContext";
import { EventProvider } from "@/lib/contexts/EventContext";
import EventOverlay from "@/components/EventOverlay";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
});

export const metadata: Metadata = {
  title: "PokéTool by Lukas",
  description: "Dokumentation eines Parallel-Playthroughs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" sizes="any" />
        <link rel="icon" href="/favicon.png" type="image/png" sizes="32x32" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                const stored = localStorage.getItem('theme');
                const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const theme = stored || (systemPrefersDark ? 'dark' : 'light');
                if (theme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-[var(--background)] transition-colors duration-300`}
      >
        <SpriteProvider>
          <EventProvider>
            <Navigation />
            <main className="min-h-screen pb-16 md:pb-0">
            {children}
            </main>
            <BottomNavigation />
            <EventOverlay />
          </EventProvider>
        </SpriteProvider>
      </body>
    </html>
  );
}
