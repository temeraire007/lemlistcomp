'use client'

import { UserButton } from '@clerk/nextjs'
import { useUser } from '@clerk/nextjs'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'

interface Lead {
  id: number
  firstName: string
  lastName: string
  company: string
  email: string
}

// Mock data for leads
const initialLeads: Lead[] = [
  { id: 1, firstName: 'John', lastName: 'Doe', company: 'Acme Corp', email: 'john.doe@acme.com' },
  { id: 2, firstName: 'Jane', lastName: 'Smith', company: 'Tech Solutions', email: 'jane.smith@techsolutions.com' },
  { id: 3, firstName: 'Mike', lastName: 'Johnson', company: 'Innovation Labs', email: 'mike.j@innovationlabs.com' },
  { id: 4, firstName: 'Sarah', lastName: 'Williams', company: 'Digital Ventures', email: 'sarah.w@digitalventures.com' },
  { id: 5, firstName: 'David', lastName: 'Brown', company: 'StartUp Inc', email: 'david.brown@startupinc.com' },
  { id: 6, firstName: 'Emily', lastName: 'Davis', company: 'Global Enterprises', email: 'emily.davis@globalent.com' },
  { id: 7, firstName: 'Robert', lastName: 'Wilson', company: 'Future Systems', email: 'robert.w@futuresystems.com' },
  { id: 8, firstName: 'Lisa', lastName: 'Anderson', company: 'Cloud Services', email: 'lisa.a@cloudservices.com' },
  { id: 9, firstName: 'James', lastName: 'Taylor', company: 'Data Dynamics', email: 'james.taylor@datadynamics.com' },
  { id: 10, firstName: 'Maria', lastName: 'Garcia', company: 'Web Solutions', email: 'maria.g@websolutions.com' },
]

export default function LeadsPage() {
  const { user } = useUser()
  const params = useParams()
  const campaignId = params.id

  const [leads, setLeads] = useState<Lead[]>(initialLeads)
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>(initialLeads)
  const [selectedLeads, setSelectedLeads] = useState<number[]>([])
  const [editingCell, setEditingCell] = useState<{ id: number; field: keyof Lead } | null>(null)
  const [editValue, setEditValue] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newLead, setNewLead] = useState<Omit<Lead, 'id'>>({
    firstName: '',
    lastName: '',
    company: '',
    email: '',
  })

  // Filter leads based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredLeads(leads)
    } else {
      const filtered = leads.filter(lead =>
        lead.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredLeads(filtered)
    }
  }, [searchTerm, leads])

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedLeads(filteredLeads.map(lead => lead.id))
    } else {
      setSelectedLeads([])
    }
  }

  const handleSelectLead = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedLeads([...selectedLeads, id])
    } else {
      setSelectedLeads(selectedLeads.filter(leadId => leadId !== id))
    }
  }

  const handleDeleteSelected = () => {
    if (selectedLeads.length === 0) return
    if (confirm(`Are you sure you want to delete ${selectedLeads.length} lead(s)?`)) {
      setLeads(leads.filter(lead => !selectedLeads.includes(lead.id)))
      setSelectedLeads([])
    }
  }

  const handleDoubleClick = (id: number, field: keyof Lead, currentValue: string) => {
    if (field === 'id') return // Don't allow editing ID
    setEditingCell({ id, field })
    setEditValue(currentValue)
  }

  const handleSaveEdit = () => {
    if (!editingCell) return
    setLeads(leads.map(lead =>
      lead.id === editingCell.id
        ? { ...lead, [editingCell.field]: editValue }
        : lead
    ))
    setEditingCell(null)
    setEditValue('')
  }

  const handleCancelEdit = () => {
    setEditingCell(null)
    setEditValue('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveEdit()
    } else if (e.key === 'Escape') {
      handleCancelEdit()
    }
  }

  const handleAddLead = () => {
    if (!newLead.firstName || !newLead.lastName || !newLead.email) {
      alert('Please fill in all required fields')
      return
    }
    const newId = Math.max(...leads.map(l => l.id)) + 1
    setLeads([...leads, { ...newLead, id: newId }])
    setNewLead({ firstName: '', lastName: '', company: '', email: '' })
    setShowAddModal(false)
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
              <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
              <p className="mt-2 text-sm text-gray-600">
                {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} in this campaign
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
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
              Add Lead
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <svg
                  className="h-5 w-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="1.5"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search leads..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full rounded-md border-0 py-2 pl-10 pr-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
              />
            </div>
          </div>

          {selectedLeads.length > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="inline-flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
              Delete {selectedLeads.length} selected
            </button>
          )}
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="w-12 px-6 py-3">
                    <input
                      type="checkbox"
                      checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-700"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    First Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className={`hover:bg-gray-50 ${selectedLeads.includes(lead.id) ? 'bg-blue-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedLeads.includes(lead.id)}
                        onChange={(e) => handleSelectLead(lead.id, e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-700"
                      />
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onDoubleClick={() => handleDoubleClick(lead.id, 'firstName', lead.firstName)}
                    >
                      {editingCell?.id === lead.id && editingCell?.field === 'firstName' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSaveEdit}
                          autoFocus
                          className="w-full rounded border-blue-700 border-2 px-2 py-1 text-sm focus:outline-none"
                        />
                      ) : (
                        lead.firstName
                      )}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onDoubleClick={() => handleDoubleClick(lead.id, 'lastName', lead.lastName)}
                    >
                      {editingCell?.id === lead.id && editingCell?.field === 'lastName' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSaveEdit}
                          autoFocus
                          className="w-full rounded border-blue-700 border-2 px-2 py-1 text-sm focus:outline-none"
                        />
                      ) : (
                        lead.lastName
                      )}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 cursor-pointer"
                      onDoubleClick={() => handleDoubleClick(lead.id, 'company', lead.company)}
                    >
                      {editingCell?.id === lead.id && editingCell?.field === 'company' ? (
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSaveEdit}
                          autoFocus
                          className="w-full rounded border-blue-700 border-2 px-2 py-1 text-sm focus:outline-none"
                        />
                      ) : (
                        lead.company
                      )}
                    </td>
                    <td
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 cursor-pointer"
                      onDoubleClick={() => handleDoubleClick(lead.id, 'email', lead.email)}
                    >
                      {editingCell?.id === lead.id && editingCell?.field === 'email' ? (
                        <input
                          type="email"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyDown}
                          onBlur={handleSaveEdit}
                          autoFocus
                          className="w-full rounded border-blue-700 border-2 px-2 py-1 text-sm focus:outline-none"
                        />
                      ) : (
                        lead.email
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLeads.length === 0 && (
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
                  d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-gray-900">No leads found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Try adjusting your search terms' : 'Get started by adding a new lead'}
              </p>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="mt-6 bg-blue-50 rounded-lg p-4">
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
              <h3 className="text-sm font-medium text-blue-900">Tips</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc pl-5 space-y-1">
                  <li>Double-click any cell to edit it inline</li>
                  <li>Press Enter to save changes, Escape to cancel</li>
                  <li>Select multiple leads using checkboxes to delete them in bulk</li>
                  <li>Use the search bar to filter leads by any field</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add New Lead</h2>
            </div>
            <div className="px-6 py-4 space-y-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="firstName"
                  value={newLead.firstName}
                  onChange={(e) => setNewLead({ ...newLead, firstName: e.target.value })}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                  placeholder="John"
                />
              </div>
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="lastName"
                  value={newLead.lastName}
                  onChange={(e) => setNewLead({ ...newLead, lastName: e.target.value })}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                  placeholder="Doe"
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  id="company"
                  value={newLead.company}
                  onChange={(e) => setNewLead({ ...newLead, company: e.target.value })}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                  placeholder="Acme Corp"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  value={newLead.email}
                  onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                  className="block w-full rounded-md border-0 py-2 px-3 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-700 sm:text-sm sm:leading-6"
                  placeholder="john.doe@acme.com"
                />
              </div>
            </div>
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-lg flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewLead({ firstName: '', lastName: '', company: '', email: '' })
                }}
                className="inline-flex items-center rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLead}
                className="inline-flex items-center rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-600"
              >
                Add Lead
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

