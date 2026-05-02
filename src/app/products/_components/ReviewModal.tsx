import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Star, Upload, ChevronRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { submitProductReviewApi, signReviewAvatarUploadApi } from '@/lib/api/publicProducts';
import { uploadImageWithSignature } from '@/lib/api/media';
import { toast } from 'react-toastify';
import { getApiErrorMessage } from '@/lib/api/errors';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ isOpen, onClose, productId, productTitle }) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<{ url: string; publicId: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && isOpen) {
      setFullName(user.name);
      setEmail(user.email);
    }
  }, [user, isOpen]);

  const hasUnsavedChanges = rating > 0 || reviewText.trim() !== '' || userAvatar !== null;

  const handleClose = () => {
    if (isUploadingAvatar || isSubmitting) return;
    if (hasUnsavedChanges) {
      if (!confirm('You have unsaved changes. Are you sure you want to close the review mission?')) {
        return;
      }
    }
    onClose();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];

      // Limit to 5MB
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Avatar file is too large. Please select an image smaller than 5MB.');
        return;
      }

      // Check if it's an image
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.');
        return;
      }

      setAvatar(file);
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
      setAvatarPreview(URL.createObjectURL(file));

      // Instant Upload
      setIsUploadingAvatar(true);
      setUploadProgress(0);
      try {
        const signed = await signReviewAvatarUploadApi({
          productSlug: productTitle.toLowerCase().replace(/\s+/g, '-'),
          collectionSlug: 'reviews'
        });

        const result = await uploadImageWithSignature(file, signed, (progress) => {
          setUploadProgress(progress);
        });

        setUserAvatar({ url: result.secureUrl, publicId: result.publicId });
        toast.success('Profile photo uploaded and secured.');
      } catch (err) {
        toast.error('Failed to upload profile photo. Please try again.');
        setAvatar(null);
        setAvatarPreview(null);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      toast.error('Please provide a rating.');
      return;
    }
    if (!fullName.trim() || !email.trim() || !reviewText.trim()) {
      toast.error('Please fill in all required fields.');
      return;
    }
    if (isUploadingAvatar) {
      toast.warning('Please wait for the profile photo to finish uploading.');
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('payload', JSON.stringify({
        rating,
        fullName,
        email,
        reviewText,
        userAvatar,
      }));

      await submitProductReviewApi(productId, formData);

      toast.success('Review submitted successfully! It will be visible once approved by an admin.');
      onClose();
      // Reset state
      setRating(0);
      setReviewText('');
      setAvatar(null);
      setAvatarPreview(null);
      setUserAvatar(null);
      setUploadProgress(0);
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Failed to submit review.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 sm:p-8 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-black italic uppercase tracking-tighter text-slate-900">Write a Review</h2>
                <p className="text-slate-400 text-xs sm:text-sm font-medium mt-1 uppercase tracking-wider">{productTitle}</p>
              </div>
              <button
                onClick={handleClose}
                disabled={isUploadingAvatar || isSubmitting}
                className="p-2 hover:bg-slate-100 rounded-full transition-all hover:rotate-90 disabled:opacity-30"
              >
                <X className="w-5 h-5 sm:w-6 h-6 text-slate-500" />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 sm:p-8 space-y-6 sm:y-8 overflow-y-auto custom-scrollbar">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6 pb-2">
                <div
                  onClick={() => !isUploadingAvatar && avatarInputRef.current?.click()}
                  className={`relative w-20 h-20 rounded-full bg-slate-50 border-2 border-dashed flex items-center justify-center cursor-pointer group transition-all overflow-hidden ${isUploadingAvatar ? 'border-[#FF7348] border-solid' : 'border-slate-200 hover:border-[#FF7348]'
                    }`}
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className={`w-full h-full object-cover ${isUploadingAvatar ? 'opacity-50' : ''}`} />
                  ) : (
                    <Upload className="w-6 h-6 text-slate-300 group-hover:text-[#FF7348] transition-colors" />
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-[#FF7348] animate-spin" />
                    </div>
                  )}
                  {!isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <p className="text-[8px] font-black uppercase text-white tracking-widest">Update</p>
                    </div>
                  )}
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">Profile Photo</h4>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Add your face to the mission.</p>
                  {isUploadingAvatar && (
                    <div className="mt-2 w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                        className="h-full bg-[var(--color-accent)]"
                      />
                    </div>
                  )}
                </div>
                <input
                  type="file"
                  ref={avatarInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  disabled={isUploadingAvatar}
                  className="hidden"
                />
              </div>

              {/* Rating */}
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHover(star)}
                      onMouseLeave={() => setHover(0)}
                      onClick={() => setRating(star)}
                      className="transition-transform active:scale-90"
                    >
                      <Star
                        className={`w-8 h-8 sm:w-10 h-10 transition-colors ${(hover || rating) >= star
                            ? "fill-[#FF7348] text-[#FF7348]"
                            : "text-slate-200"
                          }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full px-5 py-3 sm:py-4 bg-slate-50 border border-transparent focus:border-[#FF7348] focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 text-sm"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="john@example.com"
                    className="w-full px-5 py-3 sm:py-4 bg-slate-50 border border-transparent focus:border-[#FF7348] focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Your Review</label>
                <textarea
                  rows={4}
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="Share your experience with us..."
                  className="w-full px-5 py-3 sm:py-4 bg-slate-50 border border-transparent focus:border-[#FF7348] focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-900 resize-none text-sm"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 sm:p-8 bg-slate-50 shrink-0 space-y-4">
              <div className="flex justify-end">
                <button
                  disabled={isSubmitting || isUploadingAvatar}
                  onClick={handleSubmit}
                  className="group flex items-center gap-2 bg-[#141414] text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm sm:text-lg hover:bg-black transition-all hover:gap-4 shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Deploying Mission...</span>
                    </>
                  ) : (
                    <>
                      <span>Submit Review</span>
                      <ChevronRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
