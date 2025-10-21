const InventoryStats = ({ stats }) => {
    return (
        <div className="stats-grid">
            <div className="stat-card">
                <div className="stat-icon blue">
                    <i className="fas fa-boxes"></i>
                </div>
                <div className="stat-info">
                    <div className="label">Tổng sản phẩm</div>
                    <div className="value">{stats.total}</div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon green">
                    <i className="fas fa-check-circle"></i>
                </div>
                <div className="stat-info">
                    <div className="label">Còn hàng</div>
                    <div className="value">{stats.inStock}</div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon yellow">
                    <i className="fas fa-exclamation-triangle"></i>
                </div>
                <div className="stat-info">
                    <div className="label">Sắp hết</div>
                    <div className="value">{stats.lowStock}</div>
                </div>
            </div>

            <div className="stat-card">
                <div className="stat-icon red">
                    <i className="fas fa-times-circle"></i>
                </div>
                <div className="stat-info">
                    <div className="label">Hết hàng</div>
                    <div className="value">{stats.outOfStock}</div>
                </div>
            </div>
        </div>
    );
};

export default InventoryStats;