// This script file will stock the machine with empty products for any shelves defined in shelfLayout that do not have a product already assigned to them.

import { shelfLayout } from './machineLayout';
import getProducts, { Tags } from './getProducts';
import Stripe from 'stripe';
export async function stockShelves(STRIPE_KEY: string) {
	const stripe = new Stripe(STRIPE_KEY, {
		apiVersion: '2024-04-10'
	});
	const all_products = await getProducts(STRIPE_KEY, true);
	const shelf_locs = new Set(shelfLayout.flat());
	const product_locs = new Set(all_products.map((product) => product.shelf_loc));
	const empty_locs = [...shelf_locs].filter((loc) => !product_locs.has(loc));
	const empty_products = empty_locs.map<Stripe.ProductCreateParams>((loc) => {
		return {
			name: 'Empty Slot',
			metadata: {
				...Object.values(Tags).reduce(
					(acc, tag) => ({
						...acc,
						[tag]: 'false'
					}),
					{}
				),
				vendable: 'true',
				shelf_loc: loc,
				stock: '0'
			},
			active: false
		};
	});
	if (empty_products.length === 0) {
		console.log('No empty products to stock');
		return;
	}
	console.log(`Stocking ${empty_products.length} empty products`);
	for (const product of empty_products) {
		await stripe.products.create(product);
	}
	console.log('Stocking complete');
}
