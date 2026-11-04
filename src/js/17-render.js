/* ---------------- title ---------------- */
let titleOffline = false;
function titleOptions() {
  const off = hasSave() ? ['继续江湖', '新的江湖', '读取存档码'] : ['新的江湖', '读取存档码'];
  if (!NET.url) return off;
  return titleOffline ? [...off, '返回'] : ['联网江湖', '单机江湖'];
}
function updTitle() {
  const opts = titleOptions();
  if (pressed.up || pressed.down) { titleSel = (titleSel + 1) % opts.length; sfx('menu'); }
  if (pressed.a || pressed.start) {
    const o = opts[titleSel % opts.length];
    if (o === '新的江湖') { mode = 'naming'; askName('少侠尊姓大名？', randomName(), nm => beginGame(o, nm)); return; }
    if (o === '读取存档码') { openSaveBox('import'); return; }
    if (o === '单机江湖') { titleOffline = true; titleSel = 0; sfx('menu'); return; }
    if (o === '返回') { titleOffline = false; titleSel = 0; sfx('menu'); return; }
    if (o === '联网江湖') { const tk = getToken(); if (tk) { netAuth({ t: 'resume', token: tk }); toast('正在登录…'); setTimeout(() => { if (!NET.online && mode === 'title') openAuth('login'); }, 3500); } else openAuth('login'); return; }
    beginGame(o);
  }
}
function beginGame(o, nm, data) {
  {
    S = migrate(data || (o === '继续江湖' && loadSave()) || newState());
    if (nm) S.name = nm;
    fixState();
    mode = 'play'; dlg = null; menu = null; toasts = []; depleted = {}; mapState = {}; map = null;
    enterMap(S.map, S.x, S.y, S.dir);
    sfx('level');
    if (o === '新的江湖') say(null, ['牛家村，一个普通的早晨。', `你叫${S.name}，今年十六岁，只会一套太祖长拳。`, '武功都是越用越强：出拳练拳法，挨打练铁布衫，走路练草上飞。', '遇敌按一下 A，会自动锁定最近的敌人连续出招；按方向键就能脱离。', '四下无人时按 B 打坐，回复活力、内功和伤势。', '村长家门口的王村长头上有个“!”，先去找他吧。']);
  }
}
function renderTitle() {
  const B = UB;
  R(0, 0, GW, GH, 0);
  const sunX = GW - 42, sunY = B - 86;
  for (let y = -16; y <= 16; y++) for (let x = -16; x <= 16; x++) {
    if (x * x + y * y > 256) continue;
    const cut = y > 2 && (y + 20) % 5 < Math.min(3, (y - 1) / 4);
    if (!cut) R(sunX + x, sunY + y, 1, 1, 1);
  }
  for (let x = 0; x < GW; x++) {
    const h1 = B - 74 + 12 * Math.sin(x * 0.045 + 0.5) + 6 * Math.sin(x * 0.13);
    R(x, h1, 1, GH - h1, 1);
    const h2 = B - 52 + 9 * Math.sin(x * 0.07 + 2) + 4 * Math.sin(x * 0.21);
    R(x, h2, 1, GH - h2, 2);
    const cl = GW - 68;
    const h3 = x > cl ? B - 28 - Math.min(10, (x - cl) * 0.5) : B - 16 + 2 * Math.sin(x * 0.3);
    R(x, h3, 1, GH - h3, 3);
  }
  drawPerson(GW - 34, B - 54, 'left', 0, { body: 'changpao', hair: 'knot', weapon: 'tiejian', sil: true });
  const t = frame * 0.6;
  for (let i = 0; i < 3; i++) { const bx = (t * (0.4 + i * 0.15) + i * 60) % (GW + 30) - 15; R(bx, B - 94 + i * 8, 3, 1, 3); R(bx + 1, B - 95 + i * 8, 1, 1, 3); }
}
function renderTitleUI() {
  const top = Math.max(6, Math.floor((UB - 144) / 3));
  g.setTransform(1, 0, 0, 1, UX, top);
  txt('江湖少年', 80, 0, 3, 'center', 2);
  txt('第一章 牛家村 · 第二章 血刀', 80, 25, 2, 'center');
  txt(FAST ? 'v38 加速' : 'v38', 156, 0, 2, 'right');
  g.setTransform(1, 0, 0, 1, UX, UB - 144);
  const opts = titleOptions();
  const h = opts.length * 13 + 9;
  box(42, 106 - h, 76, h);
  opts.forEach((o, i) => {
    const sel = i === titleSel % opts.length;
    if (sel && frame % 40 < 28) txt('▶', 48, 106 - h + 5 + i * 13, 3);
    txt(o, 60, 106 - h + 5 + i * 13, 3);
  });
  g.setTransform(1, 0, 0, 1, 0, 0);
}
function drawTile(t, sx, sy, mx, my) {
  const hs = hash(mx, my);
  const grass = () => {
    if (map && map.ground === 'cave') { R(sx, sy, T, T, 2); if (hs % 3 === 0) R(sx + (hs % 12) + 2, sy + ((hs >> 4) % 12) + 2, 2, 1, 3); if (hs % 5 === 0) R(sx + ((hs >> 7) % 10) + 3, sy + ((hs >> 11) % 10) + 3, 1, 1, 1); return; }
    R(sx, sy, T, T, 0);
    const a = 2 + (hs % 9), b = 3 + ((hs >> 4) % 9), c = 3 + ((hs >> 8) % 9), d = 1 + ((hs >> 12) % 10);
    R(sx + a, sy + b, 1, 1, 1); R(sx + a + 2, sy + b, 1, 1, 1); R(sx + a + 1, sy + b + 1, 1, 1, 1);
    if (hs % 3) { R(sx + c, sy + d, 1, 1, 1); R(sx + c + 2, sy + d, 1, 1, 1); R(sx + c + 1, sy + d + 1, 1, 1, 1); }
  };
  const forest = () => {
    R(sx, sy, T, T, 1);
    R(sx + (hs % 13) + 1, sy + ((hs >> 5) % 13) + 1, 1, 1, 2);
    R(sx + ((hs >> 9) % 12) + 2, sy + ((hs >> 13) % 12) + 2, 2, 1, 2);
    if (hs % 5 === 0) { R(sx + 4, sy + 9, 3, 1, 2); R(sx + 5, sy + 8, 1, 1, 2); }
  };
  const inForest = map && map.ground === 'forest';
  const isSnow = map && map.ground === 'snow';
  function snow() { R(sx, sy, T, T, 0); if (hs % 3 === 0) R(sx + (hs % 12) + 2, sy + ((hs >> 4) % 12) + 2, 2, 1, 1); if (hs % 5 === 0) R(sx + ((hs >> 7) % 10) + 3, sy + ((hs >> 11) % 10) + 3, 3, 1, 1); }
  function flag_() {
    R(sx, sy, T, T, 0);
    R(sx, sy + 7, T, 1, 1); R(sx, sy + 15, T, 1, 1);
    R(sx + (my % 2 ? 4 : 11), sy, 1, 7, 1); R(sx + (my % 2 ? 12 : 3), sy + 8, 1, 7, 1);
  }
  const sand = () => { R(sx, sy, T, T, 0); if (hs % 4 === 0) R(sx + (hs % 11) + 2, sy + ((hs >> 4) % 11) + 2, 2, 1, 1); if (hs % 7 === 0) R(sx + ((hs >> 6) % 9) + 3, sy + ((hs >> 10) % 9) + 3, 3, 1, 1); };
  const base = () => (inForest ? forest() : isSnow ? snow() : map && map.ground === 'sand' ? sand() : grass());
  switch (t) {
    case '.': grass(); break;
    case 'H': if (isSnow) snow(); else if (map && map.hfloor === '_') flag_(); else base(); break;
    case '_': flag_(); break;
    case 'U':
      base(); R(sx + 1, sy + 3, 14, 13, 3); R(sx + 3, sy + 1, 10, 3, 3);
      R(sx + 1, sy + 3, 2, 2, 2); R(sx + 13, sy + 3, 2, 2, 2); R(sx + 5, sy + 13, 6, 1, 2); R(sx + 4, sy + 10, 8, 1, 2); R(sx + 6, sy + 7, 4, 1, 2);
      break;
    case '%': snow(); break;
    case '^':
      R(sx, sy, T, T, 1);
      for (let y = 0; y < 16; y += 4) { R(sx, sy + y, T, 1, 0); R(sx, sy + y + 3, T, 1, 2); }
      R(sx, sy, 1, T, 2); R(sx + 15, sy, 1, T, 2);
      break;
    case 'W':
      R(sx, sy, T, T, 2);
      for (let y = 5; y < 16; y += 4) { R(sx, sy + y, T, 1, 3); for (let x = (y % 8 === 1 ? 2 : 6); x < 16; x += 8) R(sx + x, sy + y + 1, 1, 3, 3); }
      R(sx, sy, T, 4, 3); R(sx + 1, sy, 5, 3, 1); R(sx + 10, sy, 5, 3, 1); R(sx, sy + 4, T, 1, 1);
      break;
    case 'Q':
      R(sx, sy, T, T, 2);
      for (let y = 9; y < 16; y += 3) R(sx, sy + y, T, 1, 3);
      R(sx - 2, sy + 1, 20, 2, 3); R(sx - 1, sy + 3, 18, 4, 3); R(sx, sy + 4, 16, 2, 2); R(sx - 3, sy, 2, 2, 3); R(sx + 17, sy, 2, 2, 3);
      R(sx + 6, sy + 9, 4, 6, 3); R(sx + 7, sy + 10, 2, 4, 1);
      break;
    case 'P':
      snow();
      R(sx + 7, sy + 12, 2, 4, 3);
      for (let y = 0; y < 13; y++) {
        const w = Math.min(14, 2 + (y % 5) * 2 + Math.floor(y / 5) * 2), x0 = sx + 8 - w / 2;
        R(x0, sy + y, w, 1, y % 5 < 2 ? 0 : y % 5 === 4 ? 3 : 2); R(x0, sy + y, 1, 1, 3); R(x0 + w - 1, sy + y, 1, 1, 3);
      }
      R(sx + 7, sy, 2, 1, 3);
      break;
    case 'k':
      grass();
      for (const [x, h] of [[2, 16], [7, 14], [12, 16]]) {
        R(sx + x, sy + 16 - h, 2, h, 2); R(sx + x, sy + 16 - h, 1, h, 3);
        for (let y = 16 - h + 3; y < 16; y += 4) R(sx + x - 1, sy + y, 4, 1, 3);
        R(sx + x + 2, sy + 16 - h + 2, 3, 1, 3); R(sx + x + 4, sy + 16 - h + 1, 1, 1, 3); R(sx + x - 3, sy + 16 - h + 6, 3, 1, 3);
      }
      break;
    case 'c':
      R(sx, sy, T, T, 2);
      R(sx, sy, T, 1, 3); R(sx, sy, 1, T, 3);
      R(sx + 2, sy + 2, 6, 2, 1); R(sx + 2, sy + 4, 2, 3, 1);
      R(sx + 9, sy + 5, 1, 6, 3); R(sx + 10, sy + 10, 4, 1, 3); R(sx + 4, sy + 11, 1, 4, 3);
      if (isSnow) R(sx, sy, T, 3, 0);
      break;
    case 'i':
      R(sx, sy, T, T, 1);
      R(sx + 2, sy + 3, 5, 1, 0); R(sx + 3, sy + 4, 2, 1, 0); R(sx + 9, sy + 9, 5, 1, 0); R(sx + 10, sy + 10, 2, 1, 0);
      R(sx + 6, sy + 6, 1, 4, 2); R(sx + 7, sy + 10, 3, 1, 2);
      if (tileAt(mx, my - 1) !== 'i') R(sx, sy, T, 1, 2);
      break;
    case 'm':
      base();
      R(sx + 7, sy + 8, 2, 8, 2); R(sx + 4, sy + 11, 3, 1, 2); R(sx + 9, sy + 10, 3, 1, 2);
      if (!isDepleted(mx, my)) for (const [bx, by] of [[4, 6], [11, 4], [7, 1]]) { R(sx + bx - 2, sy + by, 5, 4, 3); R(sx + bx - 3, sy + by + 1, 7, 2, 3); R(sx + bx - 1, sy + by + 1, 3, 2, 0); R(sx + bx - 2, sy + by + 1, 1, 1, 0); R(sx + bx + 2, sy + by + 2, 1, 1, 0); }
      break;
    case 'o':
      base();
      for (let y = 0; y < 10; y++) for (let x = 0; x < 14; x++) {
        const ddx = x - 6.5, ddy = y - 4.5, rr = ddx * ddx / 42 + ddy * ddy / 22;
        if (rr < 1) R(sx + 1 + x, sy + 6 + y, 1, 1, rr > 0.55 ? ((x + y) % 3 ? 1 : 3) : rr > 0.4 ? 3 : 2);
      }
      R(sx + 2, sy + 1, 1, 9, 3); R(sx + 13, sy + 1, 1, 9, 3); R(sx + 1, sy, 14, 2, 3); R(sx + 7, sy + 2, 2, 4, 3);
      break;
    case ';': forest(); break;
    case 'v':
      R(sx, sy, T, T, 2);
      R(sx + (hs % 13) + 1, sy + ((hs >> 5) % 13) + 1, 2, 1, 3); R(sx + ((hs >> 9) % 12) + 2, sy + ((hs >> 13) % 12) + 2, 1, 1, 1);
      if (hs % 4 === 0) { R(sx + 3, sy + 10, 4, 1, 3); R(sx + 6, sy + 11, 3, 1, 3); }
      break;
    case 'y':
      R(sx, sy, T, T, 0);
      for (let k = 0; k < 5; k++) R(sx + ((hs >> (k * 3)) % 15), sy + ((hs >> (k * 3 + 1)) % 15), 1, 1, 1);
      if (hs % 6 === 0) { R(sx + 6, sy + 7, 3, 2, 2); R(sx + 7, sy + 6, 1, 1, 2); }
      break;
    case 'q': {
      grass();
      for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) {
        const ddx = x - 7.5, ddy = y - 6.5, rr = ddx * ddx / 64 + ddy * ddy / 42;
        if (rr < 1) R(sx + x, sy + y, 1, 1, rr > 0.78 ? 3 : 2);
      }
      for (const [bx, by] of [[4, 3], [9, 2], [12, 6], [6, 7], [3, 9], [10, 9]]) { R(sx + bx - 1, sy + by, 3, 1, 0); R(sx + bx, sy + by - 1, 1, 3, 0); R(sx + bx, sy + by, 1, 1, 1); }
      R(sx + 6, sy + 12, 4, 4, 3); R(sx + 7, sy + 13, 1, 2, 2);
      break;
    }
    case '*': {
      base();
      if (isDepleted(mx, my)) { R(sx + 7, sy + 12, 2, 3, 2); R(sx + 6, sy + 14, 4, 1, 2); break; }
      const herb = ((RES_BONUS['*'] || {})[map && map.id] || [])[0];
      if (herb === 'renshen' || herb === 'sanqi') {
        /* 人参、三七：一圈掌状叶，中间顶着一簇浆果 */
        R(sx + 7, sy + 8, 2, 8, 2);
        for (const [lx, ly, w] of [[1, 9, 6], [9, 9, 6], [3, 6, 4], [9, 6, 4]]) { R(sx + lx, sy + ly, w, 2, 2); R(sx + lx, sy + ly, w, 1, 3); }
        for (const [bx, by] of [[6, 2], [8, 2], [7, 4], [5, 4], [9, 4], [7, 1]]) { R(sx + bx, sy + by, 2, 2, 3); if (herb === 'renshen') R(sx + bx, sy + by, 1, 1, 1); }
        break;
      }
      if (herb === 'fengmi') {
        /* 玉蜂蜜：花丛上有一只玉蜂飞来飞去 */
        for (const [bx, by] of [[4, 8], [10, 7], [7, 11]]) { R(sx + bx - 2, sy + by, 5, 3, 2); R(sx + bx - 1, sy + by - 1, 3, 5, 2); R(sx + bx, sy + by + 1, 1, 1, 0); }
        const b = Math.floor(frame / 10) % 4, bx = sx + 5 + [0, 3, 4, 1][b], by = sy + 2 + [0, 1, 3, 2][b];
        R(bx, by + 1, 3, 2, 3); R(bx, by, 1, 1, 0); R(bx + 2, by, 1, 1, 0);
        break;
      }
      if (hs % 3 === 0) {
        /* 另一种草药：细长的草茎，顶上结穗 */
        for (const [x, h] of [[4, 10], [7, 13], [10, 9], [12, 11]]) { R(sx + x, sy + 16 - h, 1, h, 3); R(sx + x - 1, sy + 16 - h, 3, 3, 2); R(sx + x, sy + 16 - h, 1, 1, 0); }
        break;
      }
      // 一丛草药：深色叶丛，上面开三朵白花
      for (let y = 0; y < 8; y++) for (let x = 0; x < 14; x++) {
        const ddx = x - 6.5, ddy = y - 4, rr = ddx * ddx / 42 + ddy * ddy / 18;
        if (rr < 1) R(sx + 1 + x, sy + 7 + y, 1, 1, rr > 0.6 ? 3 : (x + y) % 3 === 0 ? 1 : 2);
      }
      R(sx + 2, sy + 15, 12, 1, 2);
      for (const [bx, by] of [[4, 5], [8, 3], [12, 6]]) { R(sx + bx - 2, sy + by - 2, 5, 5, 3); R(sx + bx - 1, sy + by - 1, 3, 3, 0); R(sx + bx, sy + by, 1, 1, 2); }
      break;
    }
    case '&':
      base();
      if (isDepleted(mx, my)) { R(sx + 7, sy + 12, 2, 3, 2); break; }
      if ((((RES_BONUS['&'] || {})[map && map.id] || [])[0]) === 'xuelian') {
        /* 天山雪莲：白色重瓣，像一朵莲花 */
        for (const [px, py, w, h] of [[2, 8, 4, 5], [10, 8, 4, 5], [5, 5, 6, 8], [6, 3, 4, 4]]) { R(sx + px, sy + py, w, h, 3); R(sx + px + 1, sy + py + 1, w - 2, h - 2, 0); }
        R(sx + 7, sy + 7, 2, 2, 1); R(sx + 3, sy + 14, 10, 1, 2);
        break;
      }
      R(sx + 2, sy + 4, 12, 6, 3); R(sx + 4, sy + 3, 8, 1, 3); R(sx + 3, sy + 5, 10, 3, 2); R(sx + 4, sy + 5, 8, 1, 1);
      R(sx + 5, sy + 6, 1, 1, 0); R(sx + 9, sy + 6, 1, 1, 0); R(sx + 7, sy + 7, 1, 1, 0);
      R(sx + 6, sy + 10, 4, 5, 3); R(sx + 7, sy + 10, 2, 4, 0);
      break;
    case 'O': {
      base();
      const ore = ((RES_BONUS.O || {})[map && map.id] || [])[0], dep = isDepleted(mx, my);
      if (dep) { R(sx + 3, sy + 12, 4, 3, 2); R(sx + 9, sy + 13, 3, 2, 2); R(sx + 3, sy + 12, 4, 1, 3); break; }
      const dark = ore === 'wujin' || ore === 'xuantiekuang', ice = ore === 'hantie';
      /* 棱角矿块：一层层往上收的多边形 */
      const rows = [[5, 6], [3, 10], [2, 12], [1, 14], [1, 14], [1, 14], [2, 12], [2, 12], [3, 11], [4, 9], [5, 7]];
      rows.forEach(([x0, w], k) => { const y = sy + 4 + k; R(sx + x0, y, w, 1, dark ? 3 : 2); R(sx + x0, y, 1, 1, 3); R(sx + x0 + w - 1, y, 1, 1, 3); });
      R(sx + 5, sy + 4, 6, 1, 3); R(sx + 5, sy + 14, 7, 1, 3);
      if (ice) { /* 寒铁：冒出冰晶 */ for (const [cx, h] of [[4, 6], [8, 9], [12, 5]]) { R(sx + cx, sy + 11 - h, 2, h, 0); R(sx + cx - 1, sy + 11 - h + 1, 1, h - 1, 3); R(sx + cx + 2, sy + 11 - h + 1, 1, h - 1, 3); R(sx + cx, sy + 11 - h - 1, 2, 1, 3); } }
      else { /* 矿脉：亮色斜纹 */ const c = dark ? 1 : 0; R(sx + 3, sy + 8, 3, 1, c); R(sx + 5, sy + 7, 2, 1, c); R(sx + 9, sy + 10, 3, 1, c); R(sx + 11, sy + 9, 1, 1, c); R(sx + 6, sy + 12, 2, 1, c); if (ore === 'jingtie') { R(sx + 4, sy + 6, 7, 1, 1); R(sx + 7, sy + 11, 5, 1, 1); }
        /* 顶上冒出两三颗矿晶，一眼就和普通石头分开 */
        for (const [cx, h] of [[4, 4], [9, 6], [12, 3]]) { R(sx + cx, sy + 5 - h, 2, h + 1, dark ? 1 : 0); R(sx + cx - 1, sy + 5 - h + 1, 1, h, 3); R(sx + cx + 2, sy + 5 - h + 1, 1, h, 3); R(sx + cx, sy + 4 - h, 2, 1, 3); } }
      if ((frame + hs) % 90 < 10) { const px = sx + 4 + (hs % 8), py = sy + 6 + ((hs >> 3) % 5); R(px - 1, py, 3, 1, 0); R(px, py - 1, 1, 3, 0); }
      break;
    }
    case '=': case 'E':
      R(sx, sy, T, T, 0);
      R(sx + (hs % 13) + 1, sy + ((hs >> 5) % 13) + 1, 1, 1, 1);
      R(sx + ((hs >> 9) % 13) + 1, sy + ((hs >> 13) % 13) + 1, 2, 1, 1);
      if (tileAt(mx, my - 1) !== '=' && tileAt(mx, my - 1) !== 'E' && tileAt(mx, my - 1) !== 'B') R(sx, sy, T, 1, 1);
      if (tileAt(mx, my + 1) !== '=' && tileAt(mx, my + 1) !== 'E' && tileAt(mx, my + 1) !== 'B') R(sx, sy + 15, T, 1, 1);
      break;
    case ',': {
      R(sx, sy, T, T, 1);
      const sway = (Math.floor(frame / 30) + mx) % 2;
      for (let i = 0; i < 4; i++) { const x = sx + 1 + i * 4; R(x + sway, sy + 3, 1, 4, 2); R(x + 2, sy + 2, 1, 5, 2); R(x + 1, sy + 10, 1, 4, 2); R(x + 3 - sway, sy + 9, 1, 5, 2); }
      break;
    }
    case 'f':
      base();
      for (const [ox, oy] of [[4, 4], [10, 9]]) { R(sx + ox, sy + oy - 1, 1, 1, 2); R(sx + ox - 1, sy + oy, 3, 1, 2); R(sx + ox, sy + oy + 1, 1, 1, 2); R(sx + ox, sy + oy, 1, 1, 3); }
      break;
    case 'T': {
      if (inForest && hs % 3 === 0) { /* 林中的柏树：细高 */
        forest(); R(sx + 7, sy + 12, 2, 4, 3);
        for (let y = 0; y < 13; y++) { const w = Math.min(10, 2 + Math.round(Math.sin(y / 13 * Math.PI) * 9)), x0 = sx + 8 - Math.round(w / 2); R(x0, sy + y, w, 1, y % 3 === 2 ? 3 : 2); R(x0, sy + y, 1, 1, 3); R(x0 + w - 1, sy + y, 1, 1, 3); }
        break;
      }
      if (inForest) {
        forest();
        R(sx + 7, sy + 12, 2, 4, 3);
        for (let y = 0; y < 13; y++) {
          const w = Math.min(14, 2 + (y % 5) * 2 + Math.floor(y / 5) * 2), x0 = sx + 8 - w / 2;
          R(x0, sy + y, w, 1, y % 5 === 4 ? 3 : 2); R(x0, sy + y, 1, 1, 3); R(x0 + w - 1, sy + y, 1, 1, 3);
        }
        R(sx + 7, sy, 2, 1, 3);
        break;
      }
      const tv = hs % 5;
      if (tv === 1) { /* 松树：一层层的尖顶 */
        grass(); R(sx + 7, sy + 12, 2, 4, 3);
        for (let y = 0; y < 13; y++) { const w = Math.min(14, 2 + (y % 5) * 2 + Math.floor(y / 5) * 2), x0 = sx + 8 - w / 2; R(x0, sy + y, w, 1, y % 5 === 4 ? 3 : 2); R(x0, sy + y, 1, 1, 3); R(x0 + w - 1, sy + y, 1, 1, 3); }
        R(sx + 7, sy, 2, 1, 3); break;
      }
      if (tv === 2) { /* 柳树：树冠垂下一条条柳丝 */
        grass(); R(sx + 7, sy + 9, 2, 7, 3);
        for (let y = 0; y < 7; y++) for (let x = 0; x < 16; x++) { const dx = x - 7.5, dy = y - 3.5, r = dx * dx / 56 + dy * dy / 14; if (r < 1) R(sx + x, sy + y, 1, 1, r > 0.7 ? 3 : 2); }
        for (const [x, h] of [[1, 10], [3, 12], [5, 9], [10, 9], [12, 12], [14, 10]]) R(sx + x, sy + 4, 1, h, (x + my) % 2 ? 3 : 2);
        break;
      }
      if (tv === 3) { /* 果树：圆树冠上挂着果子 */
        R(sx, sy, T, T, 0);
        for (let y = 0; y < 12; y++) for (let x = 1; x < 15; x++) { const dx = x - 7.5, dy = y - 6, r = dx * dx / 50 + dy * dy / 36; if (r < 1) R(sx + x, sy + y, 1, 1, r > 0.75 ? 3 : 2); }
        for (const [fx, fy] of [[4, 4], [9, 3], [11, 7], [6, 8], [3, 8]]) { R(sx + fx, sy + fy, 2, 2, 0); R(sx + fx + 1, sy + fy + 1, 1, 1, 3); }
        R(sx + 6, sy + 11, 4, 5, 3); R(sx + 7, sy + 12, 1, 3, 2); break;
      }
      R(sx, sy, T, T, 0);
      for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) {
        const dx = x - 7.5, dy = y - 6.5, r = dx * dx / 64 + dy * dy / 42;
        if (r < 1) R(sx + x, sy + y, 1, 1, r > 0.78 ? 3 : (dx < -1 && dy < -1 && r < 0.45) ? 1 : 2);
      }
      R(sx + 5, sy + 3, 2, 1, 1); R(sx + 9, sy + 7, 1, 1, 1);
      R(sx + 6, sy + 12, 4, 4, 3); R(sx + 7, sy + 13, 1, 2, 2);
      break;
    }
    case 'M':
      R(sx, sy, T, T, 2);
      for (let i = 0; i < 16; i += 4) { R(sx + ((i + (hs % 4)) % 16), sy + i, 5, 1, 3); R(sx + ((i * 3 + 6) % 14), sy + i + 2, 3, 1, 1); }
      break;
    case '~': {
      R(sx, sy, T, T, 2);
      const o = Math.floor(frame / 12) % 8;
      for (const yy of [3, 10]) for (let x = 0; x < 16; x++) if ((x + o + (yy === 10 ? 4 : 0)) % 8 < 3) R(sx + x, sy + yy + ((x + o) % 8 === 1 ? -1 : 0), 1, 1, 1);
      break;
    }
    case 'B':
      R(sx, sy, T, T, 1);
      for (let x = 0; x < 16; x += 4) R(sx + x, sy, 1, T, 2);
      if (tileAt(mx, my - 1) !== 'B') R(sx, sy, T, 2, 3);
      if (tileAt(mx, my + 1) !== 'B') R(sx, sy + 14, T, 2, 3);
      break;
    case 'R':
      R(sx, sy, T, T, 2);
      for (let y = 3; y < 16; y += 4) R(sx, sy + y, T, 1, 3);
      for (let y = 1; y < 16; y += 4) for (let x = (y % 8 === 1 ? 0 : 2); x < 16; x += 4) R(sx + x, sy + y, 1, 2, 1);
      if (tileAt(mx, my - 1) !== 'R') R(sx, sy, T, 1, 3);
      break;
    case '#': case 'D':
      R(sx, sy, T, T, 0);
      for (let y = 0; y < 16; y += 5) R(sx, sy + y, T, 1, 1);
      for (let y = 0; y < 16; y += 5) for (let x = ((y / 5) % 2) * 4; x < 16; x += 8) R(sx + x, sy + y, 1, 5, 1);
      R(sx, sy + 15, T, 1, 2);
      if (tileAt(mx, my - 1) === 'R') R(sx, sy, T, 2, 3);
      if (t === 'D') { R(sx + 3, sy + 3, 10, 13, 3); R(sx + 4, sy + 4, 8, 12, 2); R(sx + 7, sy + 4, 1, 12, 3); R(sx + 9, sy + 10, 1, 1, 0); R(sx + 5, sy + 10, 1, 1, 0); }
      else if ((mx + my) % 3 === 0) { R(sx + 4, sy + 4, 8, 6, 3); R(sx + 5, sy + 5, 6, 4, 1); R(sx + 7, sy + 5, 1, 4, 3); R(sx + 5, sy + 7, 6, 1, 3); }
      break;
    case 'F':
      grass();
      R(sx, sy + 5, T, 2, 2); R(sx, sy + 11, T, 2, 2); R(sx, sy + 5, T, 1, 3);
      R(sx + 2, sy + 2, 2, 13, 3); R(sx + 12, sy + 2, 2, 13, 3);
      break;
    case 'r':
      base();
      for (let y = 0; y < 12; y++) for (let x = 0; x < 14; x++) {
        const dx = x - 6.5, dy = y - 5.5, r = dx * dx / 42 + dy * dy / 30;
        if (r < 1) R(sx + 1 + x, sy + 3 + y, 1, 1, r > 0.75 ? 3 : (dx < 0 && dy < 0) ? 1 : 2);
      }
      R(sx + 8, sy + 9, 3, 1, 3);
      break;
    case 'S':
      grass();
      R(sx + 7, sy + 9, 2, 7, 3);
      R(sx + 1, sy + 2, 14, 8, 3); R(sx + 2, sy + 3, 12, 6, 1);
      R(sx + 4, sy + 5, 8, 1, 2); R(sx + 4, sy + 7, 5, 1, 2);
      break;
    case 'J': {
      grass();
      const seen = S && S.found && S.found.includes(map.id + ':' + mx + ',' + my);
      R(sx + 2, sy + 13, 12, 3, 3); R(sx + 3, sy + 1, 10, 13, 3); R(sx + 4, sy + 2, 8, 11, seen ? 2 : 1);
      R(sx + 5, sy + 1, 6, 1, 3);
      for (const cx of [6, 9]) for (let yy = 4; yy < 12; yy += 2) R(sx + cx, sy + yy, 1, 1, 3);
      break;
    }
    case 'X': {
      grass();
      const open = S && S.flags['chest_' + (map && map.id) + `${mx},${my}`];
      R(sx + 1, sy + 15, 14, 1, 2);
      R(sx + 1, sy + 7, 14, 8, 3); R(sx + 2, sy + 8, 12, 6, open ? 3 : 1);
      if (!open) {
        R(sx + 1, sy + 3, 14, 5, 3); R(sx + 2, sy + 4, 12, 3, 1); R(sx + 2, sy + 4, 12, 1, 0);
        R(sx + 4, sy + 3, 1, 12, 3); R(sx + 11, sy + 3, 1, 12, 3);
        R(sx + 6, sy + 6, 4, 4, 3); R(sx + 7, sy + 7, 2, 2, 0);
      } else { R(sx + 1, sy + 1, 14, 4, 3); R(sx + 2, sy + 2, 12, 2, 2); }
      break;
    }
    default: R(sx, sy, T, T, 0);
  }
}

/* 中式建筑：按 style 画出不同形制。hall 单檐、tall 两层楼阁、double 重檐大殿、pagoda 宝塔；kind 决定招牌与装饰；snow 雪顶 */
function drawBuilding(b, sx, sy) {
  const W = b.w * T, H = b.h * T, cx = W / 2;
  const r = (x, y, w, h, c) => R(sx + x, sy + y, w, h, c);
  const roof = (x0, y0, w, h) => {
    r(x0 + 8, y0, w - 16, 2, 3); r(x0 + 6, y0 - 2, 3, 4, 3); r(x0 + 5, y0 - 3, 2, 2, 3); r(x0 + w - 9, y0 - 2, 3, 4, 3); r(x0 + w - 7, y0 - 3, 2, 2, 3);
    const rows = h - 4;
    for (let i = 0; i < rows; i++) {
      const y = y0 + 2 + i, ins = Math.max(1, Math.round(8 * (1 - i / rows)) + 1);
      const snowy = b.snow && i < rows * 0.45;
      r(x0 + ins, y, w - ins * 2, 1, snowy ? 0 : 2);
      if (!snowy) for (let x = x0 + ins + 2; x < x0 + w - ins - 1; x += 4) r(x, y, 1, 1, 3);
      if (!snowy && i % 4 === 3) for (let x = x0 + ins + 3; x < x0 + w - ins - 1; x += 4) r(x, y, 1, 1, 1);
      if (snowy && i % 2) for (let x = x0 + ins + 3; x < x0 + w - ins - 1; x += 7) r(x, y, 1, 1, 1);
      r(x0 + ins, y, 1, 1, 3); r(x0 + w - ins - 1, y, 1, 1, 3);
    }
    r(x0, y0 + h - 2, w, 2, 3);
    r(x0 - 1, y0 + h - 4, 3, 2, 3); r(x0 - 2, y0 + h - 6, 2, 2, 3); r(x0 + w - 2, y0 + h - 4, 3, 2, 3); r(x0 + w, y0 + h - 6, 2, 2, 3);
    if (b.snow) { r(x0 + 1, y0 + h - 3, w - 2, 1, 0); }
  };
  const wall = (x0, y0, w, h) => {
    r(x0, y0, w, h, 3); r(x0 + 1, y0, w - 2, h - 1, 1);
    r(x0 + 1, y0 + h - 8, w - 2, 7, 2); for (let x = x0 + 3; x < x0 + w - 2; x += 5) r(x, y0 + h - 8, 1, 7, 3); r(x0 + 1, y0 + h - 5, w - 2, 1, 3);
  };
  const pillars = (y0, h, xs) => xs.forEach(x => { r(x, y0, 4, h, 3); r(x + 1, y0, 1, h, 2); });
  const lattice = (x, y, w = 14, h = 13) => { r(x, y, w, h, 3); r(x + 1, y + 1, w - 2, h - 2, 0); for (let i = x + 4; i < x + w - 1; i += 3) r(i, y + 1, 1, h - 2, 3); for (let j = y + 4; j < y + h - 1; j += 3) r(x + 1, j, w - 2, 1, 3); };
  const moon = (x, y) => { for (let j = 0; j < 13; j++) for (let i = 0; i < 13; i++) { const d = (i - 6) ** 2 + (j - 6) ** 2; if (d <= 42) r(x + i, y + j, 1, 1, d > 30 ? 3 : (i === 6 || j === 6) ? 3 : 0); } };
  const door = (bot) => { r(cx - 7, bot - 13, 14, 13, 3); r(cx - 6, bot - 12, 5, 12, 2); r(cx + 1, bot - 12, 5, 12, 2); r(cx - 2, bot - 6, 1, 1, 0); r(cx + 1, bot - 6, 1, 1, 0); r(cx - 9, bot, 18, 3, 3); r(cx - 8, bot + 1, 16, 1, 1); };
  const base = (bot) => { r(1, bot, W - 2, 3, 3); r(2, bot + 1, W - 4, 1, 2); };
  const plaque = (y, label) => { const w = tw(label) + 8, px = Math.round(cx - w / 2); r(px, y, w, 12, 3); r(px + 1, y + 1, w - 2, 10, 2); r(px + 2, y + 2, w - 4, 8, 3); txt(label, sx + px + 4, sy + y, 0); };
  const flag = (x, y, ch) => { r(x + 4, y - 6, 1, 32, 3); r(x - 6, y, 10, 18, 3); r(x - 5, y + 1, 8, 15, 0); r(x - 5, y + 16, 2, 2, 3); r(x + 1, y + 16, 2, 2, 3); txt(ch, sx + x - 6, sy + y + 3, 3); };
  const lantern = (x, y) => { r(x + 2, y, 1, 2, 3); r(x, y + 2, 5, 7, 3); r(x + 1, y + 3, 3, 5, 1); r(x + 1, y + 5, 3, 1, 3); r(x + 2, y + 9, 1, 2, 3); };
  const rack = (x, y) => { r(x, y, 16, 12, 3); r(x + 1, y + 1, 14, 10, 0); r(x + 3, y + 2, 1, 9, 3); r(x + 2, y + 2, 3, 1, 3); r(x + 7, y + 3, 1, 8, 3); r(x + 6, y + 5, 3, 1, 3); r(x + 11, y + 2, 2, 5, 3); r(x + 12, y + 7, 1, 4, 3); };

  if (b.style === 'pagoda') {
    r(cx - 1, -2, 2, 6, 3); r(cx - 2, 2, 4, 1, 3);
    for (let i = 0; i < 4; i++) {
      const y = 4 + i * 14, rw = 16 + i * 4;
      r(cx - rw / 2 + 4, y + 3, rw - 8, 10, 3); r(cx - rw / 2 + 5, y + 3, rw - 10, 9, 1); r(cx - 1, y + 6, 2, 4, 3);
      r(cx - rw / 2, y, rw, 3, b.snow ? 0 : 3); r(cx - rw / 2, y + 2, rw, 1, 3); r(cx - rw / 2 - 1, y - 1, 2, 2, 3); r(cx + rw / 2 - 1, y - 1, 2, 2, 3);
    }
    r(cx - 14, H - 4, 28, 4, 3); r(cx - 13, H - 3, 26, 1, 2);
    return;
  }
  let wallTop, bot = H - 3;
  const look = b.style !== 'hall' ? b.style : (BUILD_LOOK[b.kind] || 'hall');
  /* 茅草屋：圆鼓鼓的草顶、土墙木框、小方窗、柴堆和篱笆 */
  if (look === 'thatch') {
    const top = 4, eave = 22;
    for (let y = top; y < eave; y++) {
      const t = (y - top) / (eave - top), ins = Math.round(14 * (1 - Math.sin(t * Math.PI / 2)) ) + 2;
      r(ins, y, W - ins * 2, 1, y === top ? 3 : 1);
      r(ins, y, 1, 1, 3); r(W - ins - 1, y, 1, 1, 3);
      for (let x = ins + 2 + (y % 3); x < W - ins - 2; x += 5) r(x, y, 1, 2, 2);
    }
    for (let x = 1; x < W - 1; x += 3) r(x, eave, 2, 2 + ((x / 3) % 2), 2);
    r(1, eave, W - 2, 1, 3);
    r(cx - 10, 2, 20, 2, 3);
    wallTop = eave + 2;
    r(5, wallTop, W - 10, bot - wallTop, 3); r(6, wallTop, W - 12, bot - wallTop - 1, 1);
    for (let y = wallTop + 3; y < bot - 2; y += 4) for (let x = 8 + (y % 8 ? 0 : 3); x < W - 8; x += 7) r(x, y, 2, 1, 2);
    r(6, wallTop + 2, W - 12, 1, 3); [6, cx - 9, cx + 8, W - 9].forEach(x => r(x, wallTop, 3, bot - wallTop, 3));
    const win = x => { r(x, wallTop + 5, 11, 9, 3); r(x + 1, wallTop + 6, 9, 7, 0); for (let i = x + 3; i < x + 10; i += 3) r(i, wallTop + 6, 1, 7, 3); };
    win(12); win(W - 23);
    r(cx - 6, bot - 14, 12, 14, 3); r(cx - 5, bot - 13, 10, 13, 2); r(cx - 5, bot - 9, 10, 1, 3); r(cx + 2, bot - 7, 1, 2, 0);
    r(cx - 8, bot, 16, 2, 2);
    for (let i = 0; i < 3; i++) { r(W - 6 - i * 0, bot - 3 - i * 3, 6, 3, 3); r(W - 5, bot - 2 - i * 3, 4, 1, 1); }
    for (let x = 0; x < 5; x += 2) { r(x, bot - 7, 1, 9, 3); } r(0, bot - 5, 5, 1, 3); r(0, bot - 2, 5, 1, 3);
    if (b.label) plaque(wallTop - 3, b.label);
    return;
  }
  /* 店铺：短屋檐、布篷、敞开的柜台摆着货，铁匠铺有烟囱冒烟 */
  if (look === 'shop') {
    roof(0, 1, W, 13);
    wallTop = 14;
    r(3, wallTop, W - 6, bot - wallTop, 3); r(4, wallTop, W - 8, bot - wallTop - 1, 1);
    pillars(wallTop, bot - wallTop, [3, W - 7]);
    const aw = wallTop + 12;
    r(2, aw, W - 4, 2, 3);
    for (let x = 3; x < W - 3; x += 8) { r(x, aw + 2, 8, 5, 3); r(x + 1, aw + 2, 3, 4, 0); r(x + 4, aw + 2, 3, 4, 2); r(x + 1, aw + 6, 6, 1, 3); }
    const ct = aw + 7;
    r(7, ct, W - 14, bot - ct, 3); r(8, ct + 1, W - 16, bot - ct - 1, 2);
    r(6, bot - 7, W - 12, 2, 3); r(7, bot - 5, W - 14, 5, 1);
    for (let x = 9; x < W - 9; x += 4) r(x, bot - 4, 1, 4, 3);
    if (b.kind === 'smith') {
      r(W - 20, -6, 8, 14, 3); r(W - 19, -5, 6, 13, 2);
      const sm = (frame / 10) % 12; r(W - 18 + Math.round(Math.sin(frame / 15) * 2), -10 - sm, 4, 3, 1); r(W - 19, -16 - sm / 2, 3, 2, 1);
      for (let i = 0; i < 4; i++) { const x = 12 + i * 6; r(x, ct + 2, 1, 9, 0); r(x - 1, ct + 2, 3, 2, 0); }
      r(W - 26, bot - 12, 14, 3, 3); r(W - 24, bot - 9, 10, 2, 3); r(W - 22, bot - 7, 6, 2, 3); r(W - 25, bot - 12, 12, 1, 0);
      if (frame % 40 < 6) { r(W - 20, bot - 15, 1, 1, 0); r(W - 17, bot - 16, 1, 1, 0); r(W - 23, bot - 15, 1, 1, 0); }
    } else if (b.kind === 'pharmacy') {
      for (let j = 0; j < 2; j++) for (let i = 0; i < 6; i++) { const x = 10 + i * 10, y = ct + 2 + j * 6; if (x + 8 > W - 9) continue; r(x, y, 8, 5, 3); r(x + 1, y + 1, 6, 3, 1); r(x + 3, y + 2, 2, 1, 3); }
      const gx = W - 12, gy = aw + 8; r(gx + 2, gy, 1, 3, 3); r(gx, gy + 3, 5, 4, 3); r(gx + 1, gy + 4, 3, 2, 0); r(gx - 1, gy + 7, 7, 7, 3); r(gx, gy + 8, 5, 5, 0); r(gx + 1, gy + 9, 1, 2, 1);
    } else if (b.kind === 'cloth') {
      for (let i = 0; i < 7; i++) { const x = 9 + i * 7; if (x + 5 > W - 8) break; r(x, ct + 1, 5, 12, 3); r(x + 1, ct + 1, 3, 11, i % 2 ? 0 : 1); if (i % 2) for (let y = ct + 3; y < ct + 12; y += 3) r(x + 1, y, 3, 1, 2); }
    }
    if (b.label) plaque(wallTop + 1, b.label);
    return;
  }
  /* 大院门楼：一道高墙，中间是带小屋顶的门楼和大门，墙后露出正房屋脊 */
  if (look === 'gate') {
    roof(6, 1, W - 12, 13);
    r(9, 14, W - 18, 4, 3); r(10, 14, W - 20, 3, 2);
    const wt = 22;
    r(0, wt, W, 3, 3); for (let x = 1; x < W - 1; x += 3) r(x, wt + 1, 2, 1, 2);
    r(0, wt + 3, W, bot - wt - 3, 3); r(1, wt + 3, W - 2, bot - wt - 4, 0);
    r(1, bot - 5, W - 2, 4, 1); for (let x = 2; x < W - 2; x += 6) r(x, bot - 5, 1, 4, 3);
    const gw = 30, gx = cx - gw / 2;
    roof(gx - 4, wt - 8, gw + 8, 11);
    r(gx, wt + 3, gw, bot - wt - 3, 3); r(gx + 2, wt + 3, 2, bot - wt - 3, 2); r(gx + gw - 4, wt + 3, 2, bot - wt - 3, 2);
    r(cx - 9, bot - 16, 18, 16, 3); r(cx - 8, bot - 15, 7, 15, 2); r(cx + 1, bot - 15, 7, 15, 2);
    for (let y = bot - 13; y < bot - 1; y += 4) for (const x of [cx - 6, cx - 3, cx + 3, cx + 6]) r(x, y, 1, 1, 0);
    r(cx - 11, bot, 22, 3, 3); r(cx - 10, bot + 1, 20, 1, 1);
    r(cx - 15, bot - 5, 4, 5, 3); r(cx + 11, bot - 5, 4, 5, 3);
    if (b.kind === 'escort') { flag(8, wt - 10, '镖'); flag(W - 4, wt - 10, '镖'); }
    if (b.kind === 'school') { rack(4, wt + 6); rack(W - 20, wt + 6); }
    if (b.kind === 'bank') { for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) { const d = (i - 4) ** 2 + (j - 4) ** 2; if (d <= 18) r(8 + i, wt + 7 + j, 1, 1, d > 11 ? 3 : (Math.abs(i - 4) <= 1 && Math.abs(j - 4) <= 1) ? 3 : 1); } lattice(W - 22, wt + 6, 14, 10); }
    if (b.label) plaque(wt - 1, b.label);
    return;
  }
  /* 庙宇道观：红柱大殿，门前石阶和香炉 */
  if (look === 'temple') {
    roof(0, 1, W, 18);
    r(3, 19, W - 6, 2, 3); for (let x = 6; x < W - 6; x += 6) r(x, 19, 2, 1, 1);
    wallTop = 21;
    r(3, wallTop, W - 6, bot - wallTop - 4, 3); r(4, wallTop, W - 8, bot - wallTop - 5, 1);
    for (const x of [3, 16, cx - 9, cx + 6, W - 19, W - 6]) { r(x, wallTop, 3, bot - wallTop - 4, 3); r(x + 1, wallTop, 1, bot - wallTop - 4, 2); }
    moon(cx - 30 < 6 ? 6 : 7, wallTop + 4); moon(W - 20, wallTop + 4);
    r(cx - 7, bot - 17, 14, 13, 3); r(cx - 6, bot - 16, 5, 12, 2); r(cx + 1, bot - 16, 5, 12, 2);
    for (let i = 0; i < 3; i++) { r(cx - 10 - i * 3, bot - 4 + i * 2, 20 + i * 6, 2, 3); r(cx - 9 - i * 3, bot - 4 + i * 2, 18 + i * 6, 1, i === 2 ? 1 : 0); }
    const dx0 = 2; r(dx0 + 1, bot - 8, 9, 6, 3); r(dx0 + 2, bot - 7, 7, 3, 2); r(dx0, bot - 9, 11, 1, 3); r(dx0 + 2, bot - 2, 1, 2, 3); r(dx0 + 8, bot - 2, 1, 2, 3);
    const sm = (frame / 8) % 10; r(dx0 + 5 + Math.round(Math.sin(frame / 12)), bot - 12 - sm, 1, 3, 2);
    if (b.label) plaque(wallTop, b.label);
    return;
  }
  /* 客栈：屋檐下一排小窗和栏杆，门口挂“客”字幌子和灯笼 */
  if (look === 'inn') {
    roof(0, 1, W, 14);
    wallTop = 15;
    r(3, wallTop, W - 6, bot - wallTop, 3); r(4, wallTop, W - 8, bot - wallTop - 1, 1);
    for (let x = 6; x < W - 10; x += 12) { r(x, wallTop + 2, 9, 7, 3); r(x + 1, wallTop + 3, 7, 5, 0); r(x + 4, wallTop + 3, 1, 5, 3); }
    r(2, wallTop + 11, W - 4, 2, 3); for (let x = 3; x < W - 3; x += 3) r(x, wallTop + 13, 1, 4, 3); r(2, wallTop + 17, W - 4, 1, 3);
    pillars(wallTop + 18, bot - wallTop - 18, [4, W - 8]);
    door(bot); base(bot);
    lantern(14, wallTop + 18); lantern(W - 19, wallTop + 18);
    flag(W - 2, wallTop - 6, '客');
    if (b.label) plaque(wallTop + 18, b.label);
    return;
  }
  if (b.style === 'tall') {
    roof(4, 1, W - 8, 16);
    wall(7, 17, W - 14, 15);
    for (let x = 12; x < W - 20; x += 18) lattice(x, 19, 12, 9);
    r(3, 29, W - 6, 1, 3); for (let x = 4; x < W - 4; x += 3) r(x, 30, 1, 3, 3); r(3, 33, W - 6, 1, 3);
    roof(0, 33, W, 10);
    wallTop = 43;
  } else if (b.style === 'double') {
    roof(Math.round(W * 0.18), 1, Math.round(W * 0.64), 13);
    wall(Math.round(W * 0.25), 14, Math.round(W * 0.5), 6);
    roof(0, 19, W, 18);
    wallTop = 37;
  } else {
    roof(0, 1, W, 18);
    r(3, 19, W - 6, 2, 3); for (let x = 6; x < W - 6; x += 6) r(x, 19, 2, 1, 1);
    wallTop = 21;
  }
  wall(3, wallTop, W - 6, bot - wallTop);
  pillars(wallTop, bot - wallTop, [3, cx - 12, cx + 8, W - 7]);
  const wy = wallTop + 6, lx = 9, rx = W - 23;
  if (b.kind === 'temple' || b.kind === 'nunnery' || b.kind === 'hall') { moon(lx, wy); moon(rx, wy); }
  else if (b.kind === 'smith' || b.kind === 'school') { rack(lx - 1, wy); if (b.kind === 'school') rack(rx - 1, wy); else lattice(rx, wy); }
  else if (b.kind === 'pawn') { r(lx - 1, wy - 2, 16, 18, 3); r(lx, wy - 1, 14, 16, 0); txt('当', sx + lx + 2, sy + wy + 2, 3); lattice(rx, wy); }
  else if (b.kind === 'bank') {
    lattice(lx, wy); lattice(rx, wy);
    for (let j = 0; j < 9; j++) for (let i = 0; i < 9; i++) { const d = (i - 4) ** 2 + (j - 4) ** 2; if (d <= 18) r(cx - 4 + i, wallTop + 1 + j, 1, 1, d > 11 ? 3 : (Math.abs(i - 4) <= 1 && Math.abs(j - 4) <= 1) ? 3 : 0); }
  }
  else if (b.kind === 'house') { lattice(lx, wy, 12, 11); lattice(W - 21, wy, 12, 11); }
  else { lattice(lx, wy); lattice(rx, wy); }
  door(bot);
  base(bot);
  if (b.label && b.kind !== 'bank') plaque(b.style === 'tall' ? 18 : wallTop, b.label);
  if (b.kind === 'bank') plaque(wallTop + 11 > bot - 26 ? wallTop : bot - 27, b.label);
  if (b.kind === 'inn') { lantern(20, wallTop - 1); lantern(W - 25, wallTop - 1); }
  if (b.kind === 'tavern') { flag(W - 4, 18, '酒'); lantern(10, 42); lantern(W - 15, 42); }
  if (b.kind === 'escort') flag(W - 4, wallTop - 4, '镖');
  if (b.kind === 'pharmacy') { r(W - 16, wallTop, 1, 3, 3); r(W - 18, wallTop + 3, 5, 4, 3); r(W - 17, wallTop + 4, 3, 2, 1); r(W - 19, wallTop + 7, 7, 7, 3); r(W - 18, wallTop + 8, 5, 5, 1); r(W - 17, wallTop + 9, 1, 2, 0); }
  if (b.kind === 'hall') { r(cx - 4, bot + 3, 8, 1, 3); }
}
/* 没指定样式的房子按用途选外观 */
const BUILD_LOOK = { chief: 'thatch', house: 'thatch', smith: 'shop', pharmacy: 'shop', cloth: 'shop', bank: 'gate', escort: 'gate', school: 'gate', temple: 'temple', nunnery: 'temple', inn: 'inn' };
/* 人物：衣服、头戴、背上的兵器都按装备分别绘制 */
const BODY = {
  buyi: { f: 0, belt: 2, pants: 2 },                                  // 粗布短衣：浅色上衣，深色裤
  jinzhuang: { f: 3, belt: 0, pants: 3, collar: 0, cuff: 0, wrap: 1 }, // 黑色劲装：全黑，白腰带白护腕
  changpao: { f: 2, belt: 3, collar: 0, long: true },                 // 青布长袍：中间色长袍到脚
  daopao: { f: 0, belt: 3, collar: 3, long: true, hem: 3 },           // 道袍：白袍黑边
  heipao: { f: 3, belt: 1, collar: 1, long: true, hem: 1 },           // 深色长袍
  apron: { f: 1, belt: 3, pants: 2, apron: 0 },                       // 掌柜：围裙
  vest: { f: 3, belt: 1, pants: 2, bare: true },                      // 铁匠：坎肩露臂
  shoupi: { f: 1, belt: 3, pants: 2, fur: 3 },                        // 兽皮袄：毛边、斑点
  xiongpijia: { f: 3, belt: 1, pants: 3, fur: 2, pad: 2, wrap: 1 },   // 熊皮甲：深色、护肩
  patched: { f: 1, belt: 3, pants: 2, patch: true },
  jinsijia: { f: 0, belt: 3, pants: 3, pad: 3, collar: 3, fur: 1 },
  wucanyi: { f: 3, belt: 1, pants: 3, collar: 1, cuff: 1, fur: 2 },                  // 丐帮：满身补丁
  sengyi: { f: 2, belt: 3, long: true, collar: 1 },                   // 僧衣
  kasaya: { f: 1, belt: 3, long: true, hem: 3, sash: true },          // 袈裟：斜披
  nun: { f: 1, belt: 2, long: true, collar: 0, hem: 2 },              // 尼姑灰袍
  armor: { f: 2, belt: 3, pants: 3, pad: 1, wrap: 1 },                // 兵士铠甲
  mjrobe: { f: 3, belt: 2, long: true, collar: 0, hem: 0 },           // 明教黑袍白边
  ryrobe: { f: 3, belt: 0, long: true, collar: 1, hem: 1, sash: true }, // 日月教服：黑袍斜带
  thshan: { f: 0, belt: 2, long: true, collar: 2, hem: 2 },          // 桃花青衫：浅色长衫
  wdpao: { f: 1, belt: 3, collar: 3, long: true, hem: 3 },           // 武当道袍：灰袍黑边
  hsshan: { f: 0, belt: 3, long: true, collar: 3, hem: 1 },          // 华山青衫：浅衫黑领
  tmjin: { f: 3, belt: 1, pants: 3, collar: 1, cuff: 1, wrap: 1 },  // 唐门劲装：黑衣、护腕、暗器囊
  gmbai: { f: 0, belt: 0, long: true, collar: 1, hem: 0 },           // 古墓白衣：一身素白
  xxpao: { f: 2, belt: 0, long: true, collar: 0, hem: 0, sash: true }, // 星宿彩袍：花哨斜带
  wduyi: { f: 2, belt: 0, pants: 3, collar: 0, cuff: 0, patch: true }, // 五毒苗衣：花边短衣
};
const WEAPON_LOOK = {
  tiejian: { line: 3, core: 1, hilt: 3, guard: 3, tassel: false, broad: false },
  qinggang: { line: 3, core: 0, hilt: 1, guard: 3, tassel: true, broad: false },
  dao: { line: 3, core: 2, hilt: 3, guard: 3, tassel: false, broad: true },
  gangdao: { line: 3, core: 0, hilt: 3, guard: 3, tassel: false, broad: true },
  changqiang: { kind: 'spear' },
  tiechui: { kind: 'hammer' },
  xuantie: { line: 3, core: 3, hilt: 3, guard: 3, tassel: true, broad: true },
  tulong: { line: 3, core: 1, hilt: 3, guard: 3, tassel: true, broad: true },
  bawang: { kind: 'spear' },
  guitou: { line: 3, core: 2, hilt: 3, guard: 3, tassel: true, broad: true },
  hantiedao: { line: 3, core: 0, hilt: 3, guard: 3, tassel: false, broad: true },
  hantiejian: { line: 3, core: 0, hilt: 3, guard: 3, tassel: false, broad: false },
  lihua: { kind: 'spear' }, hantieqiang: { kind: 'spear' }, baleng: { kind: 'hammer' }, wujinchui: { kind: 'hammer' },
  zijin: { kind: 'hammer' },
};
function drawPerson(sx, sy, dir, step, L, flash) {
  if (flash) return;
  const fl = dir === 'left', side = fl || dir === 'right', up = dir === 'up';
  const C = c => (L.sil ? 3 : L.ghost ? (c === 3 ? 2 : 1) : c);
  const p = (x, y, w, h, c) => R(sx + (fl ? 16 - x - w : x), sy + y, w, h, C(c));
  const B = BODY[L.body] || BODY.buyi;
  const W = L.weapon ? WEAPON_LOOK[L.weapon] || WEAPON_LOOK.tiejian : null;
  // 长枪、铁锤：竖在身后，比人还高 / 锤头很大
  if (W && W.kind && !up) {
    const x = side ? 2 : 13;
    if (W.kind === 'spear') { p(x, -3, 1, 18, 3); p(x - 1, -5, 3, 2, 3); p(x, -6, 1, 1, 3); p(x - 1, -3, 3, 1, 1); }
    else { p(x, 3, 1, 10, 3); p(x - 2, -1, 5, 4, 3); p(x - 1, 0, 3, 2, 2); }
  }
  // 背上的刀剑（正面、侧面时先画，让身体挡住中段）
  if (W && !W.kind && !up) {
    if (side) {
      p(2, 2, 1, 4, W.hilt); p(1, 6, 3, 1, W.guard);
      p(2, 7, W.broad ? 3 : 2, 6, W.line); if (!L.sil) p(3, 8, 1, 4, W.core);
      if (W.tassel) { p(1, 1, 1, 1, 3); p(0, 2, 1, 3, 3); }
    } else {
      p(13, 0, 1, 1, 3); p(13, 1, 1, 4, W.hilt); p(12, 1, 3, 1, 3); p(11, 5, 5, 1, W.guard);
      p(1, 12, W.broad ? 3 : 2, 2, W.line); p(0, 14, W.broad ? 3 : 2, 1, W.line);
      if (W.tassel) { p(15, 2, 1, 4, 3); p(14, 6, 1, 1, 3); }
    }
  }
  // 腿 / 脚
  if (!L.noLegs) {
    if (B.long) {
      if (side) { p(5 + (step === 1 ? 1 : 0), 15, 3, 1, 3); p(9 - (step === 2 ? 1 : 0), 15, 3, 1, 3); }
      else { p(4, 15, 3, step === 1 ? 0 : 1, 3); p(9, 15, 3, step === 2 ? 0 : 1, 3); }
    } else if (side) {
      const a = step === 1 ? 1 : 0, b = step === 2 ? 1 : 0;
      p(5 + a, 13, 3, 3, 3); p(9 - b, 13, 3, 3, 3);
      if (B.pants !== 3) { p(6 + a, 13, 1, 2, B.pants); p(10 - b, 13, 1, 2, B.pants); }
    } else {
      p(4, 13, 3, step === 1 ? 2 : 3, 3); p(9, 13, 3, step === 2 ? 2 : 3, 3);
      if (B.pants !== 3) { p(5, 13, 1, step === 1 ? 1 : 2, B.pants); p(10, 13, 1, step === 2 ? 1 : 2, B.pants); }
      else if (B.wrap != null) { p(5, 14, 1, 1, B.wrap); p(10, 14, 1, 1, B.wrap); }
    }
  }
  // 身体（短衣到第 12 行，长袍到第 14 行）
  const bot = B.long ? 14 : 12;
  p(3, 7, 10, bot - 6, 3);
  p(4, 8, 8, bot - 8, B.f);
  p(4, 10, 8, 1, B.belt);
  if (B.hem != null) p(4, bot - 1, 8, 1, B.hem);
  if (B.long && !side && !up) p(8, 11, 1, bot - 11, 3);
  if (B.apron != null && !up) { p(5, 9, 6, bot - 8, B.apron); p(5, 10, 6, 1, 3); }
  if (B.fur != null && !L.sil) { for (const [x, y] of [[5, 9], [8, 8], [10, 11], [6, 11], [9, 9]]) if (y < bot) p(x, y, 1, 1, B.fur); p(4, bot, 1, 1, 3); p(7, bot, 1, 1, 3); p(10, bot, 1, 1, 3); }
  if (B.sash && !up) { for (let t = 0; t < 6; t++) p(4 + t, 8 + t, 2, 1, 3); }
  if (B.patch && !L.sil) { p(5, 9, 2, 2, 0); p(9, 11, 2, 1, 3); p(10, 8, 1, 2, 2); }
  if (B.pad != null) { p(2, 7, 3, 2, 3); p(11, 7, 3, 2, 3); if (!L.sil) { p(3, 7, 1, 1, B.pad); p(12, 7, 1, 1, B.pad); } }
  if (B.collar != null && !up) { if (side) p(9, 8, 2, 1, B.collar); else { p(6, 8, 1, 1, B.collar); p(9, 8, 1, 1, B.collar); p(7, 9, 2, 1, B.collar); } }
  // 手臂
  const sleeve = B.bare ? 0 : B.f;
  if (side) {
    const sw = step ? 1 : 0;
    p(7, 8 + sw, 3, 4, 3); p(8, 8 + sw, 1, 3, sleeve === 3 ? 2 : sleeve);
    if (B.cuff != null) p(8, 10 + sw, 1, 1, B.cuff);
  } else {
    p(1, 8, 2, 4, 3); p(13, 8, 2, 4, 3);
    p(2, 8, 1, 3, sleeve === 3 ? 2 : sleeve); p(13, 8, 1, 3, sleeve === 3 ? 2 : sleeve);
    if (B.cuff != null) { p(1, 10, 2, 1, B.cuff); p(13, 10, 2, 1, B.cuff); }
  }
  // 头
  p(4, 1, 8, 7, 3); p(5, 2, 6, 5, 0);
  if (up) { p(5, 2, 6, 5, 3); p(6, 2, 3, 1, 2); }
  else if (side) { p(5, 2, 6, 2, 3); p(5, 4, 2, 2, 3); p(9, 4, 1, 1, 3); }
  else { p(5, 2, 6, 2, 3); p(6, 4, 1, 1, 3); p(9, 4, 1, 1, 3); }
  const hs = L.hair;
  if (!L.hat) {
    if (hs === 'knot') { p(7, -1, 2, 2, 3); p(6, 0, 4, 1, 3); }
    if (hs === 'bun') { p(2, 1, 2, 2, 3); p(12, 1, 2, 2, 3); }
    if (hs === 'cap') { p(4, 0, 8, 2, 3); p(5, 1, 6, 1, 2); p(7, -1, 2, 1, 3); }
    if (hs === 'crown') { p(6, -1, 4, 2, 3); p(7, -2, 2, 1, 3); p(7, 0, 2, 1, 1); }
    if (hs === 'bald') { if (up) p(5, 2, 6, 5, 0); else { p(5, 2, 6, 2, 0); p(6, 2, 1, 1, 2); p(9, 2, 1, 1, 2); p(7, 1, 2, 1, 2); } }
    if (hs === 'hood') { p(3, 0, 10, 3, 3); p(4, 1, 8, 1, 1); p(3, 3, 2, 6, 3); p(11, 3, 2, 6, 3); if (up) p(4, 1, 8, 6, 1); }
    if (hs === 'messy') { p(4, -1, 8, 3, 3); p(3, 0, 1, 2, 3); p(12, 0, 1, 2, 3); p(5, -2, 1, 1, 3); p(9, -2, 1, 1, 3); }
    if (hs === 'fangjin') { p(4, -1, 8, 3, 3); p(5, 0, 6, 1, 1); }
    if (hs === 'band') { p(4, 3, 8, 1, 1); if (!up) p(4, 3, 1, 1, 3); if (up || side) { p(11, 4, 2, 1, 3); p(12, 5, 1, 2, 3); } }
  } else if (L.hat === 'helmet') {
    p(4, -1, 8, 4, 3); p(5, 0, 6, 2, 2); p(7, -3, 2, 2, 3); p(3, 2, 10, 1, 3);
  } else if (L.hat === 'douli') {
    p(0, 3, 16, 1, 3); p(1, 2, 14, 1, 3); p(3, 1, 10, 1, 3); p(5, 0, 6, 1, 3); p(7, -1, 2, 1, 3);
    p(2, 2, 12, 1, 1); p(4, 1, 8, 1, 1); p(6, 0, 4, 1, 2);
  }
  if (L.mask && !up) p(5, 5, 6, 2, 2);
  if (L.beard && !up) { p(6, 6, 4, 3, 0); p(5, 7, 1, 2, 3); p(10, 7, 1, 2, 3); p(7, 9, 2, 1, 0); }
  // 背面：整把兵器斜挎在背上
  if (W && W.kind && up) {
    if (W.kind === 'spear') { for (let t = 0; t <= 16; t++) p(13 - Math.floor(t * 0.6), -4 + t, 1, 1, 3); p(12, -6, 3, 2, 3); }
    else { for (let t = 0; t <= 9; t++) p(11 - Math.floor(t * 0.7), 3 + t, 1, 1, 3); p(9, -1, 5, 4, 3); p(10, 0, 3, 2, 2); }
  }
  if (W && !W.kind && up) {
    for (let t = 0; t <= 9; t++) { p(11 - t, 3 + t, W.broad ? 3 : 2, 1, W.line); if (!L.sil && t > 1 && t < 9) p(12 - t, 3 + t, 1, 1, W.core); }
    p(11, 0, 1, 3, W.hilt); p(10, 3, 4, 1, W.guard);
    if (W.tassel) { p(12, -1, 1, 1, 3); p(13, 0, 1, 3, 3); }
  }
}
/* 野兽：兔、狐、狼、熊、虎，外形和体型各不相同；木人桩不动 */
function drawBeast(kind, sx, sy, face, step, flash) {
  if (flash) return;
  const fl = face === 'left';
  const p = (x, y, w, h, c) => R(sx + (fl ? 16 - x - w : x), sy + y, w, h, c);
  const a = step === 1 ? 1 : 0, b = step === 2 ? 1 : 0;
  if (kind === 'rabbit') {
    p(5, 14, 2, 1, 3); p(9, 14, 2, 1, 3);
    p(4, 9, 8, 5, 3); p(5, 10, 6, 3, 0);
    p(2, 9, 3, 3, 3); p(3, 10, 1, 1, 0);
    p(10, 6, 5, 5, 3); p(11, 7, 3, 3, 0); p(13, 8, 1, 1, 3); p(14, 9, 1, 1, 2);
    p(10, 1, 2, 6, 3); p(11, 2, 1, 4, 1); p(13, 2, 2, 5, 3); p(13, 3, 1, 3, 1);
  } else if (kind === 'fox') {
    p(4, 12, 1, 3 - a, 3); p(6, 12, 1, 3 - b, 3); p(9, 12, 1, 3 - b, 3); p(11, 12, 1, 3 - a, 3);
    p(0, 5, 4, 5, 3); p(1, 6, 2, 3, 1); p(0, 3, 2, 3, 3); p(0, 3, 1, 2, 0);
    p(3, 8, 9, 5, 3); p(4, 9, 7, 3, 1); p(5, 11, 5, 1, 0);
    p(11, 5, 4, 5, 3); p(12, 6, 2, 3, 1); p(15, 8, 1, 1, 3); p(13, 7, 1, 1, 3); p(12, 8, 3, 1, 0);
    p(11, 2, 1, 3, 3); p(14, 2, 1, 3, 3);
  } else if (kind === 'wolf') {
    p(3, 12, 1, 3 - a, 3); p(5, 12, 1, 3 - b, 3); p(9, 12, 1, 3 - b, 3); p(11, 12, 1, 3 - a, 3);
    p(0, 6, 2, 2, 3); p(1, 8, 2, 1, 3);
    p(2, 7, 10, 6, 3); p(3, 8, 8, 4, 2); p(4, 8, 5, 1, 1);
    p(10, 4, 5, 6, 3); p(11, 5, 3, 4, 2);
    p(10, 3, 1, 2, 3); p(13, 3, 1, 2, 3);
    p(15, 7, 1, 2, 3); p(12, 6, 1, 1, 0);
  } else if (kind === 'snowwolf') {
    p(3, 12, 1, 3 - a, 3); p(5, 12, 1, 3 - b, 3); p(9, 12, 1, 3 - b, 3); p(11, 12, 1, 3 - a, 3);
    p(0, 5, 3, 3, 3); p(1, 6, 1, 1, 0); p(1, 8, 2, 1, 3);
    p(2, 7, 10, 6, 3); p(3, 8, 8, 4, 0); p(4, 11, 6, 1, 1);
    p(10, 4, 5, 6, 3); p(11, 5, 3, 4, 0); p(10, 2, 1, 3, 3); p(13, 2, 1, 3, 3);
    p(15, 7, 1, 2, 3); p(12, 6, 1, 1, 3);
  } else if (kind === 'boar') {
    p(3, 13, 2, 3 - a, 3); p(6, 13, 2, 3 - b, 3); p(9, 13, 2, 3 - b, 3); p(12, 13, 2, 3 - a, 3);
    p(0, 7, 1, 3, 3);
    p(1, 6, 13, 8, 3); p(2, 7, 11, 6, 2); for (let x = 2; x < 12; x += 2) p(x, 5, 1, 2, 3);
    p(11, 7, 5, 6, 3); p(12, 8, 3, 4, 2); p(15, 10, 1, 2, 1); p(13, 8, 1, 1, 0);
    p(14, 12, 2, 1, 0); p(15, 11, 1, 1, 0); p(11, 6, 2, 2, 3);
  } else if (kind === 'bear') {
    p(2, 13, 3, 3 - a, 3); p(6, 13, 2, 3 - b, 3); p(10, 13, 3, 3 - b, 3);
    p(0, 4, 14, 10, 3); p(1, 5, 12, 8, 2); p(2, 5, 7, 1, 1); p(1, 6, 1, 3, 1);
    p(10, 2, 6, 8, 3); p(11, 3, 4, 6, 2); p(14, 6, 2, 3, 1); p(15, 6, 1, 1, 3); p(12, 4, 1, 1, 0);
    p(10, 1, 2, 2, 3); p(14, 1, 2, 2, 3);
  } else if (kind === 'tiger') {
    p(3, 12, 2, 4 - a, 3); p(6, 12, 2, 4 - b, 3); p(9, 12, 2, 4 - b, 3); p(12, 12, 2, 4 - a, 3);
    p(0, 4, 1, 5, 3); p(1, 3, 1, 1, 3); p(2, 2, 1, 1, 3);
    p(1, 6, 12, 7, 3); p(2, 7, 10, 5, 1);
    for (let x = 3; x <= 11; x += 3) { p(x, 7, 1, 3, 3); p(x + 1, 9, 1, 2, 3); }
    p(3, 11, 8, 1, 0);
    p(11, 3, 5, 7, 3); p(12, 4, 3, 5, 1); p(13, 4, 1, 1, 3); p(13, 6, 1, 1, 3); p(14, 7, 2, 2, 0); p(15, 7, 1, 1, 3);
    p(11, 2, 2, 1, 3); p(14, 2, 2, 1, 3);
  } else if (kind === 'dummy') {
    R(sx + 7, sy + 5, 2, 10, 3); R(sx + 7, sy + 6, 1, 8, 1);
    R(sx + 2, sy + 6, 12, 3, 3); R(sx + 3, sy + 7, 10, 1, 1);
    R(sx + 5, sy + 0, 6, 6, 3); R(sx + 6, sy + 1, 4, 4, 1); R(sx + 6, sy + 2, 4, 1, 3);
    R(sx + 4, sy + 14, 8, 2, 3); R(sx + 5, sy + 14, 6, 1, 2);
  }
}
function drawEnemy(e, sx, sy) {
  const d = ED(e);
  const step = e.moving ? (Math.floor((e.px + e.py) / 6) % 2) + 1 : 0;
  const flash = e.hitT > 0 && e.hitT % 4 < 2;
  let ox = 0, oy = 0;
  if (e.lunge > 0) { const [dx, dy] = DIRS[e.dir]; ox = dx * 2; oy = dy * 2; e.lunge--; }
  if (d.dummy) drawBeast('dummy', sx + (e.hitT > 0 ? (e.hitT % 4 < 2 ? 1 : -1) : 0), sy, 'right', 0, false);
  else if (d.beast) drawBeast(d.beast, sx + ox, sy + oy - (d.beast === 'rabbit' && step === 1 ? 2 : 0), e.face, step, flash);
  else if (d.look) drawPerson(sx + ox, sy + oy, e.dir, step, d.look, flash);
  else if (e.kind === 'bandit') drawPerson(sx + ox, sy + oy, e.dir, step, { body: 'jinzhuang', hair: 'band', mask: true, weapon: 'dao' }, flash);
  else {
    drawPerson(sx + ox, sy + oy, e.dir, step, { body: 'heipao', hat: 'douli', beard: true, weapon: 'dao' }, flash);
    if (frame % 20 < 10) { R(sx + ox + 1, sy + oy + 14, 2, 1, 2); R(sx + ox + 13, sy + oy + 14, 2, 1, 2); }
  }
  if (e.stunT > 0) for (let k = 0; k < 3; k++) { const a = frame / 8 + k * 2.1; R(sx + 8 + Math.cos(a) * 6, sy - 2 + Math.sin(a) * 2, 1, 1, 3); }
  if (e === P.target && frame % 30 < 20) { R(sx + 6, sy - 10, 5, 1, 3); R(sx + 7, sy - 9, 3, 1, 3); R(sx + 8, sy - 8, 1, 1, 3); }
  if (!d.dummy && e.hp < e.max) {
    const w = d.boss ? 16 : 12, x0 = sx + (16 - w) / 2;
    R(x0 - 1, sy - 4, w + 2, 3, 3); R(x0, sy - 3, Math.max(0, Math.round(w * e.hp / e.max)), 1, 0);
  }
}
/* 招式特效：实心刀光（深色描边、亮色刃芯、两头渐细），第二式加残影、顿帧和击中火花 */
const ANG = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };
function crescent(cx, cy, a0, sweep, r, th, prog) {
  const head = clamp(prog, 0, 1), tail = Math.max(0, head - 0.55);
  if (head <= tail) return;
  const n = Math.ceil(r + 2);
  for (let y = -n; y <= n; y++) for (let x = -n; x <= n; x++) {
    const d = Math.hypot(x, y);
    if (d > r || d < r - th - 1) continue;
    let a = Math.atan2(y, x) - a0;
    if (sweep < 0) a = -a;
    a = ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const u = a / Math.abs(sweep);
    if (u < tail || u > head) continue;
    const k = (u - tail) / (head - tail), w = Math.max(1.5, th * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, k))));
    if (d < r - w) continue;
    const inner = w >= 3 && d < r - 1 && d > r - w + 1 && k > 0.12 && k < 0.95;
    R(cx + x, cy + y, 1, 1, inner ? 0 : 3);
  }
}
function beam(cx, cy, dx, dy, from, len, th) {
  for (let i = from; i < from + len; i++) {
    const w = Math.max(1, Math.round(th * (0.4 + 0.6 * (i - from) / len)));
    for (let k = -Math.floor(w / 2); k <= Math.floor(w / 2); k++) R(cx + dx * i + dy * k, cy + dy * i + dx * k, 1, 1, k === 0 && w >= 3 ? 0 : 3);
  }
  const ex = cx + dx * (from + len), ey = cy + dy * (from + len);
  for (let k = 0; k < 4; k++) { R(ex - dx * k - dy * (3 - k), ey - dy * k - dx * (3 - k), 1, 1, 3); R(ex - dx * k + dy * (3 - k), ey - dy * k + dx * (3 - k), 1, 1, 3); }
  R(ex - 1, ey - 1, 3, 3, 3); R(ex + dx * 2 - 1, ey + dy * 2 - 1, 3, 3, 3);
}
function ring(cx, cy, r, sy, c) { for (let k = 0; k < 28; k++) { const q = k * Math.PI / 14; R(cx + Math.cos(q) * r, cy + Math.sin(q) * r * sy, 2, 1, c); } }
function drawSparks() {
  for (const k of sparks) {
    const sx = Math.round(k.x - cam.x), sy = Math.round(k.y - cam.y), life = (k.big ? 12 : 8) - k.t, L = Math.min(k.big ? 7 : 4, 2 + life);
    if (k.t < 3) { R(sx - 1, sy - 1, 3, 3, 3); continue; }
    R(sx - L, sy, L * 2 + 1, 1, 3); R(sx, sy - L, 1, L * 2 + 1, 3);
    const D = Math.floor(L * 0.6); for (const [a, b] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) R(sx + a * D, sy + b * D, 1, 1, 3);
    R(sx - 1, sy - 1, 3, 3, 0); R(sx, sy, 1, 1, 3);
  }
}
/* 50 级第二式：拳=三重掌风，剑=三连斩，刀=旋风斩，枪=枪花突刺，锤=跃起震地 */
function drawSlash2(cx, cy, cat, prog, dx, dy, ang) {
  if (cat === '拳') {
    // 掌印：一只手掌的剪影向前推出、越推越大，后面跟着两道掌风
    const dist = 8 + Math.round(prog * 16), sc = prog < 0.4 ? 1 : 2;
    crescent(cx, cy, ang - Math.PI * 0.4, Math.PI * 0.8, dist + 4, 3, (prog - 0.2) * 2.5);
    crescent(cx, cy, ang - Math.PI * 0.3, Math.PI * 0.6, dist - 2, 2, (prog - 0.35) * 2.5);
    const ox = cx + dx * dist, oy = cy + dy * dist;
    const cells = new Set(), add = (fx, fy) => cells.add(fx + ',' + fy);
    for (let fy = 1; fy <= 7; fy++) for (let fx = 0; fx <= 4; fx++) add(fx, fy);
    [[1, 3], [3, 4], [5, 4], [7, 3]].forEach(([fy, len]) => { for (let fx = 5; fx < 5 + len; fx++) add(fx, fy); });
    add(1, 8); add(2, 9); add(3, 9);
    for (const c of cells) {
      const [fx, fy] = c.split(',').map(Number);
      const solid = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => cells.has((fx + a) + ',' + (fy + b)));
      R(ox + (dx * fx - dy * (fy - 4)) * sc, oy + (dy * fx + dx * (fy - 4)) * sc, sc, sc, solid ? 0 : 3);
    }
    if (prog < 0.6) for (const s2 of [-6, 6]) beam(cx + dy * s2, cy + dx * s2, dx, dy, 4, Math.round(4 + prog * 8), 1);
  } else if (cat === '剑') {
    crescent(cx, cy, ang - Math.PI * 0.5, Math.PI, 15, 4, prog * 3);
    crescent(cx, cy, ang + Math.PI * 0.5, -Math.PI, 17, 4, prog * 3 - 1);
    if (prog > 0.6) beam(cx, cy, dx, dy, 6, Math.round(26 * Math.min(1, (prog - 0.6) * 3)), 3);
  } else if (cat === '刀') {
    crescent(cx, cy, ang, Math.PI * 2, 19, 5, prog * 1.25);
    crescent(cx, cy, ang + Math.PI, Math.PI * 2, 13, 3, prog * 1.25 - 0.25);
  } else if (cat === '枪') {
    const tx = cx + dx * 14, ty = cy + dy * 14;
    if (prog < 0.5) for (let k = 0; k < 6; k++) { const q = prog * 12 + k * Math.PI / 3; R(tx + Math.cos(q) * 6 - 1, ty + Math.sin(q) * 6 - 1, 3, 2, 3); R(tx + Math.cos(q) * 3, ty + Math.sin(q) * 3, 1, 1, 3); }
    else beam(cx, cy, dx, dy, 6, Math.round(40 * Math.min(1, (prog - 0.5) * 3)), 4);
  } else {
    const fx_ = cx + dx * 14, fy = cy + dy * 14 + 4;
    if (prog > 0.45) {
      const t = (prog - 0.45) / 0.55;
      ring(fx_, fy, 4 + t * 20, 0.5, 3); ring(fx_, fy, 2 + t * 12, 0.5, 2);
      for (let k = 0; k < 5; k++) { const q = k * 1.26 + 0.3; let x = fx_, y = fy; for (let j = 0; j < 4 + t * 6; j++) { x += Math.cos(q) * 2 + ((j % 2) ? 1 : -1) * Math.sin(q); y += Math.sin(q) * 1; R(x, y, 1, 1, 3); } }
      for (let k = 0; k < 6; k++) { const q = k * 1.05, h = Math.sin(t * Math.PI) * 10; R(fx_ + Math.cos(q) * t * 16, fy - h + Math.sin(q) * 3, 2, 2, 3); }
      if (t < 0.3) R(fx_ - 4, fy - 4, 8, 6, 3);
    }
  }
}
function drawSlash(cx, cy) {
  const prog = 1 - P.atkT / P.atkMax;
  const cat = SK[S.active].cat;
  const [dx, dy] = DIRS[P.dir];
  const ang = ANG[P.dir];
  if (P.move2) return drawSlash2(cx, cy, cat, prog, dx, dy, ang);
  if (cat === '枪') return beam(cx, cy, dx, dy, 6, Math.round(26 * Math.min(1, prog * 1.6)), 3);
  if (cat === '槌') {
    const fx_ = cx + dx * 14, fy = cy + dy * 14 + 3;
    if (prog > 0.35) { const t = (prog - 0.35) / 0.65; ring(fx_, fy, 3 + t * 9, 0.5, 3); if (t < 0.4) R(fx_ - 3, fy - 3, 6, 5, 3); }
    return;
  }
  if (cat === '拳') {
    const reach = 6 + Math.round(Math.min(1, prog * 2) * 6), fx_ = cx + dx * reach, fy = cy + dy * reach;
    R(fx_ - 2, fy - 2, 5, 5, 3); R(fx_ - 1, fy - 1, 3, 3, 0);
    if (prog > 0.4) for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) R(fx_ + dx * 3 + a * 4, fy + dy * 3 + b * 4, 1, 1, 3);
    return;
  }
  if (cat === '刀') return crescent(cx, cy, ang - Math.PI * 0.5, Math.PI, 16, 5, prog * 1.5);
  crescent(cx, cy, ang - Math.PI * 0.38, Math.PI * 0.76, 15, 3, prog * 1.6);
}

function renderWorld() {
  const mw = map.w * T, mh = map.h * T;
  const VH = UB - HUD_H;
  let cx = Math.round(P.px + 8 - GW / 2), cy = Math.round(P.py + 8 - HUD_H - VH / 2);
  /* 横屏时两侧有按键，镜头允许越过地图边缘一些，人物不会躲到按键底下 */
  const mx = GW > GH * 1.4 ? Math.round(GW * 0.22) : 0;
  cx = mw + mx * 2 <= GW ? Math.round((mw - GW) / 2) : clamp(cx, -mx, mw - GW + mx);
  cy = mh <= VH ? Math.round(-HUD_H - (VH - mh) / 2) : clamp(cy, -HUD_H, mh - UB);
  if (shake) { cx += rnd(-1, 1); cy += rnd(-1, 1); }
  cam.x = cx; cam.y = cy;
  R(0, 0, GW, GH, 3);
  const x0 = Math.floor(cx / T), y0 = Math.floor(cy / T);
  for (let y = y0; y <= y0 + Math.ceil(GH / T) + 1; y++) for (let x = x0; x <= x0 + Math.ceil(GW / T) + 1; x++) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
    drawTile(map.rows[y][x], x * T - cx, y * T - cy, x, y);
  }
  // 可采集物、未开的箱子定时闪光，一眼就能看到
  for (let y = y0; y <= y0 + Math.ceil(GH / T) + 1; y++) for (let x = x0; x <= x0 + Math.ceil(GW / T) + 1; x++) {
    if (!lootable(x, y)) continue;
    const ph = (frame + hash(x, y) % 90) % 90;
    if (ph > 26) continue;
    const s2 = ph < 6 || ph > 20 ? 1 : 2, gx = x * T - cx + 13, gy = y * T - cy + 1;
    R(gx, gy - s2, 1, s2 * 2 + 1, 3); R(gx - s2, gy, s2 * 2 + 1, 1, 3); R(gx, gy, 1, 1, 0);
  }
  renderTrail();
  for (const b of map.buildings || []) {
    const bx = b.x * T - cx, by = b.y * T - cy;
    if (bx > -b.w * T - 10 && bx < GW + 10 && by > -b.h * T - 10 && by < GH + 10) drawBuilding(b, bx, by);
  }
  const list = [];
  for (const n of npcs) list.push({ y: n.y * T, d: () => drawPerson(n.x * T - cx, n.y * T - cy, n.dir, 0, n.look) });
  for (const e of enemies) if (!e.dead) list.push({ y: e.py, d: () => drawEnemy(e, e.px - cx, e.py - cy) });
  for (const o of NET.others.values()) list.push({ y: o.py, d: () => {
    const sx = Math.round(o.px - cx), sy = Math.round(o.py - cy);
    if (sx < -T || sy < -T || sx > GW || sy > GH) return;
    if (o.sit && !o.moving) { drawPerson(sx, sy + 2, 'down', 0, { ...o.look, noLegs: true }); R(sx + 1, sy + 11, 14, 4, 3); R(sx + 2, sy + 12, 5, 2, 1); R(sx + 9, sy + 12, 5, 2, 1); R(sx, sy + 15, 16, 1, 2); }
    else drawPerson(sx, sy, o.dir, o.moving ? (Math.floor((o.px + o.py) / 8) % 2) + 1 : 0, o.look);
  } });
  if (!P.dead || frame % 8 < 4) list.push({ y: P.py + 0.5, d: () => {
    const sx = P.px - cx, sy = P.py - cy;
    if (P.sit) {
      drawPerson(sx, sy + 2, 'down', 0, { ...playerLook(), noLegs: true });
      R(sx + 1, sy + 11, 14, 4, 3); R(sx + 2, sy + 12, 5, 2, 1); R(sx + 9, sy + 12, 5, 2, 1); R(sx + 7, sy + 12, 2, 1, 0);
      R(sx, sy + 15, 16, 1, 2);
      for (let k = 0; k < 3; k++) { const t = (frame + k * 20) % 60; const yy = sy + 10 - t / 3; R(sx + (k === 1 ? 7 : k === 0 ? 1 : 14) + Math.round(Math.sin((frame + k * 9) / 6)), yy, 1, 2, t < 40 ? 3 : 2); }
    } else {
      const step = P.moving ? (Math.floor((P.px + P.py) / 8) % 2) + 1 : 0;
      let ox = 0, oy = 0;
      if (P.atkT > 0) {
        const [dx, dy] = DIRS[P.dir], t = P.atkT / P.atkMax, cat = SK[S.active].cat;
        if (P.move2 && (cat === '槌' || cat === '刀')) oy = -Math.round(Math.sin(t * Math.PI) * 4);
        else { const push = P.move2 ? 3 : 2; ox = Math.round(dx * push * Math.sin(t * Math.PI)); oy = Math.round(dy * push * Math.sin(t * Math.PI)); }
      }
      if (P.move2 && P.atkT > P.atkMax * 0.35) {
        const [dx, dy] = DIRS[P.dir];
        drawPerson(sx - dx * 10, sy - dy * 10, P.dir, 0, { ...playerLook(), ghost: true });
        drawPerson(sx - dx * 5, sy - dy * 5, P.dir, 0, { ...playerLook(), ghost: true });
      }
      const ms = moveSpeed() / FASTX(1.5);
      if (P.moving && ms > 1.4) {
        const [dx, dy] = DIRS[P.dir];
        drawPerson(sx - dx * 6, sy - dy * 6, P.dir, 0, { ...playerLook(), ghost: true });
        if (ms > 1.9) drawPerson(sx - dx * 12, sy - dy * 12, P.dir, 0, { ...playerLook(), ghost: true });
      }
      drawPerson(sx + ox, sy + oy, P.dir, step, playerLook(), P.hurtT > 0 && P.hurtT % 6 < 3);
    }
    if (P.atkT > 0) drawSlash(sx + 8, sy + 9);
  } });
  list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  if (P.fish) {
    const f = P.fish, bite = f.stage === 'bite';
    const hx = P.px - cx + (P.dir === 'left' ? 1 : 14), hy = P.py - cy + 6;
    const bx = f.x * T - cx + 8, by = f.y * T - cy + 8 + (bite ? 2 : Math.round(Math.sin(frame / 12)));
    const tipx = hx + (bx - hx) * 0.35, tipy = hy - 10;
    for (let i = 0; i <= 10; i++) R(hx + (tipx - hx) * i / 10, hy + (tipy - hy) * i / 10, 1, 1, 3);
    for (let i = 0; i <= 16; i++) { const t2 = i / 16; R(tipx + (bx - tipx) * t2, tipy + (by - tipy) * t2 + Math.sin(t2 * Math.PI) * 4, 1, 1, 2); }
    R(bx - 1, by - 2, 3, 3, 3); R(bx, by - 2, 1, 1, 0);
    if (bite) { for (let k = 0; k < 8; k++) R(bx + Math.cos(k) * 4, by + Math.sin(k) * 2, 1, 1, 0); }
    if (bite && frame % 12 < 9) { const ex = P.px - cx + 3, ey = P.py - cy - 15; R(ex, ey, 10, 12, 3); txt('!', ex + 5, ey, 0, 'center'); }
  }
  drawSparks();
  R(0, 0, GW, HUD_H, 3);
  R(0, HUD_H - 1, GW, 1, 2);
}

/* NPC 头顶：职业图标，有任务时换成闪烁的 ! 或 ?；走近时脚下显示名字和身份 */
function renderNpcTags() {
  for (const n of npcs) {
    const sx = n.x * T - cam.x, sy = n.y * T - cam.y;
    if (sx < -40 || sx > GW + 40 || sy < -20 || sy > GH + 20) continue;
    const mark = questMark(n);
    const near = Math.abs(n.x - P.tx) + Math.abs(n.y - P.ty) <= 2;
    if (mark || n.icon) {
      const bob = mark ? ((frame >> 3) % 2) : 0;
      const bx = sx + 2, by = sy - 15 - bob;
      if (by < HUD_H) continue;
      if (mark) {
        R(bx, by, 12, 12, 3); R(bx + 4, by + 12, 4, 1, 3); R(bx + 5, by + 13, 2, 1, 3);
        if (frame % 40 < 30) txt(mark, bx + 6, by, 0, 'center');
      } else {
        R(bx, by, 12, 12, 3); R(bx + 1, by + 1, 10, 10, 0); R(bx + 4, by + 12, 4, 1, 3); R(bx + 5, by + 13, 2, 1, 3);
        txt(n.icon, bx + 1, by, 3);
      }
    }
    if (near && !dlg && !menu) {
      const label = `${n.name}·${n.role}`, w = tw(label) + 6;
      const below = P.ty > n.y;
      const lx = Math.round(sx + 8 - w / 2), ly = (below && sy - 30 > HUD_H + 1) ? sy - 30 : sy + 17; /* 上方放不下就放到脚下，不压住顶部状态栏 */
      R(lx, ly, w, 12, 3); txt(label, lx + 3, ly + 1, 0);
    }
  }
}
function bar(x, y, w, h, ratio, c) {
  R(x, y, w, h, 1); R(x + 1, y + 1, w - 2, h - 2, 3);
  R(x + 1, y + 1, Math.round((w - 2) * clamp(ratio, 0, 1)), h - 2, c);
}
/* 顶栏：第一行活力、内功、元气；第二行头臂腿三处伤势，右边是当前武功和它的小数等级 */
function renderHud() {
  txt('命', 2, 1, 0); bar(13, 3, 46, 6, S.hp / maxHP(), 0);
  const tired = S.st < 6;
  if (!tired || frame % 30 < 18) txt('体', 62, 1, tired ? 1 : 0);
  bar(73, 3, 32, 6, S.st / maxST(), 0);
  txt('内', 108, 1, 0); bar(119, 3, 39, 6, S.mp / maxMP(), 1);
  /* 头臂腿三条伤势条铺满到右边的武功等级前面，中间不留空 */
  const skl = P.sit ? '打坐中' : `${SK[S.active].short} ${lv(S.active).toFixed(2)}`, slot = Math.floor((158 - tw(skl) - 5 - 2) / 3), pw = slot - 14;
  ['head', 'arm', 'leg'].forEach((k, i) => {
    const x = 2 + i * slot, hurt = injured(k);
    if (!hurt || frame % 30 < 18) txt(PART_NAME[k], x, 12, hurt ? 1 : 0);
    bar(x + 11, 14, pw, 6, S.parts[k] / maxPart(), hurt ? 1 : 0);
  });
  txt(skl, 158, 12, 0, 'right');
  const B = S.buffs || {}, glint = (x, y, w) => { const i = Math.floor(frame / 3) % (w + 6); if (i < w) R(x + i, y, 1, 6, 2); };
  if (B.hp && B.hp.t > 0) glint(13, 3, 46);
  if (B.st && B.st.t > 0) glint(73, 3, 32);
  if (B.mp && B.mp.t > 0) glint(119, 3, 39);
  if (B.parts && B.parts.t > 0) [0, 1, 2].forEach(i => glint(13 + i * slot, 14, pw));
}
function renderLootTag() {
  if (dlg || menu) return;
  let best = null, bd = 9;
  for (let y = P.ty - 2; y <= P.ty + 2; y++) for (let x = P.tx - 2; x <= P.tx + 2; x++) {
    if (!lootable(x, y)) continue;
    const d = Math.abs(x - P.tx) + Math.abs(y - P.ty);
    if (d <= 2 && d < bd) { bd = d; best = [x, y]; }
  }
  if (!best) return;
  const [x, y] = best, t = map.rows[y][x];
  const label = `${LOOT_NAME[t]} ${bd === 1 ? '按A' + (t === 'X' ? '打开' : '采') : ''}`.trim(), w = tw(label) + 6;
  const lx = Math.round(x * T - cam.x + 8 - w / 2), ly = y * T - cam.y + 17;
  R(lx, ly, w, 12, 3); txt(label, lx + 3, ly + 1, 0);
}
/* 头顶信息：[门派]名字，有称号再加一行。正派浅底黑框，邪派黑底白字，中立或无门派只描边 */
function headTag(cx, top, name, sectShort, camp, title) {
  const label = (sectShort ? `[${sectShort}]` : '') + name, w = tw(label) + 6, x = Math.round(cx - w / 2);
  if (camp === '邪') { R(x, top, w, 12, 3); txt(label, x + 3, top, 0); }
  else if (camp === '正') { R(x, top, w, 12, 3); R(x + 1, top + 1, w - 2, 10, 0); txt(label, x + 3, top, 3); }
  else txtOutline(label, cx, top, 'center');
  if (title) { const tw2 = tw(title); txtOutline(title, cx, top - 12, 'center'); }
}
function renderHeadTags() {
  if (S.showTag === false || dlg) return;
  for (const e of enemies) {
    const d = ED(e);
    if (e.dead || !(d.camp || d.hunter) || e === P.target) continue;
    if (Math.abs(e.tx - P.tx) + Math.abs(e.ty - P.ty) > 7) continue;
    const sh = e.sect ? SECTS[e.sect].short : d.short;
    headTag(e.px + 8 - cam.x, e.py - cam.y - 14, d.hunter ? (e.kind === 'pantu' ? '叛徒' : '追兵') : d.nick, sh, d.hunter ? '邪' : d.camp, null);
  }
  for (const o of NET.others.values()) headTag(Math.round(o.px) + 8 - cam.x, Math.round(o.py) - cam.y - (o.sit ? 11 : 14), o.name, o.sect && SECTS[o.sect] ? SECTS[o.sect].short : null, o.camp, o.title);
  if (P.dead) return;
  const rt = titleOf(REP_TITLES, S.rep);
  headTag(P.px + 8 - cam.x, P.py - cam.y - (P.sit ? 11 : 14), S.name, S.sect ? SECTS[S.sect].short : null, campOf(), S.rep >= 20 ? rt : null);
}
/* 说话气泡：显示在名字上方，几秒后消失 */
function renderSay() {
  if (dlg || menu) return;
  for (const o of NET.others.values()) if (o.say) sayBubble(o.say.text, Math.round(o.px) + 8 - cam.x, Math.round(o.py) - cam.y - (o.sit ? 11 : 14) - (o.title ? 14 : 2) - 4);
  if (!P.say || P.dead) return;
  if (--P.say.t <= 0) { P.say = null; return; }
  sayBubble(P.say.text, Math.round(P.px + 8 - cam.x), P.py - cam.y - (P.sit ? 11 : 14) - (S.rep >= 20 ? 14 : 2) - 4);
}
function sayBubble(text, cx, bot) {
  const lines = wrap(text, 92).slice(0, 3), w = Math.max(...lines.map(l => tw(l))) + 8, h = lines.length * 11 + 4;
  const x = clamp(cx - Math.round(w / 2), 2, GW - w - 2), y = Math.max(HUD_H + 2, bot - h);
  R(x, y, w, h, 3); R(x + 1, y + 1, w - 2, h - 2, 0);
  R(cx - 2, y + h - 1, 5, 1, 0); R(cx - 2, y + h, 5, 1, 3); R(cx - 1, y + h + 1, 3, 1, 3); R(cx, y + h + 2, 1, 1, 3);
  lines.forEach((l, i) => txt(l, x + 4, y + 2 + i * 11, 3));
}
function renderUI() {
  renderHeadTags();
  renderSay();
  renderGuide();
  renderNpcTags();
  renderLootTag();
  const tg = P.target;
  if (tg && !tg.dead && !dlg && !menu) {
    const name = `${tg.name || ED(tg).name}${ED(tg).lv && !ED(tg).dummy ? ' ' + ED(tg).lv + '级' : ''}`, w = tw(name) + 6, x = Math.round(tg.px + 8 - cam.x - w / 2), y = Math.round(tg.py - cam.y - 24);
    R(x, y, w, 12, 0); R(x, y + 11, w, 1, 3); txt(name, x + 3, y, 3);
  }
  for (const f of fx) txtOutline(f.text, f.x - cam.x, f.y - cam.y - 8 - (45 - f.t) * 0.35);
  g.setTransform(1, 0, 0, 1, UX, 0);
  renderHud();
  if (menu) renderMenu();
  renderInspect();
  const fm = !!(menu && menu.tab === 5 && !menu.detail); if (fm !== fullMapOn) { fullMapOn = fm; gameEl.classList.toggle('fullmap', fm); }
  if (banner && !menu) {
    const w = tw(banner.text) + 18;
    box(80 - w / 2, HUD_H + 4, w, 17); txt(banner.text, 80, HUD_H + 7, 3, 'center');
  }
  g.setTransform(1, 0, 0, 1, UX, UB - 144);
  if (!dlg && !menu) toasts.slice(-2).reverse().forEach((t, i) => {
    const w = Math.min(158, tw(t.text) + 8), y = 131 - (guideShown ? 15 : 0) - i * 13;
    R(80 - w / 2, y, w, 12, 3); txt(t.text, 80, y + 1, 0, 'center');
  });
  if (dlg) renderDialog();
  g.setTransform(1, 0, 0, 1, UX, 0); renderTut();
  g.setTransform(1, 0, 0, 1, 0, 0);
}
const dlgW = () => Math.min(SAFE_W, 280);
function renderDialog() {
  const pg = dlg.pages[dlg.i], DW = dlgW(), x0 = Math.round((160 - DW) / 2);
  box(x0, 100, DW, 44);
  if (pg.speaker) { const w = tw(pg.speaker) + 12; box(x0 + 4, 85, w, 17); txt(pg.speaker, x0 + 10, 88, 3); }
  let left = dlg.shown;
  pg.lines.forEach((ln, i) => { if (left <= 0) return; txt(ln.slice(0, left), x0 + 8, 104 + i * 12, 3); left -= ln.length; });
  const done = dlg.shown >= pg.lines.join('').length;
  const last = dlg.i === dlg.pages.length - 1;
  if (done && dlg.choice && last) {
    const c = dlg.choice;
    const w = Math.max(...c.options.map(o => tw(o))) + 22, h = c.options.length * 12 + 9;
    const x = x0 + DW - w, y = 99 - h;
    box(x, y, w, h);
    c.options.forEach((o, i) => { if (i === c.sel) txt('▶', x + 4, y + 5 + i * 12, 3); txt(o, x + 15, y + 5 + i * 12, 3); });
  } else if (done && frame % 40 < 26) txt('▼', x0 + DW - 12, 131, 3);
}
/* 武功详情：六档评级 + 小格条，和千年的武功说明一样直观 */
function pips(x, y, r) { for (let i = 0; i < 6; i++) R(x + i * 5, y + 3, 4, 5, i <= r ? 3 : 1); }
/* 菜单宽度：横屏时用上两侧空间 */
function renderSkillDetail(k) {
  const sk = SK[k], v = lv(k), atk = ATK_CATS.includes(sk.cat);
  const kd = skKind(k);
  txt(sk.name, 8, 33, 3);
  txt(kd === '门派' ? `门派·${SECTS[sk.sect].short}` : kd === '生产' ? '副职业' : sk.villain ? `特殊·打${EN[sk.villain].name}得` : `${kd}武功`, 8 + tw(sk.name) + 6, 33, 2);
  txt(v.toFixed(2), MW - 8, 33, 2, 'right');
  txt(useLabel(sk), 8, 45, 2);
  const row = (y, x, label, r) => { txt(label, x, y, 2); txt(RT[r], x + 22, y, 3); pips(x + 44, y, r); };
  if (atk) {
    row(57, 6, '攻速', sk.spd); row(57, MW / 2 + 2, '回击', sk.rec);
    row(69, 6, '闪躲', sk.eva); row(69, MW / 2 + 2, '命中', sk.acc);
    txt('攻击', 6, 81, 2);
    sk.atk.forEach((r, i) => { txt(LOCS[i], 30 + i * 31, 81, 2); txt(RT[r], 41 + i * 31, 81, 3); });
    const tags = [sk.reach ? `远及${'一两三'[sk.reach - 1]}格` : '', sk.poison ? '可带毒' : '', sk.stun ? '可击晕' : '', sk.tier === 2 ? '每招耗内功2' : `每招耗体力${ST_COST[sk.cat]}`].filter(Boolean);
    txt(tags.length ? tags.join(' ') : '无特殊效果', 6, 93, 2);
    txt(`50级第二式「${sk.move}」${v >= 50 ? '已成' : '未成'}`, 6, 105, v >= 50 ? 3 : 2);
  } else if (sk.cat === '护体') {
    txt('防护', 6, 57, 2);
    sk.def.forEach((r, i) => { txt(LOCS[i], 30 + i * 31, 57, 2); txt(RT[r], 41 + i * 31, 57, 3); });
    txt(`现减伤 ${sk.def.map((r, i) => LOCS[i] + Math.round(Math.min(0.6, v * RV[r] * 0.0035) * 100)).join(' ')}%`, 6, 69, 2);
    txt('挨打时修炼，强敌长得快', 6, 93, 2);
  } else if (sk.cat === '步法') {
    row(57, 6, '脚力', sk.mv); row(69, 6, '闪躲', sk.eva);
    txt(`现在 移速+${Math.round(v * RV[sk.mv] * 0.6)}% 闪躲+${Math.round(v * RV[sk.eva] * 0.3)}`, 6, 81, 2);
    txt('走路时修炼；腿伤时练不了', 6, 93, 2);
  } else if (sk.cat === '心法') {
    row(57, 6, '内功', sk.mp); row(57, MW / 2 + 2, '活力', sk.hp); row(69, 6, '元气', sk.yq);
    txt(`现在 内功+${Math.floor(v * RV[sk.mp] * 1.2)} 元气+${Math.floor(v * RV[sk.yq] * 0.4)}`, 6, 81, 2);
    txt('打坐时修炼，打坐回复也更快', 6, 93, 2);
  } else {
    if (k === 'diaoyu') { txt(`咬钩时机 +${(v * 0.5 / 60).toFixed(1)}秒`, 6, 57, 2); txt(`金鲤几率 ${(1 + v * 0.08).toFixed(1)}%`, 6, 69, 2); }
    else if (k === 'caiji') txt(`多采一份 ${Math.round(v * 0.6)}%`, 6, 57, 2);
    else txt(`成功率约 +${Math.round(v * 0.8)}%`, 6, 57, 2);
  }
  if (sk.req && S.skills[k] == null) txt(`门槛：${SK[sk.req[0]].short || SK[sk.req[0]].name}${sk.req[1]}级`, 6, 105, 2);
  txt(sk.desc, MW / 2, 117, 3, 'center');
  txt(sk.cat === '生产' ? 'B返回' : 'A运用此功　B返回', MW / 2, 129, 2, 'center');
}
/* 门派见闻：打听来的门派和奇人 */
const VILLAIN_WHERE = { yuebuqun: '华山思过崖山洞', dongfang: '黑木崖成德殿密道', zuolengchan: '蜀道剑冢上层', ouyangfeng: '大漠沙城地宫上层', limochou: '绝情谷', gongsun: '绝情谷', jiumozhi: '苗疆', jinlun: '雁门关外', xuedao: '黑松林' };
function heardInfo(k) {
  if (k.startsWith('v_')) { const v = k.slice(2), sk = Object.keys(SK).find(x => SK[x].villain === v); return { name: `反派·${EN[v].name}`, tag: sk && S.skills[sk] != null ? '已得' : SK[sk] ? SK[sk].short || SK[sk].name : '反派', where: VILLAIN_WHERE[v] }; }
  if (SECTS[k]) return { name: SECTS[k].name, tag: { 正: '正派', 邪: '邪派', 中: '中立' }[SECTS[k].camp] + (S.sect === k ? '·本门' : ''), where: SECTS[k].where };
  const h = HERMITS[k]; return { name: `奇人·${h.name}`, tag: S.skills[h.skill] != null ? '已拜见' : '奇人', where: h.where };
}
function renderHeard() {
  box(0, 12, MW, 132);
  txt('门派见闻', MW / 2, 16, 3, 'center'); R(4, 29, MW - 8, 1, 3);
  const L = S.heard, VIS = 5;
  if (!L.length) { wrap('还没听说过什么门派。去客栈、酒楼请掌柜喝碗酒，打听打听。', MW - 16).forEach((l, i) => txt(l, 8, 36 + i * 12, 2)); txt('B返回', MW / 2, 129, 2, 'center'); return; }
  const st = clamp(menu.sel - VIS + 1, 0, Math.max(0, L.length - VIS));
  L.slice(st, st + VIS).forEach((k, j) => {
    const i = st + j, y = 32 + j * 12, h = heardInfo(k);
    if (i === menu.sel) txt('▶', 6, y, 3);
    txt(h.name, 17, y, 3); txt(h.tag, 153, y, 2, 'right');
  });
  if (L.length > VIS) txt(`${menu.sel + 1}/${L.length}`, 153, 16, 2, 'right');
  R(4, 93, MW - 8, 1, 2);
  const k = L[menu.sel], h = heardInfo(k);
  txt(`在：${h.where}`, 6, 96, 3);
  g_clip(0, 108, MW, 34, () => wrap(RUMORS[k], MW - 12).slice(0, 3).forEach((l, i) => txt(l, 6, 108 + i * 11, 2)));
}
function renderMenu() {
  MW = Math.min(SAFE_W, 236); g.translate(Math.round((160 - MW) / 2), 0);
  if (menu.page === 'heard') return renderHeard();
  if (menu.tab === 5 && !menu.detail) return renderWorldMap();
  box(0, 12, MW, 132);
  TABS.forEach((t, i) => {
    const tw_ = (MW - 6) / 7, x = Math.round(3 + i * tw_);
    if (i === menu.tab) { R(x, 16, Math.round(tw_), 13, 3); txt(t, x + Math.round(tw_ / 2), 17, 0, 'center'); }
    else txt(t, x + Math.round(tw_ / 2), 17, 2, 'center');
  });
  R(4, 30, MW - 8, 1, 3);
  if (menu.detail) { renderSkillDetail(menu.detail); return; }
  if (menu.tab === 0) {
    const pair = (y, a, av, b, bv) => { txt(a, 8, y, 2); txt(av, b ? MW / 2 - 6 : MW - 8, y, 3, 'right'); if (b) { txt(b, MW / 2 + 4, y, 2); txt(bv, MW - 8, y, 3, 'right'); } };
    const pt = k => `${Math.ceil(S.parts[k])}/${maxPart()}`;
    pair(34, '年龄', `${S.age}岁`, '门派', S.sect ? SECTS[S.sect].name : '无');
    pair(47, '活力', `${Math.ceil(S.hp)}/${maxHP()}`, '内功', `${Math.floor(S.mp)}/${maxMP()}`);
    pair(60, '体力', `${Math.floor(S.st)}/${maxST()}`, '元气', String(qi()));
    pair(73, '头', pt('head'), '臂', pt('arm'));
    pair(86, '腿', pt('leg'), '银两', String(S.silver));
    pair(99, '任务', questText());
    const b = S.bounty;
    pair(112, '悬赏', b ? (b.cnt >= b.need ? '回镖局领赏' : `${EN[b.kind].name} ${b.cnt}/${b.need}`) : '无');
  } else if (menu.tab === 5) {
  } else if (menu.tab === 4) {
    const pair = (y, a, av, b, bv) => { txt(a, 8, y, 2); txt(av, b ? MW / 2 - 6 : MW - 8, y, 3, 'right'); if (b) { txt(b, MW / 2 + 4, y, 2); txt(bv, MW - 8, y, 3, 'right'); } };
    const c = campOf();
    pair(34, '阵营', c ? `${c}派`.replace('中派', '中立') : '无门无派', '门派', S.sect ? SECTS[S.sect].name : '无');
    pair(47, '门派声望', S.sect ? `${S.srep[S.sect] || 0} ${titleOf(SREP_TITLES, S.srep[S.sect] || 0)}` : '—');
    pair(60, '江湖声望', `${S.rep} ${titleOf(REP_TITLES, S.rep)}`);
    pair(73, '正气', String(S.zheng), '邪气', String(S.xie));
    const stk = S.stask;
    pair(86, '门务', stk ? (sectTaskDone(stk) ? '回师门复命' : stk.text + (stk.cnt != null ? ` ${stk.cnt}/${stk.n}` : '')) : S.sect ? '可向师父领取' : '无');
    pair(99, `历练${S.lilian}`, trialText());
    const hs = Object.keys(S.hunted || {});
    pair(112, hs.length ? '追杀' : '门户', hs.length ? hs.map(k => `${SECTS[k].name}${S.hunted[k]}拨`).join(' ') : S.purge ? (S.purge.done ? '回师门复命' : `叛徒在${MAPS[S.purge.map].name}`) : '无');
  } else {
    const its = menuItems(), VIS = 6;
    const st = clamp(menu.sel - VIS + 1, 0, Math.max(0, its.length - VIS));
    its.slice(st, st + VIS).forEach((it, j) => {
      const i = st + j, y = 35 + j * 13;
      if (i === menu.sel) txt('▶', 7, y, 3);
      if (it.tag) { R(17, y, 11, 11, 3); txt(it.tag, 18, y, 0); txt(it.label + (it.mark ? '●' : ''), 31, y, 3); }
      else txt(it.label + (it.mark ? '●' : ''), 18, y, 3);
      if (it.right) txt(it.right, MW - 9, y, 2, 'right');
    });
    if (st > 0) { R(77, 32, 6, 1, 3); R(78, 31, 4, 1, 3); R(79, 30, 2, 1, 3); }
    if (st + VIS < its.length) { R(77, 112, 6, 1, 3); R(78, 113, 4, 1, 3); R(79, 114, 2, 1, 3); }
    const cur = its[menu.sel];
    if (cur && cur.info) txt(cur.info, MW / 2, 116, 2, 'center');
    else if (!its.length) txt(menu.tab === 3 ? '行囊空空' : '还没有装备', MW / 2, 60, 2, 'center');
  }
  txt(menu.tab === 4 ? `A见闻${S.heard.length} 石刻${S.found.length}/${steleTotal()} ←→换页` : '←→换页 A确定 B返回', MW / 2, 129, 2, 'center');
}

function render() {
  if (mode === 'title' || mode === 'naming' || mode === 'auth') { renderTitle(); renderTitleUI(); } else { renderWorld(); renderUI(); }
  sc.imageSmoothingEnabled = false;
  sc.drawImage(world, 0, 0, screen.width, screen.height);
  sc.drawImage(grid, 0, 0);
}

