/* ---------------- loop ---------------- */
let last = performance.now(), acc = 0;
function loop(t) {
  acc += Math.min(100, t - last); last = t;
  if (window.__frozen) acc = 0;   /* 测试截图用：冻住画面 */
  while (acc >= 1000 / 60) { update(); netTick(); for (const k in pressed) pressed[k] = false; acc -= 1000 / 60; }
  render(); musicTick(); if (frame % 10 === 0) quickRefresh();
  requestAnimationFrame(loop);
}
function start(data) {
  if (data && data.S) { S = migrate(data.S); fixState(); mode = 'play'; enterMap(S.map, S.x, S.y, S.dir); banner = null; }
  requestAnimationFrame(loop);
}
addEventListener('pagehide', () => { if (mode === 'play') save(); });
document.addEventListener('visibilitychange', () => { if (document.hidden && mode === 'play') save(); });
window.claude?.hot?.snapshot?.(() => (mode === 'play' && S ? { S: { ...S, x: P.tx, y: P.ty, dir: P.dir } } : {}));
window.claude?.hot?.ready ? window.claude.hot.ready(start) : start(window.claude?.hot?.data ?? {});
window.__game = { demoPlayers: () => demoPlayers(), inspectFake: () => inspectPlayer([...NET.others.values()][0]), testMaxAll: () => testMaxAll(), attack: () => attack(), migrate: s => migrate(s), FISH, resSpecial: (x, y, t) => resSpecial(x, y, t), toast: t => toast(t), killEnemy: e => killEnemy(e), EQ, MAIN, FOLK_TASK, COOK, BREW_ALL: () => ({ BREW, FORGE, WEAVE: typeof WEAVE !== "undefined" ? WEAVE : null, COOK }), RES_BONUS, VILLAIN_WHERE: () => VILLAIN_WHERE, save: () => save(), loadSave: () => loadSave(), stationSpot, drawPerson: (...a) => drawPerson(...a), R: (...a) => R(...a), craftMenu: (k) => k === "brew" ? craft("孙郎中", BREW, "lianyao", () => {}) : craft("铁匠", FORGE["兵器"], "duanzao", () => {}), drawTile: (t, x, y, mx, my) => drawTile(t, x, y, mx, my), get g() { return g; }, get UX() { return UX; }, get FAST() { return FAST; }, set FAST(v) { FAST = v; }, SK, DROPS, maxHP: () => maxHP(), defense: (i) => defense(i), tick: () => update(), get P2() { return P; }, set dlg(v) { dlg = v; }, get mus() { return mus; }, get acState() { return ac && ac.state; }, foeOf, newSectTask, storyTalk, navGoal, cqStep, makeEnemy: (k,x,y)=>makeEnemy(k,x,y), envoyTalk, get safeSpots() { return safeSpots; }, mapLevels, dangerOf, levelRange, ED, netSaveNow, ITEMS, readStele, openChest, peddlerTalk, NET, get inspect() { return inspect; }, NPCS, SOLID, SECTS, RUMORS, HERMITS, sectTalk, tellRumor, hermitTalk, innTalk, makeEnemy, get enemies2() { return enemies; }, get cam() { return cam; }, get dlg() { return dlg; }, get menu() { return menu; }, get S() { return S; }, MAPS, P, SK, EN, train, qi, lv, get map() { return map; }, set S(v) { S = v; }, get enemies() { return enemies; }, get npcs() { return npcs; }, press, release, warp: (m, x, y) => enterMap(m, x, y, 'down'), navGoal, goalPoint, nextHop, ageFrames, ageQi, get frame() { return frame; }, set frame(v) { frame = v; } };
})();
