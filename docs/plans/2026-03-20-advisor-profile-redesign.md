# Advisor Profile Redesign — AI-Powered Pinned Note Extraction

**Date:** 2026-03-20
**Author:** Tim Bohnett / Claude
**Status:** Approved

## Summary

Rebuild the advisor profile page (`/command-center/advisor/[id]`) with a tabbed layout and AI-powered data extraction from HubSpot pinned notes. The pinned note on each contact record is the recruiter's "bible" — a structured template containing CRD numbers, licenses, professional experience, book analysis, financials, deal structure, and more. We use Grok AI to parse this note into structured JSON and populate designated fields across the profile.

## Data Sources (per advisor)

| Source | What it provides | Status |
|--------|-----------------|--------|
| Deal record | Stage, dates, AUM, firm, transition info | Existing |
| Teams custom object | Detailed financials, tech stack, team size | Existing |
| Associated Contact | Email, phone, city, state, zip, LinkedIn | NEW |
| Pinned Note (via contact) | Recruiter intel: licenses, CRD, experience, book analysis, deal structure | NEW |
| Engagement Timeline | Calls, emails, meetings, notes | NEW |
| Complexity Score | Score, tier, factors | Existing |
| Team Assignments | AXM/AXA/CTM/CTA | Existing |

## Architecture

### API Flow

```
GET /api/command-center/advisor/[id]
  ├── fetchDeal(dealId)                          [existing]
  ├── fetchTeamsRecord(dealId)                   [existing]
  ├── fetchAssociatedContact(dealId)             [NEW]
  │   ├── GET deal associations → contactId
  │   ├── GET contact properties (email, phone, city, state, zip, hs_pinned_engagement_id)
  │   └── GET pinned note by engagement ID → raw HTML body
  ├── fetchEngagements(contactId)                [NEW]
  │   └── GET engagements (calls, emails, meetings) last 20
  └── fetchNotes(dealId)                         [existing]

POST /api/command-center/advisor/parse-note      [NEW]
  ├── Receives raw pinned note text
  ├── Sends to Grok AI with structured extraction prompt
  └── Returns JSON with 50+ extracted fields
```

### AI Extraction Schema

The Grok prompt extracts the pinned note into this JSON shape:

```json
{
  "candidate_profile": {
    "name": "string",
    "candidate_type": "string (Owner/RIA Employee/Wirehouse)",
    "lead_source": "string",
    "location": "string",
    "current_firm": "string",
    "title": "string",
    "website": "string",
    "licenses": ["string"],
    "disclosures": "string",
    "loe_years": "number (Length of Experience)",
    "los_years": "number (Length of Service)",
    "previous_experience": [{ "firm": "string", "role": "string", "years": "number" }]
  },
  "team_members": [
    { "name": "string", "title": "string", "licenses": "string", "compensation": "string", "notes": "string" }
  ],
  "motives": {
    "pain_points": ["string"],
    "top_care_abouts": ["string"],
    "goals": ["string"]
  },
  "book_analysis": {
    "total_aum": "number",
    "t12_revenue": "number",
    "avg_fee_bps": "number",
    "households": "number",
    "accounts": "number",
    "avg_hh_size": "number",
    "largest_client": "number",
    "investment_products": "string",
    "alt_assets_pct": "number",
    "insurance_annuity": "string",
    "n401k_aum_revenue": "string",
    "bd_revenue": "string",
    "organically_grown_pct": "number",
    "acquired_inherited_pct": "number",
    "go_to_market": "string",
    "annual_productivity": "string",
    "obas": "string"
  },
  "financials": {
    "employment_type": "string (1099/W2)",
    "contract_restrictions": "string",
    "payout_rate": "string",
    "annualized_income": "number",
    "annualized_expenses": "number",
    "expense_details": ["string"],
    "office_expense": "number",
    "marketing_spend": "number",
    "debt": "string",
    "competing_firms": ["string"],
    "competing_offers": ["string"]
  },
  "portability": {
    "owns_master_code": "boolean",
    "transition_type": "string",
    "previous_transitions": "boolean",
    "previous_transition_notes": "string",
    "transferable_pct": "number",
    "transferable_aum": "number",
    "transferable_revenue": "number",
    "transferable_households": "number",
    "billing_cycle": "string"
  },
  "deal_structure_notes": "string (full text)",
  "personal": {
    "married": "string",
    "kids": "string",
    "notes": ["string"]
  },
  "sales_process": {
    "intro_call_notes": "string",
    "first_meeting_notes": "string",
    "financial_model_notes": "string",
    "discovery_day_date": "string",
    "offer_notes": "string",
    "next_steps": [{ "step": "string", "date": "string" }]
  },
  "timeline_notes": "string",
  "close_date": "string",
  "start_date": "string"
}
```

### Data Merge Priority

When both the pinned note (AI-extracted) and HubSpot structured fields have a value:
1. **HubSpot structured data wins** for numeric fields (AUM, revenue, households) — more likely to be current
2. **Pinned note wins** for qualitative fields (licenses, experience, motives, deal structure) — richer detail
3. **Both shown** when they differ significantly — flag for user awareness

## UI Design

### Header (persistent across all tabs)
- Advisor name (large, serif font)
- Stage badge + 7-step progress bar
- Contact: email (mailto) · phone (tel) · city, state
- Transferable AUM (large, right-aligned)
- "View Raw Note" toggle button

### Tab 1: Overview (default)
- **Candidate Profile card** — type, location, firm, title, website, licenses (badges), LOE, LOS
- **Professional Experience** — timeline/list of previous firms & roles
- **Team Members** — table with name, title, licenses, compensation, notes
- **Motives** — Pain Points, Care Abouts, Goals (colored cards)
- **Personal Details** — married, kids, personal notes

### Tab 2: Financials
- **Book Analysis** — AUM, revenue, fee, households, avg HH, largest client, investment products, alts, insurance, 401k, BD revenue, organic/acquired split
- **Current Financials** — employment type, payout, income, expenses (itemized), debt
- **Competing Firms & Offers**
- **Deal Structure Notes** — full text
- **Portability & Transition** — transition type, master code, transferable %, AUM/revenue/HH

### Tab 3: Engagements
- **Summary stats** — total activities, last contacted, email/call/meeting counts
- **Sales Process Timeline** — next steps with dates from pinned note
- **Activity Feed** — last 20 HubSpot engagements, searchable, filterable by type (email/call/meeting/note)

### Tab 4: Tech & Complexity
- **Tech Stack** — custodian, performance, financial planning, CRM, additional (merged from pinned note + teams record)
- **Complexity Scoring** — existing panel with tier, score, factor breakdown

### Tab 5: Team & Contacts
- **Team Assignments** — AXM/AXA/CTM/CTA dropdowns with AI recommendations (existing)
- **Associated Contacts** — other contacts linked to this deal from HubSpot

## Implementation Steps

1. **Update API route** (`/api/command-center/advisor/[id]/route.ts`)
   - Add `fetchAssociatedContact()` — get contact from deal association, fetch properties + pinned note
   - Add `fetchEngagements()` — get last 20 engagements for the contact
   - Return contact, pinnedNote, engagements in response

2. **Create AI parse endpoint** (`/api/command-center/advisor/parse-note/route.ts`)
   - POST with raw note body
   - Send to Grok with extraction prompt + JSON schema
   - Return structured JSON
   - Cache result (same note = same parse)

3. **Rebuild profile page** (`/app/command-center/advisor/[id]/page.tsx`)
   - Add tab state and tab bar
   - Build 5 tab content components
   - Client-side: call parse-note API after pinned note loads
   - Merge AI-extracted data with deal/teams/contact data
   - Render all sections with merged data
   - "View Raw Note" toggle for full pinned note text

4. **Test with Bud Green** (deal/contact ID from HubSpot)
   - Verify all fields parse correctly from his pinned note
   - Check data merge between pinned note and deal/teams record

5. **Push to GitHub**
