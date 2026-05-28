<script lang="ts">
	import { enhance } from '$app/forms';
	import type { VendableProduct } from '$lib/getProducts';
	import type { QueueItem } from '$lib/queueManager';
	import type { SubmitFunction } from '@sveltejs/kit';

	export let queue: QueueItem[] = [];
	export let products: VendableProduct[] = [];
	export let loading: boolean = false;

	const getFreeProductName = (id: string, prod_id: string) => {
		const foundProduct = products?.find((p) => p.id === prod_id);
		if (foundProduct) return `${foundProduct.name} (Free Item)`;
		return `free:${id} (Free Item)`;
	};
	const queueModals: Record<string, boolean> = {};
	type queueEnhanceHandler = (
		queueItem: QueueItem,
		input: Parameters<SubmitFunction>[0]
	) => ReturnType<SubmitFunction>;
	const queueEnhanceHandler: queueEnhanceHandler = function (queueItem) {
		loading = true;
		return async ({ result, update }) => {
			if (result.type === 'success' && result.data?.queue) {
				queue = result.data.queue;
			}
			update();
			loading = false;
			queueModals[queueItem.id] = false;
		};
	};
</script>

{#if queue.length === 0}
	<p class="pq-empty">No items in queue.</p>
{:else}
	<div class="pq-table-wrap">
		<table class="pq-table">
			<thead>
				<tr>
					<th>#</th>
					<th>Product</th>
					<th>Location</th>
					<th>Qty</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each queue as queueItem, idx}
					<tr>
						<td class="pq-num">{idx + 1}</td>
						<td>{queueItem.product_name || getFreeProductName(queueItem.id, queueItem.product_id)}</td>
						<td><span class="pq-loc">{queueItem.shelf_loc}</span></td>
						<td>{queueItem.quantity}</td>
						<td>
							<label for={`queue-actions-edit-${queueItem.id}`} class="pq-edit-btn">Edit</label>
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
								While the vending machine should manually dispense this item, if something has gone
								wrong you can manually complete or cancel the transaction here
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
{/if}

<style>
	.pq-empty {
		font-size: 14px;
		color: var(--text-muted);
		font-style: italic;
	}

	.pq-table-wrap {
		overflow-x: auto;
		margin: 0 -4px;
	}

	.pq-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}

	.pq-table thead th {
		text-align: left;
		padding: 0 12px 10px;
		font-size: 11px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.06em;
		border-bottom: 1px solid var(--border-subtle);
		white-space: nowrap;
	}

	.pq-table tbody tr {
		border-bottom: 1px solid var(--border-subtle);
		transition: background 0.1s;
	}

	.pq-table tbody tr:last-child {
		border-bottom: none;
	}

	.pq-table tbody tr:hover {
		background: var(--bg-section);
	}

	.pq-table td {
		padding: 12px;
		color: var(--text-primary);
		vertical-align: middle;
	}

	.pq-num {
		color: var(--text-muted);
		font-weight: 700;
		font-size: 12px;
		width: 32px;
	}

	.pq-loc {
		display: inline-block;
		background: var(--bg-section);
		border: 1px solid var(--border-subtle);
		border-radius: 5px;
		padding: 2px 7px;
		font-size: 12px;
		font-weight: 600;
		font-family: monospace;
		color: var(--text-primary);
	}

	.pq-edit-btn {
		display: inline-flex;
		align-items: center;
		padding: 5px 12px;
		border: 1.5px solid var(--border-input);
		border-radius: 6px;
		font-size: 12px;
		font-weight: 500;
		color: var(--text-primary);
		cursor: pointer;
		transition: border-color 0.15s;
		white-space: nowrap;
	}

	.pq-edit-btn:hover {
		border-color: var(--text-muted);
	}
</style>
