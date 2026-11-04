/* ---------------- data ---------------- */
const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };
const OPP = { up: 'down', down: 'up', left: 'right', right: 'left' };
const SOLID = new Set(['J', 'q', 'T', 'M', '~', 'R', '#', 'D', 'F', 'r', 'S', 'X', 'H', 'O', '*', '&', 'm', 'W', 'Q', 'P', 'k', 'c', 'i', 'o']);
/* 可采集：草药、灵芝、矿石。采完要等一阵才会再长出来 */
const RES_TILES = {
  '*': { item: 'caoyao', n: [1, 1], regrow: 60 * 90, msg: '采到一株草药' },
  '&': { item: 'lingzhi', n: [1, 1], regrow: 60 * 300, msg: '采到一朵灵芝！' },
  'O': { item: 'shengtie', n: [1, 2], regrow: 60 * 180, msg: '敲下生铁' },
  'm': { item: 'mianhua', n: [1, 2], regrow: 60 * 120, msg: '摘到棉花' },
};
let depleted = {};

/* 武功：cat 决定用途；tier 2 是上乘武功，威力大、成长慢，要门派或秘籍才能学 */
const ATK_CATS = ['拳', '剑', '刀', '枪', '槌'];
/* 六档评级，和千年一样：特差 差 可 中 佳 优 */
const RT = ['特差', '差', '可', '中', '佳', '优'];
const RV = [0.6, 0.8, 0.95, 1.05, 1.2, 1.4];
const LOCS = ['身', '头', '手', '脚'];
/* 攻击武功：spd 攻击速度、rec 回击速度（挨打后多快能还手）、eva 闪躲、acc 命中、atk 身头手脚四处攻击力 */
const SK = {
  changquan: { name: '基础拳法', short: '拳法', cat: '拳', tier: 1, spd: 3, rec: 3, eva: 1, acc: 3, atk: [3, 1, 3, 1], move: '千斤坠', desc: '人人都会的拳脚，招式朴实平衡' },
  huashan: { name: '基础剑法', short: '剑法', cat: '剑', tier: 1, spd: 4, rec: 3, eva: 3, acc: 4, atk: [3, 4, 2, 1], move: '苍松迎客', desc: '入门剑法，轻快善刺头' },
  wuhu: { name: '基础刀法', short: '刀法', cat: '刀', tier: 1, spd: 2, rec: 1, eva: 1, acc: 2, atk: [4, 3, 4, 2], move: '猛虎下山', desc: '入门刀法，大开大合，收招慢' },
  yangjia: { name: '基础枪法', short: '枪法', cat: '枪', tier: 1, spd: 2, rec: 3, eva: 2, acc: 3, atk: [3, 2, 2, 4], reach: 2, move: '回马枪', desc: '入门枪法，远及两格善攻脚' },
  kaishan: { name: '基础槌法', short: '槌法', cat: '槌', tier: 1, spd: 1, rec: 1, eva: 0, acc: 1, atk: [5, 4, 3, 3], stun: 0.15, move: '力劈华山', desc: '入门锤法，一锤千钧，常打晕人' },
  xianglong: { name: '降龙十八掌', short: '降龙', cat: '拳', tier: 2, spd: 3, rec: 4, eva: 2, acc: 4, atk: [5, 4, 4, 3], move: '亢龙有悔', sect: 'gaibang', req: ['changquan', 30], qi: 20, desc: '丐帮镇帮绝学，掌力刚猛' },
  quanzhenjian: { name: '全真剑法', short: '全真', cat: '剑', tier: 2, spd: 5, rec: 4, eva: 4, acc: 5, atk: [4, 5, 3, 2], move: '一气化三清', sect: 'quanzhen', req: ['huashan', 30], qi: 20, desc: '全真教正宗剑法，快准灵动' },
  hujia: { name: '胡家刀法', short: '胡家', cat: '刀', tier: 2, spd: 4, rec: 3, eva: 2, acc: 3, atk: [5, 4, 5, 4], move: '八方藏刀式', req: ['wuhu', 30], qi: 20, desc: '刀势如风，四面八方伤人' },
  weituo: { name: '韦陀杵', short: '韦陀', cat: '槌', tier: 2, spd: 2, rec: 2, eva: 1, acc: 3, atk: [5, 5, 4, 4], stun: 0.25, move: '韦陀献杵', sect: 'shaolin', req: ['kaishan', 30], qi: 20, desc: '少林降魔杵法，一杵震人心魄' },
  miejian: { name: '灭剑', short: '灭剑', cat: '剑', tier: 2, spd: 5, rec: 3, eva: 4, acc: 4, atk: [3, 5, 4, 3], move: '金顶佛光', sect: 'emei', req: ['huashan', 30], qi: 20, desc: '峨眉绝学，剑走轻灵，招招夺命' },
  liehuo: { name: '烈火刀法', short: '烈火', cat: '刀', tier: 2, spd: 3, rec: 3, eva: 2, acc: 3, atk: [5, 5, 5, 4], move: '圣火燎原', sect: 'mingjiao', req: ['wuhu', 30], qi: 20, desc: '明教刀法，刀势如烈火燎原' },
  yuejia: { name: '岳家枪法', short: '岳家', cat: '枪', tier: 2, spd: 3, rec: 4, eva: 3, acc: 4, atk: [4, 3, 4, 5], reach: 2, move: '枪挑小梁王', req: ['yangjia', 30], qi: 20, desc: '岳武穆所传，枪出如龙' },
  tiebushan: { name: '基础护体', cat: '护体', tier: 1, def: [4, 1, 3, 3], info: '挨打时修炼', desc: '入门护体功，头是罩门' },
  hunyuan: { name: '混元功', cat: '护体', tier: 2, def: [5, 4, 4, 4], sect: 'gaibang', req: ['tiebushan', 30], qi: 25, info: '挨打时修炼', desc: '丐帮内家护体，周身一体' },
  qiankun: { name: '乾坤大挪移', cat: '护体', tier: 2, def: [4, 5, 5, 5], sect: 'mingjiao', req: ['tiebushan', 30], qi: 25, info: '挨打时修炼', desc: '明教神功，借力卸力' },
  caoshangfei: { name: '基础步法', cat: '步法', tier: 1, mv: 4, eva: 3, info: '走路时修炼', desc: '入门轻功，脚步轻快' },
  shenxing: { name: '神行百变', cat: '步法', tier: 2, mv: 5, eva: 5, req: ['caoshangfei', 20], info: '走路时修炼', desc: '身法变幻莫测，来去如风' },
  taxue: { name: '踏雪无痕', cat: '步法', tier: 2, mv: 5, eva: 4, sect: 'emei', req: ['caoshangfei', 30], info: '走路时修炼', desc: '峨眉轻功，雪上不留痕迹' },
  quanzhen: { name: '基础心法', cat: '心法', tier: 1, mp: 4, hp: 3, yq: 3, info: '打坐时修炼', desc: '入门心法，调息养气' },
  xiantian: { name: '先天功', cat: '心法', tier: 2, mp: 5, hp: 4, yq: 5, sect: 'quanzhen', req: ['quanzhen', 40], qi: 30, info: '打坐时修炼', desc: '王重阳独门内功，绵绵不绝' },
  yijin: { name: '易筋经', cat: '心法', tier: 2, mp: 3, hp: 5, yq: 5, sect: 'shaolin', req: ['quanzhen', 40], qi: 30, info: '打坐时修炼', desc: '少林至高内功，脱胎换骨' },
  caiji: { name: '采集', cat: '生产', info: '采药挖矿摘棉时修炼', desc: '熟练了常能多采到一份' },
  diaoyu: { name: '钓鱼', cat: '生产', info: '钓鱼时修炼', desc: '越熟练越好上钩，稀有鱼越多' },
  fangzhi: { name: '纺织', cat: '生产', info: '缝制衣帽时修炼', desc: '熟练度越高，越少失败' },
  pengren: { name: '烹饪', cat: '生产', info: '做菜时修炼', desc: '熟练度越高，越少失败' },
  bixie: { name: '辟邪剑法', short: '辟邪', cat: '剑', tier: 2, spd: 5, rec: 3, eva: 5, acc: 4, atk: [3, 5, 3, 3], move: '群邪辟易', req: ['huashan', 50], qi: 35, villain: 'yuebuqun', desc: '快如鬼魅，以快打慢' },
  heixue: { name: '黑血神针', short: '神针', cat: '拳', tier: 2, spd: 5, rec: 3, eva: 3, acc: 5, atk: [3, 4, 3, 3], reach: 2, poison: 0.25, move: '万针齐发', sect: 'riyue', req: ['changquan', 30], qi: 20, desc: '日月神教暗器，针上淬毒，两格外伤人' },
  xixing: { name: '吸星大法', cat: '心法', tier: 2, mp: 5, hp: 3, yq: 4, sect: 'riyue', req: ['quanzhen', 30], qi: 30, info: '打坐时修炼', desc: '化人内力为己用' },
  luoying: { name: '落英神剑掌', short: '落英', cat: '拳', tier: 2, spd: 5, rec: 3, eva: 4, acc: 4, atk: [4, 4, 4, 3], move: '落英缤纷', sect: 'taohua', req: ['changquan', 30], qi: 20, desc: '掌影如桃花纷落' },
  qimen: { name: '奇门身法', cat: '步法', tier: 2, mv: 4, eva: 5, sect: 'taohua', req: ['caoshangfei', 30], info: '走路时修炼', desc: '暗合奇门五行，身形难测' },
  lianyao: { name: '炼药', cat: '生产', info: '炼药时修炼', desc: '熟练度越高，越少失败' },
  tanzhi: { name: '弹指神通', short: '弹指', cat: '拳', tier: 2, spd: 4, rec: 3, eva: 3, acc: 5, atk: [3, 5, 3, 3], reach: 2, move: '碧海潮生', sect: 'taohua', req: ['changquan', 30], qi: 20, desc: '屈指一弹，两格外伤人' },
  /* 武当 */
  taijijian: { name: '太极剑', short: '太极', cat: '剑', tier: 2, spd: 3, rec: 5, eva: 5, acc: 4, atk: [4, 4, 4, 3], move: '三环套月', sect: 'wudang', req: ['huashan', 30], qi: 20, desc: '以柔克刚，后发先至' },
  taijiquan: { name: '太极拳', short: '太极', cat: '拳', tier: 2, spd: 3, rec: 5, eva: 5, acc: 4, atk: [4, 3, 4, 3], move: '揽雀尾', sect: 'wudang', req: ['changquan', 30], qi: 20, desc: '四两拨千斤，借力打力' },
  tiyunzong: { name: '梯云纵', cat: '步法', tier: 2, mv: 5, eva: 4, sect: 'wudang', req: ['caoshangfei', 30], info: '走路时修炼', desc: '武当轻功，凌空踏步直上云霄' },
  /* 唐门 */
  mantian: { name: '漫天花雨', short: '花雨', cat: '拳', tier: 2, spd: 4, rec: 2, eva: 2, acc: 5, atk: [3, 4, 3, 3], reach: 3, poison: 0.25, move: '佛怒唐莲', sect: 'tangmen', req: ['changquan', 30], qi: 20, desc: '唐门暗器手法，三格外取人，常带毒' },
  baidu: { name: '百毒不侵功', cat: '护体', tier: 2, def: [4, 4, 4, 4], sect: 'tangmen', req: ['tiebushan', 30], qi: 25, info: '挨打时修炼', desc: '唐门护体功，周身百毒难侵' },
  /* 华山派 */
  yunv19: { name: '玉女十九剑', short: '玉女', cat: '剑', tier: 2, spd: 5, rec: 3, eva: 4, acc: 5, atk: [3, 5, 3, 2], move: '有凤来仪', sect: 'huashanpai', req: ['huashan', 30], qi: 20, desc: '华山玉女峰剑法，奇险轻灵' },
  zixia: { name: '紫霞神功', cat: '心法', tier: 2, mp: 5, hp: 4, yq: 4, sect: 'huashanpai', req: ['quanzhen', 30], qi: 30, info: '打坐时修炼', desc: '华山气宗内功，紫气东来' },
  /* 古墓派 */
  suxin: { name: '玉女素心剑', short: '素心', cat: '剑', tier: 2, spd: 5, rec: 3, eva: 5, acc: 4, atk: [3, 4, 4, 3], move: '花前月下', sect: 'gumu', req: ['huashan', 30], qi: 20, desc: '古墓剑法，招招闲雅，处处杀机' },
  tianluo: { name: '天罗地网势', short: '天罗', cat: '拳', tier: 2, spd: 5, rec: 4, eva: 4, acc: 4, atk: [3, 3, 4, 3], move: '八十一只麻雀', sect: 'gumu', req: ['changquan', 30], qi: 20, desc: '掌影如网，飞鸟难逃' },
  yunvxin: { name: '玉女心经', cat: '心法', tier: 2, mp: 4, hp: 4, yq: 5, sect: 'gumu', req: ['quanzhen', 30], qi: 30, info: '打坐时修炼', desc: '古墓内功，清心寡欲方能大成' },
  /* 星宿派 */
  chousui: { name: '抽髓掌', short: '抽髓', cat: '拳', tier: 2, spd: 3, rec: 3, eva: 2, acc: 4, atk: [4, 4, 5, 4], poison: 0.3, move: '腐尸毒', sect: 'xingxiu', req: ['changquan', 30], qi: 20, desc: '掌中带毒，中者骨髓如焚' },
  huagong: { name: '化功大法', cat: '心法', tier: 2, mp: 5, hp: 3, yq: 4, sect: 'xingxiu', req: ['quanzhen', 30], qi: 30, info: '打坐时修炼', desc: '化人内力，阴毒无比' },
  /* 五毒教 */
  qianzhu: { name: '千蛛万毒手', short: '千蛛', cat: '拳', tier: 2, spd: 4, rec: 3, eva: 3, acc: 4, atk: [4, 4, 4, 3], poison: 0.35, move: '万毒噬心', sect: 'wudu', req: ['changquan', 30], qi: 20, desc: '以毒蛛练手，一抓剧毒入体' },
  wudushen: { name: '五毒神功', cat: '护体', tier: 2, def: [4, 4, 5, 4], sect: 'wudu', req: ['tiebushan', 30], qi: 25, info: '挨打时修炼', desc: '以五毒淬体，刀枪难入' },
  /* 奇人武功：没有门派，只能打听到高人所在，自己找上门去 */
  /* 反派的特殊武功：打败那个反派，有机会掉秘籍 */
  kuihua: { name: '葵花宝典', short: '葵花', cat: '剑', tier: 2, spd: 5, rec: 4, eva: 5, acc: 5, atk: [4, 5, 4, 3], move: '针落无声', req: ['huashan', 60], qi: 45, villain: 'dongfang', desc: '天下武功，唯快不破' },
  hanbing: { name: '寒冰真气', cat: '心法', tier: 2, mp: 5, hp: 4, yq: 5, req: ['quanzhen', 50], qi: 40, villain: 'zuolengchan', info: '打坐时修炼', desc: '左冷禅独门内功，阴寒入骨' },
  hama: { name: '蛤蟆功', short: '蛤蟆', cat: '拳', tier: 2, spd: 2, rec: 3, eva: 2, acc: 4, atk: [5, 5, 5, 4], stun: 0.2, move: '蛤蟆一跃', req: ['changquan', 50], qi: 40, villain: 'ouyangfeng', desc: '欧阳锋绝技，蓄势一击，势不可挡' },
  chilian: { name: '赤练神掌', short: '赤练', cat: '拳', tier: 2, spd: 4, rec: 3, eva: 3, acc: 4, atk: [4, 4, 5, 3], poison: 0.35, move: '赤练封喉', req: ['changquan', 55], qi: 40, villain: 'limochou', desc: '李莫愁毒掌，中掌者全身赤红' },
  yinyang: { name: '阴阳倒乱刃法', short: '阴阳', cat: '刀', tier: 2, spd: 4, rec: 4, eva: 3, acc: 4, atk: [5, 5, 5, 4], move: '刀剑倒乱', req: ['wuhu', 55], qi: 40, villain: 'gongsun', desc: '公孙止刀剑互换，虚实难测' },
  huoyan: { name: '火焰刀', short: '火焰', cat: '刀', tier: 2, spd: 3, rec: 3, eva: 2, acc: 4, atk: [5, 4, 5, 4], reach: 2, move: '火焰燎原', req: ['wuhu', 50], qi: 40, villain: 'jiumozhi', desc: '鸠摩智以掌力化刀气，两格外伤人' },
  xuedaofa: { name: '血刀刀法', short: '血刀', cat: '刀', tier: 2, spd: 4, rec: 3, eva: 3, acc: 4, atk: [5, 4, 5, 4], move: '血海翻腾', req: ['wuhu', 40], qi: 30, villain: 'xuedao', desc: '血刀老祖的邪门刀法，刀走偏锋' },
  longxiang: { name: '龙象般若功', short: '龙象', cat: '槌', tier: 2, spd: 2, rec: 2, eva: 1, acc: 4, atk: [5, 5, 5, 5], stun: 0.3, move: '龙象之力', req: ['kaishan', 50], qi: 40, villain: 'jinlun', desc: '金轮法王的密宗神功，一击有龙象之力' },
  dugu: { name: '独孤九剑', short: '独孤', cat: '剑', tier: 2, spd: 5, rec: 5, eva: 4, acc: 5, atk: [5, 5, 4, 4], move: '破剑式', req: ['huashan', 60], qi: 40, desc: '无招胜有招，专破天下武功' },
  yuanyue: { name: '圆月弯刀', short: '弯刀', cat: '刀', tier: 2, spd: 4, rec: 3, eva: 3, acc: 4, atk: [5, 5, 5, 5], move: '小楼一夜听春雨', req: ['wuhu', 50], qi: 40, desc: '魔刀出鞘，刀光如一弯新月' },
  feidao: { name: '小李飞刀', short: '飞刀', cat: '刀', tier: 2, spd: 3, rec: 2, eva: 3, acc: 5, atk: [4, 5, 4, 3], reach: 3, move: '例不虚发', req: ['wuhu', 40], qi: 30, desc: '出手一刀，例不虚发，三格外取人' },
  lingxi: { name: '灵犀一指', short: '灵犀', cat: '拳', tier: 2, spd: 4, rec: 5, eva: 5, acc: 5, atk: [3, 4, 5, 3], move: '心有灵犀', req: ['changquan', 50], qi: 30, desc: '两指一夹，天下兵刃无所遁形' },
  anran: { name: '黯然销魂掌', short: '黯然', cat: '拳', tier: 2, spd: 3, rec: 3, eva: 3, acc: 4, atk: [5, 5, 5, 5], move: '拖泥带水', req: ['changquan', 60], qi: 40, desc: '相思越苦，掌力越强' },
  duanzao: { name: '锻造', cat: '生产', info: '打造时修炼', desc: '熟练度越高，越少失败' },
};
const BASIC_OF = { 拳: 'changquan', 剑: 'huashan', 刀: 'wuhu', 枪: 'yangjia', 槌: 'kaishan' };
const CAT_ORDER = ['拳', '剑', '刀', '枪', '槌', '护体', '步法', '心法', '生产'];
const SECTS = {
  quanzhen: { name: '全真教', short: '全真', uniform: 'daopao', gear: 'xuantie', camp: '正', where: '牛家村清虚观' },
  gaibang: { name: '丐帮', short: '丐帮', uniform: 'patched', gear: 'jinsijia', camp: '正', where: '牛家村池塘边' },
  shaolin: { name: '少林寺', short: '少林', uniform: 'sengyi', gear: 'zijin', camp: '正', where: '嵩山' },
  emei: { name: '峨眉派', short: '峨眉', uniform: 'nun', gear: 'xuantie', camp: '正', where: '峨眉山' },
  mingjiao: { name: '明教', short: '明教', uniform: 'mjrobe', gear: 'tulong', camp: '邪', where: '襄阳酒楼' },
  riyue: { name: '日月神教', short: '日月', uniform: 'ryrobe', gear: 'xuantie', camp: '邪', where: '黑木崖' },
  taohua: { name: '桃花岛', short: '桃花', uniform: 'thshan', gear: 'bawang', camp: '中', where: '桃花岛' },
  wudang: { name: '武当派', short: '武当', uniform: 'wdpao', gear: 'xuantie', camp: '正', where: '武当山紫霄宫（兔儿坡往南）' },
  huashanpai: { name: '华山派', short: '华山', uniform: 'hsshan', gear: 'xuantie', camp: '正', where: '华山玉女峰' },
  tangmen: { name: '唐门', short: '唐门', uniform: 'tmjin', gear: 'jinsijia', camp: '中', where: '蜀道唐家堡' },
  gumu: { name: '古墓派', short: '古墓', uniform: 'gmbai', gear: 'wucanyi', camp: '中', where: '终南山后山活死人墓' },
  xingxiu: { name: '星宿派', short: '星宿', uniform: 'xxpao', gear: 'tulong', camp: '邪', where: '大漠星宿海' },
  wudu: { name: '五毒教', short: '五毒', uniform: 'wduyi', gear: 'zijin', camp: '邪', where: '苗疆（蜀道往东南）' },
};

const EN = {
  rabbit: { name: '野兔', lv: 1, hp: 30, atk: 0, dodge: 12, step: 26, mv: 1.25, sight: 0, cd: 60, passive: true, beast: 'rabbit', resp: 900 },
  fox: { name: '狐狸', lv: 8, hp: 70, atk: 4, dodge: 16, step: 22, mv: 1.25, sight: 4, cd: 65, beast: 'fox', resp: 1200 },
  wolf: { name: '野狼', lv: 18, hp: 140, atk: 7, dodge: 10, step: 20, mv: 1.25, sight: 5, cd: 70, beast: 'wolf', resp: 1500 },
  bandit: { name: '山贼', lv: 25, hp: 220, atk: 11, dodge: 8, step: 24, mv: 1, sight: 5, cd: 72, resp: 1800 },
  boss: { name: '黑风寨主', lv: 30, hp: 460, atk: 11.5, dodge: 10, step: 22, mv: 1, sight: 6, cd: 68, boss: true },
  bear: { name: '黑熊', lv: 35, hp: 450, atk: 17, dodge: 4, step: 28, mv: 0.9, sight: 4, cd: 85, beast: 'bear', resp: 2400 },
  tiger: { name: '猛虎', lv: 55, hp: 800, atk: 22, dodge: 12, step: 18, mv: 1.4, sight: 6, cd: 70, beast: 'tiger', resp: 3600 },
  boar: { name: '野猪', lv: 22, hp: 200, atk: 10, dodge: 6, step: 24, mv: 1.1, sight: 4, cd: 70, beast: 'boar', resp: 1500 },
  snowwolf: { name: '雪狼', lv: 32, hp: 320, atk: 15, dodge: 12, step: 18, mv: 1.3, sight: 6, cd: 66, beast: 'snowwolf', resp: 1800 },
  wuseng: { short: '少林', nick: '武僧', name: '少林武僧', lv: 30, hp: 380, atk: 15, dodge: 8, step: 22, mv: 1, sight: 5, cd: 70, camp: '正', look: { body: 'sengyi', hair: 'bald', weapon: 'tiechui' }, resp: 2400 },
  emeidizi: { short: '峨眉', nick: '弟子', name: '峨眉弟子', lv: 32, hp: 350, atk: 16, dodge: 14, step: 20, mv: 1.1, sight: 5, cd: 64, camp: '正', look: { body: 'nun', hair: 'hood', weapon: 'tiejian' }, resp: 2400 },
  jiaozhong: { short: '日月', nick: '教众', name: '日月教众', lv: 34, hp: 380, atk: 17, dodge: 10, step: 20, mv: 1.1, sight: 5, cd: 66, camp: '邪', look: { body: 'mjrobe', hair: 'band', mask: true, weapon: 'gangdao' }, resp: 2400 },
  taohuadizi: { short: '桃花', nick: '弟子', name: '桃花岛弟子', lv: 30, hp: 350, atk: 15, dodge: 14, step: 22, mv: 1.1, sight: 5, cd: 64, camp: '中', look: { body: 'changpao', hair: 'knot', weapon: 'qinggang' }, resp: 2400 },
  hunter: { name: '追兵', lv: 30, hp: 300, atk: 16, dodge: 10, step: 18, mv: 1.2, sight: 8, cd: 64, once: true, hunter: true, look: { body: 'jinzhuang', hair: 'band', mask: true, weapon: 'gangdao' } },
  pantu: { name: '叛徒', lv: 40, hp: 500, atk: 18, dodge: 10, step: 18, mv: 1.2, sight: 7, cd: 62, once: true, hunter: true, look: { body: 'heipao', hat: 'douli', mask: true, weapon: 'tiejian' } },
  jinmao: { name: '金毛使者', lv: 52, hp: 1000, atk: 18, dodge: 12, step: 18, mv: 1.2, sight: 7, cd: 62, once: true, flag: 'jinmao', intro: ['神教的狗腿子，也敢追到光明顶？', '尝尝我的金毛狮子吼！'], outro: ['我……我只是想替明教报仇……', '（他倒在地上，怀里掉出一封盖着正派印信的密信）'], look: { body: 'mjrobe', hair: 'messy', beard: true, weapon: 'tiechui' } },
  caobang: { name: '漕帮帮主', lv: 48, hp: 880, atk: 16, dodge: 10, step: 20, mv: 1.1, sight: 7, cd: 64, once: true, flag: 'caobang', intro: ['江南的水路，都得给我漕帮交买路钱！', '小子，你挡了老子的财路。'], outro: ['好……好功夫……', '（他手下的漕帮帮众一哄而散）'], look: { body: 'jinzhuang', hair: 'band', beard: true, weapon: 'gangdao' } },
  xuedao: { name: '血刀老祖', lv: 58, hp: 1050, atk: 21, dodge: 12, step: 18, mv: 1.2, sight: 7, cd: 62, once: true, flag: 'xuedao', intro: ['嘿嘿，又来一个送死的。', '老祖这口血刀，正缺人血开锋！'], look: { body: 'mjrobe', hair: 'bald', weapon: 'gangdao' } },
  shanfei: { name: '蜀道山匪', lv: 38, hp: 420, atk: 16, dodge: 8, step: 22, mv: 1, sight: 5, cd: 70, look: { body: 'shoupi', hair: 'band', mask: true, weapon: 'dao' }, resp: 2100 },
  baozi: { name: '金钱豹', lv: 45, hp: 520, atk: 19, dodge: 14, step: 18, mv: 1.4, sight: 6, cd: 66, beast: 'tiger', resp: 2400 },
  /* 地下图的怪；dboss 是地下图头目：不缩放，过一阵子还会再出来 */
  kuangfei: { name: '矿匪', lv: 30, hp: 300, atk: 12, dodge: 8, step: 22, mv: 1, sight: 5, cd: 70, look: { body: 'vest', hair: 'band', weapon: 'tiechui' }, resp: 1800 },
  kuangba: { name: '矿霸', lv: 45, hp: 900, atk: 18, dodge: 8, step: 22, mv: 1, sight: 5, cd: 66, dboss: true, look: { body: 'xiongpijia', hair: 'messy', beard: true, weapon: 'tiechui' }, resp: 60 * 60 * 6 },
  dongxiong: { name: '洞熊', lv: 50, hp: 650, atk: 20, dodge: 4, step: 28, mv: 0.9, sight: 4, cd: 80, beast: 'bear', resp: 2400 },
  xiongwang: { name: '熊王', lv: 65, hp: 2000, atk: 26, dodge: 6, step: 26, mv: 1, sight: 5, cd: 74, beast: 'bear', dboss: true, resp: 60 * 60 * 8 },
  /* 武侠反派：地下图、深山里的头目，过一阵子会再出现，打败有机会掉他的独门秘籍 */
  yuebuqun: { name: '岳不群', lv: 70, hp: 1800, atk: 24, dodge: 18, cd: 56, dboss: true, villain: true, sight: 6, step: 18, mv: 1.2, resp: 60 * 60 * 8, intro: ['（他微微一笑）在下华山岳不群，江湖人称君子剑。', '阁下来思过崖，想必也是为了那本剑谱吧？'], look: { body: 'hsshan', hair: 'crown', beard: true, weapon: 'qinggang' } },
  dongfang: { name: '东方不败', lv: 95, hp: 2700, atk: 30, dodge: 24, cd: 50, dboss: true, villain: true, sight: 6, step: 18, mv: 1.2, resp: 60 * 60 * 8, intro: ['（他手里拈着一根绣花针，头也不抬）', '多少年没人能走进成德殿了。你倒是有点意思。'], look: { body: 'thshan', hair: 'bun' } },
  zuolengchan: { name: '左冷禅', lv: 85, hp: 2400, atk: 27, dodge: 16, cd: 56, dboss: true, villain: true, sight: 6, step: 18, mv: 1.2, resp: 60 * 60 * 8, intro: ['五岳并派，我左冷禅当盟主，天经地义！', '剑冢里的剑，也该归我嵩山派。'], look: { body: 'heipao', hair: 'crown', beard: true, weapon: 'qinggang' } },
  ouyangfeng: { name: '欧阳锋', lv: 80, hp: 2200, atk: 26, dodge: 14, cd: 58, dboss: true, villain: true, sight: 6, step: 18, mv: 1.2, resp: 60 * 60 * 8, intro: ['（他倒立着，咕咕怪叫）', '谁？我是谁？……管他的，先吃我一招！'], look: { body: 'heipao', hair: 'messy', beard: true } },
  limochou: { name: '李莫愁', lv: 88, hp: 2500, atk: 28, dodge: 20, cd: 54, dboss: true, villain: true, sight: 6, step: 18, mv: 1.2, resp: 60 * 60 * 8, intro: ['问世间，情是何物……', '（她拂尘一扬）你也是来送死的？'], look: { body: 'gmbai', hair: 'bun' } },
  jiumozhi: { name: '鸠摩智', lv: 82, hp: 2250, atk: 26.5, dodge: 14, cd: 56, dboss: true, villain: true, sight: 6, step: 18, mv: 1.2, resp: 60 * 60 * 8, intro: ['小僧吐蕃鸠摩智，来中原求武学典籍。', '施主身上的武功，小僧也想借来一观。'], look: { body: 'kasaya', hair: 'bald' } },
  jinlun: { name: '金轮法王', lv: 75, hp: 2000, atk: 25, dodge: 10, cd: 60, dboss: true, villain: true, sight: 6, step: 18, mv: 1.2, resp: 60 * 60 * 8, intro: ['本座乃蒙古国师金轮法王。', '中原武林，不过如此！'], look: { body: 'kasaya', hair: 'bald', weapon: 'zijin' } },
  jianmo: { name: '剑魔残影', lv: 65, hp: 1600, atk: 25, dodge: 18, step: 18, mv: 1.2, sight: 6, cd: 56, dboss: true, look: { body: 'heipao', hair: 'messy', beard: true, weapon: 'qinggang' }, resp: 60 * 60 * 8 },
  jianling: { name: '剑冢游魂', lv: 75, hp: 900, atk: 26, dodge: 18, step: 18, mv: 1.2, sight: 6, cd: 58, look: { body: 'changpao', hair: 'messy', weapon: 'qinggang' }, resp: 2400 },
  jianshou: { name: '剑冢守灵', lv: 95, hp: 2700, atk: 30, dodge: 18, step: 18, mv: 1.2, sight: 7, cd: 54, dboss: true, look: { body: 'heipao', hair: 'crown', beard: true, weapon: 'xuantie' }, resp: 60 * 60 * 10 },
  shiwei: { name: '地宫尸卫', lv: 60, hp: 800, atk: 23, dodge: 8, step: 24, mv: 0.9, sight: 5, cd: 66, look: { body: 'armor', hat: 'helmet', weapon: 'gangdao' }, resp: 2400 },
  shiwang: { name: '地宫尸王', lv: 85, hp: 2400, atk: 27, dodge: 10, step: 22, mv: 1, sight: 6, cd: 60, dboss: true, look: { body: 'armor', hat: 'helmet', beard: true, weapon: 'tulong' }, resp: 60 * 60 * 10 },
  wddizi: { short: '武当', nick: '弟子', name: '武当弟子', lv: 40, hp: 420, atk: 17, dodge: 14, step: 20, mv: 1.1, sight: 5, cd: 64, camp: '正', look: { body: 'wdpao', hair: 'crown', weapon: 'tiejian' }, resp: 2400 },
  xxdizi: { short: '星宿', nick: '弟子', name: '星宿弟子', lv: 54, hp: 580, atk: 21, dodge: 12, step: 20, mv: 1.1, sight: 5, cd: 64, camp: '邪', look: { body: 'xxpao', hair: 'messy' }, resp: 2400 },
  wdjz: { short: '五毒', nick: '教众', name: '五毒教众', lv: 58, hp: 640, atk: 22, dodge: 12, step: 20, mv: 1.15, sight: 5, cd: 62, camp: '邪', look: { body: 'wduyi', hair: 'band', weapon: 'gangdao' }, resp: 2400 },
  qzdizi: { short: '全真', nick: '弟子', name: '全真弟子', lv: 36, hp: 400, atk: 16, dodge: 12, step: 20, mv: 1.1, sight: 5, cd: 66, camp: '正', look: { body: 'daopao', hair: 'crown', weapon: 'tiejian' }, resp: 2400 },
  mjzhong: { short: '明教', nick: '教众', name: '明教教众', lv: 42, hp: 450, atk: 18, dodge: 10, step: 20, mv: 1.1, sight: 5, cd: 66, camp: '邪', look: { body: 'mjrobe', hair: 'band', weapon: 'gangdao' }, resp: 2400 },
  mazei: { name: '马贼', lv: 50, hp: 600, atk: 20, dodge: 10, step: 20, mv: 1.2, sight: 6, cd: 66, look: { body: 'jinzhuang', hair: 'band', mask: true, weapon: 'gangdao' }, resp: 2400 },
  shalang: { name: '沙狼', lv: 52, hp: 560, atk: 21, dodge: 14, step: 18, mv: 1.35, sight: 6, cd: 64, beast: 'wolf', resp: 2100 },
  shafei: { name: '沙匪', lv: 56, hp: 680, atk: 22, dodge: 10, step: 20, mv: 1.1, sight: 6, cd: 66, look: { body: 'shoupi', hat: 'douli', mask: true, weapon: 'dao' }, resp: 2400 },
  cylang: { name: '草原狼', lv: 60, hp: 650, atk: 23, dodge: 14, step: 18, mv: 1.4, sight: 7, cd: 62, beast: 'wolf', resp: 2100 },
  menggu: { name: '蒙古骑兵', lv: 66, hp: 820, atk: 24, dodge: 10, step: 18, mv: 1.2, sight: 7, cd: 64, look: { body: 'armor', hat: 'helmet', weapon: 'changqiang' }, resp: 2700 },
  langwang: { name: '狼王', lv: 74, hp: 1000, atk: 27, dodge: 14, step: 16, mv: 1.45, sight: 7, cd: 60, beast: 'snowwolf', resp: 3600 },
  hsjianke: { name: '华山剑客', lv: 82, hp: 1100, atk: 28, dodge: 16, step: 18, mv: 1.2, sight: 6, cd: 60, look: { body: 'changpao', hair: 'fangjin', weapon: 'qinggang' }, resp: 3000 },
  jqdizi: { name: '绝情谷弟子', lv: 86, hp: 1150, atk: 29, dodge: 14, step: 18, mv: 1.2, sight: 6, cd: 60, look: { body: 'thshan', hair: 'knot', weapon: 'tiejian' }, resp: 3000 },
  gongsun: { name: '公孙止', lv: 92, hp: 2600, atk: 29, dodge: 16, step: 18, mv: 1.2, sight: 7, cd: 58, dboss: true, villain: true, intro: ['擅闯绝情谷者，死。', '让你见识公孙家的阴阳倒乱刃法！'], look: { body: 'heipao', hair: 'crown', beard: true, weapon: 'xuantie' }, resp: 60 * 60 * 8 },
  dummy: { name: '木人桩', lv: 15, hp: 9999, atk: 0, dodge: 0, dummy: true, passive: true },
};
const DROPS = {
  yuebuqun: [['book_bixie', 0.25], ['hantie', 0.8], ['hantiejian', 0.2], ['jingtie', 1]],
  dongfang: [['book_kuihua', 0.2], ['xuantiekuang', 1], ['xuantie', 0.1], ['yulu', 0.5]],
  zuolengchan: [['book_hanbing', 0.25], ['hantie', 1], ['xuantiekuang', 0.4]],
  ouyangfeng: [['book_hama', 0.25], ['wujin', 1], ['baoming', 0.3]],
  limochou: [['book_chilian', 0.25], ['xuelian', 1], ['duanxu', 0.3]],
  gongsun: [['book_yinyang', 0.25], ['hantie', 1], ['hantiedao', 0.2], ['xuantiekuang', 0.4], ['lingzhi', 1], ['qidan', 1]],
  jiumozhi: [['book_huoyan', 0.25], ['wujin', 0.8], ['renshen', 0.5]],
  jinlun: [['book_longxiang', 0.25], ['wujin', 0.6], ['wujinchui', 0.2]],
  xuedao: [['book_xuedao', 1]],
  kuangfei: [['shengtie', 0.6], ['jingtie', 0.25], ['yao', 0.3]],
  kuangba: [['jingtie', 1], ['jingtie', 0.8], ['guitou', 0.25], ['baleng', 0.25], ['book_hujia', 0.15]],
  dongxiong: [['xiongpi', 0.5], ['xiongdan', 0.25], ['renshen', 0.1]],
  xiongwang: [['xiongdan', 1], ['hantie', 0.8], ['renshen', 0.5], ['wujinchui', 0.2], ['xiongpi', 1]],
  jianmo: [['jingtie', 1], ['hantie', 0.5], ['hantiejian', 0.25], ['xuantie', 0.06], ['book_shenxing', 0.15]],
  jianling: [['hantie', 0.3], ['jingtie', 0.4], ['xuelian', 0.08]],
  jianshou: [['xuantiekuang', 1], ['xuantiekuang', 0.6], ['hantie', 1], ['xuantie', 0.2], ['hantiejian', 0.3]],
  shiwei: [['wujin', 0.15], ['jingtie', 0.4], ['baiyao', 0.2]],
  shiwang: [['wujin', 1], ['xuantiekuang', 0.5], ['tulong', 0.15], ['zijin', 0.15], ['wujinchui', 0.25]],
  rabbit: [['tourou', 0.7], ['tupi', 0.4]],
  fox: [['hulipi', 0.6]],
  wolf: [['langpi', 0.6], ['shougu', 0.35]],
  bandit: [['yao', 0.2], ['shengtie', 0.3]],
  bear: [['xiongpi', 0.7], ['xiongdan', 0.35], ['shougu', 0.5]],
  tiger: [['hupi', 0.7], ['hugu', 0.5], ['book_hujia', 0.08]],
  boar: [['zhurou', 0.7], ['shougu', 0.4]],
  wuseng: [['yao', 0.3]], emeidizi: [['qidan', 0.3]], jiaozhong: [['yao', 0.3]], taohuadizi: [['qidan', 0.3]],
  snowwolf: [['xuelangpi', 0.6], ['shougu', 0.4]],
  shanfei: [['yao', 0.3], ['shengtie', 0.3]], baozi: [['hupi', 0.4], ['shougu', 0.5]], qzdizi: [['qidan', 0.3]], mjzhong: [['yao', 0.3], ['qidan', 0.15]],
  mazei: [['yao', 0.3], ['shengtie', 0.3]], shalang: [['langpi', 0.6], ['shougu', 0.4]], shafei: [['yao', 0.35], ['shengtie', 0.3]], cylang: [['langpi', 0.7], ['shougu', 0.4]],
  menggu: [['yao', 0.4], ['qidan', 0.15]], langwang: [['xuelangpi', 0.8], ['hugu', 0.3]], hsjianke: [['qidan', 0.3], ['lingzhi', 0.1]], jqdizi: [['qidan', 0.3], ['lingzhi', 0.12]], 
};

/* 物品：buyer 表示谁收购，buy 表示能在哪买 */
const ITEMS = {
  /* 基础药（药铺、货郎有卖）：药力慢 */
  yao: { name: '金创药', info: '基础药：30秒内活力共+60', buy: 10, sell: 4, buyer: 'doctor', use: () => dose('金创药', { hp: [2, 30] }) },
  qingxin: { name: '清心散', info: '基础药：30秒内内功共+45', buy: 12, sell: 4, buyer: 'doctor', use: () => dose('清心散', { mp: [1.5, 30] }) },
  dieda: { name: '跌打酒', info: '基础药：30秒内伤势共+45', buy: 12, sell: 4, buyer: 'doctor', use: () => dose('跌打酒', { parts: [1.5, 30] }) },
  /* 中品药（只能自己炼）：药力快 */
  baiyao: { name: '金疮白药', info: '中品药：12秒内活力共+72', sell: 15, buyer: 'doctor', use: () => dose('金疮白药', { hp: [6, 12] }) },
  qidan: { name: '回气丹', info: '中品药：10秒内内功共+50', sell: 12, buyer: 'doctor', use: () => dose('回气丹', { mp: [5, 10] }) },
  xugu: { name: '续骨膏', info: '中品药：12秒内伤势共+60', sell: 12, buyer: 'doctor', use: () => dose('续骨膏', { parts: [5, 12] }) },
  /* 上品药（稀有药材自己炼）：药力猛 */
  yulu: { name: '九花玉露丸', info: '上品药：10秒内活力+100 内功+60', sell: 60, buyer: 'doctor', use: () => dose('九花玉露丸', { hp: [10, 10], mp: [6, 10] }) },
  duanxu: { name: '黑玉断续膏', info: '上品药：8秒内伤势全好', sell: 60, buyer: 'doctor', use: () => dose('黑玉断续膏', { parts: [15, 8] }) },
  baoming: { name: '天王保命丹', info: '上品药：10秒内活力共+150', sell: 80, buyer: 'doctor', use: () => dose('天王保命丹', { hp: [15, 10] }) },
  /* 吃的：也是慢慢回 */
  ganliang: { name: '干粮', info: '30秒内活力+30 体力+40', buy: 5, sell: 1, use: () => dose('干粮', { hp: [1, 30], st: [2, 20] }) },
  tourou: { name: '兔肉', info: '15秒内活力+15', sell: 1, buyer: 'inn', use: () => dose('兔肉', { hp: [1, 15] }) },
  zhurou: { name: '野猪肉', info: '15秒内活力+30', sell: 3, buyer: 'inn', use: () => dose('野猪肉', { hp: [2, 15] }) },
  jiu: { name: '烧酒', info: '10秒内体力+40', buy: 8, sell: 2, use: () => dose('烧酒', { st: [4, 10] }) },
  niurou: { name: '酱牛肉', info: '20秒内活力+60 体力+30', buy: 15, sell: 4, use: () => dose('酱牛肉', { hp: [3, 20], st: [3, 10] }) },
  yugan: { name: '鱼竿', info: '对着水面按A钓鱼', buy: 20 },
  jiyu: { name: '鲫鱼', info: '可卖给渔翁，可做菜', sell: 2, buyer: 'fisher' },
  liyu: { name: '鲤鱼', info: '可卖给渔翁，可做菜', sell: 5, buyer: 'fisher' },
  bingyu: { name: '冰鱼', info: '峨眉冰湖特产', sell: 12, buyer: 'fisher' },
  jinli: { name: '金鲤', info: '难得一见，渔翁高价收', sell: 60, buyer: 'fisher' },
  kaoyu: { name: '烤鱼', info: '20秒内活力+40 体力+20', sell: 4, use: () => dose('烤鱼', { hp: [2, 20], st: [2, 10] }) },
  yutang: { name: '鱼汤', info: '15秒内内功+30 体力+40', sell: 6, use: () => dose('鱼汤', { mp: [2, 15], st: [4, 10] }) },
  hongshao: { name: '红烧鲤鱼', info: '20秒内活力+80 体力+40', sell: 10, use: () => dose('红烧鲤鱼', { hp: [4, 20], st: [4, 10] }) },
  mianhua: { name: '棉花', info: '纺织材料，兔儿坡有', sell: 1, buyer: 'tailor' },
  tupi: { name: '兔皮', info: '可做毡帽', sell: 1, buyer: 'smith' },
  hulipi: { name: '狐皮', info: '可做狐裘', sell: 4, buyer: 'smith' },
  langpi: { name: '狼皮', info: '可做兽皮袄', sell: 6, buyer: 'smith' },
  shougu: { name: '兽骨', info: '炼续骨膏的药引', sell: 3, buyer: 'doctor' },
  xiongpi: { name: '熊皮', info: '可做熊皮甲', sell: 15, buyer: 'smith' },
  xiongdan: { name: '熊胆', info: '名贵药材，药铺高价收', sell: 25, buyer: 'doctor' },
  xuelangpi: { name: '雪狼皮', info: '可做雪狼裘', sell: 12, buyer: 'smith' },
  hupi: { name: '虎皮', info: '能卖大价钱', sell: 40, buyer: 'smith' },
  hugu: { name: '虎骨', info: '打造青钢剑要用', sell: 30, buyer: 'doctor' },
  caoyao: { name: '草药', info: '炼药材料，兔儿坡有', sell: 2, buyer: 'doctor' },
  lingzhi: { name: '灵芝', info: '炼回气丹用，黑松林有', sell: 25, buyer: 'doctor' },
  shengtie: { name: '生铁', info: '锻造材料', buy: 8, sell: 3, buyer: 'smith' },
  sanqi: { name: '三七', info: '止血良药，蜀道、苗疆采草药时偶得', sell: 8, buyer: 'doctor' },
  fengmi: { name: '玉蜂蜜', info: '终南山、武当山采草药时偶得', sell: 10, buyer: 'doctor' },
  renshen: { name: '老山参', info: '黑松林、塞外草原采草药时偶得', sell: 30, buyer: 'doctor' },
  xuelian: { name: '天山雪莲', info: '峨眉雪山采灵芝时偶得', sell: 40, buyer: 'doctor' },
  jingtie: { name: '精铁', info: '华山、嵩山、潼关、雁门挖矿偶得', sell: 10, buyer: 'smith' },
  hantie: { name: '寒铁', info: '光明顶、雪山挖矿偶得，打造寒铁兵器', sell: 30, buyer: 'smith' },
  xuantiekuang: { name: '玄铁', info: '剑冢、地宫深处才有的天外玄铁', sell: 80, buyer: 'smith' },
  wujin: { name: '乌金', info: '大漠深处挖矿偶得，极重极硬', sell: 40, buyer: 'smith' },
  book_hujia: { name: '胡家刀法秘籍', info: '基础刀法30级可研读', book: 'hujia' },
  book_yuejia: { name: '岳家枪法秘籍', info: '基础枪法30级可研读', buy: 300, book: 'yuejia' },
  book_shenxing: { name: '神行百变秘籍', info: '基础步法20级可研读', book: 'shenxing' },
  book_bixie: { name: '辟邪剑谱', info: '基础剑法50级可研读', sell: 100, book: 'bixie' },
  book_kuihua: { name: '葵花宝典', info: '基础剑法60级可研读', sell: 150, book: 'kuihua' },
  book_hanbing: { name: '寒冰真气心法', info: '基础心法50级可研读', sell: 120, book: 'hanbing' },
  book_hama: { name: '蛤蟆功秘籍', info: '基础拳法50级可研读', sell: 120, book: 'hama' },
  book_chilian: { name: '赤练神掌图谱', info: '基础拳法55级可研读', sell: 120, book: 'chilian' },
  book_yinyang: { name: '阴阳倒乱刃谱', info: '基础刀法55级可研读', sell: 120, book: 'yinyang' },
  book_huoyan: { name: '火焰刀秘要', info: '基础刀法50级可研读', sell: 120, book: 'huoyan' },
  book_xuedao: { name: '血刀经', info: '基础刀法40级可研读', sell: 100, book: 'xuedaofa' },
  book_longxiang: { name: '龙象般若经', info: '基础槌法50级可研读', sell: 120, book: 'longxiang' },
};

/* 装备：每件都会画在人物身上，换了就看得出来 */
const SLOT_NAME = { weapon: '兵器', body: '衣服', head: '头戴' };
/* 兵器：身头手脚四处攻击力，部分兵器影响出手快慢、命中；衣帽：身头手脚四处防御 */
const EQ = {
  buyi: { slot: 'body', name: '粗布短衣', def: [0, 0, 0, 0], sell: 0 },
  jinzhuang: { slot: 'body', name: '黑色劲装', def: [2, 0, 1, 1], price: 40 },
  changpao: { slot: 'body', name: '青布长袍', def: [1, 0, 0, 1], mp: 10, price: 60 },
  shoupi: { slot: 'body', name: '兽皮袄', def: [3, 0, 1, 0], sell: 15 },
  xiongpijia: { slot: 'body', name: '熊皮甲', def: [5, 0, 2, 1], sell: 45 },
  daopao: { slot: 'body', name: '全真道袍', def: [2, 0, 1, 1], mp: 5, sell: 10, uniform: 'quanzhen' },
  patched: { slot: 'body', name: '丐帮百衲衣', def: [3, 0, 1, 1], sell: 10, uniform: 'gaibang' },
  sengyi: { slot: 'body', name: '少林僧衣', def: [3, 0, 1, 1], sell: 10, uniform: 'shaolin' },
  nun: { slot: 'body', name: '峨眉道袍', def: [2, 0, 1, 1], mp: 5, sell: 10, uniform: 'emei' },
  mjrobe: { slot: 'body', name: '明教黑袍', def: [2, 1, 1, 1], sell: 10, uniform: 'mingjiao' },
  ryrobe: { slot: 'body', name: '日月教服', def: [2, 1, 1, 1], sell: 10, uniform: 'riyue' },
  thshan: { slot: 'body', name: '桃花青衫', def: [2, 0, 1, 1], mp: 5, sell: 10, uniform: 'taohua' },
  wdpao: { slot: 'body', name: '武当道袍', def: [2, 0, 1, 1], mp: 5, sell: 10, uniform: 'wudang' },
  hsshan: { slot: 'body', name: '华山青衫', def: [2, 0, 1, 1], mp: 5, sell: 10, uniform: 'huashanpai' },
  tmjin: { slot: 'body', name: '唐门劲装', def: [2, 1, 1, 1], sell: 10, uniform: 'tangmen' },
  gmbai: { slot: 'body', name: '古墓白衣', def: [1, 0, 1, 2], mp: 8, sell: 10, uniform: 'gumu' },
  xxpao: { slot: 'body', name: '星宿彩袍', def: [2, 1, 1, 1], sell: 10, uniform: 'xingxiu' },
  wduyi: { slot: 'body', name: '五毒苗衣', def: [3, 0, 1, 1], sell: 10, uniform: 'wudu' },
  mianbu: { slot: 'body', name: '棉布衫', def: [1, 0, 1, 1], sell: 6 },
  huqiu: { slot: 'body', name: '狐裘', def: [3, 1, 2, 1], sell: 30 },
  xuelangqiu: { slot: 'body', name: '雪狼裘', def: [5, 1, 3, 2], mp: 5, sell: 60 },
  zhanmao: { slot: 'head', name: '毡帽', def: [0, 2, 0, 0], sell: 6 },
  douli: { slot: 'head', name: '竹斗笠', def: [0, 2, 0, 0], price: 20 },
  tiejian: { slot: 'weapon', type: '剑', name: '铁剑', atk: [4, 5, 3, 2], price: 50 },
  gangdao: { slot: 'weapon', type: '刀', name: '钢刀', atk: [6, 4, 6, 3], price: 60 },
  changqiang: { slot: 'weapon', type: '枪', name: '长枪', atk: [5, 3, 3, 6], price: 60 },
  tiechui: { slot: 'weapon', type: '槌', name: '铁锤', atk: [9, 8, 5, 5], spdMod: 0.9, price: 75 },
  xuantie: { slot: 'weapon', type: '剑', name: '玄铁剑', atk: [11, 13, 9, 8], spdMod: 0.95, sell: 200, rare: true },
  tulong: { slot: 'weapon', type: '刀', name: '屠龙刀', atk: [14, 11, 13, 9], sell: 220, rare: true },
  bawang: { slot: 'weapon', type: '枪', name: '霸王枪', atk: [11, 8, 9, 13], sell: 200, rare: true },
  zijin: { slot: 'weapon', type: '槌', name: '紫金锤', atk: [15, 14, 10, 10], spdMod: 0.9, sell: 200, rare: true },
  jinsijia: { slot: 'body', name: '金丝软甲', def: [8, 1, 3, 3], sell: 220, rare: true },
  wucanyi: { slot: 'body', name: '乌蚕衣', def: [6, 2, 4, 4], mp: 10, sell: 220, rare: true },
  qinggang: { slot: 'weapon', type: '剑', name: '青钢剑', atk: [8, 10, 6, 5], acc: 5, sell: 60 },
  guitou: { slot: 'weapon', type: '刀', name: '鬼头刀', atk: [9, 7, 9, 5], sell: 60 },
  lihua: { slot: 'weapon', type: '枪', name: '梨花枪', atk: [8, 5, 6, 9], sell: 60 },
  baleng: { slot: 'weapon', type: '槌', name: '八棱锤', atk: [12, 10, 7, 7], spdMod: 0.9, sell: 70 },
  hantiejian: { slot: 'weapon', type: '剑', name: '寒铁剑', atk: [10, 12, 8, 7], acc: 3, sell: 120 },
  hantiedao: { slot: 'weapon', type: '刀', name: '寒铁刀', atk: [12, 9, 12, 8], sell: 120 },
  hantieqiang: { slot: 'weapon', type: '枪', name: '寒铁枪', atk: [10, 7, 8, 12], sell: 120 },
  wujinchui: { slot: 'weapon', type: '槌', name: '乌金锤', atk: [14, 12, 9, 9], spdMod: 0.9, sell: 130 },
};
const partTxt = (pre, a) => pre + a.map((n, i) => (n ? LOCS[i] + n : '')).join('');
for (const k in EQ) {
  const it = EQ[k];
  if (it.sell == null) it.sell = Math.floor((it.price || 0) / 2);
  it.info = it.atk ? partTxt('攻 ', it.atk) + (it.spdMod ? ' 慢' : '') + (it.acc ? ` 命中+${it.acc}` : '')
    : [it.def.some(Boolean) ? partTxt('防 ', it.def) : '', it.mp ? `内功+${it.mp}` : ''].filter(Boolean).join(' ') || '寻常衣物';
}
const FORGE = {
  兵器: [['tiejian', { shengtie: 3 }, 0], ['gangdao', { shengtie: 4 }, 5], ['changqiang', { shengtie: 3 }, 5], ['tiechui', { shengtie: 5 }, 10],
    ['qinggang', { shengtie: 4, jingtie: 2 }, 25], ['guitou', { shengtie: 4, jingtie: 2 }, 25], ['lihua', { shengtie: 2, jingtie: 3 }, 25], ['baleng', { shengtie: 4, jingtie: 3 }, 30],
    ['hantiejian', { hantie: 3, jingtie: 2 }, 50], ['hantiedao', { hantie: 3, jingtie: 2 }, 50], ['hantieqiang', { hantie: 3, jingtie: 2 }, 50], ['wujinchui', { wujin: 2, jingtie: 3 }, 55],
    ['xuantie', { xuantiekuang: 3, hantie: 2 }, 75], ['tulong', { wujin: 3, xuantiekuang: 2 }, 80]],
};
const TAILOR = [['mianbu', { mianhua: 3 }, 0], ['zhanmao', { tupi: 3 }, 5], ['shoupi', { langpi: 3 }, 5], ['huqiu', { hulipi: 4 }, 15], ['xiongpijia', { xiongpi: 2, langpi: 2 }, 20], ['xuelangqiu', { xuelangpi: 3, mianhua: 2 }, 30]];
const COOK = [['kaoyu', { jiyu: 1 }, 0], ['yutang', { jiyu: 1, caoyao: 1 }, 10], ['hongshao', { liyu: 1 }, 20]];
const BREW = [['yao', { caoyao: 2 }, 0], ['qingxin', { caoyao: 2 }, 0], ['dieda', { caoyao: 1, shougu: 1 }, 0],
  ['baiyao', { caoyao: 2, sanqi: 1 }, 20], ['xugu', { caoyao: 2, shougu: 1, sanqi: 1 }, 20], ['qidan', { caoyao: 1, lingzhi: 1 }, 20],
  ['yulu', { xuelian: 1, lingzhi: 1, fengmi: 1 }, 45], ['duanxu', { xiongdan: 1, hugu: 1, sanqi: 2 }, 45], ['baoming', { renshen: 1, xiongdan: 1, lingzhi: 1 }, 50]];

