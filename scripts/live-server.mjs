import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const root = path.join(projectRoot, "src");
const skinFile = path.join(root, "skins", "base.css");
const port = Number(process.argv[2] || process.env.PORT || 4174);
const clients = new Set();
let liveVersion = Date.now();

const mime = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".gif", "image/gif"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
]);

const reloadSnippet = `
<script>
(() => {
  const reloadUrl = new URL("/__live-reload", location.href);
  const versionUrl = new URL("/__live-version", location.href);
  let currentVersion = null;

  const reload = () => location.reload();

  try {
    const events = new EventSource(reloadUrl);
    events.addEventListener("reload", reload);
  } catch (error) {
    console.warn("[AO3 live server] EventSource unavailable", error);
  }

  async function pollVersion() {
    try {
      const response = await fetch(versionUrl, { cache: "no-store" });
      const data = await response.json();
      if (currentVersion === null) {
        currentVersion = data.version;
        return;
      }
      if (data.version !== currentVersion) reload();
    } catch (error) {
      console.warn("[AO3 live server] version check failed", error);
    }
  }

  pollVersion();
  setInterval(pollVersion, 1000);
})();
</script>`;

function sendReload() {
  liveVersion = Date.now();
  for (const res of clients) {
    res.write(`event: reload\\ndata: ${liveVersion}\\n\\n`);
  }
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return char;
    }
  });
}

function pageTitleFromFilename(filename) {
  return filename.replace(/ _ Archive of Our Own\.html$/u, "").replace(/\.html$/u, "");
}

function serveIndex(res) {
  fs.readdir(root, { withFileTypes: true }, (readError, entries) => {
    if (readError) {
      res.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Failed to read src directory");
      return;
    }

    const htmlFiles = entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".html"))
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b, "en"));

    const links = htmlFiles
      .map((filename) => {
        const href = `/${encodeURIComponent(filename)}`;
        const title = escapeHtml(pageTitleFromFilename(filename));
        return `<li><a href="${href}">${title}</a><code>${escapeHtml(filename)}</code></li>`;
      })
      .join("\n");

    const body = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AO3 Theme Preview</title>
  <link rel="stylesheet" href="/skins/base.css">
  <style>
    body { margin: 0; background: var(--background-primary, #fff); }
    main { max-width: 960px; margin: 0 auto; padding: 3rem 1.25rem; }
    h1 { margin: 0 0 0.75rem; color: var(--current-color, #1234ff); }
    p { margin: 0 0 2rem; color: var(--text-dark, #666); }
    ul { display: grid; grid-template-columns: repeat(auto-fit, minmax(18rem, 1fr)); gap: 0.75rem; margin: 0; padding: 0; list-style: none; }
    li { display: grid; gap: 0.35rem; padding: 1rem; border: 1px solid var(--border, #d8defa); border-radius: 0.75rem; background: var(--background-current-dim, #f6f7ff); }
    a { color: var(--current-color, #1234ff); font-weight: 700; text-decoration: none; overflow-wrap: anywhere; }
    a:hover, a:focus { text-decoration: underline; }
    code { color: var(--text-gray-2, #777); font-size: 0.8rem; overflow-wrap: anywhere; }
  </style>
</head>
<body>
  <main>
    <h1>AO3 Theme Preview</h1>
    <p>Available local HTML pages served from <code>src</code>.</p>
    <ul>
${links}
    </ul>
  </main>
${reloadSnippet}
</body>
</html>`;

    res.writeHead(200, {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(body);
  });
}

function resolveRequestPath(urlPath) {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded;
  const absolute = path.resolve(root, "." + relative);
  if (!absolute.startsWith(root)) return null;
  return absolute;
}

function serveFile(req, res) {
  const absolute = resolveRequestPath(req.url || "/");
  if (!absolute) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.stat(absolute, (statError, stat) => {
    if (statError || !stat.isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    const ext = path.extname(absolute).toLowerCase();
    const type = mime.get(ext) || "application/octet-stream";

    if (ext === ".html") {
      fs.readFile(absolute, "utf8", (readError, html) => {
        if (readError) {
          res.writeHead(500);
          res.end("Failed to read file");
          return;
        }

        const body = html.includes("</body>")
          ? html.replace("</body>", `${reloadSnippet}</body>`)
          : `${html}${reloadSnippet}`;

        res.writeHead(200, {
          "Content-Type": type,
          "Cache-Control": "no-store",
        });
        res.end(body);
      });
      return;
    }

    res.writeHead(200, {
      "Content-Type": type,
      "Cache-Control": "no-store",
    });
    fs.createReadStream(absolute).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = (req.url || "/").split("?")[0];

  if (req.url === "/__live-reload") {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });
    res.write("\\n");
    clients.add(res);
    req.on("close", () => clients.delete(res));
    return;
  }

  if (req.url === "/__live-version") {
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    });
    res.end(JSON.stringify({ version: liveVersion }));
    return;
  }

  if (urlPath === "/") {
    serveIndex(res);
    return;
  }

  serveFile(req, res);
});

let reloadTimer = null;
function scheduleReload() {
  clearTimeout(reloadTimer);
  reloadTimer = setTimeout(sendReload, 120);
}

fs.watch(root, { recursive: true }, (_event, filename) => {
  if (!filename || !/\\.(css|html)$/i.test(filename)) return;
  scheduleReload();
});

fs.watchFile(skinFile, { interval: 500 }, (current, previous) => {
  if (current.mtimeMs === previous.mtimeMs && current.size === previous.size) return;
  scheduleReload();
});

server.listen(port, "127.0.0.1", () => {
  console.log(`AO3 theme live server: http://127.0.0.1:${port}/`);
  console.log(`Page index: http://127.0.0.1:${port}/`);
});
