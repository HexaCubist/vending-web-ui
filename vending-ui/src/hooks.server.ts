import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';
import { handle as authenticationHandle } from './auth';
// import { stockShelves } from '$lib/stockMachine';
// import { env } from '$env/dynamic/private';

// // Step 0: Initialize product stock in Stripe
// stockShelves(env.STRIPE_KEY);

const authorizationHandle: Handle = async ({ event, resolve }) => {
	// Protect any routes under /admin
	if (event.url.pathname.startsWith('/admin')) {
		const session = await event.locals.auth();
		if (!session) {
			// Redirect to the signin page
			throw redirect(303, '/auth/signin');
		}
	}

	// If the request is still here, just proceed as normally
	return resolve(event);
};

// First handle authentication, then authorization
// Each function acts as a middleware, receiving the request handle
// And returning a handle which gets passed to the next function
export const handle: Handle = sequence(authenticationHandle, authorizationHandle);
