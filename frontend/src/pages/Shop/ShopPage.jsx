import React, {useState, useMemo} from "react";
import './shopPage.scss';
import {filterProduct, formatPrice} from "./helper";
import Grid from '@mui/material/Grid';
import FilterSidebar from "./components/FilterSidebar";
import {INITIAL_FILTERS, SORT_OPTIONS} from "./consts";
import ProductCard from "./components/ProductCard";
import {Autocomplete, TextField} from '@mui/material';


const initialProducts = [
	{
		id: 1,
		name: "Áo Sơ Mi Oxford Premium",
		category: "ao-so-mi",
		brand: "zara",
		price: 450000,
		originalPrice: 600000,
		image: "👔",
		rating: 4.5,
		reviews: 128,
		badge: "sale",
		isNew: false,
		colors: ["white", "blue", "black"],
		sizes: ["S", "M", "L", "XL"],
		description: "Áo sơ mi Oxford cao cấp, chất liệu cotton 100%"
	},
	{
		id: 2,
		name: "Quần Jean Slim Fit Dark Blue",
		category: "quan-jean",
		brand: "uniqlo",
		price: 750000,
		originalPrice: null,
		image: "👖",
		rating: 4.8,
		reviews: 95,
		badge: null,
		isNew: true,
		colors: ["blue", "black"],
		sizes: ["29", "30", "31", "32", "33"],
		description: "Quần jean slim fit co giãn, phù hợp mọi dáng người"
	},
	{
		id: 3,
		name: "Áo Thun Cotton Organic",
		category: "ao-thun",
		brand: "hm",
		price: 320000,
		originalPrice: 400000,
		image: "👕",
		rating: 4.3,
		reviews: 203,
		badge: "sale",
		isNew: false,
		colors: ["white", "black", "gray", "navy"],
		sizes: ["XS", "S", "M", "L", "XL"],
		description: "Áo thun cotton organic, thân thiện với môi trường"
	},
	{
		id: 4,
		name: "Váy Đầm Hoa Vintage",
		category: "vay-dam",
		brand: "mango",
		price: 890000,
		originalPrice: null,
		image: "👗",
		rating: 4.7,
		reviews: 67,
		badge: null,
		isNew: true,
		colors: ["pink", "yellow", "green"],
		sizes: ["XS", "S", "M", "L"],
		description: "Váy đầm họa tiết hoa vintage, phong cách nữ tính"
	}
];

// Main ShopPage Component
export const ShopPage = () => {
	const [products, setProducts] = useState(initialProducts);
	const [searchTerm, setSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
	const [currentPage, setCurrentPage] = useState(1);
	const [cart, setCart] = useState([]);
	const [filters, setFilters] = useState(INITIAL_FILTERS);
	
	const productsPerPage = 12;
	console.log(products)
	
	const filtered = useMemo(
		() => products?.filter(product => {
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
		}) || [],
		[products,
			searchTerm,
			filters.categories,
			filters.brands,
			filters.priceRange.min,
			filters.priceRange.max,
			filters.sizes,
			filters.colors
		]
	)
	
	// Filter and sort products
	const filteredProducts = useMemo(() => {
		let filteredProducts = filtered;
		// Sort products
		switch (sortBy?.value) {
			case 'price-low':
				filteredProducts.sort((a, b) => a.price - b.price);
				break;
			case 'price-high':
				filteredProducts.sort((a, b) => b.price - a.price);
				break;
			case 'name':
				filteredProducts.sort((a, b) => a.name.localeCompare(b.name));
				break;
			case 'rating':
				filteredProducts.sort((a, b) => b.rating - a.rating);
				break;
			default:
				break;
		}
		
		return filteredProducts;
	}, [filtered, sortBy?.value]);
	
	// Pagination
	const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
	const currentProducts = filteredProducts.slice(
		(currentPage - 1) * productsPerPage,
		currentPage * productsPerPage
	);
	
	const addToCart = (productId) => {
		setCart(prev => prev.includes(productId)
			? prev.filter(id => id !== productId)
			: [...prev, productId]
		);
	};
	
	return (
		<div className="shop-page">
			<Grid container spacing={4} className="py-16 px-12">
				<Grid size={{xs: 12, md: 3}}>
					<FilterSidebar filters={filters} setFilters={setFilters}/>
				</Grid>
				<Grid size={{xs: 12, md: 9}}>
					<main className="products-section">
						<div className="page-header">
							<h1 className="page-title">Bộ Sưu Tập Thời Trang</h1>
							<p className="page-subtitle">
								Khám phá những xu hướng thời trang mới nhất
							</p>
						</div>
						
						<Grid size={{xs: 12}} className="sort-bar">
							<Grid size={{xs: 12, md: 3}}>
								<div className="results-info">
									Hiển thị {currentProducts.length} / {filteredProducts.length} sản phẩm
								</div>
							</Grid>
							<Grid size={{xs: 12, md: 3}}>
								<Autocomplete
									disablePortal
									options={SORT_OPTIONS}
									getOptionLabel={(option) => option.label}
									getOptionKey={option => option.label}
									fullWidth
									value={sortBy || null}
									onChange={(e, value) => setSortBy(value)}
									size="small"
									renderInput={
										(params) => <TextField {...params} label="" />
									}
								/>
							</Grid>
						</Grid>
						<div>
							{/*<select*/}
							{/*	className="sort-select"*/}
							{/*	value={sortBy}*/}
							{/*	onChange={(e) => setSortBy(e.target.value)}*/}
							{/*>*/}
							{/*	<option value="featured">Nổi bật</option>*/}
							{/*	<option value="price-low">Giá: Thấp đến cao</option>*/}
							{/*	<option value="price-high">Giá: Cao đến thấp</option>*/}
							{/*	<option value="name">Tên: A-Z</option>*/}
							{/*	<option value="rating">Đánh giá cao nhất</option>*/}
							{/*</select>*/}
						</div>
						
						<div className="products-grid">
							{currentProducts.map(product => (
								<ProductCard
									key={product.id}
									product={product}
									addToCart={addToCart}
									isInCart={cart.includes(product.id)}
								/>
							))}
						</div>
						
						{totalPages > 1 && (
							<div className="pagination">
								<button
									disabled={currentPage === 1}
									onClick={() => setCurrentPage(prev => prev - 1)}
								>
									← Trước
								</button>
								{[...Array(totalPages)].map((_, i) => (
									<button
										key={i}
										className={currentPage === i + 1 ? 'active' : ''}
										onClick={() => setCurrentPage(i + 1)}
									>
										{i + 1}
									</button>
								))}
								<button
									disabled={currentPage === totalPages}
									onClick={() => setCurrentPage(prev => prev + 1)}
								>
									Sau →
								</button>
							</div>
						)}
					</main>
				</Grid>
			</Grid>
		</div>
	);
};