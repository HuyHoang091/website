import { useState, useEffect } from 'react';
import { getCategories } from './inventoryService';

const InventoryControls = ({ onFilter, onAddProduct }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        loadCategories();
    }, []);

    const loadCategories = async () => {
        try {
            const data = await getCategories();
            setCategories(data);
        } catch (error) {
            console.error('Error loading categories:', error);
        }
    };

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        onFilter(value, categoryId);
    };

    const findChildCategories = (categories, parentId) => {
        const children = categories.filter(category => category.parentId === parentId);
        let result = [...children];

        children.forEach(child => {
            result = [...result, ...findChildCategories(categories, child.id)];
        });

        return result;
    };

    const handleCategoryChange = (e) => {
        const value = e.target.value;
        setCategoryId(value);

        // Tìm danh mục cha và các danh mục con
        const selectedCategory = categoryTree.find(category => category.id === parseInt(value));
        const categoryName = selectedCategory ? selectedCategory.originalName.trim() : '';

        const childCategories = value
            ? findChildCategories(categories, parseInt(value)).map(child => child.name)
            : [];

        onFilter(searchTerm, value ? [categoryName, ...childCategories] : []); // Truyền danh sách tên danh mục cha và con
        console.log('Search Term:', searchTerm, 'Categories:', [categoryName, ...childCategories]);
    };

    // Build flat category list with indentation for display
    const buildCategoryTree = (categories, parentId = null, depth = 0) => {
        const indent = '—'.repeat(depth);
        let result = [];
        
        // Filter categories by parent
        const filteredCategories = categories.filter(c => {
            const parent = c.parent_id || c.parentId;
            return (parentId === null && !parent) || (parent === parentId);
        });
        
        // Sort by name
        filteredCategories.sort((a, b) => a.name.localeCompare(b.name));
        
        filteredCategories.forEach(category => {
            result.push({
                id: category.id,
                name: depth > 0 ? `${indent} ${category.name}` : category.name, // Hiển thị với phân cấp
                originalName: category.name // Lưu tên gốc để lọc
            });
            
            // Recursively add children
            const children = buildCategoryTree(categories, category.id, depth + 1);
            result = [...result, ...children];
        });
            
        return result;
    };

    const categoryTree = buildCategoryTree(categories);

    return (
        <div className="card">
            <div className="controls">
                <div className="search-box">
                    <input
                        type="text"
                        placeholder="Tìm kiếm sản phẩm..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                    />
                    <i className="fas fa-search"></i>
                </div>

                <div className="filter-group">
                    <select value={categoryId} onChange={handleCategoryChange}>
                        <option value="">Tất cả danh mục</option>
                        {categoryTree.map(category => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>

                    <button className="btn btn-success" onClick={onAddProduct}>
                        <i className="fas fa-plus"></i>
                        Thêm sản phẩm
                    </button>
                </div>
            </div>
        </div>
    );
};

export default InventoryControls;