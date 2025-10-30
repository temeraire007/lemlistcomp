import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/campaigns/[id]/template - Get campaign template
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n📧 [API] ========== FETCH TEMPLATE ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id: campaignId } = await params
    console.log('📧 [API] Campaign ID:', campaignId)

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

    // Get template for this campaign
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (templateError && templateError.code !== 'PGRST116') {
      console.error('❌ [API] Error fetching template:', templateError)
      return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
    }

    console.log('✅ [API] Template found:', !!template)
    console.log('🎉 [API] ========== FETCH COMPLETE ==========\n')
    
    return NextResponse.json({ template: template || null }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error fetching template:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/campaigns/[id]/template - Create or update campaign template
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n💾 [API] ========== SAVE TEMPLATE ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id: campaignId } = await params
    console.log('💾 [API] Campaign ID:', campaignId)

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
    const { name, subject, content, preview_text } = body
    console.log('📧 [API] Template data received:', { name, subject, contentLength: content?.length })

    if (!subject || !content) {
      console.error('❌ [API] Missing required fields')
      return NextResponse.json({ error: 'Subject and content are required' }, { status: 400 })
    }

    // Check if template already exists
    const { data: existingTemplate } = await supabase
      .from('email_templates')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)
      .single()

    let template
    if (existingTemplate) {
      // Update existing template
      console.log('📝 [API] Updating existing template:', existingTemplate.id)
      const { data, error } = await supabase
        .from('email_templates')
        .update({
          name: name || 'Campaign Template',
          subject,
          content,
          preview_text,
          status: 'active',
        })
        .eq('id', existingTemplate.id)
        .select()
        .single()

      if (error) {
        console.error('❌ [API] Error updating template:', error)
        return NextResponse.json({ error: 'Failed to update template', details: error }, { status: 500 })
      }
      template = data
    } else {
      // Create new template
      console.log('➕ [API] Creating new template')
      const { data, error } = await supabase
        .from('email_templates')
        .insert({
          user_id: user.id,
          campaign_id: campaignId,
          name: name || 'Campaign Template',
          subject,
          content,
          preview_text,
          status: 'active',
        })
        .select()
        .single()

      if (error) {
        console.error('❌ [API] Error creating template:', error)
        return NextResponse.json({ error: 'Failed to create template', details: error }, { status: 500 })
      }
      template = data
    }

    console.log('✅ [API] Template saved successfully!')
    console.log('📊 [API] Template ID:', template.id)
    console.log('🎉 [API] ========== SAVE COMPLETE ==========\n')
    
    return NextResponse.json({ template }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error saving template:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}

