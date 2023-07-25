<script lang="ts">
	import { goto } from '$app/navigation';
	import Product from '$lib/components/product.svelte';
	import { slide } from 'svelte/transition';
	import type { PageData } from './$types';
	import ProductList from '$lib/components/productList.svelte';

	export let data: PageData;

	let purchasing = false;
</script>

<div class="hero bg-base-100">
	<div class="hero-content text-center">
		<div class="max-w-2xl">
			<h2 class="text-5xl font-bold">Vending Machine!</h2>
			<p class="py-6 text-justify">
				Welcome to the Maker Club's vending machine. We're providing a space for makers to sell
				things they've created. Items here are sold with 100% of proceeds after transaction fees
				going to the creator, charity, or a university club.
				<a href="https://makeuoa.nz/wares/" class="font-bold hover:underline">Are you a maker?</a> Consider
				selling your creations too!
			</p>
			<div class="flex flex-wrap gap-4 justify-center">
				<a href="#items" class="btn btn-primary">
					View items

					<!-- Source: Feather Icons -->
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
						class="feather feather-chevron-down"><polyline points="6 9 12 15 18 9" /></svg
					>
				</a>
				<a target="_blank" rel="noreferrer" href="https://makeuoa.nz/wares/" class="btn btn-outline"
					>Apply to sell</a
				>
			</div>
		</div>
	</div>
</div>

<div id="items">
	<ProductList products={data.products} bind:purchasing />
</div>

<style lang="postcss">
	:global(body) {
		@apply min-h-screen;
	}
</style>
