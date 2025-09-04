import React, { useRef, useState, useEffect } from "react";
import Menu from "../Menu/Menu";
import MenuList from "../Menu/MenuList";
import styles from "../../assets/styles/components/Header/Header.module.css";
import logo from "../../assets/images/logo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faHeart, faBagShopping, faCircleUser } from "@fortawesome/free-solid-svg-icons";
import { faHouse, faCartShopping, faFontAwesome, faBook, faQuestion } from "@fortawesome/free-solid-svg-icons";

const headerItems = [
    { label: "Trang chủ" },
    { label: "Cửa hàng" },
    { label: "Giới thiệu" }
];

const menuItems = [
    { icon: faHouse, label: "Trang chủ" },
    { icon: faCartShopping, label: "Cửa hàng" },
    { icon: faFontAwesome, label: "Giới thiệu" },
    { icon: faBook, label: "Blog" },
    { icon: faQuestion, label: "Câu hỏi thường gặp" },
];

const menuListItems = [
    { icon: faHouse, label: "Đăng nhập", link: "/login" },
    { icon: faHouse, label: "Đăng ký", link: "/" }
];

const menuListItems1 = [
    { icon: faHouse, label: "Thông tin cá nhân" },
    { icon: faHouse, label: "Đơn hàng của tôi" },
    { icon: faHouse, label: "Yêu thích" },
    { icon: faHouse, label: "Cài đặt" },
    { icon: faHouse, label: "Đăng xuất" }
];

const Header = () => {
    const [showMenuList, setShowMenuList] = useState(false);
    const menuListRef = useRef(null);
    const iconRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuListRef.current &&
                !menuListRef.current.contains(event.target) &&
                iconRef.current &&
                !iconRef.current.contains(event.target)
            ) {
                setShowMenuList(false);
            }
        };
        if (showMenuList) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [showMenuList]);

    return (
        <header className={styles.header}>
            <Menu menuTitle="Menu" items={menuItems} />
            {headerItems.map((item, idx) => (
                <div className={styles.menuItem} key={idx}>
                    <span>{item.label}</span>
                </div>
            ))}
            <img src={logo} alt="Logo" className={styles.logo} />
            <i className={styles.icon}><FontAwesomeIcon icon={faHeart} /></i>
            <div>
                <span className={styles.cart}>Cart</span>
                <i className={styles.icon1}><FontAwesomeIcon icon={faBagShopping} /></i>
            </div>
            <div style={{ position: "relative" }}>
                <i
                    className={styles.icon2}
                    ref={iconRef}
                    onClick={() => setShowMenuList((show) => !show)}
                    style={{ cursor: "pointer" }}
                >
                    <FontAwesomeIcon icon={faCircleUser} />
                </i>
                {showMenuList && (
                    <div ref={menuListRef}>
                        <MenuList items={menuListItems} />
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;