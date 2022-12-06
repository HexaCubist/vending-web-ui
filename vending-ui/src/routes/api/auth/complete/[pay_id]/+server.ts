import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';
import { removeQueueItem } from '$lib/queueManager';

export const prerender = false;

export const POST: RequestHandler = async ({ params }) => {
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
