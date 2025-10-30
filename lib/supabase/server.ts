import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Creates a Supabase client for server-side operations
 * 
 * Note: For the new Clerk + Supabase integration (2025), we pass the
 * Clerk session token directly to Supabase via the accessToken callback.
 * We use the regular supabase-js client (not @supabase/ssr) because
 * accessToken is incompatible with auth state change listeners.
 */
export async function createClient() {
  console.log('🔧 [Supabase Server] Creating server client...')
  console.log('🔧 [Supabase Server] URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('🔧 [Supabase Server] Key exists:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  
  const { getToken } = await auth()

  const client = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: {
        fetch: async (url, options = {}) => {
          const token = await getToken()
          console.log('🔑 [Supabase Server] Clerk token exists:', !!token)
          
          const headers = new Headers(options.headers)
          if (token) {
            headers.set('Authorization', `Bearer ${token}`)
          }
          
          return fetch(url, {
            ...options,
            headers,
          })
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    }
  )

  console.log('✅ [Supabase Server] Client created successfully')
  return client
}

