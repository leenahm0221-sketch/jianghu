/* ---------------- 室内：每座有门的房子都能走进去 ----------------
   房子正门那一格变成门口（只有人能走），走进去就到这座房子的室内小地图；
   室内最下面一排正中是门，走出去回到门口外面。
   店铺、客栈、药铺这些房子的主人搬进屋里，站在柜台后面；门派大殿的掌门站在供桌前。 */
/* 牛家村、襄阳放大后，原来那些人跟着挪过去 */
for (const [id, [ox, oy]] of Object.entries(GROWN)) for (const n of NPCS[id] || []) { n.x += ox; n.y += oy; }
/* 扬州、洛阳各把一间民居改成赌坊 */
const CASINO_AT = { yangzhou: 24, luoyang: 31 };
for (const [town, bi] of Object.entries(CASINO_AT)) { const b = MAPS[town] && MAPS[town].buildings[bi]; if (b && ['house', 'home'].includes(b.kind)) { b.kind = 'casino'; b.label = '赌坊'; } }
const IN_SIZE = {
  casino: [15, 10],
  house: [9, 7], home: [9, 7], chief: [9, 7],
  smith: [11, 8], pharmacy: [11, 8], pawn: [11, 8], bank: [11, 8], cloth: [11, 8],
  inn: [13, 8], tavern: [13, 9],
  temple: [11, 9], tower: [11, 9], nunnery: [13, 9], library: [13, 9], school: [13, 9], escort: [13, 9], hall: [15, 10],
};
const IN_SHOP = new Set(['smith', 'pharmacy', 'pawn', 'bank', 'cloth', 'inn', 'tavern']);
const IN_HOME = new Set(['house', 'home', 'chief']);
const IN_NAME = { house: '民居', home: '民居', chief: '村长家', casino: '赌坊' };
function makeInterior(ext, b) {
  const [W, H] = IN_SIZE[b.kind], mid = Math.floor(W / 2), k = b.kind;
  const g = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (y < 2 || x === 0 || x === W - 1 || y === H - 1 ? 'Y' : 'L')));
  const set = (x, y, c) => { if (x > 0 && x < W - 1 && y > 1 && y < H - 1) g[y][x] = c; };
  g[H - 1][mid] = 'E';
  const spots = [];
  if (IN_SHOP.has(k)) {
    /* 店铺：后墙一排货架，中间一道柜台，掌柜站在柜台后面 */
    for (let x = 1; x < W - 1; x++) set(x, 2, 'h');
    for (let x = mid - 2; x <= mid + 2; x++) set(x, 4, 'n');
    spots.push([mid, 3], [mid - 1, 3], [mid + 1, 3]);
    if (k === 'inn') { set(1, 3, 'b'); set(1, 5, 'b'); set(W - 2, 3, 'b'); set(W - 2, 5, 'b'); }
    if (k === 'tavern') { set(2, 5, 't'); set(W - 3, 5, 't'); set(2, 7, 't'); set(W - 3, 7, 't'); }
    if (k === 'inn') set(3, 6, 't');
  } else if (k === 'casino') {
    /* 赌坊：后墙一道柜台（掌柜兑钱），中间三张赌桌：左骰宝、中牌九、右番摊，庄家站在桌子后面 */
    for (let x = mid - 1; x <= mid + 1; x++) set(x, 3, 'n');
    for (const x of [1, 2, W - 3, W - 2]) set(x, 2, 'h');
    for (const x of [2, 3, mid - 1, mid, mid + 1, W - 4, W - 3]) set(x, 6, 't');
    spots.push([mid, 2]);
  } else if (IN_HOME.has(k)) {
    /* 民居：床、桌子、柜子，角落里有个旧木箱 */
    set(1, 2, 'b'); set(W - 2, 2, 'h'); set(W - 3, 2, 'h'); set(W - 3, 4, 't');
    if (k !== 'chief') set(1, 4, 'X');
    spots.push([mid, 3], [mid - 2, 3]);
  } else {
    /* 庙宇、大殿：正面供桌（庙里有神像），两排柱子，中间一条红地毯通到门口 */
    if (k === 'school' || k === 'escort') for (let x = 1; x < W - 1; x++) set(x, 2, 'h');
    else for (let x = mid - 1; x <= mid + 1; x++) set(x, 2, 'a');
    for (let y = 3; y < H - 1; y++) set(mid, y, 'u');
    for (const y of [3, H - 3]) { set(2, y, 'p'); set(W - 3, y, 'p'); }
    if (k === 'library') for (const y of [4, 6]) for (const x of [1, 3, W - 4, W - 2]) set(x, y, 'h');
    spots.push([mid, 3], [mid - 2, 4], [mid + 2, 4], [mid - 2, 6], [mid + 2, 6]);
  }
  return { name: `${ext.name}·${b.label || IN_NAME[k] || '屋里'}`, rows: g.map(r => r.join('')), buildings: [], spawns: [], signs: {}, ground: 'indoor', indoor: true, ikind: k, spots, doorX: mid };
}
for (const extId of Object.keys(MAPS)) {
  const ext = MAPS[extId];
  if (ext.indoor) continue;
  /* 房子占的地方一律是墙，只留正门一格：不会有路从房子中间穿过去，也就不能从后面、侧面走进门 */
  for (const b of ext.buildings || []) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++)
    if (ext.rows[y] && ext.rows[y][x] !== 'H') ext.rows[y] = ext.rows[y].slice(0, x) + 'H' + ext.rows[y].slice(x + 1);
  (ext.buildings || []).forEach((b, i) => {
    if (!IN_SIZE[b.kind] || b.style === 'pagoda') return;
    const dx = b.x + Math.floor(b.w / 2), dy = b.y + b.h - 1;
    if (dy + 1 >= ext.h || SOLID.has(ext.rows[dy + 1][dx])) return;   /* 门口外面走不到的不开门 */
    const id = `${extId}~${i}`, m = makeInterior(ext, b);
    m.id = id; m.w = m.rows[0].length; m.h = m.rows.length; m.doors = {};
    m.exits = { [`${m.doorX},${m.h - 1}`]: { map: extId, x: dx, y: dy + 1, dir: 'down' } };
    MAPS[id] = m;
    ext.rows[dy] = ext.rows[dy].slice(0, dx) + 'E' + ext.rows[dy].slice(dx + 1);
    ext.exits[`${dx},${dy}`] = { map: id, x: m.doorX, y: m.h - 2, dir: 'up' };
    b.inside = id;
    /* 房子主人（和门派大殿门口的本派弟子）搬进屋里 */
    const list = NPCS[extId] || [], sectNames = new Set(Object.values(SECTS).map(s => s.name));
    const movers = list.filter(n => n.id === b.owner || (['hall', 'nunnery', 'temple'].includes(b.kind) && sectNames.has(n.role) && Math.abs(n.x - dx) <= 3 && n.y >= dy - 1 && n.y <= dy + 2));
    movers.sort((a, c) => (c.id === b.owner) - (a.id === b.owner) || !!c.icon - !!a.icon);
    movers.forEach((n, j) => {
      const sp = m.spots[j]; if (!sp) return;
      list.splice(list.indexOf(n), 1);
      n.x = sp[0]; n.y = sp[1]; n.dir = 'down';
      (NPCS[id] || (NPCS[id] = [])).push(n);
    });
  });
}
/* ---- 屋里的闲人：伙计、客人、香客、弟子……每间屋子两到四个，会在屋里慢慢走动，按 A 能搭话 ---- */
const IN_FOLK = {
  inn: [['店小二', { body: 'apron', hair: 'cap' }, ['客官里边请！楼上客房干净着呢。', '住一晚活力、内功、伤势全养好，五两银子，划算！']],
    ['住店客人', { body: 'changpao', hair: 'fangjin' }, ['明早还得赶路，今晚早点歇着。', '听说城外的山贼最近又闹起来了。']],
    ['赶路镖师', { body: 'jinzhuang', hair: 'band', weapon: 'gangdao' }, ['这趟镖走完，能歇上半个月。', '走镖靠的是名头，名头靠的是刀。']]],
  tavern: [['店小二', { body: 'apron', hair: 'cap' }, ['好嘞——两斤牛肉一壶酒！', '客官要点什么？本店的女儿红远近闻名。']],
    ['醉酒客', { body: 'buyi', hair: 'messy' }, ['（打了个酒嗝）再……再来一壶！', '想当年老子也是一条好汉……']],
    ['说书先生', { body: 'changpao', hair: 'fangjin', beard: true }, ['话说那华山之巅，两大高手比剑三天三夜……', '欲知后事如何，且听下回分解！']],
    ['江湖客', { body: 'heipao', hair: 'knot', weapon: 'tiejian' }, ['喝完这杯，我要去黑木崖碰碰运气。', '有人说东方不败练成了绝世武功，谁信？']]],
  smith: [['打铁学徒', { body: 'vest', hair: 'band' }, ['师父打铁，我拉风箱，一天下来胳膊都抬不起来。', '好铁要千锤百炼，精铁矿里出的料子最好。']],
    ['买刀的江湖客', { body: 'jinzhuang', hair: 'knot' }, ['这把刀太轻，有没有沉一点的？', '听说寒铁打的兵器削铁如泥。']]],
  pharmacy: [['药童', { body: 'buyi', hair: 'bun' }, ['抓药请到柜台，我只管碾药。', '三七止血、灵芝补气，师父说的。']],
    ['看病的老汉', { body: 'buyi', hair: 'knot', beard: true }, ['（咳嗽）老毛病了，开几服药就好。', '年轻人，练武也要爱惜身子。']]],
  pawn: [['伙计', { body: 'apron', hair: 'cap' }, ['当东西请找朝奉。', '死当活当，价钱可不一样。']],
    ['落魄书生', { body: 'changpao', hair: 'fangjin' }, ['这块玉佩是家传的……唉，先当了吧。']]],
  bank: [['账房先生', { body: 'changpao', hair: 'fangjin' }, ['（噼里啪啦打着算盘）别吵，算错了要赔的。']],
    ['富商', { body: 'heipao', hair: 'crown', beard: true }, ['存银子还是钱庄稳妥，路上山贼太多。']]],
  cloth: [['绣娘', { body: 'buyi', hair: 'bun' }, ['这匹绸子要绣一对鸳鸯，得绣三天。']],
    ['挑布的夫人', { body: 'changpao', hair: 'bun' }, ['这花色好看，就是贵了点。']]],
  chief: [['村长夫人', { body: 'buyi', hair: 'bun' }, ['老头子整天操心村里的事，饭都顾不上吃。', '孩子，路上小心，多带几服药。']],
    ['小孙子', { body: 'buyi', hair: 'knot' }, ['爷爷说等我长大了，也送我去学武！']]],
  house: [['屋主', { body: 'buyi', hair: 'knot' }, ['家里简陋，别嫌弃。', '最近夜里总听见狼叫，门得关紧。']],
    ['老婆婆', { body: 'buyi', hair: 'bun' }, ['年轻人，吃了饭再走吧。']]],
  home: [['屋主', { body: 'changpao', hair: 'fangjin' }, ['寒舍简陋，让大侠见笑了。']],
    ['小丫头', { body: 'buyi', hair: 'bun' }, ['你是江湖上的大侠吗？会飞吗？']]],
  temple: [['香客', { body: 'changpao', hair: 'bun' }, ['求菩萨保佑我家孩儿平平安安。']],
    ['上香的老汉', { body: 'buyi', hair: 'knot', beard: true }, ['每月初一十五，都要来上一炷香。']],
    ['扫地僧', { body: 'sengyi', hair: 'bald' }, ['（他扫着地，头也不抬）施主请自便。']]],
  tower: [['守塔人', { body: 'buyi', hair: 'knot' }, ['这塔几百年了，风吹雨打都没倒。']]],
  library: [['抄经僧', { body: 'sengyi', hair: 'bald' }, ['藏经阁里的经书，不得带出阁外。', '阿弥陀佛，这一卷我抄了三年。']],
    ['借书的书生', { body: 'changpao', hair: 'fangjin' }, ['听说这里有失传的武学典籍……我只是看看。']]],
  school: [['练功弟子', { body: 'jinzhuang', hair: 'band' }, ['马步扎稳，拳才打得出劲！', '教头说基础武功最要紧，我已经练了三年了。']],
    ['新来的学徒', { body: 'buyi', hair: 'knot' }, ['我爹让我来学两手，好不受人欺负。']]],
  escort: [['镖师', { body: 'jinzhuang', hair: 'band', weapon: 'gangdao' }, ['镖旗一插，黑白两道都要给几分面子。']],
    ['趟子手', { body: 'vest', hair: 'band' }, ['合——吾——！走镖的时候喊这一嗓子，山贼就知道是谁家的镖。']]],
  nunnery: [['小尼姑', { body: 'nun', hair: 'hood' }, ['施主，佛门清净之地，请勿喧哗。']]],
  casino: [['赌客', { body: 'buyi', hair: 'messy' }, ['（满头大汗）这把一定是大！一定是大！', '输光了……回家怎么跟婆娘交代。']],
    ['看热闹的', { body: 'changpao', hair: 'fangjin' }, ['小赌怡情，大赌伤身。我就看看，不下注。', '这赌坊每天输赢都有个数，输多了会被请出去。']],
    ['阔少', { body: 'heipao', hair: 'crown' }, ['（把银子往桌上一拍）全押！', '本少爷不差钱，就图个乐子。']]],
  hall: [['守殿弟子', null, ['大殿之内，不得动武。', '掌门在上，有事请上前禀报。']],
    ['值守弟子', null, ['今日轮到我守殿，一站就是一整天。']],
    ['扫地弟子', null, ['师兄们都去练功了，就剩我扫地。']]],
};
function folkLook(ext, b, look) {
  if (look) return look;
  /* 大殿弟子穿本门派的衣服 */
  const master = (NPCS[b.inside] || [])[0], sect = master && Object.keys(SECTS).find(k => SECTS[k].name === master.role);
  return { body: sect ? SECTS[sect].uniform : 'jinzhuang', hair: 'band' };
}
for (const id of Object.keys(MAPS)) {
  const m = MAPS[id]; if (!m.indoor) continue;
  const extId = id.split('~')[0], b = MAPS[extId].buildings[+id.split('~')[1]];
  const pool = IN_FOLK[m.ikind] || []; if (!pool.length) continue;
  const taken = new Set((NPCS[id] || []).map(n => n.x + ',' + n.y));
  /* 能站人的地方：地板或地毯，不在门口那一列的下半截，不贴着柜台前面（别挡路） */
  const free = [];
  for (let y = 3; y < m.h - 1; y++) for (let x = 1; x < m.w - 1; x++) {
    const c = m.rows[y][x];
    if (c !== 'L') continue;
    if (x === m.doorX && y >= m.h - 3) continue;
    if (m.rows[y - 1][x] === 'n' && Math.abs(x - m.doorX) <= 1) continue;
    if (taken.has(x + ',' + y)) continue;
    if (IN_SHOP.has(m.ikind) && y <= 4) continue;   /* 店里的人站在柜台外面 */
    if (m.ikind === 'casino' && y <= 5) continue;   /* 赌坊：桌子后面是庄家的位置 */
    free.push([x, y]);
  }
  const hs0 = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const n0 = Math.min(pool.length, IN_HOME.has(m.ikind) ? 2 : pool.length);
  for (let j = 0; j < n0 && free.length; j++) {
    const [name, look, lines] = pool[j], sp = free.splice((hs0 + j * 7) % free.length, 1)[0];
    const n = { id: `${id}_f${j}`, name, role: '', x: sp[0], y: sp[1], home: { x: sp[0], y: sp[1] }, dir: 'down', amb: true,
      look: folkLook(MAPS[extId], b, look), talk: me => folkTalk(me, name, lines) };
    (NPCS[id] || (NPCS[id] = [])).push(n);
  }
}
/* ---- 闲人的用处：有的会讲江湖消息，有的托你办点小事（每个角色每人只托一次） ----
   need：要交的东西；kill：要打的怪；give：一次性送你东西；reward：办完的谢礼 */
const FOLK_TASK = {
  '看病的老汉': { ask: '老毛病又犯了，郎中说缺几株草药。你能帮我采 3 株来吗？', need: { caoyao: 3 }, reward: { silver: 40, items: { yao: 2 }, rep: 3 }, thanks: '好孩子，这药钱你拿着，金创药也带上。' },
  '药童': { ask: '师父要炼一炉回气丹，缺一朵灵芝。你在野外见了能捎一朵吗？', need: { lingzhi: 1 }, reward: { silver: 50, items: { qidan: 2 }, rep: 3 }, thanks: '太好了！这两颗回气丹是师父让我给你的。' },
  '打铁学徒': { ask: '师父让我攒料，我力气小挖不动矿。你能给我 3 块生铁吗？', need: { shengtie: 3 }, reward: { silver: 20, items: { jingtie: 1 }, rep: 2 }, thanks: '多谢！这块精铁是我偷偷攒下的，给你。' },
  '绣娘': { ask: '绣线快用完了，你能帮我摘 3 朵棉花吗？', need: { mianhua: 3 }, reward: { silver: 40, rep: 3 }, thanks: '多谢大侠，这些银子你收下。' },
  '小丫头': { ask: '我想要个布娃娃……你能给我 2 朵棉花吗？', need: { mianhua: 2 }, reward: { items: { qidan: 1 }, rep: 5 }, thanks: '谢谢大侠！这颗糖……不对，是爹爹的回气丹，送你！' },
  '住店客人': { ask: '我想给娘子做件狐裘，城外的狐狸太狡猾，你能弄 2 张狐皮来吗？', need: { hulipi: 2 }, reward: { silver: 60, rep: 3 }, thanks: '有劳有劳，这六十两是谢礼。' },
  '老婆婆': { ask: '夜里狼叫得我睡不着。你能去伏牛山脚打 3 只野狼吗？', kill: { kind: 'wolf', n: 3 }, reward: { silver: 60, items: { yao: 3 }, rep: 5 }, thanks: '这下能睡个安稳觉了。这些伤药你带着。' },
  '屋主': { ask: '兔儿坡的野兔把我家菜地啃光了，帮我打 5 只吧？', kill: { kind: 'rabbit', n: 5 }, reward: { silver: 30, items: { yao: 2 }, rep: 3 }, thanks: '多谢多谢！一点心意，别嫌少。' },
  '赶路镖师': { ask: '前面的路上山贼拦道，你能先去伏牛山脚收拾 3 个山贼吗？', kill: { kind: 'bandit', n: 3 }, reward: { silver: 100, rep: 6 }, thanks: '好身手！这一百两是镖局的谢礼。' },
  '镖师': { ask: '蜀道上的山匪劫了我们一趟镖。你若能打掉 3 个山匪，镖局重谢。', kill: { kind: 'shanfei', n: 3 }, reward: { silver: 200, rep: 8 }, thanks: '痛快！总镖头让我把这两百两交给你。' },
  '富商': { ask: '我的货在大漠被沙匪劫了，替我教训 3 个沙匪，银子少不了你的。', kill: { kind: 'shafei', n: 3 }, reward: { silver: 300, rep: 8 }, thanks: '果然是少年英雄！三百两，收好。' },
  '村长夫人': { give: { yao: 3 }, gift: '孩子，出门在外别亏着自己。这三服金创药你带上。' },
  '练功弟子': { train: true, gift: '来，陪我过两招！（你们拆了几十招，你对手上的武功又多了几分体会）' },
};
/* 讲消息的人 */
const FOLK_INFO = {
  '说书先生': me => { const ks = Object.keys(VILLAIN_WHERE), k = ks[(me.said || 0) % ks.length]; me.said = (me.said || 0) + 1;
    const sk = Object.values(SK).find(s => s.villain === k);
    return ['（醒木一拍）', `话说那${EN[k].name}，盘踞在${VILLAIN_WHERE[k]}，武功深不可测。`, sk ? `据说谁要是打败了他，就有机会得到${sk.name}的秘籍！` : '江湖上谁不惧他三分。', '欲知后事如何，且听下回分解！']; },
  '醉酒客': me => { const ks = Object.keys(HERMITS), h = HERMITS[ks[(me.said || 0) % ks.length]]; me.said = (me.said || 0) + 1;
    return ['（他醉眼朦胧地凑过来）嘿，我跟你说个秘密……', `${h.where}有个怪人，叫什么${h.name}……一身的绝学${SK[h.skill].name}。`, '要是能入他的眼，嗝……说不定肯传你两手。']; },
  '江湖客': me => { me.said = (me.said || 0) + 1; return null; },   /* 交给门派见闻（传闻） */
};
function folkTalk(me, name, lines) {
  const fk = S.folk || (S.folk = {}), t = FOLK_TASK[name], st = fk[me.id] || {};
  if (name === '江湖客') return tellRumor(name);
  if (FOLK_INFO[name]) return say(name, FOLK_INFO[name](me));
  if (t && !st.done) {
    if (t.give) { st.done = true; fk[me.id] = st; for (const k in t.give) S.items[k] = (S.items[k] || 0) + t.give[k]; sfx('coin'); save(); return say(name, t.gift); }
    if (t.train) { st.done = true; fk[me.id] = st; const a = S.active; if (a) S.skills[a] = Math.min(skillCap(a), S.skills[a] + 1); sfx('level'); save(); return say(name, [t.gift, `（${SK[a].name} +1.00）`]); }
    if (!st.on) return ask(name, t.ask, ['帮这个忙', '下次吧'], i => { if (i === 0) { st.on = true; st.cnt = 0; fk[me.id] = st; save(); toast(`接受：${name}的委托`); } });
    const ok = t.need ? Object.entries(t.need).every(([k, n]) => (S.items[k] || 0) >= n) : st.cnt >= t.kill.n;
    if (!ok) return say(name, t.need ? `还差一些：${Object.entries(t.need).map(([k, n]) => `${ITEMS[k].name} ${S.items[k] || 0}/${n}`).join('、')}。` : `${EN[t.kill.kind].name}打了 ${st.cnt}/${t.kill.n} 只，还差一点。`);
    if (t.need) for (const k in t.need) S.items[k] -= t.need[k];
    const r = t.reward; S.silver += r.silver || 0; for (const k in r.items || {}) S.items[k] = (S.items[k] || 0) + r.items[k];
    if (r.rep) addRep(r.rep);
    st.done = true; st.on = false; fk[me.id] = st; sfx('level'); save();
    const got = [r.silver ? `银两 ${r.silver}` : '', ...Object.entries(r.items || {}).map(([k, n]) => `${ITEMS[k].name}×${n}`)].filter(Boolean).join('、');
    return say(name, [t.thanks, `（得到 ${got}${r.rep ? `，江湖声望 +${r.rep}` : ''}）`]);
  }
  say(name, lines[(me.said = ((me.said || 0) + 1)) % lines.length]);
}
/* 闲人头上的标记：有事托你 !，办好了回来交 ? */
function folkMark(n) {
  const t = FOLK_TASK[n.name]; if (!t || !S) return FOLK_INFO[n.name] ? '…' : null;
  const st = (S.folk || {})[n.id] || {};
  if (st.done) return null;
  if (!st.on) return '!';
  return (t.need ? Object.entries(t.need).every(([k, c]) => (S.items[k] || 0) >= c) : st.cnt >= t.kill.n) ? '?' : null;
}
/* 打怪时给接了委托的人计数 */
function folkKill(kind) {
  const fk = S.folk || {};
  for (const id in fk) {
    const st = fk[id]; if (!st.on) continue;
    const name = id.includes('_f') ? folkName(id) : null, t = name && FOLK_TASK[name];
    if (t && t.kill && t.kill.kind === kind && st.cnt < t.kill.n) { st.cnt++; toast(st.cnt >= t.kill.n ? `${name}的委托完成，回去找他` : `${name}的委托 ${EN[kind].name} ${st.cnt}/${t.kill.n}`); }
  }
}
function folkName(id) { const m = id.split('_f')[0]; const n = (NPCS[m] || []).find(x => x.id === id); return n ? n.name : null; }
/* ---- 地窖：每座城镇挑一两间屋子，墙角有块活板，掀开下去是地窖。地窖里有贼、酒坛、木箱 ---- */
const CELLAR_TOWNS = { village: 'xiaozei', xiangyang: 'xiaozei', luoyang: 'feizei', yangzhou: 'feizei', hangzhou: 'feizei', pingding: 'feizei' };
for (const [town, thief] of Object.entries(CELLAR_TOWNS)) {
  const ins = Object.keys(MAPS).filter(id => id.startsWith(town + '~') && !id.includes('_') && ['inn', 'house', 'home'].includes(MAPS[id].ikind));
  const pick = [ins.find(id => MAPS[id].ikind === 'inn'), ins.find(id => MAPS[id].ikind !== 'inn')].filter(Boolean);
  pick.forEach((inId, j) => {
    const m = MAPS[inId], tx = m.w - 2, ty = m.h - 2;
    if (m.rows[ty][tx] !== 'L' || (NPCS[inId] || []).some(n => n.x === tx && n.y === ty)) return;
    const id = `${inId}_cellar`, W = 17, H = 12;
    const rows = [];
    for (let y = 0; y < H; y++) { let r = ''; for (let x = 0; x < W; x++) r += (y === 0 || x === 0 || x === W - 1 || y === H - 1) ? 'M' : 'v'; rows.push(r); }
    const set = (x, y, c) => { rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1); };
    for (const x of [3, 4, 5, 9, 10, 13, 14]) set(x, 1, 'h');     /* 靠墙一排酒坛 */
    for (const [x, y] of [[6, 5], [7, 5], [11, 7], [4, 8]]) set(x, y, 'c');   /* 几根石柱 */
    set(W - 3, H - 3, 'X'); set(3, H - 3, 'X');
    set(1, 1, 'g');   /* 爬上去的梯子 */
    MAPS[id] = { id, name: `${m.name}·地窖`, rows, w: W, h: H, buildings: [], signs: {}, doors: {}, indoor: true, cellar: true, ikind: 'tavern', ground: 'cave',
      spawns: [[thief, 8, 3], [thief, 12, 9], [thief, 6, 9]].slice(0, thief === 'xiaozei' ? 3 : 2),
      exits: { '1,1': { map: inId, x: tx - 1, y: ty, dir: 'left' } } };
    m.rows[ty] = m.rows[ty].slice(0, tx) + 'g' + m.rows[ty].slice(tx + 1);
    m.exits[`${tx},${ty}`] = { map: id, x: 1, y: 2, dir: 'down' };
  });
}
