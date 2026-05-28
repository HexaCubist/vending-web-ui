<script lang="ts">
	import { shelfLayout } from '$lib/machineLayout';
	import { type VendableProduct } from '$lib/getProducts';
	import EditModal from './editModal.svelte';
	import type { QueueItem } from '$lib/queueManager';
	import ReplaceModal from './replaceModal.svelte';

	export let products: VendableProduct[] | undefined;
	export let queue: QueueItem[] | undefined;

	let editTriggers: Record<string, boolean> = {};
	let replaceTriggers: Record<string, boolean> = {};
</script>

<div class="vm-body">
	<!-- Brand strip -->
	<div class="vm-header">
		<span class="vm-brand">Maker Club · Vending Machine</span>
		<span class="vm-status" title="Online"></span>
	</div>

	<!-- Glass panel with shelves -->
	<div class="vm-glass">
		{#each shelfLayout as shelf, rowIndex}
			<div class="vm-row" style="--slots: {shelf.length}">
				{#each shelf as slot}
					{@const product = products?.find((p) => p.shelf_loc === slot && p.active)}
					{@const id = `shelf-${product?.id ?? slot}`}
					{@const oos = typeof product?.stock === 'number' && product.stock <= 0}

					<div
						class="vm-slot"
						class:vm-slot--filled={!!product}
						class:vm-slot--empty={!product}
						role="button"
						tabindex="0"
						on:click={() => (product ? (editTriggers[id] = true) : (replaceTriggers[id] = true))}
						on:keydown={(e) => {
							if (e.key === 'Enter')
								product ? (editTriggers[id] = true) : (replaceTriggers[id] = true);
						}}
					>
						<!-- Background: image, brand gradient, or empty -->
						{#if product?.image}
							<img src={product.image} alt="" class="vm-img" />
						{:else if product}
							<div class="vm-gradient"></div>
						{/if}

						{#if !product}
							<div class="vm-add">
								<svg
									width="20"
									height="20"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="1.5"
									stroke-linecap="round"
								>
									<path d="M12 5v14M5 12h14" />
								</svg>
							</div>
						{/if}

						<!-- Name + price (fade in on hover) -->
						{#if product}
							<div class="vm-info">
								<span class="vm-name">{product.name}</span>
								<span class="vm-price">${product.price?.toFixed(2)}</span>
							</div>

							<!-- Replace button (top-right, visible on hover) -->
							<button
								class="vm-replace"
								title="Replace product in this slot"
								on:click|stopPropagation={() => (replaceTriggers[id] = true)}
							>
								<svg
									width="11"
									height="11"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
								>
									<path d="M1 4v6h6M23 20v-6h-6" />
									<path
										d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 0 1 3.51 15"
									/>
								</svg>
							</button>
						{/if}

						<!-- Out of stock badge -->
						{#if oos}
							<div class="vm-oos">Out of stock</div>
						{/if}

						<!-- Slot number (always visible, top-left) -->
						<div class="vm-num">{slot}</div>
					</div>

					<!-- Modals (rendered outside slot to avoid clipping) -->
					{#if product}
						<EditModal
							{product}
							{id}
							bind:open={editTriggers[id]}
							on:update={({ detail }) => {
								queue = detail.queue;
								products = detail.products;
							}}
						/>
					{/if}
					<ReplaceModal
						{id}
						{slot}
						{product}
						{products}
						bind:open={replaceTriggers[id]}
						on:update={({ detail }) => {
							queue = detail.queue;
							products = detail.products;
						}}
					/>
				{/each}
			</div>

			<!-- Physical shelf bar between rows -->
			{#if rowIndex < shelfLayout.length - 1}
				<div class="vm-shelf-bar"></div>
			{/if}
		{/each}
	</div>

	<!-- Dispense tray at the bottom -->
	<div class="vm-footer">
		<span class="vm-tray-label">↓ Dispense tray</span>
		<div class="vm-tray"></div>
	</div>
</div>

<style>
	/* ═══════════════════════════════════════════════
	   LIGHT MODE (default)
	   ═══════════════════════════════════════════════ */

	.vm-body {
		background: linear-gradient(160deg, #e4e4ec 0%, #d8d8e8 60%, #cecede 100%);
		border-radius: 20px;
		padding: 20px 20px 0;
		box-shadow:
			0 16px 48px rgba(0, 0, 0, 0.12),
			inset 0 1px 0 rgba(255, 255, 255, 0.8);
	}

	.vm-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-bottom: 14px;
	}

	.vm-brand {
		font-size: 12px;
		font-weight: 600;
		color: rgba(0, 0, 0, 0.35);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.vm-status {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #22c55e;
		box-shadow: 0 0 8px #22c55e;
	}

	.vm-glass {
		background: rgba(255, 255, 255, 0.6);
		border: 1px solid rgba(0, 0, 0, 0.1);
		border-radius: 10px 10px 0 0;
		overflow: hidden;
	}

	.vm-row {
		display: grid;
		grid-template-columns: repeat(var(--slots), 1fr);
		gap: 6px;
		padding: 10px 10px 14px;
		background: rgba(255, 255, 255, 0.4);
	}

	.vm-shelf-bar {
		height: 10px;
		background: linear-gradient(180deg, #b0b0c0 0%, #909098 60%, #787880 100%);
		box-shadow:
			0 4px 6px rgba(0, 0, 0, 0.15),
			inset 0 1px 0 rgba(255, 255, 255, 0.4);
	}

	.vm-slot {
		position: relative;
		height: 110px;
		border-radius: 7px;
		overflow: hidden;
		cursor: pointer;
		outline: none;
		transition:
			transform 0.15s ease,
			box-shadow 0.15s ease;
	}

	.vm-slot--filled {
		background: #f0f0f5;
		box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
	}

	.vm-slot--empty {
		background: rgba(0, 0, 0, 0.03);
		border: 1.5px dashed rgba(0, 0, 0, 0.18);
	}

	.vm-slot--filled:hover {
		transform: translateY(-3px) scale(1.025);
		box-shadow:
			0 10px 24px rgba(0, 0, 0, 0.15),
			0 0 0 2px rgba(255, 180, 31, 0.7);
		z-index: 2;
	}

	.vm-slot--empty:hover {
		border-color: rgba(255, 180, 31, 0.6);
		background: rgba(255, 180, 31, 0.05);
		box-shadow: 0 0 0 2px rgba(255, 180, 31, 0.25);
	}

	.vm-slot:focus-visible {
		box-shadow: 0 0 0 2px #ffb41f;
	}

	.vm-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.vm-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(160deg, #d4d4d8 0%, #b8b8be 100%);
	}

	:global([data-color-scheme='dark']) .vm-gradient {
		background: linear-gradient(160deg, #565658 0%, #424244 100%);
	}

	.vm-add {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: rgba(0, 0, 0, 0.2);
		transition: color 0.15s;
	}

	.vm-slot--empty:hover .vm-add {
		color: rgba(255, 160, 0, 0.7);
	}

	.vm-info {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		padding: 24px 7px 6px;
		background: linear-gradient(to top, rgba(0, 0, 0, 0.82) 0%, transparent 100%);
		display: flex;
		flex-direction: column;
		gap: 1px;
		opacity: 0;
		transition: opacity 0.18s;
		z-index: 2;
	}

	.vm-slot--filled:hover .vm-info {
		opacity: 1;
	}

	.vm-name {
		font-size: 10.5px;
		font-weight: 600;
		color: #fff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		line-height: 1.3;
	}

	.vm-price {
		font-size: 10.5px;
		font-weight: 700;
		color: #ffb41f;
	}

	.vm-num {
		position: absolute;
		top: 5px;
		left: 5px;
		background: rgba(0, 0, 0, 0.15);
		color: rgba(0, 0, 0, 0.55);
		font-size: 9.5px;
		font-weight: 700;
		padding: 2px 5px;
		border-radius: 3px;
		letter-spacing: 0.04em;
		z-index: 3;
	}

	.vm-replace {
		position: absolute;
		top: 5px;
		right: 5px;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.7);
		border: 1px solid rgba(0, 0, 0, 0.15);
		color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0;
		transition:
			opacity 0.15s,
			background 0.15s,
			border-color 0.15s;
		cursor: pointer;
		z-index: 4;
	}

	.vm-slot:hover .vm-replace {
		opacity: 1;
	}

	.vm-replace:hover {
		background: rgba(255, 180, 31, 0.2);
		border-color: rgba(255, 180, 31, 0.7);
		color: #d07000;
	}

	.vm-oos {
		position: absolute;
		bottom: 24px;
		left: 50%;
		transform: translateX(-50%);
		background: rgba(220, 38, 38, 0.85);
		color: white;
		font-size: 8px;
		font-weight: 800;
		padding: 2px 6px;
		border-radius: 3px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		white-space: nowrap;
		z-index: 3;
	}

	.vm-footer {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 10px 14px;
	}

	.vm-tray-label {
		font-size: 10px;
		color: rgba(0, 0, 0, 0.3);
		font-weight: 500;
		white-space: nowrap;
		letter-spacing: 0.04em;
	}

	.vm-tray {
		flex: 1;
		height: 16px;
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.1);
		border: 1px solid rgba(0, 0, 0, 0.08);
	}

	/* ═══════════════════════════════════════════════
	   DARK MODE overrides
	   ═══════════════════════════════════════════════ */

	:global([data-color-scheme='dark']) .vm-body {
		background: linear-gradient(160deg, #3e3e40 0%, #303032 60%, #272729 100%);
		box-shadow:
			0 24px 64px rgba(0, 0, 0, 0.45),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	:global([data-color-scheme='dark']) .vm-brand {
		color: rgba(255, 255, 255, 0.32);
	}

	:global([data-color-scheme='dark']) .vm-glass {
		background: rgba(255, 255, 255, 0.03);
		border-color: rgba(255, 255, 255, 0.08);
	}

	:global([data-color-scheme='dark']) .vm-row {
		background: transparent;
	}

	:global([data-color-scheme='dark']) .vm-shelf-bar {
		background: linear-gradient(180deg, #505052 0%, #323234 60%, #272729 100%);
		box-shadow:
			0 4px 8px rgba(0, 0, 0, 0.4),
			inset 0 1px 0 rgba(255, 255, 255, 0.06);
	}

	:global([data-color-scheme='dark']) .vm-slot--filled {
		background: #3a3a3c;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.05);
	}

	:global([data-color-scheme='dark']) .vm-slot--empty {
		background: rgba(255, 255, 255, 0.025);
		border-color: rgba(255, 255, 255, 0.12);
	}

	:global([data-color-scheme='dark']) .vm-slot--filled:hover {
		box-shadow:
			0 10px 28px rgba(0, 0, 0, 0.55),
			0 0 0 2px rgba(255, 180, 31, 0.65);
	}

	:global([data-color-scheme='dark']) .vm-slot--empty:hover {
		border-color: rgba(255, 180, 31, 0.45);
		background: rgba(255, 180, 31, 0.04);
		box-shadow: 0 0 0 2px rgba(255, 180, 31, 0.25);
	}

	:global([data-color-scheme='dark']) .vm-add {
		color: rgba(255, 255, 255, 0.18);
	}

	:global([data-color-scheme='dark']) .vm-slot--empty:hover .vm-add {
		color: rgba(255, 180, 31, 0.55);
	}

	:global([data-color-scheme='dark']) .vm-num {
		background: rgba(0, 0, 0, 0.55);
		color: rgba(255, 255, 255, 0.6);
	}

	:global([data-color-scheme='dark']) .vm-replace {
		background: rgba(0, 0, 0, 0.5);
		border-color: rgba(255, 255, 255, 0.15);
		color: rgba(255, 255, 255, 0.6);
	}

	:global([data-color-scheme='dark']) .vm-replace:hover {
		background: rgba(255, 180, 31, 0.25);
		border-color: rgba(255, 180, 31, 0.6);
		color: #ffb41f;
	}

	:global([data-color-scheme='dark']) .vm-tray-label {
		color: rgba(255, 255, 255, 0.18);
	}

	:global([data-color-scheme='dark']) .vm-tray {
		background: rgba(0, 0, 0, 0.4);
		border-color: rgba(255, 255, 255, 0.05);
	}
</style>
