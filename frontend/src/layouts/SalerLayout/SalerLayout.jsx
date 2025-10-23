import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SalerSidebar from './SalerSidebar/SalerSidebar';
import SalerHeader from './SalerHeader/SalerHeader';
import './salerLayout.css';

const SalerLayout = () => {
    const [sidebarOpen, setSidebarOpen] = useState(() => {
        const savedState = localStorage.getItem('salerSidebarOpen');
        return savedState !== null ? JSON.parse(savedState) : true;
    });
    
    const location = useLocation();

    const toggleSidebar = () => {
        const newState = !sidebarOpen;
        setSidebarOpen(newState);
        // Lưu trạng thái mới vào localStorage
        localStorage.setItem('salerSidebarOpen', JSON.stringify(newState));
    };
    
    // Đóng sidebar tự động trên màn hình nhỏ
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) {
                setSidebarOpen(false);
                localStorage.setItem('salerSidebarOpen', 'false');
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
            <SalerSidebar isOpen={sidebarOpen} />
            
            <div className="admin-main">
                <SalerHeader
                    toggleSidebar={toggleSidebar}
                />

                <div className="saler-content" style={{ padding: '0px !important' }}>
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default SalerLayout;