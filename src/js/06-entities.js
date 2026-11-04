/* ---------------- map / entities ---------------- */
function tileAt(x, y) { if (x < 0 || y < 0 || x >= map.w || y >= map.h) return 'M'; return map.rows[y][x]; }
const resKey = (x, y) => `${map.id}:${x},${y}`;
const isDepleted = (x, y) => { const t = depleted[resKey(x, y)]; return t != null && t > frame; };
const LOOT_NAME = { J: '石刻', '*': '草药', '&': '灵芝', 'O': '铁矿', 'X': '旧木箱', 'm': '棉花' };
/* 点一下地上的东西，看它叫什么 */
const TILE_NAME = { '.': '草地', ',': '长草', ';': '林间空地', f: '野花', r: '石头', q: '灌木', o: '水井', T: '树', c: '山崖', k: '竹子', M: '大山', '~': '河水', W: '城墙', Q: '城门', P: '雪松', '^': '台阶', '_': '石板地', '=': '大路', E: '大路', B: '木桥', R: '屋顶', '#': '墙', D: '门', F: '篱笆', S: '告示牌', i: '冰崖', v: '碎石地', y: '沙地', U: '石碑', H: '屋里', '%': '雪地' };
let peek = null;
function peekName(x, y) {
  const e = enemies.find(e => !e.dead && Math.abs(e.px / T - x) < 0.6 && Math.abs(e.py / T - y) < 0.6) || enemyAt(x, y);
  if (e) { const d = ED(e); return `${d.name} ${d.lv}级` + (isAggro(e) ? ' 会主动打人' : ''); }
  const n = npcs.find(n => n.x === x && n.y === y);
  if (n) return n.name;
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return null;
  const t = map.rows[y][x];
  if (t === 'J') return '石刻 走近按A看';
  if (t === 'X') return LOOT_NAME[t] + (lootable(x, y) ? ' 走近按A' : '（已打开）');
  if (RES_TILES[t]) {
    const nm = resName(x, y, t);
    return isDepleted(x, y) ? `${nm}（采过了，过阵子再长）` : `${nm} 走近按A采`;
  }
  if (t === 'T') { const hs = hash(x, y), inF = map.ground === 'forest'; return inF ? (hs % 3 === 0 ? '柏树' : '松树') : ['树', '松树', '柳树', '果树', '树'][hs % 5]; }
  if (t === 'r' && map.ground === 'sand') return '大石头';
  return TILE_NAME[t] || null;
}
function setPeek(x, y) { const name = peekName(x, y); peek = name ? { x, y, name, until: frame + 150 } : null; }
function lootable(x, y) {
  if (x < 0 || y < 0 || x >= map.w || y >= map.h) return false;
  const t = map.rows[y][x];
  if (t === 'X') return !(S && S.flags['chest_' + map.id + `${x},${y}`]);
  if (t === 'J') return !(S && S.found && S.found.includes(map.id + ':' + x + ',' + y));
  return !!RES_TILES[t] && !isDepleted(x, y);
}
const DIRS_LIST = [[1, 0], [-1, 0], [0, 1], [0, -1]];
function otherAt(x, y) { if (!NET.online) return null; for (const o of NET.others.values()) if (o.x === x && o.y === y) return o; return null; }
/* 查看别的玩家：向服务器要他最近一次存档里的装备、武功 */
let inspect = null;
function inspectPlayer(o) {
  if (!NET.online || NET.status !== 'up') return toast('没连上服务器');
  inspect = { id: o.id, name: o.name, card: null, t: 0 }; netSend({ t: 'insp', id: o.id }); sfx('menu');
}
function renderInspect() {
  if (!inspect) return;
  MW = Math.min(SAFE_W, 236); g.setTransform(1, 0, 0, 1, UX + Math.round((160 - MW) / 2), 0);
  box(0, 12, MW, 132);
  const c = inspect.card;
  txt(inspect.name, 8, 16, 3);
  if (!c) { txt(inspect.err || '打听中……', MW / 2, 70, 2, 'center'); txt('B返回', MW / 2, 129, 2, 'center'); return; }
  const camp = c.sect && SECTS[c.sect] ? SECTS[c.sect].camp : null;
  txt(`${c.age}岁 ${c.sect && SECTS[c.sect] ? SECTS[c.sect].name : '无门无派'}`, MW - 8, 16, 2, 'right');
  R(4, 29, MW - 8, 1, 3);
  const pair = (y, a, b) => { txt(a, 8, y, 2); g_clip(30, y, MW - 36, 12, () => txt(b, 30, y, 3)); };
  const eqn = id => (id && EQ[id] ? EQ[id].name : '—');
  pair(32, '兵器', eqn(c.equip && c.equip.weapon));
  pair(44, '衣帽', `${eqn(c.equip && c.equip.body)} ${c.equip && c.equip.head ? eqn(c.equip.head) : ''}`);
  pair(56, '名望', `声望${c.rep} 正${c.zheng} 邪${c.xie}${camp ? ' ' + { 正: '正派', 邪: '邪派', 中: '中立' }[camp] : ''}`);
  R(4, 69, MW - 8, 1, 2);
  const sk = Object.entries(c.skills || {}).filter(([k]) => SK[k] && SK[k].cat !== '生产').sort((a, b) => b[1] - a[1]).slice(0, 5);
  sk.forEach(([k, v], i) => {
    const y = 72 + i * 11, kd = skKind(k);
    R(7, y, 11, 11, 3); txt({ 基础: '基', 门派: '门', 江湖: '江', 特殊: '特' }[kd], 8, y, 0);
    txt(SK[k].name + (k === c.active || Object.values(c.passive || {}).includes(k) ? '●' : ''), 21, y, 3);
    txt(Number(v).toFixed(2), MW - 8, y, 2, 'right');
  });
  txt('●正在用　B返回', MW / 2, 129, 2, 'center');
}
function npcAt(x, y) { return npcs.find(n => n.x === x && n.y === y); }
function buildingAt(x, y) { return (map.buildings || []).find(b => x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h); }
function enemyAt(x, y) { return enemies.find(e => !e.dead && e.tx === x && e.ty === y); }
function occupied(x, y, self) {
  if (self !== P && P.tx === x && P.ty === y) return true;
  if (npcAt(x, y)) return true;
  return enemies.some(e => !e.dead && e !== self && e.tx === x && e.ty === y);
}
function canMove(x, y, self) {
  const t = tileAt(x, y);
  if (SOLID.has(t) && !((t === '*' || t === '&') && isDepleted(x, y))) return false;
  if (self !== P && t === 'E') return false;
  return !occupied(x, y, self);
}
