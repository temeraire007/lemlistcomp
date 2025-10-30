'use client'

import { UserButton } from '@clerk/nextjs'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'

interface EmailAccount {
  id: string
  email: string
  provider: 'gmail' | 'outlook'
  is_active: boolean
}

interface CampaignSettings {
  email_account_id: string | null
  send_frequency_minutes: number
  send_start_hour: number
  send_end_hour: number
  days: string[]
  timezone: string
}

const WEEKDAYS = [
  { value: 'monday', label: 'Monday' },
  { value: 'tuesday', label: 'Tuesday' },
  { value: 'wednesday', label: 'Wednesday' },
  { value: 'thursday', label: 'Thursday' },
  { value: 'friday', label: 'Friday' },
  { value: 'saturday', label: 'Saturday' },
  { value: 'sunday', label: 'Sunday' },
]

const FREQUENCY_OPTIONS = [
  { value: 10, label: 'Every 10 minutes' },
  { value: 30, label: 'Every 30 minutes' },
  { value: 60, label: 'Every hour' },
  { value: 120, label: 'Every 2 hours' },
  { value: 180, label: 'Every 3 hours' },
  { value: 360, label: 'Every 6 hours' },
]

export default function CampaignSettingsPage() {
  const params = useParams()
  const campaignId = params?.id as string | undefined

  const [emailAccounts, setEmailAccounts] = useState<EmailAccount[]>([])
  const [settings, setSettings] = useState<CampaignSettings>({
    email_account_id: null,
    send_frequency_minutes: 60,
    send_start_hour: 9,
    send_end_hour: 17,
    days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    timezone: 'UTC',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (campaignId) {
      fetchEmailAccounts()
      fetchCampaignSettings()
    }
  }, [campaignId])

  const fetchEmailAccounts = async () => {
    console.log('📧 [Campaign Settings] Fetching email accounts...')
    try {
      const response = await fetch('/api/email-accounts')
      if (!response.ok) {
        throw new Error('Failed to fetch email accounts')
      }
      const data = await response.json()
      console.log('✅ [Campaign Settings] Email accounts fetched:', data.accounts?.length || 0)
      setEmailAccounts(data.accounts || [])
    } catch (error) {
      console.error('❌ [Campaign Settings] Error fetching email accounts:', error)
      setError('Failed to load email accounts')
    }
  }

  const fetchCampaignSettings = async () => {
    console.log('⚙️ [Campaign Settings] Fetching campaign settings...')
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/settings`)
      if (!response.ok) {
        throw new Error('Failed to fetch campaign settings')
      }
      const data = await response.json()
      console.log('✅ [Campaign Settings] Settings fetched:', data.settings)
      
      if (data.settings) {
        setSettings({
          email_account_id: data.settings.email_account_id,
          send_frequency_minutes: data.settings.send_frequency_minutes || 60,
          send_start_hour: data.settings.send_start_hour || 9,
          send_end_hour: data.settings.send_end_hour || 17,
          days: data.settings.days || ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
          timezone: data.settings.timezone || 'UTC',
        })
      }
    } catch (error) {
      console.error('❌ [Campaign Settings] Error fetching settings:', error)
      setError('Failed to load campaign settings')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSave = async () => {
    console.log('💾 [Campaign Settings] Saving settings...')
    setIsSaving(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save settings')
      }

      console.log('✅ [Campaign Settings] Settings saved successfully!')
      setSuccessMessage('Campaign settings saved successfully!')
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
    } catch (error) {
      console.error('❌ [Campaign Settings] Error saving settings:', error)
      setError(error instanceof Error ? error.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

  const toggleDay = (day: string) => {
    setSettings((prev) => ({
      ...prev,
      days: prev.days.includes(day)
        ? prev.days.filter((d) => d !== day)
        : [...prev.days, day],
    }))
  }

  const handleFrequencyChange = (minutes: number) => {
    setSettings((prev) => ({ ...prev, send_frequency_minutes: minutes }))
  }

  const handleTimeChange = (type: 'start' | 'end', value: number) => {
    if (type === 'start') {
      setSettings((prev) => ({ ...prev, send_start_hour: value }))
    } else {
      setSettings((prev) => ({ ...prev, send_end_hour: value }))
    }
  }

  if (!campaignId) {
    return <div>Invalid campaign</div>
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
                className="text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                Settings
              </Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/campaigns/${campaignId}`}
            className="text-sm font-medium text-blue-700 hover:text-blue-800"
          >
            ← Back to Campaign
          </Link>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Campaign Settings</h1>
          <p className="mt-2 text-sm text-gray-600">
            Configure sending schedule and email account for this campaign
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-700 border-r-transparent"></div>
              <p className="mt-2 text-sm text-gray-500">Loading settings...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Email Account Selection */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Email Account</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select which email account to use for sending emails in this campaign
              </p>

              {emailAccounts.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
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
                    Connect an email account to send campaigns
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/settings"
                      className="inline-flex items-center rounded-md bg-blue-700 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
                    >
                      Connect Email Account
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {emailAccounts.map((account) => (
                    <label
                      key={account.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        settings.email_account_id === account.id
                          ? 'border-blue-700 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="email_account"
                        value={account.id}
                        checked={settings.email_account_id === account.id}
                        onChange={(e) =>
                          setSettings((prev) => ({
                            ...prev,
                            email_account_id: e.target.value,
                          }))
                        }
                        className="h-4 w-4 text-blue-700 focus:ring-blue-700"
                      />
                      <div className="ml-3 flex items-center gap-3">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          account.provider === 'gmail' ? 'bg-red-100' : 'bg-blue-100'
                        }`}>
                          <span className={`text-sm font-semibold ${
                            account.provider === 'gmail' ? 'text-red-600' : 'text-blue-600'
                          }`}>
                            {account.provider === 'gmail' ? 'G' : 'O'}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{account.email}</p>
                          <p className="text-xs text-gray-500">
                            {account.provider === 'gmail' ? 'Gmail' : 'Outlook'}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Send Frequency */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Send Frequency</h2>
              <p className="text-sm text-gray-600 mb-4">
                How often should emails be sent to leads
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {FREQUENCY_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleFrequencyChange(option.value)}
                    className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.send_frequency_minutes === option.value
                        ? 'border-blue-700 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Sending Time Window */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Sending Time Window</h2>
              <p className="text-sm text-gray-600 mb-4">
                Emails will only be sent during these hours
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time
                  </label>
                  <select
                    value={settings.send_start_hour}
                    onChange={(e) => handleTimeChange('start', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700 sm:text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Time
                  </label>
                  <select
                    value={settings.send_end_hour}
                    onChange={(e) => handleTimeChange('end', parseInt(e.target.value))}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-700 focus:ring-blue-700 sm:text-sm"
                  >
                    {Array.from({ length: 24 }, (_, i) => (
                      <option key={i} value={i}>
                        {i.toString().padStart(2, '0')}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Weekdays */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Active Days</h2>
              <p className="text-sm text-gray-600 mb-4">
                Select which days of the week to send emails
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    onClick={() => toggleDay(day.value)}
                    className={`p-4 border-2 rounded-lg text-sm font-medium transition-colors ${
                      settings.days.includes(day.value)
                        ? 'border-blue-700 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-900 hover:border-gray-300'
                    }`}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end gap-3">
              <Link
                href={`/campaigns/${campaignId}`}
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                onClick={handleSave}
                disabled={isSaving || !settings.email_account_id}
                className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? (
                  <>
                    <div className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent mr-2"></div>
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

