
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  return (
    <div className="min-h-screen bg-white flex flex-col lg:flex-row">
      {/* Left Side: Brand/Visual */}
      <div className="lg:w-1/2 relative bg-black hidden lg:flex items-center justify-center p-12 overflow-hidden">
        <div className="absolute inset-0 opacity-40">
          <Image
            src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&q=80&w=2000"
            alt="Athlete Training"
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 50vw, 100vw"
          />
        </div>
        <div className="absolute inset-0 bg-linear-to-tr from-orange-600/40 via-transparent to-transparent" />
        
        <div className="relative z-10 max-w-lg space-y-8">
          <div className="inline-flex items-center justify-center bg-white text-black w-20 h-20 rounded-2xl rotate-[-5deg] shadow-2xl">
            <span className="text-5xl font-black italic tracking-tighter">A</span>
          </div>
          <div className="space-y-4">
            <h1 className="text-7xl font-black italic uppercase tracking-tighter text-white leading-none">
              Level Up Your Game
            </h1>
            <p className="text-xl text-slate-300 font-medium italic">
              Join thousands of elite athletes getting custom gear delivered to their doorstep.
            </p>
          </div>
        </div>

        {/* Decorative element */}
        <div className="absolute -bottom-25 -left-25 w-100 h-100 bg-orange-600 rounded-full blur-[150px] opacity-20" />
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md space-y-10">
          <div className="text-center lg:text-left space-y-2">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-slate-500 font-medium">
              {isLogin 
                ? "Don't have an account? " 
                : "Already part of the squad? "}
              <button 
                onClick={() => setIsLogin(!isLogin)}
                className="text-orange-600 font-bold hover:underline underline-offset-4"
              >
                {isLogin ? 'Join now' : 'Sign in'}
              </button>
            </p>
          </div>

          <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); router.push('/account'); }}>
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Full Name</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                    <input 
                      type="text" 
                      placeholder="Enter your name"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-600 focus:bg-white transition-all font-medium text-slate-900"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                <input 
                  type="email" 
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-600 focus:bg-white transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
                {isLogin && (
                  <Link href="/forgot-password" className="text-xs font-bold text-slate-400 hover:text-black transition-colors">
                    Forgot Password?
                  </Link>
                )}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                <input 
                  type={showPassword ? "text" : "password"}
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

            {!isLogin && (
              <div className="flex items-center gap-3">
                <input type="checkbox" className="w-5 h-5 border-slate-200 rounded accent-orange-600" id="terms" />
                <label htmlFor="terms" className="text-xs text-slate-500 font-medium">
                  I agree to the <span className="text-black font-bold underline">Terms of Service</span> and <span className="text-black font-bold underline">Privacy Policy</span>
                </label>
              </div>
            )}

            <button className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase italic tracking-tighter text-xl hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-4">
              <span>{isLogin ? 'Sign In' : 'Create Account'}</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-slate-400">
              <span className="bg-white px-4 italic">Or continue with</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
