import { useState } from 'react';
import { uploadImage } from './inventoryService';

const VariantList = ({ variants, onChange, colors = [], onAddColor, onEditColor, onDeleteColor, showColorManagement, setShowColorManagement }) => {
    const [uploading, setUploading] = useState({});

    const handleVariantChange = (index, field, value) => {
        const updated = [...variants];
        updated[index] = { ...updated[index], [field]: value };
        onChange(updated);
    };

    const handleAddVariant = () => {
        onChange([...variants, { size: '', color: '', stock: '', url: '' }]);
    };

    const handleRemoveVariant = (index) => {
        if (variants.length === 1) {
            // Nếu chỉ còn 1 variant, reset thông tin thay vì xóa
            onChange([{ size: '', color: '', stock: '', url: '' }]);
        } else {
            onChange(variants.filter((_, i) => i !== index));
        }
    };

    const handleVariantImageUpload = async (index, file) => {
        if (!file) return;

        try {
            setUploading(prev => ({ ...prev, [index]: true }));
            const imageUrl = await uploadImage(file);
            handleVariantChange(index, 'url', imageUrl);
        } catch (error) {
            console.error('Error uploading variant image:', error);
            alert('Không thể tải ảnh lên');
        } finally {
            setUploading(prev => ({ ...prev, [index]: false }));
        }
    };

    // Tìm thông tin màu từ danh sách colors
    const getColorInfo = (colorString) => {
        if (!colorString) return null;
        
        // Kiểm tra xem có đang sử dụng định dạng "Tên màu, #mã_màu" không
        if (colorString.includes(',')) {
            const [colorName] = colorString.split(',');
            const colorInfo = colors.find(color => color.colorName === colorName.trim());
            if (colorInfo) return colorInfo;
            
            // Nếu không tìm thấy trong danh sách, trích xuất mã màu từ chuỗi
            const colorHex = colorString.split(',')[1].trim();
            return { colorName: colorName.trim(), colorHex };
        } 
        
        // Nếu chỉ có tên màu, tìm trong danh sách colors
        return colors.find(color => color.colorName === colorString) || null;
    };

    // Lấy mã màu từ chuỗi màu
    const getColorHex = (colorString) => {
        if (!colorString) return '';
        
        if (colorString.includes(',')) {
            const parts = colorString.split(',');
            if (parts.length > 1) {
                return parts[1].trim();
            }
        }
        
        const colorInfo = colors.find(color => color.colorName === colorString);
        return colorInfo ? colorInfo.colorHex : '';
    };

    // Lấy tên màu từ chuỗi màu
    const getColorName = (colorString) => {
        if (!colorString) return '';
        
        if (colorString.includes(',')) {
            return colorString.split(',')[0].trim();
        }
        
        return colorString;
    };

    return (
        <div className="variants-section">
            <div className="variants-header">
                <h4>Biến thể sản phẩm</h4>
                <button
                    type="button"
                    className="btn btn-success btn-small"
                    onClick={handleAddVariant}
                >
                    <i className="fas fa-plus"></i> Thêm biến thể
                </button>
            </div>

            <div className="variants-list">
                <div className="variant-labels">
                    <div>Size</div>
                    <div>
                        <div className="attribute-header">
                            <span>Màu sắc</span>
                            <div className="attribute-actions">
                                <button 
                                    type="button" 
                                    className="btn-icon btn-manage"
                                    onClick={() => setShowColorManagement(!showColorManagement)}
                                    title={showColorManagement ? "Ẩn quản lý màu" : "Hiện quản lý màu"}
                                >
                                    <i className={`fas fa-${showColorManagement ? 'eye-slash' : 'eye'}`}></i>
                                </button>
                                <button 
                                    type="button" 
                                    className="btn-icon btn-add"
                                    onClick={onAddColor}
                                    title="Thêm màu mới"
                                >
                                    <i className="fas fa-plus"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                    <div>Số lượng</div>
                    <div>Ảnh biến thể</div>
                    <div></div>
                </div>
                
                {variants.map((variant, index) => {
                    const colorInfo = getColorInfo(variant.color);
                    const colorHex = getColorHex(variant.color);
                    const colorName = getColorName(variant.color);
                    
                    return (
                        <div key={index} className="variant-item">
                            <div className="variant-grid">
                                <div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        value={variant.size || ''}
                                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                                        placeholder="Size"
                                        required
                                    />
                                </div>

                                <div className="color-select-container">
                                    <div className="input-with-button">
                                        <select
                                            className="form-input color-select"
                                            value={variant.color || ''}
                                            onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                                            required
                                        >
                                            <option value="">Chọn màu</option>
                                            {colors.map(color => (
                                                <option 
                                                    key={color.id} 
                                                    value={`${color.colorName}, ${color.colorHex}`}
                                                >
                                                    {color.colorName}
                                                </option>
                                            ))}
                                        </select>
                                        <button 
                                            type="button" 
                                            className="add-new-btn"
                                            onClick={onAddColor}
                                            title="Thêm màu mới"
                                        >
                                            <i className="fas fa-plus"></i>
                                        </button>
                                        
                                        {colorInfo && (
                                            <span 
                                                className="color-preview-dot"
                                                style={{backgroundColor: colorInfo.colorHex || colorHex}}
                                                title={colorInfo.colorName || colorName}
                                            ></span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <input
                                        type="number"
                                        className="form-input"
                                        value={variant.stock || ''}
                                        onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                                        placeholder="Số lượng"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div className="variant-image-group">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        id={`variant-upload-${index}`}
                                        onChange={(e) => {
                                            if (e.target.files[0]) {
                                                handleVariantImageUpload(index, e.target.files[0]);
                                            }
                                        }}
                                    />
                                    <div className="variant-preview-container">
                                        <button
                                            type="button"
                                            className="btn-upload-variant"
                                            onClick={() => document.getElementById(`variant-upload-${index}`).click()}
                                            disabled={uploading[index]}
                                        >
                                            {uploading[index] ? 
                                                <i className="fas fa-spinner fa-spin"></i> : 
                                                variant.url ? 
                                                    <i className="fas fa-edit"></i> : 
                                                    <i className="fas fa-upload"></i>
                                            }
                                        </button>
                                        <div className="variant-preview">
                                            {variant.url ? (
                                                <img src={variant.url} alt="Variant" />
                                            ) : (
                                                <span>Chưa có ảnh</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        className="btn-delete-variant"
                                        onClick={() => handleRemoveVariant(index)}
                                    >
                                        <i className="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Color Management Section */}
            {showColorManagement && (
                <div className="attribute-management mt-3">
                    <div className="attribute-management-header">
                        <h4>Quản lý màu sắc</h4>
                    </div>
                    <div className="attribute-list">
                        <div className="attribute-list-header">
                            <span>Tên màu</span>
                            <span>Mã màu</span>
                            <span>Xem trước</span>
                            <span>Thao tác</span>
                        </div>
                        <div className="attribute-list-content">
                            {colors.length === 0 ? (
                                <div className="attribute-empty">Chưa có màu nào</div>
                            ) : (
                                colors.map(color => (
                                    <div key={color.id} className="attribute-item">
                                        <span className="attribute-name">{color.colorName}</span>
                                        <span className="attribute-value">{color.colorHex}</span>
                                        <span className="color-preview">
                                            <span 
                                                className="color-swatch"
                                                style={{backgroundColor: color.colorHex}}
                                            ></span>
                                        </span>
                                        <div className="attribute-item-actions">
                                            <button 
                                                type="button" 
                                                className="btn-icon btn-sm btn-edit"
                                                onClick={() => onEditColor(color)}
                                            >
                                                <i className="fas fa-edit"></i>
                                            </button>
                                            <button 
                                                type="button" 
                                                className="btn-icon btn-sm btn-delete"
                                                onClick={() => onDeleteColor(color.colorName)}
                                            >
                                                <i className="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VariantList;