
"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, CheckCircle2, XCircle, Clock, Loader2, MessageSquare } from 'lucide-react';
import { getAdminProductReviewsApi, updateReviewStatusApi } from '@/lib/api/products';
import { toast } from 'react-toastify';
import { getApiErrorMessage } from '@/lib/api/errors';

interface ReviewModerationModalProps {
  productId: string;
  productName: string;
  onClose: () => void;
}

type TabType = 'pending' | 'approved' | 'rejected';

export const ReviewModerationModal: React.FC<ReviewModerationModalProps> = ({ productId, productName, onClose }) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [modifyingId, setModifyingId] = useState<string | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const response = await getAdminProductReviewsApi(productId);
      setReviews(response.items);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to load reviews.'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchReviews();
  }, [productId]);

  const handleStatusUpdate = async (reviewId: string, newStatus: TabType) => {
    setModifyingId(reviewId);
    try {
      await updateReviewStatusApi(reviewId, newStatus);
      toast.success(`Review ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully.`);
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, status: newStatus } : r));
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to update review status.'));
    } finally {
      setModifyingId(null);
    }
  };

  const filteredReviews = reviews.filter(r => r.status === activeTab);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-50 rounded-2xl">
                <MessageSquare className="w-6 h-6 text-[#FF7348]" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">Review Moderation</h2>
                <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">{productName}</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-100 rounded-full transition-all"
            >
              <X className="w-6 h-6 text-slate-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 p-2 bg-slate-50/50 border-b border-slate-100 shrink-0">
            {(['pending', 'approved', 'rejected'] as const).map((tab) => {
              const count = reviews.filter(r => r.status === tab).length;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === tab 
                      ? "bg-white text-black shadow-sm" 
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {tab === 'pending' && <Clock className="w-3 h-3" />}
                  {tab === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                  {tab === 'rejected' && <XCircle className="w-3 h-3" />}
                  <span>{tab}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[8px] ${activeTab === tab ? 'bg-black text-white' : 'bg-slate-200 text-slate-500'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar space-y-6">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <Loader2 className="w-10 h-10 animate-spin mb-4" />
                <p className="text-xs font-black uppercase tracking-widest italic">Synchronizing Feed...</p>
              </div>
            ) : filteredReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <MessageSquare className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-xs font-black uppercase tracking-widest italic">No {activeTab} reviews found.</p>
              </div>
            ) : (
              filteredReviews.map((review) => (
                <div key={review.id} className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 group hover:border-slate-200 transition-all">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="flex gap-4">
                          <div className="w-12 h-12 rounded-full bg-slate-200 border border-slate-100 overflow-hidden shrink-0">
                            {review.userAvatar?.url ? (
                              <img src={review.userAvatar.url} alt={review.fullName} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400">
                                <span className="font-black italic uppercase text-xs">{review.fullName.charAt(0)}</span>
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              {[1, 2, 3, 4, 5].map((s) => (
                                <Star key={s} className={`w-3 h-3 ${s <= review.rating ? 'fill-orange-400 text-orange-400' : 'text-slate-200'}`} />
                              ))}
                            </div>
                            <h4 className="text-sm font-black italic uppercase tracking-tighter text-slate-900">{review.fullName}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{review.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-black uppercase text-slate-300 tracking-widest">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-600 font-medium leading-relaxed italic">
                        "{review.reviewText}"
                      </p>

                    </div>

                    <div className="flex md:flex-col gap-2 shrink-0 justify-end md:justify-start">
                      {activeTab !== 'approved' && (
                        <button
                          disabled={modifyingId === review.id}
                          onClick={() => handleStatusUpdate(review.id, 'approved')}
                          className="flex-1 md:w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:scale-105 transition-all shadow-md disabled:opacity-50"
                        >
                          {modifyingId === review.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          <span>Approve</span>
                        </button>
                      )}
                      {activeTab !== 'rejected' && (
                        <button
                          disabled={modifyingId === review.id}
                          onClick={() => handleStatusUpdate(review.id, 'rejected')}
                          className="flex-1 md:w-full flex items-center justify-center gap-2 bg-white text-red-500 border border-red-100 px-4 py-3 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-red-50 transition-all disabled:opacity-50"
                        >
                          {modifyingId === review.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                          <span>Reject</span>
                        </button>
                      )}
                      {activeTab !== 'pending' && (
                        <button
                          disabled={modifyingId === review.id}
                          onClick={() => handleStatusUpdate(review.id, 'pending')}
                          className="flex-1 md:w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-500 px-4 py-3 rounded-2xl text-[10px] font-black uppercase italic tracking-widest hover:bg-slate-200 transition-all disabled:opacity-50"
                        >
                          <span>Reset to Pending</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
