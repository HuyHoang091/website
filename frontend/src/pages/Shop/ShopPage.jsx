import React, {useState, useMemo, useEffect} from "react";
import styles from './shopPage.module.scss';
import {checkPriceRange} from "./helper";
import Grid from '@mui/material/Grid';
import FilterSidebar from "./components/FilterSidebar";
import {INITIAL_FILTERS, INITIAL_PRODUCT, SORT_OPTIONS} from "./consts";
import ProductCard from "./components/ProductCard";
import {Autocomplete, Divider, TextField} from '@mui/material';
import {getListProduct} from "../../services/shopServices";


// Main ShopPage Component
export const ShopPage = () => {
    const [products, setProducts] = useState(INITIAL_PRODUCT);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
    const [currentPage, setCurrentPage] = useState(1);
    const [cart, setCart] = useState([]);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    
    const productsPerPage = 12;
    
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
    const startIndex = (currentPage - 1) * productsPerPage + 1;
    const endIndex = Math.min(currentPage * productsPerPage, filteredProducts.length);
    
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
        <div className={styles["shop-page"]}>
            <Grid container spacing={3} className={`p-24 ${styles.container}`} justifyContent="center">
                <Grid size={{xs: 12, lg: 12}} className={`${styles.pageHeader} text-center`}>
                    <h1 className={`${styles.pageTitle} featured-title`}>Bộ Sưu Tập Thời Trang</h1>
                    <p className="featured-subtitle">
                        Khám phá những xu hướng thời trang mới nhất từ các thương hiệu hàng đầu
                    </p>
                </Grid>
                <Grid size={{xs: 12, lg: 12}} className="results-info text-white">
                    <Divider style={{borderColor: '#fff'}} variant="middle" className="mt-16"/>
                </Grid>
                <Grid size={{xs: 12, lg: 3}}>
                    <FilterSidebar filters={filters} setFilters={setFilters} onFilterChange={handleFilterChange}/>
                </Grid>
                <Grid size={{xs: 12, lg: 9}}>
                    <Grid size={{xs: 12}} className={`${styles.sortBar} p-12`}>
                        <Grid size={{xs: 12, md: 3}}>
                            <div className={styles.resultsInfo}>
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
                    <div className={styles.productsGrid}>
                        {currentProducts.map(product => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                addToCart={addToCart}
                                isInCart={cart.includes(product.id)}
                                styles={styles}
                            />
                        ))}
                    </div>
                    {totalPages > 1 && (
                        <div className={styles.pagination}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => prev - 1)}
                            >
                                ← Trước
                            </button>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i}
                                    className={currentPage === i + 1 ? styles.active : ''}
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
                </Grid>
            </Grid>
        </div>
    );
};