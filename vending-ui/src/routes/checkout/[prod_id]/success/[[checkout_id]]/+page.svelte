<script lang="ts">
	import type { PageData } from '../$types';

	export let data: PageData;
</script>

<div class="hero min-h-screen -mt-18">
	<div class="hero-content text-center">
		<div class="max-w-lg">
			{#if data.product.price === 0}
				<h1 class="text-5xl font-bold">
					Enjoy your free "{data.product.name}"!
				</h1>
				<p class="py-6">Your product will dispense from the vending machine shortly.</p>
			{:else}
				<h1 class="text-5xl font-bold">Thanks for purchasing "{data.product.name}"!</h1>
				<p class="py-6">
					Your product will dispense from the vending machine shortly. Don't worry! If the vending
					machine is disconnected or broken, your payment should expire and you will be refunded.
				</p>
			{/if}
			<a href="/" class="btn btn-primary">Back to the menu</a>
		</div>
	</div>
</div>
