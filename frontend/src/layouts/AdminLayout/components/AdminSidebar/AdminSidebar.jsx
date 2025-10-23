import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './adminSidebar.css';

const AdminSidebar = ({ isOpen }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState(null);

    const user = JSON.parse(localStorage.getItem('user')) || {};
    
    const toggleSection = (section, defaultPath = null) => {
        // Nếu sidebar đang đóng và có defaultPath, thì điều hướng đến path đó
        if (!isOpen && defaultPath) {
            navigate(defaultPath);
            return;
        }
        
        // Xử lý bình thường khi sidebar mở
        if (activeSection === section) {
            setActiveSection(null);
        } else {
            setActiveSection(section);
        }
    };
    
    const isActive = (path) => {
        return location.pathname === path;
    };
    
    const navigationItems = [
        {
            id: 'dashboard',
            title: 'Tổng quan',
            icon: 'fas fa-chart-line',
            path: '/admin/dashboard'
        },
        {
            id: 'products',
            title: 'Sản phẩm',
            icon: 'fas fa-box',
            path: '/admin/inventory'
        },
        {
            id: 'orders',
            title: 'Đơn hàng',
            icon: 'fas fa-shopping-cart',
            children: [
                {
                    title: 'Tất cả đơn hàng',
                    path: '/admin/orders'
                },
                {
                    title: 'Yêu cầu hủy đơn',
                    path: '/admin/orders-cancel-requests'
                },
                {
                    title: 'Trả hàng & Hoàn tiền',
                    path: '/admin/refunds'
                }
            ]
        },
        {
            id: 'customers',
            title: 'Người dùng',
            icon: 'fas fa-users',
            path: '/admin/users'
        },
        {
            id: 'marketing',
            title: 'Marketing',
            icon: 'fas fa-bullhorn',
            children: [
                {
                    title: 'Khuyến mãi',
                    path: '/admin/promotions'
                },
                {
                    title: 'Tạo nội dung',
                    path: '/admin/contents'
                }
            ]
        },
        {
            id: 'reports',
            title: 'Báo cáo',
            icon: 'fas fa-chart-bar',
            children: [
                {
                    title: 'Doanh thu',
                    path: '/admin/order-statistics'
                },
                {
                    title: 'Khách hàng',
                    path: '/admin/customer-stats'
                }
            ]
        },
        {
            id: 'settings',
            title: 'Cài đặt',
            icon: 'fas fa-cog',
            children: [
                {
                    title: 'Trợ lý tri thức',
                    path: '/admin/rag'
                },
                {
                    title: 'Cấu hình hệ thống',
                    path: '/admin/config'
                }
            ]
        }
    ];
    
    return (
        <div className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <img src="/logo192.png" alt="Logo" className="logo" />
                    {isOpen && <span className="logo-text">Admin Panel</span>}
                </div>
            </div>
            
            <div className="sidebar-content">
                <nav className="sidebar-menu">
                    <ul className="menu-items">
                        {navigationItems.map((item) => (
                            <li key={item.id} className={`menu-item ${item.children && activeSection === item.id ? 'active' : ''}`}>
                                {item.children ? (
                                    <>
                                        <div 
                                            className={`menu-link has-children ${item.children.some(child => isActive(child.path)) ? 'active' : ''}`}
                                            onClick={() => toggleSection(item.id, item.children[0]?.path)} // Truyền path của child đầu tiên
                                        >
                                            <i className={`menu-icon ${item.icon}`}></i>
                                            {isOpen && (
                                                <>
                                                    <span className="menu-text">{item.title}</span>
                                                    <i className={`fas ${activeSection === item.id ? 'fa-chevron-down' : 'fa-chevron-right'} menu-arrow`}></i>
                                                </>
                                            )}
                                        </div>
                                        
                                        {(isOpen && activeSection === item.id) && (
                                            <ul className="submenu">
                                                {item.children.map((child, index) => (
                                                    <li key={index} className={`submenu-item ${isActive(child.path) ? 'active' : ''}`}>
                                                        <Link to={child.path} className="submenu-link">
                                                            <i className="fas fa-circle submenu-icon"></i>
                                                            <span className="submenu-text">{child.title}</span>
                                                        </Link>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </>
                                ) : (
                                    <Link to={item.path} className={`menu-link ${isActive(item.path) ? 'active' : ''}`}>
                                        <i className={`menu-icon ${item.icon}`}></i>
                                        {isOpen && <span className="menu-text">{item.title}</span>}
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ul>
                </nav>
            </div>
            
            <div className="sidebar-footer">
                {isOpen ? (
                    <div className="admin-info">
                        <div className="admin-avatar">
                            <img src="/logo192.png" alt="Admin" />
                        </div>
                        <div className="admin-details">
                            <p className="admin-name">{user.fullName || 'Admin'}</p>
                            <p className="admin-role">{user.role || 'ADMIN'}</p>
                        </div>
                    </div>
                ) : (
                    <div className="admin-avatar-small">
                        <img src="/logo192.png" alt="Admin" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminSidebar;