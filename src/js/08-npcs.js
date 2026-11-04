/* ---------------- NPCs & quests ---------------- */
const NPCS = {
  village: [
    { id: 'inn', name: '掌柜', role: '客栈', icon: '宿', x: 5, y: 5, dir: 'down', look: { body: 'apron', hair: 'cap' }, talk: innTalk },
    { id: 'smith', name: '张铁匠', role: '兵器铺', icon: '兵', x: 12, y: 5, dir: 'down', look: { body: 'vest', hair: 'band' }, talk: smithTalk },
    { id: 'doctor', name: '孙郎中', role: '药铺', icon: '药', x: 19, y: 5, dir: 'down', look: { body: 'changpao', hair: 'fangjin' }, talk: doctorTalk },
    { id: 'chief', name: '王村长', role: '村长', icon: '村', x: 5, y: 13, dir: 'down', look: { body: 'heipao', hair: 'knot', beard: true }, talk: chiefTalk },
    { id: 'tao', name: '清虚道长', role: '全真教', icon: '道', x: 19, y: 13, dir: 'down', look: { body: 'daopao', hair: 'crown', beard: true }, talk: taoTalk },
    { id: 'lu', name: '鲁长老', role: '丐帮', icon: '丐', x: 15, y: 8, dir: 'left', look: { body: 'patched', hair: 'messy', beard: true }, talk: luTalk },
    { id: 'fisher', name: '老渔翁', role: '钓鱼', icon: '渔', x: 12, y: 9, dir: 'right', look: { body: 'buyi', hat: 'douli', beard: true }, talk: fisherTalk },
    { id: 'kid', name: '小虎', role: '村童', x: 8, y: 7, dir: 'right', look: { body: 'buyi', hair: 'bun' }, talk: kidTalk },
  ],
  xiangyang: [
    { id: 'jiulou', name: '酒楼掌柜', role: '酒楼', icon: '酒', x: 6, y: 11, dir: 'down', look: { body: 'apron', hair: 'cap' }, talk: jiulouTalk },
    { id: 'mjshi', name: '黑衣客', role: '明教', icon: '明', x: 2, y: 11, dir: 'right', look: { body: 'mjrobe', hat: 'douli', beard: true }, talk: () => sectTalk('黑衣客', 'mingjiao') },
    { id: 'bank', name: '钱庄掌柜', role: '钱庄', icon: '钱', x: 12, y: 11, dir: 'down', look: { body: 'heipao', hair: 'fangjin' }, talk: bankTalk },
    { id: 'pawn', name: '当铺朝奉', role: '当铺', icon: '当', x: 22, y: 11, dir: 'down', look: { body: 'changpao', hair: 'fangjin', beard: true }, talk: pawnTalk },
    { id: 'jiaotou', name: '武馆教头', role: '武馆', icon: '武', x: 28, y: 11, dir: 'down', look: { body: 'jinzhuang', hair: 'band' }, talk: jiaotouTalk },
    { id: 'caifeng', name: '裁缝', role: '布庄', icon: '布', x: 14, y: 20, dir: 'down', look: { body: 'changpao', hair: 'bun' }, talk: tailorTalk },
    { id: 'biaotou', name: '总镖头', role: '镖局', icon: '镖', x: 7, y: 20, dir: 'down', look: { body: 'armor', hat: 'helmet' }, talk: biaotouTalk },
    { id: 'envoy_zheng', name: '正派接引使', role: '门派接引', icon: '引', x: 20, y: 14, dir: 'down', look: { body: 'changpao', hair: 'crown', beard: true }, talk: () => envoyTalk('正') },
    { id: 'baixiao', name: '百晓生', role: '历练', icon: '历', x: 16, y: 14, dir: 'down', look: { body: 'changpao', hair: 'fangjin', beard: true }, talk: baixiaoTalk },
    { id: 'guard1', name: '守城兵', role: '襄阳守军', x: 29, y: 14, dir: 'left', look: { body: 'armor', hat: 'helmet' }, talk: () => say('守城兵', ['襄阳是天下重镇，城里规矩多，别惹事。', '钱存在钱庄，就算在外面昏倒也丢不了。']) },
    { id: 'guard2', name: '守城兵', role: '襄阳守军', x: 2, y: 14, dir: 'right', look: { body: 'armor', hat: 'helmet' }, talk: () => say('守城兵', ['出西门是潼关，边关要地，正邪两派常在那里交手。', '过了潼关往西是终南山，再往南走蜀道就到峨眉。']) },
  ],
  heimuya: [
    { id: 'chiyan', name: '赤炎长老', role: '日月神教', icon: '日', x: 13, y: 18, dir: 'down', look: { body: 'mjrobe', hair: 'messy', beard: true }, talk: () => sectTalk('赤炎长老', 'riyue') },
  ],
  taohua: [
    { id: 'huadaozhu', name: '花岛主', role: '桃花岛', icon: '桃', x: 13, y: 7, dir: 'down', look: { body: 'changpao', hair: 'crown', beard: true }, talk: () => sectTalk('花岛主', 'taohua') },
    { id: 'ferry2', name: '船夫', role: '渡口', icon: '船', x: 11, y: 16, dir: 'down', look: { body: 'buyi', hat: 'douli' }, talk: () => ferryTalk('hangzhou') },
  ],
  songshan: [
    { id: 'fangzhang', name: '玄慈方丈', role: '少林寺', icon: '少', x: 12, y: 7, dir: 'down', look: { body: 'kasaya', hair: 'bald', beard: true }, talk: () => sectTalk('玄慈方丈', 'shaolin') },
    { id: 'zhike', name: '知客僧', role: '少林寺', x: 11, y: 12, dir: 'down', look: { body: 'sengyi', hair: 'bald' }, talk: () => say('知客僧', ['阿弥陀佛。施主是来礼佛，还是来学武？', '方丈说，基础护体练到十级、筋骨结实的人，才能入少林。']) },
  ],
  emei: [
    { id: 'shitai', name: '静慧师太', role: '峨眉派', icon: '峨', x: 6, y: 6, dir: 'down', look: { body: 'nun', hair: 'hood' }, talk: () => sectTalk('静慧师太', 'emei') },
    { id: 'nun2', name: '小师父', role: '峨眉派', x: 15, y: 6, dir: 'down', look: { body: 'nun', hair: 'hood' }, talk: () => say('小师父', ['我们峨眉弟子个个身轻如燕。', '基础步法练到十级，师太才肯收你。']) },
  ],
};
for (const id in GEN) if (GEN[id].npcDefs.length) NPCS[id] = (NPCS[id] || []).concat(GEN[id].npcDefs);
/* 门派：入门条件 + 本派武功。全真、丐帮有自己的对话，其余三派用同一套流程 */
/* 阵营：正派不收邪气重的人；日月神教要先沾点邪气；桃花岛只收不偏不倚、有一技之长的人 */
const campOf = () => (S.sect ? SECTS[S.sect].camp : null);
const bestCraft = () => Math.max(0, ...['caiji', 'diaoyu', 'fangzhi', 'pengren', 'lianyao', 'duanzao'].map(lv));
function campBlock(sect) {
  const c = SECTS[sect].camp;
  if (c === '正' && S.xie >= 30) return `你邪气太重（邪气 ${S.xie}），${SECTS[sect].name}不收。`;
  if (c === '邪' && S.zheng >= 60) return `你一身正气（正气 ${S.zheng}），${SECTS[sect].name}信不过你。`;
  return null;
}
const SECT_JOIN = {
  riyue: { ok: () => S.xie >= 10, need: () => `邪气要到 10（现在 ${S.xie}）。去嵩山、峨眉杀几个正派弟子再来。`, pitch: ['日出东方，唯我不败。本教传黑血神针、吸星大法。', '入了神教，便不能再投别派。'] },
  taohua: { ok: () => S.zheng < 30 && S.xie < 30 && bestCraft() >= 15, need: () => `桃花岛只收不偏不倚、有一技之长的人：正气、邪气都在 30 以下，任一副职业 15 级（现在最高 ${bestCraft().toFixed(2)}）。`, pitch: ['岛主不问正邪，只看人才。本岛传落英神剑掌、奇门身法。', '入了桃花岛，便不能再投别派。'] },
  shaolin: { ok: () => lv('tiebushan') >= 10, need: () => `基础护体要练到 10 级（现在 ${lv('tiebushan').toFixed(2)}）。`, pitch: ['阿弥陀佛。少林传韦陀杵、易筋经。', '入了少林，便不能再投别派。'] },
  emei: { ok: () => lv('caoshangfei') >= 10, need: () => `基础步法要练到 10 级（现在 ${lv('caoshangfei').toFixed(2)}）。`, pitch: ['峨眉传灭剑、踏雪无痕。', '入了峨眉，便不能再投别派。'] },
  wudang: { ok: () => lv('quanzhen') >= 15, need: () => `内功要有根基：基础心法练到 15 级（现在 ${lv('quanzhen').toFixed(2)}）。`, pitch: ['（道长捋须微笑）太极之道，以柔克刚，后发先至。', '武当传太极剑、太极拳、梯云纵。入了武当，便不能再投别派。'] },
  huashanpai: { ok: () => lv('huashan') >= 20, need: () => `基础剑法要练到 20 级（现在 ${lv('huashan').toFixed(2)}）。`, pitch: ['华山派以剑立派，剑法要有底子。', '本派传玉女十九剑、紫霞神功。入了华山，便不能再投别派。'] },
  tangmen: { ok: () => lv('lianyao') >= 10, need: () => `唐门用毒，先懂药性：炼药要到 10 级（现在 ${lv('lianyao').toFixed(2)}）。`, pitch: ['唐门暗器毒药，天下第一。', '本门传漫天花雨、百毒不侵功。入了唐门，便不能再投别派。'] },
  gumu: { ok: () => lv('caiji') >= 15, need: () => `墓里要养玉蜂、采花蜜：采集要到 15 级（现在 ${lv('caiji').toFixed(2)}）。`, pitch: ['（孙婆婆打量着你）古墓派从不收外人……', '你若真心，便传你玉女素心剑、天罗地网势、玉女心经。入了古墓，便不能再投别派。'] },
  xingxiu: { ok: () => S.xie >= 20, need: () => `星宿派只收心狠手辣的人：邪气要到 20（现在 ${S.xie}）。`, pitch: ['星宿老仙，法驾中原，神通广大，法力无边！', '本派传抽髓掌、化功大法。入了星宿，便不能再投别派。'] },
  wudu: { ok: () => lv('lianyao') >= 15 && S.xie >= 10, need: () => `五毒教只收敢碰毒物的人：炼药 15 级、邪气 10（现在 ${lv('lianyao').toFixed(2)}、${S.xie}）。`, pitch: ['（蓝教主手腕上缠着一条小青蛇）哟，又来个不怕死的。', '本教传千蛛万毒手、五毒神功。入了五毒教，便不能再投别派。'] },
  mingjiao: { ok: () => !!S.flags.boss, need: () => '先去伏牛山脚除掉黑风寨主，让我看看你的本事。', pitch: ['（他压低斗笠）在下明教中人。', '本教传烈火刀法、乾坤大挪移。入了明教，便不能再投别派。'] },
};
/* 打听：门派和奇人的消息，只能从客栈、酒楼、百晓生、村长嘴里听来。听过的记在“江湖”页的门派见闻里 */
const RUMORS = {
  quanzhen: '牛家村东头的清虚观住着全真教的清虚道长。他先教心法，心法练到 10 级才肯收徒。终南山重阳宫是全真总坛。',
  gaibang: '丐帮的鲁长老常在牛家村池塘边晒太阳，嘴馋得很，最爱吃兔肉。洛阳城里是丐帮总舵。',
  shaolin: '少林寺在嵩山，从洛阳往西北上山。方丈只收筋骨结实的人——基础护体要练到 10 级。',
  emei: '峨眉派在峨眉山，从终南山往南走蜀道。师太只收身轻如燕的人——基础步法要 10 级。',
  mingjiao: '襄阳酒楼门口常有个戴斗笠的黑衣客，听说是明教的人，只看得上除掉过黑风寨主的好汉。明教总坛在西域光明顶。',
  riyue: '日月神教总坛在黑木崖，出山海关往北。他们只收手上沾过血的人（邪气 10）。',
  taohua: '杭州西湖边有船去桃花岛。岛主不问正邪，只收不偏不倚、身怀一技之长的人。',
  wudang: '兔儿坡一直往南就是武当山。紫霄宫的冲虚道长讲究以柔克刚，只收内功有根基的人（基础心法 15 级）。',
  huashanpai: '华山玉女峰上是华山派。岳先生只收剑法有底子的人（基础剑法 20 级）。',
  tangmen: '蜀道深处有座唐家堡，就是唐门。唐门用毒用暗器，入门先要懂药性（炼药 10 级）。',
  gumu: '终南山后山有座活死人墓，墓里的人从不出来。听说守墓的孙婆婆在找会采蜜的帮手（采集 15 级）。',
  xingxiu: '大漠深处的星宿海，有个自称“星宿老仙”的怪人，门下全是心狠手辣之辈（邪气 20）。',
  wudu: '蜀道往东南是苗疆，五毒教的蓝教主就住在那儿，只收敢碰毒物的人（炼药 15 级、邪气 10）。',
  dugu: '华山之巅有个姓风的老头，听说剑法高得吓人。可他只跟剑法练到化境的人说话（基础剑法 60 级）。',
  yuanyue: '杭州有座听雨楼，楼主人从不露面。有人说他的刀法，叫“小楼一夜听春雨”。',
  feidao: '平定州快活楼前，有个整天咳嗽喝酒的落魄书生。有人见过他出手——一刀，例不虚发。',
  lingxi: '扬州望江楼前常有位留着四条眉毛的公子。别人的刀剑，他两根手指就夹住了。',
  anran: '绝情谷的湖边，有个独臂的人一坐就是许多年，像在等什么人。',
  v_yuebuqun: '华山思过崖的山洞里，有人见过“君子剑”岳不群鬼鬼祟祟进出。听说他身上藏着辟邪剑谱。',
  v_dongfang: '黑木崖上有个洞口通往成德殿，东方不败就在里头绣花。葵花宝典，天下第一快的功夫。',
  v_zuolengchan: '嵩山派掌门左冷禅进了蜀道的剑冢，想夺古剑。他的寒冰真气冻得死人。',
  v_ouyangfeng: '大漠沙城的地宫里住着个倒立走路的疯子，自称欧阳锋，会蛤蟆功。',
  v_limochou: '绝情谷南边常见一个白衣道姑，一身毒掌，人称赤练仙子李莫愁。',
  v_gongsun: '绝情谷主公孙止，刀剑互换，阴阳倒乱刃法天下罕见。',
  v_jiumozhi: '苗疆深林里有个吐蕃番僧鸠摩智，隔空一掌就是一道火焰刀。',
  v_jinlun: '雁门关外是蒙古国师金轮法王的营帐，他的龙象般若功据说已练到第十层。',
  v_xuedao: '血刀老祖在黑松林一带出没，身上带着一本血刀经。',
};
/* 奇人：没有门派，找到人、够格了才肯传功 */
const HERMITS = {
  dugu: { npc: 'fenglao', name: '风老', where: '华山之巅', skill: 'dugu', ok: () => lv('huashan') >= 60, need: () => `（他看了你出剑）剑法还嫩，基础剑法练到 60 级再来（现在 ${lv('huashan').toFixed(2)}）。`,
    talk: ['能爬上华山之巅的，都不是寻常人物。', '剑招是死的，人是活的。'], teach: ['你的剑，有点意思。', '老夫传你九剑：无招胜有招，以无招破有招。'] },
  yuanyue: { npc: 'tingyu', name: '听雨楼主', where: '杭州听雨楼', skill: 'yuanyue', ok: () => lv('wuhu') >= 50, need: () => `（帘后传来一声冷笑）连基础刀法都没练到 50 级（现在 ${lv('wuhu').toFixed(2)}），也配看我的刀？`,
    talk: ['小楼一夜听春雨，深巷明朝卖杏花。'], teach: ['（帘子掀开，刀光如一弯新月）', '这一刀，叫“小楼一夜听春雨”。你看清了吗？'] },
  feidao: { npc: 'shusheng', name: '落魄书生', where: '平定州快活楼', skill: 'feidao', ok: () => lv('wuhu') >= 40 && S.rep >= 30, need: () => `（他咳了几声）刀要练到心里去。基础刀法 40 级、江湖声望 30，再来陪我喝酒（现在 ${lv('wuhu').toFixed(2)}、${S.rep}）。`,
    talk: ['（他咳嗽着，又灌了一口酒）'], teach: ['（他手中多了一柄三寸七分的小刀）', '出手要准，心要正。我的刀，从不虚发。'] },
  lingxi: { npc: 'simei', name: '四眉公子', where: '扬州望江楼', skill: 'lingxi', ok: () => lv('changquan') >= 50, need: () => `（他笑着摸了摸胡子）你的拳头还不够快，基础拳法 50 级再来（现在 ${lv('changquan').toFixed(2)}）。`,
    talk: ['我这人没什么本事，就是朋友多、麻烦多。'], teach: ['看好了，两根手指，就这么一夹。', '这叫灵犀一指。心到，指到。'] },
  anran: { npc: 'dubi', name: '独臂人', where: '绝情谷湖边', skill: 'anran', ok: () => lv('changquan') >= 60 && S.age >= 35, need: () => `（他望着湖水，没有回头）你还年轻，不懂相思。等你 35 岁、基础拳法 60 级再来（现在 ${S.age} 岁、${lv('changquan').toFixed(2)}）。`,
    talk: ['十六年……就快十六年了。'], teach: ['（他转过身，袖管空空荡荡）', '这套掌法，是我在相思最苦的时候创的。', '心中越是黯然，掌力越强。'] },
};
function hear(id) { if (S && RUMORS[id] && !S.heard.includes(id)) { S.heard.push(id); toast('记入门派见闻'); } }
function hermitTalk(id) {
  const h = HERMITS[id], k = h.skill; hear(id);
  if (S.skills[k] != null) return say(h.name, [...h.talk, '该教的都教你了，去吧。']);
  if (!h.ok()) return say(h.name, [...h.talk, h.need()]);
  const why = reqFail(k); if (why) return say(h.name, [...h.talk, `还差一点火候。${why}`]);
  ask(h.name, h.teach, [`学${SK[k].name}`, '告辞'], i => { if (i === 0) { learn(k); save(); say(h.name, `去吧。${SK[k].name}在菜单“武功”里选用。`); } });
}
/* 讲一条还没听过的消息；pref = 'sect' 时先讲门派 */
function tellRumor(who, pref, back) {
  const left = Object.keys(RUMORS).filter(k => !S.heard.includes(k));
  if (!left.length) return say(who, '江湖上的事，你知道的已经不比我少了。', back);
  const sects = left.filter(k => SECTS[k]), pool = pref === 'sect' && sects.length ? sects : (sects.length && Math.random() < 0.7 ? sects : left);
  const k = pool[rnd(0, pool.length - 1)];
  hear(k); save();
  say(who, ['听说……', RUMORS[k]], back);
}
/* 门派接引人：各阵营主城都有一位。新人在这里就能拜入本阵营门派、学一门入门武功、交接门务；
   高深武功、叛出师门、清理门户，还得亲自去总坛找掌门 */
const ENVOY = {
  正: { who: '正派接引使', sects: ['shaolin', 'emei', 'wudang', 'huashanpai'], note: '全真教、丐帮的师父就在牛家村，直接去找他们。' },
  邪: { who: '邪派接引使', sects: ['riyue', 'mingjiao', 'xingxiu', 'wudu'], note: '明教在襄阳酒楼门口也有人招人。' },
  中: { who: '中立接引使', sects: ['taohua', 'tangmen', 'gumu'], note: '' },
};
const introSkill = sect => Object.keys(SK).find(k => SK[k].sect === sect && ATK_CATS.includes(SK[k].cat));
