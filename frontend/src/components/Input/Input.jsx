import React from "react";
import styles from "../../assets/styles/components/Input/Input.module.css";

const Input = ({type, placeholder, value, onChange, onFocus, onBlur, errorText, error, ...rest}) => (
	<div className="flex flex-column">
		<input
			{...rest}
			className={styles.input}
			type={type}
			placeholder={placeholder}
			value={value}
			onChange={onChange}
			onFocus={onFocus}
			onBlur={onBlur}
		/>
		{error && <p className="my-0 text-error fz-14 pl-5 fw-500">{errorText}</p>}
	</div>
);

export default Input;