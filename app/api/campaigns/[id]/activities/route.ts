import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/campaigns/[id]/activities - Get recent campaign activities
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n📋 [API] ========== FETCH CAMPAIGN ACTIVITIES ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id: campaignId } = await params
    console.log('📋 [API] Campaign ID:', campaignId)

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

    // Get recent email messages for this campaign (with lead info)
    const { data: messages, error: messagesError } = await supabase
      .from('email_messages')
      .select(`
        id,
        direction,
        sent_at,
        lead_id,
        leads!inner(
          email,
          first_name,
          last_name,
          campaign_id
        )
      `)
      .eq('user_id', user.id)
      .eq('leads.campaign_id', campaignId)
      .order('sent_at', { ascending: false })
      .limit(10)

    if (messagesError) {
      console.error('❌ [API] Error fetching messages:', messagesError)
      return NextResponse.json({ error: 'Failed to fetch activities' }, { status: 500 })
    }

    console.log('📋 [API] Messages found:', messages?.length || 0)

    // Transform messages into activities
    const activities = messages?.map((message: any) => {
      const lead = message.leads
      const email = lead.email
      
      // Calculate relative time
      const sentAt = new Date(message.sent_at)
      const now = new Date()
      const diffMs = now.getTime() - sentAt.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      let timestamp = ''
      if (diffMins < 1) {
        timestamp = 'Just now'
      } else if (diffMins < 60) {
        timestamp = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
      } else if (diffHours < 24) {
        timestamp = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      } else {
        timestamp = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      }

      return {
        id: message.id,
        type: message.direction === 'outbound' ? 'sent' : 'answered',
        email,
        timestamp,
      }
    }) || []

    console.log('📋 [API] Activities transformed:', activities.length)
    console.log('🎉 [API] ========== ACTIVITIES FETCH COMPLETE ==========\n')
    
    return NextResponse.json({ activities }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error fetching activities:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

