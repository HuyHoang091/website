import React from "react";
import styles from "../../assets/styles/components/Input/Input.module.css";

const Input = ({ type, placeholder, value, onChange, onFocus, onBlur }) => (
    <input
    className={styles.input}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    onFocus={onFocus}
    onBlur={onBlur}
    />
);

export default Input;