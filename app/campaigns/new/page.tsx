'use client'

import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCampaignPage() {
  const { user } = useUser()
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: '',
    subject: '',
    message: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('📝 [NewCampaign] Form submitted:', formData)
    setIsSubmitting(true)
    
    try {
      console.log('📤 [NewCampaign] Calling API to create campaign...')
      
      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          status: 'draft', // New campaigns start as draft
        }),
      })

      console.log('📥 [NewCampaign] API response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ [NewCampaign] API error:', error)
        throw new Error(error.error || 'Failed to create campaign')
      }

      const data = await response.json()
      console.log('✅ [NewCampaign] Campaign created successfully!')
      console.log('📊 [NewCampaign] Campaign data:', data.campaign)
      
      // Redirect to campaigns page after creation
      console.log('🔄 [NewCampaign] Redirecting to campaigns page...')
      router.push('/campaigns')
    } catch (error) {
      console.error('❌ [NewCampaign] Error creating campaign:', error)
      alert('Failed to create campaign. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
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
              <span className="text-sm text-gray-700">
                {user?.firstName || user?.emailAddresses[0]?.emailAddress}
              </span>
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link
            href="/campaigns"
            className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 mb-4"
          >
            <svg
              className="h-5 w-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
              />
            </svg>
            Back to Campaigns
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create New Campaign</h1>
          <p className="mt-2 text-sm text-gray-600">
            Set up your email outreach campaign
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg">
          <div className="px-6 py-6 space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-900">
                Campaign Name <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                  placeholder="e.g., Product Launch Campaign"
                />
              </div>
            </div>

            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-gray-900">
                Email Subject <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="subject"
                  id="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                  placeholder="e.g., Introducing our new product"
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                You can use variables like {'{{firstName}}'} or {'{{company}}'}
              </p>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-900">
                Email Message <span className="text-red-500">*</span>
              </label>
              <div className="mt-2">
                <textarea
                  name="message"
                  id="message"
                  required
                  rows={8}
                  value={formData.message}
                  onChange={handleChange}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                  placeholder="Hi {{firstName}},&#10;&#10;I hope this email finds you well..."
                />
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Write your email template. Use variables to personalize your message.
              </p>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-sm font-medium text-blue-900">Tips for a great campaign</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Keep your subject line short and engaging</li>
                      <li>Personalize your message with variables</li>
                      <li>Include a clear call-to-action</li>
                      <li>Test your email before sending to all leads</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex items-center justify-end gap-3">
            <Link
              href="/campaigns"
              className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Create Campaign
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Next Steps</h2>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs mr-3">
                1
              </span>
              <p>Create your campaign with a compelling subject and message</p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs mr-3">
                2
              </span>
              <p>Import or add leads to your campaign</p>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-blue-100 text-blue-700 font-semibold text-xs mr-3">
                3
              </span>
              <p>Schedule your emails and monitor campaign performance</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

