import type { PageServerLoad } from './$types';
import Stripe from 'stripe';
import { error } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getPrice } from '$lib/getProducts';
import { Webhook } from 'discord-webhook-node';
const hook = env.DISCORD_COMMUNITY_WEBHOOK ? new Webhook(env.DISCORD_COMMUNITY_WEBHOOK) : null;
if (hook) {
	hook.setUsername('Vending Machine');
}

export const load: PageServerLoad = async ({ params }) => {
	if (!env.STRIPE_KEY) {
		return { product: {} };
	}

	const stripe = new Stripe(env.STRIPE_KEY, {
		apiVersion: '2024-04-10'
	});

	const product = await stripe.products.retrieve(params.prod_id, {
		expand: ['default_price']
	});

	if (params.checkout_id) {
		const session = await stripe.checkout.sessions.retrieve(params.checkout_id, {
			expand: ['payment_intent']
		});
		const payment = typeof session.payment_intent === 'string' ? undefined : session.payment_intent;

		if (payment?.status === 'requires_capture' || payment?.status === 'succeeded') {
			if (payment.metadata.reserved !== 'true') {
				// Mark reserved first to narrow the double-decrement race window.
				// Two simultaneous requests can still both read reserved=undefined,
				// but this ordering makes the stock update the last thing that happens.
				await stripe.paymentIntents.update(payment.id, {
					metadata: { reserved: 'true' }
				});
				const quantity = parseInt(payment.metadata.quantity) || 1;
				const stock = parseInt(product.metadata.stock);
				const remainingStock = stock - quantity;
				if (!isNaN(remainingStock)) {
					await stripe.products.update(params.prod_id, {
						metadata: { stock: remainingStock.toString() }
					});
					if (remainingStock < 1) {
						hook
							?.send(`Product "${product.name}" is now sold out! :partying_face: :partying_face:`)
							.catch((err) => console.error('Discord webhook failed:', err));
					}
				}
			}
		} else {
			error(500, 'Payment not completed');
		}
	}

	return {
		product: {
			name: product.name,
			price: getPrice(product)
		}
	};
};