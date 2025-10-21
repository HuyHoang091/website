import React, { useState, useEffect } from 'react';
import axios from 'axios';
import UserTable from './UserTable';
import UserForm from './UserForm';
import Pagination from './Pagination';
import styles from './UserManagement.module.css';

const UserManagementPage = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
    const [usersPerPage] = useState(10); // Số lượng người dùng trên mỗi trang

    const indexOfLastUser = currentPage * usersPerPage; // Vị trí cuối cùng của user trên trang hiện tại
    const indexOfFirstUser = indexOfLastUser - usersPerPage; // Vị trí đầu tiên của user trên trang hiện tại
    const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser); // Người dùng trên trang hiện tại

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        loadUsers();
    }, []);

    useEffect(() => {
        filterUsers();
    }, [users, searchTerm, roleFilter]);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('tokenJWT');
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/users/`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setUsers(response.data);
            setError(null);
        } catch (err) {
            console.error('Error loading users:', err);
            setError('Không thể tải danh sách người dùng!');
        } finally {
            setLoading(false);
        }
    };

    const filterUsers = () => {
        let result = [...users];
        
        // Áp dụng filter theo tìm kiếm
        if (searchTerm) {
            result = result.filter(user => 
                user.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.phone?.includes(searchTerm)
            );
        }
        
        // Áp dụng filter theo vai trò
        if (roleFilter) {
            result = result.filter(user => user.role === roleFilter);
        }
        
        setFilteredUsers(result);
    };

    const handleAddUser = () => {
        setEditingUser(null);
        setShowForm(true);
    };

    const handleEditUser = (user) => {
        setEditingUser(user);
        setShowForm(true);
    };

    const handleDeleteUser = async (userId) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này?')) {
            return;
        }
        
        try {
            const token = localStorage.getItem('token');
            await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${userId}/soft-delete`, {}, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            loadUsers();
            setError(null);
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('Không thể xóa người dùng!');
        }
    };

    const handleFormSubmit = async (userData) => {
        console.log('Submitting user data:', userData);
        try {
            const token = localStorage.getItem('token');
            if (editingUser) {
                // Cập nhật user
                await axios.put(`${process.env.REACT_APP_API_URL}/api/users/${editingUser.id}`, userData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            } else {
                // Tạo user mới
                await axios.post(`${process.env.REACT_APP_API_URL}/api/users/`, userData, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
            loadUsers();
            setShowForm(false);
            setEditingUser(null);
            setError(null);
        } catch (err) {
            console.error('Error saving user:', err);
            setError(err.response?.data || 'Không thể lưu người dùng!');
        }
    };

    const handleFormCancel = () => {
        setShowForm(false);
        setEditingUser(null);
    };

    return (
        <div className={styles.userManagementPage}>
            <h2 className={styles.pageTitle}>Quản Lý Người Dùng</h2>
            
            {error && (
                <div className={styles.errorAlert}>
                    <i className="fas fa-exclamation-circle"></i> {error}
                    <button onClick={() => setError(null)} className={styles.closeButton}>×</button>
                </div>
            )}
            
            <div className={styles.toolbar}>
                <div className={styles.searchAndFilter}>
                    <div className={styles.searchBox}>
                        <input
                            type="text"
                            placeholder="Tìm kiếm theo tên, email hoặc số điện thoại..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        <i className="fas fa-search"></i>
                    </div>
                    
                    <div className={styles.filterBox}>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="">Tất cả vai trò</option>
                            <option value="ADMIN">Admin</option>
                            <option value="MANAGER">Manager</option>
                            <option value="SALER">Saler</option>
                            <option value="USER">User</option>
                        </select>
                    </div>
                </div>
                
                <button className={styles.addButton} onClick={handleAddUser}>
                    <i className="fas fa-user-plus"></i> Thêm Người Dùng
                </button>
            </div>
            
            {loading ? (
                <div className={styles.loadingIndicator}>
                    <div className={styles.spinner}></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
            ) : (
                <UserTable
                    users={currentUsers}
                    onEdit={handleEditUser}
                    onDelete={handleDeleteUser}
                />
            )}
            <Pagination
                usersPerPage={usersPerPage}
                totalUsers={filteredUsers.length}
                paginate={paginate}
                currentPage={currentPage}
            />
            
            {showForm && (
                <div className={styles.formOverlay}>
                    <UserForm
                        user={editingUser}
                        onSubmit={handleFormSubmit}
                        onCancel={handleFormCancel}
                    />
                </div>
            )}
        </div>
    );
};

export default UserManagementPage;