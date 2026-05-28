import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';
import { handle as authenticationHandle } from './auth';
import { env } from '$env/dynamic/private';

const authorizationHandle: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/admin')) {
		if (env.DEV_BYPASS_AUTH !== 'true') {
			const session = await event.locals.auth();
			if (!session) {
				throw redirect(303, '/auth/signin');
			}
		}
	}

	return resolve(event);
};

// First handle authentication, then authorization
// Each function acts as a middleware, receiving the request handle
// And returning a handle which gets passed to the next function
export const handle: Handle = sequence(authenticationHandle, authorizationHandle);
