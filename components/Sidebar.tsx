"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  HomeIcon,
  DocumentPlusIcon,
  RectangleStackIcon,
  SparklesIcon,
  PencilSquareIcon,
  EnvelopeIcon,
  PhotoIcon,
  BookOpenIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  BoltIcon,
  UserGroupIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

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
  { label: "Transitions", href: "/command-center/transitions", icon: RectangleStackIcon },
  { label: "RIA Hub", href: "/command-center/ria-hub", icon: RectangleStackIcon },
];

const contentCampaigns = [
  { label: "Super Team", href: "/command-center/super-team", icon: SparklesIcon },
  { label: "Content Studio", href: "/command-center/content-studio", icon: PencilSquareIcon },
  { label: "HubSpot Campaigns", href: "/command-center/campaigns", icon: EnvelopeIcon },
  { label: "Design & Visuals", href: "/command-center/design", icon: PhotoIcon },
  { label: "Content Library", href: "/command-center/library", icon: BookOpenIcon },
];

const insightsGov = [
  { label: "Analytics Hub", href: "/command-center/analytics", icon: ChartBarIcon },
  { label: "Compliance", href: "/command-center/compliance", icon: ShieldCheckIcon },
  { label: "Integrations", href: "/command-center/automation", icon: BoltIcon },
  { label: "Team Activity", href: "/command-center/activity", icon: UserGroupIcon },
];

const externalLinks = [
  { label: "Farther Portal", href: "https://app.farther.com/Login" },
  { label: "Transition Tracker", href: "/command-center/transitions" },
  { label: "AX — Notion", href: "#" },
  { label: "AX Email Templates", href: "#" },
];

function NavGroup({
  label,
  items,
  pathname,
  labelClassName,
}: {
  label: string;
  items: { label: string; href: string; icon: React.ComponentType<{ className?: string }> }[];
  pathname: string;
  labelClassName?: string;
}) {
  return (
    <>
      <p className={`px-3 mb-2 text-[10px] font-semibold tracking-widest uppercase ${labelClassName ?? "text-charcoal-muted"}`}>
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
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-smooth ${
                  isActive
                    ? "text-white bg-teal/25 border-l-2 border-teal"
                    : "text-white/50 hover:text-white/80 hover:bg-white/5"
                }`}
              >
                <span className={isActive ? "text-teal" : "text-charcoal-muted"}>
                  <Icon className="w-4 h-4 shrink-0" />
                </span>
                <span className="leading-snug">{item.label}</span>
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

  const firstName = session?.user?.name?.split(" ")[0] ?? "";

  const [trainingOpen, setTrainingOpen] = useState(true);
  const [resourcesOpen, setResourcesOpen] = useState(true);

  return (
    <aside className="fixed top-0 left-0 h-full w-64 flex flex-col z-40 bg-charcoal">
      {/* Logo / Brand */}
      <div className="px-6 pt-8 pb-5 border-b border-white/10">
        <Image
          src="/images/farther-wordmark-cream.png"
          alt="Farther"
          width={120}
          height={28}
          className="mb-2 object-contain object-left"
        />
        <p className="text-[10px] tracking-widest uppercase text-slate">
          Marketing Command Center
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* ── Command Center Groups ─────────────────── */}
        <NavGroup
          label="Core Operations"
          items={coreOps}
          pathname={pathname}
          labelClassName="text-teal"
        />

        <div className="my-2 border-t border-white/6" />

        <NavGroup
          label="Content & Campaigns"
          items={contentCampaigns}
          pathname={pathname}
        />

        <div className="my-2 border-t border-white/6" />

        <NavGroup
          label="Insights & Governance"
          items={insightsGov}
          pathname={pathname}
        />

        {/* Divider */}
        <div className="my-3 border-t border-white/10" />

        {/* AX Training & Information — collapsible */}
        <button
          onClick={() => setTrainingOpen(!trainingOpen)}
          className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold tracking-widest uppercase text-charcoal-muted bg-transparent border-none cursor-pointer hover:text-slate transition-smooth"
        >
          <span>AX Training &amp; Information</span>
          <span className={`text-[10px] transition-transform ${trainingOpen ? 'rotate-0' : '-rotate-90'}`}>
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
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-smooth group ${
                      isActive
                        ? "text-white bg-teal/20 border-l-2 border-teal"
                        : "text-white/50 hover:text-white/80 hover:bg-white/5"
                    }`}
                  >
                    <span className={`text-xs font-mono w-5 shrink-0 text-right ${
                      isActive ? 'text-teal' : 'text-charcoal-muted'
                    }`}>
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
        <div className="my-4 border-t border-white/10" />

        {/* External Links — collapsible */}
        <button
          onClick={() => setResourcesOpen(!resourcesOpen)}
          className="w-full flex items-center justify-between px-3 mb-2 text-xs font-semibold tracking-widest uppercase text-charcoal-muted bg-transparent border-none cursor-pointer hover:text-slate transition-smooth"
        >
          <span>Resources</span>
          <span className={`text-[10px] transition-transform ${resourcesOpen ? 'rotate-0' : '-rotate-90'}`}>
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
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-smooth"
                >
                  <span className="text-xs text-charcoal-muted">↗</span>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        )}
      </nav>

      {/* Settings Link */}
      <div className="px-3 py-2 border-t border-white/10">
        <Link
          href="/command-center/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] transition-smooth ${
            pathname === "/command-center/settings"
              ? "text-white bg-teal/25"
              : "text-white/50 hover:text-white/80 hover:bg-white/5"
          }`}
        >
          <Cog6ToothIcon className="w-4 h-4 shrink-0 text-charcoal-muted" />
          <span>Settings</span>
        </Link>
      </div>

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
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0 bg-teal">
                {firstName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {session.user.name}
              </p>
              <p className="text-xs truncate text-slate">
                {session.user.email}
              </p>
            </div>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/signin" })}
            className="w-full text-left px-3 py-2 rounded-md text-xs transition-smooth text-white/40 hover:text-white/70 hover:bg-white/5"
          >
            ← Sign out
          </button>
        </div>
      )}

      {/* Footer (shown when not signed in) */}
      {!session?.user && (
        <div className="px-6 py-4 border-t border-white/10">
          <p className="text-xs text-charcoal-muted">
            Farther Wealth Management
          </p>
        </div>
      )}
    </aside>
  );
}
