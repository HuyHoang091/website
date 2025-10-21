import { useState, useEffect } from 'react';
import CategoryTree from './CategoryTree';
import VariantList from './VariantList';
import { 
    getBrands, 
    getCategories,
    getColorCodes, 
    getProductForEdit, 
    createProduct, 
    updateProduct,
    uploadImage,
    createBrand,
    createCategory,
    createColorCode,
    updateBrand,
    updateCategory,
    updateColorCode,
    deleteBrand,
    deleteCategory,
    deleteColorCode
} from './inventoryService';

const ProductModal = ({ productId, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        name: '',
        brand_id: '',
        categories_id: '',
        price: '',
        status: 'active',
        description: ''
    });
    const [brands, setBrands] = useState([]);
    const [categories, setCategories] = useState([]);
    const [colors, setColors] = useState([]);
    const [productImages, setProductImages] = useState([]);
    const [variants, setVariants] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedCategoryName, setSelectedCategoryName] = useState('Chưa chọn danh mục');
    
    // States for brand management
    const [showBrandModal, setShowBrandModal] = useState(false);
    const [newBrandName, setNewBrandName] = useState('');
    const [editingBrand, setEditingBrand] = useState(null);
    const [showBrandManagement, setShowBrandManagement] = useState(false);

    // States for category management
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryParentId, setNewCategoryParentId] = useState('');
    const [editingCategory, setEditingCategory] = useState(null);
    const [showCategoryManagement, setShowCategoryManagement] = useState(false);
    
    // States for color management
    const [showColorModal, setShowColorModal] = useState(false);
    const [newColorName, setNewColorName] = useState('');
    const [newColorHex, setNewColorHex] = useState('#000000');
    const [editingColor, setEditingColor] = useState(null);
    const [showColorManagement, setShowColorManagement] = useState(false);
    
    const [apiStatus, setApiStatus] = useState({ loading: false, error: null, success: null });

    useEffect(() => {
        loadInitialData();
    }, []);

    useEffect(() => {
        if (productId) {
            loadProductData();
        } else {
            // Add empty variant for new product
            setVariants([{ size: '', color: '', stock: '', url: '' }]);
        }
    }, [productId]);

    // Clear API status messages after 3 seconds
    useEffect(() => {
        if (apiStatus.success || apiStatus.error) {
            const timer = setTimeout(() => {
                setApiStatus({ loading: false, error: null, success: null });
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [apiStatus]);

    const loadInitialData = async () => {
        try {
            const [brandsData, categoriesData, colorsData] = await Promise.all([
                getBrands(),
                getCategories(),
                getColorCodes()
            ]);
            setBrands(brandsData);
            setCategories(categoriesData);
            setColors(colorsData);
        } catch (error) {
            console.error('Error loading initial data:', error);
            setApiStatus({ 
                loading: false, 
                error: 'Không thể tải dữ liệu ban đầu', 
                success: null 
            });
        }
    };

    const loadProductData = async () => {
        try {
            const product = await getProductForEdit(productId);
            setFormData({
                name: product.name,
                brand_id: product.brand_id || '',
                categories_id: product.categories_id || '',
                price: product.price || '',
                status: product.status?.toLowerCase() || 'active',
                description: product.description || ''
            });
            setProductImages(product.url || []);
            setVariants(product.variant || []);
            
            if (product.categories_id) {
                const category = categories.find(c => c.id === product.categories_id);
                if (category) {
                    setSelectedCategoryName(category.name);
                }
            }
        } catch (error) {
            console.error('Error loading product data:', error);
            setApiStatus({ 
                loading: false, 
                error: 'Không thể tải thông tin sản phẩm', 
                success: null 
            });
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCategorySelect = (categoryId, categoryName) => {
        setFormData(prev => ({ ...prev, categories_id: categoryId }));
        setSelectedCategoryName(categoryName);
    };

    const handleImageUpload = async (files) => {
        try {
            const uploadPromises = Array.from(files).map(file => uploadImage(file));
            const urls = await Promise.all(uploadPromises);
            setProductImages(prev => [...prev, ...urls]);
        } catch (error) {
            console.error('Error uploading images:', error);
            setApiStatus({ 
                loading: false, 
                error: 'Không thể tải ảnh lên', 
                success: null 
            });
        }
    };

    const handleRemoveImage = (index) => {
        setProductImages(prev => prev.filter((_, i) => i !== index));
    };

    // Brand Management Functions
    const handleAddNewBrand = () => {
        setNewBrandName('');
        setEditingBrand(null);
        setShowBrandModal(true);
    };

    const handleEditBrand = (brand) => {
        setNewBrandName(brand.name);
        setEditingBrand(brand);
        setShowBrandModal(true);
    };

    const handleDeleteBrand = async (brandId) => {
        if (window.confirm('Bạn có chắc muốn xóa thương hiệu này? Hành động này không thể hoàn tác.')) {
            try {
                setApiStatus({ loading: true, error: null, success: null });
                await deleteBrand(brandId);
                
                // Cập nhật danh sách thương hiệu
                setBrands(brands.filter(brand => brand.id !== brandId));
                
                // Nếu đang chọn thương hiệu bị xóa, reset
                if (formData.brand_id === brandId) {
                    setFormData(prev => ({ ...prev, brand_id: '' }));
                }
                
                setApiStatus({
                    loading: false,
                    error: null,
                    success: 'Đã xóa thương hiệu thành công!'
                });
            } catch (error) {
                console.error('Error deleting brand:', error);
                setApiStatus({
                    loading: false,
                    error: 'Không thể xóa thương hiệu. Có thể đang được sử dụng bởi sản phẩm.',
                    success: null
                });
            }
        }
    };

    const handleSaveBrand = async () => {
        if (!newBrandName.trim()) {
            setApiStatus({ 
                loading: false, 
                error: 'Vui lòng nhập tên thương hiệu', 
                success: null 
            });
            return;
        }
        
        try {
            setApiStatus({ loading: true, error: null, success: null });
            
            let response;
            if (editingBrand) {
                // Cập nhật thương hiệu
                response = await updateBrand(editingBrand.id, { name: newBrandName });
                
                // Cập nhật danh sách thương hiệu
                setBrands(brands.map(brand => 
                    brand.id === editingBrand.id ? response : brand
                ));
                
                setApiStatus({
                    loading: false,
                    error: null,
                    success: 'Cập nhật thương hiệu thành công!'
                });
            } else {
                // Tạo thương hiệu mới
                response = await createBrand(newBrandName);
                
                // Thêm thương hiệu mới vào danh sách
                setBrands(prev => [...prev, response]);
                
                // Tự động chọn brand mới thêm
                setFormData(prev => ({ ...prev, brand_id: response.id }));
                
                setApiStatus({
                    loading: false,
                    error: null,
                    success: 'Thêm thương hiệu mới thành công!'
                });
            }
            
            setShowBrandModal(false);
        } catch (error) {
            console.error('Error saving brand:', error);
            setApiStatus({ 
                loading: false, 
                error: 'Không thể lưu thương hiệu: ' + (error.response?.data || error.message), 
                success: null 
            });
        }
    };

    // Category Management Functions
    const handleAddNewCategory = () => {
        setNewCategoryName('');
        setNewCategoryParentId('');
        setEditingCategory(null);
        setShowCategoryModal(true);
    };

    const handleEditCategory = (category) => {
        setNewCategoryName(category.name);
        setNewCategoryParentId(category.parentId || '');
        setEditingCategory(category);
        setShowCategoryModal(true);
    };

    const handleDeleteCategory = async (categoryId) => {
        if (window.confirm('Bạn có chắc muốn xóa danh mục này? Hành động này không thể hoàn tác.')) {
            try {
                setApiStatus({ loading: true, error: null, success: null });
                await deleteCategory(categoryId);
                
                // Cập nhật danh sách danh mục
                setCategories(categories.filter(category => category.id !== categoryId));
                
                // Nếu đang chọn danh mục bị xóa, reset
                if (formData.categories_id === categoryId) {
                    setFormData(prev => ({ ...prev, categories_id: '' }));
                    setSelectedCategoryName('Chưa chọn danh mục');
                }
                
                setApiStatus({
                    loading: false,
                    error: null,
                    success: 'Đã xóa danh mục thành công!'
                });
            } catch (error) {
                console.error('Error deleting category:', error);
                setApiStatus({
                    loading: false,
                    error: 'Không thể xóa danh mục. Có thể đang được sử dụng bởi sản phẩm hoặc có danh mục con.',
                    success: null
                });
            }
        }
    };

    const handleSaveCategory = async () => {
        if (!newCategoryName.trim()) {
            setApiStatus({ 
                loading: false, 
                error: 'Vui lòng nhập tên danh mục', 
                success: null 
            });
            return;
        }
        
        try {
            setApiStatus({ loading: true, error: null, success: null });
            
            // Dữ liệu category
            const categoryData = {
                name: newCategoryName,
                parentId: newCategoryParentId || null
            };
            
            let response;
            if (editingCategory) {
                // Cập nhật danh mục
                response = await updateCategory(editingCategory.id, categoryData);
                
                // Cập nhật danh sách danh mục
                setCategories(categories.map(category => 
                    category.id === editingCategory.id ? response : category
                ));
                
                setApiStatus({
                    loading: false,
                    error: null,
                    success: 'Cập nhật danh mục thành công!'
                });
            } else {
                // Tạo danh mục mới
                response = await createCategory(categoryData);
                
                // Thêm danh mục mới vào danh sách
                setCategories(prev => [...prev, response]);
                
                // Tự động chọn category mới thêm
                setFormData(prev => ({ ...prev, categories_id: response.id }));
                setSelectedCategoryName(newCategoryName);
                
                setApiStatus({
                    loading: false,
                    error: null,
                    success: 'Thêm danh mục mới thành công!'
                });
            }
            
            setShowCategoryModal(false);
        } catch (error) {
            console.error('Error saving category:', error);
            setApiStatus({ 
                loading: false, 
                error: 'Không thể lưu danh mục: ' + (error.response?.data || error.message), 
                success: null 
            });
        }
    };

    // Color Management Functions
    const handleAddNewColor = () => {
        setNewColorName('');
        setNewColorHex('#000000');
        setEditingColor(null);
        setShowColorModal(true);
    };

    const handleEditColor = (color) => {
        setNewColorName(color.colorName);
        setNewColorHex(color.colorHex);
        setEditingColor(color);
        setShowColorModal(true);
    };

    const handleDeleteColor = async (colorId) => {
        if (window.confirm('Bạn có chắc muốn xóa màu này? Hành động này không thể hoàn tác.')) {
            try {
                setApiStatus({ loading: true, error: null, success: null });
                await deleteColorCode(colorId);
                
                // Cập nhật danh sách màu
                setColors(colors.filter(color => color.colorName !== colorId));
                
                setApiStatus({
                    loading: false,
                    error: null,
                    success: 'Đã xóa màu thành công!'
                });
            } catch (error) {
                console.error('Error deleting color:', error);
                setApiStatus({
                    loading: false,
                    error: 'Không thể xóa màu. Có thể đang được sử dụng bởi sản phẩm.',
                    success: null
                });
            }
        }
    };

    const handleSaveColor = async () => {
        if (!newColorName.trim()) {
            setApiStatus({ 
                loading: false, 
                error: 'Vui lòng nhập tên màu', 
                success: null 
            });
            return;
        }
        
        try {
            setApiStatus({ loading: true, error: null, success: null });
            
            // Dữ liệu màu
            const colorData = {
                colorName: newColorName,
                colorHex: newColorHex
            };
            
            let response;
            if (editingColor) {
                // Cập nhật màu
                response = await updateColorCode(editingColor.colorName, colorData);
                
                // Cập nhật danh sách màu
                setColors(colors.map(color => 
                    color.colorName === editingColor.colorName ? response : color
                ));
                
                setApiStatus({
                    loading: false,
                    error: null,
                    success: 'Cập nhật màu thành công!'
                });
            } else {
                // Tạo màu mới
                response = await createColorCode(colorData);
                
                // Thêm màu mới vào danh sách
                setColors(prev => [...prev, response]);
                
                setApiStatus({
                    loading: false,
                    error: null,
                    success: 'Thêm màu mới thành công!'
                });
            }
            
            setShowColorModal(false);
        } catch (error) {
            console.error('Error saving color:', error);
            setApiStatus({ 
                loading: false, 
                error: 'Không thể lưu màu: ' + (error.response?.data || error.message), 
                success: null 
            });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.categories_id) {
            setApiStatus({ 
                loading: false, 
                error: 'Vui lòng chọn danh mục sản phẩm', 
                success: null 
            });
            return;
        }

        if (variants.length === 0 || !variants.some(v => v.size && v.color)) {
            setApiStatus({ 
                loading: false, 
                error: 'Vui lòng thêm ít nhất một biến thể', 
                success: null 
            });
            return;
        }

        const requestData = {
            ...formData,
            brand_id: parseInt(formData.brand_id),
            categories_id: parseInt(formData.categories_id),
            price: parseFloat(formData.price),
            url: productImages,
            variant: variants.filter(v => v.size && v.color)
        };

        try {
            setLoading(true);
            setApiStatus({ loading: true, error: null, success: null });
            
            if (productId) {
                await updateProduct(productId, requestData);
                setApiStatus({ 
                    loading: false, 
                    error: null, 
                    success: 'Cập nhật sản phẩm thành công!' 
                });
            } else {
                await createProduct(requestData);
                setApiStatus({ 
                    loading: false, 
                    error: null, 
                    success: 'Thêm sản phẩm mới thành công!' 
                });
            }
            
            onSave();
        } catch (error) {
            console.error('Error saving product:', error);
            setApiStatus({ 
                loading: false, 
                error: 'Lỗi khi lưu sản phẩm: ' + (error.response?.data?.message || error.message), 
                success: null 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal show">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{productId ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                    <button className="modal-close" onClick={onClose}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>

                <div className="modal-body">
                    {apiStatus.error && (
                        <div className="alert alert-error">
                            <i className="fas fa-exclamation-circle"></i>
                            <span>{apiStatus.error}</span>
                        </div>
                    )}
                    
                    {apiStatus.success && (
                        <div className="alert alert-success">
                            <i className="fas fa-check-circle"></i>
                            <span>{apiStatus.success}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label className="form-label">Tên sản phẩm</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Nhập tên sản phẩm"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group brand-select-group">
                                <div className="attribute-header">
                                    <label className="form-label">Thương hiệu</label>
                                    <div className="attribute-actions">
                                        <button 
                                            type="button" 
                                            className="btn-icon btn-manage"
                                            onClick={() => setShowBrandManagement(!showBrandManagement)}
                                        >
                                            <i className={`fas fa-${showBrandManagement ? 'eye-slash' : 'eye'}`}></i>
                                            <span className="btn-tooltip">
                                                {showBrandManagement ? 'Ẩn quản lý' : 'Hiện quản lý'}
                                            </span>
                                        </button>
                                        <button 
                                            type="button" 
                                            className="btn-icon btn-add"
                                            onClick={handleAddNewBrand}
                                        >
                                            <i className="fas fa-plus"></i>
                                            <span className="btn-tooltip">Thêm thương hiệu</span>
                                        </button>
                                    </div>
                                </div>
                                <select
                                    name="brand_id"
                                    className="form-input"
                                    value={formData.brand_id}
                                    onChange={handleInputChange}
                                    required
                                >
                                    <option value="">Chọn thương hiệu</option>
                                    {brands.map(brand => (
                                        <option key={brand.id} value={brand.id}>
                                            {brand.name}
                                        </option>
                                    ))}
                                </select>
                                
                                {showBrandManagement && (
                                    <div className="attribute-management">
                                        <div className="attribute-list">
                                            <div className="attribute-list-header">
                                                <span>Tên thương hiệu</span>
                                                <span>Thao tác</span>
                                            </div>
                                            <div className="attribute-list-content">
                                                {brands.length === 0 ? (
                                                    <div className="attribute-empty">Chưa có thương hiệu nào</div>
                                                ) : (
                                                    brands.map(brand => (
                                                        <div key={brand.id} className="attribute-item">
                                                            <span className="attribute-name">{brand.name}</span>
                                                            <div className="attribute-item-actions">
                                                                <button 
                                                                    type="button" 
                                                                    className="btn-icon btn-sm btn-edit"
                                                                    onClick={() => handleEditBrand(brand)}
                                                                >
                                                                    <i className="fas fa-edit"></i>
                                                                </button>
                                                                <button 
                                                                    type="button" 
                                                                    className="btn-icon btn-sm btn-delete"
                                                                    onClick={() => handleDeleteBrand(brand.id)}
                                                                >
                                                                    <i className="fas fa-trash"></i>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="form-group">
                                <label className="form-label">Giá cơ bản (VNĐ)</label>
                                <input
                                    type="number"
                                    name="price"
                                    className="form-input"
                                    value={formData.price}
                                    onChange={handleInputChange}
                                    placeholder="Nhập giá sản phẩm"
                                    min="0"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <div className="attribute-header">
                                <label className="form-label">Danh mục sản phẩm</label>
                                <div className="attribute-actions">
                                    <button 
                                        type="button" 
                                        className="btn-icon btn-manage"
                                        onClick={() => setShowCategoryManagement(!showCategoryManagement)}
                                    >
                                        <i className={`fas fa-${showCategoryManagement ? 'eye-slash' : 'eye'}`}></i>
                                        <span className="btn-tooltip">
                                            {showCategoryManagement ? 'Ẩn quản lý' : 'Hiện quản lý'}
                                        </span>
                                    </button>
                                    <button 
                                        type="button" 
                                        className="btn-icon btn-add"
                                        onClick={handleAddNewCategory}
                                    >
                                        <i className="fas fa-plus"></i>
                                        <span className="btn-tooltip">Thêm danh mục</span>
                                    </button>
                                </div>
                            </div>
                            <div className="selected-category">{selectedCategoryName}</div>
                            <CategoryTree
                                categories={categories}
                                selectedId={formData.categories_id}
                                onSelect={handleCategorySelect}
                            />
                            
                            {showCategoryManagement && (
                                <div className="attribute-management">
                                    <div className="attribute-list">
                                        <div className="attribute-list-header">
                                            <span>Tên danh mục</span>
                                            <span>Danh mục cha</span>
                                            <span>Thao tác</span>
                                        </div>
                                        <div className="attribute-list-content">
                                            {categories.length === 0 ? (
                                                <div className="attribute-empty">Chưa có danh mục nào</div>
                                            ) : (
                                                categories.map(category => (
                                                    <div key={category.id} className="attribute-item">
                                                        <span className="attribute-name">{category.name}</span>
                                                        <span className="attribute-parent">
                                                            {category.parentId ? 
                                                                categories.find(c => c.id === category.parentId)?.name || '—' : 
                                                                '—'}
                                                        </span>
                                                        <div className="attribute-item-actions">
                                                            <button 
                                                                type="button" 
                                                                className="btn-icon btn-sm btn-edit"
                                                                onClick={() => handleEditCategory(category)}
                                                            >
                                                                <i className="fas fa-edit"></i>
                                                            </button>
                                                            <button 
                                                                type="button" 
                                                                className="btn-icon btn-sm btn-delete"
                                                                onClick={() => handleDeleteCategory(category.id)}
                                                            >
                                                                <i className="fas fa-trash"></i>
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">Trạng thái</label>
                                <select
                                    name="status"
                                    className="form-input"
                                    value={formData.status}
                                    onChange={handleInputChange}
                                >
                                    <option value="active">Hiển thị (Active)</option>
                                    <option value="draft">Bản nháp (Draft)</option>
                                </select>
                            </div>
                            
                            <div className="form-group">
                                <label className="form-label">Mô tả</label>
                                <textarea
                                    name="description"
                                    className="form-input"
                                    value={formData.description}
                                    onChange={handleInputChange}
                                    placeholder="Nhập mô tả sản phẩm"
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Ảnh sản phẩm</label>
                            <div className="image-upload-container">
                                <input
                                    type="file"
                                    accept="image/*"
                                    multiple
                                    style={{ display: 'none' }}
                                    id="productImageUpload"
                                    onChange={(e) => handleImageUpload(e.target.files)}
                                />
                                <button
                                    type="button"
                                    className="image-upload-btn"
                                    onClick={() => document.getElementById('productImageUpload').click()}
                                >
                                    <i className="fas fa-upload"></i> Tải lên ảnh
                                </button>
                                <span className="upload-hint">Có thể chọn nhiều ảnh</span>
                            </div>
                            <div className="image-preview">
                                {productImages.map((url, index) => (
                                    <div key={index} className="image-preview-item">
                                        <img src={url} alt={`Product ${index + 1}`} />
                                        <button 
                                            type="button" 
                                            onClick={() => handleRemoveImage(index)}
                                            title="Xóa ảnh"
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <VariantList
                            variants={variants}
                            onChange={setVariants}
                            colors={colors}
                            onAddColor={handleAddNewColor}
                            onEditColor={handleEditColor}
                            onDeleteColor={handleDeleteColor}
                            showColorManagement={showColorManagement}
                            setShowColorManagement={setShowColorManagement}
                        />

                        <div className="form-actions">
                            <button type="button" className="btn btn-secondary" onClick={onClose}>
                                Hủy
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading}>
                                {loading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
            
            {/* Modal thêm/sửa thương hiệu */}
            {showBrandModal && (
                <div className="popup-modal">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h4>{editingBrand ? 'Sửa thương hiệu' : 'Thêm thương hiệu mới'}</h4>
                            <button 
                                className="popup-close" 
                                onClick={() => setShowBrandModal(false)}
                                title="Đóng"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="popup-body">
                            <div className="form-group">
                                <label className="form-label">Tên thương hiệu</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newBrandName}
                                    onChange={(e) => setNewBrandName(e.target.value)}
                                    placeholder="Nhập tên thương hiệu"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="popup-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowBrandModal(false)}
                            >
                                Hủy
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleSaveBrand}
                                disabled={apiStatus.loading}
                            >
                                {apiStatus.loading ? 'Đang lưu...' : (editingBrand ? 'Cập nhật' : 'Thêm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal thêm/sửa danh mục */}
            {showCategoryModal && (
                <div className="popup-modal">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h4>{editingCategory ? 'Sửa danh mục' : 'Thêm danh mục mới'}</h4>
                            <button 
                                className="popup-close" 
                                onClick={() => setShowCategoryModal(false)}
                                title="Đóng"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="popup-body">
                            <div className="form-group">
                                <label className="form-label">Tên danh mục</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="Nhập tên danh mục"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Danh mục cha (không bắt buộc)</label>
                                <select
                                    className="form-input"
                                    value={newCategoryParentId}
                                    onChange={(e) => setNewCategoryParentId(e.target.value)}
                                >
                                    <option value="">-- Không có danh mục cha --</option>
                                    {categories
                                        .filter(category => !editingCategory || category.id !== editingCategory.id)
                                        .map(category => (
                                            <option key={category.id} value={category.id}>
                                                {category.name}
                                            </option>
                                        ))}
                                </select>
                            </div>
                        </div>
                        <div className="popup-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowCategoryModal(false)}
                            >
                                Hủy
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleSaveCategory}
                                disabled={apiStatus.loading}
                            >
                                {apiStatus.loading ? 'Đang lưu...' : (editingCategory ? 'Cập nhật' : 'Thêm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal thêm/sửa màu sắc */}
            {showColorModal && (
                <div className="popup-modal">
                    <div className="popup-content">
                        <div className="popup-header">
                            <h4>{editingColor ? 'Sửa màu' : 'Thêm màu mới'}</h4>
                            <button 
                                className="popup-close" 
                                onClick={() => setShowColorModal(false)}
                                title="Đóng"
                            >
                                <i className="fas fa-times"></i>
                            </button>
                        </div>
                        <div className="popup-body">
                            <div className="form-group">
                                <label className="form-label">Tên màu</label>
                                <input
                                    type="text"
                                    className="form-input"
                                    value={newColorName}
                                    onChange={(e) => setNewColorName(e.target.value)}
                                    placeholder="Nhập tên màu (ví dụ: Đỏ, Xanh lá, ...)"
                                    autoFocus
                                />
                            </div>
                            <div className="form-group">
                                <label className="form-label">Mã màu (HEX)</label>
                                <div className="color-input-group">
                                    <input
                                        type="color"
                                        className="color-picker"
                                        value={newColorHex}
                                        onChange={(e) => setNewColorHex(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="form-input hex-input"
                                        value={newColorHex}
                                        onChange={(e) => setNewColorHex(e.target.value)}
                                        placeholder="#000000"
                                    />
                                </div>
                            </div>
                            <div className="color-preview" style={{ backgroundColor: newColorHex }}>
                                <span style={{ color: getContrastColor(newColorHex) }}>
                                    {newColorName || 'Xem trước màu sắc'}
                                </span>
                            </div>
                        </div>
                        <div className="popup-footer">
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setShowColorModal(false)}
                            >
                                Hủy
                            </button>
                            <button 
                                className="btn btn-primary"
                                onClick={handleSaveColor}
                                disabled={apiStatus.loading}
                            >
                                {apiStatus.loading ? 'Đang lưu...' : (editingColor ? 'Cập nhật' : 'Thêm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Hàm tính màu chữ tương phản dựa trên màu nền
function getContrastColor(hexColor) {
    // Loại bỏ # nếu có
    const hex = hexColor.replace('#', '');
    
    // Convert hex sang RGB
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Tính độ sáng dựa trên YIQ formula
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    
    // Trả về màu chữ dựa trên độ sáng
    return (yiq >= 128) ? '#000000' : '#ffffff';
}

export default ProductModal;