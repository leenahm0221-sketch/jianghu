/* 江湖少年 联网服务器（第 1 步：账号、云存档、同图看见彼此、聊天）
   不依赖任何第三方包：node server.js 就能跑。
   - 网页：默认直接用仓库根目录里的游戏文件，浏览器打开 http://服务器地址:端口/ 即可
   - 实时连接：同一个端口的 /ws
   - 数据：data/accounts.json（密码只存加盐哈希）
   环境变量：PORT（默认 8080） DATA_DIR（默认 server/data） PUBLIC_DIR（默认仓库根目录） */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');

const PORT = +process.env.PORT || 8080;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const PUBLIC_DIR = path.resolve(process.env.PUBLIC_DIR || path.join(__dirname, '..'));  // 默认就是游戏网页所在的仓库根目录
fs.mkdirSync(DATA_DIR, { recursive: true });
const DB_FILE = path.join(DATA_DIR, 'accounts.json');

/* ---------------- 存储：一个 JSON 文件，改动后 1 秒内落盘（先写临时文件再改名，断电不会写坏） ---------------- */
let db = { accounts: {}, tokens: {} };
try { db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); db.accounts ||= {}; db.tokens ||= {}; } catch (e) { /* 第一次启动 */ }
let dirty = false;
function markDirty() { dirty = true; }
function flush() {
  if (!dirty) return; dirty = false;
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db)); fs.renameSync(tmp, DB_FILE);
}
setInterval(flush, 1000);
for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => { flush(); process.exit(0); });

const hashPass = (pass, salt) => crypto.scryptSync(pass, salt, 32).toString('hex');
const newToken = () => crypto.randomBytes(24).toString('hex');
const TOKEN_DAYS = 30;
const USER_RE = /^[A-Za-z0-9_]{3,16}$/;
const nameTaken = name => Object.values(db.accounts).some(a => a.name === name);

/* ---------------- 静态网页 ---------------- */
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.css': 'text/css' };
const server = http.createServer((req, res) => {
  let p = decodeURIComponent((req.url || '/').split('?')[0]);
  if (p === '/') p = '/index.html';
  if (p === '/health') { res.writeHead(200, { 'content-type': 'text/plain' }); return res.end(`ok ${online.size} online`); }
  const file = path.join(PUBLIC_DIR, path.normalize(p).replace(/^(\.\.[/\\])+/, ''));
  /* 只给网页文件：服务器代码、存档数据、隐藏文件一律不给看 */
  if (!file.startsWith(PUBLIC_DIR + path.sep) || file.startsWith(path.join(__dirname) + path.sep) || file.startsWith(DATA_DIR) || /[/\\]\./.test(file.slice(PUBLIC_DIR.length))) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] || 'application/octet-stream', 'cache-control': 'no-cache' });
    res.end(buf);
  });
});

/* ---------------- 极简 WebSocket（RFC 6455：文本帧、分片、ping/pong、关闭） ---------------- */
const GUID = '258EAFA5-E914-47DA-95CA-C5AB0DC85B11', MAX_MSG = 256 * 1024;
server.on('upgrade', (req, sock) => {
  if ((req.url || '').split('?')[0] !== '/ws' || (req.headers.upgrade || '').toLowerCase() !== 'websocket') { sock.destroy(); return; }
  const key = req.headers['sec-websocket-key'];
  if (!key) { sock.destroy(); return; }
  const accept = crypto.createHash('sha1').update(key + GUID).digest('base64');
  sock.write(`HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ${accept}\r\n\r\n`);
  sock.setNoDelay(true);
  const c = { sock, buf: Buffer.alloc(0), frag: [], alive: true, ip: req.headers['x-forwarded-for'] || sock.remoteAddress };
  c.send = obj => { if (!sock.destroyed) sock.write(frame(Buffer.from(JSON.stringify(obj)), 1)); };
  c.close = () => { try { sock.write(frame(Buffer.alloc(0), 8)); } catch (e) {} sock.end(); };
  sock.on('data', d => { c.buf = Buffer.concat([c.buf, d]); if (c.buf.length > MAX_MSG * 2) return sock.destroy(); parseFrames(c); });
  sock.on('close', () => onClose(c)); sock.on('error', () => sock.destroy());
  onOpen(c);
});
function frame(payload, op) {
  const n = payload.length, head = n < 126 ? Buffer.from([0x80 | op, n]) : n < 65536 ? Buffer.from([0x80 | op, 126, n >> 8, n & 255]) : (() => { const h = Buffer.alloc(10); h[0] = 0x80 | op; h[1] = 127; h.writeBigUInt64BE(BigInt(n), 2); return h; })();
  return Buffer.concat([head, payload]);
}
function parseFrames(c) {
  for (;;) {
    const b = c.buf; if (b.length < 2) return;
    const fin = b[0] & 0x80, op = b[0] & 15, masked = b[1] & 0x80; let len = b[1] & 127, off = 2;
    if (len === 126) { if (b.length < 4) return; len = b.readUInt16BE(2); off = 4; }
    else if (len === 127) { if (b.length < 10) return; len = Number(b.readBigUInt64BE(2)); off = 10; }
    if (len > MAX_MSG) return c.sock.destroy();
    const need = off + (masked ? 4 : 0) + len; if (b.length < need) return;
    let data = b.subarray(off + (masked ? 4 : 0), need);
    if (masked) { const mk = b.subarray(off, off + 4); data = Buffer.from(data); for (let i = 0; i < data.length; i++) data[i] ^= mk[i & 3]; }
    c.buf = b.subarray(need);
    if (op === 8) { c.close(); return; }
    if (op === 9) { c.sock.write(frame(data, 10)); continue; }
    if (op === 10) { c.alive = true; continue; }
    if (op === 1 || op === 0) {
      c.frag.push(data);
      if (fin) { const txt = Buffer.concat(c.frag).toString('utf8'); c.frag = []; let msg; try { msg = JSON.parse(txt); } catch (e) { continue; } try { onMessage(c, msg); } catch (e) { console.error('handler error', e); } }
    }
  }
}
setInterval(() => { for (const c of conns) { if (!c.alive) { c.sock.destroy(); continue; } c.alive = false; try { c.sock.write(frame(Buffer.alloc(0), 9)); } catch (e) {} } }, 25000);

/* ---------------- 游戏逻辑 ---------------- */
const conns = new Set(), online = new Map(); // online: user -> conn
let nextId = 1;
const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f<>]/g, '').slice(0, n);
const pub = c => ({ id: c.id, name: c.name, map: c.map, x: c.x, y: c.y, dir: c.dir, sit: c.sit, look: c.look, sect: c.sect, camp: c.camp, title: c.title });
const inMap = (map, except) => [...online.values()].filter(o => o.map === map && o !== except);
const toMap = (map, obj, except) => { for (const o of inMap(map, except)) o.send(obj); };

function onOpen(c) { conns.add(c); c.id = nextId++; c.send({ t: 'hello', v: 1 }); }
function onClose(c) {
  conns.delete(c);
  if (c.user && online.get(c.user) === c) { online.delete(c.user); if (c.map) toMap(c.map, { t: 'leave', id: c.id }); }
}
function login(c, user, extra) {
  const old = online.get(user);
  if (old && old !== c) { old.send({ t: 'kicked', why: '你的账号在别处登录了。' }); old.user = null; online.delete(user); if (old.map) toMap(old.map, { t: 'leave', id: old.id }); old.close(); }
  const a = db.accounts[user];
  const token = newToken(); db.tokens[token] = { user, exp: Date.now() + TOKEN_DAYS * 864e5 }; markDirty();
  c.user = user; c.name = a.name; c.map = null; c.lastChat = 0; c.lastSave = 0;
  online.set(user, c);
  c.send({ t: 'auth', ok: true, user, name: a.name, token, save: a.save || null, id: c.id, ...extra });
}
function onMessage(c, m) {
  if (!m || typeof m.t !== 'string') return;
  if (m.t === 'register') {
    const user = clean(m.user, 16), pass = String(m.pass || ''), name = clean(m.name, 6).replace(/\s/g, '');
    if (!USER_RE.test(user)) return c.send({ t: 'auth', ok: false, err: '账号要 3～16 位英文字母、数字或下划线。' });
    if (pass.length < 6 || pass.length > 64) return c.send({ t: 'auth', ok: false, err: '密码至少 6 位。' });
    if (!name) return c.send({ t: 'auth', ok: false, err: '请给角色起个名字。' });
    if (db.accounts[user]) return c.send({ t: 'auth', ok: false, err: '这个账号已经有人注册了。' });
    if (nameTaken(name)) return c.send({ t: 'auth', ok: false, err: `“${name}”这个名字已经有人用了，换一个吧。` });
    const salt = crypto.randomBytes(16).toString('hex');
    db.accounts[user] = { salt, hash: hashPass(pass, salt), name, save: null, created: Date.now() }; markDirty();
    return login(c, user, { fresh: true });
  }
  if (m.t === 'login') {
    const user = clean(m.user, 16), a = db.accounts[user];
    if (!a || hashPass(String(m.pass || ''), a.salt) !== a.hash) return c.send({ t: 'auth', ok: false, err: '账号或密码不对。' });
    return login(c, user);
  }
  if (m.t === 'resume') {
    const tk = db.tokens[String(m.token || '')];
    if (!tk || tk.exp < Date.now() || !db.accounts[tk.user]) return c.send({ t: 'auth', ok: false, err: '登录已过期，请重新登录。', expired: true });
    delete db.tokens[m.token]; markDirty();
    return login(c, tk.user);
  }
  if (!c.user) return;
  const a = db.accounts[c.user];
  switch (m.t) {
    case 'save': {
      const s = m.s; if (!s || typeof s !== 'object' || !s.skills) return;
      const txt = JSON.stringify(s); if (txt.length > 200000) return;
      if (s.name && s.name !== a.name) { const nm = clean(s.name, 6); if (nm && !nameTaken(nm)) { a.name = nm; c.name = nm; } else s.name = a.name; }
      a.save = s; a.savedAt = Date.now(); markDirty();
      return;
    }
    case 'prof': {
      c.look = m.look && typeof m.look === 'object' ? { body: clean(m.look.body, 16), hat: m.look.hat ? clean(m.look.hat, 16) : null, weapon: m.look.weapon ? clean(m.look.weapon, 16) : null, hair: clean(m.look.hair, 12) || 'knot' } : c.look;
      c.sect = m.sect ? clean(m.sect, 6) : null; c.camp = m.camp ? clean(m.camp, 2) : null; c.title = m.title ? clean(m.title, 8) : null;
      if (c.map) toMap(c.map, { t: 'p', ...pub(c) }, c);
      return;
    }
    case 'pos': {
      const map = clean(m.map, 20), x = m.x | 0, y = m.y | 0, dir = ['up', 'down', 'left', 'right'].includes(m.dir) ? m.dir : 'down', sit = !!m.sit;
      if (map !== c.map) {
        if (c.map) toMap(c.map, { t: 'leave', id: c.id }, c);
        c.map = map; c.x = x; c.y = y; c.dir = dir; c.sit = sit;
        c.send({ t: 'here', list: inMap(map, c).map(pub) });
        toMap(map, { t: 'p', ...pub(c) }, c);
      } else {
        c.x = x; c.y = y; c.dir = dir; c.sit = sit;
        toMap(map, { t: 'm', id: c.id, x, y, dir, sit }, c);
      }
      return;
    }
    case 'chat': {
      const now = Date.now(); if (now - c.lastChat < 800) return c.send({ t: 'chat', ch: '系统', text: '说话太快了，歇口气。' });
      c.lastChat = now;
      const text = clean(m.text, 60).trim(); if (!text) return;
      const ch = ['附近', '门派', '江湖'].includes(m.ch) ? m.ch : '附近';
      const msg = { t: 'chat', ch, id: c.id, from: c.name, text, sect: c.sect };
      if (ch === '附近') { c.send(msg); toMap(c.map, msg, c); }
      else if (ch === '门派') { if (!c.sect) return; for (const o of online.values()) if (o.sect === c.sect) o.send(msg); }
      else for (const o of online.values()) o.send(msg);
      return;
    }
    case 'who': return c.send({ t: 'who', n: online.size });
  }
}

server.listen(PORT, () => console.log(`江湖少年服务器已启动：http://localhost:${PORT}/  （${Object.keys(db.accounts).length} 个账号）`));
