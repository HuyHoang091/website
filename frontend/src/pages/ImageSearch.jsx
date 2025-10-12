import React, { useState, useRef, useEffect } from "react";
import "../assets/styles/ImageSearch.css";

export default function ImageSearch() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

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

  useEffect(() => {
    document.addEventListener("paste", handlePaste);
    return () => document.removeEventListener("paste", handlePaste);
  }, []);

  return (
    <div className="page-container">
      <div className="loadingBackground">
          <div className="floatingShapes">
              <div className="shape shape1"></div>
              <div className="shape shape2"></div>
              <div className="shape shape3"></div>
              <div className="shape shape4"></div>
          </div>
      </div>
    <div className="search-container">
      <h1 className="title">🔍 Tìm kiếm sản phẩm bằng hình ảnh</h1>

      <div
        className={`dropzone ${isDragOver ? "drag-over" : ""}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {uploadedImage ? (
          <div className="preview">
            <img src={uploadedImage} alt="Uploaded" />
            <button onClick={handleClear}>❌ Xóa</button>
          </div>
        ) : (
          <div style={{ display: "flex" }}>
            <p className="hint">Kéo thả ảnh, dán (Ctrl+V) hoặc chọn file</p>
            <button
              className="upload-btn"
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

      {loading && <p className="loading">⏳ Đang tìm kiếm...</p>}

      {results.length > 0 && (
        <div className="results-row">
          {results.map((item, idx) => (
            <div key={idx} className="result-card">
              <img
                src={`${process.env.REACT_APP_API_URL}/images/logo192.png`}
                alt={`Product ${item.product_id}`}
              />
              <div className="card-info">
                <p className="pid">📦 Mã: {item.product_id}</p>
              </div>
              <div className="card-info">
                <p className="pid1">Độ chính xác: {item.score.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
