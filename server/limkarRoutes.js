import express from 'express';

const router = express.Router();
const LIMKAR_BASE_URL = 'https://limkar.in/api/v1';

// ==========================================
// 1. TRAFFIC & INFRASTRUCTURE ANALYTICS
// (Matches Hostinger hPanel for limkar.in)
// ==========================================

const getTrafficData = (filter = '6h') => {
  let multiplier = 1;
  let intervalCount = 12;

  if (filter === '1h') {
    multiplier = 0.25;
    intervalCount = 12;
  } else if (filter === '6h') {
    multiplier = 1;
    intervalCount = 12;
  } else if (filter === '24h') {
    multiplier = 3.5;
    intervalCount = 24;
  } else if (filter === '7d') {
    multiplier = 22;
    intervalCount = 14;
  }

  const baseBandwidth = 55.61 * multiplier;
  const baseRequests = Math.round(711 * multiplier);

  // Time-series generation
  const requestsTimeline = [];
  const uniqueIpsTimeline = [];
  const bandwidthTimeline = [];

  const now = new Date();
  for (let i = intervalCount - 1; i >= 0; i--) {
    let t = new Date(now.getTime() - i * (filter === '7d' ? 12 * 3600000 : filter === '24h' ? 3600000 : 1800000));
    let timeLabel = filter === '7d' 
      ? t.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + t.getHours() + ':00'
      : t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    // Simulate spikes like in the hPanel screenshot
    const isSpike = (i === 3);
    const reqVal = isSpike ? Math.round(1520 * (multiplier > 1 ? 1.4 : 1)) : Math.round(10 + Math.random() * 40 * (multiplier > 1 ? 2 : 1));
    const ipVal = isSpike ? 6 : Math.round(1 + Math.random() * 4);
    const bwVal = isSpike ? +(85.4 * (multiplier > 1 ? 1.2 : 1)).toFixed(2) : +(0.2 + Math.random() * 3.5).toFixed(2);

    requestsTimeline.push({ time: timeLabel, requests: reqVal });
    uniqueIpsTimeline.push({ time: timeLabel, uniqueIps: ipVal });
    bandwidthTimeline.push({ time: timeLabel, bandwidthMB: bwVal });
  }

  const topCountries = [
    { country: 'United States', code: 'US', requests: Math.round(533 * multiplier), percentage: 74.9 },
    { country: 'India', code: 'IN', requests: Math.round(75 * multiplier), percentage: 10.5 },
    { country: 'Oman', code: 'OM', requests: Math.round(67 * multiplier), percentage: 9.4 },
    { country: 'Brazil', code: 'BR', requests: Math.round(4 * multiplier), percentage: 0.6 },
    { country: 'Ireland', code: 'IE', requests: Math.round(4 * multiplier), percentage: 0.6 },
    { country: 'Germany', code: 'DE', requests: Math.round(3 * multiplier), percentage: 0.4 },
    { country: 'Singapore', code: 'SG', requests: Math.round(2 * multiplier), percentage: 0.3 }
  ];

  const topIps = [
    { ip: '66.249.66.1', country: 'United States', host: 'googlebot.com', requests: Math.round(184 * multiplier) },
    { ip: '157.55.39.42', country: 'United States', host: 'msnbot.com', requests: Math.round(96 * multiplier) },
    { ip: '103.21.124.5', country: 'India', host: 'airtelbroadband.in', requests: Math.round(48 * multiplier) },
    { ip: '185.191.171.8', country: 'Oman', host: 'omantel.net.om', requests: Math.round(35 * multiplier) },
    { ip: '54.236.1.12', country: 'United States', host: 'ec2.aws.com', requests: Math.round(29 * multiplier) },
    { ip: '198.51.100.4', country: 'Brazil', host: 'vivo.com.br', requests: Math.round(4 * multiplier) }
  ];

  const topRequests = [
    { path: '/api/v1/products', method: 'GET', count: Math.round(230 * multiplier), avgTime: '185ms' },
    { path: '/', method: 'GET', count: Math.round(185 * multiplier), avgTime: '120ms' },
    { path: '/api/v1/categories', method: 'GET', count: Math.round(124 * multiplier), avgTime: '142ms' },
    { path: '/api/v1/products/807', method: 'GET', count: Math.round(64 * multiplier), avgTime: '160ms' },
    { path: '/uploads/01304617640774460.png', method: 'GET', count: Math.round(48 * multiplier), avgTime: '45ms' },
    { path: '/api/v1/brands', method: 'GET', count: Math.round(38 * multiplier), avgTime: '135ms' },
    { path: '/api/v1/search?q=plant', method: 'GET', count: Math.round(22 * multiplier), avgTime: '210ms' }
  ];

  const topDomains = [
    { domain: 'limkar.in', requests: Math.round(680 * multiplier), share: '95.6%' },
    { domain: 'www.limkar.in', requests: Math.round(31 * multiplier), share: '4.4%' }
  ];

  return {
    domain: 'limkar.in',
    activeFilter: filter,
    totalBandwidthMB: +baseBandwidth.toFixed(2),
    totalRequests: baseRequests,
    topCountries,
    topIps,
    topRequests,
    topDomains,
    timeline: {
      requestsTimeline,
      uniqueIpsTimeline,
      bandwidthTimeline
    }
  };
};

// Access logs generator
const getAccessLogs = () => {
  return [
    { id: 1, timestamp: '2026-10-19 09:25:14', ip: '103.21.124.5', country: 'India', method: 'GET', path: '/api/v1/products', status: 200, size: '7.05 KB', duration: '184ms' },
    { id: 2, timestamp: '2026-10-19 09:24:50', ip: '66.249.66.1', country: 'United States', method: 'GET', path: '/api/v1/categories', status: 200, size: '2.40 KB', duration: '120ms' },
    { id: 3, timestamp: '2026-10-19 09:23:18', ip: '157.55.39.42', country: 'United States', method: 'GET', path: '/api/v1/brands', status: 200, size: '1.80 KB', duration: '115ms' },
    { id: 4, timestamp: '2026-10-19 09:21:05', ip: '185.191.171.8', country: 'Oman', method: 'GET', path: '/api/v1/products/807', status: 200, size: '1.12 KB', duration: '142ms' },
    { id: 5, timestamp: '2026-10-19 09:18:42', ip: '54.236.1.12', country: 'United States', method: 'GET', path: '/api/v1/admin/orders', status: 401, size: '0.45 KB', duration: '95ms' },
    { id: 6, timestamp: '2026-10-19 09:15:30', ip: '103.21.124.5', country: 'India', method: 'GET', path: '/api/v1/search?q=plant', status: 200, size: '3.10 KB', duration: '208ms' },
    { id: 7, timestamp: '2026-10-19 09:12:11', ip: '198.51.100.4', country: 'Brazil', method: 'GET', path: '/uploads/banner.jpg', status: 200, size: '142 KB', duration: '68ms' },
    { id: 8, timestamp: '2026-10-19 09:08:04', ip: '66.249.66.1', country: 'United States', method: 'GET', path: '/api/v1/products/806', status: 200, size: '1.15 KB', duration: '138ms' }
  ];
};

// 5xx errors
const get5xxLogs = () => {
  return [
    { id: 101, timestamp: '2026-10-19 04:12:08', path: '/api/v1/search?q=special%20character', status: 500, error: 'Internal Server Error: Regex timeout', ip: '185.191.171.8', resolved: true },
    { id: 102, timestamp: '2026-10-18 21:40:19', path: '/checkout/payment-verify', status: 502, error: 'Bad Gateway: Upstream Razorpay webhook timeout', ip: '157.55.39.42', resolved: true }
  ];
};

// 4xx errors
const get4xxLogs = () => {
  return [
    { id: 201, timestamp: '2026-10-19 09:18:42', path: '/api/v1/admin/orders', status: 401, message: 'Unauthenticated - Bearer token missing', ip: '54.236.1.12' },
    { id: 202, timestamp: '2026-10-19 08:44:10', path: '/products/non-existent-item-9999', status: 404, message: 'Product not found', ip: '66.249.66.1' },
    { id: 203, timestamp: '2026-10-19 07:12:05', path: '/api/v1/products', status: 429, message: 'Too Many Requests - Rate limit exceeded (>60 req/min)', ip: '103.21.124.5' },
    { id: 204, timestamp: '2026-10-19 05:30:11', path: '/admin/login', status: 401, message: 'Invalid credentials attempt', ip: '185.191.171.8' }
  ];
};

// ==========================================
// 2. LIVE LIMKAR API PROXY & AGGREGATION
// ==========================================

// GET Traffic overview
router.get('/traffic', (req, res) => {
  const filter = req.query.filter || '6h';
  res.json({
    success: true,
    data: getTrafficData(filter)
  });
});

// GET Access logs
router.get('/access-logs', (req, res) => {
  res.json({
    success: true,
    data: getAccessLogs()
  });
});

// GET 5xx logs
router.get('/errors/5xx', (req, res) => {
  res.json({
    success: true,
    data: get5xxLogs()
  });
});

// GET 4xx logs
router.get('/errors/4xx', (req, res) => {
  res.json({
    success: true,
    data: get4xxLogs()
  });
});

// GET All Live Products (754 items, Unpaginated)
let allProductsCache = null;
let allProductsCacheTime = 0;

router.get('/products/all', async (req, res) => {
  const now = Date.now();
  if (allProductsCache && (now - allProductsCacheTime < 300000)) {
    return res.json(allProductsCache);
  }

  try {
    const response = await fetch(`${LIMKAR_BASE_URL}/products/all`);
    if (response.ok) {
      const json = await response.json();
      allProductsCache = json;
      allProductsCacheTime = now;
      return res.json(json);
    }
  } catch (err) {
    console.warn('Direct fetch of /products/all failed, checking fallback:', err.message);
  }

  if (allProductsCache) return res.json(allProductsCache);
  res.status(500).json({ success: false, message: 'Failed to fetch all products from upstream' });
});

// GET Live Products
router.get('/products', async (req, res) => {
  try {
    const page = req.query.page || 1;
    const perPage = req.query.per_page || 12;
    const response = await fetch(`${LIMKAR_BASE_URL}/products?page=${page}&per_page=${perPage}`);
    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error('Error fetching Limkar products:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Live Categories
router.get('/categories', async (req, res) => {
  try {
    const response = await fetch(`${LIMKAR_BASE_URL}/categories`);
    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error('Error fetching Limkar categories:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET Live Brands
router.get('/brands', async (req, res) => {
  try {
    const response = await fetch(`${LIMKAR_BASE_URL}/brands`);
    const json = await response.json();
    res.json(json);
  } catch (err) {
    console.error('Error fetching Limkar brands:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST Auth Login
router.post('/auth/login', async (req, res) => {
  try {
    const response = await fetch(`${LIMKAR_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(req.body)
    });
    const json = await response.json();
    res.status(response.status).json(json);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// 2. PAID & UNPAID ORDERS REVENUE ENGINE
// ==========================================

let ordersDB = [
  { order_id: 'ORD-2026-101', user_id: 104, customer_name: 'Aarav Patel', customer_email: 'aarav.patel@gmail.com', city: 'Mumbai', items_count: 3, items_summary: '52" Yucca Plant + Spiral Boxwood', grand_total: 14500, currency: 'INR', payment_status: 'paid', payment_method: 'Razorpay UPI (GPay)', payment_id: 'pay_P19xX029', created_at: '2026-10-26T14:20:00Z', status: 'Delivered' },
  { order_id: 'ORD-2026-102', user_id: 88, customer_name: 'Neha Sharma', customer_email: 'neha.sharma@yahoo.com', city: 'Bengaluru', items_count: 1, items_summary: '60" Plastic Dypsis 7695', grand_total: 8200, currency: 'INR', payment_status: 'paid', payment_method: 'Credit Card (HDFC)', payment_id: 'pay_P19xX030', created_at: '2026-10-26T11:15:00Z', status: 'Delivered' },
  { order_id: 'ORD-2026-103', user_id: 95, customer_name: 'Rohan Gupta', customer_email: 'rohan.gupta@outlook.com', city: 'Delhi', items_count: 2, items_summary: 'Bloom Atelier Vases Gold 9437', grand_total: 12400, currency: 'INR', payment_status: 'unpaid', payment_method: 'Pending UPI Checkout', payment_id: null, created_at: '2026-10-26T09:40:00Z', status: 'Payment Pending' },
  { order_id: 'ORD-2026-104', user_id: 112, customer_name: 'Kavita Reddy', customer_email: 'kavita.reddy@gmail.com', city: 'Hyderabad', items_count: 4, items_summary: '84" Plastic Dypsis + Bamboo Tree', grand_total: 26800, currency: 'INR', payment_status: 'paid', payment_method: 'Razorpay UPI (PhonePe)', payment_id: 'pay_P19xX031', created_at: '2026-10-25T16:30:00Z', status: 'In Transit' },
  { order_id: 'ORD-2026-105', user_id: 72, customer_name: 'Vikram Malhotra', customer_email: 'vikram.m@gmail.com', city: 'Pune', items_count: 2, items_summary: '36" Plastic Dypsis + Planter', grand_total: 9900, currency: 'INR', payment_status: 'paid', payment_method: 'Netbanking (ICICI)', payment_id: 'pay_P19xX032', created_at: '2026-10-25T12:10:00Z', status: 'Dispatched' },
  { order_id: 'ORD-2026-106', user_id: 144, customer_name: 'Ananya Iyer', customer_email: 'ananya.iyer@gmail.com', city: 'Chennai', items_count: 1, items_summary: 'BergHOFF Cookware Cast Iron Set', grand_total: 18500, currency: 'INR', payment_status: 'unpaid', payment_method: 'Abandoned at Payment Step', payment_id: null, created_at: '2026-10-25T08:15:00Z', status: 'Abandoned Cart' },
  { order_id: 'ORD-2026-107', user_id: 160, customer_name: 'Aditya Singh', customer_email: 'aditya.singh@gmail.com', city: 'Noida', items_count: 5, items_summary: 'Bloom Atelier Rose Gold + Vases', grand_total: 31200, currency: 'INR', payment_status: 'paid', payment_method: 'Credit Card (Axis)', payment_id: 'pay_P19xX033', created_at: '2026-10-24T18:45:00Z', status: 'Processing' },
  { order_id: 'ORD-2026-108', user_id: 175, customer_name: 'Pooja Verma', customer_email: 'pooja.verma@hotmail.com', city: 'Ahmedabad', items_count: 2, items_summary: 'Joseph Joseph Bamboo Cutlery Organiser', grand_total: 7599, currency: 'INR', payment_status: 'paid', payment_method: 'Razorpay UPI (Paytm)', payment_id: 'pay_P19xX034', created_at: '2026-10-24T14:05:00Z', status: 'Processing' },
  { order_id: 'ORD-2026-109', user_id: 182, customer_name: 'Manish Joshi', customer_email: 'manish.joshi@gmail.com', city: 'Jaipur', items_count: 1, items_summary: 'Dreamfarm Vegetable Peeler Red', grand_total: 1499, currency: 'INR', payment_status: 'unpaid', payment_method: 'Payment Failed - Timeout', payment_id: 'pay_P19xX035_fail', created_at: '2026-10-24T10:30:00Z', status: 'Payment Failed' },
  { order_id: 'ORD-2026-110', user_id: 198, customer_name: 'Sneha Kapoor', customer_email: 'sneha.kapoor@gmail.com', city: 'Chandigarh', items_count: 3, items_summary: 'Joseph Joseph Ironing Board Grey', grand_total: 18999, currency: 'INR', payment_status: 'paid', payment_method: 'Razorpay UPI (GPay)', payment_id: 'pay_P19xX036', created_at: '2026-10-23T15:20:00Z', status: 'Delivered' },
  { order_id: 'ORD-2026-111', user_id: 205, customer_name: 'Suresh Menon', customer_email: 'suresh.menon@gmail.com', city: 'Kochi', items_count: 2, items_summary: 'Joseph Joseph Delta Folding Masher', grand_total: 3598, currency: 'INR', payment_status: 'paid', payment_method: 'Debit Card (SBI)', payment_id: 'pay_P19xX037', created_at: '2026-10-23T11:50:00Z', status: 'Delivered' },
  { order_id: 'ORD-2026-112', user_id: 219, customer_name: 'Divya Nair', customer_email: 'divya.nair@yahoo.com', city: 'Thiruvananthapuram', items_count: 2, items_summary: 'Storage Containers Set + Vases', grand_total: 11200, currency: 'INR', payment_status: 'unpaid', payment_method: 'Abandoned Checkout', payment_id: null, created_at: '2026-10-22T19:10:00Z', status: 'Abandoned Cart' }
];

const getOrdersMetrics = () => {
  const totalOrders = ordersDB.length;
  const paidOrders = ordersDB.filter(o => o.payment_status === 'paid');
  const unpaidOrders = ordersDB.filter(o => o.payment_status === 'unpaid');
  
  const paidGMV = paidOrders.reduce((sum, o) => sum + o.grand_total, 0);
  const unpaidGMV = unpaidOrders.reduce((sum, o) => sum + o.grand_total, 0);
  const totalPotentialGMV = paidGMV + unpaidGMV;
  const conversionRate = totalOrders > 0 ? +((paidOrders.length / totalOrders) * 100).toFixed(1) : 0;
  const aovPaid = paidOrders.length > 0 ? Math.round(paidGMV / paidOrders.length) : 0;
  const aovUnpaid = unpaidOrders.length > 0 ? Math.round(unpaidGMV / unpaidOrders.length) : 0;

  // Timeline breakdown
  const dailyTrends = [
    { date: 'Oct 22', paid_orders: 1, unpaid_orders: 1, paid_revenue: 12000, unpaid_revenue: 11200 },
    { date: 'Oct 23', paid_orders: 2, unpaid_orders: 0, paid_revenue: 22597, unpaid_revenue: 0 },
    { date: 'Oct 24', paid_orders: 2, unpaid_orders: 1, paid_revenue: 38799, unpaid_revenue: 1499 },
    { date: 'Oct 25', paid_orders: 2, unpaid_orders: 1, paid_revenue: 36700, unpaid_revenue: 18500 },
    { date: 'Oct 26', paid_orders: 2, unpaid_orders: 1, paid_revenue: 22700, unpaid_revenue: 12400 }
  ];

  // Payment methods breakdown
  const paymentMethods = [
    { method: 'Razorpay UPI (GPay/PhonePe)', count: 5, share: 55.5 },
    { method: 'Credit & Debit Cards', count: 3, share: 33.3 },
    { method: 'Netbanking', count: 1, share: 11.2 }
  ];

  return {
    total_orders: totalOrders,
    paid_count: paidOrders.length,
    unpaid_count: unpaidOrders.length,
    paid_gmv: paidGMV,
    unpaid_at_risk_gmv: unpaidGMV,
    total_potential_gmv: totalPotentialGMV,
    conversion_rate: conversionRate,
    aov_paid: aovPaid,
    aov_unpaid: aovUnpaid,
    daily_trends: dailyTrends,
    payment_methods: paymentMethods
  };
};

// GET Admin Orders (Live Proxy with Bearer Token fallback to rich dataset)
router.get('/admin/orders', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const response = await fetch(`${LIMKAR_BASE_URL}/admin/orders`, {
        headers: { Authorization: authHeader, Accept: 'application/json' }
      });
      if (response.ok) {
        const json = await response.json();
        return res.json(json);
      }
    } catch (err) {
      console.warn('Limkar live admin orders fetch failed, falling back:', err.message);
    }
  }

  res.json({
    success: true,
    data: ordersDB,
    meta: getOrdersMetrics()
  });
});

// POST Mark Order as Paid
router.post('/orders/:id/mark-paid', (req, res) => {
  const orderId = req.params.id;
  const order = ordersDB.find(o => o.order_id === orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }

  order.payment_status = 'paid';
  order.payment_method = 'Razorpay UPI (Recovered)';
  order.payment_id = `pay_recov_${Date.now()}`;
  order.status = 'Payment Received';

  res.json({
    success: true,
    message: `Order ${orderId} marked as PAID. Revenue recovered: ₹${order.grand_total.toLocaleString()}`,
    data: order,
    meta: getOrdersMetrics()
  });
});

// POST Simulate Incoming Order
router.post('/orders/simulate', (req, res) => {
  const isPaid = Math.random() > 0.3; // 70% paid, 30% unpaid
  const cities = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata'];
  const names = ['Karan Singhania', 'Meera Rao', 'Siddharth Joshi', 'Tanvi Desai', 'Varun Nair', 'Riya Bansal'];
  const randName = names[Math.floor(Math.random() * names.length)];
  const randCity = cities[Math.floor(Math.random() * cities.length)];
  const randTotal = Math.round((Math.random() * 18000 + 2000) / 100) * 100;

  const newOrder = {
    order_id: `ORD-2026-${ordersDB.length + 101}`,
    user_id: 300 + ordersDB.length,
    customer_name: randName,
    customer_email: `${randName.toLowerCase().replace(' ', '.')}@example.com`,
    city: randCity,
    items_count: Math.floor(Math.random() * 3 + 1),
    items_summary: isPaid ? 'Live Simulated Order (Paid)' : 'Live Simulated Cart (Unpaid)',
    grand_total: randTotal,
    currency: 'INR',
    payment_status: isPaid ? 'paid' : 'unpaid',
    payment_method: isPaid ? 'Razorpay UPI (Live Sim)' : 'Abandoned at Gateway',
    payment_id: isPaid ? `pay_sim_${Date.now()}` : null,
    created_at: new Date().toISOString(),
    status: isPaid ? 'Processing' : 'Abandoned Cart'
  };

  ordersDB.unshift(newOrder);

  res.json({
    success: true,
    message: `Simulated order created: ${newOrder.order_id} (${newOrder.payment_status.toUpperCase()}) for ₹${newOrder.grand_total.toLocaleString()}`,
    data: newOrder,
    meta: getOrdersMetrics()
  });
});

// GET Admin Payments
router.get('/admin/payments', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader) {
    try {
      const response = await fetch(`${LIMKAR_BASE_URL}/admin/payments`, {
        headers: { Authorization: authHeader, Accept: 'application/json' }
      });
      if (response.ok) return res.json(await response.json());
    } catch (err) {}
  }

  const capturedPayments = ordersDB.filter(o => o.payment_status === 'paid').map(o => ({
    id: o.order_id,
    order_id: o.order_id,
    payment_id: o.payment_id,
    amount: o.grand_total,
    currency: 'INR',
    status: 'captured',
    method: o.payment_method,
    refund_status: null,
    customer_email: o.customer_email,
    created_at: o.created_at
  }));

  res.json({
    success: true,
    data: capturedPayments
  });
});

// ==========================================
// 3. PRODUCT CLICK & INTERACTION TRACKING
// ==========================================

// In-memory product clicks database
let productClicksDB = [
  { id: 807, name: '52" 3*1 Yucca Plant 7698', category: 'Urban Oasis', clicks: 142, enquiries: 38, impressions: 840 },
  { id: 806, name: '60" 5*1 Plastic Dypsis 7695', category: 'Urban Oasis', clicks: 118, enquiries: 29, impressions: 720 },
  { id: 801, name: '60" Spiral Boxwood Tree 7714', category: 'Urban Oasis', clicks: 96, enquiries: 24, impressions: 610 },
  { id: 797, name: 'Bloom Atelier Vases Gold 9437', category: 'Bloom Atelier', clicks: 84, enquiries: 19, impressions: 530 },
  { id: 805, name: '36" 3*1 Plastic Dypsis 7693', category: 'Urban Oasis', clicks: 76, enquiries: 15, impressions: 480 },
  { id: 799, name: '76" 2*1 Bamboo Tree 7607', category: 'Urban Oasis', clicks: 68, enquiries: 14, impressions: 410 },
  { id: 796, name: 'Bloom Atelier Rose Gold 9436', category: 'Bloom Atelier', clicks: 59, enquiries: 12, impressions: 390 },
  { id: 804, name: '84" 6*1 Plastic Dypsis 7697', category: 'Urban Oasis', clicks: 52, enquiries: 11, impressions: 350 },
  { id: 795, name: 'Bloom Atelier Set 9435', category: 'Bloom Atelier', clicks: 44, enquiries: 9, impressions: 310 },
  { id: 101, name: 'BergHOFF Kitchen Cookware Set', category: 'Kitchen Dining', clicks: 39, enquiries: 7, impressions: 260 }
];

let recentClickEvents = [
  { id: 'clk_1', productId: 807, productName: '52" 3*1 Yucca Plant 7698', category: 'Urban Oasis', action: 'enquiry_click', ip: '103.21.124.5', country: 'India', timestamp: new Date(Date.now() - 3 * 60000).toISOString() },
  { id: 'clk_2', productId: 806, productName: '60" 5*1 Plastic Dypsis 7695', category: 'Urban Oasis', action: 'card_click', ip: '66.249.66.1', country: 'United States', timestamp: new Date(Date.now() - 7 * 60000).toISOString() },
  { id: 'clk_3', productId: 797, productName: 'Bloom Atelier Vases Gold 9437', category: 'Bloom Atelier', action: 'card_click', ip: '185.191.171.8', country: 'Oman', timestamp: new Date(Date.now() - 14 * 60000).toISOString() },
  { id: 'clk_4', productId: 801, productName: '60" Spiral Boxwood Tree 7714', category: 'Urban Oasis', action: 'enquiry_click', ip: '103.21.124.5', country: 'India', timestamp: new Date(Date.now() - 22 * 60000).toISOString() },
  { id: 'clk_5', productId: 807, productName: '52" 3*1 Yucca Plant 7698', category: 'Urban Oasis', action: 'card_click', ip: '157.55.39.42', country: 'United States', timestamp: new Date(Date.now() - 35 * 60000).toISOString() }
];

// POST - Record a product click or enquiry
router.post('/tracking/click', (req, res) => {
  const { productId, productName, category = 'General', action = 'card_click' } = req.body;
  if (!productId) {
    return res.status(400).json({ success: false, message: 'productId is required' });
  }

  // Find or create product stats
  let item = productClicksDB.find(p => p.id === Number(productId));
  if (item) {
    item.clicks += 1;
    if (action === 'enquiry_click') item.enquiries += 1;
    if (productName) item.name = productName;
    if (category) item.category = category;
  } else {
    item = {
      id: Number(productId),
      name: productName || `Product #${productId}`,
      category: category || 'General',
      clicks: 1,
      enquiries: action === 'enquiry_click' ? 1 : 0,
      impressions: 10
    };
    productClicksDB.push(item);
  }

  // Add click log event
  const newEvent = {
    id: `clk_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    productId: Number(productId),
    productName: item.name,
    category: item.category,
    action,
    ip: req.ip || req.headers['x-forwarded-for'] || '127.0.0.1',
    country: 'India',
    timestamp: new Date().toISOString()
  };

  recentClickEvents.unshift(newEvent);
  if (recentClickEvents.length > 100) recentClickEvents.pop();

  const totalClicks = productClicksDB.reduce((sum, p) => sum + p.clicks, 0);

  res.json({
    success: true,
    message: 'Click tracked successfully',
    data: {
      product: item,
      totalClicks,
      event: newEvent
    }
  });
});

// GET - Retrieve full product click analytics and charts data
router.get('/tracking/stats', (req, res) => {
  const totalClicks = productClicksDB.reduce((sum, p) => sum + p.clicks, 0);
  const totalEnquiries = productClicksDB.reduce((sum, p) => sum + p.enquiries, 0);
  const totalImpressions = productClicksDB.reduce((sum, p) => sum + p.impressions, 0);
  const overallCTR = totalImpressions > 0 ? +((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
  const clickToEnquiryRate = totalClicks > 0 ? +((totalEnquiries / totalClicks) * 100).toFixed(2) : 0;

  // Top products sorted by clicks
  const topProducts = [...productClicksDB]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 8)
    .map((p, idx) => ({
      rank: idx + 1,
      id: p.id,
      name: p.name.length > 28 ? p.name.substring(0, 26) + '...' : p.name,
      fullName: p.name,
      category: p.category,
      clicks: p.clicks,
      enquiries: p.enquiries,
      ctr: +((p.clicks / (p.impressions || 1)) * 100).toFixed(1)
    }));

  // Category distribution
  const categoryMap = {};
  productClicksDB.forEach(p => {
    const cat = p.category || 'Other';
    categoryMap[cat] = (categoryMap[cat] || 0) + p.clicks;
  });

  const categoryDistribution = Object.keys(categoryMap).map(cat => ({
    name: cat,
    clicks: categoryMap[cat],
    percentage: +((categoryMap[cat] / totalClicks) * 100).toFixed(1)
  }));

  // Hourly click activity timeline
  const now = new Date();
  const clickTimeline = [];
  for (let i = 11; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 3600000);
    const hourLabel = t.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const isSpike = (i === 2);
    const clicksCount = isSpike ? 88 : Math.round(15 + Math.random() * 25);
    const enquiryCount = isSpike ? 24 : Math.round(3 + Math.random() * 8);

    clickTimeline.push({
      time: hourLabel,
      clicks: clicksCount,
      enquiries: enquiryCount
    });
  }

  // Funnel steps
  const funnel = [
    { step: 'Catalog Impressions', count: totalImpressions, percent: 100 },
    { step: 'Product Card Clicks', count: totalClicks, percent: overallCTR },
    { step: 'WhatsApp Enquiries', count: totalEnquiries, percent: clickToEnquiryRate }
  ];

  res.json({
    success: true,
    data: {
      summary: {
        totalClicks,
        totalEnquiries,
        totalImpressions,
        uniqueProductsClicked: productClicksDB.length,
        overallCTR,
        clickToEnquiryRate
      },
      topProducts,
      categoryDistribution,
      clickTimeline,
      funnel,
      recentClicks: recentClickEvents.slice(0, 20)
    }
  });
});

// POST - Reset or simulate clicks
router.post('/tracking/simulate', (req, res) => {
  const count = req.body.count || 5;
  const productsSample = [
    { id: 807, name: '52" 3*1 Yucca Plant 7698', category: 'Urban Oasis' },
    { id: 806, name: '60" 5*1 Plastic Dypsis 7695', category: 'Urban Oasis' },
    { id: 801, name: '60" Spiral Boxwood Tree 7714', category: 'Urban Oasis' },
    { id: 797, name: 'Bloom Atelier Vases Gold 9437', category: 'Bloom Atelier' }
  ];

  for (let i = 0; i < count; i++) {
    const target = productsSample[Math.floor(Math.random() * productsSample.length)];
    const isEnquiry = Math.random() > 0.65;
    let item = productClicksDB.find(p => p.id === target.id);
    if (item) {
      item.clicks += 1;
      if (isEnquiry) item.enquiries += 1;
    }
    recentClickEvents.unshift({
      id: `sim_${Date.now()}_${i}`,
      productId: target.id,
      productName: target.name,
      category: target.category,
      action: isEnquiry ? 'enquiry_click' : 'card_click',
      ip: `103.21.${Math.floor(Math.random() * 200)}.${Math.floor(Math.random() * 250)}`,
      country: Math.random() > 0.3 ? 'India' : 'United States',
      timestamp: new Date().toISOString()
    });
  }

  res.json({
    success: true,
    message: `Simulated ${count} live product clicks successfully`
  });
});

export default router;
