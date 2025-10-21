import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./PromotionManager.module.css";
import useToast from "../hooks/useToast"; 
import Toast from "../components/Toast/Toast";

function PromotionManager() {
  const [promotions, setPromotions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    categoriesId: null,
    description: "",
    discountPercent: "",
    startDate: "",
    endDate: "",
    status: "active",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState({});
  const { toasts, showToast, removeToast } = useToast();

  // Fetch all discounts and categories when component mounts
  useEffect(() => {
    fetchDiscounts();
    fetchCategories();
  }, []);

  // Fetch all discounts
  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/discounts/');
      setPromotions(response.data);
    } catch (err) {
      showToast("Không thể tải danh sách khuyến mãi.", "error");
      console.error("Error fetching discounts:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/categorys/');
      setCategories(response.data);
      
      // Auto-expand first level categories
      const expanded = {};
      response.data
        .filter(cat => cat.parentId === null)
        .forEach(cat => {
          expanded[cat.id] = true;
        });
      setExpandedCategories(expanded);
      
    } catch (err) {
      showToast("Không thể tải danh sách danh mục.", "error");
      console.error("Error fetching categories:", err);
    }
  };

  // Reset form data
  const resetForm = () => {
    setFormData({
      name: "",
      categoriesId: null,
      description: "",
      discountPercent: "",
      startDate: "",
      endDate: "",
      status: "active",
    });
    setEditingPromotion(null);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle category selection
  const handleCategoryChange = (categoryId) => {
    setFormData((prev) => ({
      ...prev,
      categoriesId: categoryId,
    }));
  };

  // Cải thiện hàm formatDateForBackend để đảm bảo định dạng chuẩn
  const formatDateForBackend = (dateTimeString) => {
    if (!dateTimeString) return null;
    
    // Đảm bảo định dạng yyyy-MM-dd HH:mm:ss
    try {
      const date = new Date(dateTimeString);
      
      // Kiểm tra xem date có hợp lệ không
      if (isNaN(date.getTime())) {
        return null;
      }
      
      // Format date theo định dạng yyyy-MM-dd HH:mm:ss
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = '00';
      
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    } catch (e) {
      console.error("Date formatting error:", e);
      return null;
    }
  };

  // Toggle category expansion
  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  // Submit form to create or update discount
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.categoriesId) {
      showToast("Vui lòng chọn danh mục!", "error");
      return;
    }

    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);
      
      if (startDate > endDate) {
        showToast("Thời gian bắt đầu không được lớn hơn thời gian kết thúc!", "error");
        return;
      }
    }
    
    try {
      setLoading(true);
      
      // Prepare data for API - đảm bảo đúng định dạng
      const discountData = {
        name: formData.name.trim(),
        categoriesId: parseInt(formData.categoriesId), // Chuyển đổi thành số nguyên
        description: formData.description ? formData.description.trim() : "",
        discountPercent: parseFloat(formData.discountPercent) / 100,
        startDate: formatDateForBackend(formData.startDate),
        endDate: formatDateForBackend(formData.endDate),
        status: formData.status,
      };
      
      // Log dữ liệu trước khi gửi để kiểm tra
      console.log("Sending discount data:", discountData);
      
      let response;
      if (editingPromotion) {
        // Update existing discount
        response = await axios.put(
          `http://localhost:8080/api/discounts/${editingPromotion.discountId}`, 
          discountData
        );
      } else {
        // Create new discount
        response = await axios.post('http://localhost:8080/api/discounts/', discountData);
      }
      
      console.log("API response:", response.data);

      showToast(editingPromotion ? "Cập nhật khuyến mãi thành công!" : "Thêm khuyến mãi thành công!");
      
      // Refresh discount list
      fetchDiscounts();
      // Reset form
      resetForm();
      
    } catch (err) {
      console.error("Error saving discount:", err);
      
      // Hiển thị thông báo lỗi chi tiết từ API (nếu có)
      const errorMessage = err.response?.data?.message || 
                          err.response?.data?.error || 
                          (editingPromotion ? 
                            "Lỗi khi cập nhật khuyến mãi." : 
                            "Lỗi khi thêm khuyến mãi mới.");
      
      showToast(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Set up form data for editing
  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    
    // Format date and time for datetime-local input
    const formatDateTimeForInput = (dateString) => {
      if (!dateString) return "";
      
      try {
        // Chuyển đổi chuỗi ngày tháng thành đối tượng Date
        const date = new Date(dateString);
        
        // Đảm bảo date hợp lệ
        if (isNaN(date.getTime())) {
          console.error("Invalid date:", dateString);
          return "";
        }
        
        // Lấy các thành phần ngày tháng theo giờ địa phương
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        
        // Định dạng theo chuẩn YYYY-MM-DDThh:mm cho input datetime-local
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      } catch (e) {
        console.error("Error formatting date:", e);
        return "";
      }
    };
    
    setFormData({
      name: promotion.name,
      categoriesId: promotion.categoriesId,
      description: promotion.description || "",
      discountPercent: (promotion.discountPercent * 100).toString(),
      startDate: formatDateTimeForInput(promotion.startDate),
      endDate: formatDateTimeForInput(promotion.endDate),
      status: promotion.status,
    });
  };

  // Delete a discount
  const handleDelete = async (promotionId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa khuyến mãi này?")) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:8080/api/discounts/${promotionId}`);
        fetchDiscounts();
        showToast("Xóa khuyến mãi thành công!");
      } catch (err) {
        showToast("Không thể xóa khuyến mãi.", "error");
        console.error("Error deleting discount:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Build category tree structure
  const buildCategoryTree = (categories, parentId = null) => {
    return categories
      .filter(category => category.parentId === parentId)
      .map(category => ({
        ...category,
        children: buildCategoryTree(categories, category.id)
      }));
  };

  // Recursive component to render category tree
  const CategoryTreeItem = ({ category, level = 0 }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories[category.id];

    return (
      <div className={styles["category-tree-item"]}>
        <div 
          className={`${styles["category-item"]} ${formData.categoriesId === category.id ? styles["category-selected"] : ""}`} 
          style={{ paddingLeft: `${level * 20}px` }}
        >
          {hasChildren && (
            <button 
              type="button"
              className={`${styles["toggle-btn"]} ${isExpanded ? styles["expanded"] : ""}`}
              onClick={() => toggleCategory(category.id)}
            >
              {isExpanded ? "▼" : "▶"}
            </button>
          )}
          
          <div className={styles["category-radio"]}>
            <input
              type="radio"
              id={`cat-${category.id}`}
              name="categoryRadio"
              checked={formData.categoriesId === category.id}
              onChange={() => handleCategoryChange(category.id)}
            />
            <label htmlFor={`cat-${category.id}`}>{category.name}</label>
          </div>
        </div>
        
        {hasChildren && isExpanded && (
          <div className={styles["category-children"]}>
            {category.children.map(child => (
              <CategoryTreeItem key={child.id} category={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    if (!categoryId) return "Không có";
    
    const findCategoryName = (cats) => {
      for (const cat of cats) {
        if (cat.id === categoryId) {
          return cat.name;
        }
      }
      return "Không tìm thấy";
    };
    
    return findCategoryName(categories);
  };

  // Get full category path
  const getCategoryPath = (categoryId) => {
    if (!categoryId) return "";
    
    const findCategoryWithParents = (id) => {
      const category = categories.find(cat => cat.id === id);
      if (!category) return [];
      
      if (category.parentId) {
        return [...findCategoryWithParents(category.parentId), category.name];
      }
      
      return [category.name];
    };
    
    return findCategoryWithParents(categoryId).join(" > ");
  };

  // Format date and time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return "—";
    
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Prepare category tree
  const categoryTree = buildCategoryTree(categories);

  return (
    <div className={styles.promotionManager}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>👕 Quản Lý Khuyến Mãi Shop Quần Áo 👖</h1>
          <p>Hệ thống quản lý khuyến mãi hiện đại và chuyên nghiệp</p>
        </div>

        <Toast toasts={toasts} removeToast={removeToast} />

        <div className={styles["main-content"]}>
          <div className={styles["form-section"]}>
            <h2 className={styles["section-title"]}>
              {editingPromotion ? "✏️ Sửa Khuyến Mãi" : "➕ Thêm Khuyến Mãi"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className={styles["form-group"]}>
                <label>Tên khuyến mãi *</label>
                <input
                  type="text"
                  name="name"
                  className={styles["form-control"]}
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="VD: Sale cuối tuần 50%"
                  required
                />
              </div>

              <div className={styles["form-group"]}>
                <label>Danh mục áp dụng *</label>
                <div className={styles["category-tree-container"]}>
                  {categories.length === 0 ? (
                    <p className={styles["loading-text"]}>Đang tải danh mục...</p>
                  ) : (
                    categoryTree.map(category => (
                      <CategoryTreeItem key={category.id} category={category} />
                    ))
                  )}
                </div>
                {formData.categoriesId && (
                  <div className={styles["selected-category"]}>
                    <span>Đã chọn: </span>
                    <strong>{getCategoryPath(formData.categoriesId)}</strong>
                  </div>
                )}
              </div>

              <div className={styles["form-group"]}>
                <label>Mô tả</label>
                <textarea
                  name="description"
                  className={styles["form-control"]}
                  rows="2"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Mô tả ngắn gọn về khuyến mãi..."
                />
              </div>

              <div className={styles["form-group"]}>
                <label>% Giảm giá *</label>
                <input
                  type="number"
                  name="discountPercent"
                  className={styles["form-control"]}
                  value={formData.discountPercent}
                  onChange={handleInputChange}
                  placeholder="VD: 20"
                  min="0"
                  max="100"
                  required
                />
              </div>

              <div>
                <div className={styles["form-group"]}>
                  <label>Thời gian bắt đầu *</label>
                  <input
                    type="datetime-local"
                    name="startDate"
                    className={styles["form-control"]}
                    value={formData.startDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div className={styles["form-group"]}>
                  <label>Thời gian kết thúc *</label>
                  <input
                    type="datetime-local"
                    name="endDate"
                    className={styles["form-control"]}
                    value={formData.endDate}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className={styles["form-group"]}>
                <label>Trạng thái</label>
                <select
                  name="status"
                  className={styles["form-control"]}
                  value={formData.status}
                  onChange={handleInputChange}
                >
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Tạm dừng</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button 
                  type="submit" 
                  className={styles["btn"] + " " + styles["btn-primary"]}
                  disabled={loading}
                >
                  {loading ? "Đang xử lý..." : (editingPromotion ? "💾 Cập nhật" : "➕ Thêm mới")}
                </button>
                {editingPromotion && (
                  <button
                    type="button"
                    className={styles["btn"] + " " + styles["btn-success"]}
                    onClick={resetForm}
                    disabled={loading}
                  >
                    ❌ Hủy
                  </button>
                )}
              </div>
            </form>
          </div>

          <div className={styles["list-section"]}>
            <h2 className={styles["section-title"]}>📋 Danh Sách Khuyến Mãi</h2>

            {loading && <div className={styles["loading"]}>Đang tải...</div>}

            {!loading && promotions.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
                <h3>🎯 Chưa có khuyến mãi nào</h3>
                <p>Hãy thêm khuyến mãi đầu tiên của bạn!</p>
              </div>
            ) : (
              <div className={styles["promotion-list"]}>
                {promotions.map((promotion) => (
                  <div key={promotion.discountId} className={styles["promotion-card"]}>
                    <div className={styles["card-header"]}>
                      <h3 className={styles["promotion-title"]}>{promotion.name}</h3>
                      <div className={styles["discount-badge"]}>
                        {Math.round(promotion.discountPercent * 100)}% OFF
                      </div>
                    </div>

                    <div className={styles["card-content"]}>
                      <div className={styles["card-info-item"]}>
                        <span className={styles["card-info-label"]}>📂 Danh mục:</span>
                        <div className={styles["card-categories"]}>
                          <span className={styles["card-category-tag"]}>
                            {getCategoryPath(promotion.categoriesId)}
                          </span>
                        </div>
                      </div>

                      <div className={styles["card-info-item"]}>
                        <span className={styles["card-info-label"]}>📅 Thời gian:</span>
                        <div className={styles["card-date-range"]}>
                          <div className={styles["date-from"]}>
                            <span className={styles["date-label"]}>Từ:</span> 
                            {formatDateTime(promotion.startDate)}
                          </div>
                          <div className={styles["date-to"]}>
                            <span className={styles["date-label"]}>Đến:</span> 
                            {formatDateTime(promotion.endDate)}
                          </div>
                        </div>
                      </div>

                      <div className={styles["card-info-item"]}>
                        <span className={styles["card-info-label"]}>🔄 Trạng thái:</span>
                        <span
                          className={
                            styles["card-status"] +
                            " " +
                            (promotion.status === "active"
                              ? styles["card-status-active"]
                              : styles["card-status-inactive"])
                          }
                        >
                          {promotion.status === "active"
                            ? "✅ Hoạt động"
                            : "❌ Tạm dừng"}
                        </span>
                      </div>

                      {promotion.description && (
                        <div className={styles["card-description"]}>
                          💬 {promotion.description}
                        </div>
                      )}

                      <div className={styles["card-actions"]}>
                        <button
                          className={styles["card-btn"] + " " + styles["card-btn-edit"]}
                          onClick={() => handleEdit(promotion)}
                        >
                          ✏️ Sửa
                        </button>
                        <button
                          className={styles["card-btn"] + " " + styles["card-btn-delete"]}
                          onClick={() => handleDelete(promotion.discountId)}
                        >
                          🗑️ Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromotionManager;