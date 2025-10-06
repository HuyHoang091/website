import React from "react";
import styles from "./MessageItem.module.css";
import AvatarGenerator from "../Common/AvatarGenerator";

export default function MessageItem({ content, time, status, isSender, type, chatName, chatId, streaming = false }) {
  let statusText = "";
  if (status === "SENT") statusText = "Đã gửi";
  else if (status === "DELIVERED") statusText = "Đã nhận";
  else if (status === "SEEN") statusText = "Đã xem";
  else if (status === "SENDING") statusText = "Đang gửi...";
  let isSenderReal = Boolean(isSender);

  return (
    <div className={`${styles.messageRow} ${isSenderReal ? styles.sender : styles.receiver}`}>
      {!isSenderReal && (
        <AvatarGenerator name={chatName} userId={chatId} size={30} />
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
