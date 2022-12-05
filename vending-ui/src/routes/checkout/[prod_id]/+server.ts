import Stripe from 'stripe';
import { error, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, params }) => {
	if (!env.STRIPE_KEY) {
		return new Response('No Stripe key found', { status: 500 });
	}

	const stripe = new Stripe(env.STRIPE_KEY, {
		apiVersion: '2022-11-15'
	});

	const product = await stripe.products.retrieve(params.prod_id);
	let priceID = product.default_price;
	if (!priceID) {
		return new Response('No price found', { status: 500 });
	} else if (!(typeof priceID === 'string')) {
		priceID = priceID.id;
	}

	// Check if the price is free
	const price = await stripe.prices.retrieve(priceID);
	if (price.unit_amount === 0) {
		throw redirect(303, `/checkout/${params.prod_id}/success`);
	} else {
		const success_url = new URL(url);
		success_url.pathname = `/checkout/${params.prod_id}/success`;
		const cancel_url = new URL(url);
		cancel_url.pathname = `/`;
		cancel_url.searchParams.set('cancelled', 'true');
		cancel_url.searchParams.set('prod_id', params.prod_id);

		const session = await stripe.checkout.sessions.create({
			line_items: [{ price: priceID, quantity: 1 }],
			mode: 'payment',
			success_url: success_url.toString(),
			cancel_url: cancel_url.toString(),
			payment_intent_data: {
				capture_method: 'manual',
				metadata: {
					product_id: params.prod_id,
					product_name: product.name,
					vendable: product.metadata.vendable,
					shelf_loc: product.metadata.shelf_loc,
					quantity: 1
				}
			},
			expires_at: Math.floor(Date.now() / 1000) + 3600 * 2 // Configured to expire after 2 hours
		});
		if (!session.url) {
			return new Response('No session url found', { status: 500 });
		}

		throw redirect(303, session.url);
	}
};
