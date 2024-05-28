<script lang="ts">
	import { enhance } from '$app/forms';
	import type { VendableProduct } from '$lib/getProducts';
	import { Tags } from '$lib/getProducts';
	import type { QueueItem } from '$lib/queueManager';
	import type { SubmitFunction } from '@sveltejs/kit';
	import { createEventDispatcher, onMount } from 'svelte';
	import { nanoid } from 'nanoid';

	export let product: VendableProduct;
	export let loading: boolean = false;
	export let open: boolean | undefined = false;
	export let id = `${nanoid()}-product-actions-edit-${product.id}`;

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
			const foundID = (
				formElement.querySelector("input[name='id']") as HTMLInputElement | undefined
			)?.value;
			if (foundID) open = false;
		};
	};

	let modal: HTMLDialogElement;

	onMount(() => {
		modal.addEventListener('close', () => {
			open = false;
		});
	});
	$: if (modal && open && !modal.open) modal.showModal();
	$: if (modal && !open && modal.open) modal.close();

	let productImages: FileList | undefined;
	let imagePicker: HTMLInputElement;
	let imagePreview = product.image;
	$: if (productImages) {
		const file = productImages[0];
		const reader = new FileReader();
		reader.onload = (e) => {
			if (e.target) imagePreview = e.target.result as string;
		};
		reader.readAsDataURL(file);
	}
	let deleteImage = false;

	let editForm = nanoid();
</script>

<dialog bind:this={modal} {id} class="modal">
	<div class="modal-box w-11/12 max-w-5xl">
		<h3 class="font-bold text-lg">Edit "{product.name}"</h3>

		<form
			enctype="multipart/form-data"
			action="?/saveProduct"
			method="post"
			use:enhance={productEnhanceHandler}
			class=""
			id={editForm}
		>
			<div class="multicol-view">
				<div class="image-col">
					<h4 class="text-lg text-gray-500">Product Photo</h4>
					{#if imagePreview}
						<img src={imagePreview} alt="" class="rounded-lg" />
					{/if}
					<input type="hidden" name="delete-image" value={deleteImage ? 'true' : ''} />
					<div class="flex flex-row gap-2">
						<input
							type="file"
							name="image"
							accept="image/jpeg,image/png"
							class="file-input file-input-bordered w-full max-w-xs"
							bind:files={productImages}
							bind:this={imagePicker}
							on:change={() => {
								deleteImage = false;
							}}
						/>
						{#if imagePreview}
							<button
								type="button"
								class="btn btn-error"
								on:click={() => {
									imagePicker.value = '';
									imagePreview = undefined;
									deleteImage = true;
								}}
								title="Remove Image"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									class="h-6 w-6"
									fill="none"
									viewBox="0 0 24 24"
									stroke="currentColor"
									><path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M6 18L18 6M6 6l12 12"
									/></svg
								>
							</button>
						{/if}
					</div>
					<p class="shrink text-wrap text-sm italic text-base-content">
						Please upload images that are less than 2MB in size, ideally less than 500kb and
						1024x1024. Files must be PNG or JPG.
					</p>
				</div>
				<div class="details-col">
					<h4 class="text-lg text-gray-500">Product Details</h4>
					<p class="py-2 text-wrap">
						Note: These products store stats of purchases etc, so <strong>NEVER</strong> use the same
						product here to represent more than one real-life product, unless the product is by the same
						creator and they are fine with not knowing how much of each sold.
					</p>
					<div class="grid grid-cols-1 gap-6 max-h-[50vh] overflow-auto">
						<input type="hidden" name="id" value={product.id} />
						<div class="form-control w-full max-w-xs">
							<!-- NAME -->
							<label for={`product-edit-${product.id}-name`} class="label">
								<span class="label-text w-full">Product Name</span>
							</label>
							<input
								id={`product-edit-${product.id}-name`}
								type="text"
								name="name"
								placeholder="Type here"
								class="input input-bordered w-full max-w-xs"
								value={product.name}
							/>
							<!-- DESCRIPTION -->
							<label for={`product-edit-${product.id}-description`} class="label">
								<span
									class="label-text
									w-full">Product Description</span
								>
							</label>
							<textarea
								id={`product-edit-${product.id}-description`}
								name="description"
								placeholder="Type here"
								class="textarea textarea-bordered w-full max-w-xs">{product.description}</textarea
							>
							<!-- STOCK -->
							<label for={`product-edit-${product.id}-stock`} class="label">
								<span class="label-text w-full">Product Stock</span>
							</label>
							<input
								id={`product-edit-${product.id}-stock`}
								type="number"
								placeholder="Type here"
								class="input input-bordered w-full max-w-xs"
								value={product.stock}
								name="stock"
							/>
							<!-- LOCATION -->
							<label for={`product-edit-${product.id}-shelf_loc`} class="label">
								<span class="label-text w-full">Product Location</span>
							</label>
							<input
								id={`product-edit-${product.id}-shelf_loc`}
								type="number"
								placeholder="Type here"
								class="input input-bordered w-full max-w-xs"
								value={product.shelf_loc}
								name="shelf_loc"
							/>
							<!-- PRICE -->
							<label for={`product-edit-${product.id}-price`} class="label">
								<span class="label-text w-full">Price</span>
							</label>
							<label class="input input-bordered flex items-center gap-2">
								<span>$</span>
								<input
									id={`product-edit-${product.id}-price`}
									type="number"
									required
									placeholder="0.00"
									step="0.01"
									name="price"
									value={product.price?.toFixed(2)}
									class="grow border-0"
								/>
							</label>
						</div>
						<!-- TAGS -->
						{#each Object.values(Tags) as tagname}
							<div class="form-control w-52">
								<label class="cursor-pointer label">
									<span class="label-text">{tagname}</span>
									<input
										name={tagname}
										type="checkbox"
										class="toggle toggle-primary"
										checked={product.tags.has(tagname)}
									/>
								</label>
							</div>
						{/each}
						<div class="form-control w-52">
							<label class="cursor-pointer label">
								<span class="label-text">Archived?</span>
								<input
									name="archive"
									type="checkbox"
									class="toggle toggle-error"
									checked={!product.active}
									value="archive"
								/>
							</label>
						</div>
					</div>
				</div>
			</div>
		</form>
		<div class="modal-action flex flex-wrap justify-between">
			<div class="flex gap-2">
				<form action="?/dispenseProduct" method="post" use:enhance={productEnhanceHandler}>
					<input type="hidden" name="id" value={product.id} />
					<button class:loading type="submit" class="btn btn-sm btn-outline btn-warning"
						>Manually Dispense Product</button
					>
				</form>
				{#if !product.active}
					<form
						action="?/deleteProduct"
						method="post"
						use:enhance={productEnhanceHandler}
						on:submit={() =>
							confirm(
								"Are you sure you would like to DELETE this product FOREVER? Keep in mind this means we can't pull data on transactions, so make sure you pay out anything from this first."
							)}
					>
						<input type="hidden" name="id" value={product.id} />
						<button class:loading type="submit" class="btn btn-sm btn-outline btn-error"
							>Delete Product</button
						>
					</form>
				{/if}
			</div>
			<div class="flex gap-3">
				<button class:loading type="submit" form={editForm} class="btn btn-primary"
					>Save Changes</button
				>
				<form method="dialog">
					<button class="btn btn-ghost">Close</button>
				</form>
			</div>
		</div>
	</div>
	<form method="dialog" class="modal-backdrop">
		<button>close</button>
	</form>
</dialog>

<style lang="postcss">
	.multicol-view {
		@apply grid grid-cols-3 gap-4;
		& .image-col {
			@apply flex flex-col gap-2;
		}
		& .details-col {
			@apply flex flex-col col-span-2 gap-2;
		}
	}
</style>
