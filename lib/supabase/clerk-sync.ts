import { createClient } from './server'
import { currentUser } from '@clerk/nextjs/server'

/**
 * Syncs the current Clerk user with Supabase
 * This ensures the user exists in the Supabase database
 */
export async function syncClerkUserToSupabase() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    return null
  }

  const supabase = await createClient()

  // Check if user exists in Supabase users table
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUser.id)
    .single()

  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 is "not found" error, which is fine
    console.error('Error fetching user:', fetchError)
    return null
  }

  if (existingUser) {
    // User exists, optionally update their info
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({
        email: clerkUser.emailAddresses[0]?.emailAddress,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
        updated_at: new Date().toISOString(),
      })
      .eq('clerk_user_id', clerkUser.id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating user:', updateError)
      return existingUser
    }

    return updatedUser
  } else {
    // Create new user
    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert({
        clerk_user_id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating user:', insertError)
      return null
    }

    return newUser
  }
}

/**
 * Gets the Supabase user ID for the current Clerk user
 */
export async function getSupabaseUserId() {
  const clerkUser = await currentUser()
  
  if (!clerkUser) {
    return null
  }

  const supabase = await createClient()

  const { data: user } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', clerkUser.id)
    .single()

  return user?.id || null
}

