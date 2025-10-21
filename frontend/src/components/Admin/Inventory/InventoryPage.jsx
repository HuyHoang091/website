import { useState, useEffect } from 'react';
import InventoryControls from './InventoryControls';
import InventoryTable from './InventoryTable';
import InventoryStats from './InventoryStats';
import ProductModal from './ProductModal';
import Pagination from '../Users/Pagination';
import { getInventoryData, deleteProduct, deleteVariant } from './inventoryService';
import './Inventory.css';

const InventoryPage = () => {
    const [inventoryData, setInventoryData] = useState([]);
    const [filteredData, setFilteredData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        inStock: 0,
        lowStock: 0,
        outOfStock: 0
    });

    const [currentPage, setCurrentPage] = useState(1); // Trang hiện tại
        const [inventoryPerPage] = useState(10); // Số lượng đơn hàng trên mỗi trang
    
        const indexOfLastOrder = currentPage * inventoryPerPage; // Vị trí cuối cùng của đơn hàng trên trang hiện tại
        const indexOfFirstOrder = indexOfLastOrder - inventoryPerPage; // Vị trí đầu tiên của đơn hàng trên trang hiện tại
        const currentInventory = filteredData.slice(indexOfFirstOrder, indexOfLastOrder); // Đơn hàng trên trang hiện tại
        
        const paginate = (pageNumber) => setCurrentPage(pageNumber);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const data = await getInventoryData();
            setInventoryData(data);
            setFilteredData(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error loading inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        let inStock = 0;
        let lowStock = 0;
        let outOfStock = 0;

        data.forEach(item => {
            if (item.stock === 0) outOfStock++;
            else if (item.stock <= 5) lowStock++;
            else inStock++;
        });

        setStats({ total, inStock, lowStock, outOfStock });
    };

    const handleFilter = (searchTerm, categoryNames) => {
        let filtered = inventoryData;

        if (searchTerm) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
                item.color.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (categoryNames && categoryNames.length > 0) {
            filtered = filtered.filter(item => categoryNames.includes(item.category));
        }

        setFilteredData(filtered);
        // calculateStats(filtered);
    };

    const handleAddProduct = () => {
        setEditingProductId(null);
        setShowModal(true);
    };

    const handleEditProduct = (productId) => {
        setEditingProductId(productId);
        setShowModal(true);
    };

    const handleDeleteProduct = async (productId, productName) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${productName}" và tất cả biến thể?`)) {
            try {
                await deleteProduct(productId);
                alert('Sản phẩm đã được xóa thành công!');
                loadData();
            } catch (error) {
                console.error('Error deleting product:', error);
                alert('Không thể xóa sản phẩm. Vui lòng thử lại sau.');
            }
        }
    };

    const handleDeleteVariant = async (variantId, sku) => {
        if (window.confirm(`Bạn có chắc chắn muốn xóa biến thể ${sku}?`)) {
            try {
                await deleteVariant(variantId);
                loadData();
            } catch (error) {
                console.error('Error deleting variant:', error);
                alert('Không thể xóa biến thể. Vui lòng thử lại sau.');
            }
        }
    };

    const handleModalClose = () => {
        setShowModal(false);
        setEditingProductId(null);
    };

    const handleProductSaved = () => {
        setShowModal(false);
        setEditingProductId(null);
        loadData();
    };

    return (
        <div className="inventory-page">
            <div className="inventory-container">
                <div className="page-title">
                    <h2>Quản Lý Tồn Kho</h2>
                    <p>Quản lý sản phẩm quần áo trong kho</p>
                </div>

                <InventoryStats stats={stats} />
                
                <InventoryControls
                    categories={categories}
                    onFilter={handleFilter}
                    onAddProduct={handleAddProduct}
                />

                <InventoryTable
                    data={currentInventory}
                    loading={loading}
                    onEdit={handleEditProduct}
                    onDeleteProduct={handleDeleteProduct}
                    onDeleteVariant={handleDeleteVariant}
                />

                <Pagination
                    usersPerPage={inventoryPerPage}
                    totalUsers={filteredData.length}
                    paginate={paginate}
                    currentPage={currentPage}
                />
            </div>

            {showModal && (
                <ProductModal
                    productId={editingProductId}
                    onClose={handleModalClose}
                    onSave={handleProductSaved}
                />
            )}
        </div>
    );
};

export default InventoryPage;