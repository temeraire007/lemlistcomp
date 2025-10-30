# OAuth Setup for Localhost Development

This guide will help you set up Gmail and Outlook OAuth for local development.

---

## ✅ **What's Already Implemented**

The following OAuth endpoints are now fully implemented:

### Gmail
- `/api/auth/gmail` - Initiates Gmail OAuth flow
- `/api/auth/gmail/callback` - Handles OAuth callback and stores tokens

### Outlook
- `/api/auth/outlook` - Initiates Outlook OAuth flow
- `/api/auth/outlook/callback` - Handles OAuth callback and stores tokens

### Settings Page
- Connects to real OAuth endpoints (no more mock flow)
- Displays success/error messages from OAuth callback
- Shows connected accounts with provider icons

---

## 🔧 **Setup Instructions**

### **1. Gmail OAuth Setup**

#### **A. Create OAuth Credentials**

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Enable Gmail API:
   - Navigate to "APIs & Services" → "Library"
   - Search for "Gmail API"
   - Click "Enable"

4. Configure OAuth Consent Screen:
   - Navigate to "APIs & Services" → "OAuth consent screen"
   - Select "External" user type
   - Fill in:
     - App name: Your App Name
     - User support email: your@email.com
     - Developer contact: your@email.com
   - Click "Save and Continue"
   - Add scopes:
     - `https://www.googleapis.com/auth/gmail.send`
     - `https://www.googleapis.com/auth/gmail.readonly`
     - `https://www.googleapis.com/auth/gmail.modify`
   - Add test users (your Gmail account)
   - Click "Save and Continue"

5. Create OAuth Client ID:
   - Navigate to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Application type: "Web application"
   - Name: "LemList Localhost"
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/gmail/callback
     ```
   - Click "Create"
   - **Save your Client ID and Client Secret**

#### **B. Add Environment Variables**

Add these to your `.env.local` file:

```env
# Gmail OAuth (you already have these)
GMAIL_***REMOVED***
GMAIL_***REMOVED***
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback
```

**Note:** You already have Gmail credentials in the guide. Make sure these match your Google Cloud Console credentials!

---

### **2. Outlook OAuth Setup** (Optional)

#### **A. Create OAuth Credentials**

1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to "Azure Active Directory" → "App registrations"
3. Click "New registration"
4. Fill in:
   - Name: "LemList Localhost"
   - Supported account types: "Accounts in any organizational directory and personal Microsoft accounts"
   - Redirect URI: 
     - Platform: Web
     - URI: `http://localhost:3000/api/auth/outlook/callback`
5. Click "Register"

6. Configure API Permissions:
   - Click "API permissions" → "Add a permission"
   - Select "Microsoft Graph"
   - Select "Delegated permissions"
   - Add:
     - `Mail.Send`
     - `Mail.Read`
     - `Mail.ReadWrite`
     - `offline_access`
   - Click "Add permissions"
   - Click "Grant admin consent" (if you have admin rights)

7. Create Client Secret:
   - Click "Certificates & secrets" → "New client secret"
   - Description: "Localhost Development"
   - Expires: Choose duration
   - Click "Add"
   - **Copy the secret value immediately** (you can't see it again!)

8. Copy Application (client) ID:
   - Go to "Overview" tab
   - Copy the "Application (client) ID"

#### **B. Add Environment Variables**

Add these to your `.env.local` file:

```env
# Outlook OAuth
OUTLOOK_***REMOVED***
OUTLOOK_***REMOVED***
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/auth/outlook/callback
```

---

## 🧪 **Testing the OAuth Flow**

### **1. Start Your Application**

```bash
npm run dev
```

### **2. Navigate to Settings**

Go to: `http://localhost:3000/settings`

### **3. Connect Gmail**

1. Click "Connect Gmail" button
2. You'll be redirected to Google's OAuth consent screen
3. Sign in with your Google account
4. Grant permissions
5. You'll be redirected back to settings with a success message
6. Your Gmail account should now appear in the "Connected Email Accounts" list

### **4. Connect Outlook** (Optional)

Same process as Gmail, but with "Connect Outlook" button.

---

## 🐛 **Troubleshooting**

### **Common Issues**

#### **"redirect_uri_mismatch" Error**

**Cause:** The redirect URI in your OAuth app doesn't match the one in your code.

**Solution:**
- Check that your OAuth app has **exactly** this redirect URI:
  ```
  http://localhost:3000/api/auth/gmail/callback
  ```
- No trailing slash
- No https (use http for localhost)
- Port must match (3000)

#### **"Access blocked: This app's request is invalid"**

**Cause:** OAuth consent screen not configured properly.

**Solution:**
- Make sure you've added all required scopes in Google Cloud Console
- Add yourself as a test user if the app is in "Testing" mode

#### **"Unauthorized" Error After Callback**

**Cause:** You're not signed into the app with Clerk.

**Solution:**
- Make sure you're logged in before clicking "Connect Gmail"

#### **"User not found in Supabase" Error**

**Cause:** Your Clerk user hasn't been synced to Supabase yet.

**Solution:**
- Sign out and sign back in (this triggers the user sync)
- Check Supabase dashboard to verify user exists in `users` table

---

## 📊 **How the OAuth Flow Works**

1. **User clicks "Connect Gmail"**
   - Frontend redirects to `/api/auth/gmail`

2. **OAuth Initiation**
   - Server builds Google OAuth URL with:
     - Client ID
     - Redirect URI
     - Required scopes
     - `access_type=offline` (for refresh token)
     - `prompt=consent` (ensures refresh token)
   - Redirects user to Google

3. **User Grants Permissions**
   - Google shows consent screen
   - User approves
   - Google redirects to: `/api/auth/gmail/callback?code=xxx`

4. **Token Exchange**
   - Server receives authorization code
   - Exchanges code for access token + refresh token
   - Fetches user's email address from Gmail API

5. **Store in Database**
   - Server gets Supabase user ID from Clerk user ID
   - Stores email account in `email_accounts` table with:
     - Provider (gmail/outlook)
     - Email address
     - Access token (encrypted in DB)
     - Refresh token (encrypted in DB)
     - Token expiry
     - Daily send limit (default: 100)

6. **Redirect to Settings**
   - User redirected back to `/settings?success=gmail_connected`
   - Success message displayed
   - Email account appears in list

---

## 🔒 **Security Notes**

### **Token Storage**
- Access tokens and refresh tokens are stored in Supabase
- Protected by Row Level Security (RLS)
- Only the user who owns the token can access it
- Tokens are passed over HTTPS (in production)

### **Environment Variables**
- Never commit `.env.local` to git
- Keep OAuth secrets secure
- Rotate secrets regularly in production

### **OAuth Scopes**
- We only request the minimum required scopes:
  - Gmail: send, read, modify
  - Outlook: send, read, modify
- No access to contacts, drive, or other data

---

## 🚀 **Next Steps**

Once you have email accounts connected, the next phases are:

1. **Token Refresh Logic**
   - Automatically refresh expired access tokens using refresh tokens

2. **Email Sending**
   - Use stored tokens to send emails via Gmail/Outlook APIs
   - Respect daily send limits
   - Track sent emails in `email_messages` table

3. **Email Tracking**
   - Add tracking pixels for opens
   - Track link clicks
   - Detect replies via webhook/polling

4. **Campaign Automation**
   - Schedule emails to leads
   - Automatic follow-ups
   - Smart sending (time zones, send windows)

---

## 📝 **Current Environment Variables**

Make sure your `.env.local` has:

```env
# Clerk (already configured)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret

# Supabase (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Gmail OAuth
GMAIL_***REMOVED***
GMAIL_***REMOVED***
GMAIL_REDIRECT_URI=http://localhost:3000/api/auth/gmail/callback

# Outlook OAuth (optional)
OUTLOOK_***REMOVED***
OUTLOOK_***REMOVED***
OUTLOOK_REDIRECT_URI=http://localhost:3000/api/auth/outlook/callback
```

---

## ✅ **Implementation Checklist**

- [x] OAuth endpoints created
- [x] Settings page updated to use real OAuth
- [x] Success/error messaging in UI
- [x] Token storage in database
- [x] User email fetching
- [x] Environment variables configured
- [ ] Test Gmail connection on localhost
- [ ] Test Outlook connection on localhost (optional)
- [ ] Implement token refresh logic
- [ ] Implement email sending
- [ ] Implement email tracking

---

**You're now ready to test the Gmail OAuth flow on localhost!** 🎉

Just make sure:
1. Your `.env.local` has the Gmail credentials
2. Your Google Cloud Console OAuth app has the correct redirect URI
3. You've added yourself as a test user
4. Your Next.js app is running on `http://localhost:3000`

Then go to `/settings` and click "Connect Gmail"!

