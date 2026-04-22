"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { ApiWishlistItem, ToggleWishlistItemRequest } from '@/lib/api/types';
import { getWishlistApi, toggleWishlistItemApi, syncWishlistApi } from '@/lib/api/wishlist';
import { toast } from 'react-toastify';
import { Heart } from 'lucide-react';

interface WishlistContextType {
  items: ApiWishlistItem[];
  isLoading: boolean;
  toggleItem: (item: ToggleWishlistItemRequest) => Promise<void>;
  isInWishlist: (productId: string) => boolean;
  syncWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const GUEST_WISHLIST_KEY = 'af1_guest_wishlist';

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<ApiWishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load wishlist
  const loadWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        const response = await getWishlistApi();
        if (response.ok) {
          setItems(response.wishlist.items);
        }
      } else {
        const guestData = localStorage.getItem(GUEST_WISHLIST_KEY);
        if (guestData) {
          setItems(JSON.parse(guestData));
        }
      }
    } catch (error) {
      console.error('Error loading wishlist:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authLoading) {
      loadWishlist();
    }
  }, [authLoading, loadWishlist]);

  // Sync guest wishlist to DB on login
  const syncWishlist = useCallback(async () => {
    if (!isAuthenticated) return;
    
    const guestData = localStorage.getItem(GUEST_WISHLIST_KEY);
    if (!guestData) return;

    try {
      const guestItems = JSON.parse(guestData);
      if (guestItems.length > 0) {
        const response = await syncWishlistApi({ guestItems });
        if (response.ok) {
          setItems(response.wishlist.items);
          localStorage.removeItem(GUEST_WISHLIST_KEY);
          toast.success('Wishlist synchronized!', {
            icon: <Heart className="h-4 w-4 text-red-500 fill-red-500" />,
          });
        }
      }
    } catch (error) {
      console.error('Error syncing wishlist:', error);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      syncWishlist();
    }
  }, [isAuthenticated, authLoading, syncWishlist]);

  const toggleItem = async (item: ToggleWishlistItemRequest) => {
    const isAdding = !items.some(i => i.productId === item.productId);

    try {
      if (isAuthenticated) {
        const response = await toggleWishlistItemApi(item);
        if (response.ok) {
          setItems(response.wishlist.items);
        }
      } else {
        let newItems = [...items];
        if (isAdding) {
          newItems.push({ ...item, addedAt: new Date().toISOString() });
        } else {
          newItems = newItems.filter(i => i.productId !== item.productId);
        }
        setItems(newItems);
        localStorage.setItem(GUEST_WISHLIST_KEY, JSON.stringify(newItems));
      }

      toast.success(isAdding ? 'Added to wishlist' : 'Removed from wishlist', {
        icon: <Heart className={`h-4 w-4 ${isAdding ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />,
      });
    } catch (error) {
      console.error('Error toggling wishlist item:', error);
      toast.error('Failed to update wishlist');
    }
  };

  const isInWishlist = (productId: string) => {
    return items.some(item => item.productId === productId);
  };

  return (
    <WishlistContext.Provider value={{ items, isLoading, toggleItem, isInWishlist, syncWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
