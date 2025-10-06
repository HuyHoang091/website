import React from "react";
import styles from "./MessageItem.module.css";

export default function MessageItem({ content, time, status, isSender, type, 
  avatar = "http://localhost:8080/images/logo192.png", streaming = false }) {
  let statusText = "";
  if (status === "SENT") statusText = "Đã gửi";
  else if (status === "DELIVERED") statusText = "Đã nhận";
  else if (status === "SEEN") statusText = "Đã xem";
  else if (status === "SENDING") statusText = "Đang gửi...";
  let isSenderReal = Boolean(isSender);

  return (
    <div className={`${styles.messageRow} ${isSenderReal ? styles.sender : styles.receiver}`}>
      {!isSenderReal && (
        <img src={avatar} alt="avatar" className={styles.avatar} />
      )}

      <div className={`${styles.bubble} ${streaming ? styles.streaming : ""}`}>
        {type === "image" ? (
          <img src={content} alt="uploaded" style={{ maxWidth: "250px", borderRadius: "8px" }} />
        ) : (
          <p className={styles.text}>{content}</p>
        )}
        <div className={styles.meta}>
          <span className={styles.time}>{time}</span>
          {isSenderReal && <span className={styles.status}>{statusText}</span>}
          {streaming && (
            <span className={styles.typingIndicator}>...</span>
          )}
        </div>
      </div>
    </div>
  );
}
