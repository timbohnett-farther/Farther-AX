"use client";

import { SunIcon, MoonIcon } from "@heroicons/react/24/outline";
import { useTheme } from "@/lib/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="w-full text-left px-3 py-2 rounded-md text-xs transition-smooth text-gray-600 dark:text-white/40 hover:text-gray-900 dark:hover:text-white/70 hover:bg-gray-100 dark:hover:bg-white/5 flex items-center gap-2"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <>
          <SunIcon className="w-4 h-4" />
          <span>Light Mode</span>
        </>
      ) : (
        <>
          <MoonIcon className="w-4 h-4" />
          <span>Dark Mode</span>
        </>
      )}
    </button>
  );
}
