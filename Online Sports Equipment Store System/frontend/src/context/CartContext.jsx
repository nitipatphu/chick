import React, { createContext, useState, useContext, useEffect } from 'react';
import { cartService } from '../services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  const loadCart = async () => {
    if (!isAuthenticated) {
      setCartItems([]);
      return;
    }
    setLoading(true);
    try {
      const items = await cartService.getCart();
      setCartItems(items);
    } catch (error) {
      console.error('Error loading cart:', error);
      setCartItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, [isAuthenticated]);

  const addToCart = async (item) => {
    try {
      // ถ้า item เป็น productId (number) หรือ object
      const payload = typeof item === 'number' 
        ? { productId: item, quantity: 1 }
        : {
            productId: item.productId,
            quantity: item.quantity || 1,
            color: item.color || '',
            size: item.size || '',
            price: item.price,
            name: item.name,
            image: item.image
          };
      
      await cartService.addToCart(payload);
      await loadCart();
    } catch (error) {
      console.error('Error adding to cart:', error);
      throw error;
    }
  };

  const updateQuantity = async (id, newQuantity) => {
    if (newQuantity < 1) {
      await removeFromCart(id);
      return;
    }
    try {
      await cartService.updateQuantity(id, newQuantity);
      await loadCart();
    } catch (error) {
      console.error('Error updating cart:', error);
      throw error;
    }
  };

  const removeFromCart = async (id) => {
    try {
      await cartService.removeFromCart(id);
      await loadCart();
    } catch (error) {
      console.error('Error removing from cart:', error);
      throw error;
    }
  };

  const clearCart = async () => {
    try {
      await cartService.clearCart();
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = cartItems.reduce((sum, item) => sum + (item.price || item.product?.price || 0) * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      loading,
      totalItems,
      totalPrice,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      loadCart,
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};