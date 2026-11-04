/* ---------------- 起名 ---------------- */
const SURNAMES = '李王张刘陈杨赵黄周吴徐孙胡朱高林何郭马罗梁宋郑谢韩唐冯于董萧程曹袁邓许傅沈曾彭吕苏卢蒋蔡贾丁魏薛叶阎余潘杜戴夏钟汪田任姜范方石姚谭廖邹熊金陆郝孔白崔康毛邱秦江史顾侯邵孟龙万段雷钱汤尹黎易常武乔贺赖龚文';
const GIVEN = ['云', '风', '逸', '尘', '寒', '霜', '剑', '飞', '天', '行', '若', '无', '忌', '青', '玄', '冲', '靖', '过', '峰', '羽', '鸿', '舟', '远', '山', '月', '星', '辰', '凌', '霄', '啸'];
function randomName() { const sn = SURNAMES[rnd(0, SURNAMES.length - 1)]; let g = GIVEN[rnd(0, GIVEN.length - 1)]; if (Math.random() < 0.7) g += GIVEN[rnd(0, GIVEN.length - 1)]; return sn + g; }
/* 聊天：现在是单机，说的话会显示在自己头顶和聊天记录里；做成多人版后，同频道的玩家都能看到 */
const CH_LIST = ['附近', '门派', '江湖'];
const chatLogEl = document.getElementById('chatlog'), chatBar = document.getElementById('chatbar'), chatIn = document.getElementById('chatin'), chChBtn = document.getElementById('chch');
let chatLines = [], chatCh = 0, chatHideT = null;
const escHtml = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function chatPush(ch, who, text, me) {
  chatLines.push({ ch, who, text, me }); if (chatLines.length > 40) chatLines.shift();
  chatLogEl.innerHTML = chatLines.slice(-6).map(l => `<p class="${l.me ? 'me' : ''}"><b>[${l.ch}]</b>${l.who ? escHtml(l.who) + '：' : ''}${escHtml(l.text)}</p>`).join('');
  chatLogEl.classList.add('show'); clearTimeout(chatHideT);
  if (chatBar.hidden) chatHideT = setTimeout(() => chatLogEl.classList.remove('show'), 7000);
}
function openChat() {
  for (const k in held) release(k);
  chatBar.hidden = false; chatLogEl.classList.add('show'); clearTimeout(chatHideT);
  if (!chatLines.length) chatPush('系统', null, NET.online ? '附近＝同一张地图，门派＝同门，江湖＝所有在线的人。' : '单机模式只有自己看得到。联网江湖里，同频道的人都能看到。');
  setTimeout(() => { try { chatIn.focus(); } catch (e) {} }, 30);
}
function closeChat() { chatBar.hidden = true; chatIn.blur(); chatHideT = setTimeout(() => chatLogEl.classList.remove('show'), 4000); }
chChBtn.addEventListener('click', () => { chatCh = (chatCh + 1) % CH_LIST.length; chChBtn.textContent = CH_LIST[chatCh]; });
document.getElementById('chatx').addEventListener('click', closeChat);
chatBar.addEventListener('submit', e => {
  e.preventDefault();
  const t = chatIn.value.replace(/\s+/g, ' ').trim(); if (!t || !S) return closeChat();
  const ch = CH_LIST[chatCh];
  if (ch === '门派' && !S.sect) { chatPush('系统', null, '你还没有门派，门派频道说不了话。'); return; }
  if (NET.online) { if (NET.status !== 'up') { chatPush('系统', null, '和服务器断开了，消息没发出去。'); return; } netSend({ t: 'chat', ch, text: t }); chatIn.value = ''; closeChat(); return; }
  chatPush(ch === '门派' ? SECTS[S.sect].short : ch, S.name, t, true);
  P.say = { text: t, t: 60 * 6 };
  chatIn.value = ''; closeChat();
});
chatIn.addEventListener('keydown', e => { if (e.key === 'Escape') { e.preventDefault(); closeChat(); } });
const nameBox = document.getElementById('namebox'), nameInput = document.getElementById('nameinput'), nbErr = document.getElementById('nberr');
let nameCb = null;
function askName(title, cur, cb) {
  document.getElementById('nbtitle').textContent = title;
  nameInput.value = cur || ''; nbErr.textContent = ''; nameCb = cb; nameBox.hidden = false;
  for (const k in held) release(k);
  setTimeout(() => { try { nameInput.focus(); } catch (e) {} }, 50);
}
document.getElementById('nbrand').addEventListener('click', () => { nameInput.value = randomName(); nbErr.textContent = ''; });
document.getElementById('nbform').addEventListener('submit', e => {
  e.preventDefault();
  const v = nameInput.value.replace(/\s+/g, '').slice(0, 6);
  if (!v) { nbErr.textContent = '请先起个名字，或者点“随机一个”。'; return; }
  const missing = [...v].filter(ch => !GL[ch]);
  if (missing.length) { nbErr.textContent = `“${missing.join('')}”这几个字画面上显示不了，换个字吧。`; return; }
  nameBox.hidden = true; nameInput.blur();
  const cb = nameCb; nameCb = null; if (cb) cb(v);
});

/* 存档码：浏览器存储可能被清掉，换设备也带不走，所以给一串可以复制保存的文字 */
const SAVE_PREFIX = 'JHSN1.';
function encodeSave() { save(); return SAVE_PREFIX + btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
function decodeSave(code) {
  code = String(code || '').replace(/\s+/g, '');
  if (!code.startsWith(SAVE_PREFIX)) return null;
  try { const o = JSON.parse(decodeURIComponent(escape(atob(code.slice(SAVE_PREFIX.length))))); return o && o.skills && o.q ? o : null; } catch (e) { return null; }
}
const saveBox = document.getElementById('savebox'), saveCode = document.getElementById('savecode'), sbErr = document.getElementById('sberr'), sbOk = document.getElementById('sbok');
let sbMode = null;
function openSaveBox(m) {
  sbMode = m; for (const k in held) release(k);
  document.getElementById('sbtitle').textContent = m === 'export' ? '导出存档码' : '读取存档码';
  document.getElementById('sbsub').textContent = m === 'export' ? '把这串文字存到备忘录里。换手机、清了浏览器，都能用它找回进度。' : '把之前保存的存档码粘贴到下面。读取后会替换当前进度。';
  saveCode.value = m === 'export' ? encodeSave() : ''; saveCode.readOnly = m === 'export';
  sbOk.textContent = m === 'export' ? '复制' : '读取'; sbErr.textContent = '';
  saveBox.hidden = false;
  setTimeout(() => { try { saveCode.focus(); if (m === 'export') saveCode.select(); } catch (e) {} }, 50);
}
document.getElementById('sbclose').addEventListener('click', () => { saveBox.hidden = true; saveCode.blur(); sbMode = null; });
sbOk.addEventListener('click', async () => {
  if (sbMode === 'export') {
    saveCode.select(); let ok = false;
    try { await navigator.clipboard.writeText(saveCode.value); ok = true; } catch (e) { try { ok = document.execCommand('copy'); } catch (e2) {} }
    sbErr.textContent = ok ? '已复制。' : '已选中，长按文字手动复制。';
    return;
  }
  const o = decodeSave(saveCode.value);
  if (!o) { sbErr.textContent = '存档码不对，检查一下有没有复制完整。'; return; }
  saveBox.hidden = true; saveCode.blur(); sbMode = null;
  beginGame('继续江湖', null, o); save(); toast('存档已读取');
});

