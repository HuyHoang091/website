const OrderFilters = ({ activeFilter, onFilterChange, orders }) => {
    // Đếm số lượng đơn hàng theo từng trạng thái
    const getOrderCount = (status) => {
        if (status === 'all') return orders.length;
        return orders.filter(order => order.status.toLowerCase() === status.toLowerCase()).length;
    };

    // Các filter options
    const filters = [
        { key: 'all', label: 'Tất cả đơn hàng', icon: '📋' },
        { key: 'pending', label: 'Chờ xác nhận', icon: '⏳' },
        { key: 'confirmed', label: 'Đã xác nhận', icon: '✅' },
        { key: 'shipping', label: 'Đang giao hàng', icon: '🚚' },
        { key: 'delivered', label: 'Đã giao hàng', icon: '📦' },
        { key: 'cancel_requested', label: 'Đang chờ hủy', icon: '🔄' }, // Thêm filter cho trạng thái đang chờ hủy
        { key: 'cancelled', label: 'Đã hủy', icon: '❌' },
    ];

    return (
        <div className="order-filters">
            <div className="filters-list">
                {filters.map(filter => (
                    <button
                        key={filter.key}
                        className={`filter-btn ${activeFilter === filter.key ? 'active' : ''}`}
                        onClick={() => onFilterChange(filter.key)}
                    >
                        <span className="filter-icon">{filter.icon}</span>
                        <span className="filter-label">{filter.label}</span>
                        <span className="filter-count">{getOrderCount(filter.key)}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default OrderFilters;