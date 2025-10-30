# Clerk + Supabase Integration Checklist

## ✅ Required Steps

### 1. Configure Clerk Session Token

**In Clerk Dashboard:**

1. Go to **Configure** → **Sessions**
2. Scroll down to **Customize session token**
3. Click **Edit**
4. Add this claim:

```json
{
  "role": "authenticated"
}
```

5. Click **Save**

**Why:** This tells Supabase that the user is authenticated and should have the `authenticated` role for RLS policies.

### 2. Add Clerk Integration in Supabase

**In Supabase Dashboard:**

1. Go to **Authentication** → **Providers**
2. Scroll down to **Third-Party Auth**
3. Click **Add Provider**
4. Select **Clerk**
5. Enter your Clerk domain:
   - Format: `your-app-name.clerk.accounts.dev`
   - Example: `my-saas.clerk.accounts.dev`
6. Click **Save**

**To find your Clerk domain:**
- Go to Clerk Dashboard → **API Keys**
- Look for "Issuer URL" or your publishable key domain

### 3. Update RLS Policies

The RLS policies need to check for the `authenticated` role. Run this SQL in Supabase:

```sql
-- For users table
DROP POLICY IF EXISTS "Allow anon inserts" ON users;
DROP POLICY IF EXISTS "Allow authenticated inserts" ON users;

CREATE POLICY "Allow authenticated users to insert" ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- For campaigns table  
DROP POLICY IF EXISTS "Allow anon to insert campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow anon to select campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow anon to update campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow anon to delete campaigns" ON campaigns;

-- These are already correct (keep them)
-- "Users can view own campaigns"
-- "Users can insert own campaigns"
-- "Users can update own campaigns"
-- "Users can delete own campaigns"
```

## 🧪 Test the Integration

### Step 1: Check Clerk Token

After signing in, run this in browser console:

```javascript
// Get your session
const session = await window.Clerk.session

// Get the token
const token = await session.getToken()

// Decode the token (paste at jwt.io)
console.log('Token:', token)

// Check if it has the 'role' claim
const decoded = JSON.parse(atob(token.split('.')[1]))
console.log('Has role claim:', decoded.role === 'authenticated')
```

### Step 2: Test User Creation

1. Sign out completely
2. Clear cookies
3. Sign up with a new email
4. Check terminal logs for:
   ```
   🔑 [Supabase Server] Clerk token exists: true
   ✅ [API] User created successfully!
   ```

5. Check Supabase Table Editor → `users` table
6. New user should appear!

### Step 3: Test Campaign Creation

1. Go to `/campaigns/new`
2. Create a campaign
3. Check terminal logs for:
   ```
   🔑 [Supabase Server] Clerk token exists: true
   ✅ [API] Campaign created successfully!
   ```

4. Check Supabase Table Editor → `campaigns` table
5. New campaign should appear!

## 🐛 Troubleshooting

### Error: "new row violates row-level security"

**Cause:** Clerk session token doesn't have the `role` claim, or Supabase isn't recognizing it.

**Solutions:**

1. **Verify Clerk has role claim:**
   - Check Clerk Dashboard → Configure → Sessions
   - Make sure `"role": "authenticated"` is in the session token

2. **Verify Supabase has Clerk integration:**
   - Check Supabase Dashboard → Authentication → Providers
   - Make sure Clerk is listed under Third-Party Auth
   - Make sure the domain is correct

3. **Check the token is being passed:**
   - Look at terminal logs
   - Should see: `🔑 [Supabase Server] Clerk token exists: true`
   - If false, the token isn't being retrieved

4. **Sign out and back in:**
   - Changes to Clerk session token require a new session
   - Clear cookies and sign in again

### Error: "JWT token invalid"

**Cause:** Supabase doesn't recognize the Clerk token.

**Solution:**
- Double-check the Clerk domain in Supabase matches exactly
- Format: `your-app.clerk.accounts.dev` (no https://)

### Still Not Working?

Run this SQL to temporarily bypass RLS (testing only!):

```sql
-- TESTING ONLY - Remove after debugging
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns DISABLE ROW LEVEL SECURITY;
```

If it works now, the issue is with RLS policies or the Clerk token.

Remember to re-enable:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
```

## 📋 Quick Checklist

- [ ] Added `"role": "authenticated"` to Clerk session token
- [ ] Added Clerk provider in Supabase with correct domain
- [ ] Updated Supabase client to pass Clerk token
- [ ] RLS policies check for `authenticated` role
- [ ] Signed out and back in to get new token
- [ ] Tested user creation (check logs + database)
- [ ] Tested campaign creation (check logs + database)

## ✅ Success Indicators

When everything works:

**Browser Console:**
```
✅ [UserSync] User sync successful!
✅ [NewCampaign] Campaign created successfully!
```

**Terminal:**
```
🔑 [Supabase Server] Clerk token exists: true
✅ [API] User created successfully!
✅ [API] Campaign created successfully!
```

**Supabase Tables:**
- Users table has your user
- Campaigns table has your campaigns
- No RLS errors!

🎉 You're all set!

