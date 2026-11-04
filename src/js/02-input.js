/* ---------------- input ---------------- */
const held = {}, pressed = {};
let dirOrder = [];
function press(k) {
  audioInit();
  if (!held[k]) pressed[k] = true;
  held[k] = true;
  if (DIRS[k]) { dirOrder = dirOrder.filter(d => d !== k); dirOrder.push(k); }
}
function release(k) { held[k] = false; if (DIRS[k]) dirOrder = dirOrder.filter(d => d !== k); }
const heldDir = () => dirOrder.length ? dirOrder[dirOrder.length - 1] : null;
const KEYMAP = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', w: 'up', s: 'down', a: 'left', d: 'right',
  z: 'a', j: 'a', ' ': 'a', x: 'b', k: 'b', Enter: 'start', Shift: 'select', m: 'map', t: 'chat' };
addEventListener('keydown', e => { if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase?.()]; if (k) { e.preventDefault(); if (!e.repeat) press(k); } });
addEventListener('keyup', e => { if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return; const k = KEYMAP[e.key] || KEYMAP[e.key.toLowerCase?.()]; if (k) release(k); });
addEventListener('blur', () => { for (const k in held) release(k); });

document.querySelectorAll('button[data-k]').forEach(b => {
  const k = b.dataset.k;
  b.addEventListener('pointerdown', e => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch (_) {} press(k); b.classList.add('on'); });
  const up = () => { release(k); b.classList.remove('on'); };
  b.addEventListener('pointerup', up); b.addEventListener('pointercancel', up); b.addEventListener('lostpointercapture', up);
  b.addEventListener('contextmenu', e => e.preventDefault());
});
const dpad = document.getElementById('dpad');
const arrows = { up: dpad.querySelector('.u'), down: dpad.querySelector('.d'), left: dpad.querySelector('.l'), right: dpad.querySelector('.r') };
let padDir = null;
function setPad(d) {
  if (d === padDir) return;
  if (padDir) { release(padDir); arrows[padDir].classList.remove('on'); }
  padDir = d;
  if (d) { press(d); arrows[d].classList.add('on'); }
}
const knob = document.getElementById('knob');
/* 摇杆：手指落下的地方当作中心（按在边上的方向箭头时仍以摇杆中心为准），
   离中心 16 像素以内不走；换方向要明显偏过去才换，斜着推不会上下左右乱跳 */
let padO = null;
function padPoint(e) {
  const r = localRect(dpad), cx = r.left + r.width / 2, cy = r.top + r.height / 2, pt = toLocal(e.clientX, e.clientY);
  if (!padO) { const far = Math.hypot(pt.x - cx, pt.y - cy) > r.width * 0.28; padO = far ? { x: cx, y: cy } : { x: pt.x, y: pt.y }; }
  const x = pt.x - padO.x, y = pt.y - padO.y;
  const d = Math.hypot(x, y), max = r.width * 0.26, k = d > max ? max / d : 1;
  knob.style.transform = `translate(${x * k}px, ${y * k}px)`;
  if (d < (padDir ? 12 : 16)) return setPad(null);
  const ax = Math.abs(x), ay = Math.abs(y);
  let horiz = ax > ay;
  if (padDir === 'left' || padDir === 'right') horiz = ax * 1.6 > ay;
  else if (padDir === 'up' || padDir === 'down') horiz = ax > ay * 1.6;
  setPad(horiz ? (x > 0 ? 'right' : 'left') : (y > 0 ? 'down' : 'up'));
}
function padEnd() { setPad(null); padO = null; knob.style.transform = ''; dpad.classList.remove('active'); }
dpad.addEventListener('pointerdown', e => { e.preventDefault(); try { dpad.setPointerCapture(e.pointerId); } catch (_) {} dpad.classList.add('active'); padO = null; padPoint(e); });
dpad.addEventListener('pointermove', e => { if (dpad.classList.contains('active')) padPoint(e); });
['pointerup', 'pointercancel', 'lostpointercapture'].forEach(n => dpad.addEventListener(n, padEnd));
document.addEventListener('touchmove', e => e.preventDefault(), { passive: false });

/* Fit the game picture to the whole screen: 160 game pixels across the short side, the rest shows more of the world */
const gameEl = document.getElementById('game'), ctlEl = document.getElementById('ctl');
/* 竖屏时游戏整体转了 90 度：屏幕上的点、元素位置都要换算回游戏里的横向坐标 */
let ROT = false;
function toLocal(cx, cy) {
  const gr = gameEl.getBoundingClientRect();
  return ROT ? { x: cy - gr.top, y: gr.right - cx } : { x: cx - gr.left, y: cy - gr.top };
}
function localRect(el) {
  const r = el.getBoundingClientRect(), a = toLocal(r.left, r.top), b = toLocal(r.right, r.bottom);
  const left = Math.min(a.x, b.x), top = Math.min(a.y, b.y), right = Math.max(a.x, b.x), bottom = Math.max(a.y, b.y);
  return { left, top, right, bottom, width: right - left, height: bottom - top };
}
/* 手机上真正看得到的区域：Safari 的地址栏、工具栏会变来变去，转屏后 innerWidth 有时还是旧的 */
function viewSize() {
  const v = window.visualViewport, de = document.documentElement;
  const w = Math.round(v ? v.width * (v.scale || 1) : de.clientWidth || innerWidth), h = Math.round(v ? v.height * (v.scale || 1) : de.clientHeight || innerHeight);
  return [w || innerWidth, h || innerHeight];
}
let lastView = '';
function resize() {
  const [vw, vh] = viewSize(); lastView = vw + 'x' + vh;
  ROT = vh > vw;
  gameEl.classList.toggle('rot', ROT);
  Object.assign(gameEl.style, ROT ? { width: vh + 'px', height: vw + 'px', left: vw + 'px', top: '0px' } : { width: vw + 'px', height: vh + 'px', left: '0px', top: '0px', position: 'fixed' });
  const W = gameEl.clientWidth || innerWidth, H = gameEl.clientHeight || innerHeight;
  const sc0 = Math.min(W / 160, H / 144);
  GW = Math.max(160, Math.round(W / sc0)); GH = Math.max(144, Math.round(H / sc0));
  world.width = GW; world.height = GH; g.imageSmoothingEnabled = false;
  screen.width = GW * SCALE; screen.height = GH * SCALE;
  UX = Math.floor((GW - 160) / 2);
  UB = GH - 3;
  /* 菜单、对话框能用多宽：不压到两侧的摇杆和 AB 键 */
  const dr = localRect(ctlEl.querySelector('.dpad')), ar = localRect(ctlEl.querySelector('.ab'));
  const cx = UX + 80, l = dr.right / sc0, r = ar.left / sc0;
  SAFE_W = Math.max(160, Math.min(GW - 8, Math.floor(2 * Math.min(cx - l, r - cx)) - 4));
  /* 状态栏两侧的空位不够并排放两个小键时，改成竖着排 */
  gameEl.classList.toggle('narrow', UX * sc0 < 175);
  buildGrid();
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => { resize(); setTimeout(resize, 300); setTimeout(resize, 900); });
if (window.visualViewport) visualViewport.addEventListener('resize', resize);
/* 保险：每半秒核对一次，屏幕尺寸变了就重新排版 */
setInterval(() => { const [w, h] = viewSize(); if (w + 'x' + h !== lastView) resize(); }, 500);
/* 大地图打开时：点屏幕任意处返回 */
let fullMapOn = false;
screen.addEventListener('pointerdown', e => {
  const pt = toLocal(e.clientX, e.clientY), gx = pt.x / gameEl.clientWidth * GW, gy = pt.y / gameEl.clientHeight * GH;
  if (inspect) { inspect = null; sfx('menu'); return; }
  /* 联网时点一下别的玩家，查看他的装备和武功 */
  if (!fullMapOn && NET.online && S && map && !menu && !dlg) {
    const tx = Math.floor((gx + cam.x) / T), ty = Math.floor((gy + cam.y) / T), o = otherAt(tx, ty) || otherAt(tx, ty + 1);
    if (o) inspectPlayer(o);
    return;
  }
  if (!fullMapOn || !menu) return;
  menu = null;
  sfx('menu');
});
/* 安卓等支持的浏览器：全屏后锁定横屏 */
function lockLandscape() { try { const o = window.screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) {} }
lockLandscape(); window.addEventListener('pointerdown', lockLandscape, { once: true });
setPalette(palIdx); resize();


/* ---------- 快捷药格：点一下服用；按住半秒换成下一种药 ---------- */
const QUICK_ORDER = ['baoming', 'yulu', 'baiyao', 'yao', 'duanxu', 'xugu', 'dieda', 'qidan', 'qingxin', 'ganliang', 'niurou', 'hongshao', 'kaoyu', 'yutang', 'zhurou', 'tourou', 'jiu'];
const QUICK_SHORT = { baiyao: '白药', yulu: '玉露', duanxu: '断续', baoming: '保命', niurou: '牛肉', zhurou: '猪肉', hongshao: '鲤鱼', ganliang: '干粮' };
const quickEl = document.getElementById('quick'), qName = document.getElementById('qname'), qCnt = document.getElementById('qcnt');
const quickOwned = () => QUICK_ORDER.filter(k => S && (S.items[k] || 0) > 0);
function quickPick() { if (!S) return null; if (!(S.items[S.quick] > 0)) S.quick = quickOwned()[0] || null; return S.quick; }
function quickUse() {
  if (!S || mode !== 'play' || P.dead || dlg || menu) return;
  const k = quickPick(); if (!k) { toast('身上没有药，可以在药铺、货郎那里买'); return; }
  if (ITEMS[k].use()) { S.items[k]--; save(); }
}
function quickNext() {
  const own = quickOwned(); if (!own.length) { toast('身上没有药'); return; }
  S.quick = own[(own.indexOf(quickPick()) + 1) % own.length]; sfx('menu'); toast(`快捷药：${ITEMS[S.quick].name}`);
}
let quickT = null, quickLong = false;
quickEl.addEventListener('pointerdown', e => {
  e.preventDefault(); audioInit(); try { quickEl.setPointerCapture(e.pointerId); } catch (_) {}
  quickEl.classList.add('on'); quickLong = false;
  quickT = setTimeout(() => { quickLong = true; quickNext(); }, 450);
});
const quickUp = () => { if (!quickEl.classList.contains('on')) return; quickEl.classList.remove('on'); clearTimeout(quickT); if (!quickLong) quickUse(); };
quickEl.addEventListener('pointerup', quickUp);
quickEl.addEventListener('pointercancel', () => { quickEl.classList.remove('on'); clearTimeout(quickT); });
quickEl.addEventListener('contextmenu', e => e.preventDefault());
addEventListener('keydown', e => { if (e.key === 'q' && !e.repeat && document.activeElement.tagName !== 'INPUT') quickUse(); });
let quickShown = '';
function quickRefresh() {
  const k = S && mode === 'play' ? quickPick() : null, label = k ? `${QUICK_SHORT[k] || ITEMS[k].name.slice(0, 2)}|${S.items[k]}` : '药|—';
  if (label === quickShown) return; quickShown = label;
  const [a, b] = label.split('|'); qName.textContent = a; qCnt.textContent = k ? `×${b}` : '—'; quickEl.classList.toggle('empty', !k);
}
