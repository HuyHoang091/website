import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import AdminSidebar from './components/AdminSidebar/AdminSidebar';
import AdminHeader from './components/AdminHeader/AdminHeader';
import './adminLayout.css';

const AdminLayout = () => {
    // Khởi tạo sidebarOpen từ localStorage hoặc mặc định là true
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const savedState = localStorage.getItem('adminSidebarOpen');
        return savedState !== null ? JSON.parse(savedState) : true;
    });
    
    const location = useLocation();

    const toggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        // Lưu trạng thái mới vào localStorage
        localStorage.setItem('adminSidebarOpen', JSON.stringify(newState));
    };
    
    // Đóng sidebar tự động trên màn hình nhỏ
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
                localStorage.setItem('adminSidebarOpen', 'false');
            }
        };
        
        window.addEventListener('resize', handleResize);
        handleResize();
        
        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Theo dõi thay đổi đường dẫn nhưng KHÔNG thay đổi trạng thái sidebar
    useEffect(() => {
        // Không thực hiện hành động nào khi đường dẫn thay đổi
        // để giữ nguyên trạng thái sidebar
    }, [location.pathname]);

    return (
        <div className={`admin-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
            <AdminSidebar isOpen={sidebarOpen} />
            
            <div className="admin-main">
                <AdminHeader 
                    toggleSidebar={toggleSidebar} 
                />
                
                <div className="admin-content">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;