/* ========================================
   衫云智管 AI 智能引擎 (ai-engine.js)
   对标：秦丝AI货盘诊断 + 有赞AI营销画布 + 智能穿搭
   功能：AI分析/智能入库/穿搭推荐/拼团/RFM/营销日历
   ======================================== */

// ============ AI 智能分析引擎 ============
var AIEngine = (function() {
  'use strict';

  // ---- 货盘诊断：滞销预警 + 爆款预测 + 库存健康度 ----
  function diagnoseInventory(products, orders) {
    products = products || [];
    orders = orders || [];
    var now = Date.now();
    var results = {
      score: 0, // 综合健康分 0-100
      slowMoving: [],    // 滞销品
      hotSelling: [],    // 爆款
      lowStock: [],      // 低库存预警
      overStock: [],     // 积压预警
      suggestions: [],   // 智能建议
      turnoverDays: 0,   // 平均周转天数
      totalValue: 0,     // 库存总价值
      profitMargin: 0    // 平均毛利率
    };

    if (!products.length) return results;

    // 计算每个产品的销售数据
    var productSales = {};
    var totalSalesQty = 0;
    orders.forEach(function(o) {
      (o.items || []).forEach(function(item) {
        var pid = item.productId || item.product_id;
        if (!pid) return;
        productSales[pid] = (productSales[pid] || 0) + (item.quantity || 1);
        totalSalesQty += (item.quantity || 1);
      });
    });

    var totalValue = 0, totalProfit = 0, totalCost = 0;
    var turnoverDays = [];

    products.forEach(function(p) {
      var salesQty = productSales[p.id] || 0;
      var price = p.retailPrice || p.price || 0;
      var cost = p.purchasePrice || p.purchase_price || price * 0.4;
      var stock = p.stock || 0;
      var stockValue = stock * cost;
      totalValue += stockValue;
      totalCost += cost * (salesQty + stock);
      totalProfit += (price - cost) * salesQty;

      // 日销量估算（假设30天周期）
      var dailySales = salesQty / Math.max(1, 30);
      var daysToSell = dailySales > 0 ? stock / dailySales : 999;

      // 滞销品：库存 > 0 且 30天无销售 或 周转天数 > 90
      if (stock > 0 && (salesQty === 0 || daysToSell > 90)) {
        results.slowMoving.push({
          id: p.id, name: p.name, stock: stock, salesQty: salesQty,
          daysToSell: Math.round(daysToSell), value: stockValue,
          suggestion: stock > 20 ? '建议降价促销或捆绑销售' : '建议清仓处理'
        });
      }

      // 爆款：销量 > 日均1件 且 库存 < 日均销量*14
      if (dailySales >= 0.5 && stock < dailySales * 14) {
        results.hotSelling.push({
          id: p.id, name: p.name, stock: stock, dailySales: dailySales.toFixed(1),
          suggestedRestock: Math.round(dailySales * 30 - stock),
          turnoverDays: Math.round(daysToSell)
        });
      }

      // 低库存预警
      var warningStock = p.warningStock || p.warning_stock || 10;
      if (stock <= warningStock) {
        results.lowStock.push({
          id: p.id, name: p.name, stock: stock, warningStock: warningStock,
          dailySales: dailySales.toFixed(1)
        });
      }

      // 积压预警：库存 > 日均销量*60
      if (dailySales > 0 && stock > dailySales * 60) {
        results.overStock.push({
          id: p.id, name: p.name, stock: stock,
          excessDays: Math.round(stock / dailySales - 60)
        });
      }

      if (stock > 0) turnoverDays.push(daysToSell);
    });

    // 综合健康分
    var totalProducts = products.length;
    var healthyRatio = 1 - (results.slowMoving.length + results.lowStock.length) / (totalProducts * 2);
    var turnoverAvg = turnoverDays.length > 0 ? turnoverDays.reduce(function(a, b) { return a + b; }, 0) / turnoverDays.length : 0;
    var turnoverScore = Math.max(0, 100 - turnoverAvg * 2); // 周转越快分越高
    results.score = Math.round(Math.max(20, Math.min(95, healthyRatio * 60 + turnoverScore * 0.4)));
    results.turnoverDays = Math.round(turnoverAvg);
    results.totalValue = Math.round(totalValue);
    results.profitMargin = totalCost > 0 ? Math.round(totalProfit / totalCost * 100) : 0;

    // 智能建议
    if (results.slowMoving.length > 0) {
      results.suggestions.push({
        icon: '📉', title: '滞销品处理',
        desc: '有 ' + results.slowMoving.length + ' 款商品滞销，建议开启限时折扣或捆绑销售活动',
        action: 'flash-sale'
      });
    }
    if (results.hotSelling.length > 0) {
      results.suggestions.push({
        icon: '🔥', title: '爆款补货',
        desc: '有 ' + results.hotSelling.length + ' 款爆款即将售罄，建议立即补货',
        action: 'products'
      });
    }
    if (results.lowStock.length > 0) {
      results.suggestions.push({
        icon: '⚠️', title: '低库存预警',
        desc: results.lowStock.length + ' 款商品库存不足，建议尽快采购',
        action: 'products'
      });
    }
    if (results.profitMargin < 30) {
      results.suggestions.push({
        icon: '💡', title: '利润优化',
        desc: '当前毛利率 ' + results.profitMargin + '%，建议优化定价策略或降低采购成本',
        action: 'products'
      });
    }
    if (results.overStock.length > 0) {
      results.suggestions.push({
        icon: '📦', title: '库存积压',
        desc: results.overStock.length + ' 款商品库存积压，建议参加拼团或秒杀活动',
        action: 'flash-sale'
      });
    }

    return results;
  }

  // ---- 爆款预测：基于销售趋势 + 季节性 ----
  function predictHotProducts(products, orders) {
    var productSales = {};
    orders.forEach(function(o) {
      (o.items || []).forEach(function(item) {
        var pid = item.productId || item.product_id;
        if (!pid) return;
        productSales[pid] = (productSales[pid] || 0) + (item.quantity || 1);
      });
    });

    var seasonWeights = {
      '连衣裙': 1.5, '短袖': 1.4, 'T恤': 1.4, '雪纺': 1.3,
      '半身裙': 1.3, '短裤': 1.3, '凉鞋': 1.2, '泳装': 1.5,
      '真丝': 1.4, '蕾丝': 1.3
    };

    var month = new Date().getMonth() + 1;
    var isSummer = month >= 5 && month <= 9;
    var isWinter = month >= 11 || month <= 2;

    return products.map(function(p) {
      var sales = productSales[p.id] || 0;
      var price = p.retailPrice || p.price || 0;
      var stock = p.stock || 0;
      var name = (p.name || '').toLowerCase();

      // 季节性权重
      var seasonBoost = 1.0;
      Object.keys(seasonWeights).forEach(function(kw) {
        if (name.indexOf(kw) !== -1) {
          seasonBoost = isSummer ? seasonWeights[kw] : (isWinter ? 0.3 : 1.0);
        }
      });

      // 综合评分
      var score = (sales * 10 + (price > 300 ? 5 : 0) + (stock < 20 ? 10 : 0)) * seasonBoost;
      return { id: p.id, name: p.name, score: Math.round(score), stock: stock, sales: sales };
    }).sort(function(a, b) { return b.score - a.score; }).slice(0, 10);
  }

  // ---- 智能补货建议 ----
  function suggestRestock(products, orders) {
    var productSales = {};
    orders.forEach(function(o) {
      (o.items || []).forEach(function(item) {
        var pid = item.productId || item.product_id;
        if (!pid) return;
        productSales[pid] = (productSales[pid] || 0) + (item.quantity || 1);
      });
    });

    return products.map(function(p) {
      var sales = productSales[p.id] || 0;
      var dailySales = sales / 30;
      var stock = p.stock || 0;
      var leadTime = 7; // 假设采购周期7天
      var safetyStock = Math.ceil(dailySales * leadTime * 1.5);
      var suggested = Math.max(0, Math.ceil(dailySales * 30) - stock + safetyStock);
      return {
        id: p.id, name: p.name, stock: stock, dailySales: dailySales.toFixed(1),
        suggestedRestock: suggested, urgency: stock < safetyStock ? 'urgent' : (stock < safetyStock * 2 ? 'normal' : 'low')
      };
    }).filter(function(r) { return r.suggestedRestock > 0; })
      .sort(function(a, b) { return b.suggestedRestock - a.suggestedRestock; });
  }

  return {
    diagnoseInventory: diagnoseInventory,
    predictHotProducts: predictHotProducts,
    suggestRestock: suggestRestock
  };
})();


// ============ AI 智能入库 (OCR 拍照识别) ============
var SmartStockIn = (function() {
  'use strict';

  // 模拟 OCR 识别结果（真实场景对接 OCR API）
  function simulateOCR(imageDataUrl) {
    return new Promise(function(resolve) {
      // 模拟 AI 识别延迟
      setTimeout(function() {
        var mockResults = [
          { name: '韩版宽松短袖T恤', code: 'TS' + rand(1000, 9999), category: '上衣', color: '白色', size: 'M', price: 168 },
          { name: '高腰A字半身裙', code: 'SK' + rand(1000, 9999), category: '裙装', color: '黑色', size: '均码', price: 258 },
          { name: '真丝印花连衣裙', code: 'DR' + rand(1000, 9999), category: '连衣裙', color: '碎花', size: 'L', price: 588 },
          { name: '冰丝阔腿裤', code: 'PT' + rand(1000, 9999), category: '裤装', color: '米色', size: 'XL', price: 198 },
          { name: '复古牛仔外套', code: 'CT' + rand(1000, 9999), category: '外套', color: '牛仔蓝', size: 'M', price: 399 }
        ];
        resolve(mockResults[Math.floor(Math.random() * mockResults.length)]);
      }, 800 + Math.random() * 1200);
    });
  }

  function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

  return { simulateOCR: simulateOCR };
})();


// ============ AI 智能穿搭推荐 ============
var StylistAI = (function() {
  'use strict';

  var STYLE_RULES = [
    { match: ['连衣裙', '外套'], desc: '连衣裙 + 外套 = 优雅通勤风', score: 90 },
    { match: ['上衣', '裙装'], desc: '上衣 + 半身裙 = 甜美约会风', score: 85 },
    { match: ['上衣', '裤装'], desc: '上衣 + 裤装 = 干练职场风', score: 80 },
    { match: ['上衣', '裤装', '外套'], desc: '上衣 + 裤装 + 外套 = 三层叠穿法', score: 95 },
    { match: ['连衣裙', '配饰'], desc: '连衣裙 + 配饰 = 精致晚宴风', score: 88 },
    { match: ['上衣', '裙装', '外套'], desc: '上衣 + 半身裙 + 外套 = 层次感穿搭', score: 92 },
    { match: ['上衣', '裤装', '鞋履'], desc: '上衣 + 裤装 + 鞋子 = 完整出街Look', score: 93 },
    { match: ['连衣裙', '鞋履', '配饰'], desc: '连衣裙 + 鞋子 + 配饰 = 全套造型', score: 96 }
  ];

  function recommend(products) {
    products = products || [];
    if (products.length < 2) return [];

    var byCategory = {};
    products.forEach(function(p) {
      var cat = p.category || '其他';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(p);
    });

    var recommendations = [];
    var categories = Object.keys(byCategory);

    STYLE_RULES.forEach(function(rule) {
      var hasAll = rule.match.every(function(cat) {
        return categories.some(function(c) { return c.indexOf(cat) !== -1; });
      });
      if (hasAll) {
        var items = rule.match.map(function(cat) {
          var catKey = categories.find(function(c) { return c.indexOf(cat) !== -1; });
          var list = byCategory[catKey] || [];
          return list[Math.floor(Math.random() * list.length)];
        }).filter(Boolean);
        if (items.length >= 2) {
          recommendations.push({
            desc: rule.desc, score: rule.score, items: items
          });
        }
      }
    });

    return recommendations.sort(function(a, b) { return b.score - a.score; }).slice(0, 5);
  }

  // 根据客户画像推荐搭配
  function recommendForCustomer(customer, products) {
    var recs = recommend(products);
    var customerLevel = customer.level || 'normal';
    var levelBoost = { 'platinum': 1.2, 'gold': 1.1, 'vip': 1.05, 'normal': 1.0 };
    var boost = levelBoost[customerLevel] || 1.0;

    return recs.map(function(r) {
      return {
        desc: r.desc,
        score: Math.round(r.score * boost),
        items: r.items,
        forCustomer: customer.name,
        note: customerLevel === 'platinum' ? '尊享推荐' : (customerLevel === 'gold' ? '金卡推荐' : '')
      };
    });
  }

  return { recommend: recommend, recommendForCustomer: recommendForCustomer };
})();


// ============ 拼团活动系统 ============
var GroupBuy = (function() {
  'use strict';
  var GROUPS_KEY = 'shanyun_group_buys';

  function loadGroups() {
    try { return JSON.parse(localStorage.getItem(GROUPS_KEY) || '[]'); } catch(e) { return []; }
  }
  function saveGroups(groups) {
    try { localStorage.setItem(GROUPS_KEY, JSON.stringify(groups)); } catch(e) {}
  }

  function createGroup(product, config) {
    var groups = loadGroups();
    var group = {
      id: 'gb_' + Date.now(),
      productId: product.id,
      productName: product.name,
      productPrice: product.retailPrice || product.price,
      groupPrice: config.groupPrice || Math.round((product.retailPrice || product.price) * 0.6),
      requiredCount: config.requiredCount || 3,
      currentCount: 0,
      maxCount: config.maxCount || 50,
      startTime: Date.now(),
      endTime: Date.now() + (config.duration || 24) * 3600000,
      status: 'active', // active, success, failed, cancelled
      participants: [],
      image: config.image || null
    };
    groups.push(group);
    saveGroups(groups);
    return group;
  }

  function joinGroup(groupId, customerName) {
    var groups = loadGroups();
    var group = groups.find(function(g) { return g.id === groupId; });
    if (!group) return { success: false, message: '拼团不存在' };
    if (group.status !== 'active') return { success: false, message: '拼团已结束' };
    if (group.currentCount >= group.maxCount) return { success: false, message: '拼团已满' };

    group.currentCount++;
    group.participants.push({ name: customerName, time: Date.now() });

    if (group.currentCount >= group.requiredCount) {
      group.status = 'success';
    }

    saveGroups(groups);
    return {
      success: true,
      message: '参团成功！当前 ' + group.currentCount + '/' + group.requiredCount + ' 人',
      needMore: group.requiredCount - group.currentCount,
      isSuccess: group.status === 'success'
    };
  }

  function getActiveGroups() {
    var groups = loadGroups();
    var now = Date.now();
    return groups.filter(function(g) {
      if (g.status !== 'active') return false;
      if (g.endTime < now) {
        g.status = g.currentCount >= g.requiredCount ? 'success' : 'failed';
        saveGroups(groups);
      }
      return g.status === 'active';
    });
  }

  function deleteGroup(groupId) {
    var groups = loadGroups();
    saveGroups(groups.filter(function(g) { return g.id !== groupId; }));
  }

  return {
    createGroup: createGroup,
    joinGroup: joinGroup,
    getActiveGroups: getActiveGroups,
    deleteGroup: deleteGroup,
    loadGroups: loadGroups,
    saveGroups: saveGroups
  };
})();


// ============ RFM 客户分层分析 ============
var RFMAnalysis = (function() {
  'use strict';

  function analyze(customers, orders) {
    customers = customers || [];
    orders = orders || [];
    var now = Date.now();

    var customerOrders = {};
    orders.forEach(function(o) {
      var cid = o.customerId || o.customer_id;
      if (!cid) return;
      if (!customerOrders[cid]) customerOrders[cid] = { count: 0, total: 0, lastOrder: 0 };
      customerOrders[cid].count++;
      customerOrders[cid].total += o.totalAmount || o.total || 0;
      var oTime = new Date(o.createdAt || o.created_at || o.orderTime).getTime();
      if (oTime > customerOrders[cid].lastOrder) customerOrders[cid].lastOrder = oTime;
    });

    var segments = { highValue: [], loyal: [], atRisk: [], lost: [], newCust: [] };
    var totalCustomers = customers.length;

    customers.forEach(function(c) {
      var co = customerOrders[c.id] || { count: 0, total: 0, lastOrder: 0 };
      var daysSinceLast = co.lastOrder ? Math.round((now - co.lastOrder) / 86400000) : 999;

      var rfm = {
        id: c.id, name: c.name, phone: c.phone, level: c.level,
        frequency: co.count,
        monetary: co.total,
        recency: daysSinceLast,
        segment: ''
      };

      if (co.total >= 10000) {
        rfm.segment = 'highValue';
        segments.highValue.push(rfm);
      } else if (co.count >= 3 && daysSinceLast <= 30) {
        rfm.segment = 'loyal';
        segments.loyal.push(rfm);
      } else if (co.count >= 1 && daysSinceLast > 90) {
        rfm.segment = 'atRisk';
        segments.atRisk.push(rfm);
      } else if (co.count === 0) {
        rfm.segment = 'newCust';
        segments.newCust.push(rfm);
      } else {
        rfm.segment = 'loyal';
        segments.loyal.push(rfm);
      }
    });

    return {
      total: totalCustomers,
      highValue: segments.highValue.length,
      loyal: segments.loyal.length,
      atRisk: segments.atRisk.length,
      newCust: segments.newCust.length,
      segments: segments,
      summary: {
        highValueRate: totalCustomers > 0 ? Math.round(segments.highValue.length / totalCustomers * 100) : 0,
        atRiskRate: totalCustomers > 0 ? Math.round(segments.atRisk.length / totalCustomers * 100) : 0,
        totalRevenue: orders.reduce(function(s, o) { return s + (o.totalAmount || o.total || 0); }, 0)
      }
    };
  }

  return { analyze: analyze };
})();


// ============ 营销日历 ============
var MarketingCalendar = (function() {
  'use strict';

  var FESTIVALS = [
    { date: '01-01', name: '元旦', emoji: '🎉', activity: '新年大促', type: 'holiday' },
    { date: '02-14', name: '情人节', emoji: '💝', activity: '情侣套装', type: 'holiday' },
    { date: '03-08', name: '女神节', emoji: '👑', activity: '女王专属折扣', type: 'holiday' },
    { date: '05-01', name: '劳动节', emoji: '🎊', activity: '五一狂欢购', type: 'holiday' },
    { date: '05-10', name: '母亲节', emoji: '🌸', activity: '感恩母亲节', type: 'holiday' },
    { date: '06-01', name: '儿童节', emoji: '🎈', activity: '童装特卖', type: 'holiday' },
    { date: '06-18', name: '618大促', emoji: '🛒', activity: '年中大促', type: 'sale' },
    { date: '08-25', name: '七夕', emoji: '💫', activity: '七夕情侣装', type: 'holiday' },
    { date: '09-10', name: '教师节', emoji: '📚', activity: '感恩回馈', type: 'holiday' },
    { date: '10-01', name: '国庆节', emoji: '🇨🇳', activity: '国庆大放价', type: 'holiday' },
    { date: '11-11', name: '双十一', emoji: '🔥', activity: '全场5折起', type: 'sale' },
    { date: '12-12', name: '双十二', emoji: '💥', activity: '年终盛典', type: 'sale' },
    { date: '12-25', name: '圣诞节', emoji: '🎄', activity: '圣诞狂欢', type: 'holiday' }
  ];

  function getUpcoming(days) {
    days = days || 30;
    var now = new Date();
    var upcoming = [];
    FESTIVALS.forEach(function(f) {
      var parts = f.date.split('-');
      var festDate = new Date(now.getFullYear(), parseInt(parts[0]) - 1, parseInt(parts[1]));
      if (festDate < now) festDate.setFullYear(festDate.getFullYear() + 1);
      var diffDays = Math.round((festDate - now) / 86400000);
      if (diffDays <= days) {
        upcoming.push({
          name: f.name, emoji: f.emoji, activity: f.activity,
          daysLeft: diffDays, date: festDate, type: f.type
        });
      }
    });
    return upcoming.sort(function(a, b) { return a.daysLeft - b.daysLeft; });
  }

  function getSeasonalTips() {
    var month = new Date().getMonth() + 1;
    var tips = [];
    if (month >= 3 && month <= 5) {
      tips = [
        { title: '春季上新', desc: '建议增加薄款外套、针织衫、雪纺衫品类', icon: '🌿' },
        { title: '换季清仓', desc: '冬季厚重外套可开始打折清仓', icon: '📦' }
      ];
    } else if (month >= 6 && month <= 8) {
      tips = [
        { title: '夏季热销', desc: '连衣裙、短袖、防晒服进入旺季，建议加大库存', icon: '☀️' },
        { title: '泳装节', desc: '可上线泳装、沙滩装配饰专题促销', icon: '🏖️' }
      ];
    } else if (month >= 9 && month <= 11) {
      tips = [
        { title: '秋装上新', desc: '风衣、卫衣、针织衫进入销售旺季', icon: '🍂' },
        { title: '双十一备战', desc: '提前备货热销款，准备活动方案', icon: '🔥' }
      ];
    } else {
      tips = [
        { title: '冬装热卖', desc: '羽绒服、大衣、保暖内衣为主推品类', icon: '❄️' },
        { title: '年货节', desc: '可推出新年礼盒套装', icon: '🧧' }
      ];
    }
    return tips;
  }

  return { getUpcoming: getUpcoming, getSeasonalTips: getSeasonalTips, FESTIVALS: FESTIVALS };
})();


// ============ Excel 批量导入导出 ============
var ExcelTool = (function() {
  'use strict';

  // 导出产品为 CSV
  function exportProductsCSV(products) {
    var headers = ['商品名称', '编码', '分类', '零售价', '进价', '库存', '预警库存', '热销'];
    var rows = products.map(function(p) {
      return [
        p.name || '', p.code || '', p.category || '',
        p.retailPrice || p.price || '', p.purchasePrice || p.purchase_price || '',
        p.stock || '', p.warningStock || p.warning_stock || '', p.hot ? '是' : '否'
      ];
    });
    var csv = '\uFEFF' + headers.join(',') + '\n' + rows.map(function(r) { return r.join(','); }).join('\n');
    downloadFile(csv, 'products_export.csv', 'text/csv;charset=utf-8');
  }

  // 导出客户为 CSV
  function exportCustomersCSV(customers) {
    var headers = ['姓名', '手机号', '等级', '积分', '累计消费'];
    var rows = customers.map(function(c) {
      return [c.name || '', c.phone || '', c.level || '', c.points || 0, c.totalSpent || c.total_spent || 0];
    });
    var csv = '\uFEFF' + headers.join(',') + '\n' + rows.map(function(r) { return r.join(','); }).join('\n');
    downloadFile(csv, 'customers_export.csv', 'text/csv;charset=utf-8');
  }

  // 导出订单为 CSV
  function exportOrdersCSV(orders) {
    var headers = ['订单编号', '客户', '商品', '数量', '金额', '时间', '状态'];
    var rows = [];
    orders.forEach(function(o) {
      var items = o.items || [];
      var customerName = (o.customer && o.customer.name) || (state.customers.find(function(c) { return c.id === o.customerId; }) || {}).name || '';
      items.forEach(function(item) {
        rows.push([
          o.id || '', customerName,
          item.productName || item.name || '', item.quantity || 1,
          o.totalAmount || o.total || '', o.createdAt || o.created_at || '',
          o.status || ''
        ]);
      });
    });
    var csv = '\uFEFF' + headers.join(',') + '\n' + rows.map(function(r) { return r.join(','); }).join('\n');
    downloadFile(csv, 'orders_export.csv', 'text/csv;charset=utf-8');
  }

  // 导入产品 CSV
  function importProductsCSV(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      var lines = text.split('\n').filter(function(l) { return l.trim(); });
      if (lines.length < 2) { callback({ success: false, message: '文件格式不正确' }); return; }

      var headers = lines[0].split(',');
      var nameIdx = findIndex(headers, ['商品名称', '名称', 'name', '产品名称']);
      var codeIdx = findIndex(headers, ['编码', 'code', '款号']);
      var catIdx = findIndex(headers, ['分类', 'category', '品类']);
      var priceIdx = findIndex(headers, ['零售价', '价格', 'price', '售价']);
      var costIdx = findIndex(headers, ['进价', '成本', 'cost', '进货价']);
      var stockIdx = findIndex(headers, ['库存', 'stock', '数量']);
      var warnIdx = findIndex(headers, ['预警库存', '预警', 'warning']);

      var imported = [];
      for (var i = 1; i < lines.length; i++) {
        var cols = parseCSVLine(lines[i]);
        if (cols.length < 2) continue;
        var product = {
          id: 'p_imp_' + Date.now() + '_' + i,
          storeId: (state && state.currentStoreId) || 'store_main',
          name: nameIdx >= 0 ? cols[nameIdx] : cols[0],
          code: codeIdx >= 0 ? cols[codeIdx] : '',
          category: catIdx >= 0 ? cols[catIdx] : '',
          price: priceIdx >= 0 ? parseFloat(cols[priceIdx]) || 0 : 0,
          retailPrice: priceIdx >= 0 ? parseFloat(cols[priceIdx]) || 0 : 0,
          purchasePrice: costIdx >= 0 ? parseFloat(cols[costIdx]) || 0 : 0,
          stock: stockIdx >= 0 ? parseInt(cols[stockIdx]) || 0 : 0,
          warningStock: warnIdx >= 0 ? parseInt(cols[warnIdx]) || 10 : 10,
          createdAt: new Date().toISOString()
        };
        imported.push(product);
      }

      callback({ success: true, count: imported.length, products: imported, message: '成功导入 ' + imported.length + ' 条商品' });
    };
    reader.readAsText(file);
  }

  // 导入客户 CSV
  function importCustomersCSV(file, callback) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var text = e.target.result;
      var lines = text.split('\n').filter(function(l) { return l.trim(); });
      if (lines.length < 2) { callback({ success: false, message: '文件格式不正确' }); return; }

      var headers = lines[0].split(',');
      var nameIdx = findIndex(headers, ['姓名', '名称', 'name', '客户名称']);
      var phoneIdx = findIndex(headers, ['手机号', '电话', 'phone', '手机']);
      var levelIdx = findIndex(headers, ['等级', 'level', '会员等级']);
      var pointsIdx = findIndex(headers, ['积分', 'points']);

      var imported = [];
      for (var i = 1; i < lines.length; i++) {
        var cols = parseCSVLine(lines[i]);
        if (cols.length < 1) continue;
        var customer = {
          id: 'c_imp_' + Date.now() + '_' + i,
          storeId: (state && state.currentStoreId) || 'store_main',
          name: nameIdx >= 0 ? cols[nameIdx] : cols[0],
          phone: phoneIdx >= 0 ? cols[phoneIdx] : '',
          level: levelIdx >= 0 ? cols[levelIdx] : 'normal',
          points: pointsIdx >= 0 ? parseInt(cols[pointsIdx]) || 0 : 0,
          totalSpent: 0,
          createdAt: new Date().toISOString()
        };
        imported.push(customer);
      }

      callback({ success: true, count: imported.length, customers: imported, message: '成功导入 ' + imported.length + ' 条客户' });
    };
    reader.readAsText(file);
  }

  function findIndex(headers, aliases) {
    for (var i = 0; i < aliases.length; i++) {
      var idx = headers.findIndex(function(h) { return h.trim().toLowerCase() === aliases[i].toLowerCase(); });
      if (idx >= 0) return idx;
    }
    return -1;
  }

  function parseCSVLine(line) {
    var result = [];
    var current = '';
    var inQuotes = false;
    for (var i = 0; i < line.length; i++) {
      var ch = line[i];
      if (ch === '"') { inQuotes = !inQuotes; }
      else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += ch; }
    }
    result.push(current.trim());
    return result;
  }

  function downloadFile(content, filename, mimeType) {
    var blob = new Blob([content], { type: mimeType });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  }

  return {
    exportProductsCSV: exportProductsCSV,
    exportCustomersCSV: exportCustomersCSV,
    exportOrdersCSV: exportOrdersCSV,
    importProductsCSV: importProductsCSV,
    importCustomersCSV: importCustomersCSV
  };
})();


// ============ UI 渲染函数 ============

// ---- AI 智能分析面板渲染 ----
window.renderAIDashboard = function() {
  var container = document.getElementById('ai-dashboard-content');
  if (!container) return;

  var products = filterByStore(state.products);
  var orders = filterByStore(state.orders);
  var diagnosis = AIEngine.diagnoseInventory(products, orders);
  var hotProducts = AIEngine.predictHotProducts(products, orders);
  var restockList = AIEngine.suggestRestock(products, orders);
  var upcoming = MarketingCalendar.getUpcoming(30);
  var seasonalTips = MarketingCalendar.getSeasonalTips();

  var html = '';

  // 综合健康分
  var scoreColor = diagnosis.score >= 70 ? '#2ecc71' : (diagnosis.score >= 40 ? '#f39c12' : '#e74c3c');
  html += '<div class="ai-section">';
  html += '<div class="ai-score-card">';
  html += '<div class="ai-score-circle" style="border-color:' + scoreColor + '">';
  html += '<span class="ai-score-num" style="color:' + scoreColor + '">' + diagnosis.score + '</span>';
  html += '<span class="ai-score-label">健康分</span></div>';
  html += '<div class="ai-score-stats">';
  html += '<div class="ai-stat"><span class="ai-stat-val">' + diagnosis.turnoverDays + '天</span><span>平均周转</span></div>';
  html += '<div class="ai-stat"><span class="ai-stat-val">¥' + fmtMoney(diagnosis.totalValue) + '</span><span>库存价值</span></div>';
  html += '<div class="ai-stat"><span class="ai-stat-val">' + diagnosis.profitMargin + '%</span><span>毛利率</span></div>';
  html += '</div></div></div>';

  // 智能建议
  if (diagnosis.suggestions.length) {
    html += '<div class="ai-section"><h4 class="ai-section-title">💡 智能建议</h4>';
    diagnosis.suggestions.forEach(function(s) {
      html += '<div class="ai-suggestion" onclick="navTo(\'' + s.action + '\')">';
      html += '<span class="ai-sug-icon">' + s.icon + '</span>';
      html += '<div><strong>' + s.title + '</strong><br><small>' + s.desc + '</small></div>';
      html += '</div>';
    });
    html += '</div>';
  }

  // 爆款预测
  if (hotProducts.length) {
    html += '<div class="ai-section"><h4 class="ai-section-title">🔥 爆款预测 TOP5</h4>';
    html += '<div class="ai-list">';
    hotProducts.slice(0, 5).forEach(function(p, i) {
      var badge = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : (i + 1)));
      html += '<div class="ai-list-item"><span class="ai-rank">' + badge + '</span>';
      html += '<span class="ai-item-name">' + escapeHTML(p.name) + '</span>';
      html += '<span class="ai-item-meta">库存 ' + p.stock + ' | 评分 ' + p.score + '</span></div>';
    });
    html += '</div></div>';
  }

  // 滞销品预警
  if (diagnosis.slowMoving.length) {
    html += '<div class="ai-section"><h4 class="ai-section-title">📉 滞销预警</h4>';
    html += '<div class="ai-list">';
    diagnosis.slowMoving.slice(0, 5).forEach(function(p) {
      html += '<div class="ai-list-item ai-warn"><span class="ai-item-name">' + escapeHTML(p.name) + '</span>';
      html += '<span class="ai-item-meta">库存 ' + p.stock + ' | ' + p.daysToSell + '天未售</span>';
      html += '<small style="color:#e74c3c">' + p.suggestion + '</small></div>';
    });
    html += '</div></div>';
  }

  // 低库存预警
  if (diagnosis.lowStock.length) {
    html += '<div class="ai-section"><h4 class="ai-section-title">⚠️ 低库存预警</h4>';
    html += '<div class="ai-list">';
    diagnosis.lowStock.slice(0, 5).forEach(function(p) {
      html += '<div class="ai-list-item ai-warn"><span class="ai-item-name">' + escapeHTML(p.name) + '</span>';
      html += '<span class="ai-item-meta">库存 ' + p.stock + '/' + p.warningStock + '</span></div>';
    });
    html += '</div></div>';
  }

  // 补货建议
  if (restockList.length) {
    html += '<div class="ai-section"><h4 class="ai-section-title">📦 智能补货建议</h4>';
    html += '<div class="ai-list">';
    restockList.slice(0, 5).forEach(function(r) {
      var urgencyClass = r.urgency === 'urgent' ? 'ai-urgent' : '';
      html += '<div class="ai-list-item ' + urgencyClass + '"><span class="ai-item-name">' + escapeHTML(r.name) + '</span>';
      html += '<span class="ai-item-meta">建议补货 ' + r.suggestedRestock + ' 件</span></div>';
    });
    html += '</div></div>';
  }

  // 营销日历
  html += '<div class="ai-section"><h4 class="ai-section-title">📅 营销日历</h4>';
  if (upcoming.length) {
    html += '<div class="ai-list">';
    upcoming.slice(0, 5).forEach(function(f) {
      html += '<div class="ai-list-item"><span class="ai-item-name">' + f.emoji + ' ' + f.name + '</span>';
      html += '<span class="ai-item-meta">' + f.daysLeft + '天后 | ' + f.activity + '</span></div>';
    });
    html += '</div>';
  }
  // 季节建议
  seasonalTips.forEach(function(t) {
    html += '<div class="ai-suggestion"><span class="ai-sug-icon">' + t.icon + '</span>';
    html += '<div><strong>' + t.title + '</strong><br><small>' + t.desc + '</small></div></div>';
  });
  html += '</div>';

  container.innerHTML = html;
};

// ---- AI 智能入库 UI ----
window.renderSmartStockIn = function() {
  var container = document.getElementById('smart-stockin-content');
  if (!container) return;
  container.innerHTML = '<div class="ai-stockin-area">' +
    '<div class="ai-stockin-drop" id="ocr-drop-zone">' +
      '<div class="ai-stockin-icon">📸</div>' +
      '<div class="ai-stockin-text">点击拍照或拖拽吊牌图片</div>' +
      '<small>支持 JPG/PNG，AI 自动识别商品信息</small>' +
      '<input type="file" id="ocr-file-input" accept="image/*" capture="environment" style="display:none" onchange="handleOCRFile(this)" />' +
    '</div>' +
    '<div id="ocr-result" class="ai-ocr-result" style="display:none"></div>' +
    '<div id="ocr-loading" class="ai-ocr-loading" style="display:none">' +
      '<div class="ai-spinner"></div><span>AI 正在识别商品信息...</span></div>' +
  '</div>';

  // 点击上传
  document.getElementById('ocr-drop-zone').onclick = function() {
    document.getElementById('ocr-file-input').click();
  };
};

window.handleOCRFile = function(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    // 显示图片预览
    var resultDiv = document.getElementById('ocr-result');
    var loadingDiv = document.getElementById('ocr-loading');
    loadingDiv.style.display = 'flex';
    resultDiv.style.display = 'none';

    SmartStockIn.simulateOCR(e.target.result).then(function(data) {
      loadingDiv.style.display = 'none';
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '<div class="ocr-card">' +
        '<div class="ocr-card-header">✅ AI 识别结果</div>' +
        '<div class="ocr-field"><label>商品名称</label><span>' + escapeHTML(data.name) + '</span></div>' +
        '<div class="ocr-field"><label>款号</label><span>' + data.code + '</span></div>' +
        '<div class="ocr-field"><label>分类</label><span>' + data.category + '</span></div>' +
        '<div class="ocr-field"><label>颜色</label><span>' + data.color + '</span></div>' +
        '<div class="ocr-field"><label>尺码</label><span>' + data.size + '</span></div>' +
        '<div class="ocr-field"><label>建议售价</label><span style="color:var(--accent);font-weight:bold">¥' + data.price + '</span></div>' +
        '<button class="btn-primary" style="width:100%;margin-top:12px" onclick="confirmOCRProduct(\'' + data.name + '\',\'' + data.code + '\',\'' + data.category + '\',' + data.price + ')">确认入库</button>' +
        '</div>';
    });
  };
  reader.readAsDataURL(input.files[0]);
};

window.confirmOCRProduct = function(name, code, category, price) {
  var product = {
    id: 'p_ocr_' + Date.now(),
    storeId: state.currentStoreId,
    name: name, code: code, category: category,
    price: price, retailPrice: price,
    purchasePrice: Math.round(price * 0.4),
    stock: 0, warningStock: 5,
    createdAt: new Date().toISOString()
  };
  state.products.push(product);
  API.createProduct(product).then(function() {
    renderProducts();
    toast('商品已入库：' + name, 'success');
    document.getElementById('ocr-result').style.display = 'none';
  }).catch(function(err) { toast(err.message, 'error'); });
};

// ---- AI 穿搭推荐 UI ----
window.renderStylistAI = function() {
  var container = document.getElementById('stylist-content');
  if (!container) return;

  var products = filterByStore(state.products);
  var recommendations = StylistAI.recommend(products);

  if (!recommendations.length) {
    container.innerHTML = '<div class="empty-state"><div class="empty-icon">👗</div><div class="empty-text">商品品类不足</div><small>至少需要2个不同品类的商品才能推荐搭配</small></div>';
    return;
  }

  container.innerHTML = '<div class="ai-section"><h4 class="ai-section-title">🎨 AI 智能穿搭推荐</h4></div>' +
    recommendations.map(function(r, idx) {
      var itemsHtml = r.items.map(function(item) {
        return '<div class="stylist-item" onclick="navTo(\'products\')">' +
          '<div class="stylist-item-img" style="background:' + getRandomPastel() + '">' + (item.category || '👗').charAt(0) + '</div>' +
          '<div class="stylist-item-name">' + escapeHTML(item.name) + '</div>' +
          '<div class="stylist-item-price">¥' + (item.retailPrice || item.price) + '</div></div>';
      }).join('');

      return '<div class="stylist-card">' +
        '<div class="stylist-header">' +
          '<span class="stylist-rank">#' + (idx + 1) + '</span>' +
          '<span class="stylist-desc">' + r.desc + '</span>' +
          '<span class="stylist-score">匹配度 ' + r.score + '%</span>' +
        '</div>' +
        '<div class="stylist-items">' + itemsHtml + '</div>' +
        '<div class="stylist-total">套装总价：¥' + r.items.reduce(function(s, i) { return s + (i.retailPrice || i.price || 0); }, 0) + '</div>' +
      '</div>';
    }).join('');

  // 客户选择器
  var custHtml = '<div class="ai-section" style="margin-top:16px"><h4 class="ai-section-title">👤 为客户推荐</h4>';
  var customers = filterByStore(state.customers);
  if (customers.length) {
    custHtml += '<select id="stylist-customer" style="width:100%;padding:8px;border-radius:8px;border:1px solid var(--border);margin-bottom:8px">' +
      '<option value="">-- 选择客户 --</option>' +
      customers.map(function(c) { return '<option value="' + c.id + '">' + escapeHTML(c.name) + ' (' + (c.level || '普通') + ')</option>'; }).join('') +
      '</select>' +
      '<button class="btn-primary" style="width:100%" onclick="recommendForCustomer()">🎯 智能推荐</button>';
  }
  custHtml += '</div>';
  container.innerHTML += custHtml;
};

window.recommendForCustomer = function() {
  var cid = document.getElementById('stylist-customer').value;
  if (!cid) { toast('请选择客户', 'error'); return; }
  var customer = state.customers.find(function(c) { return c.id === cid; });
  if (!customer) return;
  var products = filterByStore(state.products);
  var recs = StylistAI.recommendForCustomer(customer, products);
  if (!recs.length) {
    toast('暂无合适的搭配推荐', 'info');
    return;
  }
  var rec = recs[0];
  var itemsList = rec.items.map(function(i) { return escapeHTML(i.name); }).join(' + ');
  toast('为 ' + customer.name + ' 推荐：' + rec.desc + '（' + itemsList + '）', 'success');
};

function getRandomPastel() {
  var colors = ['#FFE0E0', '#E0F0FF', '#E8F5E9', '#FFF3E0', '#F3E5F5', '#E0F7FA', '#FFF9C4', '#FCE4EC'];
  return colors[Math.floor(Math.random() * colors.length)];
}

// ---- 拼团活动 UI ----
window.renderGroupBuy = function() {
  var container = document.getElementById('group-buy-list');
  if (!container) return;

  var groups = GroupBuy.getActiveGroups();
  var products = filterByStore(state.products);

  // 产品选择器
  var prodOpts = products.map(function(p) {
    return '<option value="' + p.id + '">' + escapeHTML(p.name) + ' ¥' + (p.retailPrice || p.price) + '</option>';
  }).join('');

  var html = '<div class="ai-section"><h4 class="ai-section-title">👥 创建拼团</h4>' +
    '<div class="group-buy-form">' +
      '<div class="form-row"><label>选择商品</label><select id="gb-product">' + prodOpts + '</select></div>' +
      '<div class="form-row"><label>拼团价</label><input type="number" id="gb-price" placeholder="建议为原价6折" /></div>' +
      '<div class="form-row"><label>成团人数</label><select id="gb-count"><option value="2">2人团</option><option value="3" selected>3人团</option><option value="5">5人团</option><option value="10">10人团</option></select></div>' +
      '<div class="form-row"><label>持续时间</label><select id="gb-duration"><option value="24">24小时</option><option value="48" selected>48小时</option><option value="72">72小时</option></select></div>' +
      '<button class="btn-primary" style="width:100%" onclick="createGroupBuy()">🚀 发起拼团</button>' +
    '</div></div>';

  // 进行中的拼团
  html += '<div class="ai-section"><h4 class="ai-section-title">🔥 进行中的拼团</h4>';
  if (groups.length === 0) {
    html += '<div class="empty-state"><div class="empty-text">暂无拼团活动</div></div>';
  } else {
    groups.forEach(function(g) {
      var progress = Math.round(g.currentCount / g.requiredCount * 100);
      var timeLeft = Math.max(0, Math.round((g.endTime - Date.now()) / 3600000));
      html += '<div class="group-buy-card">' +
        '<div class="gb-header">' +
          '<span class="gb-name">' + escapeHTML(g.productName) + '</span>' +
          '<span class="gb-badge">' + g.currentCount + '/' + g.requiredCount + '人</span>' +
        '</div>' +
        '<div class="gb-prices"><span class="gb-price">¥' + g.groupPrice + '</span><span class="gb-original">¥' + g.productPrice + '</span></div>' +
        '<div class="gb-progress-bar"><div class="gb-progress-fill" style="width:' + progress + '%"></div></div>' +
        '<div class="gb-footer">' +
          '<span>⏰ 剩余 ' + timeLeft + ' 小时</span>' +
          '<button class="btn-mini" onclick="joinGroupBuy(\'' + g.id + '\')">我要参团</button>' +
          '<button class="btn-action btn-delete" onclick="deleteGroupBuy(\'' + g.id + '\')">取消</button>' +
        '</div></div>';
    });
  }
  html += '</div>';

  container.innerHTML = html;
};

window.createGroupBuy = function() {
  var prodId = document.getElementById('gb-product').value;
  var price = parseFloat(document.getElementById('gb-price').value);
  var count = parseInt(document.getElementById('gb-count').value);
  var duration = parseInt(document.getElementById('gb-duration').value);

  if (!prodId) { toast('请选择商品', 'error'); return; }
  var product = state.products.find(function(p) { return p.id === prodId; });
  if (!product) { toast('商品不存在', 'error'); return; }
  if (!price || price <= 0) { price = Math.round((product.retailPrice || product.price) * 0.6); }

  GroupBuy.createGroup(product, {
    groupPrice: price,
    requiredCount: count,
    duration: duration
  });
  renderGroupBuy();
  toast('拼团已发起！' + count + '人团 ¥' + price, 'success');
};

window.joinGroupBuy = function(groupId) {
  var name = prompt('请输入您的姓名：', '顾客');
  if (!name) return;
  var result = GroupBuy.joinGroup(groupId, name.trim());
  if (result.success) {
    renderGroupBuy();
    if (result.isSuccess) {
      toast('🎉 拼团成功！', 'success');
    } else {
      toast(result.message + '，还差 ' + result.needMore + ' 人成团', 'info');
    }
  } else {
    toast(result.message, 'error');
  }
};

window.deleteGroupBuy = function(groupId) {
  GroupBuy.deleteGroup(groupId);
  renderGroupBuy();
  toast('拼团已取消', 'info');
};

// ---- RFM 客户分析 UI ----
window.renderRFMAnalysis = function() {
  var container = document.getElementById('rfm-content');
  if (!container) return;

  var customers = filterByStore(state.customers);
  var orders = filterByStore(state.orders);
  var analysis = RFMAnalysis.analyze(customers, orders);

  var html = '<div class="ai-section"><h4 class="ai-section-title">📊 客户RFM分析</h4></div>';

  // 概览卡片
  html += '<div class="rfm-overview">' +
    '<div class="rfm-card" style="border-left:4px solid #e74c3c">' +
      '<div class="rfm-card-num">' + analysis.highValue + '</div><div class="rfm-card-label">高价值客户</div></div>' +
    '<div class="rfm-card" style="border-left:4px solid #2ecc71">' +
      '<div class="rfm-card-num">' + analysis.loyal + '</div><div class="rfm-card-label">忠诚客户</div></div>' +
    '<div class="rfm-card" style="border-left:4px solid #f39c12">' +
      '<div class="rfm-card-num">' + analysis.atRisk + '</div><div class="rfm-card-label">流失风险</div></div>' +
    '<div class="rfm-card" style="border-left:4px solid #3498db">' +
      '<div class="rfm-card-num">' + analysis.newCust + '</div><div class="rfm-card-label">新客户</div></div>' +
  '</div>';

  // 高价值客户列表
  if (analysis.segments.highValue.length) {
    html += '<div class="ai-section"><h4 class="ai-section-title">💎 高价值客户</h4><div class="ai-list">';
    analysis.segments.highValue.forEach(function(c) {
      html += '<div class="ai-list-item"><span class="ai-item-name">' + escapeHTML(c.name) + '</span>';
      html += '<span class="ai-item-meta">消费 ¥' + fmtMoney(c.monetary) + ' | ' + c.frequency + '次</span></div>';
    });
    html += '</div></div>';
  }

  // 流失风险客户
  if (analysis.segments.atRisk.length) {
    html += '<div class="ai-section"><h4 class="ai-section-title">⚠️ 流失风险客户</h4><div class="ai-list">';
    analysis.segments.atRisk.forEach(function(c) {
      html += '<div class="ai-list-item ai-warn"><span class="ai-item-name">' + escapeHTML(c.name) + '</span>';
      html += '<span class="ai-item-meta">' + c.recency + '天未消费</span></div>';
    });
    html += '</div></div>';
  }

  // 摘要
  html += '<div class="ai-section"><h4 class="ai-section-title">📈 分析摘要</h4>' +
    '<div class="ai-list">' +
    '<div class="ai-list-item"><span>总客户数</span><span>' + analysis.total + '</span></div>' +
    '<div class="ai-list-item"><span>高价值占比</span><span>' + analysis.summary.highValueRate + '%</span></div>' +
    '<div class="ai-list-item"><span>流失风险占比</span><span>' + analysis.summary.atRiskRate + '%</span></div>' +
    '<div class="ai-list-item"><span>累计营收</span><span>¥' + fmtMoney(analysis.summary.totalRevenue) + '</span></div>' +
    '</div></div>';

  container.innerHTML = html;
};

// ---- Excel 导入导出 UI ----
window.renderExcelTool = function() {
  var container = document.getElementById('excel-content');
  if (!container) return;

  container.innerHTML = '<div class="ai-section"><h4 class="ai-section-title">📥 数据导入</h4>' +
    '<div class="excel-card" onclick="document.getElementById(\'import-products-file\').click()">' +
      '<div class="excel-icon">📦</div><div><strong>导入商品</strong><br><small>支持 CSV 格式</small></div>' +
      '<input type="file" id="import-products-file" accept=".csv" style="display:none" onchange="handleImportProducts(this)" />' +
    '</div>' +
    '<div class="excel-card" onclick="document.getElementById(\'import-customers-file\').click()">' +
      '<div class="excel-icon">👥</div><div><strong>导入客户</strong><br><small>支持 CSV 格式</small></div>' +
      '<input type="file" id="import-customers-file" accept=".csv" style="display:none" onchange="handleImportCustomers(this)" />' +
    '</div>' +
  '</div>' +

  '<div class="ai-section"><h4 class="ai-section-title">📤 数据导出</h4>' +
    '<div class="excel-card" onclick="exportProducts()">' +
      '<div class="excel-icon">📦</div><div><strong>导出商品</strong><br><small>CSV 格式</small></div></div>' +
    '<div class="excel-card" onclick="exportCustomers()">' +
      '<div class="excel-icon">👥</div><div><strong>导出客户</strong><br><small>CSV 格式</small></div></div>' +
    '<div class="excel-card" onclick="exportOrders()">' +
      '<div class="excel-icon">📋</div><div><strong>导出订单</strong><br><small>CSV 格式</small></div></div>' +
  '</div>';
};

window.handleImportProducts = function(input) {
  if (!input.files || !input.files[0]) return;
  ExcelTool.importProductsCSV(input.files[0], function(result) {
    if (result.success) {
      result.products.forEach(function(p) {
        state.products.push(p);
        API.createProduct(p).catch(function() {});
      });
      renderProducts();
    }
    toast(result.message, result.success ? 'success' : 'error');
  });
};

window.handleImportCustomers = function(input) {
  if (!input.files || !input.files[0]) return;
  ExcelTool.importCustomersCSV(input.files[0], function(result) {
    if (result.success) {
      result.customers.forEach(function(c) {
        state.customers.push(c);
        API.createCustomer(c).catch(function() {});
      });
      renderCustomers();
    }
    toast(result.message, result.success ? 'success' : 'error');
  });
};

window.exportProducts = function() {
  ExcelTool.exportProductsCSV(filterByStore(state.products));
  toast('商品数据已导出', 'success');
};

window.exportCustomers = function() {
  ExcelTool.exportCustomersCSV(filterByStore(state.customers));
  toast('客户数据已导出', 'success');
};

window.exportOrders = function() {
  ExcelTool.exportOrdersCSV(filterByStore(state.orders));
  toast('订单数据已导出', 'success');
};

// ---- 导航增强 ----
(function() {
  // 监听 navTo 的增强调用
  var origNavTo = window.navTo;
  window.navTo = function(view) {
    if (origNavTo) origNavTo(view);
    // 渲染新视图
    setTimeout(function() {
      if (view === 'ai-dashboard') renderAIDashboard();
      else if (view === 'smart-stockin') renderSmartStockIn();
      else if (view === 'stylist') renderStylistAI();
      else if (view === 'group-buy') renderGroupBuy();
      else if (view === 'rfm') renderRFMAnalysis();
      else if (view === 'excel') renderExcelTool();
    }, 50);
  };
})();

// ---- 快捷键支持 ----
document.addEventListener('keydown', function(e) {
  if (e.ctrlKey || e.metaKey) {
    switch(e.key) {
      case '1': e.preventDefault(); window.navTo('dashboard'); break;
      case '2': e.preventDefault(); window.navTo('products'); break;
      case '3': e.preventDefault(); window.navTo('customers'); break;
      case '4': e.preventDefault(); window.navTo('ai-dashboard'); break;
      case '5': e.preventDefault(); window.navTo('flash-sale'); break;
    }
  }
});

console.log('🤖 衫云智管 AI 智能引擎 v3.0 已加载');
console.log('  ✅ AI货盘诊断 (健康分/滞销预警/爆款预测)');
console.log('  ✅ AI智能入库 (OCR拍照识别)');
console.log('  ✅ AI穿搭推荐 (智能搭配)');
console.log('  ✅ 拼团活动系统');
console.log('  ✅ RFM客户分析');
console.log('  ✅ 营销日历');
console.log('  ✅ Excel批量导入导出');