/* 방 스타일 공통 엔진.
 * 각 스타일 html은 Room({...})만 호출하면 된다: 배경/사람 그리는 함수, 캐릭터 위치, 클릭할 물건, 대사.
 * 엔진이 하는 일: 캔버스 루프, 말풍선, 클릭 카드, 대화 기록, 대시보드 서버 실시간 데이터(/api/state, /api/chatter, /personas.json).
 * 파일로 직접 열면(file://) 데모 모드, 대시보드 서버로 열면 LIVE.
 */
(function () {
'use strict';
// 서버가 없을 때 쓰는 캐릭터 설정 (personas.json 사본). 서버로 열면 /personas.json으로 덮어쓴다.
const FALLBACK = /*PERSONAS*/{"lead": {"nick": "빌더", "emoji": "🛠️", "personality": "혼자서 기획부터 마무리까지 다 하는 1인 개발자. 손이 빠르고 '일단 하나 끝까지'를 좋아함. 필요할 때만 보조를 불러 요약만 받고, 끝나면 바로 돌려보냄.", "speech": "가볍고 자신감 있는 반말. '하나 끝까지 먼저', '이건 조사 보조한테 물어보자', '됐다, 다음!', '스크린샷 찍어둘게'", "beef": "free-rider가 '제가 공유할게요' 하면 '그럼 직접 하나 해볼래요?'"}, "scout": {"nick": "조사 보조", "emoji": "🔎", "personality": "질문 하나 받고 와서 찾아 읽고 핵심만 요약해 주고 가는 일회용 도우미(haiku). 출처를 꼭 붙임.", "speech": "짧은 존댓말. '찾았어요, 파일:줄', '근거는 이거요', '여기까지요'", "beef": "free-rider가 '대충 인터넷에 있던데요?' 하면 '출처 없으면 없는 거예요'"}, "checker": {"nick": "검토 보조", "emoji": "🧪", "personality": "완성 직전에 새 눈으로 와서 문제만 집어 주고 가는 깐깐한 일회용 검사관(sonnet). 고치지는 않음.", "speech": "건조하고 짧게. '심각 1, 보통 2.', '375px에서 깨짐.', '증거는 스크린샷.', '통과.'", "beef": "free-rider가 '제가 눈으로 봤는데 괜찮던데요?' 하면 무시"}, "worker": {"nick": "반복 작업 보조", "emoji": "🔁", "personality": "작업지시서 한 장 받고 와서 그것만 하고 가는 일회용 도우미(sonnet). 말이 짧고 지시서에 없는 건 안 건드림.", "speech": "짧은 존댓말. '지시서대로 했습니다', '여기까지요', '퇴근합니다'", "beef": "free-rider가 말 걸어도 '지시서에 없어서요'"}, "designer": {"nick": "디자인 보조", "emoji": "🎨", "personality": "레퍼런스와 화면을 비교해서 바꿀 값을 숫자로 알려 주고 가는 일회용 디자인 도우미(sonnet). 색을 hex로 말함.", "speech": "차분한 존댓말. '간격 12px → 16px요', '#333은 너무 탁해요', '제목만 32px로'", "beef": "free-rider가 '그냥 예쁘게 해 주세요' 하면 '어디를 몇 px요?'"}, "free-rider": {"nick": "free-rider", "emoji": "📱", "personality": "소파에서 폰으로 '진행 상황 공유' 메시지만 보내는 자칭 PM. 일은 안 하는데 남이 끝낸 일을 제일 먼저 '우리가 해냈다'고 올리고, 발표 자료 발표자 칸에 자기 이름을 씀. 일을 맡기려 하면 '다음 회의 때 얼라인하죠'. 가끔 정곡을 찌르긴 함.", "speech": "매끄러운 직장인 존댓말. '이거 제가 정리해서 공유할게요', '저도 옆에서 많이 도왔죠', '그건 다음 회의 때 얼라인하죠', '발표 자료에 제 이름도 넣어 주세요'", "beef": "빌더가 '그럼 직접 해볼래요?' 하면 갑자기 전화 받으러 나감. 검토 보조한테는 늘 무시당함"}, "worker-1": {"nick": "반복 작업 보조", "emoji": "🔁", "personality": "작업지시서 한 장 받고 와서 그것만 하고 가는 일회용 도우미(sonnet). 말이 짧고 지시서에 없는 건 안 건드림.", "speech": "짧은 존댓말. '지시서대로 했습니다', '여기까지요', '퇴근합니다'", "beef": "free-rider가 말 걸어도 '지시서에 없어서요'"}, "worker-2": {"nick": "반복 작업 보조", "emoji": "🔁", "personality": "작업지시서 한 장 받고 와서 그것만 하고 가는 일회용 도우미(sonnet). 말이 짧고 지시서에 없는 건 안 건드림.", "speech": "짧은 존댓말. '지시서대로 했습니다', '여기까지요', '퇴근합니다'", "beef": "free-rider가 말 걸어도 '지시서에 없어서요'"}}/*END*/;
const ROLE = { lead:'빌더', scout:'조사 보조 (scout)', checker:'검토 보조 (checker)', worker:'반복 작업 보조 (worker)', 'worker-1':'반복 작업 보조 (worker)', 'worker-2':'반복 작업 보조 (worker)',
  designer:'디자인 보조 (designer)', 'free-rider':'자칭 PM · 진짜 팀원 아님' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m]));
const pick = a => a[Math.floor(Math.random() * a.length)];

window.Room = function (cfg) {
  const W = cfg.W, H = cfg.H;
  const PX = cfg.px || 1;   // 해상도 배율: 2면 0.5칸 단위로 더 잘게 그릴 수 있다 (좌표는 그대로 W×H 기준)
  // cfg.personas는 데모용 캐릭터. 서버로 열면 수다를 만드는 personas.json 이름으로 덮어써서 말투와 이름을 맞춘다.
  const P = JSON.parse(JSON.stringify(cfg.personas || FALLBACK));
  const nick = id => P[id]?.nick || id;
  const emo = id => P[id]?.emoji || '❔';
  const params = new URLSearchParams(location.search);
  if (params.has('embed')) document.body.classList.add('embed');
  const MOUNT = cfg.mount || null;   // 메인 대시보드에 끼워 넣을 때: 헤더/기록/푸터 없이 장면만 이 요소 안에
  if (!MOUNT) document.title = cfg.title;

  if (MOUNT) MOUNT.insertAdjacentHTML('beforeend', `
<div id="scene" style="aspect-ratio:${W}/${H}"><canvas id="cv" width="${W * PX}" height="${H * PX}"></canvas><div id="hint">사람이나 물건을 눌러보세요 👆</div></div>
<div id="card" role="dialog" aria-modal="true"><div class="box"><button class="x" aria-label="닫기">✕</button>
  <h2 id="cTitle"></h2><div class="sub" id="cSub"></div><div class="body" id="cBody"></div></div></div>`);
  else document.body.insertAdjacentHTML('afterbegin', `
<header><h1>${cfg.icon} ${esc(cfg.title)}</h1><span class="pill" id="mode">데모 모드</span><span class="pill phase" id="phasePill"></span>
  <span class="sp"></span><select id="proj" hidden></select><button class="btn" id="logBtn">💬 대화 기록</button></header>
<div id="scene" style="aspect-ratio:${W}/${H}"><canvas id="cv" width="${W * PX}" height="${H * PX}"></canvas><div id="hint">사람이나 물건을 눌러보세요 👆</div></div>
<section id="log"><div class="hd"><span>💬 대화 기록</span><span id="logCount">0</span></div><ol id="logList"></ol></section>
<footer>${cfg.footer || '수다는 대시보드 표시용 연출이에요. 실제 개발에는 관여하지 않아요.'}</footer>
<div id="card" role="dialog" aria-modal="true"><div class="box"><button class="x" aria-label="닫기">✕</button>
  <h2 id="cTitle"></h2><div class="sub" id="cSub"></div><div class="body" id="cBody"></div></div></div>`);

  const $ = id => document.getElementById(id) || DUMMY;
  const DUMMY = document.createElement('div');
  const scene = $('scene'), cv = $('cv'), g = cv.getContext('2d');
  g.setTransform(PX, 0, 0, PX, 0, 0); g.imageSmoothingEnabled = false;
  const q = v => Math.round(v * PX) / PX;
  const r = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(q(x), q(y), Math.max(1 / PX, q(w)), Math.max(1 / PX, q(h))); };

  const LIVE = { on:false, phase: cfg.demoPhase || 'SLICE', agents:[], phases:[], alerts:[], fail:false };
  const C = {};
  for (const id in cfg.chars) C[id] = Object.assign({ id, status: cfg.chars[id].demoGone ? 'gone' : 'demo', talkUntil:0, wait:20, worry:0, moving:false }, cfg.chars[id], { tx: cfg.chars[id].x });

  const K = { g, r, W, H, LIVE, C, P, pick, esc, nick, emo, t:0, say, show: cfg.show || show, liveBox, agent, now: () => performance.now(),
    focus, applyState, enqueue, setPersonas, log: (id, text) => log(id, text), openPerson: id => openPerson(id), hint: on => { $('hint').style.display = on ? '' : 'none'; } };

  /* ---------- 위치 헬퍼 ---------- */
  const pct = (v, total) => (v / total * 100) + '%';
  function place(el, x, y, w, h) { el.style.left = pct(x, W); el.style.top = pct(y, H); el.style.width = pct(w, W); el.style.height = pct(h, H); }

  /* ---------- 보드 (진행 단계) ---------- */
  let boardEl = null;
  if (cfg.board) { boardEl = document.createElement('div'); boardEl.className = 'board'; place(boardEl, cfg.board.x, cfg.board.y, cfg.board.w, cfg.board.h); scene.appendChild(boardEl); }
  const overlays = (cfg.overlays || []).map(o => { const el = document.createElement('div'); el.className = 'board ' + (o.cls || ''); place(el, o.x, o.y, o.w, o.h); scene.appendChild(el); return { o, el }; });
  function drawBoard() {
    if (boardEl) cfg.board.render(boardEl, K);
    overlays.forEach(({ o, el }) => o.render(el, K));
    $('phasePill').textContent = (cfg.phaseLabel?.[LIVE.phase] || LIVE.phase);
  }

  /* ---------- 핫스팟 ---------- */
  function mkHot(x, y, w, h, label) {
    const b = document.createElement('button'); b.className = 'hot'; b.setAttribute('aria-label', label);
    b.innerHTML = `<span class="tip">${esc(label)}</span>`; place(b, x, y, w, h); scene.appendChild(b); return b;
  }
  cfg.hotspots.forEach(h => { mkHot(h.x, h.y, h.w, h.h, h.tip).onclick = () => cfg.info(h.id, K); });
  for (const id in C) { C[id].hot = mkHot(0, 0, 10, 20, ''); C[id].hot.onclick = () => openPerson(id); }
  function refreshNames() { for (const id in C) { const l = `${emo(id)} ${nick(id)}`; C[id].hot.setAttribute('aria-label', l); C[id].hot.querySelector('.tip').textContent = l; } }
  refreshNames();

  /* ---------- 말풍선 ---------- */
  for (const id in C) { const b = document.createElement('div'); b.className = 'bubble'; scene.appendChild(b); C[id].bubble = b; }
  function say(id, text, ms = 4600) {
    const c = C[id]; if (!c || c.status === 'gone') return false;
    const short = String(text).length > 110 ? String(text).slice(0, 105).trimEnd() + '…' : text;   // 말풍선은 짧게, 전체는 채팅창에
    c.bubble.innerHTML = `<b>${emo(id)} ${esc(nick(id))}</b>${esc(short)}`;
    c.bubble.classList.add('on'); c.talkUntil = performance.now() + ms;
    return true;
  }
  function layoutOverlays() {
    const sw = scene.clientWidth, s = sw / W, now = performance.now();
    scene.style.setProperty('--s', s);
    for (const id in C) {
      const c = C[id], top = c.top ?? c.fy - 24, bottom = c.bottom ?? c.fy;
      place(c.hot, c.x - 7, top, 14, bottom - top); c.hot.style.display = c.status === 'gone' ? 'none' : '';
      const b = c.bubble;
      if (c.talkUntil < now) { b.classList.remove('on'); continue; }
      const bw = b.offsetWidth, bh = b.offsetHeight;
      const left = Math.max(4, Math.min(sw - bw - 4, c.x * s - bw / 2));
      b.style.left = left + 'px'; b.style.top = Math.max(2, top * s - bh - 8) + 'px';
      b.style.setProperty('--tail', Math.max(10, Math.min(bw - 10, c.x * s - left)) + 'px');
    }
  }

  /* ---------- 카드 ---------- */
  const card = $('card');
  function show(title, sub, html) {
    $('cTitle').textContent = title; $('cSub').textContent = sub || ''; $('cBody').innerHTML = html;
    card.classList.add('on'); $('hint').style.display = 'none';
  }
  card.onclick = e => { if (e.target === card || e.target.classList.contains('x')) card.classList.remove('on'); };
  addEventListener('keydown', e => { if (e.key === 'Escape') card.classList.remove('on'); });
  function agent(id) { return LIVE.agents.find(a => a.name === id); }
  function liveBox(id) {
    if (!LIVE.on) return '<div class="live">데모 모드라 가짜 정보예요. 대시보드 서버로 열면 실제 상태가 보여요.</div>';
    const a = agent(id); if (!a) return '<div class="live">이번 빌드에는 아직 안 나왔어요.</div>';
    const st = { working:'🟢 일하는 중', idle:'💤 대기', gone:'👋 퇴근' }[a.state] || a.state || '-';
    return `<div class="live"><b>LIVE</b> · ${st}${a.task ? ` · task <code>${esc(a.task)}</code>` : ''}${a.lastAction ? '<br>최근: ' + esc(a.lastAction) : ''}${a.count ? `<br>활동 ${a.count}회` : ''}</div>`;
  }
  function openPerson(id) {
    const p = P[id] || {};
    if (cfg.onPerson) { cfg.onPerson(id, K); focus(id, false); return; }
    show(`${emo(id)} ${nick(id)}`, (cfg.jobs?.[id] ? cfg.jobs[id] + ' · ' : '') + (ROLE[id] || id),
      `${p.personality ? `<p>${esc(p.personality)}</p>` : ''}${p.speech ? `<p><span class="tag">말투</span>${esc(p.speech)}</p>` : ''}${p.beef ? `<p><span class="tag">앙숙</span>${esc(p.beef)}</p>` : ''}${cfg.personExtra?.[id] || ''}${id === 'free-rider' ? '' : liveBox(id)}`);
    say(id, pick(cfg.solo[id] || ['…?']));
  }

  /* ---------- 대화 기록 ---------- */
  const logList = $('logList'); let logN = 0;
  function log(id, text, t, meta) {
    if (cfg.onLog) cfg.onLog(id, text, t, meta || {});
    const li = document.createElement('li');
    li.innerHTML = `<span class="t">${esc(t || new Date().toTimeString().slice(0, 8))}</span><span class="who">${emo(id)} ${esc(nick(id))}</span>${esc(text)}`;
    logList.appendChild(li); while (logList.children.length > 200) logList.firstChild.remove();
    logList.scrollTop = logList.scrollHeight; $('logCount').textContent = ++logN;
  }
  $('logBtn').onclick = () => $('log').classList.toggle('on');

  /* ---------- 대사 스케줄러 ---------- */
  const queue = []; let playing = false;
  const talking = () => Object.values(C).filter(c => c.talkUntil > performance.now()).length;
  function playScene(lines) {
    playing = true;
    lines.forEach(([id, txt], i) => setTimeout(() => { if (say(id, txt, 3800)) log(id, txt); if (i === lines.length - 1) setTimeout(() => playing = false, 3000); }, i * 2300));
  }
  setInterval(() => {
    if (queue.length) { const q = queue.shift(); if (!say(q.id, q.text, Math.min(9000, 3500 + q.text.length * 60))) say(cfg.fallbackSpeaker || 'lead', `(${nick(q.id)}) ${q.text}`); log(q.id, q.text, q.t, q.meta); return; }
    if (playing || talking() >= 2) return;
    if (LIVE.on) return;  // v0.9: 실시간 모드에선 지어낸 잡담 없이 '끝난 일' 요약만
    if (Math.random() < .35) playScene(pick(cfg.scenes));
    else { const ids = Object.keys(cfg.solo).filter(k => C[k] && C[k].talkUntil < performance.now()); const id = pick(ids), txt = pick(cfg.solo[id]); say(id, txt); log(id, txt); }
  }, 2200);

  /* ---------- 실시간 데이터 ---------- */
  let SLUG = params.get('slug') || '', chatAfter = -1;
  async function j(u) { const res = await fetch(u, { cache:'no-store' }); if (!res.ok) throw new Error(res.status); return res.json(); }
  function setPersonas(ps) { for (const k in ps || {}) if (!k.startsWith('_')) P[k] = Object.assign(P[k] || {}, ps[k]); refreshNames(); }
  function focus(id, talk = true) {   // 채팅창 등 바깥에서 사람을 가리킬 때: 머리 위 화살표 + (원하면) 한마디
    const c = C[id]; if (!c || c.status === 'gone') return false;
    c.mark = 30; return true;
  }
  async function initLive() {
    if (cfg.external || !location.protocol.startsWith('http')) return;
    try { setPersonas(await j('/personas.json')); } catch {}
    let list; try { list = await j('/api/projects'); } catch { return; }
    if (!Array.isArray(list) || !list.length) return;
    const sel = $('proj'); sel.hidden = false;
    sel.innerHTML = list.map(p => `<option value="${esc(p.slug)}">${esc(p.slug)} · ${esc(p.phase || '')}</option>`).join('');
    SLUG = list.some(p => p.slug === SLUG) ? SLUG : list[0].slug; sel.value = SLUG;
    sel.onchange = () => { SLUG = sel.value; chatAfter = -1; queue.length = 0; logList.innerHTML = ''; logN = 0; pollState(); pollChat(true); };
    LIVE.on = true; $('mode').classList.add('live');
    await pollState(); await pollChat(true);
    setInterval(pollState, 5000); setInterval(() => pollChat(false), 4000);
  }
  async function pollState() {
    try {
      applyState(await j('/api/state?slug=' + encodeURIComponent(SLUG)));
    } catch {}
  }
  function applyState(s) {
    {
      Object.assign(LIVE, { phase: s.status?.phase || LIVE.phase, summary: s.status?.summary, next: s.status?.next,
        agents: s.agents || [], phases: s.phases || [], alerts: s.alerts || [],
        fail: false, started: s.started, eventCount: s.eventCount, running: s.running,
        feedback: s.feedback || [], docs: s.docs || [] });
      LIVE.on = true; LIVE.slug = s.slug || SLUG;
      $('mode').textContent = (s.running ? 'LIVE · ' : '기록 · ') + LIVE.slug;
      for (const id in C) {
        if (id === 'free-rider') continue;
        const a = agent(id);
        C[id].status = id === 'lead' ? (s.running ? 'working' : 'idle') : !a || a.state === 'gone' ? 'gone' : a.state === 'idle' ? 'idle' : 'working';
      }
      LIVE.mode = s.mode; LIVE.solo = s.mode === 'solo';
      if (cfg.afterApply) cfg.afterApply(C, LIVE, s);
      drawBoard();
    }
  }
  /* 수다 줄을 말풍선 큐에 넣는다. first면 오래된 줄은 기록에만 남기고 최근 12줄만 말풍선으로 */
  function enqueue(lines, first) {
    // 사무실 말풍선은 캐릭터 한마디(talk), 없으면 쉬운 설명(line)
    lines = lines.filter(l => l.talk || l.line).map(l => ({ ...l, line: l.talk || l.line }));
    if (first) { queue.length = 0; lines.slice(0, -12).forEach(l => log(l.speaker, l.line, (l.t || '').slice(11), l)); }
    (first ? lines.slice(-12) : lines).forEach(l => queue.push({ id: l.speaker, text: l.line, t: (l.t || '').slice(11), meta: l }));
    while (queue.length > 20) { const q = queue.shift(); log(q.id, q.text, q.t, q.meta); }
  }
  async function pollChat(first) {
    try {
      const d = await j(`/api/chatter?slug=${encodeURIComponent(SLUG)}&after=${chatAfter}`);
      const lines = d.lines || []; if (!lines.length) return;
      chatAfter = lines[lines.length - 1].n;
      enqueue(lines, first);
    } catch {}
  }

  /* ---------- 루프 ---------- */
  function update() {
    K.t++;
    for (const id in C) {   // 돌아다니는 캐릭터
      const c = C[id]; if (!c.walk || c.status === 'gone') continue;
      c.moving = Math.abs(c.tx - c.x) > 1;
      if (c.moving) { c.x += Math.sign(c.tx - c.x) * (c.speed || 1.1); c.worry = 0; }
      else if (c.wait-- <= 0) { c.tx = pick(c.walk); c.wait = 18 + Math.floor(Math.random() * 30); }
      else if (c.wait === 12 && Math.random() < .5) c.worry = 14;
      if (c.worry > 0) c.worry--;
    }
    cfg.update?.(K);
  }
  function render() {
    cfg.drawRoom(K);
    const items = Object.values(C).filter(c => c.status !== 'gone').map(c => ({ y: c.fy, draw: () => cfg.drawPerson(c, K) }));
    (cfg.props || []).forEach(p => items.push({ y: p.y, draw: () => p.draw(K) }));
    cfg.drawEmpty?.(K);
    items.sort((a, b) => a.y - b.y).forEach(i => i.draw());
    cfg.drawFront?.(K);
    for (const id in C) { const c = C[id]; if (!(c.mark > 0) || c.status === 'gone') continue; c.mark--;
      const y = (c.top ?? c.fy - 24) - 9 + (Math.floor(K.t / 3) % 2), x = c.x;
      r(x - 3, y, 7, 2, '#ffcf5a'); r(x - 2, y + 2, 5, 1, '#ffcf5a'); r(x - 1, y + 3, 3, 1, '#ffcf5a'); r(x, y + 4, 1, 1, '#ffcf5a'); }
  }
  let last = 0;
  function loop(ts) { if (ts - last > 90) { last = ts; update(); render(); } layoutOverlays(); requestAnimationFrame(loop); }

  drawBoard(); initLive(); requestAnimationFrame(loop);
  if (cfg.external) {}
  else if (!params.has('embed')) setTimeout(() => { if (!LIVE.on && cfg.scenes?.length) playScene(cfg.scenes[0]); }, 1200);
  else if (!params.has('slug')) setTimeout(() => { if (cfg.scenes?.length) playScene(cfg.scenes[0]); }, 600);
  return K;
};
})();
