
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Upload, ChevronRight } from 'lucide-react';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productTitle: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, productTitle }) => {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-8 border-b border-slate-100">
              <div>
                <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">Write a Review</h2>
                <p className="text-slate-400 text-sm font-medium mt-1 uppercase tracking-wider">{productTitle}</p>
              </div>
              <button 
                onClick={onClose}
                className="p-3 hover:bg-slate-100 rounded-full transition-all hover:rotate-90"
              >
                <X className="w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
              {/* Rating */}
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star 
                        className={`w-10 h-10 transition-colors ${
                          (hover || rating) >= star 
                            ? "fill-[#FF7348] text-[#FF7348]" 
                            : "text-slate-200"
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Area */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Full Name</label>
                  <input 
                    type="text" 
                    placeholder="John Doe"
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#FF7348] focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Email Address</label>
                  <input 
                    type="email" 
                    placeholder="john@example.com"
                    className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#FF7348] focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Your Review</label>
                <textarea 
                  rows={4}
                  placeholder="Share your experience with us..."
                  className="w-full px-6 py-4 bg-slate-50 border border-transparent focus:border-[#FF7348] focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 resize-none"
                />
              </div>

              {/* Photo Upload */}
              <div className="space-y-4">
                <label className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Add Photos</label>
                <div className="flex items-center justify-center border-2 border-dashed border-slate-200 rounded-3xl p-8 hover:border-[#FF7348] transition-colors group cursor-pointer">
                  <div className="text-center">
                    <Upload className="w-10 h-10 text-slate-300 group-hover:text-[#FF7348] mx-auto mb-3 transition-colors" />
                    <p className="text-sm font-bold text-slate-600">Click or Drag to Upload</p>
                    <p className="text-xs text-slate-400 mt-1 uppercase font-medium">PNG, JPG up to 5MB</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 bg-slate-50 flex justify-end">
              <button 
                onClick={onClose}
                className="group flex items-center gap-2 bg-[#141414] text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-lg hover:bg-black transition-all hover:gap-4 shadow-xl"
              >
                <span>Submit Review</span>
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
