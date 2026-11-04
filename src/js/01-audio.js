/* ---------------- audio ---------------- */
let ac = null, muted = false;
function audioInit() {
  if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
  if (ac && ac.state === 'suspended') ac.resume().catch(() => {});
}
function tone(f, d, type = 'square', v = 0.035, slide = 0, delay = 0) {
  if (!ac || muted) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator(), gn = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f, t);
  if (slide) o.frequency.linearRampToValueAtTime(Math.max(30, f + slide), t + d);
  gn.gain.setValueAtTime(v, t); gn.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(gn).connect(ac.destination); o.start(t); o.stop(t + d + 0.03);
}
const SFX = {
  swing: () => tone(320, 0.06, 'square', 0.025, -160),
  hit: () => tone(170, 0.09, 'square', 0.05, -90),
  heavy: () => { tone(240, 0.16, 'sawtooth', 0.04, -150); tone(120, 0.2, 'square', 0.03, -60, 0.05); },
  hurt: () => tone(110, 0.16, 'square', 0.05, -50),
  coin: () => { tone(988, 0.06); tone(1319, 0.12, 'square', 0.035, 0, 0.06); },
  level: () => [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.11, 'square', 0.035, 0, i * 0.08)),
  menu: () => tone(660, 0.04, 'square', 0.025),
  talk: () => tone(900, 0.015, 'square', 0.012),
  die: () => [392, 330, 262, 196].forEach((f, i) => tone(f, 0.2, 'triangle', 0.05, 0, i * 0.18)),
};
const sfx = n => SFX[n] && SFX[n]();
/* ---------- 背景音乐：五声音阶的 8 位小曲，城镇、野外、地下、邪派地盘各一首，循环播放 ----------
   mel 是旋律（每格一个八分音符，数字是 MIDI 音高，0 是休止），bass 是每小节的根音 */
let musicOn = true;
try { musicOn = localStorage.getItem('jianghu-music') !== '0'; } catch (e) {}
const TRACKS = {
  town: { bpm: 92, wave: 'triangle', vol: 0.03, mel: [67, 69, 72, 0, 74, 72, 69, 0, 67, 64, 67, 69, 67, 0, 0, 0, 72, 74, 76, 0, 74, 72, 69, 72, 67, 0, 69, 67, 64, 0, 0, 0], bass: [48, 45, 43, 48] },
  wild: { bpm: 118, wave: 'square', vol: 0.016, mel: [69, 72, 74, 76, 0, 76, 74, 72, 74, 0, 72, 69, 67, 69, 0, 0, 69, 72, 74, 76, 79, 76, 74, 76, 81, 0, 79, 76, 74, 0, 0, 0], bass: [45, 43, 45, 40], pulse: true },
  cave: { bpm: 70, wave: 'triangle', vol: 0.028, mel: [64, 0, 67, 0, 0, 64, 0, 0, 62, 0, 0, 0, 0, 0, 0, 0, 64, 0, 69, 0, 67, 0, 64, 0, 62, 0, 59, 0, 0, 0, 0, 0], bass: [40, 40, 38, 35] },
  xie: { bpm: 100, wave: 'square', vol: 0.015, mel: [74, 0, 72, 69, 67, 0, 65, 0, 67, 69, 0, 0, 62, 0, 0, 0, 74, 77, 74, 72, 69, 0, 67, 0, 65, 67, 69, 67, 62, 0, 0, 0], bass: [38, 36, 33, 38], pulse: true },
};
const XIE_LAND = ['pingding', 'heimuya', 'caoyuan', 'damo', 'guangming', 'langxue', 'digong', 'digong2'];
const mus = { track: null, step: 0, next: 0 };
function trackFor() {
  if (mode !== 'play' || !map) return 'town';
  if (map.ground === 'cave') return 'cave';
  if (XIE_LAND.includes(map.id)) return 'xie';
  return TOWNS.includes(map.id) || !(map.spawns || []).some(([k]) => EN[k] && !EN[k].dummy) ? 'town' : 'wild';
}
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
function musicTick() {
  if (!ac || muted || !musicOn || ac.state !== 'running') return;
  const want = trackFor(), T = TRACKS[want], dt = 60 / T.bpm / 2, now = ac.currentTime;
  if (want !== mus.track) { mus.track = want; mus.step = 0; mus.next = now + 0.15; }
  if (mus.next < now - 0.1) mus.next = now + 0.05;
  while (mus.next < now + 0.3) {
    const st = mus.step, n = T.mel[st], delay = mus.next - now;
    if (n) { let len = 1; while (len < 3 && !T.mel[(st + len) % T.mel.length]) len++; tone(midiHz(n), dt * len * 0.95, T.wave, T.vol, 0, delay); }
    const root = T.bass[Math.floor(st / 8) % T.bass.length];
    if (T.pulse) tone(midiHz(root + (st % 2 ? 12 : 0)), dt * 0.8, 'triangle', 0.03, 0, delay);
    else if (st % 4 === 0) tone(midiHz(root), dt * 3.6, 'triangle', 0.035, 0, delay);
    mus.step = (st + 1) % T.mel.length; mus.next += dt;
  }
}

