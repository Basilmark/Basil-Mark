# Basil Mark website

A storefront for Basil Mark (belts, wallets, cufflinks and future categories), hosted free on GitHub Pages, with a private admin panel for managing products. Products, photos and settings are stored in a free Supabase project.

Visitors browse products and order by tapping **Order on WhatsApp** (or messaging on Instagram / Facebook). Those buttons only appear once you add your details in the admin panel.

Until Supabase is connected, the site runs in **preview mode** with sample products, so you can put it live straight away and connect the database whenever you're ready.

---

## What's in this folder

| Path | What it is |
|---|---|
| `index.html` | Home page |
| `shop.html` | All products, filter by category, sort by price |
| `product.html` | A single product with photos and order buttons |
| `about.html`, `contact.html` | About and contact pages (text comes from the admin panel) |
| `admin.html` | **Your private admin panel** |
| `assets/js/config.js` | Where you paste your Supabase details (step 3) |
| `supabase/setup.sql` | Creates the database (step 2) |

---

## Step 1: Put the site on GitHub Pages (10 minutes)

1. Open https://github.com/Basilmark/Basil-Mark
2. Select **Add file > Upload files**, then drag **everything inside this folder** (all files and folders) into the page. Select **Commit changes**.
3. Go to **Settings > Pages**. Under **Build and deployment**, set **Source** to *Deploy from a branch*, **Branch** to `main` and folder `/ (root)`. Select **Save**.
4. After a minute or two the site is live at **https://basilmark.github.io/Basil-Mark/**

At this point you'll see the site in preview mode with sample products.

## Step 2: Create the database (10 minutes)

1. Go to https://supabase.com and sign up (free). Create a **New project**. Name it `basil-mark`, choose a strong database password (save it somewhere safe) and pick the region closest to you (for Pakistan, Mumbai / `ap-south-1` is usually the fastest).
2. When the project is ready, open **SQL Editor** in the left menu, select **New query**, paste the whole contents of `supabase/setup.sql`, and select **Run**. You should see "Success".
3. Turn off public sign-ups so nobody else can create an account: **Authentication > Sign In / Providers**, switch off **Allow new users to sign up**, and save.

## Step 3: Connect the site to the database

1. In Supabase, select the **Connect** button at the top (or go to **Project Settings > API Keys**).
2. Copy the **Project URL** and the **publishable key** (starts with `sb_publishable_`; older projects call it the `anon` `public` key).
   - Never use the **secret** or **service_role** key on the website.
3. In GitHub, open `assets/js/config.js`, select the pencil icon to edit, and paste the two values between the quotes:

   ```js
   supabaseUrl: 'https://abcdefghijkl.supabase.co',
   supabaseAnonKey: 'sb_publishable_xxxxxxxx',
   ```

4. Select **Commit changes**. The site updates within a minute or two, and the "preview mode" bar disappears.

## Step 4: Create your admin login

1. In Supabase, go to **Authentication > Users > Add user > Create new user**. Enter your email and a password, tick **Auto Confirm User**, and create it.
2. Go back to **SQL Editor > New query**, paste this line with **your** email, and select **Run**:

   ```sql
   insert into public.admins (user_id)
     select id from auth.users where email = 'you@example.com'
     on conflict do nothing;
   ```

3. Open **https://basilmark.github.io/Basil-Mark/admin.html** and sign in.

To give a partner admin access later, repeat step 4 with their email.

---

## Using the admin panel

Bookmark `…/Basil-Mark/admin.html`. It works on your phone too.

- **Products**: add, edit or delete products. Upload several photos per product; the first one is the cover (use *Make cover* to change it). Photos are resized automatically, so you can upload straight from your phone camera.
  - Untick **Show on site** to hide a product without deleting it.
  - Tick **Feature on home page** for the pieces you want on the home page.
  - Fill in **Original price** to show a sale (crossed-out) price.
- **Categories**: add new categories any time (Watches, Ties, Perfumes…). They appear automatically in the shop filters, the footer and the home page.
- **Store settings**: add your WhatsApp number, Instagram and Facebook links when you're ready. The order buttons and contact page appear only for the channels you fill in. You can also edit the home-page headline and About text here.

The website reads changes instantly; visitors just refresh the page.

## Good to know

- **Cost**: GitHub Pages and the Supabase free plan cost nothing at this size. Supabase's free plan pauses a project after about a week with no activity at all; normal site visits keep it active. If it ever pauses, sign in to Supabase and select **Restore**.
- **Order messages** look like this on WhatsApp: *"Hi Basil Mark, I'd like to order: Heritage Leather Belt (Rs. 3,800)"* followed by the product link.
- **Own domain later**: buy a domain (e.g. basilmark.pk), add it under GitHub **Settings > Pages > Custom domain**, and follow GitHub's DNS instructions. Nothing in the site needs to change.
- **Logo later**: the name "Basil Mark" is set in type for now. When you have a logo, it can replace the text in the header and the browser tab icon (`assets/img/favicon.svg`).
- **Future features** the database is already prepared for: product variants (sizes, colours) via the `attributes` field, and stock tracking. On-site orders can be added later without rebuilding the site.
