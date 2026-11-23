# duskyAI (v2.0)

Minimal, high-impact personal portfolio for Dusan Hajek.
**Live:** https://www.duskyai.com/

## Key Features
- **Minimal 1300px Layout**: Focused, centered design with plenty of negative space.
- **Full-Screen Lightbox Gallery**: Custom-built JS gallery for high-quality AI visuals (@duskylab).
- **Static Gallery Manifest**: `assets/images/visuals/manifest.json` (regenerated on build via `scripts/generate-manifest.js`).
- **Micro-Interactions**: Hover previews for projects, smooth page transitions.

## Project Structure
```
duskyAI/
├── index.html                  # Main entry point
├── 404.html                    # Custom not-found page
├── assets/
│   ├── css/styles.css          # All styles (CSS variables, layout, lightbox)
│   ├── js/script.js            # Lightbox logic, manifest fetch, interactions
│   ├── favicon/                # Site favicons & manifest
│   └── images/
│       ├── logo.png            # Main logo
│       ├── photo.jpg           # Profile avatar
│       ├── og-image.jpg        # Social share card
│       ├── projects/           # Hover preview images
│       └── visuals/            # Gallery assets
│           ├── manifest.json   # Gallery index (build-generated)
│           └── duskylab/       # @duskylab portfolio images + thumbs/
├── scripts/
│   ├── build-site.js           # Copies site to dist/
│   ├── generate-manifest.js    # Rebuilds visuals manifest
│   └── optimize-images.js      # Resize/compress assets (run when adding images)
└── README.md
```

## How to Add Content

### Adding a Project
Edit `PROJECTS` in `assets/js/script.js` and mirror the link in `index.html` (`#project-list`) for non-JS crawlers.

### Adding Visuals (@duskylab)
1. Drop image/video files into `assets/images/visuals/duskylab/`.
2. Run `npm run optimize` then `npm run build` (thumbnails + manifest).
3. Deploy.

## Scripts
- `npm run dev` — local static server
- `npm run build` — regenerate manifest and copy to `dist/`
- `npm run optimize` — resize/compress images (after adding new assets)

## License
© 2026 duskyAI