# m3mentomor1.github.io

Personal portfolio: a full-page map of Quezon City where each section is a stop on a route.
Plain HTML and CSS, with the page behaviour written in TypeScript.

## Commands

Requires Node 24 or newer.

```sh
npm install      # once, for type-checking (TypeScript)
npm run dev      # preview at http://127.0.0.1:4000 (opens your browser)
npm run check    # type-check src/ and _tools/
npm run build    # build the deployable site into _site/
```

`npm run dev` and `npm run build` work without `npm install`; only `npm run check` needs it.

### Stopping the preview

Press **Ctrl+C** in the terminal running `npm run dev`, or close that terminal. If it's still running
in a terminal you can't find, stop whatever is using port 4000:

```powershell
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 4000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess }
```

```sh
# macOS / Linux
kill $(lsof -ti tcp:4000)
```

## Deploying

Push to `main`. The [Deploy site](.github/workflows/deploy.yml) workflow type-checks and builds the
site, then publishes `_site/` to GitHub Pages (Settings → Pages → Source must be "GitHub Actions").
A type error stops the deploy, and the live site stays as it was.

## Layout

| Path | What's in it |
| --- | --- |
| `index.html` | Page outline: `<head>`, the popup frame, and an include tag per section |
| `_includes/layout/` | Icon sprite, full-page map, top bar, route card (stop list / phone menu) |
| `_includes/stops/` | One file per stop, in route order: `00-about.html` … `08-contact.html` |
| `_includes/modals/` | "Learn more" modals, numbered after the stop that opens them |
| `src/main.ts` | Page behaviour: map, route, popup, tabs, carousels, modals (served as `main.js`) |
| `src/map-data.ts` | OpenStreetMap extract and route as `window.GEO_DATA` (served as `map-data.js`, loaded by `main.ts`) |
| `src/types.d.ts` | Types for the map data and page state |
| `styles.css` | All styles |
| `_tools/` | Preview server and build (`site.ts` holds the rules both use) |

The build publishes everything else as is, except `src/`, `node_modules/`, `package*.json`,
this README, and anything whose name starts with `_` or `.`.

## How pages are put together

`index.html` pulls in each section with an include tag, for example:

```html
{% include stops/00-about.html %}
```

The build pastes the file in verbatim, so partials keep the indentation they have inside the page.
Opening `index.html` straight from disk can't do this and only shows a notice (kept in a
`{% comment %}` block that the build removes); use `npm run dev` instead.

Page text can't contain `{%` on its own, since that starts a tag. If you need it literally, wrap it
in `{% raw %}…{% endraw %}`; the preview server reports it if you forget.

## TypeScript

`src/*.ts` is compiled by stripping the types (Node's built-in type stripping), so the browser runs
your code exactly as written, line for line, and no source maps are needed. That means only
type syntax that can simply be erased is allowed: no `enum`, `namespace`, or constructor parameter
properties (`npm run check` flags them). `main.ts` is a plain script, not a module: its top-level
functions such as `openModal` are global, because inline `onclick` handlers in the HTML call them.
