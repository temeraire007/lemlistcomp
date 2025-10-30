# Troubleshooting Guide

## User Not Syncing to Supabase

If users are not appearing in your Supabase `users` table after sign-in, follow these steps:

### 1. Check Environment Variables

Make sure your `.env.local` has all required variables:

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
```

### 2. Verify Clerk + Supabase Integration

1. **In Clerk Dashboard:**
   - Go to Configure → Sessions
   - Check that the `role` claim is added with value `authenticated`

2. **In Supabase Dashboard:**
   - Go to Authentication → Providers
   - Scroll to Third-Party Auth
   - Verify Clerk is added with your correct domain

### 3. Check Database Migration

Make sure you've run the SQL migration in Supabase:

1. Go to Supabase SQL Editor
2. Run the contents of `supabase/migrations/001_initial_schema.sql`
3. Verify the `users` table exists in Table Editor

### 4. Test User Sync Manually

Open your browser console and check for:
- Any errors in the console
- Network tab: Look for POST request to `/api/auth/sync-user`
- Check the response - it should show `{ user: {...}, created: true }`

### 5. Check RLS Policies

The `users` table needs the "System can insert users" policy:

```sql
CREATE POLICY "System can insert users" ON users
  FOR INSERT
  WITH CHECK (true);
```

This allows the API route to insert new users.

### 6. Verify Clerk User ID Format

In your browser console after signing in, run:
```javascript
console.log('User ID:', user.id)
```

The Clerk user ID should start with `user_` (e.g., `user_2abc123...`)

### 7. Check API Route Logs

In your terminal where `npm run dev` is running, look for:
- "User synced: { user: {...}, created: true }"
- Any error messages from the sync-user API route

### Common Issues

#### Issue: "PGRST301: JWT expired"
**Solution:** Your Clerk session token expired. Sign out and sign in again.

#### Issue: "Insert failed" error
**Solution:** Check that:
- The `users` table exists
- RLS policy "System can insert users" exists
- Your Supabase connection is working

#### Issue: User created but clerk_user_id is null
**Solution:** Make sure you're passing the correct user ID from Clerk

#### Issue: Network error when calling sync-user
**Solution:** 
- Check that your Next.js dev server is running
- Verify the API route exists at `/app/api/auth/sync-user/route.ts`

### Manual Test

You can manually test the sync by visiting:
```
http://localhost:3000/api/auth/sync-user
```

While signed in (you should get a JSON response).

### Still Not Working?

1. **Clear your browser cache and cookies**
2. **Sign out completely from Clerk**
3. **Sign in again**
4. **Check the Supabase Table Editor** for the new user

### Debug Mode

Add this to your `UserSync.tsx` for more detailed logging:

```typescript
console.log('UserSync - isSignedIn:', isSignedIn)
console.log('UserSync - user:', user?.id)
console.log('UserSync - synced:', synced)
```

This will help you see exactly what's happening during the sync process.

