import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const port = 8917;
const chrome = findChrome();
const userDataDir = await mkdtemp(join(tmpdir(), "just-smoke-"));
const messages = [];

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = resolve(root, `.${decodeURIComponent(pathname)}`);

  if (!file.startsWith(root)) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }

  try {
    const data = await import("node:fs/promises").then((fs) => fs.readFile(file));
    const ext = file.split(".").pop();
    const types = {
      html: "text/html; charset=utf-8",
      js: "text/javascript; charset=utf-8",
      css: "text/css; charset=utf-8",
      json: "application/json; charset=utf-8",
      svg: "image/svg+xml",
      png: "image/png",
      ico: "image/x-icon",
    };
    res.writeHead(200, { "Content-Type": types[ext] || "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404);
    res.end("not found");
  }
});

await new Promise((resolveServer) => server.listen(port, "127.0.0.1", resolveServer));

const browser = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--remote-debugging-port=9227",
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: ["ignore", "pipe", "pipe"] });

browser.stderr.on("data", (chunk) => messages.push(String(chunk)));

try {
  const wsUrl = await waitForDebuggerUrl();
  const cdp = await connect(wsUrl);
  const target = await cdp.send("Target.createTarget", { url: `http://127.0.0.1:${port}/index.html` });
  const attached = await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
  const sessionId = attached.sessionId;
  const pageErrors = [];

  cdp.on("Runtime.exceptionThrown", (event) => pageErrors.push(event.exceptionDetails?.text || "Runtime exception"));
  cdp.on("Log.entryAdded", (event) => {
    if (["error", "warning"].includes(event.entry?.level)) {
      pageErrors.push(`${event.entry.level}: ${event.entry.text}`);
    }
  });

  await cdp.send("Runtime.enable", {}, sessionId);
  await cdp.send("Log.enable", {}, sessionId);
  await cdp.send("Page.enable", {}, sessionId);
  await waitForLoad(cdp, sessionId);

  const initialComponents = await evalNumber(cdp, sessionId, `document.querySelectorAll("#basic-components-list .preset-item").length`);
  assert(initialComponents >= 50, `basic components visible initially (${initialComponents})`);

  const searchResult = await evalNumber(cdp, sessionId, `
    (() => {
      const input = document.querySelector("#basic-component-search");
      input.value = "button";
      input.dispatchEvent(new Event("input", { bubbles: true }));
      return document.querySelectorAll("#basic-components-list .preset-item").length;
    })()
  `);
  assert(searchResult >= 50, `component search keeps full catalog visible (${searchResult})`);

  const searchHits = await evalNumber(cdp, sessionId, `document.querySelectorAll("#basic-components-list .search-hit").length`);
  assert(searchHits > 0, `component search highlights matches (${searchHits})`);

  await evaluate(cdp, sessionId, `openTemplateModal()`);
  const modalOpen = await evalBoolean(cdp, sessionId, `document.querySelector("#mov")?.classList.contains("show")`);
  assert(modalOpen, "templates modal opens");
  await evaluate(cdp, sessionId, `closeM()`);

  const templateResults = await evalJson(cdp, sessionId, `
    (async () => {
      const ids = ["desktop-app", "landing-page", "mobile-app", "dashboard"];
      const results = [];
      for (const id of ids) {
        applyTemplate(id);
        await Promise.all([...document.querySelectorAll("#canvas .el img")].map((img) => img.complete ? true : new Promise((resolve) => {
          img.onload = resolve;
          img.onerror = resolve;
          setTimeout(resolve, 1500);
        })));
        const elements = st().elements.length;
        const images = [...document.querySelectorAll("#canvas .el img")];
        results.push({
          id,
          elements,
          images: images.length,
          broken: images.filter((img) => !img.complete || img.naturalWidth < 1).length,
          size: document.querySelector("#sz")?.textContent || ""
        });
      }
      return results;
    })()
  `);
  templateResults.forEach((result) => {
    assert(result.elements >= 5, `${result.id} creates elements (${result.elements})`);
    assert(result.images >= 4, `${result.id} creates image assets (${result.images})`);
    assert(result.broken === 0, `${result.id} image assets load (${result.broken} broken)`);
  });

  const brushFit = await evalJson(cdp, sessionId, `
    (() => {
      setScreen("desktop");
      const s = st();
      s.elements = [];
      document.querySelectorAll(".el,.onion,.gbox").forEach((node) => node.remove());
      const el = mkEl("Brush Layer", "", null, "brush");
      Object.assign(el, {
        x: 0,
        y: 0,
        w: cW(),
        h: cH(),
        semanticRole: "annotation",
        brushStrokes: [{
          tool: "brush",
          color: "#ff3033",
          size: 8,
          soft: false,
          erase: false,
          points: [{ x: 320, y: 240 }, { x: 360, y: 260 }, { x: 390, y: 250 }]
        }]
      });
      s.elements.push(el);
      renderEl(el);
      fitBrushLayerToStrokes(el);
      renderEl(el);
      return { x: el.x, y: el.y, w: el.w, h: el.h, firstPoint: el.brushStrokes[0].points[0] };
    })()
  `);
  assert(brushFit.w < 120 && brushFit.h < 60, `brush layer compacts (${brushFit.w}x${brushFit.h})`);
  assert(brushFit.x > 250 && brushFit.y > 190, `brush layer moves to drawing bounds (${brushFit.x}, ${brushFit.y})`);

  const cursorModes = await evalJson(cdp, sessionId, `
    (() => {
      applyTemplate("mobile-app");
      const element = document.querySelector("#canvas .el");
      setTool("sel");
      const selectCursor = getComputedStyle(element).cursor;
      setTool("brush");
      const brushCursor = getComputedStyle(element).cursor;
      return { selectCursor, brushCursor, canvasCursor: getComputedStyle(document.querySelector("#canvas")).cursor };
    })()
  `);
  assert(cursorModes.selectCursor === "move", `selection tool shows move cursor (${cursorModes.selectCursor})`);
  assert(cursorModes.brushCursor === "crosshair", `brush tool keeps crosshair over elements (${cursorModes.brushCursor})`);

  const newBrushLayer = await evalJson(cdp, sessionId, `
    (() => {
      applyTemplate("mobile-app");
      const s = st();
      selOne(s.elements.find((el) => el.type === "img").id);
      brushNewLayerNext = true;
      const before = s.elements.length;
      const selectedBefore = sel[0];
      const el = ensureBrushLayer();
      el.brushStrokes.push({
        tool: "brush",
        color: "#111111",
        size: 6,
        soft: false,
        erase: false,
        points: [{ x: 50, y: 60 }, { x: 90, y: 80 }]
      });
      fitBrushLayerToStrokes(el);
      brushNewLayerNext = false;
      return {
        before,
        after: s.elements.length,
        selectedBefore,
        newId: el.id,
        type: el.type,
        compact: el.w < 80 && el.h < 40
      };
    })()
  `);
  assert(newBrushLayer.after === newBrushLayer.before + 1, `armed brush creates a new layer (${newBrushLayer.before} -> ${newBrushLayer.after})`);
  assert(newBrushLayer.type === "brush", `armed brush layer type is brush (${newBrushLayer.type})`);
  assert(newBrushLayer.newId !== newBrushLayer.selectedBefore, "armed brush ignores selected element");
  assert(newBrushLayer.compact, "armed brush layer is compact after drawing");

  const zoomBefore = await evalString(cdp, sessionId, `document.querySelector("#zoom-lbl")?.textContent || ""`);
  await evaluate(cdp, sessionId, `
    (() => {
      const area = document.querySelector("#canvas-area");
      area.dispatchEvent(new WheelEvent("wheel", {
        bubbles: true,
        cancelable: true,
        ctrlKey: true,
        deltaY: -120,
        clientX: Math.round(innerWidth / 2),
        clientY: Math.round(innerHeight / 2)
      }));
    })()
  `);
  const zoomAfter = await evalString(cdp, sessionId, `document.querySelector("#zoom-lbl")?.textContent || ""`);
  assert(zoomBefore !== zoomAfter, `ctrl+wheel changes zoom (${zoomBefore} -> ${zoomAfter})`);

  const seriousErrors = pageErrors.filter((error) => !/favicon|net::ERR/i.test(error));
  assert(seriousErrors.length === 0, `no browser errors (${seriousErrors.join(" | ")})`);

  console.log(JSON.stringify({
    ok: true,
    initialComponents,
    searchResult,
    searchHits,
    templateResults,
    brushFit,
    cursorModes,
    newBrushLayer,
    zoomBefore,
    zoomAfter,
  }, null, 2));
} finally {
  browser.kill();
  await new Promise((resolveExit) => {
    browser.once("exit", resolveExit);
    setTimeout(resolveExit, 1500);
  });
  server.close();
  await safeRm(userDataDir);
}

function findChrome() {
  const local = process.env.LOCALAPPDATA;
  const base = local && join(local, "ms-playwright");
  if (!base || !existsSync(base)) {
    throw new Error("Chromium cache not found. Install Playwright or set up a local browser first.");
  }

  const candidates = readdirSync(base)
    .filter((name) => name.startsWith("chromium_headless_shell-"))
    .sort()
    .reverse()
    .map((name) => join(base, name, "chrome-headless-shell-win64", "chrome-headless-shell.exe"));

  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error("chrome-headless-shell.exe not found in Playwright cache.");
  return found;
}

async function waitForDebuggerUrl() {
  const url = "http://127.0.0.1:9227/json/version";
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        return data.webSocketDebuggerUrl;
      }
    } catch {
      await new Promise((resolveWait) => setTimeout(resolveWait, 100));
    }
  }
  throw new Error("Timed out waiting for Chromium debugger.");
}

function connect(wsUrl) {
  const socket = new WebSocket(wsUrl);
  let id = 0;
  const pending = new Map();
  const listeners = new Map();

  socket.addEventListener("message", (raw) => {
    const message = JSON.parse(raw.data);
    if (message.id && pending.has(message.id)) {
      const { resolveSend, rejectSend } = pending.get(message.id);
      pending.delete(message.id);
      if (message.error) rejectSend(new Error(message.error.message));
      else resolveSend(message.result || {});
      return;
    }
    const callbacks = listeners.get(message.method) || [];
    callbacks.forEach((callback) => callback(message.params || {}));
  });

  return new Promise((resolveSocket, rejectSocket) => {
    socket.addEventListener("open", () => {
      resolveSocket({
        on(method, callback) {
          listeners.set(method, [...(listeners.get(method) || []), callback]);
        },
        send(method, params = {}, sessionId) {
          id += 1;
          const payload = { id, method, params };
          if (sessionId) payload.sessionId = sessionId;
          socket.send(JSON.stringify(payload));
          return new Promise((resolveSend, rejectSend) => {
            pending.set(id, { resolveSend, rejectSend });
          });
        },
      });
    }, { once: true });
    socket.addEventListener("error", rejectSocket, { once: true });
  });
}

function waitForLoad(cdp, sessionId) {
  return new Promise(async (resolveLoad) => {
    cdp.on("Page.loadEventFired", resolveLoad);
    await cdp.send("Page.reload", { ignoreCache: true }, sessionId);
    setTimeout(resolveLoad, 3000);
  });
}

async function evaluate(cdp, sessionId, expression) {
  return cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  }, sessionId);
}

async function evalNumber(cdp, sessionId, expression) {
  const result = await evaluate(cdp, sessionId, expression);
  return Number(result.result?.value);
}

async function evalString(cdp, sessionId, expression) {
  const result = await evaluate(cdp, sessionId, expression);
  return String(result.result?.value || "");
}

async function evalBoolean(cdp, sessionId, expression) {
  const result = await evaluate(cdp, sessionId, expression);
  return Boolean(result.result?.value);
}

async function evalJson(cdp, sessionId, expression) {
  const result = await evaluate(cdp, sessionId, expression);
  return result.result?.value;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function safeRm(path) {
  for (let i = 0; i < 5; i += 1) {
    try {
      await rm(path, { recursive: true, force: true });
      return;
    } catch (error) {
      if (error.code !== "EBUSY") throw error;
      await new Promise((resolveWait) => setTimeout(resolveWait, 250));
    }
  }
}
