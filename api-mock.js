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
      audit_logs: [],
      custom_fields: [],
      system_settings: {
        store_name: '我的店铺',
        store_phone: '',
        store_address: '',
        receipt_header: '衫云智管',
        receipt_footer: '感谢您的惠顾！',
        print_paper: '58mm',
        theme_color: '#6C5CE7',
        theme_font: 'default',
        notif_birthday: true,
        notif_lowstock: true,
        notif_activity: true
      }
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

  // 记录操作日志
  function logAudit(action, target, detail) {
    try {
      var db = getDB();
      if (!db.audit_logs) db.audit_logs = [];
      var u = currentUser();
      db.audit_logs.unshift({
        id: genId('log'),
        user: u ? u.username : 'system',
        role: u ? u.role : '',
        action: action,
        target: target || '',
        detail: detail || '',
        created_at: new Date().toISOString()
      });
      if (db.audit_logs.length > 500) db.audit_logs = db.audit_logs.slice(0, 500);
      saveDB(db);
    } catch(e) {}
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

    // ---- 自定义字段（custom_fields） ----
    // 实体类型: product / customer / supplier / store / order
    // 字段类型: text / textarea / number / date / select / multiselect / switch / ref
    if (p === '/custom-fields' && method === 'GET') {
      requireAuth();
      var cfDb = getDB();
      if (!cfDb.custom_fields) cfDb.custom_fields = [];
      var entity = params.get('entity');
      var list = cfDb.custom_fields.filter(function(f) { return !storeId || !f.store_id || f.store_id === storeId; });
      if (entity) list = list.filter(function(f) { return f.entity === entity; });
      return list.sort(function(a, b) { return (a.sort || 0) - (b.sort || 0); });
    }
    if (p === '/custom-fields' && method === 'POST') {
      requireAuth();
      var cfDb2 = getDB();
      if (!cfDb2.custom_fields) cfDb2.custom_fields = [];
      var cf = {
        id: genId('cf'),
        store_id: storeId || '',
        entity: body.entity || 'product',
        key: (body.key || '').trim(),
        label: (body.label || '').trim(),
        type: body.type || 'text',
        options: Array.isArray(body.options) ? body.options : [],
        required: !!body.required,
        sort: Number(body.sort) || cfDb2.custom_fields.length,
        default_value: body.default_value || '',
        ref_entity: body.ref_entity || '',
        created_at: new Date().toISOString()
      };
      if (!cf.key) throw new Error('字段标识不能为空');
      if (!cf.label) throw new Error('字段名称不能为空');
      var dup = cfDb2.custom_fields.find(function(f) { return f.entity === cf.entity && f.key === cf.key && (!storeId || !f.store_id || f.store_id === storeId); });
      if (dup) throw new Error('该实体下字段标识已存在: ' + cf.key);
      cfDb2.custom_fields.push(cf);
      saveDB(cfDb2);
      logAudit('创建自定义字段', cf.entity + '.' + cf.key, cf.label);
      return cf;
    }
    if (p.indexOf('/custom-fields/') === 0 && method === 'PUT') {
      requireAuth();
      var cfId = p.split('/')[2];
      var cfDb3 = getDB();
      var cfRec = cfDb3.custom_fields.find(function(f) { return f.id === cfId; });
      if (!cfRec) throw new Error('字段不存在');
      if (body.label !== undefined) cfRec.label = String(body.label).trim();
      if (body.type !== undefined) cfRec.type = body.type;
      if (Array.isArray(body.options)) cfRec.options = body.options;
      if (body.required !== undefined) cfRec.required = !!body.required;
      if (body.sort !== undefined) cfRec.sort = Number(body.sort) || 0;
      if (body.default_value !== undefined) cfRec.default_value = body.default_value;
      if (body.ref_entity !== undefined) cfRec.ref_entity = body.ref_entity;
      saveDB(cfDb3);
      logAudit('更新自定义字段', cfRec.entity + '.' + cfRec.key, cfRec.label);
      return cfRec;
    }
    if (p.indexOf('/custom-fields/') === 0 && method === 'DELETE') {
      requireAuth();
      var cfId2 = p.split('/')[2];
      var cfDb4 = getDB();
      var cfRec2 = cfDb4.custom_fields.find(function(f) { return f.id === cfId2; });
      cfDb4.custom_fields = cfDb4.custom_fields.filter(function(f) { return f.id !== cfId2; });
      saveDB(cfDb4);
      if (cfRec2) logAudit('删除自定义字段', cfRec2.entity + '.' + cfRec2.key, cfRec2.label);
      return { ok: true };
    }

    // ---- 数据导入导出（import/export） ----
    // 导出: GET /export?type=products|customers|suppliers
    if (p === '/export' && method === 'GET') {
      requireAuth();
      var expType = params.get('type');
      var expDb = getDB();
      if (expType === 'products') {
        return expDb.products.filter(function(x) { return !storeId || x.store_id === storeId; });
      }
      if (expType === 'customers') {
        return expDb.customers.filter(function(x) { return !storeId || x.store_id === storeId; });
      }
      if (expType === 'suppliers') {
        return expDb.suppliers.filter(function(x) { return !storeId || x.store_id === storeId; });
      }
      if (expType === 'orders') {
        return expDb.orders.filter(function(x) { return !storeId || x.store_id === storeId; }).slice(0, 1000);
      }
      throw new Error('不支持的导出类型: ' + expType);
    }
    // 导入: POST /import
    if (p === '/import' && method === 'POST') {
      requireAuth();
      var impBody = body;
      var impType = impBody.type; // products | customers | suppliers
      var impData = impBody.data || [];
      var impDb = getDB();
      if (!impType || !['products','customers','suppliers'].includes(impType)) {
        throw new Error('不支持的导入类型: ' + impType);
      }
      var results = { success: 0, failed: 0, errors: [] };
      var now = new Date().toISOString();
      impData.forEach(function(row, idx) {
        try {
          if (impType === 'products') {
            var prod = {
              id: genId('p'),
              store_id: storeId || '',
              name: String(row.name || row.商品名称 || row.品名 || '').trim(),
              code: String(row.code || row.货号 || row.编码 || '').trim(),
              category: String(row.category || row.分类 || row.类别 || '').trim(),
              price: Number(row.price || row.售价 || row.零售价 || 0),
              purchase_price: Number(row.purchase_price || row.成本 || row.进价 || 0),
              stock: Number(row.stock || row.库存 || 0),
              warning_stock: Number(row.warning_stock || row.预警库存 || 10),
              supplier_id: String(row.supplier_id || row.供应商 || '').trim(),
              hot: Number(row.hot || row.热卖 || 0),
              created_at: now
            };
            if (!prod.name) throw new Error('商品名称不能为空');
            impDb.products.push(prod);
          } else if (impType === 'customers') {
            var cust = {
              id: genId('c'),
              store_id: storeId || '',
              name: String(row.name || row.客户名称 || row.姓名 || '').trim(),
              phone: String(row.phone || row.电话 || row.手机 || '').trim(),
              level: String(row.level || row.等级 || '普通').trim(),
              points: Number(row.points || row.积分 || 0),
              total_spent: Number(row.total_spent || row.累计消费 || 0),
              tags: String(row.tags || row.标签 || '').trim(),
              created_at: now
            };
            if (!cust.name) throw new Error('客户名称不能为空');
            impDb.customers.push(cust);
          } else if (impType === 'suppliers') {
            var supp = {
              id: genId('s'),
              store_id: storeId || '',
              name: String(row.name || row.供应商名称 || '').trim(),
              contact: String(row.contact || row.联系人 || '').trim(),
              phone: String(row.phone || row.电话 || '').trim(),
              address: String(row.address || row.地址 || '').trim(),
              created_at: now
            };
            if (!supp.name) throw new Error('供应商名称不能为空');
            impDb.suppliers.push(supp);
          }
          results.success++;
        } catch(err) {
          results.failed++;
          results.errors.push({ row: idx + 2, error: err.message }); // +2 跳过表头
        }
      });
      saveDB(impDb);
      logAudit('批量导入' + impType, impType, '成功' + results.success + '条，失败' + results.failed + '条');
      return results;
    }

    // ---- 价格策略（price_rules） ----
    if (p === '/price-rules' && method === 'GET') {
      requireAuth();
      var prDb = getDB();
      if (!prDb.price_rules) prDb.price_rules = [];
      var entity = params.get('entity');
      var refId = params.get('ref_id');
      var rules = prDb.price_rules.filter(function(r) { return !storeId || !r.store_id || r.store_id === storeId; });
      if (entity) rules = rules.filter(function(r) { return r.entity === entity; });
      if (refId) rules = rules.filter(function(r) { return r.ref_id === refId; });
      return rules;
    }
    if (p === '/price-rules' && method === 'POST') {
      requireAuth();
      var prDb2 = getDB();
      if (!prDb2.price_rules) prDb2.price_rules = [];
      var rule = {
        id: genId('pr'),
        store_id: storeId || '',
        entity: body.entity, // product | customer | level
        ref_id: body.ref_id || '', // 商品ID或客户等级
        ref_name: body.ref_name || '',
        price_type: body.price_type || 'fixed', // fixed | percent | minus
        price_value: Number(body.price_value) || 0,
        start_date: body.start_date || '',
        end_date: body.end_date || '',
        status: 'active',
        created_at: new Date().toISOString()
      };
      if (!rule.entity) throw new Error('实体类型不能为空');
      prDb2.price_rules.push(rule);
      saveDB(prDb2);
      logAudit('创建价格规则', rule.entity, rule.ref_name);
      return rule;
    }
    if (p.indexOf('/price-rules/') === 0 && method === 'PUT') {
      requireAuth();
      var prId = p.split('/')[2];
      var prDb3 = getDB();
      var prRec = (prDb3.price_rules || []).find(function(r) { return r.id === prId; });
      if (!prRec) throw new Error('价格规则不存在');
      if (body.price_type !== undefined) prRec.price_type = body.price_type;
      if (body.price_value !== undefined) prRec.price_value = Number(body.price_value);
      if (body.start_date !== undefined) prRec.start_date = body.start_date;
      if (body.end_date !== undefined) prRec.end_date = body.end_date;
      if (body.status !== undefined) prRec.status = body.status;
      saveDB(prDb3);
      return prRec;
    }
    if (p.indexOf('/price-rules/') === 0 && method === 'DELETE') {
      requireAuth();
      var prId2 = p.split('/')[2];
      var prDb4 = getDB();
      prDb4.price_rules = (prDb4.price_rules || []).filter(function(r) { return r.id !== prId2; });
      saveDB(prDb4);
      return { ok: true };
    }

    // ---- 库存预警（stock_alerts） ----
    if (p === '/stock-alerts' && method === 'GET') {
      requireAuth();
      var saDb = getDB();
      var alerts = [];
      (saDb.products || []).filter(function(p) { return !storeId || p.store_id === storeId; }).forEach(function(prod) {
        if (prod.stock <= (prod.warning_stock || 10)) {
          alerts.push({
            type: prod.stock === 0 ? 'out_of_stock' : 'low_stock',
            product_id: prod.id,
            product_name: prod.name,
            current_stock: prod.stock,
            warning_stock: prod.warning_stock || 10,
            supplier_id: prod.supplier_id || ''
          });
        }
      });
      // 滞销提醒：30天无销售
      var thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      (saDb.products || []).filter(function(p) { return !storeId || p.store_id === storeId; }).forEach(function(prod) {
        var sold = saDb.orders.some(function(o) {
          return (o.type !== 'return') && (o.status !== '已取消') &&
                 (o.items || []).some(function(it) { return it.product_id === prod.id; }) &&
                 (o.date || o.created_at) > thirtyDaysAgo;
        });
        if (!sold && prod.stock > 0) {
          alerts.push({
            type: 'slow_selling',
            product_id: prod.id,
            product_name: prod.name,
            current_stock: prod.stock,
            warning_stock: 0,
            supplier_id: prod.supplier_id || ''
          });
        }
      });
      return alerts;
    }

    // ---- 客户标签与分组（customer_tags / customer_groups） ----
    if (p === '/customer-tags' && method === 'GET') {
      requireAuth();
      var ctDb = getDB();
      if (!ctDb.customer_tags) ctDb.customer_tags = [];
      return ctDb.customer_tags.filter(function(t) { return !storeId || !t.store_id || t.store_id === storeId; });
    }
    if (p === '/customer-tags' && method === 'POST') {
      requireAuth();
      var ctDb2 = getDB();
      if (!ctDb2.customer_tags) ctDb2.customer_tags = [];
      var tag = {
        id: genId('ctag'),
        store_id: storeId || '',
        name: body.name,
        color: body.color || '#666',
        created_at: new Date().toISOString()
      };
      if (!tag.name) throw new Error('标签名称不能为空');
      ctDb2.customer_tags.push(tag);
      saveDB(ctDb2);
      return tag;
    }
    if (p.indexOf('/customer-tags/') === 0 && method === 'DELETE') {
      requireAuth();
      var tagId = p.split('/')[2];
      var ctDb3 = getDB();
      ctDb3.customer_tags = (ctDb3.customer_tags || []).filter(function(t) { return t.id !== tagId; });
      // 清除客户中的该标签
      (ctDb3.customers || []).forEach(function(c) {
        var tags = (c.tags || '').split(',').filter(function(t) { return t.trim() !== tagId; });
        c.tags = tags.join(',');
      });
      saveDB(ctDb3);
      return { ok: true };
    }
    if (p === '/customer-groups' && method === 'GET') {
      requireAuth();
      var cgDb = getDB();
      if (!cgDb.customer_groups) cgDb.customer_groups = [];
      var groups = cgDb.customer_groups.filter(function(g) { return !storeId || !g.store_id || g.store_id === storeId; });
      // 附加每个分组的客户数量
      groups.forEach(function(g) {
        g.customer_count = (cgDb.customers || []).filter(function(c) {
          return (c.group_id === g.id) && (!storeId || !c.store_id || c.store_id === storeId);
        }).length;
      });
      return groups;
    }
    if (p === '/customer-groups' && method === 'POST') {
      requireAuth();
      var cgDb2 = getDB();
      if (!cgDb2.customer_groups) cgDb2.customer_groups = [];
      var group = {
        id: genId('cgrp'),
        store_id: storeId || '',
        name: body.name,
        description: body.description || '',
        discount_rate: Number(body.discount_rate) || 0, // 分组折扣率（百分比）
        created_at: new Date().toISOString()
      };
      if (!group.name) throw new Error('分组名称不能为空');
      cgDb2.customer_groups.push(group);
      saveDB(cgDb2);
      return group;
    }
    if (p.indexOf('/customer-groups/') === 0 && method === 'DELETE') {
      requireAuth();
      var grpId = p.split('/')[2];
      var cgDb3 = getDB();
      cgDb3.customer_groups = (cgDb3.customer_groups || []).filter(function(g) { return g.id !== grpId; });
      // 清除客户的分组
      (cgDb3.customers || []).forEach(function(c) {
        if (c.group_id === grpId) c.group_id = '';
      });
      saveDB(cgDb3);
      return { ok: true };
    }

    // ---- 供应商对账（supplier-purchases） ----
    if (p === '/supplier-purchases' && method === 'GET') {
      requireAuth();
      var spDb = getDB();
      var purchases = (spDb.supplier_purchases || []).filter(function(x) { return !storeId || x.store_id === storeId; });
      if (params.get('supplier_id')) {
        purchases = purchases.filter(function(x) { return x.supplier_id === params.get('supplier_id'); });
      }
      return purchases;
    }
    if (p === '/supplier-purchases' && method === 'POST') {
      requireAuth();
      var spDb2 = getDB();
      if (!spDb2.supplier_purchases) spDb2.supplier_purchases = [];
      var purchase = {
        id: genId('sp'),
        store_id: storeId || '',
        supplier_id: body.supplier_id,
        supplier_name: body.supplier_name || '',
        order_no: body.order_no || '',
        amount: Number(body.amount) || 0,
        paid: Number(body.paid) || 0,
        status: body.status || 'pending', // pending | partial | paid
        purchase_date: body.purchase_date || new Date().toISOString().slice(0, 10),
        due_date: body.due_date || '',
        items: body.items || [],
        note: body.note || '',
        created_at: new Date().toISOString()
      };
      spDb2.supplier_purchases.push(purchase);
      // 同时更新商品库存
      (purchase.items || []).forEach(function(it) {
        var prod = spDb2.products.find(function(p) { return p.id === it.product_id; });
        if (prod) prod.stock = (prod.stock || 0) + Number(it.qty || 0);
      });
      saveDB(spDb2);
      logAudit('新增进货单', purchase.supplier_name, purchase.amount + '元');
      return purchase;
    }
    if (p.indexOf('/supplier-purchases/') === 0 && method === 'PUT') {
      requireAuth();
      var purId = p.split('/')[2];
      var spDb3 = getDB();
      var purRec = (spDb3.supplier_purchases || []).find(function(x) { return x.id === purId; });
      if (!purRec) throw new Error('进货单不存在');
      if (body.paid !== undefined) purRec.paid = Number(body.paid);
      if (body.status !== undefined) purRec.status = body.status;
      if (body.note !== undefined) purRec.note = body.note;
      saveDB(spDb3);
      return purRec;
    }
    if (p === '/supplier-summary' && method === 'GET') {
      requireAuth();
      var ssDb2 = getDB();
      var summary = {};
      ((ssDb2.supplier_purchases || [])).filter(function(x) { return !storeId || x.store_id === storeId; }).forEach(function(p) {
        if (!summary[p.supplier_id]) {
          summary[p.supplier_id] = { supplier_id: p.supplier_id, supplier_name: p.supplier_name, total: 0, paid: 0, payable: 0, count: 0 };
        }
        summary[p.supplier_id].total += Number(p.amount || 0);
        summary[p.supplier_id].paid += Number(p.paid || 0);
        summary[p.supplier_id].payable += (Number(p.amount || 0) - Number(p.paid || 0));
        summary[p.supplier_id].count++;
      });
      return Object.values(summary);
    }

    // ---- 打印模板（print_templates） ----
    if (p === '/print-templates' && method === 'GET') {
      requireAuth();
      var ptDb = getDB();
      if (!ptDb.print_templates) {
        // 默认模板
        ptDb.print_templates = [
          { id: 'receipt_default', name: '小票模板', type: 'receipt', content: '<div class="receipt"><h2>${store_name}</h2><p>订单号: ${order_no}</p><p>日期: ${date}</p><hr/>${items}<hr/><p>合计: ${total}元</p></div>' },
          { id: 'label_default', name: '标签模板', type: 'label', content: '<div class="label" style="width:60mm"><p>${product_name}</p><p>编码: ${code}</p><p>价格: ${price}元</p></div>' }
        ];
        saveDB(ptDb);
      }
      return ptDb.print_templates;
    }
    if (p === '/print-templates' && method === 'POST') {
      requireAuth();
      var ptDb2 = getDB();
      if (!ptDb2.print_templates) ptDb2.print_templates = [];
      var tmpl = {
        id: genId('pt'),
        name: body.name,
        type: body.type, // receipt | label
        content: body.content || '',
        created_at: new Date().toISOString()
      };
      ptDb2.print_templates.push(tmpl);
      saveDB(ptDb2);
      return tmpl;
    }
    if (p.indexOf('/print-templates/') === 0 && method === 'DELETE') {
      requireAuth();
      var tmplId = p.split('/')[2];
      var ptDb3 = getDB();
      ptDb3.print_templates = (ptDb3.print_templates || []).filter(function(t) { return t.id !== tmplId; });
      saveDB(ptDb3);
      return { ok: true };
    }

    // ---- 操作日志（audit_logs） ----
    if (p === '/audit-logs' && method === 'GET') {
      requireAuth();
      var alDb = getDB();
      var logs = (alDb.audit_logs || []).slice();
      var actionFilter = params.get('action');
      var userFilter = params.get('user');
      if (actionFilter) logs = logs.filter(function(l) { return l.action === actionFilter; });
      if (userFilter) logs = logs.filter(function(l) { return l.user === userFilter; });
      var limit = Number(params.get('limit')) || 100;
      return logs.slice(0, limit);
    }
    if (p === '/audit-logs' && method === 'POST') {
      requireAuth();
      logAudit(body.action || '操作', body.target || '', body.detail || '');
      return { ok: true };
    }

    // ---- 系统设置（system_settings） ----
    if (p === '/system-settings' && method === 'GET') {
      requireAuth();
      var ssDb = getDB();
      return ssDb.system_settings || {};
    }
    if (p === '/system-settings' && method === 'PUT') {
      requireAuth();
      var ssDb2 = getDB();
      if (!ssDb2.system_settings) ssDb2.system_settings = {};
      var allowed = ['store_name','store_phone','store_address','receipt_header','receipt_footer','print_paper','theme_color','theme_font','notif_birthday','notif_lowstock','notif_activity'];
      allowed.forEach(function(k) {
        if (body[k] !== undefined) ssDb2.system_settings[k] = body[k];
      });
      saveDB(ssDb2);
      logAudit('更新系统设置', '', '');
      return ssDb2.system_settings;
    }

    // ---- 数据备份与恢复 ----
    if (p === '/backup' && method === 'GET') {
      requireAuth();
      var bkDb = getDB();
      return {
        version: '4.1',
        exported_at: new Date().toISOString(),
        data: bkDb
      };
    }
    if (p === '/backup/restore' && method === 'POST') {
      requireAuth();
      var u2 = currentUser();
      if (u2.role !== 'boss') throw new Error('仅老板可恢复数据');
      if (!body.data) throw new Error('备份数据为空');
      var restored = body.data;
      if (!restored.users || !restored.stores) throw new Error('备份文件格式不正确');
      saveDB(restored);
      logAudit('恢复数据备份', '', '从备份恢复');
      return { ok: true, count: { users: restored.users.length, products: (restored.products||[]).length, orders: (restored.orders||[]).length } };
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
