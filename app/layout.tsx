import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import SessionProvider from "@/components/SessionProvider";

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
        className="antialiased"
        style={{
          fontFamily: "'Fakt', system-ui, sans-serif",
          backgroundColor: "#121212",
          color: "#e0dbd3",
        }}
      >
        <SessionProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-64 min-h-screen">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
