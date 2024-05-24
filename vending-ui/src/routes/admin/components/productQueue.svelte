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
						<th>Location</th>
						<th>Quantity</th>
						<th>Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if queue.length === 0}
						<tr>
							<td colspan="5" class="text-center text-lg font-semibold text-base-content"
								>No items in queue!</td
							>
						</tr>
					{/if}
					{#each queue as queueItem, idx}
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
