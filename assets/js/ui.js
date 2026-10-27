// Shared page chrome and helpers for the storefront.
import { isConfigured, getSettings, getCategories } from './store.js';

export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => (
  { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function formatPrice(value, currency = 'Rs.') {
  const n = Number(value || 0);
  return `${currency} ${n.toLocaleString('en-PK', { maximumFractionDigits: 0 })}`;
}

export function placeholderFor(item) {
  const key = `${item?.category?.slug || ''} ${item?.category?.name || ''} ${item?.slug || ''} ${item?.name || ''}`.toLowerCase();
  if (key.includes('belt')) return 'assets/img/placeholder-belt.svg';
  if (key.includes('wallet') || key.includes('card')) return 'assets/img/placeholder-wallet.svg';
  if (key.includes('cuff')) return 'assets/img/placeholder-cufflinks.svg';
  return 'assets/img/placeholder-item.svg';
}

export const coverImage = (p) => (p.images && p.images[0]) || placeholderFor(p);

// --- contact links -------------------------------------------------------
export function whatsappNumber(raw) {
  let d = String(raw || '').replace(/\D/g, '');
  if (!d) return '';
  if (d.startsWith('00')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('03')) d = '92' + d.slice(1); // Pakistani mobile 03xx…
  return d;
}

export function whatsappLink(raw, text = '') {
  const n = whatsappNumber(raw);
  if (!n) return '';
  return `https://wa.me/${n}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

function handleFrom(raw, host) {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (v.startsWith('@')) return v.slice(1);
  try {
    const u = new URL(v.startsWith('http') ? v : `https://${v}`);
    if (!u.hostname.includes(host)) return '';
    return u.pathname.split('/').filter(Boolean)[0] || '';
  } catch { return /^[\w.]+$/.test(v) ? v : ''; }
}

export function instagramUrl(raw) {
  const h = handleFrom(raw, 'instagram');
  return h ? `https://instagram.com/${h}` : '';
}
export function instagramDm(raw) {
  const h = handleFrom(raw, 'instagram');
  return h ? `https://ig.me/m/${h}` : '';
}
export function facebookUrl(raw) {
  const v = String(raw || '').trim();
  if (!v) return '';
  if (v.startsWith('http')) return v;
  return `https://facebook.com/${v.replace(/^@/, '')}`;
}
export function facebookDm(raw) {
  const h = handleFrom(raw, 'facebook');
  if (h && !['profile.php', 'pages', 'people'].includes(h)) return `https://m.me/${h}`;
  return facebookUrl(raw);
}

// --- icons ---------------------------------------------------------------
export const icons = {
  whatsapp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.26 8.26 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.55-3.7 8.24-8.24 8.24Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.1-.22-.16-.47-.29Z"/></svg>',
  instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M7 3h10a4 4 0 0 1 4 4v10a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V7a4 4 0 0 1 4-4Z"/><circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="17.5" cy="6.5" r="1.1" fill="currentColor"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.5 21v-7.5h2.6l.4-3h-3V8.6c0-.87.25-1.46 1.5-1.46h1.6V4.46A21 21 0 0 0 14.3 4.3c-2.3 0-3.8 1.4-3.8 3.96v2.24H7.9v3h2.6V21h3Z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M3.5 6h17v12h-17zM3.5 6.5l8.5 7 8.5-7"/></svg>',
  phone: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M6.6 3.5h3l1.5 4-2 1.3a11 11 0 0 0 6.1 6.1l1.3-2 4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 4.6 5.7a2 2 0 0 1 2-2.2Z"/></svg>',
  pin: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="none" stroke="currentColor" stroke-width="1.8" d="M12 21s-6.5-6.2-6.5-11.2a6.5 6.5 0 0 1 13 0C18.5 14.8 12 21 12 21Z"/><circle cx="12" cy="9.8" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/></svg>',
};

export function socialLinks(s) {
  const out = [];
  const wa = whatsappLink(s.whatsapp_number);
  if (wa) out.push({ key: 'whatsapp', label: 'WhatsApp', href: wa });
  const ig = instagramUrl(s.instagram_url);
  if (ig) out.push({ key: 'instagram', label: 'Instagram', href: ig });
  const fb = facebookUrl(s.facebook_url);
  if (fb) out.push({ key: 'facebook', label: 'Facebook', href: fb });
  return out;
}

// --- page chrome ---------------------------------------------------------
export function productCard(p, currency) {
  const url = `product.html?p=${encodeURIComponent(p.slug)}`;
  const sale = p.compare_at_price && Number(p.compare_at_price) > Number(p.price);
  return `
    <a class="card" href="${url}">
      <div class="card-media">
        <img src="${esc(coverImage(p))}" alt="${esc(p.name)}" loading="lazy" width="600" height="750">
        ${!p.in_stock ? '<span class="tag">Sold out</span>' : sale ? '<span class="tag tag-sale">Sale</span>' : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title">${esc(p.name)}</h3>
        <p class="card-price">
          ${sale ? `<s>${esc(formatPrice(p.compare_at_price, currency))}</s>` : ''}
          <span>${esc(formatPrice(p.price, currency))}</span>
        </p>
      </div>
    </a>`;
}

export function setTitle(part, storeName = 'Basil Mark') {
  document.title = part ? `${part} | ${storeName}` : storeName;
}

export async function renderChrome(active = '') {
  const [settings, categories] = await Promise.all([
    getSettings(),
    getCategories().catch(() => []),
  ]);
  const name = settings.store_name || 'Basil Mark';

  const header = document.getElementById('site-header');
  if (header) {
    const link = (href, label, key) =>
      `<a href="${href}"${active === key ? ' aria-current="page"' : ''}>${label}</a>`;
    header.innerHTML = `
      ${isConfigured() ? '' : '<p class="preview-bar">Preview mode: these are sample products. Connect the store to show your own.</p>'}
      <div class="header-inner wrap">
        <a class="wordmark" href="index.html" aria-label="${esc(name)} home">${esc(name)}</a>
        <button class="menu-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
          <span class="menu-bars" aria-hidden="true"></span><span class="sr-only">Menu</span>
        </button>
        <nav id="site-nav" class="site-nav" aria-label="Main">
          ${link('shop.html', 'Shop', 'shop')}
          ${link('about.html', 'About', 'about')}
          ${link('contact.html', 'Contact', 'contact')}
        </nav>
      </div>`;
    const btn = header.querySelector('.menu-toggle');
    btn.addEventListener('click', () => {
      const open = btn.getAttribute('aria-expanded') !== 'true';
      btn.setAttribute('aria-expanded', String(open));
      header.classList.toggle('nav-open', open);
    });
  }

  const footer = document.getElementById('site-footer');
  if (footer) {
    const socials = socialLinks(settings);
    footer.innerHTML = `
      <div class="strap strap-thin" aria-hidden="true"></div>
      <div class="footer-inner wrap">
        <div class="footer-brand">
          <a class="wordmark" href="index.html">${esc(name)}</a>
          <p>${esc(settings.tagline)}</p>
        </div>
        <div class="footer-col">
          <h2>Shop</h2>
          <ul>
            <li><a href="shop.html">All products</a></li>
            ${categories.map((c) => `<li><a href="shop.html?c=${encodeURIComponent(c.slug)}">${esc(c.name)}</a></li>`).join('')}
          </ul>
        </div>
        <div class="footer-col">
          <h2>${esc(name)}</h2>
          <ul>
            <li><a href="about.html">About us</a></li>
            <li><a href="contact.html">Contact</a></li>
          </ul>
        </div>
        ${socials.length ? `
        <div class="footer-col">
          <h2>Follow and message</h2>
          <ul class="footer-social">
            ${socials.map((s) => `<li><a href="${esc(s.href)}" target="_blank" rel="noopener">${icons[s.key]}${s.label}</a></li>`).join('')}
          </ul>
        </div>` : ''}
      </div>
      <p class="footer-legal wrap">© ${new Date().getFullYear()} ${esc(name)}</p>`;
  }

  return { settings, categories };
}

export function showError(el, err) {
  console.error(err);
  el.innerHTML = '<p class="empty">The products could not be loaded. Check your connection and refresh the page.</p>';
}
