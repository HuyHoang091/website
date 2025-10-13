import React from 'react';

const ShopHeader = ({ cartCount, searchTerm, onSearchChange }) => (
    <header className="header">
        <div className="top-bar">Miễn phí vận chuyển cho đơn hàng trên 500.000đ | Hotline: 1900-1234</div>
        <div className="nav-container">
            <div className="logo">Fashion Elite</div>
            <nav>
                <ul className="nav-menu">
                    <li><a>Trang Chủ</a></li>
                    <li><a>Nam</a></li>
                    <li><a>Nữ</a></li>
                    <li><a>Phụ Kiện</a></li>
                    <li><a>Sale</a></li>
                </ul>
            </nav>
            <div className="nav-actions">
                <div className="search-box">
                    <span className="search-icon">🔍</span>
                    <input type="text" className="search-input" placeholder="Tìm kiếm sản phẩm..." value={searchTerm} onChange={(e) => onSearchChange(e.target.value)} />
                </div>
                <button className="cart-btn">🛒 Giỏ hàng ({cartCount})</button>
            </div>
        </div>
    </header>
);

export default ShopHeader;