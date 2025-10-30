# Campaign Settings Implementation Guide

This guide explains the new campaign settings feature that allows users to configure sending schedules and email accounts for campaigns.

---

## ✅ **What's Implemented**

### **1. Database Schema**
- Added new fields to `campaigns` table:
  - `email_account_id` - Links campaign to a specific email account
  - `send_frequency_minutes` - How often to send emails (10, 30, 60, 120, 180, 360 minutes)
  - `send_start_hour` - Start of sending window (0-23)
  - `send_end_hour` - End of sending window (0-23)
  - `timezone` - Timezone for sending window (default: UTC)
  - `days` - Array of weekdays to send emails (e.g., `['monday', 'tuesday', 'wednesday']`)

### **2. UI Components**
- **Settings Button**: Added to campaign dashboard navigation
- **Campaign Settings Page**: Full page with:
  - Email account selection (radio buttons with provider icons)
  - Send frequency options (10 min, 30 min, 1 hour, 2 hours, 3 hours, 6 hours)
  - Time window selection (start/end hour dropdowns)
  - Weekday selection (toggle buttons for each day)
  - Save/Cancel buttons with loading states

### **3. API Routes**
- `GET /api/campaigns/[id]/settings` - Fetch campaign settings
- `POST /api/campaigns/[id]/settings` - Update campaign settings

---

## 🚀 **Setup Instructions**

### **Step 1: Apply Database Migration**

Run this SQL in your Supabase SQL Editor:

```sql
-- Copy contents from: supabase/migrations/008_add_campaign_settings.sql
```

Or use the Supabase CLI:

```bash
cd lemlistcomp
supabase db push
```

### **Step 2: Verify Migration**

Check that the new columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'campaigns' 
  AND column_name IN (
    'email_account_id',
    'send_frequency_minutes',
    'send_start_hour',
    'send_end_hour',
    'timezone'
  );
```

You should see:
- `email_account_id` (uuid)
- `send_frequency_minutes` (integer)
- `send_start_hour` (integer)
- `send_end_hour` (integer)
- `timezone` (text)

### **Step 3: Test the Feature**

1. Start your app:
   ```bash
   npm run dev
   ```

2. Navigate to a campaign:
   ```
   http://localhost:3000/campaigns/[campaign-id]
   ```

3. Click the "Settings" button (blue button in top right)

4. Configure:
   - Select an email account (you need at least one connected from `/settings`)
   - Choose send frequency
   - Set time window (e.g., 9:00 AM - 5:00 PM)
   - Select active days (e.g., Monday-Friday)

5. Click "Save Settings"

6. Verify settings are saved by refreshing the page

---

## 📊 **Feature Overview**

### **Email Account Selection**

Users can select which connected email account to use for sending emails in this specific campaign. This allows:
- Different campaigns to use different email accounts
- Load balancing across multiple accounts
- Separating different types of outreach

**Requirements:**
- User must have at least one connected email account
- Link to `/settings` provided if no accounts connected
- Only active email accounts are shown

### **Send Frequency**

Controls how often emails are sent to leads. Options:
- **Every 10 minutes** - Aggressive sending
- **Every 30 minutes** - Fast sending
- **Every hour** - Standard sending (default)
- **Every 2 hours** - Moderate sending
- **Every 3 hours** - Slow sending
- **Every 6 hours** - Very slow sending

**Use Cases:**
- High urgency campaigns: 10-30 minutes
- Normal campaigns: 1 hour
- Warm/nurture campaigns: 2-6 hours

### **Sending Time Window**

Defines the hours of the day when emails can be sent:
- **Start Hour**: 0-23 (default: 9 = 9:00 AM)
- **End Hour**: 0-23 (default: 17 = 5:00 PM)

**Example:**
- Start: 9, End: 17 = Emails sent between 9:00 AM - 5:00 PM
- Start: 8, End: 20 = Emails sent between 8:00 AM - 8:00 PM

**Benefits:**
- Respect recipient time zones
- Send during business hours
- Avoid late night/early morning sends
- Better email engagement rates

### **Active Days**

Select which days of the week to send emails:
- Monday through Sunday
- Default: Monday-Friday (weekdays only)

**Use Cases:**
- B2B campaigns: Monday-Friday (business days)
- B2C campaigns: Include weekends
- Event-based: Select specific days

---

## 🔧 **How It Works**

### **Data Flow**

1. **User Opens Settings Page**
   - Fetches connected email accounts from `/api/email-accounts`
   - Fetches current campaign settings from `/api/campaigns/[id]/settings`
   - Displays current values or defaults

2. **User Modifies Settings**
   - Changes tracked in React state
   - Validation happens client-side
   - No API calls until "Save" is clicked

3. **User Saves Settings**
   - POST to `/api/campaigns/[id]/settings`
   - Server validates:
     - Email account exists and belongs to user
     - Frequency is positive
     - Time range is valid (0-23)
     - At least one day is selected
   - Updates `campaigns` table
   - Returns success/error message

4. **Settings Applied**
   - Settings stored in database
   - Future email sending respects these settings
   - User can update anytime

### **Default Values**

When a campaign is first created, these defaults are used:
- `send_frequency_minutes`: 60 (every hour)
- `send_start_hour`: 9 (9:00 AM)
- `send_end_hour`: 17 (5:00 PM)
- `days`: `['monday', 'tuesday', 'wednesday', 'thursday', 'friday']`
- `timezone`: 'UTC'
- `email_account_id`: null (must be set before sending)

---

## 🎨 **UI Design**

### **Navigation**

Campaign dashboard now has 4 buttons:
1. **Leads** (white) - View/manage leads
2. **Template** (white) - Edit email template
3. **Settings** (blue, active) - Configure sending

### **Settings Page Sections**

1. **Email Account** (white card)
   - Radio button list of connected accounts
   - Provider icon (G for Gmail, O for Outlook)
   - Email address display
   - "Connect Email Account" CTA if none connected

2. **Send Frequency** (white card)
   - 6 button options in grid layout
   - Selected option highlighted in blue
   - Clear labels (e.g., "Every hour")

3. **Sending Time Window** (white card)
   - Two dropdowns: Start Time, End Time
   - 24-hour format (00:00 - 23:00)
   - Side-by-side layout on desktop

4. **Active Days** (white card)
   - 7 toggle buttons (Monday-Sunday)
   - Responsive grid (7 columns on desktop, 4 on tablet, 2 on mobile)
   - Selected days highlighted in blue

5. **Actions** (bottom)
   - Cancel button (goes back to campaign)
   - Save button (blue, with loading state)
   - Save disabled if no email account selected

### **Feedback**

- **Success**: Green banner at top ("Campaign settings saved successfully!")
- **Error**: Red banner at top with specific error message
- **Loading**: Spinner while fetching settings
- **Saving**: Button shows spinner and "Saving..." text

---

## 🔐 **Security**

### **Authorization**

- User must be authenticated (Clerk)
- User can only update their own campaigns
- Email account must belong to the user
- RLS policies enforce user isolation

### **Validation**

Server-side validation ensures:
- Email account exists and is owned by user
- Frequency is at least 1 minute
- Hours are between 0-23
- At least one day is selected
- Campaign exists and belongs to user

---

## 🚀 **Next Steps**

After implementing campaign settings, the next features to build are:

### **1. Email Sending Engine**
- Read campaign settings from database
- Schedule emails based on:
  - `send_frequency_minutes`
  - `send_start_hour` and `send_end_hour`
  - `days` array
  - Lead status (only send to `scheduled` leads)
- Use selected `email_account_id` for sending
- Update lead status after sending

### **2. Timezone Support**
- Add timezone dropdown to settings page
- Convert sending window to user's timezone
- Store timezone in `campaigns.timezone`
- Apply timezone when scheduling sends

### **3. Campaign Status**
- Add "Start Campaign" button
- Change status from `draft` to `active`
- Only active campaigns send emails
- Add pause/resume functionality

### **4. Send History**
- Show last send time
- Show next scheduled send time
- Display sending statistics

---

## 📝 **Files Created/Modified**

### **New Files:**
- `supabase/migrations/008_add_campaign_settings.sql` - Database migration
- `app/campaigns/[id]/settings/page.tsx` - Settings UI page
- `app/api/campaigns/[id]/settings/route.ts` - API routes (GET/POST)
- `CAMPAIGN_SETTINGS_GUIDE.md` - This guide

### **Modified Files:**
- `app/campaigns/[id]/page.tsx` - Added Settings button to navigation

---

## 🐛 **Troubleshooting**

### **"No email accounts" message**

**Cause**: User hasn't connected any email accounts yet.

**Solution**: 
1. Click "Connect Email Account" button
2. Or navigate to `/settings`
3. Connect Gmail or Outlook account
4. Return to campaign settings

### **Save button disabled**

**Cause**: No email account selected.

**Solution**: Select an email account from the list.

### **"Email account not found" error**

**Cause**: Selected email account was deleted or doesn't belong to user.

**Solution**: 
1. Refresh the page
2. Select a different email account
3. Or connect a new account in `/settings`

### **Settings not persisting**

**Cause**: Database migration not applied.

**Solution**:
1. Check Supabase SQL Editor
2. Run migration `008_add_campaign_settings.sql`
3. Verify columns exist with:
   ```sql
   \d campaigns
   ```

---

## ✅ **Testing Checklist**

- [ ] Database migration applied successfully
- [ ] Settings page loads without errors
- [ ] Email accounts list displays correctly
- [ ] Can select an email account
- [ ] Can change send frequency
- [ ] Can change time window
- [ ] Can toggle weekdays
- [ ] Save button disabled when no account selected
- [ ] Save button shows loading state
- [ ] Settings save successfully
- [ ] Success message displays
- [ ] Settings persist after page refresh
- [ ] Can navigate back to campaign
- [ ] Settings button on campaign dashboard works

---

**Campaign settings are now complete!** 🎉

Users can now fully configure how and when their campaign emails are sent.

