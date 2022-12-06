import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getQueue } from '$lib/queueManager';

export const prerender = false;

export const GET: RequestHandler = async () => {
	if (!env.STRIPE_KEY) {
		console.error('No Stripe key found');
		return new Response('No Stripe key found', { status: 500 });
	}

	const pendingQueue = await getQueue(env.STRIPE_KEY);

	return json(
		pendingQueue.map((queueItem) => ({
			id: queueItem.id,
			product_id: queueItem.product_id,
			shelf_loc: queueItem.shelf_loc,
			quantity: queueItem.quantity
		}))
	);
};
