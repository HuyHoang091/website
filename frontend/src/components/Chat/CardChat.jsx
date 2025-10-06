import React from "react";
import styles from "./CardChat.module.css";
import AvatarGenerator from "../Common/AvatarGenerator";

export default function CardChat({id, name, message, time, avatar, onSelect, selectedId, unread = 0 }) {
    const isActive = id === selectedId;
    const isFromFacebook = String(id).startsWith("fb:");
    const displayName = isFromFacebook ? `${name} (FB)` : name;

    const showUnreadBadge = !isActive && unread > 0;

    return (
        <div className={`${styles.card} ${isActive || unread > 0 ? styles.active : ""}`} onClick={() => onSelect(id, name)}>
            <AvatarGenerator name={name} userId={id} size={50} />
            {showUnreadBadge && <div className={styles.unreadBadge}>{unread > 99 ? "99+" : unread}</div>}
            <div className={styles.content}>
                <h3>{displayName}</h3>
                <p>{message}</p>
            </div>
            <span>{time}</span>
        </div>
    );
}