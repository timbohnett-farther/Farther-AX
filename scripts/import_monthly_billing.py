#!/usr/bin/env python3
"""
Import monthly Master Billing CSVs into Railway Postgres monthly_billing table.

Usage:
    python3 scripts/import_monthly_billing.py

Reads 15 monthly CSVs (Jan 2025 – Mar 2026) from /Users/tim.bohnett/Billing Data/
and loads them into the monthly_billing table with ON CONFLICT DO NOTHING deduplication.
"""

import csv
import os
import re
import calendar
import psycopg2
from psycopg2.extras import execute_batch

DB_URL = "postgresql://postgres:CbLLeVMxTvHdYeubLnEViiKmcQhgRUIT@ballast.proxy.rlwy.net:26605/railway"

# Map CSV files to billing period dates
FILES = [
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - January.csv",   2025, 1),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - February.csv",  2025, 2),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - March.csv",     2025, 3),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - April.csv",     2025, 4),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - May.csv",       2025, 5),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - June.csv",      2025, 6),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - July.csv",      2025, 7),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - August.csv",    2025, 8),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - September.csv", 2025, 9),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - October.csv",   2025, 10),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - Nov.csv",       2025, 11),
    ("/Users/tim.bohnett/Billing Data/2025/2025 Master Billing Data - Dec.csv",       2025, 12),
    ("/Users/tim.bohnett/Billing Data/2026/2026 Master Billing Data -Jan.csv",        2026, 1),
    ("/Users/tim.bohnett/Billing Data/2026/2026 Master Billing Data - Feb.csv",       2026, 2),
    ("/Users/tim.bohnett/Billing Data/2026/2026 Master Billing Data - Mar.csv",       2026, 3),
]

# CSV header → DB column mapping
HEADER_MAP = {
    "Team": "team",
    "Relationship": "relationship",
    "Account Name": "account_name",
    "Account Number": "account_number",
    "Account Value": "account_value",
    "Billed Value": "billed_value",
    "Rate Value": "rate_value",
    "Fee Schedule Name": "fee_schedule",
    "Rate (bps)": "rate_bps",
    "Fee or Rebate Amount": "fee_or_rebate",
    "Total Period Fee": "total_period_fee",
    "Cash Available": "cash_available",
    "Cash Difference": "cash_difference",
    "Breakpoint Portfolio Name": "breakpoint_portfolio",
    "Billing Account Number": "billing_acct_number",
    "Billing Account Name": "billing_acct_name",
    "Custodian": "custodian",
    "Billing Account Custodian": "billing_acct_custodian",
    "Billing Start Date": "billing_start_date",
    "Fee/Rebate Change (%)": "fee_rebate_change_pct",
    "Last Fee/Rebate Amount": "last_fee_rebate",
    "Workflow": "workflow",
    "Assignment Notes": "assignment_notes",
    "Warnings": "warnings",
    "Billable Status": "billable_status",
    "Rep Code": "rep_code",
    "Rep Fee Split Name": "rep_fee_split",
    "Billing Configuration Name": "billing_config",
}

NUMERIC_COLS = {
    "account_value", "billed_value", "rate_value", "rate_bps",
    "fee_or_rebate", "total_period_fee", "cash_available", "cash_difference",
    "fee_rebate_change_pct", "last_fee_rebate",
}

INSERT_SQL = """
INSERT INTO monthly_billing (
    billing_period, team, relationship, account_name, account_number,
    account_value, billed_value, rate_value, fee_schedule, rate_bps,
    fee_or_rebate, total_period_fee, cash_available, cash_difference,
    breakpoint_portfolio, billing_acct_number, billing_acct_name,
    custodian, billing_acct_custodian, billing_start_date,
    fee_rebate_change_pct, last_fee_rebate, workflow, assignment_notes,
    warnings, billable_status, rep_code, rep_fee_split, billing_config
) VALUES (
    %(billing_period)s, %(team)s, %(relationship)s, %(account_name)s, %(account_number)s,
    %(account_value)s, %(billed_value)s, %(rate_value)s, %(fee_schedule)s, %(rate_bps)s,
    %(fee_or_rebate)s, %(total_period_fee)s, %(cash_available)s, %(cash_difference)s,
    %(breakpoint_portfolio)s, %(billing_acct_number)s, %(billing_acct_name)s,
    %(custodian)s, %(billing_acct_custodian)s, %(billing_start_date)s,
    %(fee_rebate_change_pct)s, %(last_fee_rebate)s, %(workflow)s, %(assignment_notes)s,
    %(warnings)s, %(billable_status)s, %(rep_code)s, %(rep_fee_split)s, %(billing_config)s
)
ON CONFLICT (billing_period, account_number, fee_schedule) DO NOTHING
"""


def clean_currency(val):
    """Strip $, commas, parentheses (negative), %, and whitespace from currency/numeric strings."""
    if not val or not val.strip():
        return None
    s = val.strip()
    # Handle parenthesized negatives like ($199.30)
    negative = False
    if s.startswith("(") and s.endswith(")"):
        negative = True
        s = s[1:-1]
    s = s.replace("$", "").replace(",", "").replace("%", "").strip()
    if not s:
        return None
    try:
        n = float(s)
        return -n if negative else n
    except ValueError:
        return None


def last_day(year, month):
    """Return the last day of the month as a date string YYYY-MM-DD."""
    _, day = calendar.monthrange(year, month)
    return f"{year}-{month:02d}-{day:02d}"


def process_file(filepath, year, month, conn):
    """Read one CSV and insert rows into monthly_billing."""
    billing_period = last_day(year, month)
    rows = []

    with open(filepath, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for raw_row in reader:
            row = {"billing_period": billing_period}
            for csv_header, db_col in HEADER_MAP.items():
                val = raw_row.get(csv_header, "")
                if val is None:
                    val = ""
                val = val.strip()

                if db_col in NUMERIC_COLS:
                    row[db_col] = clean_currency(val)
                else:
                    row[db_col] = val if val else None

            # Skip rows with no account number (empty/header rows)
            if not row.get("account_number"):
                continue

            rows.append(row)

    with conn.cursor() as cur:
        execute_batch(cur, INSERT_SQL, rows, page_size=1000)
    conn.commit()

    return len(rows)


def main():
    conn = psycopg2.connect(DB_URL)
    total = 0

    print(f"{'File':<65} {'Rows':>8}")
    print("-" * 75)

    for filepath, year, month in FILES:
        if not os.path.exists(filepath):
            print(f"  MISSING: {filepath}")
            continue

        count = process_file(filepath, year, month, conn)
        fname = os.path.basename(filepath)
        print(f"  {fname:<63} {count:>8,}")
        total += count

    print("-" * 75)
    print(f"  {'TOTAL':<63} {total:>8,}")

    # Verification summary
    print("\n--- Verification: Rows by billing_period ---")
    with conn.cursor() as cur:
        cur.execute("""
            SELECT billing_period, COUNT(*) as rows,
                   SUM(total_period_fee) as total_fees,
                   COUNT(DISTINCT team) as teams,
                   COUNT(DISTINCT account_number) as accounts
            FROM monthly_billing
            GROUP BY billing_period
            ORDER BY billing_period
        """)
        print(f"{'Period':<14} {'Rows':>8} {'Total Fees':>16} {'Teams':>6} {'Accounts':>10}")
        print("-" * 58)
        for row in cur.fetchall():
            period = row[0].strftime("%Y-%m-%d") if row[0] else "NULL"
            fees = f"${row[2]:,.2f}" if row[2] else "$0.00"
            print(f"  {period:<12} {row[1]:>8,} {fees:>16} {row[3]:>6} {row[4]:>10,}")

    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
