import React from "react";
import styles from "../../assets/styles/components/Footer/Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.overlay}></div>
      <div className={styles.container}>
        <div className={styles.grid}>
          <div>
            <div className={styles.logo}>✨ LUXE FASHION</div>
            <p className={styles.description}>
              Định nghĩa lại thời trang cao cấp với công nghệ AI tiên tiến và dịch vụ VIP độc quyền
            </p>
            <div className={styles.socials}>
              <a href="#" className={styles.socialIcon}>📘</a>
              <a href="#" className={styles.socialIcon}>📷</a>
              <a href="#" className={styles.socialIcon}>🐦</a>
            </div>
          </div>
          <div>
            <h3 className={styles.title}>LUXURY COLLECTIONS</h3>
            <ul className={styles.list}>
              <li><a href="#"><span>👚</span>Premium Blouses</a></li>
              <li><a href="#"><span>👗</span>Designer Dresses</a></li>
              <li><a href="#"><span>👖</span>Luxury Denim</a></li>
              <li><a href="#"><span>🧥</span>Executive Blazers</a></li>
            </ul>
          </div>
          <div>
            <h3 className={styles.title}>VIP SERVICES</h3>
            <ul className={styles.list}>
              <li><a href="#"><span>🤖</span>AI Personal Stylist</a></li>
              <li><a href="#"><span>👑</span>VIP Concierge</a></li>
              <li><a href="#"><span>📱</span>AR Try-On</a></li>
              <li><a href="#"><span>💎</span>Exclusive Access</a></li>
            </ul>
          </div>
          <div>
            <h3 className={styles.title}>CONTACT LUXURY</h3>
            <ul className={styles.list}>
              <li><span>📞</span>+84 1900 LUXE (5893)</li>
              <li><span>📧</span>vip@luxefashion.vn</li>
              <li><span>📍</span>Landmark 81, Vinhomes Central Park</li>
              <li><span>🕒</span>24/7 VIP Support</li>
            </ul>
          </div>
        </div>
        <div className={styles.bottom}>
          <p>&copy; 2024 LUXE FASHION. All Rights Reserved. Luxury Redefined.</p>
          <div className={styles.links}>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">VIP Terms</a>
          </div>
        </div>
      </div>
    </footer>
  );
}