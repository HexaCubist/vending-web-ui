import type { PageServerLoad, Actions } from './$types';
import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import getProducts, { Tags } from '$lib/getProducts';
import { getQueue, removeQueueItem } from '$lib/queueManager';
import { addFreeQueueItem } from '$lib/freeStore';

export const load: PageServerLoad = async ({ params }) => {
	if (!env.STRIPE_KEY) {
		return {
			results: false
		};
	}
	// Get some basic stats from Stripe
	const stripe = new Stripe(env.STRIPE_KEY, {
		apiVersion: '2022-11-15'
	});
	let monthAgo = new Date();
	monthAgo.setDate(monthAgo.getDate() - 30);
	const completedPayments = stripe.paymentIntents.search({
		query: `status:'succeeded' AND created>${Math.floor(monthAgo.getTime() / 1000)}`,
		limit: 100,
		expand: ['total_count']
	});
	const totalValue = completedPayments.then(
		(cp) =>
			cp.data.reduce((acc, payment) => {
				return acc + payment.amount;
			}, 0) / 100
	);
	const topItems = completedPayments
		.then((cp) =>
			cp.data.reduce(async (accPromise, payment) => {
				const acc = await accPromise;
				const item = payment.metadata.product_id;
				if (!item) return acc;
				if (acc[item]) {
					acc[item].count++;
					acc[item].total += payment.amount / 100;
				} else {
					const product = await stripe.products.retrieve(item);
					acc[item] = {
						product_id: item,
						count: 1,
						total: payment.amount / 100,
						product_name: product.name
					};
				}
				return acc;
			}, Promise.resolve({} as { [key: string]: { count: number; total: number; product_name: string; product_id: string } }))
		)
		.then((topItems) => Object.values(topItems).sort((a, b) => b.count - a.count));
	return {
		products: getProducts(env.STRIPE_KEY, true),
		queue: getQueue(env.STRIPE_KEY),
		month: Promise.all([completedPayments, totalValue, topItems]).then(
			([completedPayments, totalValue, topItems]) => ({
				completedPayments: completedPayments.total_count,
				totalValue: totalValue,
				topItems: Object.values(topItems).sort((a, b) => b.count - a.count)
			})
		)
	};
};

export const actions: Actions = {
	complete: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		if (!id || env.STRIPE_KEY === undefined) {
			return error(400, 'Bad request');
		}
		removeQueueItem(env.STRIPE_KEY, id.toString());
		return { queue: await getQueue(env.STRIPE_KEY) };
	},
	cancel: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		if (!id || env.STRIPE_KEY === undefined) {
			return error(400, 'Bad request');
		}
		removeQueueItem(env.STRIPE_KEY, id.toString(), false);
		return { queue: await getQueue(env.STRIPE_KEY) };
	},
	saveProduct: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		const products = await getProducts(env.STRIPE_KEY, true);
		if (!id || env.STRIPE_KEY === undefined || products.find((p) => p.id === id) === undefined) {
			return error(400, 'Bad request');
		}

		const stripe = new Stripe(env.STRIPE_KEY, {
			apiVersion: '2022-11-15'
		});

		const product = await stripe.products.update(id.toString(), {
			name: data.get('name')?.toString() || '',
			metadata: {
				...Object.values(Tags)
					.filter((tag) => data.get(tag) !== null)
					.reduce(
						(acc, tag) => ({
							...acc,
							[tag]: data.get(tag) ? 'true' : 'false'
						}),
						{}
					),
				shelf_loc: data.get('shelf_loc')?.toString() || '',
				stock: data.get('stock')?.toString() || ''
			},
			expand: ['default_price'],
			active: !(data.get('archive') === 'archive')
		});

		const existing_price = product.default_price;
		let useExistingPrice =
			existing_price && typeof existing_price !== 'string'
				? existing_price.unit_amount === parseInt(data.get('price')?.toString() || '0') * 100
				: false;
		// If price has changed, update it
		if (!useExistingPrice) {
			const price = await stripe.prices.create({
				product: id.toString(),
				unit_amount: parseInt(data.get('price')?.toString() || '0') * 100,
				currency: 'nzd'
			});
			await stripe.products.update(id.toString(), {
				default_price: price.id
			});
			// If price has been removed, deactivate it
			if (existing_price && typeof existing_price !== 'string') {
				await stripe.prices.update(existing_price.id, {
					active: false
				});
			}
		}

		// Get default price and update
		return {
			queue: await getQueue(env.STRIPE_KEY),
			products: await getProducts(env.STRIPE_KEY, true)
		};
	},
	dispenseProduct: async ({ request }) => {
		const data = await request.formData();
		const id = data.get('id');
		if (!id || env.STRIPE_KEY === undefined) {
			return error(400, 'Bad request');
		}

		const stripe = new Stripe(env.STRIPE_KEY, {
			apiVersion: '2022-11-15'
		});

		const product = await stripe.products.retrieve(id.toString());
		if (product.id) {
			addFreeQueueItem(product);
		}

		return {
			queue: await getQueue(env.STRIPE_KEY),
			products: await getProducts(env.STRIPE_KEY, true)
		};
	},
	pressKeypad: async ({ request }) => {
		const data = await request.formData();
		const shelf_loc = data.get('shelf_loc');
		addFreeQueueItem({
			id: 'ManualVend',
			object: 'product',
			active: true,
			attributes: null,
			created: 0,
			description: null,
			images: [],
			livemode: true,
			metadata: {
				shelf_loc: shelf_loc?.toString() || '',
				vendable: 'true'
			},
			name: `Button ${shelf_loc}`,
			package_dimensions: null,
			shippable: null,
			tax_code: null,
			type: 'good',
			updated: 0,
			url: null
		});
	}
};
