/* ---------------- 室内：每座有门的房子都能走进去 ----------------
   房子正门那一格变成门口（只有人能走），走进去就到这座房子的室内小地图；
   室内最下面一排正中是门，走出去回到门口外面。
   店铺、客栈、药铺这些房子的主人搬进屋里，站在柜台后面；门派大殿的掌门站在供桌前。 */
const IN_SIZE = {
  house: [9, 7], home: [9, 7], chief: [9, 7],
  smith: [11, 8], pharmacy: [11, 8], pawn: [11, 8], bank: [11, 8], cloth: [11, 8],
  inn: [13, 8], tavern: [13, 9],
  temple: [11, 9], tower: [11, 9], nunnery: [13, 9], library: [13, 9], school: [13, 9], escort: [13, 9], hall: [15, 10],
};
const IN_SHOP = new Set(['smith', 'pharmacy', 'pawn', 'bank', 'cloth', 'inn', 'tavern']);
const IN_HOME = new Set(['house', 'home', 'chief']);
const IN_NAME = { house: '民居', home: '民居', chief: '村长家' };
function makeInterior(ext, b) {
  const [W, H] = IN_SIZE[b.kind], mid = Math.floor(W / 2), k = b.kind;
  const g = Array.from({ length: H }, (_, y) => Array.from({ length: W }, (_, x) => (y < 2 || x === 0 || x === W - 1 || y === H - 1 ? 'Y' : 'L')));
  const set = (x, y, c) => { if (x > 0 && x < W - 1 && y > 1 && y < H - 1) g[y][x] = c; };
  g[H - 1][mid] = 'E';
  const spots = [];
  if (IN_SHOP.has(k)) {
    /* 店铺：后墙一排货架，中间一道柜台，掌柜站在柜台后面 */
    for (let x = 1; x < W - 1; x++) set(x, 2, 'h');
    for (let x = mid - 2; x <= mid + 2; x++) set(x, 4, 'n');
    spots.push([mid, 3], [mid - 1, 3], [mid + 1, 3]);
    if (k === 'inn') { set(1, 3, 'b'); set(1, 5, 'b'); set(W - 2, 3, 'b'); set(W - 2, 5, 'b'); }
    if (k === 'tavern') { set(2, 5, 't'); set(W - 3, 5, 't'); set(2, 7, 't'); set(W - 3, 7, 't'); }
    if (k === 'inn') set(3, 6, 't');
  } else if (IN_HOME.has(k)) {
    /* 民居：床、桌子、柜子，角落里有个旧木箱 */
    set(1, 2, 'b'); set(W - 2, 2, 'h'); set(W - 3, 2, 'h'); set(W - 3, 4, 't');
    if (k !== 'chief') set(1, 4, 'X');
    spots.push([mid, 3], [mid - 2, 3]);
  } else {
    /* 庙宇、大殿：正面供桌（庙里有神像），两排柱子，中间一条红地毯通到门口 */
    if (k === 'school' || k === 'escort') for (let x = 1; x < W - 1; x++) set(x, 2, 'h');
    else for (let x = mid - 1; x <= mid + 1; x++) set(x, 2, 'a');
    for (let y = 3; y < H - 1; y++) set(mid, y, 'u');
    for (const y of [3, H - 3]) { set(2, y, 'p'); set(W - 3, y, 'p'); }
    if (k === 'library') for (const y of [4, 6]) for (const x of [1, 3, W - 4, W - 2]) set(x, y, 'h');
    spots.push([mid, 3], [mid - 2, 4], [mid + 2, 4], [mid - 2, 6], [mid + 2, 6]);
  }
  return { name: `${ext.name}·${b.label || IN_NAME[k] || '屋里'}`, rows: g.map(r => r.join('')), buildings: [], spawns: [], signs: {}, ground: 'indoor', indoor: true, ikind: k, spots, doorX: mid };
}
for (const extId of Object.keys(MAPS)) {
  const ext = MAPS[extId];
  if (ext.indoor) continue;
  (ext.buildings || []).forEach((b, i) => {
    if (!IN_SIZE[b.kind] || b.style === 'pagoda') return;
    const dx = b.x + Math.floor(b.w / 2), dy = b.y + b.h - 1;
    if (dy + 1 >= ext.h || SOLID.has(ext.rows[dy + 1][dx])) return;   /* 门口外面走不到的不开门 */
    const id = `${extId}~${i}`, m = makeInterior(ext, b);
    m.id = id; m.w = m.rows[0].length; m.h = m.rows.length; m.doors = {};
    m.exits = { [`${m.doorX},${m.h - 1}`]: { map: extId, x: dx, y: dy + 1, dir: 'down' } };
    MAPS[id] = m;
    ext.rows[dy] = ext.rows[dy].slice(0, dx) + 'E' + ext.rows[dy].slice(dx + 1);
    ext.exits[`${dx},${dy}`] = { map: id, x: m.doorX, y: m.h - 2, dir: 'up' };
    b.inside = id;
    /* 房子主人（和门派大殿门口的本派弟子）搬进屋里 */
    const list = NPCS[extId] || [], sectNames = new Set(Object.values(SECTS).map(s => s.name));
    const movers = list.filter(n => n.id === b.owner || (['hall', 'nunnery', 'temple'].includes(b.kind) && sectNames.has(n.role) && Math.abs(n.x - dx) <= 3 && n.y >= dy - 1 && n.y <= dy + 2));
    movers.sort((a, c) => (c.id === b.owner) - (a.id === b.owner) || !!c.icon - !!a.icon);
    movers.forEach((n, j) => {
      const sp = m.spots[j]; if (!sp) return;
      list.splice(list.indexOf(n), 1);
      n.x = sp[0]; n.y = sp[1]; n.dir = 'down';
      (NPCS[id] || (NPCS[id] = [])).push(n);
    });
  });
}
