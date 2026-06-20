// ============================================================
// 衫云智管 API 客户端
// 负责与后端通信，管理认证令牌和本地状态缓存
// ============================================================
var API = (function() {
  'use strict';

  var BASE = '/api';
  var token = null;

  // ============ 内部工具 ============
  function getToken() {
    if (token) return token;
    try { token = localStorage.getItem('shanyun_token'); } catch(e) {}
    return token;
  }

  function setToken(t) {
    token = t;
    try { localStorage.setItem('shanyun_token', t); } catch(e) {}
  }

  function clearToken() {
    token = null;
    try { localStorage.removeItem('shanyun_token'); } catch(e) {}
  }

  function authHeaders() {
    var t = getToken();
    return t ? { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  function request(method, path, body) {
    var opts = { method: method, headers: authHeaders() };
    if (body) opts.body = JSON.stringify(body);
    return fetch(BASE + path, opts).then(function(res) {
      return res.json().then(function(data) {
        if (!res.ok) throw new Error(data.error || '请求失败 (' + res.status + ')');
        return data;
      });
    });
  }

  function get(path) { return request('GET', path); }
  function post(path, body) { return request('POST', path, body); }
  function put(path, body) { return request('PUT', path, body); }
  function del(path) { return request('DELETE', path); }

  // ============ 公开 API ============

  // ---- 认证 ----
  function login(username, password) {
    return post('/auth/login', { username: username, password: password }).then(function(data) {
      setToken(data.token);
      return data;
    });
  }

  function register(username, password) {
    return post('/auth/register', { username: username, password: password }).then(function(data) {
      setToken(data.token);
      return data;
    });
  }

  function logout() {
    clearToken();
  }

  function isLoggedIn() {
    return !!getToken();
  }

  function getMe() {
    return get('/auth/me');
  }

  // ---- 门店 ----
  function getStores() {
    return get('/stores');
  }

  function createStore(data) {
    return post('/stores', data);
  }

  function updateStore(id, data) {
    return put('/stores/' + id, data);
  }

  function deleteStore(id) {
    return del('/stores/' + id);
  }

  // ---- 客户 ----
  function getCustomers(storeId) {
    var q = storeId ? '?store_id=' + encodeURIComponent(storeId) : '';
    return get('/customers' + q);
  }

  function createCustomer(data) {
    return post('/customers', data);
  }

  function updateCustomer(id, data) {
    return put('/customers/' + id, data);
  }

  function deleteCustomer(id) {
    return del('/customers/' + id);
  }

  // ---- 货品 ----
  function getProducts(storeId) {
    var q = storeId ? '?store_id=' + encodeURIComponent(storeId) : '';
    return get('/products' + q);
  }

  function createProduct(data) {
    return post('/products', data);
  }

  function updateProduct(id, data) {
    return put('/products/' + id, data);
  }

  function deleteProduct(id) {
    return del('/products/' + id);
  }

  // ---- 订单 ----
  function getOrders(storeId, status) {
    var params = [];
    if (storeId) params.push('store_id=' + encodeURIComponent(storeId));
    if (status) params.push('status=' + encodeURIComponent(status));
    var q = params.length ? '?' + params.join('&') : '';
    return get('/orders' + q);
  }

  function createOrder(data) {
    return post('/orders', data);
  }

  function updateOrder(id, data) {
    return put('/orders/' + id, data);
  }

  function cancelOrder(id) {
    return put('/orders/' + id + '/cancel');
  }

  function deleteOrder(id) {
    return del('/orders/' + id);
  }

  // ---- 供应商 ----
  function getSuppliers(storeId) {
    var q = storeId ? '?store_id=' + encodeURIComponent(storeId) : '';
    return get('/suppliers' + q);
  }

  function createSupplier(data) {
    return post('/suppliers', data);
  }

  function updateSupplier(id, data) {
    return put('/suppliers/' + id, data);
  }

  function deleteSupplier(id) {
    return del('/suppliers/' + id);
  }

  // ---- 优惠券 ----
  function getCoupons(storeId) {
    var q = storeId ? '?store_id=' + encodeURIComponent(storeId) : '';
    return get('/coupons' + q);
  }

  function createCoupon(data) {
    return post('/coupons', data);
  }

  function updateCoupon(id, data) {
    return put('/coupons/' + id, data);
  }

  function deleteCoupon(id) {
    return del('/coupons/' + id);
  }

  // ---- 报表 ----
  function getSalesSummary(storeId, dateFrom, dateTo) {
    var params = [];
    if (storeId) params.push('store_id=' + encodeURIComponent(storeId));
    if (dateFrom) params.push('date_from=' + encodeURIComponent(dateFrom));
    if (dateTo) params.push('date_to=' + encodeURIComponent(dateTo));
    var q = params.length ? '?' + params.join('&') : '';
    return get('/reports/sales-summary' + q);
  }

  function getStockAlerts(storeId) {
    var q = storeId ? '?store_id=' + encodeURIComponent(storeId) : '';
    return get('/reports/stock-alerts' + q);
  }

  // ---- Dashboard 仪表盘 ----
  function getDashboardOverview(storeId) {
    var q = storeId ? '?store_id=' + encodeURIComponent(storeId) : '';
    return get('/dashboard/overview' + q);
  }

  function getSalesTrend(storeId, days) {
    var params = [];
    if (storeId) params.push('store_id=' + encodeURIComponent(storeId));
    if (days) params.push('days=' + encodeURIComponent(days));
    var q = params.length ? '?' + params.join('&') : '';
    return get('/dashboard/sales-trend' + q);
  }

  function getTopProducts(storeId, limit) {
    var params = [];
    if (storeId) params.push('store_id=' + encodeURIComponent(storeId));
    if (limit) params.push('limit=' + encodeURIComponent(limit));
    var q = params.length ? '?' + params.join('&') : '';
    return get('/dashboard/top-products' + q);
  }

  function getTopCustomers(storeId, limit) {
    var params = [];
    if (storeId) params.push('store_id=' + encodeURIComponent(storeId));
    if (limit) params.push('limit=' + encodeURIComponent(limit));
    var q = params.length ? '?' + params.join('&') : '';
    return get('/dashboard/top-customers' + q);
  }

  function getSlowMoving(storeId, days) {
    var params = [];
    if (storeId) params.push('store_id=' + encodeURIComponent(storeId));
    if (days) params.push('days=' + encodeURIComponent(days));
    var q = params.length ? '?' + params.join('&') : '';
    return get('/dashboard/slow-moving' + q);
  }

  function getAuditLogs(limit, offset, action, entity) {
    var params = [];
    if (limit) params.push('limit=' + encodeURIComponent(limit));
    if (offset) params.push('offset=' + encodeURIComponent(offset));
    if (action) params.push('action=' + encodeURIComponent(action));
    if (entity) params.push('entity=' + encodeURIComponent(entity));
    var q = params.length ? '?' + params.join('&') : '';
    return get('/dashboard/audit-logs' + q);
  }

  // ---- 现金流 ----
  function getCashFlow(storeId) {
    var q = storeId ? '?store_id=' + encodeURIComponent(storeId) : '';
    return get('/dashboard/cash-flow' + q);
  }

  // ---- 员工/角色管理 ----
  function getStaff() { return get('/staff'); }
  function createStaff(data) { return post('/staff', data); }
  function updateStaff(id, data) { return put('/staff/' + id, data); }
  function deleteStaff(id) { return del('/staff/' + id); }

  // ---- 积分抵扣 ----
  function redeemPoints(customerId, points) {
    return post('/customers/' + customerId + '/redeem-points', { points: points });
  }

  // ---- 盘点 ----
  function getStocktakes(storeId) {
    var q = storeId ? '?store_id=' + encodeURIComponent(storeId) : '';
    return get('/stocktake' + q);
  }
  function createStocktake(data) { return post('/stocktake', data); }
  function getStocktake(id) { return get('/stocktake/' + id); }

  // ---- 自定义字段 ----
  function getCustomFields(entity, storeId) {
    var params = [];
    if (entity) params.push('entity=' + encodeURIComponent(entity));
    if (storeId) params.push('store_id=' + encodeURIComponent(storeId));
    var q = params.length ? '?' + params.join('&') : '';
    return get('/custom-fields' + q);
  }
  function createCustomField(data) { return post('/custom-fields', data); }
  function updateCustomField(id, data) { return put('/custom-fields/' + id, data); }
  function deleteCustomField(id) { return del('/custom-fields/' + id); }

  // ---- 操作日志 ----
  function getAuditLogsV2(filter) {
    var params = [];
    if (filter) {
      if (filter.action) params.push('action=' + encodeURIComponent(filter.action));
      if (filter.user) params.push('user=' + encodeURIComponent(filter.user));
      if (filter.limit) params.push('limit=' + encodeURIComponent(filter.limit));
    }
    var q = params.length ? '?' + params.join('&') : '';
    return get('/audit-logs' + q);
  }
  function logAction(action, target, detail) {
    return post('/audit-logs', { action: action, target: target, detail: detail });
  }

  // ---- 系统设置 ----
  function getSystemSettings() { return get('/system-settings'); }
  function updateSystemSettings(data) { return put('/system-settings', data); }

  // ---- 数据备份与恢复 ----
  function exportBackup() { return get('/backup'); }
  function restoreBackup(data) { return post('/backup/restore', { data: data }); }

  // ---- 导出（通过 fetch 下载，带 Authorization header） ----
  function exportCSV(type, storeId) {
    var params = [];
    if (storeId) params.push('store_id=' + encodeURIComponent(storeId));
    var q = params.length ? '?' + params.join('&') : '';
    var url = BASE + '/reports/export/' + type + q;
    return fetch(url, { headers: authHeaders() }).then(function(res) {
      if (!res.ok) throw new Error('导出失败');
      return res.blob();
    }).then(function(blob) {
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = type + '_' + new Date().toISOString().slice(0, 10) + '.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    });
  }

  // ---- 数据导入导出（Mock API） ----
  function exportData(type) { return get('/export?type=' + type); }
  function importData(type, data) { return post('/import', { type: type, data: data }); }

  // ---- 价格策略 ----
  function getPriceRules(params) {
    var q = [];
    if (params && params.entity) q.push('entity=' + params.entity);
    if (params && params.refId) q.push('ref_id=' + params.refId);
    return get('/price-rules' + (q.length ? '?' + q.join('&') : ''));
  }
  function createPriceRule(data) { return post('/price-rules', data); }
  function updatePriceRule(id, data) { return put('/price-rules/' + id, data); }
  function deletePriceRule(id) { return del('/price-rules/' + id); }

  // ---- 库存预警 ----
  function getStockAlerts() { return get('/stock-alerts'); }

  // ---- 客户标签与分组 ----
  function getCustomerTags() { return get('/customer-tags'); }
  function createCustomerTag(data) { return post('/customer-tags', data); }
  function deleteCustomerTag(id) { return del('/customer-tags/' + id); }
  function getCustomerGroups() { return get('/customer-groups'); }
  function createCustomerGroup(data) { return post('/customer-groups', data); }
  function deleteCustomerGroup(id) { return del('/customer-groups/' + id); }

  // ---- 供应商对账 ----
  function getSupplierPurchases(params) {
    var q = [];
    if (params && params.supplierId) q.push('supplier_id=' + params.supplierId);
    return get('/supplier-purchases' + (q.length ? '?' + q.join('&') : ''));
  }
  function createSupplierPurchase(data) { return post('/supplier-purchases', data); }
  function updateSupplierPurchase(id, data) { return put('/supplier-purchases/' + id, data); }
  function getSupplierSummary() { return get('/supplier-summary'); }

  // ---- 打印模板 ----
  function getPrintTemplates() { return get('/print-templates'); }
  function createPrintTemplate(data) { return post('/print-templates', data); }
  function deletePrintTemplate(id) { return del('/print-templates/' + id); }

  // ---- 批量加载（登录后初始化） ----
  function loadAll(storeId) {
    return Promise.all([
      getStores(),
      getCustomers(storeId),
      getProducts(storeId),
      getOrders(storeId),
      getSuppliers(storeId),
      getCoupons(storeId)
    ]).then(function(results) {
      return {
        stores: results[0],
        customers: results[1],
        products: results[2],
        orders: results[3],
        suppliers: results[4],
        coupons: results[5]
      };
    });
  }

  return {
    login: login,
    register: register,
    logout: logout,
    isLoggedIn: isLoggedIn,
    getMe: getMe,
    getStores: getStores,
    createStore: createStore,
    updateStore: updateStore,
    deleteStore: deleteStore,
    getCustomers: getCustomers,
    createCustomer: createCustomer,
    updateCustomer: updateCustomer,
    deleteCustomer: deleteCustomer,
    getProducts: getProducts,
    createProduct: createProduct,
    updateProduct: updateProduct,
    deleteProduct: deleteProduct,
    getOrders: getOrders,
    createOrder: createOrder,
    updateOrder: updateOrder,
    cancelOrder: cancelOrder,
    deleteOrder: deleteOrder,
    getSuppliers: getSuppliers,
    createSupplier: createSupplier,
    updateSupplier: updateSupplier,
    deleteSupplier: deleteSupplier,
    getCoupons: getCoupons,
    createCoupon: createCoupon,
    updateCoupon: updateCoupon,
    deleteCoupon: deleteCoupon,
    getSalesSummary: getSalesSummary,
    getStockAlerts: getStockAlerts,
    getDashboardOverview: getDashboardOverview,
    getSalesTrend: getSalesTrend,
    getTopProducts: getTopProducts,
    getTopCustomers: getTopCustomers,
    getSlowMoving: getSlowMoving,
    getAuditLogs: getAuditLogs,
    getCashFlow: getCashFlow,
    getStaff: getStaff,
    createStaff: createStaff,
    updateStaff: updateStaff,
    deleteStaff: deleteStaff,
    redeemPoints: redeemPoints,
    getStocktakes: getStocktakes,
    createStocktake: createStocktake,
    getStocktake: getStocktake,
    getCustomFields: getCustomFields,
    createCustomField: createCustomField,
    updateCustomField: updateCustomField,
    deleteCustomField: deleteCustomField,
    getAuditLogsV2: getAuditLogsV2,
    logAction: logAction,
    getSystemSettings: getSystemSettings,
    updateSystemSettings: updateSystemSettings,
    exportBackup: exportBackup,
    restoreBackup: restoreBackup,
    exportCSV: exportCSV,
    // 新增API
    exportData: exportData,
    importData: importData,
    getPriceRules: getPriceRules,
    createPriceRule: createPriceRule,
    updatePriceRule: updatePriceRule,
    deletePriceRule: deletePriceRule,
    getCustomerTags: getCustomerTags,
    createCustomerTag: createCustomerTag,
    deleteCustomerTag: deleteCustomerTag,
    getCustomerGroups: getCustomerGroups,
    createCustomerGroup: createCustomerGroup,
    deleteCustomerGroup: deleteCustomerGroup,
    getSupplierPurchases: getSupplierPurchases,
    createSupplierPurchase: createSupplierPurchase,
    updateSupplierPurchase: updateSupplierPurchase,
    getSupplierSummary: getSupplierSummary,
    getPrintTemplates: getPrintTemplates,
    createPrintTemplate: createPrintTemplate,
    deletePrintTemplate: deletePrintTemplate,
    loadAll: loadAll
  };
})();