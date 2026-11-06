/* ---------------- state ---------------- */
const SAVE_KEY = 'jianghu-shaonian-gb-v1';
const AGE_FRAMES = 60 * 180;
/* 30 岁前每 3 分钟一岁，30～40 岁每 6 分钟，40 岁以后每 10 分钟 */
const ageFrames = a => 60 * (a < 30 ? 180 : a < 40 ? 360 : 600);
const ageQi = a => (a <= 40 ? (a - 16) * 3 : 72 + (a - 40));
const HUD_H = 24;
let S = null, mode = 'title', map = null, enemies = [], npcs = [], fx = [], toasts = [], dlg = null, menu = null;
let hitStop = 0, sparks = [];
let frame = 0, shake = 0, cam = { x: 0, y: 0 }, lastFight = -999, saveTimer = 0, titleSel = 0, banner = null;
const P = { target: null, tx: 0, ty: 0, px: 0, py: 0, dir: 'down', moving: false, atkT: 0, atkMax: 1, atkCD: 0, hurtT: 0, sit: false, dead: false };

function newState() {
  return { map: 'village', x: 19, y: 13, grown: 1, dir: 'down', hp: 60, mp: 20, silver: 20, age: 16, ageT: 0,
    skills: { changquan: 0, tiebushan: 0, caoshangfei: 0 }, active: 'changquan', pref: {},
    passive: { 护体: 'tiebushan', 步法: 'caoshangfei', 心法: null },
    items: { yao: 2 }, gear: ['buyi'], equip: { weapon: null, body: 'buyi', head: null },
    name: '无名少侠', showTag: true, stask: null, gifts: {},
    parts: null, q: { main: 0, cnt: 0 }, side: {}, sect: null, former: [], zheng: 0, xie: 0, rep: 0, srep: {}, hunted: {}, purge: null, cq: null, tut: 0, heard: [], found: [], buffs: {}, lilian: 0, llDone: [], llCur: null, llCnt: 0, flags: {}, kidTip: 0, bank: 0, bounty: null, v: 3 };
}
function migrate(s) {
  if (s.tut === undefined) s.tut = 99;  // 老存档不再教学
  if (!s.equip) s.equip = { weapon: s.sword ? 'tiejian' : null, body: 'buyi', head: null };
  if (!s.gear) s.gear = ['buyi'].concat(s.sword ? ['tiejian'] : []);
  delete s.sword;
  if (!s.v || s.v < 3) {
    if (s.skills.tiebushan == null) s.skills.tiebushan = 0;
    if (s.skills.caoshangfei == null) s.skills.caoshangfei = 0;
    s.passive = { 护体: 'tiebushan', 步法: s.skills.shenxing != null ? 'shenxing' : 'caoshangfei', 心法: s.skills.quanzhen != null ? 'quanzhen' : null };
    s.pref = {};
    const st = s.quest ? s.quest.stage : 0;
    s.q = st === 0 ? { main: 0, cnt: 0 } : st === 1 ? { main: 2, cnt: s.quest.wolves || 0 } : st === 2 ? { main: 3, cnt: 0 } : { main: 4, cnt: 0 };
    delete s.quest;
    s.side = {}; s.sect = null; s.parts = null;
    if (s.map === 'village') { s.x = 11; s.y = 7; }
  }
  if (!s.grown) {   /* 牛家村、襄阳放大以前的存档：人站的位置跟着挪 */
    const g = GROWN[s.map]; if (g) { s.x += g[0]; s.y += g[1]; }
    s.grown = 1;
  }
  if (s.bank == null) s.bank = 0;
  if (!s.former) s.former = [];
  if (!s.name) s.name = '无名少侠';
  if (s.showTag == null) s.showTag = true;
  if (s.stask === undefined) s.stask = null;
  if (!s.gifts) s.gifts = {};
  for (const [k, v] of [['zheng', 0], ['xie', 0], ['rep', 0], ['lilian', 0], ['llCnt', 0]]) if (s[k] == null) s[k] = v;
  if (!s.srep) s.srep = {}; if (!s.heard) s.heard = []; if (!s.found) s.found = []; if (!s.buffs) s.buffs = {}; if (!s.hunted) s.hunted = {}; if (!s.llDone) s.llDone = [];
  if (s.purge === undefined) s.purge = null; if (s.llCur === undefined) s.llCur = null;
  if (s.bounty === undefined) s.bounty = null;
  s.items = s.items || {};
  for (const k of Object.keys(s.items)) if (!ITEMS[k]) delete s.items[k];
  for (const k in ITEMS) if (s.items[k] == null) s.items[k] = 0;
  for (const k of Object.keys(s.skills)) if (!SK[k]) delete s.skills[k];
  s.v = 3;
  return s;
}
function fixState() {
  if (!S.parts) S.parts = { head: maxPart(), arm: maxPart(), leg: maxPart() };
  if (S.st == null) S.st = maxST();
  for (const c of ['护体', '步法', '心法']) if (S.passive[c] && S.skills[S.passive[c]] == null) S.passive[c] = null;
  ensureActive(true);
}

const lv = id => (id && S.skills[id]) || 0;
const weapon = () => (S.equip.weapon ? EQ[S.equip.weapon] : null);
const wcat = () => (weapon() ? weapon().type : '拳');
const gearSum = k => ['weapon', 'body', 'head'].reduce((a, sl) => a + ((S.equip[sl] && EQ[S.equip[sl]][k]) || 0), 0);
/* 被动武功的效果 = 等级 × 该项评级 */
const pv = (cat, key, i) => { const id = S.passive[cat]; if (!id || S.skills[id] == null) return 0; const r = SK[id][key]; return S.skills[id] * RV[i == null ? r : r[i]]; };
const maxedCount = () => Object.keys(S.skills).filter(k => S.skills[k] >= 99.99).length;
const qi = () => Math.floor(ageQi(S.age) + pv('心法', 'yq') * 0.4 + maxedCount() * 10 + (S.lilian || 0) / 2);
const maxHP = () => Math.floor(60 + qi() * 1.5 + pv('心法', 'hp') * 0.4);
const maxMP = () => Math.floor(20 + pv('心法', 'mp') * 1.2 + gearSum('mp'));
/* 体力：每招都耗，歇一歇或打坐就回来；基础以外的武功还要再耗内功 */
const maxST = () => Math.floor(50 + qi() * 0.6 + pv('心法', 'hp') * 0.3);
const ST_COST = { 拳: 1, 剑: 2, 刀: 2, 枪: 2, 槌: 3 };
const maxPart = () => 40 + Math.floor(qi() / 2);
const defense = i => ['body', 'head'].reduce((a, sl) => a + ((S.equip[sl] && EQ[S.equip[sl]].def[i]) || 0), 0);
const atkSk = () => SK[S.active];
const injured = p => S.parts[p] / maxPart() < 0.3;
const playerLook = () => ({ body: S.equip.body || 'buyi', hat: S.equip.head, weapon: S.equip.weapon, hair: 'knot' });
const bestAtk = () => Math.max(...ATK_CATS.map(c => lv(BASIC_OF[c])));
const PART_NAME = { head: '头', arm: '臂', leg: '腿' };
const PART_MSG = { head: '头部重伤！出招容易落空', arm: '手臂重伤！出手无力', leg: '腿部重伤！走不快了' };

function learn(id, quiet) {
  if (S.skills[id] != null) return false;
  S.skills[id] = 0;
  if (!quiet) { toast(`学会 ${SK[id].name}`); sfx('level'); }
  const c = SK[id].cat;
  if (['护体', '步法', '心法'].includes(c) && (!S.passive[c] || SK[id].tier >= SK[S.passive[c]].tier)) S.passive[c] = id;
  return true;
}
function ensureActive(quiet) {
  const c = wcat(), basic = BASIC_OF[c];
  if (S.skills[basic] == null) { S.skills[basic] = 0; if (!quiet) { toast(`初学 ${SK[basic].name}`); sfx('level'); } }
  if (S.skills[S.active] != null && SK[S.active].cat === c) return;
  const pref = S.pref[c];
  S.active = pref && S.skills[pref] != null ? pref : basic;
}
function equipItem(id) {
  const it = EQ[id]; S.equip[it.slot] = id;
  ensureActive();
  toast(`装备 ${it.name}`); sfx('menu');
}
/* 服药：药力在几秒内慢慢发作。同一样（活力/内功/体力/伤势）上药力还没散，就吃不下药力更弱的 */
const DOSE_NAME = { hp: '活力', mp: '内功', st: '体力', parts: '伤势' };
function dose(name, eff) {
  if (!S.buffs) S.buffs = {};
  const full = { hp: () => S.hp >= maxHP(), mp: () => S.mp >= maxMP(), st: () => S.st >= maxST(), parts: () => ['head', 'arm', 'leg'].every(k => S.parts[k] >= maxPart()) };
  const keys = Object.keys(eff);
  if (keys.every(k => full[k]())) { toast(`${keys.map(k => DOSE_NAME[k]).join('、')}已满`); return false; }
  if (keys.every(k => S.buffs[k] && S.buffs[k].t > 0 && S.buffs[k].r >= eff[k][0])) { toast('上一服药力还没散'); return false; }
  for (const k of keys) { const [r, sec] = eff[k]; const b = S.buffs[k]; if (!b || b.t <= 0 || b.r <= r) S.buffs[k] = { r, t: sec * 60 }; }
  toast(`${name}药力慢慢发作`); sfx('coin'); return true;
}
function tickBuffs() {
  if (!S.buffs) return;
  for (const k in S.buffs) {
    const b = S.buffs[k]; if (!b || b.t <= 0) { delete S.buffs[k]; continue; }
    b.t--; const v = b.r / 60;
    if (k === 'hp') S.hp = Math.min(maxHP(), S.hp + v);
    else if (k === 'mp') S.mp = Math.min(maxMP(), S.mp + v);
    else if (k === 'st') S.st = Math.min(maxST(), S.st + v);
    else for (const q of ['head', 'arm', 'leg']) S.parts[q] = Math.min(maxPart(), S.parts[q] + v);
  }
}
function heal(kind, n) {
  if (kind === 'hp') { if (S.hp >= maxHP()) { toast('活力已满'); return false; } S.hp = Math.min(maxHP(), S.hp + n); toast(`活力 +${n}`); }
  else if (kind === 'st') { if (S.st >= maxST()) { toast('体力已满'); return false; } S.st = Math.min(maxST(), S.st + n); toast(`体力 +${n}`); }
  else if (kind === 'mp') { if (S.mp >= maxMP()) { toast('内功已满'); return false; } S.mp = Math.min(maxMP(), S.mp + n); toast(`内功 +${n}`); }
  else {
    if (['head', 'arm', 'leg'].every(k => S.parts[k] >= maxPart())) { toast('身上没有伤'); return false; }
    for (const k of ['head', 'arm', 'leg']) S.parts[k] = Math.min(maxPart(), S.parts[k] + n);
    toast('伤势好转');
  }
  sfx('coin'); return true;
}
function gainItem(k, n = 1) { S.items[k] = (S.items[k] || 0) + n; toast(`得到 ${ITEMS[k].name}${n > 1 ? '×' + n : ''}`); }

function hasSave() { try { return !!localStorage.getItem(SAVE_KEY); } catch (e) { return false; } }
function save(quiet = true) {
  if (!S) return;
  S.x = P.tx; S.y = P.ty; S.dir = P.dir; S.map = map ? map.id : S.map;
  if (NET.online) { NET.dirty = true; if (!quiet) { netSaveNow(); toast('进度已存到服务器'); } return; }
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); if (!quiet) toast('进度已保存'); } catch (e) { if (!quiet) toast('无法保存（浏览器禁止存储）'); }
}
function loadSave() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); return s && s.skills ? s : null; } catch (e) { return null; } }

function toast(t) { toasts.push({ text: t, t: 150 }); if (toasts.length > 4) toasts.shift(); if (typeof chatPush === 'function' && !chatBar.hidden) chatPush('系统', null, t); }
function floatText(wx, wy, text, big) { fx.push({ x: wx, y: wy, text, t: 45, big }); }

/* 成长曲线（适中）：每次有效出招约 +0.04，越往上越慢。约 12 分钟到 10 级，4 小时到 50 级，十几小时练满 */
/* 叛出的门派，武功最多练到 49.99，练不出第二式 */
const isFormer = id => !!(SK[id] && SK[id].sect && S.former.includes(SK[id].sect));
const skillCap = id => (isFormer(id) ? 49.99 : 99.99);
function train(id, amt) {
  if (!id || S.skills[id] == null || !(amt > 0)) return;
  const v = S.skills[id], cap = skillCap(id);
  if (v >= cap) return;
  const gain = 0.04 * amt * (SK[id].tier === 2 ? 0.7 : 1) / Math.pow(1 + v / 10, 1.5) * FASTT(SK[id].cat === '心法' ? 80 : ['护体', '步法'].includes(SK[id].cat) ? 30 : 15);
  const nv = Math.min(cap, v + gain * (S.coach > 0 ? 2 : 1));   /* 武馆陪练期间经验翻倍 */
  S.skills[id] = nv;
  if (nv >= 99.99 && cap === 99.99) { toast(`${SK[id].name}练至化境，元气 +10`); sfx('level'); }
  if (Math.floor(nv) > Math.floor(v)) {
    toast(`${SK[id].name} 精进至 ${Math.floor(nv)} 级`); sfx('level');
    const cross = n => v < n && nv >= n;
    if (ATK_CATS.includes(SK[id].cat) && cross(50)) { toast(`${SK[id].name}练成第二式「${SK[id].move}」`); floatText(P.px + 8, P.py - 10, SK[id].move + '！', true); }
    if (SK[id].tier === 1 && ATK_CATS.includes(SK[id].cat) && cross(5) && S.skills.quanzhen == null) toast('清虚道长似乎有话对你说');
    /* 只提醒你真能去学的：本门派的武功，或行囊里有秘籍的；别的门派的武功不提，免得满屏提示 */
    const ready = Object.keys(SK).filter(k => { const r = SK[k].req; return r && r[0] === id && cross(r[1]) && S.skills[k] == null &&
      ((SK[k].sect && SK[k].sect === S.sect) || Object.entries(ITEMS).some(([b, it]) => it.book === k && S.items[b])); });
    if (ready.length) toast(`已达到修习${ready.map(k => SK[k].name).join('、')}的门槛`);
  }
}
/* 打比自己弱太多的对手长进很少，打强敌长进更快 */
function trainFactor(v, d) {
  if (d.dummy) {
    if (v >= 30) { if (!P.dummyWarned) { toast('木人桩已经练不出东西了，去野外吧'); P.dummyWarned = true; } return 0; }
    return 0.5;
  }
  const rel = v - d.lv;
  return rel > 30 ? 0.2 : rel > 15 ? 0.5 : rel < -10 ? 1.3 : 1;
}

