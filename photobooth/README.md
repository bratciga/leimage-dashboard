# Le Image — Photo Booth Configurator

A client-facing web app for Le Image photography studio's photo booth service. Clients receive a unique URL, configure their booth options, build a custom monogram, and submit. The studio team reviews all submissions from the admin dashboard.

---

## Features

- **Event-specific links** — `?event=smith-jones-2026-04-15` pre-labels each form
- **Full configuration form** — parking, backdrop, print size, props, notes
- **Monogram builder** — live canvas preview, 18 Google Fonts, color pickers, flourish toggle, full-res PNG export
- **Supabase storage** — submissions stored as JSON + monogram PNG (base64)
- **localStorage fallback** — nothing is lost if the network is down
- **Admin dashboard** — password-protected, search/filter, download monogram PNGs, export JSON
- **Mobile-responsive** — dark elegant theme, smooth interactions

---

## Project Structure

```
photobooth/
├── index.html          Client-facing configurator
├── admin.html          Admin dashboard
├── css/
│   └── style.css       All styles
├── js/
│   ├── app.js          Main form logic + Supabase submit
│   ├── monogram.js     Canvas monogram builder
│   └── admin.js        Admin page logic
├── assets/
│   └── fonts/          (placeholder — add custom font files here if needed)
└── README.md           This file
```

---

## Quick Start (local)

No build step required. Just open `index.html` in a browser:

```bash
# Option 1: any static file server
npx serve .

# Option 2: Python
python3 -m http.server 8080

# Option 3: just open index.html directly in Chrome/Firefox
```

Visit: `http://localhost:8080?event=smith-jones-2026-04-15`
Admin: `http://localhost:8080/admin.html`

---

## Supabase Setup

Supabase is free for small projects. Follow these steps:

### 1. Create a Supabase project

Go to [https://supabase.com](https://supabase.com) → New Project.

### 2. Create the submissions table

In the **SQL Editor**, run:

```sql
CREATE TABLE submissions (
  id           uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  event_slug   text NOT NULL,
  submitted_at timestamptz DEFAULT now(),
  data         jsonb NOT NULL,
  monogram_png text   -- base64 PNG data URL
);

-- Allow anonymous inserts (client form submissions)
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon insert"
  ON submissions FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow authenticated reads (for admin — optional, use service key for admin instead)
CREATE POLICY "Allow authenticated read"
  ON submissions FOR SELECT
  TO authenticated
  USING (true);
```

> **Note:** The admin dashboard uses the **anon key** for reads too, which means RLS must allow it, OR you switch to the service role key for admin reads (recommended for production). For now, the simplest approach is to also allow anon SELECT:
>
> ```sql
> CREATE POLICY "Allow anon read"
>   ON submissions FOR SELECT
>   TO anon
>   USING (true);
> ```

### 3. Get your API keys

In your Supabase project: **Settings → API**

- **Project URL** — looks like `https://abcxyz.supabase.co`
- **anon/public key** — the long JWT string

### 4. Configure the app

Open **`js/app.js`** and **`js/admin.js`** — both have the same config block at the top:

```js
const SUPABASE_CONFIG = {
  url:     'YOUR_SUPABASE_URL',       // ← replace this
  anonKey: 'YOUR_SUPABASE_ANON_KEY',  // ← replace this
  table:   'submissions',
};
```

Replace both placeholder values in both files. The app auto-detects whether Supabase is configured — if the placeholders are still present, it falls back to localStorage only.

---

## Admin Password

Default password: **`leimage2026`**

To change it, edit line in `js/admin.js`:

```js
const ADMIN_PASSWORD = 'leimage2026';
```

> For production, replace with a proper auth system (Supabase Auth, Netlify Identity, etc.)

---

## Deployment

### Netlify (recommended — free)

1. Push this folder to a GitHub repo
2. Connect it to [netlify.com](https://netlify.com)
3. Build command: *(none)*
4. Publish directory: `.` (root of this folder)
5. Add your Supabase keys as environment variables if needed (or just hardcode in JS for static hosting)

### Vercel

Same as Netlify — framework: "Other", root directory: `.`

### GitHub Pages

1. Push to a repo
2. Settings → Pages → deploy from main branch
3. Done — no server needed

### Any web host

Upload all files. No server-side code. Works on any static host.

---

## Adding Backdrop Photos

Swap the CSS gradient placeholders in `index.html` with real images:

```html
<!-- Replace this: -->
<div class="backdrop-placeholder" style="background: linear-gradient(...);">

<!-- With this: -->
<img src="assets/backdrops/marble-white.jpg" alt="Marble White backdrop" />
```

Recommended image size: **300×300px** minimum, square crop.

---

## Adding More Props

In `index.html`, find `<!-- Add new props here -->` and copy a `<label>` block:

```html
<label class="prop-card">
  <input type="checkbox" name="props" value="Holiday" />
  <span class="prop-emoji">🎄</span>
  <span class="prop-name">Holiday</span>
  <span class="check-mark">✓</span>
</label>
```

---

## Adding More Fonts

In `js/monogram.js`, add an entry to `MONOGRAM_FONTS`:

```js
{ name: 'My New Font', family: 'My New Font' },
```

The font will be loaded automatically from Google Fonts when selected. Make sure the family name matches exactly what Google Fonts uses.

---

## Canvas Specs

| Print Size | Canvas (px)    | Orientation |
|------------|----------------|-------------|
| 4×6        | 1844 × 1240    | Landscape   |
| 2×6        | 1240 × 1844    | Portrait    |

The monogram block renders in the bottom ~28% of the canvas, centered horizontally.

---

## Tech Stack

- Pure HTML5 / CSS3 / Vanilla JS — no build tools, no frameworks
- [Google Fonts](https://fonts.google.com) — loaded dynamically via CDN
- HTML5 Canvas — monogram rendering and PNG export
- [Supabase](https://supabase.com) — storage backend (optional)
- localStorage — offline fallback

---

## License

Internal tool — Le Image Photography Studio. Not for redistribution.
