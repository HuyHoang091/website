import React, { useState, useEffect } from 'react';
import styles from '../../assets/styles/components/Loading/Loading.module.css';

const Loading = ({ message = "Đang tải..." }) => {
  const [progressText, setProgressText] = useState("Đang khởi tạo...");

  useEffect(() => {
    const texts = ["Đang khởi tạo...", "Đang tải dữ liệu...", "Hoàn tất ✅", "Đang tải lên..."];
    let currentIndex = 0;
    
    const changeText = () => {
      if (currentIndex < texts.length - 1) {
        currentIndex++;
        setProgressText(texts[currentIndex]);
      } else {
        clearInterval(interval);
      }
    };

    const interval = setInterval(changeText, 900);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={styles.loadingContainer}>
      <div className={styles.loadingContent}>
        {/* Logo/Brand */}
        <div className={styles.loadingBrand}>
          <div className={styles.brandLogo}>
            <span className={styles.logoIcon}>✨</span>
            <span className={styles.logoText}>LUXURY FASHION</span>
          </div>
        </div>

        {/* Loading Animation */}
        <div className={styles.loadingAnimation}>
          <div className={styles.spinner}>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
            <div className={styles.spinnerRing}></div>
          </div>
        </div>

        {/* Loading Text */}
        <div className={styles.loadingText}>
          <h3 className={styles.loadingTitle}>{message}</h3>
          <p className={styles.loadingSubtitle}>Vui lòng đợi trong giây lát...</p>
        </div>

        {/* Progress Bar */}
        <div className={styles.loadingProgress}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill}></div>
          </div>
          <div className={styles.progressText}>
            {progressText}
          </div>
        </div>

        {/* Loading Dots */}
        <div className={styles.loadingDots}>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
          <div className={styles.dot}></div>
        </div>
      </div>

      {/* Background Animation */}
      <div className={styles.loadingBackground}>
        <div className={styles.floatingShapes}>
          <div className={`${styles.shape} ${styles.shape1}`}></div>
          <div className={`${styles.shape} ${styles.shape2}`}></div>
          <div className={`${styles.shape} ${styles.shape3}`}></div>
          <div className={`${styles.shape} ${styles.shape4}`}></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;