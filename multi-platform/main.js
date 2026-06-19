import Vue from 'vue';
import App from './App';

// platform-adapter.js 是 IIFE 模块，通过 require 引入
const PlatformAdapter = require('../platform-adapter.js').PlatformAdapter || (typeof global !== 'undefined' ? global.PlatformAdapter : null);

Vue.config.productionTip = false;
App.mpType = 'app';

const app = new Vue({
  ...App
});
app.$mount();

// 全局暴露 PlatformAdapter
if (PlatformAdapter) {
  Vue.prototype.$platform = PlatformAdapter;
  if (typeof global !== 'undefined') global.PlatformAdapter = PlatformAdapter;
}

console.log('✅ uni-app Vue 实例已创建');
