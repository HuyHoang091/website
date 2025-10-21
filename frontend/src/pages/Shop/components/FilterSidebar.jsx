import {BRANDS, CATEGORIES, COLORS, INIT_FILTERS, PRICE_RANGES, SIZES} from "../consts";
import React, {useState, useEffect, useMemo} from "react";
import {getColorCode} from "../helper";
import Grid from "@mui/material/Grid";
import PropTypes from "prop-types";
import {getCategories, getProductVariantAggregation} from "../../../services/shopServices";
import {SimpleTreeView} from '@mui/x-tree-view/SimpleTreeView';
import {TreeItem} from '@mui/x-tree-view/TreeItem';
import {Checkbox} from "@mui/material";
import {cyan, deepPurple, indigo, pink, purple} from "@mui/material/colors";
import styles from '../shopPage.module.scss';

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
                slotProps={{
                    checkbox: {
                        size: 'small',
                        // icon: <FavoriteBorder />,
                        // checkedIcon: <Favorite />,
                        
                        sx: {
                            color: cyan[100],
                            '&.Mui-checked': {
                                color: deepPurple[100],
                            },
                            '&.MuiCheckbox-indeterminate': {
                                color: cyan[100],
                            },
                        }
                    },
                }}
            >
                {renderTree(cat.id)}
            </TreeItem>
        ));
    };
    
    return (
        <aside className={styles.filterSidebar}>
            <h3 className={styles.filterTitle}>Bộ lọc</h3>
            
            {/* Categories */}
            <div className={styles.filterGroupShop}>
                <h4 className={styles.filterGroupTitle}>Danh mục</h4>
                <div className={styles.filterOptions}>
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
            <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Thương hiệu</h4>
                <div>
                    {brands.map(brand => (
                        <label key={brand.id} className={styles.filterOption}>
                            <Checkbox
                                size="small"
                                checked={filters?.brands?.includes(brand.id)}
                                onChange={(e) => handleCheckboxChange(
                                    'brands',
                                    brand.id,
                                    e.target.checked
                                )}
                                sx={{
                                    color: cyan[100],
                                    '&.Mui-checked': {
                                        color: deepPurple[100],
                                    },
                                    '&.MuiCheckbox-root': {
                                        padding: "4px",
                                    },
                                }}
                            />
                            <span className={styles.filterLabel}>{brand.name}</span>
                            <span className={styles.filterCount}>({brand.count})</span>
                        </label>
                    ))}
                </div>
            </div>
            
            {/* Price Range */}
            <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Khoảng giá</h4>
                <div>
                    {PRICE_RANGES.map(priceRange => (
                        <div key={priceRange.value} className={styles.filterOption}>
                            <Checkbox
                                size="small"
                                id={`price-${priceRange.value}`}
                                checked={filters?.priceRanges?.includes(priceRange.value)}
                                onChange={(e) => handleCheckboxChange(
                                    'priceRanges',
                                    priceRange.value,
                                    e.target.checked
                                )}
                                sx={{
                                    color: cyan[100],
                                    '&.Mui-checked': {
                                        color: deepPurple[100],
                                    },
                                    '&.MuiCheckbox-root': {
                                        padding: "4px",
                                    },
                                }}
                            />
                            <label htmlFor={`price-${priceRange.value}`} className={styles.filterLabel}>
                                {priceRange.label}
                            </label>
                            <span className={styles.filterCount}>({priceRange.count})</span>
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Sizes */}
            <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Kích thước</h4>
                <div className={styles.sizeGrid}>
                    {sizes.map(size => (
                        <div
                            key={size}
                            className={`${styles.sizeOption} ${filters?.sizes?.includes(size) ? styles.selected : ''}`}
                            onClick={() => handleSizeToggle(size)}
                        >
                            {size}
                        </div>
                    ))}
                </div>
            </div>
            
            {/* Colors */}
            <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Màu sắc</h4>
                <div className={styles.colorGrid}>
                    {colors.map(color => (
                        <div
                            key={color.code}
                            className={`${styles.colorOption} ${filters?.colors?.includes(color.code) ? styles.selected : ''}`}
                            style={{backgroundColor: getColorCode(color.code)}}
                            onClick={() => handleColorToggle(color.code)}
                            title={color.name}
                        />
                    ))}
                </div>
            </div>
            
            <button className={styles.clearFilters} onClick={clearFilters}>
                Xóa tất cả bộ lọc
            </button>
        </aside>
    );
};

export default FilterSidebar;
FilterSidebar.propTypes = {
    filters: PropTypes.shape({})
};