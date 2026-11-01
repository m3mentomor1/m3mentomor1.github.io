// Local preview of the site, assembled exactly as the build does it (see site.ts).
// Opening index.html straight from disk can't fill in its include tags, so preview here:
//   npm run dev                        serve at http://127.0.0.1:4000 and open the browser
//   npm run dev -- --port 8080
//   npm run dev -- --no-open           don't open the browser
//   npm run dev -- --print             write the assembled index.html to stdout
import { spawn } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, resolve, sep } from "node:path";
import { compileScript, isPublic, renderPage, ROOT, scriptSource } from "./site.ts";

const TYPES: Record<string, string> = {
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

function respond(path: string): { status: number; type: string; body: string | Buffer } {
  const notFound = { status: 404, type: "text/plain; charset=utf-8", body: "404 Not Found" };
  if (!isPublic(path)) return notFound;
  const type = TYPES[extname(path).toLowerCase()] || "application/octet-stream";
  const script = scriptSource(path);
  if (script) return { status: 200, type, body: compileScript(script) };
  const file = resolve(ROOT, path);
  if (!file.startsWith(ROOT + sep) || !existsSync(file) || !statSync(file).isFile()) return notFound;
  return { status: 200, type, body: type.startsWith("text/html") ? renderPage(file) : readFileSync(file) };
}

const args = process.argv.slice(2);

if (args.includes("--print")) {
  try {
    process.stdout.write(renderPage(join(ROOT, "index.html")));
  } catch (e) {
    console.error((e as Error).message);
    process.exitCode = 1;
  }
} else {
  const i = args.indexOf("--port");
  const port = i >= 0 ? Number(args[i + 1]) : 4000;
  createServer((req, res) => {
    let path = "/";
    try {
      path = decodeURIComponent(new URL(req.url || "/", "http://localhost").pathname);
    } catch {}
    if (path.endsWith("/")) path += "index.html";
    try {
      const { status, type, body } = respond(path.slice(1));
      res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" }).end(body);
    } catch (e) {
      console.error((e as Error).message);
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" }).end((e as Error).message);
    }
  })
    .on("error", (e: NodeJS.ErrnoException) => {
      if (e.code !== "EADDRINUSE") throw e;
      console.error(`Port ${port} is already in use. The preview may already be running at http://127.0.0.1:${port}`);
      console.error(`Otherwise pick another port: npm run dev -- --port ${port + 1}`);
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
