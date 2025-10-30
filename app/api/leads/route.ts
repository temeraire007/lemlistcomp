import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/leads?campaign_id=xxx - Fetch leads for a campaign
export async function GET(req: Request) {
  console.log('\n🔍 [API] ========== FETCH LEADS ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { searchParams } = new URL(req.url)
    const campaignId = searchParams.get('campaign_id')

    if (!campaignId) {
      console.error('❌ [API] Missing campaign_id parameter')
      return NextResponse.json({ error: 'campaign_id is required' }, { status: 400 })
    }

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

    // Fetch leads for the campaign
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (leadsError) {
      console.error('❌ [API] Error fetching leads:', leadsError)
      return NextResponse.json({ error: 'Failed to fetch leads', details: leadsError }, { status: 500 })
    }

    console.log('✅ [API] Leads fetched:', leads?.length || 0)
    console.log('🎉 [API] ========== FETCH COMPLETE ==========\n')
    return NextResponse.json({ leads }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error fetching leads:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/leads - Create a new lead
export async function POST(req: Request) {
  console.log('\n🚀 [API] ========== CREATE LEAD ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

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

    const body = await req.json()
    const { campaign_id, first_name, last_name, email, company, status, notes, tags } = body

    if (!campaign_id || !email) {
      console.error('❌ [API] Missing required fields')
      return NextResponse.json({ error: 'campaign_id and email are required' }, { status: 400 })
    }

    const newLeadData = {
      user_id: user.id,
      campaign_id,
      first_name,
      last_name,
      email,
      company,
      status: status || 'lead',
      notes,
      tags,
    }
    console.log('📝 [API] Lead data to insert:', newLeadData)

    const { data: lead, error: insertError } = await supabase
      .from('leads')
      .insert(newLeadData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ [API] Error creating lead:', insertError)
      return NextResponse.json({ error: 'Failed to create lead', details: insertError }, { status: 500 })
    }

    console.log('✅ [API] Lead created successfully!')
    console.log('📊 [API] New lead data:', lead)
    console.log('🎉 [API] ========== CREATE COMPLETE ==========\n')
    return NextResponse.json({ lead }, { status: 201 })
  } catch (error) {
    console.error('❌ [API] Unexpected error creating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

