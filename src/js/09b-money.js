/* ---------------- 花银子的地方 ----------------
   1. 兵器强化：铁匠铺花银子和矿料，把手上的兵器强化到 +1～+10，每级攻击力多 6%。
      越往上越贵、成功率越低；失败只耗掉银子和材料，兵器不会坏、不会掉级。
   2. 驿站车马：每座大城客栈门口有车夫，花银子直接坐车去别的大城，越远越贵。 */
const ENH_MAX = 10, ENH_STEP = 0.06;
const enhLv = id => (S && S.enh && id ? S.enh[id] || 0 : 0);
const enhMul = () => 1 + ENH_STEP * enhLv(S.equip.weapon);
const eqName = id => (EQ[id] ? EQ[id].name + (EQ[id].slot === 'weapon' && enhLv(id) ? `+${enhLv(id)}` : '') : '—');
function enhTier(id) {
  const e = EQ[id];
  if (e.rare) return 4;
  if (/^(hantie|wujin)/.test(id)) return 3;
  if (['qinggang', 'guitou', 'lihua', 'baleng'].includes(id)) return 2;
  return 1;
}
function enhCost(id, L) {
  const base = [0, 20, 40, 80, 150][enhTier(id)];
  const silver = base * (L + 1) * (L + 2) / 2;
  const [mat, n] = L < 3 ? ['shengtie', L + 1] : L < 6 ? ['jingtie', L - 2] : L < 9 ? ['hantie', L - 5] : ['xuantiekuang', 2];
  const rate = Math.min(100, [100, 100, 100, 90, 80, 70, 60, 50, 40, 30][L] + Math.floor(lv('duanzao') * 0.2));
  return { silver, mat, n, rate };
}
function enhanceTalk(who, back) {
  const id = S.equip.weapon;
  if (!id) return say(who, '先把要强化的兵器拿在手上（按“换武器”切换）。', back);
  const L = enhLv(id);
  if (L >= ENH_MAX) return say(who, `${eqName(id)}已经强化到顶了，再敲就要坏了。`, back);
  const c = enhCost(id, L);
  ask(who, `${eqName(id)} 强化到 +${L + 1}：银子 ${c.silver} 两、${ITEMS[c.mat].name} ${c.n} 块，成功率 ${c.rate}%。每级攻击力多 6%。`, ['强化', '返回'], i => {
    if (i) return back();
    if (S.silver < c.silver) return say(who, `银子不够，要 ${c.silver} 两，你只有 ${S.silver} 两。`, () => enhanceTalk(who, back));
    if ((S.items[c.mat] || 0) < c.n) return say(who, `${ITEMS[c.mat].name}不够，要 ${c.n} 块，你只有 ${S.items[c.mat] || 0} 块。`, () => enhanceTalk(who, back));
    S.silver -= c.silver; S.items[c.mat] -= c.n;
    if (Math.random() * 100 < c.rate) {
      S.enh = S.enh || {}; S.enh[id] = L + 1; sfx('level'); save();
      toast(`${eqName(id)} 强化成功！`);
      return say(who, [`叮——当！成了！`, `${eqName(id)}，攻击力比原来多 ${Math.round((L + 1) * ENH_STEP * 100)}%。`], () => enhanceTalk(who, back));
    }
    sfx('hurt'); save();
    say(who, '火候差了一点，没成。银子和材料都耗掉了，兵器没坏。', () => enhanceTalk(who, back));
  });
}

/* ---- 驿站车马 ---- */
const STATION_TOWNS = ['village', 'xiangyang', 'luoyang', 'yangzhou', 'hangzhou', 'pingding'].filter(id => MAPS[id]);
const stationSpot = {};
for (const id of STATION_TOWNS) {
  const m = MAPS[id], b = (m.buildings || []).find(b => b.kind === 'inn') || (m.buildings || []).find(b => b.kind === 'tavern');
  if (!b) continue;
  const dx = b.x + Math.floor(b.w / 2), dy = b.y + b.h - 1, used = new Set((NPCS[id] || []).map(n => n.x + ',' + n.y));
  const ok = (x, y) => x > 0 && y > 0 && x < m.w - 1 && y < m.h - 1 && !SOLID.has(m.rows[y][x]) && m.rows[y][x] !== 'E' && !m.exits[x + ',' + y] && !used.has(x + ',' + y)
    && !SOLID.has(m.rows[y + 1][x]) && !used.has(x + ',' + (y + 1));
  let spot = null;
  for (const [ox, oy] of [[-2, 1], [2, 1], [-3, 1], [3, 1], [-2, 2], [2, 2], [-3, 2], [3, 2], [-4, 1], [4, 1], [0, 3], [-1, 3], [1, 3]]) if (ok(dx + ox, dy + oy)) { spot = [dx + ox, dy + oy]; break; }
  if (!spot) continue;
  stationSpot[id] = spot;
  (NPCS[id] || (NPCS[id] = [])).push({ id: 'cheyuan_' + id, name: '车夫', role: '驿站', icon: '车', x: spot[0], y: spot[1], dir: 'down',
    look: { body: 'vest', hair: 'band' }, talk: () => stationTalk(id) });
}
function hopsBetween(a, b) {
  const seen = { [a]: 0 }, q = [a];
  while (q.length) { const c = q.shift(); if (c === b) return seen[c]; for (const l of mapLinks(c)) if (!(l.to in seen) && !MAPS[l.to].indoor) { seen[l.to] = seen[c] + 1; q.push(l.to); } }
  return 9;
}
const fareTo = (from, to) => Math.max(20, 15 * hopsBetween(from, to));
function stationTalk(here) {
  const dests = Object.keys(stationSpot).filter(id => id !== here);
  ask('车夫', `客官要去哪儿？坐车省脚力，路上颠是颠了点。你身上有 ${S.silver} 两。`, dests.map(id => `${MAPS[id].name} ${fareTo(here, id)}两`).concat(['不坐了']), i => {
    if (i >= dests.length) return;
    const to = dests[i], fare = fareTo(here, to);
    if (S.silver < fare) return say('车夫', `去${MAPS[to].name}要 ${fare} 两，你的银子不够。`);
    S.silver -= fare; sfx('coin');
    const [sx, sy] = stationSpot[to];
    enterMap(to, sx, sy + 1, 'down'); save();
    toast(`坐了一路车，到了${MAPS[to].name}（车钱 ${fare} 两）`);
  });
}
