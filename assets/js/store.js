// Data layer: reads from Supabase, or from sample data in preview mode.
import { CONFIG } from './config.js';
import { DEMO } from './demo-data.js';

const SUPABASE_ESM = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

let clientPromise = null;
let settingsPromise = null;

export function isConfigured() {
  return Boolean(CONFIG.supabaseUrl && CONFIG.supabaseAnonKey);
}

export function getClient() {
  if (!isConfigured()) return Promise.resolve(null);
  if (!clientPromise) {
    clientPromise = import(SUPABASE_ESM).then(({ createClient }) =>
      createClient(CONFIG.supabaseUrl, CONFIG.supabaseAnonKey));
  }
  return clientPromise;
}

const bySort = (a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0) || a.name.localeCompare(b.name);

function attachCategory(product, categories) {
  const c = categories.find((x) => x.id === product.category_id);
  return { ...product, category: c ? { id: c.id, name: c.name, slug: c.slug } : null };
}

export async function getCategories() {
  const sb = await getClient();
  if (!sb) return DEMO.categories.filter((c) => c.is_active).sort(bySort);
  const { data, error } = await sb.from('categories').select('*').eq('is_active', true)
    .order('sort_order').order('name');
  if (error) throw error;
  return data;
}

/**
 * @param {{category?: string, featured?: boolean, limit?: number, excludeId?: string}} opts
 */
export async function getProducts(opts = {}) {
  const sb = await getClient();
  const categories = await getCategories();
  const activeCatIds = new Set(categories.map((c) => c.id));

  let list;
  if (!sb) {
    list = DEMO.products.filter((p) => p.is_active).map((p) => attachCategory(p, categories));
  } else {
    const { data, error } = await sb.from('products')
      .select('*, category:categories(id, name, slug)')
      .eq('is_active', true)
      .order('sort_order').order('created_at', { ascending: false });
    if (error) throw error;
    list = data;
  }

  // Hide products whose category was hidden; keep uncategorised ones.
  list = list.filter((p) => !p.category_id || activeCatIds.has(p.category_id));
  if (opts.category) list = list.filter((p) => p.category?.slug === opts.category);
  if (opts.featured) list = list.filter((p) => p.is_featured);
  if (opts.excludeId) list = list.filter((p) => p.id !== opts.excludeId);
  list.sort(bySort);
  if (opts.limit) list = list.slice(0, opts.limit);
  return list;
}

export async function getProduct(slug) {
  const sb = await getClient();
  if (!sb) {
    const categories = await getCategories();
    const p = DEMO.products.find((x) => x.slug === slug && x.is_active);
    return p ? attachCategory(p, categories) : null;
  }
  const { data, error } = await sb.from('products')
    .select('*, category:categories(id, name, slug)')
    .eq('slug', slug).eq('is_active', true).maybeSingle();
  if (error) throw error;
  return data;
}

export function getSettings() {
  if (!settingsPromise) {
    settingsPromise = (async () => {
      const base = { ...DEMO.settings };
      const sb = await getClient();
      if (!sb) return base;
      const { data, error } = await sb.from('settings').select('key, value');
      if (error) { console.error(error); return base; }
      for (const row of data) base[row.key] = row.value ?? '';
      return base;
    })();
  }
  return settingsPromise;
}
