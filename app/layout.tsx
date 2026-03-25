import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";
import { ThemeProvider } from "@/lib/theme-provider";

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
      <body
        className="antialiased bg-white dark:bg-gradient-to-b text-gray-900 dark:text-cream"
        style={{
          fontFamily: "'Fakt', system-ui, sans-serif",
          backgroundAttachment: "fixed",
        }}
      >
        <ThemeProvider>
          <SessionProvider>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 ml-64 min-h-screen">
                {children}
              </main>
            </div>
          </SessionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
