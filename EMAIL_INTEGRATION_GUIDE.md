# Email Integration Guide

## 📧 **Overview**

This guide explains the email account integration system that allows users to connect their Gmail or Outlook accounts for sending campaigns and tracking responses.

---

## 🗂️ **Database Schema**

### **Table: `email_accounts`**

Stores connected email accounts with OAuth tokens and settings.

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique account identifier |
| `user_id` | UUID | Reference to users table |
| `provider` | ENUM | `'gmail'` or `'outlook'` |
| `email` | TEXT | Email address |
| `access_token` | TEXT | OAuth access token (encrypt in production!) |
| `refresh_token` | TEXT | OAuth refresh token |
| `token_expiry` | TIMESTAMP | When access token expires |
| `account_name` | TEXT | Display name (e.g., "John Doe") |
| `is_primary` | BOOLEAN | Primary sending account |
| `is_active` | BOOLEAN | Account is active |
| `track_opens` | BOOLEAN | Track email opens |
| `track_clicks` | BOOLEAN | Track link clicks |
| `track_replies` | BOOLEAN | Track email replies |
| `last_sync_at` | TIMESTAMP | Last sync with provider |
| `sync_enabled` | BOOLEAN | Auto-sync enabled |
| `daily_send_limit` | INTEGER | Max emails per day (default: 100) |
| `emails_sent_today` | INTEGER | Emails sent today |
| `last_reset_date` | DATE | Last reset of daily counter |

---

## 🎨 **User Interface**

### **Settings Page** (`/settings`)

**Features:**
- ✅ View all connected email accounts
- ✅ Connect Gmail or Outlook accounts
- ✅ Set primary sending account
- ✅ Disconnect accounts
- ✅ View daily sending limits and usage
- ✅ See active/inactive status

**UI Components:**
- Email account cards with provider icons
- "Connect Gmail" and "Connect Outlook" buttons
- Primary badge for default sending account
- Daily usage stats (e.g., "45 / 100 emails sent today")
- Info box explaining email connections

---

## 🔌 **API Endpoints**

### **1. GET /api/email-accounts**
Fetch all email accounts for the authenticated user.

**Response:**
```json
{
  "accounts": [
    {
      "id": "account-uuid",
      "provider": "gmail",
      "email": "john@example.com",
      "account_name": "John Doe",
      "is_primary": true,
      "is_active": true,
      "daily_send_limit": 100,
      "emails_sent_today": 45,
      "created_at": "2025-10-30T..."
    }
  ]
}
```

**Note:** Tokens are excluded from the response for security.

### **2. POST /api/email-accounts**
Create a new email account connection (called after OAuth flow).

**Request Body:**
```json
{
  "provider": "gmail",
  "email": "john@example.com",
  "access_token": "ya29.a0...",
  "refresh_token": "1//0gH...",
  "token_expiry": "2025-10-30T12:00:00Z",
  "account_name": "John Doe"
}
```

**Features:**
- First account is automatically set as primary
- Validates required fields
- Stores tokens securely (encrypt in production!)

### **3. DELETE /api/email-accounts/[id]**
Disconnect an email account.

**Response:**
```json
{
  "success": true
}
```

### **4. POST /api/email-accounts/[id]/primary**
Set an account as the primary sending account.

**Process:**
1. Reset all accounts to non-primary
2. Set selected account as primary

---

## 🔐 **OAuth Integration** (To Be Implemented)

### **Gmail OAuth Flow**

1. **Register OAuth App:**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create a new project
   - Enable Gmail API
   - Configure OAuth consent screen
   - Create OAuth 2.0 Client ID
   - Add authorized redirect URI: `https://yourdomain.com/api/auth/gmail/callback`

2. **Required Scopes:**
   ```
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.modify
   ```

3. **Environment Variables:**
   ```env
   GMAIL_***REMOVED***
   GMAIL_***REMOVED***
   GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
   ```

4. **Implementation Steps:** ✅ **COMPLETED**
   - ✅ Created `/api/auth/gmail` endpoint to initiate OAuth
   - ✅ Created `/api/auth/gmail/callback` to handle the OAuth callback
   - ✅ Exchange authorization code for tokens
   - ✅ Store tokens in `email_accounts` table
   - ✅ Redirect user to settings page with success message

### **Outlook OAuth Flow** ✅ **COMPLETED**

1. **Register OAuth App:**
   - Go to [Azure Portal](https://portal.azure.com)
   - Register a new app in Azure AD
   - Add Microsoft Graph API permissions:
     - `Mail.Send`
     - `Mail.Read`
     - `Mail.ReadWrite`
   - Add redirect URI: `http://localhost:3000/api/auth/outlook/callback` (for local dev)

2. **Required Scopes:**
   ```
   https://graph.microsoft.com/Mail.Send
   https://graph.microsoft.com/Mail.Read
   https://graph.microsoft.com/Mail.ReadWrite
   offline_access
   ```

3. **Environment Variables:**
   ```env
   OUTLOOK_***REMOVED***
   OUTLOOK_***REMOVED***
   OUTLOOK_REDIRECT_URI=http://localhost:3000/api/auth/outlook/callback
   ```

4. **Implementation Steps:** ✅ **COMPLETED**
   - ✅ Created `/api/auth/outlook` endpoint to initiate OAuth
   - ✅ Created `/api/auth/outlook/callback` to handle the OAuth callback
   - ✅ Exchange authorization code for tokens
   - ✅ Store tokens in `email_accounts` table
   - ✅ Redirect user to settings page with success message

---

## 🚀 **Next Steps to Complete Integration**

### **Phase 1: OAuth Implementation** (Required)

1. **Create OAuth Endpoints:**
   - [ ] `/api/auth/gmail` - Initiate Gmail OAuth
   - [ ] `/api/auth/gmail/callback` - Handle Gmail callback
   - [ ] `/api/auth/outlook` - Initiate Outlook OAuth
   - [ ] `/api/auth/outlook/callback` - Handle Outlook callback

2. **Update Settings Page:**
   - [ ] Replace placeholder `handleConnectEmail` with actual OAuth initiation
   - [ ] Handle OAuth callback and token storage

3. **Token Management:**
   - [ ] Implement token refresh logic
   - [ ] Handle token expiry automatically
   - [ ] Add token encryption for production

### **Phase 2: Email Sending** (Required)

1. **Create Email Sending Service:**
   - [ ] `/lib/email/gmail-sender.ts` - Gmail sending logic
   - [ ] `/lib/email/outlook-sender.ts` - Outlook sending logic
   - [ ] `/lib/email/sender.ts` - Unified sender interface

2. **API Endpoint:**
   - [ ] `/api/campaigns/[id]/send` - Send emails to leads
   - [ ] Batch processing for large campaigns
   - [ ] Rate limiting per account
   - [ ] Daily limit enforcement

3. **Update Lead Status:**
   - [ ] Change status from `'scheduled'` → `'sent'` when email is sent
   - [ ] Store message data in `email_messages` table

### **Phase 3: Tracking** (Optional but Recommended)

1. **Open Tracking:**
   - [ ] Add tracking pixel to emails
   - [ ] `/api/track/open/[id]` - Track open events
   - [ ] Update lead status to `'opened'`

2. **Click Tracking:**
   - [ ] Wrap links with tracking URLs
   - [ ] `/api/track/click/[id]` - Track click events
   - [ ] Store click data

3. **Reply Tracking:**
   - [ ] Webhook for incoming emails (Gmail/Outlook)
   - [ ] `/api/webhooks/email-reply` - Handle replies
   - [ ] Update lead status to `'replied'`
   - [ ] Store reply in `email_messages` table

### **Phase 4: Sync & Automation** (Optional)

1. **Email Sync:**
   - [ ] Periodic sync of sent/received emails
   - [ ] Match replies to leads automatically
   - [ ] Update conversation threads

2. **Campaign Scheduler:**
   - [ ] Cron job or queue system
   - [ ] Process scheduled emails
   - [ ] Respect daily send limits
   - [ ] Handle time zones

---

## 🔒 **Security Considerations**

### **Token Storage**

**Current:** Tokens are stored as plain text in the database.

**Production Requirements:**
1. **Encrypt tokens** at rest using a encryption library:
   ```typescript
   import { encrypt, decrypt } from '@/lib/encryption'
   
   // When storing
   const encrypted = encrypt(access_token)
   
   // When retrieving
   const decrypted = decrypt(encrypted_token)
   ```

2. **Environment Variables:**
   ```env
   ENCRYPTION_KEY=your-32-byte-hex-key
   ```

3. **Key Management:**
   - Store encryption key in secure vault (AWS Secrets Manager, etc.)
   - Rotate keys periodically
   - Never commit keys to version control

### **Token Refresh**

Implement automatic token refresh before expiry:
```typescript
async function refreshAccessToken(account_id: string) {
  const account = await getAccount(account_id)
  
  if (account.provider === 'gmail') {
    // Refresh Gmail token
    const newTokens = await refreshGmailToken(account.refresh_token)
    await updateAccountTokens(account_id, newTokens)
  } else if (account.provider === 'outlook') {
    // Refresh Outlook token
    const newTokens = await refreshOutlookToken(account.refresh_token)
    await updateAccountTokens(account_id, newTokens)
  }
}
```

### **Rate Limiting**

- Daily send limits prevent spam flags
- Automatic reset at midnight
- Warning when approaching limit
- Queue emails that exceed limit

---

## 📊 **Database Migration**

Run this migration to create the email_accounts table:

```bash
# In Supabase SQL Editor, run:
# supabase/migrations/007_create_email_accounts_table.sql
```

---

## ✅ **What's Already Implemented**

✅ Database schema for email accounts  
✅ TypeScript types  
✅ Settings page UI  
✅ API routes for account management  
✅ Primary account selection  
✅ Daily send limit tracking  
✅ RLS policies for security  
✅ Navigation link to settings  

---

## ⚠️ **What's Missing (Need to Implement)**

❌ OAuth flows (Gmail & Outlook)  
❌ Token encryption  
❌ Email sending logic  
❌ Token refresh mechanism  
❌ Open/click/reply tracking  
❌ Campaign scheduler  
❌ Email sync  

---

## 🎯 **Recommended Implementation Order**

1. **Set up OAuth credentials** (Google Cloud Console + Azure Portal)
2. **Implement OAuth flows** (highest priority)
3. **Add token encryption** (security)
4. **Build email sending service** (core functionality)
5. **Add tracking pixels** (analytics)
6. **Implement campaign scheduler** (automation)
7. **Add email sync** (enhanced features)

---

## 📚 **Resources**

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [Microsoft Graph Mail API](https://docs.microsoft.com/en-us/graph/api/resources/mail-api-overview)
- [OAuth 2.0 Guide](https://oauth.net/2/)
- [Supabase Auth](https://supabase.com/docs/guides/auth)

---

**The foundation is ready! Now implement OAuth to start connecting real email accounts.** 🚀

