import { renderChrome, esc, setTitle } from '../ui.js';
import { getProducts } from '../store.js';

const { settings } = await renderChrome('about');
setTitle('About us', settings.store_name);

document.getElementById('about-text').innerHTML = String(settings.about_text || '')
  .split(/\n{2,}/).map((t) => `<p>${esc(t).replace(/\n/g, '<br>')}</p>`).join('');

// Use a real product photo on this page once one exists.
try {
  const photo = (await getProducts()).find((p) => p.images?.length)?.images[0];
  if (photo) document.getElementById('about-img').src = photo;
} catch { /* keep the placeholder */ }
