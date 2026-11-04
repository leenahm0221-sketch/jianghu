# 由 tools/build.py --site 调用。把单文件游戏打包成可以挂到网站上的版本：完整 HTML 头、桌面图标、离线缓存
import json, re, hashlib, os
from PIL import Image, ImageDraw
def main(src_path, out_dir):
  src = open(src_path, encoding='utf-8').read()
  body = src.replace('<title>江湖少年 GB</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n', '', 1)
  ver = re.search(r"txt\('(v\d+)', 156", src).group(1)
  head = f'''<!doctype html>
  <html lang="zh-CN">
  <head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">
  <title>江湖少年</title>
  <meta name="apple-mobile-web-app-capable" content="yes">
  <meta name="mobile-web-app-capable" content="yes">
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
  <meta name="apple-mobile-web-app-title" content="江湖少年">
  <meta name="theme-color" content="#0f380f">
  <link rel="manifest" href="manifest.json">
  <link rel="apple-touch-icon" href="icon-180.png">
  <link rel="icon" href="icon-192.png">
  <style>html,body{{overscroll-behavior:none;touch-action:manipulation;-webkit-touch-callout:none}}</style>
  </head>
  <body>
  '''
  tail = f'''
  <script>if ('serviceWorker' in navigator) addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {{}}));</script>
  </body>
  </html>
  '''
  out = out_dir.rstrip('/') + '/'
  open(out + 'index.html', 'w').write(head + body + tail)
  json.dump({"name": "江湖少年", "short_name": "江湖少年", "start_url": "./", "display": "fullscreen", "orientation": "landscape",
             "background_color": "#0f380f", "theme_color": "#0f380f",
             "icons": [{"src": "icon-192.png", "sizes": "192x192", "type": "image/png"}, {"src": "icon-512.png", "sizes": "512x512", "type": "image/png"}]},
            open(out + 'manifest.json', 'w'), ensure_ascii=False)
  h = hashlib.md5(open(out + 'index.html', 'rb').read()).hexdigest()[:8]
  open(out + 'sw.js', 'w').write(f'''// 离线缓存：联网时优先拿最新版，断网时用缓存
  const C = 'jianghu-{ver}-{h}';
  self.addEventListener('install', e => {{ self.skipWaiting(); e.waitUntil(caches.open(C).then(c => c.addAll(['./', 'index.html', 'manifest.json', 'icon-180.png', 'icon-192.png']))); }});
  self.addEventListener('activate', e => e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== C).map(k => caches.delete(k)))).then(() => self.clients.claim())));
  self.addEventListener('fetch', e => {{ if (e.request.method !== 'GET') return; e.respondWith(fetch(e.request).then(r => {{ const cp = r.clone(); caches.open(C).then(c => c.put(e.request, cp)); return r; }}).catch(() => caches.match(e.request))); }});
  ''')
  # 图标：GB 豆绿底，深色像素“侠”字风格的剑
  P = ['#9bbc0f', '#8bac0f', '#306230', '#0f380f']
  g = Image.new('RGB', (32, 32), P[3]); d = ImageDraw.Draw(g)
  d.rectangle([2, 2, 29, 29], fill=P[0]); d.rectangle([2, 22, 29, 29], fill=P[1])
  for i in range(15): d.point((8 + i, 23 - i), fill=P[3]); d.point((9 + i, 23 - i), fill=P[2])  # 剑身
  d.line([(6, 19), (12, 25)], fill=P[3], width=2)   # 护手
  d.line([(5, 26), (8, 23)], fill=P[3], width=2)    # 剑柄
  d.rectangle([22, 5, 24, 7], fill=P[2])
  for sz in (180, 192, 512): g.resize((sz, sz), Image.NEAREST).save(out + f'icon-{sz}.png')
  open(out + '.nojekyll', 'w').write('')
  print('site built', ver, h, os.listdir(out))
