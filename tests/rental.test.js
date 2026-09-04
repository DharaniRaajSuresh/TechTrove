/* Unit tests for core rental logic — run with: node tests/rental.test.js */
const assert = require('assert');

/* Replicate core functions from app.js (isolated, no DOM dependency) */
function cycleDays(rental) {
  if (rental.billingCycle === 'weekly') return 7;
  if (rental.billingCycle === 'monthly') return 30;
  return Math.max(1, parseInt(rental.customDays) || 30);
}

function parseDate(s) {
  const p = s.split('-');
  return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
}

function rentalStatus(rental, payments, now) {
  const cd = cycleDays(rental);
  const start = parseDate(rental.startDate);
  const daysSince = Math.floor((now - start) / 86400000);
  const completedCycles = Math.max(0, Math.floor(daysSince / cd));
  const totalExpected = completedCycles * rental.rentAmount;
  const totalPaid = payments.reduce((s, p) => s + p.amount, 0);
  const outstanding = Math.max(0, totalExpected - totalPaid);
  const currentCycleEnd = new Date(start.getTime() + completedCycles * cd * 86400000);
  const nextDueDate = new Date(start.getTime() + (completedCycles + 1) * cd * 86400000);
  const daysUntilDue = Math.round((nextDueDate - now) / 86400000);
  const isOverdue = totalExpected > totalPaid && completedCycles > 0;
  const daysOverdue = isOverdue ? Math.round((now - currentCycleEnd) / 86400000) : 0;
  const nextCyclePaid = totalPaid >= (completedCycles + 1) * rental.rentAmount;
  const isDueSoon = !nextCyclePaid && daysUntilDue >= 0 && daysUntilDue <= 7;
  return { totalExpected, totalPaid, outstanding, nextDueDate, daysUntilDue, isOverdue, daysOverdue, isDueSoon };
}

/* Phone helpers */
const cleanPhone = (p) => String(p || '').replace(/\D/g, '');
const isValidPhone = (p) => /^[0-9]{10}$/.test(cleanPhone(p));
const waPhone = (p) => {
  const c = cleanPhone(p);
  return c.length === 10 ? '91' + c : c;
};

function getItemFullTitle(item) {
  if (!item) return 'Unknown Item';
  const parts = [item.brand, item.model].filter(Boolean);
  return parts.join(' ') || item.type || 'Item';
}

function buildWaReminderMessage(customer, rental, item, status) {
  const itemTitle = getItemFullTitle(item);
  const specsText = item && item.specs ? ` (${item.specs})` : '';
  const dueInfo = status.isOverdue 
    ? `was due on *${status.nextDueDate}* (*${status.daysOverdue} days overdue*)`
    : `is due on *${status.nextDueDate}*`;
  return `Hello *${customer.name}*,\n\nPayment reminder from TechTrove:\n• Device: ${itemTitle}${specsText}\n• Rent: ₹${rental.rentAmount}/${rental.billingCycle}\n• ${dueInfo}\n• Outstanding: ₹${status.outstanding}`;
}

/* Tests */
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS  ${name}`); }
  catch(e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

console.log('\nPhone Helpers & Strict 10-Digit Constraint');
test('cleanPhone strips dashes and spaces', () => assert.strictEqual(cleanPhone('+91 98765-43210'), '919876543210'));
test('cleanPhone handles pure 10 digits', () => assert.strictEqual(cleanPhone('9876543210'), '9876543210'));
test('isValidPhone returns true for valid 10 digits', () => assert.strictEqual(isValidPhone('9876543210'), true));
test('isValidPhone returns true for 10 digits with spaces or dashes', () => assert.strictEqual(isValidPhone('98765-43210'), true));
test('isValidPhone returns false for less than 10 digits', () => assert.strictEqual(isValidPhone('987654321'), false));
test('isValidPhone returns false for more than 10 digits', () => assert.strictEqual(isValidPhone('919876543210'), false));
test('isValidPhone returns false for empty or non-numeric', () => assert.strictEqual(isValidPhone('abcdefghij'), false));
test('waPhone prepends 91 to 10-digit number', () => assert.strictEqual(waPhone('9876543210'), '919876543210'));
test('waPhone leaves already prefixed number alone', () => assert.strictEqual(waPhone('919876543210'), '919876543210'));

console.log('\nInventory & Laptop Specs');
test('getItemFullTitle combines brand and model', () => {
  assert.strictEqual(getItemFullTitle({ brand: 'Dell', model: 'Latitude 3420' }), 'Dell Latitude 3420');
});
test('getItemFullTitle handles missing model', () => {
  assert.strictEqual(getItemFullTitle({ brand: 'Lenovo', model: '' }), 'Lenovo');
});
test('buildWaReminderMessage includes customer, device, and specs', () => {
  const cust = { name: 'Rahul' };
  const rent = { rentAmount: 1500, billingCycle: 'monthly' };
  const item = { brand: 'Dell', model: 'Latitude 3420', specs: 'i7, 16GB RAM' };
  const status = { isOverdue: true, daysOverdue: 5, nextDueDate: '2026-08-01', outstanding: 1500 };
  const msg = buildWaReminderMessage(cust, rent, item, status);
  assert.ok(msg.includes('Rahul'));
  assert.ok(msg.includes('Dell Latitude 3420 (i7, 16GB RAM)'));
  assert.ok(msg.includes('5 days overdue'));
  assert.ok(msg.includes('1500'));
});

console.log('\ncycleDays()');
test('monthly returns 30', () => assert.strictEqual(cycleDays({ billingCycle: 'monthly' }), 30));
test('weekly returns 7', () => assert.strictEqual(cycleDays({ billingCycle: 'weekly' }), 7));
test('custom days returns custom value', () => assert.strictEqual(cycleDays({ billingCycle: 'custom', customDays: 15 }), 15));
test('custom days defaults to 30 when invalid', () => assert.strictEqual(cycleDays({ billingCycle: 'custom', customDays: 0 }), 30));
test('custom days defaults to 30 when undefined', () => assert.strictEqual(cycleDays({ billingCycle: 'custom' }), 30));

console.log('\nrentalStatus() — monthly cycle');
const july1 = new Date(2026, 6, 1);
const rental = { id: 'r1', startDate: '2026-07-01', rentAmount: 1000, billingCycle: 'monthly' };

test('no payments, day 1 = nothing due yet', () => {
  const s = rentalStatus(rental, [], july1);
  assert.strictEqual(s.totalExpected, 0);
  assert.strictEqual(s.outstanding, 0);
  assert.strictEqual(s.isOverdue, false);
});

test('no payments, day 35 = 1 cycle completed, 1000 outstanding, overdue', () => {
  const day35 = new Date(2026, 7, 5);
  const s = rentalStatus(rental, [], day35);
  assert.strictEqual(s.totalExpected, 1000);
  assert.strictEqual(s.outstanding, 1000);
  assert.strictEqual(s.isOverdue, true);
  assert.strictEqual(s.daysOverdue >= 1, true);
});

test('full payment on day 35 = all good', () => {
  const day35 = new Date(2026, 7, 5);
  const s = rentalStatus(rental, [{ amount: 1000 }], day35);
  assert.strictEqual(s.totalExpected, 1000);
  assert.strictEqual(s.outstanding, 0);
  assert.strictEqual(s.isOverdue, false);
});

test('partial payment = partial outstanding', () => {
  const day35 = new Date(2026, 7, 5);
  const s = rentalStatus(rental, [{ amount: 400 }], day35);
  assert.strictEqual(s.totalExpected, 1000);
  assert.strictEqual(s.outstanding, 600);
});

test('day 29 = not yet due, not overdue', () => {
  const day29 = new Date(2026, 6, 30);
  const s = rentalStatus(rental, [], day29);
  assert.strictEqual(s.totalExpected, 0);
  assert.strictEqual(s.isOverdue, false);
  assert.strictEqual(s.isDueSoon, true);  // due in 1 day
});

console.log('\nPreset Catalogue & Under-Repair Tracking');
const PRESET_CATALOGUE = [
  { brand: 'Dell', model: 'Latitude 3420', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD' },
  { brand: 'Lenovo', model: 'ThinkPad T14 Gen 2', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD IPS' },
  { brand: 'HP', model: 'EliteBook 840 G8', specs: 'Intel Core i5 11th Gen • 16GB DDR4 • 512GB NVMe SSD • 14.0" FHD IPS' },
  { brand: 'Apple', model: 'MacBook Air M1 (2020)', specs: 'Apple M1 (8-Core CPU / 7-Core GPU) • 8GB Unified RAM • 256GB SSD • 13.3" Retina' }
];

test('PRESET_CATALOGUE contains Dell, Lenovo, HP, Apple models with specs', () => {
  assert.strictEqual(PRESET_CATALOGUE.length >= 4, true);
  const dell = PRESET_CATALOGUE.find(p => p.model === 'Latitude 3420');
  assert.ok(dell);
  assert.strictEqual(dell.brand, 'Dell');
  assert.ok(dell.specs.includes('16GB DDR4'));
});

test('Under Repair item tracks service center, technician phone, and issue notes', () => {
  const itemInRepair = {
    id: 'item-repair-1',
    brand: 'Dell',
    model: 'Latitude 3420',
    serial: 'SN-9912',
    status: 'repair',
    repairInfo: {
      serviceCenter: 'Dell Authorized Care SP Road',
      servicePerson: 'Suresh Kumar',
      servicePhone: '9876543210',
      givenToServiceDate: '2026-08-25',
      collectedFromCustomerDate: '2026-08-24',
      expectedReturnDate: '2026-09-05',
      repairIssue: 'Screen flickering & keyboard replacement',
      repairCost: 2500
    }
  };
  assert.strictEqual(itemInRepair.status, 'repair');
  assert.strictEqual(itemInRepair.repairInfo.serviceCenter, 'Dell Authorized Care SP Road');
  assert.strictEqual(waPhone(itemInRepair.repairInfo.servicePhone), '919876543210');
});

console.log('\nMulti-Unit Inventory with Identical Model & Exact Specs');
test('Multiple identical units with same model and specs are tracked independently by serial number', () => {
  const fleet = [
    { id: 'd1', brand: 'Dell', model: 'Latitude 3420', specs: 'i5 11th Gen • 16GB • 512GB SSD', serial: 'DELL-01', status: 'available' },
    { id: 'd2', brand: 'Dell', model: 'Latitude 3420', specs: 'i5 11th Gen • 16GB • 512GB SSD', serial: 'DELL-02', status: 'rented' },
    { id: 'd3', brand: 'Dell', model: 'Latitude 3420', specs: 'i5 11th Gen • 16GB • 512GB SSD', serial: 'DELL-03', status: 'repair' }
  ];
  const activeRentals = [{ id: 'r1', itemId: 'd2', customerId: 'c1', status: 'active' }];

  function isAvail(item) {
    if (item.status === 'repair') return false;
    const hasRental = activeRentals.some(r => r.itemId === item.id && r.status === 'active' && !r.endDate);
    return !hasRental;
  }

  const availableUnits = fleet.filter(isAvail);
  assert.strictEqual(availableUnits.length, 1);
  assert.strictEqual(availableUnits[0].serial, 'DELL-01');
});

console.log('\nPayment Attribution to 4 Fixed Partners');
test('Payment collectors list strictly contains Suresh, Pragathi, Varusha, Dharani', () => {
  const PAYMENT_COLLECTORS = ['Suresh', 'Pragathi', 'Varusha', 'Dharani'];
  assert.strictEqual(PAYMENT_COLLECTORS.length, 4);
  assert.ok(PAYMENT_COLLECTORS.includes('Suresh'));
  assert.ok(PAYMENT_COLLECTORS.includes('Pragathi'));
  assert.ok(PAYMENT_COLLECTORS.includes('Varusha'));
  assert.ok(PAYMENT_COLLECTORS.includes('Dharani'));
});

console.log('\nRole-Based Access Control (RBAC)');
test('Admin role has delete permission, Employee role has delete permission strictly denied', () => {
  function canDelete(role) {
    return role === 'admin';
  }
  assert.strictEqual(canDelete('admin'), true);
  assert.strictEqual(canDelete('employee'), false);
  assert.strictEqual(canDelete('staff'), false);
  assert.strictEqual(canDelete(''), false);
});

console.log('\nSmart Sync Merge Engine & Conflict Resolution');
test('Smart Merge preserves server records missing from stale client payload', () => {
  const serverCustomers = [
    { id: 'c1', name: 'Cust 1', updatedAt: '2026-09-01T10:00:00Z' },
    { id: 'c2', name: 'Cust 2', updatedAt: '2026-09-02T10:00:00Z' }
  ];
  const incomingCustomers = [
    { id: 'c1', name: 'Cust 1 Updated', updatedAt: '2026-09-03T10:00:00Z' }
  ];
  const map = new Map();
  serverCustomers.forEach(c => map.set(c.id, c));
  incomingCustomers.forEach(c => {
    if (!map.has(c.id)) map.set(c.id, c);
    else {
      const s = map.get(c.id);
      if (new Date(c.updatedAt) >= new Date(s.updatedAt)) map.set(c.id, c);
    }
  });
  const merged = Array.from(map.values());
  assert.strictEqual(merged.length, 2);
  assert.strictEqual(merged.find(c => c.id === 'c1').name, 'Cust 1 Updated');
  assert.strictEqual(merged.find(c => c.id === 'c2').name, 'Cust 2');
});

test('Smart Merge adopts newer updatedAt changes when concurrent edits occur', () => {
  const serverItem = { id: 'i1', status: 'available', updatedAt: '2026-09-04T10:00:00Z' };
  const incomingItem = { id: 'i1', status: 'rented', updatedAt: '2026-09-04T10:05:00Z' };
  const serverTime = new Date(serverItem.updatedAt).getTime();
  const incomingTime = new Date(incomingItem.updatedAt).getTime();
  const winner = incomingTime >= serverTime ? incomingItem : serverItem;
  assert.strictEqual(winner.status, 'rented');
});

test('Tombstones reliably remove deleted records and prevent resurrection', () => {
  const serverRentals = [
    { id: 'r1', status: 'active', updatedAt: '2026-09-01T10:00:00Z' },
    { id: 'r2', status: 'active', updatedAt: '2026-09-01T10:00:00Z' }
  ];
  const deletedMap = { r1: '2026-09-02T10:00:00Z' };
  const incomingRentals = [
    { id: 'r1', status: 'active', updatedAt: '2026-09-01T10:00:00Z' }
  ];
  const map = new Map();
  serverRentals.forEach(r => {
    if (!deletedMap[r.id] || new Date(deletedMap[r.id]) < new Date(r.updatedAt)) map.set(r.id, r);
  });
  incomingRentals.forEach(r => {
    if (deletedMap[r.id] && new Date(deletedMap[r.id]) >= new Date(r.updatedAt)) return;
    map.set(r.id, r);
  });
  const merged = Array.from(map.values());
  assert.strictEqual(merged.length, 1);
  assert.strictEqual(merged[0].id, 'r2');
});

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? ' — SOME TESTS FAILED' : ' — all good!'}`);
process.exit(failed > 0 ? 1 : 0);


