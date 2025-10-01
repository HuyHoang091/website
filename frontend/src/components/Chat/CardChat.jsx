import React from "react";
import styles from "./CardChat.module.css";

export default function CardChat({id, name, message, time, avatar, onSelect, selectedId}) {
    const isActive = id === selectedId;

    return (
        <div className={`${styles.card} ${isActive ? styles.active : ""}`} onClick={() => onSelect(id, name)}>
            <img src="http://localhost:8080/images/logo192.png" alt="avatar"/>
            <div className={styles.content}>
                <h3>{name}</h3>
                <p>{message}</p>
            </div>
            <span>{time}</span>
        </div>
    );
}