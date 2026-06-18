<script>
import { PlatformAdapter } from '@/core/platform-adapter.js';
import AIEngine from '@/core/ai-engine.js';
import AIDecisionCenter from '@/core/ai-engine.js';
import MarketingTemplates from '@/core/ai-engine.js';

export default {
  onLaunch: function() {
    console.log('🚀 衫云智管 uni-app 启动');
    console.log('  平台:', PlatformAdapter.platform);
    console.log('  isWeb:', PlatformAdapter.isWeb);
    console.log('  isMiniProgram:', PlatformAdapter.isMiniProgram);
    console.log('  isApp:', PlatformAdapter.isApp);
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
