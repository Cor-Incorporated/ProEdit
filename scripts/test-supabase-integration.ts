#!/usr/bin/env tsx
/**
 * Supabase Integration Test
 * Tests CRUD operations and schema compatibility
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Use service role key for admin access (bypasses RLS for testing)
const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testEffectsSchema() {
  console.log('\n🧪 Testing Effects Table Schema...\n');

  // Test 1: Create a test project first
  console.log('1️⃣  Creating test project...');
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert({
      user_id: '00000000-0000-0000-0000-000000000000', // Test UUID
      name: 'Schema Test Project',
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

  if (projectError) {
    console.error('❌ Failed to create test project:', projectError.message);
    console.error('   This might be due to RLS. Using service role key should bypass RLS.');
    return false;
  }

  console.log('✅ Test project created:', project.id);

  // Test 2: Insert effect with new schema (start/end fields)
  console.log('\n2️⃣  Testing new schema (start/end fields)...');
  const testEffect = {
    project_id: project.id,
    kind: 'video',
    track: 0,
    start_at_position: 0,
    duration: 5000,
    start: 0,      // NEW field
    end: 5000,     // NEW field
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
    }
  };

  const { data: effect, error: effectError } = await supabase
    .from('effects')
    .insert(testEffect)
    .select()
    .single();

  if (effectError) {
    console.error('❌ Failed to insert effect:', effectError.message);

    if (effectError.message.includes('start_time') || effectError.message.includes('end_time')) {
      console.error('\n🚨 CRITICAL: Database still has old schema (start_time/end_time)');
      console.error('   Migration 004 has NOT been applied!');
      console.error('\n   Please run: supabase db push');
    }

    if (effectError.message.includes('"start"') || effectError.message.includes('"end"')) {
      console.error('\n🚨 CRITICAL: start/end fields are missing!');
      console.error('   Migration 004 needs to be applied!');
    }

    // Clean up test project
    await supabase.from('projects').delete().eq('id', project.id);
    return false;
  }

  console.log('✅ Effect inserted successfully with new schema');
  console.log('   Effect ID:', effect.id);
  console.log('   start:', effect.start);
  console.log('   end:', effect.end);

  // Verify the fields are correct
  if (effect.start !== 0 || effect.end !== 5000) {
    console.error('❌ Field values incorrect!');
    console.error('   Expected: start=0, end=5000');
    console.error('   Got: start=' + effect.start + ', end=' + effect.end);
    return false;
  }

  // Test 3: Try to insert with old field names (should fail)
  console.log('\n3️⃣  Testing that old schema fields (start_time/end_time) are gone...');
  const { error: oldSchemaError } = await supabase
    .from('effects')
    .insert({
      project_id: project.id,
      kind: 'video',
      track: 0,
      start_at_position: 0,
      duration: 5000,
      start_time: 0,    // OLD field (should not exist)
      end_time: 5000,   // OLD field (should not exist)
      media_file_id: null,
      properties: {}
    } as any)
    .select()
    .single();

  if (oldSchemaError) {
    if (oldSchemaError.message.includes('start_time') || oldSchemaError.message.includes('end_time') ||
        oldSchemaError.message.includes('column') && oldSchemaError.message.includes('does not exist')) {
      console.log('✅ Old fields correctly rejected (migration applied)');
    } else {
      console.warn('⚠️  Unexpected error:', oldSchemaError.message);
    }
  } else {
    console.error('❌ Old fields were accepted! Migration NOT applied correctly!');
    return false;
  }

  // Test 4: Query the effect back
  console.log('\n4️⃣  Querying effect back...');
  const { data: queriedEffect, error: queryError } = await supabase
    .from('effects')
    .select('*')
    .eq('id', effect.id)
    .single();

  if (queryError) {
    console.error('❌ Failed to query effect:', queryError.message);
    return false;
  }

  console.log('✅ Effect queried successfully');
  console.log('   Fields present:', Object.keys(queriedEffect).join(', '));

  // Check for required fields
  const requiredFields = ['id', 'project_id', 'kind', 'track', 'start_at_position', 'duration', 'start', 'end', 'properties'];
  const missingFields = requiredFields.filter(field => !(field in queriedEffect));

  if (missingFields.length > 0) {
    console.error('❌ Missing required fields:', missingFields.join(', '));
    return false;
  }

  // Check for deprecated fields
  const deprecatedFields = ['start_time', 'end_time'];
  const foundDeprecated = deprecatedFields.filter(field => field in queriedEffect);

  if (foundDeprecated.length > 0) {
    console.error('❌ Found deprecated fields:', foundDeprecated.join(', '));
    console.error('   Migration 004 was not fully applied!');
    return false;
  }

  console.log('✅ All required fields present, no deprecated fields');

  // Clean up
  console.log('\n🧹 Cleaning up test data...');
  await supabase.from('effects').delete().eq('id', effect.id);
  await supabase.from('projects').delete().eq('id', project.id);
  console.log('✅ Cleanup complete');

  return true;
}

async function testMediaFileUpload() {
  console.log('\n🧪 Testing Media File Operations...\n');

  console.log('1️⃣  Creating test media file record...');
  const testMediaFile = {
    user_id: '00000000-0000-0000-0000-000000000000',
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

  const { data: mediaFile, error: mediaError } = await supabase
    .from('media_files')
    .insert(testMediaFile)
    .select()
    .single();

  if (mediaError) {
    console.error('❌ Failed to insert media file:', mediaError.message);
    return false;
  }

  console.log('✅ Media file record created:', mediaFile.id);

  // Clean up
  console.log('\n🧹 Cleaning up test media file...');
  await supabase.from('media_files').delete().eq('id', mediaFile.id);
  console.log('✅ Cleanup complete');

  return true;
}

async function main() {
  console.log('🚀 Supabase Integration Test Suite\n');
  console.log('Project URL:', supabaseUrl);
  console.log('━'.repeat(60));

  let allPassed = true;

  try {
    const schemaOk = await testEffectsSchema();
    if (!schemaOk) allPassed = false;

    const mediaOk = await testMediaFileUpload();
    if (!mediaOk) allPassed = false;

    console.log('\n' + '━'.repeat(60));
    if (allPassed) {
      console.log('✅ All integration tests passed!');
      console.log('✅ Database schema is correct and compatible with code.');
    } else {
      console.log('❌ Some tests failed. Please review the errors above.');
      console.log('\n📋 Action Required:');
      console.log('   1. supabase db push    (apply migrations to remote)');
      console.log('   2. Run this test again to verify');
      process.exit(1);
    }
  } catch (error: any) {
    console.error('\n💥 Unexpected error:', error.message);
    process.exit(1);
  }
}

main();
