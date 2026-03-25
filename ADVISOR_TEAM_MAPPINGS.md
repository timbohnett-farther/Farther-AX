# Advisor Team Mappings - Implementation Guide

## 📋 **Problem Solved**

**Scenario:**
- In HubSpot: "Golden Wealth Management" (team with 4 advisors)
- Transition Sheet Column B: Individual names ("John Smith", "Jane Doe", "Mike Johnson", "Sarah Williams")
- **Old Behavior**: 4 separate entries in dashboard
- **New Behavior**: All consolidated under "Golden Wealth Management"

---

## 🏗️ **Architecture**

### **Database Table: `advisor_team_mappings`**

```sql
CREATE TABLE advisor_team_mappings (
  id SERIAL PRIMARY KEY,
  individual_name VARCHAR(255) NOT NULL UNIQUE,
  team_name VARCHAR(255) NOT NULL,
  hubspot_contact_id VARCHAR(128),
  hubspot_deal_id VARCHAR(128),
  source VARCHAR(50) DEFAULT 'hubspot',  -- 'hubspot' or 'manual'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Indexes:**
- `individual_name` (fast lookup during sync)
- `team_name` (grouping queries)
- `hubspot_deal_id` (HubSpot integration)

---

## 🔄 **How It Works**

### **Step 1: Sync Team Mappings from HubSpot**

**API Endpoint:**
```
POST /api/command-center/transitions/team-mappings
```

**What it does:**
1. Fetches all deals from AX Pipeline (751770)
2. For each deal:
   - Deal Name = Team Name (e.g., "Golden Wealth Management")
   - Fetches all associated contacts
   - Maps each contact's name → team name
3. Upserts to `advisor_team_mappings` table

**Example Result:**
```
Individual Name       → Team Name
──────────────────────────────────────────────
John Smith            → Golden Wealth Management
Jane Doe              → Golden Wealth Management
Mike Johnson          → Golden Wealth Management
Sarah Williams        → Golden Wealth Management
Tom Anderson          → Anderson Financial Group
Lisa Anderson         → Anderson Financial Group
```

---

### **Step 2: Apply Mappings During Transition Sync**

**When:** Every time you sync Transition sheets

**Flow:**
1. Load team mappings from database (cached for 5 minutes)
2. Read Transition sheet Column B (Advisor Name)
3. Check if name exists in mappings table
4. If yes → replace with team name
5. If no → keep original name
6. Store mapped name in `transition_clients.advisor_name`

**Sync Result:**
```
✓ Synced 847 rows from 5 workbooks
  - 23 individual names mapped to team names
```

---

## 🚀 **Setup Instructions**

### **1. Run Database Migration**

```bash
cd C:\Users\tim\Projects\Farther-AX
npx tsx scripts/migrate-transitions.ts
```

This creates the `advisor_team_mappings` table.

---

### **2. Sync Team Mappings from HubSpot**

**Option A: Via API (Recommended)**

Use Postman or curl:
```bash
POST https://your-app.railway.app/api/command-center/transitions/team-mappings
Authorization: Bearer <your-session-token>
```

**Option B: Via Frontend (Add Button)**

Add a "Sync Team Mappings" button to the Transitions page:
```typescript
async function handleSyncTeamMappings() {
  const res = await fetch('/api/command-center/transitions/team-mappings', {
    method: 'POST',
  });
  const result = await res.json();
  console.log(result);
  // Show success message: "Synced 15 team mappings (10 new, 5 updated)"
}
```

---

### **3. Verify Mappings**

**Get current mappings:**
```bash
GET https://your-app.railway.app/api/command-center/transitions/team-mappings
```

**Response:**
```json
{
  "totalMappings": 15,
  "totalTeams": 3,
  "teams": {
    "Golden Wealth Management": [
      {
        "individualName": "John Smith",
        "hubspotContactId": "12345",
        "hubspotDealId": "67890",
        "source": "hubspot"
      },
      ...
    ],
    "Anderson Financial Group": [...]
  }
}
```

---

### **4. Sync Transition Sheets**

Now when you sync Transition sheets:
- Individual names will automatically map to team names
- Dashboard shows consolidated team data
- Sync result includes mapping count

---

## 🔧 **Manual Overrides**

### **Add Custom Mapping** (SQL)

```sql
INSERT INTO advisor_team_mappings (
  individual_name,
  team_name,
  source,
  notes
)
VALUES (
  'Special Advisor Name',
  'Custom Team Name',
  'manual',
  'Added for special case'
);
```

### **Update Mapping**

```sql
UPDATE advisor_team_mappings
SET team_name = 'New Team Name',
    updated_at = NOW()
WHERE individual_name = 'John Smith';
```

### **Delete Mapping**

```sql
DELETE FROM advisor_team_mappings
WHERE individual_name = 'John Smith';
```

---

## 📊 **Caching**

**In-Memory Cache:**
- Team mappings loaded once per sync session
- Cached for 5 minutes
- Automatically refreshes if stale

**Why?**
- Fast lookups during sync (no DB query per row)
- Reduced database load
- Still fresh enough for real-time updates

---

## 🔍 **Troubleshooting**

### **Problem: Individual names still appearing separately**

**Check:**
1. Are mappings synced?
   ```bash
   GET /api/command-center/transitions/team-mappings
   ```
2. Does the individual name exactly match?
   - Case sensitive: "John Smith" ≠ "john smith"
   - Whitespace matters: "John  Smith" ≠ "John Smith"
3. Has Transition sheet been re-synced after adding mappings?

---

### **Problem: Team name not found in HubSpot**

**Solution:**
- Ensure deal exists in AX Pipeline (751770)
- Check "Team & Contacts" → "Associated Contacts" in HubSpot
- Manually add mapping if needed (see Manual Overrides)

---

### **Problem: Mappings not updating**

**Clear cache and re-sync:**
```bash
# Re-sync team mappings from HubSpot
POST /api/command-center/transitions/team-mappings

# Re-sync Transition sheets
POST /api/command-center/transitions/sync
```

---

## 📝 **Maintenance**

### **Re-sync Team Mappings**

**When:**
- New team added to HubSpot
- Team members change
- Advisor moves to different team

**How:**
```bash
POST /api/command-center/transitions/team-mappings
```

**Frequency:**
- Manual: As needed
- Automated: Add cron job (optional)

---

### **Automated Sync (Optional)**

Add to Railway cron or add auto-sync logic:

```typescript
// In transitions page, check if mappings are stale
const lastMappingSync = await pool.query(
  'SELECT MAX(updated_at) FROM advisor_team_mappings'
);

const ageMs = Date.now() - new Date(lastMappingSync.rows[0].max).getTime();

if (ageMs > 7 * 24 * 60 * 60 * 1000) {  // 7 days
  fetch('/api/command-center/transitions/team-mappings', { method: 'POST' });
}
```

---

## 🎯 **API Reference**

### **GET /api/command-center/transitions/team-mappings**

**Returns:** Current team mappings grouped by team

**Response:**
```json
{
  "totalMappings": 15,
  "totalTeams": 3,
  "teams": { ... },
  "mappings": [ ... ]
}
```

---

### **POST /api/command-center/transitions/team-mappings**

**Syncs team mappings from HubSpot**

**Response:**
```json
{
  "success": true,
  "totalMappings": 15,
  "inserted": 10,
  "updated": 5,
  "message": "Synced 15 team mappings (10 new, 5 updated)"
}
```

---

## ✅ **Success Criteria**

After implementation, you should see:

1. ✅ `advisor_team_mappings` table created in database
2. ✅ Team mappings synced from HubSpot (15+ entries)
3. ✅ Transition sync shows "X names mapped to teams"
4. ✅ Dashboard displays consolidated team data
5. ✅ Individual advisors no longer appear separately

---

## 📚 **Related Files**

- **Migration:** `scripts/migrate-transitions.ts`
- **API Endpoint:** `app/api/command-center/transitions/team-mappings/route.ts`
- **Sync Logic:** `app/api/command-center/transitions/sync/route.ts`
- **Database Table:** `advisor_team_mappings`
