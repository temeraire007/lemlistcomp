import { NextResponse } from 'next/server'
import { auth, currentUser } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

/**
 * API Route to sync Clerk user with Supabase
 * Called after user signs in to ensure user exists in Supabase
 */
export async function POST() {
  console.log('\n🚀 [API] ========== SYNC USER API CALLED ==========')
  
  try {
    console.log('🔐 [API] Step 1: Authenticating with Clerk...')
    const { userId } = await auth()
    
    if (!userId) {
      console.error('❌ [API] No userId from Clerk auth()')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ [API] Clerk authenticated, userId:', userId)
    console.log('👤 [API] Step 2: Fetching Clerk user details...')
    
    const clerkUser = await currentUser()
    
    if (!clerkUser) {
      console.error('❌ [API] currentUser() returned null')
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ [API] Clerk user fetched successfully')
    console.log('📋 [API] Clerk user details:', {
      id: clerkUser.id,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      email: clerkUser.emailAddresses[0]?.emailAddress,
      createdAt: clerkUser.createdAt,
    })

    console.log('🗄️ [API] Step 3: Connecting to Supabase...')
    const supabase = await createClient()
    console.log('✅ [API] Supabase client created')

    console.log('🔍 [API] Step 4: Checking if user exists in Supabase...')
    console.log('🔍 [API] Querying users table with clerk_user_id:', clerkUser.id)
    
    // Check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('clerk_user_id', clerkUser.id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('❌ [API] Error fetching user from Supabase:', fetchError)
      console.error('❌ [API] Error code:', fetchError.code)
      console.error('❌ [API] Error message:', fetchError.message)
      console.error('❌ [API] Error details:', fetchError.details)
      return NextResponse.json({ error: 'Database error', details: fetchError }, { status: 500 })
    }

    if (fetchError && fetchError.code === 'PGRST116') {
      console.log('ℹ️ [API] User not found in Supabase (PGRST116 - expected for new users)')
    }

    if (existingUser) {
      console.log('👤 [API] User already exists in Supabase')
      console.log('📊 [API] Existing user data:', existingUser)
      console.log('🔄 [API] Step 5: Updating existing user...')
      
      // Update existing user
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
        console.error('❌ [API] Error updating user:', updateError)
        console.error('❌ [API] Update error code:', updateError.code)
        console.error('❌ [API] Update error message:', updateError.message)
        return NextResponse.json({ error: 'Update failed', details: updateError }, { status: 500 })
      }

      console.log('✅ [API] User updated successfully')
      console.log('📊 [API] Updated user data:', updatedUser)
      console.log('🎉 [API] ========== SYNC COMPLETE (UPDATE) ==========\n')
      
      return NextResponse.json({ user: updatedUser, created: false })
    } else {
      console.log('🆕 [API] User does not exist in Supabase')
      console.log('➕ [API] Step 5: Creating new user...')
      
      const newUserData = {
        clerk_user_id: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress,
        first_name: clerkUser.firstName,
        last_name: clerkUser.lastName,
      }
      
      console.log('📝 [API] New user data to insert:', newUserData)
      
      // Create new user
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(newUserData)
        .select()
        .single()

      if (insertError) {
        console.error('❌ [API] Error creating user in Supabase:', insertError)
        console.error('❌ [API] Insert error code:', insertError.code)
        console.error('❌ [API] Insert error message:', insertError.message)
        console.error('❌ [API] Insert error details:', insertError.details)
        console.error('❌ [API] Insert error hint:', insertError.hint)
        return NextResponse.json({ error: 'Insert failed', details: insertError }, { status: 500 })
      }

      console.log('✅ [API] User created successfully in Supabase!')
      console.log('📊 [API] New user data:', newUser)
      console.log('🎉 [API] ========== SYNC COMPLETE (CREATE) ==========\n')
      
      return NextResponse.json({ user: newUser, created: true })
    }
  } catch (error) {
    console.error('❌ [API] ========== SYNC ERROR ==========')
    console.error('❌ [API] Unexpected error:', error)
    console.error('❌ [API] Error type:', typeof error)
    console.error('❌ [API] Error details:', error instanceof Error ? error.message : 'Unknown error')
    console.error('❌ [API] Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('❌ [API] =====================================\n')
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

