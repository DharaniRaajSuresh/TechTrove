/* STATE */
let state = { customers: [], items: [], rentals: [], payments: [] };
let dashboardCache = null;
let currentPage = 'dashboard';
let pageStack = [];
let filterState = { inventory: 'all' };
let notifEnabled = true;
let lastNotifDate = '';
try { notifEnabled = localStorage.getItem('notifEnabled') !== 'false'; lastNotifDate = localStorage.getItem('lastNotifDate') || ''; } catch(e) {}

/* UTILITY */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); };
const parseDate = (s) => { if (!s) return new Date(NaN); const p = s.split('-'); return new Date(parseInt(p[0]), parseInt(p[1])-1, parseInt(p[2])); };
const fmtDate = (s) => { if (!s) return '—'; const d = typeof s === 'string' ? parseDate(s) : s; return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); };
const fmtCurrency = (n) => '₹' + Number(n).toLocaleString('en-IN');
const daysBetween = (a, b) => Math.round((parseDate(b) - parseDate(a)) / 86400000);
const isActiveRental = (r) => r.status === 'active';

function cycleDays(rental) {
  if (rental.billingCycle === 'weekly') return 7;
  if (rental.billingCycle === 'monthly') return 30;
  return Math.max(1, parseInt(rental.customDays) || 30);
}

function rentalStatus(rental) {
  const payments = state.payments.filter(p => p.rentalId === rental.id);
  const cd = cycleDays(rental);
  const start = parseDate(rental.startDate);
  const now = rental.endDate ? parseDate(rental.endDate) : new Date();
  const daysSince = Math.floor((now - start) / 86400000);
  const completedCycles = Math.max(0, Math.floor(daysSince / cd));
  const billedCycles = completedCycles + 1;
  const totalExpected = billedCycles * rental.rentAmount;
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, totalExpected - totalPaid);
  const currentCycleEnd = new Date(start.getTime() + completedCycles * cd * 86400000);
  const nextDueDate = new Date(start.getTime() + (completedCycles + 1) * cd * 86400000);
  const daysUntilDue = Math.round((nextDueDate - now) / 86400000);
  const isOverdue = totalExpected > totalPaid && completedCycles > 0;
  const daysOverdue = isOverdue ? Math.round((now - currentCycleEnd) / 86400000) : 0;
  const nextCyclePaid = totalPaid >= (billedCycles + 1) * rental.rentAmount;
  const isDueSoon = !nextCyclePaid && daysUntilDue >= 0 && daysUntilDue <= 7;
  return { totalExpected, totalPaid, outstanding, nextDueDate, daysUntilDue, isOverdue, daysOverdue, isDueSoon };
}

function getItem(id) { return state.items.find(i => i.id === id); }
function getCustomer(id) { return state.customers.find(c => c.id === id); }
function getRental(id) { return state.rentals.find(r => r.id === id); }

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
    sendDueNotification('Payment Due Reminder', `${overdue.length} overdue payment(s): ${names}${more}`);
  }
  lastNotifDate = todayKey;
  localStorage.setItem('lastNotifDate', todayKey);
}
function getOverdueList() {
  let list = [];
  state.rentals.filter(r => r.status === 'active').forEach(r => {
    const st = rentalStatus(r); const c = getCustomer(r.customerId);
    if (c && st.isOverdue) list.push({ rental: r, status: st, customer: c });
  });
  return list.sort((a, b) => b.status.daysOverdue - a.status.daysOverdue);
}
function getDueSoonList() {
  let list = [];
  state.rentals.filter(r => r.status === 'active').forEach(r => {
    const st = rentalStatus(r); const c = getCustomer(r.customerId);
    if (c && !st.isOverdue && st.isDueSoon) list.push({ rental: r, status: st, customer: c });
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

function rentalItem(rental) { return getItem(rental.itemId); }
function rentalCustomer(rental) { return getCustomer(rental.customerId); }
function parseCSVLine(line) {
  const vals = [];
  let inQuote = false, cur = '';
  for (const ch of line) {
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === ',' && !inQuote) { vals.push(cur.trim()); cur = ''; continue; }
    cur += ch;
  }
  vals.push(cur.trim());
  return vals;
}

/* AUTH */
const Auth = {
  _token: null,
  isLoggedIn: () => !!localStorage.getItem('tt_token'),
  login: async (password) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });
      if (!res.ok) return false;
      const data = await res.json();
      localStorage.setItem('tt_token', data.token);
      Auth._token = data.token;
      return true;
    } catch(e) { return false; }
  },
  logout: () => {
    localStorage.removeItem('tt_token');
    Auth._token = null;
    UI.showLogin();
  },
  restore: () => { Auth._token = localStorage.getItem('tt_token'); },
  header: () => {
    const token = Auth._token || localStorage.getItem('tt_token');
    return token ? { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token } : { 'Content-Type': 'application/json' };
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
  _saveQueue: Promise.resolve(),
  save() {
    this._dirty = true;
    if (this._saving) return;
    this._saving = true;
    this._dirty = false;
    const snapshot = JSON.parse(JSON.stringify(state));
    this._saveQueue = this._saveQueue.then(() =>
      fetch('/api/data', {
        method: 'POST',
        headers: Auth.header(),
        body: JSON.stringify(state)
      }).then(r => {
        if (r.status === 401) Auth.logout();
        if (!r.ok) throw new Error('Save failed with status ' + r.status);
        return r;
      })
      .catch(e => {
        console.error('Save failed', e);
        Object.assign(state, snapshot);
        UI.showToast('Save failed — changes reverted', 'error');
      })
    ).finally(() => {
      this._saving = false;
      if (this._dirty) this.save();
      else { dashboardCache = null; this.loadDashboard(); checkAndNotifyDues(); UI.updateDueBanner(); }
    });
  },
  async load() {
    UI.showLoading(true);
    try {
      const res = await this._fetch('/api/data', { headers: Auth.header() });
      if (!res.ok) throw new Error('Load failed with status ' + res.status);
      const d = await res.json();
      if (d && d.error) throw new Error(d.error);
      if (d && d.customers) {
        state.customers = d.customers || [];
        state.items = d.items || [];
        state.rentals = d.rentals || [];
        state.payments = d.payments || [];
      }
    } catch(e) { if (e.message !== 'Unauthorized') console.error('Server load failed', e); }
    finally { UI.showLoading(false); }
  },
  async loadDashboard() {
    try {
      const res = await this._fetch('/api/dashboard', { headers: Auth.header() });
      dashboardCache = await res.json();
    } catch(e) {
      if (e.message !== 'Unauthorized') console.error('Dashboard load failed', e);
      dashboardCache = null;
    }
  },
  exportJSON() {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `techtrove_backup_${today()}.json`; a.click();
    URL.revokeObjectURL(a.href);
  },
  importJSON(file) {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const d = JSON.parse(e.target.result);
        if (!d.customers || !d.items || !d.rentals || !d.payments) throw new Error('Invalid format');
        state = d; Data.save(); UI.showToast('Data imported successfully', 'success'); UI.renderAll();
      } catch(err) { UI.showToast('Invalid backup file', 'error'); }
    };
    reader.readAsText(file);
  }
};
window.Data = Data;

/* UI */
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
    t.textContent = msg; t.className = 'toast ' + type; t.classList.add('visible');
    clearTimeout(this._toastTimer); this._toastTimer = setTimeout(() => t.classList.remove('visible'), 2500);
  },

  showLoading(show) {
    document.getElementById('loadingOverlay').classList.toggle('hidden', !show);
  },

  showModal(html) {
    document.getElementById('modalContent').innerHTML = html;
    document.getElementById('modalOverlay').classList.remove('hidden');
  },
  hideModal() { document.getElementById('modalOverlay').classList.add('hidden'); },

  showConfirm(msg, onConfirm) {
    const c = document.getElementById('confirmContent');
    c.innerHTML = `<p>${msg}</p><div class="btn-group"><button class="btn btn-outline" onclick="UI.hideConfirm()">Cancel</button><button class="btn btn-danger" id="confirmBtn">Delete</button></div>`;
    document.getElementById('confirmOverlay').classList.remove('hidden');
    document.getElementById('confirmBtn').onclick = () => { this.hideConfirm(); onConfirm(); };
  },
  hideConfirm() { document.getElementById('confirmOverlay').classList.add('hidden'); },

  navigate(page, params) {
    pageStack.push({ page, params });
    currentPage = page;
    this._renderPage(page, params);
    if (page !== 'customer-detail') {
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === page));
      document.getElementById('bottomNav').classList.remove('hidden');
    } else {
      document.getElementById('bottomNav').classList.add('hidden');
    }
    const backBtn = document.getElementById('headerBack');
    backBtn.classList.toggle('hidden', pageStack.length <= 1);
    document.getElementById('headerTitle').textContent = page === 'customer-detail' ? 'Customer' : page === 'dashboard' ? 'TechTrove Systems' : page === 'more' ? 'Settings' : page.charAt(0).toUpperCase() + page.slice(1);
    document.getElementById('fabAdd').classList.toggle('hidden', page !== 'inventory');
  },

  goBack() {
    if (pageStack.length > 1) { pageStack.pop(); const p = pageStack[pageStack.length - 1]; currentPage = p.page; this._renderPage(p.page, p.params); document.querySelectorAll('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.page === p.page)); document.getElementById('bottomNav').classList.toggle('hidden', p.page === 'customer-detail'); document.getElementById('headerBack').classList.toggle('hidden', pageStack.length <= 1); document.getElementById('headerTitle').textContent = p.page === 'customer-detail' ? 'Customer' : p.page === 'dashboard' ? 'TechTrove Systems' : p.page === 'more' ? 'Settings' : p.page.charAt(0).toUpperCase() + p.page.slice(1); document.getElementById('fabAdd').classList.toggle('hidden', p.page !== 'inventory'); }
  },

  _renderPage(page, params) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const el = document.getElementById('page-' + page);
    if (el) el.classList.add('active');
    /* Update due banner on all pages */
    this.updateDueBanner();
    switch(page) {
      case 'dashboard': this.renderDashboard(); break;
      case 'customers': this.renderCustomers(); break;
      case 'customer-detail': this.renderCustomerDetail(params); break;
      case 'inventory': this.renderInventory(); break;
      case 'search': this.renderSearch(); break;
      case 'more': this.renderMore(); break;
    }
  },

  updateDueBanner() {
    const el = document.getElementById('dueBanner');
    if (!el) return;
    const overdue = getOverdueList();
    const dueSoon = getDueSoonList();
    if (overdue.length > 0) {
      const total = overdue.reduce((s, x) => s + x.status.outstanding, 0);
      el.innerHTML = `<span class="due-alert-icon">&#9888;</span><span><strong>${overdue.length}</strong> overdue — collect <strong>${fmtCurrency(total)}</strong></span>`;
      el.className = 'due-alert-banner';
    } else if (dueSoon.length > 0) {
      const total = dueSoon.reduce((s, x) => s + x.rental.rentAmount, 0);
      el.innerHTML = `<span class="due-alert-icon">&#9201;</span><span><strong>${dueSoon.length}</strong> due within 7 days — <strong>${fmtCurrency(total)}</strong></span>`;
      el.className = 'due-alert-banner due-soon-banner';
    } else {
      el.className = 'due-alert-banner hidden';
    }
    /* Update badge on home button */
    const badge = document.getElementById('notifBadge');
    if (badge) {
      if (overdue.length > 0) {
        badge.textContent = overdue.length;
        badge.className = 'notif-badge';
      } else {
        badge.className = 'notif-badge hidden';
      }
    }
  },

  renderAll() { this._renderPage(currentPage, null); },

  /* DASHBOARD */
  renderDashboard() {
    const now = new Date();
    const monthName = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

    /* Use server-computed data if available, fall back to client computation */
    let monthlyCollected = 0, outstandingTotal = 0;
    let dueSoonList = [], overdueList = [];
    let activeRentals = 0, totalCustomers = 0, totalItems = 0;

    if (dashboardCache) {
      monthlyCollected = dashboardCache.monthlyCollected || 0;
      outstandingTotal = dashboardCache.outstandingTotal || 0;
      activeRentals = dashboardCache.activeRentals || 0;
      totalCustomers = dashboardCache.totalCustomers || 0;
      totalItems = dashboardCache.totalItems || 0;
      (dashboardCache.overdue || []).forEach(o => {
        overdueList.push({ rental: o.rental, status: o.status, customer: o.customer });
      });
      (dashboardCache.dueSoon || []).forEach(d => {
        dueSoonList.push({ rental: d.rental, status: d.status, customer: d.customer });
      });
    } else {
      /* Fallback: compute client-side (same as before) */
      const monthStart = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-01';
      state.payments.forEach(p => { if (p.date >= monthStart) monthlyCollected += p.amount; });
      state.rentals.filter(isActiveRental).forEach(r => {
        const st = rentalStatus(r); const c = rentalCustomer(r);
        if (!c) return;
        if (st.outstanding > 0) outstandingTotal += st.outstanding;
        if (st.isOverdue) overdueList.push({ rental: r, status: st, customer: c });
        else if (st.isDueSoon) dueSoonList.push({ rental: r, status: st, customer: c });
      });
      overdueList.sort((a, b) => b.status.daysOverdue - a.status.daysOverdue);
      dueSoonList.sort((a, b) => a.status.daysUntilDue - b.status.daysUntilDue);
      activeRentals = state.rentals.filter(r => r.status === 'active').length;
      totalCustomers = state.customers.length;
      totalItems = state.items.length;
    }

    let html = '';

    /* Hero section */
    html += `<div class="dash-hero">
      <div class="dash-hero-top">
        <div>
          <div class="dash-greeting">Good ${now.getHours() < 12 ? 'Morning' : now.getHours() < 18 ? 'Afternoon' : 'Evening'}</div>
          <div class="dash-title">TechTrove Systems</div>
          <div class="dash-subtitle">Rental Management System</div>
        </div>
        <div class="dash-hero-icon">
          <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
        </div>
      </div>
    </div>`;

    /* Quick metrics row */
    html += `<div class="dash-metrics">
      <div class="dash-metric"><div class="dash-metric-value">${totalCustomers}</div><div class="dash-metric-label">Customers</div></div>
      <div class="dash-metric"><div class="dash-metric-value">${activeRentals}</div><div class="dash-metric-label">Active Rentals</div></div>
      <div class="dash-metric"><div class="dash-metric-value">${totalItems}</div><div class="dash-metric-label">Items</div></div>
    </div>`;

    /* Financial summary */
    html += `<div class="card dash-fin-card">
      <div class="dash-fin-row">
        <div>
          <div class="dash-fin-label">Collected in ${monthName.split(' ')[0]}</div>
          <div class="dash-fin-value" style="color:var(--success)">${fmtCurrency(monthlyCollected)}</div>
        </div>
        <div class="dash-fin-divider"></div>
        <div>
          <div class="dash-fin-label">Outstanding</div>
          <div class="dash-fin-value" style="color:var(--danger)">${fmtCurrency(outstandingTotal)}</div>
        </div>
      </div>
    </div>`;

    /* Quick actions */
    html += `<div class="dash-actions">
      <button class="dash-action" onclick="UI.showAddCustomerModal()">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>
        <span>Add Customer</span>
      </button>
      <button class="dash-action" onclick="UI.navigate('inventory')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
        <span>Add Item</span>
      </button>
      <button class="dash-action" onclick="UI.navigate('customers')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
        <span>Customers</span>
      </button>
      <button class="dash-action" onclick="UI.navigate('search')">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <span>Search</span>
      </button>
    </div>`;

    /* Alerts section */
    if (overdueList.length > 0) {
      html += `<div class="card" style="border-left:3px solid var(--danger)">
        <div class="card-header"><span class="card-title" style="color:var(--danger)">Overdue Payments <span class="badge badge-danger" style="margin-left:6px">${overdueList.length}</span></span></div>`;
      overdueList.forEach(({ rental, status, customer }) => {
        const item = getItem(rental.itemId);
        html += `<div class="list-item" onclick="UI.navigate('customer-detail','${customer.id}')">
          <div class="item-info"><div class="item-name">${escHtml(customer.name)}</div><div class="item-sub">${item ? escHtml(item.brand) : '—'} &middot; ${fmtCurrency(rental.rentAmount)}/${rental.billingCycle}</div></div>
          <div class="item-right"><div class="item-amount" style="color:var(--danger)">${fmtCurrency(status.outstanding)}</div><div class="item-date"><span class="badge badge-danger">${status.daysOverdue}d overdue</span></div></div>
        </div>`;
      });
      html += `</div>`;
    }

    if (dueSoonList.length > 0) {
      html += `<div class="card" style="border-left:3px solid var(--warning)">
        <div class="card-header"><span class="card-title" style="color:var(--warning)">Due Within 7 Days</span></div>`;
      dueSoonList.forEach(({ rental, status, customer }) => {
        const item = getItem(rental.itemId);
        html += `<div class="list-item" onclick="UI.navigate('customer-detail','${customer.id}')">
          <div class="item-info"><div class="item-name">${escHtml(customer.name)}</div><div class="item-sub">${item ? escHtml(item.brand) : '—'} &middot; Due ${fmtDate(status.nextDueDate)}</div></div>
          <div class="item-right"><div class="item-amount" style="color:var(--warning)">${fmtCurrency(rental.rentAmount)}</div><div class="item-date"><span class="badge badge-warning">${status.daysUntilDue === 0 ? 'Today' : status.daysUntilDue === 1 ? 'Tomorrow' : `In ${status.daysUntilDue}d`}</span></div></div>
        </div>`;
      });
      html += `</div>`;
    }

    if (overdueList.length === 0 && dueSoonList.length === 0) {
      html += `<div class="card dash-all-clear">
        <div class="dash-clear-icon">&#10003;</div>
        <div class="dash-clear-text">All payments up to date</div>
        <div class="dash-clear-sub">No overdue or due payments</div>
      </div>`;
    }

    document.getElementById('page-dashboard').innerHTML = html;
  },

  /* CUSTOMERS */
  renderCustomers(query) {
    let list = state.customers;
    if (query) { const q = query.toLowerCase(); list = list.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q)); }
    list.sort((a, b) => a.name.localeCompare(b.name));

    let html = `<div class="search-bar"><input type="search" id="customerSearch" placeholder="Search customers..." value="${escHtml(query || '')}" oninput="UI.renderCustomers(this.value)"><button onclick="UI.showAddCustomerModal()">+ Add</button></div>`;

    if (list.length === 0) {
      html += `<div class="empty-state"><div class="empty-icon">&#128100;</div><p>${query ? 'No customers found' : 'No customers yet. Add your first customer!'}</p></div>`;
    } else {
      html += `<div class="card">`;
      list.forEach(c => {
        const active = customerActiveRentals(c.id);
        const allRentals = customerAllRentals(c.id);
        let sub = '';
        if (active.length > 0) { sub = `${active.length} active rental(s)`; }
        else if (allRentals.length > 0) { sub = 'Closed'; }
        else { sub = 'No rentals'; }
        html += `<div class="list-item" onclick="UI.navigate('customer-detail','${c.id}')">
          <div class="item-info"><div class="item-name">${escHtml(c.name)}</div><div class="item-sub">${escHtml(c.phone)} &middot; ${sub}</div></div>
          <div class="item-right"><span style="color:var(--gray-400)">&#8250;</span></div>
        </div>`;
      });
      html += `</div>`;
    }

    document.getElementById('page-customers').innerHTML = html;
    const input = document.getElementById('customerSearch');
    if (input && query) { input.value = query; }
  },

  /* CUSTOMER DETAIL */
  renderCustomerDetail(customerId) {
    const c = getCustomer(customerId);
    if (!c) { UI.showToast('Customer not found', 'error'); UI.goBack(); return; }

    const rentals = customerAllRentals(customerId);
    const allPayments = customerPayments(customerId);

    let html = `<div class="detail-header">
      <h2>${escHtml(c.name)}</h2>
      <a href="tel:${escHtml(c.phone)}" class="detail-phone">${escHtml(c.phone)}</a>
      ${c.address ? `<div class="detail-address">${escHtml(c.address)}</div>` : ''}
      <div style="margin-top:8px;display:flex;gap:6px;justify-content:center;flex-wrap:wrap">
        <button class="btn btn-sm btn-outline-primary" onclick="UI.showEditCustomerModal('${c.id}')">Edit</button>
        ${rentals.some(isActiveRental) ? `<button class="btn btn-sm btn-primary" onclick="UI.showLogPaymentModal('${c.id}')">Log Payment</button>` : ''}
        <button class="btn btn-sm btn-success" onclick="UI.showNewRentalModal('${c.id}')">New Rental</button>
        <button class="btn btn-sm btn-outline" onclick="UI.deleteCustomer('${c.id}')" style="color:var(--danger);border-color:var(--danger)">Delete</button>
      </div>
    </div>`;

    /* Active Rentals */
    const activeRentals = rentals.filter(isActiveRental);
    if (activeRentals.length > 0) {
      html += `<div class="detail-section"><h3>Active Rentals</h3>`;
      activeRentals.forEach(r => {
        const st = rentalStatus(r);
        const item = getItem(r.itemId);
        let statusClass = st.isOverdue ? 'overdue' : st.isDueSoon ? 'due-soon' : 'paid';
        html += `<div class="rental-card ${statusClass}">
          <div class="rental-row"><span class="rental-label">Item</span><span class="rental-value">${item ? escHtml(item.brand) + ' (' + item.type + ')' : 'Unknown item'}</span></div>
          <div class="rental-row"><span class="rental-label">Rent</span><span class="rental-value">${fmtCurrency(r.rentAmount)} / ${r.billingCycle}${r.billingCycle === 'custom' ? ` (${r.customDays}d)` : ''}</span></div>
          <div class="rental-row"><span class="rental-label">Next Due</span><span class="rental-value">${fmtDate(st.nextDueDate)} ${st.isOverdue ? `<span class="badge badge-danger">${st.daysOverdue}d overdue</span>` : st.isDueSoon ? `<span class="badge badge-warning">${st.daysUntilDue === 0 ? 'Due today' : st.daysUntilDue === 1 ? 'Due tomorrow' : `In ${st.daysUntilDue}d`}</span>` : ''}</span></div>
          <div class="rental-row"><span class="rental-label">Outstanding</span><span class="rental-value" style="color:${st.outstanding > 0 ? 'var(--danger)' : 'var(--success)'}">${st.outstanding > 0 ? fmtCurrency(st.outstanding) : '&#10003; Paid'}</span></div>
          <div class="rental-row"><span class="rental-label">Since</span><span class="rental-value" style="font-weight:400;font-size:.85rem">${fmtDate(r.startDate)}</span></div>
          ${st.outstanding > 0 ? `<div style="margin-top:8px;display:flex;gap:6px"><button class="btn btn-sm btn-primary" onclick="UI.showLogPaymentModal('${c.id}','${r.id}')">Log Payment</button>` : `<div style="margin-top:8px;display:flex;gap:6px">`}
            <button class="btn btn-sm btn-outline" onclick="UI.showCloseRentalModal('${r.id}')">Close Rental</button>
            <button class="btn btn-sm btn-outline" onclick="UI.showEditRentalModal('${r.id}')">Edit</button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    /* Closed Rentals */
    const closedRentals = rentals.filter(r => !isActiveRental(r));
    if (closedRentals.length > 0) {
      html += `<div class="detail-section"><h3>Past Rentals</h3><div class="card">`;
      closedRentals.forEach(r => {
        const item = getItem(r.itemId);
        html += `<div class="list-item">
          <div class="item-info"><div class="item-name">${item ? escHtml(item.brand) : 'Unknown'}</div><div class="item-sub">${fmtDate(r.startDate)} — ${fmtDate(r.endDate)}</div></div>
          <div class="item-right"><span class="badge badge-gray">Closed</span></div>
        </div>`;
      });
      html += `</div></div>`;
    }

    /* Payment History */
    html += `<div class="detail-section"><h3>Payment History</h3>`;
    if (allPayments.length === 0) {
      html += `<div class="empty-state" style="padding:20px"><p>No payments recorded yet.</p></div>`;
    } else {
      html += `<div class="card">`;
      allPayments.forEach(p => {
        const r = getRental(p.rentalId);
        const item = r ? getItem(r.itemId) : null;
        html += `<div class="payment-item">
          <div class="pay-amount">${fmtCurrency(p.amount)}</div>
          <div class="pay-info"><div class="pay-date">${fmtDate(p.date)}${item ? ' &middot; ' + escHtml(item.brand) : ''}</div><div class="pay-method">${escHtml(p.method || '—')}${p.remarks ? ' &middot; ' + escHtml(p.remarks) : ''}</div></div>
          <div class="pay-actions">
            <button onclick="UI.showEditPaymentModal('${p.id}')" title="Edit payment">&#9998;</button>
            <button onclick="UI.deletePayment('${p.id}')" title="Delete payment" style="color:var(--danger)">&#10005;</button>
          </div>
        </div>`;
      });
      html += `</div>`;
    }
    html += `</div>`;

    /* No rentals */
    if (rentals.length === 0) {
      html += `<div class="empty-state" style="padding:20px"><p>No rentals for this customer yet.</p></div>`;
    }

    document.getElementById('page-customer-detail').innerHTML = html;
  },

  /* INVENTORY */
  renderInventory(filter) {
    if (filter) filterState.inventory = filter;
    else filter = filterState.inventory;
    let list = state.items;
    if (filter && filter !== 'all') list = list.filter(i => i.status === filter);
    list.sort((a, b) => a.brand.localeCompare(b.brand));

    let html = `<div class="filter-bar">
      <button class="filter-btn ${filter === 'all' ? 'active' : ''}" onclick="UI.renderInventory('all')">All (${state.items.length})</button>
      <button class="filter-btn ${filter === 'available' ? 'active' : ''}" onclick="UI.renderInventory('available')">Available</button>
      <button class="filter-btn ${filter === 'rented' ? 'active' : ''}" onclick="UI.renderInventory('rented')">Rented</button>
      <button class="filter-btn ${filter === 'repair' ? 'active' : ''}" onclick="UI.renderInventory('repair')">Under Repair</button>
    </div>`;

    if (list.length === 0) {
      html += `<div class="empty-state"><div class="empty-icon">&#128187;</div><p>${filter === 'all' ? 'No items in inventory. Add your first item!' : 'No items match this filter.'}</p></div>`;
    } else {
      html += `<div class="card">`;
      list.forEach(i => {
        const rental = state.rentals.find(r => r.itemId === i.id && isActiveRental(r));
        const customer = rental ? getCustomer(rental.customerId) : null;
        const statusBadge = i.status === 'available' ? 'badge-success' : i.status === 'rented' ? 'badge-primary' : 'badge-purple';
        const statusLabel = i.status === 'available' ? 'Available' : i.status === 'rented' ? 'Rented' : 'Under Repair';
        html += `<div class="list-item" onclick="UI.showEditItemModal('${i.id}')">
          <div class="item-info"><div class="item-name">${escHtml(i.brand)}</div><div class="item-sub">${i.type} &middot; ${escHtml(i.serial)}${customer ? ' &middot; With: ' + escHtml(customer.name) : ''}</div></div>
          <div class="item-right"><span class="badge ${statusBadge}">${statusLabel}</span></div>
        </div>`;
      });
      html += `</div>`;
    }

    document.getElementById('page-inventory').innerHTML = html;
  },

  /* MORE */
  renderMore() {
    const html = `
      <div class="card" style="margin-top:4px">
        <div class="detail-header" style="padding:8px 0 12px">
          <h2 style="font-size:1.05rem;color:var(--gray-600)">TechTrove Systems</h2>
          <div style="font-size:.8rem;color:var(--gray-400);margin-top:2px">Rental Tracker</div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:16px">
          <div class="stat-card"><div class="stat-value" style="font-size:1.3rem">${state.customers.length}</div><div class="stat-label">Customers</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1.3rem">${state.items.length}</div><div class="stat-label">Items</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1.3rem">${state.rentals.length}</div><div class="stat-label">Rentals</div></div>
          <div class="stat-card"><div class="stat-value" style="font-size:1.3rem">${state.payments.length}</div><div class="stat-label">Payments</div></div>
        </div>
      </div>

      <div class="card">
        <div class="section-header"><h3>Notifications</h3></div>
        <div class="toggle-row"><label>Payment Due Reminders</label><label class="toggle-switch"><input type="checkbox" id="moreNotifToggle" ${notifEnabled ? 'checked' : ''} onchange="UI.toggleNotifications(this.checked)"><span class="toggle-slider"></span></label></div>
        <div style="font-size:.8rem;color:var(--gray-500)">Shows browser notifications for overdue/due payments</div>
      </div>

      <div class="card">
        <div class="section-header"><h3>Data</h3></div>
        <button class="btn btn-outline btn-block btn-sm" onclick="Data.exportJSON()" style="margin-bottom:8px">Export Backup (JSON)</button>
        <div class="form-group" style="margin-bottom:0"><label style="font-size:.8rem;color:var(--gray-500)">Restore from backup</label><input type="file" id="moreImportFile" accept=".json" style="font-size:.85rem" onchange="UI.handleImport(this)"></div>
        <hr style="margin:14px 0;border:none;border-top:1px solid var(--gray-200)">
        <button class="btn btn-success btn-block btn-sm" onclick="UI.showBulkImportModal()">Bulk Import from Excel/CSV</button>
      </div>

      <div class="card">
        <button class="btn btn-outline btn-block btn-sm" onclick="Auth.logout()" style="color:var(--danger);border-color:var(--danger)">Lock &amp; Logout</button>
      </div>
      <div style="text-align:center;padding:16px;font-size:.7rem;color:var(--gray-400)">TechTrove Systems v1.0</div>`;
    document.getElementById('page-more').innerHTML = html;
  },

  /* SEARCH */
  renderSearch() {
    let html = `<div class="search-bar"><input type="search" id="globalSearchInput" placeholder="Search name or phone..." oninput="UI.doSearch(this.value)"><button onclick="document.getElementById('globalSearchInput').value='';UI.doSearch('')">Clear</button></div>
    <div id="searchResults"></div>`;
    document.getElementById('page-search').innerHTML = html;
  },

  doSearch(query) {
    const el = document.getElementById('searchResults');
    if (!query || query.trim().length < 1) { el.innerHTML = '<div class="empty-state"><p>Type a name or phone number to search</p></div>'; return; }
    const q = query.toLowerCase().trim();
    const customers = state.customers.filter(c => c.name.toLowerCase().includes(q) || c.phone.includes(q));
    if (customers.length === 0) { el.innerHTML = '<div class="empty-state"><p>No results found</p></div>'; return; }
    let html = `<div class="card"><div class="card-header"><span class="card-title">Customers (${customers.length})</span></div>`;
    customers.forEach(c => {
      const active = customerActiveRentals(c.id);
      html += `<div class="list-item" onclick="UI.navigate('customer-detail','${c.id}')">
        <div class="item-info"><div class="item-name">${escHtml(c.name)}</div><div class="item-sub">${escHtml(c.phone)}${active.length > 0 ? ` &middot; ${active.length} active rental(s)` : ''}</div></div>
        <div class="item-right"><span style="color:var(--gray-400)">&#8250;</span></div>
      </div>`;
    });
    html += `</div>`;
    el.innerHTML = html;
  },

  /* MODALS - Add/Edit Customer */
  showAddCustomerModal() {
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>Add Customer</h2>
      <div class="form-group"><label>Name *</label><input type="text" id="custName" placeholder="Full name"></div>
      <div class="form-group"><label>Phone *</label><input type="tel" id="custPhone" placeholder="Phone number"></div>
      <div class="form-group"><label>Address / Notes</label><textarea id="custAddress" placeholder="Address or notes"></textarea></div>
      <div class="form-actions"><button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button><button class="btn btn-primary" onclick="UI.saveCustomer()">Save</button></div>`);
    setTimeout(() => document.getElementById('custName').focus(), 300);
  },

  showEditCustomerModal(id) {
    const c = getCustomer(id); if (!c) return;
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>Edit Customer</h2>
      <div class="form-group"><label>Name *</label><input type="text" id="custName" value="${escHtml(c.name)}"></div>
      <div class="form-group"><label>Phone *</label><input type="tel" id="custPhone" value="${escHtml(c.phone)}"></div>
      <div class="form-group"><label>Address / Notes</label><textarea id="custAddress">${escHtml(c.address || '')}</textarea></div>
      <div class="form-actions"><button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button><button class="btn btn-primary" onclick="UI.saveCustomer('${c.id}')">Update</button></div>`);
  },

  saveCustomer(id) {
    const name = document.getElementById('custName').value.trim();
    const phone = document.getElementById('custPhone').value.trim();
    const address = document.getElementById('custAddress').value.trim();
    if (!name || !phone) { UI.showToast('Name and phone are required', 'error'); return; }
    if (id) {
      const c = getCustomer(id);
      if (c) { c.name = name; c.phone = phone; c.address = address; }
    } else {
      state.customers.push({ id: uid(), name, phone, address, createdAt: today() });
    }
    Data.save(); UI.hideModal(); UI.showToast(id ? 'Customer updated' : 'Customer added', 'success');
    UI.renderAll();
  },

  deleteCustomer(customerId) {
    const c = getCustomer(customerId);
    if (!c) return;
    const rentals = state.rentals.filter(r => r.customerId === customerId);
    const activeRentals = rentals.filter(r => r.status === 'active');
    let msg = `Delete <strong>${escHtml(c.name)}</strong> permanently?`;
    if (rentals.length > 0) {
      msg += `<br><br>This will also delete <strong>${rentals.length} rental(s)</strong>`;
      if (activeRentals.length > 0) msg += ` (<strong>${activeRentals.length} active</strong>)`;
      msg += ` and all related payments.`;
    }
    msg += `<br><br><em style="font-size:.8rem;color:var(--gray-500)">This cannot be undone.</em>`;
    UI.showConfirm(msg, () => {
      const payIds = rentals.map(r => r.id);
      state.payments = state.payments.filter(p => !payIds.includes(p.rentalId));
      state.rentals = state.rentals.filter(r => r.customerId !== customerId);
      state.customers = state.customers.filter(c => c.id !== customerId);
      Data.save(); UI.goBack(); UI.showToast('Customer deleted with all records', 'info');
    });
  },

  /* MODALS - Add/Edit Item */
  showAddItemModal() {
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>Add Item</h2>
      <div class="form-row"><div class="form-group"><label>Type *</label><select id="itemType"><option value="laptop">Laptop</option><option value="desktop">Desktop</option></select></div>
      <div class="form-group"><label>Status</label><select id="itemStatus"><option value="available">Available</option><option value="rented">Rented</option><option value="repair">Under Repair</option></select></div></div>
      <div class="form-group"><label>Brand / Model *</label><input type="text" id="itemBrand" placeholder="e.g. Dell Latitude 3400"></div>
      <div class="form-group"><label>Serial / Asset Tag *</label><input type="text" id="itemSerial" placeholder="Serial number or asset tag"></div>
      <div class="form-actions"><button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button><button class="btn btn-primary" onclick="UI.saveItem()">Save</button></div>`);
    setTimeout(() => document.getElementById('itemBrand').focus(), 300);
  },

  saveItem(id) {
    const type = document.getElementById('itemType').value;
    const brand = document.getElementById('itemBrand').value.trim();
    const serial = document.getElementById('itemSerial').value.trim();
    const status = document.getElementById('itemStatus').value;
    if (!brand || !serial) { UI.showToast('Brand and serial are required', 'error'); return; }
    if (id) {
      const item = getItem(id);
      if (item) { item.type = type; item.brand = brand; item.serial = serial; item.status = status; }
    } else {
      state.items.push({ id: uid(), type, brand, serial, status, createdAt: today() });
    }
    Data.save(); UI.hideModal(); UI.showToast(id ? 'Item updated' : 'Item added', 'success');
    UI.renderAll();
  },

  /* MODALS - Edit/Delete Item */
  showEditItemModal(itemId) {
    const i = getItem(itemId); if (!i) return;
    const isRented = state.rentals.some(r => r.itemId === itemId && isActiveRental(r));
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>Edit Item</h2>
      <div class="form-row"><div class="form-group"><label>Type *</label><select id="itemType"><option value="laptop" ${i.type==='laptop'?'selected':''}>Laptop</option><option value="desktop" ${i.type==='desktop'?'selected':''}>Desktop</option></select></div>
      <div class="form-group"><label>Status</label><select id="itemStatus"><option value="available" ${i.status==='available'?'selected':''}>Available</option><option value="rented" ${i.status==='rented'?'selected':''}>Rented</option><option value="repair" ${i.status==='repair'?'selected':''}>Under Repair</option></select></div></div>
      <div class="form-group"><label>Brand / Model *</label><input type="text" id="itemBrand" value="${escHtml(i.brand)}"></div>
      <div class="form-group"><label>Serial / Asset Tag *</label><input type="text" id="itemSerial" value="${escHtml(i.serial)}"></div>
      <div class="form-actions"><button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button><button class="btn btn-primary" onclick="UI.saveItem('${i.id}')">Update</button></div>
      ${!isRented ? `<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200)"><button class="btn btn-danger btn-block btn-sm" onclick="UI.deleteItem('${i.id}')">Delete Item</button></div>` : ''}
      ${isRented ? `<div style="margin-top:8px;font-size:.8rem;color:var(--gray-500);text-align:center">Cannot delete — item is currently rented.</div>` : ''}`);
  },

  deleteItem(itemId) {
    UI.showConfirm('Delete this item permanently?', () => {
      const isActive = state.rentals.some(r => r.itemId === itemId && isActiveRental(r));
      if (isActive) { UI.showToast('Cannot delete — item is currently rented', 'error'); return; }
      state.items = state.items.filter(i => i.id !== itemId);
      Data.save(); UI.hideModal(); UI.showToast('Item deleted', 'info'); UI.renderAll();
    });
  },

  /* MODALS - New Rental */
  showNewRentalModal(customerId) {
    const availableItems = state.items.filter(i => i.status === 'available');
    const c = getCustomer(customerId);
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>New Rental</h2>
      <div class="form-group"><label>Customer</label><input type="text" value="${escHtml(c ? c.name : '')}" disabled style="background:var(--gray-100)"></div>
      <div class="form-group"><label>Item *</label><select id="rentalItem">${availableItems.length === 0 ? '<option value="">— No available items —</option>' : availableItems.map(i => `<option value="${i.id}">${escHtml(i.brand)} (${i.type} - ${i.serial})</option>`).join('')}</select></div>
      <div class="form-row"><div class="form-group"><label>Rent Amount *</label><input type="number" id="rentalAmount" placeholder="Amount" min="0" step="1"></div>
      <div class="form-group"><label>Billing Cycle</label><select id="rentalCycle" onchange="document.getElementById('customDaysGroup').style.display=this.value==='custom'?'block':'none'"><option value="monthly">Monthly</option><option value="weekly">Weekly</option><option value="custom">Custom Days</option></select></div></div>
      <div class="form-group" id="customDaysGroup" style="display:none"><label>Custom Days</label><input type="number" id="rentalCustomDays" placeholder="Number of days" min="1" step="1"></div>
      <div class="form-group"><label>Start Date *</label><input type="date" id="rentalStart" value="${today()}"></div>
      <div class="form-actions"><button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button><button class="btn btn-primary" onclick="UI.saveNewRental('${customerId}')">Create Rental</button></div>`);
  },

  saveNewRental(customerId) {
    const itemId = document.getElementById('rentalItem').value;
    const amount = parseFloat(document.getElementById('rentalAmount').value);
    const cycle = document.getElementById('rentalCycle').value;
    const customDays = parseInt(document.getElementById('rentalCustomDays').value) || 0;
    const start = document.getElementById('rentalStart').value;
    if (!itemId) { UI.showToast('Please select an item', 'error'); return; }
    if (!amount || amount <= 0) { UI.showToast('Please enter a valid rent amount', 'error'); return; }
    state.rentals.push({ id: uid(), customerId, itemId, rentAmount: amount, billingCycle: cycle, customDays: cycle === 'custom' ? customDays : null, startDate: start, endDate: null, status: 'active', createdAt: today() });
    const item = getItem(itemId);
    if (item) item.status = 'rented';
    Data.save(); UI.hideModal(); UI.showToast('Rental created', 'success');
    UI.renderAll();
  },

  showEditRentalModal(rentalId) {
    const r = getRental(rentalId); if (!r) return;
    const cycle = r.billingCycle;
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>Edit Rental</h2>
      <div class="form-row"><div class="form-group"><label>Rent Amount</label><input type="number" id="rentalAmount" value="${r.rentAmount}" min="0" step="1"></div>
      <div class="form-group"><label>Billing Cycle</label><select id="rentalCycle" onchange="document.getElementById('customDaysGroup').style.display=this.value==='custom'?'block':'none'"><option value="monthly" ${cycle==='monthly'?'selected':''}>Monthly</option><option value="weekly" ${cycle==='weekly'?'selected':''}>Weekly</option><option value="custom" ${cycle==='custom'?'selected':''}>Custom Days</option></select></div></div>
      <div class="form-group" id="customDaysGroup" style="display:${cycle==='custom'?'block':'none'}"><label>Custom Days</label><input type="number" id="rentalCustomDays" value="${r.customDays || ''}"></div>
      <div class="form-actions"><button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button><button class="btn btn-primary" onclick="UI.updateRental('${rentalId}')">Update</button></div>`);
  },

  updateRental(rentalId) {
    const r = getRental(rentalId); if (!r) return;
    const amount = parseFloat(document.getElementById('rentalAmount').value);
    const cycle = document.getElementById('rentalCycle').value;
    const customDays = parseInt(document.getElementById('rentalCustomDays').value) || 0;
    if (!amount || amount <= 0) { UI.showToast('Please enter a valid rent amount', 'error'); return; }
    r.rentAmount = amount; r.billingCycle = cycle; r.customDays = cycle === 'custom' ? customDays : null;
    Data.save(); UI.hideModal(); UI.showToast('Rental updated', 'success'); UI.renderAll();
  },

  /* MODALS - Log Payment */
  showLogPaymentModal(customerId, preSelectedRentalId) {
    const c = getCustomer(customerId);
    const activeRentals = customerActiveRentals(customerId);
    if (activeRentals.length === 0) { UI.showToast('No active rentals for this customer', 'error'); return; }
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>Log Payment</h2>
      <div class="form-group"><label>Customer</label><input type="text" value="${escHtml(c ? c.name : '')}" disabled style="background:var(--gray-100)"></div>
      <div class="form-group"><label>Rental *</label><select id="payRental">${activeRentals.map(r => { const item = getItem(r.itemId); return `<option value="${r.id}" ${preSelectedRentalId === r.id ? 'selected' : ''}>${escHtml(item ? item.brand : 'Unknown')} — ${fmtCurrency(r.rentAmount)}/${r.billingCycle}</option>`; }).join('')}</select></div>
      <div class="form-row"><div class="form-group"><label>Amount *</label><input type="number" id="payAmount" placeholder="Amount" min="0" step="1"></div>
      <div class="form-group"><label>Date *</label><input type="date" id="payDate" value="${today()}"></div></div>
      <div class="form-group"><label>Payment Method (reference only)</label><input type="text" id="payMethod" placeholder="e.g. GPay, cash, UPI"></div>
      <div class="form-group"><label>Remarks (optional)</label><input type="text" id="payRemarks" placeholder="Any notes"></div>
      <div class="form-actions"><button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button><button class="btn btn-primary" onclick="UI.savePayment('${customerId}')">Save Payment</button></div>`);
    setTimeout(() => document.getElementById('payAmount').focus(), 300);
  },

  savePayment(customerId) {
    const rentalId = document.getElementById('payRental').value;
    const amount = parseFloat(document.getElementById('payAmount').value);
    const date = document.getElementById('payDate').value;
    const method = document.getElementById('payMethod').value.trim();
    const remarks = document.getElementById('payRemarks').value.trim();
    if (!rentalId) { UI.showToast('Please select a rental', 'error'); return; }
    if (!amount || amount <= 0) { UI.showToast('Please enter a valid amount', 'error'); return; }
    if (!date) { UI.showToast('Please select a date', 'error'); return; }
    state.payments.push({ id: uid(), rentalId, amount, date, method, remarks, createdAt: today() });
    Data.save(); UI.hideModal(); UI.showToast('Payment logged: ' + fmtCurrency(amount), 'success');
    UI.renderAll();
  },

  showEditPaymentModal(paymentId) {
    const p = state.payments.find(x => x.id === paymentId);
    if (!p) return;
    const r = getRental(p.rentalId);
    const c = r ? getCustomer(r.customerId) : null;
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>Edit Payment</h2>
      <div class="form-group"><label>Customer</label><input type="text" value="${escHtml(c ? c.name : '')}" disabled style="background:var(--gray-100)"></div>
      <div class="form-row"><div class="form-group"><label>Amount *</label><input type="number" id="editPayAmount" value="${p.amount}" min="0" step="1"></div>
      <div class="form-group"><label>Date *</label><input type="date" id="editPayDate" value="${p.date}"></div></div>
      <div class="form-group"><label>Payment Method</label><input type="text" id="editPayMethod" value="${escHtml(p.method || '')}" placeholder="e.g. GPay, cash, UPI"></div>
      <div class="form-group"><label>Remarks</label><input type="text" id="editPayRemarks" value="${escHtml(p.remarks || '')}" placeholder="Any notes"></div>
      <div class="form-actions"><button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button><button class="btn btn-primary" onclick="UI.updatePayment('${paymentId}')">Update Payment</button></div>`);
    setTimeout(() => document.getElementById('editPayAmount').focus(), 300);
  },

  updatePayment(paymentId) {
    const p = state.payments.find(x => x.id === paymentId);
    if (!p) return;
    const amount = parseFloat(document.getElementById('editPayAmount').value);
    const date = document.getElementById('editPayDate').value;
    const method = document.getElementById('editPayMethod').value.trim();
    const remarks = document.getElementById('editPayRemarks').value.trim();
    if (!amount || amount <= 0) { UI.showToast('Please enter a valid amount', 'error'); return; }
    if (!date) { UI.showToast('Please select a date', 'error'); return; }
    p.amount = amount; p.date = date; p.method = method; p.remarks = remarks;
    Data.save(); UI.hideModal(); UI.showToast('Payment updated', 'success');
    UI.renderAll();
  },

  deletePayment(paymentId) {
    UI.showConfirm('Delete this payment record permanently?', () => {
      state.payments = state.payments.filter(p => p.id !== paymentId);
      Data.save(); UI.showToast('Payment deleted', 'info'); UI.renderAll();
    });
  },

  /* MODALS - Close Rental */
  showCloseRentalModal(rentalId) {
    const r = getRental(rentalId); if (!r) return;
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>Close Rental</h2>
      <p style="margin-bottom:12px;color:var(--gray-600)">This will mark the rental as closed and make the item available again.</p>
      <div class="form-group"><label>End Date *</label><input type="date" id="closeEndDate" value="${today()}"></div>
      <div class="form-actions"><button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button><button class="btn btn-danger" onclick="UI.closeRental('${rentalId}')">Close Rental</button></div>`);
  },

  closeRental(rentalId) {
    const r = getRental(rentalId); if (!r) return;
    const endDate = document.getElementById('closeEndDate').value;
    if (!endDate) { UI.showToast('Please select an end date', 'error'); return; }
    if (endDate < r.startDate) { UI.showToast('End date cannot be before start date', 'error'); return; }
    r.status = 'closed'; r.endDate = endDate;
    const item = getItem(r.itemId);
    if (item) item.status = 'available';
    Data.save(); UI.hideModal(); UI.showToast('Rental closed', 'success');
    UI.renderAll();
  },

  toggleNotifications(enabled) {
    notifEnabled = enabled;
    localStorage.setItem('notifEnabled', enabled);
    if (enabled) { requestNotifPermission(); checkAndNotifyDues(); }
    UI.showToast(enabled ? 'Notifications enabled' : 'Notifications disabled', 'info');
  },

  handleImport(input) {
    if (input.files && input.files[0]) {
      UI.showConfirm('Import will replace ALL current data. Continue?', () => { Data.importJSON(input.files[0]); input.value = ''; UI.hideModal(); });
    }
  },

  /* CSV/Excel Bulk Import */
  showBulkImportModal() {
    this.showModal(`<button class="modal-close" onclick="UI.hideModal()">&times;</button><h2>Bulk Import</h2>
      <p style="font-size:.85rem;color:var(--gray-600);margin-bottom:12px">Upload an Excel file (.xlsx/.xls) or paste CSV. First row = column headers. New records are appended.</p>
      <div style="margin-bottom:8px">
        <select id="csvImportType" style="width:100%;padding:8px;border:2px solid var(--gray-200);border-radius:var(--radius);font-size:.9rem">
          <option value="customers">Customers (name, phone, address)</option>
          <option value="items">Items (type, brand, serial)</option>
          <option value="rentals">Rentals (name/brand, rent, cycle, start)</option>
          <option value="combined">Combined Sheet (all-in-one row)</option>
        </select>
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:.85rem;color:var(--gray-600);margin-bottom:10px">
        <input type="checkbox" id="hasHeaders" checked> First row is column headers
      </label>
      <div style="margin-bottom:10px;padding:10px;border:2px dashed var(--gray-300);border-radius:var(--radius);text-align:center;background:var(--gray-50)">
        <label style="display:block;cursor:pointer;font-size:.9rem;color:var(--primary);font-weight:500">
          <input type="file" id="excelFile" accept=".xlsx,.xls,.csv" style="display:none" onchange="UI.handleExcelFile(this)">
          Click to upload Excel (.xlsx) or CSV file
        </label>
        <span id="fileName" style="font-size:.8rem;color:var(--gray-500);display:block;margin-top:4px"></span>
      </div>

      <div class="form-group">
        <label style="font-size:.8rem;color:var(--gray-500)">Or paste CSV below:</label>
        <textarea id="csvInput" rows="5" style="width:100%;padding:10px;border:2px solid var(--gray-200);border-radius:var(--radius);font-size:.85rem;font-family:monospace" placeholder="name,phone,address&#10;Ravi,9876543210,123 Main St"></textarea>
      </div>
      <div class="form-actions">
        <button class="btn btn-outline" onclick="UI.hideModal()">Cancel</button>
        <button class="btn btn-success" onclick="UI.doBulkImport()">Import</button>
      </div>
      <div id="csvResult" style="margin-top:8px;font-size:.85rem"></div>`);
    setTimeout(() => {
      document.getElementById('csvInput').focus();
      document.getElementById('hasHeaders').addEventListener('change', function() {
        /* column mapping UI not yet implemented */
      });
    }, 300);
  },

  handleExcelFile(input) {
    const file = input.files[0];
    if (!file) return;
    document.getElementById('fileName').textContent = 'File: ' + file.name;
    const ext = file.name.split('.').pop().toLowerCase();

      if (ext === 'csv') {
        const reader = new FileReader();
        reader.onload = (e) => { document.getElementById('csvInput').value = e.target.result; };
        reader.readAsText(file);
        return;
      }

      if (typeof XLSX === 'undefined') {
        document.getElementById('csvResult').textContent = 'Loading Excel parser...';
        document.getElementById('csvResult').style.color = 'var(--warning)';
        const script = document.createElement('script');
        script.src = 'https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js';
        script.integrity = 'sha256-YKRCe7Q5zBykzTz5SfXrGyqphozqDx5Kw+SiT1OBmW0=';
        script.crossOrigin = 'anonymous';
        script.onload = () => { UI.handleExcelFile(input); };
        document.body.appendChild(script);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const wb = XLSX.read(e.target.result, { type: 'array' });
          const ws = wb.Sheets[wb.SheetNames[0]];
          const csv = XLSX.utils.sheet_to_csv(ws);
          document.getElementById('csvInput').value = csv;
          const resultEl = document.getElementById('csvResult');
          resultEl.textContent = 'Loaded ' + (csv.split('\n').length - 1) + ' rows from ' + file.name;
          resultEl.style.color = 'var(--success)';
        } catch(err) {
          const resultEl = document.getElementById('csvResult');
          resultEl.textContent = 'Error reading file: ' + err.message;
          resultEl.style.color = 'var(--danger)';
        }
      };
      reader.readAsArrayBuffer(file);
  },

  doBulkImport() {
    const type = document.getElementById('csvImportType').value;
    const hasHeaders = document.getElementById('hasHeaders').checked;
    const raw = document.getElementById('csvInput').value.trim();
    const result = document.getElementById('csvResult');
    if (!raw) { result.textContent = 'Upload an Excel file or paste CSV data first'; result.style.color = 'var(--danger)'; return; }

    try {
      let lines = raw.split('\n').map(l => l.trim()).filter(l => l);
      if (!hasHeaders) {
        /* No header row — generate generic column names and treat all rows as data */
        const colCount = lines[0].split(',').length;
        const headerRow = Array.from({length: colCount}, (_, i) => 'col' + i).join(',');
        lines = [headerRow, ...lines];
      }
      if (lines.length < 2) { result.textContent = 'Need at least a header row + 1 data row'; result.style.color = 'var(--danger)'; return; }

      const rawHeaders = lines[0].split(',').map(h => h.trim());
      const headers = rawHeaders.map(h => h.toLowerCase());

      function col(name) { const idx = headers.indexOf(name.toLowerCase()); return idx >= 0 ? idx : -1; }

      function findCol(aliases) {
        for (const a of aliases) {
          const idx = headers.indexOf(a.toLowerCase());
          if (idx >= 0) return idx;
        }
        for (const a of aliases) {
          const idx = headers.findIndex(h => h.includes(a.toLowerCase()));
          if (idx >= 0) return idx;
        }
        return -1;
      }

      const rows = lines.slice(1).map(line => {
        const vals = parseCSVLine(line);
        const row = {};
        headers.forEach((h, i) => row[h] = vals[i] || '');
        return row;
      });

      let added = 0;

      if (type === 'customers') {
        const nameIdx = findCol(['name', 'customer name', 'customer', 'customer_name']);
        const phoneIdx = findCol(['phone', 'mobile', 'phone number', 'mobile number', 'contact', 'phone_number', 'mobile_number', 'contact number', 'tel', 'telephone']);
        const addrIdx = findCol(['address', 'address/notes', 'notes', 'addr']);

        if (nameIdx < 0) { result.textContent = 'Could not find a "name" column. Expected: name, phone, address'; result.style.color = 'var(--danger)'; return; }
        if (phoneIdx < 0) { result.textContent = 'Could not find a "phone" column. Expected: name, phone, address'; result.style.color = 'var(--danger)'; return; }

        for (const line of lines.slice(1)) {
          const vals = parseCSVLine(line);
          const name = vals[nameIdx] || '';
          const phone = String(vals[phoneIdx] || '').replace(/[^0-9]/g,'');
          const address = addrIdx >= 0 ? (vals[addrIdx] || '') : '';
          if (name && phone) {
            state.customers.push({ id: uid(), name, phone, address, createdAt: today() });
            added++;
          }
        }

      } else if (type === 'items') {
        const typeIdx = findCol(['type', 'item type', 'item_type', 'device type', 'device_type']);
        const brandIdx = findCol(['brand', 'model', 'brand/model', 'brand_model', 'brand model', 'name']);
        const serialIdx = findCol(['serial', 'serial number', 'asset tag', 'serial_number', 'asset_tag', 'sn', 's.no', 'sno']);

        if (typeIdx < 0) { result.textContent = 'Could not find "type" column. Expected: type, brand, serial'; result.style.color = 'var(--danger)'; return; }
        if (brandIdx < 0) { result.textContent = 'Could not find "brand" column. Expected: type, brand, serial'; result.style.color = 'var(--danger)'; return; }
        if (serialIdx < 0) { result.textContent = 'Could not find "serial" column. Expected: type, brand, serial'; result.style.color = 'var(--danger)'; return; }

        for (const line of lines.slice(1)) {
          const vals = parseCSVLine(line);
          const itemType = String(vals[typeIdx] || '').toLowerCase();
          const brand = vals[brandIdx] || '';
          const serial = String(vals[serialIdx] || '');
          if (itemType && brand && serial) {
            state.items.push({ id: uid(), type: itemType, brand, serial, status: 'available', createdAt: today() });
            added++;
          }
        }

      } else if (type === 'rentals') {
        const nameIdx = findCol(['name', 'customer', 'customer name', 'customer_name']);
        const brandIdx = findCol(['brand', 'model', 'item', 'item name', 'item_name']);
        const rentIdx = findCol(['rent', 'rent amount', 'amount', 'rent_amount', 'price']);
        const cycleIdx = findCol(['cycle', 'billing cycle', 'billing_cycle', 'billing']);
        const startIdx = findCol(['start', 'start date', 'start_date', 'from', 'from date']);
        const statusIdx = findCol(['status', 'rental status', 'rental_status']);

        if (nameIdx < 0) { result.textContent = 'Could not find "name" column. Expected: name, rent, brand, start, cycle'; result.style.color = 'var(--danger)'; return; }
        if (rentIdx < 0) { result.textContent = 'Could not find "rent" column. Expected: name, rent, brand, start, cycle'; result.style.color = 'var(--danger)'; return; }

        for (const line of lines.slice(1)) {
          const vals = parseCSVLine(line);
          const custName = vals[nameIdx] || '';
          const rent = parseFloat(vals[rentIdx]);
          if (!custName || !rent) continue;
          const cust = state.customers.find(c => c.name.toLowerCase().includes(custName.toLowerCase()));
          if (!cust) { result.textContent = 'Customer "' + custName + '" not found. Import customers first.'; result.style.color = 'var(--danger)'; return; }
          const itemBrand = brandIdx >= 0 ? (vals[brandIdx] || '') : '';
          const item = itemBrand ? state.items.find(i => i.brand.toLowerCase().includes(itemBrand.toLowerCase())) : null;
          if (item) item.status = 'rented';
          const bc = cycleIdx >= 0 ? (vals[cycleIdx] || '').toLowerCase() : 'monthly';
          const billingCycle = ['weekly', 'monthly', 'custom'].includes(bc) ? bc : 'monthly';
          const startDate = startIdx >= 0 ? (vals[startIdx] || today()) : today();
          const st = statusIdx >= 0 ? (vals[statusIdx] || '').toLowerCase() : 'active';
          state.rentals.push({
            id: uid(), customerId: cust.id, itemId: item ? item.id : '',
            rentAmount: rent, billingCycle, customDays: null,
            startDate, endDate: null, status: st === 'closed' ? 'closed' : 'active', createdAt: today()
          });
          added++;
        }

      } else if (type === 'combined') {
        let nameIdx = findCol(['customer', 'name', 'customer name', 'customer_name']);
        let phoneIdx = findCol(['ph no', 'phone', 'mobile', 'phone number', 'ph_no', 'phno']);
        let startIdx = findCol(['date of given', 'start date', 'date_of_given', 'start', 'from date']);
        let amountIdx = findCol(['amount', 'rent amount', 'rent', 'total']);
        let paidIdx = findCol(['paid amt', 'paid_amount', 'paid', 'paid amount', 'paid_amt']);
        let monthIdx = findCol(['paid for the month of', 'paid_for_month', 'month', 'for month']);
        let paidDateIdx = findCol(['paid date', 'paid_date', 'payment date']);
        let paidToIdx = findCol(['paid to', 'paid_to']);
        let returnedIdx = findCol(['returned/closed/date', 'returned_closed_date', 'returned', 'closed', 'end date']);
        let modelIdx = findCol(['model', 'brand', 'item']);
        let assetIdx = findCol(["asset no's/config", 'asset_config', 'asset', 'asset nos', 'serial']);
        let advanceIdx = findCol(['advance/due', 'advance_due', 'advance', 'due']);
        let dcIdx = findCol(['dc no', 'dc_no', 'dc']);

        /* If header matching failed, use position-based defaults */
        if (nameIdx < 0 || amountIdx < 0) {
          nameIdx = 6; phoneIdx = 1; amountIdx = 4; startIdx = 5;
          paidIdx = 6; monthIdx = 7; paidDateIdx = 8; paidToIdx = 9;
          returnedIdx = 11; modelIdx = 14; assetIdx = 12;
          advanceIdx = 3; dcIdx = 10;
        }

        let custCount = 0, itemCount = 0, rentalCount = 0, paymentCount = 0;

        for (const line of lines.slice(1)) {
          const vals = parseCSVLine(line);
          const custName = vals[nameIdx] || '';
          if (!custName) continue;

          const phone = phoneIdx >= 0 ? String(vals[phoneIdx] || '').replace(/[^0-9]/g,'') : '';

          let cust = state.customers.find(c => c.name.toLowerCase() === custName.toLowerCase());
          if (!cust) {
            cust = { id: uid(), name: custName, phone, address: '', createdAt: today() };
            state.customers.push(cust);
            custCount++;
          } else if (phone && !cust.phone) {
            cust.phone = phone;
          }

          const model = modelIdx >= 0 ? (vals[modelIdx] || '').trim() : '';
          const asset = assetIdx >= 0 ? (vals[assetIdx] || '').trim() : '';
          const serial = asset || 'SN-' + uid().slice(-6);

          let item = null;
          if (model) {
            item = state.items.find(i => i.brand.toLowerCase().includes(model.toLowerCase()) && i.serial === serial);
            if (!item) {
              const itemType = model.toLowerCase().includes('laptop') ? 'laptop' : model.toLowerCase().includes('desktop') ? 'desktop' : 'laptop';
              item = { id: uid(), type: itemType, brand: model, serial, status: 'available', createdAt: today() };
              state.items.push(item);
              itemCount++;
            }
          }

          function parseDateStr(s) {
            if (!s) return '';
            s = String(s).trim();
            if (s.includes('-')) return s;
            const m = s.match(/(\d{1,2})[.\/](\d{1,2})[.\/](\d{2,4})/);
            if (m) {
              const d = m[1].padStart(2,'0'), mo = m[2].padStart(2,'0');
              const y = m[3].length === 2 ? '20' + m[3] : m[3];
              return y + '-' + mo + '-' + d;
            }
            return s;
          }

          const rentVal = parseFloat(vals[amountIdx]) || 0;
          const startDate = startIdx >= 0 ? parseDateStr(vals[startIdx]) || today() : today();
          const returned = returnedIdx >= 0 ? (vals[returnedIdx] || '').trim().toLowerCase() : '';
          const isClosed = returned === 'closed' || returned.includes('closed') || returned.includes('returned');
          const endDate = isClosed ? (returned.split('/').filter(Boolean)[0] || today()) : null;

          if (rentVal > 0 || item) {
            const rental = {
              id: uid(), customerId: cust.id, itemId: item ? item.id : '',
              rentAmount: rentVal, billingCycle: 'monthly', customDays: null,
              startDate, endDate, status: isClosed ? 'closed' : 'active', createdAt: today()
            };
            state.rentals.push(rental);
            rentalCount++;
            if (item && !isClosed) item.status = 'rented';

            const paidAmt = paidIdx >= 0 ? parseFloat(vals[paidIdx]) || 0 : 0;
            const paidDate = paidDateIdx >= 0 ? parseDateStr(vals[paidDateIdx]) || '' : '';
            const paidMonth = monthIdx >= 0 ? (vals[monthIdx] || '') : '';
            const paidTo = paidToIdx >= 0 ? (vals[paidToIdx] || '') : '';
            const dcNo = dcIdx >= 0 ? (vals[dcIdx] || '') : '';

            if (paidAmt > 0 && paidDate) {
              state.payments.push({
                id: uid(), rentalId: rental.id, amount: paidAmt,
                date: paidDate, method: paidTo || 'cash',
                remarks: [paidMonth, dcNo].filter(Boolean).join(' - '), createdAt: today()
              });
              paymentCount++;
            }
          }
        }

        added = custCount + rentalCount + paymentCount;
        result.textContent = 'Imported ' + custCount + ' customers, ' + itemCount + ' items, ' + rentalCount + ' rentals, ' + paymentCount + ' payments';
        result.style.color = 'var(--success)';
      }

      if (added > 0) {
        Data.save();
        result.textContent = 'Imported ' + added + ' ' + type + ' successfully!';
        result.style.color = 'var(--success)';
        UI.renderAll();
        setTimeout(() => UI.hideModal(), 1500);
      } else {
        result.textContent = 'No valid rows found. Check your data.';
        result.style.color = 'var(--warning)';
      }
    } catch(e) {
      result.textContent = 'Error: ' + e.message;
      result.style.color = 'var(--danger)';
    }
  }
};
window.UI = UI;

/* HELPERS */
function escHtml(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }

/* EVENT BINDING */
document.addEventListener('DOMContentLoaded', async () => {
  Auth.restore();

  /* Login */
  document.getElementById('loginBtn').addEventListener('click', async () => {
    const pw = document.getElementById('loginPassword').value;
    document.getElementById('loginBtn').disabled = true;
    document.getElementById('loginBtn').textContent = 'Checking...';
    const ok = await Auth.login(pw);
    document.getElementById('loginBtn').disabled = false;
    document.getElementById('loginBtn').textContent = 'Sign In';
    if (ok) {
      UI.showApp();
      await Data.load();
      setupApp();
    } else {
      document.getElementById('loginError').classList.remove('hidden');
    }
  });
  document.getElementById('loginPassword').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') document.getElementById('loginBtn').click();
  });

  if (Auth.isLoggedIn()) {
    UI.showApp();
    await Data.load();
    setupApp();
  } else {
    UI.showLogin();
  }
});

function setupApp() {
  /* Bottom nav */
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.dataset.page;
      pageStack = [{ page, params: null }];
      UI.navigate(page);
    });
  });

  /* Header back */
  document.getElementById('headerBack').addEventListener('click', () => UI.goBack());

  /* Header settings */
  document.getElementById('headerAction').addEventListener('click', () => { pageStack = [{ page: 'more', params: null }]; UI.navigate('more'); });

  /* FAB for inventory page */
  document.getElementById('fabAdd').addEventListener('click', () => UI.showAddItemModal());

  /* Load dashboard + render initial page */
  Data.loadDashboard().then(() => {
    pageStack = [{ page: 'dashboard', params: null }];
    UI.navigate('dashboard');
  });

  /* Initialize notifications */
  requestNotifPermission();
  checkAndNotifyDues();
  /* Re-check every 5 minutes while app is open */
  setInterval(checkAndNotifyDues, 300000);
}


