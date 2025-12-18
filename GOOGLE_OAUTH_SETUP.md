# Google OAuth Setup Instructions

## Step 1: Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google+ API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Select "Web application"
   - Add authorized redirect URIs:
     - For development: `http://localhost:3000/api/auth/callback/google`
     - For production: `https://yourdomain.com/api/auth/callback/google`
   - Click "Create"

5. Copy the Client ID and Client Secret

## Step 2: Add Environment Variables

Create or update your `.env.local` file in the project root:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-random-secret-key-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
```

To generate a NEXTAUTH_SECRET, run:
```bash
openssl rand -base64 32
```

## Step 3: Restart Your Development Server

```bash
npm run dev
```

## How It Works

- When users click "Continue with Google", they'll be redirected to Google's OAuth page
- After authorization, they'll be redirected back to your app
- If it's their first time signing in, a new user account will be created automatically in your database
- Users who sign in with Google don't need a password

## Features

✅ Automatic user creation on first Google sign-in
✅ User data stored in your Prisma database
✅ Works alongside email/password authentication
✅ Secure JWT-based sessions
