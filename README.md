# Rowell Fernandez — Portfolio

A single-page, bento-grid portfolio for Rowell Fernandez, built with plain HTML, CSS, and JavaScript. No build step, no framework, no package installs.

## Run it

Open `index.html` directly in a browser, or serve the folder with any static server:

```bash
npx serve .
```

The Google Fonts request needs an internet connection. Everything else is local.

## Files

```
index.html          Page structure, resume content, metadata, Person schema
styles.css          Bento layout, dark glass surfaces, responsive rules
app.js              Ambient particle net, generative widget, filters, dialog, clock
assets/og.png       1200×630 social preview image
```

## What's included

- **Bento grid** with hero, social directory, generative field, skill matrix, timeline, and contact cards. It collapses to two columns at 1060px and one column at 700px.
- **Generative background** — an interactive particle net that reacts to the cursor, pauses when the tab is hidden, and renders statically for reduced-motion users.
- **Generative field card** — three patterns (Mesh, Orbit, Drift), three palettes, speed control, pause/play, click ripples, and a live node/link readout.
- **Directory links** to GitHub, LinkedIn, Instagram, and email. External links open in a new tab with `rel="noopener noreferrer"` and descriptive ARIA labels.
- **Skill filter** toggling between Technical and Core strengths.
- **Contact dialog** using native `<dialog>` (focus trap, Escape, backdrop close) with copy-to-clipboard actions.
- **Live local time** for Taguig (Asia/Manila) in the contact card.

## Customize

- **Content:** edit `index.html`. Resume copy, timeline entries, and links are all in the markup.
- **Palette and type:** the tokens are at the top of `styles.css` (`--bg`, `--cyan`, `--violet`, fonts, radius, gap).
- **Canvas behavior:** particle counts, link distances, palette definitions, and orbit rings live in the two self-contained modules in `app.js`.
- **Social preview:** replace `assets/og.png`. Keep it at 1200×630. Before deploying, change the relative `og:image` and `twitter:image` URLs to absolute URLs on your domain, since some social crawlers do not resolve relative paths.

## Accessibility and quality

- One `<h1>`, `<h2>` for card headings, `<h3>` for timeline roles.
- Visible keyboard focus, skip link, native dialog semantics, and ARIA labels that match visible text.
- `prefers-reduced-motion` disables entrance animation, tilt, cursor glow, and continuous canvas animation.
- Lighthouse: 100 Accessibility, 100 Best Practices, 100 SEO.

## Deploy

Upload `index.html`, `styles.css`, `app.js`, and `assets/` to any static host (GitHub Pages, Netlify, Vercel, Cloudflare Pages). No server-side code is required.
