import React, {useState} from "react";
import Input from "../../components/Input/Input";
import {login, register} from "../../services/authService";
import styles from '../../assets/styles/layouts/RegisterPage.module.css';
import AuthLayout from "../../layouts/AuthLayout";
import {ROUTE_PATHS as ROUTES} from "../../utils/appConst";

const RegisterPage = () => {
	const [form, setForm] = useState({fullName: "", email: "", password: ""});
	const [errors, setErrors] = useState({fullName: "", email: "", password: ""});
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [error, setError] = useState('');
	const [loading, setLoading] = useState(false);
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
		try {
			setLoading(true);
			const res = await register(form);
			if (res.status === 200) {
			
			}
		} catch (err) {
			setError(err.message);
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
				placeholder='Fullname'
				value={form.fullName}
				onChange={(e) => handleChange(e.target.value, "fullName")}
				onFocus={() => setError("")}
				error={Boolean(errors.fullName)}
				errorText={errors.fullName}
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
		</AuthLayout>
	
	);
};

export default RegisterPage;