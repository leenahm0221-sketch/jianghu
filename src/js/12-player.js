/* ---------------- player ---------------- */
function stepEnt(e, spd) {
  const tx = e.tx * T, ty = e.ty * T;
  const dx = tx - e.px, dy = ty - e.py;
  if (Math.abs(dx) <= spd) e.px = tx; else e.px += Math.sign(dx) * spd;
  if (Math.abs(dy) <= spd) e.py = ty; else e.py += Math.sign(dy) * spd;
  if (e.px === tx && e.py === ty) { e.moving = false; return true; }
  return false;
}
/* SELECT：在空手和身上的兵器之间轮换；武功跟着兵器自动换成该系惯用的那门 */
function cycleWeapon() {
  const ws = [null, ...new Set(S.gear.filter(id => EQ[id].slot === 'weapon'))];
  if (ws.length < 2) { toast('身上没有兵器可换'); return; }
  const nx = ws[(ws.indexOf(S.equip.weapon) + 1) % ws.length];
  S.equip.weapon = nx; ensureActive();
  toast(nx ? `换上${eqName(nx)}·${SK[S.active].name}` : `空手·${SK[S.active].name}`); sfx('menu');
}
/* 换武器小框：按“换武器”弹出身上所有兵器，按类别排好；上下选，左右跳到上一类/下一类，A 换上，B 或再按换武器关掉 */
let wpick = null;
const WP_ORDER = ['拳', '剑', '刀', '枪', '槌', '暗器', '弓'];
function openWpick() {
  const ws = [...new Set(S.gear.filter(id => EQ[id].slot === 'weapon'))].sort((a, b) => WP_ORDER.indexOf(EQ[a].type) - WP_ORDER.indexOf(EQ[b].type));
  if (!ws.length) { toast('身上没有兵器可换'); return; }
  const list = [null, ...ws];
  wpick = { list, sel: Math.max(0, list.indexOf(S.equip.weapon)) }; sfx('menu');
}
const wpCat = id => (id ? EQ[id].type : '空');
function updWpick() {
  const L = wpick.list, n = L.length;
  if (pressed.b || pressed.select || pressed.start) { wpick = null; sfx('menu'); return; }
  if (pressed.up) { wpick.sel = (wpick.sel + n - 1) % n; sfx('menu'); }
  if (pressed.down) { wpick.sel = (wpick.sel + 1) % n; sfx('menu'); }
  if (pressed.left || pressed.right) {   /* 跳到上一类 / 下一类的第一件 */
    const d = pressed.left ? -1 : 1, cur = wpCat(L[wpick.sel]);
    let i = wpick.sel;
    if (d > 0) { while (i < n && wpCat(L[i]) === cur) i++; if (i >= n) i = 0; }
    else { while (i > 0 && wpCat(L[i - 1]) === cur) i--; i = (i - 1 + n) % n; const c2 = wpCat(L[i]); while (i > 0 && wpCat(L[i - 1]) === c2) i--; }
    wpick.sel = i; sfx('menu');
  }
  if (pressed.a) {
    const id = L[wpick.sel]; wpick = null;
    S.equip.weapon = id; ensureActive(); P.atkT = 0;
    toast(id ? `换上${eqName(id)}·${SK[S.active].name}` : `空手·${SK[S.active].name}`); sfx('menu'); save();
  }
}
/* 轻功主要是提高闪躲；走路只快一点点：练到顶、最好的身法也只快 15%，测试加速也不加快走路 */
const moveSpeed = () => (1 + Math.min(1.4, pv('步法', 'mv') / 100) / 1.4 * 0.15) * (injured('leg') ? 0.6 : 1);
function updPlayer() {
  if (P.dead) return;
  if (P.fish) { if (pressed.start) { P.fish = null; } else return updFish(); }
  if (P.hurtT > 0) P.hurtT--;
  if (P.atkT > 0) P.atkT--;
  if (P.atkCD > 0) P.atkCD--;
  if (pressed.chat) { openChat(); return; }
  if (pressed.map) { tutNext(4); menu = { tab: TABS.indexOf('地图'), sel: 0, quick: true }; sfx('menu'); return; }
  if (pressed.start) { tutNext(3); menu = { tab: 0, sel: 0 }; P.sit = false; sfx('menu'); return; }
  if (pressed.select) openWpick();
  if (P.moving && stepEnt(P, moveSpeed())) onArrive();
  if (!P.moving && P.atkT <= 4) {
    const d = heldDir();
    if (d) {
      P.target = null;
      if (P.sit) { P.sit = false; toast('收功起身'); }
      P.dir = d;
      const [dx, dy] = DIRS[d];
      if (canMove(P.tx + dx, P.ty + dy, P)) { P.tx += dx; P.ty += dy; P.moving = true; }
    }
    if (!P.moving) { if (pressed.a) actA(); else if (pressed.b) actB(); else if (P.target) autoFight(); }
  }
}
function onArrive() {
  if (S.tut === 0 && (P.tutWalk = (P.tutWalk || 0) + 1) >= 3) tutNext(0);
  if (safeSpots.length) { const sf = inSafe(P.tx, P.ty); if (sf && !P.inSafe) toast('到了山门，野兽不敢靠近'); P.inSafe = sf; }
  if (!injured('leg')) train(S.passive['步法'], 0.25);
  const ex = map.exits[`${P.tx},${P.ty}`];
  if (ex) { enterMap(ex.map, ex.x, ex.y, ex.dir); save(); }
}
const distTo = e => Math.abs(e.tx - P.tx) + Math.abs(e.ty - P.ty);
function nearestEnemy(maxD, o = {}) {
  let best = null, bd = 1e9;
  for (const e of enemies) {
    if (e.dead) continue;
    const d0 = ED(e);
    if (d0.dummy ? !o.dummy : (d0.passive && !o.passive)) continue;
    if (d0.camp && !campHostile(d0.camp) && !foeOf(e.kind) && !e.provoked && !o.camp) continue;
    const d = distTo(e);
    if (d <= maxD && d < bd) { bd = d; best = e; }
  }
  return best;
}
const dirOf = (dx, dy) => Math.abs(dx) >= Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up');
function faceTo(e) { P.dir = dirOf(e.tx - P.tx, e.ty - P.ty); }
/* 远程（暗器、弓箭）：不用站成一条直线，射程内、中间没有墙挡着就能自动瞄准；只能站定了出手 */
const isRanged = c => c === '暗器' || c === '弓';
function losFree(x0, y0, x1, y1) {   /* 两点之间的格子（不含两头）有没有墙、树、NPC 挡着 */
  const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let i = 1; i < n; i++) { const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n); if ((blocks(x, y) && !enemyAt(x, y)) || npcAt(x, y)) return false; }
  return true;
}
function rangedIn(e, R) { const dx = e.tx - P.tx, dy = e.ty - P.ty; return Math.hypot(dx, dy) <= R + 0.5 && losFree(P.tx, P.ty, e.tx, e.ty); }
function inReach(e) {
  const d = distTo(e);
  if (d === 1) return true;
  if (isRanged(SK[S.active].cat)) return rangedIn(e, SK[S.active].reach || 3);
  const rc = SK[S.active].reach || 1;
  if (d <= rc && (e.tx === P.tx || e.ty === P.ty)) {
    const sx = Math.sign(e.tx - P.tx), sy = Math.sign(e.ty - P.ty);
    for (let i = 1; i < d; i++) { const mx = P.tx + sx * i, my = P.ty + sy * i; if (blocks(mx, my) || npcAt(mx, my)) return false; }
    return true;
  }
  return false;
}
/* 千年式自动战斗：锁定目标后自动转身、靠近、连续出招，直到目标倒下；身边还有敌人就接着打 */
/* 画面里看得到的范围（格） */
const VIEW_R = () => Math.max(8, Math.ceil(GW / T / 2) + 1);
/* 绕开树、墙、房子，找一条走到目标身边的路，返回第一步 */
function pathStep(e) {
  const key = (x, y) => x + ',' + y, prev = { [key(P.tx, P.ty)]: null }, q = [[P.tx, P.ty]];
  let found = null, n = 0;
  while (q.length && n++ < 900) {
    const [x, y] = q.shift();
    if (Math.abs(x - e.tx) + Math.abs(y - e.ty) === 1) { found = [x, y]; break; }
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (k in prev || Math.abs(nx - P.tx) + Math.abs(ny - P.ty) > 24 || !canMove(nx, ny, P)) continue;
      prev[k] = [x, y]; q.push([nx, ny]);
    }
  }
  if (!found || (found[0] === P.tx && found[1] === P.ty)) return null;
  let c = found;
  while (prev[key(...c)] && !(prev[key(...c)][0] === P.tx && prev[key(...c)][1] === P.ty)) c = prev[key(...c)];
  return [c[0] - P.tx, c[1] - P.ty];
}
/* 怪物只在窝边这么远内追人；人追怪也只追这么远，打架就地解决，不满地图跑 */
const LEASH = 5, CHASE = 4;
/* 锁定距离：近战 4 格；远程按射程算（斜着也能射，所以按步数要放宽一些） */
const chaseR = () => { const sk = SK[S.active]; return sk && isRanged(sk.cat) ? Math.ceil((sk.reach || 3) * 1.5) : CHASE; };
function autoFight() {
  let e = P.target;
  if (e && !e.dead && distTo(e) > chaseR()) { P.target = null; P.waitT = 0; toast(`${e.name || ED(e).name}跑远了`); return; }
  if (!e || e.dead) { const sk = SK[S.active], rg = sk && isRanged(sk.cat); e = P.target = rg ? nearestEnemy(Math.ceil((sk.reach || 3) * 1.5)) : nearestEnemy(1, { passive: true }); if (e && rg && !inReach(e)) e = P.target = null; P.waitT = 0; if (!e) return; }
  if (inReach(e)) { P.waitT = 0; faceTo(e); if (P.atkCD <= 0) attack(); return; }
  const d0 = ED(e), comes = !d0.passive && !d0.dummy && (isAggro(e) || e.adj) && (!d0.camp || campHostile(d0.camp) || foeOf(e.kind) || e.provoked) && distTo(e) <= 2;
  if (comes && (P.waitT = (P.waitT || 0) + 1) < 45) { faceTo(e); return; }
  const st = pathStep(e);
  if (st) { P.dir = dirOf(st[0], st[1]); P.tx += st[0]; P.ty += st[1]; P.moving = true; return; }
  const dx = e.tx - P.tx, dy = e.ty - P.ty;
  const ax = [Math.sign(dx), 0], ay = [0, Math.sign(dy)];
  const opts = (Math.abs(dx) >= Math.abs(dy) ? [ax, ay] : [ay, ax]).filter(([a, b]) => a || b);
  for (const [mx, my] of opts) {
    if (canMove(P.tx + mx, P.ty + my, P)) { P.dir = dirOf(mx, my); P.tx += mx; P.ty += my; P.moving = true; return; }
  }
}
/* B：打坐 / 收功。打坐回复活力、内功和伤势，同时修炼心法；附近有敌人时静不下心 */
/* 新手教学：开局几步，每步做到了自动下一步；系统菜单里可以跳过 */
const TUT = [
  '用左下的摇杆走几步',
  '走到木人桩旁边，按 A 出招',
  '按 B 盘膝打坐，回活力、内功',
  '点右上「菜单」，看看武功和装备',
  '点左上「地图」，看看江湖地图',
  '去找王村长，地上的点会带路',
];
function tutNext(step) {
  if (!S || S.tut !== step) return;
  S.tut++; sfx('level');
  if (S.tut >= TUT.length) { S.tut = 99; toast('新手教学完成，江湖路远，好自为之'); }
}
function renderTut() {
  if (!S || S.tut >= TUT.length || dlg || menu || banner || P.dead) return;
  const t = `教学 ${S.tut + 1}/${TUT.length}：${TUT[S.tut]}`, w = tw(t) + 12, x = Math.round(80 - w / 2), y = HUD_H + 3;
  R(x, y, w, 15, 3); R(x + 1, y + 1, w - 2, 13, frame % 60 < 40 ? 0 : 1); txt(t, x + 6, y + 2, 3);
}
function startSit() {
  if (enemies.some(e => !e.dead && distTo(e) <= 3 && (isAggro(e) || e.adj) && !ED(e).camp)) { toast('附近有敌人，静不下心'); return false; }
  P.sit = true; P.target = null; tutNext(2);
  toast(S.passive['心法'] ? `盘膝打坐，运转${SK[S.passive['心法']].name}` : '盘膝打坐，调匀呼吸');
  return true;
}
function actB() {
  if (P.sit) { P.sit = false; toast('收功起身'); return; }
  startSit();
}
/* 同样是草药丛、灵芝、矿石，不同地方能多采到当地特产 */
const RES_BONUS = {
  '*': { dudong: ['sanqi', 0.4], shudao: ['sanqi', 0.35], miaojiang: ['sanqi', 0.4], zhongnan: ['fengmi', 0.3], wudang: ['fengmi', 0.3], forest: ['renshen', 0.15], caoyuan: ['renshen', 0.2], jueqing: ['sanqi', 0.25] },
  '&': { zndong: ['renshen', 0.15], yandong: ['fengmi', 0.3], dudong: ['renshen', 0.3], gudi: ['xuelian', 0.3], heifeng: ['renshen', 0.4], jianzhong: ['xuelian', 0.3], jianzhong2: ['xuelian', 0.4], digong2: ['renshen', 0.3], emei: ['xuelian', 1], huashan: ['xuelian', 0.15], miaojiang: ['renshen', 0.2], forest: ['renshen', 0.1] },
  'O': { gudong: ['jingtie', 0.3], shiku: ['jingtie', 0.45], haidong: ['jingtie', 0.35], mimi: ['hantie', 0.35], chengde: ['hantie', 0.4], kuangdong: ['jingtie', 0.6], langxue: ['jingtie', 0.3], heifeng: ['hantie', 0.4], siguo: ['jingtie', 0.5], jianzhong: ['hantie', 0.5], jianzhong2: ['xuantiekuang', 0.3], digong: ['wujin', 0.4], digong2: ['xuantiekuang', 0.3], huashan: ['jingtie', 0.4], songshan: ['jingtie', 0.3], tongguan: ['jingtie', 0.3], yanmen: ['jingtie', 0.35], guangming: ['hantie', 0.3], shanhai: ['jingtie', 0.3], damo: ['wujin', 0.06], forest: ['jingtie', 0.15] },
};
/* 地方的“档次”：看这里的怪有多厉害 */
function mapTier(id) {
  const lvs = (MAPS[id].spawns || []).map(([k]) => (EN[k] ? EN[k].lv : 0));
  const m = Math.max(0, ...lvs); return m >= 70 ? 3 : m >= 45 ? 2 : m >= 20 ? 1 : 0;
}
const localMats = id => ['*', '&', 'O'].map(t => (RES_BONUS[t] || {})[id]).filter(Boolean).map(b => b[0]);
function openChest(key) {
  const f = 'chest_' + map.id + key;
  const [cx, cy] = key.split(',').map(Number), left = chestLeft(cx, cy);
  if (left > 0) return say(null, `箱子是空的，被人搜过了。约${Math.ceil(left / 60000)}分钟后会有人再放东西进来。`);
  const tier = mapTier(map.id), got = [];
  let mins = [5, 10, 20, 30][tier];
  const silver = 20 + tier * 30 + rnd(0, 20); S.silver += silver; got.push(`碎银${silver}两`);
  const meds = [['yao', 3], ['qingxin', 2], ['baiyao', 2], ['yulu', 1]][tier]; S.items[meds[0]] = (S.items[meds[0]] || 0) + meds[1]; got.push(`${ITEMS[meds[0]].name}${meds[1]}份`);
  const mats = localMats(map.id); if (mats.length) { const m = mats[rnd(0, mats.length - 1)], n = rnd(1, 2); S.items[m] = (S.items[m] || 0) + n; got.push(`${ITEMS[m].name}${n}份`); }
  /* 野外木箱里可能有江湖散学的秘籍，越险的地方越容易有 */
  const books = ['book_hujia', 'book_shenxing', 'book_yuenv', 'book_kuangfeng', 'book_bawang', 'book_leiting', 'book_yanzi', 'book_guixi', 'book_shediao', 'book_lianzhu'].filter(b => S.skills[ITEMS[b].book] == null && !S.items[b]);
  if (tier >= 1 && books.length && Math.random() < [0, 0.15, 0.3, 0.4][tier]) { const b = books[rnd(0, books.length - 1)]; S.items[b] = 1; got.push(ITEMS[b].name); mins *= 2; }
  S.flags[f] = Date.now() + mins * 60000 / FASTX(4);   /* 开出好东西的箱子要等更久才再装满 */
  sfx('coin'); save();
  return say(null, ['你撬开了旧木箱……', `找到${got.join('、')}！`]);
}
/* 石刻：前人留在山野里的字。第一次读有所领悟 */
const STELE_TEXT = [
  '赵客缦胡缨，吴钩霜雪明。银鞍照白马，飒沓如流星。', '十步杀一人，千里不留行。事了拂衣去，深藏身与名。', '桃李春风一杯酒，江湖夜雨十年灯。',
  '醉卧沙场君莫笑，古来征战几人回。', '大漠孤烟直，长河落日圆。', '剑气纵横三万里，一剑光寒十九洲。（后人刻）',
  '学剑先学心，心正剑自正。', '山中无甲子，寒尽不知年。', '力不及则以巧补之，巧不及则以心补之。', '刀是死的，人是活的。',
];
function readStele(x, y) {
  if (!S.found) S.found = [];
  const k = map.id + ':' + x + ',' + y, h = [...k].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7), text = STELE_TEXT[h % STELE_TEXT.length];
  if (S.found.includes(k)) return say(null, ['石上刻着：', text]);
  S.found.push(k);
  const kind = h % 3, lines = ['石上刻着：', text];
  if (kind === 0) { const a = S.active; S.skills[a] = Math.min(isFormer(a) ? 49.99 : 99.99, S.skills[a] + 0.5); lines.push(`你看了许久，若有所悟。（${SK[a].name} +0.50）`); }
  else if (kind === 1) { addRep(3); lines.push('你把这几句默记在心。（江湖声望 +3）'); }
  else { const mats = localMats(map.id), m = mats.length ? mats[rnd(0, mats.length - 1)] : 'caoyao'; S.items[m] = (S.items[m] || 0) + 1; lines.push(`石刻底下压着一包东西。（得到${ITEMS[m].name}）`); }
  sfx('level'); save();
  say(null, lines);
}
let _stN = 0; const steleTotal = () => _stN || (_stN = Object.values(MAPS).reduce((a, m) => a + m.rows.join('').split('J').length - 1, 0));
/* 每一株草药、每一块矿是什么，在地图上就定好了：某些地方有一部分是三七、精铁矿这类好东西，采了必得 */
function resSpecial(x, y, t) {
  const bo = (RES_BONUS[t] || {})[map.id];
  return bo && (hash(x * 7 + 3, y * 13 + 5) % 1000) / 1000 < bo[1] ? bo[0] : null;
}
const ORE_NAME = { jingtie: '精铁矿', hantie: '寒铁矿', xuantiekuang: '玄铁矿', wujin: '乌金矿' };
function resName(x, y, t) {
  const sp = resSpecial(x, y, t);
  if (sp) return ORE_NAME[sp] || ITEMS[sp].name;
  return LOOT_NAME[t];
}
function gather(x, y, t) {
  const r = RES_TILES[t];
  if (isDepleted(x, y)) return toast(t === 'O' ? '矿石刚挖过，过阵子再来' : '刚采过，还没长出来');
  if (S.skills.caiji == null) learn('caiji');
  depleted[resKey(x, y)] = frame + Math.round(r.regrow / FASTX(4));
  let n = rnd(r.n[0], r.n[1]);
  if (Math.random() * 100 < lv('caiji') * 0.6) n++;
  S.items[r.item] = (S.items[r.item] || 0) + n;
  train('caiji', 3);
  const sp = resSpecial(x, y, t);
  if (sp) {
    const m = Math.random() * 100 < lv('caiji') * 0.5 ? 2 : 1;
    S.items[sp] = (S.items[sp] || 0) + m; toast(`采到${ITEMS[sp].name}${m > 1 ? '×' + m : ''}！还有${ITEMS[r.item].name}${n > 1 ? '×' + n : ''}`); sfx('level');
  } else { toast(`${r.msg}${n > 1 ? '×' + n : ''}`); sfx('coin'); }
}
/* 钓鱼：甩竿 → 等待 → 浮标一沉头上冒“!”，按 A 咬钩 → 画面中间弹出一根竖长条：
   长条里有一条鱼上下乱窜，按住 A 让“鱼篓框”往上浮、松开往下沉，把鱼框在里面，右边的进度条涨满就钓上来，掉光鱼就跑了。
   熟练度越高，框越大、咬钩窗口越宽、稀有鱼越多；鱼越稀有越会乱窜 */
const FISH = { shanhai: [['jiyu', 70], ['liyu', 30]], jueqing: [['liyu', 70], ['jiyu', 30]], hangzhou: [['jiyu', 50], ['liyu', 50]], damo: [['jiyu', 60], ['liyu', 40]], taohua: [['liyu', 60], ['jiyu', 40]], village: [['jiyu', 80], ['liyu', 20]],
  yangzhou: [['liyu', 60], ['jiyu', 40]], xiangyang: [['jiyu', 60], ['liyu', 40]], emei: [['bingyu', 100]] };
const FISH_HARD = { jiyu: 1, liyu: 2, bingyu: 3, jinli: 4 };   /* 鱼有多难钓：越大越会窜 */
const FBAR = 96;   /* 长条的高度（像素） */
function startFish(x, y) {
  if (!S.items.yugan) return say(null, '要有鱼竿才能钓鱼。牛家村池塘边的老渔翁有卖。');
  if (S.skills.diaoyu == null) learn('diaoyu');
  P.fish = { x, y, stage: 'wait', t: rnd(100, 280) }; P.sit = false; P.target = null;
  toast('甩竿……'); sfx('swing');
}
function pickFish() {
  const pool = FISH[map.id] || FISH.village, total = pool.reduce((a, [, w]) => a + w, 0);
  let r = Math.random() * total, kind = pool[0][0];
  for (const [k, w] of pool) { if ((r -= w) < 0) { kind = k; break; } }
  if (map.id !== 'emei' && Math.random() * 100 < 1 + lv('diaoyu') * 0.08) kind = 'jinli';
  return kind;
}
function updFish() {
  const f = P.fish;
  if (f.stage === 'game') return updFishGame(f);
  if (pressed.b || heldDir()) { P.fish = null; toast('收竿'); return; }
  if (f.stage === 'wait') {
    if (pressed.a) { P.fish = null; toast('收竿太早，什么也没钓到'); return; }
    if (--f.t <= 0) { f.stage = 'bite'; f.t = Math.round(24 + lv('diaoyu') * 0.5); sfx('menu'); }
  } else {
    if (pressed.a) {   /* 咬钩了：弹出长条 */
      const kind = pickFish(), zone = Math.round(22 + lv('diaoyu') * 0.14);
      Object.assign(f, { stage: 'game', kind, hard: FISH_HARD[kind] || 1, zone, zy: FBAR - zone, zv: 0, fy: FBAR * 0.5, fv: 0, ft: FBAR * 0.5, fcd: 0, prog: 0.3, t: 0 });
      sfx('swing'); return;
    }
    if (--f.t <= 0) { toast('鱼跑了……'); train('diaoyu', 0.5); f.stage = 'wait'; f.t = rnd(100, 280); }
  }
}
function updFishGame(f) {
  f.t++;
  if (pressed.b) { P.fish = null; toast('收竿，鱼跑了'); return; }
  /* 鱼篓框：按住 A 往上浮，松开往下沉，碰到上下边会弹一下 */
  f.zv += held.a || held.up ? -0.32 : 0.26;
  f.zv = clamp(f.zv, -3.2, 3.2); f.zy += f.zv;
  if (f.zy < 0) { f.zy = 0; f.zv = Math.abs(f.zv) * 0.3; }
  if (f.zy > FBAR - f.zone) { f.zy = FBAR - f.zone; f.zv = -Math.abs(f.zv) * 0.3; }
  /* 鱼：隔一阵子换个目标游过去；难钓的鱼换得勤、游得快，锦鲤还会突然乱窜 */
  if (--f.fcd <= 0) {
    const span = 20 + f.hard * 18;
    f.ft = clamp(f.fy + (Math.random() * 2 - 1) * span, 4, FBAR - 4);
    f.fcd = Math.round(rnd(50, 90) / (0.6 + f.hard * 0.4));
    if (f.hard >= 4 && Math.random() < 0.3) f.ft = Math.random() < 0.5 ? 6 : FBAR - 6;
  }
  f.fv += (f.ft - f.fy) * (0.006 + f.hard * 0.004); f.fv *= 0.86; f.fy = clamp(f.fy + f.fv, 3, FBAR - 3);
  /* 进度：鱼在框里就涨，跑出去就掉 */
  const inside = f.fy >= f.zy && f.fy <= f.zy + f.zone;
  f.prog += inside ? 0.0062 : -(0.0035 + f.hard * 0.0008);
  if (inside && f.t % 16 === 0) sfx('menu');
  if (f.prog >= 1) {
    gainItem(f.kind); train('diaoyu', f.kind === 'jinli' ? 10 : 3 + f.hard); sfx(f.kind === 'jinli' ? 'level' : 'coin');
    Object.assign(f, { stage: 'wait', t: rnd(100, 280) }); return;
  }
  if (f.prog <= 0) { toast(`${ITEMS[f.kind] ? ITEMS[f.kind].name : '鱼'}挣脱了……`); train('diaoyu', 1); sfx('hurt'); Object.assign(f, { stage: 'wait', t: rnd(100, 280) }); }
}
function actA() {
  const [dx, dy] = DIRS[P.dir];
  const fx_ = P.tx + dx, fy = P.ty + dy;
  const n = npcAt(fx_, fy) || (tileAt(fx_, fy) === 'n' || tileAt(fx_, fy) === 't' ? npcAt(fx_ + dx, fy + dy) : null);   /* 隔着柜台、桌子也能说话 */
  if (n) { n.dir = OPP[P.dir]; P.sit = false; talkTo(n); return; }
  const t = tileAt(fx_, fy), key = `${fx_},${fy}`;
  if (t === 'S') return say(null, map.signs[key] || '字迹已经模糊了。');
  if (t === 'H') {
    const b = buildingAt(fx_, fy);
    if (b && fx_ === b.x + Math.floor(b.w / 2) && fy === b.y + b.h - 1) { const o = npcs.find(m => m.id === b.owner); if (o) return talkTo(o); }
    if (b) return say(null, b.label ? `这是${b.label}。${b.owner ? '门口有人招呼。' : ''}` : b.kind === 'pagoda' ? '一座石塔，塔身刻满经文。' : '寻常人家，门关着。');
  }
  /* 身边有怪时先打怪：贴身的怪，或正冲着你来的怪（3 格内） */
  const threat = enemies.filter(e => !e.dead && !ED(e).dummy && (!ED(e).camp || campHostile(ED(e).camp) || foeOf(e.kind) || e.provoked))
    .map(e => [e, distTo(e)]).filter(([e, d]) => d <= 1 || (d <= 3 && (isAggro(e) || e.adj) && !ED(e).passive)).sort((a, b) => a[1] - b[1])[0];
  if (threat) { const e = threat[0]; P.target = e; P.sit = false; if (inReach(e)) { faceTo(e); attack(); } else autoFight(); return; }
  if (t === 'o') return say(null, '一口水井。井水清凉。');
  if (t === 'X') return openChest(key);
  if (t === 'J') return readStele(fx_, fy);
  if (RES_TILES[t] && !isDepleted(fx_, fy)) return gather(fx_, fy, t);
  /* 采集和打怪一样：没对准也会自动转向身边能采的东西 */
  for (const [k, [ddx, ddy]] of Object.entries(DIRS)) {
    const ax = P.tx + ddx, ay = P.ty + ddy, tt = tileAt(ax, ay);
    if (RES_TILES[tt] && !isDepleted(ax, ay)) { P.dir = k; return gather(ax, ay, tt); }
  }
  for (const [k, [ddx, ddy]] of Object.entries(DIRS)) {
    const ax = P.tx + ddx, ay = P.ty + ddy, tt = tileAt(ax, ay);
    if ((tt === 'X' && lootable(ax, ay)) || tt === 'J') { P.dir = k; return tt === 'X' ? openChest(`${ax},${ay}`) : readStele(ax, ay); }
  }
  if ((t === '~' || t === 'i') && !nearestEnemy(4)) return startFish(fx_, fy);
  const front = enemyAt(fx_, fy);
  if (front) { P.target = front; P.sit = false; attack(); return; }
  const op = otherAt(fx_, fy) || [...DIRS_LIST].map(([a, b]) => otherAt(P.tx + a, P.ty + b)).find(Boolean);
  if (op && !nearestEnemy(1)) return inspectPlayer(op);
  ensureActive(); const e = nearestEnemy(chaseR(), { passive: true }) || nearestEnemy(1, { camp: true });
  if (e) { P.target = e; P.sit = false; if (inReach(e)) { faceTo(e); attack(); } else autoFight(); return; }
  for (const [k, [ddx, ddy]] of Object.entries(DIRS)) {
    const m = npcAt(P.tx + ddx, P.ty + ddy) || (tileAt(P.tx + ddx, P.ty + ddy) === 'n' ? npcAt(P.tx + ddx * 2, P.ty + ddy * 2) : null);
    if (m) { P.dir = k; m.dir = OPP[k]; P.sit = false; talkTo(m); return; }
  }
  const dm = nearestEnemy(1, { dummy: true });
  if (dm) { P.target = dm; P.sit = false; faceTo(dm); attack(); return; }
  if (t === '~' || t === 'i') return startFish(fx_, fy);
  attack();
}
/* 出招：出手间隔看攻击速度；命中看命中评级；每一下随机打中身/头/手/脚，伤害看该部位的攻击评级加兵器该部位攻击
   基础武功每招耗体力；其他武功每招同时耗体力和 2 点内功，不够时威力大减；武功到 50 级后，出招在两个动作之间交替 */
const LOC_W = [0.4, 0.15, 0.25, 0.2];
function attack() {
  if (P.atkCD > 0) return;
  ensureActive();
  const id = S.active, sk = SK[id], v = lv(id), wp = weapon();
  let weak = false;
  /* 基础武功只耗体力；其他武功同时耗体力和内功，哪样不够威力都会大减 */
  const c = ST_COST[sk.cat];
  if (S.st >= c) { S.st -= c; P.stWarned = false; }
  else { weak = true; S.st = 0; if (!P.stWarned) { toast('体力不支，出招无力'); P.stWarned = true; } }
  if (sk.tier === 2) {
    if (S.mp >= 2) { S.mp -= 2; P.mpWarned = false; }
    else { weak = true; if (!P.mpWarned) { toast('内功不足，上乘武功威力大减'); P.mpWarned = true; } }
  }
  P.lastAtk = frame;
  P.sit = false;
  P.move2 = v >= 50 ? !P.move2 : false;
  P.atkMax = P.atkT = P.move2 ? 16 : 12;
  let cd = 26 / RV[sk.spd] * (1 - v / 300) / ((wp && wp.spdMod) || 1);
  if (injured('arm')) cd *= 1.3;
  if (weak) cd *= 1.4;
  P.atkCD = Math.round(cd);
  lastFight = frame;
  sfx(P.move2 ? 'heavy' : 'swing');
  const [dx, dy] = DIRS[P.dir], cat = sk.cat, m2 = P.move2;
  /* 打到哪些格子：[x, y, 伤害倍数]。50 级第二式各系有自己的实际效果：
     拳 掌风多打一格并震退一格；剑 连斩两下；刀 旋风斩打周身八格；枪 突刺多一格、力道更大；
     锤 震地打落点四周一圈、容易震晕；暗器 三道齐发（正前方加左右两路） */
  const hits = [];
  const line = (o, len) => {   /* 暗器：沿一条直线飞，碰到墙或第一个敌人就停 */
    const px_ = -dy * o, py_ = dx * o;
    for (let i = 1; i <= len; i++) {
      const x = P.tx + dx * i + px_, y = P.ty + dy * i + py_;
      if (blocks(x, y) && !enemyAt(x, y)) return i - 1;
      if (enemyAt(x, y)) { hits.push([x, y, o ? 0.7 : 1]); return i; }
    }
    return len;
  };
  P.shotTo = null;
  /* 远程自动瞄准：先打锁定的目标，没有就打射程内最近的；第二式暗器多打目标身边两个，弓箭一箭穿过一路的人 */
  const RR = (sk.reach || 3) + (m2 && cat === '弓' ? 1 : 0);
  const okFoe = e => !e.dead && !ED(e).passive && !(ED(e).camp && !campHostile(ED(e).camp) && !foeOf(e.kind) && !e.provoked) || e === P.target || ED(e).dummy;
  let tg = isRanged(cat) && P.target && !P.target.dead && enemies.includes(P.target) && rangedIn(P.target, RR) ? P.target : null;
  if (isRanged(cat) && !tg) tg = enemies.filter(e => !e.dead && okFoe(e) && rangedIn(e, RR)).sort((a, b) => distTo(a) - distTo(b))[0] || null;
  if (tg) {
    P.target = tg; faceTo(tg);
    const ex = tg.tx - P.tx, ey = tg.ty - P.ty, n = Math.max(Math.abs(ex), Math.abs(ey));
    const path = []; for (let i = 1; i <= (cat === '弓' && m2 ? RR : n); i++) { const k = i / n; path.push([P.tx + Math.round(ex * k), P.ty + Math.round(ey * k)]); }
    let end = [ex, ey];
    if (cat === '弓' && m2) {   /* 穿云：一路上的人都中，碰墙停 */
      for (const [x, y] of path) { if (blocks(x, y) && !enemyAt(x, y)) break; end = [x - P.tx, y - P.ty]; if (enemyAt(x, y)) hits.push([x, y, 1.2]); }
    } else {
      for (const [x, y] of path) { const e = enemyAt(x, y); if (e) { hits.push([x, y, 1]); end = [x - P.tx, y - P.ty]; break; } }
    }
    P.shotTo = [end];
    if (cat === '暗器' && m2) {   /* 三道齐发：目标身边两格内再挑两个人 */
      enemies.filter(e => e !== tg && !e.dead && okFoe(e) && Math.abs(e.tx - tg.tx) + Math.abs(e.ty - tg.ty) <= 2 && rangedIn(e, RR + 1)).slice(0, 2)
        .forEach(e => { hits.push([e.tx, e.ty, 0.7]); P.shotTo.push([e.tx - P.tx, e.ty - P.ty]); });
    }
  }
  else if (cat === '暗器') { P.shot = [line(0, sk.reach || 3)]; if (m2) P.shot.push(line(-1, sk.reach || 3), line(1, sk.reach || 3)); }
  else if (cat === '弓') {
    const len = (sk.reach || 5) + (m2 ? 1 : 0);
    if (m2) {   /* 弓箭第二式：一箭穿过去，一路上的人都中 */
      let i = 1; for (; i <= len; i++) { const x = P.tx + dx * i, y = P.ty + dy * i; if (blocks(x, y) && !enemyAt(x, y)) break; if (enemyAt(x, y)) hits.push([x, y, 1.2]); }
      P.shot = [i - 1];
    } else P.shot = [line(0, len)];
  }
  else if (cat === '刀' && m2) { for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) if (a || b) hits.push([P.tx + a, P.ty + b, a === dx && b === dy ? 1.1 : 0.7]); }
  else if (cat === '槌' && m2) { const fx_ = P.tx + dx, fy = P.ty + dy; for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) { const x = fx_ + a, y = fy + b; if (x !== P.tx || y !== P.ty) hits.push([x, y, a || b ? 0.6 : 1.15]); } }
  else {
    const reach = (sk.reach || 1) + (m2 && (cat === '拳' || cat === '枪') ? 1 : 0);
    for (let i = 1; i <= reach; i++) hits.push([P.tx + dx * i, P.ty + dy * i, m2 && cat === '枪' ? 1.2 : 1]);
  }
  let gained = 0, pushed = false;
  const strike = (e, mult) => {
    const d = ED(e);
    let hitp = 76 + v * 0.15 + (RV[sk.acc] - 1) * 25 + ((wp && wp.acc) || 0) - d.dodge - (injured('head') ? 20 : 0);
    if (e.stunT > 0) hitp += 30;
    if (Math.random() * 100 > clamp(hitp, 25, 97)) { floatText(e.px + 8, e.py, '闪'); e.adj = true; return false; }
    let r = Math.random(), loc = 0;
    while (loc < 3 && r > LOC_W[loc]) { r -= LOC_W[loc]; loc++; }
    let dmg = ((sk.tier === 2 ? 11 : 7) * RV[sk.atk[loc]] + (wp && wp.type === sk.cat ? wp.atk[loc] * enhMul() : 0)) * (1 + v / 45) * (0.85 + Math.random() * 0.3);
    if (cat === '暗器') dmg *= 0.85;   /* 远处取人，力道比近身略轻 */
    if (cat === '弓' && Math.abs(e.tx - P.tx) + Math.abs(e.ty - P.ty) <= 1) dmg *= 0.5;   /* 贴身拉不开弓 */
    dmg *= mult;
    if (weak) dmg *= 0.6;
    if (injured('arm')) dmg *= 0.6;
    dmg = Math.max(1, Math.round(dmg + qi() * 0.08));
    hurtEnemy(e, dmg, loc === 1 ? `头${dmg}` : null);
    sparks.push({ x: e.px + 8 + rnd(-2, 2), y: e.py + 8 + rnd(-3, 2), t: m2 ? 12 : 8, big: m2, cat, dx: isRanged(cat) ? Math.sign(e.tx - P.tx) : dx, dy: isRanged(cat) ? Math.sign(e.ty - P.ty) : dy });
    if (m2) { hitStop = 4; shake = cat === '槌' ? 7 : 5; }
    if (d.dummy) tutNext(1);
    const stunP = (sk.stun || 0) + (m2 && cat === '槌' ? 0.4 : 0);
    if (stunP && !d.dummy && !e.dead && Math.random() < stunP) { e.stunT = 70; floatText(e.px + 8, e.py - 8, '晕'); }
    if (sk.poison && !d.dummy && !e.dead && Math.random() < sk.poison) { e.poisonT = 300; e.poisonD = Math.max(2, Math.round(dmg * 0.12)); floatText(e.px + 8, e.py - 8, '中毒'); }
    /* 拳掌第二式：掌风把第一个打中的人震退一格 */
    if (m2 && cat === '拳' && !pushed && !d.dummy && !e.dead && !d.boss) {
      pushed = true; const nx = e.tx + dx, ny = e.ty + dy;
      if (canMove(nx, ny, e) && !enemyAt(nx, ny) && !(nx === P.tx && ny === P.ty)) { e.tx = nx; e.ty = ny; e.moving = true; floatText(e.px + 8, e.py - 8, '退'); }
    }
    gained = Math.max(gained, trainFactor(v, d));
    return true;
  };
  const seen = new Set();
  for (const [x, y, mult] of hits) {
    const e = enemyAt(x, y);
    if (!e || seen.has(e)) continue;
    seen.add(e);
    strike(e, mult);
    /* 剑法第二式：同一招里再补一剑 */
    if (m2 && cat === '剑' && !e.dead) strike(e, 0.6);
  }
  if (gained) train(id, gained);
}
function hurtEnemy(e, dmg, label) {
  const d = ED(e);
  if (d.camp && !e.provoked) { e.provoked = true; if (!campHostile(d.camp) && !foeOf(e.kind)) toast(`你对${d.name}出手了！`); }
  if (!d.dummy) e.hp -= dmg;
  e.hitT = 14; e.adj = true; if (d.passive) e.flee = 1;
  floatText(e.px + 8, e.py, label || String(dmg));
  sfx('hit'); shake = d.dummy ? 1 : 3;
  if (e.hp <= 0) killEnemy(e);
}
/* 阵营厮杀：杀敌对阵营弟子涨本派声望和对应指数；杀追兵了结追杀令；杀叛徒完成清理门户。都有几率掉稀有装备 */
const RARE = ['xuantie', 'tulong', 'bawang', 'zijin', 'tiancan', 'baoyu', 'sheri', 'jinsijia', 'wucanyi'];
function campKill(e, d) {
  const pc = campOf();
  if (d.camp === '正') { addAlign(0, 2); if (pc === '邪') { addSrep(3); addRep(2); } }
  else if (d.camp === '邪') { addAlign(2, 0); if (pc === '正') { addSrep(3); addRep(2); } }
  else if (d.camp === '中') { addAlign(0, 1); }
  if (foeOf(e.kind)) { addSrep(3); toast(`打败宿敌${SECTS[EN_SECT[e.kind]].name}弟子，门派声望+3`); }
  if (e.kind === 'hunter') {
    addRep(2);
    if (S.hunted[e.sect] > 0 && --S.hunted[e.sect] <= 0) { delete S.hunted[e.sect]; toast(`${SECTS[e.sect].name}的追杀令撤了`); sfx('level'); }
    else if (S.hunted[e.sect]) toast(`${SECTS[e.sect].name}追兵还有 ${S.hunted[e.sect]} 拨`);
  }
  if (e.kind === 'pantu' && S.purge) { S.purge.done = true; toast('叛徒伏诛！回去向师父复命'); sfx('level'); }
  const s2 = rnd(10, 25); S.silver += s2; toast(`银两 +${s2}`);
  if (Math.random() < (e.kind === 'pantu' ? 0.35 : 0.07)) { const g = RARE[rnd(0, RARE.length - 1)]; S.gear.push(g); toast(`得到稀有装备：${EQ[g].name}！`); sfx('level'); }
  save();
}
const campHostile = c => { const pc = campOf(); return (c === '正' && pc === '邪') || (c === '邪' && pc === '正'); };
/* 动态刺客：叛出师门后野外会遇到追兵；接了清理门户，叛徒就躲在指定地图里 */
const PURGE_MAPS = ['meadow', 'wild', 'forest', 'songshan', 'emei', 'shudao', 'zhongnan', 'damo', 'caoyuan'];
const HUNT_MAPS = ['wudang', 'miaojiang', 'meadow', 'wild', 'forest', 'songshan', 'emei', 'heimuya', 'taohua', 'shudao', 'zhongnan', 'huashan', 'damo', 'caoyuan', 'jueqing', 'tongguan', 'yanmen', 'shanhai'];
function findSpot(minD, maxD) {
  for (let i = 0; i < 300; i++) {
    const x = rnd(1, map.w - 2), y = rnd(1, map.h - 2), d = Math.abs(x - P.tx) + Math.abs(y - P.ty);
    if (d >= minD && d <= maxD && canMove(x, y, {})) return [x, y];
  }
  return null;
}
function spawnSpecial() {
  const v = Math.max(bestAtk(), 20);
  if (S.purge && !S.purge.done && S.purge.map === map.id && !enemies.some(e => e.kind === 'pantu' && !e.dead)) {
    const sp = findSpot(6, 14);
    if (sp) { const e = makeEnemy('pantu', sp[0], sp[1]); e.name = `${SECTS[S.purge.sect].name}叛徒`; e.sect = S.purge.sect; e.max = e.hp = Math.round(300 + v * 8); enemies.push(e); toast(`${e.name}就在附近！`); }
  }
  const hs = Object.keys(S.hunted || {});
  if (hs.length && HUNT_MAPS.includes(map.id) && Math.random() < 0.45) {
    const sect = hs[rnd(0, hs.length - 1)];
    for (let k = 0; k < rnd(1, 2); k++) {
      const sp = findSpot(5, 10);
      if (!sp) continue;
      const e = makeEnemy('hunter', sp[0], sp[1]); e.name = `${SECTS[sect].name}追兵`; e.sect = sect; e.max = e.hp = Math.round(180 + v * 5); e.adj = true; enemies.push(e);
    }
    toast(`${SECTS[sect].name}的追兵找上门来了！`); sfx('hurt');
  }
}
function mainBossDown(e, d) {
  if (d.flag !== 'xuedao') { S.flags[d.flag] = true; addRep(10); sfx('level'); save(); return say(d.name, d.outro || ['你……好狠……'], () => toast(`${d.name}伏诛！回去复命`)); }
  S.flags[d.flag] = true; S.silver += 100; addAlign(5, 0); addRep(15); sfx('level'); save();
  say(d.name, ['你……你这小子……', '（他倒了下去，血刀“当啷”落地）'], () => say(null, ['血刀老祖伏诛！另得银两一百两。', '快回襄阳告诉百晓生。']));
}
/* 主线头目只在接了任务后才出现 */
function spawnMainBoss() {
  const cs = cqStep();
  const m = cs && cs.flag && !S.flags[cs.flag] ? cs : MAIN[S.q.main];
  if (!m || !m.flag || S.flags[m.flag]) return;
  const kind = Object.keys(EN).find(k => EN[k].flag === m.flag);
  if (!kind || KIND_MAP[kind] !== map.id || enemies.some(e => e.kind === kind && !e.dead)) return;
  const sp = canMove(24, 3, {}) ? [24, 3] : findSpot(14, 40) || findSpot(6, 40); if (!sp) return;
  const e = makeEnemy(kind, sp[0], sp[1]); enemies.push(e);
}
function killEnemy(e) {
  const d = ED(e);
  e.dead = true; e.respawn = (d.boss || d.once || d.lunjian) ? Infinity : (d.resp || 1800);
  if (d.camp || d.hunter) campKill(e, d);
  folkKill(e.kind);
  if (d.lunjian && map.arena) return lunjianWin(e);
  for (const [k, p] of DROPS[e.kind] || []) {
    if (Math.random() >= p) continue;
    if (EQ[k]) { S.gear.push(k); toast(`得到 ${EQ[k].name}！`); sfx('level'); continue; }
    if (ITEMS[k].book && (S.items[k] || S.skills[ITEMS[k].book] != null)) continue;
    gainItem(k);
    if (ITEMS[k].book) { sfx('level'); toast('得到一本秘籍！在行囊里研读'); }
  }
  if (e.kind === 'bandit') { const s = rnd(6, 14); S.silver += s; toast(`银两 +${s}`); sfx('coin'); addAlign(1, 0); }
  if (e.kind === 'tiger') addRep(5);
  /* 高处的人形敌人带银子；六十级以上的敌人偶尔掉稀有装备 */
  if (!d.beast && !d.camp && !d.hunter && d.lv >= 38) { const s3 = Math.round(d.lv / 4 + rnd(0, 10)); S.silver += s3; toast(`银两 +${s3}`); sfx('coin'); }
  if (d.lv >= 60 && !d.camp && Math.random() < (e.kind === 'gongsun' ? 0.5 : 0.03)) { const g = RARE[rnd(0, RARE.length - 1)]; S.gear.push(g); toast(`得到稀有装备：${EQ[g].name}！`); sfx('level'); }
  if (e.kind === 'gongsun') addRep(20);
  const stk = S.stask;
  if (stk && stk.cnt < stk.n && ((stk.type === 'kill' && stk.kind === e.kind) || (stk.type === 'patrol' && d.camp === stk.foe))) { stk.cnt++; toast(stk.cnt >= stk.n ? '门务完成，回师门复命' : `门务 ${stk.cnt}/${stk.n}`); }
  const tr = curTrial();
  if (tr && tr.kind === e.kind && S.llCnt < tr.need) { S.llCnt++; toast(S.llCnt >= tr.need ? '历练完成，回襄阳找百晓生' : `历练 ${S.llCnt}/${tr.need}`); }
  const bt = S.bounty;
  if (bt && bt.kind === e.kind && bt.cnt < bt.need) { bt.cnt++; toast(bt.cnt >= bt.need ? '悬赏完成，回镖局领赏' : `悬赏 ${ED(e).name} ${bt.cnt}/${bt.need}`); }
  const m = MAIN[S.q.main];
  if (m && m.kind === e.kind && S.q.cnt < m.need) { S.q.cnt++; toast(S.q.cnt >= m.need ? `${m.text}完成，回报${GIVER_NAME[mainGiver()]}` : `${m.text} ${S.q.cnt}/${m.need}`); }
  const cs = cqStep();
  if (cs && cs.kind === e.kind && S.cq.cnt < cs.need) { S.cq.cnt++; toast(S.cq.cnt >= cs.need ? `${cs.text}完成，回去复命` : `${cs.text} ${S.cq.cnt}/${cs.need}`); }
  if (d.flag && !S.flags[d.flag]) mainBossDown(e, d);
  if (d.boss) {
    S.flags.boss = true; S.silver += 60; addAlign(5, 0); addRep(10);
    const gotBook = S.skills.shenxing == null && !S.items.book_shenxing;
    if (gotBook) S.items.book_shenxing = 1;
    sfx('level'); save();
    say('黑风寨主', ['好……好身手……', gotBook ? '（他怀中掉出一本薄册子）' : '（他倒了下去）'], () => say(null, [gotBook ? '你得到了神行百变秘籍！基础步法练到 20 级就能在行囊里研读。' : '黑风寨主伏诛。', '另得银两六十两。快回村告诉王村长吧。']));
  }
  floatText(e.px + 8, e.py - 6, '败');
}
/* 挨打：先看步法和所用武功的闪躲能否闪开；身体受伤扣活力，同时伤到头/臂/腿其中一处；护体和衣帽按部位减伤；挨打后要等回击速度才能还手 */
const PART_IDX = { head: 1, arm: 2, leg: 3 };
function hurtPlayer(dmg, src) {
  if (P.dead) return;
  if (P.fish) { P.fish = null; toast('鱼竿被打掉了！'); }
  let hitp = 88 - pv('步法', 'eva') * 0.3 - (RV[atkSk().eva] - 1) * 20 + (injured('leg') ? 10 : 0);
  if (P.sit) hitp = 100;
  if (Math.random() * 100 > clamp(hitp, 35, 95)) {
    floatText(P.px + 8, P.py, '闪');
    train(S.passive['步法'], 0.5 * trainFactor(lv(S.passive['步法']), ED(src)));
    return;
  }
  if (P.sit) { dmg = Math.round(dmg * 1.5); P.sit = false; toast('打坐被打断！'); }
  const r = Math.random(), part = r < 0.2 ? 'head' : r < 0.6 ? 'arm' : 'leg', pi = PART_IDX[part];
  const body = Math.max(1, Math.round(dmg * (1 - Math.min(0.6, pv('护体', 'def', 0) * 0.0035)) - defense(0)));
  const hurt = Math.max(0, Math.round(dmg * 0.8 * (1 - Math.min(0.6, pv('护体', 'def', pi) * 0.0035)) - defense(pi)));
  S.hp -= body;
  const was = injured(part);
  S.parts[part] = Math.max(0, S.parts[part] - hurt);
  if (!was && injured(part)) toast(PART_MSG[part]);
  P.hurtT = 30; shake = 6; lastFight = frame;
  P.atkCD = Math.max(P.atkCD, Math.round(16 / RV[atkSk().rec]));
  floatText(P.px + 8, P.py, `-${body}`);
  sfx('hurt');
  train(S.passive['护体'], trainFactor(lv(S.passive['护体']), ED(src)));
  if (!P.target && src && !heldDir() && !P.moving) P.target = src;
  if (S.hp <= 0 || S.parts.head <= 0) die(S.parts.head <= 0);
}
function die(headHit) {
  S.hp = 0; P.dead = true; P.sit = false; P.target = null; sfx('die');
  if (map && map.arena) {   /* 论剑台上输了：只是被打下台，不丢银子，回华山之巅 */
    S.lj.round = 0; const ex = map.exits['6,10'];
    return say(null, ['你被一掌震下了论剑台……', '（论剑输了不丢东西，养好伤再来）'], () => { P.dead = false; S.hp = Math.ceil(maxHP() * 0.6); S.st = maxST(); enterMap('huashan', ex.x, ex.y, 'down'); save(); });
  }
  const lost = Math.floor(S.silver * 0.2); S.silver -= lost;
  if (lost) toast('身上的银子丢了些。存进钱庄就不会丢');
  say(null, [headHit ? '头部受了重击，你眼前一黑……' : '你力竭倒地，昏了过去……', `醒来时，已躺在客栈的床上。${lost ? `（丢了 ${lost} 两银子）` : ''}`], () => {
    P.dead = false; S.hp = Math.ceil(maxHP() * 0.6); S.st = maxST();
    for (const k of ['head', 'arm', 'leg']) S.parts[k] = Math.max(S.parts[k], Math.ceil(maxPart() * 0.5));
    enterMap('village', 13, 12, 'down'); save();
  });
}

