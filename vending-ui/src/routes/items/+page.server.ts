import type { PageServerLoad } from './$types';
import { env } from '$env/dynamic/private';
import getProducts from '$lib/getProducts';

export const load: PageServerLoad = async ({ params }) => {
	if (!env.STRIPE_KEY) {
		return { products: [] };
	}
	return {
		products: await getProducts(env.STRIPE_KEY)
	};
};
