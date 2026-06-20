/* ========================================
   衫云智管 应用逻辑 (app.js)
   全栈架构：前端通过 API 连接后端 Express + SQLite
======================================== */

const LS_KEY = 'shanyun_data_v1';
const DRAFT_KEY = 'shanyun_draft_orders_v1';
let state = { stores: [], customers: [], products: [], orders: [], suppliers: [], coupons: [], draftOrders: [], currentStoreId: null, settings: {}, priceRule: { retailRatio: 150, discountRatio: 120, rounding: 'round' } };
let NAV_STACK = ['home'];
let VIEW_ALL_STORES = false; // false=只看当前门店，true=查看全部

// ============ 状态管理（后端持久化） ============
function loadState() {
  // 全栈架构：数据从后端 API 加载，不再从 localStorage 读取
  // 返回空初始状态，实际数据通过 initApp() 加载
  return { stores: [], customers: [], products: [], orders: [], suppliers: [], coupons: [], draftOrders: [], currentStoreId: null, settings: {}, priceRule: { retailRatio: 150, discountRatio: 120, rounding: 'round' } };
}
function saveState() {
  // 全栈架构：主数据通过 API 实时持久化到 SQLite，不再使用 localStorage
  // 挂单（draftOrders）为本地概念，不走后端 API，单独持久化到 localStorage
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(state.draftOrders || []));
  } catch(e) { console.warn('saveState: 挂单持久化失败', e); }
}
function loadDraftOrders() {
  try {
    var raw = localStorage.getItem(DRAFT_KEY);
    if (raw) state.draftOrders = JSON.parse(raw) || [];
  } catch(e) { state.draftOrders = []; }
}

// ---------- 门店辅助 ----------
function currentStore() {
  return state.stores.find(function (s) { return s.id === state.currentStoreId; }) || state.stores[0];
}
function filterByStore(items) {
  if (VIEW_ALL_STORES) return items;
  const sid = state.currentStoreId;
  return (items || []).filter(function (it) {
    return !it.storeId || it.storeId === sid;
  });
}
// ---------- 门店菜单 ----------
function renderStoreMenu() {
  var menuList = document.getElementById('store-menu-list');
  if (!menuList) return;
  menuList.innerHTML = state.stores.map(function (s) {
    var active = s.id === state.currentStoreId && !VIEW_ALL_STORES ? ' active' : '';
    return '<button class="store-menu-item' + active + '" onclick="switchStore(\'' + s.id + '\')">' +
      '<span class="store-menu-item-info"><strong>' + escapeHTML(s.name) + '</strong><small>' + escapeHTML((s.address || s.phone) || '') + '</small></span>' +
      '<span>' + (active ? '✓' : '') + '</span></button>';
  }).join('');
}
window.toggleStoreMenu = function () {
  var menu = document.getElementById('store-menu');
  if (menu) menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
};
document.addEventListener('click', function(e) {
  var menu = document.getElementById('store-menu');
  var btn = document.getElementById('btn-store-switcher');
  if (menu && menu.style.display === 'block' && !menu.contains(e.target) && (!btn || !btn.contains(e.target))) {
    menu.style.display = 'none';
  }
});
function refreshDiaryStoreDropdown() {
  var diaryStore = document.getElementById('diary-store');
  if (!diaryStore) return;
  var storeOptions = '<option value="current">当前门店</option>';
  (state.stores || []).forEach(function(s) {
    storeOptions += '<option value="' + s.id + '">' + escapeHTML(s.name) + '</option>';
  });
  storeOptions += '<option value="all">全部门店</option>';
  diaryStore.innerHTML = storeOptions;
}

window.switchStore = function (sid) {
  state.currentStoreId = sid;
  VIEW_ALL_STORES = false;
  // 包装 try/catch，隐私模式或 localStorage 配额满时不让切换门店失败
  try { localStorage.setItem('slh_current_store', sid); } catch(e) { console.warn('localStorage setItem failed:', e); }
  var menu = document.getElementById('store-menu');
  if (menu) menu.style.display = 'none';
  renderAll(true);
  var cur = currentStore();
  refreshDiaryStoreDropdown();
  toast('已切换到：' + cur.name, 'success');
};
window.toggleViewAllStores = function () {
  VIEW_ALL_STORES = !VIEW_ALL_STORES;
  var menu = document.getElementById('store-menu');
  if (menu) menu.style.display = 'none';
  renderAll(true);
  toast('查看范围：' + (VIEW_ALL_STORES ? '全部门店' : '当前门店'), 'info');
};
// 门店管理
window.openStoreManager = function () {
  renderStoreManagerList();
  openModal('modal-store-manager');
};
function renderStoreManagerList() {
  var list = document.getElementById('store-manager-list');
  if (!list) return;
  if (!state.stores.length) { list.innerHTML = '<div class="empty-state"><div class="empty-text">暂无门店</div></div>'; return; }
  list.innerHTML = state.stores.map(function (s) {
    return '<div class="store-manager-item">' +
      '<div class="store-manager-info"><strong>' + escapeHTML(s.name) + '</strong>' +
      '<small>' + escapeHTML((s.address || '') + (s.phone ? ' · ' + s.phone : '')) + '</small></div>' +
      '<div class="store-manager-actions">' +
      (s.id === state.currentStoreId ? '<span style="font-size:12px;color:var(--accent);font-weight:600">当前</span>' :
        '<button class="btn-action" onclick="switchStore(\'' + s.id + '\')">切换</button>') +
      (state.stores.length > 1 ? '<button class="btn-action btn-delete" onclick="deleteStore(\'' + s.id + '\')">删除</button>' : '') +
      '</div></div>';
  }).join('');
}
window.saveStore = function () {
  var name = document.getElementById('sm-name').value.trim();
  if (!name) { toast('请输入门店名称', 'error'); return; }
  var storeData = {
    name: name,
    address: document.getElementById('sm-address').value.trim(),
    phone: document.getElementById('sm-phone').value.trim()
  };
  API.createStore(storeData).then(function(newStore) {
    state.stores.push(newStore);
    document.getElementById('sm-name').value = '';
    document.getElementById('sm-address').value = '';
    document.getElementById('sm-phone').value = '';
    renderStoreManagerList();
    renderStoreMenu();
    refreshDiaryStoreDropdown();
    toast('门店已添加：' + name, 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};
window.deleteStore = function (sid) {
  if (state.stores.length <= 1) { toast('至少保留一个门店', 'error'); return; }
  if (!confirm('确认删除此门店？该门店下的数据将被永久删除。')) return;
  API.deleteStore(sid).then(function() {
    state.stores = state.stores.filter(function (s) { return s.id !== sid; });
    if (state.currentStoreId === sid) state.currentStoreId = state.stores[0].id;
    renderStoreManagerList();
    renderAll(true);
    refreshDiaryStoreDropdown();
    toast('门店已删除', 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};

// ---------- 挂单 ----------
window.savePendingOrder = function () {
  if (!currentOrder.customerId) { toast('请先选择客户', 'error'); return; }
  if (!currentOrder.items || currentOrder.items.length === 0) { toast('请添加商品', 'error'); return; }
  var total = currentOrder.items.reduce(function (s, i) { return s + i.price * i.qty; }, 0);
  state.draftOrders = state.draftOrders || [];
  state.draftOrders.push({
    id: 'd-' + Date.now(),
    customerId: currentOrder.customerId,
    customerName: currentOrder.customerName,
    items: JSON.parse(JSON.stringify(currentOrder.items)),
    total: total,
    createdAt: new Date().toLocaleString('zh-CN', { hour12: false }),
    date: fmtDate(new Date()),
    storeId: state.currentStoreId
  });
  saveState();
  renderAll(true);
  toast('已挂单：' + currentOrder.customerName + ' · ¥' + fmtMoney(total), 'success');
  resetOrderForm();
  closeModal('modal-draft-list');
};
window.openDraftList = function () {
  renderDraftList();
  openModal('modal-draft-list');
};
function renderDraftList() {
  var container = document.getElementById('draft-list');
  if (!container) return;
  state.draftOrders = state.draftOrders || [];
  var mine = filterByStore(state.draftOrders);
  if (mine.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">暂无挂单</div></div>';
    return;
  }
  container.innerHTML = mine.slice().reverse().map(function (d) {
    var itemsText = d.items.map(function (i) { return i.productName + ' x' + i.qty; }).join(', ');
    return '<div class="draft-item">' +
      '<div class="draft-top"><span class="draft-customer">' + escapeHTML(d.customerName || '散客') + '</span>' +
      '<span class="draft-date">' + escapeHTML(d.createdAt || '') + '</span></div>' +
      '<div class="draft-items">' + escapeHTML(itemsText) + '</div>' +
      '<div class="draft-summary"><span>共 ' + d.items.length + ' 项</span><span class="draft-total">¥' + fmtMoney(d.total) + '</span></div>' +
      '<div class="draft-actions">' +
      '<button class="btn-primary" onclick="restoreDraftOrder(\'' + d.id + '\')">恢复开单</button>' +
      '<button class="btn-cancel" onclick="deleteDraftOrder(\'' + d.id + '\')">删除</button>' +
      '</div></div>';
  }).join('');
}
window.restoreDraftOrder = function(did) {
  var d = (state.draftOrders || []).find(function(x) { return x.id === did; });
  if (!d) return;
  resetOrderForm();
  currentOrder.customerId = d.customerId;
  currentOrder.customerName = d.customerName;
  currentOrder.items = JSON.parse(JSON.stringify(d.items));
  document.getElementById('order-customer').value = d.customerName || '';
  renderOrderItems();
  state.draftOrders = (state.draftOrders || []).filter(function(x) { return x.id !== did; });
  saveState();
  closeModal('modal-draft-list');
  navTo('sales-new');
  toast('已恢复挂单：' + d.customerName, 'success');
};
window.deleteDraftOrder = function (did) {
  if (!confirm('确认删除此挂单？')) return;
  state.draftOrders = (state.draftOrders || []).filter(function (d) { return d.id !== did; });
  saveState();
  renderDraftList();
  renderHome();
  toast('已删除', 'success');
};

// ---------- 备份/恢复 ----------
window.exportAllData = function (mode) {
  if (mode === 'json') {
    var blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'shanyun_backup_' + fmtDate(new Date()) + '.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('已导出 JSON 备份', 'success');
    return;
  }
  if (mode === 'csv-customers') { window.exportCustomers(); return; }
  if (mode === 'csv-products') { window.exportProducts(); return; }
  if (mode === 'csv-orders') { window.exportOrders(); return; }
  if (mode === 'csv-sales') { window.exportSalesReport(); return; }
};
window.importBackupFile = function () {
  var input = document.getElementById('backup-file');
  if (!input || !input.files || !input.files[0]) { toast('请先选择文件', 'error'); return; }
  var file = input.files[0];
  if (!confirm('导入后将覆盖当前所有数据，确定继续？')) return;
  var reader = new FileReader();
  reader.onload = function (e) {
    try {
      var parsed = JSON.parse(e.target.result);
      if (!Array.isArray(parsed.customers) || !Array.isArray(parsed.products) || !Array.isArray(parsed.orders)) {
        toast('文件格式不正确：缺少必要的数据字段', 'error');
        return;
      }
      if (!parsed.stores) parsed.stores = state.stores;
      if (!parsed.currentStoreId) parsed.currentStoreId = parsed.stores[0] ? parsed.stores[0].id : state.currentStoreId;
      if (!parsed.draftOrders) parsed.draftOrders = [];
      state = parsed;
      saveState();
      input.value = '';
      renderAll(true);
      toast('数据已从 ' + file.name + ' 恢复', 'success');
    } catch (err) {
      toast('文件格式错误，无法恢复', 'error');
    }
  };
  reader.readAsText(file);
};
window.resetToSeed = function () {
  if (!confirm('确认清空本地数据并重置为初始演示数据？')) return;
  // 清除 Mock API 持久化数据、会话、本地挂单及偏好
  try { localStorage.removeItem('shanyun_demo_db'); } catch(e) {}
  try { localStorage.removeItem('shanyun_demo_session'); } catch(e) {}
  try { localStorage.removeItem('shanyun_demo_token'); } catch(e) {}
  try { localStorage.removeItem(DRAFT_KEY); } catch(e) {}
  try { localStorage.removeItem('slh_notifications'); } catch(e) {}
  try { localStorage.removeItem('slh_current_store'); } catch(e) {} // 同步清掉门店选择
  location.reload();
};

// ---------- 生日提醒 ----------
window.showBirthdayReminder = function () {
  var customers = filterByStore(state.customers).filter(function (c) { return c.birthday; });
  if (customers.length === 0) { toast('暂无客户生日信息', 'info'); return; }
  var now = new Date();
  var todayList = [];
  var soonList = [];
  customers.forEach(function (c) {
    var bd = new Date(c.birthday);
    var thisYear = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    if (thisYear.getTime() < now.getTime() - 86400000) {
      thisYear = new Date(now.getFullYear() + 1, bd.getMonth(), bd.getDate());
    }
    var diff = Math.round((thisYear.getTime() - now.getTime()) / 86400000);
    if (diff === 0) todayList.push(c);
    else if (diff > 0 && diff <= 14) soonList.push({ customer: c, days: diff });
  });
  soonList.sort(function (a, b) { return a.days - b.days; });
  var msg = '🎉 今日生日 ' + todayList.length + ' 位，14 天内生日 ' + soonList.length + ' 位';
  var detail = '';
  if (todayList.length) detail += '今日：' + todayList.map(function (c) { return c.name; }).join('、') + '\n';
  if (soonList.length) detail += soonList.slice(0, 5).map(function (s) { return s.customer.name + '(' + s.days + '天后)'; }).join('、');
  alert(msg + '\n\n' + detail);
};

var _uidCounter = 0;
function uid(prefix) { return prefix + '-' + Date.now().toString(36) + '-' + (++_uidCounter); }
function fmtDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, '0');
  const day = String(dt.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}
function fmtDisplayDate(d) {
  const dt = d instanceof Date ? d : new Date(d);
  const weekdays = ['日','一','二','三','四','五','六'];
  return String(dt.getFullYear()).slice(2) + '-' +
    String(dt.getMonth() + 1).padStart(2, '0') + '-' +
    String(dt.getDate()).padStart(2, '0') + ' 星期' + weekdays[dt.getDay()];
}
function fmtMoney(n) {
  if (!n && n !== 0) return '0';
  const val = Number(n);
  return val.toLocaleString('zh-CN', { minimumFractionDigits: val % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 });
}
function fmtNum(n) { return Number(n).toLocaleString('zh-CN'); }
function escapeHTML(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}
function escapeAttr(s) {
  // 用于 HTML 属性值（onclick 等）中的 JS 字符串字面量转义
  return String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}
function toast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + (type || '');
  setTimeout(function() { el.className = 'toast'; }, 2200);
}

// ============== 导航 ==============
function navTo(viewName) {
  document.querySelectorAll('.view').forEach(function(v) { v.classList.remove('active'); });
  const target = document.getElementById('view-' + viewName);
  if (target) target.classList.add('active');

  document.querySelectorAll('.tab-item').forEach(function(t) {
    t.classList.toggle('active', t.dataset.tab === viewName);
  });
  document.querySelectorAll('.side-item').forEach(function(s) {
    if (!s.classList.contains('side-logout')) {
      s.classList.toggle('active', s.dataset.snav === viewName);
    }
  });
  NAV_STACK.push(viewName);
  window.scrollTo(0, 0);

  // 每次导航刷新对应页面数据
  if (viewName === 'home') renderHome();
  else if (viewName === 'diary') renderDiary();
  else if (viewName === 'customers') renderCustomers();
  else if (viewName === 'products') renderProducts();
  else if (viewName === 'suppliers') renderSuppliers();
  else if (viewName === 'purchase') renderPurchasePage();
  else if (viewName === 'cloud') renderCloud();
  else if (viewName === 'price-rule') renderPriceRule();
}
function navBack() {
  NAV_STACK.pop();
  const prev = NAV_STACK[NAV_STACK.length - 1] || 'home';
  navTo(prev);
}

document.querySelectorAll('.tab-item').forEach(function(t) {
  t.addEventListener('click', function() { navTo(t.dataset.tab); });
});
document.querySelectorAll('.side-item').forEach(function(s) {
  s.addEventListener('click', function() {
    if (s.classList.contains('side-logout')) { logout(); return; }
    navTo(s.dataset.snav);
  });
});

// ============== 登录 & 认证 ==============
let codeTimer = null;
let currentCode = '';

// 初始化应用：检查登录状态，加载数据
function initApp() {
  if (API.isLoggedIn()) {
    showLoading('正在恢复会话...');
    API.getMe().then(function(user) {
      // getMe 返回用户对象 { id, username, role }，兼容 { user: {...} } 格式
      var u = user && user.user ? user.user : user;
      state.session = { username: u.username, role: u.role || 'clerk', loginAt: Date.now() };
      return API.loadAll(null); // 先加载全部门店，再由 resolveCurrentStore 选定
    }).then(function(allData) {
      state.stores = allData.stores;
      state.customers = allData.customers;
      state.products = allData.products;
      state.orders = allData.orders;
      state.suppliers = allData.suppliers;
      state.coupons = allData.coupons;
      // 挂单为本地数据，从 localStorage 恢复
      loadDraftOrders();
      // 在 stores 真正加载完成后，再尝试恢复上次选择的门店
      state.currentStoreId = resolveCurrentStore(state.stores, state.currentStoreId);
      hideLoading();
      enterApp();
    }).catch(function(err) {
      console.error('Session restore failed:', err);
      hideLoading();
      API.logout();
      showLoginPage();
    });
  } else {
    showLoginPage();
  }
}

// 根据持久化的偏好，从已加载的门店列表中选出 currentStoreId
// 优先级：调用方传入的 > localStorage 记忆 > 第一个门店
function resolveCurrentStore(stores, fallback) {
  if (!stores || stores.length === 0) return null;
  if (fallback && stores.some(function(s) { return s.id === fallback; })) return fallback;
  var saved = null;
  try { saved = localStorage.getItem('slh_current_store'); } catch(e) {}
  if (saved && stores.some(function(s) { return s.id === saved; })) return saved;
  return stores[0].id;
}

function showLoginPage() {
  document.getElementById('page-main').classList.remove('active');
  document.getElementById('page-login').classList.add('active');
}

function showLoading(msg) {
  var tip = document.getElementById('login-tip');
  if (tip) { tip.style.display = 'block'; tip.style.color = 'var(--text-2)'; tip.textContent = msg || '加载中...'; }
  var btn = document.getElementById('btn-login');
  if (btn) btn.disabled = true;
}

function hideLoading() {
  var tip = document.getElementById('login-tip');
  if (tip) { tip.style.display = 'none'; }
  var btn = document.getElementById('btn-login');
  if (btn) btn.disabled = false;
}

document.getElementById('btn-login').addEventListener('click', function() {
  var username = document.getElementById('login-username').value.trim();
  var password = document.getElementById('login-password').value.trim();
  if (!username) { toast('请输入用户名', 'error'); return; }
  if (!password) { toast('请输入密码', 'error'); return; }
  showLoading('正在登录...');
  API.login(username, password).then(function(data) {
    state.session = { username: data.user.username, role: data.user.role || 'clerk', loginAt: Date.now() };
    state.currentStoreId = data.store ? data.store.id : null;
    return API.loadAll(data.store ? data.store.id : null);
  }).then(function(allData) {
    state.stores = allData.stores;
    state.customers = allData.customers;
    state.products = allData.products;
    state.orders = allData.orders;
    state.suppliers = allData.suppliers;
    state.coupons = allData.coupons;
    loadDraftOrders();
    state.currentStoreId = resolveCurrentStore(state.stores, state.currentStoreId);
    hideLoading();
    enterApp();
  }).catch(function(err) {
    hideLoading();
    var tip = document.getElementById('login-tip');
    if (tip) { tip.style.display = 'block'; tip.style.color = 'var(--danger)'; tip.textContent = err.message; }
  });
});

document.getElementById('btn-register').addEventListener('click', function() {
  var username = document.getElementById('login-username').value.trim();
  var password = document.getElementById('login-password').value.trim();
  if (!username) { toast('请输入用户名', 'error'); return; }
  if (!password || password.length < 4) { toast('密码至少4位', 'error'); return; }
  showLoading('正在注册...');
  API.register(username, password).then(function(data) {
    state.session = { username: data.user.username, role: data.user.role || 'boss', loginAt: Date.now() };
    state.currentStoreId = data.store ? data.store.id : null;
    return API.loadAll(data.store ? data.store.id : null);
  }).then(function(allData) {
    state.stores = allData.stores;
    state.customers = allData.customers;
    state.products = allData.products;
    state.orders = allData.orders;
    state.suppliers = allData.suppliers;
    state.coupons = allData.coupons;
    loadDraftOrders();
    state.currentStoreId = resolveCurrentStore(state.stores, state.currentStoreId);
    hideLoading();
    enterApp();
  }).catch(function(err) {
    hideLoading();
    var tip = document.getElementById('login-tip');
    if (tip) { tip.style.display = 'block'; tip.style.color = 'var(--danger)'; tip.textContent = err.message; }
  });
});

// 回车键登录
document.getElementById('login-password').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') document.getElementById('btn-login').click();
});

function logout() {
  if (!confirm('确认退出登录？')) return;
  API.logout();
  state.session = null;
  state.stores = [];
  state.customers = [];
  state.products = [];
  state.orders = [];
  state.suppliers = [];
  state.coupons = [];
  state.currentStoreId = null;
  document.getElementById('page-main').classList.remove('active');
  document.getElementById('page-login').classList.add('active');
}

function enterApp() {
  document.getElementById('page-login').classList.remove('active');
  document.getElementById('page-main').classList.add('active');
  renderAll(true);
  navTo('home');
  toast('登录成功，欢迎回来', 'success');
}

// ============== 首页 ==============
let currentTagFilter = 'all';
let editingCustomerTags = [];

function renderHome() {
  document.getElementById('home-date').textContent = fmtDisplayDate(new Date());
  const todayStr = fmtDate(new Date());
  const storeOrders = filterByStore(state.orders);
  const storeProducts = filterByStore(state.products);
  const storeCustomers = filterByStore(state.customers);

  // 先从本地 state 快速渲染（instant paint），再异步拉取 API 数据更新
  paintHomeFromLocal(storeOrders, storeProducts, storeCustomers, todayStr);

  // 异步加载 Dashboard API 数据，更新为精确值
  var sid = VIEW_ALL_STORES ? null : state.currentStoreId;
  API.getDashboardOverview(sid).then(function(data) {
    document.getElementById('home-total-amount').textContent = '¥' + fmtMoney(data.todaySales);
    document.getElementById('home-max-order').textContent = data.todayOrders + ' 单';
    document.getElementById('home-purchase-count').textContent = fmtNum(data.totalProducts) + '件';
    document.getElementById('home-purchase-amount').textContent = '¥' + fmtMoney(data.totalStockValue || 0);
    document.getElementById('home-customer-new').textContent = data.todayNewCustomers + '人';
    document.getElementById('home-customer-total').textContent = fmtNum(data.totalCustomers) + '人';
    document.getElementById('home-stock-total').textContent = fmtNum(data.totalProducts) + '件';
    document.getElementById('home-stock-change').textContent = data.lowStockCount > 0 ? data.lowStockCount + ' 告警' : '正常';
    // 利润数据注入
    var profitEl = document.getElementById('home-profit');
    if (profitEl) profitEl.textContent = '¥' + fmtMoney(data.todayProfit || 0);
    var profitMarginEl = document.getElementById('home-profit-margin');
    if (profitMarginEl && data.todaySales > 0) {
      profitMarginEl.textContent = (data.todayProfit / data.todaySales * 100).toFixed(1) + '%';
    }
  }).catch(function() { /* 静默降级，使用本地数据 */ });

  // 异步加载销售趋势，更新 Canvas 图
  API.getSalesTrend(sid, 7).then(function(trend) {
    renderSalesTrendChartFromAPI(trend);
    renderMiniChartFromAPI(trend);
  }).catch(function() { /* 降级到本地计算 */ });
  renderSalesTrendChart(); // 立即渲染本地版本
  renderMiniChart();

  // 库存告警
  renderStockAlerts();
  // 现金流（老板/店长可见）
  renderCashFlow();
  // 快捷开单栏
  renderQuickOrderBar();
  // 当前门店名称
  var curStore = currentStore();
  var el = document.getElementById('current-store-name');
  if (el) el.textContent = (VIEW_ALL_STORES ? '🌐 全部门店' : curStore.name);
  var label = document.getElementById('view-all-label');
  if (label) label.textContent = '查看：' + (VIEW_ALL_STORES ? '全部门店' : '当前门店');
  var draftBadge = document.getElementById('draft-count-badge');
  if (draftBadge) {
    var n = (state.draftOrders || []).length;
    draftBadge.textContent = n;
    draftBadge.style.display = n > 0 ? 'inline-block' : 'none';
  }
  renderStoreMenu();
  renderStoreManagerList();
}

// 用本地 state 快速渲染首页（instant paint，避免白屏等待 API）
function paintHomeFromLocal(storeOrders, storeProducts, storeCustomers, todayStr) {
  var todayOrders = storeOrders.filter(function (o) { return o.date === todayStr; });
  var totalAmount = todayOrders.reduce(function (s, o) { return s + o.total; }, 0);
  var totalQty = todayOrders.reduce(function (s, o) {
    return s + o.items.reduce(function (s2, it) { return s2 + it.qty; }, 0);
  }, 0);
  document.getElementById('home-total-amount').textContent = '¥' + fmtMoney(totalAmount);
  document.getElementById('home-max-order').textContent = totalQty + ' 件';

  var totalStock = storeProducts.reduce(function (s, p) { return s + (p.stock || 0); }, 0);
  var totalValue = storeProducts.reduce(function (s, p) {
    return s + ((p.stock || 0) * (p.purchasePrice || 0));
  }, 0);
  document.getElementById('home-purchase-count').textContent = fmtNum(totalStock) + '件';
  document.getElementById('home-purchase-amount').textContent = '¥' + fmtMoney(totalValue);

  var newCustomers = storeCustomers.filter(function (c) { return c.createdAt === todayStr; }).length;
  var birthdayCount = storeCustomers.filter(function (c) {
    if (!c.birthday) return false;
    var bd = new Date(c.birthday);
    var now = new Date();
    var thisYearBd = new Date(now.getFullYear(), bd.getMonth(), bd.getDate());
    var diff = (thisYearBd - now) / (1000 * 60 * 60 * 24);
    return diff >= 0 && diff <= 30;
  }).length;
  document.getElementById('home-customer-new').textContent = newCustomers + '人';
  document.getElementById('home-customer-total').textContent = fmtNum(storeCustomers.length) + '人';
  document.getElementById('home-customer-birthday').textContent = birthdayCount + '人';

  var todayOut = todayOrders.reduce(function (s, o) {
    return s + o.items.reduce(function (s2, it) { return s2 + it.qty; }, 0);
  }, 0);
  document.getElementById('home-stock-total').textContent = fmtNum(totalStock) + '件';
  document.getElementById('home-stock-change').textContent = todayOut > 0 ? '-' + todayOut + '件' : '0件';
}

// ============== Canvas 销售趋势图 ==============
function renderSalesTrendChart() {
  const canvas = document.getElementById('sales-trend-chart');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  const W = rect.width;
  const H = rect.height;
  ctx.clearRect(0, 0, W, H);

  // 计算最近7天数据（按门店过滤）
  const days = [];
  const salesData = [];
  const profitData = [];
  const storeOrders = filterByStore(state.orders);
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    var ds = fmtDate(d);
    days.push((d.getMonth() + 1) + '/' + d.getDate());
    var dayOrders = storeOrders.filter(function (o) { return o.date === ds; });
    var sales = dayOrders.reduce(function (s, o) { return s + o.total; }, 0);
    var profit = dayOrders.reduce(function (s, o) {
      return s + o.items.reduce(function (s2, it) {
        var cost = it.purchasePrice || (state.products.find(function(p){return p.id===it.productId;})||{}).purchasePrice || 0;
        return s2 + ((it.price || 0) - cost) * it.qty;
      }, 0);
    }, 0);
    salesData.push(sales);
    profitData.push(profit);
  }

  var maxVal = Math.max.apply(null, salesData.concat(profitData).concat([100]));
  var padL = 50, padR = 20, padT = 20, padB = 40;
  var chartW = W - padL - padR;
  var chartH = H - padT - padB;

  // 网格线
  var isLight = document.documentElement.classList.contains('light-theme');
  ctx.strokeStyle = isLight ? '#e4e6eb' : '#2a2b2f';
  ctx.lineWidth = 0.5;
  for (var g = 0; g <= 4; g++) {
    var gy = padT + (chartH / 4) * g;
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(W - padR, gy);
    ctx.stroke();
    // Y轴标签
    ctx.fillStyle = isLight ? '#9094a0' : '#6e7076';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    var labelVal = Math.round(maxVal * (1 - g / 4));
    ctx.fillText(labelVal >= 1000 ? (labelVal / 1000).toFixed(1) + 'k' : labelVal, padL - 8, gy + 3);
  }

  // X轴标签
  ctx.fillStyle = isLight ? '#9094a0' : '#6e7076';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  var barW = chartW / 7;
  for (var x = 0; x < 7; x++) {
    ctx.fillText(days[x], padL + barW * x + barW / 2, H - padB + 20);
  }

  // 绘制柱状图（销售额）
  for (var b = 0; b < 7; b++) {
    var bh = (salesData[b] / maxVal) * chartH;
    var bx = padL + barW * b + barW * 0.15;
    var bw = barW * 0.35;
    var by = padT + chartH - bh;
    // 渐变
    var grad = ctx.createLinearGradient(0, by, 0, padT + chartH);
    grad.addColorStop(0, '#f27835');
    grad.addColorStop(1, 'rgba(242,120,53,0.3)');
    ctx.fillStyle = grad;
    roundRect(ctx, bx, by, bw, bh, 4);
    ctx.fill();
  }

  // 绘制柱状图（利润）
  for (var p = 0; p < 7; p++) {
    var ph = (profitData[p] / maxVal) * chartH;
    var px = padL + barW * p + barW * 0.52;
    var pw = barW * 0.35;
    var py = padT + chartH - ph;
    var grad2 = ctx.createLinearGradient(0, py, 0, padT + chartH);
    grad2.addColorStop(0, '#e8553e');
    grad2.addColorStop(1, 'rgba(232,85,62,0.3)');
    ctx.fillStyle = grad2;
    roundRect(ctx, px, py, pw, ph, 4);
    ctx.fill();
  }
}

function roundRect(ctx, x, y, w, h, r) {
  if (h < 1) h = 1;
  r = Math.min(r, h / 2, w / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ============== API 驱动的销售趋势图（含利润线） ==============
function renderSalesTrendChartFromAPI(trend) {
  var canvas = document.getElementById('sales-trend-chart');
  if (!canvas || !trend || trend.length === 0) return;
  var ctx = canvas.getContext('2d');
  var dpr = window.devicePixelRatio || 1;
  var rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = rect.height * dpr;
  ctx.scale(dpr, dpr);
  var W = rect.width;
  var H = rect.height;
  ctx.clearRect(0, 0, W, H);

  var days = trend.map(function(t) {
    var d = new Date(t.date);
    return (d.getMonth() + 1) + '/' + d.getDate();
  });
  var salesData = trend.map(function(t) { return t.sales; });
  var profitData = trend.map(function(t) { return t.profit || 0; });

  var maxVal = Math.max.apply(null, salesData.concat(profitData).concat([100]));
  var padL = 50, padR = 20, padT = 20, padB = 40;
  var chartW = W - padL - padR;
  var chartH = H - padT - padB;
  var isLight = document.documentElement.classList.contains('light-theme');

  // 网格线
  ctx.strokeStyle = isLight ? '#e4e6eb' : '#2a2b2f';
  ctx.lineWidth = 0.5;
  for (var g = 0; g <= 4; g++) {
    var gy = padT + (chartH / 4) * g;
    ctx.beginPath();
    ctx.moveTo(padL, gy);
    ctx.lineTo(W - padR, gy);
    ctx.stroke();
    ctx.fillStyle = isLight ? '#9094a0' : '#6e7076';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    var labelVal = Math.round(maxVal * (1 - g / 4));
    ctx.fillText(labelVal >= 1000 ? (labelVal / 1000).toFixed(1) + 'k' : labelVal, padL - 8, gy + 3);
  }

  // X轴
  ctx.fillStyle = isLight ? '#9094a0' : '#6e7076';
  ctx.font = '10px sans-serif';
  ctx.textAlign = 'center';
  var barW = chartW / 7;
  for (var x = 0; x < 7; x++) {
    ctx.fillText(days[x], padL + barW * x + barW / 2, H - padB + 20);
  }

  // 销售额柱状图
  for (var b = 0; b < 7; b++) {
    var bh = (salesData[b] / maxVal) * chartH;
    var bx = padL + barW * b + barW * 0.15;
    var by = padT + chartH - bh;
    var grad = ctx.createLinearGradient(0, by, 0, padT + chartH);
    grad.addColorStop(0, '#f27835');
    grad.addColorStop(1, 'rgba(242,120,53,0.3)');
    ctx.fillStyle = grad;
    roundRect(ctx, bx, by, barW * 0.35, bh, 4);
    ctx.fill();
  }

  // 利润柱状图
  for (var p = 0; p < 7; p++) {
    var ph = (profitData[p] / maxVal) * chartH;
    var px = padL + barW * p + barW * 0.52;
    var py = padT + chartH - ph;
    var grad2 = ctx.createLinearGradient(0, py, 0, padT + chartH);
    grad2.addColorStop(0, '#e8553e');
    grad2.addColorStop(1, 'rgba(232,85,62,0.3)');
    ctx.fillStyle = grad2;
    roundRect(ctx, px, py, barW * 0.35, ph, 4);
    ctx.fill();
  }
}

// ============== API 驱动的迷你图 ==============
function renderMiniChartFromAPI(trend) {
  var chartEl = document.getElementById('home-chart');
  if (!chartEl || !trend || trend.length === 0) return;
  chartEl.innerHTML = '';
  var amounts = trend.map(function(t) { return t.sales; });
  var maxAmt = Math.max.apply(null, amounts.concat([1]));
  amounts.forEach(function(v, i) {
    var bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = Math.max(4, (v / maxAmt) * 100) + '%';
    var label = document.createElement('span');
    label.className = 'chart-label';
    label.textContent = i + 1;
    bar.appendChild(label);
    chartEl.appendChild(bar);
  });
}

// ============== 迷你图（真实数据） ==============
function renderMiniChart() {
  var chartEl = document.getElementById('home-chart');
  if (!chartEl) return;
  chartEl.innerHTML = '';
  var days = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date();
    d.setDate(d.getDate() - i);
    days.push(fmtDate(d));
  }
  var amounts = days.map(function(ds) {
    return filterByStore(state.orders).filter(function(o) { return o.date === ds; })
      .reduce(function(s, o) { return s + o.total; }, 0);
  });
  var maxAmt = Math.max.apply(null, amounts.concat([1]));
  amounts.forEach(function(v, i) {
    var bar = document.createElement('div');
    bar.className = 'chart-bar';
    bar.style.height = Math.max(4, (v / maxAmt) * 100) + '%';
    var label = document.createElement('span');
    label.className = 'chart-label';
    label.textContent = i + 1;
    bar.appendChild(label);
    chartEl.appendChild(bar);
  });
}

// ============== 库存告警 ==============
function renderStockAlerts() {
  var section = document.getElementById('stock-alert-section');
  var list = document.getElementById('stock-alert-list');
  var countEl = document.getElementById('stock-alert-count');
  if (!section || !list) return;
  var threshold = (state.stockAlert && state.stockAlert.defaultThreshold) || 10;
  var lowStock = filterByStore(state.products).filter(function(p) {
    var t = p.lowStock || threshold;
    return p.stock <= t;
  });
  if (lowStock.length === 0) {
    section.style.display = 'none';
    return;
  }
  section.style.display = 'block';
  countEl.textContent = lowStock.length;
  list.innerHTML = '';
  lowStock.sort(function(a, b) { return a.stock - b.stock; }).forEach(function(p) {
    var t = p.lowStock || threshold;
    var isOut = p.stock === 0;
    var div = document.createElement('div');
    div.className = 'stock-alert-item' + (isOut ? ' alert-out' : ' alert-low');
    div.innerHTML = '<span class="alert-prod-name">' + escapeHTML(p.name) + '</span>' +
      '<span class="alert-prod-code">' + escapeHTML(p.code || '') + '</span>' +
      '<span class="alert-prod-stock ' + (isOut ? 'stock-zero' : 'stock-low') + '">' +
      (isOut ? '缺货' : '仅剩 ' + p.stock + (p.unit || '件')) + '</span>';
    list.appendChild(div);
  });
}

// ============== 快捷开单栏 ==============
function renderQuickOrderBar() {
  var container = document.getElementById('quick-order-items');
  if (!container) return;
  container.innerHTML = '';
  var hotProducts = filterByStore(state.products).filter(function(p) { return p.isHot; });
  if (hotProducts.length === 0) return;
  hotProducts.forEach(function(p) {
    var div = document.createElement('div');
    div.className = 'quick-order-item';
    div.innerHTML = '<span class="qoi-name">' + escapeHTML(p.name) + '</span>' +
      '<span class="qoi-price">¥' + fmtMoney(p.retailPrice) + '</span>';
    div.onclick = function() { quickAddProduct(p.id); };
    container.appendChild(div);
  });
}

window.quickAddProduct = function(productId) {
  var prod = state.products.find(function(p) { return p.id === productId; });
  if (!prod) return;
  if (prod.stock <= 0) { toast('该商品已缺货', 'error'); return; }
  var existing = currentOrder.items.find(function(i) { return i.productId === productId; });
  if (existing) {
    if (existing.qty >= prod.stock) { toast('库存不足', 'error'); return; }
    existing.qty += 1;
  } else {
    var price = currentOrder.priceType === 'purchase' ? prod.purchasePrice
      : currentOrder.priceType === 'discount' ? (prod.discountPrice || prod.retailPrice * 0.8)
      : prod.retailPrice;
    currentOrder.items.push({
      productId: prod.id,
      productName: prod.name,
      qty: 1,
      price: price,
      purchasePrice: prod.purchasePrice || 0
    });
  }
  renderOrderItems();
  toast(prod.name + ' 已添加', 'success');
};

// ============== 客户标签 ==============
window.addCustomerTag = function(tag) {
  if (editingCustomerTags.indexOf(tag) >= 0) return;
  editingCustomerTags.push(tag);
  renderEditingTags();
};

window.removeCustomerTag = function(tag) {
  editingCustomerTags = editingCustomerTags.filter(function(t) { return t !== tag; });
  renderEditingTags();
};

function renderEditingTags() {
  var wrap = document.getElementById('cust-tags-wrap');
  if (!wrap) return;
  var input = document.getElementById('cust-tag-input');
  // 移除旧标签
  wrap.querySelectorAll('.cust-tag').forEach(function(el) { el.remove(); });
  // 添加新标签
  editingCustomerTags.forEach(function(tag) {
    var span = document.createElement('span');
    span.className = 'cust-tag';
    span.innerHTML = escapeHTML(tag) + ' <span class="tag-remove" onclick="removeCustomerTag(\'' + escapeAttr(tag) + '\')">&times;</span>';
    wrap.insertBefore(span, input);
  });
}

// 标签输入回车
document.addEventListener('DOMContentLoaded', function() {
  var tagInput = document.getElementById('cust-tag-input');
  if (tagInput) {
    tagInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        var val = (tagInput.value || '').trim();
        if (val && editingCustomerTags.indexOf(val) < 0) {
          editingCustomerTags.push(val);
          renderEditingTags();
        }
        tagInput.value = '';
      }
    });
  }
});

window.filterByTag = function(tag) {
  currentTagFilter = tag;
  document.querySelectorAll('.tag-filter').forEach(function(el) {
    el.classList.toggle('active', el.dataset.tag === tag);
  });
  renderCustomers();
};

// ============== 客户管理 ==============
function levelText(lvl) {
  return { platinum: '铂金会员', gold: '黄金会员', vip: 'VIP', normal: '普通会员' }[lvl] || '普通';
}
function renderCustomers() {
  const searchVal = (document.getElementById('customer-search').value || '').toLowerCase();
  const levelFilter = document.getElementById('customer-level').value;
  const sortBy = document.getElementById('customer-sort').value;
  let list = filterByStore(state.customers).slice();
  if (searchVal) {
    list = list.filter(function(c) {
      return (c.name || '').toLowerCase().indexOf(searchVal) >= 0 ||
        (c.phone || '').replace(/\s/g, '').indexOf(searchVal.replace(/\s/g, '')) >= 0;
    });
  }
  if (levelFilter && levelFilter !== 'all') {
    list = list.filter(function(c) { return c.level === levelFilter; });
  }
  // 标签筛选
  if (currentTagFilter && currentTagFilter !== 'all') {
    list = list.filter(function(c) {
      return c.tags && c.tags.indexOf(currentTagFilter) >= 0;
    });
  }
  if (sortBy === 'name') list.sort(function(a, b) { return (a.name || '').localeCompare(b.name || '', 'zh'); });
  else if (sortBy === 'balance') list.sort(function(a, b) { return (b.balance || 0) - (a.balance || 0); });
  else if (sortBy === 'points') list.sort(function(a, b) { return (b.points || 0) - (a.points || 0); });

  const container = document.getElementById('customer-list');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">暂无客户，点击右上角 + 添加</div></div>';
  } else {
    list.forEach(function(c) {
      const card = document.createElement('div');
      card.className = 'customer-card';
      // 标签 HTML
      var tagsHtml = '';
      if (c.tags && c.tags.length > 0) {
        tagsHtml = '<div class="cust-tags">' + c.tags.map(function(t) {
          return '<span class="cust-tag-display">' + escapeHTML(t) + '</span>';
        }).join('') + '</div>';
      }
      card.innerHTML = '<div class="cust-name-row">' +
        '<span class="cust-name">' + escapeHTML(c.name || '未命名') + '</span>' +
        '<span class="customer-level level-' + (c.level || 'normal') + '">' + levelText(c.level) + '</span>' +
        '</div>' +
        tagsHtml +
        '<div class="customer-phone">📞 ' + escapeHTML(c.phone || '无电话') + '</div>' +
        '<div class="customer-stats">' +
          '<div>积分<br><b>' + fmtNum(c.points || 0) + '</b></div>' +
          '<div>余额<br><b>¥' + fmtMoney(c.balance || 0) + '</b></div>' +
          '<div>优惠券<br><b>' + (state.coupons ? state.coupons.filter(function(cp){return cp.status==='active';}).length : 0) + '</b></div>' +
        '</div>' +
        '<div class="customer-actions">' +
          '<div class="action-left">' +
            '<button class="btn-action btn-call" onclick="callCustomer(\'' + c.id + '\')">📞 拨打</button>' +
            '<button class="btn-action btn-chat" onclick="chatCustomer(\'' + c.id + '\')">💬</button>' +
          '</div>' +
          '<button class="btn-action btn-order" onclick="openOrderForCustomer(\'' + c.id + '\')">开单</button>' +
          '<button class="btn-action btn-edit" onclick="openCustomerForm(\'' + c.id + '\')">编辑</button>' +
        '</div>';
      container.appendChild(card);
    });
  }
  document.getElementById('cust-count').textContent = fmtNum(list.length);
  document.getElementById('cust-balance').textContent = '¥' + fmtMoney(list.reduce(function(s, c) { return s + (c.balance || 0); }, 0));
  document.getElementById('cust-owe').textContent = '¥0';
  document.getElementById('cust-points').textContent = fmtNum(list.reduce(function(s, c) { return s + (c.points || 0); }, 0));
}
window.callCustomer = function(id) {
  const c = state.customers.find(function(x) { return x.id === id; });
  toast('正在拨打 ' + (c.phone || ''));
};
window.chatCustomer = function(id) {
  const c = state.customers.find(function(x) { return x.id === id; });
  toast('打开与 ' + (c.name || '') + ' 的聊天');
};
window.openOrderForCustomer = function(id) {
  const c = state.customers.find(function(x) { return x.id === id; });
  resetOrderForm();
  currentOrder.customerId = id;
  currentOrder.customerName = c.name;
  document.getElementById('order-customer').value = c.name || '';
  navTo('sales-new');
};

document.getElementById('customer-search').addEventListener('input', renderCustomers);
document.getElementById('customer-level').addEventListener('change', renderCustomers);
document.getElementById('customer-sort').addEventListener('change', renderCustomers);

let editingCustomerId = null;
window.openCustomerForm = function(id) {
  editingCustomerId = id || null;
  document.getElementById('customer-modal-title').textContent = id ? '编辑客户' : '新增客户';
  if (id) {
    const c = state.customers.find(function(x) { return x.id === id; });
    document.getElementById('cust-name').value = c.name;
    document.getElementById('cust-phone').value = c.phone || '';
    document.getElementById('cust-level').value = c.level || 'normal';
    document.getElementById('cust-balance-input').value = c.balance || 0;
    document.getElementById('cust-points-input').value = c.points || 0;
    document.getElementById('cust-birthday').value = c.birthday || '';
    document.getElementById('cust-remark').value = c.remark || '';
    editingCustomerTags = (c.tags || []).slice();
  } else {
    document.getElementById('cust-name').value = '';
    document.getElementById('cust-phone').value = '';
    document.getElementById('cust-level').value = 'normal';
    document.getElementById('cust-balance-input').value = 0;
    document.getElementById('cust-points-input').value = 0;
    document.getElementById('cust-birthday').value = '';
    document.getElementById('cust-remark').value = '';
    editingCustomerTags = [];
  }
  renderEditingTags();
  openModal('modal-customer');
};
window.saveCustomer = function() {
  const name = document.getElementById('cust-name').value.trim();
  if (!name) { toast('请输入客户名称', 'error'); return; }
  const data = {
    store_id: state.currentStoreId,
    name: name,
    phone: document.getElementById('cust-phone').value.trim(),
    level: document.getElementById('cust-level').value,
    points: parseFloat(document.getElementById('cust-points-input').value) || 0,
    birthday: document.getElementById('cust-birthday').value,
    remark: document.getElementById('cust-remark').value.trim(),
    tags: editingCustomerTags.slice()
  };
  if (editingCustomerId) {
    API.updateCustomer(editingCustomerId, data).then(function() {
      var c = state.customers.find(function (x) { return x.id === editingCustomerId; });
      if (c) { Object.assign(c, data); c.tags = editingCustomerTags.slice(); }
      closeModal('modal-customer');
      renderCustomers();
      renderHome();
      toast('已保存', 'success');
    }).catch(function(err) { toast(err.message, 'error'); });
  } else {
    API.createCustomer(data).then(function(result) {
      state.customers.push({ id: result.id, createdAt: fmtDate(new Date()), storeId: state.currentStoreId, name: name, phone: data.phone, level: data.level, points: data.points, birthday: data.birthday, remark: data.remark, tags: editingCustomerTags.slice(), total_spent: 0 });
      closeModal('modal-customer');
      renderCustomers();
      renderHome();
      toast('客户已创建', 'success');
    }).catch(function(err) { toast(err.message, 'error'); });
  }
};

// ============== 货品管理 ==============
function emojiForProduct(cat) {
  return ({ '裤类': '👖', 'T恤类': '👕', '鞋类': '👟', '连衣裙': '👗', '外套': '🧥', '包类': '👜', '配饰': '💍', '其他': '🛍️' })[cat] || '🛍️';
}
function renderProducts() {
  const searchVal = (document.getElementById('product-search').value || '').toLowerCase();
  const catFilter = document.getElementById('product-cat').value;
  const sortBy = document.getElementById('product-sort').value;
  let list = filterByStore(state.products).slice();
  if (searchVal) {
    list = list.filter(function(p) {
      return (p.name || '').toLowerCase().indexOf(searchVal) >= 0 ||
        (p.code || '').toLowerCase().indexOf(searchVal) >= 0;
    });
  }
  if (catFilter && catFilter !== 'all') {
    list = list.filter(function(p) { return p.category === catFilter; });
  }
  if (sortBy === 'stock') list.sort(function(a, b) { return (a.stock || 0) - (b.stock || 0); });
  else if (sortBy === 'name') list.sort(function(a, b) { return (a.name || '').localeCompare(b.name || '', 'zh'); });
  else if (sortBy === 'price') list.sort(function(a, b) { return (b.retailPrice || 0) - (a.retailPrice || 0); });

  const container = document.getElementById('product-list');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">👕</div><div class="empty-text">暂无货品，点击右上角 + 添加</div></div>';
    return;
  }
  list.forEach(function(p) {
    const card = document.createElement('div');
    const stockLevel = p.stock === 0 ? 'out' : (p.stock < 10 ? 'low' : 'ok');
    card.className = 'product-card stock-' + stockLevel;
    card.innerHTML = '<div class="product-img">' + emojiForProduct(p.category) + '</div>' +
      '<div class="product-info">' +
        '<div class="product-name">' + escapeHTML(p.name) + '</div>' +
        '<div class="product-code">款号: ' + escapeHTML(p.code || '') + ' · 供应商: ' + escapeHTML(p.supplier || '未指定') + '</div>' +
        '<div class="product-prices">' +
          '<span>零售价 <b>¥' + fmtMoney(p.retailPrice || 0) + '</b></span>' +
          '<span>进货价 ¥' + fmtMoney(p.purchasePrice || 0) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="product-stock">' + (p.stock === 0 ? '缺货' : '库存 ' + fmtNum(p.stock || 0)) + '</div>' +
      '<div class="product-actions">' +
        '<button class="btn-action btn-edit" onclick="openProductForm(\'' + p.id + '\')">编辑</button>' +
        '<button class="btn-action btn-delete" onclick="deleteProduct(\'' + p.id + '\')">删除</button>' +
      '</div>' +
      '<div class="product-stock-adj">' +
        '<button class="btn-action stock-btn" onclick="adjustProductStock(\'' + p.id + '\', -1)">-1</button>' +
        '<button class="btn-action stock-btn" onclick="adjustProductStock(\'' + p.id + '\', 1)">+1</button>' +
        '<button class="btn-action hot-btn' + (p.isHot ? ' active' : '') + '" onclick="toggleProductHot(\'' + p.id + '\')">' + (p.isHot ? '🔥热销' : '热销') + '</button>' +
      '</div>';
    container.appendChild(card);
  });
}
document.getElementById('product-search').addEventListener('input', renderProducts);
document.getElementById('product-cat').addEventListener('change', renderProducts);
document.getElementById('product-sort').addEventListener('change', renderProducts);

// 货品筛选按钮
var btnProductFilter = document.querySelector('#view-products .btn-filter');
if (btnProductFilter) {
  btnProductFilter.addEventListener('click', function() {
    var categories = ['全部', '裤类', 'T恤类', '鞋类', '连衣裙', '外套', '包类', '配饰', '其他'];
    var catOptions = categories.map(function(c, i) { return i + '. ' + c; }).join('\n');
    var choice = prompt('选择分类筛选（输入序号）：\n' + catOptions, '0');
    if (choice !== null) {
      var idx = parseInt(choice) || 0;
      var cat = categories[idx] || '全部';
      var sel = document.getElementById('product-cat');
      sel.value = cat === '全部' ? 'all' : cat;
      renderProducts();
      toast('已筛选：' + (cat === '全部' ? '全部分类' : cat), 'info');
    }
  });
}

// 快捷调库存
window.adjustProductStock = function(pid, delta) {
  var prod = state.products.find(function(p) { return p.id === pid; });
  if (!prod) return;
  var newStock = Math.max(0, (prod.stock || 0) + delta);
  prod.stock = newStock;
  API.updateProduct(pid, { stock: newStock }).then(function() {
    renderProducts();
    renderHome();
    toast(prod.name + ' 库存 ' + (delta > 0 ? '+' + delta : delta), 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};

// 切换热销标记
window.toggleProductHot = function(pid) {
  var prod = state.products.find(function(p) { return p.id === pid; });
  if (!prod) return;
  prod.isHot = !prod.isHot;
  API.updateProduct(pid, { hot: prod.isHot ? 1 : 0 }).then(function() {
    renderProducts();
    renderHome();
    toast(prod.name + (prod.isHot ? ' 已标记为热销' : ' 已取消热销'), 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};

let editingProductId = null;
window.openProductForm = function(id) {
  editingProductId = id || null;
  document.getElementById('product-modal-title').textContent = id ? '编辑货品' : '新建货品';
  const supSel = document.getElementById('prod-supplier');
  supSel.innerHTML = '<option value="">-- 选择供应商 --</option>' +
    filterByStore(state.suppliers).map(function(s) { return '<option value="' + escapeHTML(s.name) + '">' + escapeHTML(s.name) + '</option>'; }).join('');
  if (id) {
    const p = state.products.find(function(x) { return x.id === id; });
    document.getElementById('prod-name').value = p.name;
    document.getElementById('prod-code').value = p.code || '';
    document.getElementById('prod-supplier').value = p.supplier || '';
    document.getElementById('prod-purchase').value = p.purchasePrice || 0;
    document.getElementById('prod-retail').value = p.retailPrice || 0;
    document.getElementById('prod-discount-price').value = p.discountPrice || (p.retailPrice ? p.retailPrice * 0.8 : 0);
    document.getElementById('prod-category').value = p.category || '其他';
    document.getElementById('prod-stock').value = p.stock || 0;
    document.getElementById('prod-unit').value = p.unit || '件';
    document.getElementById('prod-barcode').value = p.barcode || '';
    document.getElementById('prod-remark').value = p.remark || '';
  } else {
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-code').value = '';
    document.getElementById('prod-supplier').value = (filterByStore(state.suppliers)[0] || {}).name || '';
    document.getElementById('prod-purchase').value = '';
    document.getElementById('prod-retail').value = '';
    document.getElementById('prod-discount-price').value = '';
    document.getElementById('prod-category').value = '裤类';
    document.getElementById('prod-stock').value = 0;
    document.getElementById('prod-unit').value = '件';
    document.getElementById('prod-barcode').value = '';
    document.getElementById('prod-remark').value = '';
  }
  openModal('modal-product');
};
window.deleteProduct = function(id) {
  if (!confirm('确认删除该货品？')) return;
  API.deleteProduct(id).then(function() {
    state.products = state.products.filter(function(p) { return p.id !== id; });
    renderProducts();
    toast('已删除', 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};
window.saveProduct = function() {
  const name = document.getElementById('prod-name').value.trim();
  if (!name) { toast('请输入货品名称', 'error'); return; }
  const purchase = parseFloat(document.getElementById('prod-purchase').value) || 0;
  const retail = parseFloat(document.getElementById('prod-retail').value) || 0;
  const apiData = {
    store_id: state.currentStoreId,
    name: name,
    code: document.getElementById('prod-code').value.trim() || ('P' + Date.now()),
    category: document.getElementById('prod-category').value,
    price: retail,
    purchase_price: purchase,
    stock: parseInt(document.getElementById('prod-stock').value) || 0,
    warning_stock: 10,
    supplier_id: document.getElementById('prod-supplier').value || ''
  };
  if (editingProductId) {
    API.updateProduct(editingProductId, apiData).then(function() {
      var p = state.products.find(function (x) { return x.id === editingProductId; });
      if (p) {
        p.name = name; p.code = apiData.code; p.category = apiData.category;
        p.price = retail; p.purchasePrice = purchase; p.stock = apiData.stock;
        p.supplierId = apiData.supplier_id;
      }
      closeModal('modal-product');
      renderProducts();
      renderHome();
      toast('已保存', 'success');
    }).catch(function(err) { toast(err.message, 'error'); });
  } else {
    API.createProduct(apiData).then(function(result) {
      state.products.push({ id: result.id, storeId: state.currentStoreId, name: name, code: apiData.code, category: apiData.category, price: retail, purchasePrice: purchase, stock: apiData.stock, warningStock: 10, supplierId: apiData.supplier_id, hot: 0, createdAt: fmtDate(new Date()) });
      closeModal('modal-product');
      renderProducts();
      renderHome();
      toast('货品已创建', 'success');
    }).catch(function(err) { toast(err.message, 'error'); });
  }
};

// ============== 供应商 ==============
function renderSuppliers() {
  const container = document.getElementById('supplier-manage-list');
  const searchVal = (document.getElementById('supplier-list-search').value || '').toLowerCase();
  container.innerHTML = '';
  filterByStore(state.suppliers).filter(function(s) {
    if (!searchVal) return true;
    return (s.name || '').toLowerCase().indexOf(searchVal) >= 0;
  }).forEach(function(s) {
    const card = document.createElement('div');
    card.className = 'supplier-card';
    card.innerHTML = '<div class="supplier-avatar">' + escapeHTML((s.name || 'S').slice(0, 1)) + '</div>' +
      '<div class="supplier-info">' +
        '<div class="supplier-name">' + escapeHTML(s.name) + '</div>' +
        '<div class="supplier-meta">' + escapeHTML(s.address || '') + ' · 进货 <b>' + (s.purchaseCount || 0) + '</b> 笔 · ¥' + ((s.purchaseAmount || 0).toFixed(1)) + '</div>' +
      '</div>' +
      '<div class="supplier-actions">' +
        '<button class="btn-action btn-edit" onclick="openSupplierForm(\'' + s.id + '\')">编辑</button>' +
        '<button class="btn-action btn-delete" onclick="deleteSupplier(\'' + s.id + '\')">删除</button>' +
      '</div>';
    container.appendChild(card);
  });
}
let editingSupplierId = null;
window.openSupplierForm = function(id) {
  editingSupplierId = id || null;
  document.getElementById('supplier-modal-title').textContent = id ? '编辑供应商' : '新增供应商';
  if (id) {
    const s = state.suppliers.find(function(x) { return x.id === id; });
    document.getElementById('sup-name').value = s.name;
    document.getElementById('sup-phone').value = s.phone || '';
    document.getElementById('sup-address').value = s.address || '';
    document.getElementById('sup-remark').value = s.remark || '';
  } else {
    document.getElementById('sup-name').value = '';
    document.getElementById('sup-phone').value = '';
    document.getElementById('sup-address').value = '';
    document.getElementById('sup-remark').value = '';
  }
  openModal('modal-supplier');
};
window.deleteSupplier = function(id) {
  if (!confirm('确认删除该供应商？')) return;
  API.deleteSupplier(id).then(function() {
    state.suppliers = state.suppliers.filter(function(s) { return s.id !== id; });
    renderSuppliers();
    renderSupplierList();
    toast('已删除', 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};
window.saveSupplier = function() {
  const name = document.getElementById('sup-name').value.trim();
  if (!name) { toast('请输入供应商名称', 'error'); return; }
  const data = {
    store_id: state.currentStoreId,
    name: name,
    phone: document.getElementById('sup-phone').value.trim(),
    address: document.getElementById('sup-address').value.trim(),
    contact: ''
  };
  if (editingSupplierId) {
    API.updateSupplier(editingSupplierId, data).then(function() {
      var s = state.suppliers.find(function(x) { return x.id === editingSupplierId; });
      if (s) { s.name = name; s.phone = data.phone; s.address = data.address; }
      closeModal('modal-supplier');
      renderSuppliers();
      renderSupplierList();
      toast('已保存', 'success');
    }).catch(function(err) { toast(err.message, 'error'); });
  } else {
    API.createSupplier(data).then(function(result) {
      state.suppliers.push({ id: result.id, storeId: state.currentStoreId, name: name, phone: data.phone, address: data.address, contact: '', createdAt: fmtDate(new Date()) });
      closeModal('modal-supplier');
      renderSuppliers();
      renderSupplierList();
      toast('供应商已创建', 'success');
    }).catch(function(err) { toast(err.message, 'error'); });
  }
};

// 拿货页供应商列表
let supplierTab = 'subscribed';
document.querySelectorAll('.supplier-tab').forEach(function(t) {
  t.addEventListener('click', function() {
    document.querySelectorAll('.supplier-tab').forEach(function(x) { x.classList.remove('active'); });
    t.classList.add('active');
    supplierTab = t.dataset.stab;
    renderSupplierList();
  });
});
document.getElementById('supplier-search').addEventListener('input', renderSupplierList);
document.getElementById('supplier-list-search').addEventListener('input', renderSuppliers);

function renderSupplierList() {
  const searchVal = (document.getElementById('supplier-search').value || '').toLowerCase();
  let list = filterByStore(state.suppliers).slice();
  if (supplierTab === 'subscribed') list = list.filter(function(s) { return s.subscribed; });
  if (searchVal) list = list.filter(function(s) { return (s.name || '').toLowerCase().indexOf(searchVal) >= 0; });
  list.sort(function(a, b) { return (b.purchaseAmount || 0) - (a.purchaseAmount || 0); });

  const container = document.getElementById('supplier-list');
  container.innerHTML = '';
  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏪</div><div class="empty-text">暂无供应商</div></div>';
  } else {
    list.forEach(function(s) {
      const card = document.createElement('div');
      card.className = 'supplier-card';
      card.onclick = function() {
        s.subscribed = !s.subscribed;
        saveState();
        renderSupplierList();
        toast(s.subscribed ? '已订阅' : '已取消订阅', 'success');
      };
      card.innerHTML = '<div class="supplier-avatar">' + escapeHTML((s.name || 'S').slice(0, 1)) + '</div>' +
        '<div class="supplier-info">' +
          '<div class="supplier-name">' + escapeHTML(s.name) + '</div>' +
          '<div class="supplier-meta">进货数: <b>' + (s.purchaseCount || 0) + '</b> · 进货额: <b>¥' + ((s.purchaseAmount || 0).toFixed(1)) + '</b></div>' +
        '</div>' +
        '<span class="supplier-arrow">›</span>';
      container.appendChild(card);
    });
  }
  document.getElementById('count-sub').textContent = filterByStore(state.suppliers).filter(function(s) { return s.subscribed; }).length;
  document.getElementById('count-all').textContent = filterByStore(state.suppliers).length;
}

function renderPurchasePage() {
  document.getElementById('p-today').textContent = filterByStore(state.products).length;
  document.getElementById('p-pending').textContent = filterByStore(state.suppliers).length;
  document.getElementById('p-done').textContent = filterByStore(state.products).reduce(function(s, p) { return s + p.stock; }, 0);
  document.getElementById('p-orders').textContent = filterByStore(state.orders).length;
  document.getElementById('p-owe').textContent = 0;
  renderSupplierList();
}

// ============== 日记 / 销售报表 ==============
function calcPct(cur, prev) {
  if (!prev) return cur > 0 ? '+100%' : '0%';
  const pct = ((cur - prev) / prev) * 100;
  return (pct >= 0 ? '+' : '') + pct.toFixed(0) + '%';
}

function renderDiary() {
  const dateInput = document.getElementById('diary-date');
  if (!dateInput.value) dateInput.value = fmtDate(new Date());
  const dateStr = dateInput.value;
  const targetDate = new Date(dateStr);
  const yesterday = new Date(targetDate);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = fmtDate(yesterday);

  // 分组模式：按天/按周/按月
  var groupMode = diaryGroup ? diaryGroup.value : 'day';
  var periodLabel = dateStr;
  var periodOrders, comparePeriodOrders, compareLabel;

  if (groupMode === 'week') {
    // 获取目标日期所在周（周一到周日）
    var dayOfWeek = targetDate.getDay();
    var mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    var weekStart = new Date(targetDate);
    weekStart.setDate(targetDate.getDate() + mondayOffset);
    var weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    periodLabel = fmtDate(weekStart) + ' ~ ' + fmtDate(weekEnd);
    periodOrders = filterByStore(state.orders).filter(function(o) {
      return o.date >= fmtDate(weekStart) && o.date <= fmtDate(weekEnd);
    });
    // 对比：上周
    var prevWeekStart = new Date(weekStart);
    prevWeekStart.setDate(weekStart.getDate() - 7);
    var prevWeekEnd = new Date(weekEnd);
    prevWeekEnd.setDate(weekEnd.getDate() - 7);
    comparePeriodOrders = filterByStore(state.orders).filter(function(o) {
      return o.date >= fmtDate(prevWeekStart) && o.date <= fmtDate(prevWeekEnd);
    });
    compareLabel = '上周';
  } else if (groupMode === 'month') {
    // 获取目标日期所在月
    var monthStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    var monthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    periodLabel = targetDate.getFullYear() + '年' + (targetDate.getMonth() + 1) + '月';
    periodOrders = filterByStore(state.orders).filter(function(o) {
      return o.date >= fmtDate(monthStart) && o.date <= fmtDate(monthEnd);
    });
    // 对比：上月
    var prevMonthStart = new Date(targetDate.getFullYear(), targetDate.getMonth() - 1, 1);
    var prevMonthEnd = new Date(targetDate.getFullYear(), targetDate.getMonth(), 0);
    comparePeriodOrders = filterByStore(state.orders).filter(function(o) {
      return o.date >= fmtDate(prevMonthStart) && o.date <= fmtDate(prevMonthEnd);
    });
    compareLabel = '上月';
  } else {
    // 按天：原有逻辑
    periodOrders = filterByStore(state.orders).filter(function(o) { return o.date === dateStr; });
    comparePeriodOrders = filterByStore(state.orders).filter(function(o) { return o.date === yesterdayStr; });
    compareLabel = '昨日';
    groupMode = 'day';
  }

  // 同比模式优先于分组对比
  var compareMode = diaryCompare ? diaryCompare.value : 'mom';
  if (compareMode === 'yoy' && groupMode === 'day') {
    var lastWeekDate = new Date(targetDate);
    lastWeekDate.setDate(lastWeekDate.getDate() - 7);
    var lastWeekStr = fmtDate(lastWeekDate);
    comparePeriodOrders = filterByStore(state.orders).filter(function(o) { return o.date === lastWeekStr; });
    compareLabel = '上周同日';
  }

  const todaySalesCount = periodOrders.reduce(function(s, o) {
    return s + o.items.reduce(function(s2, it) { return s2 + it.qty; }, 0);
  }, 0);
  const compSalesCount = comparePeriodOrders.reduce(function(s, o) {
    return s + o.items.reduce(function(s2, it) { return s2 + it.qty; }, 0);
  }, 0);
  const todayAmount = periodOrders.reduce(function(s, o) { return s + o.total; }, 0);
  const compAmount = comparePeriodOrders.reduce(function(s, o) { return s + o.total; }, 0);

  const activeDiaryTab = document.querySelector('.diary-tab.active');
  const subtab = (activeDiaryTab && activeDiaryTab.dataset.dtab) || 'sales';
  const content = document.getElementById('diary-content');
  let html = '';

  if (subtab === 'sales') {
    html = '<div class="diary-section-title">销售概览 (' + periodLabel + ')</div>' +
      '<div class="diary-row"><div class="label">销售数</div><div class="val-y">' + fmtNum(compSalesCount) + '</div><div class="val-t">' + fmtNum(todaySalesCount) + '</div><div class="val-c ' + (todaySalesCount > compSalesCount ? 'up' : todaySalesCount < compSalesCount ? 'down' : 'neutral') + '">' + calcPct(todaySalesCount, compSalesCount) + '</div></div>' +
      '<div class="diary-row"><div class="label">销售额</div><div class="val-y">¥' + fmtMoney(compAmount) + '</div><div class="val-t">¥' + fmtMoney(todayAmount) + '</div><div class="val-c ' + (todayAmount > compAmount ? 'up' : todayAmount < compAmount ? 'down' : 'neutral') + '">' + calcPct(todayAmount, compAmount) + '</div></div>' +
      '<div class="diary-row"><div class="label">销售笔数</div><div class="val-y">' + fmtNum(comparePeriodOrders.length) + '</div><div class="val-t">' + fmtNum(periodOrders.length) + '</div><div class="val-c neutral">' + calcPct(periodOrders.length, comparePeriodOrders.length) + '</div></div>' +
      '<div class="diary-row"><div class="label">客单价</div><div class="val-y">¥' + fmtMoney(comparePeriodOrders.length > 0 ? compAmount / comparePeriodOrders.length : 0) + '</div><div class="val-t">¥' + fmtMoney(periodOrders.length > 0 ? todayAmount / periodOrders.length : 0) + '</div><div class="val-c neutral">-</div></div>' +
      '<div class="diary-row" style="font-size:11px;color:var(--text-3)"><div class="label" style="font-size:11px">对比基准：' + compareLabel + '</div></div>';
  } else if (subtab === 'customer') {
    var storeCustomers = filterByStore(state.customers);
    var tC, yC;
    if (groupMode === 'day') {
      tC = storeCustomers.filter(function(c) { return c.createdAt === dateStr; }).length;
      yC = storeCustomers.filter(function(c) { return c.createdAt === yesterdayStr; }).length;
    } else {
      tC = periodOrders.map(function(o) { return o.customerId; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).length;
      yC = comparePeriodOrders.map(function(o) { return o.customerId; }).filter(function(v, i, a) { return a.indexOf(v) === i; }).length;
    }
    html = '<div class="diary-section-title">客户概览 (' + periodLabel + ')</div>' +
      '<div class="diary-row"><div class="label">新增/活跃客户</div><div class="val-y">' + fmtNum(yC) + '</div><div class="val-t">' + fmtNum(tC) + '</div><div class="val-c neutral">-</div></div>' +
      '<div class="diary-row"><div class="label">客户总数</div><div class="val-y">' + fmtNum(storeCustomers.length) + '</div><div class="val-t">' + fmtNum(storeCustomers.length) + '</div><div class="val-c neutral">0%</div></div>' +
      '<div class="diary-row"><div class="label">订单笔数</div><div class="val-y">' + fmtNum(comparePeriodOrders.length) + '</div><div class="val-t">' + fmtNum(periodOrders.length) + '</div><div class="val-c neutral">' + calcPct(periodOrders.length, comparePeriodOrders.length) + '</div></div>';
  } else if (subtab === 'product') {
    var storeProducts = filterByStore(state.products);
    var st = storeProducts.reduce(function(s, p) { return s + p.stock; }, 0);
    html = '<div class="diary-section-title">货品概览</div>' +
      '<div class="diary-row"><div class="label">货品总数</div><div class="val-y">' + fmtNum(storeProducts.length) + '</div><div class="val-t">' + fmtNum(storeProducts.length) + '</div><div class="val-c neutral">0%</div></div>' +
      '<div class="diary-row"><div class="label">库存总量</div><div class="val-y">' + fmtNum(st) + '</div><div class="val-t">' + fmtNum(st) + '</div><div class="val-c neutral">0%</div></div>' +
      '<div class="diary-row"><div class="label">期间销量</div><div class="val-y">' + fmtNum(compSalesCount) + '</div><div class="val-t">' + fmtNum(todaySalesCount) + '</div><div class="val-c neutral">' + calcPct(todaySalesCount, compSalesCount) + '</div></div>';
  } else if (subtab === 'profit') {
    var profitToday = periodOrders.reduce(function(s, o) {
      return s + o.items.reduce(function(s2, i) {
        var cost = i.purchasePrice || (state.products.find(function(x){return x.id===i.productId;})||{}).purchasePrice || 0;
        return s2 + (i.price - cost) * i.qty;
      }, 0);
    }, 0);
    var profitComp = comparePeriodOrders.reduce(function(s, o) {
      return s + o.items.reduce(function(s2, i) {
        var cost = i.purchasePrice || (state.products.find(function(x){return x.id===i.productId;})||{}).purchasePrice || 0;
        return s2 + (i.price - cost) * i.qty;
      }, 0);
    }, 0);
    html = '<div class="diary-section-title">利润概览</div>' +
      '<div class="diary-row"><div class="label">销售额</div><div class="val-y">¥' + fmtMoney(compAmount) + '</div><div class="val-t">¥' + fmtMoney(todayAmount) + '</div><div class="val-c ' + (todayAmount > compAmount ? 'up' : 'down') + '">' + calcPct(todayAmount, compAmount) + '</div></div>' +
      '<div class="diary-row"><div class="label">利润额</div><div class="val-y">¥' + fmtMoney(profitComp) + '</div><div class="val-t">¥' + fmtMoney(profitToday) + '</div><div class="val-c ' + (profitToday > profitComp ? 'up' : 'down') + '">' + calcPct(profitToday, profitComp) + '</div></div>' +
      '<div class="diary-row"><div class="label">利润率</div><div class="val-y">' + (compAmount > 0 ? ((profitComp / compAmount) * 100).toFixed(1) : 0) + '%</div><div class="val-t">' + (todayAmount > 0 ? ((profitToday / todayAmount) * 100).toFixed(1) : 0) + '%</div><div class="val-c neutral">-</div></div>' +
      '<div class="diary-row" style="font-size:11px;color:var(--text-3)"><div class="label" style="font-size:11px">对比基准：' + compareLabel + '</div></div>';
  }

  if (periodOrders.length > 0) {
    html += '<div class="diary-section-title" style="margin-top:20px">' + (groupMode === 'day' ? '当日' : '期间') + '订单明细</div>';
    periodOrders.slice().reverse().forEach(function(o) {
      var itemsText = o.items.map(function(i) { return escapeHTML(i.productName) + ' x' + i.qty; }).join(', ');
      html += '<div class="order-history-card" style="margin-top:8px"><div class="oh-top"><span>' + (o.date || '') + '</span><span class="oh-status">' + (o.status || '已完成') + '</span></div>' +
        '<div class="oh-customer">' + escapeHTML(o.customerName || '散客') + '</div>' +
        '<div class="oh-item-text">' + escapeHTML(itemsText) + '</div>' +
        '<div class="oh-summary"><span>共 <b>' + fmtNum(o.items.reduce(function(s, i) { return s + i.qty; }, 0)) + '</b> 件</span><span>应收 <b>¥' + fmtMoney(o.total || 0) + '</b></span></div></div>';
    });
  }
  content.innerHTML = html;
}

document.querySelectorAll('.diary-tab').forEach(function(t) {
  t.addEventListener('click', function() {
    document.querySelectorAll('.diary-tab').forEach(function(x) { x.classList.remove('active'); });
    t.classList.add('active');
    renderDiary();
  });
});
document.getElementById('diary-date').addEventListener('change', renderDiary);
// 日记筛选下拉框功能
var diaryStore = document.getElementById('diary-store');
var diaryCompare = document.getElementById('diary-compare');
var diaryGroup = document.getElementById('diary-group');
if (diaryStore) {
  refreshDiaryStoreDropdown();
  diaryStore.addEventListener('change', function() {
    // 日记门店筛选：临时切换门店或全部
    if (this.value === 'all') {
      VIEW_ALL_STORES = true;
    } else if (this.value === 'current') {
      VIEW_ALL_STORES = false;
    } else {
      // 切换到指定门店查看
      var prev = state.currentStoreId;
      state.currentStoreId = this.value;
      renderDiary();
      state.currentStoreId = prev; // 不永久切换
      return;
    }
    renderDiary();
  });
}
if (diaryCompare) {
  diaryCompare.addEventListener('change', function() {
    renderDiary();
  });
}
if (diaryGroup) {
  diaryGroup.addEventListener('change', function() {
    renderDiary();
  });
}
document.getElementById('diary-prev').addEventListener('click', function() {
  const cur = new Date(document.getElementById('diary-date').value);
  cur.setDate(cur.getDate() - 1);
  document.getElementById('diary-date').value = fmtDate(cur);
  renderDiary();
});
document.getElementById('diary-next').addEventListener('click', function() {
  const cur = new Date(document.getElementById('diary-date').value);
  cur.setDate(cur.getDate() + 1);
  document.getElementById('diary-date').value = fmtDate(cur);
  renderDiary();
});

// ============== 营销功能 ==============
// 优惠券系统
window.marketingCoupon = function() {
  if (!state.coupons) state.coupons = [];
  // 渲染已有优惠券列表
  var list = document.getElementById('coupon-existing-list');
  if (list) {
    var coupons = state.coupons;
    if (coupons.length === 0) {
      list.innerHTML = '<div class="empty-state" style="padding:12px"><div class="empty-text" style="font-size:12px">暂无优惠券，填写下方表单创建</div></div>';
    } else {
      list.innerHTML = '<div class="form-section-title" style="font-size:13px">已有优惠券 (' + coupons.length + ' 张)</div>' +
        coupons.map(function(c) {
          return '<div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px">' +
            '<span>' + escapeHTML(c.name) + ' <span style="color:var(--text-3);font-size:11px">满' + fmtMoney(c.minAmount) + '减' + fmtMoney(c.discount) + '</span></span>' +
            '<span style="font-size:11px;color:' + (c.status === 'active' ? 'var(--success)' : 'var(--text-3)') + '">' + (c.status === 'active' ? '生效中' : '已过期') + '</span></div>';
        }).join('');
    }
  }
  document.getElementById('coupon-name').value = '';
  document.getElementById('coupon-min-amount').value = '200';
  document.getElementById('coupon-discount').value = '30';
  document.getElementById('coupon-valid-days').value = '30';
  openModal('modal-coupon');
};
window.saveCoupon = function() {
  var name = document.getElementById('coupon-name').value.trim();
  if (!name) { toast('请输入优惠券名称', 'error'); return; }
  var minAmount = parseFloat(document.getElementById('coupon-min-amount').value) || 200;
  var discount = parseFloat(document.getElementById('coupon-discount').value) || 30;
  var validDays = parseInt(document.getElementById('coupon-valid-days').value) || 30;
  if (!state.coupons) state.coupons = [];
  var couponData = {
    store_id: state.currentStoreId,
    name: name,
    min_amount: minAmount,
    discount: discount,
    valid_days: validDays
  };
  API.createCoupon(couponData).then(function(result) {
    state.coupons.push({
      id: result.id,
      name: name,
      minAmount: minAmount,
      discount: discount,
      validDays: validDays,
      status: 'active',
      createdAt: fmtDate(new Date())
    });
    closeModal('modal-coupon');
    toast('优惠券已创建：' + name, 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};

// 会员等级 - 展示等级分布和权益
window.marketingMemberLevel = function() {
  var customers = filterByStore(state.customers);
  var levels = { platinum: 0, gold: 0, vip: 0, normal: 0 };
  customers.forEach(function(c){ levels[c.level||'normal'] = (levels[c.level||'normal']||0) + 1; });
  var msg = '会员等级分布（当前门店）\n\n';
  msg += '铂金会员：' + levels.platinum + ' 人 | 享9折 + 优先发货\n';
  msg += '黄金会员：' + levels.gold + ' 人 | 享9.5折 + 生日礼\n';
  msg += 'VIP会员：' + levels.vip + ' 人 | 积分双倍\n';
  msg += '普通会员：' + levels.normal + ' 人 | 基础权益\n\n';
  msg += '总客户数：' + customers.length + ' 人';
  alert(msg);
};

// 积分商城 - 积分兑换
window.marketingPointsMall = function() {
  var customers = filterByStore(state.customers);
  if (customers.length === 0) { toast('暂无客户数据', 'info'); return; }
  var totalPoints = customers.reduce(function(s,c){return s+(c.points||0);},0);
  var msg = '积分商城\n\n';
  msg += '当前门店积分总量：' + fmtNum(totalPoints) + ' 分\n\n';
  msg += '可兑换商品：\n';
  msg += '· 1000分 → 满100减10优惠券\n';
  msg += '· 3000分 → 满200减30优惠券\n';
  msg += '· 5000分 → 升级VIP会员\n';
  msg += '· 10000分 → 升级黄金会员\n\n';
  msg += '点击确定为客户兑换积分';
  if (!confirm(msg)) return;

  var customerList = customers.map(function(c, i) {
    return (i + 1) + '. ' + c.name + '（' + (c.phone || '无电话') + '）- 积分：' + (c.points || 0);
  }).join('\n');
  var idx = prompt('选择客户编号：\n' + customerList);
  if (!idx) return;
  var ci = parseInt(idx) - 1;
  if (isNaN(ci) || ci < 0 || ci >= customers.length) { toast('编号无效', 'error'); return; }
  var customer = customers[ci];
  var pts = customer.points || 0;
  if (pts < 1000) { toast(customer.name + ' 积分不足1000，无法兑换', 'error'); return; }

  var options = '';
  if (pts >= 1000) options += '1. 满100减10优惠券 (1000分)\n';
  if (pts >= 3000) options += '2. 满200减30优惠券 (3000分)\n';
  if (pts >= 5000) options += '3. 升级VIP会员 (5000分)\n';
  if (pts >= 10000) options += '4. 升级黄金会员 (10000分)\n';
  var choice = prompt('当前积分：' + pts + '\n选择兑换项：\n' + options);
  if (!choice) return;

  var costMap = { '1': 1000, '2': 3000, '3': 5000, '4': 10000 };
  var cost = costMap[choice];
  if (!cost || pts < cost) { toast('积分不足或选项无效', 'error'); return; }

  // 扣减积分
  customer.points = pts - cost;
  // 根据兑换项执行
  if (choice === '1' || choice === '2') {
    var discount = choice === '1' ? 10 : 30;
    var threshold = choice === '1' ? 100 : 200;
    var coupon = {
      id: 'CP' + Date.now(),
      name: '满' + threshold + '减' + discount + '优惠券',
      type: 'deduct',
      threshold: threshold,
      discount: discount,
      customerId: customer.id,
      customerName: customer.name,
      createdAt: new Date().toLocaleDateString(),
      status: 'unused'
    };
    state.coupons.push(coupon);
    toast(customer.name + ' 兑换成功：满' + threshold + '减' + discount + '优惠券', 'success');
  } else if (choice === '3') {
    customer.level = 'vip';
    toast(customer.name + ' 已升级为 VIP 会员', 'success');
  } else if (choice === '4') {
    customer.level = 'gold';
    toast(customer.name + ' 已升级为 黄金 会员', 'success');
  }
  renderAll(true);
};

// 生日祝福 - 集成已有生日提醒
window.marketingBirthday = function() {
  showBirthdayReminder();
};

// 短信群发 - 展示可群发客户统计
window.marketingSMS = function() {
  var customers = filterByStore(state.customers);
  var withPhone = customers.filter(function(c){return c.phone && c.phone.length>=7;});
  var msg = '短信群发\n\n';
  msg += '当前门店客户：' + customers.length + ' 人\n';
  msg += '有手机号的客户：' + withPhone.length + ' 人\n\n';
  msg += '可发送内容：\n';
  msg += '· 新品到店通知\n';
  msg += '· 促销活动通知\n';
  msg += '· 生日祝福\n';
  msg += '· 会员权益提醒\n\n';
  msg += '（演示模式，实际发送需接入短信API）';
  alert(msg);
};

// 拼团活动
window.marketingGroupBuy = function() {
  var products = filterByStore(state.products);
  var hotProducts = products.filter(function(p){return p.isHot;});
  var msg = '拼团活动\n\n';
  msg += '可选热销商品作为拼团商品：\n';
  if (hotProducts.length > 0) {
    hotProducts.slice(0,5).forEach(function(p){
      msg += '· ' + p.name + ' | ¥' + fmtMoney(p.retailPrice) + ' → 拼团价 ¥' + fmtMoney(Math.floor(p.retailPrice*0.85)) + '\n';
    });
  } else {
    msg += '暂无热销商品，可在货品管理中标记热销\n';
  }
  msg += '\n拼团规则：2人成团，享85折优惠';
  alert(msg);
};

// ============== 销售开单 ==============
let currentOrder = {
  customerId: null, customerName: '', items: [], discount: 100, priceType: 'retail'
};
function resetOrderForm() {
  currentOrder = { customerId: null, customerName: '', items: [], discount: 100, priceType: 'retail' };
  document.getElementById('order-customer').value = '';
  document.getElementById('order-discount').value = 100;
  document.getElementById('order-price-type').value = 'retail';
  document.getElementById('order-remark').value = '';
  document.getElementById('order-date').value = fmtDate(new Date());
  renderOrderItems();
}
function renderOrderItems() {
  const container = document.getElementById('order-items');
  container.innerHTML = '';
  let totalQty = 0;
  let totalAmount = 0;
  currentOrder.items.forEach(function(item) {
    const subtotal = item.price * item.qty;
    totalQty += item.qty;
    totalAmount += subtotal;
    const card = document.createElement('div');
    card.className = 'order-item-card';
    card.innerHTML = '<div class="order-item-top"><span class="order-item-name">' + escapeHTML(item.productName) + '</span>' +
      '<span class="order-item-del" onclick="removeOrderItem(\'' + item.productId + '\')">删除</span></div>' +
      '<div class="order-item-meta">' +
        '<div><span class="order-item-meta-label">单价</span><input type="number" value="' + item.price + '" onchange="updateOrderItemPrice(\'' + item.productId + '\', this.value)" /></div>' +
        '<div><span class="order-item-meta-label">数量</span><input type="number" value="' + item.qty + '" min="1" onchange="updateOrderItemQty(\'' + item.productId + '\', this.value)" /></div>' +
        '<div><span class="order-item-meta-label">小计</span><span class="order-item-total">¥' + fmtMoney(subtotal) + '</span></div>' +
      '</div>';
    container.appendChild(card);
  });
  const discount = parseFloat(document.getElementById('order-discount').value) || 100;
  const discounted = totalAmount * (discount / 100);
  document.getElementById('order-qty').textContent = fmtNum(totalQty);
  document.getElementById('order-total').textContent = '¥' + fmtMoney(discounted);
  document.getElementById('order-discount-amount').textContent = '¥' + fmtMoney(totalAmount - discounted);
  document.getElementById('order-line-count').textContent = currentOrder.items.length;
}
window.removeOrderItem = function(pid) {
  currentOrder.items = currentOrder.items.filter(function(i) { return i.productId !== pid; });
  renderOrderItems();
};
window.updateOrderItemPrice = function(pid, val) {
  const item = currentOrder.items.find(function(i) { return i.productId === pid; });
  if (item) item.price = parseFloat(val) || 0;
  renderOrderItems();
};
window.updateOrderItemQty = function(pid, val) {
  const item = currentOrder.items.find(function(i) { return i.productId === pid; });
  if (item) item.qty = parseInt(val) || 1;
  renderOrderItems();
};
document.getElementById('order-discount').addEventListener('input', renderOrderItems);
document.getElementById('order-price-type').addEventListener('change', function(e) {
  currentOrder.priceType = e.target.value;
  currentOrder.items.forEach(function(item) {
    const p = state.products.find(function(x) { return x.id === item.productId; });
    if (p) {
      if (currentOrder.priceType === 'retail') item.price = p.retailPrice;
      else if (currentOrder.priceType === 'discount') item.price = p.discountPrice || p.retailPrice * 0.8;
      else item.price = p.purchasePrice;
      item.purchasePrice = p.purchasePrice || 0;
    }
  });
  renderOrderItems();
});
window.openCustomerPicker = function() {
  renderPickerCustomerList('');
  const searchInput = document.getElementById('picker-cust-search');
  if (searchInput) {
    searchInput.value = '';
    searchInput.oninput = function() { renderPickerCustomerList(searchInput.value || ''); };
  }
  openModal('modal-customer-picker');
};
function renderPickerCustomerList(keyword) {
  const list = document.getElementById('picker-customer-list');
  if (!list) return;
  const k = (keyword || '').toLowerCase().trim();
  const filtered = k ? filterByStore(state.customers).filter(function (c) {
    return (c.name || '').toLowerCase().indexOf(k) >= 0 ||
      (c.phone || '').indexOf(k) >= 0;
  }) : filterByStore(state.customers);
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><div class="empty-text">未找到匹配客户</div></div>';
    return;
  }
  list.innerHTML = '';
  filtered.forEach(function(c) {
    const div = document.createElement('div');
    div.className = 'picker-item';
    div.innerHTML = '<strong>' + escapeHTML(c.name) + '</strong><small>' +
      escapeHTML(c.phone || '') + ' · ' + levelText(c.level) + '</small>';
    div.onclick = function() { pickCustomer(c.id); };
    list.appendChild(div);
  });
}
window.pickCustomer = function(id) {
  const c = state.customers.find(function(x) { return x.id === id; });
  currentOrder.customerId = id;
  currentOrder.customerName = c.name;
  document.getElementById('order-customer').value = c.name;
  closeModal('modal-customer-picker');
};
window.openProductPicker = function() {
  renderPickerProductList('');
  const searchInput = document.getElementById('picker-prod-search');
  if (searchInput) {
    searchInput.value = '';
    searchInput.oninput = function() { renderPickerProductList(searchInput.value || ''); };
  }
  openModal('modal-product-picker');
};
function renderPickerProductList(keyword) {
  const list = document.getElementById('picker-product-list');
  if (!list) return;
  const k = (keyword || '').toLowerCase().trim();
  const filtered = k ? filterByStore(state.products).filter(function (p) {
    return (p.name || '').toLowerCase().indexOf(k) >= 0 ||
      (p.code || '').toLowerCase().indexOf(k) >= 0;
  }) : filterByStore(state.products);
  if (filtered.length === 0) {
    list.innerHTML = '<div class="empty-state"><div class="empty-icon">👕</div><div class="empty-text">未找到匹配货品</div></div>';
    return;
  }
  list.innerHTML = '';
  filtered.forEach(function(p) {
    const div = document.createElement('div');
    const stockText = p.stock === 0 ? '缺货' : '库存 ' + p.stock;
    const priceText = currentOrder.priceType === 'discount'
      ? (p.discountPrice || p.retailPrice * 0.8)
      : (currentOrder.priceType === 'purchase' ? p.purchasePrice : p.retailPrice);
    div.className = 'picker-item' + (p.stock === 0 ? ' disabled': '');
    div.innerHTML = '<strong>' + escapeHTML(p.name) + '</strong><small>款号 ' +
      escapeHTML(p.code || '') + ' · ' + stockText + ' · ¥' + fmtMoney(priceText) + '</small>';
    if (p.stock > 0) {
      div.onclick = function() { pickProduct(p.id); };
    }
    list.appendChild(div);
  });
}
window.pickProduct = function(id) {
  const p = state.products.find(function(x) { return x.id === id; });
  if (!p) return;
  if (p.stock <= 0) { toast('该商品已缺货', 'error'); return; }
  const existing = currentOrder.items.find(function(i) { return i.productId === id; });
  if (existing) {
    if (existing.qty >= p.stock) { toast('库存不足', 'error'); return; }
    existing.qty += 1;
  }
  else {
    let price = p.retailPrice;
    if (currentOrder.priceType === 'discount') price = p.discountPrice || p.retailPrice * 0.8;
    if (currentOrder.priceType === 'purchase') price = p.purchasePrice;
    currentOrder.items.push({ productId: id, productName: p.name, qty: 1, price: price, purchasePrice: p.purchasePrice || 0 });
  }
  closeModal('modal-product-picker');
  renderOrderItems();
  toast('已添加', 'success');
};
window.checkoutOrder = function() {
  if (!currentOrder.customerId) { toast('请先选择客户', 'error'); return; }
  if (currentOrder.items.length === 0) { toast('请添加货品', 'error'); return; }
  const discount = parseFloat(document.getElementById('order-discount').value) || 100;
  const total = currentOrder.items.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  const final = total * (discount / 100);
  document.getElementById('co-qty').textContent = fmtNum(currentOrder.items.reduce(function(s, i) { return s + i.qty; }, 0));
  document.getElementById('co-total').textContent = '¥' + fmtMoney(total);
  document.getElementById('co-discount').textContent = '¥' + fmtMoney(total - final);
  document.getElementById('co-final').textContent = '¥' + fmtMoney(final);
  // 重置积分抵扣区域
  var cbPts = document.getElementById('co-use-points');
  if (cbPts) cbPts.checked = false;
  togglePointsOffset();
  openModal('modal-checkout');
};
window.confirmCheckout = function() {
  const discount = parseFloat(document.getElementById('order-discount').value) || 100;
  const total = currentOrder.items.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  const afterDiscount = total * (discount / 100);
  // 积分抵扣
  var usePoints = 0;
  var pointsDeduct = 0;
  var cbPts = document.getElementById('co-use-points');
  if (cbPts && cbPts.checked) {
    usePoints = Math.max(0, Math.floor(Number(document.getElementById('co-points-input').value) || 0));
    pointsDeduct = Math.floor(usePoints / 100);
  }
  const final = Math.max(0, afterDiscount - pointsDeduct);
  const now = new Date();
  const apiItems = currentOrder.items.map(function(item) {
    return { productId: item.productId, productName: item.productName, price: item.price, qty: item.qty, purchasePrice: item.purchasePrice || 0 };
  });
  const orderData = {
    store_id: state.currentStoreId,
    customer_id: currentOrder.customerId || '',
    customer_name: currentOrder.customerName || '散客',
    items: apiItems,
    date: document.getElementById('order-date').value || fmtDate(now),
    remark: document.getElementById('order-remark').value || '',
    status: '已完成'
  };
  API.createOrder(orderData).then(function(result) {
    var order = {
      id: result.id,
      customerId: currentOrder.customerId,
      customerName: currentOrder.customerName,
      date: orderData.date,
      createdAt: now.toLocaleString('zh-CN', { hour12: false }),
      items: currentOrder.items.slice(),
      total: final,
      discount: discount,
      pointsUsed: usePoints,
      pointsDeduct: pointsDeduct,
      status: '已完成',
      payMethod: document.getElementById('co-pay-method').value,
      remark: orderData.remark,
      storeId: state.currentStoreId
    };
    state.orders.push(order);
    // 更新本地库存
    currentOrder.items.forEach(function(item) {
      var p = state.products.find(function(x) { return x.id === item.productId; });
      if (p) p.stock = Math.max(0, (p.stock || 0) - item.qty);
    });
    // 更新本地客户积分：先扣抵扣所用，再加本次消费所得
    var cust = state.customers.find(function(c) { return c.id === currentOrder.customerId; });
    if (cust) {
      cust.points = Math.max(0, (cust.points || 0) - usePoints) + Math.floor(final);
    }
    // 库存告警
    filterByStore(state.products).forEach(function(p) {
      var threshold = (p.warningStock) || 10;
      if (p.stock > 0 && p.stock <= threshold) {
        showNotification('库存预警：' + p.name + ' 剩余 ' + p.stock + '件', 'warn');
      } else if (p.stock === 0) {
        showNotification('缺货：' + p.name + ' 已售罄', 'error');
      }
    });
    closeModal('modal-checkout');
    lastCheckoutOrderId = order.id;
    showNotification('订单已保存 · 金额 ¥' + fmtMoney(final) + (pointsDeduct > 0 ? '（积分抵 ¥' + fmtMoney(pointsDeduct) + '）' : ''), 'success');
    resetOrderForm();
    renderAll(true);
    toast('订单已保存，可点击云单中的"打印小票"', 'success');
    navTo('home');
  }).catch(function(err) { toast(err.message, 'error'); });
};
window.toggleOrderDetail = function() {
  const el = document.getElementById('order-items');
  if (el) el.classList.toggle('collapsed');
};

// ============== 价格规则 ==============
function renderPriceRule() {
  document.getElementById('pr-retail').value = state.priceRule.retailRatio;
  document.getElementById('pr-discount').value = state.priceRule.discountRatio;
  document.querySelectorAll('input[name="round-rule"]').forEach(function(r) {
    r.checked = r.value === state.priceRule.rounding;
  });
}
window.savePriceRule = function() {
  state.priceRule.retailRatio = parseFloat(document.getElementById('pr-retail').value) || 150;
  state.priceRule.discountRatio = parseFloat(document.getElementById('pr-discount').value) || 120;
  const round = document.querySelector('input[name="round-rule"]:checked');
  state.priceRule.rounding = round ? round.value : 'round';
  saveState();
  toast('价格规则已保存', 'success');
};

// ============== 云单 ==============
function renderCloud() {
  const container = document.getElementById('cloud-list');
  const emptyEl = document.querySelector('#view-cloud .cloud-empty');
  container.innerHTML = '';
  const scopedOrders = filterByStore(state.orders);
  if (scopedOrders.length === 0) {
    if (emptyEl) emptyEl.style.display = 'block';
    return;
  }
  if (emptyEl) emptyEl.style.display = 'none';
  const sorted = scopedOrders.slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); });
  const payMap = { cash: '现金', wechat: '微信', alipay: '支付宝', card: '刷卡', balance: '余额' };
  sorted.slice(0, 50).forEach(function(o) {
    const totalQty = o.items.reduce(function(s, i) { return s + i.qty; }, 0);
    const card = document.createElement('div');
    card.className = 'order-history-card';
    const isCompleted = o.status === '已完成';
    const isReturn = o.type === 'return' || o.status === '已退货';
    const actionsHtml = isCompleted
      ? '<div class="oh-actions"><button class="oh-action-btn edit-btn" onclick="openEditOrder(\'' + o.id + '\')">编辑</button><button class="oh-action-btn print-btn" onclick="openPrintReceipt(\'' + o.id + '\')">🖨️ 打印</button><button class="oh-action-btn return-btn" onclick="openReturnOrder(\'' + o.id + '\')">退货</button><button class="oh-action-btn cancel-btn" onclick="cancelOrder(\'' + o.id + '\')">取消</button></div>'
      : (isReturn ? '<div class="oh-actions"><span class="oh-tag-return">退货单</span></div>' : '');
    let itemsHtml = '';
    o.items.forEach(function(it) {
      itemsHtml += '<div class="oh-item-row"><span>' + escapeHTML(it.productName) + '</span>' +
        '<span>x' + it.qty + '</span><span>¥' + fmtMoney(it.price * it.qty) + '</span></div>';
    });
    card.innerHTML = '<div class="oh-top"><span>' + (o.date || '') + '</span><span class="oh-status ' + (isCompleted ? '' : 'status-pending') + '">' + (o.status || '已完成') + '</span></div>' +
      '<div class="oh-customer">' + escapeHTML(o.customerName || '散客') + '</div>' +
      '<div class="oh-summary"><span>共 <b>' + fmtNum(totalQty) + '</b> 件</span><span>应收 <b>¥' + fmtMoney(o.total || 0) + '</b></span>' +
      (o.payMethod ? '<span class="oh-pay">付款: ' + (payMap[o.payMethod] || o.payMethod) + '</span>' : '') + '</div>' +
      '<div class="oh-items">' + itemsHtml + '</div>' +
      (o.remark ? '<div class="oh-remark">备注: ' + escapeHTML(o.remark) + '</div>' : '') +
      actionsHtml;
    container.appendChild(card);
  });
}

// ============== 订单编辑 ==============
let editingOrderId = null;
let editingOrderSnapshot = null;
let _editOrderSaving = false; // 防重入锁

window.openEditOrder = function(orderId) {
  editingOrderId = orderId;
  const order = state.orders.find(function(o) { return o.id === orderId; });
  if (!order) { toast('订单不存在', 'error'); return; }
  editingOrderSnapshot = JSON.parse(JSON.stringify(order.items));
  _editOrderSaving = false;
  document.getElementById('edit-order-customer').value = order.customerName || '散客';
  document.getElementById('edit-order-remark').value = order.remark || '';
  document.getElementById('edit-order-date').value = order.date || '';
  renderEditOrderItems(order);
  recalcEditOrderTotal();
  openModal('modal-edit-order');
};

function renderEditOrderItems(order) {
  const list = document.getElementById('edit-order-items');
  if (!list) return;
  list.innerHTML = '';
  order.items.forEach(function(item, idx) {
    const div = document.createElement('div');
    div.className = 'edit-order-item';
    div.innerHTML = '<div class="edit-item-name">' + escapeHTML(item.productName) + '</div>' +
      '<div class="edit-item-controls">' +
        '<button class="qty-btn" onclick="editItemQty(' + idx + ', -1)">-</button>' +
        '<input type="number" class="qty-input" value="' + item.qty + '" onchange="updateEditItemQty(' + idx + ', this.value)" min="1" />' +
        '<button class="qty-btn" onclick="editItemQty(' + idx + ', 1)">+</button>' +
        '<button class="remove-item-btn" onclick="removeEditItem(' + idx + ')">删除</button>' +
      '</div>';
    list.appendChild(div);
  });
}

window.editItemQty = function(idx, delta) {
  const order = state.orders.find(function(o) { return o.id === editingOrderId; });
  if (!order || !order.items[idx]) return;
  const newQty = Math.max(1, (order.items[idx].qty || 1) + delta);
  order.items[idx].qty = newQty;
  recalcEditOrderTotal();
  renderEditOrderItems(order);
};

window.updateEditItemQty = function(idx, val) {
  const order = state.orders.find(function(o) { return o.id === editingOrderId; });
  if (!order || !order.items[idx]) return;
  const newQty = Math.max(1, parseInt(val) || 1);
  order.items[idx].qty = newQty;
  recalcEditOrderTotal();
};

window.removeEditItem = function(idx) {
  const order = state.orders.find(function(o) { return o.id === editingOrderId; });
  if (!order) return;
  order.items.splice(idx, 1);
  if (order.items.length === 0) {
    toast('订单不能没有商品', 'error');
    return;
  }
  recalcEditOrderTotal();
  renderEditOrderItems(order);
};

function recalcEditOrderTotal() {
  const order = state.orders.find(function(o) { return o.id === editingOrderId; });
  if (!order) return;
  order.total = order.items.reduce(function(s, i) { return s + (i.price || 0) * i.qty; }, 0);
  document.getElementById('edit-order-total').textContent = '¥' + fmtMoney(order.total);
}

window.saveEditOrder = function() {
  if (_editOrderSaving) { toast('正在保存中，请稍候', 'info'); return; }
  const order = state.orders.find(function(o) { return o.id === editingOrderId; });
  if (!order) { toast('订单不存在', 'error'); return; }
  _editOrderSaving = true;
  // 恢复旧库存
  if (editingOrderSnapshot) {
    editingOrderSnapshot.forEach(function(oldItem) {
      var prod = state.products.find(function(p) { return p.id === oldItem.productId; });
      if (prod) prod.stock = (prod.stock || 0) + oldItem.qty;
    });
    editingOrderSnapshot = null;
  }
  // 扣减新库存
  order.items.forEach(function(newItem) {
    var prod = state.products.find(function(p) { return p.id === newItem.productId; });
    if (prod) prod.stock = Math.max(0, (prod.stock || 0) - newItem.qty);
  });
  order.remark = document.getElementById('edit-order-remark').value.trim();
  order.date = document.getElementById('edit-order-date').value;
  order.total = order.items.reduce(function(s, i) { return s + (i.price || 0) * i.qty; }, 0);
  // 同步到后端
  API.updateOrder(editingOrderId, {
    items: order.items.map(function(i) { return { productId: i.productId, productName: i.productName, price: i.price, qty: i.qty, purchasePrice: i.purchasePrice || 0 }; }),
    date: order.date,
    remark: order.remark,
    customer_name: order.customerName
  }).then(function() {
    renderCloud();
    renderHome();
    renderDiary();
    closeModal('modal-edit-order');
    _editOrderSaving = false;
    toast('订单已更新', 'success');
  }).catch(function(err) {
    _editOrderSaving = false;
    toast(err.message, 'error');
  });
};

window.cancelOrder = function(orderId) {
  if (!confirm('确认取消此订单？\n\n取消后将恢复商品库存。')) return;
  API.cancelOrder(orderId).then(function() {
    var order = state.orders.find(function(o) { return o.id === orderId; });
    if (!order) return;
    order.items.forEach(function(item) {
      var prod = state.products.find(function(p) { return p.id === item.productId; });
      if (prod) prod.stock = (prod.stock || 0) + item.qty;
    });
    var cust = state.customers.find(function(c) { return c.id === order.customerId; });
    if (cust) cust.points = Math.max(0, (cust.points || 0) - Math.floor(order.total || 0));
    order.status = '已取消';
    order.cancelledAt = Date.now();
    renderCloud();
    renderHome();
    renderProducts();
    toast('订单已取消，库存已恢复', 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};

// ============== 模态框 ==============
function openModal(id) { document.getElementById(id).classList.add('active'); }
function closeModal(id) { document.getElementById(id).classList.remove('active'); }
window.openModal = openModal;
window.closeModal = closeModal;

document.querySelectorAll('.modal').forEach(function(m) {
  m.addEventListener('click', function(e) {
    if (e.target === m) m.classList.remove('active');
  });
});

// ============== 顶部按钮 ==============
document.getElementById('btn-ai-assistant').addEventListener('click', function() {
  toast('智慧助手：今日有 ' + state.customers.length + ' 位客户，' + state.products.length + ' 款货品');
});
document.getElementById('btn-qr').addEventListener('click', function() { toast('扫码功能演示'); });
document.getElementById('btn-chat').addEventListener('click', function() { toast('暂无新消息'); });
document.getElementById('btn-big-fab').addEventListener('click', function() {
  resetOrderForm();
  navTo('sales-new');
});
document.getElementById('btn-quick-purchase').addEventListener('click', function() {
  navTo('products');
});
window.toggleCustomerFilter = function() {
  var levelSel = document.getElementById('customer-level');
  var current = levelSel.value;
  var options = ['all', 'platinum', 'gold', 'vip', 'normal'];
  var labels = ['所有会员', '铂金会员', '黄金会员', 'VIP', '普通'];
  var idx = options.indexOf(current);
  var next = (idx + 1) % options.length;
  levelSel.value = options[next];
  renderCustomers();
  toast('筛选：' + labels[next], 'info');
};

// ============== 全局搜索 ==============
document.getElementById('global-search').addEventListener('input', function(e) {
  const v = (e.target.value || '').trim();
  if (!v) return;
  const matchCust = filterByStore(state.customers).find(function(c) { return (c.name || '').indexOf(v) >= 0; });
  const matchProd = filterByStore(state.products).find(function(p) { return (p.name || '').indexOf(v) >= 0 || (p.code || '').indexOf(v) >= 0; });
  if (matchCust) {
    document.getElementById('customer-search').value = v;
    navTo('customers');
    renderCustomers();
  } else if (matchProd) {
    document.getElementById('product-search').value = v;
    navTo('products');
    renderProducts();
  }
});

// 确保 HTML onclick 可调用这些函数
window.openSupplierList = function() { navTo('suppliers'); };

// ============== 数据导出 ==============
function csvEscape(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
function downloadCSV(filename, rows, headers) {
  const bom = '\uFEFF'; // UTF-8 BOM for Excel compatibility
  const headerRow = headers.map(function(h) { return csvEscape(h); }).join(',');
  const bodyRows = rows.map(function(row) {
    return row.map(function(val) { return csvEscape(val); }).join(',');
  }).join('\n');
  const csvContent = bom + headerRow + '\n' + bodyRows;
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  toast('已导出: ' + filename, 'success');
}

window.exportCustomers = function() {
  const rows = filterByStore(state.customers).map(function(c, idx) {
    return [
      idx + 1,
      c.name || '',
      c.phone || '',
      (c.level === 'platinum' ? '铂金会员' : c.level === 'gold' ? '黄金会员' : '普通客户'),
      c.balance || 0,
      c.points || 0,
      c.birthday || '',
      c.createdAt || ''
    ];
  });
  downloadCSV('客户列表_' + fmtDate(new Date()) + '.csv', rows,
    ['序号', '姓名', '电话', '等级', '余额', '积分', '生日', '创建日期']);
};

window.exportProducts = function() {
  const rows = filterByStore(state.products).map(function(p, idx) {
    return [
      idx + 1,
      p.name || '',
      p.code || '',
      p.category || '',
      p.purchasePrice || 0,
      p.retailPrice || 0,
      p.stock || 0,
      p.unit || '件',
      p.supplier || ''
    ];
  });
  downloadCSV('货品列表_' + fmtDate(new Date()) + '.csv', rows,
    ['序号', '商品名称', '款号', '分类', '进货价', '零售价', '库存', '单位', '供应商']);
};

window.exportOrders = function() {
  const rows = [];
  const payMap = { cash: '现金', wechat: '微信', alipay: '支付宝', card: '刷卡', balance: '余额' };
  filterByStore(state.orders).slice().sort(function(a, b) { return (b.date || '').localeCompare(a.date || ''); })
    .forEach(function(o, idx) {
      const itemsText = o.items.map(function(i) {
        return i.productName + ' x' + i.qty + '(¥' + i.price + ')';
      }).join('; ');
      const totalQty = o.items.reduce(function(s, i) { return s + i.qty; }, 0);
      rows.push([
        idx + 1,
        o.id || '',
        o.date || '',
        o.customerName || '',
        totalQty,
        o.total || 0,
        payMap[o.payMethod] || o.payMethod || '',
        itemsText,
        o.remark || '',
        o.status || '已完成'
      ]);
    });
  downloadCSV('订单列表_' + fmtDate(new Date()) + '.csv', rows,
    ['序号', '订单号', '日期', '客户', '数量', '金额', '付款方式', '商品明细', '备注', '状态']);
};

window.exportSalesReport = function() {
  const sorted = filterByStore(state.orders).slice().sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
  const dailyMap = {};
  sorted.forEach(function(o) {
    const d = o.date || '';
    if (!dailyMap[d]) {
      dailyMap[d] = { date: d, totalAmt: 0, totalQty: 0, count: 0, profit: 0 };
    }
    dailyMap[d].totalAmt += o.total || 0;
    dailyMap[d].totalQty += o.items.reduce(function(s, i) { return s + i.qty; }, 0);
    dailyMap[d].count += 1;
    dailyMap[d].profit += o.items.reduce(function(s, i) {
      var cost = i.purchasePrice || (state.products.find(function(p){return p.id===i.productId;})||{}).purchasePrice || 0;
      return s + ((i.price || 0) - cost) * i.qty;
    }, 0);
  });
  const rows = Object.keys(dailyMap).sort().map(function(d, idx) {
    const info = dailyMap[d];
    return [idx + 1, d, info.count, info.totalQty, info.totalAmt, info.profit,
      info.totalAmt > 0 ? ((info.profit / info.totalAmt) * 100).toFixed(2) + '%' : '0%'];
  });
  const total = { amt: 0, qty: 0, count: 0, profit: 0 };
  Object.keys(dailyMap).forEach(function(d) {
    total.amt += dailyMap[d].totalAmt;
    total.qty += dailyMap[d].totalQty;
    total.count += dailyMap[d].count;
    total.profit += dailyMap[d].profit;
  });
  rows.push(['合计', '', total.count, total.qty, total.amt, total.profit,
    total.amt > 0 ? ((total.profit / total.amt) * 100).toFixed(2) + '%' : '0%']);
  downloadCSV('销售日报_' + fmtDate(new Date()) + '.csv', rows,
    ['序号', '日期', '订单数', '销售件数', '销售额', '利润', '利润率']);
};

// ============== 主题切换 ==============
function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'light') {
    root.classList.add('light-theme');
    root.classList.remove('dark-theme');
  } else {
    root.classList.add('dark-theme');
    root.classList.remove('light-theme');
  }
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) btn.textContent = theme === 'light' ? '☀️' : '🌙';
}
window.toggleTheme = function() {
  let current = 'dark';
  try { current = localStorage.getItem('slh_theme') || 'dark'; } catch(e) {}
  const next = current === 'light' ? 'dark' : 'light';
  try { localStorage.setItem('slh_theme', next); } catch(e) { console.warn('localStorage setItem failed:', e); }
  applyTheme(next);
  toast('已切换到' + (next === 'light' ? '亮色' : '暗色') + '主题', 'success');
};

// ============== 通知中心 ==============
function loadNotifications() {
  try {
    return JSON.parse(localStorage.getItem('slh_notifications') || '[]');
  } catch (e) { return []; }
}
function saveNotifications(list) {
  try { localStorage.setItem('slh_notifications', JSON.stringify(list)); } catch(e) { console.warn('localStorage setItem failed:', e); }
}
function updateNotificationBadge() {
  const badge = document.getElementById('bell-badge');
  if (!badge) return;
  const unread = loadNotifications().filter(function(n) { return !n.read; }).length;
  if (unread > 0) {
    badge.style.display = 'inline-block';
    badge.textContent = unread > 99 ? '99+' : String(unread);
  } else {
    badge.style.display = 'none';
  }
}
window.showNotification = function(msg, type) {
  var list = loadNotifications();
  list.unshift({
    id: 'n-' + Date.now(),
    msg: msg,
    type: type || 'info',
    time: new Date().toLocaleString('zh-CN', { hour12: false }),
    read: false
  });
  if (list.length > 100) list.length = 100;
  saveNotifications(list);
  updateNotificationBadge();
  toast(msg, type);
};
window.openNotificationCenter = function() {
  renderNotificationList();
  openModal('modal-notifications');
};
function renderNotificationList() {
  const list = loadNotifications();
  const container = document.getElementById('notification-list');
  const countEl = document.getElementById('notif-count');
  if (!container) return;
  const unread = list.filter(function(n) { return !n.read; }).length;
  if (countEl) countEl.textContent = '共 ' + list.length + ' 条通知（未读 ' + unread + '）';
  if (list.length === 0) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">🔔</div><div class="empty-text">暂无通知</div></div>';
    return;
  }
  const typeIcon = { success: '✅', info: 'ℹ️', error: '⚠️', warn: '⚡' };
  container.innerHTML = list.map(function(n) {
    return '<div class="notif-item' + (n.read ? ' read' : '') + '">' +
      '<span class="notif-icon">' + (typeIcon[n.type] || '📌') + '</span>' +
      '<div class="notif-content">' +
        '<div class="notif-msg">' + escapeHTML(n.msg) + '</div>' +
        '<div class="notif-time">' + escapeHTML(n.time) + '</div>' +
      '</div></div>';
  }).join('');
  // 标记为已读
  const updated = list.map(function(n) { n.read = true; return n; });
  saveNotifications(updated);
  updateNotificationBadge();
}
window.clearAllNotifications = function() {
  if (!confirm('确定清空所有通知？')) return;
  saveNotifications([]);
  updateNotificationBadge();
  renderNotificationList();
  toast('通知已清空', 'success');
};

// ============== 打印小票 ==============
let lastCheckoutOrderId = null;
window.openPrintReceipt = function(orderId) {
  const order = orderId
    ? state.orders.find(function(o) { return o.id === orderId; })
    : (lastCheckoutOrderId ? state.orders.find(function(o) { return o.id === lastCheckoutOrderId; }) : state.orders[state.orders.length - 1]);
  if (!order) { toast('没有可打印的订单', 'error'); return; }
  const payMap = { cash: '现金', wechat: '微信', alipay: '支付宝', card: '刷卡', balance: '余额' };
  document.getElementById('rcpt-order-id').textContent = order.id;
  document.getElementById('rcpt-date').textContent = order.date || '-';
  document.getElementById('rcpt-time').textContent = order.createdAt || '-';
  document.getElementById('rcpt-customer').textContent = '客户：' + (order.customerName || '散客');
  document.getElementById('rcpt-qty').textContent = order.items.reduce(function(s, i) { return s + i.qty; }, 0) + ' 件';
  document.getElementById('rcpt-total').textContent = '¥' + fmtMoney(order.total || 0);
  document.getElementById('rcpt-pay-method').textContent = payMap[order.payMethod] || order.payMethod || '-';
  const tbody = document.querySelector('#rcpt-items tbody');
  if (tbody) {
    tbody.innerHTML = order.items.map(function(it) {
      return '<tr><td style="text-align:left">' + escapeHTML(it.productName) + '</td>' +
        '<td style="text-align:center">' + it.qty + '</td>' +
        '<td style="text-align:right">¥' + fmtMoney(it.price) + '</td>' +
        '<td style="text-align:right">¥' + fmtMoney(it.price * it.qty) + '</td></tr>';
    }).join('');
  }
  openModal('modal-print-receipt');
};
window.printReceipt = function() {
  const container = document.getElementById('receipt-container');
  if (!container) return;
  const printWin = window.open('', '_blank', 'width=420,height=700');
  if (!printWin) { toast('浏览器阻止了弹出，请允许弹窗', 'error'); return; }
  printWin.document.write('<html><head><meta charset="utf-8"><title>订单小票</title>' +
    '<style>' +
    'body{font-family:"PingFang SC","Microsoft YaHei",sans-serif;padding:16px;color:#000;background:#fff;max-width:380px;margin:0 auto}' +
    '.receipt-header{text-align:center;border-bottom:1px dashed #999;padding-bottom:10px;margin-bottom:10px}' +
    '.receipt-logo{font-size:20px;font-weight:700}' +
    '.receipt-sub{font-size:12px;color:#666;margin-top:4px}' +
    '.receipt-info{text-align:left;font-size:12px;margin-top:8px;line-height:1.7}' +
    'table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}' +
    'th,td{padding:6px 2px;border-bottom:1px dashed #ccc}' +
    '.receipt-summary{margin-top:10px;border-top:1px dashed #999;padding-top:10px;font-size:13px}' +
    '.receipt-row{display:flex;justify-content:space-between;padding:4px 0}' +
    '.receipt-total{font-weight:700;font-size:15px;color:#000}' +
    '.receipt-footer{text-align:center;margin-top:14px;border-top:1px dashed #999;padding-top:10px;font-size:12px;color:#555}' +
    '@media print{body{padding:8px}}</style></head><body>' +
    container.innerHTML + '</body></html>');
  printWin.document.close();
  setTimeout(function() { printWin.focus(); printWin.print(); }, 300);
};

// ============== 角色权限 ==============
// 角色：boss 老板（全权限）/ manager 店长（除员工管理、删除门店外）/ clerk 店员（仅开单、客户、货品，不可见财务）
function currentRole() {
  return (state.session && state.session.role) || 'clerk';
}
function canSeeFinance() { return currentRole() !== 'clerk'; }      // 利润、成本、现金流
function canManageStaff() { return currentRole() === 'boss'; }      // 员工管理
function canDeleteStore() { return currentRole() === 'boss'; }      // 删除门店
function canManageStocktake() { return currentRole() !== 'clerk'; } // 盘点
var ROLE_LABELS = { boss: '老板', manager: '店长', clerk: '店员' };
function roleLabel(r) { return ROLE_LABELS[r] || '店员'; }

// 根据角色隐藏/显示敏感元素（在 renderAll 后调用）
function applyRolePermissions() {
  var financeVisible = canSeeFinance();
  // 财务相关元素
  document.querySelectorAll('[data-role="finance"]').forEach(function(el) {
    el.style.display = financeVisible ? '' : 'none';
  });
  // 仅老板可见
  document.querySelectorAll('[data-role="boss"]').forEach(function(el) {
    el.style.display = canManageStaff() ? '' : 'none';
  });
  // 顶部显示当前角色
  var roleEl = document.getElementById('current-role-badge');
  if (roleEl) roleEl.textContent = roleLabel(currentRole());
}

// ============== 现金流（老板视角） ==============
function renderCashFlow() {
  var container = document.getElementById('cash-flow-section');
  if (!container) return;
  if (!canSeeFinance()) { container.style.display = 'none'; return; }
  container.style.display = '';
  var sid = VIEW_ALL_STORES ? null : state.currentStoreId;
  API.getCashFlow(sid).then(function(cf) {
    var html = '<div class="cf-card cf-received">' +
      '<div class="cf-label">今日实收</div>' +
      '<div class="cf-value">¥' + fmtMoney(cf.netToday) + '</div>' +
      '<div class="cf-sub">收 ¥' + fmtMoney(cf.todayReceived) + ' · 退 ¥' + fmtMoney(cf.todayRefunded) + '</div>' +
      '</div>';
    html += '<div class="cf-card cf-month">' +
      '<div class="cf-label">本月实收</div>' +
      '<div class="cf-value">¥' + fmtMoney(cf.netMonth) + '</div>' +
      '<div class="cf-sub">收 ¥' + fmtMoney(cf.monthReceived) + ' · 退 ¥' + fmtMoney(cf.monthRefunded) + '</div>' +
      '</div>';
    html += '<div class="cf-card cf-receivable">' +
      '<div class="cf-label">应收（欠款）</div>' +
      '<div class="cf-value">¥' + fmtMoney(cf.receivable) + '</div>' +
      '<div class="cf-sub">客户赊账未结</div>' +
      '</div>';
    html += '<div class="cf-card cf-payable">' +
      '<div class="cf-label">应付（进货款）</div>' +
      '<div class="cf-value">¥' + fmtMoney(cf.payable) + '</div>' +
      '<div class="cf-sub">供应商货款</div>' +
      '</div>';
    container.innerHTML = html;
  }).catch(function() { container.innerHTML = '<div class="cf-card">现金流加载失败</div>'; });
}

// ============== 退货流程 ==============
window.openReturnOrder = function(orderId) {
  var order = state.orders.find(function(o) { return o.id === orderId; });
  if (!order) { toast('订单不存在', 'error'); return; }
  if (order.type === 'return') { toast('该单已是退货单', 'error'); return; }
  if (!confirm('确认为此订单办理退货？\n\n将回补库存、扣减客户积分，并生成退货单。')) return;
  var returnItems = order.items.map(function(it) {
    return { productId: it.productId, productName: it.productName, price: it.price, qty: it.qty, purchasePrice: it.purchasePrice || 0 };
  });
  var returnData = {
    store_id: order.storeId || state.currentStoreId,
    customer_id: order.customerId || '',
    customer_name: order.customerName || '散客',
    items: returnItems,
    type: 'return',
    original_order_id: order.id,
    date: fmtDate(new Date()),
    status: '已退货'
  };
  API.createOrder(returnData).then(function(result) {
    // 本地同步：回补库存、扣积分
    order.items.forEach(function(item) {
      var p = state.products.find(function(x) { return x.id === item.productId; });
      if (p) p.stock = (p.stock || 0) + item.qty;
    });
    var cust = state.customers.find(function(c) { return c.id === order.customerId; });
    if (cust) cust.points = Math.max(0, (cust.points || 0) - Math.floor(order.total || 0));
    state.orders.push(Object.assign({}, result, { customerId: result.customerId, customerName: result.customerName, storeId: result.storeId, items: order.items.slice() }));
    renderAll(true);
    toast('退货已办理，库存已回补', 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};

// ============== 积分抵扣（结账时） ==============
window.togglePointsOffset = function() {
  var cb = document.getElementById('co-use-points');
  var input = document.getElementById('co-points-input');
  var info = document.getElementById('co-points-info');
  if (!cb || !input) return;
  input.style.display = cb.checked ? 'inline-block' : 'none';
  if (cb.checked) {
    var cust = state.customers.find(function(c) { return c.id === currentOrder.customerId; });
    var pts = cust ? (cust.points || 0) : 0;
    info.textContent = '可用 ' + pts + ' 积分（100 积分=1 元，最多抵 ' + Math.floor(pts / 100) + ' 元）';
    input.max = Math.floor(pts / 100) * 100;
    input.value = Math.floor(pts / 100) * 100;
  } else {
    info.textContent = '';
    input.value = 0;
  }
  recalcCheckoutWithPoints();
};
window.recalcCheckoutWithPoints = function() {
  var cb = document.getElementById('co-use-points');
  if (!cb || !cb.checked) return;
  var discount = parseFloat(document.getElementById('order-discount').value) || 100;
  var total = currentOrder.items.reduce(function(s, i) { return s + i.price * i.qty; }, 0);
  var afterDiscount = total * (discount / 100);
  var usePts = Math.max(0, Math.floor(Number(document.getElementById('co-points-input').value) || 0));
  var deduct = Math.floor(usePts / 100);
  var final = Math.max(0, afterDiscount - deduct);
  document.getElementById('co-discount').textContent = '¥' + fmtMoney(total - afterDiscount);
  var pointsLine = document.getElementById('co-points-deduct');
  if (pointsLine) pointsLine.textContent = '¥' + fmtMoney(deduct);
  document.getElementById('co-final').textContent = '¥' + fmtMoney(final);
};

// ============== 员工管理 ==============
window.openStaffManager = function() {
  if (!canManageStaff()) { toast('仅老板可管理员工', 'error'); return; }
  renderStaffList();
  openModal('modal-staff');
};
function renderStaffList() {
  var list = document.getElementById('staff-list');
  if (!list) return;
  API.getStaff().then(function(staff) {
    if (!staff.length) { list.innerHTML = '<div class="empty-state"><div class="empty-text">暂无员工</div></div>'; return; }
    list.innerHTML = staff.map(function(s) {
      return '<div class="staff-item">' +
        '<div class="staff-info"><strong>' + escapeHTML(s.username) + '</strong>' +
        '<small>' + escapeHTML(s.phone || '无电话') + ' · ' + roleLabel(s.role) + '</small></div>' +
        '<div class="staff-actions">' +
        '<select class="staff-role-select" onchange="updateStaffRole(\'' + s.id + '\', this.value)">' +
        ['boss', 'manager', 'clerk'].map(function(r) { return '<option value="' + r + '"' + (r === s.role ? ' selected' : '') + '>' + roleLabel(r) + '</option>'; }).join('') +
        '</select>' +
        (s.role !== 'boss' ? '<button class="btn-action btn-delete" onclick="deleteStaff(\'' + s.id + '\')">删除</button>' : '') +
        '</div></div>';
    }).join('');
  }).catch(function(err) { list.innerHTML = '<div class="empty-state">' + escapeHTML(err.message) + '</div>'; });
}
window.addStaff = function() {
  var username = document.getElementById('staff-username').value.trim();
  var password = document.getElementById('staff-password').value.trim();
  var phone = document.getElementById('staff-phone').value.trim();
  var role = document.getElementById('staff-role').value;
  if (!username || !password) { toast('用户名和密码必填', 'error'); return; }
  if (password.length < 4) { toast('密码至少4位', 'error'); return; }
  API.createStaff({ username: username, password: password, phone: phone, role: role }).then(function() {
    document.getElementById('staff-username').value = '';
    document.getElementById('staff-password').value = '';
    document.getElementById('staff-phone').value = '';
    renderStaffList();
    toast('员工已添加：' + username, 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};
window.updateStaffRole = function(id, role) {
  API.updateStaff(id, { role: role }).then(function() {
    toast('角色已更新为 ' + roleLabel(role), 'success');
    renderStaffList();
  }).catch(function(err) { toast(err.message, 'error'); });
};
window.deleteStaff = function(id) {
  if (!confirm('确认删除此员工？')) return;
  API.deleteStaff(id).then(function() {
    renderStaffList();
    toast('员工已删除', 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};

// ============== 盘点 ==============
var stocktakeDraft = null; // { counts: [{product_id, product_name, system_qty, counted_qty}] }
window.openStocktake = function() {
  if (!canManageStocktake()) { toast('店员无盘点权限', 'error'); return; }
  // 初始化盘点草稿：当前门店所有商品
  var prods = filterByStore(state.products);
  stocktakeDraft = {
    counts: prods.map(function(p) {
      return { product_id: p.id, product_name: p.name, system_qty: p.stock || 0, counted_qty: p.stock || 0 };
    })
  };
  renderStocktakeForm();
  renderStocktakeHistory();
  openModal('modal-stocktake');
};
function renderStocktakeForm() {
  var list = document.getElementById('stocktake-form-list');
  if (!list || !stocktakeDraft) return;
  list.innerHTML = stocktakeDraft.counts.map(function(c, idx) {
    var diff = c.counted_qty - c.system_qty;
    var diffClass = diff === 0 ? '' : (diff > 0 ? 'stk-diff-up' : 'stk-diff-down');
    return '<div class="stk-row">' +
      '<div class="stk-name">' + escapeHTML(c.product_name) + '</div>' +
      '<div class="stk-sys">系统 ' + c.system_qty + '</div>' +
      '<input type="number" class="stk-input" value="' + c.counted_qty + '" min="0" onchange="updateStocktakeCount(' + idx + ', this.value)" />' +
      '<div class="stk-diff ' + diffClass + '">' + (diff >= 0 ? '+' : '') + diff + '</div>' +
      '</div>';
  }).join('');
  var totalDiff = stocktakeDraft.counts.reduce(function(s, c) { return s + (c.counted_qty - c.system_qty); }, 0);
  var summary = document.getElementById('stocktake-summary');
  if (summary) summary.textContent = '共 ' + stocktakeDraft.counts.length + ' 项，总差异 ' + (totalDiff >= 0 ? '+' : '') + totalDiff + ' 件';
}
window.updateStocktakeCount = function(idx, val) {
  if (!stocktakeDraft || !stocktakeDraft.counts[idx]) return;
  stocktakeDraft.counts[idx].counted_qty = Math.max(0, parseInt(val) || 0);
  renderStocktakeForm();
};
window.saveStocktake = function(apply) {
  if (!stocktakeDraft) { toast('无盘点数据', 'error'); return; }
  if (apply && !confirm('确认保存并应用盘点结果？\n\n应用后系统库存将被实际盘点数量覆盖。')) return;
  API.createStocktake({
    store_id: state.currentStoreId,
    counts: stocktakeDraft.counts,
    apply: !!apply
  }).then(function() {
    if (apply) {
      // 本地同步库存
      stocktakeDraft.counts.forEach(function(c) {
        var p = state.products.find(function(x) { return x.id === c.product_id; });
        if (p) p.stock = c.counted_qty;
      });
      renderProducts();
    }
    renderStocktakeHistory();
    toast(apply ? '盘点已保存并应用' : '盘点已记录（未应用）', 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};
function renderStocktakeHistory() {
  var list = document.getElementById('stocktake-history');
  if (!list) return;
  API.getStocktakes(state.currentStoreId).then(function(records) {
    if (!records.length) { list.innerHTML = '<div class="empty-state"><div class="empty-text">暂无盘点记录</div></div>'; return; }
    list.innerHTML = records.slice(0, 10).map(function(r) {
      var d = new Date(r.created_at);
      var diffClass = r.totalDiff === 0 ? '' : (r.totalDiff > 0 ? 'stk-diff-up' : 'stk-diff-down');
      return '<div class="stk-history-item">' +
        '<div><strong>' + (d.getMonth() + 1) + '/' + d.getDate() + ' 盘点</strong>' +
        '<small>操作人: ' + escapeHTML(r.operator || '-') + (r.applied ? ' · 已应用' : ' · 仅记录') + '</small></div>' +
        '<div class="stk-diff ' + diffClass + '">' + (r.totalDiff >= 0 ? '+' : '') + r.totalDiff + '</div>' +
        '</div>';
    }).join('');
  }).catch(function() { list.innerHTML = '<div class="empty-state">加载失败</div>'; });
}

// ============== 统一渲染 ==============
function renderAll(forceAll) {
  // 判断当前活跃视图
  var activeView = document.querySelector('.view.active');
  var activeId = activeView ? activeView.id : '';
  // 首页总是需要刷新
  renderHome();
  updateNotificationBadge();
  // 只刷新当前活跃页，避免无意义的全量渲染
  if (forceAll) {
    renderCustomers();
    renderProducts();
    renderSuppliers();
    renderPurchasePage();
    renderDiary();
    renderPriceRule();
    renderCloud();
    renderOrderItems();
    renderSupplierList();
  } else {
    if (activeId === 'view-customers') renderCustomers();
    else if (activeId === 'view-products') renderProducts();
    else if (activeId === 'view-suppliers') renderSuppliers();
    else if (activeId === 'view-purchase') renderPurchasePage();
    else if (activeId === 'view-diary') renderDiary();
    else if (activeId === 'view-price-rule') renderPriceRule();
    else if (activeId === 'view-cloud') renderCloud();
    else if (activeId === 'view-sales-new') renderOrderItems();
  }
  // 只在销售开单页面时才更新日期
  if (activeId === 'view-sales-new') {
    var dateEl = document.getElementById('order-date');
    if (dateEl && !dateEl.dataset.manualSet) dateEl.value = fmtDate(new Date());
  }
  // 应用角色权限（隐藏/显示敏感元素）
  applyRolePermissions();
}

// Canvas 销售趋势图窗口大小自适应
var _resizeTimer = null;
window.addEventListener('resize', function() {
  clearTimeout(_resizeTimer);
  _resizeTimer = setTimeout(function() {
    var activeView = document.querySelector('.view.active');
    if (activeView && activeView.id === 'view-home') {
      renderSalesTrendChart();
    }
  }, 250);
});

// 初始化主题
try { applyTheme(localStorage.getItem('slh_theme') || 'dark'); } catch(e) { applyTheme('dark'); }

// ============== 扫码功能 ==============
window.scanBarcode = function() {
  // 优先使用原生 BarcodeDetector API（Chrome Android）
  if ('BarcodeDetector' in window) {
    var modal = document.createElement('div');
    modal.className = 'modal active';
    modal.style.cssText = 'display:flex;align-items:center;justify-content:center;z-index:9999';
    modal.innerHTML = '<div style="background:#000;border-radius:12px;padding:20px;text-align:center;max-width:90%">' +
      '<video id="scan-video" autoplay playsinline style="width:280px;height:200px;object-fit:cover;border-radius:8px"></video>' +
      '<p style="color:#fff;margin:10px 0">将条码对准摄像头</p>' +
      '<button class="btn-cancel" onclick="this.closest(\'.modal\').remove()" style="margin-top:8px">取消</button></div>';
    document.body.appendChild(modal);
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } }).then(function(stream) {
      var video = document.getElementById('scan-video');
      video.srcObject = stream;
      var detector = new BarcodeDetector({ formats: ['ean_13', 'ean_8', 'code_128', 'qr_code'] });
      var scanLoop = function() {
        detector.detect(video).then(function(barcodes) {
          if (barcodes.length > 0) {
            var code = barcodes[0].rawValue;
            stream.getTracks().forEach(function(t) { t.stop(); });
            modal.remove();
            var input = document.getElementById('order-customer') || document.getElementById('global-search');
            if (input) { input.value = code; toast('扫码成功：' + code, 'success'); }
            var product = state.products.find(function(p) { return p.code === code || p.barcode === code; });
            if (product) { toast('已找到商品：' + product.name, 'success'); }
          } else { requestAnimationFrame(scanLoop); }
        }).catch(function() { requestAnimationFrame(scanLoop); });
      };
      scanLoop();
    }).catch(function() {
      modal.remove();
      var code = prompt('摄像头不可用，请手动输入条码：');
      if (code) { toast('已输入：' + code, 'success'); }
    });
  } else {
    // 降级：手动输入
    var code = prompt('请输入或粘贴条码：');
    if (code) {
      var product = state.products.find(function(p) { return p.code === code || p.barcode === code; });
      if (product) {
        toast('已找到商品：' + product.name, 'success');
      } else {
        toast('未找到条码 ' + code + ' 对应的商品', 'info');
      }
    }
  }
};

// ============== 多选模式 ==============
var multiSelectMode = { products: false, customers: false };
window.toggleMultiSelect = function(type) {
  multiSelectMode[type] = !multiSelectMode[type];
  var container = document.getElementById(type === 'products' ? 'product-list' : 'customer-list');
  if (!container) { toast('列表未加载', 'info'); return; }
  if (multiSelectMode[type]) {
    container.classList.add('multi-select-mode');
    toast('已进入多选模式，点击条目进行选择', 'info');
  } else {
    container.classList.remove('multi-select-mode');
    container.querySelectorAll('.multi-selected').forEach(function(el) { el.classList.remove('multi-selected'); });
    toast('已退出多选模式', 'info');
  }
};

// ============== 数据导入导出功能 ==============
window.openImportExport = function() { openModal('modal-import-export'); };

window.exportEntity = function(type) {
  API.exportData(type).then(function(data) {
    if (!Array.isArray(data)) { toast('导出失败：无数据', 'error'); return; }
    var headers = [];
    if (type === 'products') headers = ['name','code','category','price','purchase_price','stock','warning_stock'];
    else if (type === 'customers') headers = ['name','phone','level','points','total_spent','tags'];
    else if (type === 'suppliers') headers = ['name','contact','phone','address'];
    else if (type === 'orders') headers = ['id','customer_name','total','profit','status','pay_method','date'];
    var csv = headers.join(',') + '\n';
    data.forEach(function(row) {
      csv += headers.map(function(h) { return '"' + (row[h] || '') + '"'; }).join(',') + '\n';
    });
    var blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = type + '_' + new Date().toISOString().slice(0,10) + '.csv';
    a.click();
    URL.revokeObjectURL(a.href);
    toast('导出成功：' + data.length + ' 条', 'success');
  }).catch(function(err) { toast('导出失败：' + err.message, 'error'); });
};

window.doImport = function() {
  var type = document.getElementById('import-type').value;
  var fileInput = document.getElementById('import-file');
  var file = fileInput.files[0];
  if (!file) { toast('请选择文件', 'error'); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    var lines = text.split('\n').filter(function(l) { return l.trim(); });
    if (lines.length < 2) { toast('文件格式错误：至少需要表头和1行数据', 'error'); return; }
    var headers = lines[0].split(',').map(function(h) { return h.trim().replace(/^"|"$/g,''); });
    var data = [];
    for (var i = 1; i < lines.length; i++) {
      var vals = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
      vals = vals.map(function(v) { return v.trim().replace(/^"|"$/g,''); });
      var row = {};
      headers.forEach(function(h, idx) { row[h] = vals[idx] || ''; });
      data.push(row);
    }
    API.importData(type, data).then(function(result) {
      var el = document.getElementById('import-result');
      if (el) {
        el.innerHTML = '<div style="background:#e8f5e9;padding:10px;border-radius:8px;color:#2e7d32;">' +
          '<strong>导入完成</strong><br/>成功: ' + result.success + ' 条，失败: ' + result.failed + ' 条' +
          (result.errors && result.errors.length ? '<br/>错误: ' + result.errors.slice(0,3).map(function(e) { return '行' + e.row + ':' + e.error; }).join(', ') : '') +
          '</div>';
      }
      if (result.success > 0) { state[type] = null; loadAll(); }
      toast('导入完成', 'success');
    }).catch(function(err) { toast('导入失败：' + err.message, 'error'); });
  };
  reader.readAsText(file);
};

// ============== 价格策略功能 ==============
window.openPriceRules = function() {
  openModal('modal-price-rules');
  renderPriceRulesList();
};

function renderPriceRulesList() {
  var el = document.getElementById('price-rules-list');
  if (!el) return;
  API.getPriceRules().then(function(rules) {
    if (!rules || rules.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-3);padding:20px;">暂无价格规则</div>';
      return;
    }
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    rules.forEach(function(r) {
      var typeLabels = { fixed: '一口价', percent: '折扣', minus: '立减' };
      var typeLabel = typeLabels[r.priceType] || r.priceType;
      html += '<div style="background:var(--bg-card);border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;border:1px solid var(--border);">' +
        '<div style="flex:1;">' +
        '<div style="font-weight:600;">' + (r.refName || r.refId || '全局') + '</div>' +
        '<div style="font-size:12px;color:var(--text-3);">' + r.entity + ' · ' + typeLabel + ' ' + r.priceValue + '</div>' +
        '</div>' +
        '<span class="tag ' + (r.status === 'active' ? 'tag-success' : 'tag-gray') + '">' + (r.status === 'active' ? '生效中' : '已停用') + '</span>' +
        '<button class="btn-text" onclick="deletePriceRule(\'' + r.id + '\')">删除</button></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  });
}

window.openAddPriceRule = function() {
  var name = prompt('商品名称或客户等级：');
  if (!name) return;
  var type = prompt('规则类型（fixed一口价/percent折扣/minus立减）：', 'percent');
  var value = prompt('值（例如 80 表示8折或立减80元）：', '80');
  if (!type || !value) return;
  API.createPriceRule({ entity: 'product', refId: name, refName: name, priceType: type, priceValue: Number(value) })
    .then(function() { toast('价格规则已添加', 'success'); renderPriceRulesList(); })
    .catch(function(err) { toast('添加失败：' + err.message, 'error'); });
};

window.deletePriceRule = function(id) {
  if (!confirm('确认删除此价格规则？')) return;
  API.deletePriceRule(id).then(function() { toast('已删除', 'success'); renderPriceRulesList(); }).catch(function(err) { toast('删除失败', 'error'); });
};

// ============== 库存预警功能 ==============
window.openStockAlerts = function() {
  openModal('modal-stock-alerts');
  renderStockAlerts();
};

function renderStockAlerts() {
  var el = document.getElementById('stock-alerts-list');
  var outEl = document.getElementById('alert-out-stock');
  var lowEl = document.getElementById('alert-low-stock');
  var slowEl = document.getElementById('alert-slow-selling');
  if (!el) return;
  API.getStockAlerts().then(function(alerts) {
    var out = alerts.filter(function(a) { return a.type === 'out_of_stock'; });
    var low = alerts.filter(function(a) { return a.type === 'low_stock'; });
    var slow = alerts.filter(function(a) { return a.type === 'slow_selling'; });
    if (outEl) outEl.textContent = out.length;
    if (lowEl) lowEl.textContent = low.length;
    if (slowEl) slowEl.textContent = slow.length;
    var all = out.concat(low).concat(slow);
    if (all.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-3);padding:20px;">暂无预警</div>';
      return;
    }
    var typeLabels = { out_of_stock: '缺货', low_stock: '库存不足', slow_selling: '滞销' };
    var typeColors = { out_of_stock: '#c62828', low_stock: '#e65100', slow_selling: '#1565c0' };
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    all.forEach(function(a) {
      html += '<div style="background:var(--bg-card);border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;border-left:4px solid ' + typeColors[a.type] + ';">' +
        '<div style="flex:1;">' +
        '<div style="font-weight:600;">' + a.productName + '</div>' +
        '<div style="font-size:12px;color:var(--text-3);">当前库存: ' + a.currentStock + ' | 预警值: ' + a.warningStock + '</div>' +
        '</div>' +
        '<span style="color:' + typeColors[a.type] + ';font-size:12px;font-weight:600;">' + typeLabels[a.type] + '</span></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  });
}

// ============== 客户标签与分组功能 ==============
window.openCustomerTags = function() {
  openModal('modal-customer-tags');
  renderCustomerTags();
};

function renderCustomerTags() {
  var el = document.getElementById('customer-tags-list');
  if (!el) return;
  API.getCustomerTags().then(function(tags) {
    if (!tags || tags.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-3);padding:20px;">暂无标签</div>';
      return;
    }
    var html = '<div style="display:flex;flex-wrap:wrap;gap:8px;">';
    tags.forEach(function(t) {
      html += '<span style="background:' + t.color + '22;color:' + t.color + ';padding:6px 12px;border-radius:20px;display:flex;align-items:center;gap:6px;font-size:13px;">' +
        t.name + '<button onclick="deleteCustomerTag(\'' + t.id + '\')" style="background:none;border:none;color:inherit;cursor:pointer;font-size:16px;line-height:1;">✕</button></span>';
    });
    html += '</div>';
    el.innerHTML = html;
  });
}

window.addCustomerTag = function() {
  var name = document.getElementById('new-tag-name').value.trim();
  var color = document.getElementById('new-tag-color').value;
  if (!name) { toast('请输入标签名称', 'error'); return; }
  API.createCustomerTag({ name: name, color: color })
    .then(function() {
      document.getElementById('new-tag-name').value = '';
      toast('标签已添加', 'success');
      renderCustomerTags();
    }).catch(function(err) { toast('添加失败', 'error'); });
};

window.deleteCustomerTag = function(id) {
  API.deleteCustomerTag(id).then(function() { toast('已删除', 'success'); renderCustomerTags(); }).catch(function(err) { toast('删除失败', 'error'); });
};

window.openCustomerGroups = function() {
  openModal('modal-customer-groups');
  renderCustomerGroups();
};

function renderCustomerGroups() {
  var el = document.getElementById('customer-groups-list');
  if (!el) return;
  API.getCustomerGroups().then(function(groups) {
    if (!groups || groups.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-3);padding:20px;">暂无分组</div>';
      return;
    }
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    groups.forEach(function(g) {
      html += '<div style="background:var(--bg-card);border-radius:10px;padding:12px;display:flex;align-items:center;gap:10px;border:1px solid var(--border);">' +
        '<div style="flex:1;">' +
        '<div style="font-weight:600;">' + g.name + (g.description ? ' - ' + g.description : '') + '</div>' +
        '<div style="font-size:12px;color:var(--text-3);">客户数: ' + (g.customerCount || 0) + ' | 折扣: ' + (g.discountRate || 0) + '%</div>' +
        '</div>' +
        '<button class="btn-text" onclick="deleteCustomerGroup(\'' + g.id + '\')">删除</button></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  });
}

window.addCustomerGroup = function() {
  var name = document.getElementById('new-group-name').value.trim();
  var discount = Number(document.getElementById('new-group-discount').value) || 0;
  if (!name) { toast('请输入分组名称', 'error'); return; }
  API.createCustomerGroup({ name: name, discountRate: discount })
    .then(function() {
      document.getElementById('new-group-name').value = '';
      document.getElementById('new-group-discount').value = '0';
      toast('分组已添加', 'success');
      renderCustomerGroups();
    }).catch(function(err) { toast('添加失败', 'error'); });
};

window.deleteCustomerGroup = function(id) {
  if (!confirm('确认删除此分组？')) return;
  API.deleteCustomerGroup(id).then(function() { toast('已删除', 'success'); renderCustomerGroups(); }).catch(function(err) { toast('删除失败', 'error'); });
};

// ============== 供应商对账功能 ==============
window.openSupplierAccounting = function() {
  openModal('modal-supplier-accounting');
  renderSupplierSummary();
  renderSupplierPurchases();
};

function renderSupplierSummary() {
  var el = document.getElementById('supplier-summary-list');
  if (!el) return;
  API.getSupplierSummary().then(function(summary) {
    if (!summary || summary.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-3);padding:12px;">暂无对账数据</div>';
      return;
    }
    var html = '<div style="background:var(--bg-card);border-radius:10px;overflow:hidden;border:1px solid var(--border);">';
    html += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 60px;gap:8px;padding:10px 12px;font-size:12px;font-weight:600;color:var(--text-3);border-bottom:1px solid var(--border);">' +
      '<div>供应商</div><div>应付</div><div>已付</div><div>欠款</div><div>单数</div></div>';
    summary.forEach(function(s) {
      html += '<div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr 60px;gap:8px;padding:10px 12px;font-size:13px;border-bottom:1px solid var(--border);">' +
        '<div>' + (s.supplierName || s.supplierId) + '</div>' +
        '<div style="color:var(--accent-red);">' + s.total.toFixed(0) + '</div>' +
        '<div style="color:var(--accent-green);">' + s.paid.toFixed(0) + '</div>' +
        '<div>' + s.payable.toFixed(0) + '</div>' +
        '<div>' + s.count + '</div></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  });
}

function renderSupplierPurchases() {
  var el = document.getElementById('supplier-purchases-list');
  if (!el) return;
  API.getSupplierPurchases().then(function(purchases) {
    if (!purchases || purchases.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-3);padding:12px;">暂无进货记录</div>';
      return;
    }
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    purchases.slice(0, 50).forEach(function(p) {
      var statusLabels = { pending: '待付款', partial: '部分付款', paid: '已结清' };
      var statusColors = { pending: '#f44336', partial: '#ff9800', paid: '#4caf50' };
      html += '<div style="background:var(--bg-card);border-radius:10px;padding:12px;border:1px solid var(--border);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<span style="font-weight:600;">' + (p.supplierName || '供应商') + '</span>' +
        '<span style="color:' + statusColors[p.status] + ';font-size:12px;">' + statusLabels[p.status] + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-3);">' +
        '<span>' + p.purchaseDate + '</span>' +
        '<span>应付: <strong style="color:var(--accent-red);">' + p.amount + '</strong> 已付: <strong style="color:var(--accent-green);">' + p.paid + '</strong></span></div></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  });
}

window.openAddPurchase = function() {
  var suppliers = state.suppliers || [];
  if (suppliers.length === 0) { toast('请先添加供应商', 'error'); return; }
  var supplierId = prompt('供应商ID：');
  var amount = prompt('进货金额：');
  if (!supplierId || !amount) return;
  var supplier = suppliers.find(function(s) { return s.id === supplierId; });
  API.createSupplierPurchase({
    supplierId: supplierId,
    supplierName: supplier ? supplier.name : supplierId,
    amount: Number(amount),
    paid: 0,
    status: 'pending',
    purchaseDate: fmtDate(new Date())
  }).then(function() { toast('进货单已添加', 'success'); renderSupplierSummary(); renderSupplierPurchases(); }).catch(function(err) { toast('添加失败', 'error'); });
};

// ============== 打印模板功能 ==============
window.openPrintTemplates = function() {
  openModal('modal-print-templates');
  renderPrintTemplates();
};

function renderPrintTemplates() {
  var el = document.getElementById('print-templates-list');
  if (!el) return;
  API.getPrintTemplates().then(function(templates) {
    if (!templates || templates.length === 0) {
      el.innerHTML = '<div style="text-align:center;color:var(--text-3);padding:20px;">暂无模板</div>';
      return;
    }
    var typeLabels = { receipt: '小票', label: '标签' };
    var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
    templates.forEach(function(t) {
      html += '<div style="background:var(--bg-card);border-radius:10px;padding:12px;border:1px solid var(--border);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">' +
        '<span style="font-weight:600;">' + t.name + '</span>' +
        '<span class="tag">' + typeLabels[t.type] + '</span></div>' +
        '<div style="font-size:12px;color:var(--text-3);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">' + (t.content || '').substring(0, 80) + '</div></div>';
    });
    html += '</div>';
    el.innerHTML = html;
  });
}

window.addPrintTemplate = function() {
  var name = document.getElementById('new-template-name').value.trim();
  var type = document.getElementById('new-template-type').value;
  if (!name) { toast('请输入模板名称', 'error'); return; }
  var content = prompt('模板内容（使用 ${字段名} 占位符）：', '<div class="print">${content}</div>');
  if (!content) return;
  API.createPrintTemplate({ name: name, type: type, content: content })
    .then(function() {
      document.getElementById('new-template-name').value = '';
      toast('模板已添加', 'success');
      renderPrintTemplates();
    }).catch(function(err) { toast('添加失败', 'error'); });
};

// ============== 首页日期范围切换 ==============
var homeDateRange = 'today'; // today | week | month
window.toggleHomeDateRange = function() {
  var ranges = ['today', 'week', 'month'];
  var labels = { today: '今日', week: '本周', month: '本月' };
  var idx = ranges.indexOf(homeDateRange);
  homeDateRange = ranges[(idx + 1) % ranges.length];
  var el = document.getElementById('home-date');
  if (el) {
    var now = new Date();
    var dateStr = (now.getMonth() + 1) + '-' + now.getDate() + ' ' + ['日','一','二','三','四','五','六'][now.getDay()];
    el.textContent = dateStr + ' · ' + labels[homeDateRange];
  }
  renderHome();
  toast('已切换到：' + labels[homeDateRange], 'info');
};

// ============== 启动 ==============
// 全栈架构：通过 API 认证和加载数据
initApp();
