/**
 * Mock ESP for local testing. No physical hardware required.
 * Run from vending-ui/:  node scripts/mock-esp.js
 *
 * Flags:
 *   --slow           30s per dispense (simulates slow Uno)
 *   --skip-complete  Dispense but never call /complete (simulates ESP
 *                    crashing post-dispense — auth expires, customer refunded)
 *   --refuse         Don't dispense at all (simulates Uno unplugged)
 *   --verbose        Log every poll
 */

const SERVER = process.env.SERVER ?? 'http://localhost:5173';
const API_KEY = process.env.API_KEY ?? 'dev-api-key-doesnt-matter-locally';
const POLL_INTERVAL_MS = 5000;

const SIM = {
  slow: process.argv.includes('--slow'),
  skipComplete: process.argv.includes('--skip-complete'),
  refuseDispense: process.argv.includes('--refuse'),
  verbose: process.argv.includes('--verbose')
};

async function fetchQueue() {
  const res = await fetch(`${SERVER}/api/auth/queue`, {
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  if (!res.ok) {
    console.error(`✗ Queue fetch failed: ${res.status} ${await res.text()}`);
    return [];
  }
  return await res.json();
}

async function complete(id) {
  const res = await fetch(`${SERVER}/api/auth/complete/${id}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}` }
  });
  if (!res.ok) {
    console.error(`✗ /complete failed for ${id}: ${res.status}`);
    return false;
  }
  console.log(`  ✓ /complete → ${JSON.stringify(await res.json())}`);
}

async function dispense(item) {
  console.log(`→ Dispensing shelf ${item.shelf_loc} (PI ${item.id})`);
  if (SIM.refuseDispense) { console.log('  [SIM] Refusing'); return false; }
  await new Promise(r => setTimeout(r, SIM.slow ? 30000 : 1500));
  return true;
}

let busy = false;
async function tick() {
  if (busy) return;
  busy = true;
  try {
    const queue = await fetchQueue();
    if (queue.length === 0) {
      if (SIM.verbose) console.log('. queue empty');
      return;
    }
    console.log(`Queue: ${queue.length} item(s)`);
    for (const item of queue) {
      if (!(await dispense(item))) continue;
      if (SIM.skipComplete) { console.log('  [SIM] Skipping /complete'); continue; }
      await complete(item.id);
    }
  } finally { busy = false; }
}

console.log(`Mock ESP → ${SERVER} | Flags:`, SIM);
setInterval(() => tick().catch(console.error), POLL_INTERVAL_MS);
tick().catch(console.error);