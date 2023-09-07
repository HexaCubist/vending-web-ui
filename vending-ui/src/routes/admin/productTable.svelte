<script lang="ts">
	import { Tags, type VendableProduct } from '$lib/getProducts';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	export let data: PageData;
	export let topItems: {
		count: number;
		total: number;
		actual_total: number;
		product_name: string;
		product_id: string;
	}[];
	export let filter: (i: VendableProduct) => boolean = () => true;

	$: filteredProducts = data.products?.filter(filter) || [];

	let loading = false;
	const productModals: Record<string, boolean> = {};
	const productEnhanceHandler: SubmitFunction = function ({ form, action, cancel }) {
		// `form` is the `<form>` element
		// `data` is its `FormData` object
		// `action` is the URL to which the form is posted
		// `cancel()` will prevent the submission
		loading = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				if (result.data?.queue) data.queue = result.data.queue;
				if (result.data?.products) data.products = result.data.products;
			}
			update();
			loading = false;
			const foundID = (form.querySelector("input[name='id']") as HTMLInputElement | undefined)
				?.value;
			if (foundID) productModals[foundID] = false;
		};
	};

	$: soldSum =
		data.products?.reduce(
			(acc, cur) => acc + (topItems?.find((item) => item.product_id === cur.id)?.total || 0),
			0
		) || [];
	$: soldNum =
		data.products?.reduce(
			(acc, cur) => acc + (topItems?.find((item) => item.product_id === cur.id)?.count || 0),
			0
		) || [];
</script>

<div class="overflow-x-auto table-overflow">
	<table class="table w-full">
		<!-- head -->
		<thead>
			<tr>
				<th />
				<th>Product</th>
				<th>
					<button
						on:click={() => {
							data.products = data.products?.sort((a, b) => {
								const aLoc = a.shelf_loc || '';
								const bLoc = b.shelf_loc || '';
								return aLoc.localeCompare(bLoc);
							});
						}}>Shelf Location</button
					>
				</th>
				<th>Price</th>
				<th
					><button
						on:click={() => {
							data.products = data.products?.sort((a, b) => {
								const aSold = topItems?.find((item) => item.product_id === a.id)?.total || 0;
								const bSold = topItems?.find((item) => item.product_id === b.id)?.total || 0;
								return bSold - aSold;
							});
						}}
					>
						$ Sold (30 days)
					</button>
				</th>
				<th
					><button
						on:click={() => {
							data.products = data.products?.sort((a, b) => {
								const aSold = topItems?.find((item) => item.product_id === a.id)?.actual_total || 0;
								const bSold = topItems?.find((item) => item.product_id === b.id)?.actual_total || 0;
								return bSold - aSold;
							});
						}}
					>
						$ Income (30 days)
					</button>
				</th>
				<th>
					<button
						on:click={() => {
							data.products = data.products?.sort((a, b) => {
								const aSold = topItems?.find((item) => item.product_id === a.id)?.count || 0;
								const bSold = topItems?.find((item) => item.product_id === b.id)?.count || 0;
								return bSold - aSold;
							});
						}}
					>
						# Sold (30 days)
					</button>
				</th>
				<th>
					<button
						on:click={() => {
							data.products = data.products?.sort((a, b) => {
								const difference = (a.stock ?? Infinity) - (b.stock ?? Infinity);
								return isNaN(difference) ? 0 : difference;
							});
						}}
					>
						Stock
					</button>
				</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each filteredProducts as product, idx}
				<tr class:opacity-60={!product.active}>
					<th class:bg-error={product.stock === 0} class:text-error-content={product.stock === 0}
						>{idx + 1}</th
					>
					<td>
						<div class="flex items-center space-x-3">
							{#if product.image}
								<div class="avatar">
									<div class="mask mask-squircle w-12 h-12">
										<img src={product.image} alt="" />
									</div>
								</div>
							{/if}
							<div>
								<p class="font-bold">{product.name}</p>
								<p class="text-sm text-gray-600 max-w-[15ch] truncate">
									{product.description || ''}
								</p>
							</div>
						</div>
					</td>
					<td>{product.shelf_loc}</td>
					<td
						>{product.price === null
							? 'Any'
							: product.price.toLocaleString('en-NZ', {
									style: 'currency',
									currency: 'NZD'
							  })}</td
					>
					<td
						>{topItems
							.find((item) => item.product_id === product.id)
							?.total.toLocaleString('en-NZ', { style: 'currency', currency: 'NZD' }) || '$0.00'}
						<progress
							class="progress"
							value={topItems.find((item) => item.product_id === product.id)?.total || 0}
							max={soldSum}
						/>
					</td>
					<td
						>{topItems
							.find((item) => item.product_id === product.id)
							?.actual_total.toLocaleString('en-NZ', { style: 'currency', currency: 'NZD' }) ||
							'$0.00'}
						<progress
							class="progress"
							value={topItems.find((item) => item.product_id === product.id)?.actual_total || 0}
							max={soldSum}
						/>
					</td>
					<td
						>{topItems.find((item) => item.product_id === product.id)?.count || '0'}
						<progress
							class="progress"
							value={topItems.find((item) => item.product_id === product.id)?.count || 0}
							max={soldNum}
						/>
					</td>
					<td
						>{product.stock ?? '∞'}
						<progress class="progress" value={product.stock ?? 10} max={10} />
					</td>
					<td>
						<label for={`product-actions-edit-${product.id}`} class="btn btn-ghost btn-xs"
							>Edit</label
						>
					</td>
				</tr>
				<input
					type="checkbox"
					id={`product-actions-edit-${product.id}`}
					class="modal-toggle"
					bind:checked={productModals[product.id]}
				/>
				<div class="modal">
					<div class="modal-box">
						<h3 class="font-bold text-lg">Edit "{product.name}"</h3>
						<form
							action="?/saveProduct"
							method="post"
							use:enhance={productEnhanceHandler}
							class="grid grid-cols-1 gap-6"
						>
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
								<label class="input-group">
									<span>$</span>
									<input
										id={`product-edit-${product.id}-price`}
										type="number"
										required
										placeholder="0.00"
										step="0.01"
										name="price"
										value={product.price?.toFixed(2)}
										class="input input-bordered"
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
							<div class="submit">
								<button class:loading type="submit" class="btn btn-success">Save Changes</button>
							</div>
						</form>
						<div class="modal-action flex flex-wrap justify-between">
							<form action="?/dispenseProduct" method="post" use:enhance={productEnhanceHandler}>
								<input type="hidden" name="id" value={product.id} />
								<button class:loading type="submit" class="btn btn-warning"
									>Manually Dispense Product</button
								>
							</form>
							<label for={`product-actions-edit-${product.id}`} class="btn btn-ghost">Close</label>
						</div>
					</div>
				</div>
			{:else}
				<tr>
					<td colspan="5" class="text-center text-lg font-semibold text-base-content"
						>No Products!</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
