<template>
  <view class="app-container">
    <view class="page-header">
      <text class="page-title">货品管理</text>
      <text class="page-subtitle">共 {{ products.length }} 件货品</text>
    </view>

    <view class="product-list">
      <view class="product-card" v-for="(item, index) in products" :key="index">
        <view class="product-thumb">
          <text class="thumb-text">{{ item.name.charAt(0) }}</text>
        </view>
        <view class="product-info">
          <text class="product-name">{{ item.name }}</text>
          <text class="product-sku">SKU：{{ item.sku }}</text>
          <view class="product-meta">
            <text class="product-price">¥{{ item.price }}</text>
            <text class="product-stock" :class="{ 'low': item.stock < 20 }">
              库存 {{ item.stock }}
            </text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      products: [
        { name: '韩版宽松短袖T恤', sku: 'TS-001', price: 168, stock: 86 },
        { name: '修身牛仔裤', sku: 'PT-014', price: 259, stock: 12 },
        { name: '纯棉连帽卫衣', sku: 'HD-008', price: 199, stock: 45 },
        { name: '简约风连衣裙', sku: 'DR-021', price: 328, stock: 7 }
      ]
    };
  },
  onLoad() {
    console.log('货品管理页加载，货品数：', this.products.length);
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

.product-list { display: flex; flex-direction: column; gap: 12px; }

.product-card {
  background: white;
  border-radius: 16px;
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}

.product-thumb {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, #f27835, #e8553e);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.thumb-text {
  color: white;
  font-size: 24px;
  font-weight: 800;
}

.product-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.product-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}
.product-sku {
  font-size: 11px;
  color: #bbb;
}
.product-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 4px;
}
.product-price {
  font-size: 16px;
  font-weight: 700;
  color: #f27835;
}
.product-stock {
  font-size: 12px;
  color: #999;
}
.product-stock.low {
  color: #e8553e;
  font-weight: 600;
}
</style>
