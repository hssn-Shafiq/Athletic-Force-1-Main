"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { 
  ApiCartItem, 
  AddToCartRequest, 
  UpdateCartQuantityRequest 
} from '@/lib/api/types';
import { 
  getCartApi, 
  addToCartApi, 
  updateCartItemApi, 
  removeCartItemApi, 
  syncCartApi 
} from '@/lib/api/cart';
import { toast } from 'react-toastify';

type CartContextValue = {
  items: ApiCartItem[];
  isLoading: boolean;
  addItem: (payload: AddToCartRequest) => Promise<void>;
  updateQuantity: (variantSku: string, quantity: number) => Promise<void>;
  removeItem: (variantSku: string) => Promise<void>;
  itemCount: number;
  totalPrice: number;
};

const CartContext = createContext<CartContextValue | undefined>(undefined);
const LOCAL_CART_KEY = 'af1_guest_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<ApiCartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Read guest cart from local storage
  const getGuestCart = useCallback((): ApiCartItem[] => {
    try {
      const data = localStorage.getItem(LOCAL_CART_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }, []);

  const saveGuestCart = useCallback((newItems: ApiCartItem[]) => {
    localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(newItems));
    setItems(newItems);
  }, []);

  const loadCart = useCallback(async () => {
    if (authLoading) return;
    
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        // Authenticated users: Check if we have guest items to sync first
        const guestItems = getGuestCart();
        if (guestItems.length > 0) {
          await syncCartApi({ guestItems });
          localStorage.removeItem(LOCAL_CART_KEY);
        }

        const res = await getCartApi();
        if (res.ok && res.cart) {
          setItems(res.cart.items);
        }
      } else {
        // Guest users
        setItems(getGuestCart());
      }
    } catch (error) {
      console.error('Failed to load cart', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, authLoading, getGuestCart]);

  useEffect(() => {
    void loadCart();
  }, [loadCart]);

  const addItem = useCallback(async (payload: AddToCartRequest) => {
    try {
      if (isAuthenticated) {
        const res = await addToCartApi(payload);
        if (res.ok && res.cart) setItems(res.cart.items);
      } else {
        const currentItems = getGuestCart();
        const existingIndex = currentItems.findIndex(i => i.variantSku === payload.variantSku);
        
        if (existingIndex > -1) {
          currentItems[existingIndex].quantity += payload.quantity;
        } else {
          currentItems.push({
            productId: payload.productId,
            variantSku: payload.variantSku,
            slug: payload.slug,
            name: payload.name,
            imageUrl: payload.imageUrl,
            price: payload.price,
            quantity: payload.quantity,
            color: payload.color,
            size: payload.size,
            addedAt: new Date().toISOString(),
          } as ApiCartItem);
        }
        saveGuestCart(currentItems);
      }
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Failed to add item', error);
      toast.error('Failed to add item to cart');
    }
  }, [isAuthenticated, getGuestCart, saveGuestCart]);

  const updateQuantity = useCallback(async (variantSku: string, quantity: number) => {
    try {
      if (quantity < 1) return;

      if (isAuthenticated) {
        const res = await updateCartItemApi({ variantSku, quantity });
        if (res.ok && res.cart) setItems(res.cart.items);
      } else {
        const currentItems = getGuestCart();
        const item = currentItems.find(i => i.variantSku === variantSku);
        if (item) {
          item.quantity = quantity;
          saveGuestCart(currentItems);
        }
      }
    } catch (error) {
      console.error('Failed to update quantity', error);
      toast.error('Failed to update cart');
    }
  }, [isAuthenticated, getGuestCart, saveGuestCart]);

  const removeItem = useCallback(async (variantSku: string) => {
    try {
      if (isAuthenticated) {
        const res = await removeCartItemApi(variantSku);
        if (res.ok && res.cart) setItems(res.cart.items);
      } else {
        const currentItems = getGuestCart();
        const nextItems = currentItems.filter(i => i.variantSku !== variantSku);
        saveGuestCart(nextItems);
      }
      toast.info('Item removed from cart');
    } catch (error) {
      console.error('Failed to remove item', error);
      toast.error('Failed to remove item');
    }
  }, [isAuthenticated, getGuestCart, saveGuestCart]);

  const itemCount = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items]);

  const totalPrice = useMemo(() => items.reduce((acc, item) => acc + (item.price * item.quantity), 0), [items]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      isLoading,
      addItem,
      updateQuantity,
      removeItem,
      itemCount,
      totalPrice,
    }),
    [items, isLoading, addItem, updateQuantity, removeItem, itemCount, totalPrice]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
}
