# Database Structure

## Overview

The application uses **two separate tables** for email management:

1. **`email_templates`** - Reusable email templates
2. **`email_messages`** - Actual emails sent/received with leads (CRM-style inbox)

This separation allows you to:
- Create and edit templates without affecting sent messages
- Track complete conversation history with leads
- Store both outbound and inbound emails
- Maintain threading for conversations

---

## Table: `email_templates`

**Purpose:** Store reusable email templates for campaigns.

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique template identifier |
| `user_id` | UUID | Owner of the template |
| `campaign_id` | UUID (nullable) | Optional: Link to specific campaign |
| `name` | TEXT | Template name (e.g., "Welcome Email #1") |
| `subject` | TEXT | Email subject line (can include variables) |
| `content` | TEXT | Email body content (can include variables) |
| `preview_text` | TEXT (nullable) | Email preview/preheader text |
| `variables` | TEXT[] (nullable) | Array of variable names (e.g., `['firstName', 'company']`) |
| `status` | TEXT | `'draft'`, `'active'`, or `'archived'` |
| `category` | TEXT (nullable) | Category for organization (e.g., "welcome", "follow-up") |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Example Usage

```typescript
// Create a new template
const template = {
  user_id: 'user-uuid',
  campaign_id: 'campaign-uuid',
  name: 'Welcome Email',
  subject: 'Hi {{firstName}}, welcome aboard!',
  content: 'Dear {{firstName}},\n\nWelcome to {{company}}...',
  preview_text: 'Get started with your account',
  variables: ['firstName', 'company'],
  status: 'active',
  category: 'welcome'
}
```

---

## Table: `email_messages`

**Purpose:** Track actual emails sent/received with leads (CRM-style inbox with threading).

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique message identifier |
| `lead_id` | UUID | Reference to the lead (recipient/sender) |
| `user_id` | UUID | User who sent/received the email |
| `direction` | TEXT | `'outbound'` or `'inbound'` |
| `message_id` | TEXT (nullable) | Unique message ID from email provider |
| `thread_id` | TEXT (nullable) | Thread ID for grouping conversation emails |
| `subject` | TEXT (nullable) | Email subject line |
| `html_body` | TEXT (nullable) | HTML version of the email body |
| `text_body` | TEXT (nullable) | Plain text version of the email body |
| `sent_at` | TIMESTAMP (nullable) | When the email was sent/received |
| `headers` | JSONB (nullable) | Email headers stored as JSON |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### Example Usage

```typescript
// Outbound email sent to a lead
const outboundMessage = {
  lead_id: 'lead-uuid',
  user_id: 'user-uuid',
  direction: 'outbound',
  message_id: '<abc123@mail.provider.com>',
  thread_id: 'thread-xyz',
  subject: 'Re: Your inquiry',
  html_body: '<p>Hi John,</p><p>Thanks for reaching out...</p>',
  text_body: 'Hi John,\n\nThanks for reaching out...',
  sent_at: '2025-10-31T09:15:00Z',
  headers: {
    'from': 'you@company.com',
    'to': 'john@example.com',
    'reply-to': 'you@company.com'
  }
}

// Inbound reply from lead
const inboundMessage = {
  lead_id: 'lead-uuid',
  user_id: 'user-uuid',
  direction: 'inbound',
  message_id: '<reply456@mail.provider.com>',
  thread_id: 'thread-xyz', // Same thread
  subject: 'Re: Your inquiry',
  html_body: '<p>Thanks for the quick response!</p>',
  text_body: 'Thanks for the quick response!',
  sent_at: '2025-10-31T10:30:00Z',
  headers: {
    'from': 'john@example.com',
    'to': 'you@company.com',
    'in-reply-to': '<abc123@mail.provider.com>'
  }
}
```

---

## Relationships

```
users (1) ──────┬──────> (many) campaigns
                │
                ├──────> (many) email_templates
                │
                └──────> (many) email_messages

campaigns (1) ──> (many) email_templates

leads (1) ──────> (many) email_messages

email_templates = Reusable templates (not linked to messages directly)
email_messages = Actual conversation history with leads
```

---

## Why Two Tables?

### ✅ Benefits of Separation

1. **Template Reusability**
   - Create and edit templates independently
   - Use templates as starting points for emails
   - Not tied to specific conversations

2. **Complete Conversation History**
   - `email_messages` stores both **outbound** and **inbound** emails
   - Track entire conversation threads with each lead
   - Historical accuracy: messages never change

3. **CRM-Style Inbox**
   - View all communication with a lead in one place
   - Thread emails using `thread_id`
   - Store email metadata (headers, message_id)

4. **Bidirectional Communication**
   - `direction` field distinguishes sent vs. received
   - Track replies from leads
   - Full email conversation context

5. **Flexibility**
   - Store both HTML and plain text versions
   - Headers stored as JSON for any metadata
   - Works with any email provider (via `message_id`)

---

## Running the Migrations

To create these tables, run the following in your Supabase SQL Editor:

```sql
-- 1. Create email_templates table
-- Copy and run: supabase/migrations/004_create_email_templates_table.sql

-- 2. Create email_messages table
-- Copy and run: supabase/migrations/005_create_email_messages_table.sql
```

Or if using Supabase CLI:

```bash
# Apply all pending migrations
supabase db push
```

---

## Next Steps

1. ✅ Run the migrations in Supabase
2. 🔨 Create the `leads` table (needed for `email_messages.lead_id`)
3. 🔨 Build the template editor UI
4. 🔨 Connect template creation to the database
5. 🔨 Implement email sending/receiving logic
6. 🔨 Build inbox UI to view `email_messages` by thread

