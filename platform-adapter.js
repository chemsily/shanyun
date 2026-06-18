/* ========================================
 * 衫云智管 多端适配层 (platform-adapter.js)
 * 一套核心代码，运行在 Web / PWA / 小程序 / App
 * ======================================== */

(function(global) {
  'use strict';

  // 检测当前平台
  var Platform = {
    WEB: 'web',
    PWA: 'pwa',
    WEAPP: 'weapp',       // 微信小程序
    ALIPAY: 'alipay',     // 支付宝小程序
    UNIAPP_H5: 'uniapp-h5',
    UNIAPP_APP: 'uniapp-app',
    REACT_NATIVE: 'rn'
  };

  function detectPlatform() {
    // 微信小程序
    if (typeof wx !== 'undefined' && wx.getStorageSync) {
      return Platform.WEAPP;
    }
    // 支付宝小程序
    if (typeof my !== 'undefined' && my.getStorageSync) {
      return Platform.ALIPAY;
    }
    // uni-app H5
    if (typeof uni !== 'undefined' && uni.getStorageSync) {
      return global.navigator ? Platform.UNIAPP_H5 : Platform.UNIAPP_APP;
    }
    // PWA
    if (global.navigator && global.navigator.serviceWorker) {
      return Platform.PWA;
    }
    // 默认 Web
    return Platform.WEB;
  }

  var currentPlatform = detectPlatform();

  // ============ 存储适配器 ============
  var StorageAdapter = {
    web: {
      set: function(key, value) {
        try {
          localStorage.setItem(key, JSON.stringify(value));
          return Promise.resolve();
        } catch(e) { return Promise.reject(e); }
      },
      get: function(key) {
        try {
          var v = localStorage.getItem(key);
          return Promise.resolve(v ? JSON.parse(v) : null);
        } catch(e) { return Promise.reject(e); }
      },
      remove: function(key) {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
      clear: function() {
        localStorage.clear();
        return Promise.resolve();
      }
    },
    pwa: {
      // PWA 优先使用 IndexedDB，备选 localStorage
      _db: null,
      _openDB: function() {
        if (this._db) return Promise.resolve(this._db);
        return new Promise(function(resolve, reject) {
          var req = indexedDB.open('shanyun_pwa', 1);
          req.onupgradeneeded = function(e) {
            var db = e.target.result;
            if (!db.objectStoreNames.contains('kv')) {
              db.createObjectStore('kv', { keyPath: 'key' });
            }
          };
          req.onsuccess = function(e) {
            this._db = e.target.result;
            resolve(this._db);
          }.bind(this);
          req.onerror = reject;
        }.bind(this));
      },
      set: function(key, value) {
        return this._openDB().then(function(db) {
          return new Promise(function(resolve, reject) {
            var tx = db.transaction('kv', 'readwrite');
            tx.objectStore('kv').put({ key: key, value: value });
            tx.oncomplete = resolve;
            tx.onerror = reject;
          });
        });
      },
      get: function(key) {
        return this._openDB().then(function(db) {
          return new Promise(function(resolve, reject) {
            var tx = db.transaction('kv', 'readonly');
            var req = tx.objectStore('kv').get(key);
            req.onsuccess = function() { resolve(req.result ? req.result.value : null); };
            req.onerror = reject;
          });
        });
      },
      remove: function(key) {
        return this._openDB().then(function(db) {
          return new Promise(function(resolve, reject) {
            var tx = db.transaction('kv', 'readwrite');
            tx.objectStore('kv').delete(key);
            tx.oncomplete = resolve;
            tx.onerror = reject;
          });
        });
      }
    },
    weapp: {
      set: function(key, value) {
        return new Promise(function(resolve, reject) {
          wx.setStorageSync(key, value);
          resolve();
        });
      },
      get: function(key) {
        return new Promise(function(resolve, reject) {
          resolve(wx.getStorageSync(key) || null);
        });
      },
      remove: function(key) {
        return new Promise(function(resolve) {
          wx.removeStorageSync(key);
          resolve();
        });
      }
    },
    alipay: {
      set: function(key, value) {
        return new Promise(function(resolve) {
          my.setStorageSync({ key: key, data: value });
          resolve();
        });
      },
      get: function(key) {
        return new Promise(function(resolve) {
          my.getStorageSync({ key: key, success: function(r) { resolve(r.data || null); } });
        });
      },
      remove: function(key) {
        return new Promise(function(resolve) {
          my.removeStorageSync({ key: key });
          resolve();
        });
      }
    }
  };

  // ============ 网络请求适配器 ============
  var NetworkAdapter = {
    web: function(options) {
      return fetch(options.url, {
        method: options.method || 'GET',
        headers: options.headers || {},
        body: options.data ? JSON.stringify(options.data) : undefined
      }).then(function(res) { return res.json(); });
    },
    weapp: function(options) {
      return new Promise(function(resolve, reject) {
        wx.request({
          url: options.url,
          method: options.method || 'GET',
          data: options.data,
          header: options.headers,
          success: function(res) { resolve(res.data); },
          fail: reject
        });
      });
    },
    alipay: function(options) {
      return new Promise(function(resolve, reject) {
        my.request({
          url: options.url,
          method: options.method || 'GET',
          data: options.data,
          headers: options.headers,
          success: function(res) { resolve(res.data); },
          fail: reject
        });
      });
    }
  };

  // ============ UI/路由适配器 ============
  var UIAdapter = {
    web: {
      showToast: function(msg, type) {
        // 使用现有的 toast 函数
        if (typeof global.toast === 'function') {
          global.toast(msg, type);
        } else {
          alert(msg);
        }
      },
      navigateTo: function(url) {
        if (typeof global.navTo === 'function') {
          var view = url.replace(/^.*?#?\/?/, '').replace(/\..*$/, '');
          global.navTo(view);
        } else {
          global.location.hash = '#' + url;
        }
      },
      showModal: function(options) {
        return new Promise(function(resolve) {
          if (typeof global.confirm === 'function') {
            resolve(global.confirm(options.content || options.title));
          } else {
            resolve(true);
          }
        });
      },
      previewImage: function(urls, current) {
        // Web 端打开新窗口预览
        if (typeof urls === 'string') urls = [urls];
        var win = global.open();
        win.document.write('<img src="' + (current || urls[0]) + '" style="max-width:100%">');
      }
    },
    weapp: {
      showToast: function(msg, type) {
        wx.showToast({ title: msg, icon: type === 'error' ? 'error' : 'none' });
      },
      navigateTo: function(url) {
        wx.navigateTo({ url: url });
      },
      showModal: function(options) {
        return new Promise(function(resolve) {
          wx.showModal({
            title: options.title || '提示',
            content: options.content || '',
            success: function(res) { resolve(res.confirm); }
          });
        });
      },
      previewImage: function(urls, current) {
        wx.previewImage({ urls: urls, current: current || urls[0] });
      }
    },
    alipay: {
      showToast: function(msg, type) {
        my.showToast({ content: msg, type: type === 'error' ? 'fail' : 'none' });
      },
      navigateTo: function(url) {
        my.navigateTo({ url: url });
      },
      showModal: function(options) {
        return new Promise(function(resolve) {
          my.confirm({
            title: options.title || '提示',
            content: options.content || '',
            success: function(res) { resolve(res.confirm); }
          });
        });
      },
      previewImage: function(urls, current) {
        my.previewImage({ urls: urls, current: current || urls[0] });
      }
    }
  };

  // ============ 拍照/相册适配器 ============
  var MediaAdapter = {
    web: {
      chooseImage: function(options) {
        return new Promise(function(resolve, reject) {
          var input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          if (options && options.sourceType && options.sourceType.indexOf('camera') !== -1) {
            input.capture = 'environment';
          }
          input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return reject('未选择文件');
            var reader = new FileReader();
            reader.onload = function(ev) {
              resolve([{ tempFilePath: ev.target.result, dataURL: ev.target.result }]);
            };
            reader.readAsDataURL(file);
          };
          input.click();
        });
      },
      compressImage: function(src, quality) {
        return new Promise(function(resolve) {
          var img = new Image();
          img.onload = function() {
            var canvas = document.createElement('canvas');
            var maxWidth = 800;
            var scale = Math.min(1, maxWidth / img.width);
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            resolve(canvas.toDataURL('image/jpeg', quality || 0.75));
          };
          img.src = src;
        });
      }
    },
    weapp: {
      chooseImage: function(options) {
        return new Promise(function(resolve, reject) {
          wx.chooseImage({
            count: (options && options.count) || 1,
            sourceType: (options && options.sourceType) || ['album', 'camera'],
            success: function(res) { resolve(res.tempFilePaths.map(function(p) { return { tempFilePath: p }; })); },
            fail: reject
          });
        });
      },
      compressImage: function(src, quality) {
        return new Promise(function(resolve, reject) {
          wx.compressImage({
            src: src,
            quality: Math.round((quality || 0.75) * 100),
            success: function(res) { resolve(res.tempFilePath); },
            fail: reject
          });
        });
      }
    }
  };

  // ============ 平台能力检测 ============
  var Capability = {
    getNetworkType: function() {
      switch (currentPlatform) {
        case Platform.WEAPP:
          return new Promise(function(resolve) {
            wx.getNetworkType({ success: function(res) { resolve(res.networkType); } });
          });
        case Platform.WEB:
        case Platform.PWA:
          return navigator.onLine ? Promise.resolve('online') : Promise.resolve('offline');
        default:
          return Promise.resolve('unknown');
      }
    },
    getSystemInfo: function() {
      switch (currentPlatform) {
        case Platform.WEAPP:
          return new Promise(function(resolve) { resolve(wx.getSystemInfoSync()); });
        case Platform.WEB:
        case Platform.PWA:
          return Promise.resolve({
            platform: 'web',
            userAgent: navigator.userAgent,
            screenWidth: screen.width,
            screenHeight: screen.height
          });
        default:
          return Promise.resolve({ platform: currentPlatform });
      }
    },
    vibrateShort: function() {
      switch (currentPlatform) {
        case Platform.WEAPP: wx.vibrateShort(); break;
        case Platform.WEB:
        case Platform.PWA:
          if (navigator.vibrate) navigator.vibrate(50);
          break;
      }
    }
  };

  // ============ 平台路由配置 ============
  var RouteConfig = {
    web: {
      'products': { view: 'products', file: 'products' },
      'customers': { view: 'customers', file: 'customers' },
      'orders': { view: 'orders', file: 'orders' },
      'ai-dashboard': { view: 'ai-dashboard', file: 'ai-dashboard' },
      'ai-decision': { view: 'ai-decision', file: 'ai-decision' }
    },
    weapp: {
      'pages/index/index': '/pages/index/index',
      'pages/products/list': '/pages/products/list',
      'pages/customers/list': '/pages/customers/list',
      'pages/orders/list': '/pages/orders/list',
      'pages/ai/dashboard': '/pages/ai/dashboard'
    }
  };

  // ============ 统一API ============
  var PlatformAdapter = {
    platform: currentPlatform,
    isWeb: currentPlatform === Platform.WEB || currentPlatform === Platform.PWA,
    isMiniProgram: currentPlatform === Platform.WEAPP || currentPlatform === Platform.ALIPAY,
    isApp: currentPlatform === Platform.UNIAPP_APP || currentPlatform === Platform.REACT_NATIVE,

    storage: function() {
      return StorageAdapter[currentPlatform] || StorageAdapter.web;
    },
    network: function() {
      return NetworkAdapter[currentPlatform] || NetworkAdapter.web;
    },
    ui: function() {
      return UIAdapter[currentPlatform] || UIAdapter.web;
    },
    media: function() {
      return MediaAdapter[currentPlatform] || MediaAdapter.web;
    },

    toast: function(msg, type) { this.ui().showToast(msg, type); },
    navigate: function(url) { this.ui().navigateTo(url); },
    modal: function(opts) { return this.ui().showModal(opts); },
    preview: function(urls, current) { this.ui().previewImage(urls, current); },

    chooseImage: function(opts) { return this.media().chooseImage(opts); },
    compressImage: function(src, q) { return this.media().compressImage(src, q); },

    request: function(opts) { return this.network()(opts); },

    getNetworkType: function() { return Capability.getNetworkType(); },
    getSystemInfo: function() { return Capability.getSystemInfo(); },
    vibrate: function() { Capability.vibrateShort(); },

    getRoute: function(name) {
      var routes = RouteConfig[this.isMiniProgram ? 'weapp' : 'web'];
      return routes[name] || null;
    }
  };

  // 暴露到全局
  global.PlatformAdapter = PlatformAdapter;
  global.Platform = Platform;

  console.log('🌐 多端适配层已加载，当前平台：' + currentPlatform);
  console.log('  isWeb: ' + PlatformAdapter.isWeb);
  console.log('  isMiniProgram: ' + PlatformAdapter.isMiniProgram);
  console.log('  isApp: ' + PlatformAdapter.isApp);

})(typeof window !== 'undefined' ? window : global);
