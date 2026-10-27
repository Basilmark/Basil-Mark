import { renderChrome, productCard, coverImage, placeholderFor, formatPrice, esc, showError, whatsappNumber } from '../ui.js';
import { getProducts } from '../store.js';

const { settings, categories } = await renderChrome('home');

if (settings.tagline) document.getElementById('hero-title').textContent = settings.tagline;
if (settings.store_name) document.title = `${settings.store_name} | ${categories.map((c) => c.name).slice(0, 3).join(', ') || 'Men\'s accessories'}`;

const featuredGrid = document.getElementById('featured-grid');
const catGrid = document.getElementById('cat-grid');

try {
  const all = await getProducts();
  let featured = all.filter((p) => p.is_featured);
  if (!featured.length) featured = all;
  featured = featured.slice(0, 8);

  // Category tiles: use the category's own image, else its first product photo, else a placeholder.
  catGrid.innerHTML = categories.map((c) => {
    const items = all.filter((p) => p.category_id === c.id);
    const firstPhoto = items.find((p) => p.images?.length)?.images[0];
    const img = c.image_url || firstPhoto || placeholderFor({ category: c });
    return `
      <a class="cat-tile" href="shop.html?c=${encodeURIComponent(c.slug)}">
        <img src="${esc(img)}" alt="" loading="lazy">
        <div class="cat-tile-label">
          <h3>${esc(c.name)}</h3>
          <span>${items.length} ${items.length === 1 ? 'piece' : 'pieces'}</span>
        </div>
      </a>`;
  }).join('') || '<p class="empty">Categories will appear here once they are added.</p>';

  featuredGrid.innerHTML = featured.map((p) => productCard(p, settings.currency)).join('')
    || '<p class="empty">New pieces are on their way. Check back soon.</p>';

  const hero = featured[0];
  if (hero) {
    const fig = document.getElementById('hero-figure');
    fig.innerHTML = `
      <img src="${esc(coverImage(hero))}" alt="${esc(hero.name)}">
      <figcaption><a href="product.html?p=${encodeURIComponent(hero.slug)}"><strong>${esc(hero.name)}</strong>${esc(formatPrice(hero.price, settings.currency))}</a></figcaption>`;
    fig.hidden = false;
  }
} catch (err) {
  showError(featuredGrid, err);
  catGrid.innerHTML = '';
}

if (whatsappNumber(settings.whatsapp_number)) {
  document.getElementById('step-2-text').textContent =
    'Tap "Order on WhatsApp" on the product page. The product name and price are filled in for you.';
}
