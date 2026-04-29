
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, ArrowRight, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

export const ResetPasswordPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    setError(null);

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setError('Invalid or missing reset token.');
      setIsLoading(false);
      return;
    }

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8081';
      const response = await fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Something went wrong');

      setIsSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 sm:p-12 lg:p-24">
      <div className="w-full max-w-md space-y-12">
        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            {isSuccess ? 'Password Reset!' : 'New Password'}
          </h2>
          <p className="text-slate-500 font-medium italic">
            {isSuccess 
              ? "Your password has been successfully updated. Redirecting you to login..."
              : "Create a strong password to secure your Athletic Force 1 account."}
          </p>
        </div>

        {isSuccess ? (
          <div className="p-12 bg-green-50 rounded-[40px] flex flex-col items-center text-center space-y-6 border border-green-100">
            <div className="w-24 h-24 bg-green-600 rounded-3xl flex items-center justify-center rotate-[-5deg] shadow-xl">
              <CheckCircle2 className="w-12 h-12 text-white" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">New Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-orange-600 focus:bg-white transition-all font-medium text-slate-900"
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Confirm Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                  <input 
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-orange-600 focus:bg-white transition-all font-medium text-slate-900"
                  />
                </div>
              </div>
            </div>

            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl text-red-600 text-sm font-bold italic">
                {error}
              </div>
            )}

            <button 
              disabled={isLoading}
              className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase italic tracking-tighter text-xl hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isLoading ? 'Updating...' : 'Reset Password'}</span>
              {!isLoading && <ArrowRight className="w-6 h-6" />}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
