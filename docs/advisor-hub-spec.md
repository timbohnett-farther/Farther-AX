# Advisor Hub — Complete Feature Specification

> **Purpose**: This document fully describes the Advisor Hub page so it can be recreated in another application. It covers every UI element, data source, API endpoint, business logic rule, database schema, and interaction pattern.

---

## Table of Contents

1. [Page Overview](#1-page-overview)
2. [Data Sources & API Endpoints](#2-data-sources--api-endpoints)
3. [Database Schema](#3-database-schema)
4. [Page Layout & Components](#4-page-layout--components)
5. [Summary Cards (Top Row)](#5-summary-cards-top-row)
6. [Tab System](#6-tab-system)
7. [Search & Filters](#7-search--filters)
8. [Pipeline Table (Launch / Early / Completed Tabs)](#8-pipeline-table-launch--early--completed-tabs)
9. [Expandable Checklist Panel](#9-expandable-checklist-panel)
10. [AUM Tracker Tab](#10-aum-tracker-tab)
11. [Sentiment Scoring System](#11-sentiment-scoring-system)
12. [Alert System](#12-alert-system)
13. [Due Date Calculator](#13-due-date-calculator)
14. [Task Status Engine](#14-task-status-engine)
15. [Task Auto-Initialization](#15-task-auto-initialization)
16. [AUM Pace Warning System](#16-aum-pace-warning-system)
17. [Graduation Logic](#17-graduation-logic)
18. [Onboarding Task Definitions (All 107 Tasks)](#18-onboarding-task-definitions-all-107-tasks)
19. [Theme & Design System](#19-theme--design-system)
20. [Data Fetching Strategy](#20-data-fetching-strategy)

---

## 1. Page Overview

**Route**: `/command-center/advisor-hub`

The Advisor Hub is the central dashboard for managing advisor onboarding. It provides:
- A directory of all advisors across all pipeline stages
- 4 tabs: Launch to Graduation, Early Deals, Completed Transitions, AUM Tracker
- 6 summary KPI cards
- Sortable, filterable table with expandable 107-task checklists per advisor
- Sentiment scoring with per-advisor and batch scoring
- AUM transfer pace monitoring with target warnings
- Alert aggregation (overdue tasks, sentiment drops, AUM behind pace)

**Tech Stack**: React 18 (client component), SWR for data fetching, inline styles with theme tokens. No Tailwind in this file — all styling is inline `style={{...}}` using a `THEME` object from a React context provider.

---

## 2. Data Sources & API Endpoints

The page fetches data from **7 API endpoints** in parallel on mount:

| Endpoint | Method | Cache TTL | Source | What It Returns |
|----------|--------|-----------|--------|-----------------|
| `/api/command-center/pipeline` | GET | 12hr (PostgreSQL cache) | HubSpot CRM v3 Search API | All active deals with 50+ properties, owner names, days since launch |
| `/api/command-center/sentiment/scores` | GET | None (live DB) | PostgreSQL `advisor_sentiment` table | All sentiment scores: composite, activity, tone, milestone, recency, tier |
| `/api/command-center/aum-tracker` | GET | 12hr (PostgreSQL cache) | HubSpot Deals + Managed Accounts custom object | Expected AUM, actual AUM, transfer %, fee BPS, revenue per advisor |
| `/api/command-center/tasks/summary` | GET | None (live DB) | PostgreSQL `onboarding_tasks` table | Per-deal counts: open_tasks, completed_tasks, total_tasks, current_phase |
| `/api/command-center/alerts` | GET | None (live) | HubSpot + PostgreSQL (tasks, sentiment, managed accounts) | All alerts: overdue tasks, sentiment drops, AUM pace warnings |
| `/api/command-center/graduations` | GET | None (live DB) | PostgreSQL `advisor_graduations` table | Set of deal IDs that have been manually graduated early |
| `/api/command-center/checklist/{dealId}` | GET | None (live) | HubSpot deal + PostgreSQL tasks + team assignments | Full 107-task checklist with due dates, status, owners (fetched lazily on row expand) |
| `/api/command-center/checklist/{dealId}` | PATCH | N/A | Writes to PostgreSQL | Toggle task completion: `{ taskId, completed, notes?, due_date? }` |
| `/api/command-center/sentiment/score` | POST | N/A | HubSpot engagements + AI scoring | Score a single advisor: `{ dealId }` |

### 2.1 Pipeline API Detail

**Source**: HubSpot CRM v3 `/crm/v3/objects/deals/search`

**Pipeline ID**: `751770`

**Active Stage IDs** (deals fetched):
| Stage ID | Label |
|----------|-------|
| `2496931` | Step 1 - First Meeting |
| `2496932` | Step 2 - Financial Model |
| `2496934` | Step 3 - Advisor Demo |
| `100409509` | Step 4 - Discovery Day |
| `2496935` | Step 5 - Offer Review |
| `2496936` | Step 6 - Offer Accepted |
| `100411705` | Step 7 - Launched |

**Deal Properties Fetched** (50+):
```
dealname, dealstage, pipeline, hubspot_owner_id, createdate, hs_lastmodifieddate,
aum, transferable_aum, transferable_aum__, current_value, t12_revenue, fee_based_revenue,
projected_revenue, expected_revenue, insurance_annuity_revenue, broker_dealer_revenue,
n401k_aum, n401k_revenue, book_assets, book_acquired___inherited__, initial_aum,
initial_aum_date, new_aum_projected_amount, average_household_assets,
client_households, transferable_households, of_client_households__cloned_,
transition_type, transition_owner, transition_notes, prior_transitions, prior_transitions_notes,
desired_start_date, actual_launch_date, closedate,
current_firm__cloned_, custodian__cloned_, onboarding_custodian__select_all_that_apply_,
firm_type, ibd, advisor, advisor_goals, advisor_top_care_abouts, advisor_pain_points,
advisor_go_to_market_strategy, advisor_debt,
crm_platform__cloned_, financial_planning_platform__cloned_, performance_platform__cloned_,
technology_platforms_being_used__cloned_,
advisor_recruiting_lead_source, referred_by__cloned_, onboarder, people
```

**Owner Resolution**: Fetches all HubSpot owners via paginated `/crm/v3/owners` endpoint, maps `hubspot_owner_id` to `"FirstName LastName"`.

**Days Since Launch**: For Step 7 deals, computed as `Math.floor((now - launchDate) / (1000*60*60*24))` where `launchDate = actual_launch_date || desired_start_date`.

### 2.2 AUM Tracker API Detail

**Two data sources merged by advisor name**:

1. **Launched Deals** (HubSpot): `transferable_aum`, `actual_launch_date`, `desired_start_date`, `client_households`, `current_firm__cloned_`, `transition_type`
2. **Managed Accounts** (HubSpot custom object `2-13676628`): Properties `advisor_name`, `current_value` (Est. Market Value), `bd_market_value`, `fee_rate_bps`

**Aggregation**: Managed accounts are summed per `advisor_name`. Fee BPS is a weighted average: `sum(mv * bps) / sum(mv)`. Revenue = `actual_aum * fee_rate_bps / 10000`.

**Transfer % Calculation**: `Math.round((actual_aum / expected_aum) * 100)`

### 2.3 Checklist API Detail

For each deal, the GET endpoint:
1. Fetches team assignments from `advisor_assignments` + `team_members` tables
2. Fetches HubSpot deal properties (closedate, dealstage, launch dates)
3. **Auto-initializes** all 107 tasks into the DB if deal is Stage 6+ and has a Day 0 date (idempotent bulk insert)
4. Auto-completes the first task (`p0_mark_signed`) if deal is Stage 6+
5. Queries all saved tasks from `onboarding_tasks`
6. Maps all 107 task definitions to saved state, calculates due dates and status
7. Returns merged array with completion state, due dates, countdowns, owner badges, responsible persons

---

## 3. Database Schema

### 3.1 `onboarding_tasks`
```sql
CREATE TABLE onboarding_tasks (
  id            SERIAL PRIMARY KEY,
  deal_id       VARCHAR(64) NOT NULL,
  task_key      VARCHAR(128) NOT NULL,
  phase         VARCHAR(32) NOT NULL,
  completed     BOOLEAN NOT NULL DEFAULT FALSE,
  completed_by  VARCHAR(255),
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  due_date      DATE,
  is_legacy     BOOLEAN DEFAULT FALSE,
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT onboarding_tasks_deal_task_unique UNIQUE(deal_id, task_key)
);
CREATE INDEX idx_onboarding_tasks_deal_id ON onboarding_tasks(deal_id);
```

### 3.2 `team_members`
```sql
CREATE TABLE team_members (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  role          VARCHAR(64) NOT NULL,       -- AXM, AXA, CTM, CXM, etc.
  phone         VARCHAR(32),
  calendar_link VARCHAR(512),
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_team_members_role ON team_members(role);
CREATE INDEX idx_team_members_active ON team_members(active);
```

### 3.3 `advisor_assignments`
```sql
CREATE TABLE advisor_assignments (
  id          SERIAL PRIMARY KEY,
  deal_id     VARCHAR(64) NOT NULL,
  role        VARCHAR(64) NOT NULL,        -- AXM, AXA, CTM, Director, etc.
  member_id   INTEGER NOT NULL REFERENCES team_members(id),
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by VARCHAR(255),
  CONSTRAINT advisor_assignments_deal_role_unique UNIQUE(deal_id, role)
);
CREATE INDEX idx_advisor_assignments_deal_id ON advisor_assignments(deal_id);
CREATE INDEX idx_advisor_assignments_member_id ON advisor_assignments(member_id);
```

### 3.4 `advisor_sentiment`
```sql
CREATE TABLE advisor_sentiment (
  id                    SERIAL PRIMARY KEY,
  deal_id               VARCHAR(64) NOT NULL UNIQUE,
  deal_name             VARCHAR(255),
  contact_id            VARCHAR(64),
  composite_score       NUMERIC(5,2) NOT NULL,
  tier                  VARCHAR(32) NOT NULL,     -- Advocate, Positive, Neutral, At Risk, High Risk
  activity_score        NUMERIC(5,2),
  tone_score            NUMERIC(5,2),
  milestone_score       NUMERIC(5,2),
  recency_score         NUMERIC(5,2),
  deal_stage            VARCHAR(64),
  engagements_analyzed  INTEGER DEFAULT 0,
  signals               JSONB,
  scored_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.5 `advisor_sentiment_history`
```sql
CREATE TABLE advisor_sentiment_history (
  id              SERIAL PRIMARY KEY,
  deal_id         VARCHAR(64) NOT NULL,
  composite_score NUMERIC(5,2) NOT NULL,
  tier            VARCHAR(32) NOT NULL,
  activity_score  NUMERIC(5,2),
  tone_score      NUMERIC(5,2),
  milestone_score NUMERIC(5,2),
  recency_score   NUMERIC(5,2),
  signal_summary  JSONB,
  scored_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_sentiment_history_deal_id ON advisor_sentiment_history(deal_id);
CREATE INDEX idx_sentiment_history_scored_at ON advisor_sentiment_history(scored_at);
```

### 3.6 `advisor_graduations`
```sql
CREATE TABLE advisor_graduations (
  deal_id       TEXT PRIMARY KEY,
  graduated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  graduated_by  TEXT
);
```

---

## 4. Page Layout & Components

```
+-----------------------------------------------------------------------+
|                          HEADER                                        |
|            "Advisor Hub" (centered, 32px, bold)                       |
|     "Full directory of advisors across all pipeline stages"           |
|                                             [Farther logo, top-right] |
+-----------------------------------------------------------------------+
|                                                                       |
|  [KPI Card 1]        [KPI Card 2]         [KPI Card 3]              |
|  Launch to Grad      Early Deals          Completed Trans            |
|  count               count                count                       |
|                                                                       |
|  [KPI Card 4]        [KPI Card 5]         [KPI Card 6]              |
|  AUM Transfer Rate   On Book Revenue      Expected Revenue           |
|  XX%                 $XXM                  $XXM                       |
|                                                                       |
+-----------------------------------------------------------------------+
|                                                                       |
|  [Tab: Launch to Graduation] [Early Deals] [Completed] [AUM Tracker] |
|                                    [Score All Sentiment] [Search...] |
|                                                                       |
|  [Merge Type ▼] [AUM Tier ▼] [Sentiment ▼] [Task Phase ▼] [Alerts▼]|
|                                                      XX advisors     |
+-----------------------------------------------------------------------+
|  Advisor | Firm | AUM | Stage | Sentiment | Tasks | Alerts | Date | R |
|  --------|------|-----|-------|-----------|-------|--------|------|---|
|  ▶ Name  | Firm | $M  | Badge | Score/100 | X open| count  | date | R |
|    └── [Expandable Checklist Panel - 8 phases, ~107 tasks]           |
|  ▶ Name  | Firm | $M  | Badge | ✦ Score   | X open| count  | date | R |
|  ...                                                                  |
+-----------------------------------------------------------------------+
|                         XX total advisors across all stages           |
+-----------------------------------------------------------------------+
```

### Component Tree
```
AdvisorHubPage (main page component)
├── Header (logo + title)
├── Summary Cards (2 rows of 3)
├── Tab Bar + Search + Score All button
├── Filter Dropdowns (5 selects)
├── AumTrackerTab (if AUM tab active)
│   ├── Pace Warning Summary Bar
│   └── AUM Table Rows
│       └── AumProgressBar
│       └── Pace Status Badge
├── Pipeline Table (if other tabs)
│   ├── Sortable Column Headers
│   └── Deal Rows
│       ├── Expand Chevron
│       ├── Advisor Name (Link to /command-center/advisor/{id})
│       ├── Current Firm
│       ├── AUM (formatted)
│       ├── Stage Badge (colored)
│       ├── SentimentBadge / Score Button
│       ├── Task Summary (open count + phase)
│       ├── Alert Count Badge
│       ├── Date
│       ├── Recruiter Name
│       └── ExpandableChecklist (if expanded)
│           ├── Summary Bar (progress ring + phase indicators)
│           └── Phase Sections (8 collapsible)
│               └── Task Rows
│                   ├── Checkbox
│                   ├── Label
│                   ├── Owner Badge
│                   ├── Resource Link Icon
│                   ├── Status Badge (countdown)
│                   ├── Hard Gate / Optional indicator
│                   └── Completion Date
└── Footer (total advisor count)
```

---

## 5. Summary Cards (Top Row)

### Row 1 - Pipeline Counts (3 cards)
| Card | Value | Source | Icon |
|------|-------|--------|------|
| Launch to Graduation | Count of deals in Steps 5-7 (Launched within 90 days, not graduated) | Pipeline API filtered | `▲` |
| Early Deals | Count of deals in Steps 1-4 | Pipeline API filtered | `◈` |
| Completed Transitions | Count of deals in Step 7 launched >90 days OR graduated early | Pipeline API filtered | `✓` |

### Row 2 - Financial Metrics (3 cards)
| Card | Value | Subtext | Source |
|------|-------|---------|--------|
| AUM Transfer Rate | `overall_transfer_pct%` | `$actual of $expected` | AUM Tracker API summary |
| On Book Revenue | `total_current_revenue` formatted | `X advisors reporting` | AUM Tracker API summary |
| Expected Revenue | `sum(expected_aum * fee_rate_bps / 10000)` | `X% realized` | Computed from AUM Tracker advisors array |

### Card Styling
- Background: `THEME.colors.surface`
- Border: `1px solid THEME.colors.border`, 8px radius
- Padding: 20px 24px
- Label: 11px uppercase, 0.08em letter-spacing, textSecondary color
- Value: 28px, bold, Inter font
- Icon: 20px, positioned absolute top-right, 25% opacity

---

## 6. Tab System

4 tabs with underline indicator:

| Tab Key | Label | Icon | Count Source |
|---------|-------|------|--------------|
| `launch` | Launch to Graduation | `▲` | launchDeals.length |
| `early` | Early Deals | `◈` | earlyDeals.length |
| `completed` | Completed Transitions | `✓` | completedDeals.length |
| `aum` | AUM Tracker | `◎` | aumData.total |

**Active tab styling**: Bold text, teal color, 2px bottom border in teal.
**Inactive tab styling**: 400 weight, textSecondary color, transparent bottom border.
**Count badge**: Pill (borderRadius 10), 11px font, different bg for active/inactive.

### Deal Categorization Rules

**Early Deals** (Steps 1-4):
```
deal.dealstage IN ['2496931', '2496932', '2496934', '100409509']
```

**Launch to Graduation** (Steps 5-7, actively transitioning):
```
deal.dealstage IN ['2496935', '2496936', '100411705']
AND (if Step 7:
  NOT graduated early
  AND daysSinceLaunch <= 90
)
```

**Completed Transitions** (Step 7, done):
```
deal.dealstage === '100411705'
AND (graduated early OR daysSinceLaunch > 90 OR daysSinceLaunch is null)
```

**Test deals** (dealname containing "test") are always excluded.

---

## 7. Search & Filters

### Search Bar
- Placeholder: "Search advisors..."
- Width: 240px, 13px font
- Filters by: `dealname`, `current_firm__cloned_`, `ownerName` (case-insensitive substring match)
- For AUM tab: filters by `advisor_name`, `prior_firm`

### Filter Dropdowns (5 total)

All filters cascade (AND logic). A count of matching advisors is shown to the right.

| Filter | Options | Logic |
|--------|---------|-------|
| **Merge Type** | Dynamic from current tab's deals `transition_type` values | Exact match on `transition_type` |
| **AUM Tier** | `$0 - $50M`, `$50M - $100M`, `$100M - $200M`, `$200M+` | Range check on `transferable_aum` |
| **Sentiment** (launch/completed tabs only) | `Advocate`, `Positive`, `Neutral`, `At Risk`, `High Risk`, `Not Scored` | Exact match on sentiment tier or null check |
| **Task Phase** | Phase 0-7 with labels | Exact match on `taskMap[dealId].current_phase` |
| **Alerts** | `Has Alerts`, `No Alerts` | Count check on `alertMap[dealId]` |

### Filter Styling
- Padding: 8px 12px, border-radius 8
- Font: 12px
- Background: `THEME.colors.surface`, border: `THEME.colors.border`

---

## 8. Pipeline Table (Launch / Early / Completed Tabs)

### Column Layout

**With Sentiment** (launch/completed tabs):
```
grid-template-columns: 1.6fr 1fr 0.7fr 0.9fr 0.7fr 0.7fr 0.8fr 0.8fr 0.8fr
```

**Without Sentiment** (early tab):
```
grid-template-columns: 1.8fr 1.2fr 0.8fr 1fr 0.7fr 0.7fr 0.9fr 0.9fr
```

### Columns

| Column | Key | Sort Logic | Content |
|--------|-----|------------|---------|
| Advisor | `dealname` | Alpha by name | Name (15px, bold), firm_type subtitle, expand chevron `▶`, links to `/command-center/advisor/{id}` |
| Current Firm | `firm` | Alpha | `current_firm__cloned_` |
| AUM | `aum` | Numeric | Formatted: `$XB`, `$XM`, or `$X,XXX` (right-aligned) |
| Stage | `stage` | Alpha by label | Colored badge with short label (removes "Step X - " prefix), "Day X" count for launched |
| Sentiment | `sentiment` | Numeric by composite_score | SentimentBadge or "Score" button |
| Tasks | `tasks` | Numeric by open_tasks | "X open" (warning/success color), "PX . Y/Z" (phase + progress) |
| Alerts | `alerts` | Numeric by count | Red badge with count, or "—" |
| Date | `date` | Alpha by date string | Launch tab: `desired_start_date`, Completed tab: `actual_launch_date \|\| desired_start_date` |
| Recruiter | `recruiter` | Alpha by ownerName | HubSpot deal owner name |

### Sorting
- Click column header to sort ascending
- Click again to toggle to descending
- Sort indicator: `▲` or `▼` after column label
- Default sort: `dealname` ascending (within each tab, deals are also pre-sorted by last name)

### Row Styling
- Background: `THEME.colors.surface`, border: `1px solid THEME.colors.border`, 8px radius
- Hover: `rgba(78,112,130,0.04)` background
- Expanded: teal border highlight
- Gap between rows: 8px
- Padding: 16px 20px
- Entire row is clickable (toggles expand)

### Stage Badge Colors
```
'2496931' (Step 1): '#7CA4B4'
'2496932' (Step 2): '#6A929F'
'2496934' (Step 3): '#527F8B'
'100409509' (Step 4): '#3B5A69'
'2496935' (Step 5): '#2C3B4E'
'2496936' (Step 6): '#B68A4C'  (gold)
'100411705' (Step 7): '#3B5A69'
```
Badge style: `background: ${color}18` (hex with 18 opacity suffix), `color: ${color}`

### Empty State
Center-aligned: "No advisors match your search" or "No advisors in this category"

### Footer
Right-aligned: "{X} total advisors across all stages"

---

## 9. Expandable Checklist Panel

Appears inline below a deal row when expanded (accordion — only one at a time).

### Data Flow
1. Row click toggles `expandedDealId`
2. `ExpandableChecklist` component mounts with `dealId` prop
3. SWR fetches `/api/command-center/checklist/{dealId}` (lazy, on-demand)
4. Shows loading shimmer (3 placeholder bars) while fetching

### Summary Bar
Displayed at top of expanded panel:
- **Progress Ring**: SVG circle (40x40), `stroke-dasharray` animated, percentage in center (10px, bold, amber)
- **Task Count**: "X/Y tasks" with "Z overdue" or "On track"
- **Phase Mini Indicators**: Row of pills showing "P0 3/5", "P1 12/20", etc. with phase colors. All-done phases turn green.

### Phase Sections (8 collapsible groups)

Each phase is a bordered card with header and task rows:

**Phase Header** (clickable to expand/collapse):
- Background: phase-specific tinted color
- Chevron `▼` rotates 90deg when collapsed
- Phase label: 11px uppercase bold in phase color
- Count: "X/Y"
- Progress bar: thin 4px bar filling to `pct%`
- Percentage: right-aligned in phase color
- **Default state: collapsed**

**Phase Colors**:
```
phase_0: '#7c3aed' (purple)
phase_1: '#3b82f6' (blue)
phase_2: '#0ea5e9' (sky)
phase_3: '#06b6d4' (cyan)
phase_4: '#f59e0b' (amber)
phase_5: '#ef4444' (red)
phase_6: '#10b981' (emerald)
phase_7: '#8b5cf6' (violet)
```

### Task Row Elements

Each row in a phase section:

| Element | Description |
|---------|-------------|
| **Checkbox** | 20x20, rounded-4, border matches phase color when completed. White `✓` on filled bg. Click triggers optimistic PATCH. |
| **Label** | 12px, strikethrough + gray when completed |
| **Owner Badge** | 9px uppercase, gray bg pill (e.g., "AXM", "CTM", "IT") |
| **Resource Link** | Blue `↗` icon button (22x22) if `task.resources` exists. Opens URL in new tab. |
| **Status Badge** | 9px uppercase. Shows countdown text (e.g., "DUE IN 3 BUSINESS DAYS", "2 BUSINESS DAYS OVERDUE"). Hidden for completed or no-due-date tasks. |
| **Optional Badge** | Shows "Optional" pill if `is_hard_gate` is false |
| **Completion Date** | 10px, shows "Mar 15" format when completed |

### Status Badge Colors
```
upcoming:    { color: '#5b6a71', bg: 'rgba(91,106,113,0.08)' }
due_soon:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' }
overdue:     { color: '#ef4444', bg: 'rgba(239,68,68,0.15)' }
critical:    { color: '#dc2626', bg: 'rgba(220,38,38,0.2)' }
completed:   { color: '#10b981', bg: 'rgba(16,185,129,0.15)' }
no_due_date: { color: '#5b6a71', bg: 'rgba(91,106,113,0.08)' }
```

### Checkbox Toggle Flow
1. Click checkbox
2. Set `toggling` state (dims row to 60% opacity)
3. Optimistic SWR update (flip `completed` locally)
4. PATCH `/api/command-center/checklist/{dealId}` with `{ taskId, completed: !current }`
5. Revalidate local checklist SWR
6. `globalMutate('/api/command-center/tasks/summary')` to refresh parent table's task counts
7. Clear toggling state

---

## 10. AUM Tracker Tab

### Summary Warning Bar
Shows at top if any advisors are behind/off pace:
- Red bg if `behindCount > 0`, amber bg if only warnings
- Text: "X advisors behind target . Y off pace"

### AUM Table Columns

```
grid-template-columns: 1.5fr 0.9fr 0.7fr 1fr 1fr 0.6fr 0.7fr 0.8fr 1.1fr
```

| Column | Content |
|--------|---------|
| Advisor | Name (links to advisor detail), household count subtitle |
| Prior Firm | Text |
| Type | Transition type badge (teal-tinted) |
| Expected AUM | Right-aligned, formatted |
| Transfer Progress | `AumProgressBar` component |
| Days | Days since launch with "d" suffix |
| Fee BPS | Right-aligned with "bps" suffix |
| Current Rev | Right-aligned, green if present |
| Pace Status | Badge + detail text |

### AumProgressBar Component
- Shows `pct%` label with color-coded value
- Shows `formatAUM(actual)` right-aligned in gray
- 6px tall bar with rounded corners
- Color thresholds: `>=90%` green, `>=60%` bronze, `>=30%` amber, `<30%` red
- Bar capped at 100% width even if value exceeds

---

## 11. Sentiment Scoring System

### Tiers
| Tier | Color | Background | Icon |
|------|-------|------------|------|
| Advocate | `#4ade80` | `rgba(74,222,128,0.2)` | `★` |
| Positive | `#5ec4cf` | `rgba(78,112,130,0.2)` | `▲` |
| Neutral | `#fbbf24` | `rgba(251,191,36,0.18)` | `●` |
| At Risk | `#fb923c` | `rgba(251,146,60,0.2)` | `◈` |
| High Risk | `#f87171` | `rgba(248,113,113,0.2)` | `▼` |

### SentimentBadge Component
- Shows tier icon + tier name + score/100
- If not scored: italic "Not scored" in gray
- If no sentiment data: "Score" button appears (teal border on hover)

### Scoring Actions
- **Score Single**: Click `✦ Score` button per advisor. POSTs to `/api/command-center/sentiment/score` with `{ dealId }`.
- **Score All**: Top-right button "✦ Score All Sentiment". Sequentially scores all advisors in current tab (to avoid rate limits). Shows "Scoring..." disabled state.

### Score Components (stored in DB)
- `composite_score`: 0-100
- `activity_score`: engagement frequency
- `tone_score`: communication sentiment
- `milestone_score`: onboarding milestone completion
- `recency_score`: how recently engaged

---

## 12. Alert System

The alerts API aggregates 3 alert types:

### Alert Type 1: Task Overdue / Critical
- Generated for Stage 6+ deals where any task has `needsAlert` or `needsDirectorAlert`
- Includes: deal_id, deal_name, task_key, task_label, phase, phase_label, owner, due_date, days_overdue, is_hard_gate, responsible_person, countdown_display, priority
- `task_overdue`: 1-2 business days overdue
- `task_critical`: >2 business days overdue

### Alert Type 2: Sentiment Drop
- Triggered when sentiment tier drops to "At Risk" or "High Risk" from a better tier
- Uses `advisor_sentiment_history` with `LATERAL` join to find previous score
- Includes: previous_tier, current_tier, score_change

### Alert Type 3: AUM Behind Pace
- For launched advisors within 90 days
- Checks transfer % against pace targets (see Section 16)
- `warning`: 5-15% behind expected
- `behind`: >15% behind expected

### Alert Display in Hub
- Per-deal alert count shown as red badge in the Alerts column
- Alert filter dropdown: "Has Alerts" / "No Alerts"
- Sorted by priority: critical > overdue > sentiment > aum

---

## 13. Due Date Calculator

Parses human-readable timing strings and computes absolute due dates.

### Timing Anchors
- **Day 0** (`day0`): `closedate` from HubSpot deal (when deal moved to Stage 6 "Offer Accepted")
- **Launch Date** (`launch`): `actual_launch_date || desired_start_date`

### Timing Pattern Rules

| Pattern | Anchor | Offset | Example |
|---------|--------|--------|---------|
| `T-X` | Launch | -X days | "T-7" = launch - 7 days |
| `T+X` | Launch | +X days | "T+2" = launch + 2 days |
| `Week X` | Launch | X*7 days | "Week 1" = launch + 7 days |
| `Launch Day` / `Day 1` | Launch | 0 | Launch date itself |
| `Day 0` | Day 0 | 0 | Day 0 itself |
| `Within X hrs` | Day 0 | ceil(X/24) days | "Within 4 hrs" = Day 0 + 1 |
| `Within X days` | Day 0 | X days | "Within 3 days" = Day 0 + 3 |
| `Day X` / `Day X-Y` | Day 0 | X days (earliest) | "Day 7-10" = Day 0 + 7 |
| `By T-X` | Launch | -X days | "By T-35" = launch - 35 |
| `By Day X` | Day 0 | X days | "By Day 30" = Day 0 + 30 |
| `Morning` | Launch | 0 | Launch day morning tasks |
| `During mtg` / `With kickoff` / `With kick-off` / `EOD same day` / `Post-meeting` | Day 0 | +7 days | Kickoff meeting tasks |
| `Start of Phase 3` | Day 0 | +10 days | Phase 3 beginning |
| `Phase 3` | Launch | -21 days | Mid-Phase 3 |
| `Weekly` / `Ongoing` / `As needed` | N/A | null | No calculable date |
| Event-dependent (`Upon receipt`, `After verification`, `When sent`, `When ready`, `After first bill`, `After assets arrive`, `If custom`, `Fridays 4pm`) | N/A | null | No calculable date |

### Date Arithmetic
All dates are computed in UTC. `addDays(dateString, days)` creates a Date with `T00:00:00Z`, adds days via `setUTCDate`, returns `YYYY-MM-DD` string.

---

## 14. Task Status Engine

Calculates countdown timers and overdue status using **business days** (excludes weekends).

### Status Categories

| Status | Condition | Display | Alert? | Director Alert? |
|--------|-----------|---------|--------|-----------------|
| `completed` | `completed === true` | "Completed {date}" | No | No |
| `no_due_date` | `dueDate === null` | "No due date" | No | No |
| `critical` | Business days remaining < -2 | "X business days overdue" | Yes | Yes |
| `overdue` | Business days remaining -1 to -2 | "X business days overdue" | Yes | No |
| `due_soon` | Business days remaining 0 to 2 | "Due today" / "Due in X business days" | No | No |
| `upcoming` | Business days remaining > 2 | "Due in X business days" | No | No |

### Business Days Calculation
Counts weekday days (Mon-Fri) between two dates. Excludes Saturday (6) and Sunday (0). Does not account for holidays.

### Responsible Person Mapping
Maps task `owner` (e.g., "AXM") to team member via `advisor_assignments` + `team_members` join. Returns `{ name, email, role }` or null if unassigned.

---

## 15. Task Auto-Initialization

When a Stage 6+ deal's checklist is loaded:

1. **Fast check**: Count existing non-legacy tasks for this deal
2. **Skip if fully initialized**: If count >= 107, return immediately
3. **Bulk insert**: Single INSERT of all 107 tasks with calculated due dates
4. **ON CONFLICT**: `(deal_id, task_key) DO UPDATE SET due_date = COALESCE(existing, new)` - fills in null due dates (e.g., when launch_date was unknown and is now set) without overwriting existing due dates or completion state
5. **Non-fatal**: If initialization fails, the endpoint still works with on-the-fly behavior

---

## 16. AUM Pace Warning System

### Pace Targets by Transition Type

| Transition Type | Day Target | Expected % |
|----------------|-----------|------------|
| **Master Merge** | Day 14 | 95% |
| **LPOA** | Day 30 | 60% |
| **LPOA** | Day 45 | 80% |
| **LPOA** | Day 60 | 90% |
| **Repaper** | Day 90 | 90% |

### Evaluation Logic

1. Find the most recent passed target and the next upcoming target
2. If before first target: linear interpolation (`(daysSinceLaunch / target.days) * target.expectedPct`)
3. Compare actual `transfer_pct` against expected:
   - **On Pace**: within 5% of target
   - **Off Pace / Slow Start**: 5-15% behind
   - **Behind Target**: >15% behind

### Pace Status Display

| Status | Color | Icon | Background |
|--------|-------|------|------------|
| On Pace | `#27ae60` | `✓` | `rgba(39,174,96,0.10)` |
| Off Pace / Slow Start | `#e67e22` | `⚠` | `rgba(230,126,34,0.10)` |
| Behind Target | `#c0392b` | `▼` | `rgba(192,57,43,0.08)` |
| Unknown | `#5b6a71` | `●` | `rgba(91,106,113,0.06)` |

---

## 17. Graduation Logic

- **GRADUATION_DAYS = 90**: Advisors in Step 7 (Launched) for >90 days auto-move to "Completed Transitions"
- **Early Graduation**: Manual override stored in `advisor_graduations` table. Graduated deals always appear in "Completed" regardless of days since launch.
- **Graduation check**: `graduatedSet` (Set of deal IDs) is fetched from `/api/command-center/graduations`

---

## 18. Onboarding Task Definitions (All 107 Tasks)

### Phase Summary

| Phase | Name | Timeline | Primary Owner | Task Count | Hard Gates |
|-------|------|----------|---------------|------------|------------|
| 0 | Sales Handoff | Day 0 to +2 days | Recruiter | 5 | 4 |
| 1 | Post-Signing Prep | Day 0 to Day 7-10 | AXM | 20 | 14 |
| 2 | Onboarding Kick-Off | Day 7-10 (single meeting) | AXM | 12 | 7 |
| 3 | Pre-Launch Build | Post-Kick-Off to T-7 | AXA | 22 | 18 |
| 4 | T-7 Final Countdown | T-7 to Launch Day | AXM | 7 | 7 |
| 5 | Launch Day | Day 1 | AXM | 13 | 10 |
| 6 | Active Transition | Day 1 to Day 60 | CTM | 20 | 10 |
| 7 | Graduation & Handoff | Day 60 to Day 90 | Director | 7 | 3 |

### Owner Roles
| Code | Full Name |
|------|-----------|
| AXM | Advisor Experience Manager |
| AXA | Advisor Experience Associate |
| CTM | Client Transition Manager |
| CXM | Client Experience Manager |
| Recruiter | Recruiter |
| Director | Director |
| IT | IT |
| HR | HR |
| Finance | Finance |
| Marketing | Marketing |
| Compliance | Compliance |
| Investment Team | Investment Team |
| FP Team | Financial Planning Team |
| FIG Team | FIG Team |
| Biz Ops | Business Operations |
| RIA Leadership | RIA Leadership |
| Advisor | The advisor themselves |

### Complete Task List

#### Phase 0 - Sales Handoff (5 tasks)
| ID | Label | Owner | Timing | Hard Gate | Resources |
|----|-------|-------|--------|-----------|-----------|
| p0_mark_signed | Mark deal "Signed" in HubSpot with complete data | Recruiter | Day 0 | Yes | HubSpot deals |
| p0_recruiter_axm_sync | Schedule Recruiter/AXM Prep Sync | Recruiter | Within 2 days | Yes | |
| p0_kickoff_call | Schedule Recruiter/AXM/Advisor Kickoff Call (30 min) | Recruiter | Within 2 days | Yes | |
| p0_create_profile | Create Advisor Profile and Onboarding Tracker | AXA | Within 4 hrs | No | Google Drive |
| p0_assign_axm | Assign AXM and AXA to advisor in Portal | Director | Within 6 hrs | Yes | |

#### Phase 1 - Post-Signing Prep (20 tasks)
| ID | Label | Owner | Timing | Hard Gate | Resources |
|----|-------|-------|--------|-----------|-----------|
| p1_create_folder | Create Advisor Folder in shared drive | AXA | Within 24 hrs | Yes | Google Drive |
| p1_transition_sheet | Create Transition Google Sheet | AXA | Within 24 hrs | Yes | Google Drive |
| p1_slack_channel | Create #lastname-onboarding Slack channel | AXA | Within 24 hrs | Yes | |
| p1_kickoff_email | Send Kickoff Email (Welcome to Farther) | AXM | Within 24 hrs | Yes | HubSpot email template |
| p1_advisor_decks | Send Advisor Decks & Intake Forms | AXM | With kickoff | Yes | Google Drive |
| p1_schedule_kickoff | Schedule Onboarding Kick-Off Call (30 Minutes) | AXA | Within 2 days | Yes | |
| p1_weekly_checkins | Schedule Weekly Onboarding Check-Ins | AXA | With kick-off | Yes | |
| p1_u4_2b_intake | Advisor completes U4/2B intake form | Advisor | Within 3 days | Yes | Google Forms |
| p1_u4_2b_review | Review U4/2B Upload and Check for Errors | AXA | Upon receipt | Yes | |
| p1_u4_2b_submit | Submit U4/2B to Compliance | AXM | After verification | Yes | |
| p1_book_analysis | Review Book Analysis Form (all sections) | AXA | Within 3 days | Yes | Google Sheets |
| p1_tech_procurement | Check Tech Procurement Form submitted | AXA | Within 3 days | Yes | |
| p1_marketing_intake | Check Marketing Intake Form | AXA | Within 3 days | Yes | |
| p1_sma_alts | Review SMA/Alternatives Form | AXA | Within 3 days | Yes | |
| p1_insurance | Check Insurance/Annuities Form | AXA | Within 3 days | Yes | |
| p1_billing_cadence | Scope billing cadence | AXM | Within 3 days | No | |
| p1_perf_migration | Scope performance data migration | AXM | Within 3 days | No | |
| p1_crm_migration | Scope CRM migration | IT | Within 3 days | No | |
| p1_branding | Scope branding requirements | Marketing | Within 3 days | No | |
| p1_it_notify | Notify IT of email/phone domain needs | AXA | If custom | No | |

#### Phase 2 - Onboarding Kick-Off (12 tasks)
| ID | Label | Owner | Timing | Hard Gate | Resources |
|----|-------|-------|--------|-----------|-----------|
| p2_kickoff_call | Hold Kick-off Call (1.5 hrs) | AXM | Day 7-10 | Yes | |
| p2_recruiter_intro | Recruiter introduces AXM (5 min) | Recruiter | During mtg | No | |
| p2_process_overview | Present transition process overview | AXM | During mtg | No | |
| p2_gather_blueprint | Gather Transition Blueprint data | AXA | During mtg | No | |
| p2_discuss_details | Discuss billing, performance, CRM, branding | CTM | During mtg | No | |
| p2_assign_deliverables | Assign advisor deliverables with deadlines | AXM | During mtg | No | |
| p2_create_blueprint | Create Transition Blueprint (from notes) | AXA | Within 4 hrs | Yes | Google Sheets |
| p2_followup_email | Send follow-up email with all deliverables | AXA | EOD same day | Yes | HubSpot email template |
| p2_advisor_signoff | Advisor signs off on Blueprint | Advisor | Within 2 days | Yes | |
| p2_master_merge_notice | Submit Master Merge notice to custodian | CTM | By T-35 | Yes | |
| p2_ncl | Prepare & Send Client Communication (NCL) | AXM | By T-30 | Yes | |
| p2_send_iaa | Send copy of IAA | AXM | Post-meeting | No | DocuSign |

#### Phase 3 - Pre-Launch Build (22 tasks)
| ID | Label | Owner | Timing | Hard Gate | Resources |
|----|-------|-------|--------|-----------|-----------|
| p3_monitoring_cadence | Establish weekly monitoring cadence | AXA | Start of Phase 3 | No | |
| p3_weekly_checkins | Weekly Onboarding Check-Ins with Advisor | AXM | Weekly | No | |
| p3_status_updates | Post weekly status to #transitions-onboarding | AXA | Fridays 4pm | No | |
| p3_file_u4_2b | File U4/2B amendments | Compliance | By T-21 | Yes | |
| p3_dual_reg | Confirm dual registration status | Compliance | By T-21 | Yes | |
| p3_intro_compliance | Introduce to Compliance Team | AXA | Phase 3 | Yes | |
| p3_intro_investments | Introduce to Investments Team | AXA | Phase 3 | Yes | |
| p3_intro_marketing | Introduce to Marketing Team | AXA | Phase 3 | Yes | |
| p3_intro_pinnacle | Introduce to Pinnacle/DPL Team | AXA | Phase 3 | Yes | |
| p3_intro_it | Introduce to IT Team | AXA | Phase 3 | Yes | |
| p3_intro_fp | Introduce to Financial Planning Team | AXA | Phase 3 | Yes | |
| p3_intro_hr | Introduce to HR Team | AXA | Phase 3 | Yes | |
| p3_receive_ncl | Receive copy of NCL when sent to clients | AXA | When sent | Yes | |
| p3_marketing_approval | Review & approve marketing materials | Compliance | By T-14 | Yes | |
| p3_transition_docs | Prepare client transition documentation | CTM | By T-7 | Yes | Google Drive |
| p3_assign_cx_pod | Assign CX pod to advisor | CXM | By T-14 | Yes | |
| p3_cx_training | Schedule & complete CX staff training | CXM | By T-10 | No | |
| p3_brand_assets | Prepare brand assets & PR announcement | Marketing | By T-14 | Yes | Google Drive |
| p3_tech_order | Place tech order (laptop, Zoom, etc.) | IT | By T-10 | Yes | |
| p3_bd_billing | Verify Black Diamond billing setup | Finance | By T-14 | Yes | BlackDiamond |
| p3_employment_paperwork | Complete employment paperwork | HR | By T-14 | Yes | |
| p3_schedule_prelaunch | Schedule Pre-Launch Sync (T-7) | AXA | When ready | Yes | |
| p3_verify_custodian | Verify Custodian Master # / G# | AXA | By T-7 | Yes | |

#### Phase 4 - T-7 Final Countdown (7 tasks)
| ID | Label | Owner | Timing | Hard Gate |
|----|-------|-------|--------|-----------|
| p4_prelaunch_sync | Hold Pre-Launch Sync meeting (1.5 hrs) | AXM | T-7 | Yes |
| p4_day1_guide | Send Day 1 Guide to advisor | AXM | By T-6 | Yes |
| p4_verify_meetings | Verify all first-week meetings scheduled | AXA | T-5 to T-3 | Yes |
| p4_tech_shipment | Confirm Tech Shipment delivered | AXA | By T-2 | Yes |
| p4_test_access | Test all system access | AXA | T-3 to T-1 | Yes |
| p4_crm_migration | Initiate CRM migration | IT | T-1 | Yes |
| p4_go_nogo | Final "Go/No-Go" decision | Director | T-1 | Yes |

#### Phase 5 - Launch Day (13 tasks)
| ID | Label | Owner | Timing | Hard Gate |
|----|-------|-------|--------|-----------|
| p5_slack_add | Add advisor to #lastname-onboarding Slack | AXA | Morning | No |
| p5_welcome_message | Send "Welcome to Day 1" message | AXM | Morning | No |
| p5_provision_access | Access & Provisioning (Slack, HubSpot, Zoom, Gmail) | IT | Morning | Yes |
| p5_day1_call | Hold Day 1 Call (intro to teams, training calendar) | AXA | Day 1 | Yes |
| p5_systems_overview | Systems Overview call (1 hr) | IT | Day 1 | Yes |
| p5_ria_intro | Introduce to RIA Manager | RIA Leadership | Day 1 | Yes |
| p5_cx_demo | CX Intro & Portal Demo (30 min) | CXM | Day 1 | Yes |
| p5_hr_grid | HR Grid/Payout review (30 min) | HR | Day 1 | Yes |
| p5_client_announcement | Prepare Client Announcement letter | AXA | Day 1 | Yes |
| p5_advisor_approval | Get advisor approval on announcement | AXM | Day 1 | Yes |
| p5_send_announcement | Send Client Announcement via HubSpot | AXA | Day 1 | Yes |
| p5_verify_access | Confirm all systems access working | AXA | Day 1 | Yes |
| p5_weekly_transition_checkins | Schedule Weekly Transition Check-In calls | CTM | Day 1 | Yes |

#### Phase 6 - Active Transition (20 tasks)
| ID | Label | Owner | Timing | Hard Gate |
|----|-------|-------|--------|-----------|
| p6_investment_intro | Investment Strategy intro (1 hr) | Investment Team | Week 1 | No |
| p6_fp_intro | Financial Planning intro (1 hr) | FP Team | Week 1 | No |
| p6_fig_intro | FIG intro (1 hr) | FIG Team | Week 1 | No |
| p6_marketing_strategy | Marketing strategy call (1 hr) | Marketing | Week 1 | No |
| p6_hr_orientation | HR Orientation & Intro to Farther Learning | HR | Week 1 | Yes |
| p6_cx_pod_intro | Introduce to CX Pod (service team) | CXM | Week 1 | Yes |
| p6_transition_checkins | Weekly Transition Check-Ins with Advisor | CTM | Weekly | No |
| p6_axm_checkins | 2x weekly AXM/Advisor check-ins | AXM | Ongoing | No |
| p6_transfer_docs | Send Account Transfer Documents | CTM | T+2 | No |
| p6_docusign | Deploy DocuSign packages to clients | CTM | T+2 | No |
| p6_crm_import | CRM Import / Migration (upload contacts) | IT | Week 1-2 | Yes |
| p6_client_portals | Create Client Portals with PII (bulk upload) | CTM | Weekly | Yes |
| p6_monitor_progress | Monitor client transition progress | CTM | Ongoing | No |
| p6_bd_householding | BlackDiamond Householding and Billing setup | Finance | Week 2-3 | Yes |
| p6_first_billing | Monitor first billing cycle (48-hr review) | Finance | After first bill | Yes |
| p6_perf_migration | Performance Migration (after bulk assets) | Biz Ops | Week 3-4+ | Yes |
| p6_insurance_progress | Check on Insurance/Annuities Progress | AXA | Week 2+ | No |
| p6_escalate_pinnacle | Escalate Pinnacle/DPL issues if needed | AXA | As needed | No |
| p6_gift_boxes | Farther Client Gift Boxes (add to list) | CXM | After assets arrive | No |
| p6_dept_intros_complete | Complete department introductions | AXA | By Day 30 | Yes |

#### Phase 7 - Graduation & Handoff (7 tasks)
| ID | Label | Owner | Timing | Hard Gate |
|----|-------|-------|--------|-----------|
| p7_weekly_checkins | Transition AXM check-ins to weekly | AXM | Day 60 | No |
| p7_compliance_review | Complete 90-day compliance review | Compliance | Day 90 | Yes |
| p7_graduation_call | Graduation to CX (final call with CX team) | CXM | Day 90 | Yes |
| p7_handoff | Hand off to ongoing support model | Director | Day 90 | Yes |
| p7_close_slack | Close onboarding Slack channel | AXA | Day 90 | No |
| p7_archive | Archive onboarding documentation | AXA | Day 90 | No |
| p7_lessons_learned | Conduct lessons learned review | AXA | Day 90 | No |

---

## 19. Theme & Design System

### Color Mode
- Supports dark and light modes via React context (`useTheme()`)
- Theme object contains all colors, typography, spacing, shadows, etc.

### Key Theme Tokens

| Token | Dark Mode | Light Mode |
|-------|-----------|------------|
| `bg` | `#2F424B` | `#F8F4F0` |
| `surface` | `#3B5A69` | `#F2EAE2` |
| `text` | `#F8F4F0` | `#333333` |
| `textSecondary` | `#CCD2D5` | `#5B6A71` |
| `border` | `rgba(148,181,195,0.18)` | `rgba(59,90,105,0.15)` |
| `teal` | `#3B5A69` | `#3B5A69` |
| `success` | `#6DBF7B` | `#6DBF7B` |
| `warning` | `#C49A5C` | `#C49A5C` |
| `error` | `#D4736E` | `#D4736E` |
| `errorBg` | `rgba(212,115,110,0.12)` | `rgba(212,115,110,0.10)` |
| `bronze400` | `#B68A4C` | `#B68A4C` |

### Typography
- **Primary sans**: `'Inter', system-ui, sans-serif` (used throughout Advisor Hub)
- **Serif**: `'ABC Arizona Text', Georgia, serif` (headings in other pages)
- **Monospace**: `'DM Mono', monospace`
- Financial numbers: `font-variant-numeric: tabular-nums`, right-aligned

### Font Sizes
```
xs: 11px, sm: 13px, base: 15px, md: 16px, lg: 18px, xl: 22px, 2xl: 28px, 3xl: 36px
```

---

## 20. Data Fetching Strategy

### SWR Configuration
```javascript
const SWR_OPTS = {
  refreshInterval: 8 * 60 * 60 * 1000,   // 8 hours
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 60 * 60 * 1000,       // 1 hour dedup
  keepPreviousData: true,
  errorRetryCount: 2,
};
```

### Caching Layers (Server-Side)
The Pipeline and AUM Tracker APIs use a multi-tier cache:
1. **PostgreSQL cache** (`api_cache` table) with 12-hour TTL
2. Falls back to HubSpot API on cache miss
3. Stale data served if HubSpot fails

### Lazy Loading
- Checklist data is NOT fetched on page load
- Only fetched when a deal row is expanded (SWR with deal-specific key)
- Loading state shows 3 shimmer placeholder bars

### Optimistic Updates
- Checkbox toggles immediately update local SWR cache
- PATCH request fires in background
- On success: revalidate + refresh parent summary
- On failure: revert via SWR revalidation

---

## Appendix: Key Interaction Patterns

1. **Row Expand/Collapse**: Accordion pattern - clicking a row expands its checklist panel and collapses any previously expanded row
2. **Advisor Name Link**: Clicking the name navigates to `/command-center/advisor/{dealId}` (detail page). `stopPropagation` prevents row expand.
3. **Resource Link**: Opens external URL (HubSpot, Google Drive, DocuSign) in new tab. `stopPropagation` prevents row expand.
4. **Score Button**: `stopPropagation` on the sentiment column prevents row expand when clicking Score.
5. **Sort Persistence**: Sort state is local React state (not URL). Resets on tab change.
6. **Filter Reset**: Filters persist across tab switches but operate on the current tab's deal pool.
