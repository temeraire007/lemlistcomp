import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { createClient } from '@/lib/supabase/server'

/**
 * Handles Outlook OAuth callback
 * GET /api/auth/outlook/callback?code=...
 */
export async function GET(req: NextRequest) {
  console.log('\n🔄 [Outlook Callback] ========== OAUTH CALLBACK ==========')
  
  try {
    // Get the authorization code from query params
    const searchParams = req.nextUrl.searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')

    if (error) {
      console.error('❌ [Outlook Callback] OAuth error:', error)
      return NextResponse.redirect(
        new URL(`/settings?error=${encodeURIComponent(error)}`, req.url)
      )
    }

    if (!code) {
      console.error('❌ [Outlook Callback] No authorization code provided')
      return NextResponse.redirect(
        new URL('/settings?error=no_code', req.url)
      )
    }

    console.log('✅ [Outlook Callback] Authorization code received')

    // Check authentication
    const { userId } = await auth()
    if (!userId) {
      console.error('❌ [Outlook Callback] User not authenticated')
      return NextResponse.redirect(
        new URL('/settings?error=unauthorized', req.url)
      )
    }
    console.log('✅ [Outlook Callback] User authenticated:', userId)

    // Exchange code for tokens
    const***REMOVED***
    const***REMOVED***
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI

    if (!clientId || !clientSecret || !redirectUri) {
      console.error('❌ [Outlook Callback] Missing environment variables')
      return NextResponse.redirect(
        new URL('/settings?error=config_missing', req.url)
      )
    }

    console.log('📤 [Outlook Callback] Exchanging code for tokens...')
    const tokenResponse = await fetch(
      'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          code,***REMOVED******REMOVED***
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      }
    )

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.text()
      console.error('❌ [Outlook Callback] Token exchange failed:', errorData)
      return NextResponse.redirect(
        new URL('/settings?error=token_exchange_failed', req.url)
      )
    }

    const tokens = await tokenResponse.json()
    console.log('✅ [Outlook Callback] Tokens received')
    console.log('  Access token:', !!tokens.access_token)
    console.log('  Refresh token:', !!tokens.refresh_token)
    console.log('  Expires in:', tokens.expires_in, 'seconds')

    // Get user's email address from Microsoft Graph API
    console.log('📤 [Outlook Callback] Fetching user email...')
    const profileResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: {
        Authorization: `Bearer ${tokens.access_token}`,
      },
    })

    if (!profileResponse.ok) {
      console.error('❌ [Outlook Callback] Failed to fetch user profile')
      return NextResponse.redirect(
        new URL('/settings?error=profile_fetch_failed', req.url)
      )
    }

    const profile = await profileResponse.json()
    const email = profile.mail || profile.userPrincipalName
    console.log('✅ [Outlook Callback] User email:', email)

    // Store in database
    const supabase = await createClient()

    // Get Supabase user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [Outlook Callback] User not found in Supabase:', userError)
      return NextResponse.redirect(
        new URL('/settings?error=user_not_found', req.url)
      )
    }
    console.log('✅ [Outlook Callback] Supabase user found:', user.id)

    // Calculate token expiry
    const tokenExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    // Store email account
    console.log('📝 [Outlook Callback] Storing email account...')
    const { data: emailAccount, error: insertError } = await supabase
      .from('email_accounts')
      .upsert(
        {
          user_id: user.id,
          provider: 'outlook',
          email,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expiry: tokenExpiry,
          account_name: email,
          is_primary: false, // User can set this later
          is_active: true,
          sync_enabled: true,
          daily_send_limit: 100,
          emails_sent_today: 0,
          last_reset_date: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,email',
        }
      )
      .select()
      .single()

    if (insertError) {
      console.error('❌ [Outlook Callback] Error storing email account:', insertError)
      return NextResponse.redirect(
        new URL('/settings?error=db_error', req.url)
      )
    }

    console.log('✅ [Outlook Callback] Email account stored successfully!')
    console.log('📊 [Outlook Callback] Account ID:', emailAccount.id)
    console.log('🎉 [Outlook Callback] ========== OAUTH COMPLETE ==========\n')

    // Redirect to settings page
    return NextResponse.redirect(
      new URL('/settings?success=outlook_connected', req.url)
    )
  } catch (error) {
    console.error('❌ [Outlook Callback] Unexpected error:', error)
    return NextResponse.redirect(
      new URL('/settings?error=unexpected', req.url)
    )
  }
}

