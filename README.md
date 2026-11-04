# 江湖少年

手机横屏玩的 GB 风武侠游戏，玩法参照《千年》：武功越用越强，不靠任务升级。

- 在线试玩（GitHub Pages）：仓库根目录的 `index.html`
- 联网服务器：`server/`（说明见 `server/README.md`）

## 目录

| 位置 | 内容 |
|---|---|
| `src/page.html` | 页面骨架：样式、按键、对话框等 HTML |
| `src/js/*.js` | 游戏脚本，按文件名顺序拼接（各文件是同一个函数的连续片段，不能单独运行） |
| `src/js/00a-font-data.js` | 像素字库（由 `tools/buildfont.py` 生成，别手改） |
| `tools/build.py` | 拼成单文件 `build/jianghu.html`；加 `--site` 再生成网站版 |
| `tools/buildfont.py` | 加了新汉字后重新生成字库 |
| `tests/test_game.py` | 自动测试：地图连通、拜师、主线、新手教学、战斗数值等 |
| `server/` | 联网服务器（Node.js，无依赖） |

脚本文件大致分工：`03-data` 武功、物品、怪物数据；`04-maps` 地图生成；`07-levels` 怪物按距离分档；
`08-npcs`、`09-story` NPC、门派、主线、阵营主线；`11-ui` 对话菜单；`12-player` 操作与战斗；`17-render` 画面。

## 改完代码之后

```
python3 tools/buildfont.py      # 只有用到了新汉字才需要
python3 tools/build.py --site   # 拼单文件 + 生成网站版
python3 tests/test_game.py      # 跑测试（需要 pip install playwright && playwright install chromium）
```

推送到 GitHub 后会自动跑同样的测试。
