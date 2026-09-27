// A small Chrome DevTools Protocol driver for the room's scripts (bake,
// bench, compare): launches Chrome (headless, or headed for the real GPU),
// opens one page and hands back send / ev / shot.
import { spawn } from "node:child_process";
import fs from "node:fs";

const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
// where the tests put what they record (frames, screenshots, traces, JSON):
// out of ~/Documents, which iCloud syncs — thousands of frames there keep
// fileproviderd busy and the machine too loaded to measure (27.09)
export const TESTS = process.env.ROOM_TESTS ?? `${process.env.HOME}/portfolio-test-output`;
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const log = (...a) => process.stderr.write(new Date().toISOString().slice(11, 19) + " " + a.join(" ") + "\n");

export async function launch({ headed = false, width = 1600, height = 1000, dpr = 1, extra = [] } = {}) {
  const port = 9500 + Math.floor(Math.random() * 400);
  const dir = `/tmp/cdp-room-${process.pid}-${Date.now()}`;
  const args = [
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, "--no-first-run", "--no-default-browser-check",
    "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required", `--window-size=${width},${height + 120}`, "--window-position=30,30",
    // a headed window behind others (or on another Space) would be occluded,
    // its page hidden and its frames stopped: keep it drawing
    "--disable-backgrounding-occluded-windows", "--disable-renderer-backgrounding", "--disable-background-timer-throttling",
    ...(headed ? [] : ["--headless=new"]), ...extra, "about:blank",
  ];
  const chrome = spawn(CHROME, args, { stdio: "ignore" });
  let ws;
  for (let i = 0; i < 80 && !ws; i++) {
    try {
      const l = await (await fetch(`http://127.0.0.1:${port}/json`)).json();
      const p = l.find((t) => t.type === "page");
      if (p) ws = new WebSocket(p.webSocketDebuggerUrl);
    } catch {}
    if (!ws) await sleep(250);
  }
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pend = {};
  const handlers = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend[m.id]) { pend[m.id](m); delete pend[m.id]; }
    else if (m.method) for (const h of handlers) h(m);
  };
  const send = (method, params = {}, to = 60000) => new Promise((r) => {
    const i = ++id;
    const t = setTimeout(() => { if (pend[i]) { log("TIMEOUT", method); delete pend[i]; r({}); } }, to);
    t.unref?.();
    pend[i] = (m) => { clearTimeout(t); r(m); };
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  const ev = async (x, to) => {
    const r = await send("Runtime.evaluate", { expression: x, awaitPromise: true, returnByValue: true }, to);
    if (r.result?.exceptionDetails) log("EVAL", JSON.stringify(r.result.exceptionDetails).slice(0, 600));
    return r.result?.result?.value;
  };
  const metrics = (w, h, s) => send("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: s, mobile: false });
  await metrics(width, height, dpr);
  await send("Page.enable");
  // a day run is a day run whatever the hour (after dark the site is its
  // night edition): today at 10:30 unless NIGHT is asked for (27.09 evening:
  // "day" tests run after 21:00 were night ones, HEAD's as much as the new)
  if (!process.env.NIGHT && process.env.ROOM_CLOCK !== "real") await send("Page.addScriptToEvaluateOnNewDocument", { source: `(()=>{const O=Date, off=new O(new O().getFullYear(),new O().getMonth(),new O().getDate(),10,30).getTime()-O.now();
  class D extends O{constructor(...a){a.length?super(...a):super(O.now()+off)} static now(){return O.now()+off}}
  window.Date=D;})()` });
  await send("Runtime.enable");
  const consoleLines = [];
  handlers.add((m) => {
    if (m.method === "Runtime.consoleAPICalled") consoleLines.push(m.params.type + " " + m.params.args.map((a) => a.value ?? a.description).join(" "));
    if (m.method === "Runtime.exceptionThrown") consoleLines.push("EXC " + (m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text));
  });
  const shot = async (file, clip, opts = {}) => {
    const r = await send("Page.captureScreenshot", { format: "png", captureBeyondViewport: !!opts.beyond, ...(clip ? { clip: { ...clip, scale: clip.scale ?? 1 } } : {}) }, 120000);
    if (!r.result) throw new Error("screenshot failed " + JSON.stringify(r.error));
    fs.writeFileSync(file, Buffer.from(r.result.data, "base64"));
  };
  const go = async (url, wait = 0) => {
    await send("Page.navigate", { url });
    for (let i = 0; i < 120; i++) { if ((await ev("document.readyState")) === "complete") break; await sleep(250); }
    if (wait) await sleep(wait);
  };
  const close = () => { try { ws.close(); } catch {} chrome.kill(); try { fs.rmSync(dir, { recursive: true, force: true }); } catch {} };
  return { send, ev, shot, go, metrics, close, handlers, console: consoleLines };
}
