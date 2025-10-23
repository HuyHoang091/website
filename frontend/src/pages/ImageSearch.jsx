import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import styles from "../assets/styles/ImageSearch.module.css";
import Menu from "../components/Menu/Menu";
import { faHouse, faCartShopping, faFontAwesome, faBook, faQuestion, faTimes } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function ImageSearch() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [enlargedImage, setEnlargedImage] = useState(null);

  // Menu items matching ChatPage
  const menuItems = [
    { icon: faHouse, label: "Trang chủ", href: "/" },
    { icon: faCartShopping, label: "Tìm kiếm hình ảnh", href: "/search" },
    { icon: faFontAwesome, label: "Giới thiệu" },
    { icon: faBook, label: "Blog" },
    { icon: faQuestion, label: "Câu hỏi thường gặp" },
  ];

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => setUploadedImage(e.target.result);
      reader.readAsDataURL(file);

      uploadToBackend(file);
    }
  };

  const uploadToBackend = async (file) => {
    setLoading(true);
    setResults([]);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("http://localhost:8000/search/", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      setResults(data.results || []);
    } catch (err) {
      console.error("Upload error:", err);
      alert("Có lỗi xảy ra khi tìm kiếm!");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setUploadedImage(null);
    setResults([]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handlePaste = (e) => {
    for (let item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        handleFileSelect(file);
        break;
      }
    }
  };

  const handleEnlargeImage = (imageUrl) => {
    setEnlargedImage(imageUrl);
  };

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <div className={styles.appContainer}>
      <Menu items={menuItems} />
      <div className={styles.searchPageLayout}>
        {/* Main Content */}
        <div className={styles.searchMainContent}>
          <div className={styles.searchContainer}>
            <h1 className={styles.title}>🔍 Tìm kiếm sản phẩm bằng hình ảnh</h1>

            <div
              className={`${styles.dropzone} ${isDragOver ? styles.dragOver : ""}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadedImage ? (
                <div className={styles.preview}>
                  <img src={uploadedImage} alt="Uploaded" />
                  <button onClick={handleClear}>❌ Xóa</button>
                </div>
              ) : (
                <div className={styles.dropzoneContent}>
                  <p className={styles.hint}>Kéo thả ảnh, dán (Ctrl+V) hoặc chọn file</p>
                  <button
                    className={styles.uploadBtn}
                    onClick={() => fileInputRef.current.click()}
                  >
                    📁 Chọn File
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileSelect(e.target.files[0])}
                    style={{ display: "none" }}
                  />
                </div>
              )}
            </div>

            {loading && (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p className={styles.loading}>Đang tìm kiếm...</p>
              </div>
            )}

            {results.length > 0 && (
              <>
                <h2 className={styles.resultsTitle}>Kết quả tìm kiếm</h2>
                <div className={styles.resultsGrid}>
                  {results.map((item, idx) => (
                    <div className={styles.resultCard} key={idx}>
                      <div 
                        className={styles.resultImage}
                        onClick={() => handleEnlargeImage(`http://localhost:8000${item.images[0]}`)}
                      >
                        <img
                          src={`http://localhost:8000${item.images[0]}`}
                          alt={`Product ${item.product_id}`}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/logo192.png";
                          }}
                        />
                      </div>
                      <div className={styles.cardInfo}>
                        <p className={styles.productId}>Mã: {item.product_id}</p>
                        <div className={styles.accuracyBar}>
                          <div 
                            className={styles.accuracyFill} 
                            style={{ width: `${Math.round(item.score * 100)}%` }}
                          ></div>
                        </div>
                        <p className={styles.accuracyText}>Độ trùng khớp: {Math.round(item.score * 100)}%</p>
                        {item.notes && item.notes.length > 0 && (
                          <p className={styles.productNote}>{item.notes[0]}</p>
                        )}
                      </div>
                      <Link to={`/product/${item.product_id}`} className={styles.viewProductBtn}>
                        Xem sản phẩm
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal xem ảnh phóng to */}
      {enlargedImage && (
        <div className={styles.imageModal} onClick={() => setEnlargedImage(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button className={styles.closeModal} onClick={() => setEnlargedImage(null)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
            <img src={enlargedImage} alt="Enlarged view" className={styles.enlargedImage} />
          </div>
        </div>
      )}
    </div>
  );
}
