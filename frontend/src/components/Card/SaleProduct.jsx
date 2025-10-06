import React from "react";
import styles from "../../assets/styles/components/Card/SaleProduct.module.css"

export default function SaleProduct({items = [], key}) {
    return (
        <div key={key} className={styles.product}>
            <div className={styles.image}>
                <img src={items.icon} alt={items.nameProduct} />
            </div>
            <div className={styles.context}>
                <div className={styles.name}>{items.nameProduct}</div>
                <div>
                    <span className={styles.current}>{items.current}</span>
                    <span className={styles.old}>{items.old}</span>
                </div>
            </div>
        </div>
    );
}