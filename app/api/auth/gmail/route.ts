import { NextResponse } from 'next/server'

/**
 * Initiates Gmail OAuth flow
 * GET /api/auth/gmail
 */
export async function GET() {
  console.log('\n🚀 [Gmail Auth] ========== INITIATE OAUTH ==========')
  
  try {
    const***REMOVED***
    const redirectUri = process.env.GMAIL_REDIRECT_URI
    
    if (!clientId || !redirectUri) {
      console.error('❌ [Gmail Auth] Missing environment variables')
      console.error('  GMAIL_***REMOVED*** !!clientId)
      console.error('  GMAIL_REDIRECT_URI:', !!redirectUri)
      return NextResponse.json(
        { error: 'Gmail OAuth is not configured' },
        { status: 500 }
      )
    }

    // Required Gmail API scopes
    const scopes = [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
    ]

    // Build OAuth URL
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('access_type', 'offline') // Required for refresh token
    authUrl.searchParams.set('prompt', 'consent') // Force consent screen to get refresh token

    console.log('✅ [Gmail Auth] OAuth URL generated')
    console.log('🔗 [Gmail Auth] Redirect URI:', redirectUri)
    console.log('📋 [Gmail Auth] Scopes:', scopes.join(', '))
    console.log('🎉 [Gmail Auth] ========== REDIRECTING TO GOOGLE ==========\n')

    // Redirect to Google OAuth
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('❌ [Gmail Auth] Error initiating OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Gmail OAuth' },
      { status: 500 }
    )
  }
}

