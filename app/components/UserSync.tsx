'use client'

import { useUser } from '@clerk/nextjs'
import { useEffect, useState } from 'react'

/**
 * Component that syncs the authenticated user with Supabase
 * Place this in your layout to ensure users are always synced
 */
export function UserSync() {
  const { isSignedIn, user, isLoaded } = useUser()
  const [synced, setSynced] = useState(false)

  useEffect(() => {
    console.log('🔍 [UserSync] Component loaded')
    console.log('🔍 [UserSync] Clerk loaded:', isLoaded)
    console.log('🔍 [UserSync] Is signed in:', isSignedIn)
    console.log('🔍 [UserSync] User ID:', user?.id)
    console.log('🔍 [UserSync] User email:', user?.emailAddresses[0]?.emailAddress)
    console.log('🔍 [UserSync] Already synced:', synced)

    if (isSignedIn && user && !synced) {
      console.log('✅ [UserSync] User is signed in and not yet synced')
      console.log('📤 [UserSync] Calling sync API...')
      console.log('📤 [UserSync] User details:', {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.emailAddresses[0]?.emailAddress,
      })

      // Sync user with Supabase
      fetch('/api/auth/sync-user', {
        method: 'POST',
      })
        .then(response => {
          console.log('📥 [UserSync] API response status:', response.status)
          if (!response.ok) {
            console.error('❌ [UserSync] API response not OK:', response.status, response.statusText)
          }
          return response.json()
        })
        .then(data => {
          console.log('✅ [UserSync] User sync successful!')
          console.log('📊 [UserSync] Sync result:', data)
          if (data.created) {
            console.log('🆕 [UserSync] New user created in Supabase')
          } else {
            console.log('🔄 [UserSync] Existing user updated in Supabase')
          }
          console.log('👤 [UserSync] Supabase user:', data.user)
          setSynced(true)
        })
        .catch(error => {
          console.error('❌ [UserSync] Error syncing user:', error)
          console.error('❌ [UserSync] Error details:', error.message)
        })
    } else {
      if (!isSignedIn) {
        console.log('⏸️ [UserSync] User not signed in, skipping sync')
      }
      if (!user) {
        console.log('⏸️ [UserSync] User object not available, skipping sync')
      }
      if (synced) {
        console.log('⏸️ [UserSync] User already synced, skipping')
      }
    }
  }, [isSignedIn, user, synced, isLoaded])

  return null // This component doesn't render anything
}

