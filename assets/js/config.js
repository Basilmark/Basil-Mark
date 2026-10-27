// =====================================================================
// Basil Mark — connection settings
//
// After creating your Supabase project, paste its two values below
// (Supabase > Project Settings > API, or the "Connect" button).
// Until then the site runs in preview mode with sample products.
//
// The publishable / anon key is designed to be public. Never paste the
// "secret" or "service_role" key here.
// =====================================================================

export const CONFIG = {
  supabaseUrl: 'https://vgnogxugqopeazfxctsf.supabase.co',      // e.g. 'https://abcdefghijkl.supabase.co'
  supabaseAnonKey: 'sb_publishable_J0N-TQBUyicTSiOenSYH0A_PeQPdx2g',  // starts with 'sb_publishable_' or 'eyJ...'

  // Name of the photo storage bucket created by supabase/setup.sql
  imageBucket: 'product-images',
};
