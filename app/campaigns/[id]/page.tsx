import { UserButton } from '@clerk/nextjs'
import { currentUser } from '@clerk/nextjs/server'
import Link from 'next/link'

interface Activity {
  id: string
  type: 'sent' | 'opened' | 'answered'
  email: string
  timestamp: string
}

interface CampaignStats {
  sent: number
  opened: number
  answered: number
  scheduled: number
  unscheduled: number
}

interface Campaign {
  id: string
  name: string
}

import { createClient } from '@/lib/supabase/server'

async function getCampaignStats(campaignId: string, userId: string): Promise<{ campaign: Campaign; stats: CampaignStats } | null> {
  console.log('\n📊 [Dashboard] ========== FETCH STATS ==========')
  console.log('📊 [Dashboard] Campaign ID:', campaignId)
  console.log('📊 [Dashboard] User ID:', userId)
  
  try {
    const supabase = await createClient()

    // Get the Supabase user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [Dashboard] User not found:', userError)
      return null
    }
    console.log('✅ [Dashboard] User found:', user.id)

    // Get campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .select('id, name')
      .eq('id', campaignId)
      .eq('user_id', user.id)
      .single()

    if (campaignError || !campaign) {
      console.error('❌ [Dashboard] Campaign not found:', campaignError)
      return null
    }
    console.log('✅ [Dashboard] Campaign found:', campaign.name)

    // Get all leads for stats
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('status')
      .eq('campaign_id', campaignId)
      .eq('user_id', user.id)

    if (leadsError) {
      console.error('❌ [Dashboard] Error fetching leads:', leadsError)
      return null
    }

    console.log('📊 [Dashboard] Total leads:', leads?.length || 0)

    // Calculate stats
    const stats = {
      sent: 0,
      opened: 0,
      answered: 0,
      scheduled: 0,
      unscheduled: 0,
    }

    leads?.forEach((lead) => {
      switch (lead.status) {
        case 'sent':
          stats.sent++
          break
        case 'opened':
          stats.sent++
          stats.opened++
          break
        case 'replied':
          stats.sent++
          stats.opened++
          stats.answered++
          break
        case 'scheduled':
          stats.scheduled++
          break
        case 'lead':
          stats.unscheduled++
          break
      }
    })

    console.log('📊 [Dashboard] Stats calculated:', stats)
    console.log('🎉 [Dashboard] ========== STATS COMPLETE ==========\n')
    
    return { campaign, stats }
  } catch (error) {
    console.error('❌ [Dashboard] Error fetching stats:', error)
    return null
  }
}

async function getCampaignActivities(campaignId: string, userId: string): Promise<Activity[]> {
  console.log('\n📋 [Dashboard] ========== FETCH ACTIVITIES ==========')
  console.log('📋 [Dashboard] Campaign ID:', campaignId)
  console.log('📋 [Dashboard] User ID:', userId)
  
  try {
    const supabase = await createClient()

    // Get the Supabase user ID
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (userError || !user) {
      console.error('❌ [Dashboard] User not found:', userError)
      return []
    }
    console.log('✅ [Dashboard] User found:', user.id)

    // Get recent messages
    const { data: messages, error: messagesError } = await supabase
      .from('email_messages')
      .select(`
        id,
        direction,
        sent_at,
        lead_id,
        leads!inner(
          email,
          first_name,
          last_name,
          campaign_id
        )
      `)
      .eq('user_id', user.id)
      .eq('leads.campaign_id', campaignId)
      .order('sent_at', { ascending: false })
      .limit(10)

    if (messagesError) {
      console.error('❌ [Dashboard] Error fetching messages:', messagesError)
      return []
    }

    console.log('📋 [Dashboard] Messages found:', messages?.length || 0)

    // Transform to activities
    const activities = messages?.map((message: any) => {
      const lead = message.leads
      const email = lead.email
      
      const sentAt = new Date(message.sent_at)
      const now = new Date()
      const diffMs = now.getTime() - sentAt.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)
      
      let timestamp = ''
      if (diffMins < 1) {
        timestamp = 'Just now'
      } else if (diffMins < 60) {
        timestamp = `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`
      } else if (diffHours < 24) {
        timestamp = `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
      } else {
        timestamp = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
      }

      return {
        id: message.id,
        type: message.direction === 'outbound' ? 'sent' : 'answered',
        email,
        timestamp,
      } as Activity
    }) || []

    console.log('📋 [Dashboard] Activities transformed:', activities.length)
    console.log('🎉 [Dashboard] ========== ACTIVITIES COMPLETE ==========\n')
    
    return activities
  } catch (error) {
    console.error('❌ [Dashboard] Error fetching activities:', error)
    return []
  }
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'sent':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </div>
      )
    case 'opened':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
          </svg>
        </div>
      )
    case 'answered':
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
          <svg className="h-5 w-5 text-blue-700" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3" />
          </svg>
        </div>
      )
    default:
      return null
  }
}

const getActivityText = (type: string) => {
  switch (type) {
    case 'sent':
      return 'Email sent'
    case 'opened':
      return 'Email opened'
    case 'answered':
      return 'Answer received'
    default:
      return type
  }
}

export default async function CampaignDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await currentUser()
  const { id: campaignId } = await params

  if (!user?.id) {
    return <div>Unauthorized</div>
  }

  // Fetch campaign data directly from database
  const campaignData = await getCampaignStats(campaignId, user.id)
  const recentActivities = await getCampaignActivities(campaignId, user.id)

  // Fallback data if fetch fails
  const campaign = campaignData || {
    campaign: {
      id: campaignId,
      name: 'Campaign'
    },
    stats: {
      sent: 0,
      opened: 0,
      answered: 0,
      scheduled: 0,
      unscheduled: 0,
    }
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

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{campaign.campaign.name}</h1>
              <p className="mt-2 text-sm text-gray-600">
                Campaign overview and performance metrics
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/campaigns/${campaignId}/leads`}
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
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
                    d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                  />
                </svg>
                Leads
              </Link>
              <Link
                href={`/campaigns/${campaignId}/template`}
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
                    d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10"
                  />
                </svg>
                Template
              </Link>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-700"
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
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Sent</dt>
                    <dd className="text-lg font-semibold text-gray-900">{campaign.stats.sent}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Opened</dt>
                    <dd className="text-lg font-semibold text-gray-900">{campaign.stats.opened}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="1.5"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 3.75H6.912a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H15M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859M12 3v8.25m0 0l-3-3m3 3l3-3"
                    />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Answered</dt>
                    <dd className="text-lg font-semibold text-gray-900">{campaign.stats.answered}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-700"
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
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Scheduled</dt>
                    <dd className="text-lg font-semibold text-gray-900">{campaign.stats.scheduled}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg
                    className="h-6 w-6 text-blue-700"
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
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Unscheduled</dt>
                    <dd className="text-lg font-semibold text-gray-900">{campaign.stats.unscheduled}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Activity</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {getActivityText(activity.type)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {activity.email}
                        </p>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <p className="text-sm text-gray-500">{activity.timestamp}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

