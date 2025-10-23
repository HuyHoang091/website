import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './adminHeader.css';

const AdminHeader = ({ toggleSidebar }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    
    // Breadcrumb mapping - map routes to readable names
    const pathMappings = {
        'dashboard': 'Tổng quan',
        'inventory': 'Quản lý kho',
        'orders': 'Đơn hàng',
        'categories': 'Danh mục',
        'brands': 'Thương hiệu',
        'customers': 'Khách hàng',
        'settings': 'Cài đặt',
        'profile': 'Hồ sơ',
        // Add more mappings as needed
    };

    // Generate breadcrumb items based on current path
    const generateBreadcrumbs = () => {
        const paths = location.pathname.split('/').filter(path => path);
        const breadcrumbs = [];
        
        // Always add Home
        breadcrumbs.push({ name: 'Trang chủ', path: '/admin' });
        
        // Add path segments
        let currentPath = '';
        paths.forEach((path, index) => {
            if (path === 'admin') return; // Skip admin in breadcrumb
            
            currentPath += `/${path}`;
            const pathName = pathMappings[path] || path.charAt(0).toUpperCase() + path.slice(1);
            breadcrumbs.push({
                name: pathName,
                path: index === paths.length - 1 ? null : `/admin${currentPath}`
            });
        });
        
        return breadcrumbs;
    };
    
    const breadcrumbs = generateBreadcrumbs();
    
    const handleLogout = () => {
        // Xóa token khỏi localStorage
        localStorage.removeItem('tokenJWT');
        localStorage.removeItem('user');
        // Chuyển hướng về trang login
        navigate('/login');
    };
    
    const toggleUserMenu = () => {
        setShowUserMenu(!showUserMenu);
        if (showNotifications) setShowNotifications(false);
    };
    
    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
        if (showUserMenu) setShowUserMenu(false);
    };
    
    // Mock data cho thông báo
    const notifications = [
        { id: 1, text: 'Đơn hàng mới #1234', time: '5 phút trước', read: false },
        { id: 2, text: 'Yêu cầu hủy đơn hàng #5678', time: '1 giờ trước', read: false },
        { id: 3, text: 'Sản phẩm ABC sắp hết hàng', time: '3 giờ trước', read: true },
    ];
    
    return (
        <header className="admin-header">
            <div className="header-left">
                <button className="sidebar-toggle" onClick={toggleSidebar}>
                    <i className="fas fa-bars"></i>
                </button>
            </div>
            
            <div className="breadcrumb-container">
                <nav className="breadcrumb-admin">
                    {breadcrumbs.map((item, index) => (
                        <React.Fragment key={index}>
                            {index > 0 && (
                                <i className="fas fa-chevron-right breadcrumb-separator"></i>
                            )}
                            {item.path ? (
                                <a href={item.path} className="breadcrumb-link">
                                    {item.name}
                                </a>
                            ) : (
                                <span className="breadcrumb-current">{item.name}</span>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
            </div>
            
            <div className="header-right">
                <div className="header-search">
                    <div className="search-input-wrapper">
                        <i className="fas fa-search search-icon"></i>
                        <input type="text" placeholder="Tìm kiếm..." className="search-input" />
                    </div>
                </div>
                
                <div className="header-actions">
                    <div className="notification-wrapper">
                        <button className="notification-btn" onClick={toggleNotifications}>
                            <i className="fas fa-bell"></i>
                            <span className="notification-badge">{notifications.filter(n => !n.read).length}</span>
                        </button>
                        
                        {showNotifications && (
                            <div className="notification-dropdown">
                                <div className="notification-header">
                                    <h3>Thông báo</h3>
                                    <button className="mark-all-read">Đánh dấu đã đọc</button>
                                </div>
                                <div className="notification-list">
                                    {notifications.length > 0 ? (
                                        notifications.map(notification => (
                                            <div key={notification.id} className={`notification-item ${notification.read ? '' : 'unread'}`}>
                                                <div className="notification-icon">
                                                    <i className="fas fa-shopping-bag"></i>
                                                </div>
                                                <div className="notification-content">
                                                    <p className="notification-text">{notification.text}</p>
                                                    <p className="notification-time">{notification.time}</p>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="empty-notifications">Không có thông báo mới</p>
                                    )}
                                </div>
                                <div className="notification-footer">
                                    <button className="view-all-btn">Xem tất cả</button>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="user-menu-wrapper">
                        <button className="user-menu-btn" onClick={toggleUserMenu}>
                            <div className="user-avatar">
                                <img src="/logo192.png" alt="User Avatar" />
                            </div>
                            <span className="user-name">{user.fullName || 'Admin'}</span>
                            <i className={`fas fa-chevron-${showUserMenu ? 'up' : 'down'}`}></i>
                        </button>
                        
                        {showUserMenu && (
                            <div className="user-dropdown">
                                <ul className="user-dropdown-menu">
                                    <li className="user-dropdown-item">
                                        <a href="/admin/profile" className="user-dropdown-link">
                                            <i className="fas fa-user"></i>
                                            <span>Hồ sơ</span>
                                        </a>
                                    </li>
                                    <li className="user-dropdown-item">
                                        <a href="/admin/settings" className="user-dropdown-link">
                                            <i className="fas fa-cog"></i>
                                            <span>Cài đặt</span>
                                        </a>
                                    </li>
                                    <li className="user-dropdown-divider"></li>
                                    <li className="user-dropdown-item">
                                        <button onClick={handleLogout} className="user-dropdown-link logout-btn">
                                            <i className="fas fa-sign-out-alt"></i>
                                            <span>Đăng xuất</span>
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AdminHeader;