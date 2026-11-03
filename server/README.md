# 江湖少年 联网服务器

第 1 步的功能：

- 注册和登录
- 存档放在服务器上
- 同一张地图上的玩家互相看得到走动、打坐
- 聊天分三个频道：附近（同一张地图）、门派（同门）、江湖（所有在线的人）

这个服务器只用 Node.js 自带的功能写成，**不用安装任何第三方包**。

## 在自己电脑上试

1. 安装 Node.js 18 或更新的版本（https://nodejs.org）。
2. 在这个仓库的根目录运行：

   ```
   node server/server.js
   ```

3. 浏览器打开 `http://localhost:8080/?net=1`。在本机上要加 `?net=1` 才会联网；放到正式服务器上用 IP 或域名打开，会自动联网。
4. 再开一个无痕窗口，注册第二个账号，两个角色走到同一张地图，就能互相看到、聊天。

## 放到云服务器上（以后开服时再做）

推荐阿里云或腾讯云的**香港轻量应用服务器**：国内访问快，不用备案，每月几十元。

1. 买一台 Ubuntu 系统的轻量服务器，在防火墙里放开 8080 端口。
2. 登录服务器，安装 Node.js 和 git：

   ```
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
   sudo apt-get install -y nodejs git
   ```

3. 下载游戏：

   ```
   git clone https://github.com/leenahm0221-sketch/jianghu.git
   ```

4. 让服务器一直运行（断开连接、服务器重启都不会停）：

   ```
   sudo npm install -g pm2
   cd jianghu && pm2 start server/server.js --name jianghu && pm2 save && pm2 startup
   ```

5. 手机浏览器打开 `http://服务器IP:8080/`，就是联网版。

以后更新游戏，在服务器上运行：

```
cd jianghu && git pull && pm2 restart jianghu
```

## 数据

- 账号和存档都在 `server/data/accounts.json`。
- 密码只保存加盐后的哈希，看不到原文。
- 这个文件不会上传到 GitHub。**请定期备份。**

## 设置

可以用这三个环境变量改默认设置：

| 变量 | 默认值 | 作用 |
|---|---|---|
| `PORT` | 8080 | 端口 |
| `DATA_DIR` | `server/data` | 数据目录 |
| `PUBLIC_DIR` | 仓库根目录 | 游戏网页所在的目录 |

## 现在的限制

第 1 步里，存档还是由玩家自己的浏览器计算后交给服务器，懂技术的人可以改数据作弊。第 2 步会把怪物、战斗、掉落搬到服务器上计算，正式开放 PK 之前必须先完成。
