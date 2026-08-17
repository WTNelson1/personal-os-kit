# personal-os-kit

The shared half of the personal OS look. Every app in the suite speaks the same
visual language — mono micro-labels, hairlines, glyphs instead of icons,
lowercase microcopy, inline confirms, an ambient node mesh behind everything —
and owns exactly one thing: its palette.

This package holds the shared half. Your app supplies twelve colours.

- **Helm** — green/mint terminal
- **Anchor** — indigo/brass, harbour at night
- next app — a third hue family (warm ember/rust is unclaimed)

The language itself is specified in each app's `docs/helm-design-language.md`
(and `docs/anchor-design-language.md` for what a sibling app is allowed to
change). Read those for the *why*; this README is the *how*.

---

## Adopt it in ten minutes

**1 · Install** (a sibling checkout, not a registry):

```bash
npm install ../personal-os-kit
```

**2 · Import the CSS and define your palette.** In your global stylesheet,
kit first, palette second — your values win because they come later:

```css
@import '@personal-os/kit/css/kit.css';
@import '@personal-os/kit/css/chrome.css'; /* selection + scrollbars */

:root {
  --bg:          #131523;  /* page */
  --bg-elev:     #1a1d30;  /* cards, panels */
  --bg-elev-2:   #22273f;  /* inputs, hover fills */
  --line:        #363d61;  /* stronger hairline */
  --line-soft:   #242a47;  /* default hairline, dividers */
  --text:        #e7e9f3;  /* primary ink */
  --text-dim:    #9aa2c6;  /* secondary ink */
  --text-mute:   #667097;  /* labels, meta, placeholders */
  --accent:      #e8b64c;  /* the ONLY "look here" colour */
  --accent-soft: #a5832f;  /* accent borders, quieter accent */
  --accent-glow: rgba(232, 182, 76, 0.45);
  --danger:      #e88a7a;  /* soft salmon, never alarm-red */

  --sans: 'Geist Sans', Inter, -apple-system, sans-serif;
  --mono: 'Geist Mono', 'JetBrains Mono', ui-monospace, monospace;
  color-scheme: dark;
}
```

Pick the accent first; everything else is a neutral ramp tinted toward it.
Never pure gray, never pure black.

**3 · Turn on the grain.** Add the class to `<body>`:

```html
<body class="grain">
```

`grain-chroma` swaps the neutral noise tile for the colour one.

**4 · Start the background:**

```ts
import { initBackground } from '@personal-os/kit'

initBackground({ accent: [232, 182, 76], count: 48 })
```

**5 · Build the shell** out of the classes below:

```html
<div class="app-shell">
  <header class="app-header">
    <h1><a href="/">anchor</a></h1>
    <div class="header-actions">…</div>
  </header>

  <div class="card">
    <h2>right now</h2>
    …
  </div>

  <nav class="bottom-nav">
    <a class="active"><span class="icon">◉</span>today</a>
    …
  </nav>
</div>
```

That's the whole adoption. Everything below is reference.

### Bundler note

The package ships TypeScript and CSS source rather than a build, so your app's
bundler compiles it with the same settings as your own code.

- **Vite** — works as-is.
- **Next.js** — add the package to `transpilePackages` in `next.config.ts`:
  ```ts
  const nextConfig: NextConfig = { transpilePackages: ['@personal-os/kit'] }
  ```

---

## What's in the box

| File | Gives you |
| --- | --- |
| `css/tokens.css` | The token contract, and structural defaults (`--radius`, `--nav-h`, `--sans`, `--mono`) |
| `css/base.css` | Reset, page background on `<html>`, body typography |
| `css/ambient.css` | Corner glows, film grain, matrix-canvas positioning |
| `css/chrome.css` | Selection colour and thin scrollbars — *optional, see below* |
| `css/layout.css` | `.app-shell`, `.row`, `.row-between`, `.stack`, `.center` |
| `css/micro-labels.css` | `.micro-label`, `.muted`, `.small`, `.hint` |
| `css/cards.css` | `.card` and its micro-label `h2` |
| `css/buttons.css` | `<button>` / `.btn` and the five variants |
| `css/inputs.css` | Inputs, `.field` + `.label-text`, tap-to-edit `.editable` |
| `css/checklists.css` | `.check-item` rows with the custom checkbox |
| `css/nav.css` | `.app-header` + pulsing wordmark, `.bottom-nav` |
| `css/elements.css` | Bare `a` and `code` |
| `css/app-switcher.css` | Styling for `<AppSwitcher>` |
| `css/kit.css` | All of the above except `chrome.css` |
| `background.ts` | `startMatrix`, `initBackground` |
| `AppSwitcher.tsx` | The wordmark dropdown |

`chrome.css` sits outside `kit.css` on purpose: it restyles selection and
scrollbars, which is a *visible* change for an app that already shipped. New
apps should import it; Anchor deliberately does not.

---

## Tokens

Your app must define the twelve palette tokens in step 2. Everything else has
a default:

| Token | Default | For |
| --- | --- | --- |
| `--radius` | `8px` | Card radius |
| `--nav-h` | `58px` | Bottom-nav height, used for shell padding |
| `--sans` / `--mono` | generic stacks | The two faces |
| `--kit-base-size` | `14.5px` | Body font-size |
| `--kit-shell-max` | `640px` | `.app-shell` column width |
| `--grain-opacity` | `0.03` | Film grain strength |
| `--kit-grain-image` | neutral noise | Grain tile |
| `--kit-grain-z` | `100` | Grain stacking order |
| `--kit-bg-z` | `0` | Matrix canvas stacking order |
| `--kit-glow-1` / `-2` | accent at 5% / 3.5% | Corner glows |
| `--kit-nav-bg` | `--bg` at 90% | Bottom-nav fill |
| `--kit-accent-wash` | `--accent` at 8% | Accent hover fill |
| `--kit-danger-wash` | `--danger` at 8% | Danger hover fill |

The last four derive themselves from your palette with `color-mix()`. Pin them
to literal `rgba()` if your app has more than one theme and a derived colour
would follow the theme when it shouldn't — Helm keeps one fixed corner glow
across light and dark, so it pins `--kit-glow-1/2`.

---

## The background

```ts
import { startMatrix, initBackground } from '@personal-os/kit'
```

`initBackground(opts)` creates a `canvas.grid-bg`, puts it behind the page, and
starts the field. `startMatrix(canvas, opts)` drives a canvas you already own —
use this one from a framework component so you control the element:

```tsx
export function MatrixBackground() {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => (ref.current ? startMatrix(ref.current, { accent: [122, 214, 192] }) : undefined), [])
  return <canvas ref={ref} aria-hidden className="fixed inset-0 -z-10 pointer-events-none" />
}
```

Both return a dispose function that cancels the loop and unbinds listeners.

| Option | Default | |
| --- | --- | --- |
| `accent` | `[122, 214, 192]` | `[r, g, b]`, 0–255 — your `--accent`, spelled out |
| `count` | `48` | A number, or `(w, h) => n` so phones get a sparser field |
| `linkDist` | `180` | Nodes closer than this get a line |
| `speed` | `0.18` | Drift, px/frame |
| `baseAlpha` / `scrollAlpha` | `0.1` / `0.16` | Line alpha at the top, and what scrolling adds |
| `nodeAlpha` / `nodeAlphaScroll` | `0.35` / `0.35` | Same, for the nodes |
| `parallax` | `0.12` | How much the field lags the page |

Node positions come from a seeded pseudo-random, so the field is the same on
every reload. Under `prefers-reduced-motion` it paints one static frame and
never starts a loop.

Links are O(n²): scale `count` to the viewport rather than picking one big
number. Helm uses `(w) => Math.round(Math.min(72, w / 24))`; Anchor is
mobile-first and uses a flat 48.

---

## The app switcher

The wordmark is the trigger. Each sibling app is a row with a dot in *its*
accent — the palette is the wayfinding.

```tsx
import AppSwitcher from '@personal-os/kit/AppSwitcher'

const APPS = [
  { name: 'helm',   url: 'https://helm.example.com',   color: '#7ad6c0' },
  { name: 'anchor', url: 'https://anchor.example.com', color: '#e8b64c' },
]

<h1>
  <AppSwitcher apps={APPS} current="anchor" />
</h1>
```

Put it inside the `<h1>` and the header's pulsing accent dot still sits to its
left, so the wordmark reads exactly as it did — it just opens now.

Props: `apps` (`{ name, url, color }[]`), `current` (that entry is listed and
marked, not linked), `label` (trigger text, defaults to `current`), and
`className`. Closes on outside click or Escape; up/down walk the list.

In Next.js it needs a client boundary — import it from a component that already
has `'use client'`.

**It switches in the current window.** Rows keep a real `href` — middle-click
and cmd-click behave normally — but a plain click is driven through
`location.assign`. That matters once the apps are installed: each is its own
origin, so a browser will not follow a plain link out of an app's scope without
opening a second window, and you end up with one window per app.

**Put it where a narrow window can reach it.** The wordmark is usually in a
desktop top bar, and a mobile layout that swaps that bar for a bottom nav will
lose the switcher entirely — a bottom bar is capped at five cells and has no
room for a wordmark. Give small screens their own slim brand row instead. Helm
does this with a `sm:hidden` `MobileBrand`; Anchor's header is mobile-first and
already carries it at every width.

---

## Adopting in an app that already shipped

Take `tokens.css`, `base.css` and `ambient.css` first — that is the
identity-carrying part and the piece most likely to have drifted. Then move
your component CSS over a file at a time, checking as you go.

**Tailwind-style apps:** `buttons.css`, `inputs.css` and `elements.css` style
bare `<button>`, `<input>` and `<a>`, which will collide with utility classes.
Skip them and `kit.css`; import the layers you want individually. Helm does
exactly this — it takes tokens, base, ambient and chrome plus the background
module, and keeps its own utility-styled components.

Two things to watch:

- The kit puts the page background on `<html>`, never `<body>`, so the matrix
  canvas can paint above it. If your body has an opaque background, drop it.
- Import the kit *before* your palette and your app-specific rules, so both
  still win on equal specificity.
