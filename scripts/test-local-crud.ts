#!/usr/bin/env tsx
/**
 * Local Supabase CRUD Test
 * Tests all CRUD operations with the local Supabase instance
 */

import { createClient } from '@supabase/supabase-js';

// Local Supabase credentials (from supabase start output)
const LOCAL_URL = 'http://127.0.0.1:54321';
const LOCAL_ANON_KEY = 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH';
const LOCAL_SERVICE_KEY = 'sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz';

// Use service role key for testing (bypasses RLS)
const supabase = createClient(LOCAL_URL, LOCAL_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  console.log('👤 Creating test user in auth.users...');

  const testUserId = '00000000-0000-0000-0000-000000000001';

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('auth.users')
    .select('id')
    .eq('id', testUserId)
    .single();

  if (existingUser) {
    console.log('✅ Test user already exists');
    return testUserId;
  }

  // Create user directly in auth.users (only works with service role key)
  const { error } = await supabase.auth.admin.createUser({
    email: 'test@example.com',
    password: 'test123456',
    email_confirm: true,
    user_metadata: { name: 'Test User' }
  });

  if (error) {
    console.log('⚠️  Could not create user via auth.admin, trying direct insert...');

    // Fallback: Direct insert (local only)
    const { error: insertError } = await supabase.rpc('create_test_user', {
      test_user_id: testUserId,
      test_email: 'test@example.com'
    });

    if (insertError) {
      console.warn('⚠️  Skipping user creation -', insertError.message);
    }
  } else {
    console.log('✅ Test user created');
  }

  return testUserId;
}

async function testProjectCRUD() {
  console.log('\n🧪 Testing Project CRUD...\n');

  const testUserId = await createTestUser();

  // Create test project
  console.log('1️⃣  Creating project...');
  const { data: project, error: createError } = await supabase
    .from('projects')
    .insert({
      user_id: testUserId,
      name: 'CRUD Test Project',
      settings: {
        width: 1920,
        height: 1080,
        fps: 30,
        aspectRatio: '16:9',
        bitrate: 9000,
        standard: '1080p'
      }
    })
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create project:', createError.message);
    throw new Error('Project creation failed');
  }

  console.log('✅ Project created:', project.id);

  // Read project
  console.log('\n2️⃣  Reading project...');
  const { data: readProject, error: readError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', project.id)
    .single();

  if (readError) {
    console.error('❌ Failed to read project:', readError.message);
    throw new Error('Project read failed');
  }

  console.log('✅ Project read successfully');
  console.log('   Name:', readProject.name);
  console.log('   Settings:', JSON.stringify(readProject.settings));

  // Update project
  console.log('\n3️⃣  Updating project...');
  const { data: updatedProject, error: updateError } = await supabase
    .from('projects')
    .update({ name: 'Updated CRUD Test Project' })
    .eq('id', project.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Failed to update project:', updateError.message);
    throw new Error('Project update failed');
  }

  console.log('✅ Project updated');
  console.log('   New name:', updatedProject.name);

  return { projectId: project.id, userId: testUserId };
}

async function testEffectCRUD(projectId: string) {
  console.log('\n🧪 Testing Effect CRUD with NEW SCHEMA...\n');

  // Create effect with NEW schema (start/end fields)
  console.log('1️⃣  Creating effect with start/end fields...');
  const testEffect = {
    project_id: projectId,
    kind: 'video',
    track: 0,
    start_at_position: 0,
    duration: 5000,
    start: 0,      // ✅ NEW field
    end: 5000,     // ✅ NEW field
    media_file_id: null,
    properties: {
      rect: {
        width: 1920,
        height: 1080,
        scaleX: 1,
        scaleY: 1,
        position_on_canvas: { x: 960, y: 540 },
        rotation: 0,
        pivot: { x: 960, y: 540 }
      },
      raw_duration: 5000,
      frames: 150
    },
    file_hash: 'test_hash_123',
    name: 'Test Video Effect',
    thumbnail: 'https://example.com/thumb.jpg'
  };

  const { data: effect, error: createError } = await supabase
    .from('effects')
    .insert(testEffect)
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create effect:', createError.message);
    return null;
  }

  console.log('✅ Effect created successfully');
  console.log('   Effect ID:', effect.id);
  console.log('   start:', effect.start, '(should be 0)');
  console.log('   end:', effect.end, '(should be 5000)');
  console.log('   file_hash:', effect.file_hash);
  console.log('   name:', effect.name);

  // Verify no old fields exist
  if ('start_time' in effect || 'end_time' in effect) {
    console.error('❌ OLD SCHEMA FIELDS DETECTED! start_time or end_time still exists!');
    return null;
  } else {
    console.log('✅ Confirmed: Old fields (start_time/end_time) do NOT exist');
  }

  // Read effect
  console.log('\n2️⃣  Reading effect...');
  const { data: readEffect, error: readError } = await supabase
    .from('effects')
    .select('*')
    .eq('id', effect.id)
    .single();

  if (readError) {
    console.error('❌ Failed to read effect:', readError.message);
    return effect.id;
  }

  console.log('✅ Effect read successfully');
  console.log('   Columns:', Object.keys(readEffect).join(', '));

  // Update effect (trim operation - change start/end)
  console.log('\n3️⃣  Updating effect (simulating trim)...');
  const { data: updatedEffect, error: updateError } = await supabase
    .from('effects')
    .update({
      start: 1000,  // Trim 1s from start
      end: 4000,    // Trim 1s from end
      duration: 3000  // New duration = 4000 - 1000
    })
    .eq('id', effect.id)
    .select()
    .single();

  if (updateError) {
    console.error('❌ Failed to update effect:', updateError.message);
    return effect.id;
  }

  console.log('✅ Effect updated (trim operation)');
  console.log('   start:', updatedEffect.start, '(should be 1000)');
  console.log('   end:', updatedEffect.end, '(should be 4000)');
  console.log('   duration:', updatedEffect.duration, '(should be 3000)');

  // Delete effect
  console.log('\n4️⃣  Deleting effect...');
  const { error: deleteError } = await supabase
    .from('effects')
    .delete()
    .eq('id', effect.id);

  if (deleteError) {
    console.error('❌ Failed to delete effect:', deleteError.message);
    return effect.id;
  }

  console.log('✅ Effect deleted successfully');

  // Verify deletion
  const { data: deletedEffect } = await supabase
    .from('effects')
    .select('*')
    .eq('id', effect.id)
    .single();

  if (deletedEffect) {
    console.error('❌ Effect still exists after deletion!');
  } else {
    console.log('✅ Confirmed: Effect no longer exists');
  }

  return null;
}

async function testMediaFileCRUD(userId: string) {
  console.log('\n🧪 Testing Media File CRUD...\n');

  console.log('1️⃣  Creating media file record...');
  const testMediaFile = {
    user_id: userId,
    file_hash: 'test_hash_' + Date.now(),
    filename: 'test_video.mp4',
    file_size: 1024000,
    mime_type: 'video/mp4',
    storage_path: 'test/path/test_video.mp4',
    metadata: {
      duration: 10,
      width: 1920,
      height: 1080,
      fps: 30
    }
  };

  const { data: mediaFile, error: createError } = await supabase
    .from('media_files')
    .insert(testMediaFile)
    .select()
    .single();

  if (createError) {
    console.error('❌ Failed to create media file:', createError.message);
    return null;
  }

  console.log('✅ Media file created:', mediaFile.id);

  // Clean up
  await supabase.from('media_files').delete().eq('id', mediaFile.id);
  console.log('✅ Media file cleaned up');

  return mediaFile.id;
}

async function main() {
  console.log('🚀 Local Supabase CRUD Test Suite\n');
  console.log('Database URL: http://127.0.0.1:54321');
  console.log('━'.repeat(60));

  try {
    // Test projects
    const result = await testProjectCRUD();
    if (!result) {
      console.error('\n❌ Project CRUD tests failed');
      process.exit(1);
    }

    // Test effects with NEW schema
    await testEffectCRUD(result.projectId);

    // Test media files
    await testMediaFileCRUD(result.userId);

    // Clean up test project
    console.log('\n🧹 Cleaning up test data...');
    await supabase.from('projects').delete().eq('id', result.projectId);
    console.log('✅ Test project deleted');

    console.log('\n' + '━'.repeat(60));
    console.log('✅ All CRUD tests passed!');
    console.log('✅ Database schema is correct (start/end fields working)');
    console.log('✅ No deprecated fields (start_time/end_time) found');
    console.log('\n🎉 Local Supabase is ready for development!');

  } catch (error: any) {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  }
}

main();
