import React from "react";
import styles from '../assets/styles/layouts/LoginPage.module.css';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faRotateRight } from "@fortawesome/free-solid-svg-icons";
import { setupLive2D, handleReload } from "../utils/Live2D";

const AuthLayout = ({
  title,
  onSubmit,
  error,
  loading,
  children,
  displayText,
  setDisplayText,
  focused,
  setFocused,
  handleCover,
  text,
  a,
  herf,
}) => {
  React.useEffect(() => {
    setupLive2D(styles);
  }, []);
  
  React.useEffect(() => {
    const timeout = setTimeout(() => {
        if (!focused) {
        setDisplayText("Đợi lát \n !...");
        }
    }, 1000);

    if (focused) {
        setDisplayText("Đóng cửa \n :3");
    }

    return () => clearTimeout(timeout);
  }, [focused]);

  return (
    <div className={styles.centerWrapper}>
      <div className={styles.borderBox}>
        <div className={styles.loginBox}>
          <div className={styles.loginHover}>
            <div className={styles.loginTitle}>{title}</div>
            <form onSubmit={onSubmit} className={styles.form}>
              <div className={styles.live2dContainer}>
                <div className={styles.live2dWrapper}>
                  <div className={`${styles.shutter} ${focused ? styles.shutterCover : ''}`} id="shutter">
                    <div className={styles.handle} onClick={handleCover}></div>
                    <span id="shutterText">{displayText}</span>
                  </div>
                </div>
                <i className={styles.reloadBtn} onClick={() => handleReload(styles)}>
                  <FontAwesomeIcon icon={faRotateRight} />
                </i>
              </div>
              {children}
              {error && <p className={styles.error}>{error}</p>}
              <button type="submit" className={styles.button}>
                {loading ? 'Đang xử lý...' : title}
              </button>
              <div className={styles.question}>
                <span>{text}</span>
                <a herf={herf}>{a}</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout; 