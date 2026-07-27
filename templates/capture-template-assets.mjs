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
  if (pathname.startsWith("/templates/") || ["/logo.png", "/readme-logo.png", "/ico.png"].includes(pathname)) {
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
*{box-sizing:border-box}body{margin:0;width:${width}px;height:${height}px;background:#f3f5f6;font-family:Inter,Arial,sans-serif;color:#111517}body:before{content:"";position:absolute;inset:0;background-image:linear-gradient(rgba(17,21,23,.035) 1px,transparent 1px),linear-gradient(90deg,rgba(17,21,23,.035) 1px,transparent 1px);background-size:40px 40px}.card{background:#fff;border:1px solid #d7dfe2;box-shadow:0 18px 54px rgba(17,21,23,.09)}.soft{background:#f8fafb;border:1px solid #d7dfe2}.ink{background:#111517;color:#fff}.red{background:#ff3033;color:#fff}.green{color:#087f5b}.muted{color:#66757b}.tiny{font-size:12px;letter-spacing:.08em;text-transform:uppercase;font-weight:900;color:#77878d}.btn{height:44px;display:inline-flex;align-items:center;justify-content:center;padding:0 24px;border:1px solid #111517;background:#fff;color:#111517;font-weight:900}.btn.red{background:#ff3033;color:#fff;border-color:#ff3033}.btn.ink{background:#111517;color:#fff;border-color:#111517}.pill{height:30px;padding:0 13px;display:inline-flex;align-items:center;border:1px solid #d7dfe2;background:#fff;font-size:12px;font-weight:850}.logo{width:172px;height:auto;object-fit:contain}.row{display:flex;align-items:center}.space{justify-content:space-between}.bar{height:8px;background:#e8eef0;position:relative;overflow:hidden}.bar i{position:absolute;inset:0 auto 0 0;background:#ff3033}.mono{font-family:Consolas,Menlo,monospace}.title{font-size:48px;line-height:1.02;margin:0;font-weight:950;letter-spacing:0}${extra}
</style></head><body>${body}</body></html>`;
}

function landingPage() {
  const features = [
    ["Exact placement", "x, y, width, height, z-index and anchors stay explicit.", "94%"],
    ["LLM ready", "Every section carries role, intent, state and handoff notes.", "1.0"],
    ["Fast drafts", "Built for the first visual pass, before production code.", "24fps"],
  ];
  return pageShell(1920, 1400, `
<header data-shot="nav" class="card" style="position:absolute;left:120px;top:42px;width:1680px;height:90px;padding:0 34px;display:flex;align-items:center;gap:56px">
  <img class="logo" src="/readme-logo.png">
  <nav style="display:flex;gap:46px;font-weight:900;margin-left:80px"><span>Product</span><span>Examples</span><span>Schema</span><span>Docs</span></nav>
  <span class="pill" style="margin-left:auto">GitHub</span><button class="btn red">Open builder</button>
</header>
<section data-shot="hero" class="card" style="position:absolute;left:120px;top:190px;width:780px;height:500px;padding:48px 54px">
  <div class="tiny" style="color:#ff3033">AI handoff canvas</div>
  <h1 class="title" style="font-size:62px;margin-top:26px;width:650px">Stop guessing UI positions.</h1>
  <p style="font-size:23px;line-height:1.42;color:#3d4a50;font-weight:650;margin:26px 0 0;width:620px">Sketch the first interface pass, attach intent to every element, then export a layout contract that an AI can actually follow.</p>
  <div style="display:flex;gap:14px;margin-top:38px"><button class="btn red">Start layout</button><button class="btn">See JSON</button></div>
  <div style="display:flex;gap:14px;margin-top:32px"><span class="pill">layers</span><span class="pill">interactions</span><span class="pill">timeline</span><span class="pill">assets</span></div>
</section>
<section data-shot="product-preview" class="card ink" style="position:absolute;left:980px;top:185px;width:760px;height:535px;padding:28px">
  <div class="row space"><b style="font-size:20px">Builder preview</b><span style="color:#94a4aa;font-size:13px">1920 x 1080</span></div>
  <div style="height:382px;margin-top:22px;display:grid;grid-template-columns:1fr 260px;gap:18px">
    <div style="min-width:0;background:#f7fafb;border:1px solid #d7dfe2;padding:26px;color:#111517">
      <div class="row" style="height:48px;border-bottom:1px solid #d7dfe2;font-weight:900">JUST <span class="muted" style="margin-left:auto;font-size:15px">Product  Schema</span></div>
      <div style="display:grid;grid-template-columns:minmax(0,1fr) 120px;gap:16px;margin-top:28px;overflow:hidden">
        <div style="min-width:0"><div class="red" style="height:58px;width:225px"></div><div style="height:18px;width:285px;background:#111517;margin-top:26px"></div><div style="height:12px;width:245px;background:#8fa0a6;margin-top:14px"></div><div style="height:42px;width:150px;background:#111517;margin-top:28px"></div></div>
        <div class="soft" style="height:250px;padding:14px;min-width:0"><div class="bar"><i style="width:84%"></i></div><div style="height:110px;background:#fff;border:1px solid #d7dfe2;margin-top:28px"></div><div style="height:16px;background:#111517;margin-top:22px"></div><div style="height:10px;background:#8fa0a6;margin-top:10px;width:70%"></div></div>
      </div>
    </div>
    <pre class="mono" style="min-width:0;overflow:hidden;margin:0;background:#080b0c;border:1px solid #30393c;color:#9fffc4;padding:22px;font-size:14px;line-height:1.72">{
  "role": "hero",
  "x": 120,
  "y": 190,
  "layer": 24,
  "notes": "keep CTA"
}</pre>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-top:18px"><span class="soft" style="padding:15px;color:#111517;font-weight:900">Canvas</span><span class="soft" style="padding:15px;color:#111517;font-weight:900">Validate</span><span class="red" style="padding:15px;font-weight:900">Copy prompt</span></div>
</section>
<section data-shot="feature-grid" style="position:absolute;left:120px;top:790px;width:840px;height:280px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px">
  ${features.map(([title, copy, value], index) => `<article class="card" style="padding:28px;position:relative"><span class="tiny">0${index + 1}</span><h3 style="font-size:24px;margin:34px 0 14px">${title}</h3><p class="muted" style="font-size:16px;line-height:1.5">${copy}</p><b style="position:absolute;right:28px;bottom:24px;font-size:28px;color:${index === 1 ? "#111517" : "#ff3033"}">${value}</b></article>`).join("")}
</section>
<form data-shot="signup-form" class="card" style="position:absolute;left:1160px;top:790px;width:450px;height:382px;padding:32px">
  <h2 style="font-size:28px;margin:0">Start a draft</h2><p class="muted" style="margin:8px 0 26px">Create a project contract.</p>
  ${["Project name", "Target stack", "AI notes"].map((label, index) => `<label style="display:block;font-size:13px;font-weight:900;margin-bottom:17px">${label}<span style="display:block;height:${index === 2 ? 72 : 42}px;border:1px solid #cfd8db;background:#fbfcfc;margin-top:8px"></span></label>`).join("")}
  <button class="btn ink" style="height:42px">Create layout</button>
</form>
<footer data-shot="footer" class="card" style="position:absolute;left:120px;top:1245px;width:1680px;height:80px;display:flex;align-items:center;padding:0 34px;font-weight:850"><span>2026 JUST</span><span style="margin-left:auto">Docs</span><span style="margin-left:160px">GitHub</span><span style="margin-left:160px">Schema</span></footer>`);
}

function desktopApp() {
  const layers = ["Nav / product", "Hero headline", "Preview mockup", "JSON toast", "Feature cards", "Footer"];
  return pageShell(1920, 1080, `
<header data-shot="topbar" class="card" style="position:absolute;left:82px;top:30px;width:1758px;height:74px;padding:0 24px;display:flex;align-items:center;gap:38px"><img class="logo" src="/readme-logo.png"><b>File</b><b>Edit</b><b>Preview</b><span class="pill" style="margin-left:auto">saved 08:41:22</span><button class="btn">Validate</button><button class="btn red">Export JSON</button></header>
<aside data-shot="tool-rail" class="ink" style="position:absolute;left:34px;top:122px;width:70px;height:884px;padding:20px 17px;display:flex;flex-direction:column;gap:13px">${["V","T","P","B","E","C","R"].map((t,i)=>`<div style="height:36px;border:1px solid #546368;display:grid;place-items:center;font-weight:950;background:${i===0?"#ff3033":"#151c1f"}">${t}</div>`).join("")}<div style="margin-top:auto;height:118px;border:1px solid #546368;background:#20282b"></div></aside>
<aside data-shot="sidebar" class="card" style="position:absolute;left:124px;top:122px;width:288px;height:884px;padding:24px"><div class="row space"><h2 style="margin:0;font-size:20px">Project menu</h2><b>+</b></div><div class="soft" style="height:48px;margin-top:22px;padding:14px;font-weight:900">Screen 1</div><h3 class="tiny" style="margin:30px 0 12px">Layers</h3>${layers.map((layer,i)=>`<div style="height:38px;display:flex;align-items:center;border-bottom:1px solid #e6ecee;font-size:13px;font-weight:${i===1?950:700}"><span style="width:8px;height:8px;background:${i===1?"#ff3033":"#b9c5c9"};margin-right:10px"></span>${layer}</div>`).join("")}<h3 class="tiny" style="margin:32px 0 12px">Assets</h3><div class="soft" style="height:124px;padding:15px;line-height:2;font-size:13px;font-weight:750">logo.png<br>hero-preview.png<br>component-set.json</div></aside>
<main data-shot="canvas-panel" class="card ink" style="position:absolute;left:452px;top:160px;width:980px;height:690px;padding:26px"><div class="row space"><b style="font-size:20px">Canvas / landing-page</b><span style="color:#97a7ad;font-size:13px">Grid 30% / 75%</span></div><div style="height:510px;background:#f9fbfb;border:1px solid #d7dfe2;margin-top:24px;padding:34px;color:#111517"><div style="height:54px;background:#fff;border:1px solid #d7dfe2;padding:16px 20px;font-weight:900">JUST <span class="muted" style="float:right">Product&nbsp;&nbsp;&nbsp;Schema&nbsp;&nbsp;&nbsp;Export</span></div><div style="display:grid;grid-template-columns:1fr 300px;gap:34px;margin-top:34px"><div><div class="tiny" style="color:#ff3033">Selected hero</div><h2 style="font-size:48px;line-height:1;margin:18px 0">Exact UI position for AI builds.</h2><p class="muted" style="font-size:18px;line-height:1.45;width:440px">Every block carries coordinates and intent.</p><div class="red" style="width:170px;height:48px;margin-top:28px"></div></div><div class="soft" style="height:300px;padding:22px"><div style="height:54px;background:#111517"></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:18px"><span style="height:96px;background:#fff;border:1px solid #d7dfe2"></span><span style="height:96px;background:#fff;border:1px solid #d7dfe2"></span></div><div class="bar" style="margin-top:22px"><i style="width:78%"></i></div></div></div></div><div style="display:flex;gap:10px;margin-top:22px"><button class="btn red">Select</button><button class="btn" style="background:#20282b;color:#fff;border-color:#445257">Brush</button><button class="btn" style="background:#20282b;color:#fff;border-color:#445257">Timeline</button></div></main>
<aside data-shot="inspector" class="card" style="position:absolute;left:1480px;top:160px;width:330px;height:690px;padding:24px"><h2 style="margin:0 0 22px">Inspector</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);height:40px;text-align:center;font-weight:900"><span class="ink" style="padding-top:12px">Layout</span><span class="soft" style="padding-top:12px">Visual</span><span class="soft" style="padding-top:12px">AI</span></div>${["X 120", "Y 190", "W 780", "H 500", "Role hero"].map((row,i)=>`<div style="margin-top:${i?10:26}px"><div class="tiny">${row.split(" ")[0]}</div><div class="soft" style="height:38px;padding:11px 12px;font-weight:850">${row}</div></div>`).join("")}<div class="soft" style="height:118px;margin-top:22px;padding:14px;line-height:1.45;font-size:13px">Keep headline dominant. CTA starts below paragraph and aligns to hero left.</div><button class="btn ink" style="width:100%;margin-top:20px">Copy prompt + JSON</button></aside>
<section data-shot="timeline" class="card" style="position:absolute;left:452px;top:878px;width:980px;height:128px;padding:20px"><div class="row space"><b>Timeline</b><span class="tiny">24 FPS / 2.0s</span></div><div style="height:52px;margin-top:18px;display:grid;grid-template-columns:1.1fr 1.7fr 1fr;gap:8px;text-align:center;font-weight:900"><span class="ink" style="padding-top:18px">Frame 0</span><span class="red" style="padding-top:18px">Hero enters</span><span class="soft" style="padding-top:11px">Frame 48<br><small>ease-out</small></span></div></section>`);
}

function mobileApp() {
  return pageShell(393, 852, `
<header data-shot="status-header" class="card" style="position:absolute;left:0;top:0;width:393px;height:94px;padding:18px 22px;display:flex;align-items:center"><img src="/readme-logo.png" style="width:132px"><div style="margin-left:auto;width:42px;height:42px;background:#111517;color:#fff;display:grid;place-items:center;font-weight:950">M</div></header>
<section data-shot="hero-card" class="ink" style="position:absolute;left:22px;top:120px;width:349px;height:250px;padding:28px"><span class="tiny" style="color:#a7b6bb">mobile builder</span><h1 style="font-size:34px;line-height:1.05;margin:18px 0 14px">Start interfaces faster.</h1><p style="color:#d4dde0;font-size:15px;line-height:1.5;margin:0">Place UI, add intent and export JSON for the next AI pass.</p><button class="btn red" style="height:42px;margin-top:24px">New layout</button></section>
<section data-shot="activity-card" class="card" style="position:absolute;left:22px;top:398px;width:349px;height:305px;padding:24px"><div class="row space"><h2 style="font-size:21px;margin:0">Recent layouts</h2><span class="pill">3</span></div>${[["Landing page","Ready","92"],["Dashboard","Review","64"],["Mobile app","Draft","38"]].map(([n,s,p],i)=>`<div style="height:68px;border-top:1px solid #d7dfe2;padding-top:16px"><b>${n}</b><span style="float:right;color:${i===1?"#ff3033":"#087f5b"};font-weight:900">${s}</span><div class="bar" style="margin-top:10px"><i style="width:${p}%"></i></div></div>`).join("")}</section>
<nav data-shot="bottom-nav" class="card" style="position:absolute;left:0;top:772px;width:393px;height:80px;display:grid;grid-template-columns:repeat(4,1fr);text-align:center;font-weight:850;padding-top:18px">${["Home","Files","JSON","Me"].map((label,i)=>`<span style="color:${i===0?"#ff3033":"#111517"}"><b style="display:block;font-size:18px">${label[0]}</b><small>${label}</small></span>`).join("")}</nav>`);
}

function dashboard() {
  const kpis = [["Revenue","$84.2k","+12%","78"],["Projects","128","+9%","64"],["Warnings","7","-18%","22"],["Exports","2.4k","+31%","91"]];
  const rows = [["JUST redesign","Ready","React"],["Client dashboard","Review","Next.js"],["Mobile flow","Ready","Flutter"],["Schema audit","Warning","Vue"]];
  return pageShell(1920, 1080, `
<aside data-shot="sidebar" class="ink" style="position:absolute;left:0;top:0;width:286px;height:1080px;padding:34px"><img src="/readme-logo.png" style="width:176px;background:#fff"><nav style="display:grid;gap:10px;margin-top:56px;font-weight:900">${["Overview","Projects","Assets","Timeline","Settings"].map((item,i)=>`<span style="height:44px;padding:13px 14px;border:1px solid ${i===0?"#ff3033":"#344044"};background:${i===0?"#ff3033":"#151c1f"}">${item}</span>`).join("")}</nav><div style="position:absolute;left:34px;right:34px;bottom:34px;color:#9aa9ae;line-height:1.6;font-size:13px">JSON schema<br><b style="color:#fff">validated 2m ago</b></div></aside>
<header data-shot="topbar" class="card" style="position:absolute;left:330px;top:36px;width:1470px;height:76px;padding:16px 24px;display:flex;align-items:center"><div><b style="font-size:28px">Project dashboard</b><div class="muted" style="font-size:13px;margin-top:3px">Visual contracts exported this week</div></div><span class="soft" style="margin-left:auto;width:360px;height:42px;padding:12px;color:#66757b">Search projects...</span><button class="btn red" style="margin-left:16px">New export</button></header>
<section data-shot="kpi-row" style="position:absolute;left:330px;top:150px;width:1470px;height:154px;display:grid;grid-template-columns:repeat(4,1fr);gap:24px">${kpis.map(([label,value,change,progress],i)=>`<article class="card" style="padding:24px"><div class="row space"><span class="muted">${label}</span><b style="color:${i===2?"#ff3033":"#087f5b"}">${change}</b></div><div style="font-size:40px;font-weight:950;margin-top:16px">${value}</div><div class="bar" style="margin-top:18px"><i style="width:${progress}%"></i></div></article>`).join("")}</section>
<section data-shot="chart-panel" class="card" style="position:absolute;left:330px;top:340px;width:900px;height:470px;padding:30px"><div class="row space"><h2 style="margin:0;font-size:26px">Exports over time</h2><span class="pill">Last 30 days</span></div><div class="soft" style="height:338px;margin-top:28px;padding:34px 40px"><svg width="760" height="260" viewBox="0 0 760 260"><path d="M0 218H760" stroke="#d7dfe2"/><path d="M0 162H760" stroke="#d7dfe2"/><path d="M0 106H760" stroke="#d7dfe2"/><polyline points="0,205 90,180 180,188 270,118 360,145 450,74 540,92 630,42 760,62" fill="none" stroke="#ff3033" stroke-width="7"/><polyline points="0,226 90,212 180,196 270,180 360,156 450,142 540,114 630,104 760,88" fill="none" stroke="#111517" stroke-width="6"/><g fill="#ff3033">${[0,90,180,270,360,450,540,630,760].map((x,i)=>`<circle cx="${x}" cy="${[205,180,188,118,145,74,92,42,62][i]}" r="6"/>`).join("")}</g></svg></div></section>
<section data-shot="table-panel" class="card" style="position:absolute;left:1270px;top:340px;width:530px;height:470px;padding:28px"><div class="row space"><h2 style="margin:0;font-size:25px">Recent projects</h2><span class="pill">Live</span></div>${rows.map(([name,status,stack])=>`<div style="height:78px;border-top:1px solid #d7dfe2;padding-top:18px"><b>${name}</b><span style="float:right;color:${status==="Warning"?"#ff3033":"#087f5b"};font-weight:900">${status}</span><div class="muted" style="margin-top:8px">${stack} target</div></div>`).join("")}</section>
<section data-shot="activity-panel" class="card" style="position:absolute;left:330px;top:846px;width:1470px;height:150px;padding:28px;display:grid;grid-template-columns:300px 1fr 190px;gap:28px;align-items:center"><div><b style="font-size:25px">Schema validation</b><p class="muted" style="margin:10px 0 0">All required LLM fields are present.</p></div><div><div class="bar" style="height:14px"><i style="width:94%"></i></div><div class="row space muted" style="font-size:13px;margin-top:14px"><span>canvas</span><span>assets</span><span>elements</span><span>timeline</span></div></div><button class="btn ink">Open report</button></section>`);
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
