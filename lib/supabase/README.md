# Supabase Integration

This directory contains all Supabase client configurations and utilities for integrating with Clerk authentication.

## Files

### `client.ts`
Browser-side Supabase client for use in Client Components.

**Usage (Authenticated):**
```typescript
'use client'
import { useSupabaseClient } from '@/lib/supabase/client'

export default function MyComponent() {
  const supabase = useSupabaseClient()
  
  const fetchData = async () => {
    const { data, error } = await supabase
      .from('campaigns')
      .select('*')
    
    if (error) console.error(error)
    return data
  }
  
  // ...
}
```

**Usage (Public/Unauthenticated):**
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'

export default function PublicComponent() {
  const supabase = createClient()
  // Use for public data only
}
```

### `server.ts`
Server-side Supabase client for use in Server Components and API Routes.

**Usage in Server Component:**
```typescript
import { createClient } from '@/lib/supabase/server'

export default async function MyServerComponent() {
  const supabase = await createClient()
  
  const { data: campaigns } = await supabase
    .from('campaigns')
    .select('*')
  
  return <div>{/* render campaigns */}</div>
}
```

**Usage in API Route:**
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('campaigns')
    .select('*')
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  
  return NextResponse.json(data)
}
```

### `clerk-sync.ts`
Utilities for syncing Clerk users with Supabase.

**Usage:**
```typescript
import { syncClerkUserToSupabase, getSupabaseUserId } from '@/lib/supabase/clerk-sync'

// Sync current Clerk user to Supabase
const user = await syncClerkUserToSupabase()

// Get Supabase user ID for current Clerk user
const userId = await getSupabaseUserId()
```

### `types.ts`
TypeScript type definitions for your Supabase database schema.

**Usage:**
```typescript
import type { Database } from '@/lib/supabase/types'

type User = Database['public']['Tables']['users']['Row']
type Campaign = Database['public']['Tables']['campaigns']['Row']
```

### `middleware.ts`
Middleware helper for Supabase session management (currently not used in main middleware, but available if needed).

## Common Patterns

### Fetching User-Specific Data

```typescript
import { createClient } from '@/lib/supabase/server'
import { getSupabaseUserId } from '@/lib/supabase/clerk-sync'

const supabase = await createClient()
const userId = await getSupabaseUserId()

const { data: campaigns } = await supabase
  .from('campaigns')
  .select('*')
  .eq('user_id', userId)
```

### Creating New Records

```typescript
const { data, error } = await supabase
  .from('campaigns')
  .insert({
    name: 'New Campaign',
    user_id: userId,
  })
  .select()
  .single()

if (error) {
  console.error('Error creating campaign:', error)
}
```

### Updating Records

```typescript
const { data, error } = await supabase
  .from('campaigns')
  .update({ name: 'Updated Name' })
  .eq('id', campaignId)
  .eq('user_id', userId) // Ensure user owns this record
  .select()
  .single()
```

### Deleting Records

```typescript
const { error } = await supabase
  .from('campaigns')
  .delete()
  .eq('id', campaignId)
  .eq('user_id', userId) // Ensure user owns this record
```

## Security Notes

1. **Row Level Security (RLS)**: All tables should have RLS enabled
2. **User Isolation**: Always filter by `user_id` to ensure data isolation
3. **JWT Claims**: Clerk JWT is automatically passed to Supabase for RLS policies
4. **Environment Variables**: Keep your Supabase credentials in `.env.local`

## Next Steps

After setting up the base infrastructure:
1. Create additional tables in Supabase
2. Add corresponding types to `types.ts`
3. Implement CRUD operations in your components
4. Add RLS policies for each table

