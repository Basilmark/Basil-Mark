import { renderChrome, productCard, esc, setTitle, showError } from '../ui.js';
import { getProducts } from '../store.js';

const { settings, categories } = await renderChrome('shop');

const params = new URLSearchParams(location.search);
let current = params.get('c') || '';
let sortBy = params.get('sort') || 'featured';
let all = [];

const grid = document.getElementById('grid');
const chips = document.getElementById('chips');
const count = document.getElementById('count');
const sortSel = document.getElementById('sort');
sortSel.value = sortBy;

grid.innerHTML = Array.from({ length: 8 }, () =>
  '<div class="card skeleton"><div class="card-media"></div><div class="skeleton-line"></div></div>').join('');

function renderChips() {
  const opts = [{ slug: '', name: 'All' }, ...categories];
  chips.innerHTML = opts.map((c) =>
    `<button type="button" class="chip" data-slug="${esc(c.slug)}" aria-pressed="${c.slug === current}">${esc(c.name)}</button>`).join('');
}

function sorted(list) {
  const l = [...list];
  if (sortBy === 'new') l.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  else if (sortBy === 'price-asc') l.sort((a, b) => a.price - b.price);
  else if (sortBy === 'price-desc') l.sort((a, b) => b.price - a.price);
  else l.sort((a, b) => (b.is_featured - a.is_featured) || (a.sort_order - b.sort_order));
  return l;
}

function render() {
  const cat = categories.find((c) => c.slug === current);
  document.getElementById('shop-title').textContent = cat ? cat.name : 'The collection';
  document.getElementById('shop-desc').textContent = cat?.description || `Every piece in the ${settings.store_name} range.`;
  setTitle(cat ? cat.name : 'Shop', settings.store_name);

  const list = sorted(current ? all.filter((p) => p.category?.slug === current) : all);
  count.textContent = `${list.length} ${list.length === 1 ? 'piece' : 'pieces'}`;
  grid.innerHTML = list.map((p) => productCard(p, settings.currency)).join('')
    || '<p class="empty">Nothing in this category yet. New pieces are added regularly.</p>';
  renderChips();
}

function syncUrl() {
  const q = new URLSearchParams();
  if (current) q.set('c', current);
  if (sortBy !== 'featured') q.set('sort', sortBy);
  history.replaceState(null, '', `${location.pathname}${q.toString() ? `?${q}` : ''}`);
}

chips.addEventListener('click', (e) => {
  const b = e.target.closest('.chip');
  if (!b) return;
  current = b.dataset.slug;
  syncUrl(); render();
});
sortSel.addEventListener('change', () => { sortBy = sortSel.value; syncUrl(); render(); });

renderChips();
try {
  all = await getProducts();
  render();
} catch (err) {
  showError(grid, err);
  count.textContent = '';
}
