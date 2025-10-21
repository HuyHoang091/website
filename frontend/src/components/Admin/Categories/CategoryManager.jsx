import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFolder, faFolderPlus, faPen, faTrash, faSave, faTimes, faLayerGroup } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import './CategoryManager.css';

const CategoryManager = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    parentId: null
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/categorys/');
      setCategories(response.data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách danh mục');
      setLoading(false);
      console.error('Error fetching categories:', err);
    }
  };

  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setFormData({
      name: category.name,
      parentId: category.parentId
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedCategory(null);
    setFormData({
      name: '',
      parentId: null
    });
    setIsEditing(false);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'parentId' ? (value ? parseInt(value) : null) : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        // Update existing category
        await axios.put(`http://localhost:8080/api/categorys/${selectedCategory.id}/update`, formData);
        Swal.fire({
          icon: 'success',
          title: 'Cập nhật thành công!',
          text: `Danh mục "${formData.name}" đã được cập nhật.`
        });
      } else {
        // Create new category
        await axios.post('http://localhost:8080/api/categorys/create', formData);
        Swal.fire({
          icon: 'success',
          title: 'Tạo mới thành công!',
          text: `Danh mục "${formData.name}" đã được tạo.`
        });
      }
      
      // Refresh category list and reset form
      fetchCategories();
      setShowForm(false);
      
    } catch (err) {
      console.error('Error saving category:', err);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể lưu danh mục. Vui lòng thử lại.'
      });
    }
  };

  const handleDelete = async (category) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa danh mục "${category.name}"? Điều này có thể ảnh hưởng đến sản phẩm đang sử dụng danh mục này.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:8080/api/categorys/${category.id}/delete`);
        fetchCategories();
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: `Danh mục "${category.name}" đã được xóa thành công.`
        });
      } catch (err) {
        console.error('Error deleting category:', err);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không thể xóa danh mục. Có thể danh mục đang được sử dụng bởi sản phẩm hoặc có danh mục con.'
        });
      }
    }
  };

  const buildCategoryTree = (categories, parentId = null) => {
    return categories
      .filter(category => category.parentId === parentId)
      .map(category => ({
        ...category,
        children: buildCategoryTree(categories, category.id)
      }));
  };

  const renderCategoryTree = (categoryTree, level = 0) => {
    return categoryTree.map(category => (
      <React.Fragment key={category.id}>
        <tr className={selectedCategory?.id === category.id ? 'selected-row' : ''}>
          <td style={{ paddingLeft: `${level * 20 + 10}px` }} className="category-name">
            <FontAwesomeIcon icon={faFolder} className="category-icon" />
            {category.name}
          </td>
          <td>{category.id}</td>
          <td>
            {category.parentId ? categories.find(cat => cat.id === category.parentId)?.name : 'Không có'}
          </td>
          <td>{new Date(category.createdAt).toLocaleString('vi-VN')}</td>
          <td className="action-buttons">
            <button onClick={() => handleSelectCategory(category)} className="edit-button">
              <FontAwesomeIcon icon={faPen} />
            </button>
            <button onClick={() => handleDelete(category)} className="delete-button">
              <FontAwesomeIcon icon={faTrash} />
            </button>
          </td>
        </tr>
        {category.children && renderCategoryTree(category.children, level + 1)}
      </React.Fragment>
    ));
  };

  // Build category tree for better display
  const categoryTree = buildCategoryTree(categories);

  return (
    <div className="category-manager">
      <div className="manager-header">
        <h1>
          <FontAwesomeIcon icon={faLayerGroup} /> Quản lý danh mục
        </h1>
        <button onClick={handleAddNew} className="add-button">
          <FontAwesomeIcon icon={faFolderPlus} /> Thêm danh mục
        </button>
      </div>

      {loading ? (
        <div className="loading">Đang tải danh mục...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="category-table-container">
          <table className="category-table">
            <thead>
              <tr>
                <th>Tên danh mục</th>
                <th>ID</th>
                <th>Danh mục cha</th>
                <th>Ngày tạo</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {renderCategoryTree(categoryTree)}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <div className="category-form">
            <div className="form-header">
              <h2>{isEditing ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2>
              <button onClick={handleCloseForm} className="close-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Tên danh mục:</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="parentId">Danh mục cha:</label>
                <select
                  id="parentId"
                  name="parentId"
                  value={formData.parentId || ''}
                  onChange={handleInputChange}
                >
                  <option value="">Không có (Danh mục gốc)</option>
                  {categories.map(category => (
                    // Prevent category from being its own parent
                    (isEditing && category.id !== selectedCategory.id) || !isEditing ? (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ) : null
                  ))}
                </select>
              </div>
              
              <div className="form-actions">
                <button type="submit" className="save-button">
                  <FontAwesomeIcon icon={faSave} /> {isEditing ? 'Cập nhật' : 'Tạo mới'}
                </button>
                <button type="button" onClick={handleCloseForm} className="cancel-button">
                  <FontAwesomeIcon icon={faTimes} /> Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryManager;