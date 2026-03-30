# DocuSign Webhook Setup Guide

Complete guide for configuring DocuSign Connect webhooks for real-time envelope updates.

---

## Why Webhooks?

| Metric | Polling (Current) | Webhooks (After Setup) |
|--------|-------------------|------------------------|
| **API calls per update** | 1-N (fetch all) | 0 (push-based) |
| **Update latency** | Manual sync only | Real-time (<30s) |
| **Rate limit risk** | High | Near zero |
| **Data freshness** | Stale until sync | Always current |
| **Server load** | High (repeated polling) | Low (event-driven) |

---

## Prerequisites

1. ✅ DocuSign admin access
2. ✅ Production/demo environment with public URL
3. ✅ Database migration completed (`npm run migrate:docusign`)
4. ✅ Environment variables configured

---

## Step 1: Configure Environment Variables

Add to `.env.local` (local) or Railway (production):

```bash
# Existing DocuSign vars (already configured)
DOCUSIGN_INTEGRATION_KEY=your_integration_key
DOCUSIGN_SECRET_KEY=your_secret_key
DOCUSIGN_API_ACCOUNT_ID=your_account_id
DOCUSIGN_BASE_URI=https://demo.docusign.net  # or https://www.docusign.net for prod

# NEW: Webhook HMAC secret (generate a strong random string)
DOCUSIGN_HMAC_SECRET=your_secure_random_string_50_chars_max
```

**Generate HMAC Secret:**
```bash
# Option 1: OpenSSL
openssl rand -base64 32

# Option 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Option 3: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

---

## Step 2: Run Database Migration

```bash
# Local
npx tsx scripts/migrate-docusign.ts

# Verify tables created
psql $DATABASE_URL -c "\dt docusign*"
```

**Expected output:**
```
docusign_envelopes
docusign_signers
docusign_sync_snapshots
docusign_change_log
docusign_webhook_events    ← NEW
docusign_sync_state        ← NEW
```

---

## Step 3: Configure DocuSign Connect

### A. Access Connect Settings

1. Log in to DocuSign (demo.docusign.net or docusign.com)
2. Go to **Settings** → **Connect** → **Add Configuration**

### B. Basic Configuration

| Field | Value |
|-------|-------|
| **Name** | `Farther AX Webhook` |
| **URL** | `https://your-domain.com/api/webhooks/docusign` |
| **Environment** | Select your account environment |

**Railway URL:**
```
https://<your-railway-app>.up.railway.app/api/webhooks/docusign
```

### C. Webhook Events

Select the following events (checkboxes):

- ✅ **Envelope Sent** (`envelope-sent`)
- ✅ **Envelope Delivered** (`envelope-delivered`)
- ✅ **Envelope Completed** (`envelope-completed`)
- ✅ **Envelope Declined** (`envelope-declined`)
- ✅ **Envelope Voided** (`envelope-voided`)
- ❌ **Recipient Completed** (optional — more granular, but noisy)

### D. Security Settings

**CRITICAL: Enable HMAC Signature**

1. Check **"Include HMAC Signature"**
2. **HMAC Key 1:** Paste your `DOCUSIGN_HMAC_SECRET` value
3. **Algorithm:** SHA256 (default)
4. **Encoding:** Base64 (default)

### E. Additional Settings

| Setting | Value | Notes |
|---------|-------|-------|
| **Enable logging** | ✅ Yes | For debugging |
| **Include envelope documents** | ❌ No | Reduces payload size |
| **Include certificate of completion** | ❌ No | Not needed |
| **Require acknowledgment** | ✅ Yes | Ensures webhook was received |
| **Retry on failure** | ✅ Yes | Auto-retry on 5xx errors |
| **Max retries** | 3 | Reasonable default |

### F. Save Configuration

Click **Save** — DocuSign will send a test event to verify the endpoint.

---

## Step 4: Verify Webhook Connection

### A. Check Webhook Health

```bash
# Send test envelope (via DocuSign UI or API)
# Then check logs:

# Railway
railway logs

# Local
npm run dev
# (watch console for webhook events)
```

**Expected log output:**
```
[docusign/webhook] Received envelope-sent for envelope abc123 (status: sent)
✓ Updated transition_clients with envelope status
```

### B. Check Database

```bash
# Verify webhook events are being logged
psql $DATABASE_URL -c "SELECT * FROM docusign_webhook_events ORDER BY received_at DESC LIMIT 5;"
```

**Expected output:**
```
 id | event_type     | envelope_id | status | received_at
----+----------------+-------------+--------+---------------------
  1 | envelope-sent  | abc123      | sent   | 2026-03-30 10:15:00
```

### C. Test HMAC Verification

**Simulate invalid signature (should fail):**
```bash
curl -X POST https://your-domain.com/api/webhooks/docusign \
  -H "Content-Type: application/json" \
  -H "X-DocuSign-Signature-1: invalid_signature" \
  -d '{"event":"envelope-sent","data":{"envelopeId":"test"}}'
```

**Expected response:** `401 Unauthorized - Invalid signature`

---

## Step 5: Update Sync Route (Optional)

Now that webhooks are enabled, you can reduce polling frequency or disable manual sync entirely.

### Option A: Reduce Polling Frequency

Keep manual sync as backup, but reduce frequency:

```typescript
// app/api/command-center/transitions/docusign/route.ts

// Change fromDays from 180 → 30 (only fetch recent envelopes as backup)
const envelopes = await fetchAllEnvelopes(accessToken, 30);
```

### Option B: Webhook-Only Mode

Disable manual sync entirely (webhooks handle all updates):

```typescript
// app/command-center/transitions/page.tsx

// Remove or disable "Sync DocuSign" button
// Webhooks handle updates automatically
```

---

## Troubleshooting

### Issue: Webhook not receiving events

**Check:**
1. ✅ Webhook URL is publicly accessible (not localhost)
2. ✅ Connect configuration is **Active** (not disabled)
3. ✅ Events are selected in Connect config
4. ✅ Railway/production app is running

**Test endpoint manually:**
```bash
curl https://your-domain.com/api/webhooks/docusign
# Should return 405 Method Not Allowed (GET not supported)
```

### Issue: "Invalid HMAC signature" errors

**Check:**
1. ✅ `DOCUSIGN_HMAC_SECRET` env var matches Connect config HMAC Key 1
2. ✅ No extra spaces/newlines in secret (copy-paste issue)
3. ✅ Railway env vars reloaded (redeploy after changing)

**Debug:**
```typescript
// Temporarily add to webhook route.ts (REMOVE AFTER DEBUGGING)
console.log('Raw signature:', signature);
console.log('Expected secret:', process.env.DOCUSIGN_HMAC_SECRET);
```

### Issue: Envelopes not updating in database

**Check:**
1. ✅ `transition_clients` has matching `primary_email` for signers
2. ✅ Email addresses are lowercase in database
3. ✅ Database queries are running (check Railway logs)

**Debug:**
```sql
-- Check if signers match any clients
SELECT primary_email FROM transition_clients
WHERE LOWER(primary_email) IN ('signer1@example.com', 'signer2@example.com');
```

### Issue: DocuSign retrying webhook repeatedly

**Cause:** Webhook returning non-200 status code

**Fix:** Webhook MUST return 200 even on internal errors:
```typescript
// Current implementation (CORRECT):
return NextResponse.json({ received: true });  // 200 OK

// WRONG:
throw new Error('...');  // 500 error → DocuSign will retry forever
```

---

## Monitoring & Maintenance

### A. Monitor Webhook Health

```bash
# Check recent webhook events
psql $DATABASE_URL -c "
  SELECT event_type, COUNT(*), MAX(received_at) as last_received
  FROM docusign_webhook_events
  WHERE received_at > NOW() - INTERVAL '24 hours'
  GROUP BY event_type
  ORDER BY last_received DESC;
"
```

**Expected output:**
```
 event_type        | count | last_received
-------------------+-------+---------------------
 envelope-completed |  15   | 2026-03-30 14:30:00
 envelope-sent      |  42   | 2026-03-30 14:25:00
```

### B. Check for Missing Updates

```bash
# Envelopes with no webhook events (possible missed webhooks)
psql $DATABASE_URL -c "
  SELECT envelope_id, email_subject, sent_date_time
  FROM docusign_envelopes
  WHERE envelope_id NOT IN (
    SELECT DISTINCT envelope_id FROM docusign_webhook_events
  )
  AND sent_date_time > NOW() - INTERVAL '7 days'
  LIMIT 10;
"
```

### C. Cleanup Old Webhook Logs (Optional)

```bash
# Delete webhook events older than 90 days (keep audit trail slim)
psql $DATABASE_URL -c "
  DELETE FROM docusign_webhook_events
  WHERE received_at < NOW() - INTERVAL '90 days';
"
```

---

## Security Best Practices

1. ✅ **Always verify HMAC signature** — Never process unsigned webhooks
2. ✅ **Use HTTPS only** — DocuSign requires SSL/TLS for webhooks
3. ✅ **Rotate HMAC secret periodically** — Update both DocuSign Connect config and env var
4. ✅ **Log webhook events** — Maintain audit trail for compliance
5. ✅ **Rate limit webhook endpoint** — Prevent abuse (though DocuSign already rate-limits)
6. ✅ **Validate payload structure** — Check required fields before processing

---

## Performance Impact

### Before Webhooks (Polling)

```
User clicks "Sync DocuSign"
  → Fetch 180 days of envelopes (1-10 API calls)
  → Process all envelopes (100-500 envelopes)
  → Update database (100-500 queries)
  → Duration: 5-15 seconds
  → API calls per sync: 10-50
```

### After Webhooks (Push-Based)

```
DocuSign envelope status changes
  → Webhook sent to endpoint (<1s)
  → HMAC verified + single envelope processed
  → Database updated (1 query)
  → Duration: <100ms
  → API calls: 0
```

**Result:** 99% reduction in API calls, real-time updates, zero manual intervention.

---

## Next Steps

After webhook setup is complete:

1. **Monitor for 24 hours** — Verify events are being received
2. **Remove polling** — Disable manual "Sync DocuSign" button
3. **Add alerting** — Monitor for webhook failures (Railway logs → Sentry/etc.)
4. **Document for team** — Share webhook URL and HMAC secret with ops team

---

## FAQ

**Q: Can I use webhooks in demo environment?**
A: Yes! DocuSign demo (account-d.docusign.com) supports webhooks.

**Q: What happens if my server is down?**
A: DocuSign will retry up to 3 times with exponential backoff (configurable). After that, events are lost. Always monitor uptime.

**Q: Can I test webhooks locally (localhost)?**
A: No, DocuSign requires a public URL. Use ngrok or deploy to Railway for testing.

**Q: How do I rotate the HMAC secret?**
A:
1. Generate new secret
2. Update Railway env var `DOCUSIGN_HMAC_SECRET`
3. Update DocuSign Connect config HMAC Key 1
4. Redeploy app
5. Test with new secret

**Q: Are webhooks included in DocuSign API rate limits?**
A: No! Webhooks are **push-based** and don't count against your API rate limits.

---

## Support

- **DocuSign Connect Docs:** https://developers.docusign.com/platform/webhooks/connect/
- **HMAC Verification:** https://developers.docusign.com/platform/webhooks/connect/hmac/
- **Railway Logs:** `railway logs --tail`
- **Internal:** Check `app/api/webhooks/docusign/route.ts` implementation

---

**Webhook setup complete!** 🎉 Real-time envelope updates are now enabled.
