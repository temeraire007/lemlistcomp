import { UserButton } from '@clerk/nextjs'
import { currentUser, auth } from '@clerk/nextjs/server'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

async function getCampaigns() {
  console.log('\n📋 [CampaignsPage] Fetching campaigns...')
  
  const { userId } = await auth()
  
  if (!userId) {
    console.log('⏸️ [CampaignsPage] No user authenticated')
    return []
  }

  const supabase = await createClient()
  
  // Get user's Supabase ID
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single()

  if (userError || !user) {
    console.error('❌ [CampaignsPage] User not found:', userError)
    return []
  }

  console.log('✅ [CampaignsPage] User found:', user.id)

  // Fetch campaigns
  const { data: campaigns, error: campaignsError } = await supabase
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (campaignsError) {
    console.error('❌ [CampaignsPage] Error fetching campaigns:', campaignsError)
    return []
  }

  console.log('✅ [CampaignsPage] Campaigns fetched:', campaigns?.length || 0)
  return campaigns || []
}

export default async function CampaignsPage() {
  const user = await currentUser()
  const campaigns = await getCampaigns()

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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
            <p className="mt-2 text-sm text-gray-600">
              Manage your email outreach campaigns
            </p>
          </div>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700"
          >
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
            Add Campaign
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-2">
          {campaigns.map((campaign) => {
            // For now, use placeholder data for stats
            // TODO: Calculate from actual leads and activities
            const totalLeads = 0
            const sent = 0
            const scheduled = 0
            const unscheduled = 0
            const sentPercentage = totalLeads > 0 ? Math.round((sent / totalLeads) * 100) : 0
            const scheduledPercentage = totalLeads > 0 ? Math.round((scheduled / totalLeads) * 100) : 0
            const unscheduledPercentage = totalLeads > 0 ? Math.round((unscheduled / totalLeads) * 100) : 0

            return (
              <div key={campaign.id} className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {campaign.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {totalLeads} leads
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-blue-700 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Sent</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {sent}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({sentPercentage}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-blue-700 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Scheduled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {scheduled}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({scheduledPercentage}%)
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-blue-700 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          strokeWidth="1.5"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">Unscheduled</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                          {unscheduled}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({unscheduledPercentage}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
                    <Link
                      href={`/campaigns/${campaign.id}`}
                      className="text-sm font-medium text-blue-700 hover:text-blue-600"
                    >
                      View details →
                    </Link>
                    <div className="flex items-center gap-4">
                      <Link
                        href={`/campaigns/${campaign.id}/leads`}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        Leads
                      </Link>
                      <Link
                        href={`/campaigns/${campaign.id}/template`}
                        className="text-sm font-medium text-gray-600 hover:text-gray-900"
                      >
                        Template
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {campaigns.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
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
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No campaigns</h3>
            <p className="mt-1 text-sm text-gray-500">Get started by creating a new campaign.</p>
            <div className="mt-6">
              <Link
                href="/campaigns/new"
                className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
              >
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
                Add Campaign
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

