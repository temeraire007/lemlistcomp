# Quick Fix for RLS Error 42501

## The Problem

You're seeing this error:
```
Error code: 42501
Message: new row violates row-level security policy for table "users"
```

This happens because the API route is trying to insert a user, but the RLS policy is blocking it.

## Solution Options

### Option 1: Update RLS Policy (Recommended)

Run this SQL in your Supabase SQL Editor:

```sql
-- Drop the existing policy
DROP POLICY IF EXISTS "System can insert users" ON users;

-- Create a new policy that allows authenticated inserts
CREATE POLICY "Allow authenticated inserts" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Also allow anon role to insert (for the API route)
CREATE POLICY "Allow anon inserts" ON users
  FOR INSERT
  TO anon
  WITH CHECK (true);
```

### Option 2: Temporarily Disable RLS for Testing

**⚠️ WARNING: Only for testing! Not for production!**

```sql
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

To re-enable later:
```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### Option 3: Use Service Role Key (Most Secure)

1. In your Supabase Dashboard, go to **Settings** → **API**
2. Copy the **service_role** key (not the anon key)
3. Add to your `.env.local`:

```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

4. Update the API route to use service role:

```typescript
// In app/api/auth/sync-user/route.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

## Quick Test

After applying the fix:

1. Restart your dev server: `npm run dev`
2. Sign out and clear cookies
3. Sign up with a new email
4. Check the terminal logs - should see `✅ [API] User created successfully!`
5. Check Supabase Table Editor - new user should appear!

## Recommended Approach

For now, use **Option 1** (Update RLS Policy). This allows:
- Authenticated users to manage their own data
- The API route (using anon key) to insert new users
- Still maintains security through Clerk authentication

Later, you can enhance security by using Option 3 (Service Role Key) for production.

