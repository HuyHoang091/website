import React from "react";

const Button = ({ children, onClick, type = 'button' }) => (
    <button onClick={onClick} type={type} style={{
        padding: '10px 20px',
        background: '#linear-gradient(120deg, #ff512f, #dd2476, #24c6dc, #5433ff, #ff512f 90%) 0 0/200% 200%',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
    }}>
        {children}
    </button>
);

export default Button;