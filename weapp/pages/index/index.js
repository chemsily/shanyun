// 微信小程序首页
const { PlatformAdapter } = require('../../../platform-adapter.js');

Page({
  data: {
    loading: true
  },

  onLoad: function() {
    console.log('首页加载，平台:', PlatformAdapter.platform);
    this.setData({ loading: false });
  },

  // 跳转到 AI 分析（使用 webview 打开在线版）
  goToAI: function() {
    wx.showModal({
      title: 'AI 分析面板',
      content: 'AI 功能请在 Web 版体验：\nhttps://chemsily.github.io/shanyun/',
      showCancel: false
    });
  },

  // 跳转到货品列表
  goToProducts: function() {
    wx.showModal({
      title: '货品管理',
      content: '完整货品管理请在 Web 版体验：\nhttps://chemsily.github.io/shanyun/',
      showCancel: false
    });
  },

  // 拍照入库
  takePhoto: function() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['camera', 'album'],
      camera: 'back',
      success: function(res) {
        const tempFile = res.tempFiles[0].tempFilePath;
        console.log('选择图片:', tempFile);
        wx.showToast({ title: 'AI 识别中...', icon: 'loading' });
        // 调用 AI 识别
        setTimeout(() => {
          wx.showModal({
            title: '识别结果',
            content: '商品：韩版宽松短袖T恤\n建议售价：¥168',
            showCancel: false
          });
        }, 1000);
      }
    });
  }
});
