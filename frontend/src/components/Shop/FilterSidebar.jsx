import React from 'react';

const renderCategoryTree = (nodes, selected, onToggle) =>
    nodes.map(node => (
        <li key={node.id}>
            <label className="filter-option">
                <input
                    type="checkbox"
                    className="filter-checkbox"
                    checked={selected.includes(node.id)}
                    onChange={(e) => onToggle(node.id, e.target.checked)}
                />
                <span className="filter-label">{node.name}</span>
            </label>
            {node.children?.length > 0 && (
                <ul className="filter-children">
                    {renderCategoryTree(node.children, selected, onToggle)}
                </ul>
            )}
        </li>
    ));

const FilterSidebar = ({
    filters,
    onFilterChange,
    onClearFilters,
    categoriesTree = [],
    brands = [],
    sizeOptions = [],
    colorOptions = []
}) => {
    const handleCategoryToggle = (id, checked) => {
        const next = checked
            ? [...filters.categories, id]
            : filters.categories.filter(catId => catId !== id);
        onFilterChange({ ...filters, categories: next });
    };

    const handleBrandToggle = (name, checked) => {
        const next = checked
            ? [...filters.brands, name]
            : filters.brands.filter(b => b !== name);
        onFilterChange({ ...filters, brands: next });
    };

    const handleSizeToggle = (size, checked) => {
        const next = checked
            ? [...filters.sizes, size]
            : filters.sizes.filter(s => s !== size);
        onFilterChange({ ...filters, sizes: next });
    };

    const handleColorToggle = (name, checked) => {
        const next = checked
            ? [...filters.colors, name]
            : filters.colors.filter(c => c !== name);
        onFilterChange({ ...filters, colors: next });
    };

    return (
        <aside className="filter-sidebar">
            <h3 className="filter-title">Bộ Lọc</h3>

            <div className="filter-group">
                <div className="filter-group-title">Danh mục</div>
                <ul className="filter-tree">
                    {renderCategoryTree(categoriesTree, filters.categories, handleCategoryToggle)}
                </ul>
            </div>

            <div className="filter-group">
                <div className="filter-group-title">Thương hiệu</div>
                {brands.map(brand => (
                    <label className="filter-option" key={brand.id}>
                        <input
                            type="checkbox"
                            className="filter-checkbox"
                            checked={filters.brands.includes(brand.name)}
                            onChange={(e) => handleBrandToggle(brand.name, e.target.checked)}
                        />
                        <span className="filter-label">{brand.name}</span>
                    </label>
                ))}
            </div>

            <div className="filter-group">
                <div className="filter-group-title">Kích cỡ</div>
                {sizeOptions.map(size => (
                    <label className="filter-option" key={size}>
                        <input
                            type="checkbox"
                            className="filter-checkbox"
                            checked={filters.sizes.includes(size)}
                            onChange={(e) => handleSizeToggle(size, e.target.checked)}
                        />
                        <span className="filter-label">{size}</span>
                    </label>
                ))}
            </div>

            <div className="filter-group">
                <div className="filter-group-title">Màu sắc</div>
                {colorOptions.map(color => (
                    <label className="filter-option" key={color.name}>
                        <input
                            type="checkbox"
                            className="filter-checkbox"
                            checked={filters.colors.includes(color.name)}
                            onChange={(e) => handleColorToggle(color.name, e.target.checked)}
                        />
                        <span className="filter-label">
                            <span className="color-dot" style={{ backgroundColor: color.code }} />
                            {color.name}
                        </span>
                    </label>
                ))}
            </div>

            <button className="clear-filters" onClick={onClearFilters}>
                Xóa Tất Cả Bộ Lọc
            </button>
        </aside>
    );
};

export default FilterSidebar;