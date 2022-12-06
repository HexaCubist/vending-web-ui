import { env } from '$env/dynamic/private';
import { Client } from 'redis-om';
import { Entity, Schema, Repository } from 'redis-om';
import type Stripe from 'stripe';
import type { QueueItem } from '$lib/queueManager';

let client = await new Client().open(env.REDIS_URL);

interface Purchase {
	product_id: string;
	shelf_loc: number;
	quantity: number;
}

class Purchase extends Entity {}

const purchaseSchema = new Schema(Purchase, {
	product_id: { type: 'string', caseSensitive: true },
	shelf_loc: { type: 'number' },
	quantity: { type: 'number' }
});

const purchaseRepository = client.fetchRepository(purchaseSchema);
purchaseRepository.createIndex();

export const ttlInSeconds = 2 * 60 * 60; // 2 hours
export const maxItems = 1000;

export async function getFreeQueue(): Promise<QueueItem[]> {
	const queueItems = await purchaseRepository.search().return.all();
	return queueItems.map((item) => ({
		id: item.entityId,
		product_id: item.product_id,
		shelf_loc: item.shelf_loc,
		quantity: item.quantity,
		free: true
	}));
}

export async function addFreeQueueItem(product: Stripe.Product): Promise<void> {
	const purchase = await purchaseRepository.createAndSave({
		product_id: product.id,
		shelf_loc: parseInt(product.metadata.shelf_loc),
		quantity: 1
	});
	await purchaseRepository.expire(purchase.entityId, ttlInSeconds);
}

export async function removeFreeQueueItem(paymentIntentId: string): Promise<void> {
	await purchaseRepository.remove(paymentIntentId);
}
