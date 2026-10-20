// Renders scripts/og-image.html to public/og-image.jpg (1200 × 630) in a headless Chromium browser, driven
// over the DevTools protocol (Node's built-in WebSocket, no dependencies). Brave's `--screenshot` flag hangs,
// and this way the capture also waits for Inter to load.
// Usage: node scripts/render-og-image.mjs   (set CHROME_PATH to use a browser other than the ones below)
import { spawn } from "node:child_process";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const WIDTH = 1200;
const HEIGHT = 630;
const source = new URL("og-image.html", import.meta.url).href;
// JPEG, not PNG: the grain makes a PNG ~340 KB, past the ~300 KB some apps (WhatsApp) will unfurl.
const output = fileURLToPath(new URL("../public/og-image.jpg", import.meta.url));

const browserPath = [
  process.env.CHROME_PATH,
  "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/Applications/Chromium.app/Contents/MacOS/Chromium",
].find((path) => path && existsSync(path));
if (!browserPath) throw new Error("No Chromium browser found; set CHROME_PATH.");

// A throwaway profile, so this never touches (or collides with) a browser that's already open.
const profile = mkdtempSync(join(tmpdir(), "og-image-"));
const browser = spawn(browserPath, [
  "--headless=new",
  `--user-data-dir=${profile}`,
  "--remote-debugging-port=0",
  // The page loads Inter from node_modules over file://, which Chromium otherwise blocks for fonts.
  "--allow-file-access-from-files",
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

  const { result } = await send(
    "Runtime.evaluate",
    { expression: "document.fonts.ready.then(() => document.fonts.check('700 84px Inter'))", awaitPromise: true, returnByValue: true },
    sessionId,
  );
  if (!result.value) throw new Error("Inter didn't load; run `pnpm install` so node_modules/@fontsource-variable/inter exists.");

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
}
