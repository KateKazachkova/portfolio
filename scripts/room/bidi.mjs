// A small WebDriver BiDi driver for Firefox (the room's cross-browser QA,
// firefox.mjs): launches Firefox with a fresh profile, opens one tab and
// hands back ev / go / shot, the same shape as cdp.mjs's.
import { spawn } from "node:child_process";
import fs from "node:fs";
import { sleep, log } from "./cdp.mjs";

const FIREFOX = "/Applications/Firefox.app/Contents/MacOS/firefox";

export async function launchFirefox({ width = 1512, height = 860, headless = false, clock = null } = {}) {
  const port = 9900 + Math.floor(Math.random() * 90);
  const dir = `/tmp/bidi-room-${process.pid}-${Date.now()}`;
  fs.mkdirSync(dir, { recursive: true });
  // no first-run pages, no updates, no telemetry, nothing to remember
  fs.writeFileSync(`${dir}/user.js`, [
    'user_pref("browser.shell.checkDefaultBrowser", false);', 'user_pref("browser.startup.homepage_override.mstone", "ignore");',
    'user_pref("datareporting.policy.dataSubmissionEnabled", false);', 'user_pref("toolkit.telemetry.reportingpolicy.firstRun", false);',
    'user_pref("app.update.disabledForTesting", true);', 'user_pref("browser.aboutwelcome.enabled", false);',
    'user_pref("media.autoplay.default", 0);', 'user_pref("remote.prefs.recommended", true);',
  ].join("\n"));
  const ff = spawn(FIREFOX, ["--remote-debugging-port", String(port), "--profile", dir, "--no-remote", "--new-instance", ...(headless ? ["--headless"] : []), `--width=${width}`, `--height=${height + 90}`], { stdio: "ignore" });
  let ws;
  for (let i = 0; i < 80 && !ws; i++) {
    try {
      const w = new WebSocket(`ws://127.0.0.1:${port}/session`);
      await new Promise((res, rej) => { w.onopen = res; w.onerror = rej; });
      ws = w;
    } catch { await sleep(250); }
  }
  if (!ws) throw new Error("firefox: no BiDi endpoint");
  let id = 0;
  const pend = {};
  const handlers = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
    else if (m.type === "event") for (const h of handlers) h(m);
  };
  const send = (method, params = {}, to = 60000) => new Promise((r) => {
    const i = ++id;
    const t = setTimeout(() => { if (pend[i]) { log("TIMEOUT", method); delete pend[i]; r({}); } }, to);
    pend[i] = (m) => { clearTimeout(t); r(m); };
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const s = await send("session.new", { capabilities: { alwaysMatch: { acceptInsecureCerts: true, unhandledPromptBehavior: { default: "dismiss" } } } });
  if (s.type === "error") throw new Error("firefox session: " + s.message);
  // a tab of its own: the first one opens on a privileged page, where
  // setViewport and script need system access
  const tree = await send("browsingContext.getTree", {});
  const created = await send("browsingContext.create", { type: "tab" });
  const ctx = created.result.context;
  await send("browsingContext.close", { context: tree.result.contexts[0].context });
  const vp = await send("browsingContext.setViewport", { context: ctx, viewport: { width, height }, devicePixelRatio: 2 });
  if (vp.type === "error") log("viewport", vp.error, vp.message);
  await send("session.subscribe", { events: ["log.entryAdded"] });
  const consoleLines = [];
  handlers.add((m) => { if (m.method === "log.entryAdded") consoleLines.push(`${m.params.level} ${m.params.text}`); });
  // the same fixed clock as cdp.mjs's (today 10:30, or 23:30 for NIGHT)
  if (clock) await send("script.addPreloadScript", { functionDeclaration: `() => { const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),${clock[0]},${clock[1]}).getTime()-O.now();
    class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
    window.Date=D; }` });
  const ev = async (x, to) => {
    const r = await send("script.evaluate", { expression: x, target: { context: ctx }, awaitPromise: true, resultOwnership: "none", serializationOptions: { maxObjectDepth: 20 } }, to);
    if (r.type === "error") { log("EVAL", r.message?.slice(0, 300)); return undefined; }
    if (r.result?.type === "exception") { log("EVAL", JSON.stringify(r.result.exceptionDetails).slice(0, 400)); return undefined; }
    return fromRemote(r.result?.result);
  };
  const go = async (url, wait = 0) => {
    await send("browsingContext.navigate", { context: ctx, url, wait: "complete" }, 120000);
    if (wait) await sleep(wait);
  };
  const shot = async (file) => {
    const r = await send("browsingContext.captureScreenshot", { context: ctx, origin: "viewport" }, 120000);
    if (!r.result) throw new Error("screenshot failed " + JSON.stringify(r).slice(0, 300));
    fs.writeFileSync(file, Buffer.from(r.result.data, "base64"));
  };
  const close = async () => { try { await send("session.end", {}, 3000); } catch {} try { ws.close(); } catch {} ff.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} };
  return { send, ev, go, shot, close, console: consoleLines, ctx };
}

// BiDi's serialised values back to plain JS
function fromRemote(v) {
  if (!v) return undefined;
  switch (v.type) {
    case "undefined": case "null": return v.type === "null" ? null : undefined;
    case "string": case "number": case "boolean": return v.value;
    case "array": return v.value.map(fromRemote);
    case "object": return Object.fromEntries(v.value.map(([k, x]) => [typeof k === "string" ? k : fromRemote(k), fromRemote(x)]));
    default: return v.value;
  }
}
