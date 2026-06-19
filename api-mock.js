// ============================================================
// 衫云智管 - 静态版 Mock API
// 使用 localStorage 模拟后端，无需 Node 服务器
// 直接用浏览器打开 index.html 即可体验
// ============================================================
(function() {
  'use strict';

  var STORAGE_KEY = 'shanyun_demo_db';
  var SESSION_KEY = 'shanyun_demo_session';
  var TOKEN_KEY = 'shanyun_demo_token';

  // 简易密码哈希（mock 用，非生产级安全）
  function hashPassword(pwd) {
    var hash = 0, salt = 'shanyun_salt_v1';
    var s = salt + pwd;
    for (var i = 0; i < s.length; i++) {
      hash = ((hash << 5) - hash) + s.charCodeAt(i);
      hash = hash & hash;
    }
    return 'h_' + Math.abs(hash).toString(16);
  }

  // 默认演示账号
  var DEFAULT_ACCOUNT = { username: 'demo', password: 'demo123' };
  var DEFAULT_STORE = { id: 'store_main', name: '杭州四季青总店', address: '杭州市江干区', phone: '0571-88888888' };

  // ============ 演示数据生成 ============
  function genId(prefix) {
    return prefix + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function seedDemoData() {
    var now = new Date();
    var db = {
      users: [{
        id: 'user_demo',
        username: DEFAULT_ACCOUNT.username,
        password: hashPassword(DEFAULT_ACCOUNT.password),
        phone: '13800138000',
        role: 'boss',
        created_at: now.toISOString()
      }],
      stores: [
        { id: 'store_main', name: '杭州四季青总店', address: '杭州市江干区四季青服装市场 5 楼', phone: '0571-88888888', owner_id: 'user_demo', created_at: now.toISOString() },
        { id: 'store_xh', name: '上海徐汇分店', address: '上海市徐汇区肇嘉浜路 1029 号', phone: '021-66666666', owner_id: 'user_demo', created_at: now.toISOString() }
      ],
      products: [
        { id: 'p_dress', store_id: 'store_main', name: '法式真丝连衣裙', code: 'DR001', category: '连衣裙', price: 1280, purchase_price: 480, stock: 35, warning_stock: 5, hot: 1, supplier_id: '', created_at: now.toISOString() },
        { id: 'p_jeans', store_id: 'store_main', name: '高腰显瘦牛仔裤', code: 'PT001', category: '裤装', price: 480, purchase_price: 180, stock: 88, warning_stock: 10, hot: 1, supplier_id: '', created_at: now.toISOString() },
        { id: 'p_coat', store_id: 'store_main', name: '羊毛双面呢大衣', code: 'CT001', category: '外套', price: 2280, purchase_price: 850, stock: 18, warning_stock: 3, hot: 0, supplier_id: '', created_at: now.toISOString() },
        { id: 'p_blouse', store_id: 'store_main', name: '蕾丝拼接雪纺衫', code: 'TP001', category: '上衣', price: 380, purchase_price: 120, stock: 120, warning_stock: 15, hot: 1, supplier_id: '', created_at: now.toISOString() },
        { id: 'p_bag', store_id: 'store_main', name: '真皮小香风单肩包', code: 'AC001', category: '配饰', price: 880, purchase_price: 320, stock: 42, warning_stock: 5, hot: 0, supplier_id: '', created_at: now.toISOString() },
        { id: 'p_skirt', store_id: 'store_main', name: '复古印花半身裙', code: 'SK001', category: '裙装', price: 420, purchase_price: 150, stock: 67, warning_stock: 8, hot: 1, supplier_id: '', created_at: now.toISOString() },
        { id: 'p_boots', store_id: 'store_main', name: '高跟尖头短靴', code: 'SH001', category: '鞋履', price: 680, purchase_price: 260, stock: 4, warning_stock: 5, hot: 0, supplier_id: '', created_at: now.toISOString() },
        { id: 'p_sweater', store_id: 'store_main', name: '羊绒V领针织衫', code: 'TP002', category: '上衣', price: 580, purchase_price: 220, stock: 55, warning_stock: 6, hot: 1, supplier_id: '', created_at: now.toISOString() }
      ],
      customers: [
        { id: 'c_xx', store_id: 'store_main', name: '林晓晓', phone: '13800138001', level: 'platinum', points: 2580, total_spent: 12580, created_at: now.toISOString() },
        { id: 'c_yq', store_id: 'store_main', name: '王雅琪', phone: '13800138002', level: 'gold', points: 1820, total_spent: 8920, created_at: now.toISOString() },
        { id: 'c_sy', store_id: 'store_main', name: '陈思颖', phone: '13800138003', level: 'vip', points: 950, total_spent: 3680, created_at: now.toISOString() },
        { id: 'c_xw', store_id: 'store_main', name: '赵小婉', phone: '13800138004', level: 'platinum', points: 3120, total_spent: 15820, created_at: now.toISOString() },
        { id: 'c_ml', store_id: 'store_main', name: '刘美琳', phone: '13800138005', level: 'normal', points: 320, total_spent: 1280, created_at: now.toISOString() },
        { id: 'c_xt', store_id: 'store_main', name: '周雪婷', phone: '13800138006', level: 'gold', points: 1580, total_spent: 7580, created_at: now.toISOString() }
      ],
      orders: [],
      suppliers: [
        { id: 's_zj', store_id: 'store_main', name: '广州十三行服饰', contact: '陈总', phone: '020-33333333', address: '广州市越秀区', created_at: now.toISOString() },
        { id: 's_hz', store_id: 'store_main', name: '杭州意法服饰', contact: '李总', phone: '0571-22222222', address: '杭州市江干区', created_at: now.toISOString() }
      ],
      coupons: [
        { id: 'cp_001', store_id: 'store_main', code: 'WELCOME100', name: '新客立减 100', type: 'fixed', value: 100, min_spend: 500, status: 'active', created_at: now.toISOString() },
        { id: 'cp_002', store_id: 'store_main', code: 'VIP20', name: 'VIP 8 折', type: 'percent', value: 20, min_spend: 1000, status: 'active', created_at: now.toISOString() }
      ],
      stocktakes: [],
      audit_logs: []
    };

    // 生成 30 天的演示订单
    var orderStatuses = ['已完成', '已完成', '已完成', '已完成', '已发货', '已送达', '已取消'];
    var payMethods = ['微信支付', '支付宝', '现金', '银行卡'];
    var customerIds = db.customers.map(function(c) { return c.id; });
    var productIds = db.products.map(function(p) { return p.id; });

    for (var i = 30; i >= 0; i--) {
      var date = new Date(now);
      date.setDate(date.getDate() - i);
      var dateStr = date.toISOString().slice(0, 10);
      var ordersThatDay = 1 + Math.floor(Math.random() * 4);
      for (var j = 0; j < ordersThatDay; j++) {
        var numItems = 1 + Math.floor(Math.random() * 3);
        var items = [];
        var total = 0;
        var cost = 0;
        var used = {};
        for (var k = 0; k < numItems; k++) {
          var pid = productIds[Math.floor(Math.random() * productIds.length)];
          if (used[pid]) continue;
          used[pid] = true;
          var p = db.products.find(function(x) { return x.id === pid; });
          var qty = 1 + Math.floor(Math.random() * 2);
          items.push({ product_id: pid, product_name: p.name, price: p.price, purchase_price: p.purchase_price, qty: qty });
          total += p.price * qty;
          cost += p.purchase_price * qty;
        }
        if (items.length === 0) continue;
        var custId = customerIds[Math.floor(Math.random() * customerIds.length)];
        var cust = db.customers.find(function(c) { return c.id === custId; });
        var order = {
          id: 'o_' + date.getTime() + '_' + j,
          store_id: 'store_main',
          customer_id: custId,
          customer_name: cust.name,
          items: items,
          total: total,
          cost: cost,
          profit: total - cost,
          status: orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
          pay_method: payMethods[Math.floor(Math.random() * payMethods.length)],
          date: dateStr,
          created_at: date.toISOString()
        };
        db.orders.push(order);
      }
    }

    return db;
  }

  // ============ 数据库存取 ============
  function loadDB() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        var fresh = seedDemoData();
        saveDB(fresh);
        return fresh;
      }
      return JSON.parse(raw);
    } catch(e) {
      return seedDemoData();
    }
  }

  function saveDB(db) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(db)); } catch(e) {}
  }

  function getDB() { return loadDB(); }

  function persist() { saveDB(getDB()); }

  // ============ 简易 Token ============
  function makeToken(user) {
    return 'demo_token_' + user.id + '_' + Date.now();
  }

  function currentUser() {
    try {
      var raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch(e) { return null; }
  }

  function setSession(user) {
    try {
      var token = makeToken(user);
      // 仅存储必要的非敏感字段，剥离密码哈希
      var safeUser = { id: user.id, username: user.username, role: user.role };
      if (user.phone) safeUser.phone = user.phone;
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
      return token;
    } catch(e) { return null; }
  }

  function clearSession() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(SESSION_KEY);
    } catch(e) {}
  }

  function requireAuth() {
    var u = currentUser();
    if (!u) throw new Error('未登录，请先登录');
    return u;
  }

  function findStore(storeId) {
    var db = getDB();
    return db.stores.find(function(s) { return s.id === storeId; });
  }

  // ============ 路由分发 ============
  // 字段别名：补齐前端常用别名（retailPrice = price, isHot = hot, lowStock = warning_stock, unit = '件'）
  function aliasFields(obj, kind) {
    if (Array.isArray(obj)) { obj.forEach(function(o) { aliasFields(o, kind); }); return; }
    if (!obj || typeof obj !== 'object') return;
    if (kind === 'product') {
      if (obj.price !== undefined && obj.retailPrice === undefined) obj.retailPrice = obj.price;
      if (obj.hot !== undefined && obj.isHot === undefined) obj.isHot = !!obj.hot;
      if (obj.warning_stock !== undefined && obj.lowStock === undefined) obj.lowStock = obj.warning_stock;
      if (obj.purchase_price !== undefined && obj.purchasePrice === undefined) obj.purchasePrice = obj.purchase_price;
      if (!obj.unit) obj.unit = '件';
    } else if (kind === 'order') {
      if (obj.created_at && !obj.createdAt) obj.createdAt = obj.created_at;
      if (obj.customer_id && !obj.customerId) obj.customerId = obj.customer_id;
      if (obj.customer_name && !obj.customerName) obj.customerName = obj.customer_name;
      if (obj.store_id && !obj.storeId) obj.storeId = obj.store_id;
      if (Array.isArray(obj.items)) {
        obj.items.forEach(function(it) {
          if (it.product_id && !it.productId) it.productId = it.product_id;
          if (it.product_name && !it.productName) it.productName = it.product_name;
          if (it.purchase_price && !it.purchasePrice) it.purchasePrice = it.purchase_price;
        });
      }
    } else if (kind === 'customer') {
      if (obj.total_spent !== undefined && obj.totalSpent === undefined) obj.totalSpent = obj.total_spent;
      // 中文等级 -> 前端枚举
      var levelMap = { '普通': 'normal', '银卡': 'silver', '金卡': 'gold', '钻石': 'platinum' };
      if (obj.level && levelMap[obj.level]) obj.level = levelMap[obj.level];
    } else if (kind === 'store') {
      if (obj.owner_id && !obj.ownerId) obj.ownerId = obj.owner_id;
    }
  }

  // 字段名转换：snake_case -> camelCase
  function snakeToCamel(s) { return s.replace(/_([a-z])/g, function(m, c) { return c.toUpperCase(); }); }
  function transform(obj) {
    if (Array.isArray(obj)) return obj.map(transform);
    if (obj && typeof obj === 'object' && obj.constructor === Object) {
      var out = {};
      for (var k in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, k)) {
          out[snakeToCamel(k)] = transform(obj[k]);
        }
      }
      return out;
    }
    return obj;
  }
  function handle(method, path, body) {
    body = body || {};
    var p = path.split('?')[0];
    var qIdx = path.indexOf('?');
    var query = {};
    if (qIdx >= 0) {
      path.slice(qIdx + 1).split('&').forEach(function(kv) {
        var parts = kv.split('=');
        if (parts[0]) query[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1] || '');
      });
    }
    var storeId = query.store_id;
    var user = currentUser();

    // ---- 认证 ----
    if (p === '/auth/login' && method === 'POST') {
      var db = getDB();
      var u = db.users.find(function(x) { return x.username === body.username; });
      if (!u) throw new Error('账号不存在');
      if (u.password !== hashPassword(body.password)) throw new Error('密码错误');
      var token = setSession(u);
      var store = db.stores.find(function(s) { return s.owner_id === u.id; });
      return { token: token, user: { id: u.id, username: u.username, role: u.role }, store: store || db.stores[0] };
    }
    if (p === '/auth/register' && method === 'POST') {
      var db2 = getDB();
      if (db2.users.find(function(x) { return x.username === body.username; })) {
        throw new Error('账号已存在');
      }
      var newUser = { id: genId('user'), username: body.username, password: hashPassword(body.password), phone: body.phone || '', role: 'user', created_at: new Date().toISOString() };
      db2.users.push(newUser);
      var newStore = { id: genId('store'), name: '默认门店', address: '', phone: '', owner_id: newUser.id, created_at: new Date().toISOString() };
      db2.stores.push(newStore);
      saveDB(db2);
      var t2 = setSession(newUser);
      return { token: t2, user: { id: newUser.id, username: newUser.username, role: newUser.role }, store: newStore };
    }
    if (p === '/auth/me' && method === 'GET') {
      var u2 = requireAuth();
      return u2;
    }

    // ---- 门店 ----
    if (p === '/stores' && method === 'GET') {
      var u3 = requireAuth();
      return getDB().stores.filter(function(s) { return s.owner_id === u3.id; });
    }
    if (p === '/stores' && method === 'POST') {
      var u4 = requireAuth();
      var db3 = getDB();
      var ns = { id: genId('store'), name: body.name, address: body.address || '', phone: body.phone || '', owner_id: u4.id, created_at: new Date().toISOString() };
      db3.stores.push(ns);
      saveDB(db3);
      return ns;
    }
    if (p.indexOf('/stores/') === 0 && method === 'PUT') {
      var sid = p.split('/')[2];
      var db4 = getDB();
      var st = db4.stores.find(function(s) { return s.id === sid; });
      if (st) { st.name = body.name || st.name; st.address = body.address || ''; st.phone = body.phone || ''; saveDB(db4); }
      return st || {};
    }
    if (p.indexOf('/stores/') === 0 && method === 'DELETE') {
      var sid2 = p.split('/')[2];
      var db5 = getDB();
      db5.stores = db5.stores.filter(function(s) { return s.id !== sid2; });
      ['products', 'customers', 'suppliers', 'coupons', 'orders'].forEach(function(t) {
        db5[t] = db5[t].filter(function(x) { return x.store_id !== sid2; });
      });
      saveDB(db5);
      return { ok: true };
    }

    // ---- 客户 ----
    if (p === '/customers' && method === 'GET') {
      requireAuth();
      var custs = getDB().customers.filter(function(c) { return !storeId || c.store_id === storeId; });
      aliasFields(custs, 'customer');
      return custs;
    }
    if (p === '/customers' && method === 'POST') {
      requireAuth();
      var db6 = getDB();
      var nc = { id: genId('c'), store_id: body.store_id, name: body.name, phone: body.phone || '', level: body.level || '普通', points: 0, total_spent: 0, created_at: new Date().toISOString() };
      db6.customers.push(nc);
      saveDB(db6);
      return nc;
    }
    if (p.indexOf('/customers/') === 0 && method === 'PUT') {
      requireAuth();
      var cid = p.split('/')[2];
      var db7 = getDB();
      var cust = db7.customers.find(function(x) { return x.id === cid; });
      if (cust) Object.assign(cust, body);
      saveDB(db7);
      return cust;
    }
    if (p.indexOf('/customers/') === 0 && method === 'DELETE') {
      requireAuth();
      var cid2 = p.split('/')[2];
      var db8 = getDB();
      db8.customers = db8.customers.filter(function(x) { return x.id !== cid2; });
      saveDB(db8);
      return { ok: true };
    }

    // ---- 货品 ----
    if (p === '/products' && method === 'GET') {
      requireAuth();
      var prods = getDB().products.filter(function(x) { return !storeId || x.store_id === storeId; });
      aliasFields(prods, 'product');
      return prods;
    }
    if (p === '/products' && method === 'POST') {
      requireAuth();
      var db9 = getDB();
      var np = { id: genId('p'), store_id: body.store_id, name: body.name, code: body.code || '', category: body.category || '', price: Number(body.price) || 0, purchase_price: Number(body.purchase_price) || 0, stock: Number(body.stock) || 0, warning_stock: Number(body.warning_stock) || 10, hot: body.hot ? 1 : 0, supplier_id: body.supplier_id || '', created_at: new Date().toISOString() };
      db9.products.push(np);
      saveDB(db9);
      return np;
    }
    if (p.indexOf('/products/') === 0 && method === 'PUT') {
      requireAuth();
      var pid = p.split('/')[2];
      var db10 = getDB();
      var prod = db10.products.find(function(x) { return x.id === pid; });
      if (prod) {
        if (body.name !== undefined) prod.name = body.name;
        if (body.code !== undefined) prod.code = body.code;
        if (body.category !== undefined) prod.category = body.category;
        if (body.price !== undefined) prod.price = Number(body.price);
        if (body.purchase_price !== undefined) prod.purchase_price = Number(body.purchase_price);
        if (body.stock !== undefined) prod.stock = Number(body.stock);
        if (body.warning_stock !== undefined) prod.warning_stock = Number(body.warning_stock);
        if (body.hot !== undefined) prod.hot = body.hot ? 1 : 0;
      }
      saveDB(db10);
      return prod;
    }
    if (p.indexOf('/products/') === 0 && method === 'DELETE') {
      requireAuth();
      var pid2 = p.split('/')[2];
      var db11 = getDB();
      db11.products = db11.products.filter(function(x) { return x.id !== pid2; });
      saveDB(db11);
      return { ok: true };
    }

    // ---- 订单 ----
    if (p === '/orders' && method === 'GET') {
      requireAuth();
      var ords = getDB().orders.filter(function(o) { return !storeId || o.store_id === storeId; }).sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
      aliasFields(ords, 'order');
      return ords;
    }
    if (p === '/orders' && method === 'POST') {
      requireAuth();
      var db12 = getDB();
      var isReturn = body.type === 'return' || body.status === '已退货';
      var items = (body.items || []).map(function(it) {
        return {
          product_id: it.product_id || it.productId,
          product_name: it.product_name || it.productName || '',
          price: Number(it.price) || 0,
          purchase_price: Number(it.purchase_price || it.purchasePrice) || 0,
          qty: Number(it.qty) || 1
        };
      });
      var total = 0, cost = 0;
      items.forEach(function(it) {
        total += it.price * it.qty;
        cost += it.purchase_price * it.qty;
      });
      var nowDate = new Date();
      var no = {
        id: genId(isReturn ? 'r' : 'o'),
        store_id: body.store_id || body.storeId || '',
        customer_id: body.customer_id || body.customerId || '',
        customer_name: body.customer_name || body.customerName || '散客',
        items: items,
        total: isReturn ? -Math.abs(total) : total,
        cost: cost,
        profit: isReturn ? -Math.abs(total - cost) : (total - cost),
        status: isReturn ? '已退货' : (body.status || '已完成'),
        pay_method: body.payMethod || body.pay_method || '微信支付',
        type: isReturn ? 'return' : 'sale',
        original_order_id: body.original_order_id || body.originalOrderId || '',
        date: body.date || nowDate.toISOString().slice(0, 10),
        created_at: nowDate.toISOString()
      };
      db12.orders.push(no);
      // 退货：回补库存、扣减客户积分；正常销售：扣库存、累加积分
      items.forEach(function(it) {
        var prod = db12.products.find(function(x) { return x.id === it.product_id; });
        if (prod) {
          if (isReturn) {
            prod.stock = (prod.stock || 0) + it.qty;
          } else {
            prod.stock = Math.max(0, (prod.stock || 0) - it.qty);
          }
        }
      });
      var cust = db12.customers.find(function(c) { return c.id === no.customer_id; });
      if (cust) {
        var pts = Math.floor(Math.abs(total));
        if (isReturn) {
          cust.points = Math.max(0, (cust.points || 0) - pts);
          cust.total_spent = Math.max(0, (cust.total_spent || 0) - Math.abs(total));
        } else {
          cust.points = (cust.points || 0) + pts;
          cust.total_spent = (cust.total_spent || 0) + total;
        }
      }
      saveDB(db12);
      return no;
    }
    if (p.indexOf('/orders/') === 0 && method === 'PUT') {
      requireAuth();
      var oid = p.split('/')[2];
      if (p.indexOf('/cancel') >= 0) {
        var db13 = getDB();
        var ord = db13.orders.find(function(x) { return x.id === oid; });
        if (ord) ord.status = '已取消';
        saveDB(db13);
        return ord;
      }
      var db14 = getDB();
      var ord2 = db14.orders.find(function(x) { return x.id === oid; });
      if (ord2) Object.assign(ord2, body);
      saveDB(db14);
      return ord2;
    }
    if (p.indexOf('/orders/') === 0 && method === 'DELETE') {
      requireAuth();
      var oid2 = p.split('/')[2];
      var db15 = getDB();
      db15.orders = db15.orders.filter(function(x) { return x.id !== oid2; });
      saveDB(db15);
      return { ok: true };
    }

    // ---- 供应商 ----
    if (p === '/suppliers' && method === 'GET') {
      requireAuth();
      return getDB().suppliers.filter(function(x) { return !storeId || x.store_id === storeId; });
    }
    if (p === '/suppliers' && method === 'POST') {
      requireAuth();
      var db16 = getDB();
      var ns2 = { id: genId('s'), store_id: body.store_id, name: body.name, contact: body.contact || '', phone: body.phone || '', address: body.address || '', created_at: new Date().toISOString() };
      db16.suppliers.push(ns2);
      saveDB(db16);
      return ns2;
    }
    if (p.indexOf('/suppliers/') === 0 && (method === 'PUT' || method === 'DELETE')) {
      requireAuth();
      var sid3 = p.split('/')[2];
      var db17 = getDB();
      if (method === 'DELETE') {
        db17.suppliers = db17.suppliers.filter(function(x) { return x.id !== sid3; });
      } else {
        var sup = db17.suppliers.find(function(x) { return x.id === sid3; });
        if (sup) Object.assign(sup, body);
      }
      saveDB(db17);
      return method === 'DELETE' ? { ok: true } : (db17.suppliers.find(function(x) { return x.id === sid3; }) || {});
    }

    // ---- 优惠券 ----
    if (p === '/coupons' && method === 'GET') {
      requireAuth();
      return getDB().coupons.filter(function(x) { return !storeId || x.store_id === storeId; });
    }
    if (p === '/coupons' && method === 'POST') {
      requireAuth();
      var db18 = getDB();
      var nc2 = { id: genId('cp'), store_id: body.store_id, code: body.code, name: body.name, type: body.type, value: Number(body.value) || 0, min_spend: Number(body.min_spend) || 0, status: 'active', created_at: new Date().toISOString() };
      db18.coupons.push(nc2);
      saveDB(db18);
      return nc2;
    }
    if (p.indexOf('/coupons/') === 0 && (method === 'PUT' || method === 'DELETE')) {
      requireAuth();
      var cpid = p.split('/')[2];
      var db19 = getDB();
      if (method === 'DELETE') {
        db19.coupons = db19.coupons.filter(function(x) { return x.id !== cpid; });
        saveDB(db19);
        return { ok: true };
      }
      var cp = db19.coupons.find(function(x) { return x.id === cpid; });
      if (cp) Object.assign(cp, body);
      saveDB(db19);
      return cp;
    }

    // ---- Dashboard 仪表盘 ----
    if (p === '/dashboard/overview' && method === 'GET') {
      requireAuth();
      var orders = getDB().orders.filter(function(o) { return !storeId || o.store_id === storeId; });
      var today = new Date().toISOString().slice(0, 10);
      var todayOrders = orders.filter(function(o) { return (o.date || (o.created_at || '').slice(0, 10)) === today && o.status !== '已取消'; });
      var todaySales = todayOrders.reduce(function(s, o) { return s + o.total; }, 0);
      var todayProfit = todayOrders.reduce(function(s, o) { return s + (o.profit || 0); }, 0);
      var todayCount = todayOrders.length;
      var allProducts = getDB().products.filter(function(x) { return !storeId || x.store_id === storeId; });
      var lowStock = allProducts.filter(function(x) { return x.stock <= x.warning_stock; }).length;
      var totalStockValue = allProducts.reduce(function(s, p) { return s + (p.price || 0) * (p.stock || 0); }, 0);
      var allCustomers = getDB().customers.filter(function(c) { return !storeId || c.store_id === storeId; });
      var todayNewCustomers = allCustomers.filter(function(c) { return (c.created_at || '').slice(0, 10) === today; }).length;
      return {
        todaySales: todaySales,
        todayOrders: todayCount,
        todayProfit: todayProfit,
        todayMargin: todaySales > 0 ? (todayProfit / todaySales * 100) : 0,
        monthSales: orders.filter(function(o) { return o.status !== '已取消'; }).reduce(function(s, o) { return s + o.total; }, 0),
        totalCustomers: allCustomers.length,
        totalProducts: allProducts.length,
        lowStockCount: lowStock,
        totalStockValue: totalStockValue,
        todayNewCustomers: todayNewCustomers
      };
    }
    if (p === '/dashboard/sales-trend' && method === 'GET') {
      requireAuth();
      var days = Number(query.days) || 7;
      var orders2 = getDB().orders.filter(function(o) { return (!storeId || o.store_id === storeId) && o.status !== '已取消'; });
      var trend = [];
      for (var d = days - 1; d >= 0; d--) {
        var dt = new Date(); dt.setDate(dt.getDate() - d);
        var ds = dt.toISOString().slice(0, 10);
        var dsOrders = orders2.filter(function(o) { return (o.date || (o.created_at || '').slice(0, 10)) === ds; });
        trend.push({
          date: ds,
          sales: dsOrders.reduce(function(s, o) { return s + o.total; }, 0),
          profit: dsOrders.reduce(function(s, o) { return s + (o.profit || 0); }, 0),
          count: dsOrders.length
        });
      }
      return trend;
    }
    if (p === '/dashboard/top-products' && method === 'GET') {
      requireAuth();
      var lim = Number(query.limit) || 5;
      var orders3 = getDB().orders.filter(function(o) { return (!storeId || o.store_id === storeId) && o.status !== '已取消'; });
      var productMap = {};
      orders3.forEach(function(o) {
        (o.items || []).forEach(function(it) {
          if (!productMap[it.product_id]) productMap[it.product_id] = { product_id: it.product_id, product_name: it.product_name, sales: 0, qty: 0, revenue: 0, profit: 0 };
          productMap[it.product_id].qty += it.qty;
          productMap[it.product_id].revenue += it.price * it.qty;
          productMap[it.product_id].profit += (it.price - (it.purchase_price || 0)) * it.qty;
        });
      });
      return Object.values(productMap).sort(function(a, b) { return b.revenue - a.revenue; }).slice(0, lim);
    }
    if (p === '/dashboard/top-customers' && method === 'GET') {
      requireAuth();
      var lim2 = Number(query.limit) || 5;
      var orders4 = getDB().orders.filter(function(o) { return (!storeId || o.store_id === storeId) && o.status !== 'cancelled'; });
      var custMap = {};
      orders4.forEach(function(o) {
        var key = o.customer_id || 'walkin';
        if (!custMap[key]) custMap[key] = { customer_id: key, customer_name: o.customer_name, orders: 0, spent: 0 };
        custMap[key].orders += 1;
        custMap[key].spent += o.total;
      });
      return Object.values(custMap).sort(function(a, b) { return b.spent - a.spent; }).slice(0, lim2);
    }
    if (p === '/dashboard/slow-moving' && method === 'GET') {
      requireAuth();
      var ddays = Number(query.days) || 30;
      var cutoff = new Date(); cutoff.setDate(cutoff.getDate() - ddays);
      var orders5 = getDB().orders.filter(function(o) { return new Date(o.created_at) >= cutoff; });
      var sold = {};
      orders5.forEach(function(o) {
        (o.items || []).forEach(function(it) { sold[it.product_id] = (sold[it.product_id] || 0) + it.qty; });
      });
      return getDB().products
        .filter(function(x) { return !storeId || x.store_id === storeId; })
        .map(function(p) { return { id: p.id, name: p.name, stock: p.stock, sold_qty: sold[p.id] || 0 }; })
        .filter(function(p) { return p.sold_qty === 0; })
        .sort(function(a, b) { return b.stock - a.stock; })
        .slice(0, 20);
    }
    if (p === '/dashboard/audit-logs' && method === 'GET') {
      requireAuth();
      return (getDB().audit_logs || []).slice(-50).reverse();
    }
    if (p === '/reports/sales-summary' && method === 'GET') {
      requireAuth();
      var orders6 = getDB().orders.filter(function(o) { return (!storeId || o.store_id === storeId) && o.status !== 'cancelled'; });
      return {
        totalSales: orders6.reduce(function(s, o) { return s + o.total; }, 0),
        totalProfit: orders6.reduce(function(s, o) { return s + (o.profit || 0); }, 0),
        orderCount: orders6.length,
        avgOrder: orders6.length > 0 ? orders6.reduce(function(s, o) { return s + o.total; }, 0) / orders6.length : 0
      };
    }
    if (p === '/reports/stock-alerts' && method === 'GET') {
      requireAuth();
      return getDB().products
        .filter(function(x) { return (!storeId || x.store_id === storeId) && x.stock <= x.warning_stock; })
        .map(function(p) { return { id: p.id, name: p.name, stock: p.stock, warning_stock: p.warning_stock }; });
    }
    if (p === '/search' && method === 'GET') {
      requireAuth();
      var q = (query.q || '').toLowerCase();
      var db20 = getDB();
      if (!q) return { products: [], customers: [], orders: [] };
      return {
        products: db20.products.filter(function(x) { return (!storeId || x.store_id === storeId) && (x.name.toLowerCase().indexOf(q) >= 0 || (x.code || '').toLowerCase().indexOf(q) >= 0); }).slice(0, 20),
        customers: db20.customers.filter(function(x) { return (!storeId || x.store_id === storeId) && (x.name.toLowerCase().indexOf(q) >= 0 || (x.phone || '').indexOf(q) >= 0); }).slice(0, 20),
        orders: db20.orders.filter(function(x) { return (!storeId || x.store_id === storeId) && ((x.id || '').toLowerCase().indexOf(q) >= 0 || (x.customer_name || '').toLowerCase().indexOf(q) >= 0); }).slice(0, 20)
      };
    }
    if (p === '/backup' && method === 'GET') {
      requireAuth();
      var data = JSON.stringify(getDB(), null, 2);
      var blob = new Blob([data], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'shanyun_backup_' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { ok: true };
    }

    // ---- 现金流（老板视角：实收/退款/应收/应付） ----
    if (p === '/dashboard/cash-flow' && method === 'GET') {
      requireAuth();
      var dbcf = getDB();
      var cfOrders = dbcf.orders.filter(function(o) { return !storeId || o.store_id === storeId; });
      var today = new Date().toISOString().slice(0, 10);
      var ym = today.slice(0, 7); // YYYY-MM
      function isReceived(o) { return o.status !== '已取消' && o.pay_method !== '欠款'; }
      function isRefund(o) { return o.type === 'return' || o.status === '已退货'; }
      function isCredit(o) { return o.pay_method === '欠款' && o.status !== '已取消' && !isRefund(o); }
      var todayReceived = cfOrders.filter(function(o) { return (o.date || '').slice(0, 10) === today && isReceived(o) && !isRefund(o); }).reduce(function(s, o) { return s + Math.abs(o.total || 0); }, 0);
      var todayRefunded = cfOrders.filter(function(o) { return (o.date || '').slice(0, 10) === today && isRefund(o); }).reduce(function(s, o) { return s + Math.abs(o.total || 0); }, 0);
      var monthReceived = cfOrders.filter(function(o) { return (o.date || '').slice(0, 7) === ym && isReceived(o) && !isRefund(o); }).reduce(function(s, o) { return s + Math.abs(o.total || 0); }, 0);
      var monthRefunded = cfOrders.filter(function(o) { return (o.date || '').slice(0, 7) === ym && isRefund(o); }).reduce(function(s, o) { return s + Math.abs(o.total || 0); }, 0);
      var receivable = cfOrders.filter(function(o) { return isCredit(o); }).reduce(function(s, o) { return s + Math.abs(o.total || 0); }, 0);
      // 应付：供应商进货款（用 suppliers 的 purchaseAmount 近似，演示用）
      var payable = (dbcf.suppliers || []).filter(function(s) { return !storeId || s.store_id === storeId; }).reduce(function(s, x) { return s + (x.purchaseAmount || 0); }, 0);
      return {
        todayReceived: todayReceived,
        todayRefunded: todayRefunded,
        netToday: todayReceived - todayRefunded,
        monthReceived: monthReceived,
        monthRefunded: monthRefunded,
        netMonth: monthReceived - monthRefunded,
        receivable: receivable,
        payable: payable
      };
    }

    // ---- 员工/角色管理（老板/店长/店员） ----
    if (p === '/staff' && method === 'GET') {
      var uStaff = requireAuth();
      if (uStaff.role !== 'boss') throw new Error('仅老板可管理员工');
      var dbStaff = getDB();
      return dbStaff.users.map(function(u) {
        return { id: u.id, username: u.username, phone: u.phone || '', role: u.role || 'clerk', created_at: u.created_at };
      });
    }
    if (p === '/staff' && method === 'POST') {
      var uBoss = requireAuth();
      if (uBoss.role !== 'boss') throw new Error('仅老板可添加员工');
      var dbStaff2 = getDB();
      if (!body.username || !body.password) throw new Error('用户名和密码必填');
      if (dbStaff2.users.find(function(x) { return x.username === body.username; })) throw new Error('账号已存在');
      var validRoles = ['boss', 'manager', 'clerk'];
      var role = validRoles.indexOf(body.role) >= 0 ? body.role : 'clerk';
      var newStaff = { id: genId('user'), username: body.username, password: hashPassword(body.password), phone: body.phone || '', role: role, created_at: new Date().toISOString() };
      dbStaff2.users.push(newStaff);
      saveDB(dbStaff2);
      return { id: newStaff.id, username: newStaff.username, phone: newStaff.phone, role: newStaff.role, created_at: newStaff.created_at };
    }
    if (p.indexOf('/staff/') === 0 && method === 'PUT') {
      var uBoss2 = requireAuth();
      if (uBoss2.role !== 'boss') throw new Error('仅老板可编辑员工');
      var staffId = p.split('/')[2];
      var dbStaff3 = getDB();
      var stf = dbStaff3.users.find(function(x) { return x.id === staffId; });
      if (!stf) throw new Error('员工不存在');
      if (body.role) {
        var validRoles2 = ['boss', 'manager', 'clerk'];
        if (validRoles2.indexOf(body.role) < 0) throw new Error('角色无效');
        stf.role = body.role;
      }
      if (body.phone) stf.phone = body.phone;
      if (body.password) stf.password = hashPassword(body.password);
      saveDB(dbStaff3);
      return { id: stf.id, username: stf.username, phone: stf.phone, role: stf.role };
    }
    if (p.indexOf('/staff/') === 0 && method === 'DELETE') {
      var uBoss3 = requireAuth();
      if (uBoss3.role !== 'boss') throw new Error('仅老板可删除员工');
      var staffId2 = p.split('/')[2];
      if (staffId2 === uBoss3.id) throw new Error('不能删除自己');
      var dbStaff4 = getDB();
      dbStaff4.users = dbStaff4.users.filter(function(x) { return x.id !== staffId2; });
      saveDB(dbStaff4);
      return { ok: true };
    }

    // ---- 积分抵扣（结账时用积分抵现，100 积分=1 元） ----
    if (p.indexOf('/customers/') === 0 && p.indexOf('/redeem-points') >= 0 && method === 'POST') {
      requireAuth();
      var cidRp = p.split('/')[2];
      var dbRp = getDB();
      var custRp = dbRp.customers.find(function(c) { return c.id === cidRp; });
      if (!custRp) throw new Error('客户不存在');
      var usePts = Math.max(0, Math.floor(Number(body.points) || 0));
      if (usePts <= 0) throw new Error('抵扣积分必须大于 0');
      if ((custRp.points || 0) < usePts) throw new Error('积分不足');
      var deduct = Math.floor(usePts / 100); // 100 积分 = 1 元
      if (deduct <= 0) throw new Error('积分不足 100，无法抵扣');
      var actualUse = deduct * 100;
      custRp.points = (custRp.points || 0) - actualUse;
      saveDB(dbRp);
      return { points_used: actualUse, amount_deducted: deduct, remaining_points: custRp.points };
    }

    // ---- 盘点（stocktake） ----
    if (p === '/stocktake' && method === 'GET') {
      requireAuth();
      return (getDB().stocktakes || []).filter(function(s) { return !storeId || s.store_id === storeId; }).sort(function(a, b) { return new Date(b.created_at) - new Date(a.created_at); });
    }
    if (p === '/stocktake' && method === 'POST') {
      requireAuth();
      var dbSt = getDB();
      if (!dbSt.stocktakes) dbSt.stocktakes = [];
      var counts = (body.counts || []).map(function(c) {
        return { product_id: c.product_id || c.productId, product_name: c.product_name || c.productName, system_qty: Number(c.system_qty) || 0, counted_qty: Number(c.counted_qty) || 0 };
      });
      // 计算差异并应用盘点结果到实际库存
      counts.forEach(function(c) {
        c.diff = c.counted_qty - c.system_qty;
        var prod = dbSt.products.find(function(x) { return x.id === c.product_id; });
        if (prod && body.apply) prod.stock = c.counted_qty;
      });
      var stk = {
        id: genId('stk'),
        store_id: body.store_id || body.storeId || '',
        operator: body.operator || (currentUser() ? currentUser().username : ''),
        counts: counts,
        total_diff: counts.reduce(function(s, c) { return s + (c.diff || 0); }, 0),
        applied: !!body.apply,
        created_at: new Date().toISOString()
      };
      dbSt.stocktakes.push(stk);
      saveDB(dbSt);
      return stk;
    }
    if (p.indexOf('/stocktake/') === 0 && method === 'GET') {
      requireAuth();
      var stkId = p.split('/')[2];
      var stkRec = (getDB().stocktakes || []).find(function(s) { return s.id === stkId; });
      return stkRec || null;
    }

    throw new Error('接口不存在: ' + method + ' ' + p);
  }

  // ============ 覆盖 fetch ============
  var origFetch = window.fetch;
  window.fetch = function(url, opts) {
    opts = opts || {};
    var method = (opts.method || 'GET').toUpperCase();
    var u = String(url);
    if (u.indexOf('/api/') !== 0) return origFetch.apply(this, arguments);
    var path = u.slice(4);
    var body = null;
    try {
      if (opts.body) body = JSON.parse(opts.body);
    } catch(e) {}
    return new Promise(function(resolve) {
      setTimeout(function() {
        try {
          var data = handle(method, path, body);
          // 后端用 snake_case，前端期望 camelCase，统一做一次转换
          var transformed = transform(data);
          resolve(new Response(JSON.stringify(transformed), { status: 200, headers: { 'Content-Type': 'application/json' } }));
        } catch(err) {
          resolve(new Response(JSON.stringify({ error: err.message || '请求失败' }), { status: 400, headers: { 'Content-Type': 'application/json' } }));
        }
      }, 30);
    });
  };

  // ============ 顶栏提示条 ============
  function showBanner() {
    var bar = document.createElement('div');
    bar.style.cssText = 'position:fixed;top:0;left:0;right:0;background:linear-gradient(90deg,#7c3aed,#2563eb);color:#fff;padding:8px 12px;font-size:13px;text-align:center;z-index:99999;font-family:"PingFang SC",sans-serif;box-shadow:0 2px 6px rgba(0,0,0,0.15);';
    bar.innerHTML = '🛍️ 衫云智管 · 静态演示版（数据保存在浏览器 localStorage） · 演示账号 demo / demo123 · <a href="javascript:localStorage.clear();location.reload();" style="color:#fff;text-decoration:underline;">重置数据</a>';
    document.body.appendChild(bar);
    document.body.style.paddingTop = '36px';
  }

  // 立即显示横幅（在 app.js 加载后由它自己处理登录）
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showBanner);
  } else {
    showBanner();
  }

  // 暴露调试入口
  window.__shanyunDebug = {
    resetData: function() { localStorage.removeItem(STORAGE_KEY); location.reload(); },
    exportData: function() { return getDB(); },
    importData: function(d) { saveDB(d); location.reload(); }
  };
})();
