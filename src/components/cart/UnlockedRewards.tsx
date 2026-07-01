'use client';

import React, { useEffect, useState } from 'react';
import { Gift, Check } from 'lucide-react';
import Image from 'next/image';
import { Product } from '@/types';
import { apiClient } from '@/lib/api/client';
import { useCart } from '@/contexts/CartContext';

interface UnlockedRewardsProps {
  onOpenQuickView: (product: Product) => void;
}

export const UnlockedRewards: React.FC<UnlockedRewardsProps> = ({ onOpenQuickView }) => {
  const { items, addItem, removeItem } = useCart();
  const rewardItemInCart = items.find(i => i.isReward);
  
  const [rewards, setRewards] = useState<Product[]>([]);
  const [selectedRewardId, setSelectedRewardId] = useState<string | null>(rewardItemInCart ? rewardItemInCart.productId : null);
  
  useEffect(() => {
    if (rewardItemInCart) setSelectedRewardId(rewardItemInCart.productId);
  }, [rewardItemInCart]);
  
  useEffect(() => {
    if (items.length === 0) {
      setRewards([]);
      setSelectedRewardId(null);
      return;
    }

    const payload = items.filter(i => !i.isReward).map(i => ({ productId: i.productId, quantity: i.quantity }));
    
    const guestEmail = typeof window !== 'undefined' ? localStorage.getItem('af1_guest_email') : undefined;
    apiClient.post('/api/discounts/evaluate-automatic', { items: payload, guestEmail }).then(res => {
      if (res.data?.ok && res.data.eligibleRewards.length > 0) {
         const mapped = res.data.eligibleRewards.map((p: any) => ({
           id: p.id,
           title: p.name,
           slug: p.slug,
           price: 0, 
           originalPrice: p.regularPrice || p.basePrice || 0,
           image: p.mainImageUrl || '/placeholder.png',
           category: p.collections?.[0]?.name || 'Gift',
           rating: p.rating || 5,
           isNew: true,
           discount: 'FREE GIFT',
           orderType: p.orderType
         }));
         setRewards(mapped);
      } else {
         setRewards([]);
         setSelectedRewardId(null);
      }
    }).catch(err => {
      console.error('Failed to evaluate automatic discounts:', err);
    });
  }, [items]);

  if (rewards.length === 0) return null;

  return (
    <div className="p-5 bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-3xl shadow-sm mb-6 mt-2 relative overflow-hidden">
       {/* Decorative Background */}
       <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-200 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
       
       <div className="flex items-center gap-4 mb-5 relative z-10">
         <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-600/30 shrink-0 transform -rotate-6">
            <Gift className="w-6 h-6 text-white" />
         </div>
         <div>
            <h3 className="font-black text-orange-900 uppercase italic tracking-tighter text-xl leading-none">Unlocked: Free Gift!</h3>
            <p className="text-xs font-bold text-orange-700 mt-1 uppercase tracking-widest">Select your free item below</p>
         </div>
       </div>
       
       <div className="space-y-3 relative z-10">
         {rewards.slice(0, 4).map(reward => (
            <label 
              key={reward.id} 
              className={`flex items-center gap-4 p-3 bg-white rounded-2xl border-2 cursor-pointer transition-all ${
                selectedRewardId === reward.id ? 'border-orange-500 shadow-md shadow-orange-500/20' : 'border-transparent shadow-sm hover:border-orange-200 hover:bg-orange-50/50'
              }`}
              onClick={async (e) => {
                e.preventDefault(); 
                if (selectedRewardId !== reward.id) {
                   if (rewardItemInCart) await removeItem(rewardItemInCart.variantSku);
                   setSelectedRewardId(reward.id);
                   await addItem({
                      productId: reward.id,
                      variantSku: `REWARD-${reward.id}`,
                      name: reward.title,
                      imageUrl: reward.image,
                      price: 0,
                      originalPrice: reward.originalPrice,
                      quantity: 1,
                      isReward: true
                   });
                } else {
                   setSelectedRewardId(null);
                   if (rewardItemInCart) await removeItem(rewardItemInCart.variantSku);
                }
              }}
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100 bg-slate-50">
                <Image 
                  src={reward.image} 
                  alt={reward.title} 
                  fill 
                  className="object-cover" 
                  unoptimized 
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 truncate">{reward.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full uppercase tracking-widest">Free</span>
                  <span className="text-[10px] font-bold text-slate-400 line-through">${reward.originalPrice?.toFixed(2)}</span>
                </div>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                selectedRewardId === reward.id ? 'bg-orange-500 border-orange-500' : 'border-slate-300'
              }`}>
                {selectedRewardId === reward.id && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
              </div>
            </label>
         ))}
       </div>
    </div>
  );
}
