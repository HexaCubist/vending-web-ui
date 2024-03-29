<script lang="ts">
	import { enhance } from '$app/forms';
	import type { QueueItem } from '$lib/queueManager';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageData } from './$types';
	import { Tags } from '$lib/getProducts';
	import ProductTable from './productTable.svelte';
	import { onMount } from 'svelte';
	import { DateTime } from 'luxon';

	export let data: PageData;

	const queueModals: Record<string, boolean> = {};
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
			const foundID = (form.querySelector("input[name='id']") as HTMLInputElement | undefined)
				?.value;
			if (foundID) queueModals[foundID] = false;
			if (foundID) productModals[foundID] = false;
		};
	};

	const getFreeProductName = (id: string, prod_id: string) => {
		const foundProduct = data.products?.find((p) => p.id === prod_id);
		if (foundProduct) return `${foundProduct.name} (Free Item)`;
		return `free:${id} (Free Item)`;
	};

	const keypad = (x: number) => {};

	$: activeProducts = data.products?.filter((p) => p.active) || [];
	$: archivedProducts = data.products?.filter((p) => !p.active) || [];

	let dateForm: HTMLFormElement | undefined;
	const dateToInput = (date: Date) =>
		`${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${(
			'0' + date.getDate()
		).slice(-2)}`;
</script>

<div class="hero py-10">
	<div class="hero-content flex-col lg:flex-row gap-14">
		<div class="max-w-sm">
			<h1 class="text-5xl font-bold">Admin Console</h1>
			<!-- Select date (optional) -->
			<div class="datePicker">
				<form method="GET" bind:this={dateForm}>
					<input
						type="date"
						name="startDate"
						class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
						value={data.startDate ? dateToInput(new Date(data.startDate)) : undefined}
						on:input={() => {
							if (dateForm) dateForm.submit();
							// const u = new URL(window.location.href);
							// if(!date) u.searchParams.delete('startDate');
							// else u.searchParams.set('startDate', date.toISOString());
							// window.history.replaceState({}, '', u.href);
						}}
					/>
				</form>
			</div>
		</div>
		{#if data.results !== false}
			<div class="stats grid-flow-row sm:grid-flow-col shadow">
				<div class="stat">
					<div class="stat-title">Total Sales (Month)</div>
					<div class="stat-value">
						{data.month?.totalValue.toLocaleString('en-NZ', { style: 'currency', currency: 'NZD' })}
					</div>
					<div class="stat-desc">
						From {data.month?.completedPayments} purchases since {data.startDate
							? new Date(data.startDate).toLocaleString()
							: 'the start of the month'}
					</div>
				</div>
				<div class="stat">
					<div class="stat-title">Most Sold</div>
					{#if data.month?.topItems[0]}
						<div class="stat-value">{data.month?.topItems[0].product_name}</div>
						<div class="stat-desc">
							From {data.month?.topItems[0].count} purchases since {data.startDate
								? new Date(data.startDate).toLocaleString()
								: 'the start of the month'} totalling {data.month?.topItems[0].total.toLocaleString(
								'en-NZ',
								{
									style: 'currency',
									currency: 'NZD'
								}
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
		<!-- Products -->
		<div class="card bg-base-100 shadow-xl mx-auto max-w-screen-lg w-full">
			<div class="card-body">
				<h2 class="text-4xl font-bold">Products</h2>
				<ProductTable
					startDate={new Date(data.startDate)}
					bind:data
					filter={(p) => !!p.active}
					topItems={data.month.topItems}
				/>
				<h2 class="text-4xl font-bold">Archived Products</h2>
				<div class="collapse collapse-arrow border border-base-300 bg-base-200">
					<input type="checkbox" />
					<div class="collapse-title text-xl font-medium">Archived Products</div>
					<div class="collapse-content">
						<ProductTable
							startDate={new Date(data.startDate)}
							bind:data
							filter={(p) => !p.active}
							topItems={data.month.topItems}
						/>
					</div>
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
