<script lang="ts">
	import { enhance } from '$app/forms';
	import type { QueueItem } from '$lib/queueManager';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageData } from './$types';

	export let data: PageData;

	const queueModals: Record<string, boolean> = {};
	const productModals: Record<string, boolean> = {};
	let loading = false;

	type queueEnhanceHandler = (
		queueItem: QueueItem,
		input: Parameters<SubmitFunction>[0]
	) => ReturnType<SubmitFunction>;

	const queueEnhanceHandler: queueEnhanceHandler = function (queueItem, { form, action, cancel }) {
		// `form` is the `<form>` element
		// `data` is its `FormData` object
		// `action` is the URL to which the form is posted
		// `cancel()` will prevent the submission
		loading = true;
		return async ({ result, update }) => {
			if (result.type === 'success' && result.data?.queue) {
				data.queue = result.data.queue;
			}
			update();
			loading = false;
			queueModals[queueItem.id] = false;
		};
	};
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
			const foundID = (form.querySelector('input#id') as HTMLInputElement | undefined)?.value;
			if (foundID) queueModals[foundID] = false;
		};
	};

	const getFreeProductName = (id: string, prod_id: string) => {
		const foundProduct = data.products?.find((p) => p.id === prod_id);
		if (foundProduct) return `${foundProduct.name} (Free Item)`;
		return `free:${id} (Free Item)`;
	};

	const keypad = (x: number) => {};
</script>

<div class="hero py-10">
	<div class="hero-content flex-col lg:flex-row gap-14">
		<div class="max-w-sm">
			<h1 class="text-5xl font-bold">Admin Console</h1>
		</div>
		{#if data.results !== false}
			<div class="stats grid-flow-row sm:grid-flow-col shadow">
				<div class="stat">
					<div class="stat-title">Total Sales (Month)</div>
					<div class="stat-value">
						{data.month?.totalValue.toLocaleString('en-NZ', { style: 'currency', currency: 'NZD' })}
					</div>
					<div class="stat-desc">
						From {data.month?.completedPayments} purchases this month
					</div>
				</div>
				<div class="stat">
					<div class="stat-title">Most Sold</div>
					{#if data.month?.topItems[0]}
						<div class="stat-value">{data.month?.topItems[0].product_name}</div>
						<div class="stat-desc">
							From {data.month?.topItems[0].count} purchases this month totalling {data.month?.topItems[0].total.toLocaleString(
								'en-NZ',
								{ style: 'currency', currency: 'NZD' }
							)}
						</div>
					{:else}
						<div class="stat-value">Nothing sold :D</div>
						<div class="stat-desc">Once you've sold something, it'll show up here.</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>
<div class="page-contents mx-3 pb-20 grid grid-flow-row auto-rows-auto gap-10">
	{#if data.queue}
		<!-- Queue -->
		<div class="card bg-base-100 shadow-xl mx-auto max-w-screen-lg w-full">
			<div class="card-body">
				<h2 class="text-4xl font-bold">Queued Items</h2>
				<div class="overflow-x-auto table-overflow">
					<table class="table w-full">
						<!-- head -->
						<thead>
							<tr>
								<th />
								<th>Product</th>
								<th>Shelf Location</th>
								<th>Quantity</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#if data.queue.length === 0}
								<tr>
									<td colspan="5" class="text-center text-lg font-semibold text-base-content"
										>No items in queue!</td
									>
								</tr>
							{/if}
							{#each data.queue as queueItem, idx}
								<tr>
									<th>{idx + 1}</th>
									<td
										>{queueItem.product_name ||
											getFreeProductName(queueItem.id, queueItem.product_id)}</td
									>
									<td>{queueItem.shelf_loc}</td>
									<td>{queueItem.quantity}</td>
									<td>
										<label for={`queue-actions-edit-${queueItem.id}`} class="btn btn-ghost btn-xs"
											>Edit</label
										>
									</td>
								</tr>
								<input
									type="checkbox"
									id={`queue-actions-edit-${queueItem.id}`}
									class="modal-toggle"
									bind:checked={queueModals[queueItem.id]}
								/>
								<label for={`queue-actions-edit-${queueItem.id}`} class="modal cursor-pointer">
									<div class="modal-box">
										<h3 class="font-bold text-lg">
											Edit Transaction: "{queueItem.product_name ||
												getFreeProductName(queueItem.id, queueItem.product_id)}"
										</h3>
										<p class="py-4">
											While the vending machine should manually dispense this item, if something has
											gone wrong you can manually complete or cancel the transaction here
										</p>
										<div class="modal-action">
											{#if !queueItem.free}
												<form
													action="?/complete"
													method="post"
													use:enhance={queueEnhanceHandler.bind(undefined, queueItem)}
												>
													<input type="hidden" name="id" value={queueItem.id} />
													<button class:loading type="submit" class="btn btn-success"
														>Done - Charge card</button
													>
												</form>
											{/if}
											<form
												action="?/cancel"
												method="post"
												use:enhance={queueEnhanceHandler.bind(undefined, queueItem)}
											>
												<input type="hidden" name="id" value={queueItem.id} />
												<button class:loading type="submit" class="btn btn-warning"
													>Cancel Transaction</button
												>
											</form>
										</div>
									</div>
								</label>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
	<div class="card bg-base-100 shadow-xl mx-auto max-w-screen-lg w-full">
		<div class="card-body">
			<h2 class="text-4xl font-bold">Manually Vend items</h2>
			<form action="?/pressKeypad" method="post" use:enhance={productEnhanceHandler}>
				<div class="form-control">
					<input
						class="input input-bordered w-full max-w-xs"
						type="number"
						min="11"
						max="99"
						name="shelf_loc"
					/>
				</div>
				<button class:loading type="submit" class="btn mt-3"> Submit </button>
			</form>
		</div>
	</div>
	{#if data.products}
		{@const soldSum = data.products.reduce(
			(acc, cur) =>
				acc + (data.month?.topItems?.find((item) => item.product_id === cur.id)?.total || 0),
			0
		)}
		{@const soldNum = data.products.reduce(
			(acc, cur) =>
				acc + (data.month?.topItems?.find((item) => item.product_id === cur.id)?.count || 0),
			0
		)}
		<!-- Products -->
		<div class="card bg-base-100 shadow-xl mx-auto max-w-screen-lg w-full">
			<div class="card-body">
				<h2 class="text-4xl font-bold">Products</h2>
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
												const aSold =
													data.month?.topItems?.find((item) => item.product_id === a.id)?.total ||
													0;
												const bSold =
													data.month?.topItems?.find((item) => item.product_id === b.id)?.total ||
													0;
												return bSold - aSold;
											});
										}}
									>
										$ Sold (30 days)
									</button>
								</th>
								<th>
									<button
										on:click={() => {
											data.products = data.products?.sort((a, b) => {
												const aSold =
													data.month?.topItems?.find((item) => item.product_id === a.id)?.count ||
													0;
												const bSold =
													data.month?.topItems?.find((item) => item.product_id === b.id)?.count ||
													0;
												return bSold - aSold;
											});
										}}
									>
										# Sold (30 days)
									</button>
								</th>
								<th>Actions</th>
							</tr>
						</thead>
						<tbody>
							{#if data.products.length === 0}
								<tr>
									<td colspan="5" class="text-center text-lg font-semibold text-base-content"
										>No Products!</td
									>
								</tr>
							{/if}
							{#each data.products as product, idx}
								<tr>
									<th>{idx + 1}</th>
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
												<p class="text-sm text-gray-600 max-w-xs truncate">
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
										>{data.month.topItems
											.find((item) => item.product_id === product.id)
											?.total.toLocaleString('en-NZ', { style: 'currency', currency: 'NZD' }) ||
											'$0.00'}
										<progress
											class="progress"
											value={data.month.topItems.find((item) => item.product_id === product.id)
												?.total || 0}
											max={soldSum}
										/>
									</td>
									<td
										>{data.month.topItems.find((item) => item.product_id === product.id)?.count ||
											'0'}
										<progress
											class="progress"
											value={data.month.topItems.find((item) => item.product_id === product.id)
												?.count || 0}
											max={soldNum}
										/>
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
										{#if false}
											<form
												action="?/saveProduct"
												method="post"
												use:enhance={productEnhanceHandler}
												class="grid grid-cols-1 gap-6"
											>
												<input type="hidden" name="id" value={product.id} />
												<div class="form-control w-full max-w-xs">
													<label for={`product-edit-${product.id}-name`} class="label">
														<span class="label-text w-full">Product Name</span>
													</label>
													<input
														id={`product-edit-${product.id}-name`}
														type="text"
														placeholder="Type here"
														class="input input-bordered w-full max-w-xs"
														value={product.name}
													/>
													<label for={`product-edit-${product.id}-name`} class="label">
														<span class="label-text w-full">Price</span>
													</label>
													<label class="input-group">
														<span>$</span>
														<input
															id={`product-edit-${product.id}-name`}
															type="text"
															required
															placeholder="0.00"
															class="input input-bordered"
														/>
													</label>
												</div>
												<div class="submit">
													<button class:loading type="submit" class="btn btn-success"
														>Save Changes</button
													>
												</div>
											</form>
										{/if}
										<div class="modal-action flex flex-wrap justify-between">
											<form
												action="?/dispenseProduct"
												method="post"
												use:enhance={productEnhanceHandler}
											>
												<input type="hidden" name="id" value={product.id} />
												<button class:loading type="submit" class="btn btn-warning"
													>Manually Dispense Product</button
												>
											</form>
											<label for={`product-actions-edit-${product.id}`} class="btn btn-ghost"
												>Close</label
											>
										</div>
									</div>
								</div>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	.table-overflow {
		max-width: 90vw;
	}
</style>
