# Farther Components & Tremor Integration

**Version:** 1.0
**Last Updated:** 2026-03-24
**Purpose:** Complete component specification and Tremor integration guide for Farther Finance

---

## Overview

This document defines the complete component system for Farther Finance, including semantic status colors, button variants, card layouts, glass morphism, and Tremor chart theming strategies.

### Key Principles

1. **Semantic status colors** - Use positive/caution/negative for financial data (NOT success/warning/error)
2. **Component variants via CVA** - All components use `class-variance-authority`
3. **Tremor Raw integration** - Copy-paste components from tremor.so/docs (never `npm install @tremor/react`)
4. **Accessibility-first** - ARIA labels, focus rings, keyboard navigation
5. **Financial context** - Components optimized for wealth management interfaces

---

## Semantic Status Colors

### Financial-Specific Semantics

For wealth management interfaces, use financial semantics instead of generic status colors:

```typescript
export const financialColors = {
  // Portfolio performance
  positive: "accent-500",        // Gains, growth, positive returns (emerald)
  caution: "warning",            // Review needed, rebalance alerts (amber)
  negative: "error",             // Losses, risks, critical issues (rose)

  // Account states
  active: "accent-500",          // Active accounts, on-track goals
  review: "warning",             // Needs attention, overdue review
  frozen: "error",               // Frozen accounts, blocked states
  inactive: "text-muted",        // Inactive, closed accounts

  // Tier system
  platinum: "brand-600",         // ≥$5M AUM
  gold: "brand-500",             // $2-5M AUM
  silver: "brand-400",           // $500K-2M AUM
  standard: "text-secondary",    // <$500K AUM
};
```

### Semantic Component Mapping

```tsx
// ✅ CORRECT - Financial semantics
<Badge variant="positive">+12.4%</Badge>
<Badge variant="caution">Review Needed</Badge>
<Badge variant="negative">Churn Risk</Badge>

// ❌ AVOID - Generic status semantics
<Badge variant="success">+12.4%</Badge>
<Badge variant="warning">Review Needed</Badge>
<Badge variant="error">Churn Risk</Badge>
```

---

## Button System

### Button Variants (CVA)

Complete button system with financial-appropriate variants:

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-md font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: [
          "bg-brand-500 text-white shadow-sm",
          "hover:bg-brand-600 active:bg-brand-700",
          "dark:bg-brand-400 dark:hover:bg-brand-500",
        ],
        secondary: [
          "bg-surface-subtle text-text-primary border border-border shadow-sm",
          "hover:bg-surface-muted hover:border-border-strong",
        ],
        outline: [
          "border border-border bg-transparent text-text-primary",
          "hover:bg-surface-subtle hover:border-border-strong",
        ],
        ghost: [
          "text-text-primary",
          "hover:bg-surface-subtle hover:text-text-primary",
        ],
        danger: [
          "bg-error text-white shadow-sm",
          "hover:opacity-90 active:opacity-80",
        ],
        positive: [
          "bg-accent-500 text-white shadow-sm",
          "hover:bg-accent-600 active:bg-accent-700",
          "dark:bg-accent-400 dark:hover:bg-accent-500",
        ],
        link: [
          "text-brand-600 underline-offset-4",
          "hover:underline dark:text-brand-400",
        ],
      },
      size: {
        xs: "h-7 px-2.5 text-xs",
        sm: "h-8 px-3 text-sm",
        md: "h-9 px-4 text-sm",
        lg: "h-10 px-5 text-base",
        xl: "h-11 px-6 text-base",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}
```

### Button Usage Examples

```tsx
// Primary actions
<Button variant="primary">Create Household</Button>
<Button variant="primary" size="lg">Import Portfolio</Button>

// Secondary actions
<Button variant="secondary">Cancel</Button>
<Button variant="outline">View Details</Button>

// Financial-specific
<Button variant="positive">Mark as Paid</Button>
<Button variant="danger">Close Account</Button>

// With icons
<Button variant="primary">
  <RiAddLine className="h-4 w-4" />
  Add Client
</Button>

// Loading state
<Button variant="primary" disabled>
  <RiLoader4Line className="h-4 w-4 animate-spin" />
  Processing...
</Button>
```

---

## Cards & Layout

### Card Component

```tsx
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glass";
}

export function Card({ className, variant = "default", ...props }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface",
        {
          "shadow-card": variant === "default",
          "shadow-elevated": variant === "elevated",
          "bg-surface/60 backdrop-blur-xl": variant === "glass",
        },
        className
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-6 pb-4", className)}
      {...props}
    />
  );
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn("text-lg font-semibold text-text-primary", className)}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("text-sm text-text-secondary", className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6 pt-0", className)} {...props} />
  );
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex items-center gap-2 border-t border-border p-6 pt-4", className)}
      {...props}
    />
  );
}
```

### Card Usage Examples

```tsx
// Standard card
<Card>
  <CardHeader>
    <CardTitle>Portfolio Performance</CardTitle>
    <CardDescription>Rolling 12-month returns</CardDescription>
  </CardHeader>
  <CardContent>
    {/* Chart or content here */}
  </CardContent>
</Card>

// Elevated card (modals, popovers)
<Card variant="elevated">
  <CardContent>
    Important elevated content
  </CardContent>
</Card>

// Glass morphism (overlays)
<Card variant="glass">
  <CardContent>
    Floating notification
  </CardContent>
</Card>
```

---

## Glass Morphism Components

### Glass Card

For floating notifications, tooltips, and overlay components:

```tsx
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: "sm" | "md" | "lg" | "xl";
}

export function GlassCard({ className, blur = "xl", ...props }: GlassCardProps) {
  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
  };

  return (
    <div
      className={cn(
        "rounded-lg border border-border/50 bg-surface/60 shadow-elevated",
        blurClasses[blur],
        className
      )}
      {...props}
    />
  );
}
```

### Glass Button Overlay

```tsx
export function GlassButton({ className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition-all",
        "hover:bg-white/20 hover:border-white/30",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50",
        className
      )}
      {...props}
    />
  );
}
```

### Usage

```tsx
// Floating notification
<GlassCard className="fixed bottom-4 right-4 p-4">
  <p className="text-sm">Portfolio updated successfully</p>
</GlassCard>

// Overlay controls
<div className="absolute top-4 right-4">
  <GlassButton>
    <RiSettingsLine className="h-4 w-4" />
    Settings
  </GlassButton>
</div>
```

---

## Tremor Theming Integration

### Core Tremor Setup

Install dependencies:

```bash
npm install @radix-ui/react-dialog @radix-ui/react-select @radix-ui/react-tabs \
  @radix-ui/react-tooltip @radix-ui/react-accordion @radix-ui/react-popover \
  @remixicon/react recharts clsx tailwind-merge class-variance-authority
```

### Tremor Color Strategy

**IMPORTANT:** Tremor components accept color prop values that map to Tailwind classes. Use semantic token names, NOT hex values.

```tsx
// ✅ CORRECT - Semantic token names
<AreaChart
  data={data}
  categories={["portfolio", "benchmark"]}
  colors={["brand-500", "text-muted"]}
/>

// ❌ WRONG - Hex values don't work
<AreaChart
  colors={["#A777CA", "#737373"]}
/>
```

### Tremor Chart Colors

Define reusable color configurations:

```typescript
export const tremorChartColors = {
  // Single series
  primary: ["brand-500"],
  positive: ["accent-500"],
  negative: ["error"],

  // Dual comparison
  portfolioBenchmark: ["brand-500", "text-muted"],
  positiveNegative: ["accent-500", "error"],

  // Multi-series (up to 6)
  multiSeries: [
    "brand-500",    // Primary
    "accent-500",   // Secondary
    "brand-300",    // Tertiary
    "accent-700",   // Quaternary
    "brand-700",    // Quinary
    "text-muted",   // Senary
  ],

  // Asset allocation
  allocation: [
    "brand-500",    // Equities
    "accent-500",   // Fixed Income
    "brand-300",    // Alternatives
    "text-muted",   // Cash
  ],

  // Performance tiers
  tiers: [
    "brand-600",    // Platinum
    "brand-500",    // Gold
    "brand-400",    // Silver
    "text-muted",   // Standard
  ],
};
```

### Tremor Component Examples

#### Area Chart

```tsx
import { AreaChart } from "@/components/tremor/AreaChart";

<AreaChart
  data={performanceData}
  index="date"
  categories={["portfolio", "benchmark"]}
  colors={tremorChartColors.portfolioBenchmark}
  valueFormatter={(value) => `$${(value / 1000).toFixed(1)}K`}
  showLegend={true}
  showGridLines={false}
  className="h-72"
/>
```

#### Bar Chart

```tsx
import { BarChart } from "@/components/tremor/BarChart";

<BarChart
  data={monthlyFlows}
  index="month"
  categories={["contributions", "withdrawals"]}
  colors={["accent-500", "error"]}
  valueFormatter={(value) => `$${(value / 1000).toFixed(0)}K`}
  stack={false}
  className="h-64"
/>
```

#### Donut Chart

```tsx
import { DonutChart } from "@/components/tremor/DonutChart";

<DonutChart
  data={allocationData}
  category="value"
  index="assetClass"
  colors={tremorChartColors.allocation}
  valueFormatter={(value) => `${value.toFixed(1)}%`}
  showLabel={true}
  className="h-48"
/>
```

#### Line Chart

```tsx
import { LineChart } from "@/components/tremor/LineChart";

<LineChart
  data={aumHistory}
  index="date"
  categories={["aum"]}
  colors={["brand-500"]}
  valueFormatter={(value) => `$${(value / 1_000_000).toFixed(1)}M`}
  curveType="monotone"
  showLegend={false}
  className="h-72"
/>
```

#### Bar List

```tsx
import { BarList } from "@/components/tremor/BarList";

<BarList
  data={[
    { name: "Platinum Tier", value: 42, color: "brand-600" },
    { name: "Gold Tier", value: 128, color: "brand-500" },
    { name: "Silver Tier", value: 341, color: "brand-400" },
    { name: "Standard", value: 512, color: "text-muted" },
  ]}
  valueFormatter={(value) => `${value} households`}
  className="mt-4"
/>
```

### Tremor Card Integration

```tsx
import { Card } from "@/components/tremor/Card";

<Card>
  <h3 className="text-lg font-semibold text-text-primary">
    Portfolio Performance
  </h3>
  <p className="mt-4 text-3xl font-bold text-text-primary">
    +12.4%
  </p>
  <p className="mt-1 text-sm text-text-secondary">
    Rolling 12-month return
  </p>
  <AreaChart
    data={data}
    index="date"
    categories={["return"]}
    colors={["accent-500"]}
    className="mt-6 h-40"
  />
</Card>
```

---

## Highlighting, Tags & Pills

### Highlight Component

For inline text highlighting (search results, key metrics):

```tsx
interface HighlightProps {
  children: React.ReactNode;
  variant?: "brand" | "positive" | "caution" | "negative";
}

export function Highlight({ children, variant = "brand" }: HighlightProps) {
  const variantClasses = {
    brand: "bg-brand-500/10 text-brand-700 dark:text-brand-300",
    positive: "bg-accent-500/10 text-accent-700 dark:text-accent-300",
    caution: "bg-warning/10 text-warning-text",
    negative: "bg-error/10 text-error-text",
  };

  return (
    <span className={cn("rounded px-1.5 py-0.5 font-medium", variantClasses[variant])}>
      {children}
    </span>
  );
}
```

### Tag Component

For removable filters and selections:

```tsx
interface TagProps {
  children: React.ReactNode;
  onRemove?: () => void;
  variant?: "default" | "brand";
}

export function Tag({ children, onRemove, variant = "default" }: TagProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-2 py-1 text-sm font-medium",
        variant === "brand"
          ? "bg-brand-500/10 text-brand-700 dark:text-brand-300"
          : "bg-surface-subtle text-text-secondary"
      )}
    >
      {children}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 rounded hover:bg-black/10 dark:hover:bg-white/10"
        >
          <RiCloseLine className="h-3 w-3" />
        </button>
      )}
    </span>
  );
}
```

### Pill Component

For status indicators and small badges:

```tsx
interface PillProps {
  children: React.ReactNode;
  variant: "positive" | "caution" | "negative" | "neutral";
  size?: "sm" | "md";
}

export function Pill({ children, variant, size = "md" }: PillProps) {
  const variantClasses = {
    positive: "bg-success-bg text-success-text border-success-border",
    caution: "bg-warning-bg text-warning-text border-warning-border",
    negative: "bg-error-bg text-error-text border-error-border",
    neutral: "bg-surface-subtle text-text-secondary border-border",
  };

  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs",
    md: "px-2 py-1 text-sm",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border font-medium",
        variantClasses[variant],
        sizeClasses[size]
      )}
    >
      {children}
    </span>
  );
}
```

### Usage Examples

```tsx
// Highlight in text
<p>
  AUM increased by <Highlight variant="positive">$2.4M</Highlight> this quarter
</p>

// Removable tags
<div className="flex gap-2">
  <Tag variant="brand" onRemove={() => removeFilter("platinum")}>
    Platinum Tier
  </Tag>
  <Tag onRemove={() => removeFilter("frozen")}>
    Frozen Accounts
  </Tag>
</div>

// Status pills
<Pill variant="positive" size="sm">Active</Pill>
<Pill variant="caution" size="sm">Review</Pill>
<Pill variant="negative" size="sm">At Risk</Pill>
```

---

## Dashboard Layout Patterns

### KPI Grid

```tsx
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
  <Card>
    <CardContent className="pt-6">
      <p className="text-sm text-text-secondary">Total AUM</p>
      <p className="mt-2 text-3xl font-bold text-text-primary">
        $1.24B
      </p>
      <p className="mt-1 flex items-center gap-1 text-sm text-accent-600">
        <RiArrowUpLine className="h-4 w-4" />
        +8.2% YoY
      </p>
    </CardContent>
  </Card>
  {/* Repeat for other KPIs */}
</div>
```

### Chart Grid

```tsx
<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
  <Card>
    <CardHeader>
      <CardTitle>Portfolio Performance</CardTitle>
      <CardDescription>Rolling 12-month returns</CardDescription>
    </CardHeader>
    <CardContent>
      <AreaChart {...chartProps} />
    </CardContent>
  </Card>

  <Card>
    <CardHeader>
      <CardTitle>Asset Allocation</CardTitle>
      <CardDescription>Current portfolio mix</CardDescription>
    </CardHeader>
    <CardContent>
      <DonutChart {...allocationProps} />
    </CardContent>
  </Card>
</div>
```

### Sidebar Layout

```tsx
<div className="flex h-screen overflow-hidden bg-surface-muted">
  {/* Sidebar */}
  <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
    <div className="flex h-16 items-center border-b border-border px-6">
      <h1 className="text-xl font-bold text-brand-600">Farther</h1>
    </div>
    <nav className="flex-1 space-y-1 p-4">
      {/* Navigation items */}
    </nav>
  </aside>

  {/* Main content */}
  <main className="flex-1 overflow-y-auto">
    <div className="mx-auto max-w-7xl p-6 space-y-6">
      {children}
    </div>
  </main>
</div>
```

---

## Loading States & Skeletons

### Skeleton Components

```tsx
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-surface-subtle", className)}
      {...props}
    />
  );
}

// Card skeleton
export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-48 mt-2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-64 w-full" />
      </CardContent>
    </Card>
  );
}

// Table skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}
```

### Empty States

```tsx
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex h-64 flex-col items-center justify-center gap-3 text-center">
      <Icon className="h-10 w-10 text-text-muted opacity-40" />
      <div>
        <h3 className="font-semibold text-text-primary">{title}</h3>
        <p className="mt-1 text-sm text-text-secondary">{description}</p>
      </div>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
```

### Usage

```tsx
// Loading state
{isLoading && <CardSkeleton />}

// Empty state
{!data.length && (
  <EmptyState
    icon={RiBarChartLine}
    title="No performance data"
    description="Import portfolio data to see performance metrics"
    action={{
      label: "Import Data",
      onClick: handleImport,
    }}
  />
)}
```

---

## Table Components

### Data Table

```tsx
import { flexRender, Table as TanstackTable } from "@tanstack/react-table";

interface DataTableProps<TData> {
  table: TanstackTable<TData>;
}

export function DataTable<TData>({ table }: DataTableProps<TData>) {
  return (
    <div className="rounded-lg border border-border bg-surface">
      <table className="w-full">
        <thead className="border-b border-border bg-surface-subtle">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-sm font-semibold text-text-secondary"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-border">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              className="hover:bg-surface-subtle transition-colors"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3 text-sm text-text-primary">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Practical Claude Instructions

### When Building Farther UI Components

**ALWAYS:**

1. **Use semantic tokens** - `bg-brand-500`, `text-text-primary`, never `bg-purple-500`
2. **Include dark mode** - Either use semantic tokens OR add `dark:` variants
3. **Financial semantics** - Use `positive/caution/negative` for financial data
4. **CVA for variants** - All component variants via `class-variance-authority`
5. **Tremor color strings** - Pass Tailwind class names, not hex values
6. **Accessibility** - ARIA labels, focus rings, keyboard navigation
7. **Loading states** - Include skeleton and empty state for all data components
8. **Mobile-first** - Design mobile layout first, add responsive breakpoints

**NEVER:**

1. ❌ Hardcode hex colors (`#A777CA`)
2. ❌ Use generic status semantics for financial data (`success/warning/error`)
3. ❌ Install `@tremor/react` package (always copy-paste from tremor.so)
4. ❌ Skip dark mode variants
5. ❌ Use `any` TypeScript types
6. ❌ Forget focus rings on interactive elements

### Component Checklist

Before delivering a component:

- [ ] Uses semantic tokens (no hardcoded colors)
- [ ] Dark mode support (semantic tokens OR `dark:` classes)
- [ ] TypeScript interfaces for all props
- [ ] CVA variants defined
- [ ] Accessible (ARIA, focus rings, keyboard nav)
- [ ] Loading skeleton included
- [ ] Empty state included
- [ ] Mobile-responsive
- [ ] Financial semantics (positive/caution/negative)
- [ ] Tremor charts use Tailwind class names

### Code Generation Template

```tsx
// 1. Imports
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

// 2. CVA Variants
const componentVariants = cva(
  "base-classes",
  {
    variants: {
      variant: {
        default: "default-classes",
        // ...other variants
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

// 3. TypeScript Interface
export interface ComponentProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof componentVariants> {
  // Additional props
}

// 4. Component
export function Component({ variant, className, ...props }: ComponentProps) {
  return (
    <div
      className={cn(componentVariants({ variant, className }))}
      {...props}
    />
  );
}
```

---

## Financial-Specific Components

### Portfolio Return Badge

```tsx
interface ReturnBadgeProps {
  value: number;
  period?: string;
}

export function ReturnBadge({ value, period }: ReturnBadgeProps) {
  const isPositive = value >= 0;
  const variant = isPositive ? "positive" : "negative";

  return (
    <div className="flex items-center gap-2">
      <Pill variant={variant}>
        {isPositive ? "+" : ""}
        {value.toFixed(2)}%
      </Pill>
      {period && (
        <span className="text-xs text-text-muted">{period}</span>
      )}
    </div>
  );
}
```

### AUM Display

```tsx
interface AUMDisplayProps {
  value: number;
  change?: number;
  changeType?: "organic" | "market" | "total";
}

export function AUMDisplay({ value, change, changeType }: AUMDisplayProps) {
  const formatted = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

  return (
    <div>
      <p className="text-3xl font-bold text-text-primary">{formatted}</p>
      {change !== undefined && (
        <p
          className={cn(
            "mt-1 flex items-center gap-1 text-sm",
            change >= 0 ? "text-accent-600" : "text-error"
          )}
        >
          {change >= 0 ? (
            <RiArrowUpLine className="h-4 w-4" />
          ) : (
            <RiArrowDownLine className="h-4 w-4" />
          )}
          {Math.abs(change).toFixed(2)}%
          {changeType && ` ${changeType}`}
        </p>
      )}
    </div>
  );
}
```

### Tier Badge

```tsx
interface TierBadgeProps {
  tier: "Platinum" | "Gold" | "Silver" | "Standard" | "Prospect";
  showAUM?: boolean;
  aumRange?: string;
}

export function TierBadge({ tier, showAUM, aumRange }: TierBadgeProps) {
  const tierConfig = {
    Platinum: { color: "brand-600", icon: RiVipCrownLine },
    Gold: { color: "brand-500", icon: RiMedalLine },
    Silver: { color: "brand-400", icon: RiAwardLine },
    Standard: { color: "text-secondary", icon: RiUserLine },
    Prospect: { color: "text-muted", icon: RiUserAddLine },
  };

  const config = tierConfig[tier];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-2">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium",
          `bg-${config.color}/10 text-${config.color}`
        )}
      >
        <Icon className="h-4 w-4" />
        {tier}
      </span>
      {showAUM && aumRange && (
        <span className="text-xs text-text-muted">({aumRange})</span>
      )}
    </div>
  );
}
```

### Risk Indicator

```tsx
interface RiskIndicatorProps {
  score: number; // 0-100
  label?: string;
}

export function RiskIndicator({ score, label = "Churn Risk" }: RiskIndicatorProps) {
  let variant: "positive" | "caution" | "negative";
  let description: string;

  if (score <= 35) {
    variant = "positive";
    description = "Low risk";
  } else if (score <= 65) {
    variant = "caution";
    description = "Moderate risk";
  } else {
    variant = "negative";
    description = "High risk";
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <Pill variant={variant} size="sm">
          {description}
        </Pill>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-subtle">
        <div
          className={cn(
            "h-full transition-all",
            variant === "positive" && "bg-accent-500",
            variant === "caution" && "bg-warning",
            variant === "negative" && "bg-error"
          )}
          style={{ width: `${score}%` }}
        />
      </div>
      <p className="text-xs text-text-muted">Score: {score}/100</p>
    </div>
  );
}
```

---

## Resources

- **Tremor Docs:** https://tremor.so/docs
- **Radix UI:** https://www.radix-ui.com/primitives
- **CVA Documentation:** https://cva.style/docs
- **Recharts:** https://recharts.org/
- **Remix Icon:** https://remixicon.com/

---

**Questions or Updates?**
Contact design system team or update this document directly.
