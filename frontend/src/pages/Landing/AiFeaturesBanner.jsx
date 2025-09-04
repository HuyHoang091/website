import React from "react";
import styles from "../../assets/styles/pages/Landding/AiFeaturesBanner.module.css"

export default function AiFeaturesBanner() {
    return (
        <div className={styles.aiBanner}>
            <div className={styles.card}>
                <div className={styles.icon}>📱</div>
                <div className={styles.title}>Thử Đồ Ảo AR</div>
                <div className={styles.description}>Xem trang phục trên cơ thể bạn trước khi mua</div>
            </div>
            <div className={styles.card}>
                <div className={styles.icon}>🤖</div>
                <div className={styles.title}>AI Tư Vấn Size</div>
                <div className={styles.description}>Gợi ý size chính xác dựa trên số đo cơ thể</div>
            </div>
            <div className={styles.card}>
                <div className={styles.icon}>✨</div>
                <div className={styles.title}>Phối Đồ Thông Minh</div>
                <div className={styles.description}>AI gợi ý cách phối đồ phù hợp với phong cách</div>
            </div>
        </div>
    );
}