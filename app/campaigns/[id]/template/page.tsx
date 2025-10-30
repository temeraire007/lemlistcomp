'use client'

import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'

export default function TemplateEditorPage() {
  const { user } = useUser()
  const params = useParams()
  const campaignId = params.id
  const editorRef = useRef<HTMLDivElement>(null)
  
  const [subject, setSubject] = useState('Introducing our new product')
  const [content, setContent] = useState(`Hi {{firstName}},

I hope this email finds you well.

I wanted to reach out because I believe our solution could help {{company}} achieve better results.

Best regards,
{{senderName}}`)

  const [showVariableMenu, setShowVariableMenu] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')

  const variables = [
    { name: 'firstName', description: 'Recipient first name' },
    { name: 'lastName', description: 'Recipient last name' },
    { name: 'email', description: 'Recipient email' },
    { name: 'company', description: 'Company name' },
    { name: 'senderName', description: 'Your name' },
    { name: 'senderEmail', description: 'Your email' },
  ]

  const insertVariable = (variable: string) => {
    const textarea = document.getElementById('content') as HTMLTextAreaElement
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const text = content
    const before = text.substring(0, start)
    const after = text.substring(end)
    setContent(before + `{{${variable}}}` + after)
    setShowVariableMenu(false)
    
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + variable.length + 4, start + variable.length + 4)
    }, 0)
  }

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value)
  }

  const handleSave = async () => {
    console.log('💾 [Template] Starting save process...')
    console.log('💾 [Template] Campaign ID:', campaignId)
    console.log('💾 [Template] Subject:', subject)
    console.log('💾 [Template] Content length:', content.length)
    
    setSaveStatus('saving')
    
    try {
      console.log('📤 [Template] Calling API...')
      const response = await fetch(`/api/campaigns/${campaignId}/template`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Campaign Template',
          subject,
          content,
          preview_text: subject,
        }),
      })

      console.log('📥 [Template] API response status:', response.status)

      if (!response.ok) {
        const error = await response.json()
        console.error('❌ [Template] API error:', error)
        throw new Error(error.error || 'Failed to save template')
      }

      const data = await response.json()
      console.log('✅ [Template] Template saved successfully!')
      console.log('📊 [Template] Response data:', data)
      
      setSaveStatus('saved')
      
      // Reset to idle after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle')
      }, 3000)
    } catch (error) {
      console.error('❌ [Template] Error saving template:', error)
      setSaveStatus('idle')
      alert(error instanceof Error ? error.message : 'Failed to save template')
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

      <main className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Link
            href={`/campaigns/${campaignId}`}
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
            Back to Campaign
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Email Template</h1>
              <p className="mt-2 text-sm text-gray-600">
                Design and customize your email template
              </p>
            </div>
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 transition-colors ${
                saveStatus === 'saved' 
                  ? 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600' 
                  : 'bg-blue-700 hover:bg-blue-600 focus-visible:outline-blue-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <div className="inline-block h-4 w-4 mr-2 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                  Saving...
                </>
              ) : saveStatus === 'saved' ? (
                <>
                  <svg
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth="2"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Saved!
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
                      d="M16.5 3.75V16.5L12 14.25 7.5 16.5V3.75m9 0H18A2.25 2.25 0 0120.25 6v12A2.25 2.25 0 0118 20.25H6A2.25 2.25 0 013.75 18V6A2.25 2.25 0 016 3.75h1.5m9 0h-9"
                    />
                  </svg>
                  Save Template
                </>
              )}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Subject Line */}
            <div className="bg-white shadow rounded-lg p-6">
              <label htmlFor="subject" className="block text-sm font-medium text-gray-900 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                placeholder="Enter your email subject"
              />
            </div>

            {/* Editor */}
            <div className="bg-white shadow rounded-lg">
              <div className="border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('content') as HTMLTextAreaElement
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const selectedText = content.substring(start, end)
                        const before = content.substring(0, start)
                        const after = content.substring(end)
                        setContent(before + `**${selectedText}**` + after)
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Bold"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('content') as HTMLTextAreaElement
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const selectedText = content.substring(start, end)
                        const before = content.substring(0, start)
                        const after = content.substring(end)
                        setContent(before + `*${selectedText}*` + after)
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Italic"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L10.5 19.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 4.5h7.5" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 19.5h7.5" />
                      </svg>
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-1 border-r border-gray-200 pr-2">
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('content') as HTMLTextAreaElement
                        const start = textarea.selectionStart
                        const lines = content.substring(0, start).split('\n')
                        const currentLine = lines[lines.length - 1]
                        if (!currentLine.trim().startsWith('- ')) {
                          const before = content.substring(0, start - currentLine.length)
                          const after = content.substring(start)
                          setContent(before + '- ' + currentLine + after)
                        }
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Bullet List"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const textarea = document.getElementById('content') as HTMLTextAreaElement
                        const start = textarea.selectionStart
                        const end = textarea.selectionEnd
                        const selectedText = content.substring(start, end)
                        const before = content.substring(0, start)
                        const after = content.substring(end)
                        setContent(before + `[${selectedText}](url)` + after)
                      }}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded"
                      title="Insert Link"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                      </svg>
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowVariableMenu(!showVariableMenu)}
                      className="inline-flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                      </svg>
                      Insert Variable
                    </button>

                    {showVariableMenu && (
                      <div className="absolute left-0 mt-2 w-64 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                        <div className="p-2">
                          {variables.map((variable) => (
                            <button
                              key={variable.name}
                              type="button"
                              onClick={() => insertVariable(variable.name)}
                              className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100"
                            >
                              <div className="font-medium text-gray-900">
                                {`{{${variable.name}}}`}
                              </div>
                              <div className="text-xs text-gray-500">
                                {variable.description}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6">
                <textarea
                  id="content"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={16}
                  className="block w-full rounded-md border-0 py-3 px-4 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6 font-mono"
                  placeholder="Write your email content here..."
                />
              </div>
            </div>

            {/* Preview - Below Editor */}
            <div className="bg-white shadow rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preview</h3>
              <div className="border border-gray-200 rounded-lg p-6 bg-gray-50">
                <div className="font-semibold text-gray-900 mb-3 pb-3 border-b border-gray-300 text-base">
                  {subject}
                </div>
                <div className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">
                  {content.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
                    const examples: Record<string, string> = {
                      firstName: 'John',
                      lastName: 'Doe',
                      email: 'john@example.com',
                      company: 'Acme Corp',
                      senderName: 'Jane Smith',
                      senderEmail: 'jane@yourcompany.com',
                    }
                    return examples[p1] || match
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">

            {/* Tips */}
            <div className="bg-blue-50 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Tips</h3>
              <ul className="text-xs text-blue-700 space-y-2">
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Use variables to personalize emails</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Keep subject lines under 50 characters</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Include a clear call-to-action</span>
                </li>
                <li className="flex items-start">
                  <span className="mr-2">•</span>
                  <span>Test your template before sending</span>
                </li>
              </ul>
            </div>

            {/* Variables Guide */}
            <div className="bg-white shadow rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Available Variables</h3>
              <div className="space-y-2 text-xs">
                {variables.map((variable) => (
                  <div key={variable.name} className="text-gray-600">
                    <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded">
                      {`{{${variable.name}}}`}
                    </code>
                    <div className="text-gray-500 mt-0.5">{variable.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

