# Apply Migration 008 - Campaign Settings

You're getting a 404 error because the database columns for campaign settings don't exist yet. You need to apply the migration first.

---

## 🔧 **Quick Fix: Apply the Migration**

### **Option 1: Using Supabase SQL Editor (Recommended for Quick Fix)**

1. **Go to Supabase Dashboard:**
   - Navigate to [https://supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor:**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and paste this SQL:**

```sql
-- Add Campaign Settings Fields
-- Adds email account selection and detailed scheduling options

-- ============================================
-- 1. ADD NEW COLUMNS TO CAMPAIGNS TABLE
-- ============================================

-- Add email_account_id to link campaign to a specific email account
ALTER TABLE campaigns 
ADD COLUMN IF NOT EXISTS email_account_id UUID REFERENCES email_accounts(id) ON DELETE SET NULL;

-- Add send frequency in minutes (e.g., 10, 60, 120)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS send_frequency_minutes INTEGER DEFAULT 60;

-- Add start hour of day (0-23) for sending window
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS send_start_hour INTEGER DEFAULT 9 CHECK (send_start_hour >= 0 AND send_start_hour <= 23);

-- Add end hour of day (0-23) for sending window
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS send_end_hour INTEGER DEFAULT 17 CHECK (send_end_hour >= 0 AND send_end_hour <= 23);

-- Add timezone for sending (default UTC)
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

-- ============================================
-- 2. CREATE INDEX FOR EMAIL ACCOUNT
-- ============================================
CREATE INDEX IF NOT EXISTS idx_campaigns_email_account_id ON campaigns(email_account_id);

-- ============================================
-- 3. ADD HELPFUL COMMENTS
-- ============================================
COMMENT ON COLUMN campaigns.email_account_id IS 'Email account used to send emails for this campaign';
COMMENT ON COLUMN campaigns.send_frequency_minutes IS 'How often to send emails in minutes (e.g., 10, 60, 120)';
COMMENT ON COLUMN campaigns.send_start_hour IS 'Start hour of day for sending window (0-23)';
COMMENT ON COLUMN campaigns.send_end_hour IS 'End hour of day for sending window (0-23)';
COMMENT ON COLUMN campaigns.timezone IS 'Timezone for the sending window';
COMMENT ON COLUMN campaigns.days IS 'Days of week to send emails (e.g., [''monday'', ''tuesday'', ''wednesday''])';
```

4. **Run the query:**
   - Click "Run" or press `Cmd/Ctrl + Enter`
   - You should see "Success. No rows returned"

5. **Verify it worked:**
   ```sql
   SELECT column_name, data_type, column_default 
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
   
   You should see these 5 columns listed.

---

### **Option 2: Using Supabase CLI (If you have it set up)**

```bash
cd /Users/philipgossmann/Coding/LemListComp/lemlistcomp
supabase db push
```

---

## ✅ **After Applying Migration**

1. **Refresh your app:**
   - Go back to your browser
   - Navigate to the campaign settings page
   - The error should be gone!

2. **Test the settings:**
   - Select an email account
   - Set send frequency (e.g., 30 minutes)
   - Set time window (e.g., 9:00 AM - 5:00 PM)
   - Select active days (e.g., Monday-Friday)
   - Click "Save Settings"

---

## 🐛 **Why This Happened**

The campaign settings page is trying to fetch these columns from the database:
- `email_account_id`
- `send_frequency_minutes`
- `send_start_hour`
- `send_end_hour`
- `timezone`
- `days` (this one already exists)

But they don't exist yet because the migration hasn't been applied. Once you run the SQL above, these columns will be added to the `campaigns` table, and the 404 error will be resolved.

---

## 📊 **What the Migration Does**

1. **Adds 5 new columns** to the `campaigns` table
2. **Sets default values:**
   - `send_frequency_minutes`: 60 (every hour)
   - `send_start_hour`: 9 (9:00 AM)
   - `send_end_hour`: 17 (5:00 PM)
   - `timezone`: 'UTC'
   - `email_account_id`: null (must be set by user)
3. **Creates an index** on `email_account_id` for faster queries
4. **Adds helpful comments** to document each column

---

**Once you apply this migration, the campaign settings feature will work perfectly!** 🎉

