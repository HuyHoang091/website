import { useState, useEffect } from 'react';

const CategoryTree = ({ categories, selectedId, onSelect }) => {
    const [expandedIds, setExpandedIds] = useState([]);

    // Auto expand to show selected category
    useEffect(() => {
        if (selectedId) {
            const pathToRoot = findPathToRoot(selectedId, categories);
            setExpandedIds(pathToRoot);
        }
    }, [selectedId, categories]);

    // Find path from selected category to root
    const findPathToRoot = (categoryId, categories) => {
        const path = [];
        let currentId = categoryId;
        
        while (currentId) {
            const category = categories.find(c => c.id === currentId);
            if (!category) break;
            
            if (category.parent_id || category.parentId) {
                const parentId = category.parent_id || category.parentId;
                path.push(parentId);
                currentId = parentId;
            } else {
                break;
            }
        }
        
        return path;
    };

    const toggleExpand = (categoryId, e) => {
        e.stopPropagation();
        setExpandedIds(prev =>
            prev.includes(categoryId)
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const hasChildren = (categoryId) => {
        return categories.some(c => 
            (c.parent_id === categoryId || c.parentId === categoryId)
        );
    };

    const getChildren = (parentId) => {
        return categories.filter(c => 
            (c.parent_id === parentId || c.parentId === parentId)
        );
    };

    const renderCategory = (category, level = 0) => {
        const categoryId = category.id;
        const hasChild = hasChildren(categoryId);
        const isExpanded = expandedIds.includes(categoryId);
        const isSelected = selectedId === categoryId;
        const indent = level * 20;

        return (
            <div key={categoryId} className="category-item">
                <div
                    className={`category-select-item ${isSelected ? 'selected' : ''}`}
                    style={{ marginLeft: `${indent}px` }}
                    onClick={() => onSelect(categoryId, category.name)}
                >
                    {hasChild ? (
                        <i
                            className={`fas fa-caret-${isExpanded ? 'down' : 'right'} category-toggle`}
                            onClick={(e) => toggleExpand(categoryId, e)}
                        ></i>
                    ) : (
                        <span style={{ width: '1rem', display: 'inline-block' }}></span>
                    )}
                    <span className="category-name">{category.name}</span>
                </div>
                {hasChild && isExpanded && (
                    <div className="category-children" style={{ display: 'block' }}>
                        {getChildren(categoryId).map(child => 
                            renderCategory(child, level + 1)
                        )}
                    </div>
                )}
            </div>
        );
    };

    // Get root categories (parent_id = null or parentId = null)
    const rootCategories = categories.filter(c => 
        !c.parent_id && !c.parentId
    );

    if (rootCategories.length === 0) {
        return (
            <div className="category-tree">
                <div style={{ color: '#6b7280', padding: '0.5rem' }}>
                    Không có danh mục nào
                </div>
            </div>
        );
    }

    return (
        <div className="category-tree">
            {rootCategories.map(category => renderCategory(category, 0))}
        </div>
    );
};

export default CategoryTree;