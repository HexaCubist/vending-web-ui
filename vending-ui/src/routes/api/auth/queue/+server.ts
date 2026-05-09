import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { getQueue } from '$lib/queueManager';

export const prerender = false;

/**
 * Verify the request carries the API_KEY in an Authorization header.
 * Accepts both "Bearer <key>" (preferred) and the raw key (legacy) for
 * a graceful transition. Returns false if API_KEY isn't configured at all
 * — without it we can't authenticate, so reject everything.
 */
const checkAuth = (request: Request): boolean => {
	if (!env.API_KEY) {
		console.warn('API_KEY not configured — refusing request to /api/auth/queue');
		return false;
	}
	const auth = request.headers.get('authorization');
	if (!auth) return false;
	if (auth === `Bearer ${env.API_KEY}`) return true;
	if (auth === env.API_KEY) return true;
	return false;
};

export const GET: RequestHandler = async ({ request }) => {
	if (!checkAuth(request)) {
		return new Response('Unauthorized', { status: 401 });
	}
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