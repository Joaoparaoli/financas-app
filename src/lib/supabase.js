import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const hasPublicConfig = Boolean(supabaseUrl && supabaseKey);

export const supabase = hasPublicConfig && typeof window !== 'undefined'
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Cliente para uso no servidor (com service role key se necessário)
export const supabaseAdmin = hasPublicConfig
  ? createClient(
      supabaseUrl,
      process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey
    )
  : null;

// Fixed UUIDs for local profiles (profile-1..5 → stable UUID)
export const PROFILE_UUID_MAP = {
  'profile-1': '00000000-0000-0000-0000-000000000001',
  'profile-2': '00000000-0000-0000-0000-000000000002',
  'profile-3': '00000000-0000-0000-0000-000000000003',
  'profile-4': '00000000-0000-0000-0000-000000000004',
  'profile-5': '00000000-0000-0000-0000-000000000005',
};

export function profileIdToUUID(profileId) {
  return PROFILE_UUID_MAP[profileId] || null;
}
