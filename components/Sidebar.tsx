"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";

const navItems = [
  { step: 1, label: "Introduction", href: "/introduction" },
  { step: 2, label: "Onboarding vs. Transitions", href: "/onboarding-vs-transitions" },
  { step: 3, label: "Key Documents", href: "/key-documents" },
  { step: 4, label: "Breakaway", href: "/breakaway" },
  { step: 5, label: "Independent RIA", href: "/independent-ria" },
  { step: 6, label: "M&A", href: "/ma" },
  { step: 7, label: "No to Low AUM", href: "/no-to-low-aum" },
  { step: 8, label: "Master Merge", href: "/master-merge" },
  { step: 9, label: "LPOA", href: "/lpoa" },
  { step: 10, label: "Repaper / ACAT", href: "/repaper-acat" },
  { step: 11, label: "Breakaway Process", href: "/breakaway-process" },
  { step: 12, label: "Calendar Generator", href: "/calendar-generator" },
  { step: 13, label: "Knowledge Check", href: "/knowledge-check" },
];

const externalLinks = [
  { label: "Farther Portal", href: "#" },
  { label: "Transition Tracker", href: "#" },
  { label: "AX — Notion", href: "#" },
  { label: "AX Email Templates", href: "#" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  return (
    <aside
      className="fixed top-0 left-0 h-full w-64 flex flex-col z-40"
      style={{ background: "#333333" }}
    >
      {/* Logo / Brand */}
      <div className="px-6 pt-8 pb-6 border-b border-white/10">
        <Image
          src="/images/farther-wordmark-cream.png"
          alt="Farther"
          width={120}
          height={28}
          className="mb-2"
          style={{ objectFit: "contain", objectPosition: "left" }}
        />
        <p className="text-xs tracking-widest uppercase" style={{ color: "#5b6a71" }}>
          AX Playbook
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <p
          className="px-3 mb-2 text-xs font-semibold tracking-widest uppercase"
          style={{ color: "#4a5a62" }}
        >
          Sections
        </p>
        <ul className="space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-all duration-150 group ${
                    isActive
                      ? "text-white"
                      : "text-white/50 hover:text-white/80"
                  }`}
                  style={
                    isActive
                      ? { background: "rgba(29,118,130,0.2)", borderLeft: "2px solid #1d7682" }
                      : {}
                  }
                >
                  <span
                    className="text-xs font-mono w-5 shrink-0 text-right"
                    style={{ color: isActive ? "#1d7682" : "#4a5a62" }}
                  >
                    {String(item.step).padStart(2, "0")}
                  </span>
                  <span className="leading-snug">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Divider */}
        <div className="my-4 border-t border-white/10" />

        {/* External Links */}
        <p
          className="px-3 mb-2 text-xs font-semibold tracking-widest uppercase"
          style={{ color: "#4a5a62" }}
        >
          Resources
        </p>
        <ul className="space-y-0.5">
          {externalLinks.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/40 hover:text-white/70 transition-colors"
              >
                <span className="text-xs" style={{ color: "#4a5a62" }}>↗</span>
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* User / Sign Out */}
      {session?.user && (
        <div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-3">
            {session.user.image ? (
              <Image
                src={session.user.image}
                alt={session.user.name ?? "User"}
                width={32}
                height={32}
                className="rounded-full"
              />
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                style={{ backgroundColor: "#1d7682" }}
              >
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs truncate" style={{ color: "#5b6a71" }}>
                {session.user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="w-full text-left px-3 py-2 rounded-md text-xs transition-colors text-white/40 hover:text-white/70 hover:bg-white/5"
            style={{ fontFamily: "'Fakt', system-ui, sans-serif" }}
          >
            ← Sign out
          </button>
        </div>
      )}

      {/* Footer (shown when not signed in) */}
      {!session?.user && (
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs" style={{ color: "#4a5a62" }}>
            Farther Wealth Management
          </p>
        </div>
      )}
    </aside>
  );
}
