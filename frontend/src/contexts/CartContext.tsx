"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { ProductType } from '@/app/store/page'; // Regular product type
import { ProductInBundle } from '@/components/store/BundleCard'; // For items within a bundle

// Updated CartItem to potentially include bundle-specific fields
export interface CartItem extends ProductType { // ProductType might need to be more generic or a union type
  quantityInCart: number;
  isBundle?: boolean;
  bundleItems?: ProductInBundle[]; // Array of products if this cart item is a bundle
}

interface CartState {
  items: CartItem[];
}

interface CartContextProps extends CartState {
  addToCart: (product: ProductType, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getItemCount: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextProps | undefined>(undefined);

type CartAction =
  | { type: 'ADD_TO_CART'; payload: { product: ProductType; quantity: number } }
  | { type: 'REMOVE_FROM_CART'; payload: { productId: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { productId: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'LOAD_CART'; payload: { items: CartItem[] } };

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'LOAD_CART':
      return { ...state, items: action.payload.items };
    case 'ADD_TO_CART': {
  const { product, quantity } = action.payload; // product here can be a regular product or a bundle pseudo-product
      const existingItemIndex = state.items.findIndex(item => item.id === product.id);

      if (existingItemIndex > -1) {
    // Item exists, update quantity
    const existingItem = state.items[existingItemIndex];
    let newQuantity = existingItem.quantityInCart + quantity;

    // For bundles, stockQuantity is often managed differently (e.g., 1 means 1 bundle package).
    // For individual products, it's the actual stock.
    // The `product.stockQuantity` passed to addToCart for a bundle should reflect how many *bundles* can be bought.
    // If bundle stock is effectively 1 (can only add one of this specific bundle deal), then newQuantity should be capped at 1.
    // For this example, let's assume `product.stockQuantity` for a bundle being added is its "buyable units as a bundle".
    newQuantity = Math.min(newQuantity, product.stockQuantity);

        const updatedItems = state.items.map((item, index) =>
          index === existingItemIndex
        ? { ...item, quantityInCart: newQuantity }
            : item
        );
        return { ...state, items: updatedItems };
      } else {
    // Item does not exist, add new
    // Ensure quantity does not exceed stock for the first add.
    const quantityToAdd = Math.min(quantity, product.stockQuantity);
    return {
        ...state,
        items: [...state.items, {
            ...product, // This includes all fields passed from addToCart (id, name, price, images, isBundle, bundleItems etc.)
            quantityInCart: quantityToAdd
        }]
    };
      }
    }
    case 'REMOVE_FROM_CART': {
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload.productId),
      };
    }
    case 'UPDATE_QUANTITY': {
      const { productId, quantity } = action.payload;
      const itemToUpdate = state.items.find(item => item.id === productId);
      if (!itemToUpdate) return state;

  // For bundles, stockQuantity might be treated as "max bundles allowed in cart" e.g. 1 or 2.
  // For individual products, it's the actual stock.
  // This logic assumes itemToUpdate.stockQuantity correctly reflects this.
  const newQuantity = Math.min(Math.max(quantity, 1), itemToUpdate.stockQuantity);

      return {
        ...state,
        items: state.items.map(item =>
      item.id === productId ? { ...item, quantityInCart: newQuantity } : item
        ),
      };
    }
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

const CART_STORAGE_KEY = 'shoppingCart';

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });

  // Load cart from localStorage on initial render
  useEffect(() => {
    const storedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (storedCart) {
      try {
        const parsedCartItems = JSON.parse(storedCart) as CartItem[];
        dispatch({ type: 'LOAD_CART', payload: { items: parsedCartItems } });
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error);
        localStorage.removeItem(CART_STORAGE_KEY); // Clear corrupted cart
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
  // Only write to localStorage if there are items or if it previously had items (to clear it)
  if (state.items.length > 0) {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(state.items));
  } else if (localStorage.getItem(CART_STORAGE_KEY) !== null) { // If cart is now empty but was not
    localStorage.removeItem(CART_STORAGE_KEY);
    }
  }, [state.items]);

// Update ProductType to be more flexible for what can be added (Product or Bundle-like structure)
// The `product` argument can now represent a bundle with bundle-specific fields.
const addToCart = (product: Partial<CartItem> & { id: string; name: string; price: number; stockQuantity: number }, quantity: number) => {
  dispatch({ type: 'ADD_TO_CART', payload: { product: product as ProductType, quantity } }); // Cast for reducer, ensure all required fields are present
  };

  const removeFromCart = (productId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: { productId } });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem(CART_STORAGE_KEY); // Also clear from storage immediately
  };

  const getItemCount = () => {
    return state.items.reduce((count, item) => count + item.quantityInCart, 0);
  };

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + item.price * item.quantityInCart, 0);
  };

  return (
    <CartContext.Provider value={{ ...state, addToCart, removeFromCart, updateQuantity, clearCart, getItemCount, getTotalPrice }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
