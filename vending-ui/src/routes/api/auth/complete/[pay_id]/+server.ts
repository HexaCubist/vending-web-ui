import { json } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { removeQueueItem } from '$lib/queueManager';

export const prerender = false;

/**
 * Verify the request carries the API_KEY. Without this check, anyone who
 * can reach the URL can capture customer payments without dispensing the
 * physical item.
 */
const checkAuth = (request: Request): boolean => {
	if (!env.API_KEY) {
		console.warn('API_KEY not configured — refusing request to /api/auth/complete');
		return false;
	}
	const auth = request.headers.get('authorization');
	if (!auth) return false;
	if (auth === `Bearer ${env.API_KEY}`) return true;
	if (auth === env.API_KEY) return true;
	return false;
};

export const POST: RequestHandler = async ({ params, request }) => {
	if (!checkAuth(request)) {
		return new Response('Unauthorized', { status: 401 });
	}

	const paymentIntentId = params.pay_id;
	if (!paymentIntentId) {
		return new Response('No payment intent id found', { status: 500 });
	}
	if (!env.STRIPE_KEY) {
		return new Response('No Stripe key found', { status: 500 });
	}

	const status = await removeQueueItem(env.STRIPE_KEY, paymentIntentId);
	return json(status);
};