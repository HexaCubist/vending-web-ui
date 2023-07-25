<script lang="ts">
	import { goto } from '$app/navigation';
	import Product from '$lib/components/product.svelte';
	import { slide } from 'svelte/transition';
	import type { PageData } from './$types';
	import ProductList from '$lib/components/productList.svelte';

	export let data: PageData;

	let purchasing = false;
</script>

<ProductList products={data.products} bind:purchasing />

<style lang="postcss">
	:global(body) {
		@apply min-h-screen;
	}
</style>
