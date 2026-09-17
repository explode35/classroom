# Doodle Desk — classroom whiteboards

A bright, playful public website *and* the live classroom app behind it, in the
spirit of Classkick and Whiteboard.fi: every student gets a whiteboard, the
teacher sees all of them at once. Static HTML, CSS and vanilla JS — no build
step, no dependencies, no framework. Drop the folder on any host and it works.

## Pages

**The public site**

| File | What it is |
| --- | --- |
| `index.html` | Landing page: hero, features, how-it-works, stats, pricing, testimonials, FAQ |
| `pricing.html` | Full plan grid, monthly/yearly switch, feature comparison table, billing FAQ |
| `subscribe.html` | Sign-up + checkout: plan picker, seat count, live order summary, validation |
| `demo.html` | A real, working whiteboard — pens, highlighter, eraser, stamps, undo, PNG export |
| `login.html` | Teacher log in, plus the student "join with a room code" form |
| `FinalAtt.html` | The existing attendance tracker, linked from the site as a bundled tool |

**The app**

| File | What it is |
| --- | --- |
| `dashboard.html` | The teacher's rooms: open one, copy its join link, see who's in it, close it |
| `room.html` | The live room — every student's board as a thumbnail, class controls, focus view |
| `board.html` | A student's own board: joins by code, draws, gets the task and the teacher's marks |

## The app, and how the live sync works

The app genuinely runs — across browser tabs, with no server. Try it:

1. Open `login.html`, log in with any valid-looking email, and create a room.
2. Copy the join link and open it in two or three other tabs, giving each a
   different name.
3. Draw in a student tab and watch the thumbnail appear in the teacher's grid.

From the room view a teacher can set the task, freeze every board, clear them,
filter by who's stuck or finished, and click any board to open it full size and
draw a hint straight onto it. From a student board you can flag that you're
stuck or done, and the teacher's marks appear as you work. Undo only ever
removes your own marks, so a student can't rub out the hint they were just
given.

**How it fits together**

- `assets/js/board-engine.js` — the drawing core. Marks are stored as data
  (`{type:"stroke", colour, width, points:[...]}`), not pixels, so undo, replay,
  thumbnails and sending a board over the wire all work on the same objects.
  Committed marks are composited onto an offscreen canvas, so a long lesson
  doesn't get slower with every stroke.
- `assets/js/board-ui.js` — binds the standard toolbar markup to a board, so the
  tools behave the same in all three places a board appears.
- `assets/js/realtime.js` (`DoodleNet`) — rooms and messaging. Rooms live in
  `localStorage`; each tab's student identity lives in `sessionStorage`, which is
  what lets one browser hold a whole class. Live updates go over a
  `BroadcastChannel`, falling back to `storage` events on older browsers.

Messages on the bus: `join`, `leave`, `presence`, `board` (a new thumbnail),
`status`, `prompt`, `freeze`, `clear-board`, `teacher-mark`, `full-request` /
`full-reply` (the teacher asking a student's tab for its full board), and
`room-closed`.

Students publish a small JPEG thumbnail rather than every stroke — cheap to send
and to store, and it's all the teacher's grid needs. The full board only travels
when a teacher actually opens it.

**Making it work between real devices** means replacing the transport, not the
pages: every page talks to `DoodleNet` and nothing else. Swap `send`/`on` for a
WebSocket connection and the store functions for API calls, and the same messages
carry the same payloads. Until then it is one browser only — rooms don't leave
the machine that made them.

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
form validation, the live order summary, the whiteboard demo, and the whole app —
rooms, codes, joining, live thumbnails, status flags, the task banner, freeze, clear,
and the teacher marking a student's board — across tabs in one browser.

**Placeholder, replace before launch:**

- Payments — demo mode until `CHECKOUT_ENDPOINT` is set (above).
- Teacher log in (`assets/js/login.js`) — any valid-looking email gets in and the
  name is remembered locally. There is no auth backend; wire up your provider.
- Cross-device sync — the app is real but confined to one browser (see above).
  Rooms, boards and student lists never leave the machine that created them.
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
assets/js/site.js         theme, mobile nav, scroll reveals, confetti, toasts
assets/js/pricing.js      renders the plan cards, monthly/yearly switch
assets/js/checkout.js     plan picker, order summary, validation, submit
assets/js/login.js        log in + join-a-room forms

assets/js/board-engine.js the drawing core, shared by all three boards
assets/js/board-ui.js     binds the toolbar markup to a board
assets/js/realtime.js     rooms, identities and the live message bus
assets/js/whiteboard.js   the public demo board
assets/js/dashboard.js    the teacher's room list
assets/js/room.js         the live room: grid, controls, focus view
assets/js/student.js      a student's board
```
