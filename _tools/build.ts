// Builds the deployable site into _site/ (GitHub Actions runs this, then publishes _site/).
//   npm run build
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { compileScript, isPublic, renderPage, ROOT, rel, SRC } from "./site.ts";

const OUT = join(ROOT, "_site");

function write(path: string, data: string) {
  mkdirSync(dirname(join(OUT, path)), { recursive: true });
  writeFileSync(join(OUT, path), data);
}

function build() {
  rmSync(OUT, { recursive: true, force: true });
  let pages = 0;
  let files = 0;
  let scripts = 0;

  const copyTree = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      const path = rel(file);
      if (!isPublic(path)) continue;
      if (entry.isDirectory()) {
        copyTree(file);
      } else if (path.endsWith(".html")) {
        write(path, renderPage(file));
        pages++;
      } else {
        mkdirSync(dirname(join(OUT, path)), { recursive: true });
        copyFileSync(file, join(OUT, path));
        files++;
      }
    }
  };
  copyTree(ROOT);

  const compileTree = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const file = join(dir, entry.name);
      if (entry.isDirectory()) {
        compileTree(file);
      } else if (entry.name.endsWith(".ts") && !entry.name.endsWith(".d.ts")) {
        const path = rel(file).slice("src/".length, -3) + ".js";
        if (existsSync(join(ROOT, path))) {
          throw new Error(`${path} exists both as src/${path.slice(0, -3)}.ts and in the repo root; delete the root copy`);
        }
        write(path, compileScript(file));
        scripts++;
      }
    }
  };
  compileTree(SRC);

  console.log(`Built _site/: ${pages} page(s), ${scripts} script(s) compiled from src/, ${files} other file(s)`);
}

try {
  build();
} catch (e) {
  console.error((e as Error).message);
  process.exitCode = 1;
}
