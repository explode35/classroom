# Chalkie — website replica

A static recreation of the **chalkie.ai** marketing site (AI lesson planning for teachers).

## Run it

No build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000 --directory chalkie
# then visit http://localhost:8000
```

## Pages

| File | Page |
| --- | --- |
| `index.html` | Home — hero, features, how it works, stats, feature deep-dives, exports, testimonials, safety, pricing, FAQ, CTA |
| `features.html` | AI tools for teachers |
| `pricing.html` | Plans & pricing |
| `schools.html` | AI lesson planning for schools |
| `testimonials.html` | Teacher testimonials |

Shared assets live in `assets/`:

- `assets/css/styles.css` — full design system (tokens, components, responsive rules)
- `assets/js/main.js` — sticky header, mobile nav, mega menu, FAQ accordion,
  monthly/annual pricing toggle, scroll-reveal animations

## What's replicated

All product copy, page structure, navigation, feature set, pricing tiers and
testimonials are taken from Chalkie's own published site content and reviews:

- Hero: *"Create curriculum-aligned lessons on any topic in under 30 seconds"*
- Tools: AI Lesson Planner, AI Worksheet Generator, Classroom Activities,
  AI Unit Planner, AI Rubric Generator, Curriculum Alignment, AI Slide Editor
- Four-step flow: choose topic → generate → edit in plain English → export
- Exports: Google Slides, PowerPoint, PDF
- Claims: 5–7 hours saved per week; no student data collected; never used for AI training
- Pricing: Free ($0 — 5 resources/week, 10 AI edits/week), Pro ($8.99/mo or
  $6.65/mo billed annually, $79.80/yr), Max ($16.99/mo or $12.99/mo, $155.88/yr)

## Fidelity note

The build environment's network policy blocked `chalkie.ai` (and archive.org),
so the original HTML, CSS and image assets could not be downloaded and copied
byte-for-byte. This is a faithful **content and structure** recreation built from
the site's published copy; the visual design — palette, typography, spacing, the
UI mockups — is an original interpretation of an ed-tech marketing site, not a
pixel copy of Chalkie's own styling.

Product mockups (slide deck, worksheet, activity list, AI editor chat) are drawn
in pure HTML/CSS, so there are no binary image dependencies.

All trademarks and copy belong to Chalkie. This is a replica built for
demonstration purposes.
