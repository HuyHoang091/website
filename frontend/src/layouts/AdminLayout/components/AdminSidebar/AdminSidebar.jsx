import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './adminSidebar.css';

const AdminSidebar = ({ isOpen }) => {
    const location = useLocation();
    const [activeSection, setActiveSection] = useState(null);
    
    const toggleSection = (section) => {
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
            title: 'Khách hàng',
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
                    title: 'Doanh số',
                    path: '/admin/reports/sales'
                },
                {
                    title: 'Sản phẩm bán chạy',
                    path: '/admin/reports/top-products'
                },
                {
                    title: 'Khách hàng',
                    path: '/admin/reports/customers'
                }
            ]
        },
        {
            id: 'settings',
            title: 'Cài đặt',
            icon: 'fas fa-cog',
            path: '/admin/settings'
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
                                            onClick={() => toggleSection(item.id)}
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
                            <p className="admin-name">Admin User</p>
                            <p className="admin-role">Administrator</p>
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