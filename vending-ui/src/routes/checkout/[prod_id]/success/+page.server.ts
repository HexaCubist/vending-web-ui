import type { PageServerLoad } from './$types';
import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import { getPrice } from '$lib/getProducts';

export const load: PageServerLoad = async ({ params }) => {
	if (!env.STRIPE_KEY) {
		return { product: {} };
	}

	const stripe = new Stripe(env.STRIPE_KEY, {
		apiVersion: '2022-11-15'
	});

	const product = await stripe.products.retrieve(params.prod_id, {
		expand: ['default_price']
	});
	return {
		product: {
			name: product.name,
			price: getPrice(product)
		}
	};
};
