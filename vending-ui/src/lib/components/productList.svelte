<script lang="ts">
	import Product from '$lib/components/product.svelte';
	import { Tags, type VendableProduct } from '$lib/getProducts';

	export let products: VendableProduct[];

	export let purchasing = false;

	let freeWarningModal: HTMLDialogElement;
	let headsUpModal: HTMLDialogElement;
	let selectedProduct: VendableProduct | undefined;
</script>

<div class="products-wrapper py-10">
	<div class="products flex flex-wrap justify-center gap-6 mx-auto max-w-screen-lg">
		{#each products as product}
			<Product {product} bind:purchasing {freeWarningModal} {headsUpModal} bind:selectedProduct />
		{/each}
	</div>
</div>

<dialog bind:this={freeWarningModal} class="modal">
	<form method="dialog" class="modal-box">
		<h3 class="font-bold text-lg">Dispense free product?</h3>
		<p class="pt-4">
			Are you sure you want to do this? Getting a free product will immediately dispense it from the
			vending machine. <strong>We're relying on good-will to keep these items in the machine</strong
			>, so make sure you're by the vending machine before you hit confirm 😊
		</p>
		<div class="modal-action">
			<button class="btn btn-outline">Cancel</button>
			<button class="btn btn-primary" id="confirm">Confirm</button>
		</div>
	</form>
</dialog>
<dialog bind:this={headsUpModal} class="modal">
	<form method="dialog" class="modal-box">
		<h3 class="font-bold text-lg">Heads up!</h3>
		<p class="pt-4">
			{#if selectedProduct?.tags.has(Tags.unique)}
				This slot dispenses unique or one-off items. This means that what you're about to buy might
				not match the photo exactly! Take a quick look in the machine to see what you're about to
				get, and to ensure that there's some left.
			{:else if selectedProduct?.tags.has(Tags.limited)}
				Before you checkout, Take a quick look in the machine to see what you're about to get, and
				to ensure that there's some left!
			{/if}
			{#if selectedProduct?.tags.has(Tags.token)}
				{#if selectedProduct?.tags.has(Tags.unique) || selectedProduct?.tags.has(Tags.limited)}
					<br />
					<br />
				{/if}
				<strong>This item uses our token system!</strong> You will be given a token that you can exchange
				for the item by asking a CT in the space to swap it for you.
			{/if}
		</p>
		{#if selectedProduct}
			<br />
			<table class="table w-full shadow-md bg-base-content text-base-100 rounded-full">
				<tbody>
					<tr class="border-b-0">
						<th>Shelf Location</th>
						<td class="text-right">
							<div class="badge-lg font-bold badge badge-outline">
								{selectedProduct.shelf_loc || 'Unknown!'}
							</div></td
						>
					</tr>
				</tbody>
			</table>
		{/if}
		<div class="modal-action">
			<button class="btn btn-outline">Cancel</button>
			<button class="btn btn-primary" id="confirm">Confirm</button>
		</div>
	</form>
</dialog>

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
