# Fresh Press

A modern music site inspired by Stereogum and Pitchfork, built with Next.js 14, Sanity CMS, and Supabase.

## Features

- **Content Management**: Sanity Studio for managing reviews, media, and artists
- **Authentication**: NextAuth with GitHub and Email providers
- **Comments**: Threaded comments with Supabase and rate limiting
- **Responsive Design**: Modern UI with Tailwind CSS and shadcn/ui
- **Video Support**: YouTube, Vimeo, and MP4 video playback
- **Rich Text**: Portable Text rendering for reviews

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **CMS**: Sanity v3
- **Database**: Supabase (PostgreSQL)
- **Authentication**: NextAuth.js
- **Styling**: Tailwind CSS + shadcn/ui
- **Rate Limiting**: Upstash Redis
- **Video Player**: React Player
- **Email**: Resend

## Prerequisites

Before running this project, you'll need:

1. **Sanity Project**: Create a project at [sanity.io](https://sanity.io)
2. **Supabase Project**: Create a project at [supabase.com](https://supabase.com)
3. **GitHub OAuth App**: For authentication
4. **Resend Account**: For email authentication
5. **Upstash Redis**: For rate limiting
6. **hCaptcha**: For comment verification

## Environment Setup

Copy `.env.local` and fill in the required values:

```bash
# Site Configuration
NEXT_PUBLIC_SITE_NAME="Fresh Press"
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# GitHub OAuth
GITHUB_ID=your-github-client-id
GITHUB_SECRET=your-github-client-secret

# Email (Resend)
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM="Fresh Press <no-reply@freshlypressed.dev>"

# Sanity
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=production
SANITY_API_VERSION=2024-08-01
SANITY_READ_TOKEN=your-sanity-read-token

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Upstash Redis
UPSTASH_REDIS_REST_URL=your-upstash-redis-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-redis-token

# hCaptcha
HCAPTCHA_SITEKEY=your-hcaptcha-site-key
HCAPTCHA_SECRET=your-hcaptcha-secret
```

## Database Setup

Run this SQL in your Supabase SQL editor:

```sql
-- Create post type enum
CREATE TYPE post_type AS ENUM ('review', 'media');

-- Create comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_type post_type NOT NULL,
  post_id TEXT NOT NULL,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  body TEXT NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX ON public.comments (post_id, post_type, created_at);
CREATE INDEX ON public.comments (parent_id);

-- Enable RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view comments" ON public.comments
  FOR SELECT USING (deleted = FALSE);

CREATE POLICY "Authenticated users can insert comments" ON public.comments
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own comments" ON public.comments
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
  FOR DELETE USING (auth.uid()::text = user_id);
```

## Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd freshly-pressed
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables (see Environment Setup above)

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Sanity Studio

Access the Sanity Studio at [http://localhost:3000/studio](http://localhost:3000/studio) to manage your content.

### Content Types

- **Artists**: Name, slug, website, image
- **Tags**: Name and slug for categorization
- **Reviews**: Album reviews with cover art, blurb, and rich text body
- **Media**: Video content with YouTube/Vimeo URLs

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── artists/[slug]/    # Artist pages
│   ├── media/[slug]/      # Media pages
│   ├── reviews/[slug]/    # Review pages
│   └── studio/            # Sanity Studio
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── ReviewCard.tsx    # Review card component
│   ├── MediaCard.tsx     # Media card component
│   ├── Comments.tsx      # Comments system
│   └── ...
├── lib/                  # Utility functions
│   ├── sanity.ts         # Sanity client
│   ├── supabase.ts       # Supabase client
│   ├── auth.ts           # NextAuth configuration
│   └── ...
└── sanity/               # Sanity configuration
    ├── config.ts         # Studio configuration
    └── schemas/          # Content schemas
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Environment Variables for Production

Make sure to update these for production:

- `NEXTAUTH_URL`: Your production domain
- `SANITY_READ_TOKEN`: Production read token
- Add your production domain to Sanity CORS settings
- Update hCaptcha site key for production domain

## Features in Detail

### Comments System

- Threaded comments with unlimited nesting
- Rate limiting (60 comments per hour per IP)
- hCaptcha verification
- Markdown support with sanitization
- Real-time updates

### Authentication

- GitHub OAuth for easy sign-in
- Email authentication with magic links
- JWT sessions for performance
- Protected comment posting

### Content Management

- Rich text editing with Sanity
- Image optimization and hot-spotting
- Slug generation and validation
- Preview functionality

## Troubleshooting

### Common Issues

1. **Sanity Studio not loading**: Check CORS settings and environment variables
2. **Comments not working**: Verify Supabase RLS policies and environment variables
3. **Authentication issues**: Check NextAuth configuration and provider settings
4. **Rate limiting errors**: Verify Upstash Redis configuration

### Development Tips

- Use `npm run dev` for development
- Check browser console for client-side errors
- Check terminal for server-side errors
- Sanity Studio logs are available in the browser console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details