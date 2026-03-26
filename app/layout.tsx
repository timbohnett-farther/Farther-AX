import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/lib/theme-provider";
import { SWRProvider } from "@/lib/swr-provider";

export const metadata: Metadata = {
  title: "Farther AX Playbook",
  description: "Farther Advisor Experience Onboarding & Transition Reference",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts: Inter + DM Mono (Font Gold Standard) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased text-gray-900 dark:text-cream">
        <ThemeProvider>
          <SessionProvider>
            <SWRProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 ml-64 min-h-screen">
                  {children}
                </main>
              </div>
            </SWRProvider>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
