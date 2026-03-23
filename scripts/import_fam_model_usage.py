#!/usr/bin/env python3
"""
Import FAM (Client Implementation Plan Overview) CSV into Railway Postgres.

Usage:
    python3 scripts/import_fam_model_usage.py /path/to/file.csv

Accepts a tab-delimited, UTF-16LE encoded CSV exported from the Farther dashboard.
Only loads rows where account_state = 'Open'.
Truncates and reloads on each run for idempotency.
"""

import csv
import io
import sys
import psycopg2

DB_URL = "postgresql://postgres:CbLLeVMxTvHdYeubLnEViiKmcQhgRUIT@ballast.proxy.rlwy.net:26605/railway"

CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS fam_model_usage (
  id                   SERIAL PRIMARY KEY,
  custodian_account_id TEXT,
  account_state        TEXT,
  account_name         TEXT,
  custodian            TEXT,
  client_name          TEXT,
  advisor_name         TEXT,
  trading_status       TEXT,
  trade_alerts         INTEGER,
  plan_create_time     TEXT,
  plan_modify_time     TEXT,
  model_portfolio      TEXT,
  partial_shares       TEXT,
  tlh_status           TEXT,
  es_status            TEXT,
  bd_market_value      NUMERIC(18,2)
);
"""

CREATE_INDEXES = """
CREATE INDEX IF NOT EXISTS idx_fam_acct ON fam_model_usage(custodian_account_id);
CREATE INDEX IF NOT EXISTS idx_fam_advisor ON fam_model_usage(advisor_name);
CREATE INDEX IF NOT EXISTS idx_fam_state ON fam_model_usage(account_state);
"""

COPY_COLS = [
    "custodian_account_id", "account_state", "account_name", "custodian",
    "client_name", "advisor_name", "trading_status", "trade_alerts",
    "plan_create_time", "plan_modify_time", "model_portfolio",
    "partial_shares", "tlh_status", "es_status", "bd_market_value",
]

HEADER_MAP = {
    "Custodian Account Id": "custodian_account_id",
    "account_state": "account_state",
    "Account Name": "account_name",
    "Custodian": "custodian",
    "Client Name": "client_name",
    "Advisor Name": "advisor_name",
    "Trading Status": "trading_status",
    "Trade Alerts": "trade_alerts",
    "Minute of Concrete Plan Create Time": "plan_create_time",
    "Minute of Concrete Plan Modify Time": "plan_modify_time",
    "Model Portfolio": "model_portfolio",
    "Partial Shares Status": "partial_shares",
    "TLH Status": "tlh_status",
    "ES Status": "es_status",
    "BD Market Value": "bd_market_value",
}


def clean_numeric(val):
    if not val or not val.strip():
        return None
    s = val.strip().replace("$", "").replace(",", "").replace("%", "")
    if not s:
        return None
    try:
        return float(s)
    except ValueError:
        return None


def clean_int(val):
    if not val or not val.strip():
        return None
    try:
        return int(float(val.strip()))
    except ValueError:
        return None


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/import_fam_model_usage.py /path/to/file.csv")
        sys.exit(1)

    filepath = sys.argv[1]

    # Read UTF-16LE file
    with open(filepath, "rb") as f:
        raw = f.read()

    # Decode — try UTF-16 first, fall back to UTF-8
    try:
        text = raw.decode("utf-16")
    except UnicodeDecodeError:
        text = raw.decode("utf-8-sig")

    reader = csv.DictReader(io.StringIO(text), delimiter="\t")

    # Normalize headers (strip BOM and whitespace)
    clean_headers = {}
    for h in reader.fieldnames or []:
        cleaned = h.strip().lstrip("\ufeff")
        clean_headers[h] = cleaned

    rows = []
    skipped = 0
    for raw_row in reader:
        # Remap headers
        row = {}
        for orig_h, clean_h in clean_headers.items():
            row[clean_h] = raw_row.get(orig_h, "")

        state = (row.get("account_state") or "").strip()
        if state != "Open":
            skipped += 1
            continue

        mapped = {}
        for csv_h, db_col in HEADER_MAP.items():
            val = (row.get(csv_h) or "").strip()
            if db_col == "trade_alerts":
                mapped[db_col] = clean_int(val)
            elif db_col == "bd_market_value":
                mapped[db_col] = clean_numeric(val)
            else:
                mapped[db_col] = val if val else None
        rows.append(mapped)

    print(f"Parsed {len(rows)} Open rows ({skipped} non-Open skipped)")

    # Connect and load
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()

    # Create table
    cur.execute(CREATE_TABLE)
    conn.commit()

    # Truncate for clean reload
    cur.execute("TRUNCATE TABLE fam_model_usage RESTART IDENTITY")
    conn.commit()

    # Build CSV buffer for COPY
    buf = io.StringIO()
    writer = csv.writer(buf, delimiter="\t")
    for r in rows:
        writer.writerow([
            r.get("custodian_account_id") or "",
            r.get("account_state") or "",
            r.get("account_name") or "",
            r.get("custodian") or "",
            r.get("client_name") or "",
            r.get("advisor_name") or "",
            r.get("trading_status") or "",
            r.get("trade_alerts") if r.get("trade_alerts") is not None else "",
            r.get("plan_create_time") or "",
            r.get("plan_modify_time") or "",
            r.get("model_portfolio") or "",
            r.get("partial_shares") or "",
            r.get("tlh_status") or "",
            r.get("es_status") or "",
            r.get("bd_market_value") if r.get("bd_market_value") is not None else "",
        ])
    buf.seek(0)

    cols_str = ", ".join(COPY_COLS)
    cur.copy_expert(f"COPY fam_model_usage ({cols_str}) FROM STDIN WITH (FORMAT csv, DELIMITER E'\\t', NULL '')", buf)
    conn.commit()

    # Create indexes
    cur.execute(CREATE_INDEXES)
    conn.commit()

    # Verification
    cur.execute("SELECT COUNT(*) FROM fam_model_usage")
    total = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT advisor_name) FROM fam_model_usage")
    advisors = cur.fetchone()[0]
    cur.execute("SELECT COUNT(DISTINCT custodian_account_id) FROM fam_model_usage WHERE custodian_account_id IS NOT NULL AND custodian_account_id != ''")
    accounts = cur.fetchone()[0]
    cur.execute("SELECT COUNT(*) FROM fam_model_usage f INNER JOIN monthly_billing m ON f.custodian_account_id = m.account_number")
    joined = cur.fetchone()[0]

    print(f"\n--- Verification ---")
    print(f"  Total rows loaded:    {total:,}")
    print(f"  Distinct advisors:    {advisors:,}")
    print(f"  Distinct accounts:    {accounts:,}")
    print(f"  Joined to billing:    {joined:,}")

    cur.close()
    conn.close()
    print("\nDone.")


if __name__ == "__main__":
    main()
