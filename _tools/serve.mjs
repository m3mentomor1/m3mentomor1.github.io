// Local preview of the site as GitHub Pages serves it.
// GitHub Pages runs Jekyll, which replaces each {% include file %} tag with that file from
// _includes/. Opening index.html directly (or with a plain static server) can't do that,
// so preview through this server instead:
//   node _tools/serve.mjs              serve at http://127.0.0.1:4000 and open the browser
//   node _tools/serve.mjs --port 8080
//   node _tools/serve.mjs --no-open    don't open the browser
//   node _tools/serve.mjs --print      write the expanded index.html to stdout
import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]$/, "");
const INCLUDES = join(ROOT, "_includes");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".pdf": "application/pdf",
  ".woff2": "font/woff2",
  ".mp4": "video/mp4",
};

const rel = (file) => relative(ROOT, file).replace(/\\/g, "/");

// Jekyll only runs Liquid on pages that start with front matter; the rest are copied as is.
const FRONT_MATTER = /^---[ \t]*\r?\n([\s\S]*?\r?\n)?(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;

// The Liquid this preview understands: raw and comment blocks, and plain include tags.
// Anything else would be evaluated by GitHub Pages, so it's reported instead of shown
// differently here.
const LIQUID =
  /\{%\s*raw\s*%\}([\s\S]*?)\{%\s*endraw\s*%\}|(\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\})|\{%\s*include\s+([^\s%]+)\s*%\}|\{%[\s\S]*?%\}|\{\{[\s\S]*?\}\}/g;

function render(text, from, stack) {
  return text.replace(LIQUID, (tag, raw, comment, name) => {
    if (raw !== undefined) return raw;
    if (comment) return "";
    if (!name) {
      throw new Error(`${from}: "${tag}" is Liquid, which GitHub Pages would evaluate. Wrap literal braces in {% raw %}…{% endraw %}.`);
    }
    const file = resolve(INCLUDES, name);
    if (!file.startsWith(INCLUDES + sep) || !existsSync(file)) throw new Error(`${from}: missing include _includes/${name}`);
    if (stack.includes(file)) throw new Error(`Include cycle: ${[...stack, file].map(rel).join(" -> ")}`);
    return render(readFileSync(file, "utf8"), rel(file), [...stack, file]);
  });
}

function page(file) {
  const text = readFileSync(file, "utf8");
  const fm = FRONT_MATTER.exec(text);
  return fm ? render(text.slice(fm[0].length), rel(file), [file]) : text;
}

const args = process.argv.slice(2);

if (args.includes("--print")) {
  try {
    process.stdout.write(page(join(ROOT, "index.html")));
  } catch (e) {
    console.error(e.message);
    process.exitCode = 1;
  }
} else {
  const i = args.indexOf("--port");
  const port = i >= 0 ? Number(args[i + 1]) : 4000;
  createServer((req, res) => {
    let path = "/";
    try {
      path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
    } catch {}
    if (path.endsWith("/")) path += "index.html";
    const file = resolve(ROOT, "." + path);
    // Like GitHub Pages, never serve _ or . folders and files
    const hidden = path.split("/").some((part) => part.startsWith("_") || part.startsWith("."));
    if (!file.startsWith(ROOT + sep) || hidden || !existsSync(file) || !statSync(file).isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }).end("404 Not Found");
      return;
    }
    const type = TYPES[extname(file).toLowerCase()] || "application/octet-stream";
    try {
      const body = type.startsWith("text/html") ? page(file) : readFileSync(file);
      res.writeHead(200, { "Content-Type": type, "Cache-Control": "no-store" }).end(body);
    } catch (e) {
      console.error(e.message);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end(e.message);
    }
  })
    .on("error", (e) => {
      if (e.code !== "EADDRINUSE") throw e;
      console.error(`Port ${port} is already in use. The preview may already be running at http://127.0.0.1:${port}`);
      console.error(`Otherwise pick another port: node _tools/serve.mjs --port ${port + 1}`);
      process.exitCode = 1;
    })
    .listen(port, "127.0.0.1", () => {
      const url = `http://127.0.0.1:${port}/`;
      console.log(`Previewing at ${url} (Ctrl+C to stop)`);
      if (args.includes("--no-open")) return;
      const [cmd, cmdArgs] =
        process.platform === "win32" ? ["cmd", ["/c", "start", "", url]] : [process.platform === "darwin" ? "open" : "xdg-open", [url]];
      spawn(cmd, cmdArgs, { stdio: "ignore", detached: true }).on("error", () => {}).unref();
    });
}
