const FH = FONT_DATA.h, GL = {};
(() => {
  const bin = atob(FONT_DATA.d), bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  let off = 0, i = 0;
  for (const ch of FONT_DATA.c) {
    const w = FONT_DATA.w[i++], bits = new Uint8Array(w * FH);
    for (let k = 0; k < w * FH; k++, off++) bits[k] = (bytes[off >> 3] >> (7 - (off & 7))) & 1;
    GL[ch] = { w, bits };
  }
})();
const glyphCache = new Map();
function glyph(ch, c) {
  const gl = GL[ch] || GL['?'];
  const key = c + '|' + ch;
  let cv = glyphCache.get(key);
  if (!cv) {
    cv = document.createElement('canvas'); cv.width = Math.max(1, gl.w); cv.height = FH;
    const x = cv.getContext('2d'); x.fillStyle = PAL[c];
    for (let y = 0; y < FH; y++) for (let k = 0; k < gl.w; k++) if (gl.bits[y * gl.w + k]) x.fillRect(k, y, 1, 1);
    glyphCache.set(key, cv);
  }
  return [cv, gl.w];
}
function tw(s) { let w = 0; for (const ch of String(s)) w += (GL[ch] || GL['?']).w; return w; }
function txt(s, x, y, c = 3, align = 'left', scale = 1) {
  s = String(s);
  let cx = Math.round(align === 'center' ? x - tw(s) * scale / 2 : align === 'right' ? x - tw(s) * scale : x);
  y = Math.round(y);
  for (const ch of s) { const [cv, w] = glyph(ch, c); g.drawImage(cv, cx, y, w * scale, FH * scale); cx += w * scale; }
}
function txtOutline(s, x, y, align = 'center') {
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) txt(s, x + dx, y + dy, 0, align);
  txt(s, x, y, 3, align);
}
function wrap(s, maxW) {
  const out = [];
  for (const para of String(s).split('\n')) {
    let line = '';
    for (const ch of para) {
      if (tw(line + ch) > maxW && line) { out.push(line); line = ch; } else line += ch;
    }
    out.push(line);
  }
  return out;
}
function setPalette(i) {
  palIdx = i; PAL = PALETTES[i].c.slice(); glyphCache.clear(); buildGrid();
  PAL.forEach((c, k) => document.documentElement.style.setProperty('--gb' + k, c));
  try { localStorage.setItem('jianghu-pal2', String(i)); } catch (e) {}
}
/* LCD dot-matrix: thin light gaps between the big pixels, like the DMG panel */
const grid = document.createElement('canvas');
function buildGrid() {
  grid.width = screen.width; grid.height = screen.height;
  const x = grid.getContext('2d'); x.clearRect(0, 0, grid.width, grid.height);
  x.fillStyle = PAL[0]; x.globalAlpha = 0.26;
  for (let i = 3; i < grid.width; i += 4) x.fillRect(i, 0, 1, grid.height);
  for (let i = 3; i < grid.height; i += 4) x.fillRect(0, i, grid.width, 1);
}
buildGrid();
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hash = (x, y) => (((x * 73856093) ^ (y * 19349663)) >>> 0);
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

