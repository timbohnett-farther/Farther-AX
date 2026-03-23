import type { Metadata } from "next";
import "../globals.css";

export const metadata: Metadata = {
  title: "Farther — Advisor Form",
  description: "Secure advisor intake form",
};

export default function FormsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div style={{ minHeight: '100vh' }}>
      {children}
    </div>
  );
}
