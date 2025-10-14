# Supabase Integration Test Plan

**Date**: 2025-10-15
**Status**: ✅ Migrations Applied
**Purpose**: Verify database schema matches code and all CRUD operations work correctly

---

## ✅ Completed Checks

### 1. Supabase CLI Setup
- [x] Supabase CLI v2.51.0 installed
- [x] Project linked to `blvcuxxwiykgcbsduhbc`
- [x] All 4 migrations present in `supabase/migrations/`
- [x] Remote database confirmed up-to-date with `supabase db push`

### 2. Basic Configuration
- [x] `.env.local` configured with correct credentials
- [x] Storage bucket `media-files` exists
- [x] RLS policies active (unauthenticated queries blocked)

---

## 🔍 Manual Verification Steps

### Step 1: Verify Effects Table Schema in Supabase Dashboard

1. Open Supabase Dashboard: https://supabase.com/dashboard/project/blvcuxxwiykgcbsduhbc
2. Go to **Table Editor** → **effects** table
3. Verify the following columns exist:

   **✅ Required Columns (New Schema)**:
   - `id` (uuid, primary key)
   - `project_id` (uuid, foreign key → projects)
   - `kind` (text: 'video' | 'audio' | 'image' | 'text')
   - `track` (int4)
   - `start_at_position` (int4) - Timeline position in ms
   - `duration` (int4) - Display duration in ms
   - ✨ **`start`** (int4) - Trim start in ms (NEW)
   - ✨ **`end`** (int4) - Trim end in ms (NEW)
   - `media_file_id` (uuid, nullable, foreign key → media_files)
   - `properties` (jsonb)
   - `file_hash` (text, nullable)
   - `name` (text, nullable)
   - `thumbnail` (text, nullable)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

   **❌ Deprecated Columns (Should NOT Exist)**:
   - ~~`start_time`~~ (REMOVED in migration 004)
   - ~~`end_time`~~ (REMOVED in migration 004)

4. Click on **SQL Editor** and run:
   ```sql
   SELECT column_name, data_type, is_nullable
   FROM information_schema.columns
   WHERE table_name = 'effects'
   ORDER BY ordinal_position;
   ```

5. Verify output shows `start` and `end` columns (NOT `start_time`/`end_time`)

---

### Step 2: Test Application with Real User

#### A. Start Development Server

```bash
npm run dev
```

#### B. Test Authentication Flow

1. Navigate to http://localhost:3000
2. Click **Sign in with Google**
3. Complete OAuth flow
4. Verify redirected to `/editor` page
5. Check browser console - no errors

#### C. Test Project CRUD

1. **Create Project**:
   - Click "New Project"
   - Enter name: "Schema Test Project"
   - Verify project appears in list

2. **Open Project**:
   - Click on project
   - Verify editor UI loads
   - Check browser console for errors

#### D. Test Media Upload

1. **Upload Video**:
   - Click "Upload Media"
   - Select a small video file (<10MB)
   - Wait for upload to complete
   - Verify file appears in media library
   - Check that file size validation works (try uploading >500MB file - should fail)

2. **Verify Database Record**:
   - Go to Supabase Dashboard → **media_files** table
   - Find your uploaded file
   - Verify `file_hash`, `file_size`, `metadata` are populated

#### E. Test Effect CRUD with New Schema

1. **Add Effect to Timeline**:
   - Click "Add to Timeline" on uploaded media
   - Verify effect block appears on timeline

2. **Verify Database Record**:
   - Go to Supabase Dashboard → **effects** table
   - Find the created effect
   - ✅ Verify `start` and `end` fields are populated (e.g., start=0, end=10000)
   - ❌ Verify `start_time` and `end_time` columns do NOT exist

3. **Trim Effect**:
   - Drag trim handles on effect block
   - Wait for auto-save (5 seconds)
   - Refresh Supabase Dashboard
   - Verify `start` and `end` values changed correctly

4. **Move Effect**:
   - Drag effect to different position on timeline
   - Wait for auto-save
   - Refresh Dashboard
   - Verify `start_at_position` changed

5. **Delete Effect**:
   - Click delete on effect
   - Refresh Dashboard
   - Verify effect removed from database

#### F. Test Auto-Save Functionality

1. **Monitor Auto-Save Indicator**:
   - Make a change (move an effect)
   - Observe "Saving..." indicator appears
   - After ~5 seconds, should show "Saved" ✓

2. **Verify Rate Limiting**:
   - Make rapid changes (drag effect back and forth quickly)
   - Check browser console - should see rate limit messages
   - Verify database not spammed (check `updated_at` timestamps in Dashboard)

3. **Test Offline Mode**:
   - Open browser DevTools → Network tab
   - Set to "Offline"
   - Make changes
   - Observe "Offline" indicator
   - Re-enable network
   - Verify changes synced automatically

#### G. Test Text Effect (FR-007)

1. **Add Text Overlay**:
   - Click "Add Text" button
   - Enter text: "Test Text"
   - Verify text appears on canvas

2. **Style Text**:
   - Change font, color, size
   - Verify changes reflected on canvas
   - Wait for auto-save

3. **Verify Database**:
   - Check `effects` table
   - Find text effect (kind='text')
   - Verify `properties` JSONB contains text styling data

---

### Step 3: Test Error Handling

#### A. Test File Size Validation

1. Try to upload a file >500MB
2. Verify error message: "File size exceeds maximum allowed size of 500MB"

#### B. Test RLS Policies

1. Open DevTools Console
2. Try to query another user's projects:
   ```javascript
   const { data, error } = await supabase
     .from('projects')
     .select('*')
     .eq('user_id', '00000000-0000-0000-0000-000000000000');
   console.log(data, error);
   ```
3. Verify empty result or RLS error

#### C. Test Improved Error Messages

1. Cause a database error (e.g., invalid media_file_id)
2. Check browser console
3. Verify error message includes context (e.g., "Failed to create effect: ...")

---

## 📊 Test Results

### Schema Verification

| Check | Status | Notes |
|-------|--------|-------|
| `effects` table has `start` column | ⬜ Pending | Type: int4 |
| `effects` table has `end` column | ⬜ Pending | Type: int4 |
| `start_time` column removed | ⬜ Pending | Should not exist |
| `end_time` column removed | ⬜ Pending | Should not exist |
| `file_hash` column added | ⬜ Pending | Type: text, nullable |
| `name` column added | ⬜ Pending | Type: text, nullable |
| `thumbnail` column added | ⬜ Pending | Type: text, nullable |

### Functionality Tests

| Test | Status | Notes |
|------|--------|-------|
| User authentication (Google OAuth) | ⬜ Pending | |
| Create project | ⬜ Pending | |
| Upload media file | ⬜ Pending | Max 500MB enforced |
| Add effect to timeline | ⬜ Pending | Uses start/end fields |
| Trim effect (update start/end) | ⬜ Pending | |
| Move effect (update start_at_position) | ⬜ Pending | |
| Delete effect | ⬜ Pending | |
| Auto-save (5s interval) | ⬜ Pending | FR-009 compliance |
| Rate limiting (1s min interval) | ⬜ Pending | Security fix |
| Offline mode queue | ⬜ Pending | |
| Text overlay (FR-007) | ⬜ Pending | |
| File size validation | ⬜ Pending | 500MB limit |
| RLS enforcement | ⬜ Pending | |
| Error context preservation | ⬜ Pending | `{ cause: error }` |

---

## 🐛 Known Issues

1. **External Key Constraint for Test Users**:
   - Cannot create test data without real auth.users records
   - **Workaround**: Use real user login for testing
   - **Impact**: Low (only affects automated tests)

---

## 🎯 Critical Success Criteria

For production readiness, the following MUST pass:

1. ✅ `effects` table has `start` and `end` columns (NOT `start_time`/`end_time`)
2. ⬜ Can create/read/update/delete effects with new schema
3. ⬜ Auto-save works every 5 seconds
4. ⬜ Rate limiting prevents database spam
5. ⬜ File size validation enforced
6. ⬜ RLS policies protect user data
7. ⬜ No runtime errors in browser console

---

## 📝 Next Steps

1. **Manual Testing**: Follow Step 2 above to test with real user
2. **Record Results**: Update checkboxes in "Test Results" section
3. **Fix Issues**: Document any failures and create fix commits
4. **Final Verification**: Run full test suite again

---

**Testing By**: _[Your Name]_
**Date**: _[Test Date]_
**Result**: _[Pass/Fail]_
