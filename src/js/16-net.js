/* ---------------- 联网（第 1 步）：登录、云存档、同图看见彼此、聊天 ----------------
   只有从游戏服务器打开网页时才会联网；GitHub 网页版和 Claude 里预览都是单机。也可以在网址后加 ?server=ws://地址/ws 指定服务器 */
const NET = { url: null, ws: null, status: 'off', online: false, id: null, others: new Map(), dirty: false, lastSave: 0, lastPos: '', lastPosF: 0, lastProf: '', retry: 0, wantAuth: null };
NET.url = (() => {
  const q = new URLSearchParams(location.search).get('server'); if (q) return q;
  if (!/^https?:$/.test(location.protocol) || /github\.io$|claude|anthropic|localhost$|127\.0\.0\.1/.test(location.hostname) && !/[?&]net=1/.test(location.search)) return null;
  return (location.protocol === 'https:' ? 'wss://' : 'ws://') + location.host + '/ws';
})();
const NET_TOKEN_KEY = 'jianghu-token';
const netSend = o => { if (NET.ws && NET.ws.readyState === 1) NET.ws.send(JSON.stringify(o)); };
function netConnect() {
  if (!NET.url || NET.status === 'connecting' || NET.status === 'up') return;
  NET.status = 'connecting';
  let ws; try { ws = new WebSocket(NET.url); } catch (e) { NET.status = 'off'; return; }
  NET.ws = ws;
  const to = setTimeout(() => { if (NET.status === 'connecting') { try { ws.close(); } catch (e) {} } }, 4000);
  ws.onopen = () => { clearTimeout(to); NET.status = 'up'; NET.retry = 0; if (NET.wantAuth) { netSend(NET.wantAuth); NET.wantAuth = null; } else if (NET.online) { const tk = getToken(); if (tk) netSend({ t: 'resume', token: tk }); } };
  ws.onclose = () => {
    clearTimeout(to); const was = NET.status; NET.status = 'off'; NET.ws = null; NET.others.clear();
    if (NET.online) { if (was === 'up') toast('和服务器断开了，正在重连…'); setTimeout(netConnect, Math.min(10000, 1500 * ++NET.retry)); }
  };
  ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } netOn(m); };
}
const getToken = () => { try { return localStorage.getItem(NET_TOKEN_KEY); } catch (e) { return null; } };
const setToken = t => { try { if (t) localStorage.setItem(NET_TOKEN_KEY, t); else localStorage.removeItem(NET_TOKEN_KEY); } catch (e) {} };
function netAuth(msg) { if (NET.status === 'up') netSend(msg); else { NET.wantAuth = msg; netConnect(); } }
function netOn(m) {
  switch (m.t) {
    case 'auth':
      if (!m.ok) { if (m.expired) setToken(null); if (NET.online && S) { NET.online = false; toast('登录失效，请回到标题画面重新登录'); } authErr(m.err); if (authBox.hidden && mode === 'title') openAuth('login'); return; }
      setToken(m.token); NET.id = m.id; NET.lastPos = ''; NET.lastProf = ''; NET.others.clear();
      if (NET.online && S) { NET.dirty = true; toast('重新连上服务器了'); return; }  // 断线重连：沿用手上的进度
      NET.online = true; closeAuth();
      if (m.fresh || !m.save) beginGame('新的江湖', m.name);
      else { beginGame('继续江湖', null, m.save); S.name = m.name; }
      chatPush('系统', null, `${S.name}，欢迎回到江湖。附近＝同一张地图，门派＝同门，江湖＝所有在线的人。`);
      return;
    case 'kicked': NET.online = false; toast(m.why); mode = 'title'; S = null; menu = null; dlg = null; return;
    case 'here': NET.others.clear(); for (const o of m.list) netUpsert(o); return;
    case 'p': netUpsert(m); return;
    case 'insp': if (inspect && inspect.id === m.id) { if (m.card) inspect.card = m.card; else inspect.err = '这位侠士已经走远了。'; } return;
    case 'm': { const o = NET.others.get(m.id); if (o) { o.x = m.x; o.y = m.y; o.dir = m.dir; o.sit = m.sit; } return; }
    case 'leave': NET.others.delete(m.id); return;
    case 'chat': {
      const ch = m.ch === '门派' && m.sect && SECTS[m.sect] ? SECTS[m.sect].short : m.ch;
      chatPush(ch, m.from || null, m.text, m.id === NET.id);
      if (m.ch === '附近') { if (m.id === NET.id) P.say = { text: m.text, t: 360 }; else { const o = NET.others.get(m.id); if (o) o.say = { text: m.text, t: 360 }; } }
      return;
    }
  }
}
function netUpsert(m) {
  if (!S || !map || m.map !== map.id) { NET.others.delete(m.id); return; }
  let o = NET.others.get(m.id);
  if (!o) { o = { px: m.x * T, py: m.y * T, say: null }; NET.others.set(m.id, o); }
  Object.assign(o, { id: m.id, name: m.name, map: m.map, x: m.x, y: m.y, dir: m.dir || 'down', sit: m.sit, look: m.look || { body: 'buyi', hair: 'knot' }, sect: m.sect, camp: m.camp, title: m.title });
}
/* 每帧：把自己的位置、外观、存档同步给服务器；其他玩家平滑走到最新位置 */
function netTick() {
  if (!NET.online || !S || !map || NET.status !== 'up') return;
  if (frame % 30 === 0) {
    const prof = { look: playerLook(), sect: S.sect, camp: campOf(), title: S.rep >= 20 ? titleOf(REP_TITLES, S.rep) : null }, ps = JSON.stringify(prof);
    if (ps !== NET.lastProf) { NET.lastProf = ps; netSend({ t: 'prof', ...prof }); }
  }
  const key = `${map.id},${P.tx},${P.ty},${P.dir},${P.sit ? 1 : 0}`;
  if (key !== NET.lastPos && NET.lastProf && (frame - NET.lastPosF >= 4 || !NET.lastPos.startsWith(map.id + ','))) { NET.lastPos = key; NET.lastPosF = frame; netSend({ t: 'pos', map: map.id, x: P.tx, y: P.ty, dir: P.dir, sit: P.sit }); }
  if (NET.dirty && frame - NET.lastSave > 600) netSaveNow();
  for (const o of NET.others.values()) {
    const tx = o.x * T, ty = o.y * T, dx = tx - o.px, dy = ty - o.py;
    if (Math.abs(dx) > T * 4 || Math.abs(dy) > T * 4) { o.px = tx; o.py = ty; }
    else { o.px += Math.sign(dx) * Math.min(Math.abs(dx), 2); o.py += Math.sign(dy) * Math.min(Math.abs(dy), 2); }
    o.moving = dx !== 0 || dy !== 0;
    if (o.say && --o.say.t <= 0) o.say = null;
  }
}
function netSaveNow() {
  if (!NET.online || !S || NET.status !== 'up') return;
  S.x = P.tx; S.y = P.ty; S.dir = P.dir; S.map = map ? map.id : S.map;
  netSend({ t: 'save', s: S }); NET.dirty = false; NET.lastSave = frame;
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') netSaveNow(); });
addEventListener('pagehide', netSaveNow);
function netLogout() { netSaveNow(); NET.online = false; setToken(null); NET.others.clear(); try { NET.ws && NET.ws.close(); } catch (e) {} mode = 'title'; S = null; menu = null; dlg = null; titleSel = 0; }
/* 登录 / 注册框 */
const authBox = document.getElementById('authbox'), authUser = document.getElementById('authuser'), authPass = document.getElementById('authpass'), authName = document.getElementById('authname'), authErrEl = document.getElementById('autherr');
let authMode = 'login';
function authErr(t) { authErrEl.textContent = t || ''; }
function openAuth(md) {
  authMode = md; for (const k in held) release(k);
  const reg = md === 'register';
  document.getElementById('authtitle').textContent = reg ? '注册新账号' : '登录江湖';
  document.getElementById('authok').textContent = reg ? '注册并进入' : '登录';
  document.getElementById('authswitch').textContent = reg ? '已有账号？登录' : '没有账号？注册';
  authPass.autocomplete = reg ? 'new-password' : 'current-password';
  authName.hidden = !reg; if (reg && !authName.value) authName.value = randomName();
  authBox.hidden = false; mode = 'auth';
  setTimeout(() => { try { (authUser.value ? authPass : authUser).focus(); } catch (e) {} }, 50);
}
function closeAuth() { authBox.hidden = true; authUser.blur(); authPass.blur(); authName.blur(); }
document.getElementById('authswitch').addEventListener('click', () => { authErr(''); openAuth(authMode === 'login' ? 'register' : 'login'); });
document.getElementById('authback').addEventListener('click', () => { closeAuth(); mode = 'title'; });
document.getElementById('authform').addEventListener('submit', e => {
  e.preventDefault();
  const user = authUser.value.trim(), pass = authPass.value;
  if (!/^[A-Za-z0-9_]{3,16}$/.test(user)) return authErr('账号要 3～16 位英文字母、数字或下划线。');
  if (pass.length < 6) return authErr('密码至少 6 位。');
  if (authMode === 'register') {
    const nm = authName.value.replace(/\s+/g, '').slice(0, 6);
    if (!nm) return authErr('请给角色起个名字。');
    const missing = [...nm].filter(ch => !GL[ch]); if (missing.length) return authErr(`“${missing.join('')}”这几个字画面上显示不了，换个字吧。`);
    authErr('正在注册…'); netAuth({ t: 'register', user, pass, name: nm });
  } else { authErr('正在登录…'); netAuth({ t: 'login', user, pass }); }
  if (NET.status === 'off' && !NET.ws) setTimeout(() => { if (!NET.online && NET.status !== 'up') authErr('连不上服务器，稍后再试。'); }, 4500);
});
if (NET.url) netConnect();

