(() => {
'use strict';
/* Palettes: real DMG pea-green LCD, the grey Pocket LCD, and a brighter backlit look */
const PALETTES = [
  { name: '黑白', c: ['#e8e8e0', '#a8a8a0', '#58585a', '#18181a'] },
  { name: '豆绿', c: ['#9bbc0f', '#8bac0f', '#306230', '#0f380f'] },
  { name: '口袋', c: ['#c4cfa1', '#8b956d', '#4d533c', '#1f1f1f'] },
  { name: '背光', c: ['#e0f8d0', '#88c070', '#346856', '#081820'] },
];
let palIdx = 0;
try { palIdx = clamp0(parseInt(localStorage.getItem('jianghu-pal2') || '0', 10)); } catch (e) { palIdx = 0; }
function clamp0(v) { return v >= 0 && v < PALETTES.length ? v : 0; }
let PAL = PALETTES[palIdx].c.slice();
const T = 16;
let GW = 160, GH = 144, UX = 0, UB = 144, SCALE = 4, MW = 160, SAFE_W = 160;

const screen = document.getElementById('screen');
const sc = screen.getContext('2d');
const world = document.createElement('canvas'); world.width = GW; world.height = GH;
const g = world.getContext('2d');
g.imageSmoothingEnabled = false;

function R(x, y, w, h, c) { g.fillStyle = PAL[c]; g.fillRect(Math.floor(x), Math.floor(y), w, h); }
function box(x, y, w, h) { R(x, y, w, h, 3); R(x + 1, y + 1, w - 2, h - 2, 0); R(x + 2, y + 2, w - 4, h - 4, 3); R(x + 3, y + 3, w - 6, h - 6, 0); }

/* Bitmap font: glyphs pre-rasterised from BoutiqueBitmap9x9 (SIL OFL 1.1, by Zitong Chen / 精品点阵体). Drawn 1:1 on the 160×144 screen. */
