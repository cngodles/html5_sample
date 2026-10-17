# html5_sample

A simple HTML starter template with no dependencies and no build step. It has a mobile-first responsive layout, a header with an accessible mobile menu, and a footer.

## Getting started

Copy the repo and open `index.html` in a browser. Links behave best when the folder is served by a static server, for example:

```sh
npx serve .
# or
python -m http.server
```

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Page markup |
| `css/base.css` | Design tokens (custom properties), reset, layout and components |
| `css/utilities.css` | A few helper classes: `.visually-hidden`, `.flow`, `.text-left`, `.text-center`, `.text-right` |
| `js/main.js` | Breakpoint helper, mobile menu behaviour, footer year |
| `favicon.svg` | Placeholder icon |

## Breakpoints

The CSS is mobile-first and uses `min-width` media queries.

| Name | Range | Notes |
| --- | --- | --- |
| phone | 0 – 767px | Fluid width, hamburger menu |
| tablet | 768 – 989px | Wider gutters, hamburger menu |
| desktop | 990 – 1279px | Full nav replaces the hamburger menu |
| wide | 1280px + | Content caps at `--container` (1220px) |

The values live in two places, which must match: the media queries in `css/base.css` and `BREAKPOINTS` in `js/main.js`.

In JavaScript:

```js
site.breakpoint;              // "phone" | "tablet" | "desktop" | "wide"
site.isAtLeast('desktop');    // true / false
site.onBreakpointChange((current, previous) => { /* ... */ });
```

## Customising

- Colours, fonts, spacing and container width are custom properties at the top of `css/base.css`. Dark-mode values are set in the `prefers-color-scheme: dark` block.
- The mobile menu uses the native [Popover API](https://developer.mozilla.org/en-US/docs/Web/API/Popover_API). The browser handles opening, closing, Escape, click-outside and focus return. Browsers without Popover support show the regular nav at every size instead.
- Animations are turned off for visitors who set `prefers-reduced-motion`.
