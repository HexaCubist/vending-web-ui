import type { PageServerLoad, Actions } from './$types';
import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import getProducts, { Tags } from '$lib/getProducts';
import { getQueue, removeQueueItem } from '$lib/queueManager';
import { addFreeQueueItem } from '$lib/freeStore';

export const load: PageServerLoad = async ({ params, url }) => {
	if (!env.STRIPE_KEY) {
		return {
			results: false
		};
	}
	// Get some basic stats from Stripe
	const stripe = new Stripe(env.STRIPE_KEY, {
		apiVersion: '2024-04-10'
	});
	let monthAgo = new Date();
	monthAgo.setDate(monthAgo.getDate() - 30);
	let maxTime = new Date();
	maxTime.setDate(maxTime.getDate() - 365 * 2);
	// Get date from query
	const requestedDate = url.searchParams.get('startDate');
	if (requestedDate && Date.parse(requestedDate)) {
		monthAgo = new Date(requestedDate);
		if (monthAgo < maxTime) {
			monthAgo = maxTime;
		}
	}
	const completedPayments = stripe.paymentIntents.search({
		query: `status:'succeeded' AND created>${Math.floor(monthAgo.getTime() / 1000)}`,
		limit: 100,
		expand: ['total_count', 'data.latest_charge.balance_transaction']
	});
	const totalValue = completedPayments.then(
		(cp) =>
			cp.data.reduce((acc, payment) => {
				return acc + payment.amount;
			}, 0) / 100
	);
	const topItems = completedPayments
		.then((cp) =>
			cp.data.reduce(
				async (accPromise, payment) => {
					const acc = await accPromise;
					const fee =
						typeof payment.latest_charge !== 'string' &&
						typeof payment.latest_charge?.balance_transaction !== 'string'
							? (payment.latest_charge?.balance_transaction?.fee || 0) / 100
							: 0;

					const items = payment.metadata.product_id;
					if (!items) return acc;
					for (const item of items.split(',')) {
						if (!item) return acc;
						let price = payment.amount / 100;
						if (items.split(',').length > 1) {
							const prod = await stripe.products.retrieve(item, { expand: ['default_price'] });
							const default_price = prod.default_price;
							if (default_price && typeof default_price !== 'string') {
								price = (default_price.unit_amount || 0) / 100;
							}
						}
						if (acc[item]) {
							acc[item].count++;
							acc[item].total += price;
							acc[item].actual_total += price - fee / items.split(',').length;
						} else {
							const product = await stripe.products.retrieve(item);
							acc[item] = {
								product_id: item,
								count: 1,
								total: price,
								actual_total: price - fee / items.split(',').length,
								product_name: product.name
							};
						}
					}
					return acc;
				},
				Promise.resolve(
					{} as {
						[key: string]: {
							count: number;
							total: number;
							actual_total: number;
							product_name: string;
							product_id: string;
						};
					}
				)
			)
		)
		.then((topItems) => Object.values(topItems).sort((a, b) => b.count - a.count));
	return {
		products: await getProducts(env.STRIPE_KEY, true),
		queue: await getQueue(env.STRIPE_KEY),
		month: await Promise.all([completedPayments, totalValue, topItems]).then(
			([completedPayments, totalValue, topItems]) => ({
				completedPayments: completedPayments.total_count,
				totalValue: totalValue,
				topItems: Object.values(topItems).sort((a, b) => b.count - a.count)
			})
		),
		startDate: monthAgo.toISOString()
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
			apiVersion: '2024-04-10'
		});

		// Get product image
		const imageField = data.get('image');
		let image: string | undefined = undefined;
		if (
			imageField &&
			imageField instanceof File &&
			['image/png', 'image/jpeg'].includes(imageField.type)
		) {
			const imageBuffer = await imageField.arrayBuffer();
			const imageResponse = await stripe.files.create({
				purpose: 'product_image',
				file: {
					data: Buffer.from(imageBuffer),
					name: imageField.name || undefined,
					type: imageField.type
				},
				file_link_data: {
					create: true
				}
			});
			image = imageResponse.links?.data[0].url || undefined;
		}

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
			description: data.get('description')?.toString() || '',
			expand: ['default_price'],
			active: !(data.get('archive') === 'archive'),
			images: image ? [image] : data.get('delete-image') === 'true' ? '' : undefined
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
			apiVersion: '2024-04-10'
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
	activateProduct: async ({ request }) => {
		// Replace the product (archiving the old one) and add a new one to the product list
		const data = await request.formData();
		const newID = data.get('newID');
		const slot = data.get('slot');
		if (!newID || !slot || env.STRIPE_KEY === undefined) {
			return error(400, 'Bad request');
		}
		// Get the product to activate
		const stripe = new Stripe(env.STRIPE_KEY, {
			apiVersion: '2024-04-10'
		});

		if (newID === 'newProd') {
			// Create a new product with the same details
			await stripe.products.create({
				name: 'Empty Slot',
				default_price_data: {
					currency: 'nzd',
					unit_amount: 0
				},
				metadata: {
					...Object.values(Tags).reduce(
						(acc, tag) => ({
							...acc,
							[tag]: 'false'
						}),
						{}
					),
					vendable: 'true',
					shelf_loc: slot.toString(),
					stock: '0'
				},
				active: true
			});
		} else {
			const product = await stripe.products.retrieve(newID.toString(), {
				expand: ['default_price']
			});
			if (!product.id) {
				return error(400, 'Bad request');
			}
			// Activate the product
			await stripe.products.update(newID.toString(), {
				active: true,
				metadata: {
					...product.metadata,
					shelf_loc: slot.toString()
				}
			});
		}

		// Archive the product
		const oldID = data.get('oldID');
		if (oldID) {
			await stripe.products.update(oldID.toString(), {
				active: false
			});
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
