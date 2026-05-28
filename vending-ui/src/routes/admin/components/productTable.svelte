<script lang="ts">
	import { onMount } from 'svelte';
	import { type VendableProduct } from '$lib/getProducts';
	import type { PageData } from '../$types';
	import { DateTime } from 'luxon';
	import EditModal from './editModal.svelte';

	export let data: PageData;
	export let topItems: {
		count: number;
		total: number;
		actual_total: number;
		product_name: string;
		product_id: string;
	}[];
	export let filter: (i: VendableProduct) => boolean = () => true;
	export let startDate: Date | undefined = undefined;
	let modalTriggers: Record<string, boolean> = {};

	onMount(() => {
		data.products = data.products?.sort((a, b) =>
			(a.shelf_loc || '').localeCompare(b.shelf_loc || '')
		);
	});

	$: filteredProducts = data.products?.filter(filter) || [];

	let loading = false;

	$: soldSum =
		data.products?.reduce(
			(acc, cur) => acc + (topItems?.find((item) => item.product_id === cur.id)?.total || 0),
			0
		) || 0;
	$: soldNum =
		data.products?.reduce(
			(acc, cur) => acc + (topItems?.find((item) => item.product_id === cur.id)?.count || 0),
			0
		) || 0;
	let daysSince = startDate
		? DateTime.fromJSDate(startDate)
				.diffNow('days')
				.negate()
				.mapUnits((x) => Math.ceil(x))
				.toHuman()
		: '30 days';

	// Pagination
	const pageSize = 10;
	let currentPage = 1;

	$: totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
	$: paginatedProducts = filteredProducts.slice(
		(currentPage - 1) * pageSize,
		currentPage * pageSize
	);
	$: pageWindow = (() => {
		const half = 2;
		let start = Math.max(1, currentPage - half);
		let end = Math.min(totalPages, start + 4);
		start = Math.max(1, end - 4);
		return Array.from({ length: end - start + 1 }, (_, i) => start + i);
	})();
	$: startItem = (currentPage - 1) * pageSize + 1;
	$: endItem = Math.min(currentPage * pageSize, filteredProducts.length);

	function prevPage() {
		if (currentPage > 1) currentPage--;
	}
	function nextPage() {
		if (currentPage < totalPages) currentPage++;
	}
	function goToPage(n: number) {
		currentPage = n;
	}
</script>

<div class="overflow-x-auto table-overflow mt-4">
	<table class="table w-full">
		<thead>
			<tr>
				<th>
					<button
						on:click={() => {
							data.products = data.products?.sort((a, b) => {
								const aLoc = a.shelf_loc || '';
								const bLoc = b.shelf_loc || '';
								return aLoc.localeCompare(bLoc);
							});
							currentPage = 1;
						}}>Location</button
					>
				</th>
				<th>Product</th>
				<th>Price</th>
				<th
					><button
						on:click={() => {
							data.products = data.products?.sort((a, b) => {
								const aSold = topItems?.find((item) => item.product_id === a.id)?.total || 0;
								const bSold = topItems?.find((item) => item.product_id === b.id)?.total || 0;
								return bSold - aSold;
							});
							currentPage = 1;
						}}
					>
						$ Sold ({daysSince})
					</button>
				</th>
				<th
					><button
						on:click={() => {
							data.products = data.products?.sort((a, b) => {
								const aSold =
									topItems?.find((item) => item.product_id === a.id)?.actual_total || 0;
								const bSold =
									topItems?.find((item) => item.product_id === b.id)?.actual_total || 0;
								return bSold - aSold;
							});
							currentPage = 1;
						}}
					>
						$ Income ({daysSince})
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
							currentPage = 1;
						}}
					>
						# Sold ({daysSince})
					</button>
				</th>
				<th>
					<button
						on:click={() => {
							data.products = data.products?.sort((a, b) => {
								const difference = (a.stock ?? Infinity) - (b.stock ?? Infinity);
								return isNaN(difference) ? 0 : difference;
							});
							currentPage = 1;
						}}
					>
						Stock
					</button>
				</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			{#each paginatedProducts as product}
				{@const id = `productTable--${product.id}`}
				<tr class:opacity-60={!product.active}>
					<td>{product.shelf_loc}</td>
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
						<button
							on:click={() => {
								modalTriggers[id] = true;
							}}
							class="btn btn-ghost btn-xs float-right">Edit</button
						>
					</td>
				</tr>
				<EditModal
					{product}
					{id}
					bind:loading
					bind:open={modalTriggers[id]}
					on:update={({ detail }) => {
						data.queue = detail.queue;
						data.products = detail.products;
					}}
				/>
			{:else}
				<tr>
					<td colspan="8" class="text-center text-lg font-semibold text-base-content"
						>No Products!</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

{#if totalPages > 1}
	<div class="pt-pagination">
		<span class="pt-pagination-info">
			Showing {startItem}–{endItem} of {filteredProducts.length} products
		</span>
		<div class="pt-pagination-controls">
			<button class="pt-page-btn" disabled={currentPage === 1} on:click={prevPage}
				>&#8592; Prev</button
			>
			{#each pageWindow as p}
				<button
					class="pt-page-btn"
					class:pt-page-btn--active={p === currentPage}
					on:click={() => goToPage(p)}>{p}</button
				>
			{/each}
			<button class="pt-page-btn" disabled={currentPage === totalPages} on:click={nextPage}
				>Next &#8594;</button
			>
		</div>
	</div>
{/if}

<style>
	.pt-pagination {
		display: flex;
		align-items: center;
		justify-content: space-between;
		flex-wrap: wrap;
		gap: 12px;
		padding: 16px 0 0;
		border-top: 1px solid var(--border-subtle);
		margin-top: 4px;
	}

	.pt-pagination-info {
		font-size: 13px;
		color: var(--text-muted);
		font-weight: 500;
	}

	.pt-pagination-controls {
		display: flex;
		gap: 4px;
		align-items: center;
	}

	.pt-page-btn {
		min-width: 36px;
		height: 34px;
		padding: 0 10px;
		border: 1.5px solid var(--border-input);
		border-radius: 7px;
		font-size: 13px;
		font-weight: 500;
		color: var(--text-primary);
		background: transparent;
		cursor: pointer;
		transition:
			border-color 0.15s,
			background 0.15s,
			color 0.15s;
		font-family: inherit;
		white-space: nowrap;
	}

	.pt-page-btn:hover:not(:disabled) {
		border-color: var(--text-muted);
	}

	.pt-page-btn:disabled {
		opacity: 0.35;
		cursor: default;
	}

	.pt-page-btn--active {
		background: var(--btn-bg);
		color: #fff;
		border-color: var(--btn-bg);
	}

	.pt-page-btn--active:hover {
		opacity: 0.85;
	}
</style>
