import Stripe from 'stripe';
import { error, json, redirect } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

export const prerender = false;

export const GET: RequestHandler = async () => {
	if (!env.STRIPE_KEY) {
		return new Response('No Stripe key found', { status: 500 });
	}

	const stripe = new Stripe(env.STRIPE_KEY, {
		apiVersion: '2022-11-15'
	});

	let paymentIntents = await stripe.paymentIntents.search({
		query: `status:'requires_capture' AND metadata['vendable']:'true'`
	});

	// Filter out recently completed payments
	let pendingPayments = paymentIntents.data.filter(
		(payment) => payment.status === 'requires_capture'
	);

	const pendingToVendor = pendingPayments.map((payment) => {
		return {
			id: payment.id,
			status: payment.status,
			quantity: payment.metadata.quantity,
			vendable: payment.metadata.vendable,
			shelf_loc: payment.metadata.shelf_loc,
			product_id: payment.metadata.product_id,
			product_name: payment.metadata.product_name
		};
	});

	return json(pendingToVendor);
};
