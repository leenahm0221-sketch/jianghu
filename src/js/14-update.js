/* ---------------- main update ---------------- */
const allFull = () => S.hp >= maxHP() && S.mp >= maxMP() && S.st >= maxST() && ['head', 'arm', 'leg'].every(k => S.parts[k] >= maxPart());
function update() {
  frame++;
  if (!nameBox.hidden) return;
  if (mode === 'title') return updTitle();
  if (mode === 'naming' || mode === 'auth') return;
  if (banner && --banner.t <= 0) banner = null;
  for (const t of toasts) t.t--;
  toasts = toasts.filter(t => t.t > 0);
  fx.forEach(f => f.t--); fx = fx.filter(f => f.t > 0);
  if (shake > 0) shake--;
  sparks.forEach(k => k.t--); sparks = sparks.filter(k => k.t > 0);
  if (dlg) return updDialog();
  if (inspect) {
    if (pressed.b || pressed.start || ++inspect.t > 60 * 60) { inspect = null; sfx('menu'); return; }
    if (inspect.card && (pressed.left || pressed.right)) { inspect.btn = ((inspect.btn || 0) + (pressed.left ? 3 : 1)) % 4; inspect.t = 0; sfx('menu'); }
    if (pressed.a && inspect.card) { const b = ['私聊', '切磋', '组队', '交易'][inspect.btn || 0]; toast(`${b}：等联网第二步开放`); sfx('menu'); }
    if (pressed.a && !inspect.card) { inspect = null; sfx('menu'); }
    return;
  }
  if (menu) return updMenu();
  if (wpick) return updWpick();
  if (hitStop > 0) { hitStop--; return; }
  if (S.coach > 0 && --S.coach === 0) toast('陪练时间到了');
  if ((S.ageT += FAST === 2 ? 20 : FASTX(8)) >= ageFrames(S.age)) { S.ageT = 0; S.age++; toast(`你已 ${S.age} 岁，元气增长到 ${qi()}`); sfx('level'); if (TRIALS.some(t => t.age === S.age)) toast('百晓生那里有新的历练'); }
  updPlayer(); updEnemies(); updNpcs();
  if (!P.dead) {
    tickBuffs();
    const xf = pv('心法', 'mp'), calm = frame - lastFight > 300, q = qi();
    const sm = S.passive['心法'] ? 1 + xf / 25 : 0.6;
    const wasFull = allFull();
    const rg = FASTX(3);
    S.mp = Math.min(maxMP(), S.mp + (P.sit ? 0.05 * sm : 0.01 * (1 + xf / 25)) * rg);
    S.hp = Math.min(maxHP(), S.hp + (P.sit ? 0.07 * sm : calm ? 0.012 * (1 + q / 40) : 0) * rg);
    const pr = (P.sit ? 0.04 * sm : calm ? 0.006 * (1 + q / 40) : 0.002) * rg;
    const resting = frame - (P.lastAtk || -999) > 45;
    S.st = Math.min(maxST(), S.st + (P.sit ? 0.35 : resting ? 0.12 : 0.06));
    for (const k of ['head', 'arm', 'leg']) S.parts[k] = Math.min(maxPart(), S.parts[k] + pr);
    if (P.sit && !wasFull && allFull()) toast('气息圆满，伤势尽复');
    if (P.sit) train(S.passive['心法'], 0.012);
  }
  if (++saveTimer > 60 * 30) { saveTimer = 0; save(); }
}

