const InventoryTable = ({ data, loading, onEdit, onDeleteProduct, onDeleteVariant }) => {
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    const getStockStatus = (quantity) => {
        if (quantity === 0) return { text: 'Hết hàng', class: 'status-out-of-stock' };
        if (quantity <= 5) return { text: 'Sắp hết', class: 'status-low-stock' };
        return { text: 'Còn hàng', class: 'status-in-stock' };
    };

    if (loading) {
        return (
            <div className="card">
                <div className="table-container">
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Sản phẩm</th>
                            <th>Thương hiệu</th>
                            <th>Danh mục</th>
                            <th>SKU</th>
                            <th>Size</th>
                            <th>Màu sắc</th>
                            <th>Số lượng</th>
                            <th>Giá</th>
                            <th>Trạng thái</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="empty-state">
                                    Không có dữ liệu sản phẩm
                                </td>
                            </tr>
                        ) : (
                            data.map((item) => {
                                const status = getStockStatus(item.stock);
                                return (
                                    <tr key={item.variantId}>
                                        <td>
                                            <div className="product-info">
                                                <img
                                                    className="product-img"
                                                    src={item.imageUrl || '/placeholder.png'}
                                                    alt={item.name}
                                                />
                                                <div className="product-details">
                                                    <div className="name">{item.name}</div>
                                                    <div className="id">ID: {item.productId}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{item.brand}</td>
                                        <td>{item.category}</td>
                                        <td style={{ color: '#6b7280' }}>{item.sku}</td>
                                        <td>{item.size}</td>
                                        <td>{item.color.split(',')[0]}</td>
                                        <td style={{ fontWeight: 500 }}>{item.stock}</td>
                                        <td>{formatCurrency(item.price)}</td>
                                        <td>
                                            <span className={`status-badge ${status.class}`}>
                                                {status.text}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    onClick={() => onEdit(item.productId)}
                                                    className="btn-edit"
                                                    title="Chỉnh sửa"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => onDeleteVariant(item.variantId, item.sku)}
                                                    className="btn-delete"
                                                    title="Xóa biến thể"
                                                >
                                                    <i className="fas fa-trash-alt"></i>
                                                </button>
                                                <button
                                                    onClick={() => onDeleteProduct(item.productId, item.name)}
                                                    className="btn-delete-product"
                                                    title="Xóa sản phẩm"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default InventoryTable;