import React, {useState, useMemo, useEffect} from "react";
import './shopPage.scss';
import {checkPriceRange, filterProduct, formatPrice} from "./helper";
import Grid from '@mui/material/Grid';
import FilterSidebar from "./components/FilterSidebar";
import {INITIAL_FILTERS, INITIAL_PRODUCT, SORT_OPTIONS} from "./consts";
import ProductCard from "./components/ProductCard";
import {Autocomplete, TextField} from '@mui/material';
import {getListProduct, getProductVariantAggregation} from "./services";


// Main ShopPage Component
export const ShopPage = () => {
	const [products, setProducts] = useState(INITIAL_PRODUCT);
	const [searchTerm, setSearchTerm] = useState('');
	const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
	const [currentPage, setCurrentPage] = useState(1);
	const [cart, setCart] = useState([]);
	const [filters, setFilters] = useState(INITIAL_FILTERS);
	
	const productsPerPage = 12;
	console.log(products)
	
	useEffect(() => {
		handleGetListProduct();
	}, []);
	
	const handleGetListProduct = async () => {
		try {
			const response = await getListProduct();
			setProducts(Array.isArray(response.data) ? response.data : INITIAL_PRODUCT);
		} catch (error) {
			console.error('Error fetching categories:', error);
		}
	}
	
	const filtered = useMemo(
		() => products?.filter(product => {
			// Search filter
			if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
				return false;
			}
			
			// Category filter
			if (filters.categories.length > 0 && !filters.categories.includes(product.categoriesId.toString())) {
				return false;
			}
			
			// Brand filter
			if (filters.brands.length > 0 && !filters.brands.includes(product.brand.toLowerCase())) {
				return false;
			}
			
			// Price filter
			if (filters.priceRanges.length > 0) {
				return checkPriceRange({filters, product});
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
		[products, searchTerm, filters, filters.brands, filters.priceRanges.length]
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
	
	const handleFilterChange = (filterType = "", value, checked) => {
		console.log(filterType, value, checked)
		setFilters(prev => ({
			...prev,
			[filterType]: checked
				? [...prev[filterType], value]
				: prev[filterType].filter(item => item !== value)
		}));
	};
	
	return (
		<div className="shop-page">
			<Grid container spacing={4} className="py-16 px-24">
				{/*<Grid size={{xs: 12, md: 1}}></Grid>*/}
				<Grid size={{xs: 12, md: 3}}>
					<FilterSidebar filters={filters} setFilters={setFilters} onFilterChange={handleFilterChange}/>
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