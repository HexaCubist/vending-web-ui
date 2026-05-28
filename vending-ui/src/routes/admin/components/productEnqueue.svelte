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

<form action="?/pressKeypad" method="post" use:enhance={enqueueEnhanceHandler} class="pe-form">
	<div class="pe-field">
		<label class="pe-label" for="pe-shelf-loc">Shelf location</label>
		<input
			id="pe-shelf-loc"
			class="pe-input"
			type="text"
			minlength="2"
			pattern={shelfValidationPattern}
			placeholder="e.g. A1"
			required
			name="shelf_loc"
		/>
		<p class="pe-hint">Enter the slot code printed on the shelf.</p>
	</div>
	<button class:loading type="submit" class="gh-main-button pe-submit">Vend item</button>
</form>

<style>
	.pe-form {
		display: flex;
		flex-direction: column;
		gap: 18px;
	}

	.pe-field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.pe-label {
		font-size: 12px;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.07em;
	}

	.pe-input {
		padding: 10px 14px;
		border: 1.5px solid var(--border-input);
		border-radius: 8px;
		font-size: 15px;
		font-family: inherit;
		color: var(--text-primary);
		background: var(--bg-page);
		outline: none;
		transition: border-color 0.15s;
		width: 100%;
	}

	.pe-input:focus {
		border-color: var(--text-primary);
	}

	.pe-hint {
		font-size: 12px;
		color: var(--text-muted);
		margin: 0;
	}

	.pe-submit {
		align-self: flex-start;
	}
</style>
