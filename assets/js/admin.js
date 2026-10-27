// Basil Mark — admin panel
import { CONFIG } from './config.js';
import { isConfigured, getClient } from './store.js';
import { esc, formatPrice, placeholderFor } from './ui.js';

const $ = (sel, root = document) => root.querySelector(sel);
const BUCKET = CONFIG.imageBucket || 'product-images';

let sb = null;
let categories = [];
let products = [];
let currency = 'Rs.';

// ---------------------------------------------------------------- helpers
function toast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.toggle('error', isError);
  t.classList.add('show');
  clearTimeout(toast.timer);
  toast.timer = setTimeout(() => t.classList.remove('show'), isError ? 6000 : 3000);
}

function show(id) {
  for (const s of ['setup-notice', 'loading', 'login', 'app']) $(`#${s}`).hidden = s !== id;
  $('#sign-out').hidden = id !== 'app';
}

export function slugify(s) {
  return String(s).toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);
}

function friendlyError(err) {
  console.error(err);
  if (err?.code === '23505') return 'That link name is already used. Change the link name and save again.';
  if (err?.code === '42501' || /row-level security/i.test(err?.message || '')) {
    return 'This account is not allowed to make changes. Check it is listed in the admins table.';
  }
  if (/fetch/i.test(err?.message || '')) return 'Could not reach the server. Check your internet connection.';
  return err?.message || 'Something went wrong. Try again.';
}

function busy(btn, on, label) {
  if (on) { btn.dataset.label = btn.textContent; btn.textContent = label; btn.disabled = true; }
  else { btn.textContent = btn.dataset.label || btn.textContent; btn.disabled = false; }
}

/** Resize to max 1600px and re-encode, so uploads stay small and fast. */
async function compressImage(file, max = 1600) {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    const w = Math.round(bmp.width * scale), h = Math.round(bmp.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
    let blob = await new Promise((r) => canvas.toBlob(r, 'image/webp', 0.85));
    if (!blob || blob.type !== 'image/webp') blob = await new Promise((r) => canvas.toBlob(r, 'image/jpeg', 0.85));
    return blob || file;
  } catch {
    return file; // unsupported format: upload as-is
  }
}

async function uploadImage(file, folder) {
  const blob = await compressImage(file);
  const ext = blob.type === 'image/webp' ? 'webp' : blob.type === 'image/jpeg' ? 'jpg'
    : (file.name.split('.').pop() || 'img').toLowerCase();
  const path = `${folder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}.${ext}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, blob, {
    contentType: blob.type || file.type, cacheControl: '31536000', upsert: false,
  });
  if (error) throw error;
  return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function storagePath(url) {
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = String(url).indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

async function removeImages(urls) {
  const paths = urls.map(storagePath).filter(Boolean);
  if (!paths.length) return;
  const { error } = await sb.storage.from(BUCKET).remove(paths);
  if (error) console.warn('Could not delete old photos', error);
}

function wireDialog(dialog) {
  dialog.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) dialog.close();
  });
}

// ---------------------------------------------------------------- data
async function loadAll() {
  const [c, p, s] = await Promise.all([
    sb.from('categories').select('*').order('sort_order').order('name'),
    sb.from('products').select('*').order('sort_order').order('created_at', { ascending: false }),
    sb.from('settings').select('key, value'),
  ]);
  for (const r of [c, p, s]) if (r.error) throw r.error;
  categories = c.data;
  products = p.data;
  const settings = Object.fromEntries(s.data.map((r) => [r.key, r.value ?? '']));
  currency = settings.currency || 'Rs.';
  fillSettings(settings);
  renderCategoryFilter();
  renderProducts();
  renderCategories();
}

// ---------------------------------------------------------------- products
const catName = (id) => categories.find((c) => c.id === id)?.name || 'No category';

function renderCategoryFilter() {
  const sel = $('#p-filter');
  const cur = sel.value;
  sel.innerHTML = '<option value="">All categories</option>'
    + categories.map((c) => `<option value="${c.id}">${esc(c.name)}</option>`).join('')
    + '<option value="__none">No category</option>';
  sel.value = cur;
  $('#pf-category').innerHTML = '<option value="">No category</option>'
    + categories.map((c) => `<option value="${c.id}">${esc(c.name)}${c.is_active ? '' : ' (hidden)'}</option>`).join('');
}

function renderProducts() {
  const q = $('#p-search').value.trim().toLowerCase();
  const f = $('#p-filter').value;
  const list = products.filter((p) =>
    (!q || p.name.toLowerCase().includes(q))
    && (!f || (f === '__none' ? !p.category_id : p.category_id === f)));

  $('#p-count').textContent = `${list.length} of ${products.length} products`;
  const rows = $('#product-rows');
  if (!products.length) {
    rows.innerHTML = '<p class="empty">No products yet. Select "Add product" to list your first piece.</p>';
    return;
  }
  rows.innerHTML = list.map((p) => {
    const cat = categories.find((c) => c.id === p.category_id);
    const img = p.images?.[0] || placeholderFor({ ...p, category: cat });
    return `
      <div class="row">
        <img src="${esc(img)}" alt="">
        <div>
          <p class="row-title">${esc(p.name)}</p>
          <p class="row-meta">${esc(catName(p.category_id))} · ${esc(formatPrice(p.price, currency))}</p>
          <div class="badges">
            ${p.is_active ? '' : '<span class="badge badge-hidden">Hidden</span>'}
            ${p.is_featured ? '<span class="badge badge-feat">Featured</span>' : ''}
            ${p.in_stock ? '' : '<span class="badge badge-out">Sold out</span>'}
          </div>
        </div>
        <div class="row-actions">
          <button type="button" data-edit="${p.id}">Edit</button>
          <button type="button" class="danger" data-delete="${p.id}">Delete</button>
        </div>
      </div>`;
  }).join('') || '<p class="empty">No products match your search.</p>';
}

// Photo list used by the product editor: [{url}] or [{file, preview}]
let photos = [];
let originalImages = [];
let editingProduct = null;
let slugTouched = false;

function renderPhotos() {
  $('#pf-photos').innerHTML = photos.map((ph, i) => `
    <div class="photo">
      <img src="${esc(ph.url || ph.preview)}" alt="Photo ${i + 1}">
      ${i === 0 ? '<span class="photo-cover">Cover</span>' : ''}
      <div class="photo-actions">
        ${i === 0 ? '<span></span>' : `<button type="button" data-cover="${i}">Make cover</button>`}
        <button type="button" data-remove="${i}">Remove</button>
      </div>
    </div>`).join('');
}

function openProduct(p = null) {
  editingProduct = p;
  slugTouched = Boolean(p);
  $('#product-dialog-title').textContent = p ? 'Edit product' : 'Add product';
  $('#pf-name').value = p?.name || '';
  $('#pf-slug').value = p?.slug || '';
  $('#pf-category').value = p?.category_id || ($('#p-filter').value.length > 10 ? $('#p-filter').value : '');
  $('#pf-price').value = p?.price ?? '';
  $('#pf-compare').value = p?.compare_at_price ?? '';
  $('#pf-desc').value = p?.description || '';
  $('#pf-active').checked = p ? p.is_active : true;
  $('#pf-featured').checked = p ? p.is_featured : false;
  $('#pf-instock').checked = p ? p.in_stock : true;
  $('#pf-sort').value = p?.sort_order ?? 0;
  $('#pf-error').textContent = '';
  originalImages = [...(p?.images || [])];
  photos = originalImages.map((url) => ({ url }));
  renderPhotos();
  $('#product-dialog').showModal();
  if (!p) $('#pf-name').focus();
}

async function saveProduct(e) {
  e.preventDefault();
  const err = $('#pf-error');
  err.textContent = '';
  const name = $('#pf-name').value.trim();
  const slug = slugify($('#pf-slug').value || name);
  const price = Number($('#pf-price').value);
  if (!name) { err.textContent = 'Enter a product name.'; return $('#pf-name').focus(); }
  if (!slug) { err.textContent = 'Enter a link name.'; return $('#pf-slug').focus(); }
  if ($('#pf-price').value === '' || !(price >= 0)) { err.textContent = 'Enter a price of 0 or more.'; return $('#pf-price').focus(); }
  const compareRaw = $('#pf-compare').value;

  const btn = $('#pf-save');
  busy(btn, true, photos.some((p) => p.file) ? 'Uploading photos…' : 'Saving…');
  try {
    const images = [];
    for (const ph of photos) images.push(ph.url || await uploadImage(ph.file, 'products'));

    const row = {
      name, slug,
      category_id: $('#pf-category').value || null,
      price,
      compare_at_price: compareRaw === '' ? null : Number(compareRaw),
      description: $('#pf-desc').value.trim() || null,
      images,
      is_active: $('#pf-active').checked,
      is_featured: $('#pf-featured').checked,
      in_stock: $('#pf-instock').checked,
      sort_order: Number($('#pf-sort').value) || 0,
    };
    const q = editingProduct
      ? sb.from('products').update(row).eq('id', editingProduct.id).select().single()
      : sb.from('products').insert(row).select().single();
    const { data, error } = await q;
    if (error) {
      // Clean up photos uploaded in this attempt
      await removeImages(images.filter((u) => !originalImages.includes(u)));
      throw error;
    }
    await removeImages(originalImages.filter((u) => !images.includes(u)));

    if (editingProduct) products = products.map((x) => (x.id === data.id ? data : x));
    else products.unshift(data);
    photos.forEach((ph) => ph.preview && URL.revokeObjectURL(ph.preview));
    $('#product-dialog').close();
    renderProducts(); renderCategories();
    toast(editingProduct ? 'Product saved' : 'Product added');
  } catch (ex) {
    err.textContent = friendlyError(ex);
  } finally {
    busy(btn, false);
  }
}

async function deleteProduct(id) {
  const p = products.find((x) => x.id === id);
  if (!p || !confirm(`Delete "${p.name}"? This can't be undone. To take it off the site for now, edit it and untick "Show on site" instead.`)) return;
  const { error } = await sb.from('products').delete().eq('id', id);
  if (error) return toast(friendlyError(error), true);
  await removeImages(p.images || []);
  products = products.filter((x) => x.id !== id);
  renderProducts(); renderCategories();
  toast('Product deleted');
}

// ---------------------------------------------------------------- categories
let editingCategory = null;
let catPhoto = null; // {url} | {file, preview} | null
let catSlugTouched = false;

function renderCategories() {
  const rows = $('#category-rows');
  if (!categories.length) {
    rows.innerHTML = '<p class="empty">No categories yet. Select "Add category" to create one.</p>';
    return;
  }
  rows.innerHTML = categories.map((c) => {
    const n = products.filter((p) => p.category_id === c.id).length;
    const img = c.image_url || products.find((p) => p.category_id === c.id && p.images?.length)?.images[0]
      || placeholderFor({ category: c });
    return `
      <div class="row">
        <img src="${esc(img)}" alt="">
        <div>
          <p class="row-title">${esc(c.name)}</p>
          <p class="row-meta">${n} ${n === 1 ? 'product' : 'products'} · sort ${c.sort_order}</p>
          <div class="badges">${c.is_active ? '' : '<span class="badge badge-hidden">Hidden</span>'}</div>
        </div>
        <div class="row-actions">
          <button type="button" data-cedit="${c.id}">Edit</button>
          <button type="button" class="danger" data-cdelete="${c.id}">Delete</button>
        </div>
      </div>`;
  }).join('');
}

function renderCatPhoto() {
  $('#cf-photo').innerHTML = catPhoto ? `
    <div class="photo">
      <img src="${esc(catPhoto.url || catPhoto.preview)}" alt="Tile image">
      <div class="photo-actions"><span></span><button type="button" data-cremove>Remove</button></div>
    </div>` : '';
}

function openCategory(c = null) {
  editingCategory = c;
  catSlugTouched = Boolean(c);
  $('#category-dialog-title').textContent = c ? 'Edit category' : 'Add category';
  $('#cf-name').value = c?.name || '';
  $('#cf-slug').value = c?.slug || '';
  $('#cf-desc').value = c?.description || '';
  $('#cf-sort').value = c?.sort_order ?? (categories.length ? Math.max(...categories.map((x) => x.sort_order)) + 1 : 1);
  $('#cf-active').checked = c ? c.is_active : true;
  $('#cf-error').textContent = '';
  catPhoto = c?.image_url ? { url: c.image_url } : null;
  renderCatPhoto();
  $('#category-dialog').showModal();
  if (!c) $('#cf-name').focus();
}

async function saveCategory(e) {
  e.preventDefault();
  const err = $('#cf-error');
  err.textContent = '';
  const name = $('#cf-name').value.trim();
  const slug = slugify($('#cf-slug').value || name);
  if (!name) { err.textContent = 'Enter a category name.'; return $('#cf-name').focus(); }
  if (!slug) { err.textContent = 'Enter a link name.'; return $('#cf-slug').focus(); }

  const btn = $('#cf-save');
  busy(btn, true, 'Saving…');
  const oldUrl = editingCategory?.image_url || null;
  try {
    let image_url = catPhoto?.url || null;
    if (catPhoto?.file) image_url = await uploadImage(catPhoto.file, 'categories');
    const row = {
      name, slug,
      description: $('#cf-desc').value.trim() || null,
      sort_order: Number($('#cf-sort').value) || 0,
      is_active: $('#cf-active').checked,
      image_url,
    };
    const { data, error } = editingCategory
      ? await sb.from('categories').update(row).eq('id', editingCategory.id).select().single()
      : await sb.from('categories').insert(row).select().single();
    if (error) {
      if (catPhoto?.file && image_url) await removeImages([image_url]);
      throw error;
    }
    if (oldUrl && oldUrl !== image_url) await removeImages([oldUrl]);
    if (editingCategory) categories = categories.map((x) => (x.id === data.id ? data : x));
    else categories.push(data);
    categories.sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name));
    $('#category-dialog').close();
    renderCategoryFilter(); renderCategories(); renderProducts();
    toast(editingCategory ? 'Category saved' : 'Category added');
  } catch (ex) {
    err.textContent = friendlyError(ex);
  } finally {
    busy(btn, false);
  }
}

async function deleteCategory(id) {
  const c = categories.find((x) => x.id === id);
  const n = products.filter((p) => p.category_id === id).length;
  const note = n ? ` Its ${n} ${n === 1 ? 'product stays' : 'products stay'} on the site under "All" with no category.` : '';
  if (!c || !confirm(`Delete the "${c.name}" category?${note}`)) return;
  const { error } = await sb.from('categories').delete().eq('id', id);
  if (error) return toast(friendlyError(error), true);
  if (c.image_url) await removeImages([c.image_url]);
  categories = categories.filter((x) => x.id !== id);
  products = products.map((p) => (p.category_id === id ? { ...p, category_id: null } : p));
  renderCategoryFilter(); renderCategories(); renderProducts();
  toast('Category deleted');
}

// ---------------------------------------------------------------- settings
function fillSettings(s) {
  for (const el of document.querySelectorAll('#settings-form [data-key]')) el.value = s[el.dataset.key] ?? '';
}

async function saveSettings(e) {
  e.preventDefault();
  const btn = e.submitter || $('#settings-form button[type="submit"]');
  busy(btn, true, 'Saving…');
  const rows = [...document.querySelectorAll('#settings-form [data-key]')].map((el) => ({
    key: el.dataset.key, value: el.value.trim(), updated_at: new Date().toISOString(),
  }));
  const { error } = await sb.from('settings').upsert(rows, { onConflict: 'key' });
  busy(btn, false);
  if (error) return toast(friendlyError(error), true);
  currency = rows.find((r) => r.key === 'currency')?.value || 'Rs.';
  renderProducts();
  toast('Settings saved');
}

// ---------------------------------------------------------------- auth & boot
async function enterApp() {
  show('loading');
  const { data: isAdmin, error } = await sb.rpc('is_admin');
  if (error || !isAdmin) {
    await sb.auth.signOut();
    show('login');
    $('#login-error').textContent = error
      ? friendlyError(error)
      : 'This account is not an admin. Add it to the admins table (see README, step 4).';
    return;
  }
  try {
    await loadAll();
    show('app');
  } catch (ex) {
    show('login');
    $('#login-error').textContent = friendlyError(ex);
  }
}

function wire() {
  // tabs
  $('.tabs').addEventListener('click', (e) => {
    const b = e.target.closest('[data-tab]');
    if (!b) return;
    document.querySelectorAll('.tabs [data-tab]').forEach((x) => x.setAttribute('aria-selected', String(x === b)));
    document.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = p.id !== `tab-${b.dataset.tab}`; });
  });

  // login
  $('#login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const f = new FormData(e.target);
    const btn = e.target.querySelector('button[type="submit"]');
    $('#login-error').textContent = '';
    busy(btn, true, 'Signing in…');
    const { error } = await sb.auth.signInWithPassword({ email: f.get('email'), password: f.get('password') });
    busy(btn, false);
    if (error) {
      $('#login-error').textContent = /invalid/i.test(error.message)
        ? 'The email or password is incorrect.' : friendlyError(error);
      return;
    }
    enterApp();
  });
  $('#sign-out').addEventListener('click', async () => { await sb.auth.signOut(); show('login'); });

  // products
  $('#add-product').addEventListener('click', () => openProduct());
  $('#p-search').addEventListener('input', renderProducts);
  $('#p-filter').addEventListener('change', renderProducts);
  $('#product-rows').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-edit]');
    const del = e.target.closest('[data-delete]');
    if (ed) openProduct(products.find((p) => p.id === ed.dataset.edit));
    if (del) deleteProduct(del.dataset.delete);
  });
  $('#pf-name').addEventListener('input', () => { if (!slugTouched) $('#pf-slug').value = slugify($('#pf-name').value); });
  $('#pf-slug').addEventListener('input', () => { slugTouched = true; });
  $('#pf-files').addEventListener('change', (e) => {
    for (const file of e.target.files) photos.push({ file, preview: URL.createObjectURL(file) });
    e.target.value = '';
    renderPhotos();
  });
  $('#pf-photos').addEventListener('click', (e) => {
    const cov = e.target.closest('[data-cover]');
    const rem = e.target.closest('[data-remove]');
    if (cov) { const [ph] = photos.splice(Number(cov.dataset.cover), 1); photos.unshift(ph); }
    if (rem) { const [ph] = photos.splice(Number(rem.dataset.remove), 1); if (ph.preview) URL.revokeObjectURL(ph.preview); }
    renderPhotos();
  });
  $('#product-form').addEventListener('submit', saveProduct);
  wireDialog($('#product-dialog'));

  // categories
  $('#add-category').addEventListener('click', () => openCategory());
  $('#category-rows').addEventListener('click', (e) => {
    const ed = e.target.closest('[data-cedit]');
    const del = e.target.closest('[data-cdelete]');
    if (ed) openCategory(categories.find((c) => c.id === ed.dataset.cedit));
    if (del) deleteCategory(del.dataset.cdelete);
  });
  $('#cf-name').addEventListener('input', () => { if (!catSlugTouched) $('#cf-slug').value = slugify($('#cf-name').value); });
  $('#cf-slug').addEventListener('input', () => { catSlugTouched = true; });
  $('#cf-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) catPhoto = { file, preview: URL.createObjectURL(file) };
    e.target.value = '';
    renderCatPhoto();
  });
  $('#cf-photo').addEventListener('click', (e) => { if (e.target.closest('[data-cremove]')) { catPhoto = null; renderCatPhoto(); } });
  $('#category-form').addEventListener('submit', saveCategory);
  wireDialog($('#category-dialog'));

  // settings
  $('#settings-form').addEventListener('submit', saveSettings);
}

async function boot() {
  if (!isConfigured()) { show('setup-notice'); return; }
  try {
    sb = await getClient();
  } catch (ex) {
    show('setup-notice');
    toast('Could not load the Supabase library. Check your internet connection.', true);
    console.error(ex);
    return;
  }
  wire();
  const { data } = await sb.auth.getSession();
  if (data.session) enterApp();
  else show('login');
}

boot();
