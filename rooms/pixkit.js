/* 저해상도 픽셀 키트 — 공방 장면(office.js)이 쓰는 캐릭터·카드·Room 설정.
 */
(function () {
'use strict';
const PK = window.PK = {};
PK.PERSONAS = /*PERSONAS*/{"lead": {"nick": "빌더", "emoji": "🛠️", "personality": "혼자서 기획부터 마무리까지 다 하는 1인 개발자. 손이 빠르고 '일단 하나 끝까지'를 좋아함. 필요할 때만 보조를 불러 요약만 받고, 끝나면 바로 돌려보냄.", "speech": "가볍고 자신감 있는 반말. '하나 끝까지 먼저', '이건 조사 보조한테 물어보자', '됐다, 다음!', '스크린샷 찍어둘게'", "beef": "free-rider가 '제가 공유할게요' 하면 '그럼 직접 하나 해볼래요?'"}, "scout": {"nick": "조사 보조", "emoji": "🔎", "personality": "질문 하나 받고 와서 찾아 읽고 핵심만 요약해 주고 가는 일회용 도우미(haiku). 출처를 꼭 붙임.", "speech": "짧은 존댓말. '찾았어요, 파일:줄', '근거는 이거요', '여기까지요'", "beef": "free-rider가 '대충 인터넷에 있던데요?' 하면 '출처 없으면 없는 거예요'"}, "checker": {"nick": "검토 보조", "emoji": "🧪", "personality": "완성 직전에 새 눈으로 와서 문제만 집어 주고 가는 깐깐한 일회용 검사관(sonnet). 고치지는 않음.", "speech": "건조하고 짧게. '심각 1, 보통 2.', '375px에서 깨짐.', '증거는 스크린샷.', '통과.'", "beef": "free-rider가 '제가 눈으로 봤는데 괜찮던데요?' 하면 무시"}, "worker": {"nick": "반복 작업 보조", "emoji": "🔁", "personality": "작업지시서 한 장 받고 와서 그것만 하고 가는 일회용 도우미(sonnet). 말이 짧고 지시서에 없는 건 안 건드림.", "speech": "짧은 존댓말. '지시서대로 했습니다', '여기까지요', '퇴근합니다'", "beef": "free-rider가 말 걸어도 '지시서에 없어서요'"}, "designer": {"nick": "디자인 보조", "emoji": "🎨", "personality": "레퍼런스와 화면을 비교해서 바꿀 값을 숫자로 알려 주고 가는 일회용 디자인 도우미(sonnet). 색을 hex로 말함.", "speech": "차분한 존댓말. '간격 12px → 16px요', '#333은 너무 탁해요', '제목만 32px로'", "beef": "free-rider가 '그냥 예쁘게 해 주세요' 하면 '어디를 몇 px요?'"}, "free-rider": {"nick": "free-rider", "emoji": "📱", "personality": "소파에서 폰으로 '진행 상황 공유' 메시지만 보내는 자칭 PM. 일은 안 하는데 남이 끝낸 일을 제일 먼저 '우리가 해냈다'고 올리고, 발표 자료 발표자 칸에 자기 이름을 씀. 일을 맡기려 하면 '다음 회의 때 얼라인하죠'. 가끔 정곡을 찌르긴 함.", "speech": "매끄러운 직장인 존댓말. '이거 제가 정리해서 공유할게요', '저도 옆에서 많이 도왔죠', '그건 다음 회의 때 얼라인하죠', '발표 자료에 제 이름도 넣어 주세요'", "beef": "빌더가 '그럼 직접 해볼래요?' 하면 갑자기 전화 받으러 나감. 검토 보조한테는 늘 무시당함"}, "worker-1": {"nick": "반복 작업 보조", "emoji": "🔁", "personality": "작업지시서 한 장 받고 와서 그것만 하고 가는 일회용 도우미(sonnet). 말이 짧고 지시서에 없는 건 안 건드림.", "speech": "짧은 존댓말. '지시서대로 했습니다', '여기까지요', '퇴근합니다'", "beef": "free-rider가 말 걸어도 '지시서에 없어서요'"}, "worker-2": {"nick": "반복 작업 보조", "emoji": "🔁", "personality": "작업지시서 한 장 받고 와서 그것만 하고 가는 일회용 도우미(sonnet). 말이 짧고 지시서에 없는 건 안 건드림.", "speech": "짧은 존댓말. '지시서대로 했습니다', '여기까지요', '퇴근합니다'", "beef": "free-rider가 말 걸어도 '지시서에 없어서요'"}}/*END*/;
const OUT = PK.OUT = '#2b2233', SKIN = PK.SKIN = '#f6cfa8', SKIN2 = '#e6b088';
const pick = PK.pick = a => a[Math.floor(Math.random() * a.length)];
PK.PHASES = ['PLAN', 'BUILD', 'VERIFY', 'FINISH'];
PK.PHASE_LABEL = { PLAN: '계획', BUILD: '개발', VERIFY: '검증', FINISH: '마무리' };
PK.normPh = p => ({ KICKOFF: 'PLAN', SLICE: 'BUILD', EXPAND: 'BUILD' })[String(p || '').toUpperCase()] || String(p || '').toUpperCase();

/* ---------- 사람 (첫 버전 스프라이트) ---------- */
PK.person = function (c, k) {
  const { r, t } = k; const { x, fy } = c; const pose = c.pose || 'stand';
  const sit = pose !== 'stand';
  const bt = sit ? fy - 6 : fy - 11, ht = bt - 8 + (pose === 'back' && c.status === 'idle' ? 2 : 0);   // 자는 중이면 고개를 책상 쪽으로
  c.top = ht - 4; c.bottom = pose === 'stand' ? fy : fy + 5;
  const step = c.moving ? Math.floor(t / 3) % 2 : 0;
  if (!c.noShadow) r(x - 5, sit ? fy + 5 : fy, 10, 1, 'rgba(0,0,0,.2)');
  if (pose === 'stand') { r(x - 3, fy - 5 - (step ? 1 : 0), 2, 5, c.pants); r(x + 1, fy - 5 - (c.moving && !step ? 1 : 0), 2, 5, c.pants); r(x - 3, fy - 1, 2, 1, c.shoe || OUT); r(x + 1, fy - 1, 2, 1, c.shoe || OUT); }
  else if (pose === 'sit') { r(x - 4, fy, 8, 2, c.pants); r(x - 3, fy + 2, 2, 3, c.pants); r(x + 1, fy + 2, 2, 3, c.pants); }
  r(x - 4, bt, 8, 6, c.shirt);
  if (pose === 'back') {
    const tp = (c.status === 'working' || c.status === 'demo') && Math.floor(t / 2) % 2;
    r(x - 6, bt + 2 + (tp ? 1 : 0), 2, 2, c.shirt); r(x + 4, bt + 2 + (tp ? 0 : 1), 2, 2, c.shirt);
    r(x - 4, ht, 8, 8, c.hair); r(x - 4, ht + 6, 1, 2, SKIN2); r(x + 3, ht + 6, 1, 2, SKIN2);
  } else {
    if (c.worry > 0) { r(x - 6, ht + 2, 2, 7, c.shirt); r(x + 4, ht + 2, 2, 7, c.shirt); r(x - 6, ht + 1, 2, 1, SKIN); r(x + 4, ht + 1, 2, 1, SKIN); }
    else if (!c.noArms) { r(x - 5, bt, 1, 5, c.shirt); r(x + 4, bt, 1, 5, c.shirt); r(x - 5, bt + 5, 1, 1, SKIN); r(x + 4, bt + 5, 1, 1, SKIN); }
    r(x - 4, ht, 8, 8, SKIN); r(x - 4, ht, 8, 3, c.hair); r(x - 4, ht + 3, 1, 2, c.hair); r(x + 3, ht + 3, 1, 2, c.hair);
    if ((t + x) % 47 === 0 || c.status === 'idle') { r(x - 2, ht + 5, 1, 1, OUT); r(x + 1, ht + 5, 1, 1, OUT); }
    else { r(x - 2, ht + 4, 1, 2, OUT); r(x + 1, ht + 4, 1, 2, OUT); }
    r(x - 3, ht + 6, 1, 1, '#f39a9a'); r(x + 2, ht + 6, 1, 1, '#f39a9a');
    if (c.talkUntil > k.now() && Math.floor(t / 2) % 2) r(x - 1, ht + 6, 2, 1, '#b2475b');
    if (c.glasses) { r(x - 3, ht + 4, 2, 1, '#cfe6f5'); r(x + 1, ht + 4, 2, 1, '#cfe6f5'); r(x - 1, ht + 4, 2, 1, OUT); }
  }
  PK.acc(c, k, ht, bt);
  if (c.extra) c.extra(k, c, ht, bt);
  if (c.status === 'idle') PK.zzz(r, x + 5, ht - 4, t);
};
PK.acc = function (c, k, ht, bt) {
  const { r, t } = k; const x = c.x;
  switch (c.acc) {
    case 'bear': r(x - 5, ht - 2, 3, 3, c.hair); r(x + 2, ht - 2, 3, 3, c.hair); r(x - 4, ht - 1, 1, 1, '#d9a07a'); r(x + 3, ht - 1, 1, 1, '#d9a07a');
      if (Math.floor(t / 20) % 4 === 0) { r(x + 4, bt - 4, 1, 5, c.shirt); r(x + 4, bt - 5, 1, 1, SKIN); } break;
    case 'clip': { const tap = Math.floor(t / 8) % 2; r(x - 9, bt + 1, 5, 6, '#a0723f'); r(x - 8, bt + 2, 3, 4, '#fff'); r(x - 8, bt + 3, 2, 1, tap ? '#5cb85c' : '#bbb'); r(x - 8, bt + 5, 2, 1, '#bbb'); break; }
    case 'chalk': { const w = Math.floor(t / 4) % 2; r(x + 4, bt - 5 + w, 1, 6, c.shirt); r(x + 4, bt - 6 + w, 1, 1, SKIN); r(x + 4, bt - 7 + w, 1, 1, '#fff'); break; }
    case 'band': r(x - 4, ht + 2, 8, 1, c.band || '#fff'); r(x + 4, ht + 2, 2, 1, c.band || '#fff'); break;
    case 'beanie': r(x - 4, ht - 1, 8, 3, c.band || '#2e5e3a'); r(x - 1, ht - 2, 2, 1, c.band || '#2e5e3a'); break;
    case 'tuft': r(x, ht - 2, 1, 2, c.hair); r(x + 1, ht - 3, 1, 1, c.hair); break;
    case 'lens': { const dx = Math.round(Math.sin(t / 10) * 3); r(x + 5 + dx, bt - 3, 5, 5, OUT); r(x + 6 + dx, bt - 2, 3, 3, '#cfeaff'); r(x + 7 + dx, bt - 2, 1, 1, '#fff'); r(x + 4 + dx, bt + 2, 2, 2, '#7a4a2a'); break; }
    case 'beret': { r(x - 5, ht - 1, 9, 2, c.band || '#c0392b'); r(x - 1, ht - 2, 2, 1, c.band || '#c0392b');
      r(x - 11, bt + 1, 6, 4, '#d9b38c'); r(x - 10, bt + 2, 1, 1, '#ef476f'); r(x - 8, bt + 2, 1, 1, '#4fc3f7'); r(x - 9, bt + 3, 1, 1, '#ffd166');
      const bx = x + 5 + (Math.floor(t / 3) % 2), by = bt - 1 - (Math.floor(t / 3) % 3); r(bx, by, 1, 5, '#8a5a34'); r(bx, by - 1, 1, 1, pick(PK.ART)); break; }
    case 'book': r(x - 5, bt + 1, 10, 5, c.band || '#6b2e3a'); r(x - 4, bt + 1, 4, 4, '#fdf6e3'); r(x + 1, bt + 1, 3, 4, '#fdf6e3'); if (t % 30 < 3) r(x, bt - 1, 3, 5, '#fff'); break;
    case 'sweat': if (c.worry > 0 || Math.floor(t / 6) % 3 === 0) { r(x + 5, ht + 1, 1, 1, '#9fd8ff'); r(x + 5, ht + 2, 2, 2, '#6ec0f0'); }
      if (c.worry > 0 && Math.floor(t / 4) % 2) { r(x - 1, ht - 8, 2, 4, '#ff6b6b'); r(x - 1, ht - 3, 2, 1, '#ff6b6b'); } break;
    case 'pop': if (Math.floor(t / 7) % 4 === 0) { r(x + 4, bt - 1, 1, 4, c.shirt); r(x + 3, ht + 6, 2, 2, c.snack || '#fff6c8'); } break;
  }
};
/* 픽셀 얼굴 (채팅 프로필용): 장면 캐릭터와 같은 색·소품으로 14×14 캔버스에 머리만 그려 dataURL로 */
PK.face = function (c) {
  const cv = document.createElement('canvas'); cv.width = cv.height = 14; const g = cv.getContext('2d');
  const r = (x, y, w, h, col) => { g.fillStyle = col; g.fillRect(x, y, w, h); };
  const x = 7, ht = 4, hair = c.hair || '#5a3e2b';
  r(x - 4, ht + 8, 8, 2, c.shirt || '#888');
  r(x - 4, ht, 8, 8, SKIN); r(x - 4, ht, 8, 3, hair); r(x - 4, ht + 3, 1, 2, hair); r(x + 3, ht + 3, 1, 2, hair);
  r(x - 2, ht + 4, 1, 2, OUT); r(x + 1, ht + 4, 1, 2, OUT); r(x - 3, ht + 6, 1, 1, '#f39a9a'); r(x + 2, ht + 6, 1, 1, '#f39a9a');
  if (c.glasses) { r(x - 3, ht + 4, 2, 1, '#cfe6f5'); r(x + 1, ht + 4, 2, 1, '#cfe6f5'); r(x - 1, ht + 4, 2, 1, OUT); }
  switch (c.acc) {
    case 'bear': r(x - 5, ht - 2, 3, 3, hair); r(x + 2, ht - 2, 3, 3, hair); r(x - 4, ht - 1, 1, 1, '#d9a07a'); r(x + 3, ht - 1, 1, 1, '#d9a07a'); break;
    case 'band': r(x - 4, ht + 2, 8, 1, c.band || '#fff'); r(x + 4, ht + 2, 2, 1, c.band || '#fff'); break;
    case 'beanie': r(x - 4, ht - 1, 8, 3, c.band || '#2e5e3a'); r(x - 1, ht - 2, 2, 1, c.band || '#2e5e3a'); break;
    case 'tuft': r(x, ht - 2, 1, 2, hair); r(x + 1, ht - 3, 1, 1, hair); break;
    case 'beret': r(x - 5, ht - 1, 9, 2, c.band || '#c0392b'); r(x - 1, ht - 2, 2, 1, c.band || '#c0392b'); break;
    case 'sweat': r(x + 5, ht + 2, 1, 2, '#6ec0f0'); break;
    case 'pop': r(x + 3, ht + 9, 3, 3, '#fff6c8'); r(x + 3, ht + 10, 3, 1, '#e53b3b'); break;
  }
  return cv.toDataURL();
};
PK.zzz = (r, x, y, t) => { const o = Math.floor(t / 6) % 3; r(x, y - o, 3, 1, '#fff'); r(x + 1, y + 1 - o, 1, 1, '#fff'); r(x, y + 2 - o, 3, 1, '#fff'); };
PK.ART = ['#0e6ba8', '#4fc3f7', '#ffd166', '#ef476f', '#06d6a0', '#f8f4e3', '#8338ec'];

/* ---------- 공통 소품 ---------- */
PK.chairBack = (r, x, fy, col = '#3b3f58') => { r(x - 5, fy - 3, 10, 5, col); r(x - 4, fy - 2, 8, 2, '#4a4f6e'); r(x - 1, fy + 2, 2, 4, '#555'); r(x - 4, fy + 6, 8, 1, '#444'); };
PK.plant = (r, x, y, big) => {   // y = 화분 바닥
  r(x, y - 12, 12, 12, '#c0603a'); r(x - 2, y - 14, 16, 3, '#a24e2d');
  r(x + 1, y - (big ? 30 : 22), 3, big ? 16 : 9, '#3f8f5f'); r(x + 6, y - (big ? 34 : 26), 3, big ? 20 : 12, '#4fa85f'); r(x - 3, y - 22, 4, 3, '#4fa85f'); r(x + 8, y - 24, 5, 3, '#3f8f5f');
  if (big) { r(x - 2, y - 30, 5, 3, '#3f8f5f'); r(x + 9, y - 32, 5, 3, '#4fa85f'); } };
PK.shelf = (r, x, y, w, h, rows, seed = 7) => {
  r(x, y, w, h, '#7a4f2e'); r(x + 2, y + 2, w - 4, h - 4, '#5a3820'); let s = seed;
  const rn = () => (s = s * 16807 % 2147483647) / 2147483647; const rh = (h - 4) / rows;
  for (let i = 0; i < rows; i++) { const by = y + 2 + rh * (i + 1); r(x + 2, by - 2, w - 4, 2, '#8a5f3a'); let bx = x + 4;
    while (bx < x + w - 6) { const bw = 2 + Math.floor(rn() * 3), bh = Math.min(rh - 4, 6 + Math.floor(rn() * 6)); r(bx, by - 2 - bh, bw, bh, ['#d9534f', '#5b8def', '#f0ad4e', '#5cb85c', '#9b6bd6', '#e8e1cf', '#3c8d8a'][Math.floor(rn() * 7)]); bx += bw + (rn() < .15 ? 3 : 0); } } };
PK.popcorn = (r, x, y) => { r(x, y + 4, 12, 13, '#fff'); for (let i = 0; i < 3; i++) r(x + 1 + i * 4, y + 4, 2, 13, '#e53b3b'); r(x - 1, y, 14, 5, '#fff6c8'); r(x + 1, y - 2, 3, 3, '#ffe9a0'); r(x + 7, y - 3, 3, 3, '#fff6c8'); };
PK.easel = (r, x, y, strokes) => {   // x,y = 캔버스 왼쪽 위 (28x26)
  r(x + 4, y + 26, 2, 22, '#7a4f2e'); r(x + 22, y + 26, 2, 22, '#7a4f2e'); r(x + 13, y - 4, 2, 50, '#6b4428'); r(x, y + 26, 28, 2, '#6b4428');
  r(x, y, 28, 26, OUT); r(x + 2, y + 2, 24, 22, '#fdf8ee'); strokes.forEach(s => r(x + 2 + s.x, y + 2 + s.y, s.w, s.h, s.c)); };
PK.clock = (r, x, y, t) => { r(x, y, 14, 14, OUT); r(x + 1, y + 1, 12, 12, '#fff'); r(x + 6, y + 3, 1, 5, OUT); r(x + 6, y + 7, 4, 1, OUT); const a = t / 30; r(x + 6 + Math.round(Math.cos(a) * 4), y + 7 + Math.round(Math.sin(a) * 4), 1, 1, '#d9534f'); };
PK.memo = (r, x, y, c = '#ffe27a') => { r(x, y, 13, 13, c); r(x + 2, y + 3, 9, 1, '#8a7a3a'); r(x + 2, y + 6, 8, 1, '#8a7a3a'); r(x + 2, y + 9, 6, 1, '#8a7a3a'); r(x + 5, y - 1, 2, 2, '#d9534f'); };
PK.monitor = (r, x, y, m, on, t) => {   // 24x18 화면 (뒤에서 보면 안 보이니 정면용)
  r(x, y, 24, 18, OUT); r(x + 10, y + 18, 4, 2, '#555'); r(x + 7, y + 19, 10, 1, '#555');
  r(x + 2, y + 2, 20, 14, !on ? '#1a1a22' : m.flash > 0 ? '#4a1420' : '#13233a'); if (!on) return;
  m.lines.forEach((l, i) => r(x + 3 + l.ind, y + 3 + i * 2, Math.min(l.len, 18 - l.ind), 1, m.flash > 0 ? '#ff8a8a' : l.c));
  if (Math.floor(t / 4) % 2) r(x + 3 + Math.min(m.lines[5].len, 18), y + 13, 1, 1, '#fff');
  if (m.flash > 0 && m.flash < 6) { r(x + 5, y + 5, 14, 6, '#5fe38a'); r(x + 7, y + 7, 10, 2, '#13233a'); } };
const CODE_C = ['#7ee0ff', '#ffd37e', '#c79bff', '#8ff0b0', '#ff9db0', '#e8e8e8'];
PK.mkMon = () => ({ flash: 0, lines: Array.from({ length: 6 }, () => ({ ind: Math.floor(Math.random() * 3) * 2, len: 3 + Math.floor(Math.random() * 14), c: pick(CODE_C) })) });
PK.typeMon = (m, speed, t, busy) => { if (m.flash > 0) m.flash--; if (busy && t % speed === 0) { m.lines.shift(); m.lines.push({ ind: Math.floor(Math.random() * 3) * 2, len: 3 + Math.floor(Math.random() * 14), c: pick(CODE_C) }); } };
/* 튀어오르는 간식 (팝콘/마시멜로/과자) */
PK.snacks = (src, mouth, col = ['#fff6c8', '#e8c34a'], up = false) => {
  const S = { list: [], eaten: 37 };
  S.update = t => { if (t % 9 === 0) S.list.push({ x: src.x, y: src.y, vx: (Math.random() - .5) * 1.4, vy: up ? -.4 - Math.random() * .4 : -1.6 - Math.random(), life: 0 });
    for (let i = S.list.length - 1; i >= 0; i--) { const p = S.list[i]; p.x += p.vx; p.y += p.vy; if (!up) p.vy += .16; else p.vx *= .98; p.life++;
      if (Math.abs(p.x - mouth.x) < 3 && Math.abs(p.y - mouth.y) < 3) { S.eaten++; S.list.splice(i, 1); continue; }
      if ((!up && p.y > src.y + 22) || (up && p.life > 60)) S.list.splice(i, 1); } };
  S.draw = r => S.list.forEach(p => { r(p.x, p.y, 2, 2, col[0]); r(p.x + 1, p.y + 1, 1, 1, col[1]); });
  return S; };
PK.art = () => ({ strokes: [], tick(t, busy, w = 22, h = 20, onWipe) { if (busy && t % 10 === 0) { this.strokes.push({ x: Math.floor(Math.random() * w), y: Math.floor(Math.random() * h), w: 2 + Math.floor(Math.random() * 4), h: 1 + Math.floor(Math.random() * 3), c: pick(PK.ART) }); if (this.strokes.length > 40) { this.strokes = []; onWipe && onWipe(); } } } });

/* ---------- 클릭 카드 본문 ---------- */
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[m]));
PK.B = {
  phases: k => { const L = k.LIVE;
    return `${L.on ? `<p><b>${esc(L.phase)}</b></p><p>${esc(L.summary || '')}</p>${L.next ? `<p><span class="tag">다음</span>${esc(L.next)}</p>` : ''}` : ''}
      <ul>${PK.PHASES.map(p => `<li><b>${PK.PHASE_LABEL[p]}</b>${{ PLAN: ' — 빌더의 질문에 답하며 계획', BUILD: ' — 기능 하나씩 (기능 하나 = 세션 하나)', VERIFY: ' — 빌더가 검사하고 문제 보고', FINISH: ' — 정리하고 마무리' }[p]}</li>`).join('')}</ul>`; },
  alerts: k => { const L = k.LIVE, a = L.on ? L.alerts.slice(-5) : [];
    return a.length ? `<ul>${a.map(e => `<li>${esc(e.ev)} ${esc(e.reason || e.detail || '')}</li>`).join('')}</ul>` : '<p>막힌 일 없음 ✨</p>'; },
  elapsed: k => { const L = k.LIVE, m = L.started ? Math.round((Date.now() - new Date(L.started)) / 60000) : 0; return `<p>시작한 지 <b>${m}분</b>.</p>${L.on ? `<p>이벤트 ${L.eventCount}개 기록됨</p>` : ''}`; },
};

/* ---------- 테마 → Room 설정 ---------- */
PK.room = function (th, opts = {}) {
  const solo = Object.assign({}, th.solo || {});
  const TT = (v, k) => typeof v === 'function' ? v(k) : v;
  const objs = th.objects;
  const K = Room(Object.assign({
    W: th.W, H: th.H, px: 1, icon: th.icon, title: th.title, demoPhase: 'SLICE', personas: PK.PERSONAS, phaseLabel: th.phaseLabel,
    footer: th.footer || '수다는 대시보드 표시용 연출이에요. 실제 개발에는 관여하지 않아요.',
    jobs: th.jobs, personExtra: Object.assign({ 'free-rider': '<p>⚠️ 대시보드에만 있는 캐릭터예요. 실제로는 아무 일도 안 해요. 남이 끝낸 일에 "제가 공유할게요"만 해요.</p><div class="meter"><i style="width:2%"></i></div><small>실제 기여도 2% · 본인 주장 40%</small>' }, th.personExtra || {}),
    chars: th.chars, props: th.props, drawRoom: th.drawRoom, drawPerson: PK.person, drawFront: th.drawFront, drawEmpty: th.drawEmpty, update: th.update, afterApply: th.afterApply,
    info(id, k) { const o = objs[id]; if (!o) return; k.show(TT(o.title, k), TT(o.sub, k) || '', typeof o.body === 'function' ? o.body(k) : o.body);
      if (o.say) k.say(o.say[0], typeof o.say[1] === 'function' ? o.say[1](k) : o.say[1]); o.fx && o.fx(k); },
    // 메인 대시보드: panel이 있는 물건은 큰 패널(task·문서·스크린샷 등)을 연다
    ...(opts.openPanel ? { info(id, k) { const o = objs[id]; if (!o) return; k.hint(false);
      if (o.say) k.say(o.say[0], typeof o.say[1] === 'function' ? o.say[1](k) : o.say[1]); o.fx && o.fx(k);
      if (o.panel) return opts.openPanel(o.panel, id);
      k.show(TT(o.title, k), TT(o.sub, k) || '', typeof o.body === 'function' ? o.body(k) : o.body); } } : {}),
    hotspots: Object.entries(objs).filter(([, o]) => o.at).map(([id, o]) => ({ id, x: o.at[0], y: o.at[1], w: o.at[2], h: o.at[3], tip: o.tip || String(o.title).replace(/^\S+\s/, '') })),
    board: th.board && { ...th.board, render(el, k) { const PH = PK.PHASES, ph = PK.normPh(k.LIVE.phase), cur = PH.indexOf(ph), fin = ph === 'DONE', per = k.LIVE.perPhase || {};
      // 코르크 보드 = 진행 단계. 메모 한 장 = 그 단계에서 한 세션 (최대 4장)
      const h = `<div class="pb ${th.board.cls || ''}" style="grid-template-columns:repeat(${PH.length},1fr)">${PH.map((p, i) => `<div class="col ${i === cur && !fin ? 'cur' : (i < cur || fin) ? 'done' : ''}"><span>${PK.PHASE_LABEL[p]}</span>${Array.from({ length: Math.min(4, per[p] || 0) }, (_, j) => `<div class="note ${['', 'p', 'b'][(i + j) % 3]}"></div>`).join('')}</div>`).join('')}</div>`;
      if (el.innerHTML !== h) el.innerHTML = h; } },
    overlays: th.overlays, solo, scenes: th.scenes || [], ambient: th.ambient || ['(STATUS.md 확인 중)'],
  }, opts));
  K.chars = th.chars;
  return K;
};
})();
