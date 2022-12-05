<script lang="ts">
	import { goto } from '$app/navigation';
	import { slide } from 'svelte/transition';
    import type { PageData } from './$types';

    export let data: PageData;

    let purchasing = false;

    const purchase =(product: string): void => {
        purchasing = true;
        console.log(product);
        goto(`/checkout/${product}`);
    }
</script>

<div class="hero h-screen max-h-96 bg-green-100">
    <div class="hero-content text-center">
        <div class="max-w-md">
            <h1 class="text-5xl font-bold">Vending</h1>
            <p class="py-6">
            Welcome! Check out the products below, and click on one to purchase it.
            </p>
        </div>
    </div>
</div>
<div class="products-wrapper bg-green-500 py-10">

    <div class="products  flex justify-center gap-6 mx-auto max-w-2xl">
        {#each data.products as product}
        <div class="card card-compact w-72 bg-base-100 shadow-xl">
            <figure><img src={product.image} alt="" /></figure>
            <div class="card-body">
              <h2 class="card-title">{product.name}</h2>
              {#if product.description}
                <p>{product.description}</p>
              {/if}
              <div class="card-actions justify-end">
                <button on:click={()=>{purchase(product.id)}} class="btn btn-primary">Buy Now: 
                    {#if product.price === 0}
                        Free!
                    {:else}
                        ${product.price.toFixed(2)}
                    {/if}
                </button>
              </div>
            </div>
          </div>
          
        {/each}
    </div>
</div>

<input type="checkbox" id="purchase-modal" bind:checked={purchasing} class="modal-toggle" />
<div class="modal modal-bottom">
    <div class="modal-box text-center">
        <h3 class="font-bold text-lg">Redirecting to checkout...</h3>
        <p class="max-w-prose mx-auto">You will be taken to the checkout shortly. We use Stripe for payments, and will only charge your card when the machine confirms it has given you the item.</p>
        <progress class="progress w-full mt-5 mx-auto"></progress>
    </div>    
</div>

<style lang="postcss">
    :global(body) {
        @apply bg-green-500 min-h-screen;
    }
</style>