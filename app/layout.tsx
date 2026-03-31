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
        {/* Fonts: Inter + DM Mono (fallbacks for Fakt/ABC Arizona) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;450;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        {/* Prevent theme flash: set dark class before first paint */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('farther-ax-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme:dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})()`,
          }}
        />
      </head>
      <body className="antialiased bg-[var(--color-bg)] text-[var(--color-text)]">
        <ThemeProvider>
          <SessionProvider>
            <SWRProvider>
              <div className="flex min-h-screen">
                <Sidebar />
                <main className="flex-1 ml-64 min-h-screen bg-[var(--color-bg)]">
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
