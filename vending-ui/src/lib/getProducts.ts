import Stripe from 'stripe';

export function getPrice(product: Stripe.Product): number | null {
	if (product.default_price) {
		const price = product.default_price;
		if (typeof price === 'string') {
			return 0;
		} else if (price.unit_amount === null) {
			return null;
		} else {
			return price.unit_amount ? price.unit_amount / 100 : 0;
		}
	} else {
		return 0;
	}
}

export enum Tags {
	unique = 'unique',
	token = 'token',
	limited = 'limited',
	featured = 'featured'
}

export type VendableProduct = {
	id: string;
	name: string;
	description: string | null;
	price: number | null;
	image?: string;
	shelf_loc: string;
	indicator?: string;
	stock?: number;
	tags: Set<Tags>;
	active?: boolean;
};

export default async function getProducts(STRIPE_KEY: string, show_unstocked = false) {
	const stripe = new Stripe(STRIPE_KEY, {
		apiVersion: '2024-04-10'
	});

	const all_products = await stripe.products.search({
		query: `${show_unstocked ? '' : "active:'true' AND "}metadata['vendable']:'true'`,
		limit: 100,
		expand: ['data.default_price']
	});

	const vendable_products = all_products.data.filter((product) => {
		const vendable = product.metadata.vendable === 'true';
		const is_free = getPrice(product) === 0;
		const has_link = product.metadata.link !== null;
		const in_stock =
			parseInt(product.metadata.stock) > 0 || isNaN(parseInt(product.metadata.stock));
		return vendable && (is_free || has_link) && (in_stock || show_unstocked);
	});

	const unsorted = vendable_products.map((product) => {
		const tags = Object.entries(product.metadata)
			.filter(([key, value]) => {
				if (value !== 'true') return;
				if (!Object.keys(Tags).includes(key)) return;
				return key;
			})
			.map(([key]) => {
				return Tags[key as keyof typeof Tags];
			});
		const stock = parseInt(product.metadata.stock);
		return {
			id: product.id,
			name: product.name,
			description: product.description,
			price: getPrice(product),
			image: product.images[0],
			shelf_loc: product.metadata.shelf_loc,
			indicator: product.metadata.indicator,
			stock: isNaN(stock) ? undefined : stock,
			tags: new Set(tags),
			active: product.active
		} as VendableProduct;
	});
	return unsorted
		.sort((a, b) => a.shelf_loc?.localeCompare(b.shelf_loc))
		.reduceRight((acc: VendableProduct[], prod) => {
			// Featured first
			if (prod.tags.has(Tags.featured)) {
				return [prod, ...acc];
			}
			return [...acc, prod];
		}, []);
	// .reduceRight((acc: VendableProduct[], prod) => {
	// 	// Out of stock last
	// 	if (prod.stock && (prod.stock < 1 || isNaN(prod.stock))) {
	// 		return [...acc, prod];
	// 	}
	// 	return [prod, ...acc];
	// }, []);
}
