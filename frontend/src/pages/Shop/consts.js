// Categories
export const CATEGORIES = [
	{"id": 1, "name": "Thời trang", "parentId": null,},
	{"id": 2, "name": "Nam", "parentId": 1,},
	{"id": 3, "name": "Nữ", "parentId": 1,},
	{"id": 4, "name": "Quần", "parentId": 2,},
	{"id": 5, "name": "Áo", "parentId": 2,}
];

// Brands
export const BRANDS = [
	{id: 'zara', name: 'ZARA', count: 38},
	{id: 'hm', name: 'H&M', count: 52},
	{id: 'uniqlo', name: 'UNIQLO', count: 41},
	{id: 'mango', name: 'MANGO', count: 29}
];

// Sizes
export const SIZES = ["L", "M", "S"];

// Colors
export const COLORS = [
	{"name":"Trắng","code":"#ffffff"},
	{"name":"Xanh","code":"#0d6efd"},
	{"name":"Đỏ","code":"#dc3545"}
]

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
	{value: 'featured', label: 'Nổi bật'},
	{value: 'price-low', label: 'Giá: Thấp đến cao'},
	{value: 'price-high', label: 'Giá: Cao đến thấp'},
	{value: 'name', label: 'Tên: A-Z'},
	{value: 'rating', label: 'Đánh giá cao nhất'}
];

// Initial filter state
export const INITIAL_FILTERS = {
	categories: [],
	brands: [],
	priceRanges: [],
	sizes: [],
	colors: []
};

// Products per page
export const PRODUCTS_PER_PAGE = 12;

export const INIT_FILTERS = {
	categories: [],
	brands: [],
	priceRange: [],
	sizes: [],
	colors: []
};

export const PRICE_RANGES = [
	{value: 'under-300', label: 'Dưới 300k', count: 1},
	{value: '300-500', label: '300k - 500k', count: 4},
	{value: '500-1000', label: '500k - 1tr', count: 5},
	{value: 'over-1000', label: 'Trên 1tr', count: 2}
];

export const INITIAL_PRODUCT = [
	{
		"id": 1,
		"brand": "Zara",
		"name": "Quần Jean",
		"description": "Quần jean slim fit co giãn, phù hợp mọi dáng người",
		"slug": "quan-jean",
		"url": "http://localhost:8080/images/ee6a2c90-c78a-49af-83eb-6fa80a0cab63_sp010.jpg",
		"sizes": [
			"M",
			"S"
		],
		"colors": [
			{
				"name": "Xanh",
				"code": "#0d6efd"
			},
			{
				"name": "Đỏ",
				"code": "#dc3545"
			}
		],
		"price": 550000,
		"priceNow": 550000,
		"categoriesId": 4,
		"rating": 5,
		"numberReview": 1,
		"createAt": "2025-09-04 21:35:42.0"
	},
	{
		"id": 2,
		"brand": "Zara",
		"name": "Áo Thun Nam",
		"description": "Áo thun nam cotton thoáng mát",
		"slug": "ao-thun-nam",
		"url": "http://localhost:8080/images/fc6762f9-ddff-4914-a2fe-7a51b2dc3b85_sp012.jpg",
		"sizes": [
			"L",
			"M"
		],
		"colors": [
			{
				"name": "Trắng",
				"code": "#ffffff"
			},
			{
				"name": "Đỏ",
				"code": "#dc3545"
			}
		],
		"price": 249000,
		"priceNow": 249000,
		"categoriesId": 5,
		"rating": 0,
		"numberReview": 0,
		"createAt": "2025-10-10 21:47:40.0"
	},
	{
		"id": 3,
		"brand": "Zara",
		"name": "Áo Thun Nam",
		"description": "Áo thun nam cotton thoáng mát",
		"slug": "ao-thun-nam-1",
		"url": "https://cdn.site.com/products/ao-thun-1.jpg",
		"sizes": [
			"M"
		],
		"colors": [
			{
				"name": "Trắng",
				"code": "#ffffff"
			},
			{
				"name": "Đỏ",
				"code": "#dc3545"
			}
		],
		"price": 249000,
		"priceNow": 249000,
		"categoriesId": 5,
		"rating": 0,
		"numberReview": 0,
		"createAt": "2025-10-10 22:15:22.0"
	},
	{
		"id": 8,
		"brand": "Zara",
		"name": "Áo POLO",
		"description": "kkkkk",
		"slug": "ao-polo",
		"url": null,
		"sizes": [
			"M"
		],
		"colors": [
			{
				"name": "Đỏ",
				"code": "#dc3545"
			}
		],
		"price": 250000,
		"priceNow": 250000,
		"categoriesId": 2,
		"rating": 0,
		"numberReview": 0,
		"createAt": "2025-10-11 21:09:40.0"
	}
]
