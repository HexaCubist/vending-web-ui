import Stripe from 'stripe';
import { env } from '$env/dynamic/private';
import { getFreeQueue, removeFreeQueueItem } from './freeStore';
import { Webhook } from 'discord-webhook-node';

const hook = env.DISCORD_WEBHOOK ? new Webhook(env.DISCORD_WEBHOOK) : null;
if (hook) {
	hook.setUsername('Vending Machine');
	console.log('Discord webhook enabled');
}

const communityHook = env.DISCORD_COMMUNITY_WEBHOOK
	? new Webhook(env.DISCORD_COMMUNITY_WEBHOOK)
	: null;
if (communityHook) {
	communityHook.setUsername('Vending Machine');
	console.log('Discord community webhook enabled');
}

const notify = (h: Webhook | null, msg: string): void => {
	if (!h) return;
	h.send(msg).catch((err) => console.error('Discord webhook failed:', err));
};

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
	const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2024-04-10' });

	const byId = new Map<string, Stripe.PaymentIntent>();

	try {
		const searchResults = await stripe.paymentIntents.search({
			query: `status:'requires_capture' AND metadata['vendable']:'true'`,
			limit: 100
		});
		for (const p of searchResults.data) byId.set(p.id, p);
	} catch (err) {
		console.error('paymentIntents.search failed, falling back to list only:', err);
	}

	const recentCutoff = Math.floor(Date.now() / 1000) - 30 * 60;
	let starting_after: string | undefined = undefined;
	let safety = 0;
	while (safety < 5) {
		safety++;
		const page: Stripe.ApiList<Stripe.PaymentIntent> = await stripe.paymentIntents.list({
			limit: 100,
			created: { gte: recentCutoff },
			...(starting_after ? { starting_after } : {})
		});
for (const p of page.data) {
    if (p.metadata.vendable !== 'true') continue;
    if (p.status === 'requires_capture') {
        byId.set(p.id, p);
    } else {
        // List is real-time. If search returned a stale entry for a PI
        // that has since transitioned out of requires_capture, drop it.
        byId.delete(p.id);
    }
}
		if (!page.has_more) break;
		starting_after = page.data[page.data.length - 1]?.id;
		if (!starting_after) break;
	}

	const paidQueueItems: QueueItem[] = Array.from(byId.values()).map((payment) => ({
		id: payment.id,
		status: payment.status,
		quantity: parseInt(payment.metadata.quantity),
		vendable: payment.metadata.vendable === 'true',
		shelf_loc: parseInt(payment.metadata.shelf_loc),
		product_id: payment.metadata.product_id,
		product_name: payment.metadata.product_name,
		free: false
	}));

	let freeQueueItems: QueueItem[] = [];
	try {
		freeQueueItems = await getFreeQueue();
	} catch (err) {
		console.error('Free queue (Redis) unavailable, returning paid queue only:', err);
	}

	return [...paidQueueItems, ...freeQueueItems];
};

export const removeQueueItem = async (
	STRIPE_KEY: string,
	paymentIntentId: string,
	complete: boolean = true
): Promise<{ success: boolean }> => {
	let freeQueueItems: QueueItem[] = [];
	try {
		freeQueueItems = await getFreeQueue();
	} catch (err) {
		console.error('Free queue lookup failed during remove:', err);
	}

	const freeQueueItem = freeQueueItems.find((item) => item.id === paymentIntentId);
	if (freeQueueItem) {
		try {
			await removeFreeQueueItem(paymentIntentId);
		} catch (err) {
			console.error('Failed to remove free queue item:', err);
			return { success: false };
		}
		if (complete) notify(hook, `Dispensed free item from shelf ${freeQueueItem.shelf_loc}`);
		return { success: true };
	}

	const stripe = new Stripe(STRIPE_KEY, { apiVersion: '2024-04-10' });

	try {
		if (complete) {
			const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);
			if (paymentIntent.status === 'succeeded') {
				notify(
					hook,
					`Dispensed "${paymentIntent.metadata.product_name}" from shelf ${paymentIntent.metadata.shelf_loc} and charged card! (Payment: https://dashboard.stripe.com/payments/${paymentIntent.id}) `
				);
				notify(
					communityHook,
					`"${paymentIntent.metadata.product_name} ($${(paymentIntent.amount / 100).toFixed(2)})" purchased from shelf ${paymentIntent.metadata.shelf_loc}`
				);
				return { success: true };
			}
		} else {
			const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);
			if (paymentIntent.status === 'canceled') {
				notify(
					hook,
					`Cancelled "${paymentIntent.metadata.product_name}" and refunded card! (Payment: https://dashboard.stripe.com/payments/${paymentIntent.id})`
				);
				return { success: true };
			}
		}
	} catch (err) {
		console.error('Stripe queue operation failed:', err);
	}

	return { success: false };
};