"""把 src/ 里的源码拼成单文件游戏 build/jianghu.html，再打包成网站版（仓库根目录的 index.html 等）。

用法：python3 tools/build.py          只拼单文件
      python3 tools/build.py --site   再生成网站版（GitHub Pages 用）
"""
import os, sys, glob
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def build():
    page = open(os.path.join(ROOT, 'src/page.html'), encoding='utf-8').read()
    parts = [open(f, encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(ROOT, 'src/js/*.js')))]
    js = ''.join(parts).rstrip('\n')
    out = page.replace('<!--JS-->', js, 1)
    os.makedirs(os.path.join(ROOT, 'build'), exist_ok=True)
    path = os.path.join(ROOT, 'build/jianghu.html')
    open(path, 'w', encoding='utf-8').write(out)
    return path
if __name__ == '__main__':
    p = build(); print('built', p, os.path.getsize(p), 'bytes')
    if '--site' in sys.argv:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import build_site; build_site.main(p, ROOT)
