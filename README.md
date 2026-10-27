# My website code

The code behind [mary-blankemeier.vercel.app](https://mary-blankemeier.vercel.app). Steal away!!

Two views of the same six sections, no build step, no framework:

- **`/`, the notebook:** `src/index.html` + `notebook.css` + `notebook.js`. A warm paper page
  written over in blue pen and yellow-green highlighter (handwriting jitter, hand-drawn photo
  frames, the start and finish line).
- **`/explore`, the 3D track:** `src/explore.html` + `explore.css` + `explore.js`. A running
  track you can tour, built from simple shapes in three.js (loaded from a CDN, pinned to
  0.160.0). Day, dusk and night lighting, and a pause button for the motion. Browsers without 3D
  fall back to the notebook.
- `portfolio-content.js` holds the section text the 3D view shows; `view-flow.js` handles the
  switch between the two views; `404.html` uses the older `styles.css` + `marked-up.js`.
- `vercel.json` serves `src/` with clean URLs and redirects the old `/text` link to `/`.

## Make it yours

Easiest path: don't edit this by hand. Open Claude with your voice and design skills on, attach
this folder, and say: "Rebuild this site with my content, my voice skill for every word, and my
design skill for the look. Keep the structure, swap everything personal." Then check:

1. **Words:** every section in `index.html`, and the matching text in `portfolio-content.js`.
2. **Photos and art:** everything in `src/img/`, plus `og.jpg` (the preview image when the link
   is shared). Keep alt text on every image.
3. **Links and contact:** the email (`you@example.com` here), LinkedIn, Instagram, YouTube, and
   the URLs in the `<meta property="og:...">` tags at the top of each page.
4. **Look:** colors and fonts are CSS variables at the top of `notebook.css` and `explore.css`.

## Put it online (free)

- **Fastest:** drag the `src` folder onto [Netlify Drop](https://app.netlify.com/drop). (The
  `/text` redirect and clean URLs live in `vercel.json`, so they only apply on Vercel.)
- **With updates:** put this folder in your own GitHub repo, import it at vercel.com/new, and
  every push redeploys.

Photos and paintings are mine, so please replace them with yours. The code is MIT, like the rest
of this repo; three.js and its grass texture are MIT too (see `src/THIRD-PARTY-NOTICES.txt`).
