/* ---------------- 任务指引 ---------------- */
const KIND_MAP = { yuebuqun: 'siguo', dongfang: 'chengde', zuolengchan: 'jianzhong', ouyangfeng: 'digong', limochou: 'jueqing', jiumozhi: 'miaojiang', jinlun: 'yanmen', jinmao: 'guangming', caobang: 'forest', kuangfei: 'kuangdong', kuangba: 'kuangdong', dongxiong: 'heifeng', xiongwang: 'heifeng', jianmo: 'siguo', jianling: 'jianzhong', jianshou: 'jianzhong2', shiwei: 'digong', shiwang: 'digong2', wddizi: 'wudang', xxdizi: 'damo', wdjz: 'miaojiang', shanfei: 'shudao', baozi: 'shudao', qzdizi: 'zhongnan', mjzhong: 'guangming', mazei: 'yanmen', shalang: 'damo', shafei: 'damo', cylang: 'caoyuan', menggu: 'caoyuan', langwang: 'caoyuan', hsjianke: 'huashan', jqdizi: 'jueqing', gongsun: 'jueqing', xuedao: 'forest', rabbit: 'meadow', fox: 'meadow', wolf: 'wild', bandit: 'wild', boss: 'wild', bear: 'forest', tiger: 'forest', boar: 'songshan', snowwolf: 'emei', wuseng: 'songshan', emeidizi: 'emei', jiaozhong: 'heimuya', taohuadizi: 'taohua' };
const FERRY = { hangzhou: { to: 'taohua', x: 19, y: 16 }, taohua: { to: 'hangzhou', x: 11, y: 16 } };
function npcPos(id) { for (const m in NPCS) { const n = NPCS[m].find(x => x.id === id); if (n) return { map: m, x: n.x, y: n.y, name: n.name }; } return null; }
function goalNpc(id, verb) { const n = npcPos(id); return n ? { map: n.map, x: n.x, y: n.y, text: `${verb || '找'}${n.name}` } : null; }
/* 采办类目标：草药、矿、棉花去对应地块；皮肉去打对应的怪；鱼去水边 */
const ITEM_SRC = { caoyao: { tile: '*' }, lingzhi: { tile: '&' }, shengtie: { tile: 'O' }, mianhua: { tile: 'm' }, langpi: { kind: 'wolf' }, zhurou: { kind: 'boar' }, tourou: { kind: 'rabbit' }, jiyu: { fish: 'village' }, jinli: { fish: 'village' } };
function tileMaps(t) { return Object.keys(MAPS).filter(id => MAPS[id].rows.some(r => r.includes(t))); }
function goalItem(item, text) {
  const src = ITEM_SRC[item]; if (!src) return null;
  if (src.kind) return goalKind(src.kind, text);
  if (src.fish) return S.items.yugan ? { map: src.fish, tile: '~', text: `${text}（去水边钓鱼）` } : goalNpc('fisher', '买鱼竿找');
  const ms = tileMaps(src.tile); if (!ms.length) return null;
  const best = ms.includes(map.id) ? map.id : ms.map(id => [id, hops(map.id, id)]).sort((a, b) => a[1] - b[1])[0][0];
  return { map: best, tile: src.tile, text: `${text}（${MAPS[best].name}）` };
}
function hops(from, to) {
  const d = { [from]: 0 }, q = [from];
  while (q.length) { const c = q.shift(); for (const l of mapLinks(c)) if (!(l.to in d)) { d[l.to] = d[c] + 1; q.push(l.to); } }
  return d[to] == null ? 99 : d[to];
}
function goalKind(kind, text) { const m = KIND_MAP[kind]; return m ? { map: m, kind, text: text || `去${MAPS[m].name}打${EN[kind].name}` } : null; }
/* 当前最该做的事：主线 → 清理门户 → 门务 → 历练 → 悬赏 */
function navGoal() {
  const q = S.q, m = MAIN[q.main], cs = cqStep();
  const cqGoal = () => {
    if (!cs || S.cq.done) return null;
    const giver = STORY[S.cq.line].giver;
    if (cqDone()) return goalNpc(giver, '回去复命找');
    return { map: cs.map, kind: cs.kind || Object.keys(EN).find(k => EN[k].flag === cs.flag), text: `去${MAPS[cs.map].name}：${cs.text}` };
  };
  if (campOf() === '邪' || campOf() === '中' || (S.cq && !S.sect)) { const g = cqGoal(); if (g) return g; }
  if (q.main < MAIN_END && m) {
    const giver = mainGiver();
    if (q.main === 0 || q.main === CH1_END || mainDone()) return goalNpc(giver, giver === 'chief' ? '回村找' : '去襄阳找');
    if (m.kind) return goalKind(m.kind);
    if (m.flag === 'boss') return { map: 'wild', kind: 'boss', text: '去伏牛山脚黑风寨' };
    if (m.flag === 'xuedao') return { map: 'forest', kind: 'xuedao', text: '去黑松林深处找血刀老祖' };
  }
  { const g = cqGoal(); if (g) return g; }
  if (S.purge) return S.purge.done ? goalNpc(MASTER_IDS[S.purge.sect], '回师门找') : { map: S.purge.map, kind: 'pantu', text: `去${MAPS[S.purge.map].name}抓叛徒` };
  const st = S.stask;
  if (st) {
    if (sectTaskDone(st)) return goalNpc(MASTER_IDS[st.sect], '回师门找');
    if (st.type === 'letter') return goalNpc(st.to, '送信给');
    if (st.type === 'kill') return goalKind(st.kind);
    if (st.type === 'collect') return goalItem(st.item, st.text);
    if (st.type === 'patrol') return { map: st.foe === '邪' ? 'heimuya' : 'songshan', text: st.text };
  }
  const t = curTrial();
  if (t) {
    if (trialDone(t)) return goalNpc('baixiao', '交历练找');
    if (t.kind) return goalKind(t.kind);
    if (t.item) return goalItem(t.item, t.text);
    if (t.gear) return goalNpc('caifeng', '缝衣服找');
  }
  else if (nextTrial()) return goalNpc('baixiao', '接历练找');
  const b = S.bounty;
  if (b) return b.cnt >= b.need ? goalNpc('biaotou', '领赏找') : goalKind(b.kind);
  return null;
}
/* 地图之间的走法：出口 + 渡船，广度优先找下一步该去哪个出口 */
function mapLinks(id) {
  const out = Object.entries(MAPS[id].exits).map(([k, v]) => { const [x, y] = k.split(',').map(Number); return { to: v.map, x, y }; });
  if (FERRY[id]) out.push(FERRY[id]);
  return out;
}
function nextHop(from, to) {
  if (from === to) return null;
  const prev = { [from]: null }, q = [from];
  while (q.length) {
    const c = q.shift();
    for (const l of mapLinks(c)) if (!(l.to in prev)) { prev[l.to] = { from: c, link: l }; if (l.to === to) { let cur = to; while (prev[cur].from !== from) cur = prev[cur].from; return prev[cur].link; } q.push(l.to); }
  }
  return null;
}
function goalPoint(g) {
  if (!g) return null;
  if (g.map !== map.id) { const h = nextHop(map.id, g.map); return h ? { x: h.x, y: h.y, hop: MAPS[h.to].name } : null; }
  if (g.x != null) return { x: g.x, y: g.y };
  if (g.tile) {
    let best = null, bd = 1e9;
    map.rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) if (r[x] === g.tile && !(g.tile !== '~' && isDepleted(x, y))) { const d = Math.abs(x - P.tx) + Math.abs(y - P.ty); if (d < bd) { bd = d; best = { x, y }; } } });
    return best;
  }
  if (g.kind) {
    let best = null, bd = 1e9;
    for (const e of enemies) if (!e.dead && e.kind === g.kind) { const d = Math.abs(e.tx - P.tx) + Math.abs(e.ty - P.ty); if (d < bd) { bd = d; best = e; } }
    if (best) return { x: best.tx, y: best.ty };
    const sp = map.spawns.find(([k]) => k === g.kind); if (sp) return { x: sp[1], y: sp[2] };
  }
  return null;
}
/* 任务指引：地上一串脚印通往目标（会绕开树和房子），人物身边一个大箭头，屏幕下方写着目标和还有几步 */
let trail = null, trailT = 0;
const walkable = (x, y) => !blocks(x, y);
function findTrail(pt) {
  const key = (x, y) => y * 1000 + x, prev = new Map([[key(P.tx, P.ty), -1]]), q = [[P.tx, P.ty]];
  const goalAdj = !walkable(pt.x, pt.y) || npcAt(pt.x, pt.y) || enemyAt(pt.x, pt.y);
  let end = null;
  while (q.length) {
    const [x, y] = q.shift();
    if (goalAdj ? Math.abs(x - pt.x) + Math.abs(y - pt.y) === 1 : (x === pt.x && y === pt.y)) { end = [x, y]; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (prev.has(k) || nx < 0 || ny < 0 || nx >= map.w || ny >= map.h || !walkable(nx, ny)) continue;
      prev.set(k, key(x, y)); q.push([nx, ny]);
    }
  }
  if (!end) return null;
  const out = []; let k = key(end[0], end[1]);
  while (k !== -1) { out.push([k % 1000, Math.floor(k / 1000)]); k = prev.get(k); }
  return out.reverse();
}
/* 实心深色箭头 + 浅色描边：在草地、房子、水面上都看得清 */
function arrowAt(cx, cy, a, len, half) {
  const ca = Math.cos(a), sa = Math.sin(a);
  const inside = (u, v, grow) => u >= -grow && u <= len + grow && Math.abs(v) <= (len - u) * half / len + grow * 1.6;
  const x0 = Math.floor(cx - len - 3), x1 = Math.ceil(cx + len + 3), y0 = Math.floor(cy - len - 3), y1 = Math.ceil(cy + len + 3);
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const dx = x + 0.5 - cx, dy = y + 0.5 - cy, u = dx * ca + dy * sa + len / 2, v = -dx * sa + dy * ca;
    if (inside(u, v, 0)) R(x, y, 1, 1, 3); else if (inside(u, v, 1.3)) R(x, y, 1, 1, 0);
  }
}
function guideInfo() {
  if (S.showGuide === false || mode !== 'play' || P.dead) return null;
  const g = navGoal(), pt = goalPoint(g);
  if (!g) return null;
  if (pt && (--trailT <= 0 || !trail || trail.map !== map.id || trail.x !== pt.x || trail.y !== pt.y || trail.px !== P.tx || trail.py !== P.ty)) {
    trailT = 20; const path = findTrail(pt);
    trail = { map: map.id, x: pt.x, y: pt.y, px: P.tx, py: P.ty, path };
  }
  return { g, pt, path: pt && trail ? trail.path : null };
}
/* 在地面层画脚印（人物和怪物会盖在上面） */
function renderTrail() {
  if (dlg || menu) return;
  const gi = guideInfo(); if (!gi || !gi.path) return;
  const path = gi.path, n = path.length;
  for (let i = 1; i < n; i++) {
    const [x, y] = path[i], sx = x * T - cam.x, sy = y * T - cam.y;
    if (sx < -T || sy < -T || sx > GW || sy > GH) continue;
    const wave = (i * 4 - frame / 2) % 24, big = ((wave % 24) + 24) % 24 < 5;
    const [px, py] = path[i - 1], dx = x - px, dy = y - py, ox = dy ? (i % 2 ? -2 : 2) : 0, oy = dx ? (i % 2 ? -2 : 2) : 0;
    const fx2 = sx + 8 + ox - 1, fy2 = sy + 8 + oy - 1;
    if (big) { R(fx2 - 1, fy2 - 1, 5, 5, 3); R(fx2, fy2, 3, 3, 0); }
    else { R(fx2, fy2, 3, 3, 3); }
  }
  /* 终点：一圈闪动的方框 */
  const [ex, ey] = path[n - 1], tsx = gi.pt.x * T - cam.x, tsy = gi.pt.y * T - cam.y;
  if (n > 1 && frame % 30 < 22) { const o = frame % 30 < 11 ? 0 : 1; R(tsx - o, tsy - o, 16 + o * 2, 2, 3); R(tsx - o, tsy + 14 + o, 16 + o * 2, 2, 3); R(tsx - o, tsy - o, 2, 16 + o * 2, 3); R(tsx + 14 + o, tsy - o, 2, 16 + o * 2, 3); }
}
let guideShown = false;
function renderGuide() {
  guideShown = false;
  if (dlg || menu) return;
  const gi = guideInfo(); if (!gi) return;
  guideShown = true;
  const { g, pt, path } = gi;
  const px = P.px + 8 - cam.x, py = P.py + 8 - cam.y;
  let steps = null, a = null;
  if (path && path.length > 1) {
    steps = path.length - 1;
    const [ax, ay] = path[Math.min(path.length - 1, 4)];
    a = Math.atan2(ay * T + 8 - cam.y - py, ax * T + 8 - cam.x - px);
  } else if (pt) { const d = Math.abs(pt.x - P.tx) + Math.abs(pt.y - P.ty); if (d > 1) { a = Math.atan2(pt.y * T - P.py, pt.x * T - P.px); steps = d; } else steps = 0; }
  /* 人物身边的大箭头，指着下一段路的方向 */
  if (false) { /* 人物旁的三角箭头已去掉，只用地上的点点导航 */
    const bob = Math.sin(frame / 6) * 1.5;
    const ry = Math.sin(a) < -0.4 ? 34 : 17; /* 朝上时绕过头顶的名字 */
    arrowAt(px + Math.cos(a) * (20 + bob), py + 2 + Math.sin(a) * (ry + bob), a, 12, 6.5);
  }
  /* 目标栏 */
  const where = pt && pt.hop ? `往${pt.hop}` : null;
  const lbl = `目标 ${g.text}${where ? ` · ${where}` : ''}${steps ? ` · ${steps}步` : steps === 0 ? ' · 就在旁边' : ''}`;
  const w = Math.min(SAFE_W - 4, tw(lbl) + 8), x = Math.round(UX + 80 - w / 2), y = UB - 15;  // 只占两侧按键中间，不伸到按键底下
  R(x, y, w, 13, 3); R(x + 1, y + 1, w - 2, 11, 0);
  g_clip(x + 2, y, w - 4, 13, () => txt(lbl, x + 4, y + 1, 3));
}
function g_clip(x, y, w, h, fn) { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); fn(); g.restore(); }
/* 江湖地图页：各地方的位置、相互连通，当前所在和目标所在 */
const MAP_NODES = { guangming: [0, 0], damo: [1, 0], caoyuan: [3, 0], pingding: [5, 0], heimuya: [6, 0], huashan: [1, 1], yanmen: [3, 1], shanhai: [6, 1],
  zhongnan: [0, 2], tongguan: [2, 2], songshan: [3, 2], luoyang: [4, 2], shudao: [0, 3], xiangyang: [2, 3], village: [3, 3], wild: [4, 3], yangzhou: [5, 3],
  emei: [0, 4], miaojiang: [1, 4], meadow: [3, 4], wudang: [3, 5], forest: [4, 4], hangzhou: [5, 4], taohua: [6, 4], jueqing: [0, 5] };
const MAP_SHORT = { wudang: '武当', miaojiang: '苗疆', guangming: '光明', damo: '大漠', caoyuan: '草原', pingding: '平定', heimuya: '黑木', huashan: '华山', yanmen: '雁门', shanhai: '山海', zhongnan: '终南', tongguan: '潼关', songshan: '嵩山', luoyang: '洛阳', shudao: '蜀道', xiangyang: '襄阳', village: '牛村', wild: '伏牛', yangzhou: '扬州', emei: '峨眉', meadow: '兔坡', forest: '松林', hangzhou: '杭州', taohua: '桃花', jueqing: '绝情' };
/* 全屏地图：铺满整个屏幕，有框的地名、去目标的粗线、图例 */
function mapRoute(from, to) {
  const prev = { [from]: null }, q = [from];
  while (q.length) { const c = q.shift(); if (c === to) break; for (const l of mapLinks(c)) if (!(l.to in prev)) { prev[l.to] = c; q.push(l.to); } }
  const path = []; if (!(to in prev)) return path;
  for (let c = to; c != null; c = prev[c]) path.unshift(c);
  return path;
}
function mapLine(x1, y1, x2, y2, t, c, dash) {
  const n = Math.ceil(Math.max(Math.abs(x2 - x1), Math.abs(y2 - y1))), o = Math.floor(t / 2);
  for (let i = 0; i <= n; i++) if (!dash || i % 5 < 3) R(Math.round(x1 + (x2 - x1) * i / n) - o, Math.round(y1 + (y2 - y1) * i / n) - o, t, t, c);
}
function renderWorldMap() {
  g.setTransform(1, 0, 0, 1, 0, 0);
  R(0, 0, GW, GH, 0);
  /* 顶部：换页提示 */
  const cx = Math.round(GW / 2);
  R(cx - 25, 1, 50, 13, 3); txt('江湖地图', cx, 2, 0, 'center');
  R(0, 15, GW, 1, 3);
  /* 地点与道路 */
  const top = 18, bot = GH - 25, m = 4, colW = (GW - 2 * m) / 7, rowH = (bot - top) / 6;
  const XY = id => { const [c, r] = MAP_NODES[id]; return [Math.round(m + colW * (c + 0.5)), Math.round(top + rowH * (r + 0.5))]; };
  const nodeOf = id => { if (MAP_NODES[id]) return id; const seen = new Set([id]), q = [id]; while (q.length) { const c = q.shift(); for (const l of mapLinks(c)) { if (MAP_NODES[l.to]) return l.to; if (!seen.has(l.to)) { seen.add(l.to); q.push(l.to); } } } return null; };
  const here = nodeOf(map.id), hasCave = id => mapLinks(id).some(l => !MAP_NODES[l.to]);
  const gl = navGoal(), raw = gl ? mapRoute(map.id, gl.map) : [], route = gl ? raw.map(nodeOf).filter((v, i, a) => v && v !== a[i - 1]) : [], onRoute = new Set();
  for (let i = 1; i < route.length; i++) onRoute.add([route[i - 1], route[i]].sort().join('-'));
  const seen = new Set(), edges = [];
  for (const id in MAP_NODES) for (const l of mapLinks(id)) {
    if (!MAP_NODES[l.to]) continue;
    const key = [id, l.to].sort().join('-'); if (seen.has(key)) continue; seen.add(key);
    edges.push({ a: id, b: l.to, hot: onRoute.has(key), ferry: !!(FERRY[id] && FERRY[id].to === l.to) });
  }
  edges.sort((p, q) => p.hot - q.hot);
  for (const e of edges) { const [x1, y1] = XY(e.a), [x2, y2] = XY(e.b); mapLine(x1, y1, x2, y2, e.hot ? 3 : 1, e.hot ? 3 : 2, e.ferry); }
  const blink = frame % 40 < 26;
  for (const id in MAP_NODES) {
    const [x, y] = XY(id), name = MAP_SHORT[id], w = tw(name) + 6, h = 12, bx = Math.round(x - w / 2), by = Math.round(y - h / 2);
    if (hasCave(id)) { R(bx + w - 3, by - 3, 6, 4, 3); R(bx + w - 1, by - 1, 2, 2, 0); }
    if (id === here) { R(bx - 2, by - 2, w + 4, h + 4, 3); R(bx - 1, by - 1, w + 2, h + 2, 0); R(bx, by, w, h, 3); txt(name, bx + 3, by + 1, 0); }
    else if (gl && nodeOf(gl.map) === id) { R(bx - 1, by - 1, w + 2, h + 2, 3); R(bx, by, w, h, blink ? 1 : 0); txt(name, bx + 3, by + 1, 3); }
    else { R(bx - 1, by - 1, w + 2, h + 2, 3); R(bx, by, w, h, 0); txt(name, bx + 3, by + 1, 3); }
  }
  /* 底部：所在、目标、图例 */
  R(0, GH - 23, GW, 1, 3);
  const info = `你在 ${MAPS[map.id].name}　　目标 ${gl ? gl.text : '暂无，随意闯荡'}${raw.length > 1 ? `（还要走${raw.length - 1}张地图）` : ''}`;
  g_clip(0, GH - 22, GW, 12, () => txt(info, 4, GH - 21, 3));
  let lx = 4; const ly = GH - 11;
  const item = (draw, label) => { draw(lx, ly); lx += 14; txt(label, lx, ly, 2); lx += tw(label) + 10; };
  item((x, y) => { R(x, y + 1, 11, 9, 3); R(x + 1, y + 2, 9, 7, 0); R(x + 2, y + 3, 7, 5, 3); }, '你在');
  item((x, y) => { R(x, y + 1, 11, 9, 3); R(x + 1, y + 2, 9, 7, blink ? 1 : 0); }, '目标');
  item((x, y) => mapLine(x, y + 5, x + 11, y + 5, 3, 3), '去路');
  item((x, y) => mapLine(x, y + 5, x + 11, y + 5, 1, 2, true), '坐船');
  item((x, y) => { R(x + 2, y + 3, 6, 4, 3); R(x + 4, y + 5, 2, 2, 0); }, '有地下洞');
  txt('点屏幕返回', GW - 4, ly, 2, 'right');
}
