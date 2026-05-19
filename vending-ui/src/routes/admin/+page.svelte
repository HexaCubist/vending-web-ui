<script lang="ts">
	import type { PageData } from './$types';
	import ProductTable from './components/productTable.svelte';
	import ProductQueue from './components/productQueue.svelte';
	import ProductEnqueue from './components/productEnqueue.svelte';
	import ProductShelf from './components/productShelf.svelte';

	export let data: PageData;

	let loading = false;

	let dateForm: HTMLFormElement | undefined;
	const dateToInput = (date: Date) =>
		`${date.getFullYear()}-${('0' + (date.getMonth() + 1)).slice(-2)}-${(
			'0' + date.getDate()
		).slice(-2)}`;
</script>

<div class="gh-admin-hero">
	<div class="gh-container gh-admin-hero-inner">
		<div class="gh-admin-hero-left">
			<h1 class="gh-admin-title">Admin Console</h1>
			<form method="GET" bind:this={dateForm} class="gh-date-form">
				<label class="gh-date-label" for="startDate">Filter from date</label>
				<input
					id="startDate"
					type="date"
					name="startDate"
					class="gh-date-input"
					value={data.startDate ? dateToInput(new Date(data.startDate)) : undefined}
					on:input={() => {
						if (dateForm) dateForm.submit();
					}}
				/>
			</form>
		</div>

		{#if data.results !== false}
			<div class="gh-stats-row">
				<div class="gh-stat-card">
					<div class="gh-stat-label">Total Sales</div>
					<div class="gh-stat-value">
						{data.month?.totalValue.toLocaleString('en-NZ', {
							style: 'currency',
							currency: 'NZD'
						})}
					</div>
					<div class="gh-stat-meta">
						{data.month?.completedPayments} purchases since {data.startDate
							? new Date(data.startDate).toLocaleDateString()
							: 'start of month'}
					</div>
				</div>
				<div class="gh-stat-card">
					<div class="gh-stat-label">Most Sold</div>
					{#if data.month?.topItems[0]}
						<div class="gh-stat-value">{data.month?.topItems[0].product_name}</div>
						<div class="gh-stat-meta">
							{data.month?.topItems[0].count} purchases &middot; {data.month?.topItems[0].total.toLocaleString(
								'en-NZ',
								{ style: 'currency', currency: 'NZD' }
							)} total
						</div>
					{:else}
						<div class="gh-stat-value">—</div>
						<div class="gh-stat-meta">No sales yet in this period.</div>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<div class="gh-admin-body">
	<div class="gh-container">

		<!-- Queue + Enqueue side-by-side -->
		<div class="gh-ops-area">
			{#if data.queue}
				<div class="gh-section-card gh-queue-card">
					<div class="gh-section-header">
						<h2 class="gh-section-title">Dispatch Queue</h2>
						{#if data.queue.length > 0}
							<span class="gh-count-badge">{data.queue.length}</span>
						{/if}
					</div>
					<ProductQueue bind:queue={data.queue} products={data.products} bind:loading />
				</div>
			{/if}

			<div class="gh-section-card gh-enqueue-card">
				<div class="gh-section-header">
					<h2 class="gh-section-title">Vend Item</h2>
				</div>
				<ProductEnqueue bind:queue={data.queue} products={data.products} {loading} />
			</div>
		</div>

		{#if data.products}
			<!-- Shelf View -->
			<div class="gh-section-card gh-shelf-card">
				<div class="gh-section-header">
					<h2 class="gh-section-title">Shelf View</h2>
				</div>
				<ProductShelf bind:products={data.products} bind:queue={data.queue} />
			</div>

			<!-- All Products table -->
			<div class="gh-section-card gh-table-card">
				<div class="gh-section-header">
					<h2 class="gh-section-title">All Products</h2>
					<span class="gh-product-count">{data.products.length} products</span>
				</div>
				<ProductTable
					startDate={new Date(data.startDate)}
					bind:data
					topItems={data.month.topItems}
				/>
			</div>
		{/if}

	</div>
</div>

<style>
	/* ── Hero ── */
	.gh-admin-hero {
		background: var(--bg-page);
		padding: 48px 0 40px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.gh-admin-hero-inner {
		display: flex;
		flex-wrap: wrap;
		gap: 40px;
		align-items: flex-start;
	}

	.gh-admin-hero-left {
		min-width: 220px;
	}

	.gh-admin-title {
		font-size: 48px;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0 0 20px;
		line-height: 116%;
		letter-spacing: -1px;
	}

	.gh-date-form {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.gh-date-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.gh-date-input {
		padding: 9px 13px;
		border: 1.5px solid var(--border-input);
		border-radius: 8px;
		font-size: 14px;
		font-family: inherit;
		color: var(--text-primary);
		background: var(--bg-page);
		outline: none;
		transition: border-color 0.15s;
	}

	.gh-date-input:focus {
		border-color: var(--text-primary);
	}

	/* ── Stat cards ── */
	.gh-stats-row {
		display: flex;
		flex-wrap: wrap;
		gap: 14px;
		flex: 1;
		min-width: 260px;
	}

	.gh-stat-card {
		flex: 1;
		min-width: 190px;
		background: var(--bg-card);
		border-radius: 10px;
		padding: 20px 24px;
	}

	.gh-stat-label {
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
		margin-bottom: 8px;
	}

	.gh-stat-value {
		font-size: 26px;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 116%;
		margin-bottom: 6px;
		word-break: break-word;
	}

	.gh-stat-meta {
		font-size: 12px;
		color: var(--text-muted);
		line-height: 145%;
		font-weight: 500;
	}

	/* ── Body ── */
	.gh-admin-body {
		padding: 40px 0 80px;
		background: var(--bg-section);
	}

	/* ── Section cards ── */
	.gh-section-card {
		background: var(--bg-page);
		border: 1px solid var(--border-subtle);
		border-radius: 14px;
		padding: 28px 32px;
		margin-bottom: 24px;
	}

	:global([data-color-scheme='dark']) .gh-section-card {
		background: var(--bg-card);
	}

	/* ── Ops area: Queue + Enqueue side by side ── */
	.gh-ops-area {
		display: flex;
		gap: 24px;
		align-items: flex-start;
		margin-bottom: 0;
	}

	.gh-queue-card {
		flex: 1;
		min-width: 0;
	}

	.gh-enqueue-card {
		width: 260px;
		flex-shrink: 0;
	}

	.gh-shelf-card,
	.gh-table-card {
		/* overflow for the table's horizontal scroll */
		overflow: hidden;
	}

	/* ── Badges ── */
	.gh-count-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		min-width: 22px;
		height: 22px;
		background: var(--brand-accent);
		color: #000;
		font-size: 11px;
		font-weight: 700;
		border-radius: 100px;
		padding: 0 7px;
	}

	.gh-product-count {
		font-size: 13px;
		color: var(--text-muted);
		font-weight: 500;
	}

	/* ── Responsive ── */
	@media (max-width: 900px) {
		.gh-ops-area {
			flex-direction: column;
		}

		.gh-enqueue-card {
			width: 100%;
		}
	}

	@media (max-width: 768px) {
		.gh-admin-title {
			font-size: 36px;
		}

		.gh-admin-hero-inner {
			flex-direction: column;
			gap: 28px;
		}

		.gh-section-card {
			padding: 20px 18px;
		}
	}
</style>
