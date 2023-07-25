import { SvelteKitAuth } from '@auth/sveltekit';
import GoogleProvider from '@auth/core/providers/google';
import { GOOGLE_ID, GOOGLE_SECRET, API_KEY, ALLOWED_EMAILS } from '$env/static/private';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect, type Handle } from '@sveltejs/kit';

const authorization: Handle = async ({ event, resolve }) => {
	if (event.url.pathname.startsWith('/admin')) {
		const session = await event.locals.getSession();
		if (!session) {
			throw redirect(303, '/auth/signin');
		}
	} else if (event.url.pathname.startsWith('/api/auth')) {
		const auth = event.request.headers.get('Authorization');
		const b64auth = (auth || '').split(' ')[1] || '';
		const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

		if (!(login && password && login === 'API_KEY' && password === API_KEY)) {
			return new Response('Not authorized', {
				status: 401,
				headers: {
					'WWW-Authenticate': 'Basic realm="Vending Machine API", charset="UTF-8"'
				}
			});
		}
		return resolve(event);
	}

	// If the request is still here, just proceed as normally
	return resolve(event);
};

export const handle: Handle = sequence(
	SvelteKitAuth({
		providers: [
			GoogleProvider({
				clientId: GOOGLE_ID,
				clientSecret: GOOGLE_SECRET
				// authorization: {
				// 	params: {
				// 		prompt: 'consent',
				// 		access_type: 'offline',
				// 		response_type: 'code'
				// 	}
				// }
			})
		],
		callbacks: {
			async signIn({ account, profile }) {
				return !!(
					profile?.email_verified &&
					profile.email &&
					new Set(ALLOWED_EMAILS.split(',')).has(profile.email)
				);
			}
		}
	}),
	authorization
);
