import {
  renderChrome, productCard, coverImage, formatPrice, esc, setTitle, icons,
  whatsappLink, instagramDm, facebookDm,
} from '../ui.js';
import { getProduct, getProducts } from '../store.js';

const { settings } = await renderChrome('shop');
const slug = new URLSearchParams(location.search).get('p');
const root = document.getElementById('product');
const crumbs = document.getElementById('crumbs');

const paragraphs = (text) => String(text || '').split(/\n{2,}/).map((t) =>
  `<p>${esc(t).replace(/\n/g, '<br>')}</p>`).join('');

function notFound() {
  setTitle('Product not found', settings.store_name);
  root.innerHTML = `
    <div>
      <h1>This product isn't available</h1>
      <p style="margin-top:1rem;color:var(--muted)">It may have been removed or the link is incorrect.</p>
      <p><a class="btn" href="shop.html">Back to the shop</a></p>
    </div>`;
}

function orderButtons(p) {
  const pageUrl = location.href.split('#')[0];
  const msg = `Hi ${settings.store_name}, I'd like to order:\n${p.name} (${formatPrice(p.price, settings.currency)})\n${pageUrl}`;
  const wa = whatsappLink(settings.whatsapp_number, msg);
  const ig = instagramDm(settings.instagram_url);
  const fb = facebookDm(settings.facebook_url);
  const out = [];
  if (wa) out.push(`<a class="btn btn-wa btn-block" href="${esc(wa)}" target="_blank" rel="noopener">${icons.whatsapp}Order on WhatsApp</a>`,
    '<p class="order-note">The product name and price are filled in for you.</p>');
  if (ig) out.push(`<a class="btn btn-outline btn-block" href="${esc(ig)}" target="_blank" rel="noopener">${icons.instagram}Message on Instagram</a>`);
  if (fb) out.push(`<a class="btn btn-outline btn-block" href="${esc(fb)}" target="_blank" rel="noopener">${icons.facebook}Message on Facebook</a>`);
  if (!out.length) {
    return `<div class="order-soon"><p>Ordering details will be added here soon.</p></div>`;
  }
  return out.join('');
}

if (!slug) {
  notFound();
} else {
  try {
    const p = await getProduct(slug);
    if (!p) {
      notFound();
    } else {
      setTitle(p.name, settings.store_name);
      document.querySelector('meta[name="description"]')?.setAttribute('content',
        String(p.description || p.name).slice(0, 155));

      if (p.category) {
        crumbs.innerHTML = `<a href="shop.html">Shop</a> / <a href="shop.html?c=${encodeURIComponent(p.category.slug)}">${esc(p.category.name)}</a>`;
      }

      const images = p.images?.length ? p.images : [coverImage(p)];
      const sale = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);

      root.innerHTML = `
        <div class="gallery">
          <div class="gallery-main"><img id="main-img" src="${esc(images[0])}" alt="${esc(p.name)}"></div>
          ${images.length > 1 ? `<div class="thumbs" role="group" aria-label="Product photos">
            ${images.map((src, i) => `<button type="button" data-i="${i}" aria-current="${i === 0}" aria-label="Photo ${i + 1} of ${images.length}"><img src="${esc(src)}" alt=""></button>`).join('')}
          </div>` : ''}
        </div>
        <div class="product-info">
          ${p.category ? `<a class="product-cat" href="shop.html?c=${encodeURIComponent(p.category.slug)}">${esc(p.category.name)}</a>` : ''}
          <h1>${esc(p.name)}</h1>
          <p class="price">${sale ? `<s>${esc(formatPrice(p.compare_at_price, settings.currency))}</s>` : ''}<span>${esc(formatPrice(p.price, settings.currency))}</span></p>
          <p class="stock ${p.in_stock ? '' : 'out'}">${p.in_stock ? 'In stock' : 'Sold out. Message us to ask when it\'s back.'}</p>
          <div class="order-box">${orderButtons(p)}</div>
          ${p.description ? `<div class="product-desc">${paragraphs(p.description)}</div>` : ''}
        </div>`;

      const main = document.getElementById('main-img');
      root.querySelector('.thumbs')?.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        main.src = images[Number(b.dataset.i)];
        root.querySelectorAll('.thumbs button').forEach((x) => x.setAttribute('aria-current', String(x === b)));
      });

      const related = await getProducts({ category: p.category?.slug, excludeId: p.id, limit: 4 });
      if (related.length) {
        document.getElementById('related-grid').innerHTML = related.map((r) => productCard(r, settings.currency)).join('');
        document.getElementById('related').hidden = false;
      }
    }
  } catch (err) {
    console.error(err);
    root.innerHTML = '<p class="empty">This product could not be loaded. Check your connection and refresh the page.</p>';
  }
}
