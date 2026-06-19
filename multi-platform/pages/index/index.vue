<template>
  <view class="app-container">
    <view class="header">
      <view class="app-logo">衫</view>
      <text class="title">衫云智管</text>
      <text class="subtitle">服装零售 AI 智能管理</text>
    </view>

    <view class="quick-actions">
      <view class="action-card" @click="takePhoto">
        <text class="action-icon">📸</text>
        <text class="action-name">AI 智能入库</text>
        <text class="action-desc">拍照识别吊牌</text>
      </view>
      <view class="action-card" @click="goToAI">
        <text class="action-icon">🤖</text>
        <text class="action-name">AI 分析面板</text>
        <text class="action-desc">货盘诊断/爆款预测</text>
      </view>
      <view class="action-card" @click="goToProducts">
        <text class="action-icon">📦</text>
        <text class="action-name">货品管理</text>
        <text class="action-desc">查看/编辑商品</text>
      </view>
    </view>
  </view>
</template>

<script>
// platform-adapter.js 在 github-pages 根目录（multi-platform 的上一级）
// 它是 IIFE 模块，通过 module.exports 暴露 { PlatformAdapter, Platform }
const PlatformAdapter = require('../../platform-adapter.js').PlatformAdapter;

export default {
  data() {
    // 安全访问：PlatformAdapter 可能为 undefined（如 require 失败时），给默认值
    const adapter = PlatformAdapter || {};
    return {
      platform: adapter.platform || 'unknown',
      isMiniProgram: adapter.isMiniProgram || false,
      isApp: adapter.isApp || false
    };
  },
  methods: {
    goToAI() {
      uni.navigateTo({ url: '/pages/ai/dashboard' });
    },
    goToProducts() {
      uni.navigateTo({ url: '/pages/products/list' });
    },
    takePhoto() {
      uni.chooseImage({
        count: 1,
        sourceType: ['camera', 'album'],
        success: (res) => {
          uni.showLoading({ title: 'AI 识别中...' });
          setTimeout(() => {
            uni.hideLoading();
            uni.showModal({
              title: '识别结果',
              content: '商品：韩版宽松短袖T恤\n建议售价：¥168',
              showCancel: false
            });
          }, 1000);
        }
      });
    }
  },
  onLoad() {
    console.log('uni-app 首页加载，平台:', this.platform);
  }
};
</script>

<style>
.app-container { padding: 20px; }
.header { text-align: center; padding: 40px 0 30px; }
.app-logo {
  width: 80px; height: 80px;
  background: linear-gradient(135deg, #f27835, #e8553e);
  border-radius: 20px; display: inline-flex;
  align-items: center; justify-content: center;
  color: white; font-size: 36px; font-weight: 800;
  margin-bottom: 12px;
}
.title { display: block; font-size: 24px; font-weight: 700; color: #333; margin-bottom: 4px; }
.subtitle { display: block; font-size: 13px; color: #999; }

.quick-actions { display: flex; flex-direction: column; gap: 12px; }
.action-card {
  background: white; border-radius: 16px; padding: 20px;
  display: flex; align-items: center; gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.action-icon { font-size: 32px; }
.action-name { display: block; font-size: 16px; font-weight: 600; color: #333; }
.action-desc { display: block; font-size: 12px; color: #999; margin-top: 2px; }
</style>
