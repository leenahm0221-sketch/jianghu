"""江湖少年 自动测试。

用法：python3 tools/build.py && python3 tests/test_game.py
需要：pip install playwright && playwright install chromium

每一项失败都会打印原因，最后有任何失败就以非零退出码结束（自动测试据此判断）。
"""
import os, sys, json, traceback
from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
G = 'window.__game'
PAGE = os.path.join(ROOT, 'tests/_page.html')
src = open(os.path.join(ROOT, 'build/jianghu.html'), encoding='utf-8').read()
open(PAGE, 'w', encoding='utf-8').write('<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0">' + src + '</body></html>')

results = []
def case(fn):
    results.append(fn); return fn

class Game:
    def __init__(self, browser, w=844, h=390):
        self.ctx = browser.new_context(viewport={'width': w, 'height': h}, has_touch=True)
        self.pg = self.ctx.new_page(); self.errs = []
        self.pg.on('pageerror', lambda e: self.errs.append(str(e)))
        self.pg.goto('file://' + PAGE); self.pg.wait_for_timeout(400)
    def ev(self, js): return self.pg.evaluate(js)
    def tap(self, k, ms=60):
        self.ev(f'{G}.press("{k}")'); self.pg.wait_for_timeout(ms); self.ev(f'{G}.release("{k}")'); self.pg.wait_for_timeout(40)
    def talk(self, n=40):
        """一路按 A 把对话翻完；遇到选项停下，返回选项"""
        for _ in range(n):
            if not self.ev(f'!!{G}.dlg'): return None
            if self.ev(f'!!({G}.dlg.choice) && {G}.dlg.i === {G}.dlg.pages.length - 1'):
                self.pg.wait_for_timeout(1500); return self.ev(f'{G}.dlg.choice.options')
            self.tap('a', 40); self.pg.wait_for_timeout(120)
    def choose(self, i):
        for _ in range(i): self.tap('down')
        self.tap('a'); self.pg.wait_for_timeout(200)
    def new_game(self):
        self.tap('a'); self.pg.wait_for_timeout(300); self.pg.click('#nbok'); self.pg.wait_for_timeout(300); self.talk()
    def close(self): self.ctx.close()

@case
def 开局无报错(b):
    g = Game(b); g.new_game()
    assert g.ev(f'{G}.map.id') == 'village', '没有出生在牛家村'
    assert g.ev(f'{G}.S.tut') == 0, '新角色没有新手教学'
    assert not g.errs, g.errs
    g.close()

@case
def 竖着拿手机也是横屏(b):
    g = Game(b, 390, 844); g.new_game()
    assert g.ev("document.getElementById('game').classList.contains('rot')"), '竖屏时画面没有转成横的'
    gw, gh = g.ev(f'[{G}.cam && document.getElementById("screen").width, document.getElementById("screen").height]')
    assert gw > gh, f'画面不是横的：{gw}×{gh}'
    # 摇杆：手指在屏幕上往下推 = 游戏里往右走
    g.ev(f'{G}.warp("village", 12, 13)'); g.pg.wait_for_timeout(2400)
    x0 = g.ev(f'{G}.P.tx')
    r = g.ev("(() => { const r = document.getElementById('dpad').getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2]; })()")
    g.pg.mouse.move(r[0], r[1]); g.pg.mouse.down(); g.pg.mouse.move(r[0], r[1] + 45, steps=4); g.pg.wait_for_timeout(700); g.pg.mouse.up()
    assert g.ev(f'{G}.P.tx') > x0, '竖屏时摇杆方向不对'
    assert not g.errs, g.errs
    g.close()

@case
def 转屏后画面不超出屏幕(b):
    g = Game(b); g.new_game()
    for w, h in [(390, 664), (844, 390), (390, 844), (664, 390)]:
        g.pg.set_viewport_size({'width': w, 'height': h}); g.pg.wait_for_timeout(1200)
        r = g.ev("(() => { const r = document.getElementById('game').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })()")
        assert r[0] >= -1 and r[1] >= -1 and r[2] <= w + 1 and r[3] <= h + 1, f'{w}×{h} 时画面超出屏幕：{r}'
        a = g.ev("(() => { const r = document.querySelector('.ab').getBoundingClientRect(); return [r.left, r.top, r.right, r.bottom]; })()")
        assert a[0] >= 0 and a[1] >= 0 and a[2] <= w and a[3] <= h, f'{w}×{h} 时 AB 键跑出屏幕：{a}'
    g.close()

@case
def 菜单里没有地图页(b):
    g = Game(b); g.new_game(); g.tap('start')
    seen = set()
    for _ in range(8):
        seen.add(g.ev(f'{G}.menu && {G}.menu.tab')); g.tap('right')
    assert 5 not in seen, '左右翻菜单还会翻到地图页'
    g.tap('b'); g.tap('map'); g.pg.wait_for_timeout(150)
    assert g.ev(f'{G}.menu && {G}.menu.tab') == 5, '地图键打不开大地图'
    g.close()

@case
def 地图连通_出口_NPC_怪物都走得到(b):
    g = Game(b); g.new_game()
    bad = g.ev(f'''(() => {{
      const G = {G}, out = [];
      const ids = Object.keys(G.MAPS);
      for (const id of ids) if (id !== 'village' && !G.nextHop('village', id)) out.push('到不了 ' + id);
      for (const id of ids) {{
        const m = G.MAPS[id], ks = Object.keys(m.exits);
        for (const k of ks) {{ const d = m.exits[k], t = G.MAPS[d.map]; if (G.SOLID.has(t.rows[d.y][d.x])) out.push('出口落在障碍上 ' + id + '→' + d.map); }}
        if (!ks.length) continue;
        const ex = ks[0].split(',').map(Number), seen = new Set([ex + '']), q = [ex];
        const walk = (x, y) => x >= 0 && y >= 0 && x < m.w && y < m.h && !G.SOLID.has(m.rows[y][x]);
        while (q.length) {{ const [x, y] = q.shift(); for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {{ const k = [x + dx, y + dy]; if (seen.has(k + '') || !walk(...k)) continue; seen.add(k + ''); q.push(k); }} }}
        for (const [k, x, y] of m.spawns) if (!seen.has([x, y] + '')) out.push(`怪物站不到 ${{id}} ${{k}}`);
        for (const n of (G.NPCS[id] || [])) if (![[1,0],[-1,0],[0,1],[0,-1]].some(([dx, dy]) => seen.has([n.x + dx, n.y + dy] + ''))) out.push(`NPC 走不到 ${{id}} ${{n.id}}`);
      }}
      return out; }})()''')
    assert not bad, bad
    g.close()

@case
def 怪物强弱按离城远近(b):
    g = Game(b); g.new_game()
    rows = g.ev(f'''(() => {{ const G = {G}; return Object.keys(G.MAPS).map(id => [id, G.dangerOf(id), G.levelRange(id)]); }})()''')
    avg = {}
    for id, d, lr in rows:
        if lr: avg.setdefault(d, []).append(sum(lr) / 2)
    means = [sum(v) / len(v) for k, v in sorted(avg.items())]
    assert all(a < b for a, b in zip(means, means[1:])), f'离城越远应该越强：{means}'
    g.close()

@case
def 主城接引人拜师学入门武功(b):
    g = Game(b); g.new_game()
    g.ev(f'{G}.S.skills.caoshangfei = 12; {G}.S.skills.huashan = 31; {G}.S.age = 40')
    g.ev(f'{G}.envoyTalk("正")'); opts = g.talk()
    for _ in range(4):
        if '峨眉派（可入）' in opts: break
        g.choose(opts.index(next(o for o in opts if o.startswith('下一页')))); opts = g.talk()
    assert opts and '峨眉派（可入）' in opts, opts
    g.choose(opts.index('峨眉派（可入）')); g.talk(); g.choose(0); g.talk()
    assert g.ev(f'{G}.S.sect') == 'emei', '没拜成峨眉'
    g.ev(f'{G}.envoyTalk("正")'); g.talk(); g.choose(0); g.talk()
    assert g.ev(f'{G}.S.skills.miejian') is not None, '没学到入门武功'
    assert not g.errs, g.errs
    g.close()

@case
def 接引使介绍全部门派(b):
    g = Game(b); g.new_game()
    seen = set()
    g.ev(f'{G}.envoyTalk("邪")'); opts = g.talk()
    for _ in range(5):
        seen |= {o.split('（')[0] for o in opts if not o.startswith(('下一页', '离开'))}
        g.choose(opts.index(next(o for o in opts if o.startswith('下一页')))); opts = g.talk()
    assert len(seen) == 13, f'只介绍了 {len(seen)} 个门派：{seen}'
    g.ev(f'{G}.envoyTalk("邪", 0, true)'); g.talk(); g.choose(0); txt = g.ev(f'{G}.dlg.pages.map(p => p.lines.join("")).join("")')
    assert '总坛' in txt and '传授' in txt and '入门' in txt, txt
    assert not g.errs, g.errs
    g.close()

@case
def 阵营主线走得完(b):
    g = Game(b); g.new_game()
    for line, sect in [('邪', 'riyue'), ('中', 'taohua')]:
        g.ev(f'(() => {{ const S = {G}.S; S.q.main = 5; S.sect = "{sect}"; S.cq = null; S.cqDone = []; }})()')
        g.ev(f'{G}.storyTalk("{line}")'); g.talk(); g.choose(0); g.talk()
        assert g.ev(f'{G}.S.cq && {G}.S.cq.line') == line, f'{line}线没接上'
        for _ in range(8):
            st = g.ev(f'{G}.cqStep()')
            if not st: break
            g.ev(f'{G}.S.cq.cnt = {st.get("need", 0)}' if st.get('kind') else f'{G}.S.flags["{st["flag"]}"] = true')
            g.ev(f'{G}.storyTalk("{line}")'); g.talk()
        assert g.ev(f'{G}.S.cq.done'), f'{line}线没走完'
    assert not g.errs, g.errs
    g.close()

@case
def 新手教学六步(b):
    g = Game(b); g.new_game(); g.pg.wait_for_timeout(2200)
    for d in ['down', 'down', 'down', 'up']: g.tap(d, 200)
    g.ev(f'{G}.warp("village", 4, 8)'); g.pg.wait_for_timeout(2400)
    for _ in range(8): g.tap('a', 60); g.pg.wait_for_timeout(350)
    g.ev(f'{G}.warp("village", 12, 13)'); g.pg.wait_for_timeout(2400)
    g.tap('b'); g.pg.wait_for_timeout(200); g.tap('b')
    g.tap('start'); g.tap('b'); g.tap('map'); g.pg.wait_for_timeout(150); g.tap('map')
    assert g.ev(f'{G}.S.tut') == 5, f'教学停在第 {g.ev(G + ".S.tut")} 步'
    g.close()

@case
def 进出地下洞口(b):
    g = Game(b); g.new_game()
    g.ev(f'{G}.warp("wild", 12, 31)'); g.pg.wait_for_timeout(2500); g.tap('up', 180); g.pg.wait_for_timeout(600)
    assert g.ev(f'{G}.map.id') == 'kuangdong', '没进伏牛矿洞'
    g.close()

@case
def 反派都在各自地点_掉独门秘籍(b):
    g = Game(b); g.new_game()
    where = {'yuebuqun': 'siguo', 'dongfang': 'chengde', 'zuolengchan': 'jianzhong', 'ouyangfeng': 'digong', 'limochou': 'jueqing', 'gongsun': 'jueqing', 'jiumozhi': 'miaojiang', 'jinlun': 'yanmen'}
    for k, m in where.items():
        assert g.ev(f'{G}.MAPS["{m}"].spawns.some(s => s[0] === "{k}")'), f'{k} 不在 {m}'
        sk = g.ev(f'Object.keys({G}.SK).find(x => {G}.SK[x].villain === "{k}")')
        assert sk, f'{k} 没有对应的特殊武功'
        assert g.ev(f'{G}.DROPS["{k}"].some(([i]) => {G}.ITEMS[i] && {G}.ITEMS[i].book === "{sk}")'), f'{k} 不掉 {sk} 的秘籍'
    assert g.ev(f'{G}.SK.bixie.villain === "yuebuqun" && !{G}.SK.bixie.sect'), '辟邪剑法还挂在门派下'
    g.ev(f'{G}.warp("heimuya", 18, 4)'); g.pg.wait_for_timeout(2500); g.tap('up', 180); g.pg.wait_for_timeout(600)
    assert g.ev(f'{G}.map.id') == 'chengde', '黑木崖进不了成德殿'
    assert not g.errs, g.errs
    g.close()

@case
def A键上方快捷药格(b):
    g = Game(b); g.new_game(); g.pg.wait_for_timeout(300)
    g.ev(f'(() => {{ const S = {G}.S; S.items.yao = 3; S.items.qingxin = 2; S.hp = 10; }})()'); g.pg.wait_for_timeout(300)
    assert '金创' in g.pg.inner_text('#quick'), g.pg.inner_text('#quick')
    g.pg.click('#quick'); g.pg.wait_for_timeout(300)
    assert g.ev(f'{G}.S.items.yao') == 2, '点快捷药没服药'
    box = g.pg.locator('#quick').bounding_box(); g.pg.mouse.move(box['x'] + 10, box['y'] + 10); g.pg.mouse.down(); g.pg.wait_for_timeout(700); g.pg.mouse.up(); g.pg.wait_for_timeout(300)
    assert '清心' in g.pg.inner_text('#quick'), '按住没换药：' + g.pg.inner_text('#quick')
    assert not g.errs, g.errs
    g.close()

@case
def 低等级怪不主动打人(b):
    g = Game(b); g.new_game()
    def stand_by(kind):
        g.ev(f'{G}.warp("wild", 24, 22)'); g.pg.wait_for_timeout(300)
        return g.ev(f'''(() => {{ const G = {G}, es = G.enemies; es.length = 0; const x = G.P.tx, y = G.P.ty;
          for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) if (!G.SOLID.has(G.map.rows[y + dy][x + dx])) {{ es.push(G.makeEnemy("{kind}", x + dx, y + dy)); return true; }} return false; }})()''')
    full = g.ev(f'{G}.maxHP()')
    g.ev(f'{G}.S.hp = {G}.maxHP()'); assert stand_by('wolf'); g.pg.wait_for_timeout(4000)
    assert g.ev(f'{G}.S.hp') >= full, '18 级的野狼主动咬人了'
    g.ev(f'{G}.S.hp = {G}.maxHP()'); assert stand_by('bandit'); g.pg.wait_for_timeout(4000)
    assert g.ev(f'{G}.S.hp') < full, '25 级的山贼没有主动动手'
    g.close()

@case
def 菜单各页能打开(b):
    g = Game(b); g.new_game()
    g.ev(f'(() => {{ const S = {G}.S; S.skills.taijijian = 12; S.items.caoyao = 3; }})()')
    g.tap('start')
    for _ in range(7): g.tap('right'); g.pg.wait_for_timeout(80)
    g.tap('b'); g.tap('start'); g.tap('right'); g.tap('a'); g.pg.wait_for_timeout(100); g.tap('b'); g.tap('b')
    for _ in range(4): g.tap('right')
    g.tap('a'); g.pg.wait_for_timeout(100); g.tap('b'); g.tap('b')
    assert not g.errs, g.errs
    g.close()

@case
def 同级战斗打得赢(b):
    g = Game(b); g.new_game(); g.pg.add_script_tag(path=os.path.join(ROOT, 'tests/sim.js'))
    for L, m, k in [[15, 'wild', 'wolf'], [30, 'wild', 'boss'], [38, 'forest', 'tiger'], [45, 'huashan', 'hsjianke'], [65, 'digong', 'shiwei'], [88, 'jueqing', 'jqdizi']]:
        wins = sum(1 for _ in range(5) if g.ev(f'simFight({L}, "{m}", "{k}")')['won'])
        assert wins >= 3, f'{L} 级打 {m} 的 {k} 只赢了 {wins}/5'
    assert not g.errs, g.errs
    g.close()

if __name__ == '__main__':
    fails = 0
    with sync_playwright() as p:
        b = p.chromium.launch()
        for fn in results:
            try: fn(b); print('通过', fn.__name__)
            except Exception as e:
                fails += 1; print('失败', fn.__name__, '：', e if isinstance(e, AssertionError) else traceback.format_exc())
        b.close()
    print(f'{len(results) - fails}/{len(results)} 项通过')
    sys.exit(1 if fails else 0)
