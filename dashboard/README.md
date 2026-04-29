# Le Image Client Dashboard

PSD based clickable prototype for the future client portal.

## Local URL

From the repo root:

```bash
python3 -m http.server 8099
```

Open:

```text
http://localhost:8099/dashboard/
```

On the development server this should map to:

```text
https://ciga.leimageinc.com/dashboard/
```

## Current scope

This version uses Nikola's PSD comps directly as the visual source of truth:

- Sign in
- Home / Pocetna
- Payments
- Timeline
- Vendors
- FAQ

The screen images are in `design-reference/`. `index.html` includes clickable hotspots plus a small bottom switcher for development review.

Next step is converting these comps into real responsive HTML/CSS components once the visual direction is approved.
