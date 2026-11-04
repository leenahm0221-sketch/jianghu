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
function resize() {
  ROT = innerHeight > innerWidth;
  gameEl.classList.toggle('rot', ROT);
  Object.assign(gameEl.style, ROT ? { width: innerHeight + 'px', height: innerWidth + 'px', left: innerWidth + 'px' } : { width: '', height: '', left: '' });
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
  buildGrid();
}
addEventListener('resize', resize);
/* 大地图打开时：点上方「←」「→」换页，点其他地方返回 */
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
  if (gy < 16 && Math.abs(gx - GW / 2) < 70) menu.tab = (menu.tab + (gx < GW / 2 ? TABS.length - 1 : 1)) % TABS.length, menu.sel = 0;
  else menu = null;
  sfx('menu');
});
/* 安卓等支持的浏览器：全屏后锁定横屏 */
function lockLandscape() { try { const o = window.screen.orientation; if (o && o.lock) o.lock('landscape').catch(() => {}); } catch (e) {} }
lockLandscape(); window.addEventListener('pointerdown', lockLandscape, { once: true });
setPalette(palIdx); resize();

