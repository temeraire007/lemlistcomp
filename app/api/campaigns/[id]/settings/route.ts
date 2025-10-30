import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/campaigns/[id]/settings
 * Fetches campaign settings
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  console.log('\n⚙️ [API] ========== GET CAMPAIGN SETTINGS ==========')
  
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id: campaignId } = await params
    if (!campaignId) {
      console.error('❌ [API] Missing campaign ID')
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }
    console.log('✅ [API] Campaign ID:', campaignId)

    const supabase = await createClient()

    // Get the Supabase user ID from the Clerk user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [API] Supabase user not found for Clerk ID:', userId, userError)
      return NextResponse.json({ error: 'User not found in Supabase' }, { status: 404 })
    }
    console.log('✅ [API] User found in Supabase:', user.id)

    // Fetch campaign settings
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('email_account_id, send_frequency_minutes, send_start_hour, send_end_hour, days, timezone')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      console.error('❌ [API] Campaign not found:', campaignError)
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }

    console.log('✅ [API] Campaign settings fetched successfully!')
    console.log('📊 [API] Settings:', campaign)
    console.log('🎉 [API] ========== GET COMPLETE ==========\n')

    return NextResponse.json({ settings: campaign }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error fetching settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/campaigns/[id]/settings
 * Updates campaign settings
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  console.log('\n💾 [API] ========== UPDATE CAMPAIGN SETTINGS ==========')
  
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id: campaignId } = await params
    if (!campaignId) {
      console.error('❌ [API] Missing campaign ID')
      return NextResponse.json({ error: 'Campaign ID is required' }, { status: 400 })
    }
    console.log('✅ [API] Campaign ID:', campaignId)

    const body = await req.json()
    const {
      email_account_id,
      send_frequency_minutes,
      send_start_hour,
      send_end_hour,
      days,
      timezone,
    } = body

    console.log('📝 [API] Settings to update:', {
      email_account_id,
      send_frequency_minutes,
      send_start_hour,
      send_end_hour,
      days,
      timezone,
    })

    // Validation
    if (!email_account_id) {
      console.error('❌ [API] Missing email account ID')
      return NextResponse.json({ error: 'Email account is required' }, { status: 400 })
    }

    if (send_frequency_minutes < 1) {
      console.error('❌ [API] Invalid frequency')
      return NextResponse.json({ error: 'Send frequency must be at least 1 minute' }, { status: 400 })
    }

    if (send_start_hour < 0 || send_start_hour > 23 || send_end_hour < 0 || send_end_hour > 23) {
      console.error('❌ [API] Invalid time range')
      return NextResponse.json({ error: 'Invalid time range' }, { status: 400 })
    }

    if (!days || days.length === 0) {
      console.error('❌ [API] No days selected')
      return NextResponse.json({ error: 'At least one day must be selected' }, { status: 400 })
    }

    const supabase = await createClient()

    // Get the Supabase user ID from the Clerk user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [API] Supabase user not found for Clerk ID:', userId, userError)
      return NextResponse.json({ error: 'User not found in Supabase' }, { status: 404 })
    }
    console.log('✅ [API] User found in Supabase:', user.id)

    // Verify email account belongs to user
    const { data: emailAccount, error: emailAccountError } = await supabase
      .from('email_accounts')
      .select('id')
      .eq('id', email_account_id)
      .eq('user_id', user.id)
      .single()

    if (emailAccountError || !emailAccount) {
      console.error('❌ [API] Email account not found or not owned by user:', emailAccountError)
      return NextResponse.json({ error: 'Email account not found or not authorized' }, { status: 404 })
    }
    console.log('✅ [API] Email account verified')

    // Update campaign settings
    const { data: updatedCampaign, error: updateError } = await supabase
      .from('campaigns')
      .update({
        email_account_id,
        send_frequency_minutes,
        send_start_hour,
        send_end_hour,
        days,
        timezone: timezone || 'UTC',
      })
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError || !updatedCampaign) {
      console.error('❌ [API] Error updating campaign:', updateError)
      return NextResponse.json({ error: 'Failed to update campaign settings' }, { status: 500 })
    }

    console.log('✅ [API] Campaign settings updated successfully!')
    console.log('📊 [API] Updated campaign:', updatedCampaign)
    console.log('🎉 [API] ========== UPDATE COMPLETE ==========\n')

    return NextResponse.json({ campaign: updatedCampaign }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error updating settings:', error)
    return NextResponse.json(
      { error: 'Internal server error', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

