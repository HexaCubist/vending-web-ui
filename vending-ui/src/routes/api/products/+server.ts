import Stripe from 'stripe';
import { error, json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import getProducts from '$lib/getProducts';

export const GET: RequestHandler = async ({ url }) => {
	if (!env.STRIPE_KEY) {
		return new Response('No Stripe key found', { status: 500 });
	}
	const product_response = await getProducts(env.STRIPE_KEY);
	return json(product_response);
};
