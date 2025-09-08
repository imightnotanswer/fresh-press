# Email Authentication Setup

To enable email authentication with verification, you need to set up Resend.

## 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

## 2. Get Your API Key

1. In the Resend dashboard, go to "API Keys"
2. Click "Create API Key"
3. Give it a name like "Fresh Press"
4. Copy the API key

## 3. Set Up Your Domain (Optional but Recommended)

1. In Resend dashboard, go to "Domains"
2. Click "Add Domain"
3. Add your domain (e.g., `freshlypressed.dev`)
4. Follow the DNS setup instructions
5. Wait for verification

## 4. Update Your Environment Variables

Add these to your `.env.local` file:

```env
# Resend Email Service
RESEND_API_KEY=re_your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
```

Replace:
- `re_your_api_key_here` with your actual Resend API key
- `yourdomain.com` with your verified domain (or use `onboarding@resend.dev` for testing)

## 5. Test Email Authentication

1. Restart your development server
2. Go to http://localhost:3000/signin
3. Try signing in with email
4. Check your email for the verification link

## Development Mode

If you don't want to set up Resend right now, the system will:
- Still show email sign-in option
- Log the verification URL to the console
- Allow you to test the flow manually

## Troubleshooting

- **"Failed to send verification email"**: Check your RESEND_API_KEY
- **"Invalid from address"**: Make sure EMAIL_FROM matches your verified domain
- **No email received**: Check spam folder, verify domain setup



