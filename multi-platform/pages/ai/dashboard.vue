<template>
  <view class="app-container">
    <view class="page-header">
      <text class="page-title">AI 分析面板</text>
      <text class="page-subtitle">今日经营数据概览</text>
    </view>

    <view class="stats-grid">
      <view class="stat-card" v-for="(stat, index) in stats" :key="index">
        <text class="stat-icon">{{ stat.icon }}</text>
        <text class="stat-label">{{ stat.label }}</text>
        <text class="stat-value">{{ stat.value }}</text>
        <text class="stat-trend" :class="stat.trendType">
          {{ stat.trend }}
        </text>
      </view>
    </view>

    <view class="insight-card">
      <text class="insight-title">🤖 AI 洞察建议</text>
      <text class="insight-content">{{ insight }}</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      stats: [
        {
          icon: '💰',
          label: '今日销售额',
          value: '¥12,860',
          trend: '↑ 8.5%',
          trendType: 'up'
        },
        {
          icon: '📦',
          label: '订单数',
          value: '86',
          trend: '↑ 12.3%',
          trendType: 'up'
        },
        {
          icon: '📈',
          label: '利润',
          value: '¥4,320',
          trend: '↓ 2.1%',
          trendType: 'down'
        }
      ],
      insight: '今日韩版短袖T恤销量增长明显，建议补货 50 件；修身牛仔裤库存偏低（12 件），建议尽快补货以避免断货风险。'
    };
  },
  onLoad() {
    console.log('AI 分析面板加载');
  }
};
</script>

<style>
.app-container { padding: 20px; }

.page-header {
  text-align: center;
  padding: 20px 0 24px;
}
.page-title {
  display: block;
  font-size: 22px;
  font-weight: 700;
  color: #333;
}
.page-subtitle {
  display: block;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.stat-card {
  background: white;
  border-radius: 16px;
  padding: 18px 20px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  border-left: 4px solid #f27835;
}

.stat-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.stat-label {
  font-size: 13px;
  color: #999;
  flex: 1;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #333;
}

.stat-trend {
  font-size: 12px;
  font-weight: 600;
  margin-left: 8px;
}
.stat-trend.up { color: #f27835; }
.stat-trend.down { color: #e8553e; }

.insight-card {
  margin-top: 16px;
  background: linear-gradient(135deg, #f27835, #e8553e);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.insight-title {
  font-size: 15px;
  font-weight: 700;
  color: white;
}
.insight-content {
  font-size: 13px;
  color: white;
  line-height: 1.6;
  opacity: 0.95;
}
</style>
