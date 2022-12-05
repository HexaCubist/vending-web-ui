import type { PageLoad } from './$types';
import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load: PageLoad = async ({ params }) => {
	if (!env.STRIPE_KEY) {
		return { product: {} };
	}

	const stripe = new Stripe(env.STRIPE_KEY, {
		apiVersion: '2022-11-15'
	});

	const product = await stripe.products.retrieve(params.prod_id);
	return {
		product: {
			name: product.name
		}
	};
};
