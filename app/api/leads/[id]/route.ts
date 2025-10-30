import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

// PATCH /api/leads/[id] - Update a lead
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n✏️ [API] ========== UPDATE LEAD ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id } = await params
    console.log('📝 [API] Updating lead ID:', id)

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
    console.log('📝 [API] Update data:', body)

    // Update the lead (RLS will ensure user can only update their own leads)
    const { data: lead, error: updateError } = await supabase
      .from('leads')
      .update(body)
      .eq('id', id)
      .eq('user_id', user.id) // Extra safety check
      .select()
      .single()

    if (updateError) {
      console.error('❌ [API] Error updating lead:', updateError)
      return NextResponse.json({ error: 'Failed to update lead', details: updateError }, { status: 500 })
    }

    if (!lead) {
      console.error('❌ [API] Lead not found or unauthorized')
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    console.log('✅ [API] Lead updated successfully!')
    console.log('📊 [API] Updated lead data:', lead)
    console.log('🎉 [API] ========== UPDATE COMPLETE ==========\n')
    return NextResponse.json({ lead }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error updating lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/leads/[id] - Delete a lead
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log('\n🗑️ [API] ========== DELETE LEAD ==========')
  try {
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [API] Unauthorized: No Clerk userId')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    console.log('✅ [API] Clerk authenticated, userId:', userId)

    const { id } = await params
    console.log('🗑️ [API] Deleting lead ID:', id)

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

    // Delete the lead (RLS will ensure user can only delete their own leads)
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id) // Extra safety check

    if (deleteError) {
      console.error('❌ [API] Error deleting lead:', deleteError)
      return NextResponse.json({ error: 'Failed to delete lead', details: deleteError }, { status: 500 })
    }

    console.log('✅ [API] Lead deleted successfully!')
    console.log('🎉 [API] ========== DELETE COMPLETE ==========\n')
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error deleting lead:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

