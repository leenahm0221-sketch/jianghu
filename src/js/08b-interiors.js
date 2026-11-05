/* ---------------- 室内：每座有门的房子都能走进去 ----------------
   房子正门那一格变成门口（只有人能走），走进去就到这座房子的室内小地图；
   室内最下面一排正中是门，走出去回到门口外面。
   店铺、客栈、药铺这些房子的主人搬进屋里，站在柜台后面；门派大殿的掌门站在供桌前。 */
const IN_SIZE = {
  house: [9, 7], home: [9, 7], chief: [9, 7],
  smith: [11, 8], pharmacy: [11, 8], pawn: [11, 8], bank: [11, 8], cloth: [11, 8],
  inn: [13, 8], tavern: [13, 9],
  temple: [11, 9], tower: [11, 9], nunnery: [13, 9], library: [13, 9], school: [13, 9], escort: [13, 9], hall: [15, 10],
};
const IN_SHOP = new Set(['smith', 'pharmacy', 'pawn', 'bank', 'cloth', 'inn', 'tavern']);
const IN_HOME = new Set(['house', 'home', 'chief']);
const IN_NAME = { house: '民居', home: '民居', chief: '村长家' };
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
    free.push([x, y]);
  }
  const hs0 = [...id].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
  const n0 = Math.min(pool.length, IN_HOME.has(m.ikind) ? 2 : pool.length);
  for (let j = 0; j < n0 && free.length; j++) {
    const [name, look, lines] = pool[j], sp = free.splice((hs0 + j * 7) % free.length, 1)[0];
    const n = { id: `${id}_f${j}`, name, role: '', x: sp[0], y: sp[1], home: { x: sp[0], y: sp[1] }, dir: 'down', amb: true,
      look: folkLook(MAPS[extId], b, look), talk: me => say(name, lines[(me.said = ((me.said || 0) + 1)) % lines.length]) };
    (NPCS[id] || (NPCS[id] = [])).push(n);
  }
}
