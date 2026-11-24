// Renders scripts/og-image.html to public/og-image.jpg (1200 × 630) in a headless Chromium browser, driven
// over the DevTools protocol (Node's built-in WebSocket). Brave's `--screenshot` flag hangs, and this way
// the capture waits until the page says it's ready: Inter loaded and the hero's 3D scene drawn.
//
// The page mounts the real hero scene (src/lib/hero-scene), so it's served from a throwaway local server
// rather than opened from disk: that gives it three from node_modules and the scene's modules as
// JavaScript (transpiled here with the project's TypeScript), with no build step.
// Usage: node scripts/render-og-image.mjs   (set CHROME_PATH to use a browser other than the ones below)
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const WIDTH = 1200;
const HEIGHT = 630;
const repo = fileURLToPath(new URL("..", import.meta.url));
// JPEG, not PNG: the grain makes a PNG ~340 KB, past the ~300 KB some apps (WhatsApp) will unfurl.
const output = fileURLToPath(new URL("../public/og-image.jpg", import.meta.url));

const browserPath = [
  process.env.CHROME_PATH,
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].find((path) => path && existsSync(path));
if (!browserPath) throw new Error("No Chromium browser found; set CHROME_PATH.");

const contentTypes = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".ts": "text/javascript",
  ".woff2": "font/woff2",
  ".glb": "model/gltf-binary",
};
// All the page loads, and nothing else (the repo also holds secrets in .env).
const served = [
  "scripts/og-image.html",
  "node_modules/three/build/",
  "node_modules/@fontsource-variable/inter/files/",
  "src/lib/hero-scene/",
  "src/assets/hero/",
];
const server = createServer(async (request, response) => {
  try {
    let path = relative(repo, resolve(repo, "." + decodeURIComponent(new URL(request.url, "http://localhost").pathname)));
    if (!served.some((allowed) => path.startsWith(allowed))) throw new Error(`not served: ${path}`);
    // The scene's modules import each other without an extension (`./fog`).
    if (!extname(path)) path += ".ts";
    path = join(repo, path);
    let body = await readFile(path);
    if (path.endsWith(".ts")) {
      body = ts.transpileModule(body.toString(), {
        compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
      }).outputText;
    }
    response.writeHead(200, { "content-type": contentTypes[extname(path)] ?? "application/octet-stream" }).end(body);
  } catch {
    response.writeHead(404).end();
  }
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const source = `http://127.0.0.1:${server.address().port}/scripts/og-image.html`;

// A throwaway profile, so this never touches (or collides with) a browser that's already open.
const profile = mkdtempSync(join(tmpdir(), "og-image-"));
const browser = spawn(browserPath, [
  "--headless=new",
  `--user-data-dir=${profile}`,
  "--remote-debugging-port=0",
  "--hide-scrollbars",
  "about:blank",
]);

try {
  const wsUrl = await new Promise((resolve, reject) => {
    let log = "";
    browser.stderr.on("data", (chunk) => {
      log += chunk;
      const match = log.match(/DevTools listening on (ws:\/\/\S+)/);
      if (match) resolve(match[1]);
    });
    browser.on("exit", () => reject(new Error(`Browser exited before DevTools was ready:\n${log}`)));
  });

  const ws = new WebSocket(wsUrl);
  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  let nextId = 0;
  const pending = new Map();
  const listeners = new Set();
  ws.onmessage = ({ data }) => {
    const msg = JSON.parse(data);
    if (msg.id !== undefined) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      msg.error ? reject(new Error(`${msg.error.message} (${msg.error.code})`)) : resolve(msg.result);
    } else {
      listeners.forEach((fn) => fn(msg));
    }
  };
  const send = (method, params = {}, sessionId) =>
    new Promise((resolve, reject) => {
      const id = ++nextId;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params, sessionId }));
    });
  const once = (method, sessionId) =>
    new Promise((resolve) => {
      const fn = (msg) => {
        if (msg.method === method && msg.sessionId === sessionId) {
          listeners.delete(fn);
          resolve(msg.params);
        }
      };
      listeners.add(fn);
    });

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });
  await send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false }, sessionId);
  await send("Page.enable", {}, sessionId);
  const loaded = once("Page.loadEventFired", sessionId);
  await send("Page.navigate", { url: source }, sessionId);
  await loaded;

  // og-image.html sets this up: Inter loaded and the scene drawn, or why not.
  const { exceptionDetails } = await send(
    "Runtime.evaluate",
    { expression: "window.ogImageReady", awaitPromise: true, returnByValue: true },
    sessionId,
  );
  if (exceptionDetails) {
    throw new Error(`og-image.html failed: ${exceptionDetails.exception?.description ?? exceptionDetails.text}`);
  }

  const { data } = await send(
    "Page.captureScreenshot",
    { format: "jpeg", quality: 90, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: 1 } },
    sessionId,
  );
  writeFileSync(output, Buffer.from(data, "base64"));
  console.log(`Wrote ${output}`);
  ws.close();
} finally {
  // Wait for it to exit: it's still writing to the profile as it shuts down.
  const exited = new Promise((resolve) => (browser.exitCode === null ? browser.once("exit", resolve) : resolve()));
  browser.kill();
  await exited;
  rmSync(profile, { recursive: true, force: true });
  server.closeAllConnections();
  server.close();
}
