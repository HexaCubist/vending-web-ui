<script lang="ts">
	import { page } from '$app/stores';
	import { signIn, signOut } from '@auth/sveltekit/client';
	import { onMount } from 'svelte';
	import '../app.postcss';

	let isDark = false;

	onMount(() => {
		isDark = document.documentElement.getAttribute('data-color-scheme') === 'dark';
	});

	function toggleTheme() {
		isDark = !isDark;
		const scheme = isDark ? 'dark' : 'light';
		document.documentElement.setAttribute('data-color-scheme', scheme);
		document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'fantasy');
		localStorage.setItem('color-scheme', scheme);
	}

	function scrollToTop() {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	}
</script>

<header class="gh-site-header">
	<div class="gh-container gh-header-inner">
		{#if $page.url.pathname !== '/'}
			<a href="/" class="gh-back-btn" aria-label="Back to home">
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M10 19l-7-7m0 0l7-7m-7 7h18" />
				</svg>
			</a>
		{/if}

		<a href="/" class="gh-logo-link">
			<img src="/aumc-logo.svg" alt="Maker Club" class="gh-logo gh-logo-light" />
			<img src="/logo_h_w.svg" alt="Maker Club" class="gh-logo gh-logo-dark" />
		</a>

		<div class="gh-header-spacer" />

		<div class="gh-header-actions">
			<button class="gh-theme-toggle" on:click={toggleTheme} aria-label="Toggle dark mode">
				{#if isDark}
					<!-- Sun icon -->
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<circle cx="12" cy="12" r="5" />
						<line x1="12" y1="1" x2="12" y2="3" />
						<line x1="12" y1="21" x2="12" y2="23" />
						<line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
						<line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
						<line x1="1" y1="12" x2="3" y2="12" />
						<line x1="21" y1="12" x2="23" y2="12" />
						<line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
						<line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
					</svg>
				{:else}
					<!-- Moon icon -->
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="1.3"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
					</svg>
				{/if}
			</button>

			{#if $page.data.session}
				<a href="/admin" class="gh-nav-link">Admin</a>
				<button on:click={() => signOut({ callbackUrl: '/' })} class="gh-main-button"
					>Sign out</button
				>
			{:else}
				<button
					on:click={() => signIn(undefined, { callbackUrl: '/admin' })}
					class="gh-main-button">Admin Login</button
				>
			{/if}
		</div>
	</div>
</header>

<main>
	<slot />
</main>

<footer class="gh-site-footer">
	<!-- Upper: brand left, nav right -->
	<div class="gh-container gh-footer-upper">
		<div class="gh-footer-brand">
			<a href="/" class="gh-footer-logo-link">
				<img src="/logo_h_w.svg" alt="UoA Maker Club" class="gh-footer-logo-img" />
			</a>
			<p class="gh-footer-tagline">A Community of Creators</p>
			<div class="gh-footer-socials">
				<a href="https://www.facebook.com/makeuoa" target="_blank" rel="noreferrer" aria-label="Facebook">
					<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
						<circle cx="16" cy="16" r="16" fill="white" />
						<path d="M17.5 10.5H19V8H17C15.07 8 13.5 9.57 13.5 11.5V14H11.5V16.5H13.5V24H16V16.5H18.5L19 14H16V11.5C16 10.95 16.45 10.5 17 10.5H17.5Z" fill="#1d1d1f" />
					</svg>
				</a>
				<a href="https://www.instagram.com/makeuoa" target="_blank" rel="noreferrer" aria-label="Instagram">
					<svg width="32" height="32" viewBox="0 0 32 32" fill="none">
						<circle cx="16" cy="16" r="16" fill="white" />
						<rect x="9" y="9" width="14" height="14" rx="4" stroke="#1d1d1f" stroke-width="1.5" />
						<circle cx="16" cy="16" r="3.5" stroke="#1d1d1f" stroke-width="1.5" />
						<circle cx="21" cy="11" r="1" fill="#1d1d1f" />
					</svg>
				</a>
			</div>
		</div>

		<nav class="gh-footer-nav">
			<a href="https://makeuoa.nz/code-of-conduct/">Code of Conduct</a>
			<a href="mailto:makerclubuoa@gmail.com">Contact</a>
			<a href="https://makeuoa.nz/host-an-event/">Host an Event</a>
		</nav>
	</div>

	<!-- Divider with scroll-to-top -->
	<div class="gh-container gh-footer-divider-row">
		<div class="gh-footer-divider"></div>
		<button class="gh-scroll-top" on:click={scrollToTop} aria-label="Scroll to top">
			<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M12 19V5M5 12l7-7 7 7" />
			</svg>
		</button>
	</div>

	<!-- Lower: copyright left, become a member right -->
	<div class="gh-container gh-footer-lower">
		<p class="gh-footer-copyright">
			Copyright © {new Date().getFullYear()} University of Auckland Makers Club. Published with Ghost and University of Auckland Makers Club.
		</p>
		<a href="https://makeuoa.nz/#/portal/signup" target="_blank" rel="noreferrer" class="gh-become-member">
			<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
				<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
				<circle cx="12" cy="7" r="4" />
			</svg>
			Become a member
		</a>
	</div>
</footer>

<style>
	.gh-site-header {
		background: var(--bg-header);
		border-bottom: 1px solid var(--border-subtle);
		position: sticky;
		top: 0;
		z-index: 100;
	}

	.gh-header-inner {
		display: flex;
		align-items: center;
		gap: 16px;
		height: 64px;
	}

	.gh-back-btn {
		color: var(--text-primary);
		display: flex;
		align-items: center;
		text-decoration: none;
		flex-shrink: 0;
		opacity: 0.7;
		transition: opacity 0.15s;
	}

	.gh-back-btn:hover {
		opacity: 1;
	}

	.gh-logo-link {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		text-decoration: none;
	}

	.gh-logo {
		height: 36px;
		width: auto;
	}

	.gh-logo-dark {
		display: none;
	}

	:global([data-color-scheme='dark']) .gh-logo-light {
		display: none;
	}

	:global([data-color-scheme='dark']) .gh-logo-dark {
		display: block;
	}

	.gh-header-spacer {
		flex: 1;
	}

	.gh-header-actions {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-shrink: 0;
	}

	.gh-nav-link {
		font-size: 16px;
		font-weight: 500;
		color: var(--text-primary);
		text-decoration: none;
	}

	.gh-nav-link:hover {
		color: var(--text-muted);
	}

	.gh-theme-toggle {
		width: 36px;
		height: 36px;
		display: flex;
		align-items: center;
		justify-content: center;
		background: none;
		border: none;
		cursor: pointer;
		color: var(--text-primary);
		border-radius: 50%;
		transition: background 0.15s;
		flex-shrink: 0;
	}

	.gh-theme-toggle:hover {
		background: var(--bg-section);
	}

	/* Footer — always dark */
	.gh-site-footer {
		background: #141414;
		color: #f5f5f7;
		padding-top: 56px;
		margin-top: 80px;
	}

	/* Upper: brand left, nav right */
	.gh-footer-upper {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding-bottom: 48px;
	}

	.gh-footer-brand {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.gh-footer-logo-link {
		display: inline-flex;
		text-decoration: none;
	}

	.gh-footer-logo-img {
		height: 40px;
		width: auto;
	}

	.gh-footer-tagline {
		font-size: 20px;
		font-weight: 700;
		color: #f5f5f7;
		margin: 0;
		letter-spacing: -0.3px;
	}

	.gh-footer-socials {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.gh-footer-socials a {
		display: flex;
		opacity: 0.9;
		transition: opacity 0.15s;
	}

	.gh-footer-socials a:hover {
		opacity: 1;
	}

	/* Nav — right-aligned */
	.gh-footer-nav {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 12px;
		padding-top: 4px;
	}

	.gh-footer-nav a {
		color: #f5f5f7;
		font-size: 16px;
		font-weight: 600;
		text-decoration: none;
		transition: color 0.15s;
	}

	.gh-footer-nav a:hover {
		color: #8e8e8f;
	}

	/* Divider row with scroll-to-top */
	.gh-footer-divider-row {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.gh-footer-divider {
		flex: 1;
		height: 1px;
		background: #333;
	}

	.gh-scroll-top {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1.5px solid #ffb41f;
		background: transparent;
		color: #ffb41f;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		flex-shrink: 0;
		transition: background 0.15s;
	}

	.gh-scroll-top:hover {
		background: rgba(255, 180, 31, 0.12);
	}

	/* Lower: copyright left, become a member right */
	.gh-footer-lower {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 0 28px;
		gap: 24px;
	}

	.gh-footer-copyright {
		font-size: 13px;
		color: #8e8e8f;
		margin: 0;
		font-weight: 500;
	}

	.gh-become-member {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		background: #ffb41f;
		color: #1d1d1f;
		font-size: 15px;
		font-weight: 600;
		padding: 12px 22px;
		border-radius: 100px;
		text-decoration: none;
		white-space: nowrap;
		flex-shrink: 0;
		transition: opacity 0.15s;
	}

	.gh-become-member:hover {
		opacity: 0.88;
		text-decoration: none;
		color: #1d1d1f;
	}

	@media (max-width: 768px) {
		.gh-footer-upper {
			flex-direction: column;
			gap: 40px;
		}

		.gh-footer-nav {
			align-items: flex-start;
		}

		.gh-footer-lower {
			flex-direction: column;
			align-items: flex-start;
			gap: 16px;
		}
	}
</style>
