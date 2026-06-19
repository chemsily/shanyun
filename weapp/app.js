// 微信小程序入口 - app.js
// platform-adapter.js 是 IIFE 模块，同时支持 CommonJS (module.exports)
const platformModule = require('../platform-adapter.js');
const PlatformAdapter = platformModule.PlatformAdapter || global.PlatformAdapter;

App({
  onLaunch: function() {
    console.log('🚀 衫云智管 微信小程序启动');
    console.log('  平台: weapp');
    console.log('  isMiniProgram: true');

    // 初始化平台适配器
    this.globalData.platform = PlatformAdapter;

    // 检查更新
    this.checkUpdate();
  },

  onShow: function() {
    console.log('小程序回到前台');
  },

  onHide: function() {
    console.log('小程序进入后台');
  },

  checkUpdate: function() {
    if (wx.getUpdateManager) {
      const updateManager = wx.getUpdateManager();
      updateManager.onCheckForUpdate(function(res) {
        console.log('检查更新:', res.hasUpdate);
      });
      updateManager.onUpdateReady(function() {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          success: function(res) {
            if (res.confirm) updateManager.applyUpdate();
          }
        });
      });
    }
  },

  globalData: {
    userInfo: null,
    platform: null
  }
});
