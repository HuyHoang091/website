import { useState } from 'react';
import CartHeader from './CartHeader';
import SelectAllBox from './SelectAllBox';
import CartItemCard from './CartItemCard';
import CartSummary from './CartSummary';
import EmptyCart from './EmptyCart';
import { ShoppingCartIcon } from './Icons';
import '../../assets/styles/components/ShoppingCart/ShoppingCart.css';
import { useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const initialCartData = [];

const ShoppingCart = () => {
    const [cartItems, setCartItems] = useState(initialCartData);
    const [selectedItems, setSelectedItems] = useState(new Set(initialCartData.map(item => item.id)));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const getUserIdentifier = () => {
        const tokenJWT = localStorage.getItem('tokenJWT');
        const guestToken = localStorage.getItem('guestToken');
        if (tokenJWT) return JSON.parse(localStorage.getItem("user")).id;
        return guestToken || 'guest';
    };

    const fetchCartItems = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const userIdentifier = getUserIdentifier();
            const response = await axios.get(`http://localhost:8080/api/cart/list/${userIdentifier}/items`);
            
            const items = response.data || [];
            setCartItems(items);
            setSelectedItems(new Set(items.map(item => item.id)));
        } catch (err) {
            console.error('Error fetching cart items:', err);
            setError('Failed to load cart items. Please try again.');
            setCartItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCartItems();
    }, []);

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
    const selectedItemsCount = Array.from(selectedItems).length;

    const handleUpdateQuantity = (itemId, newQuantity) => {
        setCartItems(items =>
            items.map(item =>
                item.id === itemId ? { ...item, quantity: newQuantity } : item
            )
        );
    };

    const handleRemoveItem = (itemId) => {
        setCartItems(items => items.filter(item => item.id !== itemId));
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            newSet.delete(itemId);
            return newSet;
        });
    };

    const handleSelectItem = (itemId, isSelected) => {
        setSelectedItems(prev => {
            const newSet = new Set(prev);
            if (isSelected) {
                newSet.add(itemId);
            } else {
                newSet.delete(itemId);
            }
            return newSet;
        });
    };

    const handleSelectAll = (selectAll) => {
        if (selectAll) {
            setSelectedItems(new Set(cartItems.map(item => item.id)));
        } else {
            setSelectedItems(new Set());
        }
    };

    const handleContinueShopping = () => {
        navigate('/');
    };

    const handleCheckout = () => {
        const selectedProducts = cartItems.filter(item => selectedItems.has(item.id));
        if (selectedProducts.length === 0) {
            return;
        }
        navigate('/order', { state: { items: selectedProducts } });
    };

    if (cartItems.length === 0) {
        return (
            <div className="shopping-cart-page">
                <EmptyCart onContinueShopping={handleContinueShopping} />
            </div>
        );
    }

    return (
        <div className="shopping-cart-page">
            <div className="cart-container">
                <CartHeader
                    totalItems={totalItems}
                    selectedItemsCount={selectedItemsCount}
                    onContinueShopping={handleContinueShopping}
                />

                <SelectAllBox
                    isChecked={selectedItemsCount === cartItems.length && cartItems.length > 0}
                    totalItems={cartItems.length}
                    onSelectAll={handleSelectAll}
                />

                <div className="cart-main-grid">
                    <div className="cart-items-list">
                        {cartItems.map(item => (
                            <CartItemCard
                                key={item.id}
                                item={item}
                                onUpdateQuantity={handleUpdateQuantity}
                                onRemoveItem={handleRemoveItem}
                                isSelected={selectedItems.has(item.id)}
                                onSelectItem={handleSelectItem}
                            />
                        ))}
                    </div>
                    <div>
                        <CartSummary
                            items={cartItems}
                            selectedItems={selectedItems}
                            onCheckout={handleCheckout}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShoppingCart;