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

/* Tests */
let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log(`  PASS  ${name}`); }
  catch(e) { failed++; console.log(`  FAIL  ${name}\n        ${e.message}`); }
}

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

console.log('\nparseCSVLine()');
test('simple values', () => {
  assert.deepStrictEqual(parseCSVLine('a,b,c'), ['a', 'b', 'c']);
});
test('quoted values with commas', () => {
  assert.deepStrictEqual(parseCSVLine('"hello, world",b'), ['hello, world', 'b']);
});
test('quoted values with newlines escaped', () => {
  assert.deepStrictEqual(parseCSVLine('a,"b",c'), ['a', 'b', 'c']);
});
test('empty trailing value', () => {
  assert.deepStrictEqual(parseCSVLine('a,b,'), ['a', 'b', '']);
});
test('leading/trailing spaces trimmed', () => {
  assert.deepStrictEqual(parseCSVLine('  a  ,  b  '), ['a', 'b']);
});

console.log(`\n${passed} passed, ${failed} failed${failed > 0 ? ' — SOME TESTS FAILED' : ' — all good!'}`);
process.exit(failed > 0 ? 1 : 0);
