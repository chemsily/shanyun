# 衫云智管 - GitHub Pages 静态部署版

> 服装零售管理 · 多门店 · 进销存 · 移动开单

本目录是「衫云智管」**零后端、零依赖**的纯前端演示版，已经为你准备好 `index.html`，push 到 GitHub 即可通过 GitHub Pages 公网访问，任何浏览器都能打开。

## 📁 文件清单

```
github-pages/
├── index.html         # SPA 入口（也是 GH Pages 主页）
├── styles.css         # 全部样式
├── app.js             # 业务逻辑
├── api.js             # API 客户端
├── api-mock.js        # 浏览器端 mock（覆盖 window.fetch，零后端）
├── data.js            # 默认数据
├── README.md          # 项目说明
├── .nojekyll          # 跳过 Jekyll 编译（避免中文文件名被破坏）
└── .github/
    └── workflows/
        └── deploy.yml # 推送到 main 即自动部署到 GH Pages
```

## 🚀 3 步部署

### 1. 推到 GitHub

**方式 A：用 GitHub 网页直接上传（最简单）**

1. 登录 GitHub → New repository → 命名 `shanyun`（或任意名）
2. 进入仓库 → "uploading an existing file" → 把 `github-pages` 目录里**所有文件和文件夹**拖进去
3. Commit changes

**方式 B：命令行**

```bash
cd github-pages
git init
git add .
git commit -m "deploy: 衫云智管静态演示版"
git branch -M main
git remote add origin https://github.com/<你的用户名>/shanyun.git
git push -u origin main
```

### 2. 开启 GitHub Pages

1. 仓库 → **Settings** → 左侧 **Pages**
2. **Source** 选 `GitHub Actions`
3. 不用动其他选项

### 3. 等待部署完成

- 进入仓库 **Actions** 标签，能看到一个 workflow 在跑
- 大约 30~60 秒后变绿 ✅
- 顶部会显示你的访问地址：

```
https://<你的用户名>.github.io/shanyun/
```

> ⚠️ 第一次访问可能要 1~2 分钟全球 CDN 同步，刷新几下即可。

## 🔑 演示账号

```
用户名: demo
密  码: demo123
```

## ✨ 演示版功能

- ✅ 多门店切换（杭州四季青总店 / 上海七浦路分店）
- ✅ 商品管理（8 款 SKU，标记热销、库存预警）
- ✅ 客户管理（6 个客户，4 个等级：普通/银卡/金卡/白金）
- ✅ 移动开单（点击热销商品一键加购，自动算利润）
- ✅ 供应商 + 价格规则
- ✅ 营销中心（优惠券、拼团、秒杀）
- ✅ 智能 Dashboard（营业额/利润/利润率/7 日趋势/品类分布）
- ✅ 挂单、备份/恢复、生日提醒
- ✅ 亮/暗主题切换
- ✅ 数据导出 CSV
- ✅ 审计日志
- ✅ 30 天演示订单，62 笔

## 💾 数据存储

数据保存在浏览器 `localStorage`，**清浏览器数据会丢**。
想保留数据：进应用 → 侧栏 → 💾 备份/恢复 → 导出 JSON。

## 🌐 完整版（带后端）

如果需要真实的 API + 数据库 + 多用户登录，请使用 [shanyun-full-app.zip](file:///workspace/shanyun-full-app.zip)：

```bash
unzip shanyun-full-app.zip
cd shanyun-full-app/server
npm install
node seed.js   # 写演示数据
node index.js  # 启动 → http://localhost:3000
```

部署到 Render / Fly.io / Railway 的教程见 `shanyun-full-app/README.md`。

---

📦 大小：~280 KB（gzip 后 ~80 KB）
🪪 许可：MIT
