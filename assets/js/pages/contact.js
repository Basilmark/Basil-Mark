import { renderChrome, esc, setTitle, icons, whatsappLink, whatsappNumber, instagramUrl, facebookUrl } from '../ui.js';

const { settings: s } = await renderChrome('contact');
setTitle('Contact', s.store_name);

const rows = [];
const wa = whatsappLink(s.whatsapp_number);
if (wa) rows.push({ icon: 'whatsapp', title: 'WhatsApp', detail: `+${whatsappNumber(s.whatsapp_number)}`, href: wa });
const ig = instagramUrl(s.instagram_url);
if (ig) rows.push({ icon: 'instagram', title: 'Instagram', detail: ig.replace('https://', ''), href: ig });
const fb = facebookUrl(s.facebook_url);
if (fb) rows.push({ icon: 'facebook', title: 'Facebook', detail: fb.replace(/^https?:\/\/(www\.)?/, ''), href: fb });
if (s.email) rows.push({ icon: 'mail', title: 'Email', detail: s.email, href: `mailto:${s.email}` });
if (s.phone) rows.push({ icon: 'phone', title: 'Phone', detail: s.phone, href: `tel:${s.phone.replace(/[^\d+]/g, '')}` });
if (s.city) rows.push({ icon: 'pin', title: 'Based in', detail: s.city });

const list = document.getElementById('contact-list');
if (!rows.length) {
  document.getElementById('contact-lede').textContent = 'Our contact details will be added here soon.';
  list.remove();
} else {
  list.innerHTML = rows.map((r) => {
    const inner = `${icons[r.icon]}<div><strong>${esc(r.title)}</strong><span>${esc(r.detail)}</span></div>`;
    return r.href
      ? `<li><a href="${esc(r.href)}"${r.href.startsWith('http') ? ' target="_blank" rel="noopener"' : ''}>${inner}</a></li>`
      : `<li><div class="contact-row">${inner}</div></li>`;
  }).join('');
}
