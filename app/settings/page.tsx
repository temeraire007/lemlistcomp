'use client'

import { UserButton, useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import type { EmailProvider } from '@/lib/supabase/types'

interface EmailAccount {
  id: string
  provider: EmailProvider
  email: string
  account_name: string | null
  is_primary: boolean
  is_active: boolean
  daily_send_limit: number
  emails_sent_today: number
  created_at: string
}

export default function SettingsPage() {
  const { user } = useUser()
  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [connectingProvider, setConnectingProvider] = useState<EmailProvider | null>(null)

  useEffect(() => {
    fetchEmailAccounts()
    
    // Check for OAuth callback messages
    const params = new URLSearchParams(window.location.search)
    const success = params.get('success')
    const errorParam = params.get('error')
    
    if (success === 'gmail_connected') {
      setSuccessMessage('Gmail account connected successfully!')
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    } else if (success === 'outlook_connected') {
      setSuccessMessage('Outlook account connected successfully!')
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    } else if (errorParam) {
      setError(getErrorMessage(errorParam))
      // Clean up URL
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  const fetchEmailAccounts = async () => {
    console.log('📧 [Settings] Fetching email accounts...')
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/email-accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch email accounts')
      }
      const data = await response.json()
      console.log('✅ [Settings] Email accounts fetched:', data.accounts?.length || 0)
      setEmailAccounts(data.accounts || [])
    } catch (error) {
      console.error('❌ [Settings] Error fetching email accounts:', error)
      setError('Failed to load email accounts')
    } finally {
      setIsLoading(false)
    }
  }

  const handleConnectEmail = async (provider: EmailProvider) => {
    console.log('🔗 [Settings] Connecting provider:', provider)
    setConnectingProvider(provider)
    setError(null)

    // Redirect to OAuth endpoint
    const authUrl = provider === 'gmail' ? '/api/auth/gmail' : '/api/auth/outlook'
    window.location.href = authUrl
  }

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Are you sure you want to disconnect this email account?')) return

    console.log('🔌 [Settings] Disconnecting account:', accountId)
    setError(null)

    try {
      const response = await fetch(`/api/email-accounts/${accountId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to disconnect account')
      }

      console.log('✅ [Settings] Account disconnected')
      setEmailAccounts(emailAccounts.filter(acc => acc.id !== accountId))
    } catch (error) {
      console.error('❌ [Settings] Error disconnecting account:', error)
      setError('Failed to disconnect account')
    }
  }

  const handleSetPrimary = async (accountId: string) => {
    console.log('⭐ [Settings] Setting primary account:', accountId)
    setError(null)

    try {
      const response = await fetch(`/api/email-accounts/${accountId}/primary`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to set primary account')
      }

      console.log('✅ [Settings] Primary account updated')
      await fetchEmailAccounts()
    } catch (error) {
      console.error('❌ [Settings] Error setting primary:', error)
      setError('Failed to set primary account')
    }
  }

  const getErrorMessage = (errorCode: string): string => {
    const errorMessages: Record<string, string> = {
      'no_code': 'Authorization failed: No code received',
      'unauthorized': 'Please sign in to connect an email account',
      'config_missing': 'OAuth configuration is incomplete',
      'token_exchange_failed': 'Failed to exchange authorization code for tokens',
      'profile_fetch_failed': 'Failed to fetch email account details',
      'user_not_found': 'User not found in database',
      'db_error': 'Failed to save email account to database',
      'unexpected': 'An unexpected error occurred',
    }
    return errorMessages[errorCode] || `Connection error: ${errorCode}`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center">
                <Link href="/" className="text-xl font-semibold text-gray-900">
                  Your Company
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link
                href="/campaigns"
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Campaigns
              </Link>
              <Link
                href="/settings"
                className="text-sm font-medium text-blue-700"
              >
                Settings
              </Link>
              <span className="text-sm text-gray-700">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Manage your email accounts and sending preferences
          </p>
        </div>

        {/* Success Banner */}
        {successMessage && (
          <div className="mb-6 rounded-md bg-green-50 p-4 border border-green-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-green-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-green-800">{successMessage}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setSuccessMessage(null)}
                  className="inline-flex rounded-md bg-green-50 p-1.5 text-green-500 hover:bg-green-100"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 border border-red-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <button
                  onClick={() => setError(null)}
                  className="inline-flex rounded-md bg-red-50 p-1.5 text-red-500 hover:bg-red-100"
                >
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Connected Email Accounts */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-5 border-b border-gray-200">
              <h2 className="text-lg font-medium text-gray-900">Email Accounts</h2>
              <p className="mt-1 text-sm text-gray-500">
                Connect your email accounts to send campaigns and track responses
              </p>
            </div>

            <div className="px-6 py-6">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-700 border-r-transparent"></div>
                    <p className="mt-2 text-sm text-gray-500">Loading accounts...</p>
                  </div>
                </div>
              ) : emailAccounts.length === 0 ? (
                <div className="text-center py-12">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                  <h3 className="mt-2 text-sm font-semibold text-gray-900">No email accounts</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Connect an email account to start sending campaigns
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {emailAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {account.provider === 'gmail' ? (
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <span className="text-red-600 font-semibold">G</span>
                            </div>
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <span className="text-blue-600 font-semibold">O</span>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-gray-900">{account.email}</p>
                            {account.is_primary && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                                Primary
                              </span>
                            )}
                            {!account.is_active && (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
                                Inactive
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {account.emails_sent_today} / {account.daily_send_limit} emails sent today
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!account.is_primary && (
                          <button
                            onClick={() => handleSetPrimary(account.id)}
                            className="text-sm text-blue-700 hover:text-blue-800 font-medium"
                          >
                            Set as Primary
                          </button>
                        )}
                        <button
                          onClick={() => handleDisconnect(account.id)}
                          className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Connect New Account Buttons */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Connect New Account</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => handleConnectEmail('gmail')}
                    disabled={connectingProvider === 'gmail'}
                    className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="h-6 w-6 rounded bg-red-100 flex items-center justify-center">
                      <span className="text-red-600 font-semibold text-sm">G</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {connectingProvider === 'gmail' ? 'Connecting...' : 'Connect Gmail'}
                    </span>
                  </button>
                  <button
                    onClick={() => handleConnectEmail('outlook')}
                    disabled={connectingProvider === 'outlook'}
                    className="flex items-center justify-center gap-3 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="h-6 w-6 rounded bg-blue-100 flex items-center justify-center">
                      <span className="text-blue-600 font-semibold text-sm">O</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {connectingProvider === 'outlook' ? 'Connecting...' : 'Connect Outlook'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 rounded-lg p-6 border border-blue-200">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-blue-700"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-900">About Email Connections</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Connect your Gmail or Outlook account to send campaigns directly</li>
                    <li>We use OAuth for secure authentication - we never see your password</li>
                    <li>Track opens, clicks, and replies automatically</li>
                    <li>Daily sending limits help maintain good sender reputation</li>
                    <li>You can connect multiple accounts and set a primary one</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

