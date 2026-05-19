<script lang="ts">
	import type { PageData } from './$types';
	import ProductList from '$lib/components/productList.svelte';

	export let data: PageData;

	let purchasing = false;
</script>

<section class="gh-hero">
	<div class="gh-container">
		<h1 class="gh-hero-heading">Maker Club<br />Vending Machine</h1>
		<p class="gh-hero-sub">
			We're providing a space for makers to sell things they've created. Items are sold with 100% of
			proceeds after transaction fees going to the creator, charity, or a university club.
		</p>
		<div class="gh-hero-actions">
			<a href="#items" class="gh-main-button">
				View items
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="6 9 12 15 18 9" />
				</svg>
			</a>
			<a
				href="https://docs.google.com/forms/d/e/1FAIpQLSe5s88RGlmT5UIOG1r5gwDQ8y6WZXVQlkfnPGi8vlffbXsv_A/viewform?usp=dialog"
				target="_blank"
				rel="noreferrer"
				class="gh-main-button gh-gradient-button"
			>
				Are you a maker? Apply to sell
			</a>
		</div>
	</div>
</section>

<section id="items" class="gh-items-section">
	<div class="gh-container">
		<div class="gh-section-header">
			<h2 class="gh-section-title">Available Items</h2>
		</div>
		<ProductList products={data.products} bind:purchasing />
	</div>
</section>

<style>
	.gh-hero {
		padding: 96px 0 80px;
		background:
			linear-gradient(to bottom, rgba(0, 0, 0, 0.45) 0%, rgba(0, 0, 0, 0.35) 100%),
			url('/Untitled-design.png') center / cover no-repeat;
	}

	.gh-hero-heading {
		font-size: 64px;
		font-weight: 700;
		line-height: 112%;
		color: #ffffff;
		margin: 0 0 24px;
		letter-spacing: -1.5px;
	}

	.gh-hero-sub {
		font-size: 20px;
		line-height: 145%;
		color: rgba(255, 255, 255, 0.88);
		margin: 0 0 40px;
		max-width: 560px;
	}

	.gh-hero-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
	}

	.gh-items-section {
		padding: 72px 0 96px;
		background: var(--bg-section);
	}

	@media (max-width: 640px) {
		.gh-hero {
			padding: 56px 0 48px;
		}

		.gh-hero-heading {
			font-size: 40px;
			letter-spacing: -0.5px;
		}

		.gh-hero-sub {
			font-size: 18px;
		}
	}
</style>
