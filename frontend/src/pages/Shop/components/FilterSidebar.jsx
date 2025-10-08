import {BRANDS, CATEGORIES, COLORS, INIT_FILTERS, SIZES} from "../consts";
import React from "react";
import {getColorCode} from "../helper";

const FilterSidebar = ({filters, setFilters}) => {
	const categories = CATEGORIES;
	const brands = BRANDS;
	const sizes = SIZES;
	const colors = COLORS;
	
	const toggleFilter = (type, value) => {
		setFilters(prev => ({
			...prev,
			[type]: prev[type].includes(value)
				? prev[type].filter(v => v !== value)
				: [...prev[type], value]
		}));
	};
	
	const clearFilters = () => {
		setFilters(INIT_FILTERS);
	};
	
	return (
		<aside className="filter-sidebar">
			<h3 className="filter-title">Bộ lọc</h3>
			
			{/* Categories */}
			<div className="filter-group">
				<h4 className="filter-group-title">Danh mục</h4>
				<div className="filter-options">
					{categories.map(cat => (
						<label key={cat.id} className="filter-option">
							<input
								type="checkbox"
								className="filter-checkbox"
								checked={filters.categories.includes(cat.id)}
								onChange={() => toggleFilter('categories', cat.id)}
							/>
							<span className="filter-label">{cat.name}</span>
							<span className="filter-count">({cat.count})</span>
						</label>
					))}
				</div>
			</div>
			
			{/* Brands */}
			<div className="filter-group">
				<h4 className="filter-group-title">Thương hiệu</h4>
				<div className="filter-options">
					{brands.map(brand => (
						<label key={brand.id} className="filter-option">
							<input
								type="checkbox"
								className="filter-checkbox"
								checked={filters.brands.includes(brand.id)}
								onChange={() => toggleFilter('brands', brand.id)}
							/>
							<span className="filter-label">{brand.name}</span>
							<span className="filter-count">({brand.count})</span>
						</label>
					))}
				</div>
			</div>
			
			{/* Price Range */}
			<div className="filter-group">
				<h4 className="filter-group-title">Khoảng giá</h4>
				<div className="price-range">
					<input
						type="number"
						className="price-input"
						placeholder="Từ"
						value={filters.priceRange.min}
						onChange={(e) => setFilters(prev => ({
							...prev,
							priceRange: {...prev.priceRange, min: Number(e.target.value)}
						}))}
					/>
					<span>-</span>
					<input
						type="number"
						className="price-input"
						placeholder="Đến"
						value={filters.priceRange.max}
						onChange={(e) => setFilters(prev => ({
							...prev,
							priceRange: {...prev.priceRange, max: Number(e.target.value)}
						}))}
					/>
				</div>
			</div>
			
			{/* Sizes */}
			<div className="filter-group">
				<h4 className="filter-group-title">Kích thước</h4>
				<div className="size-grid">
					{sizes.map(size => (
						<div
							key={size}
							className={`size-option ${filters.sizes.includes(size) ? 'selected' : ''}`}
							onClick={() => toggleFilter('sizes', size)}
						>
							{size}
						</div>
					))}
				</div>
			</div>
			
			{/* Colors */}
			<div className="filter-group">
				<h4 className="filter-group-title">Màu sắc</h4>
				<div className="color-grid">
					{colors.map(color => (
						<div
							key={color}
							className={`color-option ${filters.colors.includes(color) ? 'selected' : ''}`}
							style={{backgroundColor: getColorCode(color)}}
							onClick={() => toggleFilter('colors', color)}
							title={color}
						/>
					))}
				</div>
			</div>
			
			<button className="clear-filters" onClick={clearFilters}>
				Xóa tất cả bộ lọc
			</button>
		</aside>
	);
};

export default FilterSidebar;