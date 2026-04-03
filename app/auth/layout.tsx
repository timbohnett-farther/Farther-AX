import { ReactNode } from 'react';

/**
 * Auth Layout - Clean layout for authentication pages
 * No sidebar, no nav - just the auth content centered on screen
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full">
      {children}
    </div>
  );
}
