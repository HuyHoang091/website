import {BRAND_NAMES, COLOR_CODES} from "./consts";

export const filterProduct = (props) => {
	let {products = [], searchTerm = [], filters = []} = props;
	console.log(products)
	return products?.filter(product => {
		// Search filter
		if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
			return false;
		}
		
		// Category filter
		if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
			return false;
		}
		
		// Brand filter
		if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
			return false;
		}
		
		// Price filter
		if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
			return false;
		}
		
		// Size filter
		if (filters.sizes.length > 0 && !filters.sizes.some(size => product.sizes.includes(size))) {
			return false;
		}
		
		// Color filter
		if (filters.colors.length > 0 && !filters.colors.some(color => product.colors.includes(color))) {
			return false;
		}
		
		return true;
	}) || [];
}

export const formatPrice = (price) => {
	return new Intl.NumberFormat('vi-VN', {
		style: 'currency',
		currency: 'VND'
	}).format(price);
};

export const getBrandName = (brand) => {
	return BRAND_NAMES[brand] || brand.toUpperCase();
};

export const generateStars = (rating) => {
	const fullStars = Math.floor(rating);
	const hasHalfStar = rating % 1 !== 0;
	let stars = '';
	
	for (let i = 0; i < fullStars; i++) {
		stars += '★';
	}
	if (hasHalfStar) {
		stars += '☆';
	}
	for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
		stars += '☆';
	}
	
	return stars;
};

export const getColorCode = (color) => {
	if (color.startsWith('#')) return color;
	return COLOR_CODES[color] || '#cccccc';
};

export const checkPriceRange = ({filters, product}) => {
	let matchesPrice = false;
	filters.priceRanges.forEach(range => {
		switch (range) {
			case 'under-300':
				if (product.price < 300000) matchesPrice = true;
				break;
			case '300-500':
				if (product.price >= 300000 && product.price <= 500000) matchesPrice = true;
				break;
			case '500-1000':
				if (product.price >= 500000 && product.price <= 1000000) matchesPrice = true;
				break;
			case 'over-1000':
				if (product.price > 1000000) matchesPrice = true;
				break;
		}
	});
	
	if (!matchesPrice) return false;
}
