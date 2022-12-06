import type { PageLoad } from './$types';
import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import getProducts from '$lib/getProducts';

export const load: PageLoad = async ({ params }) => {
	if (!env.STRIPE_KEY) {
		return { products: [] };
	}
	return {
		products: await getProducts(env.STRIPE_KEY)
	};
};
