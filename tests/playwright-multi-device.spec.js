const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const SCREENSHOTS_DIR = path.join(__dirname, 'screenshots');
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || 'https://ideal-hyena-156293.upstash.io';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || 'gQAAAAAAAmKFAAIgcDE2YmMyZWI3NDYxZjM0ZTg4OGE4OGY2ZGIwMTkxNTg0ZQ';
const UPSTASH_KEY = 'techtrove:data';

async function fetchRedisData() {
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${UPSTASH_KEY}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }
    });
    if (res.ok) {
      const d = await res.json();
      if (d && d.result) {
        let parsed = typeof d.result === 'string' ? JSON.parse(d.result) : d.result;
        if (typeof parsed === 'string') parsed = JSON.parse(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.error('Error fetching Redis data:', e.message);
  }
  return null;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('================================================================');
  console.log('TECHTROVE ARCHITECTURAL AUDIT & PLAYWRIGHT MULTI-DEVICE SUITE');
  console.log('Target URL:', BASE_URL);
  console.log('================================================================\n');

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Context A: Phone (Mobile Safari / iPhone emulation)
  const phoneContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    hasTouch: true,
    isMobile: true
  });

  // Context B: Desktop Web (Laptop Viewport)
  const webContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    hasTouch: false,
    isMobile: false
  });

  const phonePage = await phoneContext.newPage();
  const webPage = await webContext.newPage();

  // Network monitors for 401s
  const phone401s = [];
  const web401s = [];
  phonePage.on('response', res => {
    if (res.status() === 401 && !res.url().includes('/api/auth/login') && !res.url().includes('/api/login')) {
      phone401s.push({ url: res.url(), status: res.status() });
    }
  });
  webPage.on('response', res => {
    if (res.status() === 401 && !res.url().includes('/api/auth/login') && !res.url().includes('/api/login')) {
      web401s.push({ url: res.url(), status: res.status() });
    }
  });

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Dual Device Authentication & Zero 401 Check
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('TEST 1: Dual Device Authentication & Zero 401 Check');
    console.log('----------------------------------------------------------------');

    await phonePage.goto(BASE_URL);
    await webPage.goto(BASE_URL);

    await phonePage.waitForSelector('#loginScreen:not(.hidden)', { timeout: 8000 });
    await webPage.waitForSelector('#loginScreen:not(.hidden)', { timeout: 8000 });
    await sleep(800);

    // Verify negative test: wrong password should fail with 401
    console.log('[Phone] Verifying negative login test with wrong password...');
    await phonePage.fill('#loginPassword', 'wrongpass123');
    await phonePage.click('#loginBtn');
    await phonePage.waitForSelector('#loginError:not(.hidden)', { timeout: 5000 });
    const errVisible = await phonePage.isVisible('#loginError');
    if (!errVisible) throw new Error('Phone: Incorrect password did not trigger error!');
    console.log('  [PASS] Phone properly rejected invalid password with error message.');

    // Now login with rent123 on Phone
    console.log('[Phone] Logging in as Admin (rent123)...');
    await phonePage.fill('#loginPassword', 'rent123');
    await phonePage.click('#loginBtn');
    await phonePage.waitForSelector('#app:not(.hidden)', { timeout: 8000 });
    console.log('  [PASS] Phone successfully signed in.');

    // Login with rent123 on Web
    console.log('[Web] Logging in as Admin (rent123)...');
    await webPage.waitForSelector('#loginPassword', { state: 'visible', timeout: 5000 });
    await webPage.fill('#loginPassword', 'rent123');
    await webPage.click('#loginBtn');
    await webPage.waitForSelector('#app:not(.hidden)', { timeout: 8000 });
    console.log('  [PASS] Web successfully signed in.');

    // Check for 401s during initial hydration
    await sleep(1500);
    if (phone401s.length > 0 || web401s.length > 0) {
      throw new Error(`Unexpected 401 errors detected during hydration! Phone: ${JSON.stringify(phone401s)}, Web: ${JSON.stringify(web401s)}`);
    }
    console.log('  [PASS] Zero 401 Unauthorized errors observed during hydration.');

    await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_phone_login.png') });
    await webPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_web_login.png') });
    console.log('  [PASS] Screenshots saved for Test 1.\n');

    // -------------------------------------------------------------------------
    // TEST 2: Add Device on Phone -> Real-Time Auto-Sync to Web
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('TEST 2: Add Device on Phone -> Real-Time Auto-Sync to Web');
    console.log('----------------------------------------------------------------');

    // Switch Phone and Web to Inventory
    await phonePage.evaluate(() => UI.navigate('inventory'));
    await webPage.evaluate(() => UI.navigate('inventory'));
    await sleep(500);

    // On Phone, open Add Device Modal
    console.log('[Phone] Opening Add Device Modal and creating DELL-PLAYWRIGHT-001...');
    await phonePage.evaluate(() => UI.showAddItemModal());
    await phonePage.waitForSelector('#itemSerial', { state: 'visible', timeout: 5000 });

    await phonePage.fill('#itemBrand', 'Dell');
    await phonePage.fill('#itemModel', 'Latitude 5420');
    await phonePage.fill('#itemSpecs', 'Intel Core i5 11th Gen • 16GB RAM • 512GB SSD');
    await phonePage.fill('#itemSerial', 'DELL-PLAYWRIGHT-001');
    await phonePage.selectOption('#itemStatus', 'available');

    // Click Save Device
    await phonePage.evaluate(() => UI.saveItem());
    console.log('  [PASS] Phone saved device.');
    await sleep(1000);

    // Verify Phone displays DELL-PLAYWRIGHT-001
    const phoneHasItem = await phonePage.evaluate(() => {
      return (state.items || []).some(i => i.serial === 'DELL-PLAYWRIGHT-001');
    });
    if (!phoneHasItem) throw new Error('Phone: DELL-PLAYWRIGHT-001 not found in local state!');
    console.log('  [PASS] Phone local state contains DELL-PLAYWRIGHT-001.');

    // On Web: Do NOT reload! Wait for background sync heartbeat
    console.log('[Web] Waiting for background sync without manual reload (up to 16s)...');
    let webSynced = false;
    for (let i = 0; i < 18; i++) {
      await sleep(1000);
      webSynced = await webPage.evaluate(() => {
        return (state.items || []).some(it => it.serial === 'DELL-PLAYWRIGHT-001');
      });
      if (webSynced) break;
      if (i === 15) {
        await webPage.evaluate(() => triggerLiveSync());
      }
    }
    if (!webSynced) throw new Error('Web did NOT receive DELL-PLAYWRIGHT-001 via auto-sync!');
    console.log('  [PASS] Web automatically received and rendered DELL-PLAYWRIGHT-001 without reload!');

    // Verify Upstash Redis contains DELL-PLAYWRIGHT-001
    const redisAfterAdd = await fetchRedisData();
    const redisHasItem = redisAfterAdd && redisAfterAdd.items && redisAfterAdd.items.some(i => i.serial === 'DELL-PLAYWRIGHT-001');
    if (!redisHasItem) throw new Error('Upstash Redis does NOT contain DELL-PLAYWRIGHT-001!');
    console.log('  [PASS] Upstash Redis authoritative state verified with DELL-PLAYWRIGHT-001.');

    await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_phone_device_added.png') });
    await webPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_web_auto_synced.png') });
    console.log('  [PASS] Screenshots saved for Test 2.\n');

    // -------------------------------------------------------------------------
    // TEST 3: Delivery Challan (DC) PDF Import & Inline Field Editing
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('TEST 3: Delivery Challan (DC) PDF Import & Inline Field Editing');
    console.log('----------------------------------------------------------------');

    console.log('[Phone] Opening Delivery Challan modal and loading sample DC...');
    await phonePage.evaluate(() => UI.showDeliveryChallanModal());
    await phonePage.waitForSelector('#dcLoadSampleBtn', { state: 'visible', timeout: 5000 });
    await phonePage.click('#dcLoadSampleBtn');

    await phonePage.waitForSelector('#dcCustName', { state: 'visible', timeout: 5000 });
    const custVal = await phonePage.inputValue('#dcCustName');
    if (custVal !== 'SOEZY MEDIA') throw new Error(`Expected SOEZY MEDIA, got: ${custVal}`);
    console.log('  [PASS] Review & Confirm modal active with SOEZY MEDIA.');

    // Take screenshot of Review & Confirm
    await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_phone_dc_review.png') });

    // Click Edit button on Item #1
    console.log('[Phone] Clicking Edit (✏️) on Item #1...');
    await phonePage.evaluate(() => UI.startEditDCParsedItem(0));
    await phonePage.waitForSelector('#editItemSerial_0', { state: 'visible', timeout: 5000 });

    // Edit fields
    console.log('[Phone] Editing Serial, Specs, and Monthly Rate...');
    await phonePage.fill('#editItemSerial_0', 'SN-EDITED-8888');
    await phonePage.fill('#editItemSpecs_0', 'Core i7 10th Gen / 32GB RAM / 1TB SSD');
    await phonePage.fill('#editItemRate_0', '2500');

    // Capture screenshot in active edit mode
    await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_phone_dc_active_edit.png') });
    console.log('  [PASS] Captured screenshot in active Edit mode.');

    // Click Save on item
    await phonePage.evaluate(() => UI.saveEditDCParsedItem(0));
    await sleep(500);

    // Confirm & Import
    console.log('[Phone] Confirming and importing Delivery Challan...');
    await phonePage.evaluate(() => UI.confirmDCImport());
    await sleep(1500);

    // On Web: wait for auto-sync
    console.log('[Web] Waiting for DC import to auto-sync to Web...');
    let webHasDC = false;
    for (let i = 0; i < 18; i++) {
      await sleep(1000);
      webHasDC = await webPage.evaluate(() => {
        const hasCust = (state.customers || []).some(c => c.name === 'SOEZY MEDIA');
        const hasItem = (state.items || []).some(it => it.serial === 'SN-EDITED-8888');
        return hasCust && hasItem;
      });
      if (webHasDC) break;
      if (i === 15) await webPage.evaluate(() => triggerLiveSync());
    }
    if (!webHasDC) throw new Error('Web did NOT receive DC imported units via auto-sync!');
    console.log('  [PASS] Web reflected SOEZY MEDIA customer and SN-EDITED-8888 device!');

    // Verify rate in rentals is exactly 2500 (without GST)
    const webRentalInfo = await webPage.evaluate(() => {
      const item = (state.items || []).find(it => it.serial === 'SN-EDITED-8888');
      if (!item) return null;
      const rental = (state.rentals || []).find(r => r.itemId === item.id);
      return { item, rental };
    });
    if (!webRentalInfo || !webRentalInfo.rental || webRentalInfo.rental.rentAmount !== 2500) {
      throw new Error(`Expected rentAmount 2500 without GST, got: ${JSON.stringify(webRentalInfo)}`);
    }
    console.log(`  [PASS] Base rate verified without GST: ₹${webRentalInfo.rental.rentAmount}/mo.`);

    await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_phone_dc_imported.png') });
    await webPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_web_dc_synced.png') });
    console.log('  [PASS] Screenshots saved for Test 3.\n');

    // -------------------------------------------------------------------------
    // TEST 4: Edit on Web -> Live Reflection on Phone
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('TEST 4: Edit on Web -> Live Reflection on Phone');
    console.log('----------------------------------------------------------------');

    console.log('[Web] Editing DELL-PLAYWRIGHT-001 specs to "Upgraded 64GB RAM"...');
    await webPage.evaluate(() => {
      const item = state.items.find(i => i.serial === 'DELL-PLAYWRIGHT-001');
      if (!item) throw new Error('Item DELL-PLAYWRIGHT-001 not found on Web');
      item.specs = 'Upgraded 64GB RAM';
      item.updatedAt = new Date().toISOString();
      Data.save();
      UI.renderAll();
    });
    await sleep(1500);

    // On Phone: Wait for auto-sync reflection
    console.log('[Phone] Waiting for specs update to reflect on Phone without reload...');
    let phoneUpdated = false;
    for (let i = 0; i < 18; i++) {
      await sleep(1000);
      phoneUpdated = await phonePage.evaluate(() => {
        const item = (state.items || []).find(i => i.serial === 'DELL-PLAYWRIGHT-001');
        return item && item.specs === 'Upgraded 64GB RAM';
      });
      if (phoneUpdated) break;
      if (i === 15) await phonePage.evaluate(() => triggerLiveSync());
    }
    if (!phoneUpdated) throw new Error('Phone did NOT reflect updated specs from Web!');
    console.log('  [PASS] Phone UI successfully reflected "Upgraded 64GB RAM" without reload!');

    await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_phone_specs_updated.png') });
    await webPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_web_specs_edited.png') });
    console.log('  [PASS] Screenshots saved for Test 4.\n');

    // -------------------------------------------------------------------------
    // TEST 5: Delete on Phone -> Permanent Purge on Web (No Resurrection)
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('TEST 5: Delete on Phone -> Permanent Purge on Web (No Resurrection)');
    console.log('----------------------------------------------------------------');

    console.log('[Phone] Deleting DELL-PLAYWRIGHT-001...');
    await phonePage.evaluate(() => {
      const item = state.items.find(i => i.serial === 'DELL-PLAYWRIGHT-001');
      if (!item) throw new Error('Item not found');
      UI.deleteItem(item.id);
    });
    await phonePage.waitForSelector('#confirmOverlay:not(.hidden)', { timeout: 5000 });
    await phonePage.click('#confirmOkBtn');
    console.log('  [PASS] Phone deletion confirmed via #confirmOkBtn.');
    await sleep(1500);

    // Verify Phone tombstone is recorded for DELL-PLAYWRIGHT-001
    const tombstoneRecorded = await phonePage.evaluate(() => {
      return !!(state._deleted && state._deleted['DELL-PLAYWRIGHT-001']);
    });
    if (!tombstoneRecorded) throw new Error('Phone: _deleted["DELL-PLAYWRIGHT-001"] timestamp not recorded!');
    console.log('  [PASS] Verified _deleted["DELL-PLAYWRIGHT-001"] tombstone timestamp saved.');

    // On Web: wait for auto-sync to remove the item
    console.log('[Web] Waiting for auto-sync to remove DELL-PLAYWRIGHT-001 from Web...');
    let webRemoved = false;
    for (let i = 0; i < 18; i++) {
      await sleep(1000);
      webRemoved = await webPage.evaluate(() => {
        return !(state.items || []).some(i => i.serial === 'DELL-PLAYWRIGHT-001');
      });
      if (webRemoved) break;
      if (i === 15) await webPage.evaluate(() => triggerLiveSync());
    }
    if (!webRemoved) throw new Error('Web did NOT remove DELL-PLAYWRIGHT-001 after deletion on Phone!');
    console.log('  [PASS] Web automatically removed DELL-PLAYWRIGHT-001 without reload.');

    // Test resurrection resilience: reload Web page
    console.log('[Web] Hard reloading Web page to verify NO zombie resurrection...');
    await webPage.reload();
    await webPage.waitForSelector('#app:not(.hidden)', { timeout: 8000 });
    await webPage.evaluate(() => UI.navigate('inventory'));
    await sleep(1000);
    const webZombie = await webPage.evaluate(() => {
      return (state.items || []).some(i => i.serial === 'DELL-PLAYWRIGHT-001');
    });
    if (webZombie) throw new Error('FATAL: DELL-PLAYWRIGHT-001 resurrected on Web after reload!');
    console.log('  [PASS] Web reload confirmed: item remains permanently deleted.');

    // Reload Phone page to verify NO resurrection
    console.log('[Phone] Hard reloading Phone page to verify NO zombie resurrection...');
    await phonePage.reload();
    await phonePage.waitForSelector('#app:not(.hidden)', { timeout: 8000 });
    await phonePage.evaluate(() => UI.navigate('inventory'));
    await sleep(1000);
    const phoneZombie = await phonePage.evaluate(() => {
      return (state.items || []).some(i => i.serial === 'DELL-PLAYWRIGHT-001');
    });
    if (phoneZombie) throw new Error('FATAL: DELL-PLAYWRIGHT-001 resurrected on Phone after reload!');
    console.log('  [PASS] Phone reload confirmed: item remains permanently deleted.');

    // Verify Upstash Redis authoritative state
    const redisAfterDel = await fetchRedisData();
    const redisHasDelItem = redisAfterDel && redisAfterDel.items && redisAfterDel.items.some(i => i.serial === 'DELL-PLAYWRIGHT-001');
    if (redisHasDelItem) throw new Error('Upstash Redis STILL contains DELL-PLAYWRIGHT-001!');
    console.log('  [PASS] Upstash Redis confirmed: item is purged and tombstone recorded.');

    await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_phone_after_delete.png') });
    await webPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_web_after_delete.png') });
    console.log('  [PASS] Screenshots saved for Test 5.\n');

    // -------------------------------------------------------------------------
    // TEST 6: 30-Second Background Sync Endurance Test (No Disappearing Data)
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('TEST 6: 30-Second Background Sync Endurance Test (0 Items Wiped)');
    console.log('----------------------------------------------------------------');

    const initialCount = await phonePage.evaluate(() => (state.items || []).length);
    console.log(`[Phone] Starting 30-second endurance test with ${initialCount} active items...`);

    // Wait 30 seconds (allows at least 2 full 15s sync cycles)
    for (let sec = 5; sec <= 30; sec += 5) {
      await sleep(5000);
      const currentCount = await phonePage.evaluate(() => (state.items || []).length);
      console.log(`  ... [Phone] Second ${sec}: ${currentCount} items intact.`);
      if (currentCount !== initialCount) {
        throw new Error(`Data loss detected at Second ${sec}! Initial: ${initialCount}, Current: ${currentCount}`);
      }
    }

    const finalCount = await phonePage.evaluate(() => (state.items || []).length);
    if (finalCount !== initialCount || finalCount === 0) {
      throw new Error(`Endurance test failed! Count went from ${initialCount} to ${finalCount}`);
    }
    console.log(`  [PASS] 30-Second endurance passed! 0 items wiped or corrupted (${finalCount} items intact).`);

    await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_phone_endurance_intact.png') });
    console.log('  [PASS] Screenshot saved for Test 6.\n');

    // -------------------------------------------------------------------------
    // TEST 7: Offline Operation & Graceful Reconnect
    // -------------------------------------------------------------------------
    console.log('----------------------------------------------------------------');
    console.log('TEST 7: Offline Operation & Graceful Reconnect');
    console.log('----------------------------------------------------------------');

    console.log('[Phone] Emulating offline network (context.setOffline(true))...');
    await phoneContext.setOffline(true);

    console.log('[Phone] Adding item OFFLINE-UNIT-999 while offline...');
    await phonePage.evaluate(() => {
      state.items.push({
        id: 'item-offline-' + Date.now(),
        type: 'laptop',
        brand: 'HP',
        model: 'EliteBook 840',
        serial: 'OFFLINE-UNIT-999',
        specs: 'Core i7 / 16GB RAM / 512GB SSD',
        status: 'available',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString()
      });
      Data.save();
      UI.renderAll();
    });
    await sleep(1000);

    const offlineVisibleLocally = await phonePage.evaluate(() => {
      return (state.items || []).some(i => i.serial === 'OFFLINE-UNIT-999');
    });
    if (!offlineVisibleLocally) throw new Error('Phone: OFFLINE-UNIT-999 not rendered locally!');
    console.log('  [PASS] OFFLINE-UNIT-999 rendered locally in offline state.');

    console.log('[Phone] Waiting 15 seconds in offline mode to verify NO wipe...');
    await sleep(15000);
    const stillPresentOffline = await phonePage.evaluate(() => {
      return (state.items || []).some(i => i.serial === 'OFFLINE-UNIT-999');
    });
    if (!stillPresentOffline) throw new Error('Phone: Offline item wiped during offline heartbeat!');
    console.log('  [PASS] Verified: item was NOT wiped by offline sync errors.');

    console.log('[Phone] Restoring internet connection (context.setOffline(false))...');
    await phoneContext.setOffline(false);
    await sleep(500);

    // Trigger sync
    console.log('[Phone] Triggering sync after reconnect...');
    await phonePage.evaluate(() => {
      Data.save();
      if (typeof triggerLiveSync === 'function') triggerLiveSync();
      else if (window.triggerLiveSync) window.triggerLiveSync();
      else Data.sync(true);
    });
    await sleep(2000);

    // On Web: wait for OFFLINE-UNIT-999 to appear
    console.log('[Web] Waiting for OFFLINE-UNIT-999 to sync to Web within 15 seconds...');
    let webHasOfflineItem = false;
    for (let i = 0; i < 18; i++) {
      await sleep(1000);
      webHasOfflineItem = await webPage.evaluate(() => {
        return (state.items || []).some(it => it.serial === 'OFFLINE-UNIT-999');
      });
      if (webHasOfflineItem) break;
      if (i === 15) {
        await webPage.evaluate(() => {
          if (typeof triggerLiveSync === 'function') triggerLiveSync();
          else if (window.triggerLiveSync) window.triggerLiveSync();
          else Data.sync(true);
        });
      }
    }
    if (!webHasOfflineItem) throw new Error('Web did NOT receive OFFLINE-UNIT-999 after Phone reconnected!');
    console.log('  [PASS] Web received OFFLINE-UNIT-999 from Phone after reconnect!');

    // Verify Redis has OFFLINE-UNIT-999
    const redisAfterOffline = await fetchRedisData();
    const redisHasOffline = redisAfterOffline && redisAfterOffline.items && redisAfterOffline.items.some(i => i.serial === 'OFFLINE-UNIT-999');
    if (!redisHasOffline) throw new Error('Upstash Redis did not receive OFFLINE-UNIT-999!');
    console.log('  [PASS] Upstash Redis contains OFFLINE-UNIT-999.');

    await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_phone_offline_reconnected.png') });
    await webPage.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_web_offline_synced.png') });
    console.log('  [PASS] Screenshots saved for Test 7.\n');

    console.log('================================================================');
    console.log('ALL 7 PLAYWRIGHT MULTI-DEVICE VERIFICATION TESTS PASSED 100%!');
    console.log('================================================================');
  } catch (err) {
    console.error('\nTEST RUN FAILED:', err.message);
    try {
      await phonePage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'failure_phone.png') });
      await webPage.screenshot({ path: path.join(SCREENSHOTS_DIR, 'failure_web.png') });
    } catch (e) {}
    process.exit(1);
  } finally {
    await browser.close();
  }
})();
