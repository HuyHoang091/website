import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import styles from "./CustomerInfo.module.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faTimes, faUser, faShoppingBag, faPhone, faEnvelope, 
  faMapMarkerAlt, faPlus, faCheckCircle, faTimesCircle,
  faSave, faBoxOpen, faSearch, faTimesCircle as faRemove
} from "@fortawesome/free-solid-svg-icons";

const CustomerInfo = ({ userId, userName, isInline = false }) => {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('info'); // 'info' or 'orders'
  const [orderStats, setOrderStats] = useState({ completed: 0, cancelled: 0 });
  
  // Trạng thái cho tìm kiếm sản phẩm
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [availableSizes, setAvailableSizes] = useState([]);
  const [availableColors, setAvailableColors] = useState([]);
  const searchTimeout = useRef(null);
  
  // Trạng thái cho form tạo đơn hàng mới
  const [newOrder, setNewOrder] = useState({
    productId: '',
    productName: '',
    quantity: 1,
    price: 0,
    size: '',
    color: '',
    note: '',
    imageUrl: ''
  });

  useEffect(() => {
    const fetchCustomerData = async () => {
      setLoading(true);
      try {
        // Fetch customer info
        const customerResponse = await axios.get(`http://localhost:8080/api/addresses/user/${userId}`);
        setCustomer(customerResponse.data[0]);
        
        // Fetch customer orders
        const ordersResponse = await axios.get(`http://localhost:8080/api/orders/user/${userId}`);
        setOrders(ordersResponse.data.reverse());
        
        // Tính toán số đơn hoàn thành và hủy
        const completedOrders = ordersResponse.data.filter(
          order => order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed'
        ).length;
        
        const cancelledOrders = ordersResponse.data.filter(
          order => order.status?.toLowerCase() === 'cancelled' || order.status?.toLowerCase() === 'returned'
        ).length;
        
        setOrderStats({
          completed: completedOrders,
          cancelled: cancelledOrders
        });
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching customer data:", err);
        setError("Không thể tải thông tin khách hàng. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };

    if (userId) {
      fetchCustomerData();
    }
  }, [userId]);

  // Xử lý tìm kiếm sản phẩm
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    if (searchTerm.trim().length >= 2) {
      setSearching(true);
      searchTimeout.current = setTimeout(async () => {
        try {
          const response = await axios.get(`http://localhost:8080/api/products/info`);
          // Lọc các sản phẩm có slug chứa từ khóa tìm kiếm
          const filteredResults = response.data.filter(product => 
            product.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
          ).slice(0, 5); // Giới hạn 5 kết quả
          
          setSearchResults(filteredResults);
          setSearching(false);
        } catch (error) {
          console.error("Error searching products:", error);
          setSearchResults([]);
          setSearching(false);
        }
      }, 500);
    } else {
      setSearchResults([]);
      setSearching(false);
    }
    
    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchTerm]);

  // Xử lý khi chọn sản phẩm từ kết quả tìm kiếm
  const handleSelectProduct = async (slug) => {
    try {
      setSearching(true);
      const response = await axios.get(`http://localhost:8080/api/products/slug/${slug}`);
      const product = response.data;
      
      setSelectedProduct(product);
      setAvailableSizes(product.size || []);
      setAvailableColors(product.color || []);
      
      // Cập nhật form
      setNewOrder({
        ...newOrder,
        productId: product.id,
        productName: product.name,
        price: product.price_now || product.price,
        size: product.size && product.size.length > 0 ? product.size[0] : '',
        color: product.color && product.color.length > 0 ? product.color[0].name : '',
        imageUrl: product.url && product.url.length > 0 ? product.url[0] : ''
      });
      
      setSearchTerm(''); // Xóa từ khóa tìm kiếm
      setSearchResults([]); // Xóa kết quả tìm kiếm
      setSearching(false);
    } catch (error) {
      console.error("Error fetching product details:", error);
      setSearching(false);
    }
  };

  // Xóa sản phẩm đã chọn
  const handleClearProduct = () => {
    setSelectedProduct(null);
    setAvailableSizes([]);
    setAvailableColors([]);
    setNewOrder({
      ...newOrder,
      productId: '',
      productName: '',
      price: 0,
      size: '',
      color: '',
      imageUrl: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return '#FFC107'; // vàng
      case 'processing': return '#3498DB'; // xanh dương
      case 'shipped': return '#2ECC71'; // xanh lá
      case 'delivered': return '#27AE60'; // xanh lá đậm
      case 'paid': return '#27AE60'; // xanh lá đậm
      case 'cancelled': return '#E74C3C'; // đỏ
      default: return '#95A5A6'; // xám
    }
  };

  // Thêm hàm helper để chuyển status sang tiếng Việt
  const getVietnameseStatus = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'Chờ xử lý';
      case 'processing': return 'Đang xử lý';
      case 'shipped': return 'Đã gửi';
      case 'delivered': return 'Đã giao';
      case 'paid': return 'Đã thanh toán';
      case 'cancelled': return 'Đã hủy';
      default: return 'Chưa xác định';
    }
  };

  // Thêm hàm kiểm tra đơn hàng mới (trong 24h)
  const isNewOrder = (dateString) => {
    if (!dateString) return false;
    const orderDate = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - orderDate);
    const diffHours = diffTime / (1000 * 60 * 60);
    return diffHours < 24;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND' 
    }).format(amount);
  };

  const handleNewOrderChange = (e) => {
    const { name, value } = e.target;
    setNewOrder({
      ...newOrder,
      [name]: value
    });
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    try {
      if (!newOrder.productId || !newOrder.size || !newOrder.color) {
        alert('Vui lòng chọn đầy đủ thông tin sản phẩm, kích thước và màu sắc');
        return;
      }
      
      // Tạo payload cho API
      const payload = {
        userId: userId,
        addressId: customer?.id,
        items: [
          {
            productId: newOrder.productId,
            productName: newOrder.productName,
            quantity: parseInt(newOrder.quantity),
            price: parseFloat(newOrder.price),
            size: newOrder.size,
            color: newOrder.color,
            imageUrl: newOrder.imageUrl
          }
        ],
        note: newOrder.note
      };

      // Gọi API tạo đơn hàng
      await axios.post('http://localhost:8080/api/orders/create', payload);
      
      // Reset form và tải lại đơn hàng
      setNewOrder({
        productId: '',
        productName: '',
        quantity: 1,
        price: 0,
        size: '',
        color: '',
        note: '',
        imageUrl: ''
      });
      setSelectedProduct(null);
      setAvailableSizes([]);
      setAvailableColors([]);
      
      // Tải lại danh sách đơn hàng
      const ordersResponse = await axios.get(`http://localhost:8080/api/orders/user/${userId}`);
      setOrders(ordersResponse.data);
      
      // Cập nhật thống kê
      const completedOrders = ordersResponse.data.filter(
        order => order.status?.toLowerCase() === 'delivered' || order.status?.toLowerCase() === 'completed'
      ).length;
      
      const cancelledOrders = ordersResponse.data.filter(
        order => order.status?.toLowerCase() === 'cancelled' || order.status?.toLowerCase() === 'returned'
      ).length;
      
      setOrderStats({
        completed: completedOrders,
        cancelled: cancelledOrders
      });
      
      alert('Đơn hàng đã được tạo thành công!');
    } catch (err) {
      console.error("Error creating order:", err);
      alert('Không thể tạo đơn hàng. Vui lòng thử lại sau.');
    }
  };

  const containerClass = isInline ? styles.inlineContainer : styles.modalContainer;

  if (loading) {
    return (
      <div className={containerClass}>
        <div className={styles.header}>
          <h3>Đang tải thông tin...</h3>
        </div>
        <div className={styles.loadingSpinner}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={containerClass}>
        <div className={styles.header}>
          <h3>Lỗi</h3>
        </div>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className={styles.header}>
        <h3>
          <FontAwesomeIcon icon={faUser} className={styles.headerIcon} />
          Khách hàng: {userName}
        </h3>
      </div>
      
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'info' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('info')}
        >
          Thông tin
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'orders' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          Đơn hàng ({orders.length})
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'newOrder' ? styles.activeTab : ''}`}
          onClick={() => setActiveTab('newOrder')}
        >
          <FontAwesomeIcon icon={faPlus} /> Tạo đơn
        </button>
      </div>

      <div className={styles.contentWrapper}>
        {activeTab === 'info' && customer && (
          <div className={styles.customerDetails}>
            <div className={styles.infoRow}>
              <FontAwesomeIcon icon={faUser} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Họ và tên:</span>
                <span className={styles.infoValue}>{customer.fullName || userName}</span>
              </div>
            </div>
            
            <div className={styles.infoRow}>
              <FontAwesomeIcon icon={faEnvelope} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Email:</span>
                <span className={styles.infoValue}>{customer.email || 'Chưa cập nhật'}</span>
              </div>
            </div>
            
            <div className={styles.infoRow}>
              <FontAwesomeIcon icon={faPhone} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Số điện thoại:</span>
                <span className={styles.infoValue}>{customer.phone || 'Chưa cập nhật'}</span>
              </div>
            </div>
            
            <div className={styles.infoRow}>
              <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Địa chỉ:</span>
                <span className={styles.infoValue}>{customer.detail || 'Chưa cập nhật'}</span>
              </div>
            </div>
            
            {/* <div className={styles.infoRow}>
              <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Quận/Huyện:</span>
                <span className={styles.infoValue}>{customer.district || 'Chưa cập nhật'}</span>
              </div>
            </div>
            
            <div className={styles.infoRow}>
              <FontAwesomeIcon icon={faMapMarkerAlt} className={styles.infoIcon} />
              <div>
                <span className={styles.infoLabel}>Thành phố:</span>
                <span className={styles.infoValue}>{customer.city || 'Chưa cập nhật'}</span>
              </div>
            </div> */}
            
            <div className={styles.infoRow}>
              <div className={styles.infoIcon}>🛍️</div>
              <div>
                <span className={styles.infoLabel}>Tổng đơn hàng:</span>
                <span className={styles.infoValue}>{orders.length}</span>
              </div>
            </div>
            
            <div className={styles.infoRow}>
              <div className={styles.infoIcon}>💰</div>
              <div>
                <span className={styles.infoLabel}>Tổng chi tiêu:</span>
                <span className={styles.infoValue}>
                  {formatCurrency(orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0))}
                </span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className={styles.ordersList}>
            {orders.length === 0 ? (
              <div className={styles.emptyState}>
                <FontAwesomeIcon icon={faShoppingBag} className={styles.emptyIcon} />
                <p>Khách hàng chưa có đơn hàng nào</p>
              </div>
            ) : (
              orders.map(order => (
                <div key={order.id} className={styles.orderItem}>
                  <div 
                    className={styles.orderHeader} 
                    style={{ backgroundColor: getStatusColor(order.status) }}
                  >
                    <div className={styles.orderCreator}>
                      {order.createBy || 'Hệ thống'}
                    </div>
                    
                    {isNewOrder(order.createdAt) && (
                      <div className={styles.newOrderBadge}>Mới</div>
                    )}
                  </div>
                  
                  <div className={styles.orderContent}>
                    <div className={styles.orderMeta}>
                      <div className={styles.orderNumber}>
                        #{order.orderNumber || order.id}
                        <span className={styles.orderDate}>
                          {formatDate(order.createdAt)}
                        </span>
                      </div>
                      <div className={styles.orderStatusBadge}>
                        {getVietnameseStatus(order.status)}
                      </div>
                    </div>
                    
                    <div className={styles.orderSummary}>
                      <div className={styles.orderDetail}>
                        <span className={styles.orderDetailLabel}>Khách hàng:</span>
                        <span>{order.address?.fullName || order.user?.fullName || 'Không có tên'}</span>
                      </div>
                      
                      <div className={styles.orderDetail}>
                        <span className={styles.orderDetailLabel}>Số điện thoại:</span>
                        <span>{order.address?.phone || order.user?.phone || 'N/A'}</span>
                      </div>
                      
                      <div className={styles.orderDetail}>
                        <span className={styles.orderDetailLabel}>Địa chỉ:</span>
                        <span>{order.address.district + ', ' + order.address.city || 'Không có'}</span>
                      </div>
                      
                      <div className={styles.orderDetail}>
                        <span className={styles.orderDetailLabel}>Tổng tiền:</span>
                        <span className={styles.orderAmount}>{formatCurrency(order.totalAmount)}</span>
                      </div>
                      
                      {order.note && (
                        <div className={styles.orderNote}>
                          <span className={styles.orderNoteLabel}>Ghi chú:</span>
                          <span>{order.note}</span>
                        </div>
                      )}
                    </div>
                    
                    {order.items && order.items.length > 0 && (
                      <div className={styles.orderProducts}>
                        <div className={styles.orderProductsHeader}>Sản phẩm đặt mua</div>
                        {order.items.map((item, index) => (
                          <div key={index} className={styles.orderProduct}>
                            <div className={styles.productImage}>
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.productName} />
                              ) : (
                                <div className={styles.noImage}>Không có hình</div>
                              )}
                            </div>
                            <div className={styles.productInfo}>
                              <div className={styles.productName}>{item.productName}</div>
                              <div className={styles.productVariant}>
                                {item.size && <span>Size: {item.size}</span>}
                                {item.color && <span>Màu: {item.color}</span>}
                              </div>
                              <div className={styles.productMeta}>
                                <span className={styles.productQuantity}>SL: {item.quantity}</span>
                                <span className={styles.productPrice}>{formatCurrency(item.price)}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
        
        {activeTab === 'newOrder' && (
          <div className={styles.createOrderForm}>
            <h4 className={styles.formTitle}>
              <FontAwesomeIcon icon={faPlus} /> Tạo đơn hàng mới
            </h4>
            
            <form onSubmit={handleCreateOrder}>
              {/* Khu vực tìm kiếm sản phẩm */}
              <div className={styles.formGroup}>
                <label>Tìm kiếm sản phẩm:</label>
                <div className={styles.searchContainer}>
                  <div className={styles.searchInputWrapper}>
                    <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault(); // Chặn hành động mặc định của phím Enter
                        }
                      }}
                      className={styles.searchInput}
                      placeholder="Tìm sản phẩm theo tên hoặc mã"
                      disabled={selectedProduct !== null}
                    />
                    {searching && <div className={styles.searchingSpinner}></div>}
                  </div>
                  
                  {searchResults.length > 0 && !selectedProduct && (
                    <div className={styles.searchResults}>
                      {searchResults.map(product => (
                        <div 
                          key={product.id}
                          className={styles.searchResultItem}
                          onClick={() => handleSelectProduct(product.slug)}
                        >
                          <div className={styles.resultImage}>
                            <img src={product.url} alt={product.name} />
                          </div>
                          <div className={styles.resultInfo}>
                            <div className={styles.resultName}>{product.name}</div>
                            <div className={styles.resultMeta}>
                              {formatCurrency(product.priceNow || product.price)} | 
                              {product.sizes?.join(", ")} | 
                              {product.colors?.map(c => c.name).join(", ")}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Hiển thị sản phẩm đã chọn */}
              {selectedProduct && (
                <div className={styles.selectedProduct}>
                  <div className={styles.selectedProductHeader}>
                    <h5>Sản phẩm đã chọn:</h5>
                    <button 
                      type="button" 
                      className={styles.clearButton}
                      onClick={handleClearProduct}
                    >
                      <FontAwesomeIcon icon={faRemove} /> Xóa
                    </button>
                  </div>
                  
                  <div className={styles.selectedProductContent}>
                    <div className={styles.selectedProductImage}>
                      {newOrder.imageUrl ? (
                        <img src={newOrder.imageUrl} alt={newOrder.productName} />
                      ) : (
                        <div className={styles.noImage}>Không có hình</div>
                      )}
                    </div>
                    <div className={styles.selectedProductInfo}>
                      <h4>{newOrder.productName}</h4>
                      <p>{selectedProduct.description}</p>
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Số lượng:</label>
                      <input
                        type="number"
                        name="quantity"
                        value={newOrder.quantity}
                        onChange={handleNewOrderChange}
                        required
                        min="1"
                        className={styles.formInput}
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Đơn giá:</label>
                      <input
                        type="number"
                        name="price"
                        value={newOrder.price}
                        onChange={handleNewOrderChange}
                        required
                        min="0"
                        className={styles.formInput}
                        placeholder="VNĐ"
                      />
                    </div>
                  </div>
                  
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Kích thước:</label>
                      <select
                        name="size"
                        value={newOrder.size}
                        onChange={handleNewOrderChange}
                        required
                        className={styles.formSelect}
                      >
                        <option value="">Chọn size</option>
                        {availableSizes.map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label>Màu sắc:</label>
                      <select
                        name="color"
                        value={newOrder.color}
                        onChange={handleNewOrderChange}
                        required
                        className={styles.formSelect}
                      >
                        <option value="">Chọn màu</option>
                        {availableColors.map(color => (
                          <option key={color.name} value={color.name} style={{backgroundColor: color.code}}>
                            {color.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Ghi chú:</label>
                    <textarea
                      name="note"
                      value={newOrder.note}
                      onChange={handleNewOrderChange}
                      className={styles.formTextarea}
                      placeholder="Ghi chú đơn hàng"
                      rows="3"
                    ></textarea>
                  </div>
                </div>
              )}
              
              {!selectedProduct && (
                <div className={styles.noProductSelected}>
                  <FontAwesomeIcon icon={faShoppingBag} className={styles.emptyIcon} />
                  <p>Vui lòng tìm kiếm và chọn sản phẩm</p>
                </div>
              )}
              
              {selectedProduct && (
                <>
                  <div className={styles.formGroup}>
                    <label>Địa chỉ giao hàng:</label>
                    <div className={styles.addressDisplay}>
                      <p><strong>{customer?.fullName}</strong> | {customer?.phone}</p>
                      <p>{customer?.detail}</p>
                      <p>{customer?.district}, {customer?.city}</p>
                    </div>
                  </div>
                  
                  <div className={styles.formActions}>
                    <button 
                      type="submit" 
                      className={styles.submitButton}
                      disabled={!selectedProduct || !newOrder.size || !newOrder.color}
                    >
                      <FontAwesomeIcon icon={faSave} /> Tạo đơn hàng
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        )}
      </div>
      
      {/* Thanh thống kê nổi ở dưới cùng */}
      <div className={styles.orderStatsBar}>
        <div className={styles.statsItem}>
          <FontAwesomeIcon icon={faCheckCircle} className={styles.statsIconSuccess} />
          <span>{orderStats.completed}</span>
        </div>
        <div className={styles.statsItem}>
          <FontAwesomeIcon icon={faTimesCircle} className={styles.statsIconCancelled} />
          <span>{orderStats.cancelled}</span>
        </div>
        <div className={styles.statsItem}>
          <FontAwesomeIcon icon={faBoxOpen} className={styles.statsIconTotal} />
          <span>{orders.length}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;