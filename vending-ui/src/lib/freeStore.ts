import { env } from '$env/dynamic/private';
import { createClient } from 'redis';
import { Repository, Schema } from 'redis-om';
import type Stripe from 'stripe';
import type { QueueItem } from '$lib/queueManager';
import { EntityId } from 'redis-om';

const redis = createClient({
	url: env.REDIS_URL
});
try {
	await redis.connect();
} catch (err) {
	console.log('Redis Connection Error', err);
}

const purchaseSchema = new Schema('Purchase', {
	product_id: { type: 'string', caseSensitive: true },
	shelf_loc: { type: 'number' },
	quantity: { type: 'number' }
});

const purchaseRepository = new Repository(purchaseSchema, redis);
purchaseRepository.createIndex();

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
