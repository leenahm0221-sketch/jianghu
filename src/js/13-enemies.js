/* ---------------- enemies ---------------- */
function updEnemies() {
  for (const e of enemies) {
    const d = ED(e);
    if (e.dead) {
      if (e.respawn !== Infinity && --e.respawn <= 0) {
        if (!occupied(e.home.x, e.home.y, e) && Math.abs(P.tx - e.home.x) + Math.abs(P.ty - e.home.y) > 5) Object.assign(e, makeEnemy(e.kind, e.home.x, e.home.y));
        else e.respawn = 120;
      }
      continue;
    }
    if (e.hitT > 0) e.hitT--;
    if (d.dummy) continue;
    if (e.poisonT > 0) { e.poisonT--; if (e.poisonT % 60 === 0) { hurtEnemy(e, e.poisonD, `毒${e.poisonD}`); if (e.dead) continue; } }
    if (e.cd > 0) e.cd--;
    if (e.moving) { stepEnt(e, d.mv); continue; }
    if (e.stunT > 0) { e.stunT--; continue; }
    const dx = P.tx - e.tx, dy = P.ty - e.ty, dist = Math.abs(dx) + Math.abs(dy);
    if (dx) e.face = dx > 0 ? 'right' : 'left';
    const calmCamp = (d.camp && !campHostile(d.camp) && !foeOf(e.kind) && !e.provoked) || (safeSpots.length && inSafe(P.tx, P.ty) && !e.adj && !d.hunter && e.kind !== 'hunter' && e.kind !== 'pantu');
    if (!d.passive && !calmCamp && dist === 1 && !P.dead && !P.moving) {
      e.dir = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up';
      if (!e.adj) { e.adj = true; e.cd = Math.max(e.cd, 28); }
      if (e.cd <= 0) {
        let dmg = Math.round(d.atk * (0.8 + Math.random() * 0.4));
        if (e.kind === 'boss' && ++e.combo % 3 === 0) { dmg = Math.round(dmg * 1.8); floatText(e.px + 8, e.py - 6, '黑风掌！', true); }
        e.cd = d.cd; e.lunge = 8;
        hurtPlayer(dmg, e);
      }
      continue;
    }
    if (dist > 1 && !d.passive && !d.camp && !d.hunter) e.adj = false;
    if (d.intro && dist <= 3 && !S.flags[e.kind + 'Met']) {
      S.flags[e.kind + 'Met'] = true;
      say(d.name, d.intro);
      return;
    }
    if (e.kind === 'boss' && dist <= 3 && !S.flags.bossMet) {
      S.flags.bossMet = true;
      say('黑风寨主', ['哪来的毛头小子，也敢闯我黑风寨？', '吃我一记黑风掌！']);
      return;
    }
    if (--e.stepT > 0) continue;
    e.stepT = d.step + rnd(0, 6);
    let tries = [];
    if (d.passive && e.flee > 0 && dist <= 4) {
      e.flee--;
      tries = [[-Math.sign(dx), 0], [0, -Math.sign(dy)], [0, Math.random() < 0.5 ? 1 : -1], [Math.random() < 0.5 ? 1 : -1, 0]].filter(([a, b]) => (a || b) && Math.abs(e.tx + a - e.home.x) + Math.abs(e.ty + b - e.home.y) <= 2);
    } else if (!d.passive && !calmCamp && dist <= d.sight && !P.dead && (d.boss || d.hunter || e.kind === 'hunter' || e.kind === 'pantu' || Math.abs(P.tx - e.home.x) + Math.abs(P.ty - e.home.y) <= LEASH)) {
      const ax = [Math.sign(dx), 0], ay = [0, Math.sign(dy)];
      tries = (Math.abs(dx) >= Math.abs(dy) ? [ax, ay] : [ay, ax]).filter(([a, b]) => a || b);
    } else {
      if (dist > 6) e.adj = false;
      const hd = Math.abs(e.tx - e.home.x) + Math.abs(e.ty - e.home.y);
      if (hd > 3) tries = [[Math.sign(e.home.x - e.tx), 0], [0, Math.sign(e.home.y - e.ty)]].filter(([a, b]) => a || b);
      else if (Math.random() < 0.45) { const k = Object.keys(DIRS)[rnd(0, 3)]; tries = [DIRS[k]]; }
    }
    if (safeSpots.length && !e.adj) tries = tries.filter(([a, b]) => !inSafe(e.tx + a, e.ty + b));
    for (const [mx, my] of tries) {
      if (canMove(e.tx + mx, e.ty + my, e)) {
        e.tx += mx; e.ty += my; e.moving = true;
        e.dir = mx > 0 ? 'right' : mx < 0 ? 'left' : my > 0 ? 'down' : 'up';
        if (mx) e.face = mx > 0 ? 'right' : 'left';
        break;
      }
    }
  }
}
function updNpcs() {
  for (const n of npcs) if (frame % 150 === (n.x * 7) % 150 && Math.random() < 0.5) n.dir = Object.keys(DIRS)[rnd(0, 3)];
}

