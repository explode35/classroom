# Doodle Desk — public marketing & subscription site

A bright, playful public website for the classroom whiteboard suite, in the spirit of
Classkick and Whiteboard.fi. Static HTML, CSS and vanilla JS — no build step, no
dependencies, no framework. Drop the folder on any host and it works.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Landing page: hero, features, how-it-works, stats, pricing, testimonials, FAQ |
| `pricing.html` | Full plan grid, monthly/yearly switch, feature comparison table, billing FAQ |
| `subscribe.html` | Sign-up + checkout: plan picker, seat count, live order summary, validation |
| `demo.html` | A real, working whiteboard — pens, highlighter, eraser, stamps, undo, PNG export |
| `login.html` | Teacher log in, plus the student "join with a room code" form |
| `FinalAtt.html` | The existing attendance tracker, linked from the site as a bundled tool |

## Running it

Any static server will do:

```bash
npx http-server -p 8080 .
# or
python3 -m http.server 8080
```

Then open <http://localhost:8080/>. Opening `index.html` straight off disk works too.

Deploying is a file copy — GitHub Pages, Netlify, Cloudflare Pages, S3, or any
web host. There is nothing to build.

## Changing the plans and prices

All pricing lives in one place: **`assets/js/config.js`**. Both the pricing page and
the checkout read from it, so editing a number there updates every place it appears.

```js
{
  id: "pro",
  name: "Teacher Pro",
  monthly: 9,      // $/month when billed monthly
  annual: 7,       // $/month equivalent when billed yearly
  perSeat: false,  // true = price is per teacher (see the School plan)
  minSeats: 5,
  features: [...], // ticks
  missing: [...]   // greyed-out lines
}
```

The comparison table in `pricing.html` is hand-written HTML — update it there if you
add or move a feature.

The static plan cards inside `<div data-plans>` in `index.html` and `pricing.html` are a
fallback so search engines and no-JS visitors still see real prices; `assets/js/pricing.js`
replaces them on load. Keep them roughly in sync when prices change.

## Taking real money

The subscribe form currently runs in **demo mode**: it validates every field, builds the
order, and shows a confirmation without charging anything or creating an account. To take
real subscriptions you need a small server, because a Stripe *secret* key must never be
shipped to a browser.

1. Create your products and recurring prices in the Stripe dashboard.
2. Add an endpoint that creates a Checkout Session. In Express that is roughly:

   ```js
   import express from "express";
   import Stripe from "stripe";

   const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
   const app = express();
   app.use(express.json());

   // planId + billing -> your Stripe price IDs
   const PRICES = {
     "pro:monthly":    "price_...",
     "pro:annual":     "price_...",
     "school:monthly": "price_...",
     "school:annual":  "price_..."
   };

   app.post("/api/create-checkout-session", async (req, res) => {
     const { planId, billing, seats, email } = req.body;
     const price = PRICES[`${planId}:${billing}`];
     if (!price) return res.status(400).json({ error: "Unknown plan" });

     const session = await stripe.checkout.sessions.create({
       mode: "subscription",
       customer_email: email,
       line_items: [{ price, quantity: planId === "school" ? Number(seats) || 5 : 1 }],
       subscription_data: { trial_period_days: 30 },
       success_url: "https://your-domain.example/subscribe.html?done=1",
       cancel_url: "https://your-domain.example/pricing.html"
     });

     res.json({ url: session.url });
   });
   ```

3. Point the site at it in `assets/js/config.js`:

   ```js
   CHECKOUT_ENDPOINT: "/api/create-checkout-session",
   ```

The form then POSTs the order and follows the returned Checkout URL instead of showing
the demo confirmation. Stripe collects the card, so you can delete the card fields from
`subscribe.html` once this is live — that also takes your site out of scope for handling
card data.

4. Handle the `checkout.session.completed` and `customer.subscription.*` webhooks to
   create and expire accounts.

## What is real and what is a placeholder

**Real and working:** every page and layout, light/dark mode with the choice remembered,
the mobile menu, the monthly/yearly switch, plan deep links (`subscribe.html?plan=pro&billing=annual`),
form validation, the live order summary, and the whiteboard demo (drawing, stamps, undo,
clear, PNG download — all client-side, nothing uploaded).

**Placeholder, replace before launch:**

- Payments — demo mode until `CHECKOUT_ENDPOINT` is set (above).
- Teacher log in (`assets/js/login.js`) — no auth backend; wire up your provider.
- The live classroom itself — the site sells it and demos a single board; rooms, sync
  and the teacher's multi-board view are the application, not this website.
- Newsletter sign-up — shows a confirmation, posts nowhere.
- Testimonials on `index.html` — illustrative copy, marked with an HTML comment. Swap
  for real, permissioned quotes.
- `hello@doodledesk.example` and the Privacy / Terms / About links point at the FAQ.

## Notes on how it's built

- **No dependencies.** Google Fonts (Fredoka + Nunito) are the only external request,
  and there is a system-font fallback if they're blocked.
- **Accessible by default:** skip link, visible focus rings, labelled form fields with
  inline errors, `aria-pressed` on toggles, and full keyboard operation.
- **Respects `prefers-reduced-motion`** — every animation, including the confetti, is
  switched off for people who ask for that.
- **Nothing is hidden without JS.** The reveal-on-scroll animation is scoped to a `.js`
  class set before first paint, so a page with scripts blocked shows all its content.
- **Theme choice** is stored in `localStorage` and applied before paint, so dark-mode
  visitors never see a white flash.

### Files

```
assets/css/site.css       design tokens + every component
assets/js/config.js       plans, prices, checkout endpoint  ← edit this one
assets/js/site.js         theme, mobile nav, scroll reveals, confetti
assets/js/pricing.js      renders the plan cards, monthly/yearly switch
assets/js/checkout.js     plan picker, order summary, validation, submit
assets/js/whiteboard.js   the demo board
assets/js/login.js        log in + join-a-room forms
```
