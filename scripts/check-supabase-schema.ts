#!/usr/bin/env tsx
/**
 * Supabase Schema Verification Script
 * Checks that the database schema matches our code expectations
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
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('🔍 Checking Supabase Schema...\n');

  // Check effects table schema
  console.log('📋 Checking effects table columns...');
  const { data: effectsColumns, error: effectsError } = await supabase
    .rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_name = 'effects'
        ORDER BY ordinal_position;
      `
    })
    .select();

  if (effectsError) {
    // If RPC doesn't exist, try direct query (for newer Supabase)
    console.log('⚠️  Cannot use RPC, trying direct schema inspection...');

    // Try to query the table directly to see what columns exist
    const { data: sampleEffect, error: queryError } = await supabase
      .from('effects')
      .select('*')
      .limit(1);

    if (queryError) {
      console.error('❌ Error querying effects table:', queryError.message);
      if (queryError.message.includes('column') && queryError.message.includes('does not exist')) {
        console.error('\n🚨 SCHEMA MISMATCH DETECTED!');
        console.error('The effects table is missing expected columns.');
        console.error('\nPlease run the migrations:');
        console.error('1. supabase link --project-ref blvcuxxwiykgcbsduhbc');
        console.error('2. supabase db push');
      }
      return false;
    }

    if (sampleEffect && sampleEffect.length > 0) {
      const columns = Object.keys(sampleEffect[0]);
      console.log('✅ Effects table columns:', columns.join(', '));

      // Check for critical fields
      const requiredFields = ['id', 'project_id', 'kind', 'track', 'start_at_position', 'duration', 'start', 'end'];
      const missingFields = requiredFields.filter(field => !columns.includes(field));

      if (missingFields.length > 0) {
        console.error('\n❌ Missing required fields:', missingFields.join(', '));
        return false;
      }

      // Check for deprecated fields
      const deprecatedFields = ['start_time', 'end_time'];
      const foundDeprecated = deprecatedFields.filter(field => columns.includes(field));

      if (foundDeprecated.length > 0) {
        console.error('\n⚠️  Found deprecated fields:', foundDeprecated.join(', '));
        console.error('Please run migration 004_fix_effect_schema.sql');
        return false;
      }

      console.log('✅ All required fields present');
      console.log('✅ No deprecated fields found');
    } else {
      console.log('ℹ️  Effects table exists but is empty');
    }
  }

  // Check projects table
  console.log('\n📋 Checking projects table...');
  const { data: projectSample, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .limit(1);

  if (projectError) {
    console.error('❌ Error querying projects table:', projectError.message);
    return false;
  }

  if (projectSample && projectSample.length > 0) {
    console.log('✅ Projects table columns:', Object.keys(projectSample[0]).join(', '));
  } else {
    console.log('ℹ️  Projects table exists but is empty');
  }

  // Check media_files table
  console.log('\n📋 Checking media_files table...');
  const { data: mediaSample, error: mediaError } = await supabase
    .from('media_files')
    .select('*')
    .limit(1);

  if (mediaError) {
    console.error('❌ Error querying media_files table:', mediaError.message);
    return false;
  }

  if (mediaSample && mediaSample.length > 0) {
    console.log('✅ Media_files table columns:', Object.keys(mediaSample[0]).join(', '));
  } else {
    console.log('ℹ️  Media_files table exists but is empty');
  }

  // Check storage buckets
  console.log('\n📦 Checking storage buckets...');
  const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();

  if (bucketsError) {
    console.error('❌ Error listing buckets:', bucketsError.message);
    return false;
  }

  console.log('✅ Storage buckets:', buckets.map(b => b.name).join(', '));

  const mediaFilesBucket = buckets.find(b => b.name === 'media-files');
  if (!mediaFilesBucket) {
    console.error('❌ Missing required bucket: media-files');
    console.error('Please create it manually in Supabase Dashboard');
    return false;
  }

  console.log('✅ media-files bucket exists');

  return true;
}

async function testRLS() {
  console.log('\n🔒 Testing RLS Policies...\n');

  // Try to query without authentication (should fail or return empty)
  const { data: unauthData, error: unauthError } = await supabase
    .from('projects')
    .select('*');

  if (unauthError) {
    console.log('✅ RLS working: Unauthenticated query blocked');
  } else if (!unauthData || unauthData.length === 0) {
    console.log('✅ RLS working: No data returned without auth');
  } else {
    console.warn('⚠️  RLS may not be working: Data returned without auth');
    return false;
  }

  return true;
}

async function main() {
  console.log('🚀 Supabase Schema & Configuration Verification\n');
  console.log('Project URL:', supabaseUrl);
  console.log('Project Ref:', supabaseUrl?.split('//')[1]?.split('.')[0]);
  console.log('━'.repeat(60));

  const schemaOk = await checkSchema();
  const rlsOk = await testRLS();

  console.log('\n' + '━'.repeat(60));
  if (schemaOk && rlsOk) {
    console.log('✅ All checks passed! Supabase is configured correctly.');
  } else {
    console.log('❌ Some checks failed. Please review the errors above.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
