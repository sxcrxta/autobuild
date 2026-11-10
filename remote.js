// 원격 모드 (GitHub Pages에서 열린 대시보드) — 대시보드가 보내는 요청을 Supabase 중계로 바꿔 준다.
// 맥이 올려 둔 스냅샷(ab_snap)은 바로 읽고, 나머지는 요청(ab_cmd)을 남기면 맥이 2초 안에 답한다.
(function () {
  const C = window.AB_REMOTE; if (!C) return;
  const realFetch = window.fetch.bind(window);
  const TOK_KEY = 'ab-remote-token';
  let tok = ''; try { tok = localStorage.getItem(TOK_KEY) || ''; } catch {}

  async function rpc(name, args) {
    const r = await realFetch(`${C.url}/rest/v1/rpc/${name}`, {
      method: 'POST', cache: 'no-store',
      headers: { apikey: C.anon, Authorization: `Bearer ${C.anon}`, 'content-type': 'application/json' },
      body: JSON.stringify(args),
    });
    const t = await r.text();
    if (!r.ok) { if (/unauthorized/.test(t)) unpaired(); throw new Error(`${name} ${r.status} ${t.slice(0, 120)}`); }
    return t ? JSON.parse(t) : null;
  }
  window.abRpc = rpc;

  // ── 처음 한 번: 맥에서 받은 8글자 코드로 이 기기 등록 ──
  function unpaired() {
    try { localStorage.removeItem(TOK_KEY); } catch {}
    tok = ''; showPair();
  }
  function showPair() {
    if (document.getElementById('abPair')) return;
    const d = document.createElement('div'); d.id = 'abPair';
    d.innerHTML = `<div class="abp-box"><h2>📱 이 기기 연결</h2>
      <p>맥에서 <b>대시보드 → 📱 폰 연결 → 폰 연결 코드 만들기</b>(또는 터미널 <code>autobuild remote pair</code>)를 누르면 나오는 8글자를 넣어 주세요.</p>
      <input id="abCode" maxlength="9" autocomplete="one-time-code" autocapitalize="characters" placeholder="예: K7F2 Q9XA">
      <button id="abGo">연결</button><p id="abMsg"></p></div>`;
    const css = document.createElement('style');
    css.textContent = `#abPair{position:fixed;inset:0;z-index:9999;background:rgba(10,8,14,.92);display:flex;align-items:center;justify-content:center;padding:16px}
      #abPair .abp-box{background:#221c2b;border:2px solid #ffd34d;border-radius:14px;padding:20px;max-width:380px;width:100%;color:#f3eefa;font:15px/1.5 -apple-system,sans-serif}
      #abPair h2{margin:0 0 8px;font-size:19px}#abPair p{color:#b4a8c4;margin:6px 0}#abPair code{color:#7be0a4}
      #abPair input{width:100%;font:700 26px ui-monospace,Menlo,monospace;letter-spacing:3px;text-align:center;padding:10px;border-radius:10px;border:2px solid #3a3046;background:#120e17;color:#fff;margin:10px 0;text-transform:uppercase}
      #abPair button{width:100%;min-height:48px;border:0;border-radius:12px;background:#ffd34d;color:#1d1626;font:700 16px sans-serif}`;
    document.head.appendChild(css); document.body.appendChild(d);
    document.getElementById('abGo').onclick = async () => {
      const code = document.getElementById('abCode').value; const msg = document.getElementById('abMsg');
      msg.textContent = '연결하는 중…';
      try {
        const t = await rpc('ab_pair_claim', { code, label: navigator.userAgent.slice(0, 110) });
        tok = t; try { localStorage.setItem(TOK_KEY, t); } catch {}
        location.reload();
      } catch { msg.textContent = '코드가 맞지 않거나 시간이 지났어요(15분). 맥에서 새 코드를 만들어 주세요.'; }
    };
  }
  if (!tok) document.addEventListener('DOMContentLoaded', showPair);

  // ── 요청 바꾸기 ──
  const SNAP = /^\/(api\/(projects|features|state|feedback|events|chatter|convo|journey)|personas\.json)$/;
  const watched = {};
  async function readSnap(key) { const r = await rpc('ab_read', { tok, keys: [key] }); return r && r[key] ? r[key].d : undefined; }
  async function ask(kind, body, waitMs = 25000) {
    const id = await rpc('ab_cmd_add', { tok, kind, body });
    const until = Date.now() + waitMs;
    for (let n = 0; Date.now() < until; n++) {
      await new Promise(r => setTimeout(r, n < 3 ? 700 : 1500));
      const s = await rpc('ab_cmd_get', { tok, cid: id });
      if (s && s.done) return s.result;
    }
    throw new Error('맥이 답하지 않아요 (맥이 꺼졌거나 대시보드 서버가 멈췄을 수 있어요)');
  }
  const json = (v, st = 200) => new Response(JSON.stringify(v), { status: st, headers: { 'content-type': 'application/json' } });
  const fromResult = r => r.b64 ? new Response(Uint8Array.from(atob(r.b64), c => c.charCodeAt(0)), { status: r.status, headers: { 'content-type': r.ct } })
    : new Response(r.text, { status: r.status, headers: { 'content-type': r.ct || 'text/plain' } });

  window.fetch = async function (input, opt = {}) {
    const raw = typeof input === 'string' ? input : input.url;
    if (!raw.startsWith('/')) return realFetch(input, opt);
    if (!tok) return new Promise(() => {});  // 연결 전: 연결 화면만 보이고 요청은 멈춰 둠(연결하면 새로고침)
    const u = new URL(raw, 'http://x'); const slug = u.searchParams.get('slug') || '';
    if ((opt.method || 'GET').toUpperCase() === 'POST') {
      let body = {}; try { body = JSON.parse(opt.body || '{}'); } catch {}
      // v0.41 파일 조각은 맥 답을 기다리지 않고 맡겨만 둠 (맥은 id 순서대로 처리하니 마지막 done이 맨 뒤)
      if (u.pathname === '/api/upload' && body.b64) { await rpc('ab_cmd_add', { tok, kind: 'post', body: { path: u.pathname, json: body } }); return json({ ok: true }); }
      return fromResult(await ask('post', { path: u.pathname, json: body }, u.pathname === '/api/upload' ? 240000 : 25000));
    }
    if (slug && (!watched[slug] || Date.now() - watched[slug] > 60000)) { watched[slug] = Date.now(); ask('watch', { slug }, 1).catch(() => {}); }
    if (SNAP.test(u.pathname)) {
      const key = u.pathname + (slug ? `?slug=${slug}` : '');
      const d = await readSnap(key);
      if (d !== undefined) {
        if (u.pathname === '/api/chatter') { const after = +(u.searchParams.get('after') || -1); return json(Object.assign({}, d, { lines: (d.lines || []).filter(l => l.n > after) })); }
        if (u.pathname === '/api/events') { const evs = d.events || []; window.__abEvMax = Math.max(window.__abEvMax || -1, ...evs.map(e => e.i)); return json(d); }
        return json(d);
      }
    }
    return fromResult(await ask('get', { path: u.pathname + u.search }));
  };

  // ── 실시간 이벤트: 4초마다 맥이 올린 최근 60개를 보고 새 것만 ──
  class PollSource {
    constructor(url) {
      this.slug = new URL(url, 'http://x').searchParams.get('slug'); this.onmessage = null; this.last = null; this.stop = false;
      const tick = async () => {
        if (this.stop) return;
        try {
          const d = await readSnap(`tail?slug=${this.slug}`); const evs = (d && d.events) || [];
          if (this.last === null) this.last = Math.max(window.__abEvMax ?? -1, -1);
          for (const e of evs) if (e.i > this.last) { this.last = e.i; this.onmessage && this.onmessage({ data: JSON.stringify(e) }); }
        } catch {}
        this.t = setTimeout(tick, 4000);
      };
      this.t = setTimeout(tick, 1500);
    }
    close() { this.stop = true; clearTimeout(this.t); }
  }
  window.EventSource = PollSource;

  // ── 스크린샷: /shots/… 를 맥에서 받아 와 보여 줌 ──
  const imgCache = new Map();
  async function shotBlobUrl(path) {
    if (!imgCache.has(path)) imgCache.set(path, window.fetch(path).then(r => r.blob()).then(b => URL.createObjectURL(b)));
    return imgCache.get(path);
  }
  function fixImg(img) {
    const s = img.getAttribute('src') || '';
    if (!/^\/(shots|files)\//.test(s) || img.dataset.abSrc === s) return;
    img.dataset.abSrc = s; img.removeAttribute('src');
    shotBlobUrl(s).then(u => { if (img.dataset.abSrc === s) img.src = u; }).catch(() => {});
  }
  new MutationObserver(ms => ms.forEach(m => {
    if (m.type === 'attributes') fixImg(m.target);
    m.addedNodes && m.addedNodes.forEach(n => { if (n.nodeType !== 1) return; if (n.tagName === 'IMG') fixImg(n); n.querySelectorAll && n.querySelectorAll('img').forEach(fixImg); });
  })).observe(document.documentElement, { subtree: true, childList: true, attributes: true, attributeFilter: ['src'] });
  const realOpen = window.open.bind(window);
  window.open = (url, ...rest) => { if (typeof url === 'string' && /^\/(shots|files)\//.test(url)) { shotBlobUrl(url).then(u => realOpen(u, ...rest)); return null; } return realOpen(url, ...rest); };

  // ── 이 폰에 알림 켜기 (웹 푸시) ──
  function b64u(s) { const p = '='.repeat((4 - s.length % 4) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, c => c.charCodeAt(0)); }
  window.abPushState = async () => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return 'unsupported';
    const reg = await navigator.serviceWorker.getRegistration(); const sub = reg && await reg.pushManager.getSubscription();
    return sub && Notification.permission === 'granted' ? 'on' : 'off';
  };
  window.abPushEnable = async () => {
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent), standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window))
      throw new Error(ios && !standalone ? '아이폰은 공유 → 홈 화면에 추가한 뒤, 홈 화면 아이콘으로 열어야 알림을 켤 수 있어요' : '이 브라우저는 알림을 지원하지 않아요');
    if (await Notification.requestPermission() !== 'granted') throw new Error('알림이 허용되지 않았어요 (설정 → 알림에서 허용)');
    const reg = await navigator.serviceWorker.register('sw.js'); await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) || await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64u(C.vapid) });
    await rpc('ab_push_add', { tok, sub: sub.toJSON(), ua: navigator.userAgent.slice(0, 150) });
    return 'on';
  };
  if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
})();
