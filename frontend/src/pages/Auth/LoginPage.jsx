import React, { useState } from "react";
import Input from "../../components/Input/Input";
import { login } from "../../services/authService";
import styles from '../../assets/styles/layouts/LoginPage.module.css';
import AuthLayout from "../../layouts/AuthLayout";
import { useNavigate } from 'react-router-dom';
import {ROUTE_PATHS as ROUTES} from "../../utils/appConst";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState('');
    const [focused, setFocused] = useState(false);
    const [displayText, setDisplayText] = useState("Đợi lát \n !...");
    const navigate = useNavigate();
    const [toasts, setToasts] = useState([]);

    const handleCover = () => {
        const shutter = document.getElementById("shutter");
        if (!shutter) return;
        shutter.classList.toggle(styles.shutterCover);
        setFocused(!focused);
    };

    const showToast = (message, type = 'success') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        setTimeout(() => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        }, 3000);
    };

    const Toast = ({ id, message, type }) => {
        const handleClose = () => {
            setToasts(prev => prev.filter(toast => toast.id !== id));
        };
        
        return (
            <div className={`${styles.toast} ${styles[type]}`}>
                <div className={styles.toastMessage}>{message}</div>
                <button className={styles.toastClose} onClick={handleClose}>×</button>
            </div>
        );
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const role = await login(email, password);
            if (role === 'SALER') {
                navigate("/test");
            } else {
                navigate("/");
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout
            title="✨ Đăng nhập ✨"
            onSubmit={handleLogin}
            error={error}
            loading={loading}
            displayText={displayText}
            setDisplayText={setDisplayText}
            focused={focused}
            setFocused={setFocused}
            handleCover={handleCover}
            text="Chưa có tài khoản? "
            a="Đăng ký"
            href={ROUTES.REGISTER}
        >
            <Input
                id="email"
                type='text'
                placeholder='Số điện thoại / Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(false)}
                maxlength="100"
            />
            <Input
                type='password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                maxlength="100"
            />
            <div className={styles.toastContainer}>
                {toasts.map(toast => (
                    <Toast
                        key={toast.id}
                        id={toast.id}
                        message={toast.message}
                        type={toast.type}
                    />
                ))}
            </div>
        </AuthLayout>
    );
};

export default LoginPage;