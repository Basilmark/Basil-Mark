// Sample content shown only while Supabase is not connected (preview mode).

const cats = [
  { id: 'c-belts', name: 'Belts', slug: 'belts', description: 'Leather belts for the office, the weekend and everything between.', image_url: null, sort_order: 1, is_active: true },
  { id: 'c-wallets', name: 'Wallets', slug: 'wallets', description: 'Slim wallets and card holders that sit flat in a pocket.', image_url: null, sort_order: 2, is_active: true },
  { id: 'c-cuff', name: 'Cufflinks', slug: 'cufflinks', description: 'The finishing touch for a formal shirt.', image_url: null, sort_order: 3, is_active: true },
];

const p = (i, name, slug, cat, price, desc, extra = {}) => ({
  id: 'p-' + i, name, slug, category_id: cat, price, compare_at_price: null,
  description: desc, images: [], is_featured: false, is_active: true, in_stock: true,
  sort_order: i, attributes: {}, created_at: new Date(Date.now() - i * 864e5).toISOString(),
  ...extra,
});

const products = [
  p(1, 'Heritage Leather Belt', 'heritage-leather-belt', 'c-belts', 3800,
    'Full-grain leather with a brushed brass buckle. A 35 mm strap that works with jeans and chinos and softens with wear.',
    { is_featured: true }),
  p(2, 'Reversible Dress Belt', 'reversible-dress-belt', 'c-belts', 4200,
    'Black on one side, dark brown on the other. Twist the buckle to switch, so one belt covers both shoe colours.',
    { is_featured: true, compare_at_price: 4800 }),
  p(3, 'Braided Casual Belt', 'braided-casual-belt', 'c-belts', 2900,
    'Woven leather that you can fasten at any point, so it always fits. Made for summer and weekends.'),
  p(4, 'Slim Bifold Wallet', 'slim-bifold-wallet', 'c-wallets', 3200,
    'Six card slots and a full-length note pocket in a wallet thin enough for a front pocket.',
    { is_featured: true }),
  p(5, 'Minimal Card Holder', 'minimal-card-holder', 'c-wallets', 1900,
    'Four cards and a few folded notes. Edge-painted and hand-stitched.'),
  p(6, 'Coin Pocket Wallet', 'coin-pocket-wallet', 'c-wallets', 3600,
    'A classic bifold with a snap coin pocket, ID window and two note sections.', { in_stock: false }),
  p(7, 'Onyx Round Cufflinks', 'onyx-round-cufflinks', 'c-cuff', 2600,
    'Polished black onyx set in silver-tone steel. Comes in a gift box.',
    { is_featured: true }),
  p(8, 'Brushed Steel Cufflinks', 'brushed-steel-cufflinks', 'c-cuff', 2200,
    'Clean rectangular cufflinks in brushed stainless steel with a bullet-back closure.'),
];

const settings = {
  store_name: 'Basil Mark',
  tagline: 'Belts, wallets and cufflinks for men who notice the details.',
  about_text: 'Basil Mark started with a simple idea: the small things a man carries every day should be made well and last for years.\n\nWe choose every belt, wallet and pair of cufflinks for its material, finish and feel in the hand, and we keep the range small so each piece earns its place.',
  currency: 'Rs.',
  whatsapp_number: '', instagram_url: '', facebook_url: '', email: '', phone: '', city: '',
};

export const DEMO = { categories: cats, products, settings };
