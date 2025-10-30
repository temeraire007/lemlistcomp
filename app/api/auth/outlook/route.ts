import { NextResponse } from 'next/server'

/**
 * Initiates Outlook OAuth flow
 * GET /api/auth/outlook
 */
export async function GET() {
  console.log('\n🚀 [Outlook Auth] ========== INITIATE OAUTH ==========')
  
  try {
    const***REMOVED***
    const redirectUri = process.env.OUTLOOK_REDIRECT_URI
    
    if (!clientId || !redirectUri) {
      console.error('❌ [Outlook Auth] Missing environment variables')
      console.error('  OUTLOOK_***REMOVED*** !!clientId)
      console.error('  OUTLOOK_REDIRECT_URI:', !!redirectUri)
      return NextResponse.json(
        { error: 'Outlook OAuth is not configured' },
        { status: 500 }
      )
    }

    // Required Microsoft Graph API scopes
    const scopes = [
      'https://graph.microsoft.com/Mail.Send',
      'https://graph.microsoft.com/Mail.Read',
      'https://graph.microsoft.com/Mail.ReadWrite',
      'offline_access', // Required for refresh token
    ]

    // Build OAuth URL
    const authUrl = new URL('https://login.microsoftonline.com/common/oauth2/v2.0/authorize')
    authUrl.searchParams.set('client_id', clientId)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', scopes.join(' '))
    authUrl.searchParams.set('response_mode', 'query')

    console.log('✅ [Outlook Auth] OAuth URL generated')
    console.log('🔗 [Outlook Auth] Redirect URI:', redirectUri)
    console.log('📋 [Outlook Auth] Scopes:', scopes.join(', '))
    console.log('🎉 [Outlook Auth] ========== REDIRECTING TO MICROSOFT ==========\n')

    // Redirect to Microsoft OAuth
    return NextResponse.redirect(authUrl.toString())
  } catch (error) {
    console.error('❌ [Outlook Auth] Error initiating OAuth:', error)
    return NextResponse.json(
      { error: 'Failed to initiate Outlook OAuth' },
      { status: 500 }
    )
  }
}

