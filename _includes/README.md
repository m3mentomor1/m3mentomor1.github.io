# Page sections

`index.html` at the repo root is the page outline. Each `{% include … %}` tag in it pulls in a file
from this folder. GitHub Pages (Jekyll) fills the tags in when it deploys, so there's no build step,
and folders starting with `_` are never published on their own.

| Folder | What's in it |
| --- | --- |
| `layout/` | Icon sprite, full-page map, top bar, route card (stop list / phone menu) |
| `stops/` | One file per stop, in route order: `00-about.html` … `08-contact.html` |
| `modals/` | "Learn more" modals, numbered after the stop that opens them |

## Preview locally

A browser can't fill in the include tags by itself, so opening `index.html` directly only shows a
notice. Preview through the bundled server instead (Node only, nothing to install):

```sh
node _tools/serve.mjs          # serves http://127.0.0.1:4000 and opens it in your browser
```

To stop it, press **Ctrl+C** in that terminal, or close the terminal. If it's still running in a
terminal you can't find, stop whatever is using port 4000:

```powershell
# Windows (PowerShell)
Get-NetTCPConnection -LocalPort 4000 -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess }
```

```sh
# macOS / Linux
kill $(lsof -ti tcp:4000)
```

The notice sits in a `{% comment %}` block at the top of `index.html`, which GitHub Pages removes
when it deploys.

## Things to know

- Files here keep the indentation they have inside the page, because Jekyll pastes them in as is.
- Don't put `{{` or `{%` in page text: Jekyll would treat it as template code. If you need it
  literally, wrap it in `{% raw %}…{% endraw %}`. The preview server reports it if you forget.
