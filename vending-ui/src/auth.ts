import { SvelteKitAuth } from '@auth/sveltekit';
import GoogleProvider from '@auth/sveltekit/providers/google';
import { env } from '$env/dynamic/private';

export const { handle, signIn, signOut } = SvelteKitAuth({
	providers: [
		GoogleProvider({
			clientId: env.GOOGLE_ID,
			clientSecret: env.GOOGLE_SECRET
		})
	],
	callbacks: {
		async signIn({ profile }) {
			return !!(
				profile?.email_verified &&
				profile.email &&
				new Set(env.ALLOWED_EMAILS.split(',')).has(profile.email)
			);
		}
	},
	secret: env.AUTH_SECRET,
	trustHost: true
});
