// 加速模拟一个角色从 0 级一路练到顶要多少游戏时间：按当前等级挑合适的怪打，打完打坐回血，全部按帧计时
window.simProgress = function (limitMin = 120) {
  const G = window.__game, S = G.S, P = G.P;
  const LADDER = [[0, 'meadow', 'fox'], [12, 'wild', 'wolf'], [22, 'wild', 'bandit'], [32, 'forest', 'tiger'], [42, 'huashan', 'hsjianke'], [52, 'heifeng', 'dongxiong'], [60, 'siguo', 'hsjianke'], [66, 'digong', 'shiwei'], [74, 'jianzhong', 'jianling'], [84, 'jianzhong2', 'jianling'], [90, 'jueqing', 'jqdizi']];
  S.skills = { changquan: 0, huashan: 0, tiebushan: 0, caoshangfei: 0, quanzhen: 0 };
  S.active = 'huashan'; S.passive = { 护体: 'tiebushan', 步法: 'caoshangfei', 心法: 'quanzhen' };
  for (const w of ['tiejian', 'jinzhuang']) if (!S.gear.includes(w)) S.gear.push(w);
  S.equip = { weapon: 'tiejian', body: 'jinzhuang', head: null }; S.age = 16; S.ageT = 0;
  let f = 0, kills = 0, deaths = 0; const marks = {}, LIM = limitMin * 3600;
  while (f < LIM && S.skills.huashan < 99.99) {
    const L = S.skills.huashan;
    if (L > 30 && S.equip.weapon === 'tiejian') { S.gear.push('qinggang'); S.equip.weapon = 'qinggang'; }
    if (L > 60 && S.equip.weapon === 'qinggang') { S.gear.push('hantiejian'); S.equip.weapon = 'hantiejian'; S.gear.push('xiongpijia'); S.equip.body = 'xiongpijia'; }
    const [, m, k] = LADDER.filter(r => r[0] <= L).pop();
    P.dead = false; G.warp(m, 1, 1); G.enemies.length = 0;
    const x = P.tx, y = P.ty; let ex = null;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (!G.SOLID.has(G.map.rows[y + dy][x + dx])) { ex = [x + dx, y + dy]; break; }
    const e = G.makeEnemy(k, ex[0], ex[1]); G.enemies.push(e); S.flags[k + 'Met'] = true;
    P.target = e; let t = 0;
    while (t < 60 * 120 && !e.dead && !P.dead) { G.dlg = null; G.tick(); f++; t++; }
    if (P.dead) { deaths++; P.dead = false; f += 60 * 20; }
    else kills++;
    // 打坐回到九成血
    G.enemies.length = 0; P.target = null; P.sit = true; t = 0;
    while (S.hp < G.maxHP() * 0.9 && t < 60 * 300) { G.dlg = null; P.sit = true; G.tick(); f++; t++; }
    P.sit = false;
    for (const lv of [30, 60, 90]) if (!marks[lv] && S.skills.huashan >= lv) marks[lv] = +(f / 3600).toFixed(1);
  }
  return { minutes: +(f / 3600).toFixed(1), level: +S.skills.huashan.toFixed(2), tiebushan: +S.skills.tiebushan.toFixed(1), xinfa: +S.skills.quanzhen.toFixed(1), age: S.age, kills, deaths, at: marks };
};
