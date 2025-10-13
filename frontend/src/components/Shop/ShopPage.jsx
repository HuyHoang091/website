import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import ShopHeader from './ShopHeader';
import FilterSidebar from './FilterSidebar';
import ProductGrid from './ProductGrid';
import Pagination from './Pagination';
import './css.scss'

const buildCategoryTree = (categories) => {
    const map = new Map();
    categories.forEach(cat => map.set(cat.id, { ...cat, children: [] }));
    const roots = [];
    categories.forEach(cat => {
        if (cat.parentId) {
            const parent = map.get(cat.parentId);
            if (parent) parent.children.push(map.get(cat.id));
        } else {
            roots.push(map.get(cat.id));
        }
    });
    return roots;
};

const ShopPage = () => {
    const [filters, setFilters] = useState({ categories: [], brands: [], priceRanges: [], sizes: [], colors: [], ratings: [] });
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest');
    const [currentPage, setCurrentPage] = useState(1);
    const [cartCount, setCartCount] = useState(0);
    const [addedToCart, setAddedToCart] = useState([]);
    const [wishlist, setWishlist] = useState([]);
    const [categoriesTree, setCategoriesTree] = useState([]);
    const [brands, setBrands] = useState([]);
    const [sizeOptions, setSizeOptions] = useState([]);
    const [colorOptions, setColorOptions] = useState([]);
    const [products, setProducts] = useState([]);
    const productsPerPage = 9;

    useEffect(() => {
        const source = axios.CancelToken.source();
        const loadData = async () => {
            try {
                const [categoryRes, brandRes, variantRes, productRes] = await Promise.all([
                    axios.get('http://localhost:8080/api/categorys/', { cancelToken: source.token }),
                    axios.get('http://localhost:8080/api/brands/', { cancelToken: source.token }),
                    axios.get('http://localhost:8080/api/products/variants/aggregation', { cancelToken: source.token }),
                    axios.get('http://localhost:8080/api/products/info', { cancelToken: source.token })
                ]);
                setCategoriesTree(buildCategoryTree(categoryRes.data || []));
                setBrands(brandRes.data || []);
                setSizeOptions(variantRes.data?.sizes || []);
                setColorOptions(variantRes.data?.colors || []);
                setProducts(productRes.data || []);
            } catch (err) {
                if (!axios.isCancel(err)) console.error('Shop data load failed', err);
            }
        };
        loadData();
        return () => source.cancel();
    }, []);

    const filteredProducts = useMemo(() => {
        let result = products;
        if (filters.categories.length) {
            const catIds = new Set(filters.categories);
            result = result.filter(p => catIds.has(p.categoriesId));
        }
        if (filters.brands.length) {
            const brandSet = new Set(filters.brands);
            result = result.filter(p => brandSet.has(p.brand));
        }
        if (filters.sizes.length) {
            const sizeSet = new Set(filters.sizes);
            result = result.filter(p => p.sizes?.some(size => sizeSet.has(size)));
        }
        if (filters.colors.length) {
            const colorSet = new Set(filters.colors);
            result = result.filter(p => p.colors?.some(color => colorSet.has(color.name)));
        }
        return result;
    }, [products, filters]);

    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);
    const currentProducts = filteredProducts.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

    return (
        <>
            <ShopHeader cartCount={cartCount} searchTerm={searchTerm} onSearchChange={setSearchTerm} />
            <main className="container">
                <div className="page-header">
                    <h1 className="page-title">Bộ Sưu Tập Thời Trang</h1>
                    <p className="page-subtitle">Khám phá những xu hướng thời trang mới nhất từ các thương hiệu hàng đầu</p>
                </div>
                <div className="content-wrapper">
                    <FilterSidebar
                        filters={filters}
                        onFilterChange={setFilters}
                        onClearFilters={() => setFilters({ categories: [], brands: [], sizes: [], colors: [] })}
                        categoriesTree={categoriesTree}
                        brands={brands}
                        sizeOptions={sizeOptions}
                        colorOptions={colorOptions}
                    />
                    <section className="products-section">
                        <div className="sort-bar">
                            <div className="view-options">
                                <button className="view-btn active">⊞</button>
                                <button className="view-btn">☰</button>
                            </div>
                            <select className="sort-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                                <option value="newest">Mới nhất</option>
                                <option value="popular">Phổ biến nhất</option>
                                <option value="price-low">Giá: Thấp đến cao</option>
                                <option value="price-high">Giá: Cao đến thấp</option>
                                <option value="rating">Đánh giá cao nhất</option>
                                <option value="discount">Giảm giá nhiều nhất</option>
                            </select>
                        </div>
                        <ProductGrid products={currentProducts} addedToCart={addedToCart} wishlist={wishlist} />
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </section>
                </div>
            </main>
        </>
    );
};

export default ShopPage;