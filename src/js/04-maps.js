/* ---------------- maps ---------------- */
/* 建筑：w/h 占几格，style 决定形制（hall 单檐、tall 两层楼、double 重檐大殿、pagoda 宝塔），kind 决定招牌装饰 */
const VILLAGE_BUILDINGS = [
  { x: 2, y: 2, label: '客栈', kind: 'inn', owner: 'inn' },
  { x: 9, y: 2, label: '兵器铺', kind: 'smith', owner: 'smith' },
  { x: 16, y: 2, label: '药铺', kind: 'pharmacy', owner: 'doctor' },
  { x: 2, y: 10, label: '村长家', kind: 'chief', owner: 'chief' },
  { x: 16, y: 10, label: '清虚观', kind: 'temple', owner: 'tao' },
];
const XY_BUILDINGS = [
  { x: 2, y: 7, w: 6, h: 4, style: 'tall', label: '酒楼', kind: 'tavern', owner: 'jiulou' },
  { x: 9, y: 8, label: '钱庄', kind: 'bank', owner: 'bank' },
  { x: 19, y: 8, label: '当铺', kind: 'pawn', owner: 'pawn' },
  { x: 25, y: 8, w: 6, label: '武馆', kind: 'school', owner: 'jiaotou' },
  { x: 3, y: 17, w: 6, label: '镖局', kind: 'escort', owner: 'biaotou' },
  { x: 11, y: 17, w: 4, label: '布庄', kind: 'cloth', owner: 'caifeng' },
  { x: 19, y: 17, label: '关帝庙', kind: 'temple' },
  { x: 26, y: 17, w: 4, kind: 'house' },
  { x: 11, y: 2, w: 4, kind: 'house' },
  { x: 19, y: 2, w: 4, kind: 'house' },
];
const SS_BUILDINGS = [
  { x: 9, y: 2, w: 7, h: 4, style: 'double', label: '大雄宝殿', kind: 'hall', owner: 'fangzhang' },
  { x: 2, y: 3, w: 5, h: 4, style: 'tall', label: '藏经阁', kind: 'library' },
  { x: 17, y: 2, w: 2, h: 4, style: 'pagoda', kind: 'pagoda' },
  { x: 20, y: 3, w: 2, h: 4, style: 'pagoda', kind: 'pagoda' },
];
const EM_BUILDINGS = [
  { x: 3, y: 3, label: '峨眉派', kind: 'nunnery', owner: 'shitai', snow: true },
  { x: 11, y: 1, w: 7, h: 4, style: 'double', label: '金顶', kind: 'hall', snow: true },
  { x: 21, y: 3, w: 2, h: 4, style: 'pagoda', kind: 'pagoda', snow: true },
];
for (const list of [VILLAGE_BUILDINGS, XY_BUILDINGS, SS_BUILDINGS, EM_BUILDINGS]) for (const b of list) { b.w = b.w || 5; b.h = b.h || 3; b.style = b.style || 'hall'; }
const placeBuildings = (m, list) => { for (const b of list) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) m[y][x] = 'H'; };
function blank(w, h, edge, fill) {
  const m = [];
  for (let y = 0; y < h; y++) { const r = []; for (let x = 0; x < w; x++) r.push(x === 0 || y === 0 || x === w - 1 || y === h - 1 ? edge : fill); m.push(r); }
  return m;
}
function genVillage() {
  const m = blank(24, 18, 'M', '.');
  const set = (x, y, c) => { m[y][x] = c; };
  for (let x = 1; x <= 22; x++) set(x, 6, '=');
  set(23, 6, 'E');
  for (let y = 6; y <= 16; y++) set(11, y, '=');
  set(11, 17, 'E');
  for (let x = 4; x <= 18; x++) set(x, 13, '=');
  [4, 11, 18].forEach(x => set(x, 5, '='));
  for (let y = 9; y <= 11; y++) { set(13, y, '~'); set(14, y, '~'); }
  [[8, 1], [14, 1], [22, 1], [1, 8], [22, 9], [1, 16], [8, 16], [15, 16], [22, 16], [8, 10], [22, 12]].forEach(([x, y]) => set(x, y, 'T'));
  [[7, 4], [15, 4], [21, 3], [5, 8], [17, 8], [9, 12], [20, 15], [3, 15], [13, 15]].forEach(([x, y]) => set(x, y, 'f'));
  set(0, 6, 'E');
  for (let y = 1; y <= 5; y++) set(15, y, '=');
  set(15, 0, 'E');
  set(22, 5, 'S'); set(10, 16, 'S'); set(2, 7, 'S'); set(1, 5, 'S'); set(16, 1, 'S');
  placeBuildings(m, VILLAGE_BUILDINGS);
  return m.map(r => r.join(''));
}
/* 襄阳城：城墙环绕，东西两座城门，石板大街 */
function genXiangyang() {
  const W = 32, H = 24, m = blank(W, H, 'W', '.');
  const set = (x, y, c) => { m[y][x] = c; };
  const rect = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c); };
  rect(1, 11, 30, 3, '_'); rect(15, 1, 2, 22, '_'); rect(1, 20, 30, 2, '_');
  set(0, 12, 'E'); set(31, 12, 'E');
  for (const x of [0, 31]) { set(x, 11, 'Q'); set(x, 13, 'Q'); }
  [[8, 15], [24, 15]].forEach(([x, y]) => set(x, y, 'o'));
  [[2, 15], [5, 14], [11, 15], [13, 14], [19, 15], [21, 14], [28, 15], [2, 2], [8, 3], [24, 2], [29, 4], [27, 6], [6, 5]].forEach(([x, y]) => set(x, y, 'T'));
  [[4, 15], [12, 16], [20, 16], [27, 14], [10, 5], [26, 4]].forEach(([x, y]) => set(x, y, 'f'));
  set(29, 10, 'S'); set(2, 10, 'S');
  placeBuildings(m, XY_BUILDINGS);
  return m.map(r => r.join(''));
}
/* ---- 牛家村、襄阳放大：原来的样子整块挪到中间，四周加新地方 ---- */
const GROWN = { village: [8, 6, 40, 30], xiangyang: [10, 8, 52, 40] };
const shiftKeys = (o, ox, oy) => Object.fromEntries(Object.entries(o).map(([k, v]) => { const [x, y] = k.split(',').map(Number); return [`${x + ox},${y + oy}`, v]; }));
function embed(rows, id, edge, fl) {
  const [ox, oy, W, H] = GROWN[id], m = blank(W, H, edge, fl);
  rows.forEach((r, y) => [...r].forEach((c, x) => { m[y + oy][x + ox] = c; }));
  return m;
}
function growVillage(rows0) {
  const [ox, oy, W, H] = GROWN.village, h0 = rows0.length, w0 = rows0[0].length;
  const m = embed(rows0, 'village', 'M', '.');
  const set = (x, y, c) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) m[y][x] = c; };
  /* 原来那圈山拆掉，村子往外长 */
  for (let y = oy; y < oy + h0; y++) for (let x = ox; x < ox + w0; x++) if ((y === oy || y === oy + h0 - 1 || x === ox || x === ox + w0 - 1) && (m[y][x] === 'M' || m[y][x] === 'E')) m[y][x] = m[y][x] === 'E' ? '=' : '.';
  /* 四条路通到新的村口 */
  for (let x = 1; x < ox; x++) m[oy + 6][x] = '='; m[oy + 6][0] = 'E';
  for (let x = ox + w0; x < W - 1; x++) m[oy + 6][x] = '='; m[oy + 6][W - 1] = 'E';
  for (let y = 1; y < oy; y++) m[y][ox + 15] = '='; m[0][ox + 15] = 'E';
  for (let y = oy + h0; y < H - 1; y++) m[y][ox + 11] = '='; m[H - 1][ox + 11] = 'E';
  /* 稻田：村东南一片水田，田埂隔开 */
  for (let y = 22; y < 28; y++) for (let x = 22; x < 38; x++) set(x, y, (x - 22) % 5 === 4 || y === 25 ? '.' : 'd');
  /* 村西南：一片菜地、几户人家门前的柴堆就用树和花点缀 */
  for (let y = 23; y < 28; y++) for (let x = 2; x < 16; x++) if (m[y][x] === '.' && (x * 7 + y * 3) % 11 === 0) set(x, y, 'T');
  for (let y = 23; y < 28; y++) for (let x = 2; x < 16; x++) if (m[y][x] === '.' && (x * 5 + y) % 13 === 0) set(x, y, 'f');
  /* 北边、东边空地种些树，留出路 */
  for (let y = 1; y < oy; y++) for (let x = 1; x < W - 1; x++) if (m[y][x] === '.' && (x * 13 + y * 7) % 9 === 0) set(x, y, 'T');
  for (let y = oy; y < oy + h0; y++) for (let x = ox + w0; x < W - 1; x++) if (m[y][x] === '.' && (x * 11 + y * 5) % 8 === 0) set(x, y, 'T');
  for (let y = oy; y < oy + h0; y++) for (let x = 1; x < ox; x++) if (m[y][x] === '.' && (x * 3 + y * 11) % 7 === 0) set(x, y, 'T');
  /* 池塘放大：村南路边一口大塘，塘边几棵柳树 */
  for (let y = 23; y < 28; y++) for (let x = 13; x < 19; x++) { const dx = (x - 15.5) / 3, dy = (y - 25) / 2.4; if (dx * dx + dy * dy < 1) set(x, y, '~'); }
  for (const [x, y] of [[12, 23], [19, 23], [12, 27], [19, 27]]) set(x, y, 'T');
  set(20, 25, 'S');
  /* 原来的东西挪过去 */
  for (const b of VILLAGE_BUILDINGS) { b.x += ox; b.y += oy; }
  /* 老槐树：村西口路边一棵三百岁的大槐树 */
  const tree = { x: 3, y: 15, w: 2, h: 2, style: 'bigtree', kind: 'bigtree', label: '老槐树' };
  for (let y = tree.y; y < tree.y + 2; y++) for (let x = tree.x; x < tree.x + 2; x++) m[y][x] = 'H';
  VILLAGE_BUILDINGS.push(tree); set(5, 17, 'S'); for (const [x, y] of [[2, 14], [3, 14], [4, 14], [5, 14], [2, 17], [3, 17], [4, 17], [5, 15], [5, 16], [2, 15], [2, 16]]) if (m[y][x] === 'T') m[y][x] = '.';
  return m.map(r => r.join(''));
}
function growXiangyang(rows0) {
  const [ox, oy, W, H] = GROWN.xiangyang, h0 = rows0.length, w0 = rows0[0].length;
  const m = embed(rows0, 'xiangyang', 'T', '.');
  const set = (x, y, c) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) m[y][x] = c; };
  /* 高大的城墙：原来的城墙外再砌一层，两层厚 */
  for (let y = oy - 1; y <= oy + h0; y++) for (let x = ox - 1; x <= ox + w0; x++) if (y === oy - 1 || y === oy + h0 || x === ox - 1 || x === ox + w0) m[y][x] = 'W';
  /* 东西城门洞：两层城墙都打通，门洞两边是城墩 */
  const gy = oy + 12;
  for (const x of [ox - 1, ox, ox + w0 - 1, ox + w0]) { m[gy][x] = '_'; m[gy - 1][x] = 'Q'; m[gy + 1][x] = 'Q'; }
  /* 出城的官道，一直通到新的城门外 */
  for (let x = 1; x < ox - 1; x++) m[gy][x] = '='; m[gy][0] = 'E';
  for (let x = ox + w0 + 1; x < W - 1; x++) m[gy][x] = '='; m[gy][W - 1] = 'E';
  /* 城外：东西两片树林、农田和护城河 */
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (m[y][x] !== '.') continue;
    const inCity = x >= ox - 1 && x <= ox + w0 && y >= oy - 1 && y <= oy + h0;
    if (inCity) continue;
    const moat = (x === ox - 3 || x === ox + w0 + 2) && y >= oy - 2 && y <= oy + h0 + 1 || (y === oy - 3 || y === oy + h0 + 2) && x >= ox - 3 && x <= ox + w0 + 2;
    if (moat) { m[y][x] = y === gy ? 'B' : '~'; continue; }
    if ((x * 13 + y * 7) % 10 === 0) m[y][x] = 'T'; else if ((x * 5 + y * 11) % 17 === 0) m[y][x] = 'f';
  }
  for (const x of [ox - 3, ox + w0 + 2]) m[gy][x] = 'B';
  /* 城北城南的农田 */
  for (let y = 2; y < oy - 4; y++) for (let x = ox + 2; x < ox + w0 - 2; x++) m[y][x] = (x - ox) % 6 === 5 ? '.' : 'd';
  for (let y = oy + h0 + 4; y < H - 2; y++) for (let x = ox + 2; x < ox + w0 - 2; x++) m[y][x] = (x - ox) % 6 === 5 ? '.' : 'd';
  for (const b of XY_BUILDINGS) { b.x += ox; b.y += oy; }
  /* 东西两座城楼：骑在城门上方的城墙上 */
  for (const [x, lbl] of [[ox - 2, '西城楼'], [ox + w0 - 1, '东城楼']]) {
    const b = { x, y: gy - 4, w: 3, h: 3, style: 'tall', label: lbl, kind: 'tower' };
    for (let y = b.y; y < b.y + b.h; y++) for (let xx = b.x; xx < b.x + b.w; xx++) m[y][xx] = 'H';
    XY_BUILDINGS.push(b);
  }
  return m.map(r => r.join(''));
}
/* 嵩山：竹林、山岩、石阶一路盘上山顶的少林寺 */
function genSongshan() {
  const W = 24, H = 30, m = blank(W, H, 'c', '.');
  const set = (x, y, c) => { m[y][x] = c; };
  const rect = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c); };
  rect(1, 1, 22, 10, '_');
  for (let x = 1; x <= 22; x++) set(x, 11, 'W');
  set(12, 11, '^'); set(11, 11, 'Q'); set(13, 11, 'Q');
  const stairs = (x0, y0, x1, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, '^'); };
  stairs(12, 22, 12, 28); stairs(6, 22, 12, 22); stairs(6, 16, 6, 22); stairs(6, 16, 12, 16); stairs(12, 12, 12, 16);
  set(12, 29, 'E');
  [[1, 13, 4, 6], [16, 13, 6, 4], [15, 24, 7, 4], [1, 24, 4, 4]].forEach(([x, y, w, h]) => rect(x, y, w, h, 'k'));
  [[9, 14], [18, 19], [3, 20], [20, 22], [9, 26], [2, 27], [15, 21], [10, 19]].forEach(([x, y]) => set(x, y, 'c'));
  [[8, 18], [17, 26], [4, 12], [21, 12]].forEach(([x, y]) => set(x, y, 'T'));
  [[14, 14], [8, 24], [18, 17]].forEach(([x, y]) => set(x, y, '*'));
  set(13, 27, 'S'); set(14, 12, 'S');
  placeBuildings(m, SS_BUILDINGS);
  return m.map(r => r.join(''));
}
/* 峨眉山：雪地、雪松、冰湖，山顶金顶和峨眉派 */
function genEmei() {
  const W = 30, H = 22, m = blank(W, H, 'P', '%');
  const set = (x, y, c) => { m[y][x] = c; };
  const rect = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c); };
  rect(2, 6, 22, 2, '_');
  const stairs = (x0, y0, x1, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, '^'); };
  stairs(14, 8, 14, 12); stairs(14, 12, 28, 12);
  set(29, 12, 'E');
  rect(4, 13, 6, 4, 'i'); rect(19, 15, 5, 3, 'i');
  [[3, 10], [8, 9], [20, 9], [25, 8], [11, 15], [16, 18], [26, 16], [2, 19], [7, 19], [24, 4], [27, 2], [9, 3], [19, 4]].forEach(([x, y]) => set(x, y, 'P'));
  [[11, 10], [22, 19], [3, 17]].forEach(([x, y]) => set(x, y, '&'));
  [[17, 14], [10, 18]].forEach(([x, y]) => set(x, y, 'c'));
  set(27, 11, 'S');
  placeBuildings(m, EM_BUILDINGS);
  return m.map(r => r.join(''));
}
const HM_BUILDINGS = [
  { x: 9, y: 14, w: 7, h: 4, style: 'double', label: '日月神教', kind: 'hall', owner: 'chiyan' },
  { x: 2, y: 13, label: '光明殿', kind: 'temple' },
  { x: 20, y: 13, w: 2, h: 4, style: 'pagoda', kind: 'pagoda' },
];
const TH_BUILDINGS = [
  { x: 10, y: 4, label: '桃花岛', kind: 'temple', owner: 'huadaozhu' },
  { x: 17, y: 5, w: 4, kind: 'house' },
];
for (const list of [HM_BUILDINGS, TH_BUILDINGS]) for (const b of list) { b.w = b.w || 5; b.h = b.h || 3; b.style = b.style || 'hall'; }
/* 黑木崖：黑岩峭壁，石阶下到崖底的日月神教总坛（邪派地盘） */
function genHeimuya() {
  const W = 26, H = 22, m = blank(W, H, 'c', 'v');
  const set = (x, y, c) => { m[y][x] = c; };
  const rect = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c); };
  const stairs = (x0, y0, x1, y1) => { for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) set(x, y, '^'); };
  set(8, 0, 'E'); stairs(8, 1, 8, 7); stairs(8, 7, 12, 7); stairs(12, 7, 12, 10);
  rect(1, 11, 24, 1, 'W'); set(12, 11, '^'); set(11, 11, 'Q'); set(13, 11, 'Q');
  rect(1, 12, 24, 9, '_');
  [[3, 3], [4, 4], [15, 2], [16, 3], [20, 5], [21, 6], [2, 8], [18, 9], [22, 2]].forEach(([x, y]) => set(x, y, 'c'));
  set(9, 2, 'S');
  for (const b of HM_BUILDINGS) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) set(x, y, 'H');
  return m.map(r => r.join(''));
}
/* 桃花岛：四面环海，沙滩、桃林，岛主隐居（中立地盘） */
function genTaohua() {
  const W = 26, H = 20, m = blank(W, H, '~', '.');
  const set = (x, y, c) => { m[y][x] = c; };
  const rect = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c); };
  rect(0, 0, W, 2, '~'); rect(0, H - 2, W, 2, '~'); rect(0, 0, 2, H, '~'); rect(W - 2, 0, 2, H, '~');
  rect(2, 2, W - 4, 1, 'y'); rect(2, H - 3, W - 4, 1, 'y'); rect(2, 2, 1, H - 4, 'y'); rect(W - 3, 2, 1, H - 4, 'y');
  rect(12, 7, 2, 10, '_');
  [[4, 4], [5, 6], [4, 9], [6, 11], [5, 14], [8, 13], [19, 9], [21, 11], [20, 13], [17, 14], [22, 8], [8, 9], [16, 10]].forEach(([x, y]) => set(x, y, 'q'));
  [[7, 5], [18, 12], [9, 15]].forEach(([x, y]) => set(x, y, '*'));
  set(14, 15, 'S');
  for (const b of TH_BUILDINGS) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) set(x, y, 'H');
  return m.map(r => r.join(''));
}
/* ================= 江湖总图：23 张地图 =================
   中原（中立）在中间，正派领地在西部名山，邪派领地在长城以外，东南到东海也是中立。
   城镇和门派总坛大小适中；野外是大地图，按难度分片放怪。 */
function mkRng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
/* 地图之间怎么连：[地图, 出口方向, 地图, 出口方向]。同一边有两个出口时写 N2 */
const LINKS = [
  ['village', 'N', 'luoyang', 'S'], ['village', 'E', 'wild', 'W'], ['village', 'S', 'meadow', 'N'], ['village', 'W', 'xiangyang', 'E'],
  ['wild', 'S', 'forest', 'N'], ['wild', 'E', 'yangzhou', 'W'],
  ['xiangyang', 'W', 'tongguan', 'E'], ['tongguan', 'W', 'zhongnan', 'E'], ['tongguan', 'N', 'huashan', 'S'],
  ['zhongnan', 'N', 'huashan', 'W'], ['zhongnan', 'S', 'shudao', 'N'], ['huashan', 'E', 'songshan', 'W'],
  ['songshan', 'S', 'luoyang', 'W'], ['songshan', 'N', 'yanmen', 'S'], ['luoyang', 'E', 'yangzhou', 'N'],
  ['yangzhou', 'N2', 'shanhai', 'S'], ['yangzhou', 'S', 'hangzhou', 'N'], ['shanhai', 'N', 'heimuya', 'N'], ['heimuya', 'W', 'pingding', 'E'],
  ['pingding', 'W', 'caoyuan', 'E'], ['caoyuan', 'S', 'yanmen', 'N'], ['caoyuan', 'W', 'damo', 'E'], ['damo', 'W', 'guangming', 'E'],
  ['shudao', 'S', 'emei', 'E'], ['emei', 'W', 'jueqing', 'E'],
  ['meadow', 'S', 'wudang', 'N'], ['shudao', 'E', 'miaojiang', 'N'],
  /* 地下图：U 开头的是山里的洞口 */
  ['heimuya', 'U', 'chengde', 'S'], ['wild', 'U', 'kuangdong', 'S'], ['caoyuan', 'U', 'langxue', 'S'], ['forest', 'U', 'heifeng', 'S'], ['huashan', 'U', 'siguo', 'S'],
  ['shudao', 'U', 'jianzhong', 'S'], ['jianzhong', 'N', 'jianzhong2', 'S'], ['damo', 'U', 'digong', 'S'], ['digong', 'N', 'digong2', 'S'],
];
/* 洞口在山里的位置 */
const CAVE_AT = { heimuya: { U: [18, 3] }, wild: { U: [12, 30] }, caoyuan: { U: [50, 30] }, forest: { U: [42, 30] }, huashan: { U: [34, 22] }, shudao: { U: [38, 34] }, damo: { U: [52, 10] } };
/* 手工画的地图，出口坐标固定 */
const HAND_EXITS = { village: { N: [23, 0], E: [39, 12], S: [19, 29], W: [0, 12] }, xiangyang: { E: [51, 20], W: [0, 20] }, songshan: { S: [12, 29], W: [0, 20], N: [20, 0] }, emei: { E: [29, 12], W: [0, 10] }, heimuya: { N: [8, 0], W: [0, 5] }, taohua: {} };
const HAND_SIZE = { village: [40, 30], xiangyang: [52, 40], songshan: [24, 30], emei: [30, 22], heimuya: [26, 22], taohua: [26, 20] };
function exitInner(ex, W, H) {
  if (ex.x > 0 && ex.y > 0 && ex.x < W - 1 && ex.y < H - 1) return [ex.x, ex.y + 1, 'down'];  // 地图中间的洞口：出来站在洞口下面
  if (ex.y === 0) return [ex.x, 1, 'down'];
  if (ex.y === H - 1) return [ex.x, H - 2, 'up'];
  if (ex.x === 0) return [1, ex.y, 'right'];
  return [W - 2, ex.y, 'left'];
}
function exitSlots(id, W, H) {
  const keys = []; for (const [a, sa, b, sb] of LINKS) { if (a === id) keys.push(sa); if (b === id) keys.push(sb); }
  const out = {};
  for (const side of ['N', 'S', 'E', 'W']) {
    const ks = keys.filter(k => k[0] === side).sort(), n = ks.length;
    ks.forEach((k, i) => {
      const f = (i + 1) / (n + 1);
      if (side === 'N') out[k] = [Math.round((W - 1) * f), 0];
      if (side === 'S') out[k] = [Math.round((W - 1) * f), H - 1];
      if (side === 'W') out[k] = [0, Math.round((H - 1) * f)];
      if (side === 'E') out[k] = [W - 1, Math.round((H - 1) * f)];
    });
  }
  return out;
}

/* ---------- 野外 / 关口 / 门派总坛：程序生成，种子固定，每次都一样 ---------- */
function genArea(id, sp) {
  const W = sp.W, H = sp.H, rng = mkRng(sp.seed), m = blank(W, H, sp.edge, sp.floor);
  const inside = (x, y) => x > 0 && y > 0 && x < W - 1 && y < H - 1;
  const set = (x, y, c) => { if (inside(x, y)) m[y][x] = c; };
  const keep = new Set(), K = (x, y) => y * 1000 + x;
  const road = sp.road || '=';
  const carve = (x, y, t) => { if (!inside(x, y)) return; m[y][x] = (m[y][x] === '~' || m[y][x] === 'B') ? 'B' : (t || road); keep.add(K(x, y)); };
  const rect = (x0, y0, w, h, c, k) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) { set(x, y, c); if (k) keep.add(K(x, y)); } };
  const path = (x0, y0, x1, y1, t) => {
    let x = x0, y = y0, hf = rng() < 0.5, g = 0; carve(x, y, t);
    while ((x !== x1 || y !== y1) && g++ < 4000) {
      const dx = Math.sign(x1 - x), dy = Math.sign(y1 - y);
      const mx = !dx ? false : !dy ? true : rng() < (hf ? 0.75 : 0.25);
      if (rng() < 0.1) hf = !hf;
      if (mx) x += dx; else y += dy;
      carve(x, y, t);
    }
  };
  for (const [t, n, r] of sp.patches || []) for (let k = 0; k < n; k++) {
    const cx = 2 + rng() * (W - 4), cy = 2 + rng() * (H - 4), rr = r * (0.6 + rng() * 0.8);
    for (let y = Math.floor(cy - rr); y <= cy + rr; y++) for (let x = Math.floor(cx - rr * 1.5); x <= cx + rr * 1.5; x++) { const dx = (x - cx) / 1.5, dy = y - cy; if (dx * dx + dy * dy <= rr * rr && rng() < 0.88) set(x, y, t); }
  }
  if (sp.river) {
    let rx = Math.round(W * sp.river);
    for (let y = 1; y < H - 1; y++) { if (rng() < 0.3) rx += rng() < 0.5 ? -1 : 1; rx = clamp(rx, 4, W - 6); set(rx, y, '~'); set(rx + 1, y, '~'); }
  }
  const hub = sp.hub || [W >> 1, H >> 1];
  const exits = EXIT_AT[id];
  /* 路：出口先拐到一个随机的中途点，再通往中心的岔路口，走起来有弯 */
  for (const k in exits) {
    const [x, y] = exits[k]; m[y][x] = 'E'; keep.add(K(x, y)); const [ix, iy] = exitInner({ x, y }, W, H);
    const vert = y === 0 || y === H - 1, j = (rng() - 0.5) * (vert ? W : H) * 0.35;
    const wx = clamp(Math.round((ix + hub[0]) / 2 + (vert ? j : 0)), 3, W - 4), wy = clamp(Math.round((iy + hub[1]) / 2 + (vert ? 0 : j)), 3, H - 4);
    path(ix, iy, vert ? ix : wx, vert ? wy : iy); path(vert ? ix : wx, vert ? wy : iy, wx, wy); path(wx, wy, hub[0], hub[1]);
  }
  for (let y = hub[1] - 1; y <= hub[1] + 1; y++) for (let x = hub[0] - 2; x <= hub[0] + 2; x++) if (inside(x, y) && !SOLID.has(m[y][x])) keep.add(K(x, y));
  for (const [x0, y0, x1, y1] of sp.roads || []) path(x0, y0, x1, y1);
  const buildings = [], npcDefs = [], extraSigns = {}, fixed = [];
  const bld = (b) => {
    b.w = b.w || 5; b.h = b.h || 3; b.style = b.style || 'hall';
    for (let y = b.y - 1; y <= b.y + b.h; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) if (inside(x, y) && !(m[y][x] === 'E')) { m[y][x] = sp.plaza || '_'; keep.add(K(x, y)); }
    for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) { m[y][x] = 'H'; keep.add(K(x, y)); }
    buildings.push(b);
    const dx = b.x + Math.floor(b.w / 2), dy = b.y + b.h;
    path(dx, dy + 1, hub[0], hub[1], sp.plaza || '_');
    return [dx, dy];
  };
  const ctx = { m, set, carve, rect, path, keep, K, rng, W, H, hub, bld, npc: n => npcDefs.push(n), spawn: (k, x, y) => { fixed.push([k, x, y]); keep.add(K(x, y)); }, sign: (x, y, t) => { set(x, y, 'S'); keep.add(K(x, y)); extraSigns[`${x},${y}`] = t; } };
  if (sp.build) sp.build(ctx);
  if (sp.ground === 'cave') for (const [, x, y] of fixed) path(x, y + 1, hub[0], hub[1], sp.floor);  // 洞里的头目：开一条路通到中间
  if (sp.peddler) {
    const [px, py] = [hub[0] + 1, hub[1]]; set(px, py, sp.plaza || sp.floor); keep.add(K(px, py));
    for (const [ax, ay] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!keep.has(K(px + ax, py + ay))) set(px + ax, py + ay, sp.floor); keep.add(K(px + ax, py + ay)); }
    npcDefs.push({ id: 'huolang_' + id, name: '货郎', role: '行脚商', icon: '货', x: px, y: py, dir: 'down', look: { body: 'buyi', hat: 'douli' }, talk: () => peddlerTalk() });
  }
  /* 山岭：野外地图上一道道连绵的山，不压路、不挡出口和房子；山洞的洞口就开在山脚 */
  const ridges = sp.ground === 'cave' ? 0 : sp.ridges != null ? sp.ridges : Math.round(W * H / 1100);
  for (let k = 0; k < ridges; k++) {
    let cx = 4 + rng() * (W - 8), cy = 4 + rng() * (H - 8);
    const len = 3 + Math.floor(rng() * 5), ang = rng() * Math.PI;
    for (let s = 0; s < len; s++) {
      const rx = 2 + rng() * 3.5, ry = 1.5 + rng() * 2.5;
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const dx = (x - cx) / rx, dy = (y - cy) / ry;
        if (dx * dx + dy * dy > 1 - rng() * 0.25 || !inside(x, y) || keep.has(K(x, y))) continue;
        if (Object.values(exits).some(([ex, ey]) => Math.abs(ex - x) + Math.abs(ey - y) <= 4)) continue;
        if (m[y][x] === '~' || m[y][x] === 'B' || m[y][x] === 'H') continue;
        m[y][x] = 'M';
      }
      cx += Math.cos(ang) * rx * 1.3; cy += Math.sin(ang) * ry * 1.3;
      if (cx < 4 || cy < 4 || cx > W - 5 || cy > H - 5) break;
    }
  }
  /* 树、石头成片生长：粗网格随机值插值出“疏密” */
  const gw = Math.ceil(W / 6) + 2, gh = Math.ceil(H / 6) + 2, grid = [];
  for (let i = 0; i < gw * gh; i++) grid.push(rng());
  const noise = (x, y) => { const fx = x / 6, fy = y / 6, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0, v = (i, j) => grid[(y0 + j) * gw + x0 + i]; return (v(0, 0) * (1 - tx) + v(1, 0) * tx) * (1 - ty) + (v(0, 1) * (1 - tx) + v(1, 1) * tx) * ty; };
  const fillable = new Set([sp.floor, ...(sp.fillOn || [])]);
  const wsum = (sp.obst || []).reduce((a, [, w]) => a + w, 0);
  const nearExit = (x, y) => Object.values(exits).some(([ex, ey]) => Math.abs(ex - x) + Math.abs(ey - y) <= 3);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (keep.has(K(x, y)) || !fillable.has(m[y][x]) || nearExit(x, y)) continue;
    const nz = noise(x, y); if (rng() < (sp.density || 0) * (0.05 + 2.8 * nz * nz * nz)) {
      let r = rng() * wsum; for (const [t, w] of sp.obst) { r -= w; if (r <= 0) { m[y][x] = t; break; } }
    }
  }
  const walk = (x, y) => !SOLID.has(m[y][x]) || m[y][x] === 'E';
  const reach = () => {
    const seen = new Set([K(hub[0], hub[1])]), q = [[hub[0], hub[1]]];
    while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= H || seen.has(K(nx, ny)) || !walk(nx, ny)) continue; seen.add(K(nx, ny)); q.push([nx, ny]); } }
    return seen;
  };
  /* 采集点、箱子：放在走得到的空地上，四周至少三面能走，不会把路堵死 */
  let R1 = reach();
  const openAround = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dy]) => R1.has(K(x + dx, y + dy))).length;
  const place = (t, n) => {
    for (let k = 0, tries = 0; k < n && tries < 4000; tries++) {
      const x = 2 + Math.floor(rng() * (W - 4)), y = 2 + Math.floor(rng() * (H - 4));
      if (!R1.has(K(x, y)) || keep.has(K(x, y)) || SOLID.has(m[y][x]) || nearExit(x, y) || openAround(x, y) < 3) continue;
      m[y][x] = t; keep.add(K(x, y)); R1.delete(K(x, y)); k++;
    }
  };
  for (const t in sp.res || {}) place(t, sp.res[t]);
  if (sp.chests) place('X', sp.chests);
  place('J', sp.steles != null ? sp.steles : (sp.zones && sp.zones.length ? 2 : 1));
  /* 出口旁的路牌 */
  for (const k in exits) if (k[0] === 'U') {
    const [x, y] = exits[k]; m[y][x] = 'U';
    for (const [ax, ay] of [[-1, 0], [1, 0], [-1, -1], [0, -1], [1, -1]]) if (inside(x + ax, y + ay) && !keep.has(K(x + ax, y + ay))) m[y + ay][x + ax] = 'M';
    /* 洞口开在一座小山脚下：洞口上方堆一座山 */
    if (sp.ground !== 'cave') for (let yy = y - 6; yy <= y - 1; yy++) for (let xx = x - 6; xx <= x + 6; xx++) {
      const dx = (xx - x) / 6.5, dy = (yy - (y - 3)) / 3.2;
      if (dx * dx + dy * dy <= 1 && inside(xx, yy) && !keep.has(K(xx, yy)) && !SOLID.has(m[yy][xx]) && m[yy][xx] !== 'U') m[yy][xx] = 'M';
    }
  }
  const signs = { ...extraSigns };
  for (const k in exits) {
    const [x, y] = exits[k], [ix, iy] = exitInner({ x, y }, W, H), to = EXIT_TO[id][k];
    const cand = y === 0 || y === H - 1 ? [[ix + 1, iy], [ix - 1, iy]] : [[ix, iy - 1], [ix, iy + 1]];
    for (const [sx, sy] of cand) if (inside(sx, sy) && !keep.has(K(sx, sy)) && !SOLID.has(m[sy][sx])) { m[sy][sx] = 'S'; signs[`${sx},${sy}`] = `路牌：往${SPEC_NAME[to]}。${AREA_HINT[to] ? '\n' + AREA_HINT[to] : ''}`; break; }
  }
  /* 放怪：每种怪在自己的那一片里，离出口远一点，彼此隔开 */
  R1 = reach();
  const spawns = [...fixed], used = fixed.map(([, x, y]) => [x, y]);
  for (const z of sp.zones || []) {
    const [fx0, fy0, fx1, fy1] = z.area || [0, 0, 1, 1];
    const x0 = Math.max(1, Math.floor(W * fx0)), x1 = Math.min(W - 2, Math.ceil(W * fx1)), y0 = Math.max(1, Math.floor(H * fy0)), y1 = Math.min(H - 2, Math.ceil(H * fy1));
    for (let k = 0, tries = 0; k < z.n && tries < 3000; tries++) {
      const x = x0 + Math.floor(rng() * (x1 - x0 + 1)), y = y0 + Math.floor(rng() * (y1 - y0 + 1));
      if (!R1.has(K(x, y)) || m[y][x] === 'E' || Object.values(exits).some(([ex, ey]) => Math.abs(ex - x) + Math.abs(ey - y) < 6)) continue;
      if (used.some(([ux, uy]) => Math.abs(ux - x) + Math.abs(uy - y) < 3)) continue;
      used.push([x, y]); spawns.push([z.kind, x, y]); k++;
    }
  }
  return { rows: m.map(r => r.join('')), spawns, signs, buildings, npcDefs };
}

/* ---------- 城镇：城墙、城门、十字大街，房子按位置摆 ---------- */
function genTown(id, sp) {
  const W = sp.W, H = sp.H, rng = mkRng(sp.seed), m = blank(W, H, 'W', sp.floor || '.');
  const set = (x, y, c) => { if (x > 0 && y > 0 && x < W - 1 && y < H - 1) m[y][x] = c; };
  const rect = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) set(x, y, c); };
  const st = sp.street || 12;
  rect(1, st, W - 2, 2, '_');
  const exits = EXIT_AT[id];
  for (const k in exits) {
    const [x, y] = exits[k]; m[y][x] = 'E';
    if (y === 0 || y === H - 1) { m[y][x - 1] = 'Q'; m[y][x + 1] = 'Q'; const [, iy] = exitInner({ x, y }, W, H); for (let yy = Math.min(iy, st); yy <= Math.max(iy, st + 1); yy++) set(x, yy, '_'); }
    else { m[y - 1][x] = 'Q'; m[y + 1][x] = 'Q'; for (let yy = Math.min(y, st); yy <= Math.max(y, st + 1); yy++) set(x === 0 ? 1 : W - 2, yy, '_'); }
  }
  for (const [t, x0, y0, w, h] of sp.rects || []) rect(x0, y0, w, h, t);
  const buildings = sp.buildings.map(b => ({ ...b, w: b.w || 5, h: b.h || 3, style: b.style || 'hall' }));
  const front = new Set();
  for (const b of buildings) { rect(b.x, b.y, b.w, b.h, 'H'); for (let x = b.x - 1; x <= b.x + b.w; x++) front.add(`${x},${b.y + b.h}`); }
  for (const n of sp.npcs || []) for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) front.add(`${n.x + dx},${n.y + dy}`);
  /* 各城的风景：先摆好，后面补民居时会绕开 */
  const sceneSigns = {}, sceneNpcs = [];
  if (sp.scenic) sp.scenic({ m, set, rect, W, H, st, fl: sp.floor || '.', front,
    bld: b => { b.w = b.w || 5; b.h = b.h || 3; b.style = b.style || 'hall'; buildings.push(b); rect(b.x, b.y, b.w, b.h, 'H'); for (let y = b.y - 1; y <= b.y + b.h; y++) for (let x = b.x - 1; x <= b.x + b.w; x++) front.add(`${x},${y}`); },
    sign: (x, y, t) => { set(x, y, 'S'); sceneSigns[`${x},${y}`] = t; front.add(`${x},${y}`); },
    npc: n => { sceneNpcs.push(n); for (const [dx, dy] of [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]]) front.add(`${n.x + dx},${n.y + dy}`); },
    keep: (x0, y0, w, h) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) front.add(`${x},${y}`); } });
  /* 空着的街区补上民居，城里看起来住满了人 */
  const fl = sp.floor || '.';
  const free = (x0, y0, w, h) => { for (let y = y0 - 1; y <= y0 + h; y++) for (let x = x0 - 1; x <= x0 + w; x++) { if (y < 1 || x < 1 || y > H - 2 || x > W - 2 || m[y][x] !== fl || front.has(`${x},${y}`)) return false; } return true; };
  for (let y = 2; y < H - 4; y++) for (let x = 2; x < W - 6; x++) {
    const w = rng() < 0.5 ? 4 : 5;
    if (rng() < 0.5 || !free(x, y, w, 3)) continue;
    const b = { x, y, w, h: 3, style: 'hall', kind: rng() < 0.55 ? 'house' : 'home' };
    buildings.push(b); rect(x, y, w, 3, 'H'); for (let xx = x - 1; xx <= x + w; xx++) front.add(`${xx},${y + 3}`);
  }
  const signs = {};
  for (const k in exits) {
    const [x, y] = exits[k], [ix, iy] = exitInner({ x, y }, W, H), to = EXIT_TO[id][k];
    const [sx, sy] = y === 0 || y === H - 1 ? [ix + 2, iy] : [ix, iy - 2];
    if (m[sy] && m[sy][sx] === (sp.floor || '.')) { m[sy][sx] = 'S'; signs[`${sx},${sy}`] = `${SPEC_NAME[id]}${{ N: '北', S: '南', E: '东', W: '西' }[k[0]]}门。往${SPEC_NAME[to]}。${AREA_HINT[to] ? '\n' + AREA_HINT[to] : ''}`; }
  }
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (m[y][x] !== (sp.floor || '.') || front.has(`${x},${y}`) || m[y - 1][x] === 'H') continue;
    if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => m[y + dy][x + dx] === 'E' || m[y + dy][x + dx] === 'Q')) continue;
    const r = rng();
    if (r < 0.035) m[y][x] = sp.tree || 'T'; else if (r < 0.06) m[y][x] = 'f';
  }
  for (const [x, y] of sp.wells || []) m[y][x] = 'o';
  return { rows: m.map(r => r.join('')), spawns: [], signs: { ...signs, ...sceneSigns, ...(sp.signs || {}) }, buildings, npcDefs: (sp.npcs || []).concat(sceneNpcs) };
}

/* ---------- 每张地图的设定 ---------- */
const SPEC_NAME = { chengde: '成德殿密道', kuangdong: '伏牛矿洞', langxue: '狼穴', heifeng: '黑风洞', siguo: '思过崖山洞', jianzhong: '剑冢·上层', jianzhong2: '剑冢·下层', digong: '沙城地宫·上层', digong2: '沙城地宫·下层', wudang: '武当山', miaojiang: '苗疆', village: '牛家村', meadow: '兔儿坡', wild: '伏牛山脚', forest: '黑松林', xiangyang: '襄阳城', tongguan: '潼关', zhongnan: '终南山', huashan: '华山', songshan: '嵩山', luoyang: '洛阳', yangzhou: '扬州', hangzhou: '杭州', taohua: '桃花岛', shanhai: '山海关', heimuya: '黑木崖', pingding: '平定州', caoyuan: '塞外草原', yanmen: '雁门关', damo: '大漠', guangming: '光明顶', shudao: '蜀道', emei: '峨眉山', jueqing: '绝情谷' };
const AREA_HINT = {
  meadow: '野兔、狐狸。新手练功的好去处。', wild: '野狼、山贼出没，河东有黑风寨。', forest: '熊、虎出没，功夫不到家别进去。',
  luoyang: '丐帮总舵就在城里。', yangzhou: '江南大城，往北是山海关，往南是杭州。', hangzhou: '西湖边有船去桃花岛。',
  tongguan: '边关要塞。正邪两派在这里狭路相逢。', zhongnan: '全真教重阳宫。', huashan: '华山险峻，只有一流高手才上得去。',
  songshan: '少林寺。', yanmen: '出了雁门关就是塞外，邪派地盘。', shanhai: '出了山海关往北，就是黑木崖。',
  heimuya: '日月神教总坛。正派中人，擅入者死！', pingding: '邪派的地盘，正派人士小心。', caoyuan: '草原狼群、蒙古骑兵。',
  damo: '黄沙漫天，沙匪横行。', guangming: '明教总坛。', shudao: '蜀道难，山匪、豹子出没。', emei: '峨眉派。山上大雪，雪狼成群。',
  jueqing: '情花遍谷，绝情谷主武功极高。', chengde: '黑木崖下的密道，通往东方不败的绣房。', kuangdong: '废弃矿洞，矿匪盘踞，精铁多。', langxue: '草原狼的老巢，狼王在最深处。', heifeng: '黑漆漆的山洞，熊王在里面冬眠。出寒铁、老山参。', siguo: '前人面壁思过之处，石壁上刻满剑招。', jianzhong: '埋剑之地，剑气森森。寒铁、雪莲。', jianzhong2: '剑冢最深处，守灵人守着玄铁。', digong: '黄沙下的古城地宫。出乌金。', digong2: '地宫最深处，尸王守着前朝宝藏。', wudang: '武当山紫霄宫。山路长，猴子、野猪多。', miaojiang: '苗疆密林，毒虫猛兽遍地。', xiangyang: '天下重镇，各派都在这里招人。', village: '出生的小村子。',
};
const CAVE = (o) => ({ edge: 'M', floor: '.', ground: 'cave', obst: [['c', 6], ['M', 4]], density: 0.42, steles: 1, chests: 2, ...o });
const W_SPECS = {
  chengde: CAVE({ W: 34, H: 30, seed: 353, res: { O: 4, '&': 3 }, hub: [17, 14], obst: [['c', 4], ['M', 3]], density: 0.3,
    build(c) { c.spawn('dongfang', 17, 3); c.sign(20, 5, '绣房。屋里满是绣架和花线。'); },
    zones: [{ kind: 'jiaozhong', n: 7, area: [0, 0.2, 1, 0.9] }] }),
  kuangdong: CAVE({ W: 40, H: 32, seed: 301, res: { O: 12, '&': 2 }, hub: [20, 14],
    build(c) { c.spawn('kuangba', 20, 3); c.sign(20, 6, '矿洞深处。\n“此矿归我矿霸所有，挖一块铁留一根指头！”'); },
    zones: [{ kind: 'kuangfei', n: 10, area: [0, 0, 1, 0.9] }] }),
  langxue: CAVE({ W: 40, H: 34, seed: 307, res: { O: 4, '*': 4 }, hub: [20, 16],
    build(c) { c.spawn('langwang', 20, 3); },
    zones: [{ kind: 'cylang', n: 12, area: [0, 0, 1, 0.9] }] }),
  heifeng: CAVE({ W: 44, H: 36, seed: 311, res: { O: 8, '&': 5 }, hub: [22, 18],
    build(c) { c.spawn('xiongwang', 22, 3); c.sign(25, 5, '洞壁上满是爪痕。'); },
    zones: [{ kind: 'dongxiong', n: 9, area: [0, 0, 1, 0.9] }] }),
  siguo: CAVE({ W: 38, H: 32, seed: 313, res: { O: 6, '&': 3 }, hub: [19, 15], steles: 3,
    build(c) { c.spawn('yuebuqun', 19, 3); c.sign(16, 4, '石壁上刻满了剑招，剑剑都是破解华山剑法的。'); },
    zones: [{ kind: 'hsjianke', n: 7, area: [0, 0, 1, 0.9] }] }),
  jianzhong: CAVE({ W: 44, H: 36, seed: 317, res: { O: 8, '&': 4 }, hub: [22, 18],
    build(c) { c.spawn('zuolengchan', 8, 6); },
    zones: [{ kind: 'jianling', n: 10, area: [0, 0, 1, 0.9] }] }),
  jianzhong2: CAVE({ W: 40, H: 34, seed: 331, res: { O: 8, '&': 4 }, hub: [20, 16],
    build(c) { c.spawn('jianshou', 20, 4); c.sign(23, 6, '剑冢。\n“剑在人在，剑亡人亡。”'); },
    zones: [{ kind: 'jianling', n: 9, area: [0, 0, 1, 0.9] }] }),
  digong: CAVE({ W: 46, H: 36, seed: 337, ground: 'cave', res: { O: 10 }, hub: [23, 18],
    build(c) { c.spawn('ouyangfeng', 38, 6); },
    zones: [{ kind: 'shiwei', n: 11, area: [0, 0, 1, 0.9] }] }),
  digong2: CAVE({ W: 40, H: 34, seed: 347, res: { O: 8, '&': 3 }, hub: [20, 16],
    build(c) { c.spawn('shiwang', 20, 4); c.sign(23, 6, '前朝宝库。\n“擅入者，与我等同眠。”'); },
    zones: [{ kind: 'shiwei', n: 10, area: [0, 0, 1, 0.9] }] }),
  wudang: { W: 40, H: 42, seed: 131, peddler: true, edge: 'T', floor: '.', road: '^', plaza: '_', obst: [['T', 7], ['c', 2], ['P', 1]], density: 0.26, hfloor: '_', hub: [20, 18],
    res: { '*': 6, '&': 3 }, chests: 1,
    build(c) {
      const [dx, dy] = c.bld({ x: 16, y: 32, w: 7, h: 4, style: 'double', label: '紫霄宫', kind: 'hall' });
      c.bld({ x: 28, y: 31, w: 2, h: 4, style: 'pagoda', kind: 'pagoda' });
      c.npc({ id: 'wdzhang', name: '冲虚道长', role: '武当派', icon: '武', x: dx + 1, y: dy, dir: 'down', look: { body: 'wdpao', hair: 'crown', beard: true }, talk: () => sectTalk('冲虚道长', 'wudang') });
      c.npc({ id: 'wd_tong', name: '武当道童', role: '武当派', x: dx + 3, y: dy, dir: 'down', look: { body: 'wdpao', hair: 'bun' }, talk: () => say('武当道童', ['师父说，太极拳要练得慢，越慢越好。', '后山有个星宿派的探子鬼鬼祟祟，师兄们去赶了好几回。']) });
      c.sign(dx - 3, dy, '紫霄宫。武当派。\n太极之道，以柔克刚。');
    },
    zones: [{ kind: 'wddizi', n: 6, area: [0, 0.35, 1, 0.75] }, { kind: 'boar', n: 6, area: [0, 0, 1, 0.4] }] },
  miaojiang: { W: 46, H: 38, seed: 137, peddler: true, edge: 'T', floor: ';', road: '^', plaza: '_', obst: [['T', 8], ['f', 2], ['r', 1]], density: 0.3, ground: 'forest', hfloor: '_', hub: [23, 16],
    res: { '*': 8, '&': 4 }, chests: 1,
    build(c) {
      const [dx, dy] = c.bld({ x: 20, y: 28, w: 7, h: 4, style: 'double', label: '五毒教', kind: 'hall' });
      c.npc({ id: 'lanjz', name: '蓝教主', role: '五毒教', icon: '毒', x: dx + 1, y: dy, dir: 'down', look: { body: 'wduyi', hair: 'bun' }, talk: () => sectTalk('蓝教主', 'wudu') });
      c.npc({ id: 'wd_miao', name: '苗家阿妹', role: '五毒教', x: dx + 3, y: dy, dir: 'down', look: { body: 'wduyi', hair: 'bun' }, talk: () => say('苗家阿妹', ['阿哥，莫要乱摸路边的花，有毒哟。', '唐门的人跟我们五毒教抢生意，见了不用客气。']) });
      c.sign(dx - 3, dy, '五毒教。\n蛇、蝎、蜈蚣、蟾蜍、蜘蛛，皆是本教之宝。');
      c.spawn('jiumozhi', 6, 8); c.path(6, 9, c.hub[0], c.hub[1], '^');
    },
    zones: [{ kind: 'wdjz', n: 7, area: [0, 0.4, 1, 1] }, { kind: 'baozi', n: 5, area: [0, 0, 1, 0.5] }] },
  meadow: { W: 44, H: 32, seed: 11, edge: 'T', floor: '.', patches: [[',', 7, 4]], obst: [['T', 5], ['f', 3], ['r', 1]], density: 0.12, fillOn: [','],
    res: { '*': 16, m: 9, O: 4 }, chests: 1, zones: [{ kind: 'rabbit', n: 16, area: [0, 0, 1, 0.55] }, { kind: 'fox', n: 12, area: [0, 0.45, 1, 1] }] },
  wild: { W: 56, H: 40, seed: 23, peddler: true, edge: 'T', floor: '.', patches: [[',', 8, 4]], obst: [['T', 6], ['r', 2], ['f', 1]], density: 0.16, fillOn: [','], river: 0.55,
    res: { '*': 8, O: 7, '&': 1, m: 3 }, chests: 2, hub: [24, 22],   /* 伏牛山脚：也有少量灵芝、棉花，新手不用远跑 */
    build(c) {
      /* 黑风寨：河东北角，木栅栏围起来，南边开寨门 */
      const x0 = c.W - 16, y0 = 2, w = 13, h = 10;
      for (let x = x0; x < x0 + w; x++) { c.set(x, y0, 'F'); c.set(x, y0 + h - 1, 'F'); }
      for (let y = y0; y < y0 + h; y++) { c.set(x0, y, 'F'); c.set(x0 + w - 1, y, 'F'); }
      c.rect(x0 + 1, y0 + 1, w - 2, h - 2, '.', true);
      const gx = x0 + 6; c.carve(gx, y0 + h - 1); c.path(gx, y0 + h, c.hub[0] + 10, c.hub[1]);
      c.sign(gx - 2, y0 + h, '木牌：黑风寨\n闲人免进，违者剁手！');
      c.spawn('boss', gx, y0 + 3);
    },
    zones: [{ kind: 'wolf', n: 14, area: [0, 0, 0.5, 1] }, { kind: 'bandit', n: 12, area: [0.6, 0.25, 1, 1] }] },
  forest: { W: 56, H: 40, seed: 37, edge: 'T', floor: ';', obst: [['T', 9], ['r', 1]], density: 0.34, ground: 'forest',
    res: { O: 6, '&': 6, '*': 6 }, chests: 2, zones: [{ kind: 'bear', n: 10, area: [0, 0, 1, 0.6] }, { kind: 'tiger', n: 6, area: [0, 0.5, 1, 1] }] },
  shudao: { W: 50, H: 44, seed: 41, peddler: true, edge: 'M', floor: '.', road: '^', obst: [['c', 6], ['T', 3], ['k', 2]], density: 0.32, patches: [['k', 4, 3]], fillOn: ['k'], hfloor: '_',
    res: { '*': 8, '&': 3 }, chests: 1,
    build(c) {
      const [dx, dy] = c.bld({ x: 4, y: 15, w: 7, h: 4, style: 'double', label: '唐家堡', kind: 'hall' });
      c.npc({ id: 'tmzhu', name: '唐堡主', role: '唐门', icon: '唐', x: dx + 1, y: dy, dir: 'down', look: { body: 'tmjin', hair: 'knot', beard: true }, talk: () => sectTalk('唐堡主', 'tangmen') });
      c.npc({ id: 'tm_dizi', name: '唐门弟子', role: '唐门', x: dx + 3, y: dy, dir: 'down', look: { body: 'tmjin', hair: 'band' }, talk: () => say('唐门弟子', ['唐门的毒，只有唐门的解药能解。', '五毒教那帮苗人也玩毒，跟我们唐门向来不对付。']) });
      c.sign(dx - 2, dy, '唐家堡。唐门重地。\n堡里的东西，碰不得。');
    }, zones: [{ kind: 'shanfei', n: 9, area: [0, 0, 1, 0.55] }, { kind: 'baozi', n: 7, area: [0, 0.45, 1, 1] }] },
  tongguan: { W: 40, H: 28, seed: 53, edge: 'M', floor: '.', road: '_', obst: [['c', 5], ['r', 2], ['T', 1]], density: 0.22,res: { O: 4, '*': 3 }, 
    build(c) { passWall(c, 'v', Math.round(c.W * 0.42), '潼关'); },
    zones: [{ kind: 'mazei', n: 4, area: [0, 0, 0.35, 1] }, { kind: 'qzdizi', n: 2, area: [0.5, 0, 1, 1] }, { kind: 'wuseng', n: 2, area: [0.5, 0, 1, 1] }, { kind: 'jiaozhong', n: 2, area: [0, 0, 0.4, 1] }, { kind: 'mjzhong', n: 2, area: [0, 0, 0.4, 1] }] },
  zhongnan: { W: 38, H: 34, seed: 61, edge: 'T', floor: '.', road: '^', plaza: '_', obst: [['T', 6], ['c', 2], ['f', 1]], density: 0.24, hfloor: '_', hub: [19, 18],
    res: { '*': 6, '&': 2, m: 3 }, chests: 1,
    build(c) {
      const [dx, dy] = c.bld({ x: 15, y: 3, w: 7, h: 4, style: 'double', label: '重阳宫', kind: 'hall', owner: 'qzzong' });
      c.bld({ x: 26, y: 4, w: 2, h: 4, style: 'pagoda', kind: 'pagoda' });
      c.npc({ id: 'qzzong', name: '丘道长', role: '全真教', icon: '全', x: dx + 1, y: dy + 1, dir: 'down', look: { body: 'daopao', hair: 'crown', beard: true }, talk: taoTalk });
      c.sign(dx - 3, dy + 1, '重阳宫。全真教总坛。\n清虚道长是本教派在牛家村的执事。');
      const [gx, gy] = c.bld({ x: 4, y: 25, w: 5, h: 3, label: '古墓', kind: 'temple' });
      c.npc({ id: 'sunpo', name: '孙婆婆', role: '古墓派', icon: '墓', x: gx + 1, y: gy, dir: 'down', look: { body: 'gmbai', hair: 'bun' }, talk: () => sectTalk('孙婆婆', 'gumu') });
      c.npc({ id: 'gm_ya', name: '古墓侍女', role: '古墓派', x: gx + 3, y: gy, dir: 'down', look: { body: 'gmbai', hair: 'bun' }, talk: () => say('古墓侍女', ['墓里的玉蜂是祖师婆婆传下来的，蜂蜜能治百病。', '全真教那帮牛鼻子老道，常在墓外探头探脑，讨厌得很。']) });
      c.sign(gx - 1, gy, '活死人墓。\n擅入者，后果自负。');
    },
    zones: [{ kind: 'qzdizi', n: 6, area: [0, 0.2, 1, 0.7] }, { kind: 'wolf', n: 6, area: [0, 0.6, 1, 1] }] },
  huashan: { W: 44, H: 48, seed: 71, peddler: true, edge: 'M', floor: 'v', road: '^', plaza: '_', obst: [['c', 8], ['P', 2]], density: 0.36, hfloor: '_', hub: [22, 10],
    res: { '&': 5, O: 4 }, chests: 1,
    build(c) {
      c.bld({ x: 19, y: 3, w: 5, h: 3, label: '论剑台', kind: 'temple' });
      c.npc({ id: 'fenglao', name: '风老', role: '隐士', x: 23, y: 7, dir: 'down', look: { body: 'changpao', hair: 'knot', beard: true }, talk: () => hermitTalk('dugu') });
      const [hx, hy] = c.bld({ x: 6, y: 12, w: 7, h: 4, style: 'double', label: '华山派', kind: 'hall' });
      c.npc({ id: 'hszhang', name: '岳先生', role: '华山派', icon: '华', x: hx + 1, y: hy, dir: 'down', look: { body: 'hsshan', hair: 'crown', beard: true }, talk: () => sectTalk('岳先生', 'huashanpai') });
      c.npc({ id: 'hs_dizi', name: '华山弟子', role: '华山派', x: hx + 3, y: hy, dir: 'down', look: { body: 'hsshan', hair: 'knot' }, talk: () => say('华山弟子', ['山上那些华山剑客，根本不是本派的人，是冒名顶替的野路子。', '日月神教跟本派有血仇，在外头见了他们的人，小心。']) });
      c.sign(hx - 2, hy, '玉女峰。华山派。\n山上剑客不归本派管束，小心。');
    },
    zones: [{ kind: 'hsjianke', n: 9, area: [0, 0.15, 1, 1] }, { kind: 'baozi', n: 3, area: [0, 0.6, 1, 1] }] },
  yanmen: { W: 40, H: 28, seed: 83, edge: 'M', floor: '.', road: '_', obst: [['c', 5], ['r', 2]], density: 0.22,res: { O: 4, '*': 3 }, 
    build(c) { c.spawn('jinlun', 7, 4); c.path(7, 5, Math.round(c.W / 2), 2, '_'); passWall(c, 'h', Math.round(c.H * 0.45), '雁门关'); c.sign(9, 4, '关外。蒙古大军的营帐。\n“擅近国师营帐者，死。”'); },
    zones: [{ kind: 'mazei', n: 4, area: [0, 0, 1, 0.4] }, { kind: 'menggu', n: 2, area: [0, 0, 1, 0.35] }, { kind: 'wuseng', n: 2, area: [0, 0.55, 1, 1] }, { kind: 'jiaozhong', n: 2, area: [0, 0, 1, 0.4] }] },
  shanhai: { W: 40, H: 28, seed: 89, edge: 'M', floor: '.', road: '_', obst: [['c', 4], ['r', 2], ['T', 1]], density: 0.2,res: { O: 4 }, 
    build(c) { passWall(c, 'h', Math.round(c.H * 0.5), '山海关'); for (let y = 1; y < c.H - 1; y++) for (let x = c.W - 5; x < c.W - 1; x++) if (!c.keep.has(c.K(x, y))) c.set(x, y, '~'); },
    zones: [{ kind: 'mazei', n: 4, area: [0, 0, 0.85, 0.45] }, { kind: 'jiaozhong', n: 3, area: [0, 0, 0.85, 0.45] }, { kind: 'wuseng', n: 2, area: [0, 0.55, 0.85, 1] }] },
  caoyuan: { W: 64, H: 40, seed: 97, peddler: true, edge: 'r', floor: '.', patches: [[',', 14, 5]], obst: [['r', 3], ['T', 1], ['f', 1]], density: 0.06, fillOn: [','],
    res: { '*': 6, m: 4 }, chests: 1, zones: [{ kind: 'cylang', n: 10, area: [0, 0, 1, 1] }, { kind: 'menggu', n: 7, area: [0.3, 0, 1, 1] }, { kind: 'langwang', n: 2, area: [0, 0, 0.4, 0.5] }] },
  damo: { W: 64, H: 40, seed: 101, peddler: true, edge: 'c', floor: 'y', obst: [['r', 4], ['c', 2], ['R', 1]], density: 0.08, ground: 'sand', patches: [['v', 5, 3]], fillOn: ['v'],
    build(c) { const ox = Math.round(c.W * 0.35), oy = Math.round(c.H * 0.3); for (let y = -2; y <= 2; y++) for (let x = -3; x <= 3; x++) if (x * x / 9 + y * y / 4 <= 1 && !c.keep.has(c.K(ox + x, oy + y))) c.set(ox + x, oy + y, '~'); [[-5, 0], [5, 1], [0, -4], [-2, 4], [3, -3]].forEach(([dx, dy]) => { if (!c.keep.has(c.K(ox + dx, oy + dy))) c.set(ox + dx, oy + dy, 'T'); }); c.sign(ox, oy + 4, '沙漠里的一眼泉水。可以在这里钓鱼歇脚。'); const [xx, xy] = c.bld({ x: 44, y: 26, w: 5, h: 3, label: '星宿海', kind: 'temple' }); c.npc({ id: 'xxlao', name: '星宿老仙', role: '星宿派', icon: '星', x: xx + 1, y: xy, dir: 'down', look: { body: 'xxpao', hair: 'messy', beard: true }, talk: () => sectTalk('星宿老仙', 'xingxiu') }); c.npc({ id: 'xx_gen', name: '星宿弟子', role: '星宿派', x: xx + 3, y: xy, dir: 'down', look: { body: 'xxpao', hair: 'messy' }, talk: () => say('星宿弟子', ['星宿老仙，德配天地，威震寰宇，古今无比！', '（小声）少林那帮秃驴跟老仙有仇，见了别客气。']) }); },
    res: { O: 5 }, chests: 2, hfloor: '_', zones: [{ kind: 'shalang', n: 8, area: [0, 0, 1, 1] }, { kind: 'shafei', n: 8, area: [0, 0, 1, 1] }, { kind: 'xxdizi', n: 4, area: [0.5, 0.5, 1, 1] }] },
  guangming: { W: 38, H: 32, seed: 107, edge: 'c', floor: 'v', road: '^', plaza: '_', obst: [['c', 6], ['r', 2]], density: 0.22, hfloor: '_', hub: [24, 18], res: { O: 5 }, chests: 1,
    build(c) {
      const [dx, dy] = c.bld({ x: 15, y: 3, w: 7, h: 4, style: 'double', label: '明教总坛', kind: 'hall', owner: 'mjzong' });
      c.bld({ x: 6, y: 4, w: 2, h: 4, style: 'pagoda', kind: 'pagoda' });
      c.npc({ id: 'mjzong', name: '殷护法', role: '明教', icon: '明', x: dx + 1, y: dy + 1, dir: 'down', look: { body: 'mjrobe', hair: 'messy', beard: true }, talk: () => sectTalk('殷护法', 'mingjiao') });
      c.sign(dx - 3, dy + 1, '光明顶。明教总坛。\n熊熊圣火，焚我残躯。');
    },
    zones: [{ kind: 'mjzhong', n: 8, area: [0, 0.25, 1, 1] }] },
  jueqing: { W: 48, H: 40, seed: 113, edge: 'M', floor: '.', patches: [['f', 10, 3], [',', 6, 3]], obst: [['T', 5], ['f', 3], ['c', 2]], density: 0.2, fillOn: ['f', ','], hfloor: '_', hub: [24, 12],
    build(c) {
      c.bld({ x: 21, y: 3, w: 7, h: 4, style: 'double', label: '绝情山庄', kind: 'hall' });
      const lx = 10, ly = 26; for (let y = -3; y <= 3; y++) for (let x = -5; x <= 5; x++) if (x * x / 25 + y * y / 9 <= 1 && !c.keep.has(c.K(lx + x, ly + y))) c.set(lx + x, ly + y, '~');
      c.sign(21, 9, '绝情谷。谷中情花有剧毒。\n谷主公孙止，武功深不可测。');
      c.spawn('gongsun', 24, 8);
      for (let y = 24; y <= 28; y++) for (let x = 16; x <= 18; x++) { c.set(x, y, '.'); c.keep.add(c.K(x, y)); }
      c.path(17, 28, c.hub[0], c.hub[1], '.');
      c.spawn('limochou', 38, 32); c.path(38, 33, c.hub[0], c.hub[1], '.');
      c.npc({ id: 'dubi', name: '独臂人', role: '湖边', x: 16, y: 26, dir: 'left', look: { body: 'heipao', hair: 'messy' }, talk: () => hermitTalk('anran') });
    },
    res: { '&': 6, '*': 6 }, chests: 1, zones: [{ kind: 'jqdizi', n: 9, area: [0, 0.2, 1, 1] }] },
};
/* 关口：一道城墙横在路上，路过的地方开城门，旁边一座箭楼 */
function passWall(c, axis, at, label) {
  const gates = [];
  if (axis === 'v') { for (let y = 1; y < c.H - 1; y++) { if (c.keep.has(c.K(at, y))) gates.push(y); else c.set(at, y, 'W'); } gates.forEach(y => { [y - 1, y + 1].forEach(yy => { if (!c.keep.has(c.K(at, yy))) c.set(at, yy, 'Q'); }); }); }
  else { for (let x = 1; x < c.W - 1; x++) { if (c.keep.has(c.K(x, at))) gates.push(x); else c.set(x, at, 'W'); } gates.forEach(x => { [x - 1, x + 1].forEach(xx => { if (!c.keep.has(c.K(xx, at))) c.set(xx, at, 'Q'); }); }); }
  for (let i = 0; i < (axis === 'v' ? c.H : c.W); i++) c.keep.add(axis === 'v' ? c.K(at, i) : c.K(i, at));
  const g = gates[0] || (axis === 'v' ? c.H >> 1 : c.W >> 1);
  const tx = axis === 'v' ? at + 2 : Math.min(c.W - 8, g + 3), ty = axis === 'v' ? Math.max(2, g - 6) : at - 5;
  let ok = true; for (let y = ty - 1; y <= ty + 4; y++) for (let x = tx - 1; x <= tx + 5; x++) if (c.keep.has(c.K(x, y))) ok = false;
  if (ok) c.bld({ x: tx, y: ty, w: 5, h: 4, style: 'tall', label, kind: 'tower' });
  c.sign(axis === 'v' ? at + 1 : g + 2, axis === 'v' ? g + 2 : at + 1, `${label}。边关要地。\n正邪两派在此狭路相逢，各自小心。`);
}
/* 野外地图放大：人多了不挤，坐车才有意义。野外长宽放大到 2.4 倍，山洞 1.6 倍；怪物、草药矿石、木箱跟着加 */
for (const id in W_SPECS) {
  const sp = W_SPECS[id], k = sp.ground === 'cave' ? 1.6 : 2.4, n = k * k;
  sp.W = Math.round(sp.W * k); sp.H = Math.round(sp.H * k);
  for (const z of sp.zones || []) z.n = Math.round(z.n * n * 0.6);
  for (const r in sp.res || {}) sp.res[r] = Math.round(sp.res[r] * n * 0.8);
  if (sp.chests) sp.chests = Math.round(sp.chests * n);
  for (const pt of sp.patches || []) pt[1] = Math.round(pt[1] * n);
}
/* 山里的小山洞：每张有山的野外地图再开一两个，洞里的怪、矿、草药跟这一带相配 */
const SMALL_CAVES = [
  ['meadow', 'U2', 'tudong', '兔儿坡土洞', [0.78, 0.3], { W: 32, H: 24, seed: 501, res: { O: 4, '&': 1 }, chests: 2, zones: [{ kind: 'fox', n: 8, area: [0, 0, 1, 1] }] }, '兔子、狐狸的窝，新手也能进。'],
  ['tongguan', 'U2', 'gudong', '潼关古洞', [0.25, 0.75], { W: 36, H: 28, seed: 502, res: { O: 8 }, chests: 2, zones: [{ kind: 'bandit', n: 8, area: [0, 0, 1, 1] }, { kind: 'wolf', n: 5, area: [0, 0, 1, 1] }] }, '古时的藏兵洞，如今住着山贼。'],
  ['zhongnan', 'U2', 'zndong', '终南山洞', [0.75, 0.7], { W: 34, H: 26, seed: 503, res: { '&': 5, O: 3 }, chests: 2, zones: [{ kind: 'boar', n: 6, area: [0, 0, 1, 1] }, { kind: 'bear', n: 4, area: [0, 0, 1, 1] }] }, '野猪、黑熊出没，洞里灵芝多。'],
  ['yanmen', 'U2', 'shiku', '雁门石窟', [0.7, 0.3], { W: 38, H: 28, seed: 504, res: { O: 9 }, chests: 2, zones: [{ kind: 'mazei', n: 8, area: [0, 0, 1, 1] }] }, '马贼的藏身处，石壁里有精铁。'],
  ['shanhai', 'U2', 'haidong', '海边岩洞', [0.3, 0.3], { W: 34, H: 26, seed: 505, res: { O: 7 }, chests: 2, zones: [{ kind: 'kuangfei', n: 6, area: [0, 0, 1, 1] }, { kind: 'jiaozhong', n: 4, area: [0, 0, 1, 1] }] }, '海边的岩洞，常有人私下挖矿。'],
  ['wudang', 'U2', 'yandong', '武当岩洞', [0.8, 0.85], { W: 34, H: 28, seed: 506, res: { '&': 6 }, chests: 2, zones: [{ kind: 'baozi', n: 7, area: [0, 0, 1, 1] }] }, '金钱豹的老巢，岩缝里长灵芝。'],
  ['miaojiang', 'U2', 'dudong', '苗疆毒洞', [0.8, 0.25], { W: 38, H: 30, seed: 507, res: { '*': 8, '&': 4 }, chests: 2, zones: [{ kind: 'wdjz', n: 6, area: [0, 0, 1, 1] }, { kind: 'baozi', n: 4, area: [0, 0, 1, 1] }] }, '五毒教养毒物的地方，三七、老山参不少。'],
  ['guangming', 'U2', 'mimi', '光明顶秘洞', [0.25, 0.7], { W: 36, H: 28, seed: 508, res: { O: 9 }, chests: 2, zones: [{ kind: 'mjzhong', n: 8, area: [0, 0, 1, 1] }] }, '明教的秘洞，寒铁矿藏在深处。'],
  ['jueqing', 'U2', 'gudi', '绝情谷底', [0.75, 0.8], { W: 38, H: 30, seed: 509, res: { '&': 7 }, chests: 3, zones: [{ kind: 'jqdizi', n: 5, area: [0, 0, 1, 1] }, { kind: 'tiger', n: 4, area: [0, 0, 1, 1] }] }, '谷底深处，奇花异草，也有猛虎。'],
];
for (const [parent, key, id, name, [fx, fy], spec, hint] of SMALL_CAVES) {
  const P0 = W_SPECS[parent]; if (!P0) continue;
  W_SPECS[id] = CAVE({ ...spec, smallCave: true }); SPEC_NAME[id] = name; AREA_HINT[id] = hint;
  LINKS.push([parent, key, id, 'S']);
  (CAVE_AT[parent] || (CAVE_AT[parent] = {}))[key] = [Math.round(P0.W * fx), Math.round(P0.H * fy)];
}
const T_SPECS = {
  luoyang: { W: 36, H: 26, seed: 201, street: 12, buildings: [
      { x: 2, y: 2, label: '客栈', kind: 'inn', owner: 'inn_ly' }, { x: 8, y: 2, label: '兵器铺', kind: 'smith', owner: 'smith_ly' },
      { x: 21, y: 2, w: 7, h: 4, style: 'double', label: '丐帮总舵', kind: 'hall', owner: 'gbzong' }, { x: 29, y: 2, label: '药铺', kind: 'pharmacy', owner: 'doctor_ly' },
      { x: 2, y: 16, w: 6, h: 4, style: 'tall', label: '牡丹楼', kind: 'tavern' }, { x: 22, y: 16, w: 4, kind: 'house' }, { x: 28, y: 16, label: '白马寺', kind: 'temple' }, { x: 9, y: 17, w: 4, kind: 'house' }],
    npcs: [
      { id: 'inn_ly', name: '掌柜', role: '客栈', icon: '宿', x: 5, y: 5, dir: 'down', look: { body: 'apron', hair: 'cap' }, talk: innTalk },
      { id: 'smith_ly', name: '王铁匠', role: '兵器铺', icon: '兵', x: 11, y: 5, dir: 'down', look: { body: 'vest', hair: 'band' }, talk: smithTalk },
      { id: 'gbzong', name: '简长老', role: '丐帮', icon: '丐', x: 25, y: 6, dir: 'down', look: { body: 'patched', hair: 'messy', beard: true }, talk: luTalk },
      { id: 'doctor_ly', name: '李大夫', role: '药铺', icon: '药', x: 32, y: 5, dir: 'down', look: { body: 'changpao', hair: 'fangjin' }, talk: doctorTalk },
      { id: 'beggar1', name: '小乞丐', role: '丐帮', x: 15, y: 9, dir: 'down', look: { body: 'patched', hair: 'messy' }, talk: () => say('小乞丐', ['这里是丐帮总舵。帮主不在，简长老管事。', '鲁长老常在牛家村的池塘边，入帮找他也行。']) }],
    wells: [[15, 16]] },
  yangzhou: { W: 36, H: 26, seed: 211, street: 12, buildings: [
      { x: 2, y: 2, label: '客栈', kind: 'inn', owner: 'inn_yz' }, { x: 14, y: 2, label: '钱庄', kind: 'bank', owner: 'bank_yz' }, { x: 27, y: 2, label: '药铺', kind: 'pharmacy', owner: 'doctor_yz' },
      { x: 2, y: 16, label: '兵器铺', kind: 'smith', owner: 'smith_yz' }, { x: 8, y: 16, w: 4, kind: 'house' }, { x: 21, y: 16, w: 6, h: 4, style: 'tall', label: '望江楼', kind: 'tavern' }, { x: 28, y: 16, label: '绸缎庄', kind: 'cloth' }],
    npcs: [
      { id: 'inn_yz', name: '掌柜', role: '客栈', icon: '宿', x: 5, y: 5, dir: 'down', look: { body: 'apron', hair: 'cap' }, talk: innTalk },
      { id: 'bank_yz', name: '钱庄掌柜', role: '钱庄', icon: '钱', x: 17, y: 5, dir: 'down', look: { body: 'heipao', hair: 'fangjin' }, talk: bankTalk },
      { id: 'doctor_yz', name: '吴大夫', role: '药铺', icon: '药', x: 30, y: 5, dir: 'down', look: { body: 'changpao', hair: 'fangjin' }, talk: doctorTalk },
      { id: 'smith_yz', name: '赵铁匠', role: '兵器铺', icon: '兵', x: 5, y: 19, dir: 'down', look: { body: 'vest', hair: 'band' }, talk: smithTalk },
      { id: 'envoy_zhong', name: '中立接引使', role: '门派接引', icon: '引', x: 12, y: 13, dir: 'down', look: { body: 'thshan', hair: 'knot', beard: true }, talk: () => envoyTalk('中') },
      { id: 'simei', name: '四眉公子', role: '望江楼', x: 25, y: 20, dir: 'down', look: { body: 'changpao', hair: 'knot', beard: true }, talk: () => hermitTalk('lingxi') }],
    wells: [[20, 9]] },
  hangzhou: { W: 36, H: 26, seed: 221, street: 10, rects: [['~', 20, 14, 13, 9]], buildings: [
      { x: 2, y: 2, label: '客栈', kind: 'inn', owner: 'inn_hz' }, { x: 8, y: 2, label: '药铺', kind: 'pharmacy', owner: 'doctor_hz' }, { x: 15, y: 2, w: 5, h: 3, style: 'tall', label: '听雨楼', kind: 'tavern', owner: 'tingyu' }, { x: 26, y: 2, label: '灵隐寺', kind: 'temple' },
      { x: 2, y: 15, w: 6, h: 4, style: 'tall', label: '楼外楼', kind: 'tavern' }, { x: 10, y: 15, w: 4, kind: 'house' }],
    npcs: [
      { id: 'inn_hz', name: '掌柜', role: '客栈', icon: '宿', x: 5, y: 5, dir: 'down', look: { body: 'apron', hair: 'cap' }, talk: innTalk },
      { id: 'doctor_hz', name: '胡大夫', role: '药铺', icon: '药', x: 11, y: 5, dir: 'down', look: { body: 'changpao', hair: 'fangjin' }, talk: doctorTalk },
      { id: 'tingyu', name: '听雨楼主', role: '听雨楼', x: 18, y: 5, dir: 'down', look: { body: 'heipao', hat: 'douli' }, talk: () => hermitTalk('yuanyue') },
      { id: 'ferry', name: '船夫', role: '渡口', icon: '船', x: 19, y: 16, dir: 'right', look: { body: 'buyi', hat: 'douli' }, talk: () => ferryTalk('taohua') },
      { id: 'fisher_hz', name: '西湖渔翁', role: '钓鱼', icon: '渔', x: 19, y: 20, dir: 'right', look: { body: 'buyi', hat: 'douli', beard: true }, talk: fisherTalk }],
    signs: { '18,13': '西湖。湖边有船夫，可渡海去桃花岛。\n湖里也能钓鱼。' } },
  pingding: { W: 32, H: 24, seed: 231, street: 11, floor: 'v', tree: 'r', buildings: [
      { x: 2, y: 2, label: '客栈', kind: 'inn', owner: 'inn_pd' }, { x: 9, y: 2, label: '兵器铺', kind: 'smith', owner: 'smith_pd' }, { x: 20, y: 2, label: '药铺', kind: 'pharmacy', owner: 'doctor_pd' },
      { x: 3, y: 15, w: 6, h: 4, style: 'tall', label: '快活楼', kind: 'tavern' }, { x: 20, y: 15, w: 4, kind: 'house' }, { x: 25, y: 15, w: 4, kind: 'house' }],
    npcs: [
      { id: 'inn_pd', name: '掌柜', role: '客栈', icon: '宿', x: 5, y: 5, dir: 'down', look: { body: 'apron', hair: 'cap' }, talk: innTalk },
      { id: 'smith_pd', name: '铁匠', role: '兵器铺', icon: '兵', x: 12, y: 5, dir: 'down', look: { body: 'vest', hair: 'band' }, talk: smithTalk },
      { id: 'shusheng', name: '落魄书生', role: '快活楼', x: 7, y: 14, dir: 'down', look: { body: 'changpao', hair: 'fangjin' }, talk: () => hermitTalk('feidao') },
      { id: 'envoy_xie', name: '邪派接引使', role: '门派接引', icon: '引', x: 10, y: 12, dir: 'down', look: { body: 'ryrobe', hair: 'messy', beard: true }, talk: () => envoyTalk('邪') },
      { id: 'doctor_pd', name: '平一指', role: '药铺', icon: '药', x: 23, y: 5, dir: 'down', look: { body: 'heipao', hair: 'fangjin', beard: true }, talk: doctorTalk },
      { id: 'xieren', name: '日月教徒', role: '日月神教', x: 15, y: 15, dir: 'down', look: { body: 'ryrobe', hair: 'band' }, talk: () => say('日月教徒', ['平定州是神教的地盘。', '往东上黑木崖拜见长老；往西出城就是塞外草原。']) }] },
};
/* ---- 城镇放大：原来的街区挪到正中，四周多出一圈新街区，再摆上各城的风景 ---- */
const TOWN_GROW = { luoyang: [14, 9], yangzhou: [14, 9], hangzhou: [14, 9], pingding: [14, 9] };
for (const [id, [ox, oy]] of Object.entries(TOWN_GROW)) {
  const sp = T_SPECS[id]; sp.W += ox * 2; sp.H += oy * 2; sp.street += oy;
  sp.buildings.forEach(b => { b.x += ox; b.y += oy; });
  (sp.npcs || []).forEach(n => { n.x += ox; n.y += oy; });
  (sp.rects || []).forEach(r => { r[1] += ox; r[2] += oy; });
  (sp.wells || []).forEach(w => { w[0] += ox; w[1] += oy; });
  if (sp.signs) sp.signs = Object.fromEntries(Object.entries(sp.signs).map(([k, v]) => { const [x, y] = k.split(',').map(Number); return [`${x + ox},${y + oy}`, v]; }));
}
const fenceBox = (c, x0, y0, w, h, gx) => { for (let x = x0; x < x0 + w; x++) { c.set(x, y0, x === gx ? c.fl : 'F'); c.set(x, y0 + h - 1, 'F'); } for (let y = y0; y < y0 + h; y++) { c.set(x0, y, 'F'); c.set(x0 + w - 1, y, 'F'); } };
T_SPECS.luoyang.scenic = c => {
  /* 牡丹园：城南一大片花圃，竹篱围着，北边开门 */
  const x0 = 3, y0 = c.H - 9, w = 20, h = 7;
  fenceBox(c, x0, y0, w, h, x0 + 10);
  for (let y = y0 + 1; y < y0 + h - 1; y++) for (let x = x0 + 1; x < x0 + w - 1; x++) c.set(x, y, (x + y) % 3 && y !== y0 + 3 ? 'f' : c.fl);
  c.keep(x0, y0 - 1, w, h + 1);
  c.sign(x0 + 9, y0 - 1, '牡丹园。洛阳牡丹甲天下，四月花开满城。');
  /* 白马寺塔：白马寺东边一座宝塔 */
  c.bld({ x: c.W - 7, y: 22, w: 2, h: 4, style: 'pagoda', label: '白马寺塔', kind: 'pagoda' });
  c.sign(c.W - 8, 26, '白马寺塔。中原第一座佛寺，塔下埋着西来的经卷。');
};
T_SPECS.yangzhou.scenic = c => {
  /* 运河：城西一条南北向的大运河，街口和城门口架桥 */
  const cx = 5;
  for (let y = 1; y < c.H - 1; y++) for (const x of [cx, cx + 1]) c.set(x, y, '~');
  for (const y of [c.st, c.st + 1, 8, c.H - 9]) for (const x of [cx, cx + 1]) c.set(x, y, 'B');
  for (const y of [8, c.H - 9]) { for (let x = 1; x < cx; x++) c.set(x, y, '_'); for (let x = cx + 2; x < cx + 6; x++) c.set(x, y, '_'); }
  c.keep(1, 1, cx + 3, c.H - 2);
  c.sign(cx + 2, c.st - 1, '大运河。南来北往的货船都从扬州过。');
  /* 瘦西湖和二十四桥：城东南一湖，一座长桥横过湖面，湖边一圈垂柳 */
  const lx = c.W - 22, ly = c.H - 11, lw = 19, lh = 9;
  for (let y = ly; y < ly + lh; y++) for (let x = lx; x < lx + lw; x++) { const dx = (x - lx - lw / 2) / (lw / 2), dy = (y - ly - lh / 2) / (lh / 2); if (dx * dx + dy * dy < 1) c.set(x, y, '~'); }
  for (let x = lx; x < lx + lw; x++) c.set(x, ly + 4, 'B');
  for (const x of [lx - 1, lx + lw]) c.set(x, ly + 4, '_');
  for (let x = lx; x < lx + lw; x += 3) { if (c.m[ly - 1] && c.m[ly - 1][x] === c.fl) c.set(x, ly - 1, 'T'); if (c.m[ly + lh] && c.m[ly + lh][x] === c.fl) c.set(x, ly + lh, 'T'); }
  c.keep(lx - 2, ly - 2, lw + 4, lh + 3);
  c.sign(lx - 2, ly + 3, '瘦西湖·二十四桥。二十四桥明月夜，玉人何处教吹箫。');
};
T_SPECS.hangzhou.scenic = c => {
  /* 西湖放大：断桥横过湖心，湖东岸立着雷峰塔 */
  const lx = 34, ly = 23, lw = 26, lh = 17;
  for (let y = ly; y < ly + lh; y++) for (let x = lx; x < lx + lw; x++) if (!(x > lx + lw - 3 && y > ly + lh - 3)) c.set(x, y, '~');
  for (let x = lx; x < lx + lw; x++) c.set(x, ly + 7, 'B');
  c.set(lx - 1, ly + 7, '_'); c.set(lx + lw, ly + 7, '_');
  c.keep(lx - 1, ly - 1, lw + 2, lh + 2);
  c.bld({ x: c.W - 3, y: ly + 9, w: 2, h: 4, style: 'pagoda', label: '雷峰塔', kind: 'pagoda' });
  c.sign(lx + 8, ly - 1, '断桥。断桥残雪，西湖十景之一。');
  c.sign(c.W - 4, ly + 14, '雷峰塔。传说塔下压着白娘子。');
};
T_SPECS.pingding.scenic = c => {
  /* 集市：城南两排摊子，摊主吆喝着卖东西 */
  const y1 = c.H - 8, y2 = c.H - 5;
  const hawk = [['卖糖葫芦的', ['糖葫芦——又酸又甜的糖葫芦！']], ['卖肉的屠户', ['上好的羊肉，刚从草原赶来的！']], ['卖皮货的', ['狼皮、狐皮，塞外来的好皮子！']], ['算命先生', ['（摇着签筒）客官印堂发亮，近日必有奇遇。']], ['卖胡饼的', ['胡饼胡饼，热乎的胡饼！']], ['卖马的胡商', ['好马！日行千里！……不过今天不卖。']]];
  let k = 0;
  for (const y of [y1, y2]) for (let x = 6; x < 30; x += 4) {
    c.set(x, y, 'z'); c.set(x + 1, y, 'z');
    const h = hawk[k++ % hawk.length];
    c.npc({ id: `hawker_${x}_${y}`, name: h[0], role: '集市', quiet: true, x, y: y + 1, dir: 'down', look: { body: k % 2 ? 'buyi' : 'apron', hair: k % 3 ? 'band' : 'cap' }, talk: () => say(h[0], h[1]) });
  }
  c.keep(5, y1 - 1, 27, 7);
  c.sign(4, y1 - 1, '集市。南北客商在这里买卖，什么稀奇东西都有。');
  /* 擂台：城东一座擂台，四周拉着绳子，南边留口 */
  const ax = c.W - 14, ay = 13, aw = 11, ah = 8;
  c.rect(ax, ay, aw, ah, '_'); fenceBox(c, ax, ay, aw, ah, -1);
  c.set(ax + 5, ay + ah - 1, '_');
  c.keep(ax - 1, ay - 1, aw + 2, ah + 2);
  c.sign(ax + 4, ay + ah, '擂台。江湖人在这里比武切磋，点到为止。');
};
/* 出口坐标表 */
const EXIT_AT = {}, EXIT_TO = {};
const AREA_SIZE = id => HAND_SIZE[id] || (W_SPECS[id] ? [W_SPECS[id].W, W_SPECS[id].H] : [T_SPECS[id].W, T_SPECS[id].H]);
for (const id in SPEC_NAME) { const [W, H] = AREA_SIZE(id); EXIT_AT[id] = HAND_EXITS[id] ? { ...HAND_EXITS[id] } : exitSlots(id, W, H); EXIT_TO[id] = {}; }
for (const [a, sa, b, sb] of LINKS) { EXIT_TO[a][sa] = b; EXIT_TO[b][sb] = a; }
for (const id in CAVE_AT) for (const k in CAVE_AT[id]) EXIT_AT[id][k] = CAVE_AT[id][k];
function buildExits(id) {
  const out = {};
  for (const k in EXIT_AT[id]) {
    const to = EXIT_TO[id][k]; if (!to) continue;
    const back = Object.keys(EXIT_TO[to]).find(kk => EXIT_TO[to][kk] === id);
    const [bx, by] = EXIT_AT[to][back], [W2, H2] = AREA_SIZE(to), [ix, iy, dir] = exitInner({ x: bx, y: by }, W2, H2);
    const [x, y] = EXIT_AT[id][k]; out[`${x},${y}`] = { map: to, x: ix, y: iy, dir };
  }
  return out;
}
/* 手工地图补开新出口的路 */
function carveRows(rows, cells, t) { const m = rows.map(r => [...r]); for (const [x, y] of cells) m[y][x] = t; return m.map(r => r.join('')); }
const line = (x0, y0, x1, y1) => { const o = []; for (let y = Math.min(y0, y1); y <= Math.max(y0, y1); y++) for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) o.push([x, y]); return o; };

const GEN = {};
for (const id in W_SPECS) GEN[id] = genArea(id, W_SPECS[id]);
for (const id in T_SPECS) GEN[id] = genTown(id, T_SPECS[id]);
const MAPS = {
  village: {
    name: '牛家村', rows: growVillage(genVillage()), buildings: VILLAGE_BUILDINGS,
    signs: { ...shiftKeys({ '1,5': '路牌：往西是襄阳城。\n城里有钱庄、当铺、镖局、武馆、酒楼。', '16,1': '路牌：往北是洛阳，丐帮总舵在那里。\n洛阳往西上山，就是嵩山少林寺。', '22,5': '路牌：往东出村是伏牛山脚。\n野狼、山贼出没，行人小心。', '10,16': '路牌：往南是兔儿坡。\n野兔、狐狸、草药，新手练功好去处。', '2,7': '木人桩：不会还手，随便打。\n（武功练到三十级以后，就打不出长进了）' }, 8, 6), '20,25': '池塘。塘里有鱼，老渔翁在村里卖鱼竿。', '5,17': '老槐树。村里最老的树，三百多岁了。\n逢年过节，村里人都来树下烧香。' },
    spawns: [['dummy', 11, 14], ['dummy', 14, 14]],
  },
  xiangyang: {
    name: '襄阳城', rows: growXiangyang(genXiangyang()), buildings: XY_BUILDINGS, hfloor: '_',
    signs: shiftKeys({ '29,10': '襄阳城东门。往东回牛家村。', '2,10': '襄阳城西门。往西出潼关，是终南山、华山。\n再往南走蜀道，可到峨眉山。' }, 10, 8),
    spawns: [],
  },
  songshan: {
    name: '嵩山', rows: carveRows(carveRows(carveRows(genSongshan(), line(1, 20, 5, 20), '^'), [[20, 1]], '_'), [[0, 20], [20, 0]], 'E'), buildings: SS_BUILDINGS, hfloor: '_',
    signs: { '13,27': '嵩山。往南下山是洛阳。\n往西是华山，后山往北出雁门关。', '14,12': '少林寺。天下武功出少林。' },
    spawns: [['wuseng', 5, 8], ['wuseng', 19, 9], ['wuseng', 15, 13], ['boar', 9, 15], ['boar', 14, 18], ['boar', 9, 22], ['boar', 17, 23], ['boar', 6, 26], ['boar', 20, 18]],
  },
  emei: {
    name: '峨眉山', rows: carveRows(carveRows(genEmei(), line(1, 10, 13, 10), '^'), [[0, 10]], 'E'), buildings: EM_BUILDINGS, ground: 'snow',
    signs: { '27,11': '峨眉山。往东下山是蜀道，往西是绝情谷。\n冰湖上滑，雪狼凶狠。' },
    spawns: [['emeidizi', 9, 7], ['emeidizi', 20, 7], ['snowwolf', 8, 12], ['snowwolf', 21, 9], ['snowwolf', 12, 17], ['snowwolf', 26, 18], ['snowwolf', 4, 18], ['snowwolf', 18, 13]],
  },
  heimuya: {
    name: '黑木崖', rows: carveRows(carveRows(carveRows(genHeimuya(), line(1, 5, 7, 5), '^'), [[0, 5]], 'E'), [[18, 3]], 'U'), buildings: HM_BUILDINGS, hfloor: '_',
    signs: { '9,2': '黑木崖。日月神教总坛。\n往北回山海关，往西是平定州。' },
    spawns: [['jiaozhong', 8, 18], ['jiaozhong', 18, 13], ['jiaozhong', 6, 19], ['jiaozhong', 20, 19], ['jiaozhong', 17, 19], ['jiaozhong', 4, 8]],
  },
  taohua: {
    name: '桃花岛', rows: genTaohua(), buildings: TH_BUILDINGS,
    signs: { '14,15': '桃花岛。岛上桃林暗合奇门五行。\n岛主不问正邪，莫在岛上撒野。' },
    spawns: [['taohuadizi', 6, 8], ['taohuadizi', 20, 10], ['taohuadizi', 16, 16]],
  },
};
for (const id in GEN) { const g0 = GEN[id], sp = W_SPECS[id] || T_SPECS[id]; MAPS[id] = { name: SPEC_NAME[id], rows: g0.rows, buildings: g0.buildings, signs: g0.signs, spawns: g0.spawns, ground: sp.ground, smallCave: sp.smallCave, hfloor: sp.hfloor || (T_SPECS[id] ? '_' : undefined) }; }
for (const id in MAPS) { const m = MAPS[id]; m.id = id; m.w = m.rows[0].length; m.h = m.rows.length; m.doors = {}; m.exits = buildExits(id); }

