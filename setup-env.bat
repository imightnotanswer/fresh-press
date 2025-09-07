@echo off
echo Setting up environment variables for Fresh Press...

REM Supabase Configuration
set NEXT_PUBLIC_SUPABASE_URL=https://zwxiymsckhyeshiutyag.supabase.co
set NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3eGl5bXNja2h5ZXNoaXV0eWFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcxNjI3MzQsImV4cCI6MjA3MjczODczNH0.97Uk86d0pTnzrh3shRATigu0Fhnsn6MpwmKGJJXCeEA
set SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3eGl5bXNja2h5ZXNoaXV0eWFnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzE2MjczNCwiZXhwIjoyMDcyNzM4NzM0fQ.oUF1NnKYc69QjbBMuBrxiY7g64TFnasWphY8Kqi-_rk

REM NextAuth Configuration
set NEXTAUTH_URL=http://localhost:3000
set NEXTAUTH_SECRET=cmFH5BnNOmicvr7IotPUXzWNPIgLtSngMd9O18jNb40=

REM GitHub OAuth (add your own)
set GITHUB_ID=your-github-client-id
set GITHUB_SECRET=your-github-client-secret

REM Email Configuration (add your own)
set RESEND_API_KEY=your-resend-api-key
set EMAIL_FROM=noreply@freshlypressed.dev

REM Sanity Configuration
set NEXT_PUBLIC_SANITY_PROJECT_ID=hl93ytxj
set NEXT_PUBLIC_SANITY_DATASET=production
set SANITY_API_VERSION=2024-08-01
set SANITY_READ_TOKEN=your-sanity-read-token
set SANITY_API_TOKEN=your-sanity-api-token

echo Environment variables set!
echo Starting development server...

npm run dev
