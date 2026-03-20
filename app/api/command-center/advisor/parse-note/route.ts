import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const EXTRACTION_PROMPT = `You are a data extraction assistant for Farther Wealth Management's advisor recruiting pipeline.
You will be given the text of a recruiter's pinned note about a financial advisor candidate.
Extract ALL available data into the JSON schema below.

Rules:
- Return ONLY valid JSON, no markdown, no explanation.
- For numeric fields (AUM, revenue, income, expenses), return the raw number (e.g. 210000000 not "$210M"). Parse "$1.4M" as 1400000, "$210M" as 210000000, "$8,000,000" as 8000000.
- For percentage fields, return as a number (e.g. 65 for "65 bps", 100 for "100%").
- For boolean fields, return true/false.
- If a field is not mentioned in the note, return null for that field.
- For arrays, return an empty array [] if no data found.
- Preserve the original text for notes/details fields.
- "LOE" means Length of Experience (total years in industry). "LOS" means Length of Service (years at current firm).

JSON Schema:
{
  "candidate_profile": {
    "name": "string or null",
    "candidate_type": "string or null (Owner, RIA Employee, Wirehouse, etc.)",
    "lead_source": "string or null",
    "location": "string or null",
    "current_firm": "string or null",
    "title": "string or null",
    "website": "string or null",
    "licenses": ["string array of license numbers/types"],
    "designations": ["string array - CFP, CFA, ChFC, etc."],
    "disclosures": "string or null",
    "crd_number": "string or null",
    "loe_years": "number or null (Length of Experience)",
    "los_years": "number or null (Length of Service at current firm)",
    "linkedin_url": "string or null",
    "previous_experience": [{"firm": "string", "role": "string", "years": "number or null", "notes": "string or null"}]
  },
  "team_members": [
    {"name": "string", "title": "string or null", "licenses": "string or null", "compensation": "string or null", "notes": "string or null", "staying": "boolean or null"}
  ],
  "motives": {
    "pain_points": ["string array"],
    "top_care_abouts": ["string array"],
    "goals": ["string array"]
  },
  "book_analysis": {
    "total_aum": "number or null",
    "aum_notes": "string or null",
    "t12_revenue": "number or null",
    "avg_fee_bps": "number or null",
    "households": "number or null",
    "accounts": "number or null",
    "avg_hh_size": "number or null",
    "largest_client": "number or null",
    "investment_products": "string or null",
    "alt_assets_pct": "number or null",
    "insurance_annuity": "string or null",
    "insurance_annuity_provider": "string or null",
    "n401k_aum_revenue": "string or null",
    "n401k_provider": "string or null",
    "n529s": "string or null",
    "bd_revenue": "string or null",
    "margin_requirements": "string or null",
    "loc_lending": "string or null",
    "options_derivatives": "string or null",
    "organically_grown_pct": "number or null",
    "acquired_inherited_pct": "number or null",
    "go_to_market": "string or null",
    "annual_productivity": "string or null",
    "unique_book_notes": "string or null",
    "obas": "string or null"
  },
  "financials": {
    "employment_type": "string or null (1099, W2, etc.)",
    "contract_restrictions": "string or null",
    "payout_rate": "string or null",
    "annualized_income": "number or null",
    "income_notes": "string or null",
    "annualized_expenses": "number or null",
    "expense_details": ["string array - itemized expenses"],
    "office_expense": "number or null",
    "marketing_spend": "number or null",
    "expense_notes": "string or null",
    "debt": "string or null",
    "competing_firms": ["string array"],
    "competing_offers": ["string array"]
  },
  "portability": {
    "owns_master_code": "boolean or null",
    "transition_type": "string or null (Master Merge, LPOA, ACAT, etc.)",
    "previous_transitions": "boolean or null",
    "previous_transition_notes": "string or null",
    "transferable_pct": "number or null",
    "transferable_aum": "number or null",
    "transferable_revenue": "number or null",
    "transferable_households": "number or null",
    "transitioning_401k": "string or null",
    "billing_cycle": "string or null",
    "unbilled_clients": "string or null",
    "transition_notes": "string or null"
  },
  "tech_stack": {
    "custodian": "string or null",
    "performance_platform": "string or null",
    "financial_planning_platform": "string or null",
    "crm_platform": "string or null",
    "additional_tech": "string or null"
  },
  "deal_structure_notes": "string or null (full text of deal structure section)",
  "personal": {
    "married": "string or null",
    "kids": "string or null",
    "notes": ["string array"]
  },
  "sales_process": {
    "intro_call_notes": "string or null",
    "first_meeting_notes": "string or null",
    "first_meeting_date": "string or null",
    "financial_model_notes": "string or null",
    "discovery_day_date": "string or null",
    "discovery_day_bio": "string or null",
    "travel_details": "string or null",
    "offer_notes": "string or null",
    "next_steps": [{"step": "string", "date": "string or null"}]
  },
  "timeline_notes": "string or null",
  "close_date": "string or null",
  "start_date": "string or null"
}`;

export async function POST(req: NextRequest) {
  try {
    const { noteBody } = await req.json();

    if (!noteBody || typeof noteBody !== 'string') {
      return NextResponse.json({ error: 'noteBody is required' }, { status: 400 });
    }

    // Strip HTML tags from the note body
    const cleanText = noteBody
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/li>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#\d+;/g, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (!cleanText) {
      return NextResponse.json({ error: 'Note body is empty after cleaning' }, { status: 400 });
    }

    const xai = new OpenAI({
      apiKey: process.env.GROK_API_KEY!,
      baseURL: 'https://api.x.ai/v1',
    });

    const completion = await xai.chat.completions.create({
      model: 'grok-3-latest',
      messages: [
        { role: 'system', content: EXTRACTION_PROMPT },
        { role: 'user', content: `Extract all data from this recruiter pinned note:\n\n${cleanText}` },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    });

    const raw = completion.choices[0]?.message?.content ?? '';

    // Parse the JSON response — handle potential markdown wrapping
    let parsed;
    try {
      const jsonStr = raw.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch {
      console.error('[parse-note] Failed to parse AI response as JSON:', raw.slice(0, 500));
      return NextResponse.json({
        error: 'AI returned invalid JSON',
        rawResponse: raw.slice(0, 2000),
      }, { status: 500 });
    }

    return NextResponse.json({ extracted: parsed, rawNoteText: cleanText });
  } catch (err) {
    console.error('[parse-note]', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export const dynamic = 'force-dynamic';
