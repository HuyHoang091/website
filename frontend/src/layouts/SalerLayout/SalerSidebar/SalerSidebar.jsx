import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
// import './salerSidebar.css';

const SalerSidebar = ({ isOpen }) => {
    const location = useLocation();
    const [activeSection, setActiveSection] = useState(null);
    const navigate = useNavigate();

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
            path: '/saler/dashboard'
        },
        {
            id: 'chat',
            title: 'Chat',
            icon: 'fas fa-comments',
            path: '/saler/chat'
        },
        {
            id: 'search',
            title: 'Tìm kiếm hình ảnh',
            icon: 'fas fa-search',
            path: '/saler/search'
        },
        {
            id: 'orderstatistics',
            title: 'Doanh thu',
            icon: 'fas fa-dollar-sign',
            path: '/saler/order-statistics'
        },
        {
            id: 'customerstats',
            title: 'Khách hàng',
            icon: 'fas fa-users',
            path: '/saler/customer-stats'
        }
    ];
    
    return (
        <div className={`admin-sidebar ${isOpen ? 'open' : 'closed'}`}>
            <div className="sidebar-header">
                <div className="logo-container">
                    <img src="/logo192.png" alt="Logo" className="logo" />
                    {isOpen && <span className="logo-text">Saler Panel</span>}
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
                                            onClick={() => toggleSection(item.id, item.children[0]?.path)}
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

export default SalerSidebar;