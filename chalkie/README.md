# Chalkie — website replica

A static recreation of the **chalkie.ai** marketing site (AI lesson planning for teachers).

## Run it

No build step, no dependencies. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000 --directory chalkie
# then visit http://localhost:8000
```

## Pages

### Marketing site — `chalkie.ai`

| File | Page |
| --- | --- |
| `index.html` | Home — hero, features, how it works, stats, feature deep-dives, exports, testimonials, safety, pricing, FAQ, CTA |
| `features.html` | AI tools for teachers |
| `pricing.html` | Plans & pricing |
| `schools.html` | AI lesson planning for schools |
| `testimonials.html` | Teacher testimonials |

- `assets/css/styles.css` — design system (tokens, components, responsive rules)
- `assets/js/main.js` — sticky header, mobile nav, mega menu, FAQ accordion,
  monthly/annual pricing toggle, scroll-reveal animations

### Product app — `app.chalkie.ai` (in `app/`)

| File | Screen |
| --- | --- |
| `app/login.html` | Log in — Google/Microsoft SSO, email + password, brand panel |
| `app/register.html` | Create a free account |
| `app/index.html` | Dashboard — greeting, create cards, recent resources, weekly usage |
| `app/create.html` | Lesson creator — topic, subject, year group, region, curriculum, length, extra instructions, and what to include |
| `app/lesson.html` | Slide editor — slide rail, canvas, **Edit with AI** panel, Design panel, export menu |
| `app/library.html` | My resources — filterable grid of lessons, series, worksheets, activities, rubrics |

- `app/app.css` — app design system (shell, sidebar, forms, editor, auth)
- `app/app.js` — app behaviour

The app screens are clickable, not just static mockups:

- **Create → Generate** runs a staged "building your lesson" overlay and lands
  in the slide editor.
- **Edit with AI** actually rewrites the current slide. Ask it to "make this
  simpler", "add an extension task", "add key vocabulary", "add a check for
  understanding" or "make it shorter" and the slide content changes in place.
- The slide rail, previous/next, Design tab (theme, layout, settings), export
  menu, and the library's type filters all work.

Marketing CTAs ("Log in", "Try Chalkie for free", "Start Pro free trial") link
through to the app.

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

The build environment's network policy blocked `chalkie.ai`, `app.chalkie.ai`
and archive.org, so the original HTML, CSS and image assets could not be
downloaded and copied byte-for-byte. This is a faithful **content and structure** recreation built from
the site's published copy; the visual design — palette, typography, spacing, the
UI mockups — is an original interpretation of an ed-tech marketing site, not a
pixel copy of Chalkie's own styling.

The app screens follow the product's documented behaviour — a dashboard offering
a single lesson, a lesson series or worksheets; a creation form taking topic,
grade level and additional instructions with options for learning objectives,
key vocabulary, learning activities and YouTube videos; and an "Edit with AI"
control on the slides — but the exact in-app layout could not be observed.

Every mockup (slide deck, worksheet, activity list, thumbnails) is drawn in pure
HTML/CSS, so there are no binary image dependencies anywhere in the project.

All trademarks and copy belong to Chalkie. This is a replica built for
demonstration purposes.
