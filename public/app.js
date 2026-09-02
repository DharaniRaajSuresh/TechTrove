/* STATE */
let state = { customers: [], items: [], rentals: [], payments: [] };
let currentPage = 'dashboard';
let pageStack = [];
let filterState = { inventory: 'all' };
let notifEnabled = true;
let lastNotifDate = '';
try { notifEnabled = localStorage.getItem('notifEnabled') !== 'false'; lastNotifDate = localStorage.getItem('lastNotifDate') || ''; } catch(e) {}

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
const parseDate = (s) => { if (!s) return new Date(NaN); const p = s.split('-'); return new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2])); };
const fmtDate = (s) => { if (!s) return '—'; const d = parseDate(s); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
const fmtCurrency = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
const isActiveRental = (r) => r.status === 'active';

/* Phone Helpers */
const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
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

/* NOTIFICATIONS */
function requestNotifPermission() {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'default') Notification.requestPermission();
}

function sendDueNotification(title, body) {
  if (!notifEnabled) return;
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  try { new Notification(title, { body, icon: '/icon.svg' }); } catch(e) {}
}

function checkAndNotifyDues() {
  if (!notifEnabled) return;
  const todayKey = today();
  if (lastNotifDate === todayKey) return;
  const overdue = getOverdueList();
  if (overdue.length > 0) {
    const names = overdue.slice(0, 3).map(x => x.customer.name).join(', ');
    const more = overdue.length > 3 ? ` and ${overdue.length - 3} more` : '';
    sendDueNotification('Payment Due Reminder — TechTrove', `${overdue.length} overdue rental(s): ${names}${more}`);
  }
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
  isLoggedIn() { return !!(localStorage.getItem('tt_token') || localStorage.getItem('tt_pass')); },
  async login(password) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (res.ok) {
        const data = await res.json();
        const token = data.token || 'admin-token';
        localStorage.setItem('tt_token', token);
        localStorage.setItem('tt_pass', password);
        this._token = token;
        return true;
      }
      const res2 = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res2.ok) return false;
      const data2 = await res2.json();
      const token2 = data2.token || 'admin-token';
      localStorage.setItem('tt_token', token2);
      localStorage.setItem('tt_pass', password);
      this._token = token2;
      return true;
    } catch(e) { return false; }
  },
  logout() {
    this._token = null;
    localStorage.removeItem('tt_token');
    localStorage.removeItem('tt_pass');
    UI.showLogin();
  },
  restore() {
    this._token = localStorage.getItem('tt_token') || localStorage.getItem('tt_pass');
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

/* DATA LAYER */
const Data = {
  _saving: false,
  _dirty: false,
  async _fetch(url, opts) {
    const res = await fetch(url, opts);
    if (res.status === 401) { Auth.logout(); throw new Error('Unauthorized'); }
    return res;
  },
  save() {
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
    }).catch(e => console.error('Save failed', e)).finally(() => {
      this._saving = false;
      if (this._dirty) this.save();
      else { checkAndNotifyDues(); UI.updateDueBanner(); }
    });
  },
  async load() {
    UI.showLoading(true);
    try {
      const res = await this._fetch('/api/data', { headers: Auth.header() });
      const d = await res.json();
      if (d && d.customers) {
        state.customers = d.customers || [];
        state.items = d.items || [];
        state.rentals = d.rentals || [];
        state.payments = d.payments || [];
      }
    } catch(e) {
      if (e.message !== 'Unauthorized') console.error('Server load failed', e);
    } finally {
      UI.showLoading(false);
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
      'dashboard': 'TechTrove Systems',
      'customers': 'Customers',
      'customer-detail': 'Customer Details',
      'inventory': 'Inventory & Specs',
      'search': 'Global Search',
      'more': 'Settings & Backup'
    };
    document.getElementById('headerTitle').textContent = titles[page] || 'TechTrove';

    if (page === 'dashboard') this.renderDashboard();
    else if (page === 'customers') this.renderCustomers();
    else if (page === 'customer-detail') this.renderCustomerDetail(params);
    else if (page === 'inventory') this.renderInventory();
    else if (page === 'search') this.renderSearch();
    else if (page === 'more') this.renderMore();

    this.updateDueBanner();
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
        banner.innerHTML = `<span class="due-alert-icon">⚠️</span> <span><strong>${overdue.length} Overdue Payment(s)</strong> — Tap to review & send reminders</span>`;
        banner.classList.remove('hidden');
      } else if (dueSoon.length > 0) {
        banner.className = 'due-alert-banner due-soon-banner';
        banner.innerHTML = `<span class="due-alert-icon">⏰</span> <span><strong>${dueSoon.length} Payment(s) Due Within 7 Days</strong></span>`;
        banner.classList.remove('hidden');
      } else {
        banner.classList.add('hidden');
      }
    }
  },

  renderAll() {
    this.navigate(currentPage, pageStack[pageStack.length - 1]?.params);
  },

  /* DASHBOARD */
  renderDashboard() {
    const activeRentals = state.rentals.filter(isActiveRental).length;
    const totalItems = state.items.length;
    const availableItems = state.items.filter(i => i.status === 'available').length;
    const repairItems = state.items.filter(i => i.status === 'repair').length;
    const overdueList = getOverdueList();
    const dueSoonList = getDueSoonList();

    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth();
    const monthlyCollected = state.payments
      .filter(p => {
        const d = parseDate(p.date);
        return d.getFullYear() === curYear && d.getMonth() === curMonth;
      })
      .reduce((s, p) => s + (p.amount || 0), 0);

    const outstandingTotal = state.rentals
      .filter(isActiveRental)
      .reduce((s, r) => s + rentalStatus(r).outstanding, 0);

    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

    let html = `
    <div class="dash-hero">
      <div class="dash-hero-top">
        <div>
          <div class="dash-greeting">Welcome to</div>
          <div class="dash-title">TechTrove Systems</div>
          <div class="dash-subtitle">Rental Tracker &amp; Inventory</div>
        </div>
        <div class="dash-hero-icon">
          <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
      </div>
    </div>

    <div class="dash-metrics">
      <div class="dash-metric"><div class="dash-metric-value" style="color:var(--primary)">${activeRentals}</div><div class="dash-metric-label">Active Rentals</div></div>
      <div class="dash-metric"><div class="dash-metric-value" style="color:var(--success)">${availableItems}</div><div class="dash-metric-label">Available</div></div>
      <div class="dash-metric"><div class="dash-metric-value" style="color:${repairItems > 0 ? 'var(--purple)' : 'var(--gray-800)'}">${repairItems}</div><div class="dash-metric-label">Under Repair</div></div>
    </div>

    <div class="card dash-fin-card">
      <div class="dash-fin-row">
        <div>
          <div class="dash-fin-label">Collected in ${monthNames[curMonth]}</div>
          <div class="dash-fin-value" style="color:var(--success)">${fmtCurrency(monthlyCollected)}</div>
        </div>
        <div class="dash-fin-divider"></div>
        <div>
          <div class="dash-fin-label">Total Outstanding</div>
          <div class="dash-fin-value" style="color:var(--danger)">${fmtCurrency(outstandingTotal)}</div>
        </div>
      </div>
    </div>

    <div class="dash-actions">
      <button class="dash-action" onclick="UI.showAddCustomerModal()">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        <span>Add Customer</span>
      </button>
      <button class="dash-action" onclick="UI.showAddItemModal()">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/></svg>
        <span>+ Add Laptop / PC</span>
      </button>
      <button class="dash-action" onclick="UI.pushPage('inventory')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
        <span>Inventory (${totalItems})</span>
      </button>
      <button class="dash-action" onclick="UI.pushPage('search')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Global Search</span>
      </button>
    </div>`;

    /* OVERDUE PAYMENTS SECTION */
    if (overdueList.length > 0) {
      html += `<div class="card" style="border-left:4px solid var(--danger)">
        <div class="card-header">
          <span class="card-title" style="color:var(--danger);font-weight:700">
            ⚠️ Overdue Payments <span class="badge badge-danger" style="margin-left:6px">${overdueList.length}</span>
          </span>
        </div>`;
      
      overdueList.forEach(({ rental, status, customer, item }) => {
        const itemTitle = getItemFullTitle(item);
        const waMsg = buildWaReminderMessage(customer, rental, item, status);
        html += `
        <div class="search-card-item" style="border-left:3px solid var(--danger)">
          <div class="due-card-header">
            <div>
              <div style="font-weight:700;font-size:.95rem;color:var(--gray-900)">${escHtml(customer.name)}</div>
              <div style="font-size:.82rem;margin-top:2px">
                <a href="tel:${escHtml(customer.phone)}" class="phone-link">📞 ${escHtml(fmtPhone(customer.phone))}</a>
                ${customer.address ? `<span class="loc-tag" style="margin-left:8px">📍 ${escHtml(customer.address)}</span>` : ''}
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;font-size:1rem;color:var(--danger)">${fmtCurrency(status.outstanding)}</div>
              <span class="badge badge-danger">${status.daysOverdue}d overdue</span>
            </div>
          </div>

          <div style="margin-top:6px;font-size:.82rem;color:var(--gray-700)">
            <strong>${escHtml(itemTitle)}</strong>
            ${item && item.specs ? `<div class="item-specs-chip">${escHtml(item.specs)}</div>` : ''}
            <div style="font-size:.78rem;color:var(--gray-500);margin-top:3px">
              Rent: ${fmtCurrency(rental.rentAmount)}/${rental.billingCycle} &middot; Due date: ${fmtDate(status.nextDueDate)}
            </div>
          </div>

          <div class="due-action-bar">
            <button class="btn btn-sm btn-whatsapp" onclick="openWhatsAppReminder('${customer.phone}', \`${waMsg.replace(/`/g, '\\`')}\`)">
              💬 WhatsApp Reminder
            </button>
            <a href="tel:${escHtml(customer.phone)}" class="btn btn-sm btn-call-outline" style="text-decoration:none">
              📞 Call
            </a>
            <button class="btn btn-sm btn-primary" onclick="UI.showLogPaymentModal('${customer.id}', '${rental.id}')">
              💳 Log Payment
            </button>
            <button class="btn btn-sm btn-outline" onclick="UI.pushPage('customer-detail', '${customer.id}')">
              Details
            </button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    /* DUE SOON SECTION */
    if (dueSoonList.length > 0) {
      html += `<div class="card" style="border-left:4px solid var(--warning)">
        <div class="card-header">
          <span class="card-title" style="color:var(--warning);font-weight:700">
            ⏰ Due Within 7 Days <span class="badge badge-warning" style="margin-left:6px">${dueSoonList.length}</span>
          </span>
        </div>`;
      
      dueSoonList.forEach(({ rental, status, customer, item }) => {
        const itemTitle = getItemFullTitle(item);
        const waMsg = buildWaReminderMessage(customer, rental, item, status);
        const dueText = status.daysUntilDue === 0 ? 'Due Today' : status.daysUntilDue === 1 ? 'Due Tomorrow' : `Due in ${status.daysUntilDue}d`;
        html += `
        <div class="search-card-item" style="border-left:3px solid var(--warning)">
          <div class="due-card-header">
            <div>
              <div style="font-weight:700;font-size:.95rem;color:var(--gray-900)">${escHtml(customer.name)}</div>
              <div style="font-size:.82rem;margin-top:2px">
                <a href="tel:${escHtml(customer.phone)}" class="phone-link">📞 ${escHtml(fmtPhone(customer.phone))}</a>
                ${customer.address ? `<span class="loc-tag" style="margin-left:8px">📍 ${escHtml(customer.address)}</span>` : ''}
              </div>
            </div>
            <div style="text-align:right">
              <div style="font-weight:700;font-size:1rem;color:var(--warning)">${fmtCurrency(rental.rentAmount)}</div>
              <span class="badge badge-warning">${dueText}</span>
            </div>
          </div>

          <div style="margin-top:6px;font-size:.82rem;color:var(--gray-700)">
            <strong>${escHtml(itemTitle)}</strong>
            ${item && item.specs ? `<div class="item-specs-chip">${escHtml(item.specs)}</div>` : ''}
            <div style="font-size:.78rem;color:var(--gray-500);margin-top:3px">
              Due Date: ${fmtDate(status.nextDueDate)}
            </div>
          </div>

          <div class="due-action-bar">
            <button class="btn btn-sm btn-whatsapp-outline" onclick="openWhatsAppReminder('${customer.phone}', \`${waMsg.replace(/`/g, '\\`')}\`)">
              💬 Send Reminder
            </button>
            <a href="tel:${escHtml(customer.phone)}" class="btn btn-sm btn-call-outline" style="text-decoration:none">
              📞 Call
            </a>
            <button class="btn btn-sm btn-primary" onclick="UI.showLogPaymentModal('${customer.id}', '${rental.id}')">
              💳 Log Payment
            </button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    if (overdueList.length === 0 && dueSoonList.length === 0) {
      html += `<div class="card dash-all-clear">
        <div class="dash-clear-icon">&#10003;</div>
        <div class="dash-clear-text">All payments up to date!</div>
        <div class="dash-clear-sub">No overdue or pending rental payments at this moment.</div>
      </div>`;
    }

    document.getElementById('page-dashboard').innerHTML = html;
  },

  /* CUSTOMERS */
  renderCustomers(query) {
    let list = state.customers;
    if (query) {
      const q = query.toLowerCase().trim();
      list = list.filter(c => c.name.toLowerCase().includes(q) || cleanPhone(c.phone).includes(cleanPhone(q)) || (c.address && c.address.toLowerCase().includes(q)));
    }
    list.sort((a, b) => a.name.localeCompare(b.name));

    let html = `
    <div class="search-bar">
      <input type="search" id="customerSearch" placeholder="Search by name, phone, or location..." value="${escHtml(query || '')}" oninput="UI.renderCustomers(this.value)">
      <button onclick="UI.showAddCustomerModal()">+ Add</button>
    </div>`;

    if (list.length === 0) {
      html += `<div class="empty-state"><div class="empty-icon">&#128100;</div><p>${query ? 'No matching customers found' : 'No customers registered yet. Tap "+ Add" to create your first customer.'}</p></div>`;
    } else {
      html += `<div class="card">`;
      list.forEach(c => {
        const active = customerActiveRentals(c.id);
        const allRentals = customerAllRentals(c.id);
        let statusBadge = '';
        if (active.length > 0) {
          const hasOverdue = active.some(r => rentalStatus(r).isOverdue);
          statusBadge = hasOverdue 
            ? `<span class="badge badge-danger">${active.length} active (Overdue)</span>` 
            : `<span class="badge badge-success">${active.length} active</span>`;
        } else if (allRentals.length > 0) {
          statusBadge = `<span class="badge badge-gray">Closed</span>`;
        } else {
          statusBadge = `<span class="badge badge-gray">No rentals</span>`;
        }

        html += `
        <div class="list-item" onclick="UI.pushPage('customer-detail', '${c.id}')">
          <div class="item-info">
            <div class="item-name">${escHtml(c.name)}</div>
            <div class="item-sub">
              📞 ${escHtml(fmtPhone(c.phone))}
              ${c.address ? ` &middot; 📍 ${escHtml(c.address)}` : ''}
            </div>
          </div>
          <div class="item-right">
            ${statusBadge}
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    document.getElementById('page-customers').innerHTML = html;
  },

  /* CUSTOMER DETAIL */
  renderCustomerDetail(customerId) {
    const c = getCustomer(customerId);
    if (!c) { UI.showToast('Customer not found', 'error'); UI.goBack(); return; }

    const rentals = customerAllRentals(customerId);
    const allPayments = customerPayments(customerId);
    const activeRentals = rentals.filter(isActiveRental);

    let html = `
    <div class="detail-header card" style="text-align:left;padding:16px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h2>${escHtml(c.name)}</h2>
          <div style="margin-top:4px">
            <a href="tel:${escHtml(c.phone)}" class="detail-phone">📞 ${escHtml(fmtPhone(c.phone))}</a>
            <button class="btn btn-sm btn-whatsapp" style="margin-left:8px;padding:4px 8px;min-height:28px" onclick="openWhatsAppReminder('${c.phone}', 'Hello ${c.name}, from TechTrove Systems.')">
              💬 WhatsApp
            </button>
          </div>
          ${c.address ? `<div class="detail-address" style="margin-top:6px">📍 ${escHtml(c.address)}</div>` : ''}
        </div>
      </div>
      <div style="margin-top:14px;display:flex;gap:6px;flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" onclick="UI.showNewRentalModal('${c.id}')">+ New Rental</button>
        <button class="btn btn-sm btn-outline-primary" onclick="UI.showEditCustomerModal('${c.id}')">Edit Customer</button>
        ${activeRentals.length > 0 ? `<button class="btn btn-sm btn-success" onclick="UI.showLogPaymentModal('${c.id}')">Log Payment</button>` : ''}
        <button class="btn btn-sm btn-outline" onclick="UI.deleteCustomer('${c.id}')" style="color:var(--danger);border-color:var(--danger)">Delete</button>
      </div>
    </div>`;

    /* Active Rentals */
    if (activeRentals.length > 0) {
      html += `<div class="detail-section"><h3>Active Rentals (${activeRentals.length})</h3>`;
      activeRentals.forEach(r => {
        const st = rentalStatus(r);
        const item = getItem(r.itemId);
        const itemTitle = getItemFullTitle(item);
        const waMsg = buildWaReminderMessage(c, r, item, st);
        let statusClass = st.isOverdue ? 'overdue' : st.isDueSoon ? 'due-soon' : 'current';

        html += `
        <div class="rental-card ${statusClass}">
          <div class="rental-row">
            <span class="rental-label">Device</span>
            <span class="rental-value">${escHtml(itemTitle)} <span class="badge badge-primary">${item ? item.type : 'Device'}</span></span>
          </div>
          ${item && item.specs ? `<div style="margin:4px 0"><span class="item-specs-chip">${escHtml(item.specs)}</span></div>` : ''}
          ${item && item.serial ? `<div class="rental-row"><span class="rental-label">Serial / Asset</span><span class="rental-value">${escHtml(item.serial)}</span></div>` : ''}
          <div class="rental-row">
            <span class="rental-label">Rent Amount</span>
            <span class="rental-value">${fmtCurrency(r.rentAmount)} / ${r.billingCycle}${r.billingCycle === 'custom' ? ` (${r.customDays}d)` : ''}</span>
          </div>
          <div class="rental-row">
            <span class="rental-label">${st.isOverdue ? 'Overdue Since' : 'Next Due Date'}</span>
            <span class="rental-value">
              ${st.isOverdue 
                ? `<span style="color:var(--danger)">${fmtDate(st.nextDueDate)}</span> <span class="badge badge-danger">${st.daysOverdue}d overdue</span>` 
                : st.isDueSoon 
                ? `${fmtDate(st.nextDueDate)} <span class="badge badge-warning">${st.daysUntilDue === 0 ? 'Due today' : `In ${st.daysUntilDue}d`}</span>` 
                : fmtDate(st.nextDueDate)}
            </span>
          </div>
          <div class="rental-row">
            <span class="rental-label">Outstanding</span>
            <span class="rental-value" style="color:${st.outstanding > 0 ? 'var(--danger)' : 'var(--success)'}">
              ${fmtCurrency(st.outstanding)}
            </span>
          </div>
          <div class="rental-row">
            <span class="rental-label">Rental Started</span>
            <span class="rental-value" style="font-weight:400;font-size:.85rem">${fmtDate(r.startDate)}</span>
          </div>

          <div style="margin-top:10px;display:flex;gap:6px;flex-wrap:wrap">
            <button class="btn btn-sm btn-primary" onclick="UI.showLogPaymentModal('${c.id}','${r.id}')">💳 Log Payment</button>
            <button class="btn btn-sm btn-whatsapp-outline" onclick="openWhatsAppReminder('${c.phone}', \`${waMsg.replace(/`/g, '\\`')}\`)">💬 WhatsApp</button>
            <button class="btn btn-sm btn-outline" onclick="UI.showEditRentalModal('${r.id}')">Edit</button>
            <button class="btn btn-sm btn-outline" onclick="UI.showCloseRentalModal('${r.id}')" style="color:var(--danger)">Close Rental</button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    /* Past Rentals */
    const closedRentals = rentals.filter(r => !isActiveRental(r));
    if (closedRentals.length > 0) {
      html += `<div class="detail-section"><h3>Past Rentals</h3><div class="card">`;
      closedRentals.forEach(r => {
        const item = getItem(r.itemId);
        html += `
        <div class="list-item">
          <div class="item-info">
            <div class="item-name">${escHtml(getItemFullTitle(item))}</div>
            <div class="item-sub">${fmtDate(r.startDate)} — ${fmtDate(r.endDate)}</div>
          </div>
          <div class="item-right"><span class="badge badge-gray">Closed</span></div>
        </div>`;
      });
      html += `</div></div>`;
    }

    /* Payment History */
    html += `<div class="detail-section"><h3>Payment History (${allPayments.length})</h3>`;
    if (allPayments.length === 0) {
      html += `<div class="empty-state card" style="padding:20px"><p>No payments recorded yet.</p></div>`;
    } else {
      html += `<div class="card">`;
      allPayments.forEach(p => {
        const r = getRental(p.rentalId);
        const item = r ? getItem(r.itemId) : null;
        html += `
        <div class="payment-item">
          <div class="pay-amount">${fmtCurrency(p.amount)}</div>
          <div class="pay-info">
            <div class="pay-date">${fmtDate(p.date)}${item ? ' &middot; ' + escHtml(getItemFullTitle(item)) : ''}</div>
            <div class="pay-method">${escHtml(p.method || 'Cash / UPI')}${p.remarks ? ' &middot; ' + escHtml(p.remarks) : ''}</div>
          </div>
          <div class="pay-actions">
            <button onclick="UI.showEditPaymentModal('${p.id}')" title="Edit">&#9998;</button>
            <button onclick="UI.deletePayment('${p.id}')" title="Delete" style="color:var(--danger)">&#10005;</button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;

    document.getElementById('page-customer-detail').innerHTML = html;
  },

  /* INVENTORY */
  renderInventory(filter) {
    if (filter) filterState.inventory = filter;
    else filter = filterState.inventory;
    let list = state.items;
    if (filter && filter !== 'all') list = list.filter(i => i.status === filter);
    list.sort((a, b) => (a.brand || '').localeCompare(b.brand || ''));

    const availableCount = state.items.filter(i => i.status === 'available').length;
    const rentedCount = state.items.filter(i => i.status === 'rented').length;
    const repairCount = state.items.filter(i => i.status === 'repair').length;

    let html = `
    <div class="filter-bar">
      <button class="filter-btn ${filter === 'all' ? 'active' : ''}" onclick="UI.renderInventory('all')">All (${state.items.length})</button>
      <button class="filter-btn ${filter === 'available' ? 'active' : ''}" onclick="UI.renderInventory('available')">Available (${availableCount})</button>
      <button class="filter-btn ${filter === 'rented' ? 'active' : ''}" onclick="UI.renderInventory('rented')">Rented (${rentedCount})</button>
      <button class="filter-btn ${filter === 'repair' ? 'active' : ''}" onclick="UI.renderInventory('repair')" style="${repairCount > 0 ? 'color:var(--purple);border-color:var(--purple)' : ''}">Under Repair (${repairCount})</button>
    </div>`;

    if (list.length === 0) {
      html += `<div class="empty-state"><div class="empty-icon">&#128187;</div><p>${filter === 'all' ? 'No laptops or computers added yet. Tap "+ Add Laptop / PC" below!' : filter === 'repair' ? 'No machines currently under repair.' : 'No items found matching this filter.'}</p><button class="btn btn-primary btn-sm" style="margin-top:12px" onclick="UI.showAddItemModal()">+ Add Laptop / PC</button></div>`;
    } else {
      html += `<div class="card">`;
      list.forEach(i => {
        const rental = getActiveRentalForItem(i.id);
        const customer = rental ? getCustomer(rental.customerId) : null;
        const statusBadge = i.status === 'available' ? 'badge-success' : i.status === 'rented' ? 'badge-primary' : 'badge-purple';
        const statusLabel = i.status === 'available' ? 'Available' : i.status === 'rented' ? 'Rented' : 'Under Repair';
        const itemTitle = getItemFullTitle(i);

        let rentalInfoHtml = '';
        if (rental && customer) {
          const st = rentalStatus(rental);
          const waMsg = buildWaReminderMessage(customer, rental, i, st);
          rentalInfoHtml = `
          <div class="item-assigned-box">
            <div class="item-assigned-header">
              <span class="item-assigned-user">👤 ${escHtml(customer.name)}</span>
              <span class="badge ${st.isOverdue ? 'badge-danger' : st.isDueSoon ? 'badge-warning' : 'badge-success'}">
                ${st.isOverdue ? `${st.daysOverdue}d Overdue` : `Due ${fmtDate(st.nextDueDate)}`}
              </span>
            </div>
            <div class="item-assigned-meta">
              <a href="tel:${escHtml(customer.phone)}" class="phone-link">📞 ${escHtml(fmtPhone(customer.phone))}</a>
              ${customer.address ? `<span class="loc-tag">📍 ${escHtml(customer.address)}</span>` : ''}
              <span>Rent: ${fmtCurrency(rental.rentAmount)}/${rental.billingCycle}</span>
            </div>
            <div style="margin-top:6px;display:flex;gap:6px">
              <button class="btn btn-sm btn-whatsapp-outline" style="padding:2px 8px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();openWhatsAppReminder('${customer.phone}', \`${waMsg.replace(/`/g, '\\`')}\`)">💬 WhatsApp</button>
              <button class="btn btn-sm btn-primary" style="padding:2px 8px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();UI.showLogPaymentModal('${customer.id}', '${rental.id}')">💳 Payment</button>
              <button class="btn btn-sm btn-outline" style="padding:2px 8px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();UI.pushPage('customer-detail', '${customer.id}')">View Client</button>
            </div>
          </div>`;
        }

        /* UNDER REPAIR INFO BOX */
        let repairInfoHtml = '';
        if (i.status === 'repair' && i.repairInfo) {
          const rep = i.repairInfo;
          const daysAtService = rep.givenToServiceDate ? Math.max(0, daysBetween(rep.givenToServiceDate, today())) : 0;
          repairInfoHtml = `
          <div class="item-repair-box">
            <div class="item-repair-header">
              <span class="item-repair-title">🛠️ Service Center: ${escHtml(rep.serviceCenter || 'Under Repair')}</span>
              <span class="badge badge-purple">${daysAtService}d at service</span>
            </div>
            <div class="item-repair-meta">
              ${rep.servicePerson || rep.servicePhone ? `
                <div class="repair-detail-row">
                  <span><strong>Technician:</strong> ${escHtml(rep.servicePerson || 'Service Tech')}</span>
                  ${rep.servicePhone ? `<a href="tel:${escHtml(rep.servicePhone)}" class="phone-link" onclick="event.stopPropagation()">📞 ${escHtml(fmtPhone(rep.servicePhone))}</a>` : ''}
                </div>` : ''}
              ${rep.givenToServiceDate ? `<div class="repair-detail-row"><span><strong>Handover Date:</strong> ${fmtDate(rep.givenToServiceDate)}</span>${rep.expectedReturnDate ? `<span><strong>Return Est:</strong> ${fmtDate(rep.expectedReturnDate)}</span>` : ''}</div>` : ''}
              ${rep.collectedFromCustomerDate ? `<div class="repair-detail-row"><span><strong>Collected from customer:</strong> ${fmtDate(rep.collectedFromCustomerDate)}</span></div>` : ''}
              ${rep.repairIssue ? `<div style="margin-top:2px"><span class="repair-issue-tag">Issue: ${escHtml(rep.repairIssue)}</span></div>` : ''}
              ${rep.repairCost ? `<div style="font-weight:600;color:var(--gray-800);margin-top:2px">Est. Cost: ${fmtCurrency(rep.repairCost)}</div>` : ''}
            </div>
            <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap">
              ${rep.servicePhone ? `<button class="btn btn-sm btn-whatsapp-outline" style="padding:3px 8px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();openWhatsAppTech('${rep.servicePhone}', '${escHtml(itemTitle)}', '${escHtml(i.serial)}', '${escHtml(rep.servicePerson)}')">💬 WhatsApp Tech</button>` : ''}
              ${rep.servicePhone ? `<a href="tel:${escHtml(rep.servicePhone)}" class="btn btn-sm btn-call-outline" style="padding:3px 8px;min-height:26px;font-size:.75rem;text-decoration:none" onclick="event.stopPropagation()">📞 Call</a>` : ''}
              <button class="btn btn-sm btn-success" style="padding:3px 10px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();UI.markItemRepaired('${i.id}')">✅ Mark Repaired</button>
            </div>
          </div>`;
        }

        html += `
        <div class="list-item" style="flex-direction:column;align-items:stretch" onclick="UI.showEditItemModal('${i.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div class="item-name">${escHtml(itemTitle)} <span class="badge badge-gray" style="font-size:.65rem">${escHtml(i.type || 'Laptop')}</span></div>
              <div class="item-sub">SN: <strong>${escHtml(i.serial)}</strong></div>
              ${i.specs ? `<div class="item-specs-chip">${escHtml(i.specs)}</div>` : ''}
            </div>
            <div class="item-right">
              <span class="badge ${statusBadge}">${statusLabel}</span>
            </div>
          </div>
          ${rentalInfoHtml}
          ${repairInfoHtml}
        </div>`;
      });
      html += `</div>`;
    }

    document.getElementById('page-inventory').innerHTML = html;
  },

  /* GLOBAL SEARCH */
  renderSearch() {
    let html = `
    <div class="search-bar">
      <input type="search" id="globalSearchInput" placeholder="Search customer, phone, laptop model, specs, repair, SN..." oninput="UI.doSearch(this.value)">
      <button onclick="document.getElementById('globalSearchInput').value='';UI.doSearch('')">Clear</button>
    </div>
    <div id="searchResults">
      <div class="empty-state"><p>Search by customer name, phone number, location, laptop model, specs, technician, service center, or serial number.</p></div>
    </div>`;
    document.getElementById('page-search').innerHTML = html;
    setTimeout(() => {
      const input = document.getElementById('globalSearchInput');
      if (input) input.focus();
    }, 200);
  },

  doSearch(query) {
    const el = document.getElementById('searchResults');
    if (!query || query.trim().length < 1) {
      el.innerHTML = '<div class="empty-state"><p>Search by customer name, phone number, location, laptop model, specs, technician, service center, or serial number.</p></div>';
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
      el.innerHTML = `<div class="empty-state"><p>No results found matching "<strong>${escHtml(query)}</strong>"</p></div>`;
      return;
    }

    let html = '';

    /* RENDER MATCHED INVENTORY DEVICES */
    if (matchedItems.length > 0) {
      html += `<div class="search-group-title">💻 Laptops &amp; Equipment Found (${matchedItems.length})</div>`;
      matchedItems.forEach(i => {
        const itemTitle = getItemFullTitle(i);
        const rental = getActiveRentalForItem(i.id);
        const customer = rental ? getCustomer(rental.customerId) : null;
        const statusBadge = i.status === 'available' ? 'badge-success' : i.status === 'rented' ? 'badge-primary' : 'badge-purple';
        const statusLabel = i.status === 'available' ? 'Available' : i.status === 'rented' ? 'Rented' : 'Under Repair';

        let assignedHtml = '';
        if (rental && customer) {
          const st = rentalStatus(rental);
          const waMsg = buildWaReminderMessage(customer, rental, i, st);
          assignedHtml = `
          <div class="item-assigned-box">
            <div class="item-assigned-header">
              <span class="item-assigned-user">👤 Currently with: <strong>${escHtml(customer.name)}</strong></span>
              <span class="badge ${st.isOverdue ? 'badge-danger' : 'badge-success'}">${st.isOverdue ? `${st.daysOverdue}d Overdue` : `Due: ${fmtDate(st.nextDueDate)}`}</span>
            </div>
            <div class="item-assigned-meta">
              <a href="tel:${escHtml(customer.phone)}" class="phone-link">📞 ${escHtml(fmtPhone(customer.phone))}</a>
              ${customer.address ? `<span>📍 ${escHtml(customer.address)}</span>` : ''}
              <span>₹${rental.rentAmount}/${rental.billingCycle}</span>
            </div>
            <div style="margin-top:6px;display:flex;gap:6px">
              <button class="btn btn-sm btn-whatsapp-outline" style="padding:2px 8px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();openWhatsAppReminder('${customer.phone}', \`${waMsg.replace(/`/g, '\\`')}\`)">💬 WhatsApp</button>
              <button class="btn btn-sm btn-primary" style="padding:2px 8px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();UI.showLogPaymentModal('${customer.id}', '${rental.id}')">💳 Log Payment</button>
              <button class="btn btn-sm btn-outline" style="padding:2px 8px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();UI.pushPage('customer-detail', '${customer.id}')">View Customer</button>
            </div>
          </div>`;
        }

        let repairHtml = '';
        if (i.status === 'repair' && i.repairInfo) {
          const rep = i.repairInfo;
          repairHtml = `
          <div class="item-repair-box">
            <div class="item-repair-header">
              <span class="item-repair-title">🛠️ Service: ${escHtml(rep.serviceCenter || 'Under Repair')}</span>
              <span class="badge badge-purple">Under Repair</span>
            </div>
            <div class="item-repair-meta">
              ${rep.servicePerson ? `<div>Technician: <strong>${escHtml(rep.servicePerson)}</strong> &middot; ${rep.servicePhone ? `📞 ${escHtml(fmtPhone(rep.servicePhone))}` : ''}</div>` : ''}
              ${rep.repairIssue ? `<div><span class="repair-issue-tag">Issue: ${escHtml(rep.repairIssue)}</span></div>` : ''}
            </div>
          </div>`;
        }

        html += `
        <div class="search-card-item" onclick="UI.showEditItemModal('${i.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-weight:700;font-size:.95rem">${escHtml(itemTitle)} <span class="badge badge-gray" style="font-size:.65rem">${escHtml(i.type)}</span></div>
              <div style="font-size:.8rem;color:var(--gray-500);margin-top:1px">Serial: <strong>${escHtml(i.serial)}</strong></div>
              ${i.specs ? `<div class="item-specs-chip">${escHtml(i.specs)}</div>` : ''}
            </div>
            <div>
              <span class="badge ${statusBadge}">${statusLabel}</span>
            </div>
          </div>
          ${assignedHtml}
          ${repairHtml}
        </div>`;
      });
    }

    /* RENDER MATCHED CUSTOMERS */
    if (matchedCustomers.length > 0) {
      html += `<div class="search-group-title">👤 Customers Found (${matchedCustomers.length})</div>`;
      matchedCustomers.forEach(c => {
        const active = customerActiveRentals(c.id);
        const activeItemNames = active.map(r => {
          const item = getItem(r.itemId);
          return item ? getItemFullTitle(item) : 'Device';
        }).join(', ');

        html += `
        <div class="search-card-item" onclick="UI.pushPage('customer-detail', '${c.id}')">
          <div style="display:flex;justify-content:space-between;align-items:flex-start">
            <div>
              <div style="font-weight:700;font-size:.95rem">${escHtml(c.name)}</div>
              <div style="font-size:.82rem;margin-top:2px">
                <a href="tel:${escHtml(c.phone)}" class="phone-link" onclick="event.stopPropagation()">📞 ${escHtml(fmtPhone(c.phone))}</a>
                ${c.address ? `<span class="loc-tag" style="margin-left:6px">📍 ${escHtml(c.address)}</span>` : ''}
              </div>
              <div style="font-size:.78rem;color:var(--gray-600);margin-top:4px">
                ${active.length > 0 ? `<strong>Renting:</strong> ${escHtml(activeItemNames)}` : '<em>No active rentals</em>'}
              </div>
            </div>
            <div style="text-align:right">
              <span class="badge ${active.length > 0 ? 'badge-success' : 'badge-gray'}">${active.length} Active</span>
            </div>
          </div>
          <div style="margin-top:8px;display:flex;gap:6px">
            <button class="btn btn-sm btn-whatsapp-outline" style="padding:2px 8px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();openWhatsAppReminder('${c.phone}', 'Hello ${c.name}, from TechTrove Systems.')">💬 WhatsApp</button>
            <a href="tel:${escHtml(c.phone)}" class="btn btn-sm btn-call-outline" style="padding:2px 8px;min-height:26px;font-size:.75rem;text-decoration:none" onclick="event.stopPropagation()">📞 Call</a>
            ${active.length > 0 ? `<button class="btn btn-sm btn-primary" style="padding:2px 8px;min-height:26px;font-size:.75rem" onclick="event.stopPropagation();UI.showLogPaymentModal('${c.id}')">💳 Payment</button>` : ''}
          </div>
        </div>`;
      });
    }

    el.innerHTML = html;
  },

  /* SETTINGS & BACKUP */
  renderMore() {
    const html = `
    <div class="card" style="margin-top:4px">
      <div class="detail-header" style="padding:8px 0 12px">
        <h2 style="font-size:1.1rem;color:var(--gray-800)">TechTrove Systems</h2>
        <div style="font-size:.8rem;color:var(--gray-500);margin-top:2px">Rental &amp; Inventory Management</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px">
        <div class="stat-card"><div class="stat-value" style="font-size:1.3rem">${state.customers.length}</div><div class="stat-label">Customers</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1.3rem">${state.items.length}</div><div class="stat-label">Inventory Laps</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1.3rem">${state.rentals.filter(isActiveRental).length}</div><div class="stat-label">Active Rentals</div></div>
        <div class="stat-card"><div class="stat-value" style="font-size:1.3rem">${state.payments.length}</div><div class="stat-label">Payments Logged</div></div>
      </div>
    </div>

    <div class="card">
      <div class="section-header"><h3>Automated Reminders</h3></div>
      <div class="toggle-row">
        <label>Payment Due Notifications</label>
        <label class="toggle-switch">
          <input type="checkbox" id="moreNotifToggle" ${notifEnabled ? 'checked' : ''} onchange="UI.toggleNotifications(this.checked)">
          <span class="toggle-slider"></span>
        </label>
      </div>
      <div style="font-size:.8rem;color:var(--gray-500)">Alerts for overdue and upcoming due payments when opening app.</div>
    </div>

    <div class="card">
      <div class="section-header"><h3>Backup &amp; Restore</h3></div>
      <p style="font-size:.8rem;color:var(--gray-500);margin-bottom:10px">Save a safe copy of your customers, inventory specs, and payment history.</p>
      <button class="btn btn-outline btn-block btn-sm" onclick="Data.exportJSON()" style="margin-bottom:12px">
        📥 Export Backup (JSON)
      </button>
      <div class="form-group" style="margin-bottom:0">
        <label style="font-size:.8rem;color:var(--gray-500)">Restore data from backup file:</label>
        <input type="file" id="moreImportFile" accept=".json" style="font-size:.85rem" onchange="UI.handleImport(this)">
      </div>
    </div>

    <div class="card">
      <button class="btn btn-outline btn-block btn-sm" onclick="UI.checkForUpdates()" style="color:var(--primary);border-color:var(--primary);margin-bottom:10px">
        🔄 Check for Updates &amp; Reload Latest Version
      </button>
      <button class="btn btn-outline btn-block btn-sm" onclick="Auth.logout()" style="color:var(--danger);border-color:var(--danger)">
        🔒 Sign Out &amp; Lock App
      </button>
    </div>
    <div style="text-align:center;padding:16px;font-size:.75rem;color:var(--gray-400)">TechTrove Systems &middot; Version 3.0</div>`;
    document.getElementById('page-more').innerHTML = html;
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
        <label>Phone Number * (Primary Unique Identifier)</label>
        <input type="tel" id="custPhone" placeholder="10-digit mobile number, e.g. 9876543210">
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
        <label>Phone Number * (Unique)</label>
        <input type="tel" id="custPhone" value="${escHtml(c.phone)}">
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
    if (phoneDigits.length < 10) {
      UI.showToast('Please enter a valid 10-digit phone number', 'error');
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
        c.phone = phoneRaw;
        c.address = address;
      }
    } else {
      state.customers.push({
        id: uid(),
        name,
        phone: phoneRaw,
        address,
        createdAt: today()
      });
    }

    Data.save();
    UI.hideModal();
    UI.showToast(id ? 'Customer updated' : 'Customer added successfully', 'success');
    UI.renderAll();
  },

  deleteCustomer(customerId) {
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
      html += `<div style="padding:12px;text-align:center;color:var(--gray-500);font-size:.82rem">No preset models matching "<strong>${escHtml(query)}</strong>"</div>`;
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
        <div style="font-weight:700;color:var(--primary)">✏️ Use "${escHtml(query)}" as Custom Model</div>
        <div style="font-size:.74rem;color:var(--gray-600)">Click to set custom model and adjust specs below</div>
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
          <span>✓ Selected: <strong>${escHtml(preset.brand)} ${escHtml(preset.model)}</strong></span>
          <div style="font-size:.75rem;opacity:.9;margin-top:1px">${escHtml(preset.specs)}</div>
        </div>
        <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px;min-height:24px;font-size:.72rem;background:#fff;border-color:#86efac;color:#166534" onclick="UI.clearPresetSelection()">Change</button>
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
          <span>✏️ Custom Model: <strong>${escHtml(customVal)}</strong></span>
        </div>
        <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px;min-height:24px;font-size:.72rem;background:#fff;border-color:#86efac;color:#166534" onclick="UI.clearPresetSelection()">Change</button>
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
          <label style="font-weight:700;color:var(--primary-dark);font-size:.85rem">⚡ Search &amp; Pick Model Preset (40+ Models)</label>
          <div style="font-size:.74rem;color:var(--gray-600)">Type any model name (e.g. <em>3420, T14, M1, 840, i5</em>) or tap a brand:</div>
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
          <input type="text" id="presetSearchInput" class="preset-search-input" placeholder="🔍 Type model name (e.g. 3420, T14, M1, EliteBook)..." oninput="UI.onPresetSearchInput(this.value)" onfocus="document.getElementById('presetResultsList').style.display='block'" autocomplete="off">
          <button type="button" class="preset-clear-btn" onclick="UI.clearPresetSelection()">✕</button>
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
        <div class="spec-builder-title">🛠️ Quick Spec Builder (Pick or Customize)</div>
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
        <div style="font-weight:700;color:var(--purple);margin-bottom:8px;font-size:.9rem">🛠️ Under Repair &amp; Service Details</div>
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
            <label>Technician Phone Number</label>
            <input type="tel" id="repairServicePhone" placeholder="10-digit mobile number">
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
          <label style="font-weight:700;color:var(--primary-dark);font-size:.85rem">⚡ Search &amp; Pick Model Preset</label>
          <div style="font-size:.74rem;color:var(--gray-600)">Type any model name (e.g. <em>3420, T14, M1, 840</em>) or tap a brand:</div>
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
          <input type="text" id="presetSearchInput" class="preset-search-input" value="${escHtml(i.brand ? i.brand + ' ' + (i.model || '') : '')}" placeholder="🔍 Search models..." oninput="UI.onPresetSearchInput(this.value)" onfocus="document.getElementById('presetResultsList').style.display='block'" autocomplete="off">
          <button type="button" class="preset-clear-btn" onclick="UI.clearPresetSelection()">✕</button>
        </div>

        <div id="presetResultsList" class="preset-results-dropdown" style="display:none">
          ${this.renderPresetSearchResults(i.model || '')}
        </div>

        <div id="selectedPresetBanner" class="selected-preset-banner" style="${i.model ? 'display:flex' : 'display:none'}">
          <div>
            <span>Current: <strong>${escHtml(i.brand || '')} ${escHtml(i.model || '')}</strong></span>
          </div>
          <button type="button" class="btn btn-sm btn-outline" style="padding:2px 8px;min-height:24px;font-size:.72rem;background:#fff;border-color:#86efac;color:#166534" onclick="UI.clearPresetSelection()">Change</button>
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
        <div class="spec-builder-title">🛠️ Quick Spec Builder (Pick or Customize)</div>
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
        <div style="font-weight:700;color:var(--purple);margin-bottom:8px;font-size:.9rem">🛠️ Under Repair &amp; Service Details</div>
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
            <label>Technician Phone Number</label>
            <input type="tel" id="repairServicePhone" value="${escHtml(rep.servicePhone || '')}" placeholder="10-digit mobile number">
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
      ${!isRented ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200)"><button class="btn btn-danger btn-block btn-sm" onclick="UI.deleteItem('${i.id}')">Delete Item</button></div>` : '<div style="margin-top:8px;font-size:.8rem;color:var(--gray-500);text-align:center">Cannot delete — currently rented out.</div>'}`);
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
      repairInfo = {
        serviceCenter: document.getElementById('repairServiceCenter')?.value.trim() || '',
        servicePerson: document.getElementById('repairServicePerson')?.value.trim() || '',
        servicePhone: document.getElementById('repairServicePhone')?.value.trim() || '',
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
  showNewRentalModal(customerId) {
    const availableItems = state.items.filter(i => i.status === 'available');
    const c = getCustomer(customerId);
    this.showModal(`
      <button class="modal-close" onclick="UI.hideModal()">&times;</button>
      <h2>New Rental Assignment</h2>
      <div class="form-group">
        <label>Customer</label>
        <input type="text" value="${escHtml(c ? c.name + ' (' + fmtPhone(c.phone) + ')' : '')}" disabled style="background:var(--gray-100)">
      </div>
      <div class="form-group">
        <label>Select Laptop / Computer *</label>
        <select id="rentalItem">
          ${availableItems.length === 0 
            ? '<option value="">— No available devices in inventory —</option>' 
            : availableItems.map(i => `<option value="${i.id}">${escHtml(getItemFullTitle(i))} [SN: ${escHtml(i.serial)}]${i.specs ? ' - ' + escHtml(i.specs) : ''}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Rent Amount (₹) *</label>
          <input type="number" id="rentalAmount" placeholder="e.g. 1500" min="0" step="1">
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

    if (!itemId) { UI.showToast('Please select a device from inventory', 'error'); return; }
    if (!amount || amount <= 0) { UI.showToast('Please enter a valid rent amount', 'error'); return; }
    if (!start) { UI.showToast('Please select a start date', 'error'); return; }

    state.rentals.push({
      id: uid(),
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

    Data.save();
    UI.hideModal();
    UI.showToast('Rental activated successfully', 'success');
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
      <p style="margin-bottom:12px;color:var(--gray-600)">Closing this rental will mark <strong>${escHtml(getItemFullTitle(item))}</strong> as Available in inventory.</p>
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
        <input type="text" value="${escHtml(c ? c.name + ' (' + fmtPhone(c.phone) + ')' : '')}" disabled style="background:var(--gray-100)">
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
      method,
      remarks,
      createdAt: today()
    });

    Data.save();
    UI.hideModal();
    UI.showToast(`Payment of ${fmtCurrency(amount)} recorded!`, 'success');
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
        <input type="text" value="${escHtml(c ? c.name : '')}" disabled style="background:var(--gray-100)">
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
      <div class="form-group">
        <label>Payment Method</label>
        <input type="text" id="editPayMethod" value="${escHtml(p.method || '')}">
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
    const method = document.getElementById('editPayMethod').value.trim();
    const remarks = document.getElementById('editPayRemarks').value.trim();

    if (!amount || amount <= 0) { UI.showToast('Please enter valid amount', 'error'); return; }
    if (!date) { UI.showToast('Please select date', 'error'); return; }

    p.amount = amount;
    p.date = date;
    p.method = method;
    p.remarks = remarks;

    Data.save();
    UI.hideModal();
    UI.showToast('Payment record updated', 'success');
    UI.renderAll();
  },

  deletePayment(paymentId) {
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
}
