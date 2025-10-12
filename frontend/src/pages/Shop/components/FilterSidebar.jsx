import {BRANDS, CATEGORIES, COLORS, INIT_FILTERS, PRICE_RANGES, SIZES} from "../consts";
import React, {useState, useEffect, useMemo} from "react";
import {getColorCode} from "../helper";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
import {getCategories, getProductVariantAggregation} from "../services";
import {SimpleTreeView} from '@mui/x-tree-view/SimpleTreeView';
import {TreeItem} from '@mui/x-tree-view/TreeItem';

const FilterSidebar = ({filters, setFilters, onFilterChange}) => {
	const [categories, setCategories] = useState(CATEGORIES);
	const [sizes, setSizes] = useState(SIZES);
	const [colors, setColors] = useState(COLORS);
	const brands = BRANDS;
	
	useEffect(() => {
		handleGetCategories();
		handleGetProdAggregation()
	}, []);
	
	const handleGetCategories = async () => {
		try {
			const response = await getCategories();
			setCategories(Array.isArray(response.data) ? response.data : CATEGORIES);
		} catch (error) {
			console.error('Error fetching categories:', error);
		}
	}
	
	const handleGetProdAggregation = async () => {
		try {
			const response = await getProductVariantAggregation()
			setSizes(response.data?.sizes || SIZES);
			setColors(response.data?.colors || COLORS);
		} catch (error) {
			console.error('Error fetching categories:', error);
		}
	}
	
	const toggleFilter = (name, value, checked) => {
		setFilters(prev => ({
			...prev,
			[name]: checked
				? [...(prev[name] || []), value]
				: prev[name]?.filter(item => item !== value)
		}));
	};
	
	const handleCheckboxChange = (filterType, value, checked) => {
		onFilterChange(filterType, value, checked);
	};
	
	const handleSizeToggle = (size) => {
		const isSelected = filters.sizes.includes(size);
		onFilterChange('sizes', size, !isSelected);
	};
	
	const handleColorToggle = (color) => {
		const isSelected = filters.colors.includes(color);
		onFilterChange('colors', color, !isSelected);
	};
	
	const clearFilters = () => {
		setFilters(INIT_FILTERS);
	};
	
	const renderTree = (parentId = null) => {
		// Lọc các item có parentId khớp với parentId hiện tại
		const children = categories.filter(cat => cat.parentId === parentId);
		
		// Nếu không có children thì return null
		if (children.length === 0) return null;
		
		// Render các TreeItem và đệ quy cho children của chúng
		return children.map(cat => (
			<TreeItem
				key={cat.id}
				itemId={String(cat.id)}
				label={cat.name}
			>
				{renderTree(cat.id)}
			</TreeItem>
		));
	};
	
	return (
		<aside className="filter-sidebar">
			<h3 className="filter-title">Bộ lọc</h3>
			
			{/* Categories */}
			<div className="filter-group">
				<h4 className="filter-group-title">Danh mục</h4>
				<div className="filter-options">
					<SimpleTreeView
						checkboxSelection
						multiSelect
						onSelectedItemsChange={(event, itemIds) => {
							console.log(event)
							console.log(event.target)
							setFilters(prev => ({...prev, categories: itemIds}));
						}}
					
					>
						{renderTree(null)}
					</SimpleTreeView>
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
								checked={filters?.brands?.includes(brand.id)}
								onChange={(e) => handleCheckboxChange(
									'brands',
									brand.id,
									e.target.checked
								)}
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
					<Grid container>
						{PRICE_RANGES.map(priceRange => (
							<Grid size={{xs: 12}}>
								<div key={priceRange.value} className="filter-option">
									<input
										type="checkbox"
										id={`price-${priceRange.value}`}
										className="filter-checkbox"
										checked={filters?.priceRanges?.includes(priceRange.value)}
										onChange={(e) => handleCheckboxChange(
											'priceRanges',
											priceRange.value,
											e.target.checked
										)}
									/>
									<label htmlFor={`price-${priceRange.value}`} className="filter-label">
										{priceRange.label}
									</label>
									<span className="filter-count">({priceRange.count})</span>
								</div>
							</Grid>
						))}
					</Grid>
				</div>
			</div>
			
			{/* Sizes */}
			<div className="filter-group">
				<h4 className="filter-group-title">Kích thước</h4>
				<div className="size-grid">
					{sizes.map(size => (
						<div
							key={size}
							className={`size-option ${filters?.sizes?.includes(size) ? 'selected' : ''}`}
							onClick={() => handleSizeToggle(size)}
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
							key={color.code}
							className={`color-option ${filters?.colors?.includes(color.code) ? 'selected' : ''}`}
							style={{backgroundColor: getColorCode(color.code)}}
							onClick={() => handleColorToggle(color.code)}
							title={color.name}
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
FilterSidebar.propTypes = {
	filters: PropTypes.shape({})
};