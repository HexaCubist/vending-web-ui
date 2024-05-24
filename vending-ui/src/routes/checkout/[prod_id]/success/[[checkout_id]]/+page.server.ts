import type { PageServerLoad } from './$types';
import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
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

		// Get product and update metadata to manage stock
		if (payment?.status === 'requires_capture' || payment?.status === 'succeeded') {
			const quantity = session.metadata?.quantity ? parseInt(session.metadata.quantity) : 1;
			const stock = parseInt(product.metadata.stock);
			const remainingStock = stock - quantity;
			if (!isNaN(remainingStock) && payment.metadata.reserved !== 'true') {
				await stripe.products.update(params.prod_id, {
					metadata: {
						stock: remainingStock.toString()
					}
				});
				if (remainingStock < 1) {
					hook?.send(`Product "${product.name}" is now sold out! :partying_face: :partying_face:`);
				}
			}
			await stripe.paymentIntents.update(payment.id, {
				metadata: {
					reserved: 'true'
				}
			});
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
