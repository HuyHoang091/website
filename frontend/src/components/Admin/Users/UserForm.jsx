import React, { useState, useEffect } from 'react';
import styles from './UserManagement.module.css';

const UserForm = ({ user, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        role: 'USER',
        status: 'Đã kích hoạt'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (user) {
            setFormData({
                fullName: user.fullName || '',
                email: user.email || '',
                phone: user.phone || '',
                role: user.role || 'USER',
                status: user.status || 'Active'
            });
        }
    }, [user]);

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Họ tên không được để trống';
        }
        
        if (!formData.email.trim()) {
            newErrors.email = 'Email không được để trống';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email không hợp lệ';
        }
        
        if (!formData.phone.trim()) {
            newErrors.phone = 'Số điện thoại không được để trống';
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = 'Số điện thoại phải có 10 chữ số';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            onSubmit(formData);
        }
    };

    return (
        <div className={styles.formContainer}>
            <div className={styles.formHeader}>
                <h3>{user ? 'Chỉnh Sửa Người Dùng' : 'Thêm Người Dùng Mới'}</h3>
                <button className={styles.closeButton} onClick={onCancel}>×</button>
            </div>

            <form className={styles.formSubmit} onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="fullName">Họ Tên</label>
                    <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        className={errors.fullName ? styles.inputError : ''}
                    />
                    {errors.fullName && <div className={styles.errorText}>{errors.fullName}</div>}
                </div>
                
                <div className={styles.formGroup}>
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={errors.email ? styles.inputError : ''}
                        disabled={user !== null} // Không cho phép sửa email nếu là cập nhật
                    />
                    {errors.email && <div className={styles.errorText}>{errors.email}</div>}
                </div>
                
                <div className={styles.formGroup}>
                    <label htmlFor="phone">Số Điện Thoại</label>
                    <input
                        type="text"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className={errors.phone ? styles.inputError : ''}
                        disabled={user !== null} // Không cho phép sửa số điện thoại nếu là cập nhật
                    />
                    {errors.phone && <div className={styles.errorText}>{errors.phone}</div>}
                </div>
                
                <div className={styles.formGroup}>
                    <label htmlFor="role">Vai Trò</label>
                    <select
                        id="role"
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="USER">User</option>
                        <option value="SALER">Saler</option>
                        <option value="MANAGER">Manager</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
                
                <div className={styles.formGroup}>
                    <label htmlFor="status">Trạng Thái</label>
                    <select
                        id="status"
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                    >
                        <option value="Đã kích hoạt">Đã kích hoạt</option>
                        <option value="Không hoạt động">Không hoạt động</option>
                        <option value="Chưa kích hoạt">Chưa kích hoạt</option>
                    </select>
                </div>
                
                <div className={styles.formActions}>
                    <button type="button" className={styles.cancelButton} onClick={onCancel}>
                        Hủy
                    </button>
                    <button type="submit" className={styles.submitButton}>
                        {user ? 'Cập Nhật' : 'Thêm Mới'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default UserForm;