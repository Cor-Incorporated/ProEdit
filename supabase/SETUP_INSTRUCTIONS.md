# Supabase Setup Instructions

This document provides step-by-step instructions for setting up the ProEdit Supabase backend.

## Prerequisites

- Supabase account (https://supabase.com)
- Supabase project created
- Project URL and anon key added to `.env.local`

## Step 1: Run Database Migrations

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run the following migrations in order:

### Migration 1: Initial Schema
```bash
# Copy content from: supabase/migrations/001_initial_schema.sql
```

### Migration 2: Row Level Security
```bash
# Copy content from: supabase/migrations/002_row_level_security.sql
```

## Step 2: Create Storage Bucket (T010)

1. Navigate to **Storage** in the Supabase dashboard
2. Click **New bucket**
3. Configure the bucket:
   - Name: `media-files`
   - Public: **No** (we'll use signed URLs)
   - File size limit: 500MB
   - Allowed MIME types: `video/*, image/*, audio/*`

4. Set up storage policies:

Go to **Storage > Policies** and add:

### View own media policy
```sql
CREATE POLICY "Users can view own media files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Upload own media policy
```sql
CREATE POLICY "Users can upload own media files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

### Delete own media policy
```sql
CREATE POLICY "Users can delete own media files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media-files' AND
  (storage.foldername(name))[1] = auth.uid()::text
);
```

## Step 3: Configure Google OAuth (T011)

1. Navigate to **Authentication > Providers** in Supabase dashboard
2. Find **Google** provider and enable it
3. Create OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing
   - Enable Google+ API
   - Go to **APIs & Services > Credentials**
   - Click **Create Credentials > OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback`

4. Copy Client ID and Client Secret to Supabase:
   - Paste **Client ID** in Supabase Google provider settings
   - Paste **Client Secret** in Supabase Google provider settings
   - Click **Save**

5. Test the authentication:
   - Use the Auth URL provided by Supabase
   - Example: `https://[YOUR-PROJECT-REF].supabase.co/auth/v1/authorize?provider=google`

## Step 4: Generate TypeScript Types (T018)

After migrations are complete, generate TypeScript types:

```bash
npx supabase gen types typescript --project-id [YOUR-PROJECT-REF] > types/supabase.ts
```

Replace `[YOUR-PROJECT-REF]` with your actual project reference from the Supabase dashboard.

## Step 5: Verify Setup

Run the following SQL to verify all tables and policies are created:

```sql
-- Check tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public';

-- Check policies
SELECT tablename, policyname FROM pg_policies
WHERE schemaname = 'public';

-- Check storage bucket
SELECT * FROM storage.buckets WHERE name = 'media-files';
```

## Environment Variables

Ensure your `.env.local` contains:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SERVICE-ROLE-KEY]
```

## Troubleshooting

### RLS Policies Not Working
- Verify user is authenticated: `SELECT auth.uid();`
- Check policy conditions match your data structure
- Use `USING` clause for SELECT/UPDATE/DELETE
- Use `WITH CHECK` clause for INSERT/UPDATE

### Storage Upload Fails
- Verify bucket exists and is private
- Check storage policies are created
- Ensure file path includes user ID: `{user_id}/{file_hash}.ext`
- Verify MIME type is in allowed list

### OAuth Not Working
- Check redirect URI matches exactly (including trailing slash)
- Verify Google OAuth consent screen is configured
- Ensure Google+ API is enabled in Google Cloud Console
- Check Supabase logs for error details

## Next Steps

After completing these steps, you're ready to proceed with Phase 3: User Story 1 implementation (T022+).
