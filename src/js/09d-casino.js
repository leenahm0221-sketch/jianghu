/* ---------------- 赌坊：扬州、洛阳各一间 ----------------
   三张桌子，玩家对庄家：骰宝（猜大小）、牌九（比牌）、番摊（猜余数）。
   只能用打怪、做任务挣来的银两下注；金元以后也永远换不成银两，不能上赌桌。
   每把最多押 200 两；每天（按现实日期）净输赢各有上限：
   输满 1000 两，打手把你请出去，今天不能再进；赢满 1000 两，庄家不再陪你玩，明天再来。
   庄家都略占一点便宜：赌坊是花银子的地方，不是挣银子的地方。
   扬州赌坊有个小故事：牌九庄家出千，帮老赌鬼盯他三把，就能当场揭穿。 */
const BET_STEPS = [10, 50, 100, 200], CASINO_CAP = 1000;
const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function casinoDay() {
  const c = S.casino || (S.casino = {});
  if (c.day !== todayKey()) { c.day = todayKey(); c.net = 0; c.banned = false; }
  return c;
}
let cgame = null;   /* 正在桌上开的这一把：动画画完才出结果 */

/* ---- 牌九：32 张骨牌。文牌 11 种各两张，武牌 10 张（按点数凑成“杂几”成对），丁三配二四叫“至尊” ---- */
const PG_TILES = [
  ['天', 6, 6, 2], ['地', 1, 1, 2], ['人', 4, 4, 2], ['和', 1, 3, 2], ['梅', 5, 5, 2], ['长三', 3, 3, 2], ['板凳', 2, 2, 2],
  ['斧头', 5, 6, 2], ['红头', 4, 6, 2], ['高脚', 1, 6, 2], ['零霖', 1, 5, 2],
  ['杂九', 4, 5, 1], ['杂九', 3, 6, 1], ['杂八', 3, 5, 1], ['杂八', 2, 6, 1], ['杂七', 3, 4, 1], ['杂七', 2, 5, 1], ['杂五', 1, 4, 1], ['杂五', 2, 3, 1],
  ['丁三', 1, 2, 1], ['二四', 2, 4, 1],
];
const PG_RANK = ['天', '地', '人', '和', '梅', '长三', '板凳', '斧头', '红头', '高脚', '零霖', '杂九', '杂八', '杂七', '杂五', '丁三', '二四'];
function pgDeck() { const d = []; for (const [n, a, b, k] of PG_TILES) for (let i = 0; i < k; i++) d.push({ n, a, b }); return d; }
function pgDraw(deck) { return deck.splice(Math.floor(Math.random() * deck.length), 1)[0]; }
/* 一手牌的大小：数越大越好。对子最大（至尊 > 双天 > 双地 …），再是天王、地王、天杠、地杠，最后比点数，同点比最大那张 */
function pgScore(h) {
  const [x, y] = h, names = [x.n, y.n].sort().join('');
  if (names === ['丁三', '二四'].sort().join('')) return { v: 9000, name: '至尊宝' };
  if (x.n === y.n) return { v: 8000 - PG_RANK.indexOf(x.n) * 10, name: `双${x.n}` };
  const has = n => x.n === n || y.n === n, other = t => (x.n === t ? y : x), pts = t => t.a + t.b;
  for (const [big, nm, v] of [['天', '天', 7000], ['地', '地', 6900]]) {
    if (has(big) && pts(other(big)) === 9) return { v: v + 50, name: `${nm}王` };
    if (has(big) && pts(other(big)) === 8) return { v, name: `${nm}杠` };
  }
  const p = (x.a + x.b + y.a + y.b) % 10, best = Math.min(PG_RANK.indexOf(x.n), PG_RANK.indexOf(y.n));
  return { v: p * 100 + (20 - best), name: p === 0 ? '鳖十' : `${'零一二三四五六七八九'[p]}点` };
}

/* ---- 庄家菜单 ---- */
function casinoGate(who, back) {
  const c = casinoDay();
  if (c.banned) { say(who, '今天你输得够多了，回去歇着吧，明天再来。'); return false; }
  if (c.net >= CASINO_CAP) { say(who, '客官今天手气太旺，小店赔不起了。明天请早！'); return false; }
  return true;
}
function chooseBet(who, back, cb) {
  const c = casinoDay(), room = c.net <= -CASINO_CAP ? 0 : CASINO_CAP + c.net;   /* 离今天输的上限还差多少 */
  const opts = BET_STEPS.filter(v => v <= S.silver && v <= Math.max(10, room));
  if (!opts.length) return say(who, `下注最少 10 两，你身上只有 ${S.silver} 两。`, back);
  ask(who, `押多少？（你有 ${S.silver} 两，今天${c.net >= 0 ? '赢了' : '输了'} ${Math.abs(c.net)} 两）`, opts.map(v => `${v}两`).concat(['不玩了']), i => (i >= opts.length ? back && back() : cb(opts[i])));
}
function settle(who, bet, win, mult, text, again) {
  const c = casinoDay(), gain = win ? Math.floor(bet * mult) : -bet;
  S.silver += win ? gain + bet : 0;   /* 押注时已经先扣了 */
  c.net += gain; c.played = (c.played || 0) + 1; save();
  sfx(win ? 'coin' : 'hurt');
  const tail = win ? `赢了 ${gain} 两！` : `输了 ${bet} 两。`;
  if (c.net <= -CASINO_CAP) {
    c.banned = true; save();
    return say(who, [text, tail, '（两个打手走过来，一左一右架住你的胳膊）', '打手：“客官今天输得差不多了，小店送您出门。明天再来！”'], () => {
      const ext = map.id.split('~')[0], ex = map.exits[`${map.doorX},${map.h - 1}`];
      if (ex) enterMap(ex.map, ex.x, ex.y, 'down'); else enterMap(ext, P.tx, P.ty);
    });
  }
  say(who, [text, tail], again);
}

/* 骰宝：三颗骰子，4~10 小、11~17 大，一赔一；三颗一样（围骰）庄家通吃 */
function diceTalk(who) {
  const again = () => diceTalk(who);
  if (!casinoGate(who)) return;
  ask(who, '骰宝！三颗骰子，十点以下是小，十一点以上是大，一赔一。三颗一样的叫“围骰”，庄家通吃。', ['押大', '押小', '不玩了'], side => {
    if (side > 1) return;
    chooseBet(who, null, bet => {
      S.silver -= bet;
      const d = [rnd(1, 6), rnd(1, 6), rnd(1, 6)], sum = d[0] + d[1] + d[2], wei = d[0] === d[1] && d[1] === d[2];
      const big = sum >= 11, win = !wei && (side === 0) === big;
      cgame = { type: 'dice', t: 0, dur: 70, d, done: () => settle(who, bet, win, 1, `${d.join('、')}，共 ${sum} 点——${wei ? '围骰！庄家通吃' : big ? '大' : '小'}！`, again) };
      sfx('swing');
    });
  });
}
/* 番摊：庄家抓一把铜钱，用竹签四个四个地拨开，看最后剩几个（1~4）。押中一赔三，抽一成水 */
function fantanTalk(who) {
  const again = () => fantanTalk(who);
  if (!casinoGate(who)) return;
  ask(who, '番摊！我抓一把铜钱，四个四个拨开，你猜最后剩几个。押中一赔三，赌坊抽一成。', ['押1', '押2', '押3', '押4', '不玩了'], pick => {
    if (pick > 3) return;
    chooseBet(who, null, bet => {
      S.silver -= bet;
      const n = rnd(20, 48), rem = n % 4 || 4, win = rem === pick + 1;
      cgame = { type: 'fantan', t: 0, dur: 30 + Math.ceil(n / 4) * 6, n, rem, done: () => settle(who, bet, win, 2.7, `一共 ${n} 个铜钱，剩 ${rem} 个！`, again) };
      sfx('coin');
    });
  });
}
/* 牌九：你和庄家各摸两张骨牌比大小，一赔一，一样大算庄家赢 */
function paigowTalk(who, town) {
  const again = () => paigowTalk(who, town);
  const c = casinoDay(), q = S.flags.qian || 0, rigged = town === 'yangzhou' && q === 1;
  const opts = ['来一把', '不玩了'];
  if (rigged && (S.flags.qianWatch || 0) >= 3) opts.splice(1, 0, '揭穿他出千！');
  if (!casinoGate(who)) return;
  ask(who, '牌九！你我各摸两张骨牌，至尊宝最大，对子次之，再比点数。一样大算我赢，一赔一。', opts, i => {
    if (opts[i] === '揭穿他出千！') return exposeCheat(who);
    if (opts[i] !== '来一把') return;
    chooseBet(who, null, bet => {
      S.silver -= bet;
      const deck = pgDeck(), me = [pgDraw(deck), pgDraw(deck)];
      let bk = [pgDraw(deck), pgDraw(deck)];
      if (rigged) { const alt = [pgDraw(deck), pgDraw(deck)]; if (pgScore(alt).v > pgScore(bk).v) bk = alt; S.flags.qianWatch = (S.flags.qianWatch || 0) + 1; }   /* 出千：偷偷换一手更好的 */
      const a = pgScore(me), b = pgScore(bk), win = a.v > b.v;
      const note = rigged ? ['', '（他洗牌时袖口好像动了一下……）', '（他摸牌的手法快得不像话。）', '（你看清了：他把一张牌从袖子里换了出来！）'][Math.min(3, S.flags.qianWatch)] : '';
      cgame = { type: 'paigow', t: 0, dur: 80, me, bk, a, b, done: () => settle(who, bet, win, 1, `你是${a.name}，庄家是${b.name}。${note}`, again) };
      sfx('swing');
    });
  });
}
function exposeCheat(who) {
  S.flags.qian = 2; S.silver += 300; addRep(5, '揭穿出千'); sfx('level'); save();
  say(who, ['（你一把扣住他的手腕，从他袖子里抖出一张天牌）', '牌九庄家：“这、这……”', '赌坊掌柜：“好你个吃里扒外的东西！敢在我的场子里出千，坏我名声！”',
    '赌坊掌柜：“这位少侠好眼力。这三百两是小店的一点心意，还请笑纳。”', '（得到 300 两，江湖声望 +5）'], () => {
    const old = (NPCS[map.id] || []).find(n => n.id === 'gambler_old');
    if (old) old.done = true;
  });
}
function oldGamblerTalk(n) {
  const q = S.flags.qian || 0;
  if (q === 0) return ask(n.name, ['（一个老头蹲在角落里，盯着牌九桌直叹气）', '那个牌九庄家，十把赢九把，我这把老骨头都输进去了。', '我老眼昏花看不清。少侠帮我盯着他打三把牌九，看他是不是在出千？'], ['好，我帮你盯着', '算了'], i => {
    if (i) return;
    S.flags.qian = 1; S.flags.qianWatch = 0; save();
    say(n.name, '多谢少侠！你跟他赌三把，留心他的手。看清了就当面揭穿他！');
  });
  if (q === 1) return say(n.name, `你已经盯了他 ${Math.min(3, S.flags.qianWatch || 0)} 把。${(S.flags.qianWatch || 0) >= 3 ? '看清了吧？去当面揭穿他！' : '再跟他赌几把，留心他的袖子。'}`);
  say(n.name, ['少侠真是好眼力！那家伙被掌柜赶出去了。', '我也不赌了，回家种地去。']);
}

/* ---- 把庄家、掌柜、打手、老赌鬼放进赌坊 ---- */
for (const id of Object.keys(MAPS)) {
  const m = MAPS[id]; if (m.ikind !== 'casino') continue;
  const town = id.split('~')[0], mid = m.doorX, W = m.w, list = NPCS[id] || (NPCS[id] = []);
  const P_ = (o) => list.push(Object.assign({ dir: 'down' }, o));
  P_({ id: `casino_boss_${town}`, name: '赌坊掌柜', role: '赌坊', icon: '赌', x: mid, y: 2, look: { body: 'heipao', hair: 'crown', beard: true },
    talk: n => say(n.name, ['小店规矩：只收真金白银，每把最多押 200 两。', `一天输赢各不过 ${CASINO_CAP} 两，输多了打手会请您出门。`, '小赌怡情，大赌伤身，客官悠着点。']) });
  P_({ id: `casino_dice_${town}`, name: '骰宝庄家', role: '骰宝', x: 2, y: 5, look: { body: 'apron', hair: 'cap' }, talk: n => diceTalk(n.name) });
  P_({ id: `casino_pg_${town}`, name: '牌九庄家', role: '牌九', x: mid, y: 5, look: { body: 'changpao', hair: 'fangjin' }, talk: n => paigowTalk(n.name, town) });
  P_({ id: `casino_ft_${town}`, name: '番摊庄家', role: '番摊', x: W - 4, y: 5, look: { body: 'apron', hair: 'cap' }, talk: n => fantanTalk(n.name) });
  for (const x of [mid - 2, mid + 2]) P_({ id: `casino_guard_${town}_${x}`, name: '打手', role: '赌坊', x, y: m.h - 3, look: { body: 'vest', hair: 'band' },
    talk: n => say(n.name, ['（抱着胳膊）在这儿玩可以，闹事不行。', '输急眼的我见多了，客官别让我们难做。']) });
  if (town === 'yangzhou') P_({ id: 'gambler_old', name: '老赌鬼', role: '赌客', x: W - 2, y: m.h - 3, look: { body: 'buyi', hair: 'messy', beard: true }, talk: n => oldGamblerTalk(n) });
}

/* ---- 桌上开局的动画 ---- */
function updCasino() {
  const g_ = cgame;
  if (++g_.t >= g_.dur || ((pressed.a || pressed.b) && g_.t > 20)) { cgame = null; g_.done(); }
}
function dots(x, y, s, n, c) {   /* 一面骰子／半张骨牌上的点：3×3 的格子 */
  const P3 = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] }[n];
  const st = Math.floor(s / 3);
  for (const k of P3) R(x + 1 + (k % 3) * st, y + 1 + Math.floor(k / 3) * st, Math.max(1, st - 1), Math.max(1, st - 1), c);
}
function renderCasino() {
  if (!cgame) return;
  const g_ = cgame, W = 132, H = 64, x = Math.round((MW - W) / 2), y = Math.max(HUD_H + 8, Math.round((UB - H) / 2) - 10);
  R(x, y, W, H, 3); R(x + 1, y + 1, W - 2, H - 2, 2); R(x + 3, y + 3, W - 6, H - 6, 1);   /* 赌桌：深色桌边、浅色桌布 */
  if (g_.type === 'dice') {
    const roll = g_.t < 40;
    txt(roll ? '摇骰子……' : '开！', x + W / 2, y + 4, 3, 'center');
    g_.d.forEach((v, i) => {
      const face = roll ? 1 + ((g_.t >> 2) + i * 2) % 6 : v, bx = x + 26 + i * 30, by = y + 22 + (roll ? ((g_.t >> 1) + i) % 3 - 1 : 0);
      R(bx, by, 22, 22, 3); R(bx + 1, by + 1, 20, 20, 0); dots(bx + 2, by + 2, 18, face, face === 1 || face === 4 ? 2 : 3);
    });
  } else if (g_.type === 'paigow') {
    const show = (h, ty, label, open) => {
      txt(label, x + 8, ty + 4, 3);
      h.forEach((t, i) => {
        const bx = x + 40 + i * 18; R(bx, ty, 15, 26, 3); R(bx + 1, ty + 1, 13, 24, 0); R(bx + 1, ty + 13, 13, 1, 3);
        if (open) { dots(bx + 2, ty + 1, 12, t.a, 3); dots(bx + 2, ty + 14, 12, t.b, 3); } else R(bx + 3, ty + 3, 9, 20, 2);
      });
    };
    show(g_.me, y + 4, '你', g_.t > 15);
    show(g_.bk, y + 33, '庄家', g_.t > 45);
    if (g_.t > 15) txt(g_.a.name, x + W - 8, y + 10, 3, 'right');
    if (g_.t > 45) txt(g_.b.name, x + W - 8, y + 39, 3, 'right');
  } else {
    /* 番摊：铜钱堆，庄家每隔一会儿拨走四个 */
    const gone = Math.min(g_.n - g_.rem, Math.max(0, Math.floor((g_.t - 20) / 6)) * 4), left = g_.n - gone;
    txt(left > g_.rem ? `还剩 ${left} 个` : `剩 ${g_.rem} 个！`, x + W / 2, y + 4, 3, 'center');
    for (let i = 0; i < left; i++) {
      const cx = x + 12 + (i % 14) * 8, cy = y + 20 + Math.floor(i / 14) * 9;
      R(cx, cy, 6, 6, 3); R(cx + 1, cy + 1, 4, 4, 0); R(cx + 2, cy + 2, 2, 2, 3);   /* 外圆内方 */
    }
  }
}
