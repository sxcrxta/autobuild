/* 픽셀 공방 장면 설정 (메인 대시보드).
 * OFFICE(opts): opts는 Room 설정에 덮어쓸 것 (mount, external, onLog, onPerson, openPanel, show …)
 */
window.OFFICE = function (opts) {
'use strict';
opts = opts || {};
const W = 320, H = 180, { OUT } = PK;
const MON = [PK.mkMon(), PK.mkMon(), PK.mkMon()], MX = [76, 112, 148], DX = [88, 124, 160];
// v0.15 작업실: 빌더 1명 + 부를 때만 오는 일회용 보조 4종. 보조마다 자기 자리(작업대)가 있다.
const SEATS = () => ['worker-1', 'lead', 'worker-2'];
const HELP = { scout: ['🔎', '조사 보조', '책장 옆 안락의자'], checker: ['🧪', '검토 보조', '테스트 램프 앞'], designer: ['🎨', '디자인 보조', '이젤 앞'], worker: ['🔁', '반복 작업 보조', '빌더 양옆 책상'] };
const WORKERS = [null, null];
const JOBS = { lead: '빌더 · 기획부터 마무리까지', scout: '🔎 조사 보조 · haiku · 일회용', checker: '🧪 검토 보조 · sonnet · 일회용', designer: '🎨 디자인 보조 · sonnet · 일회용',
  'worker-1': '🔁 반복 작업 보조 · sonnet · 일회용', 'worker-2': '🔁 반복 작업 보조 · sonnet · 일회용', 'free-rider': '자칭 PM · 진짜 팀원 아님' };
const FR = { q: [], prev: {}, phase: null, snap: 0, first: true, n: 0 };   // free-rider: 남이 끝낸 일에 숟가락 얹기
const esc = s => String(s ?? '').replace(/[&<>"]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]));
const FR_LINES = ['진행 상황은 제가 공유 올릴게요', '그건 다음 회의 때 얼라인하죠', '저도 옆에서 많이 도왔죠', '발표 자료에 제 이름도 넣어 주세요', '지금 좀 바빠서요, 메시지 정리 중이라'];
const pick = a => a[Math.floor(Math.random() * a.length)];
// v0.26 대화와 연결: 빌더 세션 상태(작업 중 / 내 말 기다림 / 세션 없음), 아직 안 닿은 내 말, 날아가는 종이비행기
const CVS = { on: false, alive: false, busy: false, pending: 0 };
const PLANES = [];
const monOn = (C, i) => { const c = C[SEATS()[i]]; return c.status !== 'gone' && !(CVS.on && c.id === 'lead' && c.status === 'idle'); };
const catAwake = () => CVS.on && CVS.alive && !CVS.busy;
function afterApply(C, LIVE, s) {
  const ag = s.agents || [], get = n => ag.find(a => a.name === n);
  Object.assign(C.lead, { x: 124, fy: 120 }); C.lead.tx = C.lead.x;
  // 반복 작업 보조: 동시에 2명까지 책상에
  const w = get('worker'), inflight = w && w.state === 'working' ? Math.max(1, (w.calls || 1) - (w.done || 0)) : 0;
  WORKERS[0] = inflight ? '반복 작업' : null;
  WORKERS[1] = inflight >= 2 ? '반복 작업 2' : null;
  C['worker-1'].status = WORKERS[0] ? 'working' : 'gone'; C['worker-2'].status = WORKERS[1] ? 'working' : 'gone';
  for (const id of ['scout', 'checker', 'designer']) { const a = get(id); C[id].status = a && a.state === 'working' ? 'working' : 'gone'; }
  // 끝난 일 감지 → free-rider가 자기 공으로
  for (const id of Object.keys(HELP)) { const a = get(id), d = a ? a.done || 0 : 0;
    if (!FR.first && d > (FR.prev[id] || 0)) FR.q.push(pick([`${HELP[id][1]} 끝났네요. 제가 정리해서 공유할게요`, `이번 ${HELP[id][1].replace(' 보조', '')} 결과, 기여자 칸에 제 이름도 넣어 주세요`, '역시 우리 팀. 저도 옆에서 많이 도왔죠']));
    FR.prev[id] = d; }
  const ph = s.status && s.status.phase;
  if (!FR.first && ph && FR.phase && ph !== FR.phase) FR.q.push(ph === 'DONE' ? '발표는 제가 할게요. 다들 고생 많으셨어요' : pick(['단계 넘어갔네요. 진행 상황은 제가 공유 올릴게요', '방금 거 캡처해서 보고 올렸어요. 제 이름으로요']));
  FR.phase = ph; FR.first = false;
}
const ART = PK.art();
const PAPER = []; let paperT = 0;

// v0.16 1인 공방: 실제 시각에 따라 낮·노을·밤. 밤엔 스탠드·모니터·꼬마전구만 켜진 아늑한 방 (?hour=21 로 미리보기)
const HOUR_Q = new URLSearchParams(location.search).get('hour');
function tod() { const h = HOUR_Q != null ? +HOUR_Q : new Date().getHours() + new Date().getMinutes() / 60;
  return h >= 7 && h < 17 ? 'day' : h >= 17 && h < 19.5 ? 'dusk' : h >= 5 && h < 7 ? 'dawn' : 'night'; }
const SKY = { day: ['#8fd3ff', '#b9e6ff'], dusk: ['#ff9a6b', '#ffcf8a'], dawn: ['#a99bd9', '#ffc9a8'], night: ['#1b1f4a', '#2a2f66'] };
const STARS = Array.from({ length: 14 }, (_, i) => [7 + (i * 37) % 46, 11 + (i * 23) % 24, i % 3]);
function drawRoom(k) {
  const { r, t, LIVE, C } = k, T = tod(), dark = T === 'night';
  // 벽지: 짙은 청록 + 작은 별 무늬, 아래는 나무 징두리
  r(0, 0, W, 84, dark ? '#24304a' : '#2f4a5c');
  for (let y = 6; y < 66; y += 12) for (let x = (y / 12 % 2) * 8; x < W; x += 16) r(x, y, 1, 1, dark ? '#3a4a6a' : '#4a6a7c');
  r(0, 66, W, 18, '#6b4a33'); r(0, 66, W, 2, '#8a5f3f'); for (let x = 4; x < W; x += 20) r(x, 70, 1, 12, '#5a3c28'); r(0, 82, W, 2, '#3e2a1c');
  // 바닥: 어두운 원목 + 둥근 러그
  r(0, 84, W, H - 84, '#7a5236');
  for (let y = 90; y < H; y += 9) { r(0, y, W, 1, '#664430'); for (let x = ((y / 9) % 2) * 22; x < W; x += 44) r(x, y - 8, 1, 8, '#6b4832'); }
  r(70, 106, 120, 24, '#9a4a4a'); r(66, 109, 128, 18, '#9a4a4a'); r(74, 109, 112, 18, '#b85c5c'); r(72, 112, 116, 12, '#b85c5c');
  for (let x = 80; x < 182; x += 10) r(x, 117, 5, 2, '#e8b04a');
  // 꼬마전구 줄 (천장)
  for (let x = 2; x < W; x += 2) r(x, 3 + Math.round(Math.sin(x / 18) * 2), 2, 1, '#2a2233');
  for (let x = 8, n = 0; x < W; x += 14, n++) { const y = 4 + Math.round(Math.sin(x / 18) * 2), on = (Math.floor(t / 10) + n) % 5 !== 0;
    r(x, y + 1, 2, 3, on ? ['#ffd36b', '#ff9fb2', '#9fe6ff', '#b6f5a8'][n % 4] : '#5a5060'); }
  // 창문: 시간 따라 하늘
  const [s1, s2] = SKY[T];
  r(4, 8, 52, 40, '#3e2a1c'); r(6, 10, 48, 36, s1); r(6, 32, 48, 14, s2);
  if (dark) { STARS.forEach(([x, y, b]) => (Math.floor(t / 9) + b) % 4 && r(x, y, 1, 1, '#fff6c8')); r(42, 13, 6, 6, '#fff3c4'); r(44, 13, 4, 4, s1); }
  else { const cx = ((t * .12) % 70) - 16; r(6 + Math.max(0, cx), 17, Math.min(12, 48 - Math.max(0, cx)), 3, T === 'day' ? '#fff' : '#ffe0c8');
    if (T !== 'day') r(14, 30, 8, 4, '#ffdf7a'); }
  r(6, 40, 48, 6, dark ? '#1c2a3a' : '#4f8f5f'); r(10, 37, 10, 3, dark ? '#22324a' : '#5aa469'); r(34, 36, 14, 4, dark ? '#22324a' : '#5aa469');
  r(29, 10, 2, 36, '#3e2a1c'); r(6, 27, 48, 2, '#3e2a1c'); r(2, 48, 56, 3, '#8a5f3f');
  r(8, 44, 5, 4, '#c0603a'); r(9, 40, 2, 4, '#4fa85f'); r(11, 39, 2, 5, '#3f8f5f');
  // 시계 · 코르크 보드(진행) · 달력 · 메모 · 요청함
  PK.clock(r, 58, 8, t);
  r(72, 8, 72, 44, '#8a5f3f'); r(74, 10, 68, 40, '#c99a64'); for (let i = 0; i < 18; i++) r(76 + (i * 29) % 64, 13 + (i * 17) % 34, 1, 1, '#b5864f');
  r(148, 8, 16, 20, '#f4ecdc'); r(148, 8, 16, 5, '#d9534f'); for (let i = 0; i < 9; i++) r(150 + (i % 3) * 5, 15 + Math.floor(i / 3) * 4, 3, 2, i === 4 ? '#d9534f' : '#c9bca4');
  PK.memo(r, 150, 33);
  r(167, 8, 20, 40, '#5a3c28'); r(168, 9, 18, 38, '#c99a64'); r(170, 10, 14, 4, '#f4ecdc'); r(171, 11, 12, 2, '#d9534f');
  const fb = [...Array.from({ length: Math.min(6, CVS.pending) }, () => ({ status: 'new' })), ...(LIVE.feedback || []).filter(f => f.status !== 'done')], fd = (LIVE.feedback || []).filter(f => f.status === 'done');
  fb.slice(0, 6).forEach((f, i) => { const x = 169 + (i % 2) * 8, y = 16 + Math.floor(i / 2) * 9, wig = f.status === 'new' && Math.floor(t / 4) % 2;
    r(x, y + (wig ? 1 : 0), 7, 7, f.status === 'new' ? '#ff6b8a' : '#ffb3c7'); r(x + 1, y + 2 + (wig ? 1 : 0), 5, 1, '#8a3a4a'); r(x + 1, y + 4 + (wig ? 1 : 0), 4, 1, '#8a3a4a'); r(x + 3, y - 1 + (wig ? 1 : 0), 1, 2, '#555'); });
  if (fd.length) r(170, 43, 14, 3, '#5fe38a');
  // 테스트 램프 (검토 보조 자리)
  r(190, 30, 16, 54, '#2b2f45'); r(192, 32, 12, 50, '#1d2033');
  for (let i = 0; i < 6; i++) { const on = (Math.floor(t / 5) + i * 3) % 7 !== 0; r(194, 35 + i * 8, 8, 5, '#14162a'); r(195, 36 + i * 8, 2, 2, LIVE.fail && i === 2 ? '#ff4d4d' : on ? '#5fe38a' : '#2f6b45'); r(198, 36 + i * 8, 3, 1, '#445'); }
  // 보조 안내판 · 포스터
  r(210, 8, 36, 24, '#3e2a1c'); r(212, 10, 32, 20, '#1f3b4a'); ['#ffd36b', '#b48cff', '#7fe0c4', '#ff9fb2'].forEach((c, i) => { r(214, 12 + i * 4, 3, 3, c); r(219, 13 + i * 4, 10 + (i * 5) % 12, 1, '#cfe3ff'); });
  r(214, 38, 18, 24, '#f4ecdc'); r(216, 40, 14, 14, '#ffd8a8'); r(219, 44, 8, 7, '#8a8a99'); r(220, 43, 2, 2, '#8a8a99'); r(224, 43, 2, 2, '#8a8a99'); r(217, 56, 12, 2, '#d9534f');
  // 책장 · 정수기 · 화분
  PK.shelf(r, 252, 4, 64, 80, 4); r(300, 8, 6, 9, '#7fbf7f');
  r(236, 60, 12, 26, '#d8d8e4'); r(238, 48, 8, 12, '#7fc0ef'); r(239, 50, 6, 8, '#a9dcff'); r(240, 72, 4, 2, '#5b8def'); r(240, 76, 4, 2, '#d9534f'); r(236, 86, 12, 2, '#999');
  PK.plant(r, 2, 92, true);
  // 작업 책상 (빌더 가운데 + 보조 자리 둘)
  r(66, 92, 124, 5, '#5a3820'); r(66, 97, 124, 12, '#7a4f2e'); r(68, 99, 120, 1, '#8f6038'); r(68, 109, 4, 5, '#3e2a1c'); r(184, 109, 4, 5, '#3e2a1c');
  MON.forEach((m, i) => PK.monitor(r, MX[i], 72, m, monOn(C, i), t));
  DX.forEach((x, i) => { const away = C[SEATS()[i]].status === 'gone'; r(x - 16, 99, 32, 8, '#3e2a1c'); r(x - 15, 100, 30, 6, away ? '#b9ab94' : '#f4e2b8'); });
  // 스탠드 (빌더 책상 왼쪽) · 머그 · 러버덕 · 작은 화분
  const lampOn = !CVS.on || C.lead.status !== 'idle';
  r(100, 90, 8, 2, '#2b2233'); r(103, 80, 2, 10, '#2b2233'); r(99, 76, 10, 5, '#e8b04a'); r(100, 81, 8, 1, lampOn && (dark || T === 'dusk') ? '#fff3b0' : '#c99a3a');
  r(138, 87, 6, 5, '#f4ecdc'); r(144, 88, 2, 2, '#f4ecdc'); r(139, 88, 4, 2, '#6b3e1f'); if (t % 10 < 5) r(140, 84, 1, 2, 'rgba(255,255,255,.6)');
  r(175, 88, 5, 4, '#ffd84a'); r(178, 86, 3, 3, '#ffd84a'); r(181, 87, 2, 1, '#f08a3a');
  r(68, 86, 6, 6, '#c0603a'); r(69, 82, 2, 4, '#4fa85f'); r(71, 81, 2, 5, '#3f8f5f');
}
// 밤·노을 조명: 방 전체를 어둡게 하고 빛 나는 곳만 밝힘
function light(k) {
  const T = tod(); if (T === 'day') return; const g = k.g, dark = T === 'night';
  g.save(); g.fillStyle = dark ? 'rgba(10,8,34,.46)' : T === 'dusk' ? 'rgba(60,20,40,.18)' : 'rgba(40,30,70,.16)'; g.fillRect(0, 0, W, H);
  g.globalCompositeOperation = 'lighter';
  const glow = (x, y, rad, c, a) => { const gr = g.createRadialGradient(x, y, 0, x, y, rad); gr.addColorStop(0, `rgba(${c},${a})`); gr.addColorStop(1, `rgba(${c},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); };
  const f = 1 + Math.sin(k.t / 9) * .04;
  if (!CVS.on || k.C.lead.status !== 'idle') glow(104, 88, 46 * f, '255,200,110', dark ? .34 : .18);           // 스탠드 (빌더가 자면 끔)
  MX.forEach((x, i) => monOn(k.C, i) && glow(x + 12, 82, 22, '120,190,255', dark ? .2 : .1));   // 모니터
  glow(315, 94, 30, '255,214,130', dark ? .22 : .1);                 // 플로어 램프
  glow(87, 160, 16, '140,230,190', dark ? .16 : .06);                // TV
  if (dark) glow(30, 28, 34, '150,170,255', .12);                     // 달빛
  for (let x = 8, n = 0; x < W; x += 14, n++) if ((Math.floor(k.t / 10) + n) % 5) glow(x + 1, 6 + Math.round(Math.sin(x / 18) * 2), 6, '255,210,140', dark ? .25 : .1);
  g.restore();
}
const chair = (r, x, fy) => PK.chairBack(r, x, fy);
const props = [
  { y: 113, draw({ r, C }) { SEATS().forEach((id, i) => { if (C[id].status === 'gone') { r(DX[i] - 5, 108, 10, 9, '#3b3f58'); chair(r, DX[i], 120); } }); } },
  { y: 147, draw({ r }) { PK.easel(r, 212, 100, ART.strokes); } },
  { y: 170, draw(k) { const { r, t } = k;   // 레트로 TV (최신 스크린샷이 나옴)
    r(74, 168, 26, 2, '#6b4428'); r(76, 170, 2, 8, '#6b4428'); r(96, 170, 2, 8, '#6b4428');
    r(76, 150, 22, 18, '#4a4a55'); r(78, 152, 14, 12, '#2a3a4a'); const im = PK.shot && PK.shot.img;
    if (im && im.complete && im.naturalWidth) { k.g.drawImage(im, 79, 153, 12, 10); if (PK.shot.fresh > 0 && Math.floor(t / 3) % 2) { r(77, 151, 16, 1, '#ffcf5a'); r(77, 164, 16, 1, '#ffcf5a'); } }
    else { r(79, 153, 12, 10, Math.floor(t / 4) % 2 ? '#3a8f5f' : '#4fa8d8'); r(81, 157, 3, 3, '#ffd84a'); } r(94, 154, 2, 2, '#d9534f'); r(94, 158, 2, 2, '#888'); r(84, 148, 1, 2, '#888'); r(88, 147, 1, 3, '#888');
  } },
  { y: 150, draw({ r }) {   // 소파
    r(4, 138, 66, 10, '#4867b3'); r(4, 148, 66, 16, '#5b7bd1'); r(0, 142, 8, 24, '#4867b3'); r(66, 142, 8, 24, '#4867b3'); r(6, 164, 4, 4, OUT); r(64, 164, 4, 4, OUT);
    r(12, 144, 12, 6, '#ffd166'); r(13, 145, 10, 4, '#ffe08a');
  } },
  { y: 163, draw({ r, t }) {   // free-rider 노트북: 발표 자료만 열려 있음
    r(40, 150, 16, 10, '#3b3f58'); r(41, 151, 14, 8, '#f4f4f8'); r(42, 152, 8, 1, '#d9534f'); r(42, 154, 11, 1, '#bbb'); r(42, 156, 6, 1, '#bbb'); r(38, 160, 20, 2, '#55596e');
    if (FR.snap > 0) r(28, 141, 3, 3, '#fffbe0');   // 사진 찍는 플래시
  } },
  { y: 140, draw({ r }) { r(270, 128, 40, 14, '#a23b48'); } },   // 안락의자 등받이
  { y: 160, draw({ r }) { r(268, 150, 44, 10, '#c04a58'); r(264, 134, 8, 28, '#a23b48'); r(308, 134, 8, 28, '#a23b48'); r(268, 160, 3, 4, OUT); r(309, 160, 3, 4, OUT); } },
  { y: 158, draw({ r, t }) {   // 사이드 테이블 + 램프
    r(252, 140, 12, 3, '#7a4f2e'); r(257, 143, 2, 16, '#5a3820'); r(254, 158, 8, 1, '#5a3820'); r(255, 134, 6, 6, '#fff'); r(256, 135, 4, 2, '#6b8f5a'); if (t % 8 < 4) r(257, 131, 1, 2, 'rgba(255,255,255,.7)');
    r(317, 98, 2, 60, '#555'); r(310, 90, 10, 8, '#ffe08a'); r(311, 98, 8, 1, '#d4b35a');
  } },
  { y: 172, draw({ r }) {   // 커피 테이블
    r(10, 164, 52, 4, '#8a5a34'); r(12, 168, 3, 6, '#6b4428'); r(57, 168, 3, 6, '#6b4428');
    r(14, 158, 9, 6, '#d9534f'); r(15, 159, 7, 2, '#ffd166'); r(28, 160, 10, 4, '#333'); r(30, 161, 2, 1, '#5fe38a'); r(35, 161, 1, 1, '#d9534f'); r(44, 159, 4, 5, '#5b8def');
  } },
  { y: 172, draw({ r, t }) {   // 프린터 + 휴지통 + 고양이
    r(112, 150, 26, 14, '#d8d8e0'); r(112, 150, 26, 3, '#e8e8f0'); r(116, 164, 18, 2, '#aaa'); r(114, 166, 2, 6, '#888'); r(134, 166, 2, 6, '#888'); r(132, 153, 3, 2, t % 10 < 5 ? '#5fe38a' : '#2f6b45');
    r(118, 146, 14, 4, '#fff'); PAPER.forEach(p => r(p.x, p.y, 8, 6, '#fff'));
    r(144, 160, 10, 12, '#7a7f8f'); r(143, 159, 12, 2, '#5a5f6f'); r(146, 156, 4, 4, '#f4f4f4'); r(150, 157, 3, 3, '#e8e8e8');
    const tail = Math.floor(t / 8) % 2;
    if (catAwake()) {   // 빌더가 내 말을 기다리면 고양이도 깨서 쳐다봄
      const sw = Math.floor(t / 4) % 3, bl = t % 40 < 2;
      r(166, 164, 12, 8, '#e8a35a'); r(167, 166, 3, 1, '#c8803a'); r(173, 166, 3, 1, '#c8803a'); r(165, 171, 3, 2, '#e8a35a'); r(176, 171, 3, 2, '#e8a35a');
      r(166, 155, 12, 9, '#e8a35a'); r(166, 153, 3, 2, '#e8a35a'); r(175, 153, 3, 2, '#e8a35a'); r(167, 154, 1, 1, '#f39a9a'); r(176, 154, 1, 1, '#f39a9a');
      if (bl) { r(168, 159, 2, 1, OUT); r(174, 159, 2, 1, OUT); } else { r(168, 158, 2, 2, OUT); r(174, 158, 2, 2, OUT); r(168, 158, 1, 1, '#fff'); r(174, 158, 1, 1, '#fff'); }
      r(171, 161, 2, 1, '#c8603a'); r(178 + sw, 165 - sw, 2, 7, '#e8a35a');
      if (Math.floor(t / 10) % 4 === 0) { r(181, 151, 1, 1, '#ff6b8a'); r(183, 151, 1, 1, '#ff6b8a'); r(180, 152, 5, 1, '#ff6b8a'); r(181, 153, 3, 1, '#ff6b8a'); r(182, 154, 1, 1, '#ff6b8a'); }
    } else {
      r(164, 168, 14, 6, '#e8a35a'); r(176, 165, 7, 6, '#e8a35a'); r(176, 163, 2, 2, '#e8a35a'); r(181, 163, 2, 2, '#e8a35a'); r(166, 170, 3, 1, '#c8803a'); r(171, 170, 3, 1, '#c8803a');
      r(178, 168, 2, 1, OUT); r(181, 168, 1, 1, OUT); r(160, 171 - tail, 4, 2, '#e8a35a');
      if (Math.floor(t / 7) % 3 === 0) PK.zzz(r, 184, 158, t);
    }
  } },
  { y: 176, draw({ r }) { PK.plant(r, 196, 176, true); } },
];
function update(k) {
  const { t, C, say } = k;
  if (CVS.on) C.lead.status = CVS.busy ? 'working' : CVS.alive ? 'wait' : 'idle';
  MON.forEach((m, i) => { const c = C[SEATS()[i]]; PK.typeMon(m, [3, 9, 5][i], t, c.status === 'working' || c.status === 'demo'); });
  for (let i = PLANES.length - 1; i >= 0; i--) { const p = PLANES[i]; p.f++; const u = Math.min(1, p.f / 26);
    p.x = 40 + (176 - 40) * u; p.y = 150 + (22 - 150) * u - Math.sin(u * Math.PI) * 26; if (u >= 1) PLANES.splice(i, 1); }
  ART.tick(t, C.designer.status === 'working', 22, 20, () => {});
  if (FR.snap > 0) FR.snap--;
  if (FR.q.length && t % 40 === 0 && say('free-rider', FR.q[0], 5200)) { k.log && k.log('free-rider', FR.q[0]); FR.q.shift(); FR.snap = 12; FR.n++; }
  if (++paperT % 70 === 0) PAPER.push({ x: 121, y: 146 }); for (let i = PAPER.length - 1; i >= 0; i--) { PAPER[i].y -= .5; if (PAPER[i].y < 138) PAPER.splice(i, 1); }
}
function drawFront(k) {
  light(k); const { r, t, C } = k;
  PLANES.forEach(p => { r(p.x, p.y, 6, 1, '#fff'); r(p.x + 1, p.y + 1, 4, 1, '#fff'); r(p.x + 2, p.y + 2, 2, 1, '#d8d8e8'); r(p.x - 2, p.y + 1, 2, 1, 'rgba(255,255,255,.4)'); });
  // 빌더가 내 말을 기다릴 때: 머리 위에 '…' 말풍선
  const L = C.lead; if (CVS.on && L.status === 'wait' && L.talkUntil < k.now()) { const x = L.x + 5, y = (L.top ?? L.fy - 24) - 15 + (Math.floor(t / 6) % 2);
    r(x, y, 13, 7, '#fffaf0'); r(x - 1, y + 1, 1, 5, '#fffaf0'); r(x + 13, y + 1, 1, 5, '#fffaf0'); r(x + 1, y + 7, 3, 1, '#fffaf0'); r(x, y + 8, 2, 1, '#fffaf0');
    const d = Math.floor(t / 4) % 4; for (let i = 0; i < 3; i++) r(x + 3 + i * 3, y + 3, 2, 2, i < d ? '#2b2233' : '#c9bca4'); }
}
const phone = ({ r, t }, c) => {   // 폰 들고 스크롤, 가끔 들어서 사진
  const up = FR.snap > 0, x = c.x + 3, y = c.fy - (up ? 22 : 14);
  r(x, y, 4, 6, '#2b2f45'); r(x + 1, y + 1, 2, 4, up ? '#fffbe0' : (Math.floor(t / 5) % 2 ? '#8fd3ff' : '#bfe6ff'));
  r(x - 1, y + 4, 2, 2, PK.SKIN); };

function seat(k, id) { if (id === 'lead') return 'in'; return WORKERS[id === 'worker-1' ? 0 : 1] ? 'in' : 'empty'; }
const plateName = (k, i) => { const id = SEATS()[i]; if (id === 'lead') return '빌더'; return WORKERS[i === 0 ? 0 : 1] ? '보조 작업 중' : '보조 자리'; };
function helperInfo(k, id) {
  const [e, ko, where] = HELP[id], a = k.LIVE.on && k.agent(id);
  const what = { scout: '큰 코드·문서·웹에서 답 하나를 찾아 요약만 돌려줘요. 파일은 안 고쳐요.', checker: '완성 직전에 새 눈으로 화면·요구사항을 확인하고 문제 목록만 돌려줘요. M·L 등급은 끝내기 전에 꼭 한 번 와요.',
    designer: '레퍼런스와 화면을 비교해서 색·간격을 바꿀 값으로 알려줘요. 코드는 안 고쳐요.', worker: '작업지시서(orders/WO-*.md) 한 장을 받아 그 범위만 만들고 바로 가요. 같은 모양의 일이 여러 개면 동시에 2명까지 와요.' }[id];
  const st = !a ? '<div class="live">이번 프로젝트에선 아직 안 불렸어요. 평소엔 비어 있는 게 정상이에요.</div>'
    : `<div class="live"><b>LIVE</b> · ${a.state === 'working' ? '🟢 일하는 중' : '👋 끝나고 감'} · 불린 횟수 ${a.calls || 0}번${a.task ? `<br>최근 일: ${esc(a.task)}` : ''}${a.result ? `<br>돌려준 요약: ${esc(String(a.result).slice(0, 220))}` : ''}</div>`;
  return `<p>${e} <b>${ko}</b> 자리 (${where}).</p><p>${what}</p>${st}`;
}
function seatInfo(k, i) {
  const id = SEATS()[i];
  if (id === 'lead') return `<p><b>빌더</b> 자리. 혼자서 기획부터 마무리까지 다 만들어요.</p><p>필요할 때만 보조를 불러요: 🔎 조사 · 🧪 검토 · 🔁 반복 작업 · 🎨 디자인. 보조는 일 하나 하고 요약만 남기고 가요.</p>`;
  return helperInfo(k, 'worker');
}
function contrib(k) {
  const ag = (k.LIVE.agents || []).filter(a => a.helper || a.name === 'lead');
  const rows = ag.map(a => `<li>${a.name === 'lead' ? '🛠️ 빌더' : HELP[a.name][0] + ' ' + HELP[a.name][1]} — ${a.name === 'lead' ? `활동 ${a.count || 0}회` : `불림 ${a.calls || 0}번 · 끝냄 ${a.done || 0}번`}</li>`).join('');
  return `<p>free-rider 노트북에 열려 있는 「최종_발표_진짜최종.pptx」. 1쪽 발표자 칸: <b>free-rider (PM)</b></p><p>실제 기여 기록:</p><ul>${rows || '<li>아직 기록 없음</li>'}<li>📱 free-rider — 오늘 '제가 공유할게요' ${FR.n}번 · 커밋 0</li></ul>`;
}
const ROOM = PK.room({
  W, H, icon: '🛠️', title: '작업실',
  board: { x: 74, y: 10, w: 68, h: 40 },
  overlays: DX.map((_, i) => ({ x: DX[i] - 15, y: 100, w: 30, h: 6, render(el, k) {
    const id = SEATS()[i], st = seat(k, id);
    const h = `<div class="ptext" style="font-size:calc(var(--s)*3px);color:${st === 'in' ? '#3a2418' : '#7a6a5a'}">${plateName(k, i)}</div>`;
    if (el.innerHTML !== h) el.innerHTML = h; } })),
  chars: {
    lead:         { x: 124, fy: 120, pose: 'back', hair: '#8a5a34', shirt: '#4a7bd1', pants: '#3b3f58', acc: 'band', band: '#ffd34d', extra: (k, c) => chair(k.r, c.x, c.fy) },
    'worker-1':   { x: 88,  fy: 120, pose: 'back', demoGone: true, hair: '#5a5a66', shirt: '#f2a33a', pants: '#3b3f58', acc: 'beanie', band: '#c46a1a', extra: (k, c) => chair(k.r, c.x, c.fy) },
    'worker-2':   { x: 160, fy: 120, pose: 'back', demoGone: true, hair: '#2f2a3a', shirt: '#f2a33a', pants: '#3b3f58', acc: 'beanie', band: '#c46a1a', extra: (k, c) => chair(k.r, c.x, c.fy) },
    checker:      { x: 202, fy: 112, demoGone: true, hair: '#1f1b2b', shirt: '#6c4ca8', pants: '#2b2233', acc: 'lens', glasses: true },
    designer:     { x: 248, fy: 148, demoGone: true, hair: '#d46a9a', shirt: '#2b2233', pants: '#2b2233', acc: 'beret' },
    scout:        { x: 290, fy: 150, pose: 'sit', demoGone: true, hair: '#5a3e2b', shirt: '#7fb07f', pants: '#4f5f46', acc: 'book', glasses: true },
    'free-rider': { x: 32,  fy: 152, pose: 'sit', hair: '#ff8c42', shirt: '#e8e2d0', pants: '#5d5d8a', extra: phone },
  },
  props, drawRoom, drawFront, update, afterApply,
  objects: {
    board:   { panel: 'map', at: [72, 8, 72, 47], tip: '진행 보드 · 단계별 세션', title: '📋 진행 보드', sub: '계획 → 개발 → 검증 → 마무리', body: k => PK.B.phases(k) },
    mon0:    { at: [76, 72, 24, 18], tip: '왼쪽 책상', title: '🖥️ 🔁 반복 작업 보조 자리', sub: '일회용 · sonnet', body: k => seatInfo(k, 0) },
    mon1:    { panel: 'chat', at: [112, 72, 24, 18], tip: '빌더 모니터 · 대화 보기', title: '🖥️ 빌더의 모니터', sub: '빌더', body: k => seatInfo(k, 1) },
    mon2:    { at: [148, 72, 24, 18], tip: '오른쪽 책상', title: '🖥️ 🔁 반복 작업 보조 자리', sub: '일회용 · sonnet', body: k => seatInfo(k, 2) },
    plate0:  { at: [72, 99, 32, 8], tip: '보조 자리', title: '🪧 🔁 반복 작업 보조 자리', sub: '작업지시서로만 불림', body: k => seatInfo(k, 0) },
    plate1:  { panel: 'chat', at: [108, 99, 32, 8], tip: '빌더 자리 · 대화 보기', title: '🪧 빌더 자리', sub: '빌더', body: k => seatInfo(k, 1) },
    plate2:  { at: [144, 99, 32, 8], tip: '보조 자리', title: '🪧 🔁 반복 작업 보조 자리', sub: '작업지시서로만 불림', body: k => seatInfo(k, 2) },
    rack:    { at: [188, 28, 20, 56], title: '🚦 테스트 램프', sub: '🧪 검토 보조가 쓰는 장비', body: k => helperInfo(k, 'checker') },
    shelf:   { panel: 'docs', at: [252, 4, 64, 80], title: '📚 책장', sub: '🔎 조사 보조의 자리', body: k => helperInfo(k, 'scout') },
    easel:   { at: [212, 100, 28, 26], title: '🎨 이젤', sub: '🎨 디자인 보조의 자리', body: k => helperInfo(k, 'designer') },
    clock:   { panel: 'progress', at: [58, 8, 14, 14], title: '⏰ 시계', body: k => PK.B.elapsed(k) },
    inbox:   { at: [166, 8, 22, 41], tip: '우편함 · 빌더에게 말하기', title: '📮 우편함', panel: 'compose', body: '<p>내가 보낸 말이 빌더에게 닿기 전까지 여기 꽂혀 있어요.</p>' },
    calendar:{ at: [148, 8, 16, 20], title: '📅 달력', body: '<p>빨간 칸 = 예산 마감. 60%가 지나면 빌더가 빠른 마감으로 바꿔요.</p>' },
    memo:    { panel: 'team', at: [149, 32, 15, 15], title: '📝 메모', body: k => contrib(k) },
    blueprint:{ at: [210, 8, 36, 24], title: '📐 보조 부르는 법', body: '<ul><li>🔎 조사 — haiku · 질문 한 문장</li><li>🧪 검토 — sonnet · M·L은 끝내기 전 1번 필수</li><li>🔁 반복 작업 — sonnet · 작업지시서 필수</li><li>🎨 디자인 — sonnet · 볼 이미지 + 원하는 것</li></ul><p>모두 일회용이고, 끝나면 요약만 남기고 가요.</p>' },
    poster:  { at: [214, 38, 18, 24], title: '🐱 포스터', body: '<p>"하나 끝까지 먼저" — 빌더가 붙여 놓은 것.</p>' },
    water:   { at: [236, 48, 12, 40], title: '💧 정수기', body: '<p>기능 하나 끝내고 새 세션을 열 때마다 빌더가 물 한 잔.</p>' },
    tv:      { panel: 'preview', at: [76, 148, 22, 20], tip: 'TV · 미리보기 새로고침', title: '📺 레트로 TV', sub: '지금 화면', body: k => `<p>지금 만들어지는 앱을 직접 눌러 보려면:</p><p><a class="tbtn" href="/live/${encodeURIComponent(k.LIVE.slug || '')}/" target="_blank" rel="noopener">👀 지금 화면 열기</a></p><p style="font-size:11px;color:#7a6a8f">빌더가 아니라 대시보드가 직접 여는 거라 토큰이 안 들어요.</p>` },
    laptop:  { at: [38, 148, 20, 14], title: '💻 free-rider의 노트북', sub: '「최종_발표_진짜최종.pptx」', body: k => contrib(k), say: ['free-rider', '아 이거요? 그냥 진행 상황 정리 중이에요'] },
    printer: { panel: 'saves', at: [112, 146, 26, 20], title: '🖨️ 프린터', body: '<p>저장 지점마다 한 장씩 뽑혀요.</p>' },
    trash:   { panel: 'alerts', at: [143, 155, 12, 18], title: '🗑️ 휴지통', sub: '막힌 일 (BLOCKED)', body: k => PK.B.alerts(k) },
    cat:     { at: [158, 150, 28, 24], title: '🐈 작업실 고양이', sub: '이름: 빌드', body: '<p>빌더가 일하는 동안엔 자요. 빌더가 내 말을 기다리면 깨서 이쪽을 쳐다봐요.</p>' },
    window:  { at: [4, 8, 52, 40], title: '🪟 창문', body: '<p>실제 시각에 따라 낮·노을·밤이 바뀌어요. 자리를 비워도 빌더가 답하면 폰으로 알림이 가요.</p>' },
    tea:     { at: [252, 130, 14, 12], title: '🍵 허브티', sub: '🔎 조사 보조 것', body: '<p>조사 보조가 왔다 가면 항상 반쯤 남아 있음.</p>' },
  },
  jobs: JOBS,
  solo: { lead: ['하나 끝까지 먼저', '됐다, 다음!', '이건 조사 보조한테 물어보자', '스크린샷 찍어둘게'], 'free-rider': FR_LINES },
  scenes: [
    [['free-rider', '이거 제가 정리해서 공유할게요'], ['lead', '그럼 직접 하나 해볼래요?'], ['free-rider', '아 잠깐 전화가… 네 여보세요~']],
    [['lead', '검토 보조 불러야겠다'], ['free-rider', '검토는 제가 눈으로 봤어요. 괜찮던데요?'], ['lead', '…그래도 부를게']],
    [['free-rider', '다음 회의 때 얼라인하죠'], ['lead', '회의 없는데요'], ['free-rider', '그럼 제가 잡을게요']],
  ],
  footer: '말풍선은 대시보드 표시용 연출이에요. 실제 개발에는 관여하지 않아요. · 📱 free-rider는 진짜 팀원이 아닙니다(본인은 PM이라고 함)',
}, opts);
const K = ROOM;
K.setConvo = s => { Object.assign(CVS, s, { on: true }); if (s.perPhase) K.LIVE.perPhase = s.perPhase; };
K.sendFx = () => { PLANES.push({ x: 40, y: 150, f: 0 }); };
return K;
};
