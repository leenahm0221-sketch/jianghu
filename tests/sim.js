// 在页面里跑：给定玩家等级 L 和地图、怪物种类，加速模拟一场战斗
window.simFight = function (L, mapId, kind, opt = {}) {
  const G = window.__game, S = G.S, P = G.P;
  const wpn = L < 30 ? 'tiejian' : L < 60 ? 'qinggang' : 'hantiejian';
  const body = L < 30 ? 'jinzhuang' : L < 60 ? 'shoupi' : 'xiongpijia';
  S.skills = { changquan: 0, huashan: L, tiebushan: L * 0.8, caoshangfei: L * 0.8, quanzhen: L * 0.7 };
  S.active = 'huashan'; S.passive = { 护体: 'tiebushan', 步法: 'caoshangfei', 心法: 'quanzhen' };
  if (!S.gear.includes(wpn)) S.gear.push(wpn); if (!S.gear.includes(body)) S.gear.push(body);
  S.equip = { weapon: wpn, body, head: 'douli' }; if (!S.gear.includes('douli')) S.gear.push('douli');
  S.age = opt.age || Math.round(16 + L / 3); S.buffs = {};
  P.dead = false; G.warp(mapId, 1, 1);
  const es = G.enemies; es.length = 0;
  const x = P.tx, y = P.ty;
  let ex = null; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!G.SOLID.has(G.map.rows[y + dy][x + dx])) { ex = [x + dx, y + dy]; break; } }
  if (!ex) return null;
  const e = G.makeEnemy(kind, ex[0], ex[1]); es.push(e); S.flags[kind + 'Met'] = true;
  P.dead = false; const mh = G.maxHP(); S.hp = mh; S.mp = 999; S.st = 999; for (const k in S.parts) S.parts[k] = 999; G.tick();
  const hp0 = S.hp, before = S.skills.huashan;
  P.target = e; let f = 0;
  while (f < 60 * 180 && !e.dead && !P.dead) { G.dlg = null; G.tick(); f++; }
  return { L, map: mapId, kind, mlv: G.ED(e).lv, secs: +(f / 60).toFixed(1), won: e.dead, hpLost: Math.round((hp0 - S.hp) / hp0 * 100), gain: +(S.skills.huashan - before).toFixed(3), maxhp: hp0 };
};
