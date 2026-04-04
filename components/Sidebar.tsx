"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import useSWR from "swr";
import {
  HomeIcon,
  DocumentPlusIcon,
  RectangleStackIcon,
  SparklesIcon,
  ChartBarIcon,
  UserGroupIcon,
  BellAlertIcon,
  CpuChipIcon,
} from "@heroicons/react/24/outline";
import { ThemeToggle } from "./ThemeToggle";
import { useTheme } from "@/lib/theme-provider";

const sidebarFetcher = (url: string) => fetch(url).then(r => r.json());

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

const coreOps = [
  { label: "Pipeline", href: "/command-center", icon: HomeIcon },
  { label: "Advisor Hub", href: "/command-center/advisor-hub", icon: DocumentPlusIcon },
  { label: "Onboarding", href: "/command-center/onboarding", icon: RectangleStackIcon },
  { label: "Alerts", href: "/command-center/alerts", icon: BellAlertIcon },
  { label: "Transitions", href: "/command-center/transitions", icon: RectangleStackIcon },
  { label: "Team", href: "/command-center/team", icon: UserGroupIcon },
  { label: "Complexity", href: "/command-center/complexity", icon: ChartBarIcon },
  { label: "Metrics", href: "/command-center/metrics", icon: ChartBarIcon },
  { label: "AI Assistant", href: "/command-center/ai", icon: SparklesIcon },
  { label: "Agents", href: "/command-center/agents", icon: CpuChipIcon },
];

const externalLinks = [
  { label: "Farther Portal", href: "https://app.farther.com/Login" },
  { label: "Transition Tracker", href: "/command-center/transitions" },
  { label: "AX — Notion", href: "#" },
  { label: "AX Email Templates", href: "#" },
];

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

function NavGroup({
  label,
  items,
  pathname,
  labelStyle,
  theme,
  THEME,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  labelStyle?: React.CSSProperties;
  theme: any;
  THEME: any;
}) {
  return (
    <>
      <p
        className="px-3 mb-2 text-xs font-semibold tracking-widest uppercase"
        style={labelStyle || { color: THEME.colors.sidebarTextMuted }}
      >
        {label}
      </p>
      <ul className="space-y-0.5 mb-1">
        {items.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/command-center" && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                style={{
                  color: isActive ? THEME.colors.sidebarText : THEME.colors.sidebarTextSecondary,
                  backgroundColor: isActive
                    ? theme === "dark"
                      ? "rgba(59, 90, 105, 0.25)"
                      : "rgba(59, 90, 105, 0.15)"
                    : "transparent",
                  borderLeft: isActive ? `2px solid ${THEME.colors.steel}` : "2px solid transparent",
                  transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = THEME.colors.sidebarText;
                    e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.color = THEME.colors.sidebarTextSecondary;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }
                }}
              >
                <span style={{ color: isActive ? THEME.colors.steel : THEME.colors.sidebarTextFaint }}>
                  <Icon className="w-4 h-4 shrink-0" />
                </span>
                <span className="leading-snug flex-1">{item.label}</span>
                {item.badge != null && item.badge > 0 && (
                  <span
                    className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5"
                    style={{ backgroundColor: THEME.colors.error, color: "#FFFFFF" }}
                  >
                    {item.badge > 99 ? "99+" : item.badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, THEME } = useTheme();

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  const [trainingOpen, setTrainingOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);

  // Fetch alert count for sidebar badge
  const { data: alertData } = useSWR<{ total?: number }>(
    "/api/command-center/alerts",
    sidebarFetcher,
    { refreshInterval: 5 * 60 * 1000, revalidateOnFocus: false, errorRetryCount: 1 }
  );
  const alertCount = alertData?.total ?? 0;

  // Inject alert badge into nav items
  const opsWithBadges: NavItem[] = coreOps.map(item =>
    item.label === "Alerts" ? { ...item, badge: alertCount } : item
  );

  return (
    <aside
      className="fixed top-0 left-0 h-full w-64 flex flex-col z-40 border-r"
      style={{
        backgroundColor: THEME.colors.surface,
        borderColor: THEME.colors.border,
      }}
    >
      {/* Logo / Brand */}
      <div className="px-6 pt-8 pb-5 border-b" style={{ borderColor: THEME.colors.border }}>
        <Image
          src="/logo-light.png"
          alt="Farther"
          width={160}
          height={40}
          className="mb-2 object-contain object-left hidden dark:block"
          priority
        />
        <Image
          src="/logo-dark.png"
          alt="Farther"
          width={160}
          height={40}
          className="mb-2 object-contain object-left block dark:hidden"
          priority
        />
        <p className="text-xs tracking-widest uppercase" style={{ color: THEME.colors.sidebarTextFaint }}>
          Terminal AX
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* ── AX Operations ─────────────────── */}
        <NavGroup
          label="AX Operations"
          items={opsWithBadges}
          pathname={pathname}
          labelStyle={{ color: THEME.colors.steel }}
          theme={theme}
          THEME={THEME}
        />

        {/* Divider */}
        <div className="my-3 border-t" style={{ borderColor: THEME.colors.border }} />

        {/* AX Training & Information — collapsible */}
        <button
          onClick={() => setTrainingOpen(!trainingOpen)}
          className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold tracking-widest uppercase bg-transparent border-none cursor-pointer"
          style={{
            color: THEME.colors.sidebarTextSecondary,
            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = THEME.colors.sidebarText)}
          onMouseLeave={(e) => (e.currentTarget.style.color = THEME.colors.sidebarTextSecondary)}
        >
          <span>AX Training &amp; Playbook</span>
          <span className={`text-xs transition-transform ${trainingOpen ? 'rotate-0' : '-rotate-90'}`}>
            ▼
          </span>
        </button>
        {trainingOpen && (
          <ul className="space-y-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm group"
                    style={{
                      color: isActive ? THEME.colors.sidebarText : THEME.colors.sidebarTextSecondary,
                      backgroundColor: isActive
                        ? "rgba(59, 90, 105, 0.20)"
                        : "transparent",
                      borderLeft: isActive ? `2px solid ${THEME.colors.steel}` : "2px solid transparent",
                      transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = THEME.colors.sidebarText;
                        e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.color = THEME.colors.sidebarTextSecondary;
                        e.currentTarget.style.backgroundColor = "transparent";
                      }
                    }}
                  >
                    <span
                      className="text-xs font-mono w-5 shrink-0 text-right"
                      style={{ color: isActive ? THEME.colors.steel : THEME.colors.sidebarTextFaint }}
                    >
                      {String(item.step).padStart(2, "0")}
                    </span>
                    <span className="leading-snug">{item.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* Divider */}
        <div className="my-4 border-t" style={{ borderColor: THEME.colors.border }} />

        {/* External Links — collapsible */}
        <button
          onClick={() => setResourcesOpen(!resourcesOpen)}
          className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold tracking-widest uppercase bg-transparent border-none cursor-pointer"
          style={{
            color: THEME.colors.sidebarTextSecondary,
            transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = THEME.colors.sidebarText)}
          onMouseLeave={(e) => (e.currentTarget.style.color = THEME.colors.sidebarTextSecondary)}
        >
          <span>Resources</span>
          <span className={`text-xs transition-transform ${resourcesOpen ? 'rotate-0' : '-rotate-90'}`}>
            ▼
          </span>
        </button>
        {resourcesOpen && (
          <ul className="space-y-0.5">
            {externalLinks.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm"
                  style={{
                    color: THEME.colors.sidebarTextMuted,
                    transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = THEME.colors.sidebarText;
                    e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = THEME.colors.sidebarTextMuted;
                    e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <span className="text-xs" style={{ color: THEME.colors.sidebarTextFaint }}>↗</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* User / Sign Out */}
      {session?.user && (
        <div className="px-4 py-4 border-t" style={{ borderColor: THEME.colors.border }}>
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
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                style={{ backgroundColor: THEME.colors.steel, color: "#FFFFFF" }}
              >
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: THEME.colors.sidebarText }}>
                {session.user.name}
              </p>
              <p className="text-xs truncate" style={{ color: THEME.colors.sidebarTextSecondary }}>
                {session.user.email}
              </p>
            </div>
          </div>
          <ThemeToggle />
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="w-full text-left px-3 py-2 rounded-md text-xs"
            style={{
              color: THEME.colors.sidebarTextMuted,
              backgroundColor: "transparent",
              transition: "all 300ms cubic-bezier(0.4, 0, 0.2, 1)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = THEME.colors.sidebarText;
              e.currentTarget.style.backgroundColor = theme === "dark" ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = THEME.colors.sidebarTextMuted;
              e.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            ← Sign out
          </button>
        </div>
      )}

      {/* Footer (shown when not signed in) */}
      {!session?.user && (
        <div className="px-6 py-4 border-t" style={{ borderColor: THEME.colors.border }}>
          <p className="text-xs" style={{ color: THEME.colors.sidebarTextSecondary }}>
            Farther Wealth Management
          </p>
        </div>
      )}
    </aside>
  );
}
