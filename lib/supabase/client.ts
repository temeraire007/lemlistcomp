import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { useSession } from '@clerk/nextjs'
import { useMemo } from 'react'

/**
 * Creates a Supabase client for browser-side operations (unauthenticated)
 * Use this for public data only
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}

/**
 * Hook to create an authenticated Supabase client with Clerk session
 * Use this in Client Components when you need authenticated requests
 * 
 * This follows the new Clerk + Supabase integration (2025) pattern
 * by passing the Clerk session token via custom fetch with Authorization header.
 */
export function useSupabaseClient() {
  const { session } = useSession()

  return useMemo(() => {
    return createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          fetch: async (url, options = {}) => {
            const token = await session?.getToken()
            
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
        },
      }
    )
  }, [session])
}

