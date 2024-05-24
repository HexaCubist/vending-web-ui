<script lang="ts">
	import { shelfLayout } from '$lib/machineLayout';
	import { Tags, type VendableProduct } from '$lib/getProducts';
	import EditModal from './editModal.svelte';
	import type { QueueItem } from '$lib/queueManager';
	import { nanoid } from 'nanoid';
	import { enhance } from '$app/forms';
	import type { SubmitFunction } from '@sveltejs/kit';
	import ReplaceModal from './replaceModal.svelte';
	export let products: VendableProduct[] | undefined;
	export let queue: QueueItem[] | undefined;

	let editModalTriggers: Record<string, boolean> = {};
	let replaceModalTriggers: Record<string, boolean> = {};

	let loading = false;
	const productEnhanceHandler: SubmitFunction = function ({ formElement, action, cancel }) {
		loading = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				(queue = result.data?.queue), (products = result.data?.products);
			}
			update();
			loading = false;
			const foundID = (
				formElement.querySelector("input[name='id']") as HTMLInputElement | undefined
			)?.value;
		};
	};
</script>

<div class="flex flex-col rounded-2xl overflow-clip">
	{#each shelfLayout as shelf}
		<div class="shelf-row">
			{#each shelf as slot}
				{@const product = products?.find((p) => p.shelf_loc === slot && p.active)}
				{@const id = `productShelf--${product?.id || slot}`}
				{#if product}
					<div class="product-stat" class:has-image={product.image}>
						{#if product.image}
							<div class="stat-bg">
								<img src={product.image} alt="" />
							</div>
						{/if}
						<div class="stat-value text-lg">
							<div class="badge badge-secondary badge-md badge-outline">{slot}</div>
							{product.name}
						</div>
						<div class="stat-desc flex gap-1 flex-wrap">
							<div class="badge badge-sm">${product.price?.toFixed(2)}</div>

							{#each Object.values(Tags) as tag}
								{#if product.tags.has(tag)}
									<div class="badge badge-primary badge-sm">
										{tag.toLowerCase().replace(/\b\w/g, (s) => s.toUpperCase())}
									</div>
								{/if}
							{/each}
							{#if product.stock && product.stock <= 0}
								<div class="badge bade-xs badge-error">Out of stock</div>
							{/if}
						</div>
						<div class="stat-actions">
							<button
								on:click={() => {
									replaceModalTriggers[id] = true;
								}}
								class="btn btn-warning btn-outline btn-xs mx-auto">Replace</button
							>
							<ReplaceModal
								{id}
								{slot}
								{product}
								{products}
								bind:open={replaceModalTriggers[id]}
								on:update={({ detail }) => {
									queue = detail.queue;
									products = detail.products;
								}}
							/>
							<button
								on:click={() => {
									editModalTriggers[id] = true;
								}}
								class="btn btn-ghost btn-xs float-right">Edit</button
							>
							<EditModal
								{product}
								{id}
								bind:open={editModalTriggers[id]}
								on:update={({ detail }) => {
									queue = detail.queue;
									products = detail.products;
								}}
							/>
						</div>
					</div>
				{:else}
					<div class="card bg-base-content text-base-100 shadow-xl card-compact grow shrink">
						<div class="card-body">
							<div class="badge badge-error mx-auto">Slot {slot}: Empty</div>

							<button
								on:click={() => {
									replaceModalTriggers[id] = true;
								}}
								class="btn btn-warning btn-xs mx-auto">Add Product</button
							>
							<ReplaceModal
								{id}
								{slot}
								{products}
								open={replaceModalTriggers[id]}
								on:update={({ detail }) => {
									queue = detail.queue;
									products = detail.products;
								}}
							/>
						</div>
					</div>
				{/if}
			{/each}
		</div>
	{/each}
</div>

<style lang="postcss">
	.shelf-row {
		@apply grid grid-flow-col gap-4 w-full overflow-x-auto bg-slate-700 p-4 shadow-inner;
		grid-auto-columns: minmax(10rem, 1fr);
	}

	.product-stat {
		@apply bg-base-100 rounded-xl grow stat p-3;
		@apply relative overflow-clip h-full;
		grid-template-columns: repeat(1, minmax(0, 1fr));
		&.has-image {
			& .stat-bg {
				@apply absolute inset-0 z-0 opacity-100 transition duration-300;
				& img {
					@apply object-cover w-full h-full;
				}
			}
			& .stat-value,
			.stat-desc,
			.stat-actions {
				@apply z-10 opacity-0 truncate transition duration-300;
			}
			&:hover {
				& .stat-bg {
					@apply opacity-50 scale-110 blur brightness-125;
				}
				& .stat-value,
				.stat-desc,
				.stat-actions {
					@apply opacity-100;
				}
			}
		}
	}
</style>
