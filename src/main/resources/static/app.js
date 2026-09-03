/* STATE & LOCAL STORAGE PERSISTENCE */
const LOCAL_STORAGE_KEY = 'techtrove_state_v1';
const PAYMENT_COLLECTORS = ['Suresh', 'Pragathi', 'Varusha', 'Dharani'];

const DEFAULT_SEED_ITEMS = [
  { id: 'item-dell-lat-01', brand: 'Dell', model: 'Latitude 3420', type: 'Laptop', serial: 'DELL-3420-SN01', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD', status: 'rented' },
  { id: 'item-dell-lat-02', brand: 'Dell', model: 'Latitude 3420', type: 'Laptop', serial: 'DELL-3420-SN02', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD', status: 'repair', repairInfo: { serviceCenter: 'Dell Authorized Service Care, SP Road', servicePerson: 'Suresh Kumar', servicePhone: '9876500001', givenToServiceDate: '2026-09-03', expectedReturnDate: '2026-09-03', repairCost: 1800, repairIssue: 'Keyboard replacement & fan thermal service' } },
  { id: 'item-dell-lat-03', brand: 'Dell', model: 'Latitude 3420', type: 'Laptop', serial: 'DELL-3420-SN03', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD', status: 'available' },
  { id: 'item-len-t14-01', brand: 'Lenovo', model: 'ThinkPad T14 Gen 2', type: 'Laptop', serial: 'LEN-T14-SN01', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD IPS', status: 'rented' },
  { id: 'item-apl-m1-01', brand: 'Apple', model: 'MacBook Air M1 (2020)', type: 'MacBook', serial: 'APL-MBA-SN01', specs: 'Apple M1 (8-Core CPU) • 8GB Unified RAM • 256GB SSD • 13.3" Retina Display', status: 'available' }
];

const DEFAULT_SEED_CUSTOMERS = [
  { id: 'cust-rajesh', name: 'Rajesh Kumar', phone: '9876543210', address: 'Indiranagar, Bangalore' },
  { id: 'cust-priya', name: 'Priya Sharma', phone: '9845012345', address: 'Koramangala, Bangalore' },
  { id: 'cust-amit', name: 'Amit Patel', phone: '9731234567', address: 'HSR Layout, Bangalore' }
];

const DEFAULT_SEED_RENTALS = [
  { id: 'rental-rajesh-dell', customerId: 'cust-rajesh', itemId: 'item-dell-lat-01', rentAmount: 2500, billingCycle: 'monthly', startDate: '2026-09-03', advancePayment: 2500, securityDeposit: 5000, status: 'active' },
  { id: 'rental-priya-lenovo', customerId: 'cust-priya', itemId: 'item-len-t14-01', rentAmount: 3000, billingCycle: 'monthly', startDate: '2026-09-03', advancePayment: 3000, securityDeposit: 6000, status: 'active' }
];

let state = {
  customers: JSON.parse(JSON.stringify(DEFAULT_SEED_CUSTOMERS)),
  items: JSON.parse(JSON.stringify(DEFAULT_SEED_ITEMS)),
  rentals: JSON.parse(JSON.stringify(DEFAULT_SEED_RENTALS)),
  payments: []
};

try {
  const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && Array.isArray(parsed.customers) && Array.isArray(parsed.items) && parsed.items.length > 0) {
      state = {
        customers: parsed.customers || [],
        items: parsed.items || [],
        rentals: parsed.rentals || [],
        payments: parsed.payments || []
      };
    }
  }
} catch(e) {
  console.warn('Initial localStorage load error:', e);
}

let currentPage = 'dashboard';
let pageStack = [];
let filterState = { inventory: 'all' };
let notifEnabled = true;
let lastNotifDate = '';
let currentTheme = 'dark';
try {
  notifEnabled = localStorage.getItem('notifEnabled') !== 'false';
  lastNotifDate = localStorage.getItem('lastNotifDate') || '';
  const savedTheme = localStorage.getItem('techtrove_theme');
  if (savedTheme === 'light' || savedTheme === 'dark') {
    currentTheme = savedTheme;
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    currentTheme = 'light';
  } else {
    currentTheme = 'dark';
  }
  document.documentElement.setAttribute('data-theme', currentTheme);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', currentTheme === 'light' ? '#FFFFFF' : '#1A1D24');
  }
} catch(e) {}

function setTheme(theme) {
  currentTheme = theme;
  try { localStorage.setItem('techtrove_theme', theme); } catch(e) {}
  document.documentElement.setAttribute('data-theme', theme);
  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) {
    themeMeta.setAttribute('content', theme === 'light' ? '#FFFFFF' : '#1A1D24');
  }
}

// Live OS media query listener for system theme changes when no manual override is set
if (typeof window !== 'undefined' && window.matchMedia) {
  const mql = window.matchMedia('(prefers-color-scheme: dark)');
  const handleOSThemeChange = (e) => {
    const saved = localStorage.getItem('techtrove_theme');
    if (!saved) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  };
  if (mql.addEventListener) {
    mql.addEventListener('change', handleOSThemeChange);
  } else if (mql.addListener) {
    mql.addListener(handleOSThemeChange);
  }
}

/* OUTLINE SVG ICON SET (1.5px stroke, zero emoji) */
const Icons = {
  dashboard: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>`,
  inventory: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8"/><path d="M12 17v4"/></svg>`,
  customers: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  rentals: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  repairs: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  search: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  whatsapp: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
  phone: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>`,
  payment: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
  check: `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  arrowRight: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>`,
  chevronRight: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>`,
  download: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  bell: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`,
  sun: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`,
  moon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`
};

/* PRESET CATALOGUE FOR LAPTOPS, DESKTOPS & MONITORS */
const PRESET_CATALOGUE = [
  // Dell Laptops & Desktops
  { brand: 'Dell', model: 'Latitude 3420', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '16GB DDR4', storage: '512GB NVMe SSD', screen: '14.0" FHD (1920x1080)', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD' },
  { brand: 'Dell', model: 'Latitude 5420', type: 'Laptop', cpu: 'Intel Core i7 11th Gen', ram: '16GB DDR4', storage: '512GB NVMe SSD', screen: '14.0" FHD IPS', specs: 'Intel Core i7 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD IPS' },
  { brand: 'Dell', model: 'Latitude 7420', type: 'Laptop', cpu: 'Intel Core i7 11th Gen', ram: '16GB DDR4', storage: '512GB NVMe SSD', screen: '14.0" FHD Carbon', specs: 'Intel Core i7 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD Carbon' },
  { brand: 'Dell', model: 'Latitude 3410', type: 'Laptop', cpu: 'Intel Core i5 10th Gen', ram: '8GB DDR4', storage: '256GB SSD', screen: '14.0" Anti-Glare', specs: 'Intel Core i5 10th Gen • 8GB DDR4 • 256GB SSD • 14.0" Anti-Glare' },
  { brand: 'Dell', model: 'Latitude 5400', type: 'Laptop', cpu: 'Intel Core i5 8th Gen', ram: '16GB DDR4', storage: '256GB SSD', screen: '14.0" FHD', specs: 'Intel Core i5 8th Gen • 16GB DDR4 • 256GB SSD • 14.0" FHD' },
  { brand: 'Dell', model: 'Latitude 5490', type: 'Laptop', cpu: 'Intel Core i5 8th Gen', ram: '8GB DDR4', storage: '256GB SSD', screen: '14.0" HD', specs: 'Intel Core i5 8th Gen • 8GB DDR4 • 256GB SSD • 14.0" HD' },
  { brand: 'Dell', model: 'Inspiron 3520', type: 'Laptop', cpu: 'Intel Core i5 12th Gen', ram: '16GB DDR4', storage: '512GB NVMe SSD', screen: '15.6" FHD 120Hz', specs: 'Intel Core i5 12th Gen • 16GB DDR4 • 512GB NVMe SSD • 15.6" FHD 120Hz' },
  { brand: 'Dell', model: 'Inspiron 3511', type: 'Laptop', cpu: 'Intel Core i3 11th Gen', ram: '8GB DDR4', storage: '512GB SSD', screen: '15.6" FHD', specs: 'Intel Core i3 11th Gen • 8GB DDR4 • 512GB SSD • 15.6" FHD' },
  { brand: 'Dell', model: 'Vostro 3400', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '8GB DDR4', storage: '512GB SSD', screen: '14.0" FHD', specs: 'Intel Core i5 11th Gen • 8GB DDR4 • 512GB SSD • 14.0" FHD' },
  { brand: 'Dell', model: 'Vostro 3500', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '15.6" FHD', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB SSD • 15.6" FHD' },
  { brand: 'Dell', model: 'OptiPlex 3080 Micro', type: 'Desktop', cpu: 'Intel Core i5 10th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: 'External Monitor', specs: 'Intel Core i5 10th Gen • 16GB DDR4 • 512GB SSD • Micro Desktop' },
  { brand: 'Dell', model: 'OptiPlex 7090 Micro', type: 'Desktop', cpu: 'Intel Core i7 11th Gen', ram: '16GB DDR4', storage: '512GB NVMe SSD', screen: 'External Monitor', specs: 'Intel Core i7 11th Gen • 16GB DDR4 • 512GB NVMe SSD • Micro Desktop' },

  // Lenovo Laptops & Desktops
  { brand: 'Lenovo', model: 'ThinkPad T14 Gen 2', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '16GB DDR4', storage: '512GB NVMe SSD', screen: '14.0" FHD IPS', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD IPS' },
  { brand: 'Lenovo', model: 'ThinkPad T14 Gen 3', type: 'Laptop', cpu: 'Intel Core i7 12th Gen', ram: '16GB DDR5', storage: '512GB NVMe SSD', screen: '14.0" WUXGA', specs: 'Intel Core i7 12th Gen • 16GB DDR5 • 512GB NVMe SSD • 14.0" WUXGA' },
  { brand: 'Lenovo', model: 'ThinkPad T480', type: 'Laptop', cpu: 'Intel Core i5 8th Gen', ram: '16GB DDR4', storage: '256GB SSD', screen: '14.0" FHD IPS', specs: 'Intel Core i5 8th Gen • 16GB DDR4 • 256GB SSD • 14.0" FHD IPS' },
  { brand: 'Lenovo', model: 'ThinkPad T490', type: 'Laptop', cpu: 'Intel Core i5 8th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '14.0" FHD IPS', specs: 'Intel Core i5 8th Gen • 16GB DDR4 • 512GB SSD • 14.0" FHD IPS' },
  { brand: 'Lenovo', model: 'ThinkPad E14 Gen 4', type: 'Laptop', cpu: 'AMD Ryzen 5 5625U', ram: '16GB DDR4', storage: '512GB SSD', screen: '14.0" FHD IPS', specs: 'AMD Ryzen 5 5625U • 16GB DDR4 • 512GB SSD • 14.0" FHD IPS' },
  { brand: 'Lenovo', model: 'ThinkPad E15 Gen 4', type: 'Laptop', cpu: 'Intel Core i5 12th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '15.6" FHD IPS', specs: 'Intel Core i5 12th Gen • 16GB DDR4 • 512GB SSD • 15.6" FHD IPS' },
  { brand: 'Lenovo', model: 'ThinkPad L14 Gen 2', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '14.0" FHD', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB SSD • 14.0" FHD' },
  { brand: 'Lenovo', model: 'ThinkPad X1 Carbon Gen 9', type: 'Laptop', cpu: 'Intel Core i7 11th Gen', ram: '16GB LPDDR4x', storage: '512GB NVMe SSD', screen: '14.0" WUXGA', specs: 'Intel Core i7 11th Gen • 16GB LPDDR4x • 512GB NVMe SSD • 14.0" WUXGA' },
  { brand: 'Lenovo', model: 'IdeaPad Slim 3', type: 'Laptop', cpu: 'Intel Core i5 12th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '15.6" FHD', specs: 'Intel Core i5 12th Gen • 16GB DDR4 • 512GB SSD • 15.6" FHD' },
  { brand: 'Lenovo', model: 'IdeaPad Slim 5', type: 'Laptop', cpu: 'AMD Ryzen 7 5700U', ram: '16GB DDR4', storage: '512GB SSD', screen: '14.0" FHD IPS', specs: 'AMD Ryzen 7 5700U • 16GB DDR4 • 512GB SSD • 14.0" FHD IPS' },
  { brand: 'Lenovo', model: 'ThinkCentre M70q Tiny', type: 'Desktop', cpu: 'Intel Core i5 10th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: 'External Monitor', specs: 'Intel Core i5 10th Gen • 16GB DDR4 • 512GB SSD • Tiny Desktop' },

  // HP Laptops & Desktops
  { brand: 'HP', model: 'EliteBook 840 G8', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '16GB DDR4', storage: '512GB NVMe SSD', screen: '14.0" FHD IPS', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD IPS' },
  { brand: 'HP', model: 'EliteBook 840 G7', type: 'Laptop', cpu: 'Intel Core i5 10th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '14.0" FHD IPS', specs: 'Intel Core i5 10th Gen • 16GB DDR4 • 512GB SSD • 14.0" FHD IPS' },
  { brand: 'HP', model: 'EliteBook 840 G6', type: 'Laptop', cpu: 'Intel Core i5 8th Gen', ram: '16GB DDR4', storage: '256GB SSD', screen: '14.0" FHD', specs: 'Intel Core i5 8th Gen • 16GB DDR4 • 256GB SSD • 14.0" FHD' },
  { brand: 'HP', model: 'ProBook 440 G8', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '16GB DDR4', storage: '512GB NVMe SSD', screen: '14.0" FHD', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD' },
  { brand: 'HP', model: 'ProBook 450 G8', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '16GB DDR4', storage: '512GB NVMe SSD', screen: '15.6" FHD', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 15.6" FHD' },
  { brand: 'HP', model: 'Pavilion 14', type: 'Laptop', cpu: 'Intel Core i5 12th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '14.0" FHD IPS', specs: 'Intel Core i5 12th Gen • 16GB DDR4 • 512GB SSD • 14.0" FHD IPS' },
  { brand: 'HP', model: 'HP 15s', type: 'Laptop', cpu: 'Intel Core i3 11th Gen', ram: '8GB DDR4', storage: '512GB SSD', screen: '15.6" FHD', specs: 'Intel Core i3 11th Gen • 8GB DDR4 • 512GB SSD • 15.6" FHD' },
  { brand: 'HP', model: 'ProDesk 400 G6 Mini', type: 'Desktop', cpu: 'Intel Core i5 10th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: 'External Monitor', specs: 'Intel Core i5 10th Gen • 16GB DDR4 • 512GB SSD • Mini PC' },

  // Apple MacBooks & Macs
  { brand: 'Apple', model: 'MacBook Air M1 (2020)', type: 'MacBook', cpu: 'Apple M1 (8-Core)', ram: '8GB Unified RAM', storage: '256GB SSD', screen: '13.3" Retina', specs: 'Apple M1 (8-Core CPU / 7-Core GPU) • 8GB Unified RAM • 256GB SSD • 13.3" Retina' },
  { brand: 'Apple', model: 'MacBook Air M2 (2022)', type: 'MacBook', cpu: 'Apple M2 (8-Core)', ram: '16GB Unified RAM', storage: '512GB SSD', screen: '13.6" Liquid Retina', specs: 'Apple M2 • 16GB Unified RAM • 512GB SSD • 13.6" Liquid Retina' },
  { brand: 'Apple', model: 'MacBook Air M3 (2024)', type: 'MacBook', cpu: 'Apple M3 (8-Core)', ram: '16GB Unified RAM', storage: '512GB SSD', screen: '13.6" Liquid Retina', specs: 'Apple M3 • 16GB Unified RAM • 512GB SSD • 13.6" Liquid Retina' },
  { brand: 'Apple', model: 'MacBook Pro 14" M1 Pro', type: 'MacBook', cpu: 'Apple M1 Pro (8-Core)', ram: '16GB Unified RAM', storage: '512GB NVMe SSD', screen: '14.2" Liquid Retina XDR', specs: 'Apple M1 Pro • 16GB Unified RAM • 512GB NVMe SSD • 14.2" XDR (120Hz)' },
  { brand: 'Apple', model: 'MacBook Pro 14" M2 Pro', type: 'MacBook', cpu: 'Apple M2 Pro (10-Core)', ram: '16GB Unified RAM', storage: '512GB NVMe SSD', screen: '14.2" Liquid Retina XDR', specs: 'Apple M2 Pro • 16GB Unified RAM • 512GB NVMe SSD • 14.2" XDR' },
  { brand: 'Apple', model: 'MacBook Pro 14" M3 Pro', type: 'MacBook', cpu: 'Apple M3 Pro (11-Core)', ram: '18GB Unified RAM', storage: '512GB NVMe SSD', screen: '14.2" Liquid Retina XDR', specs: 'Apple M3 Pro • 18GB Unified RAM • 512GB NVMe SSD • 14.2" XDR' },
  { brand: 'Apple', model: 'Mac Mini M2', type: 'MacBook', cpu: 'Apple M2 (8-Core)', ram: '16GB Unified RAM', storage: '512GB SSD', screen: 'External Monitor', specs: 'Apple M2 (8-Core CPU / 10-Core GPU) • 16GB Unified RAM • 512GB SSD' },

  // Asus & Acer
  { brand: 'Asus', model: 'ExpertBook B1', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '14.0" FHD', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB SSD • 14.0" FHD' },
  { brand: 'Asus', model: 'VivoBook 15', type: 'Laptop', cpu: 'Intel Core i5 12th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '15.6" FHD', specs: 'Intel Core i5 12th Gen • 16GB DDR4 • 512GB SSD • 15.6" FHD' },
  { brand: 'Acer', model: 'Aspire 5', type: 'Laptop', cpu: 'Intel Core i5 12th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '15.6" FHD IPS', specs: 'Intel Core i5 12th Gen • 16GB DDR4 • 512GB SSD • 15.6" FHD IPS' },
  { brand: 'Acer', model: 'TravelMate P2', type: 'Laptop', cpu: 'Intel Core i5 11th Gen', ram: '16GB DDR4', storage: '512GB SSD', screen: '14.0" FHD', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB SSD • 14.0" FHD' },

  // Monitors
  { brand: 'Dell', model: 'P2419H 24" FHD Monitor', type: 'Monitor', cpu: 'N/A', ram: 'N/A', storage: 'N/A', screen: '23.8" FHD IPS', specs: '23.8" FHD IPS Display • HDMI/VGA/DisplayPort' },
  { brand: 'HP', model: 'V24v G5 24" Monitor', type: 'Monitor', cpu: 'N/A', ram: 'N/A', storage: 'N/A', screen: '23.8" FHD 75Hz', specs: '23.8" FHD 75Hz • HDMI/VGA' },
  { brand: 'LG', model: '24MP400-B 24" IPS', type: 'Monitor', cpu: 'N/A', ram: 'N/A', storage: 'N/A', screen: '24.0" FHD IPS 75Hz', specs: '24.0" FHD IPS 75Hz • HDMI/VGA' }
];

const PROCESSOR_LIST = [
  'Intel Core i3 11th Gen', 'Intel Core i3 12th Gen',
  'Intel Core i5 8th Gen', 'Intel Core i5 10th Gen', 'Intel Core i5 11th Gen', 'Intel Core i5 12th Gen', 'Intel Core i5 13th Gen',
  'Intel Core i7 8th Gen', 'Intel Core i7 10th Gen', 'Intel Core i7 11th Gen', 'Intel Core i7 12th Gen', 'Intel Core i7 13th Gen',
  'Intel Core i9 12th/13th Gen', 'Intel Core Ultra 5 / 7',
  'AMD Ryzen 3 3200U/5300U', 'AMD Ryzen 5 4500U/5500U/5625U', 'AMD Ryzen 7 5700U/5800U/7730U',
  'Apple M1 (8-Core)', 'Apple M1 Pro (8/10-Core)', 'Apple M2 (8-Core)', 'Apple M2 Pro (10/12-Core)', 'Apple M3 (8-Core)', 'Apple M3 Pro',
  'Other / Custom CPU'
];

const RAM_LIST = [
  '4GB DDR4', '8GB DDR4', '16GB DDR4', '32GB DDR4',
  '8GB DDR5', '16GB DDR5', '32GB DDR5', '64GB DDR5',
  '8GB Unified RAM', '16GB Unified RAM', '18GB Unified RAM', '36GB Unified RAM',
  'Other RAM'
];

const STORAGE_LIST = [
  '128GB SSD', '256GB SSD', '256GB NVMe SSD', '512GB SSD', '512GB NVMe SSD',
  '1TB SSD', '1TB NVMe SSD', '2TB NVMe SSD', '500GB HDD', '1TB HDD',
  '256GB SSD + 1TB HDD', 'Other Storage'
];

const SCREEN_LIST = [
  '13.3" FHD (1920x1080)', '13.3" Retina Display',
  '13.6" Liquid Retina', '14.0" HD Anti-Glare', '14.0" FHD (1920x1080)',
  '14.0" FHD IPS', '14.0" WUXGA (1920x1200)', '14.2" Liquid Retina XDR',
  '15.6" FHD (1920x1080)', '15.6" FHD IPS 120Hz', '16.0" WUXGA / Retina',
  '22" Monitor', '24" FHD Monitor', '27" 4K Monitor', 'External Monitor / None',
  'Other Screen'
];

/* UTILITY */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const parseDate = (s) => {
  if (!s) return new Date(NaN);
  if (s instanceof Date) return isNaN(s.getTime()) ? new Date(NaN) : s;
  if (typeof s !== 'string') return new Date(s);
  const p = s.split('-');
  if (p.length < 3) return new Date(s);
  return new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2]));
};
const fmtDate = (s) => { if (!s) return '—'; const d = parseDate(s); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
const fmtCurrency = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
const isActiveRental = (r) => r.status === 'active';

/* Phone Helpers */
const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
const isValidPhone = (p) => /^[0-9]{10}$/.test(cleanPhone(p));
const waPhone = (p) => {
  const c = cleanPhone(p);
  return c.length === 10 ? '91' + c : c;
};
const fmtPhone = (p) => {
  const c = cleanPhone(p);
  if (c.length === 10) return `${c.slice(0, 5)} ${c.slice(5)}`;
  return p || '';
};

function escHtml(s) {
  if (!s && s !== 0) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function getItemFullTitle(item) {
  if (!item) return 'Unknown Item';
  const parts = [item.brand, item.model].filter(Boolean);
  return parts.join(' ') || item.type || 'Item';
}

function getInitials(name) {
  if (!name) return 'TT';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getBrandBadgeClass(brand) {
  const b = (brand || '').toLowerCase();
  if (b.includes('dell')) return 'brand-chip-dell';
  if (b.includes('lenovo') || b.includes('thinkpad')) return 'brand-chip-lenovo';
  if (b.includes('hp') || b.includes('hewlett') || b.includes('elitebook') || b.includes('probook')) return 'brand-chip-hp';
  if (b.includes('apple') || b.includes('macbook')) return 'brand-chip-apple';
  return 'brand-chip-default';
}

function cycleDays(rental) {
  if (rental.billingCycle === 'weekly') return 7;
  if (rental.billingCycle === 'monthly') return 30;
  return Math.max(1, parseInt(rental.customDays) || 30);
}

function rentalStatus(rental) {
  const payments = state.payments.filter(p => p.rentalId === rental.id);
  const cd = cycleDays(rental);
  const start = parseDate(rental.startDate);
  const now = new Date();
  const daysSince = Math.floor((now - start) / 86400000);
  const completedCycles = Math.max(0, Math.floor(daysSince / cd));
  const totalExpected = completedCycles * (rental.rentAmount || 0);
  const totalPaid = payments.reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding = Math.max(0, totalExpected - totalPaid);
  const currentCycleEnd = new Date(start.getTime() + completedCycles * cd * 86400000);
  const nextDueDate = new Date(start.getTime() + (completedCycles + 1) * cd * 86400000);
  const daysUntilDue = Math.round((nextDueDate - now) / 86400000);
  const isOverdue = totalExpected > totalPaid && completedCycles > 0;
  const daysOverdue = isOverdue ? Math.round((now - currentCycleEnd) / 86400000) : 0;
  const nextCyclePaid = totalPaid >= (completedCycles + 1) * (rental.rentAmount || 0);
  const isDueSoon = !nextCyclePaid && daysUntilDue >= 0 && daysUntilDue <= 7;
  return { totalExpected, totalPaid, outstanding, nextDueDate, daysUntilDue, isOverdue, daysOverdue, isDueSoon };
}

function getItem(id) { return state.items.find(i => i.id === id); }
function getCustomer(id) { return state.customers.find(c => c.id === id); }
function getRental(id) { return state.rentals.find(r => r.id === id); }

function getActiveRentalForItem(itemId) {
  return state.rentals.find(r => r.itemId === itemId && isActiveRental(r));
}

function isItemAvailable(item, preselectedItemId) {
  if (!item) return false;
  if (preselectedItemId && item.id === preselectedItemId) return true;
  const s = String(item.status || '').toLowerCase().trim();
  if (s === 'repair') return false;
  const activeRental = getActiveRentalForItem(item.id);
  return !activeRental;
}

function sanitizeFleetState() {
  if (!state || !Array.isArray(state.items)) return;
  state.items.forEach(item => {
    if (!item) return;
    const s = String(item.status || '').toLowerCase().trim();
    if (s === 'repair') {
      item.status = 'repair';
    } else {
      const activeRental = getActiveRentalForItem(item.id);
      item.status = activeRental ? 'rented' : 'available';
    }
  });
}

function getAvailableItems(preselectedItemId) {
  sanitizeFleetState();
  return state.items.filter(i => isItemAvailable(i, preselectedItemId));
}

function buildWaReminderMessage(customer, rental, item, status) {
  const itemTitle = getItemFullTitle(item);
  const specsText = item && item.specs ? ` (${item.specs})` : '';
  const dueInfo = status.isOverdue 
    ? `was due on *${fmtDate(status.nextDueDate)}* (*${status.daysOverdue} days overdue*)`
    : `is due on *${fmtDate(status.nextDueDate)}*`;
  
  return `Hello *${customer.name}*,\n\nThis is a gentle payment reminder from *TechTrove Systems*:\n\n• *Device*: ${itemTitle}${specsText}\n• *Rent Amount*: ₹${rental.rentAmount} / ${rental.billingCycle}\n• *Due Status*: ${dueInfo}\n• *Outstanding Balance*: *₹${status.outstanding || rental.rentAmount}*\n\nPlease make the payment via GPay / PhonePe / UPI to confirm your rental continuation.\n\nThank you!\n*TechTrove Systems*`;
}

function openWhatsAppReminder(phone, message) {
  const target = waPhone(phone);
  if (!target) {
    UI.showToast('Invalid phone number for WhatsApp', 'error');
    return;
  }
  const url = `https://wa.me/${target}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function openWhatsAppTech(phone, itemTitle, serial, technicianName) {
  const target = waPhone(phone);
  if (!target) {
    UI.showToast('Invalid technician phone number', 'error');
    return;
  }
  const msg = `Hello ${technicianName || 'Sir'},\n\nFollowing up from *TechTrove Systems* regarding repair status for:\n• *Device*: ${itemTitle}\n• *Serial / Asset Tag*: ${serial}\n\nCould you please update the status and estimated return date?\n\nThank you!`;
  const url = `https://wa.me/${target}?text=${encodeURIComponent(msg)}`;
  window.open(url, '_blank');
}

/* SYSTEM & BACKGROUND NOTIFICATIONS (OUTSIDE APP & LOCKSCREEN) */
const AppNotif = {
  get localNotif() {
    try {
      if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications) {
        return window.Capacitor.Plugins.LocalNotifications;
      }
    } catch(e) {}
    return null;
  },

  async requestPermission() {
    // 1. Check Capacitor plugin on Android phone
    const ln = this.localNotif;
    if (ln) {
      try {
        const res = await ln.requestPermissions();
        if (res && res.display === 'granted') return true;
      } catch(e) { console.error('Capacitor notification perm error', e); }
    }

    // 2. Web / PWA Notification API
    if ('Notification' in window) {
      try {
        if (Notification.permission === 'default') {
          const res = await Notification.requestPermission();
          return res === 'granted';
        }
        return Notification.permission === 'granted';
      } catch(e) {}
    }
    return false;
  },

  async sendSystemNotification(title, body, id = 1) {
    if (!notifEnabled) return;

    // 1. Native Android system notification via Capacitor (Appears outside app & on lockscreen!)
    const ln = this.localNotif;
    if (ln) {
      try {
        await ln.schedule({
          notifications: [{
            title,
            body,
            id: typeof id === 'number' ? id : Math.floor(Math.random() * 100000),
            schedule: { at: new Date(Date.now() + 300) },
            sound: 'beep.wav'
          }]
        });
        return;
      } catch(e) { console.warn('Capacitor schedule fallback', e); }
    }

    // 2. Service Worker System Notification (Shows system notification outside active browser tab)
    if ('serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        if (reg && reg.showNotification) {
          reg.showNotification(title, {
            body,
            icon: '/icon.svg',
            badge: '/icon.svg',
            vibrate: [200, 100, 200],
            tag: 'techtrove-alert-' + (id || Date.now())
          });
          return;
        }
      } catch(e) {}
    }

    // 3. Fallback Standard Window Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(title, { body, icon: '/icon.svg' });
      } catch(e) {}
    }
  },

  async syncBackgroundSchedules() {
    if (!notifEnabled) return;
    const ln = this.localNotif;
    if (!ln) return;

    try {
      const overdue = getOverdueList();
      const dueSoon = getDueSoonList();

      if (overdue.length === 0 && dueSoon.length === 0) return;

      const now = new Date();
      const morning = new Date();
      morning.setHours(9, 0, 0, 0);
      if (morning <= now) {
        morning.setDate(morning.getDate() + 1);
      }

      let summaryText = overdue.length > 0
        ? `${overdue.length} overdue rental payment(s) require follow-up.`
        : `${dueSoon.length} payment(s) due this week.`;

      await ln.schedule({
        notifications: [{
          title: 'TechTrove Payment Reminder',
          body: summaryText,
          id: 9901,
          schedule: {
            at: morning,
            repeats: true,
            every: 'day'
          },
          sound: 'beep.wav'
        }]
      });
    } catch(e) {
      console.warn('Background schedule sync', e);
    }
  }
};

function requestNotifPermission() {
  AppNotif.requestPermission();
}

function sendDueNotification(title, body) {
  AppNotif.sendSystemNotification(title, body);
}

function checkAndNotifyDues() {
  if (!notifEnabled) return;
  const todayKey = today();
  if (lastNotifDate === todayKey) return;
  const overdue = getOverdueList();
  if (overdue.length > 0) {
    const names = overdue.slice(0, 3).map(x => x.customer.name).join(', ');
    const more = overdue.length > 3 ? ` and ${overdue.length - 3} more` : '';
    AppNotif.sendSystemNotification('Payment Due Reminder — TechTrove', `${overdue.length} overdue rental(s): ${names}${more}`, 101);
  }
  AppNotif.syncBackgroundSchedules();
  lastNotifDate = todayKey;
  try { localStorage.setItem('lastNotifDate', todayKey); } catch(e) {}
}

function getOverdueList() {
  let list = [];
  state.rentals.filter(r => r.status === 'active').forEach(r => {
    const st = rentalStatus(r);
    const c = getCustomer(r.customerId);
    const item = getItem(r.itemId);
    if (c && st.isOverdue) list.push({ rental: r, status: st, customer: c, item });
  });
  return list.sort((a, b) => b.status.daysOverdue - a.status.daysOverdue);
}

function getDueSoonList() {
  let list = [];
  state.rentals.filter(r => r.status === 'active').forEach(r => {
    const st = rentalStatus(r);
    const c = getCustomer(r.customerId);
    const item = getItem(r.itemId);
    if (c && !st.isOverdue && st.isDueSoon) list.push({ rental: r, status: st, customer: c, item });
  });
  return list.sort((a, b) => a.status.daysUntilDue - b.status.daysUntilDue);
}

function customerActiveRentals(customerId) {
  return state.rentals.filter(r => r.customerId === customerId && isActiveRental(r));
}
function customerAllRentals(customerId) {
  return state.rentals.filter(r => r.customerId === customerId);
}
function rentalPayments(rentalId) {
  return state.payments.filter(p => p.rentalId === rentalId).sort((a, b) => b.date.localeCompare(a.date));
}
function customerPayments(customerId) {
  const rentalIds = customerAllRentals(customerId).map(r => r.id);
  return state.payments.filter(p => rentalIds.includes(p.rentalId)).sort((a, b) => b.date.localeCompare(a.date));
}

/* AUTH */
const Auth = {
  _token: null,
  _role: 'admin',
  isLoggedIn() { return !!(localStorage.getItem('tt_token') || localStorage.getItem('tt_pass')); },
  getRole() {
    return localStorage.getItem('tt_role') || this._role || 'admin';
  },
  isAdmin() {
    return this.getRole() === 'admin';
  },
  isEmployee() {
    return this.getRole() === 'employee';
  },
  setRole(role) {
    this._role = role;
    localStorage.setItem('tt_role', role);
  },
  async login(password) {
    const pw = (password || '').trim();
    if (!pw) return false;
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw })
      });
      if (res.ok) {
        const data = await res.json();
        const token = data.token || (data.role === 'employee' ? 'employee-token' : 'admin-token');
        const role = data.role || (token.includes('employee') ? 'employee' : 'admin');
        localStorage.setItem('tt_token', token);
        localStorage.setItem('tt_pass', pw);
        localStorage.setItem('tt_role', role);
        this._token = token;
        this._role = role;
        return true;
      }
      const res2 = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw })
      });
      if (res2.ok) {
        const data2 = await res2.json();
        const token2 = data2.token || 'admin-token';
        const role2 = data2.role || (token2.includes('employee') ? 'employee' : 'admin');
        localStorage.setItem('tt_token', token2);
        localStorage.setItem('tt_pass', pw);
        localStorage.setItem('tt_role', role2);
        this._token = token2;
        this._role = role2;
        return true;
      }
    } catch(e) {}

    // Offline / local fallback credentials
    if (pw === 'rent123' || pw === 'admin123') {
      localStorage.setItem('tt_token', 'admin-token');
      localStorage.setItem('tt_pass', pw);
      localStorage.setItem('tt_role', 'admin');
      this._token = 'admin-token';
      this._role = 'admin';
      return true;
    }
    if (pw === 'staff123' || pw === 'emp123' || pw === 'team123') {
      localStorage.setItem('tt_token', 'employee-token');
      localStorage.setItem('tt_pass', pw);
      localStorage.setItem('tt_role', 'employee');
      this._token = 'employee-token';
      this._role = 'employee';
      return true;
    }
    return false;
  },
  logout() {
    this._token = null;
    this._role = 'admin';
    localStorage.removeItem('tt_token');
    localStorage.removeItem('tt_pass');
    localStorage.removeItem('tt_role');
    UI.showLogin();
  },
  restore() {
    this._token = localStorage.getItem('tt_token') || localStorage.getItem('tt_pass');
    this._role = localStorage.getItem('tt_role') || 'admin';
  },
  header() {
    const token = this._token || localStorage.getItem('tt_token') || localStorage.getItem('tt_pass');
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
      headers['Authorization'] = 'Bearer ' + token;
      headers['x-password'] = localStorage.getItem('tt_pass') || token;
    }
    return headers;
  }
};

/* DATA LAYER (OFFLINE-FIRST + DUAL STORAGE) */
const Data = {
  _saving: false,
  _dirty: false,
  async _fetch(url, opts) {
    const res = await fetch(url, opts);
    if (res.status === 401) { Auth.logout(); throw new Error('Unauthorized'); }
    return res;
  },
  save() {
    // 1. Immediately persist synchronously to localStorage first!
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
    } catch(e) {
      console.error('localStorage save failed:', e);
    }

    // 2. Background sync to backend API (Upstash Redis / server)
    this._dirty = true;
    if (this._saving) return;
    this._saving = true;
    this._dirty = false;
    fetch('/api/data', {
      method: 'POST',
      headers: Auth.header(),
      body: JSON.stringify(state)
    }).then(r => {
      if (r.status === 401) Auth.logout();
      return r;
    }).catch(e => console.warn('Server sync failed, data saved locally in browser:', e.message)).finally(() => {
      this._saving = false;
      if (this._dirty) this.save();
      else { checkAndNotifyDues(); UI.updateDueBanner(); }
    });
  },
  async load() {
    // 1. First ensure state is hydrated from localStorage
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.customers)) {
          state.customers = parsed.customers || [];
          state.items = parsed.items || [];
          state.rentals = parsed.rentals || [];
          state.payments = parsed.payments || [];
        }
      }
    } catch(e) {}

    // 2. Background fetch authoritative state from server if authenticated
    UI.showLoading(true);
    try {
      const res = await this._fetch('/api/data', { headers: Auth.header() });
      if (res.ok) {
        const d = await res.json();
        if (d && Array.isArray(d.customers) && Array.isArray(d.items)) {
          state.customers = d.customers || [];
          state.items = d.items || [];
          state.rentals = d.rentals || [];
          state.payments = d.payments || [];
          try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
        }
      }
    } catch(e) {
      if (e.message !== 'Unauthorized') console.warn('Server load failed, running on offline data:', e.message);
    } finally {
      sanitizeFleetState();
      UI.showLoading(false);
      UI.renderAll();
    }
  },
  async sync(silent = true) {
    if (!Auth.isLoggedIn()) return;
    if (this._saving) return;
    const isModalOpen = !document.getElementById('modalOverlay')?.classList.contains('hidden');
    const activeEl = document.activeElement;
    const isTyping = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.tagName === 'SELECT');
    if (isModalOpen && isTyping) return;

    if (!silent) UI.showLoading(true);
    try {
      const res = await this._fetch('/api/data', { headers: Auth.header() });
      if (res.ok) {
        const d = await res.json();
        if (d && Array.isArray(d.customers) && Array.isArray(d.items)) {
          const currentStr = JSON.stringify(state);
          const serverStr = JSON.stringify(d);
          if (currentStr !== serverStr) {
            state.customers = d.customers || [];
            state.items = d.items || [];
            state.rentals = d.rentals || [];
            state.payments = d.payments || [];
            sanitizeFleetState();
            try { localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state)); } catch(e) {}
            if (!isModalOpen) {
              UI.renderAll();
              UI.updateDueBanner();
            }
          }
        }
      }
    } catch(e) {
      if (e.message !== 'Unauthorized') console.warn('Background sync:', e.message);
    } finally {
      if (!silent) UI.showLoading(false);
    }
  },
  exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `techtrove_backup_${today()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  },
  importJSON(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const d = JSON.parse(e.target.result);
        if (!d.customers || !d.items || !d.rentals || !d.payments) throw new Error('Invalid format');
        state = d;
        Data.save();
        UI.showToast('Data imported successfully', 'success');
        UI.renderAll();
      } catch(err) {
        UI.showToast('Invalid backup file: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
  }
};
window.Data = Data;

/* UI LAYER */
const UI = {
  showLogin() {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('app').classList.add('hidden');
    document.getElementById('loginError').classList.add('hidden');
    document.getElementById('loginPassword').value = '';
    document.getElementById('loginPassword').focus();
  },

  showApp() {
    document.getElementById('splash').classList.add('hidden');
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
  },

  showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.className = 'toast ' + type;
    t.classList.add('visible');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('visible'), 2800);
  },

  showModal(html) {
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.remove('hidden');
  },

  hideModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
  },

  showConfirm(msg, onConfirm) {
    document.getElementById('confirmContent').innerHTML = `
      <p>${msg}</p>
      <div class="btn-group">
        <button class="btn btn-outline btn-sm" onclick="UI.hideConfirm()">Cancel</button>
        <button class="btn btn-danger btn-sm" id="confirmOkBtn">Confirm</button>
      </div>`;
    document.getElementById('confirmOverlay').classList.remove('hidden');
    document.getElementById('confirmOkBtn').onclick = () => { UI.hideConfirm(); onConfirm(); };
  },

  hideConfirm() {
    document.getElementById('confirmOverlay').classList.add('hidden');
  },

  showLoading(show) {
    const el = document.getElementById('loadingOverlay');
    if (show) el.classList.remove('hidden');
    else el.classList.add('hidden');
  },

  navigate(page, params = null) {
    currentPage = page;
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('page-' + page);
    if (target) target.classList.add('active');

    document.querySelectorAll('.nav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });

    const fab = document.getElementById('fabAdd');
    fab.classList.toggle('hidden', page !== 'inventory');

    const backBtn = document.getElementById('headerBack');
    backBtn.classList.toggle('hidden', pageStack.length <= 1);

    const titles = {
      'dashboard': 'TechTrove Console',
      'customers': 'Customers',
      'customer-detail': 'Customer Agreement',
      'inventory': 'Fleet Inventory',
      'repairs': 'Repairs Tracker',
      'search': 'Global Search',
      'more': 'Settings & Backup'
    };
    const titleText = titles[page] || 'TechTrove Console';
    const headerTitleEl = document.getElementById('headerTitle');
    if (headerTitleEl) headerTitleEl.textContent = titleText;
    const desktopTitleEl = document.getElementById('desktopHeaderTitle');
    if (desktopTitleEl) desktopTitleEl.textContent = titleText;

    // Sync Desktop Sidebar active links
    document.querySelectorAll('.desktop-nav-item').forEach(b => {
      b.classList.toggle('active', b.dataset.page === page);
    });

    // Sync Desktop Topbar Contextual Primary Action
    const desktopPrimaryBtn = document.getElementById('desktopPrimaryBtn');
    if (desktopPrimaryBtn) {
      const primaryLabels = {
        'dashboard': '+ New Rental',
        'customers': '+ Add Customer',
        'customer-detail': '+ New Rental',
        'inventory': '+ Add Laptop',
        'repairs': '+ Log Repair',
        'search': '+ New Rental',
        'more': 'Lock Console'
      };
      desktopPrimaryBtn.innerHTML = `<span>${primaryLabels[page] || '+ New Rental'}</span>`;
    }

    if (page === 'dashboard') this.renderDashboard();
    else if (page === 'customers') this.renderCustomers();
    else if (page === 'customer-detail') this.renderCustomerDetail(params);
    else if (page === 'inventory') this.renderInventory();
    else if (page === 'repairs') this.renderRepairs();
    else if (page === 'search') this.renderSearch();
    else if (page === 'more') this.renderMore();

    this.updateDueBanner();
  },

  handleDesktopPrimaryAction() {
    if (currentPage === 'dashboard' || currentPage === 'customer-detail') this.showAddRentalModal();
    else if (currentPage === 'customers') this.showAddCustomerModal();
    else if (currentPage === 'inventory') this.showAddItemModal();
    else if (currentPage === 'repairs') this.showSendToRepairModal();
    else if (currentPage === 'more') Auth.logout();
    else this.showAddRentalModal();
  },

  showAddRepairModal() {
    this.showSendToRepairModal();
  },

  sendRentalWaReminder(rentalId) {
    const r = getRental(rentalId);
    if (!r) return;
    const c = getCustomer(r.customerId);
    const item = getItem(r.itemId);
    if (!c) return;
    const st = rentalStatus(r);
    const msg = buildWaReminderMessage(c, r, item, st);
    openWhatsAppReminder(c.phone, msg);
  },

  sendTechWaReminder(itemId) {
    const item = getItem(itemId);
    if (!item || !item.repairInfo) return;
    const rep = item.repairInfo;
    openWhatsAppTech(rep.servicePhone, getItemFullTitle(item), item.serial, rep.servicePerson);
  },

  sendCustomerWaMessage(customerId) {
    const c = getCustomer(customerId);
    if (!c) return;
    const msg = `Hello ${c.name}, from TechTrove Systems.`;
    openWhatsAppReminder(c.phone, msg);
  },

  handleDesktopSearch(q) {
    if (currentPage === 'customers') this.renderCustomers(q);
    else if (currentPage === 'inventory') this.renderInventory(q);
    else if (currentPage === 'repairs') this.renderRepairs(q);
    else {
      this.navigate('search');
      setTimeout(() => {
        const input = document.getElementById('globalSearchInput');
        if (input) { input.value = q; this.performSearch(q); }
      }, 50);
    }
  },

  goBack() {
    if (pageStack.length > 1) {
      pageStack.pop();
      const prev = pageStack[pageStack.length - 1];
      this.navigate(prev.page, prev.params);
    } else {
      this.navigate('dashboard');
    }
  },

  pushPage(page, params = null) {
    pageStack.push({ page, params });
    this.navigate(page, params);
  },

  updateDueBanner() {
    const banner = document.getElementById('dueBanner');
    const badge = document.getElementById('notifBadge');
    const overdue = getOverdueList();
    const dueSoon = getDueSoonList();
    const totalDues = overdue.length + dueSoon.length;

    if (badge) {
      if (totalDues > 0) {
        badge.textContent = totalDues;
        badge.classList.remove('hidden');
      } else {
        badge.classList.add('hidden');
      }
    }

    if (banner) {
      if (overdue.length > 0) {
        banner.className = 'due-alert-banner';
        banner.innerHTML = `<span class="due-alert-icon">${Icons.alert}</span> <span><strong>${overdue.length} Overdue Payment(s)</strong> — Tap to review & send reminders</span>`;
        banner.classList.remove('hidden');
      } else if (dueSoon.length > 0) {
        banner.className = 'due-alert-banner due-soon-banner';
        banner.innerHTML = `<span class="due-alert-icon">${Icons.bell}</span> <span><strong>${dueSoon.length} Payment(s) Due Within 7 Days</strong></span>`;
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }
  },

  renderAll() {
    this.navigate(currentPage, pageStack[pageStack.length - 1]?.params);
  },

  /* REPAIRS FILTER SHORTCUT */
  openRepairsFilter() {
    this.navigate('repairs');
  },

  /* DASHBOARD (KUVERA FINTECH OPS CONSOLE) */
  renderDashboard() {
    const activeRentals = state.rentals.filter(isActiveRental);
    const repairItems = state.items.filter(i => i.status === 'repair');
    const overdueList = getOverdueList();
    const dueSoonList = getDueSoonList();

    // Financial Metrics
    const totalRevenueCollected = state.payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalOverdueOutstanding = overdueList.reduce((sum, item) => sum + (item.status.outstanding || item.rental.rentAmount || 0), 0);
    const dueSoonAmount = dueSoonList.reduce((sum, item) => sum + (item.rental.rentAmount || 0), 0);
    const criticalOverdueCount = overdueList.filter(x => x.status.daysOverdue > 30).length;

    // Billing Settlement Ratio Calculations
    const grandTotal = totalRevenueCollected + totalOverdueOutstanding + dueSoonAmount;
    const settledPct = grandTotal > 0 ? Math.min(100, Math.max(5, Math.round((totalRevenueCollected / grandTotal) * 100))) : 100;
    const dueSoonPct = grandTotal > 0 ? Math.round((dueSoonAmount / grandTotal) * 100) : 0;
    const overduePct = grandTotal > 0 ? Math.round((totalOverdueOutstanding / grandTotal) * 100) : 0;

    // Fleet Utilization Calculations
    const totalUnits = state.items.length;
    const deployedUnits = activeRentals.length;
    const availableUnits = state.items.filter(i => i.status === 'available').length;
    const repairUnits = repairItems.length;
    const deployedPct = totalUnits > 0 ? Math.round((deployedUnits / totalUnits) * 100) : 0;
    const availablePct = totalUnits > 0 ? Math.round((availableUnits / totalUnits) * 100) : 0;
    const repairPct = totalUnits > 0 ? Math.round((repairUnits / totalUnits) * 100) : 0;

    // Combined "Needs attention" queue sorted by urgency
    const attentionList = [
      ...overdueList.map(x => ({ type: 'overdue', ...x })),
      ...dueSoonList.map(x => ({ type: 'dueSoon', ...x }))
    ];

    let html = `
    <!-- Top KPI Grid: Hero overdue figure + 3 Status Chips -->
    <div class="desktop-kpi-container">
      <div class="dash-hero-box">
        <div class="dash-hero-label">Total overdue outstanding</div>
        <div class="dash-hero-num ${totalOverdueOutstanding > 0 ? 'has-overdue' : ''}">
          ${fmtCurrency(totalOverdueOutstanding)}
        </div>
        <div class="dash-hero-meta">
          ${totalOverdueOutstanding > 0 ? `
            <span class="status-pill danger">
              <span class="status-dot danger"></span>
              ${overdueList.length} overdue rental${overdueList.length === 1 ? '' : 's'}
            </span>
            ${criticalOverdueCount > 0 ? `<span style="color:var(--text-muted);font-size:0.75rem">&middot; ${criticalOverdueCount} critical (&gt;30d)</span>` : ''}
          ` : `
            <span class="status-pill ok">
              <span class="status-dot ok"></span>
              All active rentals are paid up to date
            </span>
          `}
        </div>

        <!-- Kuvera Billing Settlement Progress Meter -->
        <div class="fintech-meter-box">
          <div class="fintech-meter-header">
            <span>Billing Settlement Ratio</span>
            <span style="color:var(--status-ok);font-weight:700" class="tnum">${settledPct}% Collected</span>
          </div>
          <div class="fintech-meter-track">
            <div class="fintech-meter-fill-ok" style="width: ${settledPct}%" title="Settled"></div>
            ${dueSoonPct > 0 ? `<div class="fintech-meter-fill-warn" style="width: ${dueSoonPct}%" title="Due Soon"></div>` : ''}
            ${overduePct > 0 ? `<div class="fintech-meter-fill-danger" style="width: ${overduePct}%" title="Overdue"></div>` : ''}
          </div>
          <div class="fintech-meter-legend">
            <span style="display:flex;align-items:center;gap:4px"><span class="status-dot ok"></span> ${fmtCurrency(totalRevenueCollected)} Settled</span>
            ${dueSoonAmount > 0 ? `<span style="display:flex;align-items:center;gap:4px"><span class="status-dot warn"></span> ${fmtCurrency(dueSoonAmount)} Due 7d</span>` : ''}
            ${totalOverdueOutstanding > 0 ? `<span style="display:flex;align-items:center;gap:4px"><span class="status-dot danger"></span> ${fmtCurrency(totalOverdueOutstanding)} Overdue</span>` : ''}
          </div>
        </div>
      </div>

      <!-- 3 Stat Chips with Visual Sub-Metrics & Fleet Allocation -->
      <div class="dash-chips-row">
        <div class="stat-chip" onclick="UI.navigate('customers')">
          <div class="stat-chip-header">
            <span class="status-dot ok"></span>
            <span class="stat-chip-num">${activeRentals.length}</span>
          </div>
          <div class="stat-chip-label">Active rentals</div>
          <div class="stat-chip-sub"><span style="color:var(--status-ok);font-weight:600">${deployedPct}% Utilization</span></div>
        </div>
        <div class="stat-chip" onclick="UI.navigate('customers')">
          <div class="stat-chip-header">
            <span class="status-dot ${dueSoonList.length > 0 ? 'warn' : 'ok'}"></span>
            <span class="stat-chip-num">${dueSoonList.length}</span>
          </div>
          <div class="stat-chip-label">Due this week</div>
          <div class="stat-chip-sub"><span style="color:var(--status-warn);font-weight:600">${dueSoonAmount > 0 ? fmtCurrency(dueSoonAmount) : '₹0'} Exp.</span></div>
        </div>
        <div class="stat-chip" onclick="UI.openRepairsFilter()">
          <div class="stat-chip-header">
            <span class="status-dot ${repairItems.length > 0 ? 'danger' : 'ok'}"></span>
            <span class="stat-chip-num">${repairItems.length}</span>
          </div>
          <div class="stat-chip-label">Under repair</div>
          <div class="stat-chip-sub"><span style="color:${repairItems.length > 0 ? 'var(--status-danger)' : 'var(--text-dim)'};font-weight:600">${repairItems.length > 0 ? (repairItems[0].brand || '1 Device') : 'Fleet Ready'}</span></div>
        </div>
      </div>
    </div>

    <!-- Quick Action Command Row -->
    <div class="dash-cmd-row">
      <button class="cmd-btn" onclick="UI.showAddRentalModal()">
        ${Icons.rentals}
        <span>+ Rent device</span>
      </button>
      <button class="cmd-btn" onclick="UI.showAddItemModal()">
        ${Icons.inventory}
        <span>+ Add laptop</span>
      </button>
      <button class="cmd-btn" onclick="UI.showAddCustomerModal()">
        ${Icons.plus}
        <span>+ New client</span>
      </button>
    </div>

    <!-- Needs Attention Queue -->
    <div class="section-head">
      <div class="section-title">Needs attention</div>
      <div class="section-count">${attentionList.length} pending</div>
    </div>

    <div class="ops-table-head">
      <div>Status</div>
      <div>Customer</div>
      <div>Assigned Device</div>
      <div class="ops-th-amount">Outstanding</div>
      <div class="ops-th-actions">Actions</div>
    </div>

    <div class="ops-list">
      ${attentionList.length === 0 ? `
        <div class="ops-empty">
          <div class="ops-empty-icon">${Icons.check}</div>
          <div class="ops-empty-title">No overdue rentals</div>
          <div class="ops-empty-sub">All client payments are currently up to date.</div>
        </div>
      ` : attentionList.map(item => {
        const c = item.customer;
        const dev = item.item;
        const st = item.status;
        const isOverdue = item.type === 'overdue';
        const itemTitle = getItemFullTitle(dev);
        const waMsg = buildWaReminderMessage(c, item.rental, dev, st);
        const brandBadgeClass = getBrandBadgeClass(dev?.brand);
        const initials = getInitials(c.name);

        return `
        <div class="ops-row" onclick="UI.pushPage('customer-detail', '${c.id}')">
          <div class="ops-row-status">
            <span class="ops-status-badge ${isOverdue ? 'danger' : 'warn'}">
              <span class="status-dot ${isOverdue ? 'danger' : 'warn'}"></span>
              ${isOverdue ? `Overdue ${st.daysOverdue}d` : `Due in ${st.daysUntilDue}d`}
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
            <div class="avatar-initials">${initials}</div>
            <div class="ops-row-main">
              <div class="ops-row-title">${escHtml(c.name)}</div>
              <div class="ops-row-sub">
                <span class="${brandBadgeClass}" style="font-size:0.65rem;padding:1px 6px;border-radius:4px;font-weight:700">${escHtml(dev ? dev.brand : 'Laptop')}</span>
                <span>${escHtml(itemTitle)}</span>${dev && dev.specs ? ` &middot; ${escHtml(dev.specs)}` : ''}
              </div>
            </div>
          </div>
          <div class="ops-row-end">
            <div class="ops-row-amount ${isOverdue ? 'danger' : ''}">
              ${fmtCurrency(st.outstanding || item.rental.rentAmount)}
            </div>
            <button class="btn-micro btn-micro-wa" onclick="event.stopPropagation();UI.sendRentalWaReminder('${item.rental.id}')" title="Send WhatsApp Reminder">
              ${Icons.whatsapp}
              <span>WA</span>
            </button>
          </div>
        </div>`;
      }).join('')}
    </div>
    `;

    document.getElementById('page-dashboard').innerHTML = html;
  },

  /* CUSTOMERS / RENTALS LIST (OPS CONSOLE REDESIGN & MASTER-DETAIL SUPPORT) */
  renderCustomers(query, filter = 'all') {
    let list = state.customers;
    const searchInput = document.getElementById('customerSearch');
    const q = (query !== undefined ? query : (searchInput?.value || '')).trim().toLowerCase();
    
    if (q) {
      list = list.filter(c => c.name.toLowerCase().includes(q) || cleanPhone(c.phone).includes(cleanPhone(q)) || (c.address && c.address.toLowerCase().includes(q)));
    }

    const activeList = state.customers.filter(c => customerActiveRentals(c.id).length > 0);
    const overdueList = state.customers.filter(c => customerActiveRentals(c.id).some(r => rentalStatus(r).isOverdue));
    const inactiveList = state.customers.filter(c => customerActiveRentals(c.id).length === 0);

    if (filter === 'active') list = list.filter(c => customerActiveRentals(c.id).length > 0);
    else if (filter === 'overdue') list = list.filter(c => customerActiveRentals(c.id).some(r => rentalStatus(r).isOverdue));
    else if (filter === 'inactive') list = list.filter(c => customerActiveRentals(c.id).length === 0);

    list.sort((a, b) => a.name.localeCompare(b.name));

    let listHtml = '';
    if (list.length === 0) {
      listHtml = `
      <div class="ops-empty">
        <div class="ops-empty-icon">${Icons.customers}</div>
        <div class="ops-empty-title">No matching customers</div>
        <div class="ops-empty-sub">${q ? 'Try a different search keyword.' : 'No customers registered yet in your console.'}</div>
        <button class="btn btn-primary btn-micro" style="margin-top:12px;padding:8px 16px" onclick="UI.showAddCustomerModal()">+ Add Customer</button>
      </div>`;
    } else {
      list.forEach((c, idx) => {
        const active = customerActiveRentals(c.id);
        const hasOverdue = active.some(r => rentalStatus(r).isOverdue);
        const totalOutstanding = active.reduce((s, r) => s + rentalStatus(r).outstanding, 0);

        let statusText = 'No active rental';
        let statusClass = 'muted';
        if (active.length > 0) {
          if (hasOverdue) {
            const worstOverdue = Math.max(...active.map(r => rentalStatus(r).daysOverdue));
            statusText = `Overdue ${worstOverdue}d`;
            statusClass = 'danger';
          } else {
            statusText = `${active.length} active`;
            statusClass = 'ok';
          }
        }

        let subText = `${escHtml(fmtPhone(c.phone))}`;
        if (active.length > 0) {
          const deviceNames = active.map(r => {
            const it = getItem(r.itemId);
            return it ? getItemFullTitle(it) : 'Device';
          }).join(', ');
          subText += ` &middot; ${escHtml(deviceNames)}`;
        } else if (c.address) {
          subText += ` &middot; ${escHtml(c.address)}`;
        }

        const initials = getInitials(c.name);

        listHtml += `
        <div class="ops-row ${idx === 0 ? 'active-selection' : ''}" data-cust-id="${c.id}" onclick="UI.selectCustomer('${c.id}')">
          <div class="ops-row-status">
            <span class="ops-status-badge ${statusClass}">
              <span class="status-dot ${statusClass}"></span>
              ${statusText}
            </span>
          </div>
          <div style="display:flex;align-items:center;gap:12px;flex:1;min-width:0">
            <div class="avatar-initials">${initials}</div>
            <div class="ops-row-main">
              <div class="ops-row-title">${escHtml(c.name)}</div>
              <div class="ops-row-sub">${subText}</div>
            </div>
          </div>
          <div class="ops-row-end">
            ${totalOutstanding > 0 ? `
              <div class="ops-row-amount danger">
                ${fmtCurrency(totalOutstanding)}
              </div>
            ` : active.length > 0 ? `
              <div class="ops-row-amount" style="color:var(--status-ok)">
                ${fmtCurrency(active.reduce((s, r) => s + (r.rentAmount || 0), 0))}
              </div>
            ` : ''}
            <button class="btn-micro btn-micro-wa" onclick="event.stopPropagation();openWhatsAppReminder('${c.phone}', 'Hello ${c.name}, from TechTrove Systems.')" title="Message Client">
              ${Icons.whatsapp}
              <span>WA</span>
            </button>
          </div>
        </div>`;
      });
    }

    const listContainer = document.getElementById('customerListContainer');
    const countContainer = document.getElementById('customerSectionCount');
    if (listContainer && query !== undefined) {
      listContainer.innerHTML = listHtml;
      if (countContainer) countContainer.textContent = `${list.length} customer${list.length === 1 ? '' : 's'}`;
      if (list.length > 0 && window.innerWidth >= 1200) {
        this.selectCustomer(list[0].id, false);
      }
      return;
    }

    let html = `
    <div class="desktop-split-pane">
      <!-- Left Pane: Search, Filter Rail, & List -->
      <div class="desktop-pane-list">
        <!-- Top Live Search Bar -->
        <div class="search-input-wrap">
          <div class="search-icon-inside">${Icons.search}</div>
          <input type="search" id="customerSearch" class="ops-search-input" placeholder="Search customers, phone, address..." value="${escHtml(q)}" oninput="UI.renderCustomers(this.value, '${filter}')">
        </div>

        <!-- Client Status Filter Pills -->
        <div class="brand-pills-scroll">
          <button class="brand-pill ${filter === 'all' ? 'active' : ''}" onclick="UI.renderCustomers(undefined, 'all')">All (${state.customers.length})</button>
          <button class="brand-pill ${filter === 'active' ? 'active' : ''}" onclick="UI.renderCustomers(undefined, 'active')">Active (${activeList.length})</button>
          <button class="brand-pill ${filter === 'overdue' ? 'active' : ''}" onclick="UI.renderCustomers(undefined, 'overdue')">Overdue (${overdueList.length})</button>
          <button class="brand-pill ${filter === 'inactive' ? 'active' : ''}" onclick="UI.renderCustomers(undefined, 'inactive')">No Rental (${inactiveList.length})</button>
        </div>

        <!-- Section Count & Add Client Command -->
        <div class="section-head">
          <div class="section-title">Customers</div>
          <div class="section-count" id="customerSectionCount">${list.length} customer${list.length === 1 ? '' : 's'}</div>
        </div>

        <div class="ops-list" id="customerListContainer">
          ${listHtml}
        </div>
      </div>

      <!-- Right Pane: Desktop Live Agreement Detail Pane -->
      <div class="desktop-pane-detail" id="desktopCustomerDetailPane">
        ${list.length > 0 ? this.getCustomerDetailHtml(list[0].id) : `
          <div class="desktop-pane-empty-detail">
            <div class="ops-empty-icon">${Icons.customers}</div>
            <div class="ops-empty-title">No customer selected</div>
            <div class="ops-empty-sub">Select a customer from the left list to view their live agreement details.</div>
          </div>
        `}
      </div>
    </div>`;

    document.getElementById('page-customers').innerHTML = html;
  },

  selectCustomer(customerId, navigateOnMobile = true) {
    if (window.innerWidth >= 1200) {
      document.querySelectorAll('#customerListContainer .ops-row').forEach(r => {
        r.classList.toggle('active-selection', r.dataset.custId === customerId);
      });
      const detailPane = document.getElementById('desktopCustomerDetailPane');
      if (detailPane) {
        detailPane.innerHTML = this.getCustomerDetailHtml(customerId);
      }
    } else if (navigateOnMobile) {
      this.pushPage('customer-detail', customerId);
    }
  },

  getCustomerDetailHtml(customerId) {
    const c = getCustomer(customerId);
    if (!c) {
      return `<div class="desktop-pane-empty-detail"><div class="ops-empty-title">Customer not found</div></div>`;
    }

    const rentals = customerAllRentals(customerId);
    const allPayments = customerPayments(customerId);
    const activeRentals = rentals.filter(isActiveRental);
    const totalOutstanding = activeRentals.reduce((s, r) => s + rentalStatus(r).outstanding, 0);
    const initials = getInitials(c.name);

    let html = `
    <!-- Top Client Card (Kuvera Glassmorphic Header) -->
    <div class="card" style="margin-bottom:16px;position:relative;overflow:hidden">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:14px">
        <div style="display:flex;align-items:center;gap:14px">
          <div class="avatar-initials" style="width:48px;height:48px;font-size:1.15rem;border-radius:14px">
            ${initials}
          </div>
          <div>
            <h2 style="font-size:1.25rem;font-weight:800;letter-spacing:-0.4px;color:var(--text-primary);margin-bottom:2px">${escHtml(c.name)}</h2>
            <div style="font-size:0.84rem;color:var(--text-muted);display:flex;align-items:center;gap:10px;flex-wrap:wrap">
              <a href="tel:${escHtml(c.phone)}" style="color:var(--accent);text-decoration:none;font-weight:700;display:inline-flex;align-items:center;gap:4px">
                ${Icons.phone}
                <span class="tnum">${escHtml(fmtPhone(c.phone))}</span>
              </a>
              ${c.address ? `<span>&middot; ${escHtml(c.address)}</span>` : ''}
            </div>
          </div>
        </div>
        <div style="text-align:right">
          <span class="status-pill ${activeRentals.length > 0 ? (totalOutstanding > 0 ? 'danger' : 'ok') : 'muted'}">
            <span class="status-dot ${activeRentals.length > 0 ? (totalOutstanding > 0 ? 'danger' : 'ok') : 'muted'}"></span>
            ${activeRentals.length > 0 ? `${activeRentals.length} active rental${activeRentals.length === 1 ? '' : 's'}` : 'No active rentals'}
          </span>
        </div>
      </div>

      <!-- Quick Action Toolbar -->
      <div style="display:flex;gap:8px;margin-top:16px;flex-wrap:wrap">
        <button class="btn btn-primary btn-micro" onclick="UI.sendCustomerWaMessage('${c.id}')">
          ${Icons.whatsapp}
          <span>WhatsApp reminder</span>
        </button>
        <a href="tel:${escHtml(c.phone)}" class="btn btn-outline btn-micro" style="text-decoration:none">
          ${Icons.phone}
          <span>Call client</span>
        </a>
        <button class="btn btn-outline btn-micro" onclick="UI.showNewRentalModal('${c.id}')">
          ${Icons.plus}
          <span>+ New rental</span>
        </button>
        <button class="btn btn-outline btn-micro" onclick="UI.showEditCustomerModal('${c.id}')">
          Edit
        </button>
        ${Auth.isAdmin() ? `
          <button class="btn btn-outline btn-micro" onclick="UI.deleteCustomer('${c.id}')" style="color:var(--status-danger);border-color:var(--status-danger-border);margin-left:auto">
            Delete
          </button>
        ` : ''}
      </div>
    </div>`;

    /* Active Rentals Section */
    html += `
    <div class="section-head">
      <div class="section-title">Active agreements</div>
      <div class="section-count">${activeRentals.length} device${activeRentals.length === 1 ? '' : 's'}</div>
    </div>`;

    if (activeRentals.length === 0) {
      html += `
      <div class="ops-list" style="margin-bottom:16px">
        <div class="ops-empty">
          <div class="ops-empty-icon">${Icons.rentals}</div>
          <div class="ops-empty-title">No active rentals</div>
          <div class="ops-empty-sub">This client currently has no equipment assigned.</div>
          <button class="btn btn-primary btn-micro" style="margin-top:10px;padding:6px 14px" onclick="UI.showNewRentalModal('${c.id}')">+ Start new rental</button>
        </div>
      </div>`;
    } else {
      activeRentals.forEach(r => {
        const st = rentalStatus(r);
        const item = getItem(r.itemId);
        const itemTitle = getItemFullTitle(item);
        const waMsg = buildWaReminderMessage(c, r, item, st);
        const brandBadgeClass = getBrandBadgeClass(item?.brand);

        html += `
        <div class="card" style="margin-bottom:14px;border-left:3px solid ${st.isOverdue ? 'var(--status-danger)' : st.isDueSoon ? 'var(--status-warn)' : 'var(--status-ok)'}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="display:flex;align-items:flex-start;gap:10px">
              <span class="${brandBadgeClass}" style="padding:4px 8px;border-radius:6px;font-size:0.75rem;font-weight:800;margin-top:2px">
                ${escHtml(item ? item.brand : 'Laptop')}
              </span>
              <div>
                <div style="font-weight:800;font-size:1.02rem;color:var(--text-primary);letter-spacing:-0.2px">
                  ${escHtml(itemTitle)} <span class="status-pill muted" style="font-size:0.65rem;padding:1px 5px">${item ? item.type : 'Device'}</span>
                </div>
                <div style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">
                  SN: <span class="tnum" style="color:var(--text-primary);font-weight:700">${escHtml(item ? item.serial : 'N/A')}</span>${item && item.specs ? ` &middot; ${escHtml(item.specs)}` : ''}
                </div>
              </div>
            </div>
            <div style="text-align:right">
              <span class="ops-status-badge ${st.isOverdue ? 'danger' : st.isDueSoon ? 'warn' : 'ok'}">
                <span class="status-dot ${st.isOverdue ? 'danger' : st.isDueSoon ? 'warn' : 'ok'}"></span>
                ${st.isOverdue ? `Overdue ${st.daysOverdue}d` : st.isDueSoon ? `Due in ${st.daysUntilDue}d` : 'Current'}
              </span>
            </div>
          </div>

          <!-- Parameter Grid -->
          <div class="ops-param-grid" style="margin-top:14px;margin-bottom:14px">
            <div class="ops-param-item">
              <span class="ops-param-label">Rent rate</span>
              <span class="ops-param-value tnum" style="font-weight:700">${fmtCurrency(r.rentAmount)} / ${r.billingCycle}${r.billingCycle === 'custom' ? ` (${r.customDays}d)` : ''}</span>
            </div>
            <div class="ops-param-item">
              <span class="ops-param-label">Outstanding balance</span>
              <span class="ops-param-value tnum" style="font-weight:800;color:${st.outstanding > 0 ? 'var(--status-danger)' : 'var(--status-ok)'}">
                ${fmtCurrency(st.outstanding)}
              </span>
            </div>
            <div class="ops-param-item">
              <span class="ops-param-label">Next due date</span>
              <span class="ops-param-value tnum">${fmtDate(st.nextDueDate)}</span>
            </div>
            <div class="ops-param-item">
              <span class="ops-param-label">Agreement started</span>
              <span class="ops-param-value tnum">${fmtDate(r.startDate)}</span>
            </div>
          </div>

          <!-- Actions -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-primary btn-micro" onclick="UI.showLogPaymentModal('${c.id}','${r.id}')">
              ${Icons.payment}
              <span>Log payment</span>
            </button>
            <button class="btn-micro btn-micro-wa" onclick="UI.sendRentalWaReminder('${r.id}')">
              ${Icons.whatsapp}
              <span>WA reminder</span>
            </button>
            <button class="btn btn-outline btn-micro" onclick="UI.showRentalRepairModal('${r.id}')" title="Laptop issue? Send to repair or swap with replacement">
              ${Icons.repairs}
              <span>Send to Repair</span>
            </button>
            <button class="btn btn-outline btn-micro" onclick="UI.showEditRentalModal('${r.id}')">
              Edit
            </button>
            <button class="btn btn-outline btn-micro" onclick="UI.showCloseRentalModal('${r.id}')" style="color:var(--status-danger);margin-left:auto">
              Close rental
            </button>
          </div>
        </div>`;
      });
    }

    /* Past Closed Rentals */
    const closedRentals = rentals.filter(r => !isActiveRental(r));
    if (closedRentals.length > 0) {
      html += `
      <div class="section-head">
        <div class="section-title">Past agreements</div>
        <div class="section-count">${closedRentals.length} closed</div>
      </div>
      <div class="ops-list" style="margin-bottom:16px">`;
      closedRentals.forEach(r => {
        const item = getItem(r.itemId);
        html += `
        <div class="ops-row">
          <div class="ops-row-status">
            <span class="ops-status-badge muted">
              <span class="status-dot muted"></span>
              Closed
            </span>
          </div>
          <div class="ops-row-main">
            <div class="ops-row-title">${escHtml(getItemFullTitle(item))}</div>
            <div class="ops-row-sub">${fmtDate(r.startDate)} &mdash; ${fmtDate(r.endDate)}</div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    /* Payment History Timeline */
    html += `
    <div class="section-head">
      <div class="section-title">Payment history</div>
      <div class="section-count">${allPayments.length} record${allPayments.length === 1 ? '' : 's'}</div>
    </div>`;

    if (allPayments.length === 0) {
      html += `
      <div class="ops-list">
        <div class="ops-empty">
          <div class="ops-empty-icon">${Icons.payment}</div>
          <div class="ops-empty-title">No payments logged</div>
          <div class="ops-empty-sub">Payments logged for this client will appear on this timeline.</div>
        </div>
      </div>`;
    } else {
      html += `<div class="ops-timeline">`;
      allPayments.forEach(p => {
        const r = getRental(p.rentalId);
        const item = r ? getItem(r.itemId) : null;
        html += `
        <div class="ops-timeline-item">
          <div class="ops-timeline-node"></div>
          <div class="ops-timeline-content">
            <div>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span class="tnum" style="font-weight:700;font-size:0.95rem;color:var(--status-ok)">+ ${fmtCurrency(p.amount)}</span>
                <span class="status-pill muted" style="font-size:0.68rem;padding:1px 6px">${escHtml(p.method || 'Cash / UPI')}</span>
                ${p.paidTo ? `<span class="status-pill ok" style="font-size:0.68rem;padding:1px 6px">Paid to: ${escHtml(p.paidTo)}</span>` : ''}
              </div>
              <div style="font-size:0.76rem;color:var(--text-muted);margin-top:2px">
                <span class="tnum">${fmtDate(p.date)}</span>${item ? ` &middot; ${escHtml(getItemFullTitle(item))}` : ''}${p.remarks ? ` &middot; <em>${escHtml(p.remarks)}</em>` : ''}
              </div>
            </div>
            <div style="display:flex;gap:4px">
              <button class="btn-micro" onclick="UI.showEditPaymentModal('${p.id}')" title="Edit payment">
                ${Icons.edit}
              </button>
              ${Auth.isAdmin() ? `
                <button class="btn-micro" onclick="UI.deletePayment('${p.id}')" style="color:var(--status-danger)" title="Delete payment">
                  ${Icons.trash}
                </button>
              ` : ''}
            </div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    return html;
  },

  /* CUSTOMER & RENTAL DETAIL (MOBILE / TABLET FULL PAGE FALLBACK) */
  renderCustomerDetail(customerId) {
    if (window.innerWidth >= 1200) {
      this.navigate('customers');
      setTimeout(() => this.selectCustomer(customerId, false), 50);
      return;
    }
    const html = this.getCustomerDetailHtml(customerId);
    const target = document.getElementById('page-customer-detail');
    if (target) target.innerHTML = html;
  },

  /* INVENTORY (OPS CONSOLE REDESIGN) */
  renderInventory(filter = 'all', brandFilter = 'all', searchQuery) {
    if (filter !== undefined && filter !== null) filterState.inventory = filter;
    else filter = filterState.inventory || 'all';

    if (brandFilter !== undefined && brandFilter !== null) filterState.brand = brandFilter;
    else brandFilter = filterState.brand || 'all';

    let list = state.items;
    
    // Status filter
    if (filter && filter !== 'all') {
      list = list.filter(i => i.status === filter);
    }
    
    // Brand filter
    if (brandFilter && brandFilter !== 'all') {
      if (brandFilter === 'Monitors') {
        list = list.filter(i => (i.type || '').toLowerCase() === 'monitor');
      } else {
        list = list.filter(i => (i.brand || '').toLowerCase().includes(brandFilter.toLowerCase()));
      }
    }

    // Search query filter
    const searchInput = document.getElementById('inventorySearchInput');
    const query = (searchQuery !== undefined ? searchQuery : (searchInput?.value || '')).trim().toLowerCase();
    if (query) {
      list = list.filter(i => {
        const full = `${i.brand || ''} ${i.model || ''} ${i.serial || ''} ${i.specs || ''} ${i.type || ''}`.toLowerCase();
        return full.includes(query);
      });
    }

    list.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));

    const availableCount = state.items.filter(i => i.status === 'available').length;
    const rentedCount = state.items.filter(i => i.status === 'rented').length;
    const repairCount = state.items.filter(i => i.status === 'repair').length;

    let listHtml = '';
    if (list.length === 0) {
      listHtml = `
      <div class="ops-empty">
        <div class="ops-empty-icon">${Icons.inventory}</div>
        <div class="ops-empty-title">No matching inventory</div>
        <div class="ops-empty-sub">${query ? 'Try a different search query or clear filters.' : 'No devices found in this category.'}</div>
        <button class="btn btn-primary btn-micro" style="margin-top:12px;padding:8px 16px" onclick="UI.showAddItemModal()">+ Add device</button>
      </div>`;
    } else {
      list.forEach(i => {
        const rental = getActiveRentalForItem(i.id);
        const customer = rental ? getCustomer(rental.customerId) : null;
        const isAvail = i.status === 'available';
        const isRented = i.status === 'rented';
        const isRepair = i.status === 'repair';
        const itemTitle = getItemFullTitle(i);
        const brandKey = (i.brand || '').toLowerCase();
        const brandClass = ['dell', 'lenovo', 'hp', 'apple'].includes(brandKey) ? `hardware-brand-${brandKey}` : 'hardware-brand-other';

        // Extract spec pills
        let specChips = [];
        if (i.specs) {
          const rawSpecs = i.specs.split(/[•·,]/).map(s => s.trim()).filter(Boolean);
          specChips = rawSpecs.map(s => `<span class="hardware-spec-chip">⚙️ ${escHtml(s)}</span>`);
        }

        let statusBannerHtml = '';
        if (isAvail) {
          statusBannerHtml = `
          <div class="hardware-status-banner available">
            <div style="font-weight:700;color:var(--status-ok);display:flex;align-items:center;gap:6px">
              <span>🟢 In Stock &amp; Ready to Deploy</span>
            </div>
            <div style="font-size:0.75rem;color:var(--text-muted)">Sitting in inventory &middot; Available for immediate customer rental.</div>
          </div>`;
        } else if (isRented && customer && rental) {
          const st = rentalStatus(rental);
          statusBannerHtml = `
          <div class="hardware-status-banner rented">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">
              <div>
                <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--accent);letter-spacing:0.5px">Active Rental</div>
                <div style="font-weight:800;font-size:0.95rem;color:var(--text-primary);margin-top:1px">${escHtml(customer.name)}</div>
                <div style="font-size:0.76rem;color:var(--text-muted);margin-top:2px">
                  <span class="tnum" style="font-weight:700;color:var(--text-primary)">${fmtCurrency(rental.rentAmount)}</span> / ${rental.billingCycle} &middot; Due: <span class="tnum">${fmtDate(st.nextDueDate)}</span>
                </div>
              </div>
              <div style="display:flex;gap:4px">
                <button class="btn-micro btn-micro-wa" onclick="event.stopPropagation();UI.sendRentalWaReminder('${rental.id}')">
                  ${Icons.whatsapp}
                  <span>WA</span>
                </button>
                <button class="btn-micro" onclick="event.stopPropagation();UI.pushPage('customer-detail', '${customer.id}')">
                  Client
                </button>
              </div>
            </div>
          </div>`;
        } else if (isRepair && i.repairInfo) {
          const rep = i.repairInfo;
          const daysAtService = rep.givenToServiceDate ? Math.max(0, daysBetween(rep.givenToServiceDate, today())) : 0;
          statusBannerHtml = `
          <div class="hardware-status-banner repair">
            <div style="display:flex;justify-content:space-between;align-items:flex-start">
              <div>
                <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--status-warn);letter-spacing:0.5px">Under Repair / Service</div>
                <div style="font-weight:800;font-size:0.92rem;color:var(--text-primary);margin-top:1px">${escHtml(rep.serviceCenter || 'Service Center')}</div>
                <div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">
                  Tech: ${escHtml(rep.servicePerson || 'Technician')}${rep.servicePhone ? ` (${escHtml(fmtPhone(rep.servicePhone))})` : ''} &middot; <span style="font-weight:600;color:var(--status-warn)">${daysAtService}d at service</span>
                </div>
                ${rep.repairIssue ? `<div style="font-size:0.75rem;color:var(--text-muted);margin-top:2px">Issue: <em>${escHtml(rep.repairIssue)}</em></div>` : ''}
              </div>
              ${rep.repairCost ? `<div style="text-align:right"><span class="tnum" style="font-weight:700;font-size:0.92rem;color:var(--text-primary)">Est: ${fmtCurrency(rep.repairCost)}</span></div>` : ''}
            </div>
            <div style="display:flex;gap:6px;margin-top:8px">
              ${rep.servicePhone ? `
                <button class="btn-micro btn-micro-wa" onclick="event.stopPropagation();UI.sendTechWaReminder('${i.id}')">
                  ${Icons.whatsapp}
                  <span>WA Tech</span>
                </button>
                <a href="tel:${escHtml(rep.servicePhone)}" class="btn-micro" style="text-decoration:none" onclick="event.stopPropagation()">
                  ${Icons.phone}
                  <span>Call</span>
                </a>
              ` : ''}
              <button class="btn-micro btn-micro-primary" onclick="event.stopPropagation();UI.markItemRepaired('${i.id}')">
                ${Icons.check}
                <span>Mark Repaired</span>
              </button>
            </div>
          </div>`;
        }

        listHtml += `
        <div class="hardware-card" onclick="UI.showEditItemModal('${i.id}')">
          <!-- Top Row: Brand & Status -->
          <div class="hardware-card-top">
            <div style="display:flex;align-items:center;gap:8px">
              <span class="hardware-brand-badge ${brandClass}">${escHtml(i.brand || 'Device')}</span>
              <span class="status-pill muted" style="font-size:0.7rem;font-weight:600">${escHtml(i.type || 'Laptop')}</span>
            </div>
            <span class="ops-status-badge ${isAvail ? 'ok' : isRented ? 'warn' : 'danger'}">
              <span class="status-dot ${isAvail ? 'ok' : isRented ? 'warn' : 'danger'}"></span>
              ${isAvail ? 'Available' : isRented ? 'Rented' : 'In Repair'}
            </span>
          </div>

          <!-- Main Title & Serial -->
          <div class="hardware-card-title-row">
            <div class="hardware-card-title">${escHtml(itemTitle)}</div>
            <div class="hardware-serial-row">
              <span class="hardware-serial-pill">
                <span>🏷️ SN:</span>
                <span class="tnum">${escHtml(i.serial)}</span>
              </span>
            </div>
          </div>

          <!-- Specs Chips -->
          ${specChips.length > 0 ? `<div class="hardware-specs-wrap">${specChips.join('')}</div>` : ''}

          <!-- Dynamic Status Banner (Available / Rented / Repair) -->
          ${statusBannerHtml}

          <!-- Bottom Action Buttons -->
          <div class="hardware-actions-row">
            ${isAvail ? `
              <button class="btn btn-primary btn-sm" style="flex:1" onclick="event.stopPropagation();UI.showAddRentalWithItem('${i.id}')">
                ${Icons.plus}
                <span>⚡ Rent this Device</span>
              </button>
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();UI.showSendToRepairModal('${i.id}')" title="Send to service">
                ${Icons.repairs}
                <span>Service</span>
              </button>
              <button class="btn btn-outline btn-sm" onclick="event.stopPropagation();UI.showEditItemModal('${i.id}')">
                Edit
              </button>
            ` : `
              <button class="btn btn-outline btn-sm" style="flex:1" onclick="event.stopPropagation();UI.showEditItemModal('${i.id}')">
                <span>⚙️ Manage Device &amp; Specs</span>
              </button>
            `}
          </div>
        </div>`;
      });
    }

    const listContainer = document.getElementById('inventoryListContainer');
    const countContainer = document.getElementById('inventorySectionCount');
    if (listContainer && searchQuery !== undefined) {
      listContainer.innerHTML = listHtml;
      if (countContainer) countContainer.textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
      return;
    }

    let html = `
    <!-- Top Search & Cloud Sync Bar -->
    <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px">
      <div class="search-input-wrap" style="flex:1;margin-bottom:0">
        <div class="search-icon-inside">${Icons.search}</div>
        <input type="text" id="inventorySearchInput" class="ops-search-input" placeholder="Search models, serials, specs..." value="${escHtml(query)}" oninput="UI.renderInventory(undefined, undefined, this.value)">
      </div>
      <button class="btn btn-outline btn-sm" onclick="Data.sync(false)" title="Force sync with cloud database" style="display:flex;align-items:center;gap:6px;flex-shrink:0;height:42px;padding:0 12px">
        ${Icons.refresh}
        <span style="font-size:0.78rem">Sync</span>
      </button>
    </div>

    <!-- Brand & Status Filter Pills (Horizontal Scroll) -->
    <div class="brand-pills-scroll" style="margin-bottom:14px">
      <button class="brand-pill ${filter === 'all' && brandFilter === 'all' ? 'active' : ''}" onclick="UI.renderInventory('all', 'all')">All (${state.items.length})</button>
      <button class="brand-pill ${filter === 'available' ? 'active' : ''}" onclick="UI.renderInventory('available', 'all')">Available (${availableCount})</button>
      <button class="brand-pill ${filter === 'rented' ? 'active' : ''}" onclick="UI.renderInventory('rented', 'all')">Rented (${rentedCount})</button>
      <button class="brand-pill ${filter === 'repair' ? 'active' : ''}" onclick="UI.renderInventory('repair', 'all')">In Repair (${repairCount})</button>
      <button class="brand-pill ${brandFilter === 'Dell' ? 'active' : ''}" onclick="UI.renderInventory('all', 'Dell')">Dell</button>
      <button class="brand-pill ${brandFilter === 'Lenovo' ? 'active' : ''}" onclick="UI.renderInventory('all', 'Lenovo')">Lenovo</button>
      <button class="brand-pill ${brandFilter === 'HP' ? 'active' : ''}" onclick="UI.renderInventory('all', 'HP')">HP</button>
      <button class="brand-pill ${brandFilter === 'Apple' ? 'active' : ''}" onclick="UI.renderInventory('all', 'Apple')">Apple</button>
      <button class="brand-pill ${brandFilter === 'Monitors' ? 'active' : ''}" onclick="UI.renderInventory('all', 'Monitors')">Monitors</button>
    </div>

    <!-- Section Count & Add Device Command -->
    <div class="section-head">
      <div class="section-title">Fleet Equipment Assets</div>
      <div class="section-count" id="inventorySectionCount">${list.length} item${list.length === 1 ? '' : 's'}</div>
    </div>

    <div class="hardware-cards-list" id="inventoryListContainer">
      ${listHtml}
    </div>`;

    document.getElementById('page-inventory').innerHTML = html;
  },

  /* REPAIRS TRACKER (SERVICE & LOGISTICS OPERATIONS REDESIGN) */
  renderRepairs(filter = 'all', searchQuery) {
    let list = state.items.filter(i => i.status === 'repair');
    const searchInput = document.getElementById('repairsSearchInput');
    const q = (searchQuery !== undefined ? searchQuery : (searchInput?.value || '')).trim().toLowerCase();

    if (q) {
      list = list.filter(i => {
        const rep = i.repairInfo || {};
        const full = `${i.brand || ''} ${i.model || ''} ${i.serial || ''} ${rep.serviceCenter || ''} ${rep.servicePerson || ''} ${rep.repairIssue || ''}`.toLowerCase();
        return full.includes(q);
      });
    }

    const totalInRepair = state.items.filter(i => i.status === 'repair').length;
    const criticalList = state.items.filter(i => {
      if (i.status !== 'repair') return false;
      const d = i.repairInfo?.givenToServiceDate ? daysBetween(i.repairInfo.givenToServiceDate, today()) : 0;
      return d >= 7;
    });
    const totalEstCost = list.reduce((sum, i) => sum + (parseFloat(i.repairInfo?.repairCost) || 0), 0);

    if (filter === 'critical') {
      list = list.filter(i => {
        const d = i.repairInfo?.givenToServiceDate ? daysBetween(i.repairInfo.givenToServiceDate, today()) : 0;
        return d >= 7;
      });
    }

    list.sort((a, b) => {
      const da = a.repairInfo?.givenToServiceDate ? daysBetween(a.repairInfo.givenToServiceDate, today()) : 0;
      const db = b.repairInfo?.givenToServiceDate ? daysBetween(b.repairInfo.givenToServiceDate, today()) : 0;
      return db - da;
    });

    let listHtml = '';
    if (list.length === 0) {
      listHtml = `
      <div class="ops-empty" style="padding:40px 20px;text-align:center">
        <div class="ops-empty-icon">${Icons.repairs}</div>
        <div class="ops-empty-title" style="font-size:1.1rem;font-weight:700;margin-top:8px">No equipment currently under repair</div>
        <div class="ops-empty-sub" style="max-width:400px;margin:6px auto 16px auto;color:var(--text-muted)">
          ${q ? 'No service tickets match your search query.' : 'All laptops and devices across your fleet are fully operational and ready for rental.'}
        </div>
        <button class="btn btn-primary" style="padding:10px 22px;font-weight:600;display:inline-flex;align-items:center;gap:6px;margin:0 auto" onclick="UI.showSendToRepairModal()">
          ${Icons.plus}
          <span>+ Dispatch Device to Service</span>
        </button>
      </div>`;
    } else {
      list.forEach(i => {
        const rep = i.repairInfo || {};
        const daysAtService = rep.givenToServiceDate ? Math.max(0, daysBetween(rep.givenToServiceDate, today())) : 0;
        const isCritical = daysAtService >= 7;
        const itemTitle = getItemFullTitle(i);

        listHtml += `
        <div class="card" style="margin-bottom:14px;border-left:3px solid ${isCritical ? 'var(--status-danger)' : 'var(--status-warn)'}">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div style="display:flex;align-items:flex-start;gap:8px">
              <span class="status-dot ${isCritical ? 'danger' : 'warn'}" style="margin-top:5px"></span>
              <div>
                <div class="ops-row-title" style="font-size:1.02rem;font-weight:700;color:var(--text-primary)">
                  ${escHtml(itemTitle)} <span class="status-pill muted" style="font-size:0.65rem;padding:1px 6px">${escHtml(i.type || 'Laptop')}</span>
                </div>
                <div class="ops-row-sub" style="font-size:0.8rem;color:var(--text-muted);margin-top:2px">
                  Serial No: <span class="tnum" style="color:var(--text-primary);font-weight:600">${escHtml(i.serial)}</span>${i.specs ? ` &middot; ${escHtml(i.specs)}` : ''}
                </div>
              </div>
            </div>
            <div class="ops-row-end">
              <span class="ops-status-badge ${isCritical ? 'danger' : 'warn'}">
                <span class="status-dot ${isCritical ? 'danger' : 'warn'}"></span>
                ${daysAtService}d at service
              </span>
            </div>
          </div>

          <!-- Parameter Matrix -->
          <div class="ops-param-grid" style="margin-top:12px;margin-bottom:12px">
            <div class="ops-param-item">
              <span class="ops-param-label">Service Center &amp; Tech</span>
              <span class="ops-param-value" style="font-weight:600">${escHtml(rep.serviceCenter || 'N/A')}${rep.servicePerson ? ` (${escHtml(rep.servicePerson)})` : ''}</span>
            </div>
            <div class="ops-param-item">
              <span class="ops-param-label">Estimated Repair Cost</span>
              <span class="ops-param-value tnum" style="color:var(--accent);font-weight:700">${rep.repairCost ? fmtCurrency(rep.repairCost) : 'Pending quote'}</span>
            </div>
            <div class="ops-param-item">
              <span class="ops-param-label">Handover Date</span>
              <span class="ops-param-value tnum">${fmtDate(rep.givenToServiceDate)}</span>
            </div>
            <div class="ops-param-item">
              <span class="ops-param-label">Expected Return</span>
              <span class="ops-param-value tnum">${rep.expectedReturnDate ? fmtDate(rep.expectedReturnDate) : 'Not specified'}</span>
            </div>
          </div>

          ${rep.repairIssue ? `
            <div style="background:var(--surface-raised);border:1px solid var(--border-subtle);border-radius:var(--radius-sm);padding:8px 12px;font-size:0.8rem;color:var(--text-muted);margin-bottom:12px">
              <strong style="color:var(--text-primary)">Reported Issue:</strong> ${escHtml(rep.repairIssue)}
            </div>
          ` : ''}

          <!-- Footer Actions -->
          <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
            <button class="btn btn-primary btn-micro" style="background:var(--status-ok);font-weight:600" onclick="UI.markItemRepaired('${i.id}')">
              ${Icons.check}
              <span>Mark Repaired / Return to Fleet</span>
            </button>
            ${rep.servicePhone ? `
              <button class="btn-micro btn-micro-wa" onclick="UI.sendTechWaReminder('${i.id}')">
                ${Icons.whatsapp}
                <span>WhatsApp Tech</span>
              </button>
              <a href="tel:${escHtml(rep.servicePhone)}" class="btn btn-outline btn-micro" style="text-decoration:none">
                ${Icons.phone}
                <span>Call</span>
              </a>
            ` : ''}
            <button class="btn btn-outline btn-micro" onclick="UI.showEditItemModal('${i.id}')">
              Edit Service Info
            </button>
          </div>
        </div>`;
      });
    }

    const listContainer = document.getElementById('repairsListContainer');
    const countContainer = document.getElementById('repairsSectionCount');
    if (listContainer && searchQuery !== undefined) {
      listContainer.innerHTML = listHtml;
      if (countContainer) countContainer.textContent = `${list.length} item${list.length === 1 ? '' : 's'}${totalEstCost > 0 ? ' · Est. ' + fmtCurrency(totalEstCost) : ''}`;
      return;
    }

    let html = `
    <!-- Top Action Bar & Metrics -->
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:1.15rem;font-weight:700;letter-spacing:-0.2px;color:var(--text-primary)">Hardware Repairs &amp; Service Tracker</h2>
        <div style="font-size:0.78rem;color:var(--text-muted);margin-top:2px">Track equipment sent to chip-level service centers and technicians</div>
      </div>
      <button class="btn btn-primary" style="padding:8px 16px;font-weight:600;display:inline-flex;align-items:center;gap:6px" onclick="UI.showSendToRepairModal()">
        ${Icons.plus}
        <span>+ Send Device to Service</span>
      </button>
    </div>

    <!-- 3 Compact Metric Chips -->
    <div class="dash-chips-row" style="margin-bottom:18px">
      <div class="stat-chip" onclick="UI.renderRepairs('all')">
        <div class="stat-chip-header">
          <span class="status-dot ${totalInRepair > 0 ? 'warn' : 'ok'}"></span>
          <span class="stat-chip-num">${totalInRepair}</span>
        </div>
        <div class="stat-chip-label">Total in Service</div>
      </div>
      <div class="stat-chip" onclick="UI.renderRepairs('critical')">
        <div class="stat-chip-header">
          <span class="status-dot ${criticalList.length > 0 ? 'danger' : 'ok'}"></span>
          <span class="stat-chip-num">${criticalList.length}</span>
        </div>
        <div class="stat-chip-label">Critical &gt;7 Days</div>
      </div>
      <div class="stat-chip">
        <div class="stat-chip-header">
          <span class="status-dot ok"></span>
          <span class="stat-chip-num tnum" style="font-size:1.1rem">${fmtCurrency(totalEstCost)}</span>
        </div>
        <div class="stat-chip-label">Estimated Repair Cost</div>
      </div>
    </div>

    <!-- Top Live Search Bar -->
    <div class="search-input-wrap">
      <div class="search-icon-inside">${Icons.search}</div>
      <input type="text" id="repairsSearchInput" class="ops-search-input" placeholder="Search service centers, technicians, issues..." value="${escHtml(q)}" oninput="UI.renderRepairs('${filter}', this.value)">
    </div>

    <!-- Repair Status Filter Pills -->
    <div class="brand-pills-scroll">
      <button class="brand-pill ${filter === 'all' ? 'active' : ''}" onclick="UI.renderRepairs('all')">All In Service (${totalInRepair})</button>
      <button class="brand-pill ${filter === 'critical' ? 'active' : ''}" onclick="UI.renderRepairs('critical')">Critical &gt;7d (${criticalList.length})</button>
    </div>

    <!-- Section Head with Count & Total Est Cost -->
    <div class="section-head">
      <div class="section-title">Active service queue</div>
      <div class="section-count" id="repairsSectionCount">${list.length} item${list.length === 1 ? '' : 's'} ${totalEstCost > 0 ? `&middot; Est. ${fmtCurrency(totalEstCost)}` : ''}</div>
    </div>

    <div class="ops-list" id="repairsListContainer">
      ${listHtml}
    </div>`;

    document.getElementById('page-repairs').innerHTML = html;
  },

  /* MODAL: DISPATCH DEVICE TO SERVICE */
  showSendToRepairModal(preselectedItemId = null) {
    const candidateItems = state.items.filter(i => i.status !== 'repair');
    if (candidateItems.length === 0 && !preselectedItemId) {
      UI.showToast('No equipment in inventory available to send for repair', 'warn');
      return;
    }

    const itemOptions = candidateItems.map(i => {
      const title = getItemFullTitle(i);
      const isSelected = i.id === preselectedItemId ? 'selected' : '';
      return `<option value="${i.id}" ${isSelected}>${escHtml(title)} (SN: ${escHtml(i.serial)}) — Status: ${i.status}</option>`;
    }).join('');

    UI.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <div style="width:36px;height:36px;border-radius:8px;background:var(--accent-muted);color:var(--accent);display:flex;align-items:center;justify-content:center">
          ${Icons.repairs}
        </div>
        <div>
          <h2 style="font-size:1.15rem;font-weight:700;margin:0">Dispatch Device to Service</h2>
          <div style="font-size:0.75rem;color:var(--text-muted)">Log equipment sent for chip-level repair, battery, or screen replacement</div>
        </div>
      </div>

      <div class="form-group">
        <label>Select Equipment *</label>
        <select id="repairItemId">
          <option value="">-- Choose laptop / device to service --</option>
          ${itemOptions}
        </select>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Service Center / Shop Name *</label>
          <input type="text" id="repairServiceCenter" placeholder="e.g. Dell Authorized Service Center / Chip Level Care">
        </div>
        <div class="form-group">
          <label>Technician / Contact Person</label>
          <input type="text" id="repairServicePerson" placeholder="e.g. Ramesh Kumar">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Technician Mobile (10 Digits)</label>
          <input type="tel" id="repairServicePhone" placeholder="10-digit phone for WhatsApp updates" maxlength="10" inputmode="numeric" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)">
        </div>
        <div class="form-group">
          <label>Estimated Repair Cost (₹)</label>
          <input type="number" id="repairCost" placeholder="e.g. 2500" min="0">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Handover Date *</label>
          <input type="date" id="repairHandoverDate" value="${today()}">
        </div>
        <div class="form-group">
          <label>Expected Return Date</label>
          <input type="date" id="repairReturnDate">
        </div>
      </div>

      <div class="form-group">
        <label>Reported Issue / Fault Description *</label>
        <textarea id="repairIssue" placeholder="Describe the fault (e.g. screen flickering, motherboard no power, battery health degraded, broken hinge)"></textarea>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.saveSendToRepair()">Dispatch to Service</button>
      </div>
    `);
  },

  saveSendToRepair() {
    const itemId = document.getElementById('repairItemId')?.value;
    const serviceCenter = document.getElementById('repairServiceCenter')?.value.trim();
    const servicePerson = document.getElementById('repairServicePerson')?.value.trim();
    const servicePhoneRaw = document.getElementById('repairServicePhone')?.value.trim();
    const givenToServiceDate = document.getElementById('repairHandoverDate')?.value || today();
    const expectedReturnDate = document.getElementById('repairReturnDate')?.value || '';
    const repairCost = parseFloat(document.getElementById('repairCost')?.value) || 0;
    const repairIssue = document.getElementById('repairIssue')?.value.trim();

    if (!itemId) { UI.showToast('Please select an equipment to send for service', 'error'); return; }
    if (!serviceCenter) { UI.showToast('Please enter the service center name', 'error'); return; }
    if (!repairIssue) { UI.showToast('Please specify the reported fault/issue', 'error'); return; }

    let servicePhone = '';
    if (servicePhoneRaw) {
      servicePhone = cleanPhone(servicePhoneRaw);
      if (!/^[0-9]{10}$/.test(servicePhone)) {
        UI.showToast('Technician phone must be exactly 10 digits', 'error');
        return;
      }
    }

    const item = getItem(itemId);
    if (!item) { UI.showToast('Item not found', 'error'); return; }

    item.status = 'repair';
    item.repairInfo = {
      serviceCenter,
      servicePerson,
      servicePhone,
      givenToServiceDate,
      expectedReturnDate,
      repairCost,
      repairIssue
    };

    Data.save();
    UI.hideModal();
    UI.showToast(`${getItemFullTitle(item)} dispatched to service queue`, 'success');
    UI.navigate('repairs');
  },

  /* MODAL: DIRECT DISPATCH FROM ACTIVE CUSTOMER RENTAL */
  showRentalRepairModal(rentalId) {
    const r = getRental(rentalId);
    if (!r) return;
    const c = getCustomer(r.customerId);
    const item = getItem(r.itemId);
    const itemTitle = getItemFullTitle(item);
    const availableItems = state.items.filter(i => i.status === 'available');

    const swapOptions = availableItems.map(i => {
      const title = getItemFullTitle(i);
      return `<option value="${i.id}">${escHtml(title)} (SN: ${escHtml(i.serial)})${i.specs ? ` — ${escHtml(i.specs)}` : ''}</option>`;
    }).join('');

    UI.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
        <div style="width:36px;height:36px;border-radius:8px;background:var(--accent-muted);color:var(--accent);display:flex;align-items:center;justify-content:center">
          ${Icons.repairs}
        </div>
        <div>
          <h2 style="font-size:1.15rem;font-weight:700;margin:0">Send Rented Laptop to Service</h2>
          <div style="font-size:0.75rem;color:var(--text-muted)">Dispatch customer's equipment to repair shop & optionally swap with replacement</div>
        </div>
      </div>

      <!-- Current Agreement Info Banner -->
      <div style="background:var(--surface-raised);border:1px solid var(--border);border-radius:var(--radius-md);padding:12px;margin-bottom:14px">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div>
            <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--text-muted)">Renting Client</div>
            <div style="font-weight:700;color:var(--text-primary);font-size:0.95rem">${escHtml(c ? c.name : 'Unknown Client')}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:0.72rem;font-weight:700;text-transform:uppercase;color:var(--text-muted)">Current Equipment</div>
            <div style="font-weight:700;color:var(--text-primary);font-size:0.95rem">${escHtml(itemTitle)}</div>
            <div style="font-size:0.72rem;color:var(--text-muted)">SN: ${escHtml(item ? item.serial : 'N/A')}</div>
          </div>
        </div>
      </div>

      <!-- Action Choice on Rental Agreement -->
      <div class="form-group">
        <label>What should happen to the customer's rental? *</label>
        <select id="rentalActionChoice" onchange="document.getElementById('swapDeviceGroup').style.display = this.value === 'swap' ? 'block' : 'none'">
          <option value="swap" selected>🔄 Swap with replacement laptop (Keep rental running)</option>
          <option value="keep">⏸️ Keep agreement active (Customer waits for repair)</option>
          <option value="close">⏹️ Close / End this rental agreement</option>
        </select>
      </div>

      <!-- Replacement Device Picker -->
      <div class="form-group" id="swapDeviceGroup">
        <label>Select Replacement Laptop from Stock *</label>
        ${availableItems.length > 0 ? `
          <select id="replacementItemId">
            ${swapOptions}
          </select>
        ` : `
          <div style="font-size:0.8rem;color:var(--status-warn);background:var(--surface-raised);padding:8px 12px;border-radius:var(--radius-sm);border:1px solid var(--border)">
            ⚠️ No other available laptops in stock right now. You can choose "Close rental" or "Keep agreement active".
          </div>
        `}
      </div>

      <hr style="border:none;border-top:1px solid var(--border-subtle);margin:16px 0">

      <!-- Service Center Logistics -->
      <div class="form-row">
        <div class="form-group">
          <label>Service Center / Shop Name *</label>
          <input type="text" id="rentalServiceCenter" placeholder="e.g. Dell Authorized / Chip Care Lab">
        </div>
        <div class="form-group">
          <label>Technician Name</label>
          <input type="text" id="rentalServicePerson" placeholder="e.g. Anand Kumar">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Technician Mobile (10 Digits)</label>
          <input type="tel" id="rentalServicePhone" placeholder="10-digit phone for WhatsApp updates" maxlength="10" inputmode="numeric" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)">
        </div>
        <div class="form-group">
          <label>Estimated Repair Cost (₹)</label>
          <input type="number" id="rentalRepairCost" placeholder="e.g. 2000" min="0">
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Handover Date *</label>
          <input type="date" id="rentalHandoverDate" value="${today()}">
        </div>
        <div class="form-group">
          <label>Expected Return Date</label>
          <input type="date" id="rentalReturnDate">
        </div>
      </div>

      <div class="form-group">
        <label>Reported Issue / Fault Description *</label>
        <textarea id="rentalRepairIssue" placeholder="Describe the fault reported by customer (e.g. display lines, keyboard not responding, battery not charging)"></textarea>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.saveRentalRepair('${r.id}')">Confirm &amp; Dispatch to Service</button>
      </div>
    `);
  },

  saveRentalRepair(rentalId) {
    const r = getRental(rentalId);
    if (!r) return;
    const oldItem = getItem(r.itemId);
    if (!oldItem) return;

    const action = document.getElementById('rentalActionChoice')?.value || 'swap';
    const replacementItemId = document.getElementById('replacementItemId')?.value;
    const serviceCenter = document.getElementById('rentalServiceCenter')?.value.trim();
    const servicePerson = document.getElementById('rentalServicePerson')?.value.trim();
    const servicePhoneRaw = document.getElementById('rentalServicePhone')?.value.trim();
    const givenToServiceDate = document.getElementById('rentalHandoverDate')?.value || today();
    const expectedReturnDate = document.getElementById('rentalReturnDate')?.value || '';
    const repairCost = parseFloat(document.getElementById('rentalRepairCost')?.value) || 0;
    const repairIssue = document.getElementById('rentalRepairIssue')?.value.trim();

    if (!serviceCenter) { UI.showToast('Please enter the service center name', 'error'); return; }
    if (!repairIssue) { UI.showToast('Please describe the fault/issue', 'error'); return; }

    let servicePhone = '';
    if (servicePhoneRaw) {
      servicePhone = cleanPhone(servicePhoneRaw);
      if (!/^[0-9]{10}$/.test(servicePhone)) {
        UI.showToast('Technician phone must be exactly 10 digits', 'error');
        return;
      }
    }

    // 1. Handle Rental Action
    if (action === 'swap') {
      if (!replacementItemId) {
        UI.showToast('Please select a replacement laptop from stock', 'error');
        return;
      }
      const newItem = getItem(replacementItemId);
      if (!newItem) { UI.showToast('Replacement item not found', 'error'); return; }
      newItem.status = 'rented';
      r.itemId = replacementItemId;
      if (!r.swapHistory) r.swapHistory = [];
      r.swapHistory.push({
        previousItemId: oldItem.id,
        previousItemTitle: getItemFullTitle(oldItem),
        swappedAt: today(),
        reason: repairIssue
      });
    } else if (action === 'close') {
      r.status = 'closed';
      r.endDate = today();
    }

    // 2. Dispatch Old Laptop to Repairs
    oldItem.status = 'repair';
    oldItem.repairInfo = {
      serviceCenter,
      servicePerson,
      servicePhone,
      givenToServiceDate,
      expectedReturnDate,
      repairCost,
      repairIssue,
      customerName: getCustomer(r.customerId)?.name || ''
    };

    Data.save();
    UI.hideModal();
    UI.showToast(`Laptop dispatched to Repairs Tracker${action === 'swap' ? ' and replacement device assigned' : ''}`, 'success');
    UI.renderAll();
  },

  markItemRepaired(itemId) {
    const item = getItem(itemId);
    if (!item) return;
    const title = getItemFullTitle(item);
    UI.showConfirm(`Mark <strong>${escHtml(title)}</strong> (SN: ${escHtml(item.serial)}) as repaired and return to available fleet?`, () => {
      item.status = 'available';
      if (!item.repairHistory) item.repairHistory = [];
      if (item.repairInfo) {
        item.repairHistory.push({ ...item.repairInfo, resolvedDate: today() });
      }
      item.repairInfo = null;
      Data.save();
      UI.showToast(`${title} returned to available inventory`, 'success');
      UI.renderAll();
    });
  },

  /* GLOBAL SEARCH (OPS CONSOLE REDESIGN) */
  renderSearch() {
    let html = `
    <!-- Top Live Search Bar -->
    <div class="search-input-wrap">
      <div class="search-icon-inside">${Icons.search}</div>
      <input type="search" id="globalSearchInput" class="ops-search-input" placeholder="Search clients, phone, hardware models, serials, repairs..." oninput="UI.doSearch(this.value)">
    </div>
    <div id="searchResults">
      <div class="ops-list">
        <div class="ops-empty">
          <div class="ops-empty-icon">${Icons.search}</div>
          <div class="ops-empty-title">Global Fleet Search</div>
          <div class="ops-empty-sub">Type a client name, mobile number, serial number, processor, or service center.</div>
        </div>
      </div>
    </div>`;
    document.getElementById('page-search').innerHTML = html;
    setTimeout(() => {
      const input = document.getElementById('globalSearchInput');
      if (input) input.focus();
    }, 150);
  },

  doSearch(query) {
    const el = document.getElementById('searchResults');
    if (!query || query.trim().length < 1) {
      el.innerHTML = `
      <div class="ops-list">
        <div class="ops-empty">
          <div class="ops-empty-icon">${Icons.search}</div>
          <div class="ops-empty-title">Global Fleet Search</div>
          <div class="ops-empty-sub">Type a client name, mobile number, serial number, processor, or service center.</div>
        </div>
      </div>`;
      return;
    }
    const q = query.toLowerCase().trim();
    const qClean = cleanPhone(q);

    // 1. Matched Customers
    const matchedCustomers = state.customers.filter(c => {
      return c.name.toLowerCase().includes(q) ||
        (qClean.length >= 3 && cleanPhone(c.phone).includes(qClean)) ||
        (c.address && c.address.toLowerCase().includes(q));
    });

    // 2. Matched Items (Laptops, Specs, Serials, Repairs)
    const matchedItems = state.items.filter(i => {
      const brandMatch = i.brand && i.brand.toLowerCase().includes(q);
      const modelMatch = i.model && i.model.toLowerCase().includes(q);
      const specsMatch = i.specs && i.specs.toLowerCase().includes(q);
      const serialMatch = i.serial && i.serial.toLowerCase().includes(q);
      const typeMatch = i.type && i.type.toLowerCase().includes(q);
      
      const rep = i.repairInfo || {};
      const repairMatch = (rep.serviceCenter && rep.serviceCenter.toLowerCase().includes(q)) ||
        (rep.servicePerson && rep.servicePerson.toLowerCase().includes(q)) ||
        (rep.servicePhone && cleanPhone(rep.servicePhone).includes(qClean)) ||
        (rep.repairIssue && rep.repairIssue.toLowerCase().includes(q));

      return brandMatch || modelMatch || specsMatch || serialMatch || typeMatch || repairMatch;
    });

    if (matchedCustomers.length === 0 && matchedItems.length === 0) {
      el.innerHTML = `
      <div class="ops-list">
        <div class="ops-empty">
          <div class="ops-empty-icon">${Icons.alert}</div>
          <div class="ops-empty-title">No matching records</div>
          <div class="ops-empty-sub">No clients or inventory items matched &ldquo;<strong>${escHtml(query)}</strong>&rdquo;</div>
        </div>
      </div>`;
      return;
    }

    let html = '';

    /* RENDER MATCHED INVENTORY DEVICES */
    if (matchedItems.length > 0) {
      html += `
      <div class="section-head">
        <div class="section-title">Hardware equipment found</div>
        <div class="section-count">${matchedItems.length} result${matchedItems.length === 1 ? '' : 's'}</div>
      </div>
      <div class="ops-list" style="margin-bottom:14px">`;
      matchedItems.forEach(i => {
        const itemTitle = getItemFullTitle(i);
        const isAvail = i.status === 'available';
        const isRented = i.status === 'rented';

        html += `
        <div class="ops-row" onclick="UI.showEditItemModal('${i.id}')">
          <div class="ops-row-status">
            <span class="ops-status-badge ${isAvail ? 'ok' : isRented ? 'warn' : 'danger'}">
              <span class="status-dot ${isAvail ? 'ok' : isRented ? 'warn' : 'danger'}"></span>
              ${isAvail ? 'Available' : isRented ? 'Rented' : 'In Repair'}
            </span>
          </div>
          <div class="ops-row-main">
            <div class="ops-row-title">${escHtml(itemTitle)} <span class="status-pill muted" style="font-size:0.65rem;padding:1px 5px">${escHtml(i.type || 'Laptop')}</span></div>
            <div class="ops-row-sub">SN: <span class="tnum" style="color:var(--text-primary);font-weight:600">${escHtml(i.serial)}</span>${i.specs ? ` &middot; ${escHtml(i.specs)}` : ''}</div>
          </div>
          <div class="ops-row-end">
            <div class="ops-setting-chevron">${Icons.chevronRight}</div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    /* RENDER MATCHED CUSTOMERS */
    if (matchedCustomers.length > 0) {
      html += `
      <div class="section-head">
        <div class="section-title">Clients found</div>
        <div class="section-count">${matchedCustomers.length} result${matchedCustomers.length === 1 ? '' : 's'}</div>
      </div>
      <div class="ops-list">`;
      matchedCustomers.forEach(c => {
        const active = customerActiveRentals(c.id);
        const hasOverdue = active.some(r => rentalStatus(r).isOverdue);

        html += `
        <div class="ops-row" onclick="UI.pushPage('customer-detail', '${c.id}')">
          <div class="ops-row-status">
            <span class="ops-status-badge ${active.length > 0 ? (hasOverdue ? 'danger' : 'ok') : 'muted'}">
              <span class="status-dot ${active.length > 0 ? (hasOverdue ? 'danger' : 'ok') : 'muted'}"></span>
              ${active.length > 0 ? (hasOverdue ? 'Overdue' : `${active.length} active`) : 'No active'}
            </span>
          </div>
          <div class="ops-row-main">
            <div class="ops-row-title">${escHtml(c.name)}</div>
            <div class="ops-row-sub">${escHtml(fmtPhone(c.phone))}${c.address ? ` &middot; ${escHtml(c.address)}` : ''}</div>
          </div>
          <div class="ops-row-end">
            <button class="btn-micro btn-micro-wa" onclick="event.stopPropagation();openWhatsAppReminder('${c.phone}', 'Hello ${c.name}, from TechTrove Systems.')" title="Message Client">
              ${Icons.whatsapp}
              <span>WA</span>
            </button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    el.innerHTML = html;
  },

  /* SETTINGS & BACKUP (OPS CONSOLE REDESIGN) */
  renderMore() {
    const isAdmin = Auth.isAdmin();
    const html = `
    <!-- Branded System Badge & User Role -->
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-md);margin-bottom:14px">
      <div style="display:flex;align-items:center;gap:12px">
        <img src="icon.png" alt="TechTrove" width="44" height="44" style="border-radius:10px;object-fit:contain;flex-shrink:0">
        <div>
          <div style="font-weight:800;font-size:1rem;letter-spacing:-0.2px;color:var(--text-primary)">TechTrove Systems</div>
          <div style="font-size:0.75rem;color:var(--text-muted)">Logged in as: <strong style="color:var(--text-primary)">${isAdmin ? 'Administrator' : 'Staff / Employee'}</strong></div>
        </div>
      </div>
      <div>
        <span class="status-pill ${isAdmin ? 'ok' : 'warn'}" style="font-weight:800;text-transform:uppercase;font-size:0.72rem;letter-spacing:0.4px">
          ${isAdmin ? '🛡️ Admin' : '👤 Employee'}
        </span>
      </div>
    </div>

    <!-- Role Permissions Banner -->
    <div style="background:var(--surface-raised);border:1px solid var(--border-subtle);border-radius:var(--radius-md);padding:10px 14px;margin-bottom:14px;font-size:0.75rem;color:var(--text-muted)">
      ${isAdmin ? `
        <span style="color:var(--status-ok);font-weight:700">✓ Full Admin Access:</span> You have complete privileges to create, edit, log payments, and permanently delete records.
      ` : `
        <span style="color:var(--status-warn);font-weight:700">ℹ️ Employee Access:</span> You can create customers, start rentals, log payments, and manage repairs. Record deletion is restricted to Admin.
      `}
    </div>

    <!-- Summary Metric Chips -->
    <div class="dash-chips-row" style="margin-bottom:14px">
      <div class="stat-chip" onclick="UI.navigate('customers')">
        <div class="stat-chip-header">
          <span class="status-dot ok"></span>
          <span class="stat-chip-num">${state.customers.length}</span>
        </div>
        <div class="stat-chip-label">Clients</div>
      </div>
      <div class="stat-chip" onclick="UI.navigate('inventory')">
        <div class="stat-chip-header">
          <span class="status-dot ok"></span>
          <span class="stat-chip-num">${state.items.length}</span>
        </div>
        <div class="stat-chip-label">Fleet units</div>
      </div>
      <div class="stat-chip" onclick="UI.navigate('customers')">
        <div class="stat-chip-header">
          <span class="status-dot ok"></span>
          <span class="stat-chip-num">${state.payments.length}</span>
        </div>
        <div class="stat-chip-label">Payments</div>
      </div>
    </div>

    <!-- Section 1: Appearance & Theme -->
    <div class="section-head">
      <div class="section-title">Appearance &amp; theme</div>
      <div class="section-count">${currentTheme === 'light' ? 'Light console' : 'Dark graphite'}</div>
    </div>
    <div class="ops-list" style="margin-bottom:14px">
      <div class="ops-setting-row" onclick="const t = document.getElementById('moreThemeToggle'); t.checked = !t.checked; UI.toggleTheme(t.checked);">
        <div class="ops-setting-main">
          <div class="ops-setting-icon">${currentTheme === 'light' ? Icons.sun : Icons.moon}</div>
          <div>
            <div class="ops-setting-title">Light theme mode</div>
            <div class="ops-setting-sub">${currentTheme === 'light' ? 'Clean high-contrast light console' : 'Ops near-black graphite terminal'}</div>
          </div>
        </div>
        <label class="toggle-switch" onclick="event.stopPropagation()">
          <input type="checkbox" id="moreThemeToggle" ${currentTheme === 'light' ? 'checked' : ''} onchange="UI.toggleTheme(this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
    </div>

    <!-- Section 2: Background Alerts -->
    <div class="section-head">
      <div class="section-title">Background notifications</div>
      <div class="section-count">OS-level</div>
    </div>
    <div class="ops-list" style="margin-bottom:14px">
      <div class="ops-setting-row" onclick="const t = document.getElementById('moreNotifToggle'); t.checked = !t.checked; UI.toggleNotifications(t.checked);">
        <div class="ops-setting-main">
          <div class="ops-setting-icon">${Icons.bell}</div>
          <div>
            <div class="ops-setting-title">Daily 9:00 AM lockscreen alerts</div>
            <div class="ops-setting-sub">Sends system notifications for due &amp; overdue rent outside app</div>
          </div>
        </div>
        <label class="toggle-switch" onclick="event.stopPropagation()">
          <input type="checkbox" id="moreNotifToggle" ${notifEnabled ? 'checked' : ''} onchange="UI.toggleNotifications(this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div class="ops-setting-row" onclick="UI.testSystemNotification()">
        <div class="ops-setting-main">
          <div class="ops-setting-icon">${Icons.alert}</div>
          <div>
            <div class="ops-setting-title">Test system notification</div>
            <div class="ops-setting-sub">Triggers an immediate test alert on your lockscreen</div>
          </div>
        </div>
        <div class="ops-setting-chevron">${Icons.chevronRight}</div>
      </div>
    </div>

    <!-- Section 2: Data Portability & Backup -->
    <div class="section-head">
      <div class="section-title">Data portability &amp; backup</div>
      <div class="section-count">JSON snapshot</div>
    </div>
    <div class="ops-list" style="margin-bottom:14px">
      <div class="ops-setting-row" id="exportBackupRow" onclick="UI.handleExportBackup(this)">
        <div class="ops-setting-main">
          <div class="ops-setting-icon">${Icons.download}</div>
          <div>
            <div class="ops-setting-title">Export database snapshot</div>
            <div class="ops-setting-sub">Download complete JSON archive of clients, inventory &amp; payments</div>
          </div>
        </div>
        <div class="ops-setting-chevron" id="exportBackupStatus">${Icons.chevronRight}</div>
      </div>
      <div class="ops-setting-row" onclick="document.getElementById('moreImportFile').click()">
        <div class="ops-setting-main">
          <div class="ops-setting-icon">${Icons.upload}</div>
          <div>
            <div class="ops-setting-title">Restore database from backup</div>
            <div class="ops-setting-sub">Upload a previously saved TechTrove JSON snapshot file</div>
          </div>
        </div>
        <div class="ops-setting-chevron">${Icons.chevronRight}</div>
        <input type="file" id="moreImportFile" accept=".json" style="display:none" onchange="UI.handleImport(this)">
      </div>
    </div>

    <!-- Section 3: Maintenance & Security -->
    <div class="section-head">
      <div class="section-title">System &amp; security</div>
      <div class="section-count">Build v3.0</div>
    </div>
    <div class="ops-list" style="margin-bottom:14px">
      <div class="ops-setting-row" onclick="UI.checkForUpdates()">
        <div class="ops-setting-main">
          <div class="ops-setting-icon">${Icons.refresh}</div>
          <div>
            <div class="ops-setting-title">Check for updates &amp; reload</div>
            <div class="ops-setting-sub">Purges stale service worker caches and fetches newest build</div>
          </div>
        </div>
        <div class="ops-setting-chevron">${Icons.chevronRight}</div>
      </div>
      <div class="ops-setting-row" onclick="UI.showLogoutConfirm()">
        <div class="ops-setting-main">
          <div class="ops-setting-icon" style="color:var(--status-danger)">${Icons.lock}</div>
          <div>
            <div class="ops-setting-title" style="color:var(--status-danger)">Sign out &amp; lock console</div>
            <div class="ops-setting-sub">Terminates active session and requires password on next entry</div>
          </div>
        </div>
        <div class="ops-setting-chevron" style="color:var(--status-danger)">${Icons.chevronRight}</div>
      </div>
    </div>

    <div style="text-align:center;padding:12px 0 20px;font-size:0.74rem;color:var(--text-dim)">
      TechTrove Systems &middot; Terminal v3.0
    </div>`;

    document.getElementById('page-more').innerHTML = html;
  },

  handleExportBackup(rowEl) {
    const statusEl = document.getElementById('exportBackupStatus');
    if (statusEl) {
      statusEl.innerHTML = `<span style="color:var(--accent);font-size:0.75rem">Exporting...</span>`;
    }
    setTimeout(() => {
      Data.exportJSON();
      if (statusEl) {
        statusEl.innerHTML = `<span style="color:var(--status-ok)">${Icons.check}</span>`;
        setTimeout(() => {
          statusEl.innerHTML = Icons.chevronRight;
        }, 1200);
      }
    }, 200);
  },

  showLogoutConfirm() {
    this.showConfirm(
      'Are you sure you want to sign out and lock the TechTrove Ops Console?',
      () => Auth.logout()
    );
  },

  async checkForUpdates() {
    UI.showToast('Checking for updates...', 'info');
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (let reg of regs) {
          await reg.update();
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (let key of keys) {
          await caches.delete(key);
        }
      }
    } catch(e) {}
    UI.showToast('Updated! Reloading...', 'success');
    setTimeout(() => {
      window.location.reload(true);
    }, 400);
  },

  async testSystemNotification() {
    const granted = await AppNotif.requestPermission();
    if (!granted && Notification?.permission === 'denied') {
      UI.showToast('Please enable notifications in Android / Browser settings', 'error');
      return;
    }
    UI.showToast('Sending test notification to your phone...', 'info');
    await AppNotif.sendSystemNotification('TechTrove System Alert', 'Background notification active! You will receive due alerts even outside the app.', 8888);
  },

  /* MODALS: CUSTOMER */
  showAddCustomerModal() {
    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>Add New Customer</h2>
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" id="custName" placeholder="e.g. Rahul Sharma">
      </div>
      <div class="form-group">
        <label>Phone Number * (10 Digits Only)</label>
        <input type="tel" id="custPhone" placeholder="10-digit mobile number, e.g. 9876543210" maxlength="10" inputmode="numeric" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)">
      </div>
      <div class="form-group">
        <label>Location / Address</label>
        <textarea id="custAddress" placeholder="Customer address or workplace location"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.saveCustomer()">Save Customer</button>
      </div>`);
    setTimeout(() => document.getElementById('custName').focus(), 300);
  },

  showEditCustomerModal(id) {
    const c = getCustomer(id);
    if (!c) return;
    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>Edit Customer</h2>
      <div class="form-group">
        <label>Full Name *</label>
        <input type="text" id="custName" value="${escHtml(c.name)}">
      </div>
      <div class="form-group">
        <label>Phone Number * (10 Digits Only)</label>
        <input type="tel" id="custPhone" value="${escHtml(cleanPhone(c.phone))}" placeholder="10-digit mobile number" maxlength="10" inputmode="numeric" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)">
      </div>
      <div class="form-group">
        <label>Location / Address</label>
        <textarea id="custAddress">${escHtml(c.address || '')}</textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.saveCustomer('${c.id}')">Update</button>
      </div>`);
  },

  saveCustomer(id) {
    const name = document.getElementById('custName').value.trim();
    const phoneRaw = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();

    if (!name) { UI.showToast('Please enter customer name', 'error'); return; }
    if (!phoneRaw) { UI.showToast('Please enter customer phone number', 'error'); return; }

    const phoneDigits = cleanPhone(phoneRaw);
    if (!/^[0-9]{10}$/.test(phoneDigits)) {
      UI.showToast('Phone number must be exactly 10 digits (0-9)', 'error');
      return;
    }

    const duplicate = state.customers.find(c => c.id !== id && cleanPhone(c.phone) === phoneDigits);
    if (duplicate) {
      UI.showToast(`Phone number already belongs to "${duplicate.name}"!`, 'error');
      return;
    }

    if (id) {
      const c = getCustomer(id);
      if (c) {
        c.name = name;
        c.phone = phoneDigits;
        c.address = address;
      }
      Data.save();
      UI.hideModal();
      UI.showToast('Customer updated', 'success');
      UI.renderAll();
    } else {
      const newCustId = uid();
      state.customers.push({
        id: newCustId,
        name,
        phone: phoneDigits,
        address,
        createdAt: today()
      });
      Data.save();
      UI.hideModal();
      UI.showToast(`Customer "${name}" added!`, 'success');
      UI.renderAll();
      if (window.innerWidth >= 1200) {
        UI.navigate('customers');
        setTimeout(() => UI.selectCustomer(newCustId, false), 50);
      } else {
        UI.pushPage('customer-detail', newCustId);
      }
    }
  },

  deleteCustomer(customerId) {
    if (!Auth.isAdmin()) {
      UI.showToast('🔒 Permission Denied: Only Admin can delete customer records.', 'error');
      return;
    }
    const c = getCustomer(customerId);
    if (!c) return;
    const rentals = state.rentals.filter(r => r.customerId === customerId);
    const activeRentals = rentals.filter(isActiveRental);
    let msg = `Delete <strong>${escHtml(c.name)}</strong> (${escHtml(c.phone)})?`;
    if (rentals.length > 0) {
      msg += `<br><br>This will also remove <strong>${rentals.length} rental record(s)</strong>`;
      if (activeRentals.length > 0) msg += ` (<strong>${activeRentals.length} currently active</strong>)`;
    }
    UI.showConfirm(msg, () => {
      const rentalIds = rentals.map(r => r.id);
      rentals.forEach(r => {
        const item = getItem(r.itemId);
        if (item) item.status = 'available';
      });
      state.payments = state.payments.filter(p => !rentalIds.includes(p.rentalId));
      state.rentals = state.rentals.filter(r => r.customerId !== customerId);
      state.customers = state.customers.filter(c => c.id !== customerId);
      Data.save();
      UI.goBack();
      UI.showToast('Customer deleted', 'info');
      UI.renderAll();
    });
  },

  /* SEARCHABLE PRESET PICKER & COMPONENT BUILDER */
  currentPresetBrandFilter: 'ALL',

  renderPresetSearchResults(query = '') {
    const q = (query || '').toLowerCase().trim();
    let list = PRESET_CATALOGUE;

    if (this.currentPresetBrandFilter && this.currentPresetBrandFilter !== 'ALL') {
      const b = this.currentPresetBrandFilter.toLowerCase();
      list = list.filter(p => p.brand.toLowerCase() === b || (b === 'monitor' && p.type === 'Monitor'));
    }

    if (q) {
      list = list.filter(p => {
        return p.model.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.specs.toLowerCase().includes(q) ||
          (p.type && p.type.toLowerCase().includes(q));
      });
    }

    let html = '';
    if (list.length === 0) {
      html += `<div style="padding:12px;text-align:center;color:var(--text-muted);font-size:.82rem">No preset models matching "<strong>${escHtml(query)}</strong>"</div>`;
    } else {
      list.forEach(p => {
        html += `
        <div class="preset-result-item" onclick="UI.selectPresetModel('${escHtml(p.model)}')">
          <div class="preset-result-title">
            <span class="preset-result-brand">${escHtml(p.brand)}</span>
            <span class="preset-result-model">${escHtml(p.model)}</span>
            <span class="preset-result-type">${escHtml(p.type || 'Laptop')}</span>
          </div>
          <div class="preset-result-specs">${escHtml(p.specs)}</div>
        </div>`;
      });
    }

    if (q) {
      html += `
      <div class="preset-result-item preset-custom-option" onclick="UI.selectCustomModel(\`${escHtml(query).replace(/`/g, '\\`')}\`)">
        <div style="font-weight:700;color:var(--accent)">Use "${escHtml(query)}" as Custom Model</div>
        <div style="font-size:.74rem;color:var(--text-muted)">Click to set custom model and adjust specs below</div>
      </div>`;
    }

    return html;
  },

  filterPresetsByBrand(brand, btnEl) {
    this.currentPresetBrandFilter = brand;
    const container = document.getElementById('presetBrandPills');
    if (container) {
      container.querySelectorAll('.brand-pill').forEach(b => b.classList.remove('active'));
    }
    if (btnEl) btnEl.classList.add('active');
    const input = document.getElementById('presetSearchInput');
    const resultsEl = document.getElementById('presetResultsList');
    if (resultsEl) {
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = this.renderPresetSearchResults(input ? input.value : '');
    }
  },

  onPresetSearchInput(val) {
    const resultsEl = document.getElementById('presetResultsList');
    if (resultsEl) {
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = this.renderPresetSearchResults(val);
    }
  },

  selectPresetModel(modelName) {
    const preset = PRESET_CATALOGUE.find(p => p.model === modelName);
    if (!preset) return;

    const brandEl = document.getElementById('itemBrand');
    const modelEl = document.getElementById('itemModel');
    const typeEl = document.getElementById('itemType');
    const specsEl = document.getElementById('itemSpecs');
    const cpuEl = document.getElementById('itemCpu');
    const ramEl = document.getElementById('itemRam');
    const storageEl = document.getElementById('itemStorage');
    const screenEl = document.getElementById('itemScreen');
    const searchInput = document.getElementById('presetSearchInput');
    const resultsEl = document.getElementById('presetResultsList');
    const bannerEl = document.getElementById('selectedPresetBanner');

    if (brandEl) brandEl.value = preset.brand;
    if (modelEl) modelEl.value = preset.model;
    if (typeEl) typeEl.value = preset.type || 'Laptop';
    if (specsEl) specsEl.value = preset.specs || '';
    if (cpuEl && preset.cpu) cpuEl.value = preset.cpu;
    if (ramEl && preset.ram) ramEl.value = preset.ram;
    if (storageEl && preset.storage) storageEl.value = preset.storage;
    if (screenEl && preset.screen) screenEl.value = preset.screen;

    if (searchInput) searchInput.value = `${preset.brand} ${preset.model}`;
    if (resultsEl) resultsEl.style.display = 'none';

    if (bannerEl) {
      bannerEl.innerHTML = `
        <div>
          <span>Selected: <strong>${escHtml(preset.brand)} ${escHtml(preset.model)}</strong></span>
          <div style="font-size:.75rem;opacity:.9;margin-top:1px">${escHtml(preset.specs)}</div>
        </div>
        <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px;min-height:24px;font-size:.72rem;background:var(--surface);border-color:var(--status-ok-border);color:var(--status-ok)" onclick="UI.clearPresetSelection()">Change</button>
      `;
      bannerEl.style.display = 'flex';
    }
  },

  selectCustomModel(customVal) {
    const modelEl = document.getElementById('itemModel');
    const searchInput = document.getElementById('presetSearchInput');
    const resultsEl = document.getElementById('presetResultsList');
    const bannerEl = document.getElementById('selectedPresetBanner');

    if (modelEl) modelEl.value = customVal;
    if (searchInput) searchInput.value = customVal;
    if (resultsEl) resultsEl.style.display = 'none';

    if (bannerEl) {
      bannerEl.innerHTML = `
        <div>
          <span>Custom Model: <strong>${escHtml(customVal)}</strong></span>
        </div>
        <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px;min-height:24px;font-size:.72rem;background:var(--surface);border-color:var(--accent-border);color:var(--accent)" onclick="UI.clearPresetSelection()">Change</button>
      `;
      bannerEl.style.display = 'flex';
    }
  },

  clearPresetSelection() {
    const searchInput = document.getElementById('presetSearchInput');
    const resultsEl = document.getElementById('presetResultsList');
    const bannerEl = document.getElementById('selectedPresetBanner');
    if (searchInput) { searchInput.value = ''; searchInput.focus(); }
    if (bannerEl) bannerEl.style.display = 'none';
    if (resultsEl) {
      resultsEl.style.display = 'block';
      resultsEl.innerHTML = this.renderPresetSearchResults('');
    }
  },

  _buildSelectOptions(list, selectedVal = '') {
    let html = `<option value="">-- Select or customize below --</option>`;
    list.forEach(opt => {
      const isSel = selectedVal && (opt.toLowerCase() === selectedVal.toLowerCase() || selectedVal.toLowerCase().includes(opt.toLowerCase()));
      html += `<option value="${escHtml(opt)}" ${isSel ? 'selected' : ''}>${escHtml(opt)}</option>`;
    });
    return html;
  },

  onComponentDropdownChange() {
    const cpu = document.getElementById('itemCpu')?.value || '';
    const ram = document.getElementById('itemRam')?.value || '';
    const storage = document.getElementById('itemStorage')?.value || '';
    const screen = document.getElementById('itemScreen')?.value || '';
    const specsEl = document.getElementById('itemSpecs');

    const parts = [cpu, ram, storage, screen].filter(Boolean).filter(s => !s.startsWith('Other') && s !== 'N/A' && s !== 'External Monitor / None');
    if (parts.length > 0 && specsEl) {
      specsEl.value = parts.join(' • ');
    }
  },

  onStatusDropdownChange(statusSel) {
    const repSec = document.getElementById('repairSection');
    if (repSec) {
      repSec.style.display = statusSel.value === 'repair' ? 'block' : 'none';
    }
  },

  showAddItemModal() {
    this.currentPresetBrandFilter = 'ALL';
    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>Add Laptop / Device</h2>

      <!-- SEARCHABLE PRESET MODEL PICKER -->
      <div class="preset-search-box">
        <div class="preset-search-header">
          <label style="font-weight:700;color:var(--text-primary);font-size:.85rem">Search &amp; Pick Model Preset (40+ Models)</label>
          <div style="font-size:.74rem;color:var(--text-muted)">Type any model name (e.g. <em>3420, T14, M1, 840, i5</em>) or tap a brand:</div>
        </div>

        <div class="preset-brand-pills" id="presetBrandPills">
          <button type="button" class="brand-pill active" onclick="UI.filterPresetsByBrand('ALL', this)">All</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Dell', this)">Dell</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Lenovo', this)">Lenovo</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('HP', this)">HP</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Apple', this)">Apple</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Asus', this)">Asus</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Acer', this)">Acer</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Monitor', this)">Monitors</button>
        </div>

        <div class="preset-input-wrapper">
          <input type="text" id="presetSearchInput" class="preset-search-input" placeholder="Type model name (e.g. 3420, T14, M1, EliteBook)..." oninput="UI.onPresetSearchInput(this.value)" onfocus="document.getElementById('presetResultsList').style.display='block'" autocomplete="off">
          <button type="button" class="preset-clear-btn" onclick="UI.clearPresetSelection()">&times;</button>
        </div>

        <div id="presetResultsList" class="preset-results-dropdown">
          ${this.renderPresetSearchResults('')}
        </div>

        <div id="selectedPresetBanner" class="selected-preset-banner" style="display:none"></div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Device Type *</label>
          <select id="itemType">
            <option value="Laptop" selected>Laptop</option>
            <option value="Desktop">Desktop PC / Tower</option>
            <option value="MacBook">MacBook / Apple</option>
            <option value="Monitor">Monitor / Display</option>
            <option value="Projector">Projector</option>
            <option value="Other">Other Equipment</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status *</label>
          <select id="itemStatus" onchange="UI.onStatusDropdownChange(this)">
            <option value="available" selected>Available</option>
            <option value="rented">Rented</option>
            <option value="repair">Under Repair / Service</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Brand *</label>
          <input type="text" id="itemBrand" placeholder="e.g. Dell, Lenovo, HP, Apple">
        </div>
        <div class="form-group">
          <label>Model *</label>
          <input type="text" id="itemModel" placeholder="e.g. Latitude 3420, ThinkPad T14">
        </div>
      </div>

      <!-- COMPONENT PICKER DROPDOWNS -->
      <div class="spec-builder-box">
        <div class="spec-builder-title">Quick Spec Builder (Pick or Customize)</div>
        <div class="form-row">
          <div class="form-group">
            <label style="font-size:.75rem">Processor</label>
            <select id="itemCpu" onchange="UI.onComponentDropdownChange()">${this._buildSelectOptions(PROCESSOR_LIST)}</select>
          </div>
          <div class="form-group">
            <label style="font-size:.75rem">RAM Memory</label>
            <select id="itemRam" onchange="UI.onComponentDropdownChange()">${this._buildSelectOptions(RAM_LIST)}</select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label style="font-size:.75rem">Storage Drive</label>
            <select id="itemStorage" onchange="UI.onComponentDropdownChange()">${this._buildSelectOptions(STORAGE_LIST)}</select>
          </div>
          <div class="form-group">
            <label style="font-size:.75rem">Display / Screen</label>
            <select id="itemScreen" onchange="UI.onComponentDropdownChange()">${this._buildSelectOptions(SCREEN_LIST)}</select>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Full Specifications (Editable Text)</label>
        <input type="text" id="itemSpecs" placeholder="e.g. Intel Core i5 11th Gen • 16GB RAM • 512GB NVMe SSD • 14.0 FHD">
      </div>

      <div class="form-group">
        <label>Serial Number / Asset Tag *</label>
        <input type="text" id="itemSerial" placeholder="Unique Serial or Asset Tag (e.g. SN-8823)">
      </div>

      <!-- DYNAMIC UNDER REPAIR / SERVICE FORM -->
      <div id="repairSection" class="repair-section-form" style="display:none">
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;font-size:.9rem">Under Repair &amp; Service Details</div>
        <div class="form-group">
          <label>Service Center / Shop Name &amp; Location *</label>
          <input type="text" id="repairServiceCenter" placeholder="e.g. Dell Authorized Service, SP Road / Nehru Place">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Technician / Contact Person</label>
            <input type="text" id="repairServicePerson" placeholder="e.g. Suresh Kumar">
          </div>
          <div class="form-group">
            <label>Technician Phone Number (10 Digits)</label>
            <input type="tel" id="repairServicePhone" placeholder="10-digit mobile number, e.g. 9876543210" maxlength="10" inputmode="numeric" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Handover to Service Date</label>
            <input type="date" id="repairHandoverDate" value="${today()}">
          </div>
          <div class="form-group">
            <label>Expected Return Date</label>
            <input type="date" id="repairExpectedReturnDate">
          </div>
        </div>
        <div class="form-group">
          <label>Date Picked up from Customer (if applicable)</label>
          <input type="date" id="repairCollectedDate">
        </div>
        <div class="form-group">
          <label>Repair Issue Description / Notes</label>
          <textarea id="repairIssue" placeholder="e.g. Screen flickering / Keyboard key stuck / RAM upgrade"></textarea>
        </div>
        <div class="form-group">
          <label>Estimated / Actual Cost (₹)</label>
          <input type="number" id="repairCost" placeholder="e.g. 1500" min="0" step="1">
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.saveItem()">Save to Inventory</button>
      </div>`);
    setTimeout(() => {
      const input = document.getElementById('presetSearchInput');
      if (input) input.focus();
    }, 300);
  },

  showEditItemModal(itemId) {
    const i = getItem(itemId);
    if (!i) return;
    const activeRental = getActiveRentalForItem(itemId);
    const isRented = !!activeRental;
    const rep = i.repairInfo || {};
    this.currentPresetBrandFilter = 'ALL';

    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>Edit Device</h2>

      <!-- SEARCHABLE PRESET MODEL PICKER -->
      <div class="preset-search-box">
        <div class="preset-search-header">
          <label style="font-weight:700;color:var(--text-primary);font-size:.85rem">Search &amp; Pick Model Preset</label>
          <div style="font-size:.74rem;color:var(--text-muted)">Type any model name (e.g. <em>3420, T14, M1, 840</em>) or tap a brand:</div>
        </div>

        <div class="preset-brand-pills" id="presetBrandPills">
          <button type="button" class="brand-pill active" onclick="UI.filterPresetsByBrand('ALL', this)">All</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Dell', this)">Dell</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Lenovo', this)">Lenovo</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('HP', this)">HP</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Apple', this)">Apple</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Asus', this)">Asus</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Acer', this)">Acer</button>
          <button type="button" class="brand-pill" onclick="UI.filterPresetsByBrand('Monitor', this)">Monitors</button>
        </div>

        <div class="preset-input-wrapper">
          <input type="text" id="presetSearchInput" class="preset-search-input" value="${escHtml(i.brand ? i.brand + ' ' + (i.model || '') : '')}" placeholder="Search models..." oninput="UI.onPresetSearchInput(this.value)" onfocus="document.getElementById('presetResultsList').style.display='block'" autocomplete="off">
          <button type="button" class="preset-clear-btn" onclick="UI.clearPresetSelection()">&times;</button>
        </div>

        <div id="presetResultsList" class="preset-results-dropdown" style="display:none">
          ${this.renderPresetSearchResults(i.model || '')}
        </div>

        <div id="selectedPresetBanner" class="selected-preset-banner" style="${i.model ? 'display:flex' : 'display:none'}">
          <div>
            <span>Current: <strong>${escHtml(i.brand || '')} ${escHtml(i.model || '')}</strong></span>
          </div>
          <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px;min-height:24px;font-size:.72rem;background:var(--surface);border-color:var(--accent-border);color:var(--accent)" onclick="UI.clearPresetSelection()">Change</button>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Device Type *</label>
          <select id="itemType">
            <option value="Laptop" ${i.type==='Laptop'?'selected':''}>Laptop</option>
            <option value="Desktop" ${i.type==='Desktop'?'selected':''}>Desktop PC / Tower</option>
            <option value="MacBook" ${i.type==='MacBook'?'selected':''}>MacBook / Apple</option>
            <option value="Monitor" ${i.type==='Monitor'?'selected':''}>Monitor</option>
            <option value="Projector" ${i.type==='Projector'?'selected':''}>Projector</option>
            <option value="Other" ${i.type==='Other'?'selected':''}>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select id="itemStatus" ${isRented ? 'disabled' : ''} onchange="UI.onStatusDropdownChange(this)">
            <option value="available" ${i.status==='available'?'selected':''}>Available</option>
            <option value="rented" ${i.status==='rented'?'selected':''}>Rented</option>
            <option value="repair" ${i.status==='repair'?'selected':''}>Under Repair / Service</option>
          </select>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Brand *</label>
          <input type="text" id="itemBrand" value="${escHtml(i.brand || '')}">
        </div>
        <div class="form-group">
          <label>Model *</label>
          <input type="text" id="itemModel" value="${escHtml(i.model || '')}">
        </div>
      </div>

      <!-- COMPONENT PICKER DROPDOWNS -->
      <div class="spec-builder-box">
        <div class="spec-builder-title">Quick Spec Builder (Pick or Customize)</div>
        <div class="form-row">
          <div class="form-group">
            <label style="font-size:.75rem">Processor</label>
            <select id="itemCpu" onchange="UI.onComponentDropdownChange()">${this._buildSelectOptions(PROCESSOR_LIST, i.specs)}</select>
          </div>
          <div class="form-group">
            <label style="font-size:.75rem">RAM Memory</label>
            <select id="itemRam" onchange="UI.onComponentDropdownChange()">${this._buildSelectOptions(RAM_LIST, i.specs)}</select>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label style="font-size:.75rem">Storage Drive</label>
            <select id="itemStorage" onchange="UI.onComponentDropdownChange()">${this._buildSelectOptions(STORAGE_LIST, i.specs)}</select>
          </div>
          <div class="form-group">
            <label style="font-size:.75rem">Display / Screen</label>
            <select id="itemScreen" onchange="UI.onComponentDropdownChange()">${this._buildSelectOptions(SCREEN_LIST, i.specs)}</select>
          </div>
        </div>
      </div>

      <div class="form-group">
        <label>Full Specifications (Editable Text)</label>
        <input type="text" id="itemSpecs" value="${escHtml(i.specs || '')}">
      </div>

      <div class="form-group">
        <label>Serial Number / Asset Tag *</label>
        <input type="text" id="itemSerial" value="${escHtml(i.serial || '')}">
      </div>

      <!-- DYNAMIC UNDER REPAIR / SERVICE FORM -->
      <div id="repairSection" class="repair-section-form" style="display:${i.status==='repair'?'block':'none'}">
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;font-size:.9rem">Under Repair &amp; Service Details</div>
        <div class="form-group">
          <label>Service Center / Shop Name &amp; Location</label>
          <input type="text" id="repairServiceCenter" value="${escHtml(rep.serviceCenter || '')}" placeholder="e.g. Dell Authorized Service, SP Road">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Technician / Contact Person</label>
            <input type="text" id="repairServicePerson" value="${escHtml(rep.servicePerson || '')}" placeholder="e.g. Suresh Kumar">
          </div>
          <div class="form-group">
            <label>Technician Phone Number (10 Digits)</label>
            <input type="tel" id="repairServicePhone" value="${escHtml(cleanPhone(rep.servicePhone || ''))}" placeholder="10-digit mobile number" maxlength="10" inputmode="numeric" pattern="[0-9]{10}" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,10)">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Handover to Service Date</label>
            <input type="date" id="repairHandoverDate" value="${rep.givenToServiceDate || today()}">
          </div>
          <div class="form-group">
            <label>Expected Return Date</label>
            <input type="date" id="repairExpectedReturnDate" value="${rep.expectedReturnDate || ''}">
          </div>
        </div>
        <div class="form-group">
          <label>Date Picked up from Customer (if applicable)</label>
          <input type="date" id="repairCollectedDate" value="${rep.collectedFromCustomerDate || ''}">
        </div>
        <div class="form-group">
          <label>Repair Issue Description / Notes</label>
          <textarea id="repairIssue" placeholder="e.g. Screen flickering / Keyboard replacement">${escHtml(rep.repairIssue || '')}</textarea>
        </div>
        <div class="form-group">
          <label>Estimated / Actual Cost (₹)</label>
          <input type="number" id="repairCost" value="${rep.repairCost || ''}" placeholder="e.g. 1500" min="0" step="1">
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.saveItem('${i.id}')">Update Device</button>
      </div>
      ${Auth.isAdmin() ? (!isRented ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border)"><button class="btn btn-danger btn-block btn-sm" onclick="UI.deleteItem('${i.id}')">Delete Item</button></div>` : '<div style="margin-top:8px;font-size:.8rem;color:var(--text-muted);text-align:center">Cannot delete — currently rented out.</div>') : ''}`);
  },


  saveItem(id) {
    const type = document.getElementById('itemType').value;
    const brand = document.getElementById('itemBrand').value.trim();
    const model = document.getElementById('itemModel').value.trim();
    const specs = document.getElementById('itemSpecs').value.trim();
    const serial = document.getElementById('itemSerial').value.trim();
    const status = document.getElementById('itemStatus').value;

    if (!brand) { UI.showToast('Please enter brand (e.g. Dell, HP)', 'error'); return; }
    if (!serial) { UI.showToast('Please enter serial number / asset tag', 'error'); return; }

    let repairInfo = null;
    if (status === 'repair') {
      const sPhoneDigits = cleanPhone(document.getElementById('repairServicePhone')?.value || '');
      if (sPhoneDigits && !/^[0-9]{10}$/.test(sPhoneDigits)) {
        UI.showToast('Technician phone number must be exactly 10 digits', 'error');
        return;
      }
      repairInfo = {
        serviceCenter: document.getElementById('repairServiceCenter')?.value.trim() || '',
        servicePerson: document.getElementById('repairServicePerson')?.value.trim() || '',
        servicePhone: sPhoneDigits,
        givenToServiceDate: document.getElementById('repairHandoverDate')?.value || today(),
        expectedReturnDate: document.getElementById('repairExpectedReturnDate')?.value || '',
        collectedFromCustomerDate: document.getElementById('repairCollectedDate')?.value || '',
        repairIssue: document.getElementById('repairIssue')?.value.trim() || '',
        repairCost: parseFloat(document.getElementById('repairCost')?.value) || 0
      };
    }

    if (id) {
      const item = getItem(id);
      if (item) {
        item.type = type;
        item.brand = brand;
        item.model = model;
        item.specs = specs;
        item.serial = serial;
        item.status = status;
        if (repairInfo) item.repairInfo = repairInfo;
        else if (status !== 'repair') delete item.repairInfo;
      }
    } else {
      state.items.push({
        id: uid(),
        type,
        brand,
        model,
        specs,
        serial,
        status,
        repairInfo: repairInfo || undefined,
        createdAt: today()
      });
    }

    Data.save();
    UI.hideModal();
    UI.showToast(id ? 'Device updated' : 'Device added to inventory', 'success');
    UI.renderAll();
  },

  markItemRepaired(itemId) {
    const item = getItem(itemId);
    if (!item) return;
    UI.showConfirm(`Mark <strong>${escHtml(getItemFullTitle(item))}</strong> as repaired and return to available stock?`, () => {
      item.status = 'available';
      if (item.repairInfo) {
        item.repairInfo.repairStatus = 'Resolved';
      }
      Data.save();
      UI.showToast('Device marked as Repaired and returned to available inventory!', 'success');
      UI.renderAll();
    });
  },

  deleteItem(itemId) {
    if (!Auth.isAdmin()) {
      UI.showToast('🔒 Permission Denied: Only Admin can delete inventory equipment.', 'error');
      return;
    }
    UI.showConfirm('Permanently remove this item from inventory?', () => {
      const isRented = state.rentals.some(r => r.itemId === itemId && isActiveRental(r));
      if (isRented) { UI.showToast('Cannot delete — item is currently rented', 'error'); return; }
      state.items = state.items.filter(i => i.id !== itemId);
      Data.save();
      UI.hideModal();
      UI.showToast('Item deleted', 'info');
      UI.renderAll();
    });
  },

  /* MODALS: RENTALS */
  showAddRentalWithItem(itemId) {
    this.showAddRentalModal(itemId);
  },

  showAddRentalModal(preselectedItemId) {
    const availableItems = getAvailableItems(preselectedItemId);
    const customers = state.customers;

    if (customers.length === 0) {
      this.showToast('Please add a client first before creating a rental.', 'info');
      this.showAddCustomerModal();
      return;
    }

    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2 style="font-size:1.05rem;font-weight:700;margin-bottom:14px">New Rental Agreement</h2>
      <div class="form-group">
        <label>Select Client *</label>
        <select id="rentalCustomer">
          ${customers.map(c => `<option value="${c.id}">${escHtml(c.name)} (${escHtml(fmtPhone(c.phone))})</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Select Device *</label>
        <select id="rentalItem">
          ${availableItems.length === 0 
            ? '<option value="">— No available devices in inventory —</option>' 
            : availableItems.map(i => `<option value="${i.id}" ${i.id === preselectedItemId ? 'selected' : ''}>${escHtml(getItemFullTitle(i))} [SN: ${escHtml(i.serial)}]${i.specs ? ' — ' + escHtml(i.specs) : ''}</option>`).join('')}
        </select>
        ${availableItems.length === 0 ? `
          <div style="margin-top:6px;font-size:0.75rem;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center">
            <span>All laptops are currently rented out or in repair.</span>
            <button type="button" class="btn btn-outline btn-micro" onclick="UI.showAddItemModal()">+ Add New Laptop</button>
          </div>
        ` : ''}
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Rent Amount (₹) *</label>
          <input type="number" id="rentalAmount" placeholder="e.g. 1500" min="0" step="1" oninput="const adv=document.getElementById('rentalAdvanceAmount'); if(adv && !adv.dataset.touched) adv.value=this.value;">
        </div>
        <div class="form-group">
          <label>Billing Cycle</label>
          <select id="rentalCycle" onchange="document.getElementById('customDaysGroup').style.display=this.value==='custom'?'block':'none'">
            <option value="monthly" selected>Monthly (30 Days)</option>
            <option value="weekly">Weekly (7 Days)</option>
            <option value="custom">Custom Days</option>
          </select>
        </div>
      </div>
      <div class="form-group" id="customDaysGroup" style="display:none">
        <label>Custom Cycle Days</label>
        <input type="number" id="rentalCustomDays" placeholder="Number of days, e.g. 15" min="1" step="1">
      </div>
      <div class="form-group">
        <label>Rental Start Date *</label>
        <input type="date" id="rentalStart" value="${today()}">
      </div>

      <!-- Upfront Payment on Handover Section -->
      <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.22);border-radius:var(--radius-md);padding:14px;margin-top:14px;margin-bottom:14px">
        <div style="font-size:0.78rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span>💵 Initial Payment Collected on Handover</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Advance Rent (₹)</label>
            <input type="number" id="rentalAdvanceAmount" placeholder="0" min="0" step="1" oninput="this.dataset.touched='true'">
          </div>
          <div class="form-group">
            <label>Security Deposit (₹)</label>
            <input type="number" id="rentalDepositAmount" placeholder="0 (Optional)" min="0" step="1">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Paid To (Received By) *</label>
            <select id="rentalPaidTo">
              ${PAYMENT_COLLECTORS.map(name => `<option value="${name}">${name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Payment Mode</label>
            <select id="rentalPayMethod">
              <option value="GPay / UPI" selected>GPay / UPI</option>
              <option value="Cash">Cash</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.saveNewRentalFromGlobal()">Start Rental</button>
      </div>`);
  },

  saveNewRentalFromGlobal() {
    const customerId = document.getElementById('rentalCustomer')?.value;
    if (!customerId) { UI.showToast('Please select a client', 'error'); return; }
    this.saveNewRental(customerId);
  },

  showNewRentalModal(customerId, preselectedItemId) {
    const availableItems = getAvailableItems(preselectedItemId);
    const c = getCustomer(customerId);
    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>New Rental Assignment</h2>
      <div class="form-group">
        <label>Customer</label>
        <input type="text" value="${escHtml(c ? c.name + ' (' + fmtPhone(c.phone) + ')' : '')}" disabled style="background:var(--surface-raised);color:var(--text-muted);border-color:var(--border)">
      </div>
      <div class="form-group">
        <label>Select Laptop / Computer *</label>
        <select id="rentalItem">
          ${availableItems.length === 0 
            ? '<option value="">— No available devices in inventory —</option>' 
            : availableItems.map(i => `<option value="${i.id}" ${i.id === preselectedItemId ? 'selected' : ''}>${escHtml(getItemFullTitle(i))} [SN: ${escHtml(i.serial)}]${i.specs ? ' — ' + escHtml(i.specs) : ''}</option>`).join('')}
        </select>
        ${availableItems.length === 0 ? `
          <div style="margin-top:6px;font-size:0.75rem;color:var(--text-muted);display:flex;justify-content:space-between;align-items:center">
            <span>All laptops are currently rented out or in repair.</span>
            <button type="button" class="btn btn-outline btn-micro" onclick="UI.showAddItemModal()">+ Add New Laptop</button>
          </div>
        ` : ''}
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Rent Amount (₹) *</label>
          <input type="number" id="rentalAmount" placeholder="e.g. 1500" min="0" step="1" oninput="const adv=document.getElementById('rentalAdvanceAmount'); if(adv && !adv.dataset.touched) adv.value=this.value;">
        </div>
        <div class="form-group">
          <label>Billing Cycle</label>
          <select id="rentalCycle" onchange="document.getElementById('customDaysGroup').style.display=this.value==='custom'?'block':'none'">
            <option value="monthly" selected>Monthly (30 Days)</option>
            <option value="weekly">Weekly (7 Days)</option>
            <option value="custom">Custom Days</option>
          </select>
        </div>
      </div>
      <div class="form-group" id="customDaysGroup" style="display:none">
        <label>Custom Cycle Days</label>
        <input type="number" id="rentalCustomDays" placeholder="Number of days, e.g. 15" min="1" step="1">
      </div>
      <div class="form-group">
        <label>Rental Start Date *</label>
        <input type="date" id="rentalStart" value="${today()}">
      </div>

      <!-- Upfront Payment on Handover Section -->
      <div style="background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.22);border-radius:var(--radius-md);padding:14px;margin-top:14px;margin-bottom:14px">
        <div style="font-size:0.78rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:0.5px;margin-bottom:10px;display:flex;align-items:center;gap:6px">
          <span>💵 Initial Payment Collected on Handover</span>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Advance Rent (₹)</label>
            <input type="number" id="rentalAdvanceAmount" placeholder="0" min="0" step="1" oninput="this.dataset.touched='true'">
          </div>
          <div class="form-group">
            <label>Security Deposit (₹)</label>
            <input type="number" id="rentalDepositAmount" placeholder="0 (Optional)" min="0" step="1">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Paid To (Received By) *</label>
            <select id="rentalPaidTo">
              ${PAYMENT_COLLECTORS.map(name => `<option value="${name}">${name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label>Payment Mode</label>
            <select id="rentalPayMethod">
              <option value="GPay / UPI" selected>GPay / UPI</option>
              <option value="Cash">Cash</option>
              <option value="PhonePe">PhonePe</option>
              <option value="Bank Transfer">Bank Transfer / NEFT</option>
              <option value="Card">Card</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.saveNewRental('${customerId}')">Start Rental</button>
      </div>`);
  },

  saveNewRental(customerId) {
    const itemId = document.getElementById('rentalItem').value;
    const amount = parseFloat(document.getElementById('rentalAmount').value);
    const cycle = document.getElementById('rentalCycle').value;
    const customDays = parseInt(document.getElementById('rentalCustomDays').value) || 0;
    const start = document.getElementById('rentalStart').value;

    const advanceAmount = parseFloat(document.getElementById('rentalAdvanceAmount')?.value) || 0;
    const depositAmount = parseFloat(document.getElementById('rentalDepositAmount')?.value) || 0;
    const paidTo = document.getElementById('rentalPaidTo')?.value || PAYMENT_COLLECTORS[0];
    const payMethod = document.getElementById('rentalPayMethod')?.value || 'GPay / UPI';

    if (!itemId) { UI.showToast('Please select a device from inventory', 'error'); return; }
    if (!amount || amount <= 0) { UI.showToast('Please enter a valid rent amount', 'error'); return; }
    if (!start) { UI.showToast('Please select a start date', 'error'); return; }

    const newRentalId = uid();
    state.rentals.push({
      id: newRentalId,
      customerId,
      itemId,
      rentAmount: amount,
      billingCycle: cycle,
      customDays: cycle === 'custom' ? customDays : null,
      startDate: start,
      endDate: null,
      status: 'active',
      createdAt: today()
    });

    const item = getItem(itemId);
    if (item) item.status = 'rented';

    let totalCollected = 0;
    if (advanceAmount > 0) {
      state.payments.push({
        id: uid(),
        rentalId: newRentalId,
        amount: advanceAmount,
        date: start,
        method: payMethod,
        paidTo: paidTo,
        remarks: 'Advance Rent on Handover',
        createdAt: today()
      });
      totalCollected += advanceAmount;
    }

    if (depositAmount > 0) {
      state.payments.push({
        id: uid(),
        rentalId: newRentalId,
        amount: depositAmount,
        date: start,
        method: payMethod,
        paidTo: paidTo,
        remarks: 'Security Deposit (Refundable)',
        createdAt: today()
      });
      totalCollected += depositAmount;
    }

    Data.save();
    UI.hideModal();
    if (totalCollected > 0) {
      UI.showToast(`Rental started! ${fmtCurrency(totalCollected)} received by ${paidTo}`, 'success');
    } else {
      UI.showToast('Rental activated successfully', 'success');
    }
    UI.renderAll();
  },

  showEditRentalModal(rentalId) {
    const r = getRental(rentalId);
    if (!r) return;
    const cycle = r.billingCycle;
    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>Edit Rental Terms</h2>
      <div class="form-row">
        <div class="form-group">
          <label>Rent Amount (₹)</label>
          <input type="number" id="rentalAmount" value="${r.rentAmount}" min="0" step="1">
        </div>
        <div class="form-group">
          <label>Billing Cycle</label>
          <select id="rentalCycle" onchange="document.getElementById('customDaysGroup').style.display=this.value==='custom'?'block':'none'">
            <option value="monthly" ${cycle==='monthly'?'selected':''}>Monthly (30 Days)</option>
            <option value="weekly" ${cycle==='weekly'?'selected':''}>Weekly (7 Days)</option>
            <option value="custom" ${cycle==='custom'?'selected':''}>Custom Days</option>
          </select>
        </div>
      </div>
      <div class="form-group" id="customDaysGroup" style="display:${cycle==='custom'?'block':'none'}">
        <label>Custom Days</label>
        <input type="number" id="rentalCustomDays" value="${r.customDays || ''}">
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.updateRental('${rentalId}')">Save Changes</button>
      </div>`);
  },

  updateRental(rentalId) {
    const r = getRental(rentalId);
    if (!r) return;
    const amount = parseFloat(document.getElementById('rentalAmount').value);
    const cycle = document.getElementById('rentalCycle').value;
    const customDays = parseInt(document.getElementById('rentalCustomDays').value) || 0;
    if (!amount || amount <= 0) { UI.showToast('Please enter a valid rent amount', 'error'); return; }
    r.rentAmount = amount;
    r.billingCycle = cycle;
    r.customDays = cycle === 'custom' ? customDays : null;
    Data.save();
    UI.hideModal();
    UI.showToast('Rental updated', 'success');
    UI.renderAll();
  },

  showCloseRentalModal(rentalId) {
    const r = getRental(rentalId);
    if (!r) return;
    const item = getItem(r.itemId);
    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>Close Rental</h2>
      <p style="margin-bottom:12px;color:var(--text-muted)">Closing this rental will mark <strong>${escHtml(getItemFullTitle(item))}</strong> as Available in inventory.</p>
      <div class="form-group">
        <label>Return / End Date *</label>
        <input type="date" id="closeEndDate" value="${today()}">
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-danger" onclick="UI.closeRental('${rentalId}')">Confirm Return</button>
      </div>`);
  },

  closeRental(rentalId) {
    const r = getRental(rentalId);
    if (!r) return;
    const endDate = document.getElementById('closeEndDate').value;
    if (!endDate) { UI.showToast('Please select return date', 'error'); return; }
    r.status = 'closed';
    r.endDate = endDate;
    const item = getItem(r.itemId);
    if (item) item.status = 'available';
    Data.save();
    UI.hideModal();
    UI.showToast('Rental closed — device returned to inventory', 'success');
    UI.renderAll();
  },

  /* MODALS: PAYMENTS */
  showLogPaymentModal(customerId, preSelectedRentalId) {
    const c = getCustomer(customerId);
    const activeRentals = customerActiveRentals(customerId);
    if (activeRentals.length === 0) {
      UI.showToast('No active rentals for this customer', 'error');
      return;
    }
    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>Log Rental Payment</h2>
      <div class="form-group">
        <label>Customer</label>
        <input type="text" value="${escHtml(c ? c.name + ' (' + fmtPhone(c.phone) + ')' : '')}" disabled style="background:var(--surface-raised);color:var(--text-muted);border-color:var(--border)">
      </div>
      <div class="form-group">
        <label>Rental *</label>
        <select id="payRental">
          ${activeRentals.map(r => {
            const item = getItem(r.itemId);
            return `<option value="${r.id}" ${preSelectedRentalId === r.id ? 'selected' : ''}>${escHtml(getItemFullTitle(item))} — ₹${r.rentAmount}/${r.billingCycle}</option>`;
          }).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Amount (₹) *</label>
          <input type="number" id="payAmount" placeholder="e.g. 1500" min="0" step="1">
        </div>
        <div class="form-group">
          <label>Payment Date *</label>
          <input type="date" id="payDate" value="${today()}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Paid To (Received By) *</label>
          <select id="payPaidTo">
            ${PAYMENT_COLLECTORS.map(name => `<option value="${name}">${name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select id="payMethod">
            <option value="GPay / UPI" selected>GPay / UPI</option>
            <option value="Cash">Cash</option>
            <option value="PhonePe">PhonePe</option>
            <option value="Bank Transfer">Bank Transfer / NEFT</option>
            <option value="Card">Card</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Remarks / Notes (optional)</label>
        <input type="text" id="payRemarks" placeholder="e.g. For month of August">
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.savePayment('${customerId}')">Record Payment</button>
      </div>`);
    setTimeout(() => document.getElementById('payAmount').focus(), 300);
  },

  savePayment(customerId) {
    const rentalId = document.getElementById('payRental').value;
    const amount = parseFloat(document.getElementById('payAmount').value);
    const date = document.getElementById('payDate').value;
    const paidTo = document.getElementById('payPaidTo').value || PAYMENT_COLLECTORS[0];
    const method = document.getElementById('payMethod').value.trim();
    const remarks = document.getElementById('payRemarks').value.trim();

    if (!rentalId) { UI.showToast('Please select a rental', 'error'); return; }
    if (!amount || amount <= 0) { UI.showToast('Please enter a valid payment amount', 'error'); return; }
    if (!date) { UI.showToast('Please select payment date', 'error'); return; }

    state.payments.push({
      id: uid(),
      rentalId,
      amount,
      date,
      paidTo,
      method,
      remarks,
      createdAt: today()
    });

    Data.save();
    UI.hideModal();
    UI.showToast(`Payment of ${fmtCurrency(amount)} recorded (Received by ${paidTo})!`, 'success');
    UI.renderAll();
  },

  showEditPaymentModal(paymentId) {
    const p = state.payments.find(x => x.id === paymentId);
    if (!p) return;
    const r = getRental(p.rentalId);
    const c = r ? getCustomer(r.customerId) : null;
    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>Edit Payment Record</h2>
      <div class="form-group">
        <label>Customer</label>
        <input type="text" value="${escHtml(c ? c.name : '')}" disabled style="background:var(--surface-raised);color:var(--text-muted);border-color:var(--border)">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Amount (₹) *</label>
          <input type="number" id="editPayAmount" value="${p.amount}" min="0" step="1">
        </div>
        <div class="form-group">
          <label>Date *</label>
          <input type="date" id="editPayDate" value="${p.date}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Paid To (Received By) *</label>
          <select id="editPayPaidTo">
            ${PAYMENT_COLLECTORS.map(name => `<option value="${name}" ${p.paidTo === name ? 'selected' : ''}>${name}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Payment Method</label>
          <select id="editPayMethod">
            <option value="GPay / UPI" ${p.method==='GPay / UPI'?'selected':''}>GPay / UPI</option>
            <option value="Cash" ${p.method==='Cash'?'selected':''}>Cash</option>
            <option value="PhonePe" ${p.method==='PhonePe'?'selected':''}>PhonePe</option>
            <option value="Bank Transfer" ${p.method==='Bank Transfer'?'selected':''}>Bank Transfer / NEFT</option>
            <option value="Card" ${p.method==='Card'?'selected':''}>Card</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Remarks</label>
        <input type="text" id="editPayRemarks" value="${escHtml(p.remarks || '')}">
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-primary" onclick="UI.updatePayment('${paymentId}')">Update</button>
      </div>`);
  },

  updatePayment(paymentId) {
    const p = state.payments.find(x => x.id === paymentId);
    if (!p) return;
    const amount = parseFloat(document.getElementById('editPayAmount').value);
    const date = document.getElementById('editPayDate').value;
    const paidTo = document.getElementById('editPayPaidTo').value;
    const method = document.getElementById('editPayMethod').value.trim();
    const remarks = document.getElementById('editPayRemarks').value.trim();

    if (!amount || amount <= 0) { UI.showToast('Please enter valid amount', 'error'); return; }
    if (!date) { UI.showToast('Please select date', 'error'); return; }

    p.amount = amount;
    p.date = date;
    p.paidTo = paidTo;
    p.method = method;
    p.remarks = remarks;

    Data.save();
    UI.hideModal();
    UI.showToast('Payment record updated', 'success');
    UI.renderAll();
  },

  deletePayment(paymentId) {
    if (!Auth.isAdmin()) {
      UI.showToast('🔒 Permission Denied: Only Admin can delete payment records.', 'error');
      return;
    }
    UI.showConfirm('Permanently delete this payment record?', () => {
      state.payments = state.payments.filter(p => p.id !== paymentId);
      Data.save();
      UI.showToast('Payment deleted', 'info');
      UI.renderAll();
    });
  },

  toggleNotifications(enabled) {
    notifEnabled = enabled;
    try { localStorage.setItem('notifEnabled', enabled); } catch(e) {}
    if (enabled) {
      requestNotifPermission();
      checkAndNotifyDues();
    }
    UI.showToast(enabled ? 'Due notifications enabled' : 'Due notifications disabled', 'info');
  },

  toggleTheme(isLight) {
    const theme = isLight ? 'light' : 'dark';
    setTheme(theme);
    UI.showToast(theme === 'light' ? 'Light console enabled' : 'Dark graphite terminal enabled', 'info');
    UI.renderMore();
  },

  handleImport(input) {
    if (input.files && input.files[0]) {
      UI.showConfirm('Restoring will replace all current data with the backup file. Proceed?', () => {
        Data.importJSON(input.files[0]);
        input.value = '';
        UI.hideModal();
      });
    }
  }
};
window.UI = UI;
window.openWhatsAppReminder = openWhatsAppReminder;

/* EVENT BINDING */
document.addEventListener('DOMContentLoaded', async () => {
  Auth.restore();

  /* Login Handler */
  const loginBtn = document.getElementById('loginBtn');
  const loginPw = document.getElementById('loginPassword');

  if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
      const pw = loginPw.value;
      loginBtn.disabled = true;
      loginBtn.textContent = 'Checking...';
      const ok = await Auth.login(pw);
      loginBtn.disabled = false;
      loginBtn.textContent = 'Sign In';
      if (ok) {
        UI.showApp();
        await Data.load();
        setupApp();
      } else {
        document.getElementById('loginError').classList.remove('hidden');
      }
    });
  }

  if (loginPw) {
    loginPw.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loginBtn.click();
    });
  }

  if (Auth.isLoggedIn()) {
    UI.showApp();
    await Data.load();
    setupApp();
  } else {
    UI.showLogin();
  }
});

function setupApp() {
  /* Bottom Navigation */
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      pageStack = [{ page, params: null }];
      UI.navigate(page);
    });
  });

  /* Header Back */
  const headerBack = document.getElementById('headerBack');
  if (headerBack) headerBack.addEventListener('click', () => UI.goBack());

  /* Header Action */
  const headerAction = document.getElementById('headerAction');
  if (headerAction) {
    headerAction.addEventListener('click', () => {
      pageStack = [{ page: 'more', params: null }];
      UI.navigate('more');
    });
  }

  /* Floating Add Button */
  const fabAdd = document.getElementById('fabAdd');
  if (fabAdd) fabAdd.addEventListener('click', () => UI.showAddItemModal());

  /* Initial Navigation */
  pageStack = [{ page: 'dashboard', params: null }];
  UI.navigate('dashboard');

  /* Notifications */
  requestNotifPermission();
  checkAndNotifyDues();
  setInterval(checkAndNotifyDues, 300000);

  /* Multi-User Real-Time Cloud Sync */
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') Data.sync(true);
  });
  window.addEventListener('focus', () => Data.sync(true));
  setInterval(() => {
    if (document.visibilityState === 'visible') Data.sync(true);
  }, 20000);

  /* Desktop Global Keyboard Shortcuts */
  document.addEventListener('keydown', (e) => {
    // 1. Press '/' to focus global search
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) {
      const searchInput = document.getElementById('desktopGlobalSearch') || document.getElementById('customerSearch') || document.getElementById('inventorySearch');
      if (searchInput) {
        e.preventDefault();
        searchInput.focus();
        searchInput.select?.();
      }
    }
    // 2. Press 'Escape' to close modals or confirm dialogs
    if (e.key === 'Escape') {
      const modalOpen = !document.getElementById('modalOverlay')?.classList.contains('hidden');
      const confirmOpen = !document.getElementById('confirmOverlay')?.classList.contains('hidden');
      if (modalOpen) UI.hideModal();
      if (confirmOpen) UI.hideConfirm();
    }
  });
}
