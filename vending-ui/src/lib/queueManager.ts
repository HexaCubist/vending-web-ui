import Stripe from 'stripe';
import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getFreeQueue, removeFreeQueueItem } from './freeStore';

export interface QueueItem {
	shelf_loc: number;
	product_id: string;
	id: string;
	status?: string;
	quantity?: number;
	vendable?: boolean;
	product_name?: string;
	free: boolean;
}

export const getQueue = async (STRIPE_KEY: string): Promise<QueueItem[]> => {
	const stripe = new Stripe(env.STRIPE_KEY, {
		apiVersion: '2022-11-15'
	});

	// Switched to list to ensure we get all pending payments (searching takes a while to index new items)
	let paymentIntents = await stripe.paymentIntents.list({
		limit: 100
	});
	// let paymentIntents = await stripe.paymentIntents.search({
	// 	query: `status:'requires_capture' AND metadata['vendable']:'true'`
	// });

	// Filter out recently completed payments
	let pendingPayments = paymentIntents.data.filter(
		(payment) => payment.status === 'requires_capture' && payment.metadata.vendable === 'true'
	);

	const paidQueueItems = pendingPayments.map((payment) => {
		return {
			id: payment.id,
			status: payment.status,
			quantity: parseInt(payment.metadata.quantity),
			vendable: payment.metadata.vendable === 'true',
			shelf_loc: parseInt(payment.metadata.shelf_loc),
			product_id: payment.metadata.product_id,
			product_name: payment.metadata.product_name,
			free: false
		};
	});

	const freeQueueItems = await getFreeQueue();

	const pendingToVendor = [...paidQueueItems, ...freeQueueItems];

	return pendingToVendor;
};

export const removeQueueItem = async (
	STRIPE_KEY: string,
	paymentIntentId: string,
	complete: boolean = true
): Promise<{ success: boolean }> => {
	const freeQueueItems = await getFreeQueue();
	const freeQueueItem = freeQueueItems.find((item) => item.id === paymentIntentId);
	if (freeQueueItem) {
		await removeFreeQueueItem(paymentIntentId);
		return { success: true };
	} else {
		const stripe = new Stripe(env.STRIPE_KEY, {
			apiVersion: '2022-11-15'
		});

		if (complete) {
			const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
			if (paymentIntent.status === 'succeeded') {
				return { success: true };
			}
		} else {
			const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
			if (paymentIntent.status === 'canceled') {
				return { success: true };
			}
		}
		return { success: false };
	}
};
