<script lang="ts">
	import { enhance } from '$app/forms';
	import type { QueueItem } from '$lib/queueManager';
	import type { SubmitFunction } from '@sveltejs/kit';
	import type { PageData } from './$types';
	import ProductTable from './components/productTable.svelte';
	import { shelfValidationPattern } from '$lib/machineLayout';
	import ProductQueue from './components/productQueue.svelte';
	import ProductEnqueue from './components/productEnqueue.svelte';
	import ProductShelf from './components/productShelf.svelte';

	export let data: PageData;

	let loading = false;

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
		<ProductQueue bind:queue={data.queue} products={data.products} bind:loading />
	{/if}
	<ProductEnqueue bind:queue={data.queue} products={data.products} {loading}></ProductEnqueue>
	{#if data.products}
		<!-- Products -->
		<div class="card bg-base-100 shadow-xl mx-auto max-w-screen-lg w-full">
			<div class="card-body">
				<h2 class="text-4xl font-bold">Shelf View</h2>
				<ProductShelf bind:products={data.products} bind:queue={data.queue} />
				<h2 class="text-4xl font-bold">All Products</h2>
				<ProductTable
					startDate={new Date(data.startDate)}
					bind:data
					topItems={data.month.topItems}
				/>
			</div>
		</div>
	{/if}
</div>

<style lang="postcss">
	.table-overflow {
		max-width: 90vw;
	}
</style>
