import React, { useEffect, useState }  from "react";
import styles from "../assets/styles/layouts/SaleLayout.module.css"

export default function SaleLayout({children, endTime}) {
    const [timeLeft, setTimeLeft] = useState({
        days: 1,
        hours: 12,
        minutes: 34,
    });

    useEffect(() => {
        const targetDate = endTime ? new Date(endTime) : new Date(Date.now() + 24 * 60 * 60 * 1000);

        const updateCountdown = () => {
            const now = new Date();
            const difference = targetDate - now;

            if (difference <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0 });
                clearInterval(timer);
                return;
            }

            const days = Math.floor(difference / (1000 * 60 * 60 * 24));
            const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((difference / (1000 * 60)) % 60);

            setTimeLeft({ days, hours, minutes });
        };

        const timer = setInterval(updateCountdown, 1000);
        updateCountdown(); // gọi lần đầu

        return () => clearInterval(timer);
    }, []);

    return (
        <section id="sale" className={styles.saleSection}>
            <h2>🔥 FLASH SALE 50% 🔥</h2>
            <p>Chỉ còn 2 ngày! Giảm giá sốc cho tất cả sản phẩm</p>
            <div className={styles.timeOut}>
                <div className={styles.card}>
                    <div className={styles.number}>{String(timeLeft.days).padStart(2, "0")}</div>
                    <div>Ngày</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.number}>{String(timeLeft.hours).padStart(2, "0")}</div>
                    <div>Giờ</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.number}>{String(timeLeft.minutes).padStart(2, "0")}</div>
                    <div>Phút</div>
                </div>
            </div>
            <div className={styles.product}>
                {children}
            </div>
            <button>Xem thêm >></button>
        </section>
    );
}