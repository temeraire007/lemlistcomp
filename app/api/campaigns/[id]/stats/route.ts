import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/campaigns/[id]/stats - Get campaign statistics
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n📊 [API] ========== FETCH CAMPAIGN STATS ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id: campaignId } = await params
    console.log('📊 [API] Campaign ID:', campaignId)

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

    // Get campaign to verify ownership
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      console.error('❌ [API] Campaign not found:', campaignError)
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
    }
    console.log('✅ [API] Campaign found:', campaign.name)

    // Get all leads for this campaign with their statuses
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('status')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)

    if (leadsError) {
      console.error('❌ [API] Error fetching leads:', leadsError)
      return NextResponse.json({ error: 'Failed to fetch leads' }, { status: 500 })
    }

    console.log('📊 [API] Total leads:', leads?.length || 0)

    // Calculate stats from lead statuses
    const stats = {
      sent: 0,
      opened: 0,
      answered: 0,
      scheduled: 0,
      unscheduled: 0,
    }

    leads?.forEach((lead) => {
      switch (lead.status) {
        case 'sent':
          stats.sent++
          break
        case 'opened':
          stats.sent++
          stats.opened++
          break
        case 'replied':
          stats.sent++
          stats.opened++
          stats.answered++
          break
        case 'scheduled':
          stats.scheduled++
          break
        case 'lead':
          stats.unscheduled++
          break
        // 'won' and 'lost' are not counted in main stats
      }
    })

    console.log('📊 [API] Stats calculated:', stats)
    console.log('🎉 [API] ========== STATS FETCH COMPLETE ==========\n')
    
    return NextResponse.json({ 
      campaign: {
        id: campaign.id,
        name: campaign.name,
      },
      stats 
    }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error fetching stats:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

