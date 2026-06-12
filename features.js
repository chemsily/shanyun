/* ========================================
   衫云智管 高级功能模块 (features.js)
   竞品对标：秦丝 AI 扫码 + 有赞 CRM 画像 + 店小友 轻量交互
   新增：条码/照片/海报/自定义字段/高级优惠券/系统设置
   ======================================== */

// ============ IndexedDB 照片存储 ============
const PhotoDB = (function() {
  var DB_NAME = 'shanyun_photos', DB_VER = 1, db = null;

  function open() {
    return new Promise(function(resolve, reject) {
      var req = indexedDB.open(DB_NAME, DB_VER);
      req.onupgradeneeded = function(e) {
        var d = e.target.result;
        if (!d.objectStoreNames.contains('photos')) {
          d.createObjectStore('photos', { keyPath: 'id' });
        }
      };
      req.onsuccess = function(e) { db = e.target.result; resolve(db); };
      req.onerror = function(e) { reject(e); };
    });
  }

  function savePhoto(id, base64) {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction('photos', 'readwrite');
        tx.objectStore('photos').put({ id: id, data: base64, updatedAt: Date.now() });
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(tx.error); };
      });
    });
  }

  function getPhoto(id) {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction('photos', 'readonly');
        var req = tx.objectStore('photos').get(id);
        req.onsuccess = function() { resolve(req.result ? req.result.data : null); };
        req.onerror = function() { reject(req.error); };
      });
    });
  }

  function deletePhoto(id) {
    return open().then(function(d) {
      return new Promise(function(resolve, reject) {
        var tx = d.transaction('photos', 'readwrite');
        tx.objectStore('photos').delete(id);
        tx.oncomplete = function() { resolve(); };
        tx.onerror = function() { reject(tx.error); };
      });
    });
  }

  return { open: open, save: savePhoto, get: getPhoto, delete: deletePhoto };
})();


// ============ 条码自动生成 (Canvas EAN-13 + Code128) ============
var Barcode = (function() {
  // EAN-13 编码表
  var L = ['0001101','0011001','0010011','0111101','0100011','0110001','0101111','0111011','0110111','0001011'];
  var R = ['1110010','1100110','1101100','1000010','1011100','1001110','1010000','1000100','1001000','1110100'];
  var G = ['0100111','0110011','0011011','0100001','0011101','0111001','0000101','0010001','0001001','0010111'];
  var PARITY = [
    'LLLLLL','LLGLGG','LLGGLG','LLGGGL','LGLLGG','LGGLLG','LGGGLL','LGLGLG','LGLGGL','LGGLGL'
  ];

  function checksum(digits) {
    var sum = 0;
    for (var i = 0; i < 12; i++) sum += parseInt(digits[i]) * (i % 2 === 0 ? 1 : 3);
    return (10 - (sum % 10)) % 10;
  }

  function generateEAN13(code) {
    var digits = String(code).replace(/\D/g, '');
    if (digits.length < 12) {
      digits = digits.padStart(12, '0');
    }
    digits = digits.substring(0, 12) + checksum(digits);
    var first = parseInt(digits[0]);
    var pattern = PARITY[first];
    var bars = '101'; // start
    for (var i = 0; i < 6; i++) {
      var d = parseInt(digits[i + 1]);
      bars += (pattern[i] === 'L' ? L[d] : G[d]);
    }
    bars += '01010'; // middle
    for (var j = 0; j < 6; j++) {
      bars += R[parseInt(digits[j + 7])];
    }
    bars += '101'; // end
    return { digits: digits, bars: bars };
  }

  function drawEAN13(canvas, code, options) {
    options = options || {};
    var result = generateEAN13(code);
    var W = options.width || 300, H = options.height || 120;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);

    var totalBars = result.bars.length;
    var barW = W / totalBars;
    var barTop = 10, barBottom = H - 30;
    var x = 0;

    for (var i = 0; i < totalBars; i++) {
      if (result.bars[i] === '1') {
        var bh = barBottom;
        if (i < 3 || i > totalBars - 4) bh = H - 15; // start/end longer
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, barTop, barW + 0.5, bh - barTop);
      }
      x += barW;
    }

    // 数字
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 11px "Courier New", monospace';
    ctx.textAlign = 'center';
    var mid = W / 2;
    // 左侧数字 (digits[0] + digits[1..6])
    ctx.textAlign = 'left';
    ctx.fillText(result.digits.substring(0, 1), 3, H - 2);
    var leftBarsLen = (3 + 6 * 7) * barW;
    var rightBarsLen = totalBars - leftBarsLen - 5;
    for (var k = 0; k < 6; k++) {
      var digit = result.digits[k + 1];
      var dx = 3 * barW + (k * 7 + 3.5) * barW;
      ctx.textAlign = 'center';
      ctx.fillText(digit, dx, H - 2);
    }
    // 右侧数字
    for (var m = 0; m < 6; m++) {
      var digit = result.digits[m + 7];
      var dx = (leftBarsLen + 5 * barW) + (m * 7 + 3.5) * barW;
      ctx.textAlign = 'center';
      ctx.fillText(digit, dx, H - 2);
    }

    return result.digits;
  }

  function randomEAN() {
    var prefix = '69'; // 中国
    var body = '';
    for (var i = 0; i < 10; i++) body += Math.floor(Math.random() * 10);
    return prefix + body;
  }

  return { generateEAN13: generateEAN13, drawEAN13: drawEAN13, randomEAN: randomEAN, checksum: checksum };
})();


// ============ 模特试穿海报生成器 (Canvas 合成) ============
var PosterGenerator = (function() {
  var TEMPLATES = [
    { id: 'fashion-1', name: '时尚都市', bg: '#F8E5E5', accent: '#C0392B', desc: '红底白字 · 都市街头风' },
    { id: 'fashion-2', name: '清新自然', bg: '#E8F5E9', accent: '#2E7D32', desc: '绿底 · 自然清新风' },
    { id: 'fashion-3', name: '轻奢优雅', bg: '#FFF3E0', accent: '#E65100', desc: '暖橙底 · 轻奢质感' },
    { id: 'fashion-4', name: '极简黑白', bg: '#FAFAFA', accent: '#212121', desc: '白底黑字 · 极简高端' },
    { id: 'fashion-5', name: '霓虹派对', bg: '#1A1A2E', accent: '#E94560', desc: '深蓝底 · 霓虹灯效' },
    { id: 'fashion-6', name: '樱花季', bg: '#FCE4EC', accent: '#C2185B', desc: '樱花粉 · 浪漫季节' }
  ];

  function generate(product, options) {
    options = options || {};
    var tpl = TEMPLATES.find(function(t) { return t.id === options.templateId; }) || TEMPLATES[0];
    var canvas = document.createElement('canvas');
    var W = 800, H = 1000;
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');

    // 背景
    ctx.fillStyle = tpl.bg;
    ctx.fillRect(0, 0, W, H);

    // 装饰线
    ctx.strokeStyle = tpl.accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 4]);
    ctx.strokeRect(30, 30, W - 60, H - 60);
    ctx.setLineDash([]);
    ctx.lineWidth = 4;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // 产品图片区域 或 占位
    if (options.productImage) {
      var img = new Image();
      img.src = options.productImage;
      // 同步绘制需要图片已加载，这里留给调用方处理
      try {
        ctx.drawImage(img, 180, 120, 440, 560);
      } catch(e) {
        drawPlaceholder(ctx, 180, 120, 440, 560, tpl.accent);
      }
    } else {
      drawPlaceholder(ctx, 180, 120, 440, 560, tpl.accent);
    }

    // 产品名称
    ctx.fillStyle = '#212121';
    ctx.font = 'bold 36px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(product.name || '热销新品', W / 2, 730);

    // 价格
    ctx.fillStyle = tpl.accent;
    ctx.font = 'bold 56px "PingFang SC", "Microsoft YaHei", sans-serif';
    var priceText = '¥' + (product.retailPrice || product.price || '???');
    ctx.fillText(priceText, W / 2, 810);

    // 副标题
    ctx.fillStyle = '#666';
    ctx.font = '20px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText(options.subtitle || '限量发售 · 先到先得', W / 2, 855);

    // 底部品牌
    ctx.fillStyle = tpl.accent;
    ctx.font = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('衫云智管 · 专注服装批发零售', W / 2, 910);

    // 条码
    ctx.fillStyle = '#333';
    ctx.font = '14px monospace';
    ctx.fillText('商品编码：' + (product.code || 'N/A'), W / 2, 945);

    return canvas;
  }

  function drawPlaceholder(ctx, x, y, w, h, color) {
    ctx.fillStyle = 'rgba(0,0,0,0.04)';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]);
    ctx.fillStyle = '#999';
    ctx.font = '20px "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('👗 产品图片预览区', x + w / 2, y + h / 2 - 10);
    ctx.fillText('上传照片自动生成', x + w / 2, y + h / 2 + 25);
  }

  function getTemplates() { return TEMPLATES; }

  return { generate: generate, getTemplates: getTemplates };
})();


// ============ 自定义货品字段 ============
function loadCustomFields() {
  try {
    return JSON.parse(localStorage.getItem('shanyun_custom_fields') || '[]');
  } catch(e) { return []; }
}
function saveCustomFields(fields) {
  try { localStorage.setItem('shanyun_custom_fields', JSON.stringify(fields)); } catch(e) {}
}

var FIELD_TYPES = [
  { value: 'text', label: '单行文本' },
  { value: 'number', label: '数字' },
  { value: 'select', label: '下拉选择' },
  { value: 'date', label: '日期' },
  { value: 'textarea', label: '多行文本' }
];

function renderCustomFieldEditor() {
  var fields = loadCustomFields();
  var container = document.getElementById('custom-fields-list');
  if (!container) return;
  if (!fields.length) {
    container.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-text">暂无自定义字段</div><small style="color:var(--text-3)">点击下方按钮添加</small></div>';
    return;
  }
  container.innerHTML = fields.map(function(f, idx) {
    var typeLabel = (FIELD_TYPES.find(function(t) { return t.value === f.type; }) || {}).label || f.type;
    return '<div class="cf-item">' +
      '<div class="cf-info">' +
        '<strong>' + escapeHTML(f.label) + '</strong>' +
        '<small>' + typeLabel + (f.options ? ' · 选项: ' + (f.options || '').split(',').join(', ') : '') + '</small>' +
        '<small>' + (f.required ? '必填' : '选填') + '</small>' +
      '</div>' +
      '<div class="cf-actions">' +
        '<button class="btn-action" onclick="editCustomField(' + idx + ')">编辑</button>' +
        '<button class="btn-action btn-delete" onclick="deleteCustomField(' + idx + ')">删除</button>' +
      '</div></div>';
  }).join('');
}

window.addCustomField = function() {
  var label = document.getElementById('cf-label').value.trim();
  var type = document.getElementById('cf-type').value;
  var options = document.getElementById('cf-options').value.trim();
  var required = document.getElementById('cf-required').checked;
  if (!label) { toast('请输入字段名称', 'error'); return; }
  var fields = loadCustomFields();
  fields.push({ label: label, type: type, options: options, required: required });
  saveCustomFields(fields);
  document.getElementById('cf-label').value = '';
  document.getElementById('cf-options').value = '';
  document.getElementById('cf-required').checked = false;
  renderCustomFieldEditor();
  toast('自定义字段已添加：' + label, 'success');
};

window.deleteCustomField = function(idx) {
  if (!confirm('确认删除此自定义字段？已有数据中的该字段不会被删除。')) return;
  var fields = loadCustomFields();
  var label = fields[idx].label;
  fields.splice(idx, 1);
  saveCustomFields(fields);
  renderCustomFieldEditor();
  toast('已删除字段：' + label, 'info');
};

window.editCustomField = function(idx) {
  var fields = loadCustomFields();
  var f = fields[idx];
  document.getElementById('cf-label').value = f.label;
  document.getElementById('cf-type').value = f.type;
  document.getElementById('cf-options').value = f.options || '';
  document.getElementById('cf-required').checked = !!f.required;
  // 简单做法：删掉再添加
  fields.splice(idx, 1);
  saveCustomFields(fields);
  renderCustomFieldEditor();
  toast('字段已加载到编辑器，修改后重新添加', 'info');
};

function renderCustomFieldsInput(product) {
  var fields = loadCustomFields();
  if (!fields.length) return '';
  var customData = (product && product.customFields) || {};
  return fields.map(function(f) {
    var val = customData[f.label] || '';
    var inputHtml = '';
    if (f.type === 'select' && f.options) {
      var opts = f.options.split(',').map(function(o) { return o.trim(); });
      inputHtml = '<select id="cust-' + f.label + '"><option value="">请选择</option>' +
        opts.map(function(o) { return '<option value="' + o + '"' + (val === o ? ' selected' : '') + '>' + o + '</option>'; }).join('') +
        '</select>';
    } else if (f.type === 'textarea') {
      inputHtml = '<textarea id="cust-' + f.label + '" rows="2">' + escapeHTML(val) + '</textarea>';
    } else if (f.type === 'number') {
      inputHtml = '<input type="number" id="cust-' + f.label + '" value="' + val + '" />';
    } else if (f.type === 'date') {
      inputHtml = '<input type="date" id="cust-' + f.label + '" value="' + val + '" />';
    } else {
      inputHtml = '<input type="text" id="cust-' + f.label + '" value="' + escapeHTML(val) + '" />';
    }
    return '<div class="form-row"><label>' + escapeHTML(f.label) + (f.required ? ' <span style="color:#e74c3c">*</span>' : '') + '</label>' +
      '<div class="form-value">' + inputHtml + '</div></div>';
  }).join('');
}

function collectCustomFieldsData() {
  var fields = loadCustomFields();
  var data = {};
  fields.forEach(function(f) {
    var el = document.getElementById('cust-' + f.label);
    if (el) data[f.label] = el.value;
  });
  return data;
}


// ============ 高级优惠券引擎 ============
window.renderAdvancedCoupons = function() {
  var container = document.getElementById('advanced-coupons-list');
  if (!container) return;
  var coupons = (state && state.coupons) || [];
  if (!coupons.length) {
    container.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-icon">🎫</div><div class="empty-text">暂无优惠券</div><small style="color:var(--text-3)">点击上方按钮创建</small></div>';
    return;
  }
  container.innerHTML = coupons.map(function(c) {
    var typeLabel = { 'fixed': '满减', 'percent': '折扣', 'bxgy': '买赠', 'free': '免邮' };
    var typeEmoji = { 'fixed': '💰', 'percent': '🏷️', 'bxgy': '🎁', 'free': '📦' };
    var discountText = c.type === 'percent' ? c.discount + '%' : '减¥' + c.discount;
    var condText = c.minAmount > 0 ? '满¥' + c.minAmount + '可用' : '无门槛';
    return '<div class="coupon-card-advanced">' +
      '<div class="cca-left">' +
        '<div class="cca-type">' + (typeEmoji[c.type] || '🎫') + ' ' + (typeLabel[c.type] || '满减') + '</div>' +
        '<div class="cca-value">' + discountText + '</div>' +
        '<div class="cca-cond">' + condText + '</div>' +
      '</div>' +
      '<div class="cca-right">' +
        '<div class="cca-name">' + escapeHTML(c.name || '未命名') + '</div>' +
        '<div class="cca-meta">有效期：' + (c.validDays || 30) + '天</div>' +
        '<div class="cca-meta">状态：' + (c.status === 0 ? '停用' : '有效') + '</div>' +
        '<div class="cca-actions">' +
          '<button class="btn-action btn-delete" onclick="deleteCouponAdv(\'' + c.id + '\')">删除</button>' +
        '</div>' +
      '</div></div>';
  }).join('');
};

window.createAdvancedCoupon = function() {
  var name = document.getElementById('ac-name').value.trim();
  var type = document.getElementById('ac-type').value;
  var minAmount = parseFloat(document.getElementById('ac-min-amount').value) || 0;
  var discount = parseFloat(document.getElementById('ac-discount').value) || 0;
  var validDays = parseInt(document.getElementById('ac-valid-days').value) || 30;
  if (!name) { toast('请输入优惠券名称', 'error'); return; }
  if (!discount) { toast('请输入优惠力度', 'error'); return; }
  var coupon = { id: 'co_' + Date.now(), storeId: state.currentStoreId, name: name, type: type, minAmount: minAmount, discount: discount, validDays: validDays, status: 1 };
  state.coupons.push(coupon);
  API.createCoupon(coupon).then(function() {
    renderAdvancedCoupons();
    closeModal('modal-coupon-advanced');
    toast('优惠券已创建', 'success');
  }).catch(function(err) { toast(err.message, 'error'); });
};

window.deleteCouponAdv = function(id) {
  state.coupons = state.coupons.filter(function(c) { return c.id !== id; });
  API.deleteCoupon(id).then(function() {
    renderAdvancedCoupons();
    toast('已删除', 'info');
  }).catch(function() {});
};


// ============ 系统个性化设置 ============
function loadSystemSettings() {
  try { return JSON.parse(localStorage.getItem('shanyun_system_settings') || '{}'); } catch(e) { return {}; }
}
function saveSystemSettings(s) {
  try { localStorage.setItem('shanyun_system_settings', JSON.stringify(s)); } catch(e) {}
}

window.renderSystemSettings = function() {
  var s = loadSystemSettings();
  document.getElementById('ss-store-name').value = s.storeName || '';
  document.getElementById('ss-store-phone').value = s.storePhone || '';
  document.getElementById('ss-store-address').value = s.storeAddress || '';
  document.getElementById('ss-receipt-header').value = s.receiptHeader || '衫云智管';
  document.getElementById('ss-receipt-footer').value = s.receiptFooter || '感谢您的惠顾！';
  document.getElementById('ss-theme-color').value = s.themeColor || '#6C5CE7';
  document.getElementById('ss-theme-font').value = s.themeFont || 'default';
  document.getElementById('ss-notif-birthday').checked = s.notifBirthday !== false;
  document.getElementById('ss-notif-lowstock').checked = s.notifLowstock !== false;
  document.getElementById('ss-notif-activity').checked = s.notifActivity !== false;
  document.getElementById('ss-print-paper').value = s.printPaper || '58mm';
};

window.saveSystemSettings = function() {
  var s = {
    storeName: document.getElementById('ss-store-name').value.trim(),
    storePhone: document.getElementById('ss-store-phone').value.trim(),
    storeAddress: document.getElementById('ss-store-address').value.trim(),
    receiptHeader: document.getElementById('ss-receipt-header').value.trim(),
    receiptFooter: document.getElementById('ss-receipt-footer').value.trim(),
    themeColor: document.getElementById('ss-theme-color').value,
    themeFont: document.getElementById('ss-theme-font').value,
    notifBirthday: document.getElementById('ss-notif-birthday').checked,
    notifLowstock: document.getElementById('ss-notif-lowstock').checked,
    notifActivity: document.getElementById('ss-notif-activity').checked,
    printPaper: document.getElementById('ss-print-paper').value
  };
  saveSystemSettings(s);
  applySystemSettings(s);
  closeModal('modal-system-settings');
  toast('系统设置已保存', 'success');
};

function applySystemSettings(s) {
  if (!s) s = loadSystemSettings();
  if (s.themeColor) {
    document.documentElement.style.setProperty('--gradient', 'linear-gradient(135deg, ' + s.themeColor + ', ' + adjustColor(s.themeColor, -30) + ')');
    document.documentElement.style.setProperty('--accent', s.themeColor);
  }
  if (s.storeName) {
    try { state.settings = state.settings || {}; state.settings.storeName = s.storeName; } catch(e) {}
  }
}

function adjustColor(hex, amount) {
  var num = parseInt(hex.replace('#', ''), 16);
  var r = Math.min(255, Math.max(0, (num >> 16) + amount));
  var g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
  var b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
  return '#' + (0x1000000 + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 在 loadState 后调用
setTimeout(function() {
  try { applySystemSettings(); } catch(e) {}
}, 100);


// ============ 海报生成器 UI ============
window.renderPosterGenerator = function() {
  var tplList = document.getElementById('poster-templates');
  if (!tplList) return;
  var templates = PosterGenerator.getTemplates();
  tplList.innerHTML = templates.map(function(t) {
    return '<div class="poster-tpl-item" onclick="selectPosterTemplate(\'' + t.id + '\')" data-tpl="' + t.id + '" style="background:' + t.bg + ';border:2px solid ' + t.accent + '">' +
      '<div class="poster-tpl-name" style="color:' + t.accent + '">' + t.name + '</div>' +
      '<small style="color:#888">' + t.desc + '</small></div>';
  }).join('');
  // 产品选择器
  var prodSelect = document.getElementById('poster-product');
  if (prodSelect) {
    var prods = filterByStore(state.products);
    prodSelect.innerHTML = '<option value="">-- 选择产品 --</option>' +
      prods.map(function(p) { return '<option value="' + p.id + '">' + escapeHTML(p.name) + ' ¥' + (p.retailPrice || p.price) + '</option>'; }).join('');
  }
};

var selectedPosterTpl = 'fashion-1';

window.selectPosterTemplate = function(id) {
  selectedPosterTpl = id;
  document.querySelectorAll('.poster-tpl-item').forEach(function(el) {
    el.style.transform = el.dataset.tpl === id ? 'scale(1.05)' : 'scale(1)';
    el.style.boxShadow = el.dataset.tpl === id ? '0 4px 12px rgba(0,0,0,0.3)' : 'none';
  });
};

window.generatePoster = function() {
  var prodId = document.getElementById('poster-product').value;
  if (!prodId) { toast('请先选择产品', 'error'); return; }
  var prod = state.products.find(function(p) { return p.id === prodId; });
  if (!prod) { toast('产品不存在', 'error'); return; }

  var subtitle = document.getElementById('poster-subtitle').value || '限量发售 · 先到先得';
  var canvas = PosterGenerator.generate(prod, {
    templateId: selectedPosterTpl,
    subtitle: subtitle,
    productImage: null
  });

  // 如果有产品照片，异步加载
  var photoUrl = document.getElementById('poster-photo-preview') ? document.getElementById('poster-photo-preview').src : null;
  if (photoUrl && !photoUrl.includes('data:image/svg')) {
    regeneratePosterWithPhoto(prod, selectedPosterTpl, subtitle, photoUrl);
    return;
  }

  showPosterResult(canvas);
};

function regeneratePosterWithPhoto(prod, tplId, subtitle, photoUrl) {
  var img = new Image();
  img.onload = function() {
    var canvas = PosterGenerator.generate(prod, { templateId: tplId, subtitle: subtitle, productImage: photoUrl });
    showPosterResult(canvas);
  };
  img.onerror = function() {
    var canvas = PosterGenerator.generate(prod, { templateId: tplId, subtitle: subtitle });
    showPosterResult(canvas);
  };
  img.src = photoUrl;
}

function showPosterResult(canvas) {
  var resultDiv = document.getElementById('poster-result');
  if (!resultDiv) return;
  resultDiv.innerHTML = '';
  resultDiv.appendChild(canvas);
  canvas.style.width = '100%';
  canvas.style.maxWidth = '400px';
  canvas.style.borderRadius = '8px';
  canvas.style.boxShadow = '0 8px 30px rgba(0,0,0,0.2)';
  // 下载按钮
  var dlBtn = document.createElement('button');
  dlBtn.className = 'btn-primary';
  dlBtn.style.cssText = 'display:block;margin:12px auto;';
  dlBtn.textContent = '📥 下载海报';
  dlBtn.onclick = function() {
    var link = document.createElement('a');
    link.download = 'poster_' + Date.now() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast('海报已下载', 'success');
  };
  resultDiv.appendChild(dlBtn);
}

window.loadPosterPhoto = function(input) {
  if (!input.files || !input.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var preview = document.getElementById('poster-photo-preview');
    if (preview) {
      preview.src = e.target.result;
      preview.style.display = 'block';
    }
  };
  reader.readAsDataURL(input.files[0]);
};


// ============ 条码生成器 UI ============
window.renderBarcodeGenerator = function() {
  var prodSelect = document.getElementById('barcode-product-v') || document.getElementById('barcode-product');
  if (prodSelect) {
    var prods = filterByStore(state.products);
    prodSelect.innerHTML = '<option value="">-- 选择产品 --</option>' +
      prods.map(function(p) { return '<option value="' + p.id + '">' + escapeHTML(p.name) + '</option>'; }).join('');
  }
};

window.generateBarcode = function() {
  var prodId = (document.getElementById('barcode-product-v') || document.getElementById('barcode-product')).value;
  var barcodeType = (document.getElementById('barcode-type-v') || document.getElementById('barcode-type')).value;
  if (!prodId) { toast('请选择产品', 'error'); return; }
  var prod = state.products.find(function(p) { return p.id === prodId; });
  if (!prod) return;
  var code = prod.code || prod.barcode || Barcode.randomEAN();
  var canvas = document.getElementById('barcode-canvas-v') || document.getElementById('barcode-canvas');
  if (!canvas) return;
  var container = document.getElementById('barcode-result-v') || document.getElementById('barcode-result');
  if (barcodeType === 'ean13') {
    var digits = Barcode.drawEAN13(canvas, code, { width: 350, height: 140 });
    if (container) {
      container.innerHTML = '<div class="barcode-info"><strong>条码类型：</strong>EAN-13</div>' +
        '<div class="barcode-info"><strong>条码数字：</strong>' + digits + '</div>' +
        '<div class="barcode-info"><strong>产品：</strong>' + escapeHTML(prod.name) + '</div>' +
        '<div style="text-align:center;margin-top:12px">' + canvas.outerHTML + '</div>';
    }
  }
  if (!prod.code && !prod.barcode) {
    prod.code = code;
    prod.barcode = code;
    API.updateProduct(prod.id, prod).catch(function() {});
  }
};

window.generateBarcodeV = window.generateBarcode;

window.printBarcode = function() {
  var canvas = document.getElementById('barcode-canvas-v') || document.getElementById('barcode-canvas');
  if (!canvas) return;
  var dataUrl = canvas.toDataURL('image/png');
  var printWin = window.open('', '_blank', 'width=400,height=300');
  printWin.document.write('<html><head><title>打印条码</title></head><body style="margin:0;display:flex;align-items:center;justify-content:center;min-height:100vh;">' +
    '<img src="' + dataUrl + '" style="max-width:350px;" onload="window.print();" /></body></html>');
  printWin.document.close();
};

window.printBarcodeV = window.printBarcode;


// ============ 产品照片管理 ============
window.openPhotoUpload = function(productId) {
  document.getElementById('photo-upload-product-id').value = productId;
  loadProductPhotos(productId);
  openModal('modal-photo-upload');
};

function loadProductPhotos(productId) {
  var gallery = document.getElementById('photo-gallery');
  if (!gallery) return;
  gallery.innerHTML = '<div style="text-align:center;color:var(--text-3);padding:20px">加载中...</div>';
  PhotoDB.get('prod_' + productId).then(function(data) {
    if (data) {
      var photos = JSON.parse(data);
      if (!photos.length) {
        gallery.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-text">暂无照片</div><small style="color:var(--text-3)">点击上传或拍照</small></div>';
        return;
      }
      gallery.innerHTML = photos.map(function(p, i) {
        return '<div class="photo-card" style="position:relative;display:inline-block;margin:4px;">' +
          '<img src="' + p.data + '" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:2px solid var(--border);" onclick="previewPhoto(\'' + productId + '\', ' + i + ')" />' +
          '<button class="btn-delete" style="position:absolute;top:2px;right:2px;padding:2px 6px;font-size:11px;border-radius:4px;" onclick="deleteProductPhoto(\'' + productId + '\', ' + i + ')">✕</button>' +
          '</div>';
      }).join('');
    } else {
      gallery.innerHTML = '<div class="empty-state" style="padding:20px"><div class="empty-text">暂无照片</div><small style="color:var(--text-3)">点击上传或拍照</small></div>';
    }
  });
}

window.uploadProductPhoto = function(input) {
  if (!input.files || !input.files[0]) return;
  var productId = document.getElementById('photo-upload-product-id').value;
  var maxW = 800;
  var reader = new FileReader();
  reader.onload = function(e) {
    // 压缩
    var img = new Image();
    img.onload = function() {
      var ratio = Math.min(1, maxW / Math.max(img.width, img.height));
      var canvas = document.createElement('canvas');
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      var base64 = canvas.toDataURL('image/jpeg', 0.75);
      savePhotoToProduct(productId, base64);
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(input.files[0]);
};

function savePhotoToProduct(productId, base64) {
  var key = 'prod_' + productId;
  PhotoDB.get(key).then(function(data) {
    var photos = data ? JSON.parse(data) : [];
    photos.push({ data: base64, time: Date.now() });
    return PhotoDB.save(key, JSON.stringify(photos));
  }).then(function() {
    loadProductPhotos(productId);
    // 更新产品 photoCount
    PhotoDB.get('prod_' + productId).then(function(d) {
      var ps = d ? JSON.parse(d) : [];
      var prod = state.products.find(function(p) { return p.id === productId; });
      if (prod) {
        try { prod.photoCount = ps.length; } catch(e) {}
      }
      renderProducts();
      toast('照片已上传 (' + ps.length + ' 张)', 'success');
    });
  });
}

window.deleteProductPhoto = function(productId, index) {
  if (!confirm('确认删除此照片？')) return;
  var key = 'prod_' + productId;
  PhotoDB.get(key).then(function(data) {
    var photos = JSON.parse(data);
    photos.splice(index, 1);
    return PhotoDB.save(key, JSON.stringify(photos));
  }).then(function() {
    loadProductPhotos(productId);
    toast('照片已删除', 'info');
  });
};

window.previewPhoto = function(productId, index) {
  var key = 'prod_' + productId;
  PhotoDB.get(key).then(function(data) {
    var photos = JSON.parse(data);
    if (!photos[index]) return;
    var modalImg = document.getElementById('photo-preview-img');
    if (modalImg) {
      modalImg.src = photos[index].data;
      openModal('modal-photo-preview');
    }
  });
};

function getProductFirstPhoto(productId) {
  return PhotoDB.get('prod_' + productId).then(function(data) {
    if (!data) return null;
    var photos = JSON.parse(data);
    return photos.length > 0 ? photos[0].data : null;
  }).catch(function() { return null; });
}

// 异步渲染产品照片到产品卡片（HTML 中加 class="product-card-photo" 的 img）
window.loadProductCardPhotos = function() {
  var imgs = document.querySelectorAll('.product-card-photo');
  imgs.forEach(function(img) {
    var pid = img.dataset.productId || img.closest('[data-product-id]')?.dataset?.productId;
    if (!pid) return;
    getProductFirstPhoto(pid).then(function(photo) {
      if (photo) {
        img.src = photo;
        img.style.display = 'block';
      }
    });
  });
};


// ============ 高级拼团 / 秒杀 ============
window.renderFlashSale = function() {
  var container = document.getElementById('flash-sale-list');
  if (!container) return;
  var prods = filterByStore(state.products);
  container.innerHTML = prods.slice(0, 6).map(function(p) {
    var salePrice = Math.round((p.retailPrice || p.price) * 0.7 * 100) / 100;
    return '<div class="flash-item" onclick="quickAddProduct(\'' + p.id + '\')">' +
      '<div class="flash-badge">限时秒杀</div>' +
      '<div class="flash-name">' + escapeHTML(p.name) + '</div>' +
      '<div class="flash-price"><span class="flash-old">¥' + (p.retailPrice || p.price) + '</span> ¥' + salePrice + '</div>' +
    '</div>';
  }).join('');
};

window.startFlashSale = function() {
  toast('秒杀活动已开启！持续时间 2 小时', 'success');
  var timer = document.getElementById('flash-timer');
  if (!timer) return;
  var end = Date.now() + 7200000;
  var interval = setInterval(function() {
    var left = end - Date.now();
    if (left <= 0) { clearInterval(interval); timer.textContent = '已结束'; return; }
    var h = Math.floor(left / 3600000);
    var m = Math.floor((left % 3600000) / 60000);
    var s = Math.floor((left % 60000) / 1000);
    timer.textContent = h + '时' + m + '分' + s + '秒';
    timer.style.color = left < 600000 ? '#e74c3c' : 'var(--accent)';
  }, 1000);
};


// ============ 产品展示卡片增强（含照片 + 条码入口） ============
window.renderEnhancedProductCard = function(p) {
  var hotBadge = p.isHot ? '<span class="badge badge-hot">🔥 热销</span>' : '';
  var lowStockBadge = p.stock <= (p.warningStock || 10) ? '<span class="badge badge-warn">⚠ 低库存</span>' : '';
  var photoHtml = '<img class="product-card-photo" data-product-id="' + p.id + '" src="data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23ccc%22 font-size=%2214%22%3E👗%3C/text%3E%3C/svg%3E" style="width:100%;height:140px;object-fit:cover;border-radius:8px 8px 0 0;background:#f8f8f8;" />';

  return photoHtml + '<div class="product-info-padded">' +
    '<div class="product-name">' + escapeHTML(p.name) + hotBadge + lowStockBadge + '</div>' +
    '<div class="product-price-row"><span class="product-price">¥' + fmtMoney(p.retailPrice || p.price) + '</span>' +
    (p.purchasePrice ? '<span class="product-cost">进¥' + fmtMoney(p.purchasePrice) + '</span>' : '') +
    '</div>' +
    '<div class="product-meta"><span>库存：' + p.stock + '</span>' +
    '<span>条码：' + (p.code || p.barcode || '未生成') + '</span></div>' +
    '<div class="product-actions-row">' +
      '<button class="btn-mini" onclick="openPhotoUpload(\'' + p.id + '\')" title="照片/拍照">📷</button>' +
      '<button class="btn-mini" onclick="openBarcodeForProduct(\'' + p.id + '\')" title="生成条码">🏷️</button>' +
      '<button class="btn-mini" onclick="editProduct(\'' + p.id + '\')" title="编辑">✏️</button>' +
    '</div></div>';
};

window.openBarcodeForProduct = function(productId) {
  document.getElementById('barcode-product').value = productId;
  generateBarcode();
  openModal('modal-barcode');
};


// ============ 导航增强 ============
// 在 navTo 后注入新页面渲染
var _originalNavTo = null;
window._patchNavTo = function() {
  if (_originalNavTo) return;
  _originalNavTo = window.navTo;
  window.navTo = function(view) {
    _originalNavTo(view);
    // 新视图渲染
    if (view === 'settings') {
      renderSystemSettings();
    } else if (view === 'poster') {
      renderPosterGenerator();
    } else if (view === 'barcode') {
      renderBarcodeGenerator();
    } else if (view === 'custom-fields') {
      renderCustomFieldEditor();
    } else if (view === 'flash-sale') {
      renderFlashSale();
    } else if (view === 'advanced-coupons') {
      renderAdvancedCoupons();
    }
    // 产品视图加载照片
    if (view === 'products') {
      setTimeout(function() { loadProductCardPhotos(); }, 500);
    }
  };
};

// 自动 patch
setTimeout(function() { window._patchNavTo(); }, 200);


// ============ 工具函数（如果主文件没有的话用这些 ============
function escapeHTML(str) {
  return (str || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fmtMoney(n) {
  if (n == null) return '0.00';
  return Number(n).toFixed(2);
}

// 商业智能增强：从有赞CRM借鉴的客户画像标签
window.getCustomerSegments = function(customers) {
  customers = customers || state.customers || [];
  var total = 0, vipCount = 0, activeCount = 0, newCount = 0;
  customers.forEach(function(c) {
    total++;
    if (c.level === 'gold' || c.level === 'platinum' || c.level === 'vip') vipCount++;
    if (c.totalSpent > 10000) activeCount++;
    if (c.createdAt && (Date.now() - new Date(c.createdAt).getTime()) < 30 * 86400000) newCount++;
  });
  return {
    total: total,
    vipRate: total > 0 ? Math.round(vipCount / total * 100) : 0,
    highValue: activeCount,
    newCustomers: newCount,
    segments: [
      { name: '高价值客户', count: activeCount, color: '#e74c3c' },
      { name: 'VIP会员', count: vipCount, color: '#f39c12' },
      { name: '新客户', count: newCount, color: '#2ecc71' }
    ]
  };
};

console.log('🎨 衫云智管高级功能模块已加载');
console.log('  ✅ 照片管理 (IndexedDB)');
console.log('  ✅ 条码生成 (EAN-13 Canvas)');
console.log('  ✅ 海报生成器 (6套模板)');
console.log('  ✅ 自定义货品字段');
console.log('  ✅ 高级优惠券 (满减/折扣/买赠/免邮)');
console.log('  ✅ 系统个性化设置');
console.log('  ✅ 秒杀活动');
console.log('  ✅ 客户画像分析');