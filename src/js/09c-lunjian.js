/* ---------------- 华山论剑（大结局） ----------------
   条件：第二章完成，并做完一条阵营主线，任一武功练到 60 级。
   华山之巅的论剑主持带你上论剑台，连战五位宗师：一灯大师、周伯通、黄药师、洪七公、王重阳。
   每胜一场回一半血；被打下台不丢银子，下次从第一场重新来。五场全胜，得“天下第一”名号。 */
const LJ_ORDER = ['lj_yideng', 'lj_zhou', 'lj_huang', 'lj_hong', 'lj_wang'];
{
  const W = 13, H = 11, rows = [];
  for (let y = 0; y < H; y++) {
    let r = '';
    for (let x = 0; x < W; x++) r += (y === 0 || y === H - 1 || x === 0 || x === W - 1) ? 'c' : (x === 1 || x === W - 2 || y === 1) && (x + y) % 3 === 0 ? 'r' : '_';
    rows.push(r);
  }
  rows[H - 1] = rows[H - 1].slice(0, 6) + '_' + rows[H - 1].slice(7);
  MAPS.lunjian = { id: 'lunjian', name: '华山之巅·论剑台', rows, w: W, h: H, buildings: [], spawns: [], signs: {}, doors: {}, arena: true, floor: 'v',
    exits: { '6,10': { map: 'huashan', x: 23, y: 10, dir: 'down' } } };
}
/* 论剑主持站在风老旁边 */
{
  const m = MAPS.huashan, list = NPCS.huashan || (NPCS.huashan = []), used = new Set(list.map(n => n.x + ',' + n.y));
  let spot = null;
  for (const [x, y] of [[25, 8], [21, 8], [25, 9], [21, 9], [23, 9], [26, 7], [20, 7]]) if (!SOLID.has(m.rows[y][x]) && !used.has(x + ',' + y)) { spot = [x, y]; break; }
  if (spot) {
    list.push({ id: 'lunjian_host', name: '论剑主持', role: '华山论剑', icon: '剑', x: spot[0], y: spot[1], dir: 'down', look: { body: 'changpao', hair: 'crown', beard: true }, talk: () => lunjianTalk() });
    MAPS.lunjian.exits['6,10'] = { map: 'huashan', x: spot[0], y: spot[1] + 1, dir: 'down' };
  }
}
function ljReady() {
  const why = [];
  if (S.q.main < MAIN_END) why.push('先把第二章的事办完（襄阳百晓生）');
  if (!(S.cqDone || []).length) why.push('做完一条阵营主线（主城接引使）');
  const best = Math.max(0, ...Object.keys(S.skills).filter(k => SK[k].cat !== '生产').map(k => S.skills[k]));
  if (best < 60) why.push(`任一武功练到 60 级（现在最高 ${best.toFixed(2)}）`);
  return why;
}
function lunjianTalk() {
  const who = '论剑主持', lj = S.lj || (S.lj = { round: 0, wins: 0 });
  if (S.champion) return ask(who, [`天下第一，${S.name}。`, `论剑台随时恭候。你已经赢过 ${lj.wins} 次。`], ['再上论剑台', '告辞'], i => { if (i === 0) ljEnter(); });
  const why = ljReady();
  if (why.length) return say(who, ['华山论剑，五位宗师坐镇，胜者为天下第一。', '你还差些火候：', ...why.map(s => '· ' + s)]);
  ask(who, ['华山论剑，连战五场：一灯大师、周伯通、黄药师、洪七公、王重阳。', '每胜一场回一半血；被打下台不丢银子，下回从头再来。', '准备好了吗？'], ['登上论剑台', '再准备一下'], i => { if (i === 0) ljEnter(); });
}
function ljEnter() { S.lj.round = 0; enterMap('lunjian', 6, 8, 'up'); }
function arenaSpawn() {
  if (!S.lj) S.lj = { round: 0, wins: 0 };
  enemies = enemies.filter(e => !ED(e).lunjian);
  const k = LJ_ORDER[S.lj.round]; if (!k) return;
  const e = makeEnemy(k, 6, 3); e.home = { x: 6, y: 3 }; enemies.push(e); P.target = e;
  toast(`第 ${S.lj.round + 1} 场：${EN[k].name} 上台`);
  const d = EN[k]; if (d.intro) say(d.name, d.intro);
}
function lunjianWin(e) {
  S.lj.round++;
  S.hp = Math.min(maxHP(), S.hp + Math.ceil(maxHP() * 0.5)); S.mp = Math.min(maxMP(), S.mp + Math.ceil(maxMP() * 0.5)); S.st = maxST();
  if (S.lj.round < LJ_ORDER.length) { sfx('level'); save(); setTimeout(() => { if (map && map.arena) arenaSpawn(); }, 1500); return; }
  S.lj.wins++; S.lj.round = 0;
  const first = !S.champion;
  S.champion = true; S.silver += first ? 1000 : 200; addRep(first ? 100 : 10); sfx('level');
  if (first) { const g = RARE[rnd(0, RARE.length - 1)]; S.gear.push(g); save();
    return say('王重阳', ['（他收了掌，哈哈大笑）', '好！好！后生可畏。', `从今日起，${S.name}便是天下第一！`, `（得到“天下第一”名号、银两 1000、江湖声望 +100、${EQ[g].name}）`, '—— 华山论剑 完 ——'], () => enterMap('huashan', MAPS.lunjian.exits['6,10'].x, MAPS.lunjian.exits['6,10'].y, 'down')); }
  save(); say('王重阳', ['天下第一，名不虚传。', '（银两 200、江湖声望 +10）'], () => enterMap('huashan', MAPS.lunjian.exits['6,10'].x, MAPS.lunjian.exits['6,10'].y, 'down'));
}
