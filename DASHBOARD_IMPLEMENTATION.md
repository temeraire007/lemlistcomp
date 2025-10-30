# Dashboard Database Integration

## ✅ **Implementation Complete**

The campaign dashboard now pulls real data from the database instead of using mock data.

---

## 📊 **How It Works**

### **Data Sources:**

1. **Stats** - Calculated from `leads` table statuses
2. **Activities** - Fetched from `email_messages` table

### **Stats Calculation Logic:**

The dashboard displays 5 key metrics, all calculated from the `leads.status` field:

| Metric | Calculation | Lead Statuses Included |
|--------|-------------|----------------------|
| **Sent** | Emails sent to leads | `'sent'`, `'opened'`, `'replied'` |
| **Opened** | Emails opened by leads | `'opened'`, `'replied'` |
| **Answered** | Leads that replied | `'replied'` |
| **Scheduled** | Emails queued to send | `'scheduled'` |
| **Unscheduled** | Leads not yet contacted | `'lead'` |

**Note:** Leads with status `'won'` or `'lost'` are not included in these stats (they're considered closed).

### **Activities Logic:**

Recent activities are fetched from the `email_messages` table:

- **Sent** - `direction = 'outbound'`
- **Answered** - `direction = 'inbound'`
- Shows the 10 most recent messages
- Displays relative timestamps (e.g., "2 minutes ago")

---

## 📁 **Files Created**

### **1. API Routes**

#### `/app/api/campaigns/[id]/stats/route.ts`
- **Endpoint:** `GET /api/campaigns/[id]/stats`
- **Purpose:** Calculate and return campaign statistics
- **Process:**
  1. Authenticates user with Clerk
  2. Fetches all leads for the campaign
  3. Counts leads by status
  4. Returns stats object

**Example Response:**
```json
{
  "campaign": {
    "id": "campaign-uuid",
    "name": "Product Launch"
  },
  "stats": {
    "sent": 180,
    "opened": 85,
    "answered": 23,
    "scheduled": 50,
    "unscheduled": 20
  }
}
```

#### `/app/api/campaigns/[id]/activities/route.ts`
- **Endpoint:** `GET /api/campaigns/[id]/activities`
- **Purpose:** Fetch recent email activities
- **Process:**
  1. Authenticates user with Clerk
  2. Joins `email_messages` with `leads` table
  3. Filters by campaign ID
  4. Returns 10 most recent activities with relative timestamps

**Example Response:**
```json
{
  "activities": [
    {
      "id": "message-uuid",
      "type": "sent",
      "email": "john@example.com",
      "timestamp": "2 minutes ago"
    },
    {
      "id": "message-uuid-2",
      "type": "answered",
      "email": "jane@example.com",
      "timestamp": "15 minutes ago"
    }
  ]
}
```

### **2. Updated Dashboard Page**

#### `/app/campaigns/[id]/page.tsx`
- **Changes:**
  - Removed mock data
  - Added `getCampaignStats()` and `getCampaignActivities()` functions
  - Server-side data fetching on page load
  - Fallback to empty data if fetch fails
  - Type-safe interfaces for data

---

## ⚠️ **Missing Data Points**

### **Current Limitation: Email "Opened" Tracking**

The `email_messages` table **does not currently track when emails are opened**. It only has:
- ✅ `sent_at` - When email was sent
- ✅ `direction` - Outbound/inbound
- ❌ **Missing:** `opened_at` field

### **Impact:**

1. **Activities Feed:** Cannot show "Email opened" activities
   - Currently shows: Sent + Answered
   - Missing: Opened events

2. **Stats Still Work:** The "Opened" stat comes from `leads.status = 'opened'`, not from tracking actual email opens

### **How to Track Opens (Future Enhancement):**

To properly track email opens, you would need to:

1. **Add tracking pixel** to outbound emails
2. **Create webhook endpoint** to receive open events
3. **Update lead status** from `'sent'` → `'opened'` when pixel loads
4. **Optional:** Store in `email_messages` table by adding:
   ```sql
   ALTER TABLE email_messages
   ADD COLUMN opened_at TIMESTAMP WITH TIME ZONE,
   ADD COLUMN open_count INTEGER DEFAULT 0;
   ```

---

## 🚀 **Testing the Dashboard**

### **Step 1: Ensure Migrations Are Applied**

Make sure all migrations are run in Supabase:
```sql
-- Should already be done:
-- ✅ 001_initial_schema.sql (users table)
-- ✅ 002_fix_user_insert_policy.sql (RLS fixes)
-- ✅ 003_create_campaigns_table.sql
-- ✅ 006_create_leads_table.sql
```

### **Step 2: Add Test Data**

To see the dashboard work, you need some data:

1. **Create a campaign** (via `/campaigns` page)
2. **Add leads** to the campaign (via `/campaigns/[id]/leads`)
3. **Update lead statuses** manually in Supabase SQL Editor:
   ```sql
   -- Example: Mark some leads as sent
   UPDATE leads 
   SET status = 'sent' 
   WHERE campaign_id = 'your-campaign-id'
   LIMIT 5;
   
   -- Example: Mark some as opened
   UPDATE leads 
   SET status = 'opened' 
   WHERE campaign_id = 'your-campaign-id'
   LIMIT 3;
   
   -- Example: Mark one as replied
   UPDATE leads 
   SET status = 'replied' 
   WHERE campaign_id = 'your-campaign-id'
   LIMIT 1;
   ```

4. **Add email messages** (for activities feed):
   ```sql
   -- Example: Add an outbound email
   INSERT INTO email_messages (
     lead_id, 
     user_id, 
     direction, 
     subject, 
     text_body, 
     sent_at
   )
   VALUES (
     'lead-id',
     'your-user-id',
     'outbound',
     'Test Email',
     'Hello!',
     NOW()
   );
   ```

### **Step 3: View Dashboard**

Navigate to `/campaigns/[your-campaign-id]` and you should see:
- ✅ Real stats from your leads
- ✅ Real activities from email_messages
- ✅ Proper timestamps

---

## 🔧 **Environment Variables**

The dashboard uses `process.env.NEXT_PUBLIC_APP_URL` for API calls. Add to `.env.local`:

```env
# For local development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# For production
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

If not set, it defaults to `http://localhost:3000`.

---

## 📈 **Performance Notes**

- **Server-side rendering:** Data is fetched on the server, not in the browser
- **No caching:** Uses `cache: 'no-store'` to always show fresh data
- **Two API calls:** Stats and activities are fetched separately for modularity
- **Joins optimized:** Activities query uses inner join for performance

---

## 🎯 **Next Steps**

To complete the email tracking system:

1. ✅ **Stats** - Working (from leads table)
2. ✅ **Sent activities** - Working (from email_messages)
3. ✅ **Replied activities** - Working (from email_messages)
4. ⚠️ **Opened tracking** - Needs implementation:
   - Add email tracking pixel
   - Create webhook for open events
   - Update lead status on open
5. 🔜 **Email sending** - Not yet implemented:
   - Integration with email provider (SendGrid, etc.)
   - Queue system for scheduled emails
   - Update lead statuses when emails are sent
6. 🔜 **Real-time updates** - Not yet implemented:
   - WebSocket or polling for live dashboard updates
   - Notification system for new replies

---

## 📝 **Summary**

✅ **Implemented:**
- Dashboard now uses real database data
- Stats calculated from lead statuses
- Activities fetched from email messages
- Type-safe API routes
- Server-side rendering with fallbacks

⚠️ **Known Limitations:**
- Email opens not tracked (only status-based)
- No "opened" activities in feed
- Manual status updates required (no auto-send yet)

🚀 **Ready to use** for campaigns with manually managed lead statuses!

