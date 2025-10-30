import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

// DELETE /api/email-accounts/[id] - Delete (disconnect) an email account
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n🗑️ [API] ========== DELETE EMAIL ACCOUNT ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id: accountId } = await params
    console.log('🗑️ [API] Account ID:', accountId)

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

    // Delete the account
    const { error: deleteError } = await supabase
      .from('email_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('❌ [API] Error deleting account:', deleteError)
      return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
    }

    console.log('✅ [API] Email account deleted successfully!')
    console.log('🎉 [API] ========== DELETE COMPLETE ==========\n')
    
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

