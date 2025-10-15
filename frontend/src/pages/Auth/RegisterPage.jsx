import React, {useState} from "react";
import Input from "../../components/Input/Input";
import {login, register} from "../../services/authService";
import styles from '../../assets/styles/layouts/RegisterPage.module.css';
import AuthLayout from "../../layouts/AuthLayout";
import {ROUTE_PATHS as ROUTES} from "../../utils/appConst";
import {useNavigate} from "react-router-dom";

const RegisterPage = () => {
	const [form, setForm] = useState({fullName: "", email: "", password: ""});
	const [errors, setErrors] = useState({fullName: "", email: "", password: ""});
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
	const [focused, setFocused] = useState(false);
	const [displayText, setDisplayText] = useState("Đợi lát \n !...");
	const navigator = useNavigate();
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
		try {
			setLoading(true);
			const res = await register(form);
			if (res.status === 201) {
				showToast('Đăng ký thành công! Mật khẩu đã được gửi về email của bạn!!!(Lưu ý: hãy xác nhận tài khoản trong 24h tới!!!)...', 'success');

				setTimeout(() => {
					navigator(ROUTES.LOGIN);
				}, 3000);
			} else {
				showToast(res.message || 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
			}
		} catch (err) {
			if (err.response && err.response.status === 409) {
				showToast('Email hoặc số điện thoại đã tồn tại. Vui lòng thử lại.', 'error');
			} else {
				showToast('Đăng ký thất bại. Vui lòng thử lại.', 'error');
			}
		} finally {
			setLoading(false);
		}
	};
	
	const handleSetForm = (value = {}) => {
		setForm(prevState => ({...prevState, ...value}));
	}
	
	const handleErrors = (value = {}) => {
		setErrors(prevState => ({...prevState, ...value}));
	}
	
	const handleChange = (value, name) => {
		const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
		const phoneRegex = new RegExp(/(03|05|07|08|09|01[2|6|8|9])+([0-9]{8})\b/);
		if (name === "email") {
			handleErrors({[name]: !emailRegex.test(value) ? 'Invalid email' : ""})
		}
		if (name === "phone") {
			handleErrors({
				[name]: !phoneRegex.test(value)
					? 'Invalid phone (start with +84 or 0, followed by 10 digits, e.g. +84123456789 or 0123456789)'
					: ""
			})
		}
		console.log(phoneRegex.test(value))
		handleSetForm({[name]: value});
	}
	
	return (
		<AuthLayout
			title="✨ Đăng ký ✨"
			onSubmit={handleLogin}
			error={error}
			loading={loading}
			displayText={displayText}
			setDisplayText={setDisplayText}
			focused={focused}
			setFocused={setFocused}
			handleCover={handleCover}
			text="Đã có tài khoản? "
			a="Đăng nhập"
			href={ROUTES.LOGIN}
		>
			
			<Input
				type='text'
				placeholder='Fullname'
				value={form.fullName}
				onChange={(e) => handleChange(e.target.value, "fullName")}
				onFocus={() => setError("")}
				error={Boolean(errors.fullName)}
				errorText={errors.fullName}
			/>
			<Input
				id="email"
				type='text'
				placeholder='Email'
				value={form.email}
				onChange={(e) => handleChange(e.target.value, "email")}
				onFocus={() => setError("")}
				error={Boolean(errors.email)}
				errorText={errors.email}
			/>
			<Input
				type='text'
				placeholder='Phone'
				value={form.phone}
				onChange={(e) => handleChange(e.target.value, "phone")}
				onFocus={() => setError("")}
				error={Boolean(errors.phone)}
				errorText={errors.phone}
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

export default RegisterPage;