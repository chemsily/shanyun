<script>
// platform-adapter.js 和 ai-engine.js 是 IIFE 模块，挂载到 global/window
// 在 uni-app 中通过 require 引入（CommonJS 方式）
const PlatformAdapter = require('../platform-adapter.js').PlatformAdapter || global.PlatformAdapter;

export default {
  onLaunch: function() {
    console.log('🚀 衫云智管 uni-app 启动');
    console.log('  平台:', PlatformAdapter ? PlatformAdapter.platform : 'unknown');
    console.log('  isWeb:', PlatformAdapter ? PlatformAdapter.isWeb : false);
    console.log('  isMiniProgram:', PlatformAdapter ? PlatformAdapter.isMiniProgram : false);
  },
  onShow: function() {
    console.log('App Show');
  },
  onHide: function() {
    console.log('App Hide');
  }
};
</script>

<style>
/* 全局样式 - 多端共用 */
page {
  background: #f5f5f7;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
}

.app-logo {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #f27835, #e8553e);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 28px;
  font-weight: 800;
}

.btn-primary {
  background: linear-gradient(135deg, #f27835, #e8553e);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}
</style>
