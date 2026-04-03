/**
 * Smoke Test: Command Center Dashboard Page
 *
 * Verifies that the main dashboard page loads without crashing
 * and renders key UI elements.
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardPage from '@/app/command-center/page';

// Mock SWR to prevent real API calls
jest.mock('swr', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    data: {
      deals: [
        {
          id: '12345',
          dealname: 'John Doe',
          dealstage: '2496931',
          transferable_aum: '5000000',
          ownerName: 'Sarah Smith',
        },
      ],
      total: 1,
    },
    error: null,
    isLoading: false,
    mutate: jest.fn(),
  })),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    pathname: '/command-center',
  })),
  usePathname: jest.fn(() => '/command-center'),
}));

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: {
      user: {
        name: 'Test User',
        email: 'test@farther.com',
      },
    },
    status: 'authenticated',
  })),
}));

describe('[SMOKE] Command Center Dashboard Page', () => {
  it('should render without crashing', () => {
    const { container } = render(<DashboardPage />);
    expect(container).toBeDefined();
  });

  it('should render page heading', () => {
    render(<DashboardPage />);
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toContain('Command Center');
  });

  it('should render key dashboard sections', () => {
    const { container } = render(<DashboardPage />);

    // Should have stat cards (pipeline overview)
    const statCards = container.querySelectorAll('[class*="stat"]');
    expect(statCards.length).toBeGreaterThan(0);
  });

  it('should render deal cards or table', () => {
    const { container } = render(<DashboardPage />);

    // Should render deal information (either as cards or table)
    const dealElements = container.querySelectorAll('[class*="deal"], [class*="card"]');
    expect(dealElements.length).toBeGreaterThan(0);
  });

  it('should not show loading shimmer when data is loaded', () => {
    const { container } = render(<DashboardPage />);

    // Should not have shimmer/skeleton loaders when data is present
    const shimmer = container.querySelector('[class*="shimmer"]');
    expect(shimmer).not.toBeInTheDocument();
  });
});
