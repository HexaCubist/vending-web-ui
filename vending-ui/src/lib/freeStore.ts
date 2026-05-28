import { env } from '$env/dynamic/private';
import { createClient } from 'redis';
import { Repository, Schema } from 'redis-om';
import type Stripe from 'stripe';
import type { QueueItem } from '$lib/queueManager';
import { EntityId } from 'redis-om';

const redis = createClient({
	url: env.REDIS_URL,
	socket: {
		// Without a reconnect strategy, a Redis blip permanently breaks the
		// connection until the Node process restarts.
		reconnectStrategy: (retries) => Math.min(retries * 100, 3000)
	}
});

// Surface async client errors instead of letting them go to default handling
// (which on Node 18 can crash the process).
redis.on('error', (err) => {
	console.error('Redis client error:', err);
});

try {
	await redis.connect();
} catch (err) {
	// Don't crash module init — the reconnect strategy above will keep trying.
	console.error('Initial Redis connection failed (will keep retrying):', err);
}

const purchaseSchema = new Schema('Purchase', {
	product_id: { type: 'string', caseSensitive: true },
	shelf_loc: { type: 'number' },
	quantity: { type: 'number' }
});

const purchaseRepository = new Repository(purchaseSchema, redis);

// createIndex is async; if Redis is down at boot, swallow it so the module can
// still be imported. It'll get created on the next successful call.
purchaseRepository.createIndex().catch((err) => {
	console.error('Failed to create Redis index on startup:', err);
});

export const ttlInSeconds = 2 * 60 * 60; // 2 hours
export const maxItems = 1000;

export async function getFreeQueue(): Promise<QueueItem[]> {
	const queueItems = await purchaseRepository.search().return.all();
	return queueItems.map(
		(item) =>
			({
				id: item[EntityId],
				product_id: item.product_id,
				shelf_loc: item.shelf_loc,
				quantity: item.quantity,
				free: true
			} as QueueItem)
	);
}

export async function addFreeQueueItem(product: Stripe.Product): Promise<void> {
	const purchase = await purchaseRepository.save({
		product_id: product.id,
		shelf_loc: parseInt(product.metadata.shelf_loc),
		quantity: 1
	});
	console.log('Added free queue item', purchase[EntityId]);
	if (purchase[EntityId] && typeof purchase[EntityId] === 'string') {
		await purchaseRepository.expire(purchase[EntityId], ttlInSeconds);
	}
}

export async function removeFreeQueueItem(paymentIntentId: string): Promise<void> {
	await purchaseRepository.remove(paymentIntentId);
}