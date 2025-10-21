import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTags, faPlus, faPen, faTrash, faSave, faTimes, faSearch } from '@fortawesome/free-solid-svg-icons';
import axios from 'axios';
import Swal from 'sweetalert2';
import './BrandManager.css';

const BrandManager = () => {
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBrand, setSelectedBrand] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logoUrl: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    fetchBrands();
  }, []);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8080/api/brands/');
      setBrands(response.data);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách thương hiệu');
      setLoading(false);
      console.error('Error fetching brands:', err);
    }
  };

  const handleSelectBrand = (brand) => {
    setSelectedBrand(brand);
    setFormData({
      name: brand.name,
      description: brand.description || '',
      logoUrl: brand.logoUrl || ''
    });
    setIsEditing(true);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setSelectedBrand(null);
    setFormData({
      name: '',
      description: '',
      logoUrl: ''
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
        // Update existing brand
        await axios.put(`http://localhost:8080/api/brands/${selectedBrand.id}/update`, formData);
        Swal.fire({
          icon: 'success',
          title: 'Cập nhật thành công!',
          text: `Thương hiệu "${formData.name}" đã được cập nhật.`
        });
      } else {
        // Create new brand
        await axios.post('http://localhost:8080/api/brands/create', formData);
        Swal.fire({
          icon: 'success',
          title: 'Tạo mới thành công!',
          text: `Thương hiệu "${formData.name}" đã được tạo.`
        });
      }
      
      // Refresh brand list and reset form
      fetchBrands();
      setShowForm(false);
      
    } catch (err) {
      console.error('Error saving brand:', err);
      Swal.fire({
        icon: 'error',
        title: 'Lỗi!',
        text: 'Không thể lưu thương hiệu. Vui lòng thử lại.'
      });
    }
  };

  const handleDelete = async (brand) => {
    const result = await Swal.fire({
      title: 'Xác nhận xóa',
      text: `Bạn có chắc chắn muốn xóa thương hiệu "${brand.name}"? Điều này có thể ảnh hưởng đến sản phẩm đang sử dụng thương hiệu này.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Xóa',
      cancelButtonText: 'Hủy'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:8080/api/brands/${brand.id}/delete`);
        fetchBrands();
        Swal.fire({
          icon: 'success',
          title: 'Đã xóa!',
          text: `Thương hiệu "${brand.name}" đã được xóa thành công.`
        });
      } catch (err) {
        console.error('Error deleting brand:', err);
        Swal.fire({
          icon: 'error',
          title: 'Lỗi!',
          text: 'Không thể xóa thương hiệu. Có thể thương hiệu đang được sử dụng bởi sản phẩm.'
        });
      }
    }
  };

  const filteredBrands = brands.filter(brand => 
    brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (brand.description && brand.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="brand-manager">
      <div className="manager-header">
        <h1>
          <FontAwesomeIcon icon={faTags} /> Quản lý thương hiệu
        </h1>
        <button onClick={handleAddNew} className="add-button">
          <FontAwesomeIcon icon={faPlus} /> Thêm thương hiệu
        </button>
      </div>

      <div className="search-container">
        <div className="search-input-wrapper">
          <FontAwesomeIcon icon={faSearch} className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm thương hiệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loading">Đang tải thương hiệu...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : (
        <div className="brand-grid">
          {filteredBrands.length === 0 ? (
            <div className="no-brands">
              Không tìm thấy thương hiệu nào
            </div>
          ) : (
            filteredBrands.map(brand => (
              <div 
                key={brand.id} 
                className={`brand-card ${selectedBrand?.id === brand.id ? 'selected' : ''}`}
              >
                <div className="brand-logo">
                  {brand.logoUrl ? (
                    <img src={brand.logoUrl} alt={brand.name} />
                  ) : (
                    <div className="brand-logo-placeholder">{brand.name.charAt(0)}</div>
                  )}
                </div>
                <div className="brand-info">
                  <h3 className="brand-name">{brand.name}</h3>
                  {brand.description && (
                    <p className="brand-description">{brand.description}</p>
                  )}
                </div>
                <div className="brand-actions">
                  <button 
                    onClick={() => handleSelectBrand(brand)} 
                    className="edit-button"
                    title="Chỉnh sửa"
                  >
                    <FontAwesomeIcon icon={faPen} />
                  </button>
                  <button 
                    onClick={() => handleDelete(brand)} 
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
          <div className="brand-form">
            <div className="form-header">
              <h2>{isEditing ? 'Chỉnh sửa thương hiệu' : 'Thêm thương hiệu mới'}</h2>
              <button onClick={handleCloseForm} className="close-button">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="name">Tên thương hiệu:</label>
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
                <label htmlFor="description">Mô tả:</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows="3"
                />
              </div>

              <div className="form-group">
                <label htmlFor="logoUrl">URL Logo:</label>
                <input
                  type="text"
                  id="logoUrl"
                  name="logoUrl"
                  value={formData.logoUrl}
                  onChange={handleInputChange}
                  placeholder="https://example.com/logo.png"
                />
              </div>
              
              {formData.logoUrl && (
                <div className="logo-preview">
                  <img 
                    src={formData.logoUrl} 
                    alt="Logo Preview" 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://via.placeholder.com/150?text=Invalid+URL";
                    }}
                  />
                </div>
              )}
              
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

export default BrandManager;