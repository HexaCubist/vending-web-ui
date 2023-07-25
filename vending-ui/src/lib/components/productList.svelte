<script lang="ts">
	import Product from '$lib/components/product.svelte';
	import type { VendableProduct } from '$lib/getProducts';

	export let products: VendableProduct[];

	export let purchasing = false;
</script>

<div class="products-wrapper py-10">
	<div class="products flex flex-wrap justify-center gap-6 mx-auto max-w-screen-lg">
		{#each products as product}
			<Product {product} bind:purchasing />
		{/each}
	</div>
</div>

<input type="checkbox" id="purchase-modal" bind:checked={purchasing} class="modal-toggle" />
<div class="modal modal-bottom">
	<div class="modal-box text-center">
		<h3 class="font-bold text-lg">Redirecting to checkout...</h3>
		<p class="max-w-prose mx-auto">
			You will be taken to the checkout shortly. We use Stripe for payments, and will only charge
			your card when the machine confirms it has given you the item.
		</p>
		<progress class="progress w-full mt-5 mx-auto" />
	</div>
</div>

<style lang="postcss">
	.products-wrapper {
		@apply flex flex-col justify-center;
		min-height: calc(100vh - 4rem);
	}
</style>
