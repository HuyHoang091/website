import React, { useRef, useEffect } from "react";
import "../../assets/styles/components/Menu/Menu.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { Link } from "react-router-dom";

const Menu = ({
    menuTitle = "Menu",
    items = [],
}) => {
    const menuRef = useRef(null);
    const checkboxRef = useRef(null);

    const closeMenu = () => {
        if (checkboxRef.current) {
            checkboxRef.current.checked = false;
        }
    };

    const handleMenuItemClick = () => {
        closeMenu();
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                checkboxRef.current &&
                checkboxRef.current.checked &&
                menuRef.current &&
                !menuRef.current.contains(event.target) &&
                event.target !== checkboxRef.current
            ) {
                checkboxRef.current.checked = false;
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div ref={menuRef}>
            <input type="checkbox" id="menuToggle" hidden ref={checkboxRef} />
            <label htmlFor="menuToggle" className="menuToggle">
                <FontAwesomeIcon icon={faBars} />
            </label>

            <div className="menu">
                <div className="menuHeader">
                    <h2>{menuTitle}</h2>
                </div>
                {items.map((item, idx) => (
                    <Link to={item.href} style={{ textDecoration: 'none' }} key={idx} onClick={handleMenuItemClick}>
                    <div className="menuItem">
                        <i><FontAwesomeIcon icon={item.icon} /></i>
                        <span>{item.label}</span>
                    </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Menu;