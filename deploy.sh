#!/bin/bash
# 衫云智管 一键部署脚本
# 用法: ./deploy.sh [platform]
# platform: web | pwa | weapp | app | all

set -e

PLATFORM=${1:-web}
echo "🚀 衫云智管一键部署 - 目标平台: $PLATFORM"

case $PLATFORM in
  web)
    echo "📦 部署 Web 版本到 GitHub Pages..."
    if [ -d ".git" ]; then
      git add -A
      git commit -m "deploy: Web版本更新" || echo "无新内容"
      git push origin main
      echo "✅ Web 版本已部署: https://chemsily.github.io/shanyun/"
    else
      echo "❌ 不是 git 仓库"
      exit 1
    fi
    ;;

  pwa)
    echo "📦 构建 PWA 版本..."
    # PWA 只是 Web + manifest.json + sw.js，push 即生效
    if [ -d ".git" ]; then
      git add -A
      git commit -m "deploy: PWA版本更新" || echo "无新内容"
      git push origin main
      echo "✅ PWA 版本已部署"
      echo "   用户可在 Chrome/Edge 浏览器中点击「安装」按钮添加到桌面"
    fi
    ;;

  weapp)
    echo "📦 准备微信小程序版本..."
    echo "1. 安装微信开发者工具: https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html"
    echo "2. 导入项目目录: ./weapp"
    echo "3. 在 project.config.json 中填入你的 AppID"
    echo "4. 点击「上传」按钮提交到微信后台审核"
    ;;

  app)
    echo "📦 准备 App 版本..."
    if command -v uni >/dev/null 2>&1; then
      uni build --platform app
      echo "✅ App 安装包已生成在 ./unpackage/release"
    else
      echo "⚠️  请先安装 uni-app CLI: npm install -g @vue/cli @vue/cli-init"
      echo "   然后执行: npm run build:app"
    fi
    ;;

  all)
    echo "📦 部署到所有平台..."
    $0 web
    $0 pwa
    $0 weapp
    $0 app
    ;;

  *)
    echo "用法: ./deploy.sh [web|pwa|weapp|app|all]"
    exit 1
    ;;
esac

echo ""
echo "🎉 部署完成！"
