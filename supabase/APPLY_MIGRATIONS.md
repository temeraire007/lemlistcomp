# How to Apply Email Migrations

## Quick Start

Run these two new migrations in your Supabase SQL Editor:

### Step 1: Create Email Templates Table

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of: `supabase/migrations/004_create_email_templates_table.sql`
3. Paste and run ✅

### Step 2: Create Email Sends Table

1. Still in SQL Editor
2. Copy the entire contents of: `supabase/migrations/005_create_email_sends_table.sql`
3. Paste and run ✅

---

## Verify Tables Created

Run this query to check:

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('email_templates', 'email_sends');

-- Should return:
-- email_templates
-- email_sends
```

---

## What Gets Created

### `email_templates` Table
- Stores reusable email templates
- Fields: name, subject, content, preview_text, variables, status, category
- RLS policies for user isolation

### `email_sends` Table
- Tracks actual emails sent to recipients
- Fields: recipient info, email content, status, tracking data (opens/clicks)
- RLS policies for user isolation

---

## Troubleshooting

### Error: "function update_updated_at_column() does not exist"

This function should exist from migration `001_initial_schema.sql`. If not, run this first:

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### Error: "relation already exists"

Tables already created! You can safely skip or drop and recreate:

```sql
DROP TABLE IF EXISTS email_sends CASCADE;
DROP TABLE IF EXISTS email_templates CASCADE;
-- Then re-run the migrations
```

---

## Next: Update Your App

TypeScript types are already updated in `lib/supabase/types.ts` ✅

You can now:
1. Fetch templates: `supabase.from('email_templates').select('*')`
2. Track sends: `supabase.from('email_sends').insert(...)`
3. Build the template editor UI

