/* ======== 怪物强弱：离城镇越近越弱 ========
   从各城镇出发数地图连接的步数：离城一步的地方怪最弱，越往外越强；地下图又比所在的山更深一层。
   同一种怪在不同地方按所在地的档次放大或缩小，头目不缩放 */
const TOWNS = ['village', 'xiangyang', 'luoyang', 'yangzhou', 'hangzhou', 'pingding'];
const BANDS = [[0, 0], [1, 25], [25, 45], [45, 65], [65, 80], [80, 95], [95, 110], [105, 120]];
let _danger = null;
function dangerOf(id) {
  if (!_danger) {
    _danger = {}; const q = [...TOWNS]; TOWNS.forEach(t => (_danger[t] = 0));
    while (q.length) { const c = q.shift(); for (const l of mapLinks(c)) if (!(l.to in _danger)) { _danger[l.to] = _danger[c] + 1; q.push(l.to); } }
  }
  return Math.min(7, _danger[id] == null ? 3 : _danger[id]);
}
/* 个别地方手调：黑松林的猛虎是第一章收尾，不要太凶 */
const LV_OVERRIDE = { forest: { tiger: 38 } };
const noScale = d => d.boss || d.dboss || d.dummy || d.hunter;
const _lvCache = {};
function mapLevels(id) {
  if (_lvCache[id]) return _lvCache[id];
  const d = dangerOf(id), [lo, hi] = BANDS[d], out = {};
  const kinds = [...new Set((MAPS[id].spawns || []).map(([k]) => k))].filter(k => EN[k] && !noScale(EN[k]));
  if (!kinds.length || !d) return (_lvCache[id] = out);
  const lvs = kinds.map(k => EN[k].lv), bmin = Math.min(...lvs), bmax = Math.max(...lvs);
  const fits = lvs.every(v => v <= hi && v >= (d === 1 ? 1 : lo));
  const L = d === 1 ? 12 : lo;
  const ov = LV_OVERRIDE[id] || {};
  for (const k of kinds) out[k] = ov[k] != null ? ov[k] : fits ? EN[k].lv : Math.round(bmax === bmin ? (L + hi) / 2 : L + (EN[k].lv - bmin) / (bmax - bmin) * (hi - L));
  return (_lvCache[id] = out);
}
function levelRange(id) {
  const v = Object.values(mapLevels(id)); const bs = (MAPS[id].spawns || []).map(([k]) => EN[k]).filter(d => d && (d.dboss || d.boss)).map(d => d.lv);
  const all = v.concat(bs); return all.length ? [Math.min(...all), Math.max(...all)] : null;
}
const hpOf = l => 40 + 12 * l, atkOf = l => 2 + 0.33 * l;
function scaledDef(kind) {
  const b = EN[kind]; if (!map || noScale(b)) return null;
  const nl = mapLevels(map.id)[kind]; if (nl == null || nl === b.lv) return null;
  return { ...b, lv: nl, hp: Math.round(hpOf(nl) * b.hp / hpOf(b.lv)), atk: Math.round(atkOf(nl) * b.atk / atkOf(b.lv) * 10) / 10, dodge: Math.max(2, b.dodge + Math.round((nl - b.lv) / 12)) };
}
const ED = e => e.d || EN[e.kind];
/* 主动攻击：20 级以上的怪、头目、追兵会主动扑上来；20 级以下的只在挨打后还手 */
const AGGRO_LV = 20;
const isAggro = e => { const d = ED(e); return !d.passive && !d.dummy && (d.boss || d.dboss || d.hunter || e.kind === 'hunter' || e.kind === 'pantu' || d.camp || d.lv >= AGGRO_LV); };
/* 山门清净地：门派掌门身边 5 格内，怪物不进来，也不在里面动手（被你先打了除外） */
const SAFE_R = 5;
let safeSpots = [];
const isSafeNpc = id => Object.values(MASTER_IDS).includes(id) || ['qzzong', 'gbzong', 'mjzong'].includes(id);
const inSafe = (x, y) => safeSpots.some(([sx, sy]) => Math.abs(sx - x) + Math.abs(sy - y) <= SAFE_R);
function makeEnemy(kind, x, y) {
  const d = scaledDef(kind) || EN[kind];
  return { kind, tx: x, ty: y, px: x * T, py: y * T, dir: 'down', face: 'left', hp: d.hp, max: d.hp, moving: false, cd: 0, stepT: rnd(0, 30), hitT: 0, stunT: 0, dead: false, respawn: 0, home: { x, y }, adj: false, combo: 0 , d: d === EN[kind] ? null : d };
}
/* 每张地图记住怪物：离开再回来不会刷满，死掉的怪按离开的时间继续计时复活 */
let mapState = {};
function enterMap(id, x, y, dir) {
  P.fish = null; NET.others.clear();
  { const mm = MAPS[id]; if (!(x >= 0 && y >= 0 && x < mm.w && y < mm.h) || SOLID.has(mm.rows[y][x])) { const k = Object.keys(mm.exits)[0]; if (k) { const [ex, ey] = k.split(',').map(Number); [x, y] = exitInner({ x: ex, y: ey }, mm.w, mm.h); } } }
  if (map && enemies) mapState[map.id] = { list: enemies, t: frame };
  map = MAPS[id]; S.map = id;
  npcs = (NPCS[id] || []).map(n => ({ ...n }));
  safeSpots = npcs.filter(n => isSafeNpc(n.id)).map(n => [n.x, n.y]);
  /* 掌门搬进大殿以后，大殿门口照样是安全的山门 */
  for (const b of map.buildings || []) if (b.inside && (NPCS[b.inside] || []).some(n => isSafeNpc(n.id))) safeSpots.push([b.x + Math.floor(b.w / 2), b.y + b.h]);
  P.tx = x; P.ty = y; P.px = x * T; P.py = y * T; P.dir = dir || 'down'; P.moving = false; P.sit = false; P.target = null;
  const st = mapState[id];
  if (st) {
    const gone = frame - st.t;
    enemies = st.list.filter(e => !(e.dead && ED(e).once));
    for (const e of enemies) {
      e.moving = false; e.px = e.tx * T; e.py = e.ty * T; e.lunge = 0;
      if (!ED(e).hunter) e.adj = false;
      if (e.dead && e.respawn !== Infinity) e.respawn = Math.max(1, e.respawn - gone);
      if (!e.dead && e.hp < e.max) e.hp = Math.min(e.max, e.hp + Math.round(gone / 6));
      if (!e.dead && e.tx === x && e.ty === y) { e.tx = e.home.x; e.ty = e.home.y; e.px = e.tx * T; e.py = e.ty * T; }
    }
    if (S.flags.boss) enemies = enemies.filter(e => e.kind !== 'boss');
  } else enemies = map.spawns.filter(([k, ex, ey]) => !(k === 'boss' && S.flags.boss) && !(inSafe(ex, ey) && !EN[k].boss && !EN[k].dboss)).map(([k, ex, ey]) => makeEnemy(k, ex, ey));
  if (S.purge !== undefined) spawnSpecial();
  spawnMainBoss();
  fx = [];
  const lr = levelRange(id);
  banner = { text: lr ? `${map.name}　怪物${lr[0] === lr[1] ? lr[0] : lr[0] + '～' + lr[1]}级` : map.name, t: 130 };
}

