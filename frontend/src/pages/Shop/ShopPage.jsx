import React, {useState, useMemo, useEffect} from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import styles from './shopPage.module.scss';
import {checkPriceRange, getAllChildCategoryIds, isNewProduct} from "./helper";
import Grid from '@mui/material/Grid';
import FilterSidebar from "./components/FilterSidebar";
import {INITIAL_FILTERS, INITIAL_PRODUCT, SORT_OPTIONS} from "./consts";
import ProductCard from "./components/ProductCard";
import {Autocomplete, Divider, TextField} from '@mui/material';
import {getListProduct, getCategories} from "../../services/shopServices";

// Hàm để lấy tiêu đề trang dựa vào route
const getPageTitle = (routeType) => {
    switch(routeType) {
        case 'new':
            return { title: 'Sản Phẩm Mới', subtitle: 'Khám phá những xu hướng mới nhất vừa cập nhật' };
        case 'nam':
            return { title: 'Thời Trang Nam', subtitle: 'Các mẫu thời trang dành cho phái mạnh' };
        case 'nu':
            return { title: 'Thời Trang Nữ', subtitle: 'Phong cách thời trang thanh lịch dành cho phái đẹp' };
        case 'sale':
            return { title: 'Sản Phẩm Giảm Giá', subtitle: 'Cơ hội sở hữu những sản phẩm chất lượng với giá tốt nhất' };
        default:
            return { title: 'Bộ Sưu Tập Thời Trang', subtitle: 'Khám phá những xu hướng thời trang mới nhất từ các thương hiệu hàng đầu' };
    }
};

// Main ShopPage Component
export const ShopPage = () => {
    const { routeType } = useParams(); // Lấy route param từ URL
    const location = useLocation();
    const navigate = useNavigate();
    
    const [products, setProducts] = useState(INITIAL_PRODUCT);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState(SORT_OPTIONS[0]);
    const [currentPage, setCurrentPage] = useState(1);
    const [cart, setCart] = useState([]);
    const [filters, setFilters] = useState(INITIAL_FILTERS);
    const [categories, setCategories] = useState([]);
    const [pageInfo, setPageInfo] = useState({ title: '', subtitle: '' });
    
    const productsPerPage = 12;
    
    // Lấy danh sách sản phẩm và danh mục
    useEffect(() => {
        handleGetListProduct();
        handleGetCategories();
    }, []);
    
    // Cập nhật tiêu đề trang khi route thay đổi
    useEffect(() => {
        setPageInfo(getPageTitle(routeType));
        
        // Đặt lại trang về 1 khi thay đổi route
        setCurrentPage(1);
    }, [routeType]);
    
    // Áp dụng bộ lọc dựa trên loại route
    useEffect(() => {
        if (!categories.length || !products.length) return;
        
        // Reset filters
        setFilters(INITIAL_FILTERS);
        
        // Áp dụng filter dựa vào route
        switch(routeType) {
            case 'new':
                // Không cần thêm filter, sẽ lọc trong hàm filtered
                break;
            case 'nam':
            case 'nu': {
                // Tìm danh mục "Nam" hoặc "Nữ" trong danh sách danh mục
                const genderCategory = categories.find(cat => 
                    cat.name.toLowerCase() === routeType.toLowerCase());
                
                if (genderCategory) {
                    // Lấy tất cả ID danh mục con (bao gồm cả danh mục cha)
                    const categoryIds = getAllChildCategoryIds(categories, genderCategory.id);
                    
                    // Thiết lập filter cho danh mục
                    setFilters(prev => ({
                        ...prev,
                        categories: categoryIds.map(id => id.toString())
                    }));
                }
                break;
            }
            case 'sale':
                // Không cần thêm filter, sẽ lọc trong hàm filtered
                break;
            default:
                // Trang mặc định, không áp dụng filter
                break;
        }
    }, [routeType, categories, products]);
    
    const handleGetListProduct = async () => {
        try {
            const response = await getListProduct();
            setProducts(Array.isArray(response.data) ? response.data : INITIAL_PRODUCT);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    };
    
    const handleGetCategories = async () => {
        try {
            const response = await getCategories();
            setCategories(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error('Error fetching categories:', error);
        }
    };
    
    // Filter products based on applied filters and route type
    const filtered = useMemo(
        () => products?.filter(product => {
            // Apply route-specific filters first
            if (routeType === 'new') {
                if (!isNewProduct(product.createAt)) return false;
            } else if (routeType === 'sale') {
                if (!product.priceNow || product.priceNow >= product.price) return false;
            }
            
            // Search filter
            if (searchTerm && !product.name.toLowerCase().includes(searchTerm.toLowerCase())) {
                return false;
            }
            
            // Category filter - Now includes all child categories
            if (filters.categories.length > 0) {
                // For each selected category, get its child categories
                const allSelectedCategoryIds = filters.categories.flatMap(catId => {
                    const childIds = getAllChildCategoryIds(categories, Number(catId));
                    return childIds;
                });
                
                if (!allSelectedCategoryIds.includes(product.categoriesId)) {
                    return false;
                }
            }
            
            // Brand filter
            if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
                return false;
            }
            
            // Price filter
            if (filters.priceRanges.length > 0) {
                const matchesPrice = filters.priceRanges.some(range => 
                    checkPriceRange(product, range)
                );
                if (!matchesPrice) return false;
            }
            
            // Size filter
            if (filters.sizes.length > 0 && !filters.sizes.some(size => product.sizes.includes(size))) {
                return false;
            }
            
            // Color filter
            if (filters.colors.length > 0) {
                const productColorCodes = product.colors.map(color => color.code);
                if (!filters.colors.some(colorCode => productColorCodes.includes(colorCode))) {
                    return false;
                }
            }
            
            return true;
        }) || [],
        [products, searchTerm, filters, categories, routeType]
    );
    
    // Cập nhật URL khi thay đổi filter
    const updateUrlWithFilters = () => {
        // Logic to update URL based on filters (if needed)
        // This could be implemented later if we want the URL to reflect filter state
    };
    
    // Filter and sort products
    const filteredProducts = useMemo(() => {
        let filteredProducts = filtered;
        
        // Sort products
        switch (sortBy?.value) {
            case 'price-low':
                filteredProducts.sort((a, b) => (a.priceNow || a.price) - (b.priceNow || b.price));
                break;
            case 'price-high':
                filteredProducts.sort((a, b) => (b.priceNow || b.price) - (a.priceNow || a.price));
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
        setFilters(prev => ({
            ...prev,
            [filterType]: checked
                ? [...prev[filterType], value]
                : prev[filterType].filter(item => item !== value)
        }));
        
        // Reset pagination when filter changes
        setCurrentPage(1);
    };
    
    return (
        <div className={styles["shop-page"]}>
            <Grid container spacing={3} className={`p-24 ${styles.container}`} justifyContent="center">
                <Grid size={{xs: 12, lg: 12}} className={`${styles.pageHeader} text-center`}>
                    <h1 className={`${styles.pageTitle} featured-title`}>{pageInfo.title}</h1>
                    <p className="featured-subtitle">
                        {pageInfo.subtitle}
                    </p>
                </Grid>
                <Grid size={{xs: 12, lg: 12}} className="results-info text-white">
                    <Divider style={{borderColor: '#fff'}} variant="middle" className="mt-16"/>
                </Grid>
                <Grid size={{xs: 12, lg: 3}}>
                    <FilterSidebar 
                        filters={filters} 
                        setFilters={setFilters} 
                        onFilterChange={handleFilterChange} 
                        products={products} 
                        categories={categories}
                        routeType={routeType}
                    />
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
                        {currentProducts.length > 0 ? (
                            currentProducts.map(product => (
                                <ProductCard
                                    key={product.id}
                                    product={product}
                                    addToCart={addToCart}
                                    isInCart={cart.includes(product.id)}
                                    styles={styles}
                                />
                            ))
                        ) : (
                            <div className={styles.noProducts}>
                                <p>Không tìm thấy sản phẩm nào phù hợp với bộ lọc.</p>
                            </div>
                        )}
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