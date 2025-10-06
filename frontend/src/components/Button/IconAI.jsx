import React from "react";
import styles from "../../assets/styles/components/Button/IconAI.module.css";

const IconAI = ({ icon, lable, lable1 }) => {
    return (
        <div className={styles.container}>
            <button className={styles.button}>
                <div className={styles.icon}>🤖</div>
            </button>
        </div>
    )
}

export default IconAI;