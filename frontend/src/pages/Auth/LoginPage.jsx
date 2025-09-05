import React, { useState } from "react";
import Input from "../../components/Input/Input";
import { login } from "../../services/authService";
import styles from '../../assets/styles/layouts/LoginPage.module.css';
import AuthLayout from "../../layouts/AuthLayout";

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState('');
    const [focused, setFocused] = useState(false);
    const [displayText, setDisplayText] = useState("Đợi lát \n !...");

    const handleCover = () => {
        const shutter = document.getElementById("shutter");
        if (!shutter) return;
        shutter.classList.toggle(styles.shutterCover);
        setFocused(!focused);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await login(email, password);
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
        >
            <Input
                id="email"
                type='text'
                placeholder='Số điện thoại / Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocused(false)}
            />
            <Input
                type='password'
                placeholder='Password'
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
            />
        </AuthLayout>

    );
};

export default LoginPage;