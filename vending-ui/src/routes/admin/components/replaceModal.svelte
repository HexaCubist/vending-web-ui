<script lang="ts">
	import { enhance } from '$app/forms';
	import type { VendableProduct } from '$lib/getProducts';
	import type { QueueItem } from '$lib/queueManager';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { createEventDispatcher, onMount } from 'svelte';
	import { nanoid } from 'nanoid';

	export let loading: boolean = false;
	export let open: boolean | undefined = false;
	export let id = `${nanoid()}-product-actions-replace`;
	export let products: VendableProduct[] | undefined;
	export let slot: string;
	export let product: VendableProduct | undefined = undefined;

	const dispatch = createEventDispatcher<{
		update: { queue?: QueueItem[]; products?: VendableProduct[] };
	}>();

	const productEnhanceHandler: SubmitFunction = function ({ formElement, action, cancel }) {
		loading = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				dispatch('update', {
					queue: result.data?.queue,
					products: result.data?.products
				});
			}
			update();
			loading = false;
			open = false;
		};
	};

	let modal: HTMLDialogElement;

	onMount(() => {
		console.log('mounting!!' + id);
		modal.addEventListener('close', () => {
			open = false;
		});
	});
	$: if (modal && open && !modal.open) modal.showModal();
	$: if (modal && !open && modal.open) modal.close();

	let editForm = nanoid();
</script>

<dialog bind:this={modal} {id} class="modal">
	<div class="modal-box text-base-content">
		<h3 class="font-bold text-lg">Add/replace product to slot</h3>

		<p class="text-wrap">
			Select a product to add to this slot, or create a new product to add to this slot.
		</p>

		<form action="?/activateProduct" method="post" use:enhance={productEnhanceHandler}>
			<input type="hidden" name="slot" value={slot} />
			{#if product}
				<input type="hidden" name="oldID" value={product.id} />
			{/if}
			<select class="select select-bordered w-full max-w-xs text-base-content" name="newID">
				<option disabled selected>Activate..</option>
				<option value="newProd">Create New Product </option>
				<option disabled>--Archived in This Slot--</option>
				{#each products?.filter((p) => p.shelf_loc === slot) || [] as product}
					<option value={product.id}>{product.name} (${product.price?.toFixed(2) || '0.00'})</option
					>
				{/each}
				<option disabled>-- All Products --</option>
				{#each products?.filter((p) => p.shelf_loc !== slot) || [] as product}
					<option value={product.id}>{product.name} (${product.price?.toFixed(2) || '0.00'})</option
					>
				{/each}
			</select>
			<button class:loading type="submit" class="btn mt-3"> Confirm </button>
		</form>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>
