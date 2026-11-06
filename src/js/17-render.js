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
    if (o === '新的江湖') say(null, ['牛家村，一个普通的早晨。', `你叫${S.name}，今年十六岁，只会一套基础拳法。`, '武功都是越用越强：出拳练拳法，挨打练基础护体，走路练基础步法。', '遇敌按一下 A，会自动锁定最近的敌人连续出招；按方向键就能脱离。', '四下无人时按 B 打坐，回复活力、内功和伤势。', '村长家门口的王村长头上有个“!”，先去找他吧。']);
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
  txt(FAST ? 'v77 ' + FAST_NAME[FAST] : 'v77', 156, 0, 2, 'right');
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
/* 用字符画小图：' ' 透明，'0'~'3' 是四种颜色 */
function spr(rows, sx, sy) { rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const c = r.charCodeAt(x) - 48; if (c >= 0 && c <= 3) R(sx + x, sy + y, 1, 1, c); } }); }
/* 可采的东西统一画法：黑描边、亮色块，个头小一圈，脚下一圈浅影，和树、石头这些挡路的东西分开 */
const SPR_HERB = [
  '    3    ',
  '   303   ',
  '3  323  3',
  '30 323 03',
  '323323323',
  ' 3223223 ',
  '  32223  ',
  '   323   ',
  '   333   ',
]
const SPR_FLOWER = [
  ' 3 3 ',
  '31313',
  ' 333 ',
  '31313',
  ' 3 3 ',
  '  3  ',
  ' 33  ',
]
const SPR_COTTON_BALL = ['  33  ', ' 3003 ', '300003', '300013', ' 3113 ', '  33  '];
function floorOf(m) {
  if (m._floor) return m._floor;
  const c = {}; for (const r of m.rows) for (const ch of r) if (!SOLID.has(ch)) c[ch] = (c[ch] || 0) + 1;
  return (m._floor = (Object.entries(c).sort((a, b) => b[1] - a[1])[0] || ['.'])[0]);
}
/* 深色地面（碎石山、山洞）上的障碍物：整体提亮一档、保留黑描边，一眼和地面分开 */
const OBJ_TILES = new Set(['T', 'P', 'k', 'q', 'r', '*', '&', 'O', 'm', 'f', 'c', 'i', 'S', 'J', 'X', 'o', 'F', 'M', 'U', 'z']);
const darkGround = () => map && (map.ground === 'cave' || floorOf(map) === 'v');
function drawTile(t, sx, sy, mx, my) {
  RMAP = OBJ_TILES.has(t) && darkGround() ? [0, 0, 1, 3] : null;
  drawTile0(t, sx, sy, mx, my);
  RMAP = null;
}
function drawTile0(t, sx, sy, mx, my) {
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
  /* 东西底下一律铺这张地图本来的地面（草地、林地、雪地、沙地、碎石、山洞），不留白方块 */
  const base = () => {
    const f = map ? floorOf(map) : '.', keep = RMAP; RMAP = null;
    if (f === '.' || f === t) { if (inForest) forest(); else if (isSnow) snow(); else if (map && map.ground === 'sand') sand(); else grass(); }
    else drawTile0(f, sx, sy, mx, my);
    RMAP = keep;
  };
  /* 岩石（山崖 c、山壁 M）：相连的岩石连成一整面岩壁，露在外面的边是圆角、黑描边，
     顶上一道亮边、底下一道阴影，中间有裂纹和碎点；单独一块就是一块圆滚滚的大石头 */
  function rock(mountain, icy) {
    const isR = (x, y) => { const c = tileAt(x, y); return icy ? c === 'i' : c === 'c' || c === 'M'; };
    const up = isR(mx, my - 1), dn = isR(mx, my + 1), lf = isR(mx - 1, my), rt = isR(mx + 1, my);
    if (!(up && dn && lf && rt)) base();
    const rad = 4;
    const inside = (x, y) => {
      const cx = x < rad && !lf ? rad - x : x > 15 - rad && !rt ? x - (15 - rad) : 0;
      const cy = y < rad && !up ? rad - y : y > 15 - rad && !dn ? y - (15 - rad) : 0;
      return cx * cx + cy * cy <= rad * rad;
    };
    for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
      if (!inside(x, y)) continue;
      const edge = !inside(x - 1, y) || !inside(x + 1, y) || !inside(x, y - 1) || !inside(x, y + 1) ||
        (x === 0 && !lf) || (x === 15 && !rt) || (y === 0 && !up) || (y === 15 && !dn);
      let c = 2;
      if (edge) c = 3;
      else if (!up && y <= 2) c = 1;                       /* 顶上受光 */
      else if (!dn && y >= 12) c = (x + y) % 2 ? 3 : 2;      /* 底下背光 */
      else if (!lf && x <= 1) c = 1;
      R(sx + x, sy + y, 1, 1, icy && c < 3 ? c - 1 < 0 ? 0 : c - 1 : c);   /* 冰崖：整体亮一档，像冻住的冰 */
    }
    /* 裂纹：每块位置不同 */
    const k1 = hs % 7, k2 = (hs >> 3) % 6;
    R(sx + 4 + k1, sy + 4, 1, 3, 3); R(sx + 5 + k1, sy + 7, 1, 2, 3); R(sx + 3 + k1, sy + 6, 1, 1, 3);
    if (hs % 3) { R(sx + 3, sy + 9 + (k2 % 3), 3, 1, 3); R(sx + 6, sy + 10 + (k2 % 3), 2, 1, 3); }
    R(sx + 2 + k2 * 2, sy + 3 + (k1 % 3), 1, 1, 1); R(sx + 10 - k2, sy + 11, 1, 1, 1);
    if (mountain) { R(sx + 2, sy + 6, 5, 1, 3); R(sx + 9, sy + 3, 4, 1, 3); R(sx + 8, sy + 12, 5, 1, 1); }  /* 山壁多几道岩层 */
    if (isSnow && !up) R(sx + 3, sy + 1, 10, 2, 0);
  }
  /* ---- 室内 ---- */
  const ik = map && map.ikind;
  const planks = () => {   /* 木地板：一条条横木板，接缝错开 */
    R(sx, sy, T, T, 1);
    for (let y = 3; y < 16; y += 4) R(sx, sy + y, T, 1, 2);
    for (let r = 0; r < 4; r++) { const sx2 = ((r * 7 + mx * 5) % 16); R(sx + sx2, sy + r * 4, 1, 3, 2); }
  };
  switch (t) {
    case 'L': planks(); break;
    case 'd':   /* 稻田：一汪浅水，一排排秧苗，风一吹轻轻晃 */
      R(sx, sy, T, T, 1);
      for (let y = 3; y < 16; y += 4) for (let x = 1 + ((y >> 2) % 2) * 2; x < 16; x += 4) { const w = ((frame >> 5) + x + mx) % 2; R(sx + x + w, sy + y - 2, 1, 2, 2); R(sx + x, sy + y, 2, 1, 3); }
      R(sx + ((mx * 5) % 12) + 2, sy + ((my * 7) % 12) + 2, 2, 1, 0);
      break;
    case 'z':   /* 集市摊子：条纹布篷、两根竹竿，下面一张摆满货的木台 */
      base();
      R(sx, sy + 1, T, 6, 3); for (let x = 1; x < 15; x += 4) R(sx + x, sy + 2, 2, 4, 0);
      R(sx, sy + 7, T, 1, 3);
      R(sx + 1, sy + 7, 1, 8, 3); R(sx + 14, sy + 7, 1, 8, 3);
      R(sx + 1, sy + 11, 14, 2, 3); R(sx + 2, sy + 11, 12, 1, 1);
      for (let x = 3; x < 13; x += 3) { R(sx + x, sy + 9 + ((x + mx) % 2), 2, 2 - ((x + mx) % 2), (x + mx) % 3 ? 2 : 0); R(sx + x, sy + 10, 2, 1, 3); }
      break;
    case 'g':   /* 地窖口：屋里是地上一块活板门；地窖里是往上爬的木梯 */
      if (map && map.cellar) { base(); R(sx + 3, sy, 2, 16, 3); R(sx + 11, sy, 2, 16, 3); for (let y = 2; y < 16; y += 4) R(sx + 3, sy + y, 10, 2, 2); R(sx + 4, sy, 1, 16, 1); }
      else { planks(); R(sx + 2, sy + 2, 12, 12, 3); R(sx + 3, sy + 3, 10, 10, 2); for (let x = 5; x < 13; x += 3) R(sx + x, sy + 3, 1, 10, 3); R(sx + 7, sy + 7, 2, 2, 0); }
      break;
    case 'u':   /* 红地毯：深色，两边一道花边 */
      planks(); R(sx + 2, sy, 12, T, 2); R(sx + 2, sy, 1, T, 3); R(sx + 13, sy, 1, T, 3);
      for (let y = (my % 2) * 4; y < 16; y += 8) { R(sx + 6, sy + y + 1, 4, 1, 1); R(sx + 7, sy + y, 2, 3, 1); }
      break;
    case 'Y': {   /* 墙：白粉墙，上面一道房梁，下面一道深色墙裙；后墙上隔几格开一扇格子窗 */
      const back = my <= 1;
      R(sx, sy, T, T, 0);
      if (back && my === 0) { R(sx, sy, T, 4, 3); R(sx, sy + 4, T, 1, 2); }
      if (back && my === 1) {
        R(sx, sy + 11, T, 5, 2); R(sx, sy + 11, T, 1, 3); R(sx, sy + 15, T, 1, 3);
        if (mx % 4 === 2) { R(sx + 3, sy + 1, 10, 9, 3); R(sx + 4, sy + 2, 8, 7, 1); R(sx + 7, sy + 2, 2, 7, 3); R(sx + 4, sy + 5, 8, 1, 3); }
      }
      if (!back) { R(sx, sy, T, T, 2); R(sx + 1, sy, 1, T, 3); R(sx + 14, sy, 1, T, 3); for (let y = 2; y < 16; y += 5) R(sx + 2, sy + y, 12, 1, 3); }
      if (my === map.h - 1 && !back) { R(sx, sy, T, T, 3); R(sx, sy, T, 2, 2); }
      break;
    }
    case 'n':   /* 柜台：浅色台面、深色木板正面，台面上随手放着算盘、茶碗 */
      planks();
      R(sx, sy + 3, T, 4, 3); R(sx, sy + 4, T, 2, 0); R(sx, sy + 7, T, 9, 2);
      for (let x = 3; x < 16; x += 5) R(sx + x, sy + 8, 1, 7, 3);
      R(sx, sy + 15, T, 1, 3);
      if (hs % 3 === 0) { R(sx + 4, sy + 1, 7, 3, 3); R(sx + 5, sy + 2, 5, 1, 1); }      /* 算盘 */
      else if (hs % 3 === 1) { R(sx + 6, sy + 1, 4, 3, 3); R(sx + 7, sy + 1, 2, 1, 0); }  /* 茶碗 */
      break;
    case 'h': {   /* 货架：靠墙的木架子，上面摆的东西看是什么铺子 */
      R(sx, sy, T, T, 2); R(sx, sy, T, 1, 3); R(sx, sy, 1, T, 3); R(sx + 15, sy, 1, T, 3);
      for (const y of [5, 10, 15]) R(sx, sy + y, T, 1, 3);
      for (const [y0, h] of [[1, 4], [6, 4], [11, 4]]) {
        if (ik === 'pharmacy') { for (let x = 1; x < 15; x += 5) { R(sx + x, sy + y0, 4, h, 1); R(sx + x, sy + y0, 4, 1, 3); R(sx + x + 1, sy + y0 + 2, 2, 1, 3); } }   /* 药柜小抽屉 */
        else if (ik === 'smith' || ik === 'school' || ik === 'escort') { for (let x = 2; x < 15; x += 4) { R(sx + x, sy + y0, 1, h, 0); R(sx + x - 1, sy + y0 + h - 1, 3, 1, 3); } }   /* 一排刀剑 */
        else if (ik === 'tavern' || ik === 'inn') { for (let x = 2; x < 15; x += 5) { R(sx + x, sy + y0 + 1, 4, h - 1, 3); R(sx + x + 1, sy + y0, 2, 1, 3); R(sx + x + 1, sy + y0 + 2, 1, 1, 0); } }   /* 酒坛 */
        else if (ik === 'library') { for (let x = 1; x < 15; x += 2) R(sx + x, sy + y0 + ((x * 3 + y0) % 2), 1, h - ((x * 3 + y0) % 2), (x + y0) % 3 ? 0 : 3); }   /* 书 */
        else if (ik === 'cloth') { for (let x = 1; x < 15; x += 5) { R(sx + x, sy + y0, 4, h, (x + y0) % 2 ? 0 : 1); R(sx + x, sy + y0, 1, h, 3); } }   /* 布匹 */
        else if (ik === 'bank' || ik === 'pawn') { for (let x = 2; x < 15; x += 5) { R(sx + x, sy + y0 + 1, 4, h - 1, 3); R(sx + x + 1, sy + y0 + 2, 2, 1, 0); } }   /* 钱箱 */
        else { for (let x = 2; x < 15; x += 6) { R(sx + x, sy + y0 + 1, 3, h - 1, 3); R(sx + x + 1, sy + y0 + 1, 1, 1, 0); } }   /* 坛坛罐罐 */
      }
      break;
    }
    case 'b':   /* 床：木床架，白褥子，枕头，盖着深色被子 */
      planks();
      R(sx + 1, sy, 14, 16, 3); R(sx + 2, sy + 1, 12, 14, 0);
      R(sx + 3, sy + 2, 10, 3, 1); R(sx + 3, sy + 2, 10, 1, 3);
      R(sx + 2, sy + 7, 12, 8, 2); for (let x = 4; x < 14; x += 4) R(sx + x, sy + 8, 1, 7, 3);
      break;
    case 't':   /* 桌子：方桌，桌上一把茶壶两只茶杯，两边小凳 */
      planks();
      R(sx + 2, sy + 4, 12, 7, 3); R(sx + 3, sy + 5, 10, 5, 0);
      R(sx + 3, sy + 11, 2, 4, 3); R(sx + 11, sy + 11, 2, 4, 3);
      R(sx + 6, sy + 5, 4, 3, 3); R(sx + 7, sy + 4, 2, 1, 3); R(sx + 10, sy + 6, 2, 1, 2); R(sx + 4, sy + 7, 2, 1, 2);
      R(sx, sy + 7, 2, 4, 2); R(sx + 14, sy + 7, 2, 4, 2);
      break;
    case 'a':   /* 供桌：长桌上香炉、蜡烛；正中那格后面供着神像 */
      planks();
      if (mx === Math.floor(map.w / 2)) { R(sx + 4, sy, 8, 7, 3); R(sx + 5, sy, 6, 6, 1); R(sx + 7, sy + 1, 2, 2, 0); R(sx + 6, sy + 3, 4, 3, 2); }
      R(sx, sy + 7, T, 2, 3); R(sx, sy + 9, T, 7, 2); R(sx, sy + 9, T, 1, 0); R(sx + 1, sy + 10, 1, 6, 3); R(sx + 14, sy + 10, 1, 6, 3);
      if (mx === Math.floor(map.w / 2)) { R(sx + 6, sy + 5, 4, 2, 3); R(sx + 7, sy + 3, 1, 2, 2); R(sx + 8, sy + 2, 1, 3, 2); }   /* 香炉冒烟 */
      else { R(sx + 7, sy + 3, 2, 4, 0); R(sx + 7, sy + 3, 2, 4, 3); R(sx + 8, sy + 1 + (frame >> 4) % 2, 1, 2, 0); R(sx + 8, sy + 2, 1, 1, 3); }   /* 蜡烛 */
      break;
    case 'p':   /* 柱子：一根粗木柱，上下有柱础 */
      planks();
      R(sx + 4, sy, 8, 16, 3); R(sx + 5, sy, 6, 16, 2); R(sx + 6, sy, 1, 16, 1);
      R(sx + 3, sy + 13, 10, 3, 3); R(sx + 4, sy + 13, 8, 1, 1);
      break;
    case '.': if (map && floorOf(map) !== '.') base(); else grass(); break;   /* 别的地面上零星的草地格也跟着地面走 */
    case 'H': if (isSnow) snow(); else if (map && map.hfloor === '_' && !darkGround()) flag_(); else base(); break;   /* 房子底下：深色地面就铺地面本身，不铺白石板 */
    case '_': flag_(); break;
    case 'U': {
      /* 洞口：一块岩石，中间拱形的黑洞，洞里越往深处越黑 */
      base();
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
        const dx = x - 7.5, top = y < 6 ? (dx * dx) / 64 + ((6 - y) * (6 - y)) / 36 : 0;
        if (top > 1) continue;
        const edge = top > 0.72 || x === 0 || x === 15;
        R(sx + x, sy + y, 1, 1, edge ? 3 : y < 3 && dx < 0 ? 1 : 2);
      }
      for (let y = 5; y < 16; y++) { const hw = y < 8 ? [2, 4, 5][y - 5] : 5; R(sx + 8 - hw, sy + y, hw * 2, 1, 3); }
      R(sx + 5, sy + 9, 1, 1, 2); R(sx + 10, sy + 12, 1, 1, 2);   /* 洞里一点微光 */
      R(sx + 2, sy + 4, 2, 1, 3); R(sx + 12, sy + 3, 1, 2, 3);   /* 岩石裂纹 */
      break;
    }
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
      base();
      R(sx + 7, sy + 12, 2, 4, 3);
      for (let y = 0; y < 13; y++) {
        const w = Math.min(14, 2 + (y % 5) * 2 + Math.floor(y / 5) * 2), x0 = sx + 8 - w / 2;
        R(x0, sy + y, w, 1, y % 5 < 2 ? 0 : y % 5 === 4 ? 3 : 2); R(x0, sy + y, 1, 1, 3); R(x0 + w - 1, sy + y, 1, 1, 3);
      }
      R(sx + 7, sy, 2, 1, 3);
      break;
    case 'k':
      /* 竹子：三根竹竿，一节一节的竹节，节上斜伸出竹叶 */
      base();
      for (const [x, h, s] of [[2, 16, 1], [7, 13, -1], [11, 15, 1]]) {
        const y0 = 16 - h;
        R(sx + x, sy + y0, 3, h, 2); R(sx + x, sy + y0, 1, h, 1); R(sx + x + 2, sy + y0, 1, h, 3);
        for (let y = y0 + 3; y < 16; y += 4) R(sx + x, sy + y, 3, 1, 3);
        for (let y = y0 + 2; y < 13; y += 4) {
          const lx = s > 0 ? x + 3 : x - 3;
          R(sx + lx, sy + y, 3, 1, 3); R(sx + lx + (s > 0 ? 2 : -1), sy + y - 1, 2, 1, 3);
        }
      }
      break;
    case 'c': rock(false); break;
    case 'i': rock(false, true); break;
    case 'm':
      /* 棉花：细细的黑枝，顶着三团雪白的棉桃，没有树冠 */
      base();
      R(sx + 3, sy + 15, 10, 1, 2);
      R(sx + 7, sy + 7, 1, 9, 3); R(sx + 4, sy + 8, 1, 4, 3); R(sx + 5, sy + 11, 2, 1, 3); R(sx + 11, sy + 6, 1, 5, 3); R(sx + 8, sy + 10, 3, 1, 3);
      R(sx + 2, sy + 12, 3, 1, 2); R(sx + 9, sy + 13, 3, 1, 2);
      if (!isDepleted(mx, my)) { spr(SPR_COTTON_BALL, sx + 1, sy + 4); spr(SPR_COTTON_BALL, sx + 9, sy + 2); spr(SPR_COTTON_BALL, sx + 4, sy); }
      break;
    case 'o': {
      /* 水井：一圈石头井栏，井口黑黑的水；上面木架子挂着吊桶 */
      base();
      R(sx + 2, sy + 1, 2, 10, 3); R(sx + 12, sy + 1, 2, 10, 3); R(sx + 3, sy + 2, 1, 8, 2); R(sx + 13, sy + 2, 1, 8, 2);
      R(sx + 1, sy, 14, 2, 3); R(sx + 2, sy, 12, 1, 2);
      R(sx + 8, sy + 2, 1, 3, 3); R(sx + 7, sy + 5, 3, 3, 3); R(sx + 8, sy + 6, 1, 1, 1);
      const rows = [[3, 10], [1, 14], [1, 14], [1, 14], [1, 14], [2, 12], [3, 10]];
      rows.forEach(([x0, w], k) => { const y = sy + 9 + k; R(sx + x0, y, w, 1, 1); R(sx + x0, y, 1, 1, 3); R(sx + x0 + w - 1, y, 1, 1, 3); });
      R(sx + 3, sy + 9, 10, 1, 3); R(sx + 3, sy + 15, 10, 1, 3);
      R(sx + 3, sy + 10, 10, 2, 3); R(sx + 5, sy + 10, 3, 1, 2);   /* 井口和水面反光 */
      for (const x of [4, 8, 11]) R(sx + x, sy + 12 + (x % 2), 1, 2, 2);   /* 井栏石缝 */
      break;
    }
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
      base();
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
      const herb = map && resSpecial(mx, my, '*');
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
        for (const [x, h] of [[5, 6], [7, 8], [9, 5], [11, 7]]) { R(sx + x, sy + 16 - h, 1, h, 3); R(sx + x - 1, sy + 16 - h, 3, 3, 2); R(sx + x, sy + 16 - h, 1, 1, 0); }
        break;
      }
      /* 普通草药：三片尖叶的一小丛，叶尖发白 */
      R(sx + 4, sy + 15, 8, 1, 2);
      spr(SPR_HERB, sx + 3, sy + 6);
      break;
    }
    case '&':
      base();
      if (isDepleted(mx, my)) { R(sx + 7, sy + 12, 2, 3, 2); break; }
      const sp = map && resSpecial(mx, my, '&');
      if (sp === 'renshen') {   /* 老山参：一圈掌状叶，中间一簇红果 */
        R(sx + 7, sy + 8, 2, 8, 2);
        for (const [lx, ly, w] of [[1, 9, 6], [9, 9, 6], [3, 6, 4], [9, 6, 4]]) { R(sx + lx, sy + ly, w, 2, 2); R(sx + lx, sy + ly, w, 1, 3); }
        for (const [bx, by] of [[6, 2], [8, 2], [7, 4], [5, 4], [9, 4], [7, 1]]) { R(sx + bx, sy + by, 2, 2, 3); R(sx + bx, sy + by, 1, 1, 1); }
        break;
      }
      if (sp === 'xuelian') {
        /* 天山雪莲：白色重瓣，像一朵莲花 */
        for (const [px, py, w, h] of [[2, 8, 4, 5], [10, 8, 4, 5], [5, 5, 6, 8], [6, 3, 4, 4]]) { R(sx + px, sy + py, w, h, 3); R(sx + px + 1, sy + py + 1, w - 2, h - 2, 0); }
        R(sx + 7, sy + 7, 2, 2, 1); R(sx + 3, sy + 14, 10, 1, 2);
        break;
      }
      /* 灵芝：扇形菌盖，一圈圈年轮，下面一根短柄 */
      R(sx + 4, sy + 15, 8, 1, 2);
      R(sx + 7, sy + 11, 2, 4, 3); R(sx + 8, sy + 11, 1, 3, 2);
      for (let y = 0; y < 6; y++) for (let x = 0; x < 12; x++) {
        const dx = x - 5.5, dy = 6 - y, r = Math.sqrt(dx * dx / 36 + dy * dy / 36);
        if (r < 1) R(sx + 2 + x, sy + 6 + y, 1, 1, r > 0.84 || y === 5 ? 3 : r > 0.6 ? 1 : r > 0.4 ? 2 : 1);
      }
      R(sx + 5, sy + 7, 2, 1, 0);
      break;
    case 'O': {
      base();
      const ore = map && resSpecial(mx, my, 'O'), dep = isDepleted(mx, my);
      if (dep) { R(sx + 3, sy + 12, 4, 3, 2); R(sx + 9, sy + 13, 3, 2, 2); R(sx + 3, sy + 12, 4, 1, 3); break; }
      const dark = ore === 'wujin' || ore === 'xuantiekuang', ice = ore === 'hantie';
      /* 矿：一堆棱角分明的矿块，每块左上一道白亮面，和圆滚滚的普通石头一眼分开 */
      R(sx + 1, sy + 15, 14, 1, 2);
      const chunk = (x, y, w, h) => {
        for (let k = 0; k < h; k++) {
          const cut = k === 0 || k === h - 1 ? 2 : k === 1 || k === h - 2 ? 1 : 0, x0 = sx + x + cut, ww = w - cut * 2, yy = sy + y + k;
          R(x0, yy, ww, 1, dark ? 3 : 2); R(x0, yy, 1, 1, 3); R(x0 + ww - 1, yy, 1, 1, 3);
          if (k === 0 || k === h - 1) R(x0, yy, ww, 1, 3);
          else {
            if (!dark) R(x0 + 1, yy, ww - 2, 1, 1);
            if (k < h / 2) R(x0 + 1, yy, Math.max(2, Math.round((ww - 2) * (0.75 - k / h))), 1, 0);
            else R(x0 + Math.round(ww / 2), yy, ww - Math.round(ww / 2) - 1, 1, dark ? 3 : 2);
          }
        }
      };
      chunk(2, 9, 7, 6); chunk(8, 9, 6, 6); chunk(5, 4, 7, 7);
      if (ice) { R(sx + 8, sy + 1, 1, 3, 3); R(sx + 7, sy + 2, 3, 1, 3); R(sx + 8, sy + 2, 1, 1, 0); }
      if ((frame + hs) % 90 < 10) { const px = sx + 4 + (hs % 8), py = sy + 6 + ((hs >> 3) % 5); R(px - 1, py, 3, 1, 0); R(px, py - 1, 1, 3, 0); }
      break;
    }
    case '=': case 'E':
      if (map && map.indoor) { planks(); R(sx + 2, sy + 4, 12, 10, 3); R(sx + 3, sy + 5, 10, 8, 2); R(sx + 5, sy + 8, 6, 2, 1); R(sx, sy + 14, T, 2, 3); break; }   /* 室内门口：一块门垫 */
      R(sx, sy, T, T, 0);
      R(sx + (hs % 13) + 1, sy + ((hs >> 5) % 13) + 1, 1, 1, 1);
      R(sx + ((hs >> 9) % 13) + 1, sy + ((hs >> 13) % 13) + 1, 2, 1, 1);
      if (tileAt(mx, my - 1) !== '=' && tileAt(mx, my - 1) !== 'E' && tileAt(mx, my - 1) !== 'B') R(sx, sy, T, 1, 1);
      if (tileAt(mx, my + 1) !== '=' && tileAt(mx, my + 1) !== 'E' && tileAt(mx, my + 1) !== 'B') R(sx, sy + 15, T, 1, 1);
      break;
    case ',': {
      /* 长草：铺在地面上的一丛丛尖草叶，随风轻轻摆；不铺灰底，草地边缘不会是方方正正的色块 */
      base();
      const sway = (Math.floor(frame / 30) + mx + my) % 2;
      for (const [bx, by] of [[1, 1], [9, 0], [5, 8], [12, 9]]) {
        const x = sx + bx, y = sy + by;
        R(x + 3, y + 1, 1, 6, 3); R(x + 3 + sway, y, 1, 1, 3);
        R(x + 1, y + 3, 1, 4, 2); R(x + 2, y + 5, 1, 2, 3); R(x + sway, y + 2, 1, 1, 2);
        R(x + 5, y + 3, 1, 4, 2); R(x + 4, y + 5, 1, 2, 3); R(x + 6 + sway, y + 2, 1, 1, 2);
      }
      break;
    }
    case 'f':
      /* 野花：两朵四瓣小花，白花瓣、黑描边、深色花心，下面有茎和叶 */
      base();
      for (const [fx, fy] of [[2, 2], [9, 8], [10, 1]]) spr(SPR_FLOWER, sx + fx, sy + fy);
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
      /* 树比别的东西都高一截：树冠往上伸出 4 像素，压到上一格 */
      const sy0 = sy; sy -= 4;
      const trunk = () => { R(sx + 7, sy0 + 8, 2, 8, 3); R(sx + 8, sy0 + 9, 1, 6, 2); };
      if (tv === 1) { /* 松树：一层层的尖顶 */
        { const s0 = sy; sy = sy0; base(); sy = s0; } trunk();
        for (let y = 0; y < 13; y++) { const w = Math.min(14, 2 + (y % 5) * 2 + Math.floor(y / 5) * 2), x0 = sx + 8 - w / 2; R(x0, sy + y, w, 1, y % 5 === 4 ? 3 : 2); R(x0, sy + y, 1, 1, 3); R(x0 + w - 1, sy + y, 1, 1, 3); }
        R(sx + 7, sy, 2, 1, 3); break;
      }
      if (tv === 2) { /* 柳树：树冠垂下一条条柳丝 */
        { const s0 = sy; sy = sy0; base(); sy = s0; } R(sx + 7, sy + 9, 2, 11, 3);
        for (let y = 0; y < 7; y++) for (let x = 0; x < 16; x++) { const dx = x - 7.5, dy = y - 3.5, r = dx * dx / 56 + dy * dy / 14; if (r < 1) R(sx + x, sy + y, 1, 1, r > 0.7 ? 3 : 2); }
        for (const [x, h] of [[1, 10], [3, 12], [5, 9], [10, 9], [12, 12], [14, 10]]) R(sx + x, sy + 4, 1, h, (x + my) % 2 ? 3 : 2);
        break;
      }
      if (tv === 3) { /* 果树：圆树冠上挂着果子 */
        { const s0 = sy; sy = sy0; base(); sy = s0; } trunk();
        for (let y = 0; y < 12; y++) for (let x = 1; x < 15; x++) { const dx = x - 7.5, dy = y - 6, r = dx * dx / 50 + dy * dy / 36; if (r < 1) R(sx + x, sy + y, 1, 1, r > 0.75 ? 3 : 2); }
        for (const [fx, fy] of [[4, 4], [9, 3], [11, 7], [6, 8], [3, 8]]) { R(sx + fx, sy + fy, 2, 2, 0); R(sx + fx + 1, sy + fy + 1, 1, 1, 3); }
        R(sx + 6, sy + 11, 4, 5, 3); R(sx + 7, sy + 12, 1, 3, 2); break;
      }
      { const s0 = sy; sy = sy0; base(); sy = s0; } trunk();
      for (let y = 0; y < 13; y++) for (let x = 0; x < 16; x++) {
        const dx = x - 7.5, dy = y - 6.5, r = dx * dx / 64 + dy * dy / 42;
        if (r < 1) R(sx + x, sy + y, 1, 1, r > 0.78 ? 3 : (dx < -1 && dy < -1 && r < 0.45) ? 1 : 2);
      }
      R(sx + 5, sy + 3, 2, 1, 1); R(sx + 9, sy + 7, 1, 1, 1);
      R(sx + 6, sy + 12, 4, 4, 3); R(sx + 7, sy + 13, 1, 2, 2);
      break;
    }
    case 'M': rock(true); break;
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
      base();
      R(sx, sy + 5, T, 2, 2); R(sx, sy + 11, T, 2, 2); R(sx, sy + 5, T, 1, 3);
      R(sx + 2, sy + 2, 2, 13, 3); R(sx + 12, sy + 2, 2, 13, 3);
      break;
    case 'r':
      /* 石头：矮矮扁扁一大块，平底，上面有裂纹；不发光，不能采 */
      base();
      for (let y = 0; y < 9; y++) for (let x = 0; x < 16; x++) {
        const dx = x - 7.5, dy = Math.max(0, 6 - y), r = dx * dx / 64 + dy * dy / 40;
        if (r < 1) R(sx + x, sy + 6 + y, 1, 1, r > 0.72 || y === 8 ? 3 : (y < 3 && dx < 0) ? 1 : 2);
      }
      R(sx + 9, sy + 8, 1, 3, 3); R(sx + 10, sy + 10, 2, 1, 3); R(sx + 4, sy + 11, 2, 1, 3);
      break;
    case 'S':
      base();
      R(sx + 7, sy + 9, 2, 7, 3);
      R(sx + 1, sy + 2, 14, 8, 3); R(sx + 2, sy + 3, 12, 6, 1);
      R(sx + 4, sy + 5, 8, 1, 2); R(sx + 4, sy + 7, 5, 1, 2);
      break;
    case 'J': {
      base();
      R(sx + 2, sy + 13, 12, 3, 3); R(sx + 3, sy + 1, 10, 13, 3); R(sx + 4, sy + 2, 8, 11, 1);   /* 石刻一直立在那里，谁看过都一样，人人都能看 */
      R(sx + 5, sy + 1, 6, 1, 3);
      for (const cx of [6, 9]) for (let yy = 4; yy < 12; yy += 2) R(sx + cx, sy + yy, 1, 1, 3);
      break;
    }
    case 'X': {
      base();
      const open = map && chestLeft(mx, my) > 0;
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
  if (b.style === 'bigtree') {   /* 老槐树：粗大的树干，一大团树冠盖过两格，往上伸出一截 */
    const r = (x, y, w, h, c) => R(sx + x, sy + y, w, h, c);
    r(12, 14, 8, 18, 3); r(14, 14, 3, 18, 2); r(9, 28, 14, 4, 3); r(6, 30, 4, 2, 3); r(22, 30, 4, 2, 3);
    for (let y = 0; y < 26; y++) for (let x = 0; x < 36; x++) {
      const dx = (x - 16) / 18, dy = (y - 10) / 13, d = dx * dx + dy * dy;
      if (d < 1 && !(y > 18 && Math.abs(x - 16) < 4)) R(sx + x - 2, sy + y - 12, 1, 1, d > 0.82 ? 3 : (x * 3 + y * 5 + (x >> 2)) % 7 === 0 ? 3 : y < 6 && x < 18 ? 1 : 2);
    }
    r(6, 6, 6, 1, 3); r(20, 2, 5, 1, 3); r(12, -6, 4, 1, 3);
    r(13, 26, 6, 2, 0);   /* 树下系着的红布条 */
    return;
  }
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
  /* 手套：戴在两只手上，颜色深浅分档 */
  liegong: { kind: 'bow', c: 2 }, niujiao: { kind: 'bow', c: 1 }, tietai: { kind: 'bow', c: 3 }, sheri: { kind: 'bow', c: 0, shine: true },
  feibiao: { kind: 'dart', c: 2 }, xiujian: { kind: 'dart', c: 1 }, hantieding: { kind: 'dart', c: 0 }, baoyu: { kind: 'dart', c: 0, shine: true },
  pishoutao: { kind: 'glove', c: 2 }, tieshoutao: { kind: 'glove', c: 1 }, hantieshoutao: { kind: 'glove', c: 0 }, tiancan: { kind: 'glove', c: 0, shine: true },
};
/* 拉弓：弓身横在身前和朝向垂直，前半段弦拉满、搭着箭，放箭后弦弹回 */
function heldBow(p, W, L, side, up) {
  const t = clamp(L.swing, 0, 1), col = L.sil ? 3 : W.c === 0 ? 3 : W.c, drawn = t < 0.5;
  if (side) {
    const bx = 12;
    for (let y = 3; y <= 15; y++) { const b = Math.round(Math.sin((y - 3) / 12 * Math.PI) * 2); p(bx + b, y, 1, 1, y === 3 || y === 15 ? 3 : col); }
    const sx = drawn ? 8 : bx; p(sx, 4, 1, 1, 3); p(sx, 14, 1, 1, 3);
    for (let y = 4; y <= 14; y++) { const k = drawn ? Math.round((1 - Math.abs(y - 9) / 5) * (bx - 8)) : 0; p(bx - k, y, 1, 1, 2); }
    if (drawn) { p(8, 9, 9, 1, 3); p(16, 8, 2, 3, 3); p(7, 8, 1, 3, 2); }
  } else {
    const by = up ? 4 : 13;
    for (let x = 1; x <= 15; x++) { const b = Math.round(Math.sin((x - 1) / 14 * Math.PI) * 2); p(x, by + (up ? -b : b), 1, 1, x === 1 || x === 15 ? 3 : col); }
    for (let x = 2; x <= 14; x++) p(x, by - (up ? -1 : 1) * (drawn ? Math.round((1 - Math.abs(x - 8) / 6) * 3) : 0), 1, 1, 2);
    if (drawn) { p(8, up ? by - 6 : by - 3, 1, 9, 3); }
  }
}
function heldWeapon(p, W, L, side, up) {
  const t = clamp(L.swing, 0, 1);
  /* 握把位置和朝前的方向（左右朝向时 p 会自动镜像） */
  const [hx, hy, fx, fy] = side ? [10, 11, 1, 0] : up ? [13, 8, 0, -1] : [13, 11, 0, 1];
  /* 挥动：先举起（偏向上方 70 度），再挥到正前方稍过一点 */
  const a = (-70 + t * 95) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
  let vx = fx * ca - fy * sa, vy = fx * sa + fy * ca;
  if (!side && !up) { vx = Math.abs(vx) * 0.5 + 0.5 * Math.abs(sa); vy = fy * Math.max(0.2, ca); }   /* 正面：从右肩斜着劈下来 */
  if (up) { vx = 0.3 + Math.abs(sa) * 0.4; vy = -Math.max(0.3, ca); }
  const n = Math.hypot(vx, vy) || 1; vx /= n; vy /= n;
  const dot = (x, y, c, w = 1) => p(Math.round(x), Math.round(y), w, w, c);
  const kind = W.kind || 'blade', len = kind === 'spear' ? 15 : kind === 'hammer' ? 9 : 10;
  const nx = -vy, ny = vx;   /* 刃的横向 */
  for (let i = -1; i <= len; i++) {
    const x = hx + vx * i, y = hy + vy * i;
    if (i <= 1) { dot(x, y, 3); continue; }   /* 握把 */
    if (kind === 'spear') { dot(x, y, 3); if (i >= len - 2) { dot(x + nx, y + ny, 3); dot(x - nx, y - ny, 3); } continue; }
    if (kind === 'hammer') { dot(x, y, 3); continue; }
    const core = L.sil ? 3 : (W.core != null ? W.core : 1);
    if (W.broad) { dot(x, y, 3); if (i < len) dot(x + nx, y + ny, i < len - 1 ? core : 3); if (i < len - 1) dot(x + nx * 2, y + ny * 2, 3); }
    else { dot(x, y, 3); if (i > 2 && i < len - 1) dot(x + nx, y + ny, core === 3 ? 2 : core); }
  }
  if (!kind || kind === 'blade') { dot(hx + vx * 2 + nx * 1.5, hy + vy * 2 + ny * 1.5, W.guard != null ? W.guard : 3); dot(hx + vx * 2 - nx * 1.5, hy + vy * 2 - ny * 1.5, W.guard != null ? W.guard : 3); }
  if (kind === 'hammer') { const x = hx + vx * len, y = hy + vy * len; for (let a2 = -2; a2 <= 2; a2++) for (let b2 = -1; b2 <= 2; b2++) dot(x + nx * a2 + vx * b2, y + ny * a2 + vy * b2, Math.abs(a2) < 2 && b2 > -1 && b2 < 2 && !L.sil ? 2 : 3); }
  if (kind === 'spear' && !L.sil) dot(hx + vx * (len - 3) + nx, hy + vy * (len - 3) + ny, 1);
}
function drawPerson(sx, sy, dir, step, L, flash) {
  if (flash) return;
  const fl = dir === 'left', side = fl || dir === 'right', up = dir === 'up';
  const C = c => (L.sil ? 3 : L.ghost ? (c === 3 ? 2 : 1) : c);
  const p = (x, y, w, h, c) => R(sx + (fl ? 16 - x - w : x), sy + y, w, h, C(c));
  const B = BODY[L.body] || BODY.buyi;
  const W = L.weapon ? WEAPON_LOOK[L.weapon] || WEAPON_LOOK.tiejian : null;
  /* 外观：脚下光环（一圈闪动的光点） */
  if (L.aura && !L.ghost && !L.sil) {
    for (let k = 0; k < 10; k++) { const a = k / 10 * Math.PI * 2 + frame / 20; R(sx + 8 + Math.round(Math.cos(a) * 8), sy + 15 + Math.round(Math.sin(a) * 2), 1, 1, (k + (frame >> 3)) % 3 ? 3 : 0); }
  }
  /* 外观：披风（正面、侧面在身后露出两边和下摆） */
  const capeC = L.cape === 'white' ? 0 : L.cape === 'grey' ? 1 : 2;
  if (L.cape && !up) { p(2, 6, 12, 9, 3); p(3, 7, 10, 7, capeC); if (side) { p(0, 7, 4, 8, 3); p(1, 8, 2, 6, capeC); } }
  // 长枪、铁锤：竖在身后，比人还高 / 锤头很大
  if (W && W.kind === 'bow' && L.swing == null) {   /* 弓斜背在身后：一道弯弓加一根弦 */
    const x = side ? 3 : 12, col = L.sil ? 3 : W.c;
    for (let y = 0; y <= 13; y++) { const bulge = Math.round(Math.sin(y / 13 * Math.PI) * 2); p(x + (side ? -bulge : bulge), y, 1, 1, y === 0 || y === 13 ? 3 : col === 0 && !up ? 3 : col); }
    p(x, 0, 1, 14, up ? 2 : 1);
    if (W.shine && (frame >> 4) % 2) p(x + (side ? -2 : 2), 6, 1, 1, 0);
  }
  if (W && W.kind && W.kind !== 'glove' && W.kind !== 'dart' && W.kind !== 'bow' && !up && L.swing == null) {
    const x = side ? 2 : 13;
    if (W.kind === 'spear') { p(x, -3, 1, 18, 3); p(x - 1, -5, 3, 2, 3); p(x, -6, 1, 1, 3); p(x - 1, -3, 3, 1, 1); }
    else { p(x, 3, 1, 10, 3); p(x - 2, -1, 5, 4, 3); p(x - 1, 0, 3, 2, 2); }
  }
  // 背上的刀剑（正面、侧面时先画，让身体挡住中段）
  if (W && !W.kind && !up && L.swing == null) {
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
  /* 出招时兵器拿在手里：从举起挥到前方；刀剑一条刃、刀更宽，枪很长带枪头，锤是长柄大锤头 */
  if (W && L.swing != null && W.kind === 'bow') heldBow(p, W, L, side, up);
  else if (W && L.swing != null && W.kind !== 'glove' && W.kind !== 'dart') heldWeapon(p, W, L, side, up);
  /* 暗器：腰间挂一个镖囊，露出几枚镖尾 */
  if (W && W.kind === 'dart' && !up) {
    const bx = side ? 4 : 10, gc = L.sil ? 3 : W.c;
    p(bx, 9, 4, 4, 3); p(bx + 1, 10, 2, 2, gc); p(bx, 8, 1, 1, 3); p(bx + 2, 7, 1, 2, 3);
    if (W.shine && (frame >> 4) % 2) p(bx + 1, 10, 1, 1, 0);
  }
  /* 手套：手掌那一截加粗、上色，护腕一道深边 */
  if (W && W.kind === 'glove') {
    const gc = L.sil ? 3 : W.c;
    if (side) { const sw = step ? 1 : 0; p(7, 11 + sw, 3, 3, 3); p(8, 12 + sw, 1, 1, gc); if (W.shine && (frame >> 4) % 2) p(9, 12 + sw, 1, 1, 0); }
    else {
      p(0, 11, 4, 3, 3); p(12, 11, 4, 3, 3); p(1, 12, 2, 1, gc); p(13, 12, 2, 1, gc);
      if (W.shine && (frame >> 4) % 2) { p(1, 12, 1, 1, 0); p(14, 12, 1, 1, 0); }
    }
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
  if (L.cape && up) { p(2, 6, 12, 10, 3); p(3, 6, 10, 9, capeC); p(7, 7, 2, 7, capeC === 2 ? 3 : 2); }   /* 背面：披风盖住整个后背 */
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
  else if (d.look) drawPerson(sx + ox, sy + oy, e.dir, step, e.lunge > 0 ? { ...d.look, swing: 1 - e.lunge / 8 } : d.look, flash);
  else if (e.kind === 'bandit') drawPerson(sx + ox, sy + oy, e.dir, step, { body: 'jinzhuang', hair: 'band', mask: true, weapon: 'dao' }, flash);
  else {
    drawPerson(sx + ox, sy + oy, e.dir, step, { body: 'heipao', hat: 'douli', beard: true, weapon: 'dao' }, flash);
    if (frame % 20 < 10) { R(sx + ox + 1, sy + oy + 14, 2, 1, 2); R(sx + ox + 13, sy + oy + 14, 2, 1, 2); }
  }
  if (e.stunT > 0) for (let k = 0; k < 3; k++) { const a = frame / 8 + k * 2.1; R(sx + 8 + Math.cos(a) * 6, sy - 2 + Math.sin(a) * 2, 1, 1, 3); }
  if (e === P.target && frame % 30 < 20) { R(sx + 6, sy - 10, 5, 1, 3); R(sx + 7, sy - 9, 3, 1, 3); R(sx + 8, sy - 8, 1, 1, 3); }
  if (!d.dummy && (e.hp < e.max || fighting(e))) {
    const w = d.boss || d.dboss ? 18 : 16, x0 = sx + (16 - w) / 2;
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
/* 剑气：一道弯弯的细气刃，两端渐淡 */
function qiArc(cx, cy, ang, r, sweep) {
  const n = Math.max(8, Math.round(r * sweep));
  for (let i = 0; i <= n; i++) {
    const u = i / n, q = ang - sweep / 2 + sweep * u, edge = u < 0.15 || u > 0.85;
    const x = cx + Math.round(Math.cos(q) * r), y = cy + Math.round(Math.sin(q) * r);
    R(x, y, 1, 1, edge ? 2 : 3);
    if (!edge && i % 2) R(cx + Math.round(Math.cos(q) * (r - 1)), cy + Math.round(Math.sin(q) * (r - 1)), 1, 1, 0);
  }
}
function ring(cx, cy, r, sy, c) { for (let k = 0; k < 28; k++) { const q = k * Math.PI / 14; R(cx + Math.cos(q) * r, cy + Math.sin(q) * r * sy, 2, 1, c); } }
/* 命中效果按兵器分：剑一道细斜痕，刀一个粗叉，枪一道贯穿线，锤砸出裂地碎石，拳一圈冲击波，暗器钉上一枚星点 */
function hitMark(k, sx, sy) {
  const life = (k.big ? 12 : 8) - k.t, B = k.big ? 1.5 : 1, dx = k.dx || 0, dy = k.dy || 0;
  if (k.cat === '剑') {
    /* 剑气扩散：一圈断续的剑气从中了剑的地方向外扩开，八道细芒往外射 */
    const rr = Math.min(10 * B, 2 + life * 1.7);
    for (let i = 0; i < 16; i++) {
      const q = i * Math.PI / 8 + life * 0.08;
      if (i % 4 !== 3) R(sx + Math.round(Math.cos(q) * rr), sy + Math.round(Math.sin(q) * rr * 0.8), 1, 1, life > 6 ? 2 : 3);
      if (i % 2 === 0) for (let j = 1; j <= 2; j++) { const d2 = rr * 0.45 + j * 1.5; R(sx + Math.round(Math.cos(q) * d2), sy + Math.round(Math.sin(q) * d2 * 0.8), 1, 1, 3); }
    }
    if (k.big && rr > 5) { const r2 = rr * 0.6; for (let i = 0; i < 12; i++) { const q = i * Math.PI / 6 - life * 0.1; R(sx + Math.round(Math.cos(q) * r2), sy + Math.round(Math.sin(q) * r2 * 0.8), 1, 1, 3); } }
    if (life < 5) { R(sx - 2, sy, 5, 1, 3); R(sx, sy - 2, 1, 5, 3); R(sx, sy, 1, 1, 0); }
  } else if (k.cat === '刀') {
    const L = Math.round(Math.min(6 * B, 2 + life * 2));
    for (let i = -L; i <= L; i++) { R(sx + i, sy - i, 2, 1, 3); R(sx + i, sy + i, 2, 1, 3); }
    R(sx - 1, sy - 1, 4, 3, 0); R(sx, sy, 2, 1, 3);
  } else if (k.cat === '枪') {
    const L = Math.round(Math.min(10 * B, 3 + life * 3));
    for (let i = -L; i <= L; i++) R(sx + dx * i, sy + dy * i, 1, 1, 3);
    for (let i = 1; i <= 3; i++) { R(sx + dx * (L - i) - dy * i, sy + dy * (L - i) - dx * i, 1, 1, 3); R(sx + dx * (L - i) + dy * i, sy + dy * (L - i) + dx * i, 1, 1, 3); }
    R(sx - 1, sy - 1, 3, 3, 0); R(sx, sy, 1, 1, 3);
  } else if (k.cat === '槌') {
    const L = Math.min(8 * B, 2 + life * 1.5), gy = sy + 6;
    for (const q of [0.3, 1.2, 2.0, 2.9, 3.6, 4.8, 5.6]) { const ex = sx + Math.round(Math.cos(q) * L), ey = gy + Math.round(Math.sin(q) * L * 0.45); R(ex, ey, 1, 1, 3); R(Math.round((sx + ex) / 2), Math.round((gy + ey) / 2), 1, 1, 3); }
    for (let i = 0; i < 4; i++) { const q = i * 1.6 + 0.4, h = Math.sin(life / 12 * Math.PI) * 6 * B; R(sx + Math.round(Math.cos(q) * L * 0.8), gy - h - i, 2, 2, 3); }
    R(sx - 2, sy - 2, 5, 4, 0); R(sx - 1, sy - 1, 3, 2, 3);
  } else if (k.cat === '拳') {
    const rr = Math.min(7 * B, 2 + life * 1.2);
    for (let i = 0; i < 12; i++) { const q = i * Math.PI / 6; R(sx + Math.round(Math.cos(q) * rr), sy + Math.round(Math.sin(q) * rr), 1, 1, life > 5 ? 2 : 3); }
    R(sx - 2, sy - 2, 5, 5, 3); R(sx - 1, sy - 1, 3, 3, 0);
  } else if (k.cat === '弓') {
    /* 箭钉在身上：箭杆朝来的方向露在外面，尾羽一抖一抖 */
    for (let i = 1; i <= 6; i++) R(sx - dx * i, sy - dy * i, 1, 1, 3);
    const w = life % 2 ? 1 : 2;
    for (const s2 of [-1, 1]) R(sx - dx * 6 + dy * s2 * w, sy - dy * 6 + dx * s2 * w, 1, 1, 3);
    if (life < 4) for (const [a, b] of [[2, 0], [-2, 0], [0, 2], [0, -2]]) R(sx + a, sy + b, 1, 1, 3);
    R(sx - 1, sy - 1, 3, 3, 0); R(sx, sy, 1, 1, 3);
  } else {
    R(sx - 1, sy, 3, 1, 3); R(sx, sy - 1, 1, 3, 3); R(sx - dx * 2, sy - dy * 2, 1, 1, 3); R(sx - dx * 3, sy - dy * 3, 1, 1, 2);
    if (life < 4) for (const [a, b] of [[2, 2], [-2, 2], [2, -2], [-2, -2]]) R(sx + a, sy + b, 1, 1, 3);
  }
}
function drawSparks() {
  for (const k of sparks) {
    const sx = Math.round(k.x - cam.x), sy = Math.round(k.y - cam.y), life = (k.big ? 12 : 8) - k.t, L = Math.min(k.big ? 7 : 4, 2 + life);
    if (k.cat && k.t >= 2) { hitMark(k, sx, sy); continue; }
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
    /* 剑气扩散：一剑劈开，三层剑气一层层往外荡开，越远越宽 */
    crescent(cx, cy, ang - Math.PI * 0.5, Math.PI, 15, 4, prog * 3);
    for (let j = 0; j < 3; j++) { const t = prog * 1.4 - j * 0.18; if (t > 0.1 && t < 1) qiArc(cx, cy, ang, 12 + t * 30, Math.PI * (0.45 + t * 0.5)); }
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
/* 暗器飞出去：一枚枚小镖沿直线飞到落点；第二式三道齐发 */
function drawShot(cx, cy, prog, dx, dy) {
  const shots = P.shot || [3], t = Math.min(1, prog * 1.6);
  shots.forEach((len, j) => {
    const o = j === 0 ? 0 : j === 1 ? -1 : 1, ox = -dy * o * T, oy = dx * o * T;
    const dist = Math.max(10, len * T) * t, x = cx + dx * dist + ox * t, y = cy + dy * dist + oy * t;
    for (let i = 1; i <= 3; i++) R(x - dx * i * 2, y - dy * i * 2, 1, 1, i === 3 ? 2 : 3);   /* 尾迹 */
    R(x - 1, y - 1, 3, 3, 3); R(x, y, 1, 1, 0); R(x + dx * 2, y + dy * 2, 1, 1, 3);
  });
}
/* 箭：拉弓的前半段不飞，放箭后一支带尾羽的长箭直飞到落点；第二式箭身带一道破空的气线 */
function drawArrow(cx, cy, prog, dx, dy) {
  if (prog < 0.35) return;
  const len = (P.shot && P.shot[0]) || 5, t = Math.min(1, (prog - 0.35) * 2.2), dist = Math.max(10, len * T) * t;
  const x = cx + dx * dist, y = cy + dy * dist;
  if (P.move2) for (let i = 4; i < dist; i += 2) R(cx + dx * i, cy + dy * i, 1, 1, 2);
  for (let i = 0; i < 9; i++) R(x - dx * i, y - dy * i, 1, 1, 3);
  R(x + dx - dy, y + dy - dx, 1, 1, 3); R(x + dx + dy, y + dy + dx, 1, 1, 3); R(x + dx * 2, y + dy * 2, 1, 1, 3);
  for (const s2 of [-1, 1]) { R(x - dx * 8 + dy * s2 * 2, y - dy * 8 + dx * s2 * 2, 1, 1, 3); R(x - dx * 9 + dy * s2, y - dy * 9 + dx * s2, 1, 1, 3); }
}
function drawSlash(cx, cy) {
  const prog = 1 - P.atkT / P.atkMax;
  const cat = SK[S.active].cat;
  const [dx, dy] = DIRS[P.dir];
  const ang = ANG[P.dir];
  if (cat === '暗器') return drawShot(cx, cy, prog, dx, dy);
  if (cat === '弓') return drawArrow(cx, cy, prog, dx, dy);
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
  if (prog > 0.35) qiArc(cx, cy, ang, 14 + (prog - 0.35) * 26, Math.PI * 0.5);   /* 一道剑气往前飞 */
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
    if (bx > -b.w * T - 10 && bx < GW + 10 && by > -b.h * T - 10 && by < GH + 10) { RMAP = darkGround() && b.kind === 'pagoda' ? [0, 0, 1, 3] : null; drawBuilding(b, bx, by); RMAP = null; }
  }
  const list = [];
  for (const n of npcs) { const nx = n.px != null ? n.px : n.x * T, ny = n.py != null ? n.py : n.y * T, walk = nx !== n.x * T || ny !== n.y * T; list.push({ y: ny, d: () => drawPerson(nx - cx, ny - cy, n.dir, walk ? (Math.floor((nx + ny) / 6) % 2) + 1 : 0, n.look) }); }
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
      const ms = moveSpeed();
      if (P.moving && ms > 1.09) {   /* 轻功练得好，走路时身后有一道淡淡的残影 */
        const [dx, dy] = DIRS[P.dir];
        drawPerson(sx - dx * 5, sy - dy * 5, P.dir, 0, { ...playerLook(), ghost: true });
      }
      drawPerson(sx + ox, sy + oy, P.dir, step, P.atkT > 0 ? { ...playerLook(), swing: 1 - P.atkT / P.atkMax } : playerLook(), P.hurtT > 0 && P.hurtT % 6 < 3);
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

/* NPC：头顶职业图标，有任务时换成闪烁的 ! 或 ?；脚下一直写着名字，走近时换成名字·身份 */
function renderNpcTags() {
  /* 主人在屋里的房子：有事找你时，门口上方也冒出 ! 或 ? */
  for (const b of map.buildings || []) {
    if (!b.inside) continue;
    const mk = (NPCS[b.inside] || []).map(n => { const q = questMark(n); return n.amb ? (q === '?' ? q : null) : q; }).find(Boolean);
    if (!mk) continue;
    const bx = (b.x + Math.floor(b.w / 2)) * T - cam.x + 2, by = (b.y + b.h - 1) * T - cam.y - 14 - ((frame >> 3) % 2);
    if (by < HUD_H) continue;
    R(bx, by, 12, 12, 3); R(bx + 4, by + 12, 4, 1, 3); R(bx + 5, by + 13, 2, 1, 3);
    if (frame % 40 < 30) txt(mk, bx + 6, by, 0, 'center');
  }
  for (const n of npcs) {
    const sx = (n.px != null ? n.px : n.x * T) - cam.x, sy = (n.py != null ? n.py : n.y * T) - cam.y;
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
      const label = n.role ? `${n.name}·${n.role}` : n.name, w = tw(label) + 6;
      const below = P.ty > n.y;
      const lx = Math.round(sx + 8 - w / 2), ly = (below && sy - 30 > HUD_H + 1) ? sy - 30 : sy + 17; /* 上方放不下就放到脚下，不压住顶部状态栏 */
      R(lx, ly, w, 12, 3); txt(label, lx + 3, ly + 1, 0);
    } else if (!dlg && !menu && S.showTag !== false && !n.amb && !n.quiet && sy + 17 < UB - 2) {   /* 屋里的闲人走近了才显示名字，免得满屋都是字 */
      /* 离得远时脚下也写着名字，一眼看清谁是谁；走近再显示身份 */
      txtOutline(n.name, sx + 8, sy + 16, 'center');
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
  const xf_ = S.passive['心法'], skl = P.sit ? (xf_ ? `${SK[xf_].short || SK[xf_].name.slice(0, 2)} ${lv(xf_).toFixed(2)}` : '未学心法') : `${SK[S.active].short} ${lv(S.active).toFixed(2)}`, slot = Math.floor((158 - tw(skl) - 5 - 2) / 3), pw = slot - 14;
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
/* 身边 5 格内能采的东西，头上都标着名字（三七、精铁矿……）；贴身那个多一个“A”，按 A 就采 */
const MARK_NAME = {
  J: () => '石刻', X: (x, y) => lootable(x, y) ? '旧木箱' : '空木箱',
  S: () => '告示牌', o: () => '水井', U: () => '洞口', g: () => (map && map.cellar ? '梯子' : '地窖'),
};
const markDone = (t, x, y) => t === 'X' && !lootable(x, y);
function renderLootTag() {
  if (dlg || menu) return;
  const list = [];
  /* 能互动的东西（石刻、木箱、告示牌、水井、洞口）整屏都标；能采的东西只标身边 5 格内的，免得满屏是字 */
  const x0 = Math.floor(cam.x / T), y0 = Math.floor(cam.y / T);
  for (let y = y0; y <= y0 + Math.ceil(GH / T); y++) for (let x = x0; x <= x0 + Math.ceil(GW / T); x++) {
    if (x < 0 || y < 0 || x >= map.w || y >= map.h) continue;
    const t = map.rows[y][x], d = Math.abs(x - P.tx) + Math.abs(y - P.ty);
    if (MARK_NAME[t]) list.push([d, x, y, MARK_NAME[t](x, y), MARK_NAME[t] && !markDone(t, x, y)]);
    else if (RES_TILES[t] && lootable(x, y) && Math.abs(x - P.tx) <= 6 && Math.abs(y - P.ty) <= 5) list.push([d, x, y, resName(x, y, t), true]);
  }
  list.sort((a, b) => b[0] - a[0]).slice(-14).forEach(([d, x, y, name, live]) => {
    const near = d === 1 && live && !['洞口', '地窖', '梯子'].includes(name), label = near ? name + ' A' : name, w = tw(label) + 6;
    const lx = Math.round(x * T - cam.x + 8 - w / 2), ly = y * T - cam.y - 12;
    R(lx, ly, w, 12, live ? 3 : 2); if (!near) R(lx + 1, ly + 1, w - 2, 10, 0);
    txt(label, lx + 3, ly + 1, near ? 0 : live ? 3 : 2);   /* 看过、开过的变灰 */
  });
}
/* 点地上的东西后显示的名字牌，带个小箭头指着它 */
function renderPeek() {
  if (!peek || dlg || menu || frame > peek.until) return;
  const w = tw(peek.name) + 6, cx = Math.round(peek.x * T - cam.x + 8);
  let lx = clamp(cx - w / 2, 2, GW - w - 2), ly = peek.y * T - cam.y - 14;
  if (ly < HUD_H + 2) ly = peek.y * T - cam.y + 18;
  R(lx - 1, ly - 1, w + 2, 14, 3); R(lx, ly, w, 12, 0); txt(peek.name, lx + 3, ly + 1, 3);
  if (ly < peek.y * T - cam.y) { R(cx - 2, ly + 12, 5, 1, 3); R(cx - 1, ly + 13, 3, 1, 3); R(cx, ly + 14, 1, 1, 3); }
  const bx = peek.x * T - cam.x, by = peek.y * T - cam.y;
  if (Math.floor(frame / 8) % 2) for (const [ox, oy] of [[0, 0], [13, 0], [0, 13], [13, 13]]) { R(bx + ox, by + oy, 3, 1, 3); R(bx + ox + (ox ? 2 : 0), by + oy + (oy ? -2 : 0), 1, 3, 3); }
}
/* 头顶信息：[门派]名字，有称号再加一行。正派浅底黑框，邪派黑底白字，中立或无门派只描边 */
function headTag(cx, top, name, sectShort, camp, title) {
  const label = (sectShort ? `[${sectShort}]` : '') + name, w = tw(label) + 6, x = Math.round(cx - w / 2);
  if (camp === '邪') { R(x, top, w, 12, 3); txt(label, x + 3, top, 0); }
  else if (camp === '正') { R(x, top, w, 12, 3); R(x + 1, top + 1, w - 2, 10, 0); txt(label, x + 3, top, 3); }
  else txtOutline(label, cx, top, 'center');
  if (title) { const tw2 = tw(title); txtOutline(title, cx, top - 12, 'center'); }
}
/* 正在和你打的怪：你锁定的那只，或者已经被惹毛、在 4 格内的 */
const fighting = e => !e.dead && !ED(e).dummy && (e === P.target || (e.adj && Math.abs(e.tx - P.tx) + Math.abs(e.ty - P.ty) <= 4));
function foeInFocus() {
  if (P.target && !P.target.dead && enemies.includes(P.target)) return P.target;
  let best = null, bd = 99;
  for (const e of enemies) if (fighting(e)) { const d = Math.abs(e.tx - P.tx) + Math.abs(e.ty - P.ty); if (d < bd) { bd = d; best = e; } }
  return best;
}
let foeShown = false;
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
  headTag(P.px + 8 - cam.x, P.py - cam.y - (P.sit ? 11 : 14), S.name, S.sect ? SECTS[S.sect].short : null, campOf(), S.champion ? '天下第一' : S.rep >= 20 ? rt : null);
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
  renderPeek();
  /* 对手的名字和血量统一放在上方的对手面板里，头顶只留血条和小箭头，不和自己的名字叠在一起 */
  for (const f of fx) txtOutline(f.text, f.x - cam.x, f.y - cam.y - 8 - (45 - f.t) * 0.35);
  /* 左上角一直写着现在在哪张地图（进图时中间的大横幅显示期间先不重复） */
  if (map && !menu && !(banner && banner.t > 0)) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    const w = tw(map.name) + 10, x = 3, y = HUD_H + 3;
    R(x, y, w, 13, 3); R(x + 1, y + 1, w - 2, 11, 0); R(x + 2, y + 2, w - 4, 9, 3);
    txt(map.name, x + 5, y + 1, 0);
    if (S.coach > 0) { const ct = `陪练×2 ${Math.ceil(S.coach / 3600)}分`, w2 = tw(ct) + 10; R(x, y + 15, w2, 13, 3); R(x + 1, y + 16, w2 - 2, 11, 0); txt(ct, x + 5, y + 16, 3); }
    /* 右上角：正在用的武功（类别字 + 全名）；打坐时换成正在运转的内功 */
    const sid = P.sit ? S.passive['心法'] : S.active;
    if (sid && SK[sid]) {
      const tag = CAT_TAG[SK[sid].cat], nm = SK[sid].name, w3 = tw(nm) + 22, x3 = GW - 3 - w3;
      const y3 = y + (foeShown && x3 < UX + 130 ? 27 : 0);
      R(x3, y3, w3, 13, 3); R(x3 + 1, y3 + 1, w3 - 2, 11, 0); R(x3 + 2, y3 + 2, 12, 9, 3);
      txt(tag, x3 + 3, y3 + 1, 0); txt(nm, x3 + 17, y3 + 1, 3);
    }
    g.setTransform(1, 0, 0, 1, UX, 0);
  }
  g.setTransform(1, 0, 0, 1, UX, 0);
  renderHud();
  if (menu) renderMenu();
  renderInspect();
  const fm = !!(menu && menu.tab === 5 && !menu.detail); if (fm !== fullMapOn) { fullMapOn = fm; gameEl.classList.toggle('fullmap', fm); }
  /* 对手面板：正在打的怪的名字、等级、血量，固定在画面上方正中 */
  const foe = !menu && !dlg ? foeInFocus() : null; foeShown = !!foe;
  if (foe) {
    const d = ED(foe), name = `${foe.name || d.name}${d.dummy ? '' : '  ' + d.lv + '级'}`, hpTxt = d.dummy ? '' : `${Math.max(0, Math.ceil(foe.hp))}/${foe.max}`;
    const w = Math.max(96, tw(name) + tw(hpTxt) + 18), x = Math.round(80 - w / 2), y = HUD_H + 3;
    R(x, y, w, 24, 3); R(x + 1, y + 1, w - 2, 22, 0); R(x + 2, y + 2, w - 4, 20, 3);
    txt(name, x + 5, y + 2, 0); txt(hpTxt, x + w - 5, y + 2, 1, 'right');
    bar(x + 5, y + 15, w - 10, 5, foe.hp / foe.max, 0);
  }
  if (banner && !menu && !foe) {
    const w = tw(banner.text) + 18;
    box(80 - w / 2, HUD_H + 4, w, 17); txt(banner.text, 80, HUD_H + 7, 3, 'center');
  }
  g.setTransform(1, 0, 0, 1, UX, UB - 144);
  if (!dlg && !menu) toasts.slice(-2).reverse().forEach((t, i) => {
    /* 窄屏时两侧按键会盖住画面下半截，提示改到上方显示 */
    const cramped = SAFE_W < 180, top = HUD_H - (UB - 144) + (foeShown ? 30 : 4);
    const w = Math.min(158, tw(t.text) + 8), y = cramped ? top + i * 13 : 131 - (guideShown ? 15 : 0) - i * 13;
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
    /* 选项太多时只显示放得下的几行，跟着光标上下滚动，不会冒出屏幕 */
    const top = HUD_H - (UB - 144) + 2, fit = Math.max(3, Math.floor((99 - top - 9) / 12));
    const n = c.options.length, rows = Math.min(n, fit);
    const first = clamp(c.sel - Math.floor(rows / 2), 0, n - rows);
    const w = Math.min(DW, Math.max(...c.options.map(o => tw(o))) + 22 + (n > rows ? 8 : 0)), h = rows * 12 + 9;
    const x = x0 + DW - w, y = 99 - h;
    box(x, y, w, h);
    for (let k = 0; k < rows; k++) { const i = first + k, o = c.options[i]; if (i === c.sel) txt('▶', x + 4, y + 5 + k * 12, 3); txt(o, x + 15, y + 5 + k * 12, 3); }
    /* 右边一道滚动条：上下还有选项时显示小三角 */
    if (n > rows) {
      const ax = x + w - 9;
      if (first > 0) for (let k = 0; k < 3; k++) R(ax + 2 - k, y + 5 + k, 1 + k * 2, 1, 3);
      if (first + rows < n) for (let k = 0; k < 3; k++) R(ax + k, y + h - 8 + k, 5 - k * 2, 1, 3);
      const trackY = y + 10, trackH = h - 20, bh = Math.max(3, Math.round(trackH * rows / n)), by = trackY + Math.round((trackH - bh) * first / (n - rows));
      R(ax + 2, trackY, 1, trackH, 1); R(ax + 1, by, 3, bh, 3);
    }
  } else if (done && frame % 40 < 26) txt('▼', x0 + DW - 12, 131, 3);
}
/* 武功详情：六档评级 + 小格条，和千年的武功说明一样直观 */
function pips(x, y, r) { for (let i = 0; i < 6; i++) R(x + i * 5, y + 3, 4, 5, i <= r ? 3 : 1); }
/* 菜单宽度：横屏时用上两侧空间 */
function renderSkillDetail(k) {
  const sk = SK[k], v = lv(k), atk = ATK_CATS.includes(sk.cat);
  const kd = skKind(k);
  txt(sk.name, 8, 33, 3);
  txt(`${CAT_NAME[sk.cat]}·` + (kd === '门派' ? `门派·${SECTS[sk.sect].short}` : kd === '生产' ? '副职业' : sk.villain ? `特殊·打${EN[sk.villain].name}得` : `${kd}`), 8 + tw(sk.name) + 6, 33, 2);
  txt(v.toFixed(2), MW - 8, 33, 2, 'right');
  txt(useLabel(sk), 8, 45, 2);
  const row = (y, x, label, r) => { txt(label, x, y, 2); txt(RT[r], x + 22, y, 3); pips(x + 44, y, r); };
  if (atk) {
    row(57, 6, '攻速', sk.spd); row(57, MW / 2 + 2, '回击', sk.rec);
    row(69, 6, '闪躲', sk.eva); row(69, MW / 2 + 2, '命中', sk.acc);
    txt('攻击', 6, 81, 2);
    sk.atk.forEach((r, i) => { txt(LOCS[i], 30 + i * 31, 81, 2); txt(RT[r], 41 + i * 31, 81, 3); });
    const tags = [sk.reach ? `远及${'一两三四五六七'[sk.reach - 1]}格` : '', sk.poison ? '可带毒' : '', sk.stun ? '可击晕' : '', sk.tier === 2 ? `每招耗体力${ST_COST[sk.cat]}内功2` : `每招耗体力${ST_COST[sk.cat]}`].filter(Boolean);
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
  MENU_TABS.forEach((t, i) => {
    const tw_ = (MW - 6) / MENU_TABS.length, x = Math.round(3 + i * tw_);
    if (TABS[menu.tab] === t) { R(x, 16, Math.round(tw_), 13, 3); txt(t, x + Math.round(tw_ / 2), 17, 0, 'center'); }
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

