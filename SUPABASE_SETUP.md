# Supabase Setup Guide

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in your project details:
   - Project name
   - Database password (save this!)
   - Region (choose closest to you)
4. Click "Create new project"

## 2. Get Your Supabase Credentials

Once your project is created:

1. Go to **Project Settings** (gear icon in sidebar)
2. Click on **API** in the settings menu
3. Copy the following values:
   - **Project URL** (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## 3. Configure Environment Variables

Add these to your `.env.local` file:

```env
# Clerk (existing)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/campaigns
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/campaigns

# Supabase (new)
NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
```

## 4. Set Up Clerk + Supabase Integration (NEW METHOD - 2025)

### Step 1: Configure Clerk for Supabase

1. Go to [Clerk's Connect with Supabase page](https://dashboard.clerk.com/last-active?path=integrations/supabase)
2. Follow the guided setup to configure your Clerk instance for Supabase compatibility
3. This will automatically add the required `role` claim to your session tokens

**OR manually add the role claim:**

1. In Clerk Dashboard, go to **Configure** → **Sessions**
2. Under **Customize session token**, add this claim:
```json
{
  "role": "authenticated"
}
```

### Step 2: Add Clerk Integration in Supabase

1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Providers**
3. Scroll down to **Third-Party Auth**
4. Click **Add Third-Party Auth**
5. Select **Clerk**
6. Enter your Clerk domain (e.g., `your-app.clerk.accounts.dev`)
7. Save the configuration

### Step 3: Verify Integration

Your Clerk session tokens will now work directly with Supabase! 

**Advantages of this new method:**
- ✅ **More secure**: No need to share JWT secrets with third parties
- ✅ **No downtime**: JWT secret rotation doesn't affect your app
- ✅ **Better performance**: Uses Clerk session tokens directly (no extra JWT generation)
- ✅ **Simpler setup**: No manual JWT template configuration needed

## 5. Create Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on clerk_user_id for faster lookups
CREATE INDEX idx_users_clerk_user_id ON users(clerk_user_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can read their own data
CREATE POLICY "Users can read own data" ON users
  FOR SELECT
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Create policy: Users can update their own data
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE
  USING (clerk_user_id = auth.jwt() ->> 'sub');

-- Create policy: System can insert users (for user sync)
CREATE POLICY "System can insert users" ON users
  FOR INSERT
  WITH CHECK (true);
```

## 6. Test the Connection

After setting up:

1. Restart your development server: `npm run dev`
2. Sign in to your application
3. Check the Supabase dashboard under **Table Editor** > **users**
4. You should see your user automatically created

## Architecture Overview

### How it Works

1. **User signs in with Clerk**: Clerk handles authentication
2. **User sync**: On first login, the app creates a user record in Supabase
3. **Data storage**: All campaign, lead, and activity data is stored in Supabase
4. **Access control**: Row Level Security (RLS) ensures users can only access their own data

### File Structure

```
lib/
├── supabase/
│   ├── client.ts          # Browser-side Supabase client
│   ├── server.ts          # Server-side Supabase client
│   ├── middleware.ts      # Middleware helper
│   └── clerk-sync.ts      # Clerk-Supabase user sync utilities
```

### Usage Examples

#### Client-side (React components)
```typescript
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()
const { data } = await supabase.from('campaigns').select('*')
```

#### Server-side (Server Components, API Routes)
```typescript
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('campaigns').select('*')
```

#### Sync Clerk user with Supabase
```typescript
import { syncClerkUserToSupabase } from '@/lib/supabase/clerk-sync'

const user = await syncClerkUserToSupabase()
```

## Next Steps

Now you're ready to:
1. Create additional database tables (campaigns, leads, etc.)
2. Implement CRUD operations
3. Add Row Level Security policies
4. Build out the application features

## Troubleshooting

### Common Issues

1. **"Invalid API key"**: Check your environment variables are correct
2. **"JWT token invalid"**: Ensure Clerk JWT template is configured correctly
3. **"Row Level Security policy violation"**: Check your RLS policies in Supabase

### Getting Help

- Supabase Docs: https://supabase.com/docs
- Clerk Docs: https://clerk.com/docs
- Clerk + Supabase Integration: https://clerk.com/docs/integrations/databases/supabase

