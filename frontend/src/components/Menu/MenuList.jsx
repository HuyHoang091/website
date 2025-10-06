import React from "react";
import styles from "../../assets/styles/components/Menu/MenuList.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { href, Link } from "react-router-dom";

const MenuList = ({ items = [] }) => (
    <div>
        <ul className={styles.menuList}>
            {items.map((item, idx) => (
                <Link to={item.link}>
                <a className={styles.menuItem} key={idx}>
                    <i className={styles.icon}>
                        <FontAwesomeIcon icon={item.icon} />
                    </i>
                    <span className={styles.label}>{item.label}</span>
                </a>
                </Link>
            ))}
        </ul>
    </div>
);

export default MenuList;