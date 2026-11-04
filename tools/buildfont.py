# 重新生成像素字库：扫描 src/js 里用到的所有汉字（再加上 GB2312 一级字，给玩家起名用），写进 src/js/00a-font-data.js
# 用法：python3 tools/buildfont.py   需要 Pillow、numpy 和 BoutiqueBitmap9x9.ttf（可用环境变量 FONT_TTF 指定路径）
import json,base64,re,os
from PIL import Image, ImageDraw, ImageFont
import numpy as np
P=os.environ.get('FONT_TTF','/home/claude/takwolf/fusion-pixel-font/assets/fonts/boutique-bitmap-9x9/BoutiqueBitmap9x9.ttf')  # 精品点阵体 9×9（BoutiqueBitmap9x9）
f=ImageFont.truetype(P,10)
import glob, os
ROOT=os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT_JS=os.path.join(ROOT,'src/js/00a-font-data.js')
script=''.join(open(f,encoding='utf-8').read() for f in sorted(glob.glob(os.path.join(ROOT,'src/js/*.js'))))
lvl1=set()
for hi in range(0xB0,0xD8):
    for lo in range(0xA1,0xFF):
        try: lvl1.add(bytes([hi,lo]).decode('gb2312'))  # GB2312 level-1 hanzi for player names
        except Exception: pass
chars=sorted(set(c for c in script if ord(c)>127) | set(chr(i) for i in range(32,127)) | lvl1)
H=11
ws=[];bits=[]
for ch in chars:
    adv=int(round(f.getlength(ch)))
    if ch==' ': adv=4
    im=Image.new('L',(24,16),0); ImageDraw.Draw(im).text((0,0),ch,font=f,fill=255)
    a=np.array(im)>127
    cols=np.where(a.any(axis=0))[0]
    w=max(adv, (cols.max()+1) if len(cols) else 0)
    w=min(w,12)
    ws.append(int(w))
    for y in range(H):
        for x in range(w): bits.append(1 if a[y,x] else 0)
    if a[H:].any(): print('clipped',ch)
by=bytearray((len(bits)+7)//8)
for i,b in enumerate(bits):
    if b: by[i>>3]|=0x80>>(i&7)
data={'h':H,'c':''.join(chars),'w':ws,'d':base64.b64encode(bytes(by)).decode()}
open(FONT_JS,'w',encoding='utf-8').write('const FONT_DATA = '+json.dumps(data,ensure_ascii=False)+';\n')
print(len(chars),'glyphs',len(data['d']),'b64 bytes')
