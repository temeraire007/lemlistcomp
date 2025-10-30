import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/email-accounts - Fetch all email accounts for user
export async function GET() {
  console.log('\n📧 [API] ========== FETCH EMAIL ACCOUNTS ==========')
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

    // Fetch email accounts (exclude sensitive tokens from response)
    const { data: accounts, error: accountsError } = await supabase
      .from('email_accounts')
      .select('id, provider, email, account_name, is_primary, is_active, daily_send_limit, emails_sent_today, created_at')
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: false })

    if (accountsError) {
      console.error('❌ [API] Error fetching accounts:', accountsError)
      return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
    }

    console.log('✅ [API] Accounts fetched:', accounts?.length || 0)
    console.log('🎉 [API] ========== FETCH COMPLETE ==========\n')
    
    return NextResponse.json({ accounts: accounts || [] }, { status: 200 })
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/email-accounts - Create a new email account connection
// Note: In production, this would be called after OAuth flow completes
export async function POST(req: Request) {
  console.log('\n➕ [API] ========== CREATE EMAIL ACCOUNT ==========')
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
    const { provider, email, access_token, refresh_token, token_expiry, account_name } = body

    if (!provider || !email || !access_token) {
      console.error('❌ [API] Missing required fields')
      return NextResponse.json({ error: 'provider, email, and access_token are required' }, { status: 400 })
    }

    // Check if this is the user's first account
    const { count } = await supabase
      .from('email_accounts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const isFirstAccount = count === 0

    const newAccountData = {
      user_id: user.id,
      provider,
      email,
      access_token,
      refresh_token,
      token_expiry,
      account_name,
      is_primary: isFirstAccount, // First account is automatically primary
    }
    console.log('📝 [API] Account data to insert (tokens hidden)')

    const { data: account, error: insertError } = await supabase
      .from('email_accounts')
      .insert(newAccountData)
      .select('id, provider, email, account_name, is_primary, is_active')
      .single()

    if (insertError) {
      console.error('❌ [API] Error creating account:', insertError)
      return NextResponse.json({ error: 'Failed to create account', details: insertError }, { status: 500 })
    }

    console.log('✅ [API] Email account created successfully!')
    console.log('📊 [API] Account ID:', account.id)
    console.log('🎉 [API] ========== CREATE COMPLETE ==========\n')
    
    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('❌ [API] Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

