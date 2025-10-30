import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type CampaignInsert = Database['public']['Tables']['campaigns']['Insert']

/**
 * GET /api/campaigns
 * Fetches all campaigns for the authenticated user
 */
export async function GET() {
  console.log('\n📋 [API] ========== GET CAMPAIGNS ==========')
  
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.error('❌ [API] No userId from Clerk auth()')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ [API] Clerk authenticated, userId:', userId)
    
    const supabase = await createClient()
    
    // Get user's Supabase ID
    console.log('🔍 [API] Fetching user from Supabase...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [API] User not found in Supabase:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ [API] User found, Supabase user_id:', user.id)
    console.log('📊 [API] Fetching campaigns for user...')
    
    // Fetch user's campaigns
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (campaignsError) {
      console.error('❌ [API] Error fetching campaigns:', campaignsError)
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 })
    }

    console.log('✅ [API] Campaigns fetched successfully, count:', campaigns?.length || 0)
    console.log('🎉 [API] ========== GET COMPLETE ==========\n')
    
    return NextResponse.json({ campaigns })
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/campaigns
 * Creates a new campaign for the authenticated user
 */
export async function POST(request: NextRequest) {
  console.log('\n🚀 [API] ========== CREATE CAMPAIGN ==========')
  
  try {
    const { userId } = await auth()
    
    if (!userId) {
      console.error('❌ [API] No userId from Clerk auth()')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('✅ [API] Clerk authenticated, userId:', userId)
    
    const body = await request.json()
    console.log('📝 [API] Request body:', body)
    
    const supabase = await createClient()
    
    // Get user's Supabase ID
    console.log('🔍 [API] Fetching user from Supabase...')
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [API] User not found in Supabase:', userError)
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    console.log('✅ [API] User found, Supabase user_id:', user.id)
    
    // Prepare campaign data
    const campaignData: CampaignInsert = {
      user_id: user.id,
      name: body.name,
      frequency: body.frequency || null,
      start_time: body.start_time || null,
      end_time: body.end_time || null,
      days: body.days || null,
      status: body.status || 'draft',
    }
    
    console.log('📝 [API] Campaign data to insert:', campaignData)
    console.log('➕ [API] Inserting campaign into database...')
    
    // Insert campaign
    const { data: campaign, error: insertError } = await supabase
      .from('campaigns')
      .insert(campaignData)
      .select()
      .single()

    if (insertError) {
      console.error('❌ [API] Error creating campaign:', insertError)
      console.error('❌ [API] Error code:', insertError.code)
      console.error('❌ [API] Error message:', insertError.message)
      console.error('❌ [API] Error details:', insertError.details)
      return NextResponse.json({ error: 'Failed to create campaign', details: insertError }, { status: 500 })
    }

    console.log('✅ [API] Campaign created successfully!')
    console.log('📊 [API] New campaign:', campaign)
    console.log('🎉 [API] ========== CREATE COMPLETE ==========\n')
    
    return NextResponse.json({ campaign }, { status: 201 })
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

