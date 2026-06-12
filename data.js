/* ========================================
   演示数据 (data.js)
   初始种子数据，若 localStorage 为空则写入
======================================== */

const SEED_DATA = {
  // 多门店：每个顾客/商品/订单都归属一个门店
  stores: [
    { id: 'st1', name: '杭州四季青总店', address: '杭州市江干区四季青服装市场', phone: '0571-8888-0001', main: true },
    { id: 'st2', name: '上海七浦路分店', address: '上海市七浦路服装批发市场', phone: '021-8888-0002', main: false },
    { id: 'st3', name: '广州十三行分店', address: '广州市荔湾区十三行批发商圈', phone: '020-8888-0003', main: false }
  ],
  currentStoreId: 'st1',

  customers: [
    { id: 'c1', name: '米粒', level: 'platinum', phone: '133 0166 2301', balance: 0, points: 13876, birthday: '1992-05-21', createdAt: '2026-05-19', tags: ['VIP', '老客'], remark: '喜欢真丝面料', storeId: 'st1' },
    { id: 'c2', name: '向俞', level: 'platinum', phone: '187 1780 4615', balance: 2423, points: 4617, birthday: '1990-11-08', createdAt: '2026-05-18', tags: ['VIP', '批发'], remark: '', storeId: 'st1' },
    { id: 'c3', name: '周爱彬', level: 'gold', phone: '185 0213 0009', balance: 0, points: 4392, birthday: '1988-03-15', createdAt: '2026-05-16', tags: ['老客'], remark: '', storeId: 'st2' },
    { id: 'c4', name: '杨秋月', level: 'vip', phone: '180 1852 5609', balance: 974, points: 6855, birthday: '1995-07-22', createdAt: '2026-05-20', tags: ['新客', '线上'], remark: '', storeId: 'st2' },
    { id: 'c5', name: '李小萌', level: 'normal', phone: '138 1234 5678', balance: 0, points: 210, birthday: '1998-02-10', createdAt: '2026-05-21', tags: ['新客'], remark: '', storeId: 'st3' },
    { id: 'c6', name: '王丽娜', level: 'gold', phone: '139 8765 4321', balance: 500, points: 9200, birthday: '1991-09-30', createdAt: '2026-05-15', tags: ['VIP', '老客', '批发'], remark: '常拿裤类', storeId: 'st3' },
  ],

  products: [
    { id: 'p1', name: '真丝连衣裙', code: 'SL-001', category: '连衣裙', purchasePrice: 320, retailPrice: 899, stock: 48, unit: '件', supplier: '上海简译服饰贸易公司', lowStock: 10, isHot: true, storeId: 'st1' },
    { id: 'p2', name: '羊绒针织衫', code: 'SL-002', category: 'T恤类', purchasePrice: 280, retailPrice: 680, stock: 76, unit: '件', supplier: '上海简译服饰贸易公司', lowStock: 15, isHot: true, storeId: 'st1' },
    { id: 'p3', name: '阔腿西装裤', code: 'PT-101', category: '裤类', purchasePrice: 180, retailPrice: 459, stock: 32, unit: '条', supplier: '東家演绎三店', lowStock: 10, isHot: false, storeId: 'st1' },
    { id: 'p4', name: '羊毛呢外套', code: 'CT-210', category: '外套', purchasePrice: 520, retailPrice: 1280, stock: 18, unit: '件', supplier: 'OTD服饰', lowStock: 5, isHot: true, storeId: 'st2' },
    { id: 'p5', name: '真皮小白鞋', code: 'SH-305', category: '鞋类', purchasePrice: 220, retailPrice: 599, stock: 25, unit: '双', supplier: '阿成潮品男鞋', lowStock: 8, isHot: false, storeId: 'st2' },
    { id: 'p6', name: '复古手提包', code: 'BG-401', category: '包类', purchasePrice: 150, retailPrice: 389, stock: 40, unit: '个', supplier: '慕洺', lowStock: 10, isHot: false, storeId: 'st3' },
    { id: 'p7', name: '珍珠耳环', code: 'AC-501', category: '配饰', purchasePrice: 35, retailPrice: 99, stock: 120, unit: '对', supplier: '島山', lowStock: 20, isHot: true, storeId: 'st3' },
    { id: 'p8', name: '真丝围巾', code: 'AC-502', category: '配饰', purchasePrice: 88, retailPrice: 268, stock: 55, unit: '条', supplier: '玛来菲尼', lowStock: 15, isHot: false, storeId: 'st1' },
  ],

  suppliers: [
    { id: 's1', name: '阿成潮品男鞋', phone: '138-0000-0001', address: '杭州四季青', purchaseCount: 894, purchaseAmount: 106922.9, subscribed: true, storeId: 'st1' },
    { id: 's2', name: '上海简译服饰贸易公司', phone: '138-0000-0002', address: '上海七浦路', purchaseCount: 0, purchaseAmount: 0, subscribed: true, storeId: 'st1' },
    { id: 's3', name: 'OTD服饰', phone: '138-0000-0003', address: '广州十三行', purchaseCount: 0, purchaseAmount: 0, subscribed: true, storeId: 'st2' },
    { id: 's4', name: '東家演绎三店', phone: '138-0000-0004', address: '深圳南油', purchaseCount: 1841, purchaseAmount: 193698, subscribed: true, storeId: 'st1' },
    { id: 's5', name: '郑州 T.X', phone: '138-0000-0005', address: '郑州银基', purchaseCount: 0, purchaseAmount: 0, subscribed: true, storeId: 'st2' },
    { id: 's6', name: '一集团 (AK+) 潮牌', phone: '138-0000-0006', address: '杭州四季青', purchaseCount: 0, purchaseAmount: 0, subscribed: false, storeId: 'st3' },
    { id: 's7', name: 'JIN studio', phone: '138-0000-0007', address: '上海静安', purchaseCount: 0, purchaseAmount: 0, subscribed: true, storeId: 'st3' },
    { id: 's8', name: 'K-house+', phone: '138-0000-0008', address: '广州白马', purchaseCount: 1465, purchaseAmount: 217773.3, subscribed: true, storeId: 'st3' },
    { id: 's9', name: 'EN.7', phone: '138-0000-0009', address: '北京动物园', purchaseCount: 0, purchaseAmount: 0, subscribed: false, storeId: 'st2' },
    { id: 's10', name: 'AM时尚男装 金城店', phone: '138-0000-0010', address: '兰州东部', purchaseCount: 0, purchaseAmount: 0, subscribed: false, storeId: 'st1' },
  ],

  orders: [
    { id: 'o1', customerId: 'c1', customerName: '米粒', date: '2026-05-19', items: [
      { productId: 'p1', productName: '真丝连衣裙', qty: 1, price: 899, purchasePrice: 320 },
      { productId: 'p3', productName: '阔腿西装裤', qty: 1, price: 459, purchasePrice: 180 }
    ], total: 1358, status: '已完成', payMethod: 'wechat', storeId: 'st1' },
    { id: 'o2', customerId: 'c2', customerName: '向俞', date: '2026-05-20', items: [
      { productId: 'p2', productName: '羊绒针织衫', qty: 2, price: 680, purchasePrice: 280 },
      { productId: 'p7', productName: '珍珠耳环', qty: 1, price: 99, purchasePrice: 35 }
    ], total: 1459, status: '已完成', payMethod: 'alipay', storeId: 'st1' },
    { id: 'o3', customerId: 'c4', customerName: '杨秋月', date: '2026-05-21', items: [
      { productId: 'p5', productName: '真皮小白鞋', qty: 1, price: 599, purchasePrice: 220 },
      { productId: 'p8', productName: '真丝围巾', qty: 1, price: 268, purchasePrice: 88 }
    ], total: 867, status: '已完成', payMethod: 'cash', storeId: 'st2' },
  ],

  // 挂单
  draftOrders: [],

  priceRule: {
    retailRatio: 150,
    discountRatio: 120,
    rounding: 'round'
  },

  // 库存告警阈值（全局默认）
  stockAlert: {
    enabled: true,
    defaultThreshold: 10
  },

  session: null
};
