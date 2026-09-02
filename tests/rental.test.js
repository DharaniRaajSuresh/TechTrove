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

console.log('\nPhone Helpers');
test('cleanPhone strips dashes and spaces', () => assert.strictEqual(cleanPhone('+91 98765-43210'), '919876543210'));
test('cleanPhone handles pure 10 digits', () => assert.strictEqual(cleanPhone('9876543210'), '9876543210'));
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

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? ' — SOME TESTS FAILED' : ' — all good!'}`);
process.exit(failed > 0 ? 1 : 0);


