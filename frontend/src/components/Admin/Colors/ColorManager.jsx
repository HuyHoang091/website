import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPalette, faPlus, faPen, faTrash, faSave, faTimes, faSearch, faSortAlphaDown } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import './ColorManager.css';

const ColorManager = () => {
  const [colors, setColors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');
  
  // Get JWT token from localStorage
    const getAuthToken = () => {
        return localStorage.getItem('tokenJWT');
    };

    // Configure axios with auth header
    const getAuthConfig = () => ({
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });

  useEffect(() => {
    fetchColors();
  }, []);

  const fetchColors = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/colors/', getAuthConfig());
      setColors(response.data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách màu sắc');
      setLoading(false);
      console.error('Error fetching colors:', err);
    }
  };

  const handleSelectColor = (color) => {
    setSelectedColor(color);
    setFormData({
      name: color.name,
      code: color.code
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedColor(null);
    setFormData({
      name: '',
      code: '#000000'
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
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (isEditing) {
        // Update existing color
        await axios.put(`http://localhost:8080/api/colors/${selectedColor.name}`, formData, getAuthConfig());
        Swal.fire({
          icon: 'success',
          title: 'Cập nhật thành công!',
          text: `Màu sắc "${formData.name}" đã được cập nhật.`
        });
      } else {
        // Create new color
        await axios.post('http://localhost:8080/api/colors/', formData);
        Swal.fire({
          icon: 'success',
          title: 'Tạo mới thành công!',
          text: `Màu sắc "${formData.name}" đã được tạo.`
        });
      }
      
      // Refresh color list and reset form
      fetchColors();
      setShowForm(false);
      
    } catch (err) {
      console.error('Error saving color:', err);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể lưu màu sắc. Vui lòng thử lại.'
      });
    }
  };

  const handleDelete = async (color) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa màu "${color.name}"? Điều này có thể ảnh hưởng đến sản phẩm đang sử dụng màu này.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:8080/api/colors/${color.name}`, getAuthConfig());
        fetchColors();
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: `Màu sắc "${color.name}" đã được xóa thành công.`
        });
      } catch (err) {
        console.error('Error deleting color:', err);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không thể xóa màu sắc. Có thể màu đang được sử dụng bởi sản phẩm.'
        });
      }
    }
  };

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const filteredColors = colors.filter(color => 
    color.colorName.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => {
    if (sortOrder === 'asc') {
      return a.colorName.localeCompare(b.colorName);
    } else {
      return b.colorName.localeCompare(a.colorName);
    }
  });

  return (
    <div className="color-manager">
      <div className="manager-header">
        <h1>
          <FontAwesomeIcon icon={faPalette} /> Quản lý màu sắc
        </h1>
        <button onClick={handleAddNew} className="add-button">
          <FontAwesomeIcon icon={faPlus} /> Thêm màu sắc
        </button>
      </div>

      <div className="tools-container">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm màu sắc..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button onClick={handleSort} className="sort-button">
          <FontAwesomeIcon icon={faSortAlphaDown} /> Sắp xếp {sortOrder === 'asc' ? 'A-Z' : 'Z-A'}
        </button>
      </div>

      {loading ? (
        <div className="loading">Đang tải màu sắc...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="color-grid">
          {filteredColors.length === 0 ? (
            <div className="no-colors">
              Không tìm thấy màu sắc nào
            </div>
          ) : (
            filteredColors.map(color => (
              <div 
                key={color.name} 
                className={`color-card ${selectedColor?.name === color.name ? 'selected' : ''}`}
              >
                <div 
                  className="color-preview" 
                  style={{ backgroundColor: color.code }}
                  title={color.code}
                ></div>
                <div className="color-info">
                  <h3 className="color-name">{color.name}</h3>
                  <span className="color-code">{color.code}</span>
                </div>
                <div className="color-actions">
                  <button 
                    onClick={() => handleSelectColor(color)} 
                    className="edit-button"
                    title="Chỉnh sửa"
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button 
                    onClick={() => handleDelete(color)} 
                    className="delete-button"
                    title="Xóa"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {showForm && (
        <div className="form-overlay">
          <div className="color-form">
            <div className="form-header">
              <h2>{isEditing ? 'Chỉnh sửa màu sắc' : 'Thêm màu sắc mới'}</h2>
              <button onClick={handleCloseForm} className="close-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name">Tên màu:</label>
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
                  <label htmlFor="code">Mã màu:</label>
                  <div className="color-input-group">
                    <input
                      type="color"
                      id="code"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="color-picker"
                    />
                    <input
                      type="text"
                      name="code"
                      value={formData.code}
                      onChange={handleInputChange}
                      className="color-code-input"
                      required
                    />
                  </div>
                </div>
              </div>
              
              <div className="color-preview-large" style={{ backgroundColor: formData.code }}>
                <span className="preview-label">Xem trước</span>
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

export default ColorManager;