import Stripe from 'stripe';
import { env } from '$env/dynamic/private';

export function getPrice(product: Stripe.Product): number | null {
	if (product.default_price) {
		const price = product.default_price;
		if (typeof price === 'string') {
			return 0;
		} else if (price.unit_amount === null) {
			return null;
		} else {
			return price.unit_amount ? price.unit_amount / 100 : 0;
		}
	} else {
		return 0;
	}
}

export type VendableProduct = {
	id: string;
	name: string;
	description: string | null;
	price: number | null;
	image?: string;
	shelf_loc: string;
};

export default async function getProducts(STRIPE_KEY: string) {
	const stripe = new Stripe(STRIPE_KEY, {
		apiVersion: '2022-11-15'
	});

	const all_products = await stripe.products.search({
		query: `active:'true' AND metadata['vendable']:'true'`,
		limit: 100,
		expand: ['data.default_price']
	});

	const vendable_products = all_products.data.filter((product) => {
		const vendable = product.metadata.vendable === 'true' && product.active === true;
		const is_free = getPrice(product) === 0;
		const has_link = product.metadata.link !== null;
		return vendable && (is_free || has_link);
	});

	const unsorted = vendable_products.map((product) => {
		return {
			id: product.id,
			name: product.name,
			description: product.description,
			price: getPrice(product),
			image: product.images[0],
			shelf_loc: product.metadata.shelf_loc
		} as VendableProduct;
	});
	return unsorted.sort((a, b) => a.shelf_loc.localeCompare(b.shelf_loc));
}
