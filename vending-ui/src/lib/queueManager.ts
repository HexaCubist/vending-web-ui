import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { getFreeQueue, removeFreeQueueItem } from './freeStore';
import { Webhook } from 'discord-webhook-node';
const hook = env.DISCORD_WEBHOOK ? new Webhook(env.DISCORD_WEBHOOK) : null;
if (hook) {
	hook.setUsername('Vending Machine');
	console.log('Discord webhook enabled');
}

/**
 * Community webhook for notifying when items are sold, but not linking to the payment
 */
const communityHook = env.DISCORD_COMMUNITY_WEBHOOK
	? new Webhook(env.DISCORD_COMMUNITY_WEBHOOK)
	: null;
if (communityHook) {
	communityHook.setUsername('Vending Machine');
	console.log('Discord community webhook enabled');
}

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
		apiVersion: '2024-04-10'
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
		if (complete) hook?.send(`Dispensed free item from shelf ${freeQueueItem.shelf_loc}`);
		return { success: true };
	} else {
		const stripe = new Stripe(env.STRIPE_KEY, {
			apiVersion: '2024-04-10'
		});

		if (complete) {
			const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
			if (paymentIntent.status === 'succeeded') {
				hook?.send(
					`Dispensed "${paymentIntent.metadata.product_name}" from shelf ${paymentIntent.metadata.shelf_loc} and charged card! (Payment: https://dashboard.stripe.com/payments/${paymentIntent.id}) `
				);
				communityHook?.send(
					`"${paymentIntent.metadata.product_name} ($${(paymentIntent.amount / 100).toFixed(
						2
					)})" purchased from shelf ${paymentIntent.metadata.shelf_loc}`
				);
				return { success: true };
			}
		} else {
			const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
			if (paymentIntent.status === 'canceled') {
				hook?.send(
					`Cancelled "${paymentIntent.metadata.product_name}" and refunded card! (Payment: https://dashboard.stripe.com/payments/${paymentIntent.id})`
				);
				return { success: true };
			}
		}
		return { success: false };
	}
};
