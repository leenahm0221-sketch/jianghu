/* ======== 阵营主线：邪派「神教密令」、中立「江南风云」，由主城接引使发放 ======== */
const STORY = {
  邪: { name: '神教密令', giver: 'envoy_xie', steps: [
    { text: '山海关击退少林武僧', kind: 'wuseng', need: 3, map: 'shanhai', say: ['正派那帮和尚在山海关设卡，专拦神教的人。', '去山海关，打退三个少林武僧，给他们点颜色看看。'] },
    { text: '塞外草原截杀蒙古探子', kind: 'menggu', need: 4, map: 'caoyuan', say: ['干得好！不过事情没那么简单。', '有人勾结蒙古探子，在草原上替正派传信。去截杀四个。'] },
    { text: '雁门关收服马贼', kind: 'mazei', need: 5, map: 'yanmen', say: ['探子身上搜出一张图：雁门关的马贼在替人运兵器。', '去雁门关打服五个马贼，问出货是运给谁的。'] },
    { text: '大漠追查叛教密使', kind: 'shafei', need: 4, map: 'damo', say: ['马贼招了：货运往大漠，接货的是沙匪。', '沙匪背后有人。去大漠打四个沙匪，顺藤摸瓜。'] },
    { text: '光明顶擒拿叛徒金毛使者', flag: 'jinmao', map: 'guangming', say: ['原来是明教的金毛使者！他勾结正派，想挑起神教和明教火并。', '他躲在光明顶。去把他拿下！'] },
  ], end: ['金毛使者伏诛，神教上下都承你的情。', '—— 神教密令 完 ——'] },
  中: { name: '江南风云', giver: 'envoy_zhong', steps: [
    { text: '伏牛山脚惩治山贼', kind: 'bandit', need: 5, map: 'wild', say: ['最近往来扬州的商队屡屡被劫。', '先去伏牛山脚，惩治五个山贼。'] },
    { text: '黑松林打黑熊取熊胆', kind: 'bear', need: 3, map: 'forest', say: ['山贼说，劫来的货都运进了黑松林。', '林子里黑熊挡道，打三头，探探路。'] },
    { text: '伏牛矿洞击败矿霸', kind: 'kuangba', need: 1, map: 'kuangdong', say: ['林中脚印通往伏牛山的矿洞，矿霸替人看着赃物。', '进伏牛矿洞，打倒矿霸。'] },
    { text: '黑松林讨伐漕帮帮主', flag: 'caobang', map: 'forest', say: ['矿霸招了：幕后是漕帮帮主，他想霸占江南水路。', '他就躲在黑松林深处。去讨个公道！'] },
  ], end: ['漕帮帮主伏诛，江南水路太平了。', '—— 江南风云 完 ——'] },
};
const cqStep = () => S.cq && STORY[S.cq.line] && STORY[S.cq.line].steps[S.cq.step];
const cqDone = () => { const st = cqStep(); if (!st) return false; return st.kind ? S.cq.cnt >= st.need : !!S.flags[st.flag]; };
const storyFits = line => S.q.main >= CH1_END && (campOf() === line || (line === '中' && !S.sect));
function storyTalk(camp) {
  const L = STORY[camp]; if (!L) return false;
  const who = ENVOY[camp].who, cq = S.cq;
  if (cq && cq.line === camp) {
    if (cq.done || !cqDone()) return false;
    const reward = 60 + cq.step * 40; S.silver += reward; addRep(5 + cq.step * 2); if (S.sect) addSrep(3);
    cq.step++; cq.cnt = 0; sfx('level'); save();
    const nx = L.steps[cq.step];
    if (!nx) {
      cq.done = true; S.cqDone = (S.cqDone || []).concat(camp); const g = RARE[rnd(0, RARE.length - 1)]; S.gear.push(g); addRep(25); S.silver += 200;
      if (camp === '邪') addAlign(0, 10); else addAlign(3, 3);
      save(); say(who, [...L.end, `（银两+${reward + 200} 江湖声望+25 得到${EQ[g].name}）`]); return true;
    }
    say(who, [`（银两+${reward}）`, ...nx.say], () => toast(`${L.name}：${nx.text}`)); return true;
  }
  if ((!cq || cq.done) && storyFits(camp) && !(S.cqDone || []).includes(camp)) {
    ask(who, [`江湖上出了件大事，正缺你这样的好手。`, ...L.steps[0].say], ['接下', '以后再说'], i => {
      if (i !== 0) return; S.cq = { line: camp, step: 0, cnt: 0 }; sfx('menu'); toast(`${L.name}：${L.steps[0].text}`); save();
    });
    return true;
  }
  return false;
}
/* 门派介绍：任何一位接引使都能讲全部门派；本阵营的门派当场就能拜，别的阵营指明去哪拜 */
const CAMP_CITY = { 正: '襄阳的正派接引使', 邪: '平定州的邪派接引使', 中: '扬州的中立接引使' };
const CAMP_NAME = { 正: '正派', 邪: '邪派', 中: '中立' };
const SPECIAL_JOIN = {
  quanzhen: { ok: () => lv('quanzhen') >= 10, need: () => `全真心法练到 10 级（现在 ${lv('quanzhen').toFixed(2)}）。心法由清虚道长先教：随便哪门武功练到 5 级去找他。`, where: '牛家村清虚观的清虚道长' },
  gaibang: { ok: () => (S.side.gaibang || 0) >= 1 && (S.items.tourou || 0) >= 5, need: () => '给鲁长老送 5 块兔肉，兔儿坡的野兔就有。', where: '牛家村池塘边的鲁长老' },
};
const sectOrder = camp => Object.keys(SECTS).sort((a, b) => (SECTS[a].camp !== camp) - (SECTS[b].camp !== camp));
function sectFits(k) { const j = SECT_JOIN[k] || SPECIAL_JOIN[k]; return j.ok() && !campBlock(k); }
function sectBrief(k) {
  const sc = SECTS[k], j = SECT_JOIN[k] || SPECIAL_JOIN[k];
  const skills = Object.keys(SK).filter(x => SK[x].sect === k).map(x => SK[x].name).join('、');
  const foe = SECT_FOE[k] ? `宿敌：${SECT_FOE[k].map(f => SECTS[f].name).join('、')}。` : '';
  const at = SPECIAL_JOIN[k] ? SPECIAL_JOIN[k].where : CAMP_CITY[sc.camp];
  return [`${sc.name}，${CAMP_NAME[sc.camp]}门派，总坛在${sc.where}。`, `传授：${skills}。${foe}`, `入门：${j.need()}`, `拜师找${at}，或直接去总坛找掌门。`];
}
function envoyTalk(camp, page = 0, browse = false) {
  if (!browse && storyTalk(camp)) return;
  const E = ENVOY[camp], who = E.who, all = sectOrder(camp), PER = 4, pages = Math.ceil(all.length / PER), pg = page % pages;
  all.forEach(hear);
  if (!browse && S.sect && E.sects.includes(S.sect)) return envoyMember(who, S.sect);
  const list = all.slice(pg * PER, pg * PER + PER);
  const tag = k => S.sect === k ? '本门' : E.sects.includes(k) ? (sectFits(k) ? '可入' : '未够格') : `${SPECIAL_JOIN[k] ? '牛家村' : CAMP_NAME[SECTS[k].camp]}·${sectFits(k) ? '可入' : '未够格'}`;
  ask(who, pg ? `江湖门派（${pg + 1}/${pages}）` : ['江湖十三门派，我都能给你讲讲。本阵营的门派，在我这里就能拜师。', '高深武功，日后再亲自上总坛去学。'],
    list.map(k => `${SECTS[k].name}（${tag(k)}）`).concat([`下一页（${pg + 1}/${pages}）`, '离开']), i => {
      if (i === list.length) return envoyTalk(camp, pg + 1, true);
      const sect = list[i]; if (!sect) return;
      const back = () => envoyTalk(camp, pg, true);
      const brief = sectBrief(sect);
      if (S.sect || !E.sects.includes(sect)) return say(who, S.sect && S.sect !== sect ? [...brief, `你已是${SECTS[S.sect].name}弟子，要改投先回总坛叛出师门。`] : brief, back);
      const blk = campBlock(sect); if (blk) return say(who, [...brief, blk], back);
      if (!SECT_JOIN[sect].ok()) return say(who, brief, back);
      ask(who, [...brief, ...SECT_JOIN[sect].pitch], [`拜入${SECTS[sect].name}`, '再想想'], k => { if (k === 0) joinSect(sect, who); else back(); });
    });
}
function envoyMember(who, sect) {
  const k = introSkill(sect), st = S.stask && S.stask.sect === sect ? S.stask : null;
  ask(who, `${SECTS[sect].name}弟子，有什么事？`, [S.skills[k] != null ? `${SK[k].name}（已学）` : `学${SK[k].name}`, st ? (sectTaskDone(st) ? '交门务' : '门务中') : '门派任务', '江湖门派', '离开'], i => {
    const back = () => envoyMember(who, sect);
    if (i === 0) {
      if (S.skills[k] != null) return say(who, `本门其余武功，去${SECTS[sect].where}找掌门学。`, back);
      const why = reqFail(k); if (why) return say(who, `还不行。${why}`, back);
      learn(k); save(); return say(who, [`好！这便传你${SK[k].name}。`, `本门其余武功，日后去${SECTS[sect].where}找掌门学。`]);
    }
    if (i === 1) return sectTaskMenu(who, sect, back);
    if (i === 2) return envoyTalk(SECTS[sect].camp, 0, true);
  });
}
function sectTalk(who, sect) {
  hear(sect);
  if (S.sect === sect) return masterMenu(who, sect);
  if (S.sect) return say(who, `你已是${SECTS[S.sect].name}弟子。若想改投本派，先回去向你师父叛出师门。`);
  const j = SECT_JOIN[sect];
  const blk = campBlock(sect);
  if (blk) return say(who, blk);
  if (!j.ok()) return say(who, [...j.pitch.slice(0, 1), `想入${SECTS[sect].name}？${j.need()}`]);
  ask(who, j.pitch, [`拜入${SECTS[sect].name}`, '再想想'], i => { if (i === 0) joinSect(sect, who); });
}
function talkTo(n) {
  const t = S.stask;
  if (t && t.type === 'letter' && !t.done && t.to === n.id) {
    t.done = true; sfx('coin'); save();
    return say(n.name, ['（你递上门派书信）', '信我收到了，替我问你师父好。', '（送信完成，回师门复命）']);
  }
  n.talk(n);
}
function ferryTalk(to) {
  const go = to === 'taohua';
  ask('船夫', go ? '客官要去桃花岛？船钱十两。岛上不问正邪，别惹事就好。' : '回杭州？船钱十两。', ['上船（10两）', '不坐了'], i => {
    if (i !== 0) return;
    if (S.silver < 10) return say('船夫', '没钱可不渡。');
    S.silver -= 10; sfx('coin');
    if (go) enterMap('taohua', 12, 15, 'up'); else enterMap('hangzhou', 18, 16, 'right');
    save();
  });
}
/* 历练：随年龄解锁的江湖考验，完成得历练值（每 2 点历练元气 +1）、江湖声望和赏银 */
const TRIALS = [
  { id: 'l1', age: 17, text: '兔儿坡打狐狸 10 只', kind: 'fox', need: 10 },
  { id: 'l2', age: 18, text: '钓上一条金鲤', item: 'jinli' },
  { id: 'l3', age: 20, text: '任一武功练到 20 级', skill: 20 },
  { id: 'l4', age: 22, text: '除掉黑风寨主', flag: 'boss' },
  { id: 'l5', age: 24, text: '峨眉山打雪狼 3 只', kind: 'snowwolf', need: 3 },
  { id: 'l6', age: 26, text: '亲手缝出一件狐裘', gear: 'huqiu' },
  { id: 'l7', age: 28, text: '黑松林斩猛虎 1 头', kind: 'tiger', need: 1 },
  { id: 'l8', age: 30, text: '任一武功练到 50 级', skill: 50 },
  { id: 'l9', age: 35, text: '江湖声望达到 150', rep: 150 },
  { id: 'l10', age: 40, text: '任一武功练满 99.99', skill: 99.99 },
];
const curTrial = () => TRIALS.find(t => t.id === S.llCur);
const nextTrial = () => TRIALS.find(t => !S.llDone.includes(t.id) && S.age >= t.age);
const trialPending = () => TRIALS.find(t => !S.llDone.includes(t.id));
function trialDone(t) {
  if (t.kind) return S.llCnt >= t.need;
  if (t.item) return S.items[t.item] > 0;
  if (t.skill) return Math.max(...Object.keys(S.skills).filter(k => ATK_CATS.includes(SK[k] && SK[k].cat)).map(lv)) >= t.skill;
  if (t.flag) return !!S.flags[t.flag];
  if (t.gear) return S.gear.includes(t.gear);
  if (t.rep) return S.rep >= t.rep;
  return false;
}
function trialText() {
  const t = curTrial();
  if (t) return trialDone(t) ? '回襄阳找百晓生' : t.kind ? `${t.text} ${S.llCnt}/${t.need}` : t.text;
  const n = nextTrial(); if (n) return '去襄阳找百晓生';
  const p = trialPending(); return p ? `${p.age}岁才有新历练` : '历练圆满';
}
/* 第二章由百晓生发派 */
function baixiaoMain() {
  const q = S.q, who = '百晓生', adv = n => { q.main = n; q.cnt = 0; sfx('level'); save(); toast(`主线：${MAIN[n].text}`); };
  const gift = (silver, items, extra) => { S.silver += silver; for (const k in items) S.items[k] = (S.items[k] || 0) + items[k]; toast(`银两+${silver}${Object.keys(items).map(k => ` ${ITEMS[k].name}×${items[k]}`).join('')}${extra || ''}`); };
  if (q.main === CH1_END) { say(who, ['你就是牛家村那个打死猛虎的少年？果然名不虚传。', '最近江湖不太平：血刀门的血刀老祖从西域潜入中原，一路作恶。', '他前几日上了华山，抢了华山剑客的剑谱，剑客们正四处找人出气。', '出襄阳往西过潼关就是华山。去会会那些剑客，打四个，问问消息。'], () => adv(6)); return true; }
  if (q.main <= CH1_END || q.main >= MAIN_END || !mainDone()) return false;
  if (q.main === 6) say(who, ['剑客说，那恶僧下了华山，一路往东躲进了黑松林底下的黑风洞。', '洞里洞熊成群，他多半借熊掩护养伤。', '黑松林里有个黑洞口，进去打三头洞熊，看看有没有他的踪迹。'], () => { gift(80, { yao: 3, qingxin: 2 }); adv(7); });
  else if (q.main === 7) say(who, ['洞壁上留着血刀的刀痕……他已经出洞，藏到黑松林深处去了。', '林子里猛虎挡道，先斩两只猛虎，开出路来。'], () => { gift(100, { dieda: 3, baiyao: 1 }); adv(8); });
  else if (q.main === 8) say(who, ['好！林子深处有人见过一个红衣恶僧，血刀老祖就藏在那里。', '他刀法狠辣，又会邪门内功。带够伤药，打坐回满了再去。'], () => { gift(120, { yao: 3 }); adv(9); });
  else if (q.main === 9) say(who, ['血刀老祖伏诛，江湖上人人都在说你的名字！', '—— 第二章 完 ——', '往后的路，就看你自己了。'], () => {
    const g = RARE[rnd(0, RARE.length - 1)]; S.gear.push(g); addRep(30); addAlign(10, 0);
    gift(300, {}, ` ${EQ[g].name}`); adv(10);
  });
  return true;
}
function baixiaoTalk() {
  if (baixiaoMain()) return;
  const who = '百晓生', t = curTrial();
  if (t && trialDone(t)) {
    if (t.item) S.items[t.item]--;
    S.llDone.push(t.id); S.llCur = null; S.llCnt = 0;
    S.lilian += 10; addRep(10); const money = S.age * 3; S.silver += money; sfx('level'); save();
    return say(who, [`好！“${t.text}”，这份历练你过了。`, `（历练+10，元气+5，江湖声望+10，银两+${money}）`]);
  }
  ask(who, '百晓生的名号可不是白叫的。想问什么？', ['历练', '打听门派', '离开'], i => {
    if (i === 0) baixiaoTrial();
    else if (i === 1) tellRumor(who, 'sect');
  });
}
function baixiaoTrial() {
  const who = '百晓生', t = curTrial();
  if (t) return say(who, `你的历练是：${t.text}。${t.kind ? `已有 ${S.llCnt}/${t.need}。` : ''}`);
  const n = nextTrial();
  if (!n) { const p = trialPending(); return say(who, p ? ['江湖路要一步步走。', `等你 ${p.age} 岁，我再给你出题。（现在 ${S.age} 岁）`] : '你的历练已经圆满，江湖上再没什么能难住你。'); }
  ask(who, ['我百晓生走遍江湖，专看年轻人的成色。', `${S.age} 岁，正是历练的时候。这一关：${n.text}。`], ['接下历练', '再说'], i => {
    if (i !== 0) return;
    S.llCur = n.id; S.llCnt = 0; toast(`历练：${n.text}`); sfx('menu'); save();
  });
}
const BOUNTY = [['rabbit', 8, 20], ['fox', 6, 30], ['wolf', 6, 50], ['boar', 5, 60], ['bandit', 5, 70], ['bear', 3, 90], ['snowwolf', 4, 110], ['tiger', 1, 120]];
function biaotouTalk() {
  const who = '总镖头', b = S.bounty;
  if (b && b.cnt >= b.need) { S.silver += b.reward; sfx('coin'); toast(`悬赏银 +${b.reward}`); S.bounty = null; save(); return say(who, '干得漂亮！这是赏银。还要接新的悬赏吗？随时来找我。'); }
  if (b) return ask(who, `${EN[b.kind].name}还差 ${b.need - b.cnt} 只，赏银 ${b.reward} 两。`, ['继续', '放弃悬赏'], i => { if (i === 1) { S.bounty = null; toast('放弃了悬赏'); } });
  const best = bestAtk();
  const pool = BOUNTY.filter(([k]) => EN[k].lv <= best + 12).slice(-3);
  ask(who, '镖局悬赏，除害领赏。挑一个吧：', pool.map(([k, n, r]) => `${EN[k].name}×${n} 赏${r}两`).concat(['不接']), i => {
    if (i >= pool.length) return;
    const [k, n, r] = pool[i]; S.bounty = { kind: k, need: n, cnt: 0, reward: r }; toast(`接下悬赏：${EN[k].name}×${n}`); sfx('menu');
  });
}
function bankTalk() {
  ask('钱庄掌柜', `存在钱庄的银子，在外面昏倒也不会丢。\n存着 ${S.bank} 两，身上 ${S.silver} 两。`, ['全部存入', '全部取出', '离开'], i => {
    if (i === 0) { S.bank += S.silver; S.silver = 0; sfx('coin'); save(); bankTalk(); }
    else if (i === 1) { S.silver += S.bank; S.bank = 0; sfx('coin'); save(); bankTalk(); }
  });
}
function pawnTalk() { sellMenu('当铺朝奉', 'any', () => {}); }
function buyRumor(who) {
  if (S.silver < 2) return say(who, '客官，打听消息总得请碗酒吧？（要 2 两）');
  S.silver -= 2; sfx('coin');
  tellRumor(who, null);
}
function jiulouTalk() {
  ask('酒楼掌柜', '客官里边请！好酒好肉，吃了长力气。', ['买酒肉', '打听消息（2两）', '卖野味', '离开'], i => {
    if (i === 0) buy('酒楼掌柜', ['jiu', 'niurou', 'ganliang'], jiulouTalk);
    else if (i === 1) buyRumor('酒楼掌柜');
    else if (i === 2) sellMenu('酒楼掌柜', 'inn', jiulouTalk);
  });
}
function jiaotouTalk() {
  ask('武馆教头', ['武馆收上层武功秘籍，也教你看武功的门道。'], ['买秘籍', '武功门道', '离开'], i => {
    if (i === 0) buy('武馆教头', ['book_yuejia'], jiaotouTalk);
    else if (i === 1) say('武馆教头', ['每门武功有攻速、回击、闪躲、命中，和身、头、手、脚四处攻击力，从特差到优分六档。', '攻速快出手勤；回击好挨打后还手快；闪躲高少挨打。', '基础武功每招耗体力，上乘武功每招耗内功。体力用完出招无力，歇一歇或打坐就回来。', '在菜单“武功”里选中武功按 A，能看详情。', '武功练到 50 级会练成第二式，练满 99.99 元气加 10。', '换兵器按 SELECT，同一种兵器的武功在菜单里选。', '武功分三层：基础武功谁都能练；门派武功要拜师，叛出师门最多练到 49.99；特殊武功靠秘籍或奇人传授，不受门派约束。']);
  });
}
const MAIN = [
  { text: '去找王村长' },
  { text: '兔儿坡打野兔', kind: 'rabbit', need: 5 },
  { text: '伏牛山脚除狼', kind: 'wolf', need: 5 },
  { text: '讨伐黑风寨主', flag: 'boss' },
  { text: '黑松林斩猛虎', kind: 'tiger', need: 1 },
  { text: '去襄阳城找百晓生', giver: 'baixiao' },
  { text: '华山打华山剑客探消息', kind: 'hsjianke', need: 4, giver: 'baixiao' },
  { text: '黑风洞打洞熊寻踪迹', kind: 'dongxiong', need: 3, giver: 'baixiao' },
  { text: '黑松林斩猛虎开路', kind: 'tiger', need: 2, giver: 'baixiao' },
  { text: '黑松林讨伐血刀老祖', flag: 'xuedao', giver: 'baixiao' },
  { text: '第二章 完成', giver: 'baixiao' },
];
const CH1_END = 5, MAIN_END = MAIN.length - 1;
const mainGiver = () => (MAIN[S.q.main] || {}).giver || 'chief';
const GIVER_NAME = { chief: '王村长', baixiao: '襄阳百晓生' };
function mainDone() { const m = MAIN[S.q.main]; if (!m) return false; if (m.kind) return S.q.cnt >= m.need; if (m.flag) return !!S.flags[m.flag]; return false; }
function questText() {
  const cs = cqStep();
  if (cs && !S.cq.done && (campOf() === S.cq.line || !S.sect)) return cs.kind ? (cqDone() ? '回主城复命' : `${cs.text} ${S.cq.cnt}/${cs.need}`) : (cqDone() ? '回主城复命' : cs.text);
  const m = MAIN[S.q.main] || MAIN[MAIN.length - 1], back = `回报${GIVER_NAME[mainGiver()]}`;
  if (m.kind) return mainDone() ? back : `${m.text} ${S.q.cnt}/${m.need}`;
  if (m.flag) return mainDone() ? back : m.text;
  return m.text;
}
const reqFail = k => {
  const sk = SK[k];
  if (sk.req && lv(sk.req[0]) < sk.req[1]) return `${SK[sk.req[0]].name}要练到 ${sk.req[1]} 级（现在 ${lv(sk.req[0]).toFixed(2)}）。`;
  if (sk.qi && qi() < sk.qi) return `元气要到 ${sk.qi}（现在 ${qi()}）。年纪渐长、心法精进，元气自然增长。`;
  return null;
};
const canLearnSect = sect => Object.keys(SK).some(k => SK[k].sect === sect && S.skills[k] == null && !reqFail(k));
/* 头顶标记：! 有事找你，? 可以交任务 */
function questMark(n) {
  const q = S.q;
  switch (n.id) {
    case 'chief': return q.main === 0 ? '!' : (q.main < CH1_END && mainDone()) ? '?' : null;
    case 'doctor': { const s = S.side.lianyao || 0; return s === 0 ? '!' : (s === 1 && S.items.caoyao >= 5) ? '?' : null; }
    case 'smith': { const s = S.side.duanzao || 0; return (s === 0 && q.main >= 2) ? '!' : (s === 1 && S.items.langpi >= 3) ? '?' : null; }
    case 'tao':
      if (S.sect === 'quanzhen' && (hasGift('quanzhen') || (S.stask && S.stask.sect === 'quanzhen' && sectTaskDone(S.stask)))) return '?';
      if (S.skills.quanzhen == null) return bestAtk() >= 5 ? '!' : null;
      if (!S.sect && lv('quanzhen') >= 10) return '!';
      return S.sect === 'quanzhen' && canLearnSect('quanzhen') ? '!' : null;
    case 'fangzhang': case 'shitai': case 'mjshi': case 'chiyan': case 'huadaozhu': case 'wdzhang': case 'hszhang': case 'tmzhu': case 'sunpo': case 'xxlao': case 'lanjz': {
      const sect = Object.keys(MASTER_IDS).find(k => MASTER_IDS[k] === n.id);
      if (S.purge && S.purge.sect === sect && S.purge.done) return '?';
      if (S.sect === sect && (hasGift(sect) || (S.stask && S.stask.sect === sect && sectTaskDone(S.stask)))) return '?';
      if (!S.sect) return SECT_JOIN[sect].ok() && !campBlock(sect) ? '!' : null;
      return S.sect === sect && canLearnSect(sect) ? '!' : null;
    }
    case 'fisher': return !S.items.yugan ? '!' : null;
    case 'envoy_zheng': case 'envoy_xie': case 'envoy_zhong': {
      const cmp = { envoy_zheng: '正', envoy_xie: '邪', envoy_zhong: '中' }[n.id], E = ENVOY[cmp];
      if (S.cq && S.cq.line === cmp && !S.cq.done && cqDone()) return '?';
      if ((!S.cq || S.cq.done) && STORY[cmp] && storyFits(cmp) && !(S.cqDone || []).includes(cmp)) return '!';
      if (S.sect && E.sects.includes(S.sect)) { const st = S.stask; if (st && st.sect === S.sect && sectTaskDone(st)) return '?'; const k = introSkill(S.sect); return S.skills[k] == null && !reqFail(k) ? '!' : null; }
      return !S.sect && E.sects.some(k => SECT_JOIN[k].ok() && !campBlock(k)) ? '!' : null;
    }
    case 'fenglao': case 'tingyu': case 'shusheng': case 'simei': case 'dubi': { const h = HERMITS[Object.keys(HERMITS).find(k => HERMITS[k].npc === n.id)]; return S.skills[h.skill] == null && h.ok() && !reqFail(h.skill) ? '!' : null; }
    case 'caifeng': { const s2 = S.side.fangzhi || 0; return s2 === 0 ? '!' : (s2 === 1 && S.items.mianhua >= 3) ? '?' : null; }
    case 'inn': { const s2 = S.side.pengren || 0; return (s2 === 0 && S.items.yugan) ? '!' : (s2 === 1 && S.items.jiyu >= 3) ? '?' : null; }
    case 'baixiao': { if (q.main === CH1_END) return '!'; if (q.main > CH1_END && q.main < MAIN_END && mainDone()) return '?'; const t = curTrial(); if (t && trialDone(t)) return '?'; return !S.llCur && nextTrial() ? '!' : null; }
    case 'biaotou': return !S.bounty ? '!' : S.bounty.cnt >= S.bounty.need ? '?' : null;
    case 'lu':
      if (S.sect === 'gaibang' && (hasGift('gaibang') || (S.stask && S.stask.sect === 'gaibang' && sectTaskDone(S.stask)))) return '?';
      if (!S.sect) { const s = S.side.gaibang || 0; return s === 0 ? '!' : S.items.tourou >= 5 ? '?' : null; }
      return S.sect === 'gaibang' && canLearnSect('gaibang') ? '!' : null;
  }
  return null;
}
const nameOf = id => (EQ[id] || ITEMS[id]).name;
function buy(who, ids, back) {
  const price = id => (EQ[id] ? EQ[id].price : ITEMS[id].buy);
  ask(who, `看中哪件？你身上有 ${S.silver} 两。`, ids.map(id => `${nameOf(id)} ${price(id)}两`).concat(['返回']), i => {
    if (i >= ids.length) return back();
    const id = ids[i];
    if (S.silver < price(id)) return say(who, `${nameOf(id)}要 ${price(id)} 两，你的银子不够。`, () => buy(who, ids, back));
    S.silver -= price(id); sfx('coin');
    if (EQ[id]) { S.gear.push(id); equipItem(id); save(); return say(who, `${nameOf(id)}已经给你穿戴上了。`, () => buy(who, ids, back)); }
    S.items[id] = (S.items[id] || 0) + 1; toast(`得到 ${nameOf(id)}`); save(); buy(who, ids, back);
  });
}
function spareGear() {
  const cnt = {};
  for (const id of S.gear) cnt[id] = (cnt[id] || 0) + 1;
  return Object.keys(cnt).filter(id => id !== 'buyi' && cnt[id] - (S.equip[EQ[id].slot] === id ? 1 : 0) > 0);
}
function sellMenu(who, buyer, back) {
  const list = Object.keys(ITEMS).filter(k => (buyer === 'any' ? ITEMS[k].sell > 0 && !ITEMS[k].book : ITEMS[k].buyer === buyer) && S.items[k] > 0).map(k => ({
    txt: `${ITEMS[k].name}×${S.items[k]} ${ITEMS[k].sell * S.items[k]}两`, go: () => { S.silver += ITEMS[k].sell * S.items[k]; S.items[k] = 0; },
  }));
  if (buyer === 'smith' || buyer === 'any') for (const id of spareGear()) list.push({ txt: `${EQ[id].name} ${EQ[id].sell}两`, go: () => { S.gear.splice(S.gear.indexOf(id), 1); S.silver += EQ[id].sell; } });
  const PER = 4, pages = Math.max(1, Math.ceil(list.length / PER)), pg = Math.min(sellMenu.pg || 0, pages - 1), shown = list.slice(pg * PER, pg * PER + PER);
  if (!list.length) { sellMenu.pg = 0; return say(who, '你身上没有我收的东西。', back); }
  const more = pages > 1 ? [`下一页（${pg + 1}/${pages}）`] : [];
  ask(who, '都按公道价收。', shown.map(l => l.txt).concat(more, ['返回']), i => {
    if (i === shown.length && more.length) { sellMenu.pg = (pg + 1) % pages; return sellMenu(who, buyer, back); }
    if (i >= shown.length) { sellMenu.pg = 0; return back(); }
    sellMenu.pg = pg; shown[i].go(); sfx('coin'); save(); sellMenu(who, buyer, back);
  });
}
/* 生产：成功率看熟练度，失败损耗一半材料；做得越多手艺越好 */
function craft(who, list, skill, back) {
  const v = lv(skill);
  const rate = d => Math.round(clamp(60 + v * 0.8 - d, 10, 98));
  const matTxt = m => Object.entries(m).map(([k, n]) => `${ITEMS[k].name}${n}`).join('');
  ask(who, `你的${SK[skill].name}是 ${v.toFixed(2)}，手艺越好越不容易失败。`, list.map(([id, m, d]) => `${nameOf(id)} ${matTxt(m)} ${rate(d)}%`).concat(['返回']), i => {
    if (i >= list.length) return back();
    const [id, m, d] = list[i];
    const lack = Object.entries(m).find(([k, n]) => (S.items[k] || 0) < n);
    if (lack) return say(who, `${ITEMS[lack[0]].name}不够，要 ${lack[1]} 个，你只有 ${S.items[lack[0]] || 0} 个。`, () => craft(who, list, skill, back));
    const ok = Math.random() * 100 < rate(d);
    for (const [k, n] of Object.entries(m)) S.items[k] -= ok ? n : Math.ceil(n / 2);
    if (ok) {
      if (EQ[id]) S.gear.push(id); else S.items[id] = (S.items[id] || 0) + 1;
      train(skill, 8); sfx('coin'); save();
      say(who, `成了！得到 ${nameOf(id)}。${EQ[id] ? '在菜单“装备”里可以换上，多余的可以卖给兵器铺。' : ''}`, () => craft(who, list, skill, back));
    } else { train(skill, 3); sfx('hurt'); save(); say(who, '火候没掌握好，失败了……材料损耗了一半。', () => craft(who, list, skill, back)); }
  });
}
function innTalk() {
  const st = S.side.pengren || 0;
  const opts = ['住店（5两）', '打听消息（2两）', '卖野味'];
  opts.push(S.skills.pengren != null ? '做菜' : st === 1 ? `交鲫鱼（${S.items.jiyu}/3）` : '学做菜');
  opts.push('离开');
  ask('掌柜', '客官，住店吗？睡一晚，活力、内功、伤势全都养好。', opts, i => {
    const o = opts[i];
    if (o.startsWith('打听')) return buyRumor('掌柜');
    if (o === '卖野味') return sellMenu('掌柜', 'inn', innTalk);
    if (o === '做菜') return craft('掌柜', COOK, 'pengren', innTalk);
    if (o === '学做菜') return say('掌柜', ['想学我的手艺？', '先去池塘边钓三条鲫鱼来，我教你烤鱼、熬汤。'], () => { S.side.pengren = 1; toast('接受任务：三条鲫鱼'); });
    if (o.startsWith('交鲫鱼')) {
      if (S.items.jiyu < 3) return say('掌柜', `还差 ${3 - S.items.jiyu} 条。鱼竿在池塘边的老渔翁那儿买。`);
      S.items.jiyu -= 3; S.side.pengren = 2; learn('pengren'); save();
      return say('掌柜', ['好鱼！手艺传给你了。', '烤鱼一条鲫鱼；鱼汤再加一株草药；红烧鲤鱼要鲤鱼。吃了长活力、补体力。']);
    }
    if (i !== 0) return;
    if (S.silver < 5) return say('掌柜', '客官，您这银子……不太够啊。');
    S.silver -= 5; S.hp = maxHP(); S.mp = maxMP(); S.st = maxST(); S.parts = { head: maxPart(), arm: maxPart(), leg: maxPart() }; sfx('coin'); save();
    say('掌柜', '（一夜过去）客官精神饱满，伤也全好了！');
  });
}
function fisherTalk() {
  ask('老渔翁', '钓鱼讲究个耐心。浮标一沉，赶紧按 A 收竿！', [S.items.yugan ? '鱼竿（已有）' : '买鱼竿 20两', '卖鱼', '离开'], i => {
    if (i === 0) {
      if (S.items.yugan) return say('老渔翁', '你已经有鱼竿了。对着水面按 A 就能钓。', fisherTalk);
      if (S.silver < 20) return say('老渔翁', '二十两，少一文都不卖。');
      S.silver -= 20; S.items.yugan = 1; learn('diaoyu'); sfx('coin'); save();
      say('老渔翁', ['拿好！对着池塘、河水按 A 甩竿。', '浮标一沉、头上冒出“!”，马上按 A。钓得越多越熟练，咬钩时机越宽，金鲤也越常见。', '峨眉山的冰湖上还能冰钓，有冰鱼。']);
    } else if (i === 1) sellMenu('老渔翁', 'fisher', fisherTalk);
  });
}
function tailorTalk() {
  const who = '裁缝', st = S.side.fangzhi || 0;
  const opts = ['买棉花', '卖棉花'];
  opts.push(S.skills.fangzhi != null ? '缝制衣帽' : st === 1 ? `交棉花（${S.items.mianhua}/3）` : '学纺织');
  opts.push('离开');
  ask(who, '布庄裁缝，皮袄裘衣、帽子都能做。', opts, i => {
    const o = opts[i];
    if (o === '买棉花') { if (S.silver < 3) return say(who, '一斤棉花三两。'); S.silver -= 3; S.items.mianhua++; sfx('coin'); toast('棉花 +1'); return tailorTalk(); }
    if (o === '卖棉花') return sellMenu(who, 'tailor', tailorTalk);
    if (o === '缝制衣帽') return craft(who, TAILOR, 'fangzhi', tailorTalk);
    if (o === '学纺织') return say(who, ['学纺织，先认得棉花。', '牛家村南边的兔儿坡长着棉花，摘三朵来给我。'], () => { S.side.fangzhi = 1; toast('接受任务：三朵棉花'); });
    if (o.startsWith('交棉花')) {
      if (S.items.mianhua < 3) return say(who, `还差 ${3 - S.items.mianhua} 朵。`);
      S.items.mianhua -= 3; S.side.fangzhi = 2; learn('fangzhi'); save();
      return say(who, ['手巧！手艺教给你。', '棉布衫用棉花；毡帽用兔皮；兽皮袄、狐裘、熊皮甲、雪狼裘都用打来的皮子。', '越好的衣裳越难做，多缝几件手艺就上来了。']);
    }
  });
}
function smithTalk() {
  const st = S.side.duanzao || 0;
  const opts = ['买兵器', '买衣帽铁料', '卖东西'];
  opts.push(S.skills.duanzao != null ? '打造' : st === 1 ? `交狼皮（${S.items.langpi}/3）` : '学打铁');
  opts.push('离开');
  ask('张铁匠', '叮——当！刀剑枪锤、衣帽铁料，都有。', opts, i => {
    const o = opts[i];
    if (o === '买兵器') buy('张铁匠', ['tiejian', 'gangdao', 'changqiang', 'tiechui'], smithTalk);
    else if (o === '买衣帽铁料') buy('张铁匠', ['jinzhuang', 'changpao', 'douli', 'shengtie'], smithTalk);
    else if (o === '卖东西') sellMenu('张铁匠', 'smith', smithTalk);
    else if (o === '打造') craft('张铁匠', FORGE['兵器'], 'duanzao', smithTalk);
    else if (o === '学打铁') say('张铁匠', ['想学打铁？先让我看看你的胆量。', '去伏牛山脚弄三张狼皮来，我就教你。'], () => { S.side.duanzao = 1; toast('接受任务：三张狼皮'); });
    else if (o.startsWith('交狼皮')) {
      if (S.items.langpi < 3) return say('张铁匠', `还差 ${3 - S.items.langpi} 张狼皮。`);
      S.items.langpi -= 3; S.side.duanzao = 2; learn('duanzao'); save();
      say('张铁匠', ['好小子，有胆量！', '打兵器要生铁，我这有卖，黑松林里也能挖到。衣帽皮袄得找襄阳布庄的裁缝。', '打得越多手艺越好，就越不容易失败。']);
    }
  });
}
function peddlerTalk() {
  ask('货郎', '走南闯北，针头线脑、干粮伤药，应有尽有！', ['买东西', '卖东西', '打听消息（2两）', '离开'], i => {
    if (i === 0) buy('货郎', ['ganliang', 'yao', 'qingxin', 'dieda', 'jiu', 'shengtie'], peddlerTalk);
    else if (i === 1) sellMenu('货郎', 'any', peddlerTalk);
    else if (i === 2) buyRumor('货郎');
  });
}
function doctorTalk() {
  const st = S.side.lianyao || 0;
  const opts = ['买药', '卖药材'];
  opts.push(S.skills.lianyao != null ? '炼药' : st === 1 ? `交草药（${S.items.caoyao}/5）` : '学炼药');
  opts.push('离开');
  ask('孙郎中', '药铺治伤也补气。', opts, i => {
    const o = opts[i];
    if (o === '买药') buy('孙郎中', ['yao', 'qingxin', 'dieda'], doctorTalk);
    else if (o === '卖药材') sellMenu('孙郎中', 'doctor', doctorTalk);
    else if (o === '炼药') craft('孙郎中', BREW, 'lianyao', doctorTalk);
    else if (o === '学炼药') say('孙郎中', ['想学炼药？先认得草药再说。', '村南兔儿坡路边长着草药，对着它按 A 就能采。采五株来给我。'], () => { S.side.lianyao = 1; toast('接受任务：采五株草药'); });
    else if (o.startsWith('交草药')) {
      if (S.items.caoyao < 5) return say('孙郎中', `还差 ${5 - S.items.caoyao} 株。`);
      S.items.caoyao -= 5; S.side.lianyao = 2; learn('lianyao'); save();
      say('孙郎中', ['认得不错，炼药的法子教给你。', '铺子里只卖基础药，药力慢。好药得自己采药材来炼：三七、灵芝、雪莲、老山参，都在各地山里。', '炼得越多手艺越好，就越不容易失败。']);
    }
  });
}
function chiefTalk() {
  tutNext(5);
  const q = S.q, adv = n => { q.main = n; q.cnt = 0; sfx('level'); save(); };
  if (q.main >= CH1_END) return say('王村长', q.main === CH1_END ? ['襄阳城的百晓生托人捎话，说有要事找你。', '出村往西走就是襄阳城。'] : '少侠，有空常回村里看看。');
  if (q.main === 0) return say('王村长', ['少侠，你来得正好！', '练武之人，先从小处练起。村南兔儿坡野兔成群，去打五只来练练手。', '（菜单“状态”里能随时查看任务）'], () => { adv(1); toast('接受任务：打野兔'); });
  if (!mainDone()) {
    const left = MAIN[q.main].need - q.cnt;
    return say('王村长', [
      null, `野兔还差 ${left} 只。从村子南口出去就是兔儿坡。`, `野狼还差 ${left} 只。出村往东就是伏牛山脚。`,
      '黑风寨在河东。过了木桥往东，再往北就是。', '黑松林在伏牛山脚南边。猛虎凶得很，带够金创药。', '少侠，有空常回村里看看。'][q.main]);
  }
  if (q.main === 1) say('王村长', ['手脚挺利落！这两瓶金创药拿着。', '下一件正事：村东伏牛山脚野狼成群，伤了好几头牛，去除掉五只。'], () => { S.items.yao += 2; S.silver += 15; toast('金创药×2 银两+15'); adv(2); });
  else if (q.main === 2) say('王村长', ['好！少年英雄！', '这把铁剑是早年一位过路剑客留下的，送你了。装备上就能练剑法。', '还有一事：山贼头子“黑风寨主”盘踞在河东，你若有胆，替乡亲们除了这一害。'], () => { S.gear.push('tiejian'); S.silver += 30; toast('得到 铁剑 银两+30'); adv(3); });
  else if (q.main === 3) say('王村长', ['黑风寨主伏诛了？！牛家村上下，永远记得你的恩情。', '可最近猎户说，伏牛山脚往南的黑松林里出了一头猛虎……', '等你功夫再扎实些，去为民除害吧。'], () => { S.silver += 50; toast('银两+50'); adv(4); });
  else if (q.main === 4) say('王村长', ['打死了猛虎？你如今是名震一方的少侠了！', '—— 第一章 完 ——', '江湖还很大。拜个门派，把上乘武功练起来吧。', '村里清虚观的道长是全真教的，池塘边的鲁长老是丐帮的。', '别的门派嘛，去客栈、酒楼多打听打听。', '对了，襄阳城的百晓生托人捎话，说有要事找你。'], () => { hear('quanzhen'); hear('gaibang'); S.silver += 100; S.items.xugu += 3; toast('银两+100 续骨膏×3'); adv(5); });
}
/* 声望与称号 */
const REP_TITLES = [[0, '无名小卒'], [20, '初出茅庐'], [60, '小有名气'], [150, '名动一方'], [300, '威震江湖'], [600, '一代宗师']];
const SREP_TITLES = [[0, '记名弟子'], [20, '入室弟子'], [60, '精英弟子'], [150, '护法'], [300, '长老']];
const titleOf = (list, v) => list.reduce((a, [n, t]) => (v >= n ? t : a), list[0][1]);
function addRep(n, why) {
  const before = titleOf(REP_TITLES, S.rep);
  S.rep = Math.max(0, S.rep + n);
  const after = titleOf(REP_TITLES, S.rep);
  if (n > 0 && after !== before) { toast(`江湖声望：${after}`); sfx('level'); }
}
function addSrep(n) {
  if (!S.sect) return;
  const v0 = S.srep[S.sect] || 0, before = titleOf(SREP_TITLES, v0);
  S.srep[S.sect] = Math.max(0, v0 + n);
  const after = titleOf(SREP_TITLES, S.srep[S.sect]);
  if (n > 0 && after !== before) { toast(`${SECTS[S.sect].name}：升为${after}`); sfx('level'); toast('回师门领赏'); }
}
/* 门派升阶赏赐：入室弟子、精英弟子、护法、长老各一次 */
function rankGift(who, sect) {
  const v = S.srep[sect] || 0, got = S.gifts[sect] || (S.gifts[sect] = []), out = [];
  const give = (lvl, fn, text) => { if (v >= lvl && !got.includes(lvl)) { got.push(lvl); fn(); out.push(text); } };
  give(20, () => { S.items.qidan += 5; S.items.yao += 5; }, '入室弟子：回气丹×5、金创药×5');
  give(60, () => S.gear.push(SECTS[sect].gear), `精英弟子：本派兵器${EQ[SECTS[sect].gear].name}`);
  give(150, () => S.gear.push(SECTS[sect].camp === '正' ? 'jinsijia' : 'wucanyi'), `护法：镇派宝甲${EQ[SECTS[sect].camp === '正' ? 'jinsijia' : 'wucanyi'].name}`);
  give(300, () => { S.silver += 500; }, '长老：银两500');
  if (!out.length) return false;
  sfx('level'); save();
  say(who, ['你为本门出力不少，这是师门的赏赐。', ...out.map(t => `（${t}）`)], () => masterMenu(who, sect));
  return true;
}
const hasGift = sect => { const v = S.srep[sect] || 0, got = (S.gifts && S.gifts[sect]) || []; return [20, 60, 150, 300].some(l => v >= l && !got.includes(l)); };
function addAlign(z, x) { if (z) S.zheng = Math.max(0, S.zheng + z); if (x) S.xie = Math.max(0, S.xie + x); }
function joinSect(id, who) {
  if (SECT_FOE[id]) setTimeout(() => toast(`本门宿敌：${SECT_FOE[id].map(f => SECTS[f].name).join('、')}`), 1200);
  S.former = S.former.filter(x => x !== id);
  S.sect = id; S.side[id] = 2; sfx('level'); toast(`拜入 ${SECTS[id].name}`);
  const u = SECTS[id].uniform; if (!S.gear.includes(u)) S.gear.push(u); S.equip.body = u; toast(`换上${EQ[u].name}`);
  save();
  say(who, ['好！从今往后，你就是本门弟子。', '本门武功要基础扎实才学得会，到了门槛随时来找我。']);
}
/* 门派任务：采办、除害、巡山、送信，可反复接，涨门派声望 */
const MASTER_IDS = { quanzhen: 'tao', gaibang: 'lu', shaolin: 'fangzhang', emei: 'shitai', mingjiao: 'mjshi', riyue: 'chiyan', taohua: 'huadaozhu', wudang: 'wdzhang', huashanpai: 'hszhang', tangmen: 'tmzhu', gumu: 'sunpo', xingxiu: 'xxlao', wudu: 'lanjz' };
function npcInfo(id) { for (const m in NPCS) { const n = NPCS[m].find(x => x.id === id); if (n) return { name: n.name, map: m }; } return null; }
/* 门派宿敌：宿敌门派的弟子见了你就动手，你杀他们也长本门声望 */
const SECT_FOE = { gumu: ['quanzhen'], quanzhen: ['gumu'], tangmen: ['wudu'], wudu: ['tangmen'], emei: ['mingjiao'], mingjiao: ['emei'], huashanpai: ['riyue'], riyue: ['huashanpai'], shaolin: ['xingxiu'], xingxiu: ['shaolin'] };
const EN_SECT = { qzdizi: 'quanzhen', wuseng: 'shaolin', emeidizi: 'emei', jiaozhong: 'riyue', mjzhong: 'mingjiao', taohuadizi: 'taohua', wddizi: 'wudang', xxdizi: 'xingxiu', wdjz: 'wudu' };
const foeOf = kind => !!(S && S.sect && SECT_FOE[S.sect] && SECT_FOE[S.sect].includes(EN_SECT[kind]));
const foeKind = sect => (SECT_FOE[sect] || []).map(f => Object.keys(EN_SECT).find(k => EN_SECT[k] === f)).find(Boolean);
/* 各派自己的门务：带点本门的味道 */
const SECT_TASKS = {
  quanzhen: [['collect', 'caoyao', 6, '采草药给重阳宫炼丹'], ['kill', 'wolf', 5, '终南山下除狼']],
  gaibang: [['collect', 'tourou', 5, '给丐帮兄弟弄些兔肉'], ['kill', 'bandit', 4, '惩治欺负乞丐的山贼']],
  shaolin: [['collect', 'shengtie', 4, '采办生铁给寺里铸钟'], ['kill', 'boar', 5, '赶走糟蹋寺田的野猪']],
  emei: [['collect', 'xuelian', 1, '采一朵雪莲给师太入药'], ['collect', 'mianhua', 4, '采棉花给师姐妹缝冬衣']],
  wudang: [['collect', 'fengmi', 2, '采玉蜂蜜给道长配药'], ['kill', 'boar', 5, '武当山野猪糟蹋菜园']],
  huashanpai: [['collect', 'jingtie', 2, '采办精铁给剑阁铸剑'], ['kill', 'hsjianke', 3, '教训冒充本派的华山剑客']],
  tangmen: [['collect', 'sanqi', 3, '采三七配解药'], ['collect', 'shengtie', 4, '采办生铁打造暗器']],
  gumu: [['collect', 'fengmi', 3, '采蜜喂玉蜂'], ['collect', 'mianhua', 3, '采棉花织白衣']],
  xingxiu: [['kill', 'shalang', 4, '捉沙狼给老仙练毒'], ['collect', 'lingzhi', 2, '献灵芝给老仙炼神功']],
  wudu: [['collect', 'sanqi', 3, '采三七喂毒蛛'], ['kill', 'baozi', 3, '捉豹子取胆']],
  mingjiao: [['kill', 'wuseng', 3, '击退来犯的少林僧'], ['collect', 'shengtie', 4, '采办生铁打造圣火令']],
  riyue: [['kill', 'wuseng', 3, '击退来犯的少林僧'], ['collect', 'lingzhi', 2, '献灵芝给教主']],
  taohua: [['collect', 'liyu', 2, '钓鲤鱼给岛主下酒'], ['collect', 'caoyao', 5, '采草药培桃树']],
};
function newSectTask(sect) {
  const own = SECT_TASKS[sect], fk = foeKind(sect);
  if (fk && Math.random() < 0.3) return { type: 'kill', kind: fk, n: 2, cnt: 0, text: `教训宿敌${EN[fk].name}2人` };
  if (own && Math.random() < 0.5) { const [ty, k, n, text] = own[rnd(0, own.length - 1)]; return ty === 'collect' ? { type: 'collect', item: k, n, text } : { type: 'kill', kind: k, n, cnt: 0, text }; }
  const camp = SECTS[sect].camp, r = rnd(0, 3);
  if (r === 0) { const [item, n] = [['caoyao', 5], ['shengtie', 4], ['langpi', 3], ['jiyu', 3], ['mianhua', 4], ['zhurou', 3]][rnd(0, 5)]; return { type: 'collect', item, n, text: `采办${ITEMS[item].name}${n}份` }; }
  if (r === 1) { const [kind, n] = [['wolf', 5], ['boar', 4], ['bandit', 4], ['bear', 2], ['snowwolf', 2], ['fox', 6]][rnd(0, 5)]; return { type: 'kill', kind, n, cnt: 0, text: `除掉${EN[kind].name}${n}只` }; }
  if (r === 2) {
    if (camp === '中') return { type: 'kill', kind: 'bandit', n: 4, cnt: 0, text: '惩治山贼4个' };
    return { type: 'patrol', foe: camp === '正' ? '邪' : '正', n: 2, cnt: 0, text: camp === '正' ? '去黑木崖击退邪派2人' : '去嵩山或峨眉击退正派2人' };
  }
  const ids = Object.values(MASTER_IDS).concat(['baixiao', 'biaotou', 'jiaotou', 'chief']).filter(i => i !== MASTER_IDS[sect]);
  const to = ids[rnd(0, ids.length - 1)], info = npcInfo(to);
  return { type: 'letter', to, done: false, text: `送信给${MAPS[info.map].name}的${info.name}` };
}
function sectTaskDone(t) {
  if (!t) return false;
  if (t.type === 'collect') return (S.items[t.item] || 0) >= t.n;
  if (t.type === 'letter') return t.done;
  return t.cnt >= t.n;
}
function sectTaskMenu(who, sect, back) {
  back = back || (() => masterMenu(who, sect));
  const t = S.stask;
  if (t && t.sect === sect && sectTaskDone(t)) {
    if (t.type === 'collect') S.items[t.item] -= t.n;
    const gain = t.type === 'patrol' ? 8 : t.type === 'kill' ? 5 : 4, money = rnd(20, 40);
    S.stask = null; addSrep(gain); addRep(1); S.silver += money; sfx('coin'); save();
    return say(who, [`“${t.text}”办得好。`, `（门派声望+${gain} 银两+${money}）`], back);
  }
  if (t && t.sect === sect) return ask(who, `你的门务：${t.text}${t.cnt != null ? `（${t.cnt}/${t.n}）` : t.type === 'collect' ? `（有${S.items[t.item] || 0}/${t.n}）` : ''}`, ['继续', '放弃门务'], i => { if (i === 1) { S.stask = null; toast('放弃了门务'); } });
  const nt = newSectTask(sect); nt.sect = sect; S.stask = nt; toast(`门务：${nt.text}`); sfx('menu'); save();
  say(who, [`门里正好有件事：${nt.text}。`, '办妥了回来找我，或者交给主城的接引人也行。'], back);
}
function leaveSect(who, sect) {
  ask(who, [`真要离开${SECTS[sect].name}？`, '离开后，本派武功最多只能练到 49.99，第二式也会失去。以后回来，才能接着往上练。'], ['叛出师门', '算了'], i => {
    if (i !== 0) return;
    if (!S.former.includes(sect)) S.former.push(sect);
    S.sect = null;
    S.hunted[sect] = 3; addRep(-10);
    if (S.purge && S.purge.sect === sect) S.purge = null;
    let cut = 0;
    for (const k in S.skills) if (SK[k] && SK[k].sect === sect && S.skills[k] > 49.99) { S.skills[k] = 49.99; cut++; }
    sfx('hurt'); save();
    say(who, [`好，你走吧。从今往后，你不再是${SECTS[sect].name}弟子。`, `（${SECTS[sect].name}发出追杀令：野外会有追兵找上你，击退三拨才算了结）`, cut ? '（本派武功已降到 49.99）' : '（本派武功以后最多练到 49.99）', '可以去拜别的门派了。']);
  });
}
function masterMenu(who, sect) {
  const ids = Object.keys(SK).filter(k => SK[k].sect === sect);
  const pg = S.purge && S.purge.sect === sect ? S.purge : null;
  if (pg && pg.done) {
    S.purge = null; addSrep(10); addRep(5); S.silver += 50;
    if (SECTS[sect].camp === '正') addAlign(3, 0); else if (SECTS[sect].camp === '邪') addAlign(0, 3);
    sfx('coin'); save();
    return say(who, ['叛徒伏诛，本门上下都记着你这份功劳。', '（门派声望+10 江湖声望+5 银两+50）'], () => masterMenu(who, sect));
  }
  const srep = S.srep[sect] || 0;
  if (hasGift(sect) && rankGift(who, sect)) return;
  const st = S.stask && S.stask.sect === sect ? S.stask : null;
  ask(who, `${titleOf(SREP_TITLES, srep)}（门派声望 ${srep}）。有什么事？`, ids.map(k => (S.skills[k] != null ? `${SK[k].name}（已学）` : SK[k].name)).concat([st ? (sectTaskDone(st) ? '交门务' : '门务中') : '门派任务', pg ? '门户任务中' : '清理门户', '叛出师门', '离开']), i => {
    if (i === ids.length) return sectTaskMenu(who, sect);
    if (i > ids.length) i -= 1;
    if (i === ids.length) {
      if (pg) return say(who, `叛徒逃到了${MAPS[pg.map].name}，去把他找出来。`, () => masterMenu(who, sect));
      const pool = PURGE_MAPS.filter(x => x !== map.id), m = pool[rnd(0, pool.length - 1)];
      S.purge = { sect, map: m, done: false }; toast(`清理门户：叛徒在${MAPS[m].name}`); save();
      return say(who, [`本门出了个叛徒，偷了武功秘要，逃到了${MAPS[m].name}。`, '去把他拿下，替本门清理门户！']);
    }
    if (i === ids.length + 1) return leaveSect(who, sect);
    if (i > ids.length + 1) return;
    const k = ids[i], again = () => masterMenu(who, sect);
    if (S.skills[k] != null) return say(who, '已经教过你了，好好练。', again);
    const why = reqFail(k);
    if (why) return say(who, `还不行。${why}`, again);
    learn(k); save();
    say(who, `好！这便传你${SK[k].name}。在菜单“武功”里选用。`);
  });
}
function taoTalk() {
  const who = '清虚道长';
  if (S.skills.quanzhen == null) {
    if (bestAtk() >= 5) return say(who, ['你的功夫已有些火候，可惜空有招式，没有内劲。', '贫道传你全真心法。四下无人时按 B 打坐，便会运转心法。', '心法越深，内功越足，元气也越旺。'], () => { learn('quanzhen'); S.passive['心法'] = 'quanzhen'; save(); });
    return say(who, ['年轻人，武功是一招一式练出来的。', `随便哪门拳脚兵器练到 5 级再来找我（现在最高 ${bestAtk().toFixed(2)}）。`]);
  }
  if (S.sect === 'quanzhen') return masterMenu(who, 'quanzhen');
  if (S.sect) return say(who, `你已是${SECTS[S.sect].name}弟子。若想改投全真，先回去向你师父叛出师门。`);
  if (lv('quanzhen') >= 10 && campBlock('quanzhen')) return say(who, campBlock('quanzhen'));
  if (lv('quanzhen') >= 10) return ask(who, ['你心法已有根基。可愿拜入我全真教门下？', '全真教传全真剑法、先天功。入了全真，便不能再投别派。'], ['拜入全真教', '再想想'], i => { if (i === 0) joinSect('quanzhen', who); });
  say(who, ['打坐时运转心法，回复更快，心法也会精进。', `心法练到 10 级，可来找贫道（现在 ${lv('quanzhen').toFixed(2)}）。`]);
}
function luTalk() {
  const who = '鲁长老';
  if (S.sect === 'gaibang') return masterMenu(who, 'gaibang');
  if (S.sect) return say(who, `你已是${SECTS[S.sect].name}弟子。想改投丐帮，先回去叛出师门。`);
  const st = S.side.gaibang || 0;
  if (campBlock('gaibang')) return say(who, campBlock('gaibang'));
  if (st === 0) return ask(who, ['嘿，小兄弟，老叫化饿了三天了。', '去村南兔儿坡打五块兔肉来，我便引你入丐帮。丐帮传降龙十八掌、混元功。'], ['好，这就去', '没空'], i => { if (i === 0) { S.side.gaibang = 1; toast('接受任务：五块兔肉'); } });
  if (S.items.tourou < 5) return say(who, `兔肉呢？还差 ${5 - S.items.tourou} 块。`);
  ask(who, ['香！够意思！', '入我丐帮，天下乞丐都是你兄弟。不过入了丐帮，就不能再投别派。'], ['拜入丐帮', '再想想'], i => { if (i === 0) { S.items.tourou -= 5; joinSect('gaibang', who); } });
}
const KID_TIPS = [
  '打架时按一下 A 就行，会自己追着最近的敌人打！',
  '拿什么兵器就练什么武功：拳、剑、刀、枪、锤，五样都能练。',
  '挨打能练铁布衫，走路能练草上飞，打坐能练心法！',
  '头、手臂、腿是分开受伤的。腿伤了跑不动，手伤了打不疼，头伤重了会昏过去！',
  '木人桩不会还手，可练到三十级就没用了，得去野外。',
  '鲁长老是丐帮的，他好像很爱吃兔肉。',
  '客栈掌柜消息最灵通，请他喝碗酒，什么都肯讲。',
  '天下有五大门派：全真、丐帮、少林、峨眉、明教。只能拜一个！',
  '襄阳城在村子西边，比咱们村大多了！',
  '按 SELECT 能在空手和身上的兵器之间换来换去。',
  '池塘边的老渔翁卖鱼竿，钓上来的鱼能卖钱，也能让客栈掌柜教你做菜。',
  '襄阳布庄的裁缝会做衣裳，兔儿坡的棉花和打来的皮子都用得上。',
  '每长一岁元气就涨，活力、体力、伤势上限都跟着涨。',
  '襄阳的百晓生专给年轻人出历练题，过一关元气就涨一截。',
  '江湖分正、邪、中立。正派在嵩山、峨眉，邪派在黑木崖，桃花岛谁也不帮。',
  '叛出师门的人，会被原来的门派派人追杀！',
  '入了门派就有本派的衣服穿，一眼就看得出是哪派的人。',
  '多帮师父办门务，门派声望高了，师父会赏兵器宝甲！',
  '孙郎中说兔儿坡的草药能炼成金创药。',
  '听说伏牛山脚有个旧箱子，没人敢去开……',
];
function kidTalk() { say('小虎', KID_TIPS[S.kidTip % KID_TIPS.length]); S.kidTip++; }

