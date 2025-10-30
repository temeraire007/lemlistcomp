import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/email-accounts/[id]/primary - Set an account as primary
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n⭐ [API] ========== SET PRIMARY ACCOUNT ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id: accountId } = await params
    console.log('⭐ [API] Account ID:', accountId)

    const supabase = await createClient()

    // Get the Supabase user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [API] User not found:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }
    console.log('✅ [API] User found:', user.id)

    // First, set all accounts to non-primary
    const { error: resetError } = await supabase
      .from('email_accounts')
      .update({ is_primary: false })
      .eq('user_id', user.id)

    if (resetError) {
      console.error('❌ [API] Error resetting primary flags:', resetError)
      return NextResponse.json({ error: 'Failed to update primary account' }, { status: 500 })
    }

    // Then set the selected account as primary
    const { error: updateError } = await supabase
      .from('email_accounts')
      .update({ is_primary: true })
      .eq('id', accountId)
      .eq('user_id', user.id)

    if (updateError) {
      console.error('❌ [API] Error setting primary account:', updateError)
      return NextResponse.json({ error: 'Failed to set primary account' }, { status: 500 })
    }

    console.log('✅ [API] Primary account updated successfully!')
    console.log('🎉 [API] ========== UPDATE COMPLETE ==========\n')
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

