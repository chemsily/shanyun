import Vue from 'vue';
import App from './App';
import { PlatformAdapter } from './platform-adapter.js';

Vue.config.productionTip = false;
App.mpType = 'app';

const app = new Vue({
  ...App
});
app.$mount();

// 全局暴露 PlatformAdapter
Vue.prototype.$platform = PlatformAdapter;
global.PlatformAdapter = PlatformAdapter;

console.log('✅ uni-app Vue 实例已创建');
