/* ---------------- dialog & menu ---------------- */
function say(speaker, texts, onEnd) {
  const arr = Array.isArray(texts) ? texts : [texts];
  const pages = [];
  for (const t of arr) { const lines = wrap(t, dlgW() - 16); for (let i = 0; i < lines.length; i += 3) pages.push({ speaker, lines: lines.slice(i, i + 3) }); }
  dlg = { pages, i: 0, shown: 0, onEnd, choice: null };
}
function ask(speaker, text, options, cb) { say(speaker, text); dlg.choice = { options, sel: 0, cb }; }
function updDialog() {
  const pg = dlg.pages[dlg.i];
  const total = pg.lines.join('').length;
  if (dlg.shown < total) { dlg.shown += held.a ? 3 : 1; if (frame % 3 === 0) sfx('talk'); }
  const last = dlg.i === dlg.pages.length - 1;
  if (last && dlg.choice && dlg.shown >= total) {
    const c = dlg.choice;
    if (pressed.up) { c.sel = (c.sel + c.options.length - 1) % c.options.length; sfx('menu'); }
    if (pressed.down) { c.sel = (c.sel + 1) % c.options.length; sfx('menu'); }
    if (pressed.a || pressed.b) { const sel = pressed.b ? c.options.length - 1 : c.sel; dlg = null; sfx('menu'); c.cb(sel); }
    return;
  }
  if (pressed.a || pressed.b) {
    if (dlg.shown < total) dlg.shown = total;
    else if (!last) { dlg.i++; dlg.shown = 0; }
    else { const f = dlg.onEnd; dlg = null; if (f) f(); }
  }
}
const TABS = ['状态', '武功', '装备', '行囊', '江湖', '地图', '系统'];
/* 菜单上显示的页：地图有自己的「地图」键，不放进菜单里左右翻 */
const MENU_TABS = TABS.filter(t => t !== '地图');
/* 武功三层：基础武功（谁都能练）→ 门派武功（只有门派武功受门派约束，叛出后最多 49.99）→ 特殊武功（秘籍、奇人所传，不受门派约束） */
const KIND_ORDER = ['基础', '门派', '江湖', '特殊', '生产'];
/* 江湖：不属门派的上层武功（武馆、野外得秘籍）；特殊：打反派或奇人传授 */
const skKind = k => { const sk = SK[k]; return sk.cat === '生产' ? '生产' : sk.sect ? '门派' : sk.tier !== 2 ? '基础' : (sk.villain || Object.values(HERMITS).some(h => h.skill === k)) ? '特殊' : '江湖'; };
/* 武功页按类别分页：全部 / 拳 / 剑 / 刀 / 枪 / 锤 / 暗器 / 弓 / 内功 / 轻功 / 护体 / 技艺（只列出学过的类别） */
/* 装备页同理：全 / 手套 / 剑 / 刀 / 枪 / 锤 / 暗器 / 弓 / 衣服 / 头戴 */
const EQ_CAT_ORDER = ['拳', '剑', '刀', '枪', '槌', '暗器', '弓', '衣', '帽'];
const EQ_CAT_TAG = { 拳: '套', 剑: '剑', 刀: '刀', 枪: '枪', 槌: '锤', 暗器: '暗', 弓: '弓', 衣: '衣', 帽: '帽' };
const EQ_CAT_NAME = { 拳: '手套', 剑: '剑', 刀: '刀', 枪: '枪', 槌: '锤', 暗器: '暗器', 弓: '弓', 衣: '衣服', 帽: '头戴' };
const eqCat = id => EQ[id].slot === 'weapon' ? EQ[id].type : EQ[id].slot === 'body' ? '衣' : '帽';
const catLabel = c => c === '全' ? '全' : menu.tab === 2 ? EQ_CAT_TAG[c] : CAT_TAG[c];
const catName = c => c === '全' ? '全部' : menu.tab === 2 ? EQ_CAT_NAME[c] : CAT_NAME[c];
function skillCats() {
  if (menu && menu.tab === 2) { const have = new Set(S.gear.map(eqCat)); return ['全'].concat(EQ_CAT_ORDER.filter(c => have.has(c))); }
  const have = new Set(Object.keys(S.skills).filter(k => SK[k]).map(k => SK[k].cat)); return ['全'].concat(CAT_ORDER.filter(c => have.has(c)));
}
function skillCatNow() { const cs = skillCats(); if (menu.cat === 'last' || menu.cat == null || menu.cat >= cs.length) menu.cat = menu.cat === 'last' ? cs.length - 1 : Math.min(menu.cat || 0, cs.length - 1); return cs[menu.cat]; }
function skillList() {
  const c = menu && menu.tab === 1 ? skillCatNow() : '全';
  return skillListAll().filter(k => c === '全' || SK[k].cat === c);
}
function skillListAll() {
  return Object.keys(S.skills).filter(k => SK[k]).sort((a, b) => CAT_ORDER.indexOf(SK[a].cat) - CAT_ORDER.indexOf(SK[b].cat) || KIND_ORDER.indexOf(skKind(a)) - KIND_ORDER.indexOf(skKind(b)));
}
function skillInfo(k) {
  const sk = SK[k], up = sk.tier === 2 ? '上乘' : '';
  const kd = skKind(k), from = kd === '门派' && sk.sect ? SECTS[sk.sect].short + '派' : kd;
  if (ATK_CATS.includes(sk.cat)) return `${CAT_NAME[sk.cat]}·${from}${up} 速${RT[sk.spd]}${sk.reach ? ` 远${sk.reach}格` : ''}`;
  return `${CAT_NAME[sk.cat]}·${from}${up}　按A看详情`;
}
const useLabel = sk => (SK_FORMER(sk) ? `原${SECTS[sk.sect].name}武功，上限49.99` : ATK_CATS.includes(sk.cat) ? (sk.cat === '拳' ? '拳掌：空手或戴手套可用' : sk.cat === '暗器' ? '暗器：要装备飞镖、袖箭等' : sk.cat === '弓' ? '弓箭：要装备弓，贴身伤害减半' : `${CAT_NAME[sk.cat]}：要装备${sk.cat}`) : sk.cat === '生产' ? '生产技艺' : `${CAT_NAME[sk.cat]}，同时只能运用一门`);
function SK_FORMER(sk) { return !!(sk.sect && S.former.includes(sk.sect)); }
function useSkill(k) {
  const sk = SK[k];
  if (ATK_CATS.includes(sk.cat)) {
    if (sk.cat !== wcat()) return toast(sk.cat === '拳' ? '要空手或戴手套才能用拳法' : sk.cat === '暗器' ? '要先装备飞镖、袖箭等暗器' : sk.cat === '弓' ? '要先装备弓' : `要先装备${sk.cat}`);
    S.active = k; S.pref[sk.cat] = k; toast(`改用 ${sk.name}`); sfx('menu');
  } else if (sk.cat === '生产') toast(sk.desc);
  else { S.passive[sk.cat] = k; toast(`${CAT_NAME[sk.cat]}改用 ${sk.name}`); sfx('menu'); }
}
function readBook(k) {
  const id = ITEMS[k].book;
  if (S.skills[id] != null) { S.items[k] = 0; return toast('这门武功已经会了'); }
  const why = reqFail(id);
  if (why) return toast(why.length > 15 ? `${SK[SK[id].req[0]].name}要${SK[id].req[1]}级` : why);
  S.items[k]--; learn(id); save();
}
function menuItems() {
  if (!menu) return [];
  if (menu.tab === 1) return skillList().map(k => {
    const sk = SK[k], atk = ATK_CATS.includes(sk.cat);
    const using = atk ? S.active === k : S.passive[sk.cat] === k;
    return { tag: CAT_TAG[sk.cat], label: sk.name + (isFormer(k) ? '·旧' : ''), right: S.skills[k].toFixed(2), mark: using, info: skillInfo(k), act: () => { menu.detail = k; sfx('menu'); } };
  });
  if (menu.tab === 2) {
    const cnt = {};
    for (const id of S.gear) cnt[id] = (cnt[id] || 0) + 1;
    const c = skillCatNow();
    return Object.keys(cnt).filter(id => c === '全' || eqCat(id) === c).sort((a, b) => EQ_CAT_ORDER.indexOf(eqCat(a)) - EQ_CAT_ORDER.indexOf(eqCat(b))).map(id => {
      const it = EQ[id], on = S.equip[it.slot] === id;
      return { tag: EQ_CAT_TAG[eqCat(id)], label: eqName(id) + (cnt[id] > 1 ? `×${cnt[id]}` : ''), right: on ? '装备中' : SLOT_NAME[it.slot], mark: on, info: `${it.info}${enhLv(id) ? ` 强化+${enhLv(id)}` : ''}`, act: () => {
        if (on) {
          if (it.slot === 'body') return toast('总不能光着身子吧');
          S.equip[it.slot] = null; ensureActive(); toast(`卸下 ${it.name}`); sfx('menu');
        } else equipItem(id);
      } };
    });
  }
  if (menu.tab === 3) return Object.keys(ITEMS).filter(k => S.items[k] > 0).map(k => ({
    label: ITEMS[k].name, right: `×${S.items[k]}`, info: ITEMS[k].info, act: () => {
      const it = ITEMS[k];
      if (it.use) { if (it.use()) S.items[k]--; }
      else if (it.book) readBook(k);
      else toast(it.info);
    },
  }));
  if (menu.tab === 6) return [
    { label: '画面大小', right: VIEW_NAME[viewIdx], act: () => { setView((viewIdx + 1) % 3); toast(['画面大小：大（方块最大，和 GB 一样）', '画面大小：中', '画面大小：小（方块小，一屏看得多）'][viewIdx]); sfx('menu'); } },
    { label: '保存进度', act: () => save(false) },
    ...(NET.online ? [{ label: '退出登录', right: NET.status === 'up' ? '在线' : '断线', act: () => netLogout() }] : []),
    ...(NET.online ? [] : [{ label: '修改名字', right: S.name, act: () => { const keep = menu; menu = null; askName('改个名字', S.name, nm => { S.name = nm; save(); toast(`以后江湖上叫你${nm}`); menu = keep; }); } }]),
    { label: '导出存档码', act: () => openSaveBox('export') },
    ...(NET.online ? [] : [{ label: '读取存档码', act: () => openSaveBox('import') }]),
    ...(S.tut < TUT.length ? [{ label: '跳过新手教学', act: () => { S.tut = 99; toast('已跳过新手教学'); sfx('menu'); } }] : []),
    { label: '任务指引', right: S.showGuide === false ? '关' : '开', act: () => { S.showGuide = S.showGuide === false; sfx('menu'); } },
    { label: '头顶信息', right: S.showTag === false ? '关' : '开', act: () => { S.showTag = S.showTag === false; sfx('menu'); } },
    { label: '画面配色', right: PALETTES[palIdx].name, act: () => setPalette((palIdx + 1) % PALETTES.length) },
    { label: '声音', right: muted ? '关' : '开', act: () => { muted = !muted; audioInit(); sfx('menu'); } },
    { label: '测试加速', right: FAST_NAME[FAST], act: () => { FAST = (FAST + 2) % 3; try { localStorage.setItem('jianghu-fast', String(FAST)); } catch (e) {} toast(['测试加速已关', '加速：约一小时练到顶', '极速：练功再快50倍，几分钟练到顶'][FAST]); sfx('menu'); } },
    ...(FAST ? [{ label: '测试：武功兵器全满', act: () => testMaxAll() }] : []),
    { label: '背景音乐', right: musicOn ? '开' : '关', act: () => { musicOn = !musicOn; mus.track = null; try { localStorage.setItem('jianghu-music', musicOn ? '1' : '0'); } catch (e) {} sfx('menu'); } },
    { label: menu.confirm ? '确认重新开始？' : '重新开始', act: () => {
      if (!menu.confirm) { menu.confirm = true; return; }
      try { localStorage.removeItem(SAVE_KEY); } catch (e) {}
      menu = null; mode = 'title'; titleSel = 0; S = null;
    } },
    { label: '返回游戏', act: () => { menu = null; } },
  ];
  return [];
}
function updMenu() {
  if (menu.detail) {
    if (pressed.a) { useSkill(menu.detail); }
    if (pressed.b || pressed.start) { menu.detail = null; sfx('menu'); }
    return;
  }
  if (menu.page) {
    const n = S.heard.length;
    if (n && pressed.up) { menu.sel = (menu.sel + n - 1) % n; sfx('menu'); }
    if (n && pressed.down) { menu.sel = (menu.sel + 1) % n; sfx('menu'); }
    if (pressed.b || pressed.start || pressed.a) { menu.page = null; menu.sel = 0; sfx('menu'); }
    return;
  }
  if (menu.tab === 4 && pressed.a) { menu.page = 'heard'; menu.sel = 0; sfx('menu'); return; }
  if (pressed.chat) { openChat(); return; }
  if (pressed.start || pressed.b || pressed.map) { menu = null; sfx('menu'); return; }
  const step = d => { const i = MENU_TABS.indexOf(TABS[menu.tab]), n = MENU_TABS.length; menu.tab = TABS.indexOf(MENU_TABS[(Math.max(0, i) + d + n) % n]); menu.sel = 0; menu.confirm = false; menu.cat = 0; menu.focus = 'tab'; sfx('menu'); };
  /* 武功页分三层：页签 →（下）类别条 →（下）武功列表。
     在页签上左右换页；在类别条上左右换类别；列表最上面再按上回到类别条，类别条按上回到页签 */
  if (menu.tab === 1 || menu.tab === 2) {
    const f = menu.focus || 'tab', n = skillCats().length; skillCatNow();
    if (f === 'tab') {
      if (pressed.left) step(-1); else if (pressed.right) step(1);
      else if (pressed.down || pressed.a) { menu.focus = 'cat'; sfx('menu'); }
      return;
    }
    if (f === 'cat') {
      if (pressed.left || pressed.right) { menu.cat = (menu.cat + (pressed.left ? -1 : 1) + n) % n; menu.sel = 0; sfx('menu'); }
      else if (pressed.up) { menu.focus = 'tab'; sfx('menu'); }
      else if ((pressed.down || pressed.a) && menuItems().length) { menu.focus = 'list'; menu.sel = 0; sfx('menu'); }
      return;
    }
    const its = menuItems();
    if (menu.sel >= its.length) menu.sel = Math.max(0, its.length - 1);
    if (pressed.left || pressed.right) { menu.cat = (menu.cat + (pressed.left ? -1 : 1) + n) % n; menu.sel = 0; sfx('menu'); return; }
    if (pressed.up) { if (menu.sel > 0) menu.sel--; else menu.focus = 'cat'; sfx('menu'); return; }
    if (pressed.down) { if (menu.sel < its.length - 1) { menu.sel++; sfx('menu'); } return; }
    if (pressed.a && its.length) its[menu.sel].act();
    return;
  }
  if (menu.tab === TABS.indexOf('地图')) { if (pressed.a) { menu = null; sfx('menu'); } return; }  // 大地图：只看，不换页
  if (pressed.left) step(-1);
  if (pressed.right) step(1);
  const items = menuItems();
  if (menu.sel >= items.length) menu.sel = Math.max(0, items.length - 1);
  if (items.length) {
    if (pressed.up) { menu.sel = (menu.sel + items.length - 1) % items.length; sfx('menu'); }
    if (pressed.down) { menu.sel = (menu.sel + 1) % items.length; sfx('menu'); }
    if (pressed.a) items[menu.sel].act();
  }
}


/* 测试用（正式测试时和加速一起去掉）：所有武功练满，所有兵器拿到手并强化到 +10 */
function testMaxAll() {
  for (const k of Object.keys(SK)) S.skills[k] = skillCap(k);
  let n = 0;
  for (const [id, e] of Object.entries(EQ)) if (e.slot === 'weapon') { if (!S.gear.includes(id)) { S.gear.push(id); n++; } (S.enh = S.enh || {})[id] = ENH_MAX; }
  save(); sfx('level'); toast(`${Object.keys(SK).length} 门武功已练满，兵器 +${n} 件，全部强化 +10`);
}
