// How the site is assembled, shared by the preview server (serve.ts) and the build (build.ts),
// so what you preview is exactly what gets deployed.
//  - Pages (.html): each {% include file %} tag is replaced with that file from _includes/.
//  - Scripts: src/<name>.ts is served and deployed as <name>.js, with its types stripped by Node.
//    Stripping only blanks out the type syntax, so line and column numbers stay the same.
//  - Everything else public is used as is.
import { existsSync, readFileSync } from "node:fs";
import { stripTypeScriptTypes } from "node:module";
import { join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = fileURLToPath(new URL("..", import.meta.url)).replace(/[\\/]$/, "");
export const SRC = join(ROOT, "src");
const INCLUDES = join(ROOT, "_includes");

// Repo files that are tooling or docs, not part of the site.
const PRIVATE = new Set(["node_modules", "src", "package.json", "package-lock.json", "README.md"]);

export const rel = (file: string) => relative(ROOT, file).replace(/\\/g, "/");

/** Whether a repo path (relative, "/"-separated) belongs on the site. */
export function isPublic(path: string): boolean {
  const parts = path.split("/");
  return !PRIVATE.has(parts[0]) && parts.every((part) => !part.startsWith("_") && !part.startsWith("."));
}

// Front matter is optional and dropped from the output.
const FRONT_MATTER = /^---[ \t]*\r?\n([\s\S]*?\r?\n)?(?:---|\.\.\.)[ \t]*(?:\r?\n|$)/;

// Tags the build understands: raw and comment blocks, and include tags.
const TAG = /\{%\s*raw\s*%\}([\s\S]*?)\{%\s*endraw\s*%\}|(\{%\s*comment\s*%\}[\s\S]*?\{%\s*endcomment\s*%\})|\{%\s*include\s+([^\s%]+)\s*%\}|\{%[\s\S]*?%\}/g;

function render(text: string, from: string, stack: string[]): string {
  return text.replace(TAG, (tag, raw: string | undefined, comment: string | undefined, name: string | undefined) => {
    if (raw !== undefined) return raw;
    if (comment) return "";
    if (!name) throw new Error(`${from}: unknown tag "${tag}". Wrap literal {% in {% raw %}…{% endraw %}.`);
    const file = resolve(INCLUDES, name);
    if (!file.startsWith(INCLUDES + sep) || !existsSync(file)) throw new Error(`${from}: missing include _includes/${name}`);
    if (stack.includes(file)) throw new Error(`Include cycle: ${[...stack, file].map(rel).join(" -> ")}`);
    // Pasted in verbatim, so each partial keeps the indentation it has in the page.
    return render(readFileSync(file, "utf8"), rel(file), [...stack, file]);
  });
}

/** A page with its includes filled in. */
export function renderPage(file: string): string {
  const text = readFileSync(file, "utf8");
  const fm = FRONT_MATTER.exec(text);
  return render(fm ? text.slice(fm[0].length) : text, rel(file), [file]);
}

/** The src/ TypeScript file a public .js path is built from, if any. */
export function scriptSource(path: string): string | null {
  if (!path.endsWith(".js")) return null;
  const file = join(SRC, path.slice(0, -3) + ".ts");
  return file.startsWith(SRC + sep) && existsSync(file) ? file : null;
}

/** A src/ TypeScript file as browser JavaScript. */
export function compileScript(file: string): string {
  return stripTypeScriptTypes(readFileSync(file, "utf8"), { mode: "strip" });
}
