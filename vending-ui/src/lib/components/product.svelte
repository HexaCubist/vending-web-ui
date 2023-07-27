<script lang="ts">
	import Stripe from 'stripe';
	import { Tags, type VendableProduct } from '$lib/getProducts';
	import { goto } from '$app/navigation';

	export let product: VendableProduct;
	export let purchasing = false;
	export let freeWarningModal: HTMLDialogElement | undefined;
	export let headsUpModal: HTMLDialogElement | undefined;
	export let selectedProduct: VendableProduct | undefined;

	const purchase = (productId: string): void => {
		selectedProduct = product;
		if (product.price === 0) {
			freeWarningModal?.showModal();
			freeWarningModal?.querySelector('button#confirm')?.addEventListener('click', () => {
				purchasing = true;
				goto(`/checkout/${productId}`);
			});
			return;
		} else if (
			product.tags.has(Tags.unique) ||
			product.tags.has(Tags.limited) ||
			product.tags.has(Tags.token)
		) {
			headsUpModal?.showModal();
			headsUpModal?.querySelector('button#confirm')?.addEventListener('click', () => {
				purchasing = true;
				goto(`/checkout/${productId}`);
			});
		} else {
			purchasing = true;
			goto(`/checkout/${productId}`);
		}
	};
</script>

<div class="indicator">
	{#if product.indicator}
		<div class="indicator-item badge badge-primary">
			{product.indicator}
		</div>
	{/if}
	{#if product.tags.has(Tags.featured)}
		<div
			class="indicator-item bg-[#ffeb3b] w-5 h-5 top-6 right-6 mask mask-heart"
			title="Featured!"
		/>
	{/if}
	<div
		class="card bg-base-100 base-content card-compact w-72 shadow-xl"
		class:disabled={!product.shelf_loc}
	>
		<figure><img src={product.image} alt="" /></figure>
		<div class="card-body">
			<h2 class="card-title">{product.name}</h2>
			{#if product.description}
				<p>{@html product.description}</p>
			{/if}
			<div class="metadata overflow-x-auto">
				<table class="table w-full">
					<tbody>
						<tr class="border-b-0">
							<th>Shelf Location</th>
							<td>{product.shelf_loc || 'Unknown!'}</td>
						</tr>
					</tbody>
				</table>
			</div>
			<div class="card-actions justify-end">
				<button
					on:click={() => {
						purchase(product.id);
					}}
					class="btn light:btn-primary btn-outline btn-sm"
				>
					{#if product.price === 0}
						Dispense (Free)!
					{:else if product.price === null}
						Buy now: Name a price
					{:else}
						Buy Now: {product.price.toLocaleString('en-NZ', { style: 'currency', currency: 'NZD' })}
					{/if}
				</button>
			</div>
		</div>
	</div>
</div>

<style lang="postcss">
	.card.disabled {
		@apply opacity-50 pointer-events-none select-none;
	}
</style>
