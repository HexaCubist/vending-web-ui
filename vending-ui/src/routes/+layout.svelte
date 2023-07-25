<script lang="ts">
	import { page } from '$app/stores';
	import '../app.postcss';
</script>

<div class="brand-ribbon bg-brand-gradient" />
<header>
	<div class="return-btn">
		{#if $page.url.pathname !== '/'}
			<a href="/">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-6 w-6"
					fill="none"
					viewBox="0 0 24 24"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 19l-7-7m0 0l7-7m-7 7h18"
					/>
				</svg>
			</a>
		{/if}
	</div>
	<div class="page-title">
		<h1>Vending Machine</h1>
	</div>
</header>
<main class="bg-brand-gradient-light dark:bg-brand-gradient-dark">
	<slot />
</main>
<footer class="footer p-10 bg-neutral text-neutral-content">
	<div>
		<span class="footer-title">Maker Club</span>
		<a class="link link-hover" href="https://makeuoa.nz/">About</a>
		<a class="link link-hover" href="https://makeuoa.nz/code-of-conduct/">Code of Conduct</a>
		<a class="link link-hover" href="https://makeuoa.nz/tag/events/">Events</a>
	</div>
	<div>
		<span class="footer-title">Creators</span>
		<a class="link link-hover" href="https://makeuoa.nz/about/creators">Learn more</a>
		<a class="link link-hover" href="https://makeuoa.nz/about/creators/join"
			>Get your stuff in here!</a
		>
	</div>
	<div>
		<span class="footer-title">Maker Space</span>
		<a class="link link-hover" href="https://www.cie.auckland.ac.nz/locations/maker-space/"
			>Learn More</a
		>
	</div>
</footer>

<style lang="postcss">
	.brand-ribbon {
		@apply h-2 w-full absolute top-0 left-0 z-30;
	}
	header {
		@apply bg-base-100 flex items-center justify-between p-4 pt-5 z-20 relative;
	}
</style>
