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
