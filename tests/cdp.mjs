export async function connect(port = +(process.env.CDP_PORT || 9222)) {
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const page = list.find(t => t.type === 'page');
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise(r => ws.onopen = r);
  let id = 0; const waiting = new Map(); const events = [];
  ws.onmessage = e => {
    const m = JSON.parse(e.data);
    if (m.method) events.push(m);
    if (m.id && waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
  };
  const send = (method, params = {}) => new Promise(res => {
    const n = ++id; waiting.set(n, res);
    ws.send(JSON.stringify({ id: n, method, params }));
  });
  const ev = async (expression, awaitPromise = true) => {
    const r = await send('Runtime.evaluate', { returnByValue: true, awaitPromise, expression });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'eval failed');
    return r.result?.result?.value;
  };
  const key = async (k) => {
    const codes = { Tab: 9, Escape: 27, ArrowRight: 39, ArrowLeft: 37, Enter: 13, Home: 36, End: 35, ' ': 32 };
    for (const type of ['keyDown', 'keyUp'])
      await send('Input.dispatchKeyEvent', { type, key: k, code: k, windowsVirtualKeyCode: codes[k] || 0 });
    await new Promise(r => setTimeout(r, 140));
  };
  const goto = async (url, w = 1280, h = 900, mobile = false) => {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    events.length = 0;
    await send('Page.navigate', { url });
    await new Promise(r => setTimeout(r, 1800));
  };
  await send('Page.enable'); await send('Runtime.enable');
  await send('Network.enable'); await send('Log.enable');
  return { send, ev, key, goto, events, close: () => ws.close() };
}

export function runner() {
  const results = [];
  const t = async (name, fn) => {
    try {
      const detail = await fn();
      results.push({ name, ok: true, detail: detail == null ? '' : String(detail) });
    } catch (e) {
      results.push({ name, ok: false, detail: e.message });
    }
  };
  const eq = (a, b, msg) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg || ''} expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); };
  const ok = (c, msg) => { if (!c) throw new Error(msg || 'assertion failed'); };
  return { t, eq, ok, results };
}
