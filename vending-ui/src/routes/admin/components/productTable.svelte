<script lang="ts">
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
				// .set({ hours: 0, minutes: 0, seconds: 0, milliseconds: 0 })
				.toHuman()
		: '30 days';
</script>

<div class="overflow-x-auto table-overflow mt-4">
	<table class="table w-full">
		<!-- head -->
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
						}}
					>
						$ Sold ({daysSince})
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
					<td colspan="5" class="text-center text-lg font-semibold text-base-content"
						>No Products!</td
					>
				</tr>
			{/each}
		</tbody>
	</table>
</div>
