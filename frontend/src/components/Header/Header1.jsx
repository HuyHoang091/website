import React from 'react';
import Menu from '../Menu/Menu';
import styles from '../../assets/styles/components/Header/Header1.module.scss';
import { faHouse, faCartShopping, faFontAwesome, faBook, faQuestion } from "@fortawesome/free-solid-svg-icons";
import { Link } from 'react-router-dom';

const menuItems = [
    { icon: faHouse, label: "Trang chủ", href: "/" },
    { icon: faCartShopping, label: "Cửa hàng" },
    { icon: faFontAwesome, label: "Giới thiệu" },
    { icon: faBook, label: "Blog" },
    { icon: faQuestion, label: "Câu hỏi thường gặp" },
];

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <Menu items={menuItems} />
        <div className={styles.headerContent}>
            <div className={`${styles.slideIn} ${styles['col-3']}`}>
                <div className={styles.luxuryText}>✨ LUXE FASHION</div>
            </div>

            <div className={`${styles.navLinks} ${styles['col-4']}`}>
                <a href="#new" className={styles.navLink}>Hàng Mới</a>
                <a href="#women" className={styles.navLink}>Nữ</a>
                <a href="#men" className={styles.navLink}>Nam</a>
                <a href="#sale" className={styles.vipSale}>💎 VIP SALE</a>
            </div>

            <div className={`${styles.search} ${styles['col-2']}`}>
                <input type="text" placeholder="Tìm kiếm luxury..." className={styles.searchInput} />
                <div className={styles.searchIcon}>🔍</div>
            </div>
            <button className={`${styles.cartButton} ${styles['col-1']}`}>
                🛒
                <span className={styles.cartCount}>0</span>
            </button>
            <Link to="/login" className={styles['col-2']}>
              <button className={styles.vipButton}>VIP Login</button>
            </Link>
        </div>
      </div>
    </header>
  );
}