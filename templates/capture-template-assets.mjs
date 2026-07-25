import { createServer } from "node:http";
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import { tmpdir } from "node:os";

const root = resolve(import.meta.dirname, "..");
const port = 8921;
const chrome = findChrome();
const userDataDir = join(tmpdir(), `just-template-capture-${Date.now()}`);
await mkdir(userDataDir, { recursive: true });

const templatePages = {
  "landing-page": {
    width: 1920,
    height: 1400,
    sections: ["nav", "hero", "product-preview", "feature-grid", "signup-form", "footer"],
    html: landingPage(),
  },
  "desktop-app": {
    width: 1920,
    height: 1080,
    sections: ["topbar", "tool-rail", "sidebar", "canvas-panel", "inspector", "timeline"],
    html: desktopApp(),
  },
  "mobile-app": {
    width: 393,
    height: 852,
    sections: ["status-header", "hero-card", "activity-card", "bottom-nav"],
    html: mobileApp(),
  },
  dashboard: {
    width: 1920,
    height: 1080,
    sections: ["sidebar", "topbar", "kpi-row", "chart-panel", "table-panel", "activity-panel"],
    html: dashboard(),
  },
};

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(url.pathname);
  if (pathname.startsWith("/templates/") || pathname === "/logo.png" || pathname === "/ico.png") {
    try {
      const data = await import("node:fs/promises").then((fs) => fs.readFile(resolve(root, `.${pathname}`)));
      res.writeHead(200, { "Content-Type": pathname.endsWith(".png") ? "image/png" : "text/html; charset=utf-8" });
      res.end(data);
      return;
    } catch {
      res.writeHead(404);
      res.end("missing");
      return;
    }
  }
  const key = pathname.replace(/^\/+/, "").replace(/\/$/, "") || "landing-page";
  const page = templatePages[key];
  res.writeHead(page ? 200 : 404, { "Content-Type": "text/html; charset=utf-8" });
  res.end(page ? page.html : "missing template");
});

await new Promise((resolveServer) => server.listen(port, "127.0.0.1", resolveServer));

const browser = spawn(chrome, [
  "--headless=new",
  "--disable-gpu",
  "--no-first-run",
  "--remote-debugging-port=9231",
  `--user-data-dir=${userDataDir}`,
  "about:blank",
], { stdio: ["ignore", "ignore", "ignore"] });

try {
  const wsUrl = await waitForDebuggerUrl();
  const cdp = await connect(wsUrl);
  for (const [name, page] of Object.entries(templatePages)) {
    await mkdir(resolve(root, "templates", name, "assets"), { recursive: true });
    const target = await cdp.send("Target.createTarget", { url: `http://127.0.0.1:${port}/${name}` });
    const { sessionId } = await cdp.send("Target.attachToTarget", { targetId: target.targetId, flatten: true });
    await cdp.send("Page.enable", {}, sessionId);
    await cdp.send("Runtime.enable", {}, sessionId);
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: page.width,
      height: page.height,
      deviceScaleFactor: 1,
      mobile: false,
    }, sessionId);
    await waitForLoad(cdp, sessionId);

    for (const section of page.sections) {
      await waitForSelector(cdp, sessionId, `[data-shot="${section}"]`);
      const rect = await selectorRect(cdp, sessionId, `[data-shot="${section}"]`);
      const shot = await cdp.send("Page.captureScreenshot", {
        format: "png",
        clip: { x: rect.x, y: rect.y, width: rect.width, height: rect.height, scale: 1 },
      }, sessionId);
      await writeFile(resolve(root, "templates", name, "assets", `${section}.png`), Buffer.from(shot.data, "base64"));
    }
    await cdp.send("Target.closeTarget", { targetId: target.targetId });
  }
  console.log("captured template assets");
} finally {
  browser.kill();
  await new Promise((resolveExit) => {
    browser.once("exit", resolveExit);
    setTimeout(resolveExit, 1500);
  });
  server.close();
  await rm(userDataDir, { recursive: true, force: true }).catch(() => {});
}

function pageShell(width, height, body, extra = "") {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{margin:0;width:${width}px;height:${height}px;background:#f4f6f6;font-family:Inter,Arial,sans-serif;color:#111517}.logo{width:164px;height:auto;object-fit:contain}.panel{background:#fff;border:1px solid #d8dee1}.dark{background:#111517;color:#fff}.red{background:#ff3033;color:#fff}.muted{color:#59676d}.btn{height:46px;display:inline-flex;align-items:center;justify-content:center;padding:0 28px;font-weight:800;border:1px solid #111517;background:#fff}.btn.primary{background:#ff3033;border-color:#ff3033;color:#fff}.metric{font-weight:900}.mono{font-family:Consolas,monospace}${extra}
</style></head><body>${body}</body></html>`;
}

function landingPage() {
  return pageShell(1920, 1400, `
<header data-shot="nav" class="panel" style="position:absolute;left:120px;top:40px;width:1680px;height:88px;display:flex;align-items:center;padding:0 36px;gap:72px">
  <img class="logo" src="/logo.png"><nav style="display:flex;gap:54px;margin-left:170px;font-weight:750"><span>Product</span><span>Schema</span><span>Examples</span><span>Docs</span></nav><button class="btn primary" style="margin-left:auto">Start free</button>
</header>
<section data-shot="hero" style="position:absolute;left:120px;top:190px;width:720px;height:420px;background:#fff;padding-top:22px">
  <h1 style="font-size:64px;line-height:.98;margin:0 0 30px;font-weight:950;letter-spacing:0">Stop guessing<br>UI positions.</h1>
  <div style="width:590px;border-left:6px solid #ff3033;padding:18px 0 18px 24px;background:#f8fafb">
    <p style="font-size:24px;line-height:1.28;margin:0;font-weight:850">Export a layout JSON that explains position, layers, states, interactions and timeline.</p>
    <p class="muted" style="font-size:18px;margin:18px 0 0">Built for AI handoff.</p>
  </div>
  <div style="display:flex;gap:18px;margin-top:30px"><button class="btn primary">Open builder</button><button class="btn">See JSON</button></div>
</section>
<section data-shot="product-preview" class="panel" style="position:absolute;left:980px;top:170px;width:760px;height:520px;background:#edf2f4;padding:40px">
  <div class="panel" style="height:300px;background:#fff;padding:26px">
    <div style="height:54px;display:grid;grid-template-columns:1fr 1fr 1fr;text-align:center;font-weight:850"><span class="dark" style="padding-top:18px">Canvas</span><span style="padding-top:18px">JSON</span><span style="padding-top:18px">Prompt</span></div>
    <div style="display:grid;grid-template-columns:1.3fr .8fr;gap:22px;margin-top:24px">
      <div style="background:#f7fafb;height:160px;border:1px solid #d8dee1;padding:24px"><div class="red" style="width:160px;height:56px"></div><div class="dark" style="width:270px;height:16px;margin-top:28px"></div><div style="width:220px;height:12px;background:#93a0a5;margin-top:16px"></div></div>
      <div class="dark mono" style="height:160px;padding:22px;line-height:1.7;color:#00ff99">{"x":120,<br>"y":96,<br>"layer":4}</div>
    </div>
  </div>
  <div class="dark" style="position:absolute;right:50px;bottom:42px;width:300px;height:62px;border-left:5px solid #00ff99;padding:14px 22px;font-weight:850">JSON copied<br><span style="font-weight:600;color:#cbd4d7">Prompt and schema are ready</span></div>
</section>
<section data-shot="feature-grid" style="position:absolute;left:120px;top:760px;width:760px;height:260px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
  ${["Precise layout|Every element exports bounds and layer order.", "LLM context|Semantic roles explain intent.", "Timeline ready|Keyframes and duration can travel too."].map((t, i) => {
    const [a, b] = t.split("|");
    return `<article class="panel" style="padding:28px"><div class="${i === 0 ? "red" : i === 1 ? "dark" : ""}" style="width:46px;height:46px;background:${i === 2 ? "#00ff99" : ""}"></div><h3 style="font-size:22px;margin:32px 0 12px">${a}</h3><p class="muted" style="font-size:16px;line-height:1.45">${b}</p></article>`;
  }).join("")}
</section>
<form data-shot="signup-form" class="panel" style="position:absolute;left:1160px;top:760px;width:430px;height:360px;padding:28px">
  <h2 style="margin:0 0 26px;font-size:24px">Try the builder</h2>
  ${["Name", "Email", "Project type"].map((x) => `<label style="display:block;font-weight:750;margin:0 0 18px">${x}<span style="display:block;height:40px;border:1px solid #cbd4d7;background:#f9fbfb;margin-top:8px"></span></label>`).join("")}
  <button class="btn dark" style="height:38px">Submit</button>
</form>
<footer data-shot="footer" class="panel" style="position:absolute;left:120px;top:1240px;width:1680px;height:78px;display:flex;align-items:center;padding:0 32px;font-weight:750"><span>© 2026 JUST</span><span style="margin-left:auto">Docs</span><span style="margin-left:160px">GitHub</span><span style="margin-left:160px">Schema</span></footer>`);
}

function desktopApp() {
  return pageShell(1920, 1080, `
<header data-shot="topbar" class="panel" style="position:absolute;left:100px;top:34px;width:1720px;height:72px;display:flex;align-items:center;padding:0 24px;gap:70px"><img class="logo" src="/logo.png"><b>File</b><b>Edit</b><b>Preview</b><button class="btn dark" style="margin-left:auto">Validate</button><button class="btn primary">Export JSON</button></header>
<aside data-shot="tool-rail" class="dark" style="position:absolute;left:40px;top:110px;width:72px;height:900px;padding:22px 18px;display:flex;flex-direction:column;gap:16px">${["↖","T","✎","◰","⌖"].map((x,i)=>`<div style="height:36px;border:1px solid #5e6b70;display:grid;place-items:center;background:${i===0?"#ff3033":"transparent"}">${x}</div>`).join("")}</aside>
<aside data-shot="sidebar" class="panel" style="position:absolute;left:130px;top:110px;width:260px;height:900px;padding:28px 24px"><h2 style="font-size:18px;margin:0 0 24px">Project menu</h2><hr>${["Screens","Layers","Assets","Components"].map((x,i)=>`<h3 style="font-size:15px;margin:${i?32:24}px 0 14px">${x}</h3><p class="muted" style="line-height:1.9;margin:0">Header / nav<br>Hero image<br>Primary CTA</p>`).join("")}</aside>
<main data-shot="canvas-panel" class="panel" style="position:absolute;left:430px;top:190px;width:980px;height:640px;background:#f4f7f8;padding:24px"><div class="panel" style="height:48px;padding:15px 22px;font-weight:850">Project / Screen 1 / Dashboard</div><div class="panel" style="height:382px;margin:26px 16px;background:#fff;padding:44px"><div class="dark" style="width:310px;height:58px"></div><div style="width:500px;height:18px;background:#56636a;margin-top:30px"></div><div style="width:430px;height:14px;background:#879299;margin-top:18px"></div><div style="float:right;margin-top:-130px;width:220px;height:240px;background:#edf2f4;border:1px solid #c9d2d5;padding:36px"><div class="red" style="width:150px;height:150px"></div></div></div><b>Canvas / artboard</b><div style="display:flex;gap:8px;margin-top:26px"><button class="btn dark">Grid</button><button class="btn">Snap</button></div></main>
<aside data-shot="inspector" class="panel" style="position:absolute;left:1460px;top:190px;width:330px;height:640px;padding:26px"><h2 style="margin:0 0 26px">Inspector</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);height:42px;text-align:center;font-weight:850"><span class="dark" style="padding-top:13px">Layout</span><span class="panel" style="padding-top:13px">Visual</span><span class="panel" style="padding-top:13px">AI</span></div><h3 style="font-size:14px;margin-top:40px">Position</h3><div style="display:grid;grid-template-columns:1fr 1fr;gap:14px"><span class="panel" style="height:36px"></span><span class="panel" style="height:36px"></span></div><h3 style="font-size:14px;margin-top:34px">Semantic role</h3><span class="panel" style="display:block;height:36px"></span><h3 style="font-size:14px;margin-top:34px">Description</h3><span class="panel" style="display:block;height:96px"></span><button class="btn dark" style="margin-top:86px">Copy JSON</button></aside>
<section data-shot="timeline" class="panel" style="position:absolute;left:430px;top:860px;width:980px;height:150px;padding:24px"><b>Timeline</b><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:22px;text-align:center;font-weight:850"><span class="dark" style="height:44px;padding-top:14px">Frame 0</span><span class="dark" style="height:44px;padding-top:14px">Frame 24</span><span style="background:#edf2f4;height:44px;padding-top:8px">Frame 48<br><small>Keyframes</small></span></div></section>`);
}

function mobileApp() {
  return pageShell(393, 852, `
<header data-shot="status-header" class="panel" style="position:absolute;left:0;top:0;width:393px;height:92px;padding:18px 22px;display:flex;align-items:center"><img src="/logo.png" style="width:118px"><div style="margin-left:auto;width:38px;height:38px;background:#111517"></div></header>
<section data-shot="hero-card" class="dark" style="position:absolute;left:22px;top:120px;width:349px;height:238px;padding:28px"><h1 style="font-size:34px;line-height:1.05;margin:0">Ship exact UI from JSON.</h1><p style="color:#cbd4d7;font-size:16px;line-height:1.5">Mobile-ready layout contracts for AI handoff.</p><button class="btn primary" style="margin-top:22px">Create layout</button></section>
<section data-shot="activity-card" class="panel" style="position:absolute;left:22px;top:386px;width:349px;height:308px;padding:24px"><h2 style="font-size:20px;margin:0 0 18px">Recent layouts</h2>${["Landing page","Dashboard","Mobile app"].map((x,i)=>`<div style="height:58px;border-top:1px solid #d8dee1;padding-top:16px"><b>${x}</b><span class="muted" style="float:right">${i+1}m</span></div>`).join("")}</section>
<nav data-shot="bottom-nav" class="panel" style="position:absolute;left:0;top:772px;width:393px;height:80px;display:grid;grid-template-columns:repeat(4,1fr);text-align:center;font-weight:800;padding-top:24px"><span>Home</span><span>Files</span><span>JSON</span><span>Me</span></nav>`);
}

function dashboard() {
  return pageShell(1920, 1080, `
<aside data-shot="sidebar" class="dark" style="position:absolute;left:0;top:0;width:280px;height:1080px;padding:36px"><img src="/logo.png" style="width:150px;background:#fff"><nav style="display:grid;gap:24px;margin-top:70px;font-weight:850"><span>Overview</span><span>Projects</span><span>Assets</span><span>Settings</span></nav></aside>
<header data-shot="topbar" class="panel" style="position:absolute;left:320px;top:36px;width:1480px;height:72px;padding:18px 28px;display:flex;align-items:center"><b style="font-size:26px">Dashboard</b><span class="panel" style="margin-left:auto;width:360px;height:40px;padding:12px;color:#59676d">Search projects...</span></header>
<section data-shot="kpi-row" style="position:absolute;left:320px;top:148px;width:1480px;height:150px;display:grid;grid-template-columns:repeat(4,1fr);gap:26px">${["Revenue|$42.8k|+12%","Users|18,204|+6%","Exports|1,482|+31%","Warnings|12|-8%"].map((x,i)=>{const [a,b,c]=x.split("|");return `<div class="panel" style="padding:28px"><span class="muted">${a}</span><div class="metric" style="font-size:38px;margin-top:18px">${b}</div><b style="color:${i===3?"#ff3033":"#009b65"}">${c}</b></div>`}).join("")}</section>
<section data-shot="chart-panel" class="panel" style="position:absolute;left:320px;top:338px;width:900px;height:470px;padding:34px"><h2 style="margin:0 0 30px">Exports over time</h2><div style="height:330px;background:linear-gradient(180deg,#edf2f4,#fff);border:1px solid #d8dee1;position:relative"><div class="red" style="position:absolute;left:70px;bottom:50px;width:62px;height:160px"></div><div class="dark" style="position:absolute;left:180px;bottom:50px;width:62px;height:240px"></div><div class="red" style="position:absolute;left:290px;bottom:50px;width:62px;height:205px"></div><div class="dark" style="position:absolute;left:400px;bottom:50px;width:62px;height:280px"></div></div></section>
<section data-shot="table-panel" class="panel" style="position:absolute;left:1260px;top:338px;width:540px;height:470px;padding:30px"><h2 style="margin:0 0 22px">Recent projects</h2>${["Landing page|Ready","Desktop app|Draft","Mobile flow|Ready","Modal interaction|Warning"].map(x=>{const [a,b]=x.split("|");return `<div style="height:68px;border-top:1px solid #d8dee1;padding-top:22px"><b>${a}</b><span style="float:right">${b}</span></div>`}).join("")}</section>
<section data-shot="activity-panel" class="panel" style="position:absolute;left:320px;top:846px;width:1480px;height:150px;padding:30px;display:flex;gap:28px;align-items:center"><b style="font-size:24px">Schema validation</b><div style="height:18px;flex:1;background:#edf2f4"><span class="red" style="display:block;width:82%;height:18px"></span></div><button class="btn dark">Open report</button></section>`);
}

async function selectorRect(cdp, sessionId, selector) {
  const result = await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const el = document.querySelector(${JSON.stringify(selector)});
      if (!el) throw new Error(${JSON.stringify(`missing selector ${selector}`)});
      const r = el.getBoundingClientRect();
      return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
    })()`,
    returnByValue: true,
  }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || `Cannot read ${selector}`);
  }
  if (!result.result?.value) throw new Error(`Missing rect for ${selector}`);
  return result.result.value;
}

async function waitForSelector(cdp, sessionId, selector) {
  for (let i = 0; i < 30; i += 1) {
    const result = await cdp.send("Runtime.evaluate", {
      expression: `!!document.querySelector(${JSON.stringify(selector)})`,
      returnByValue: true,
    }, sessionId);
    if (result.result?.value) return;
    await new Promise((resolveWait) => setTimeout(resolveWait, 100));
  }
  throw new Error(`Timed out waiting for ${selector}`);
}

async function waitForDebuggerUrl() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const response = await fetch("http://127.0.0.1:9231/json/version");
      if (response.ok) return (await response.json()).webSocketDebuggerUrl;
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
  return new Promise((resolveSocket, rejectSocket) => {
    socket.addEventListener("open", () => resolveSocket({
      send(method, params = {}, sessionId) {
        id += 1;
        const payload = { id, method, params };
        if (sessionId) payload.sessionId = sessionId;
        socket.send(JSON.stringify(payload));
        return new Promise((resolveSend, rejectSend) => pending.set(id, { resolveSend, rejectSend }));
      },
    }), { once: true });
    socket.addEventListener("message", (raw) => {
      const message = JSON.parse(raw.data);
      const item = pending.get(message.id);
      if (!item) return;
      pending.delete(message.id);
      if (message.error) item.rejectSend(new Error(message.error.message));
      else item.resolveSend(message.result || {});
    });
    socket.addEventListener("error", rejectSocket, { once: true });
  });
}

function waitForLoad(cdp, sessionId) {
  return new Promise(async (resolveLoad) => {
    const timer = setTimeout(resolveLoad, 2000);
    await cdp.send("Page.reload", { ignoreCache: true }, sessionId);
    setTimeout(() => {
      clearTimeout(timer);
      resolveLoad();
    }, 700);
  });
}

function findChrome() {
  const base = process.env.LOCALAPPDATA && join(process.env.LOCALAPPDATA, "ms-playwright");
  if (!base || !existsSync(base)) throw new Error("Playwright Chromium cache not found.");
  const candidates = readdirSync(base)
    .filter((name) => name.startsWith("chromium_headless_shell-"))
    .sort()
    .reverse()
    .map((name) => join(base, name, "chrome-headless-shell-win64", "chrome-headless-shell.exe"));
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) throw new Error("chrome-headless-shell.exe not found.");
  return found;
}
