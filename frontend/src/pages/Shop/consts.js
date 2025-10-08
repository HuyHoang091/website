// Categories
export const CATEGORIES = [
	{ id: 'ao-so-mi', name: 'Áo Sơ Mi', count: 45 },
	{ id: 'quan-jean', name: 'Quần Jean', count: 32 },
	{ id: 'ao-thun', name: 'Áo Thun', count: 67 },
	{ id: 'vay-dam', name: 'Váy Đầm', count: 28 }
];

// Brands
export const BRANDS = [
	{ id: 'zara', name: 'ZARA', count: 38 },
	{ id: 'hm', name: 'H&M', count: 52 },
	{ id: 'uniqlo', name: 'UNIQLO', count: 41 },
	{ id: 'mango', name: 'MANGO', count: 29 }
];

// Sizes
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '29', '30', '31', '32', '33', '34'];

// Colors
export const COLORS = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'purple', 'pink', 'gray', 'brown', 'navy', 'beige'];

// Brand names mapping
export const BRAND_NAMES = {
	'zara': 'ZARA',
	'hm': 'H&M',
	'uniqlo': 'UNIQLO',
	'mango': 'MANGO',
	'local': 'LOCAL BRAND'
};

// Color codes mapping
export const COLOR_CODES = {
	'black': '#000000',
	'white': '#ffffff',
	'red': '#ef4444',
	'blue': '#3b82f6',
	'green': '#10b981',
	'yellow': '#f59e0b',
	'purple': '#8b5cf6',
	'pink': '#ec4899',
	'gray': '#6b7280',
	'brown': '#92400e',
	'navy': '#1e40af',
	'maroon': '#be185d',
	'beige': '#d2b48c'
};

// Sort options
export const SORT_OPTIONS = [
	{ value: 'featured', label: 'Nổi bật' },
	{ value: 'price-low', label: 'Giá: Thấp đến cao' },
	{ value: 'price-high', label: 'Giá: Cao đến thấp' },
	{ value: 'name', label: 'Tên: A-Z' },
	{ value: 'rating', label: 'Đánh giá cao nhất' }
];

// Initial filter state
export const INITIAL_FILTERS = {
	categories: [],
	brands: [],
	priceRange: { min: 0, max: 2000000 },
	sizes: [],
	colors: []
};

// Products per page
export const PRODUCTS_PER_PAGE = 12;

export const INIT_FILTERS = {
	categories: [],
	brands: [],
	priceRange: {min: 0, max: 2000000},
	sizes: [],
	colors: []
};

