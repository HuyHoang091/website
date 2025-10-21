import React, { useEffect, useState, useContext } from 'react';
import Menu from '../Menu/Menu';
import styles from '../../assets/styles/components/Header/Header1.module.scss';
import { faHouse, faCartShopping, faFontAwesome, faBook, faQuestion } from "@fortawesome/free-solid-svg-icons";
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {ROUTE_PATHS} from "../../utils/appConst";
import { CartContext } from "../../context/CartContext"; 

const menuItems = [
    { icon: faHouse, label: "Trang chủ", href: "/" },
    { icon: faCartShopping, label: "Cửa hàng" },
    { icon: faFontAwesome, label: "Giới thiệu" },
    { icon: faBook, label: "Blog" },
    { icon: faQuestion, label: "Câu hỏi thường gặp" },
];

export default function Header() {
  const [name, setName] = useState("VIP Login");
  const [isLogin, setIsLogin] = useState(false);
  const { cartCount, setCartCount } = useContext(CartContext);
  const navigate = useNavigate();

  useEffect(() => {
    const tokenJWT = localStorage.getItem('tokenJWT');
    const user = localStorage.getItem('user');

    if (tokenJWT && user) {
        const parsedUser = JSON.parse(user);
        setName(parsedUser.fullName || "User");
        setIsLogin(true);

        fetchCartCount(parsedUser.id);
    }
  }, []);

  const fetchCartCount = async (userId) => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/cart/list/${userId}/items`);
      const cartItems = response.data || [];
      setCartCount(cartItems.length);
    } catch (error) {
      console.error("Error fetching cart count:", error.response?.data || error.message);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tokenJWT');
    localStorage.removeItem('user');
    setIsLogin(false);
    setName("VIP Login");
    navigate("/login");
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerContainer}>
        <Menu items={menuItems} />
        <div className={styles.headerContent}>
            <div className={`${styles.slideIn} ${styles['col-3']}`}>
	            <Link to={ROUTE_PATHS.HOME}>
                <div className={styles.luxuryText}>✨ LUXE FASHION</div>
	            </Link>
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
            <button className={`${styles.cartButton} ${styles['col-1']}`} onClick={() => navigate('/cart')}>
                🛒
                <span className={styles.cartCount}>{cartCount ? cartCount : 0}</span>
            </button>

            <div className={styles['col-2']}>
              {!isLogin ? (
                <Link to="/login">
                  <button className={styles.vipButton}>Vip Login</button>
                </Link>
              ) : (
                <div className={styles.userSection}>
                  <span className={styles.userName}>{name}</span>
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
        </div>
      </div>
    </header>
  );
}
