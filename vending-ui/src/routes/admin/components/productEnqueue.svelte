<script lang="ts">
	import { enhance } from '$app/forms';
	import type { VendableProduct } from '$lib/getProducts';
	import { shelfValidationPattern } from '$lib/machineLayout';
	import type { QueueItem } from '$lib/queueManager';
	import type { SubmitFunction } from '@sveltejs/kit';

	export let queue: QueueItem[] = [];
	export let products: VendableProduct[] = [];
	export let loading: boolean = false;

	const enqueueEnhanceHandler: SubmitFunction = function ({}) {
		loading = true;
		return async ({ result, update }) => {
			if (result.type === 'success') {
				if (result.data?.queue) queue = result.data.queue;
				if (result.data?.products) products = result.data.products;
			}
			update();
			loading = false;
		};
	};
</script>

<div class="card bg-base-100 shadow-xl mx-auto max-w-screen-lg w-full">
	<div class="card-body">
		<h2 class="text-4xl font-bold">Manually Vend items</h2>
		<form action="?/pressKeypad" method="post" use:enhance={enqueueEnhanceHandler}>
			<div class="form-control">
				<input
					class="input input-bordered w-full max-w-xs"
					type="text"
					minlength="2"
					pattern={shelfValidationPattern}
					required
					name="shelf_loc"
				/>
			</div>
			<button class:loading type="submit" class="btn mt-3"> Submit </button>
		</form>
	</div>
</div>
