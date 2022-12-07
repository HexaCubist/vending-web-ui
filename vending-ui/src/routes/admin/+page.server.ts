import type { PageServerLoad, Actions } from './$types';
import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import getProducts from '$lib/getProducts';
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
	let startOfMonth = new Date();
	startOfMonth.setDate(1);
	const completedPayments = stripe.paymentIntents.search({
		query: `status:'succeeded' AND created>${Math.floor(startOfMonth.getTime() / 1000)}`,
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
						count: 1,
						total: payment.amount / 100,
						product_name: product.name
					};
				}
				return acc;
			}, Promise.resolve({} as { [key: string]: { count: number; total: number; product_name: string } }))
		)
		.then((topItems) => Object.values(topItems).sort((a, b) => b.count - a.count));
	return {
		products: getProducts(env.STRIPE_KEY),
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
		if (!id || env.STRIPE_KEY === undefined) {
			return error(400, 'Bad request');
		}

		return {
			queue: await getQueue(env.STRIPE_KEY),
			products: await getProducts(env.STRIPE_KEY)
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
			products: await getProducts(env.STRIPE_KEY)
		};
	}
};
