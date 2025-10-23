import {PRICE_RANGES, INIT_FILTERS} from "../consts";
import React, {useState, useEffect, useMemo} from "react";
import {
    getColorCode, countProductsByPriceRange, countProductsByBrand, 
    countProductsByCategory, getAllChildCategoryIds
} from "../helper";
import PropTypes from "prop-types";
import {getProductVariantAggregation, getBrands} from "../../../services/shopServices";
import {SimpleTreeView} from '@mui/x-tree-view/SimpleTreeView';
import {TreeItem} from '@mui/x-tree-view/TreeItem';
import {Checkbox} from "@mui/material";
import {cyan, deepPurple} from "@mui/material/colors";
import styles from '../shopPage.module.scss';

const FilterSidebar = ({filters, setFilters, onFilterChange, products, categories, routeType}) => {
    const [sizes, setSizes] = useState([]);
    const [colors, setColors] = useState([]);
    const [brands, setBrands] = useState([]);
    
    useEffect(() => {
        handleGetProdAggregation();
        handleGetBrands();
    }, []);
    
    const handleGetProdAggregation = async () => {
        try {
            const response = await getProductVariantAggregation();
            setSizes(response.data?.sizes || []);
            setColors(response.data?.colors || []);
        } catch (error) {
            console.error('Error fetching product aggregation:', error);
            setSizes([]);
            setColors([]);
        }
    }
    
    const handleGetBrands = async () => {
        try {
            const response = await getBrands();
            // Transform brands data to include count for UI consistency
            const brandsWithCount = Array.isArray(response.data) 
                ? response.data.map(brand => ({
                    ...brand,
                    count: 0 // Set default count - can be updated if needed
                }))
                : [];
            setBrands(brandsWithCount);
        } catch (error) {
            console.error('Error fetching brands:', error);
            setBrands([]);
        }
    }
    
    const handleCheckboxChange = (filterType, value, checked) => {
        onFilterChange(filterType, value, checked);
    };
    
    const handleSizeToggle = (size) => {
        const isSelected = filters.sizes.includes(size);
        onFilterChange('sizes', size, !isSelected);
    };
    
    const handleColorToggle = (colorCode) => {
        const isSelected = filters.colors.includes(colorCode);
        onFilterChange('colors', colorCode, !isSelected);
    };
    
    const clearFilters = () => {
        setFilters(INIT_FILTERS);
    };
    
    const handleCategoryChange = (selectedIds) => {
        setFilters(prev => ({...prev, categories: selectedIds}));
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
                label={`${cat.name} (${categoryCounts[cat.id] || 0})`}
                slotProps={{
                    checkbox: {
                        size: 'small',
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
    
    // Tính toán số đếm cho mỗi bộ lọc
    const priceRangeCounts = useMemo(() => {
        return countProductsByPriceRange(products, PRICE_RANGES);
    }, [products]);
    
    const brandCounts = useMemo(() => {
        return countProductsByBrand(products, brands);
    }, [products, brands]);
    
    const categoryCounts = useMemo(() => {
        return countProductsByCategory(products, categories);
    }, [products, categories]);
    
    // Vô hiệu hóa một số bộ lọc dựa vào route
    const isFilterDisabled = (filterType) => {
        if (routeType === 'new') {
            return false; // Không vô hiệu hóa bất kỳ bộ lọc nào
        }
        if (routeType === 'sale') {
            return false; // Không vô hiệu hóa bất kỳ bộ lọc nào
        }
        if (routeType === 'nam' || routeType === 'nu') {
            return filterType === 'categories'; // Vô hiệu hóa lọc danh mục
        }
        return false;
    };
    
    return (
        <aside className={styles.filterSidebar}>
            <h3 className={styles.filterTitle}>Bộ lọc</h3>
            
            {/* Categories */}
            {!isFilterDisabled('categories') && (
                <div className={styles.filterGroupShop}>
                    <h4 className={styles.filterGroupTitle}>Danh mục</h4>
                    <div className={styles.filterOptions}>
                        <SimpleTreeView
                            checkboxSelection
                            multiSelect
                            selected={filters.categories}
                            onSelectedItemsChange={(event, itemIds) => {
                                handleCategoryChange(itemIds);
                            }}
                        >
                            {renderTree(null)}
                        </SimpleTreeView>
                    </div>
                </div>
            )}
            
            {/* Brands với số đếm chính xác */}
            <div className={styles.filterGroup}>
                <h4 className={styles.filterGroupTitle}>Thương hiệu</h4>
                <div>
                    {brands.map(brand => (
                        <label key={brand.id} className={styles.filterOption}>
                            <Checkbox
                                size="small"
                                checked={filters?.brands?.includes(brand.name)}
                                onChange={(e) => handleCheckboxChange(
                                    'brands',
                                    brand.name,
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
                            <span className={styles.filterCount}>
                                ({brandCounts[brand.name] || 0})
                            </span>
                        </label>
                    ))}
                </div>
            </div>
            
            {/* Price Range với số đếm chính xác */}
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
                            <span className={styles.filterCount}>
                                ({priceRangeCounts[priceRange.value] || 0})
                            </span>
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

FilterSidebar.propTypes = {
    filters: PropTypes.shape({}),
    products: PropTypes.array,
    categories: PropTypes.array,
    routeType: PropTypes.string
};

export default FilterSidebar;