import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const prerender = false;

export const POST: RequestHandler = async ({ params }) => {
	const paymentIntentId = params.pay_id;
	if (!paymentIntentId) {
		return new Response('No payment intent id found', { status: 500 });
	}
	if (!env.STRIPE_KEY) {
		return new Response('No Stripe key found', { status: 500 });
	}

	const stripe = new Stripe(env.STRIPE_KEY, {
		apiVersion: '2022-11-15'
	});

	const paymentIntent = await stripe.paymentIntents.capture(paymentIntentId);

	if (paymentIntent.status === 'succeeded') {
		return json({ success: true });
	} else {
		// await stripe.paymentIntents.cancel(paymentIntentId);
		return json({ success: false });
	}
};
