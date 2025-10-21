import React from 'react';
import { formatDateUser } from '../../../utils/formatters';
import styles from './UserManagement.module.css';

const UserTable = ({ users, onEdit, onDelete }) => {
    if (!users || users.length === 0) {
        return (
            <div className={styles.emptyState}>
                <i className="fas fa-users-slash"></i>
                <p>Không có người dùng nào.</p>
            </div>
        );
    }

    const getRoleBadgeClass = (role) => {
        switch (role) {
            case 'ADMIN':
                return styles.adminBadge;
            case 'SALER':
                return styles.salerBadge;
            case 'MANAGER':
                return styles.managerBadge;
            default:
                return styles.userBadge;
        }
    };

    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Đã kích hoạt':
                return styles.activeBadge;
            case 'Không hoạt động':
                return styles.inactiveBadge;
            case 'Chưa kích hoạt':
                return styles.pendingBadge;
            default:
                return styles.defaultBadge;
        }
    };

    return (
        <div className={styles.tableContainer}>
            <table className={styles.userTable}>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Họ Tên</th>
                        <th>Email</th>
                        <th>Số Điện Thoại</th>
                        <th>Vai Trò</th>
                        <th>Trạng Thái</th>
                        <th>Ngày Tạo</th>
                        <th>Thao Tác</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                            <td>{user.id}</td>
                            <td>{user.fullName}</td>
                            <td>{user.email}</td>
                            <td>{user.phone}</td>
                            <td>
                                <span className={getRoleBadgeClass(user.role)}>
                                    {user.role}
                                </span>
                            </td>
                            <td>
                                <span className={getStatusBadgeClass(user.status)}>
                                    {user.status || 'Active'}
                                </span>
                            </td>
                            <td>{formatDateUser(user.createdAt)}</td>
                            <td className={styles.actions}>
                                <button 
                                    className={styles.editButton}
                                    onClick={() => onEdit(user)}
                                    title="Chỉnh sửa"
                                >
                                    <i className="fas fa-edit"></i>
                                </button>
                                {user.role !== 'ADMIN' && (
                                    <button 
                                        className={styles.deleteButton}
                                        onClick={() => onDelete(user.id)}
                                        title="Xóa"
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default UserTable;