
"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 sm:p-12 lg:p-24">
      <div className="w-full max-w-md space-y-12">
        <Link 
          href="/login"
          className="inline-flex items-center gap-2 text-slate-400 font-bold uppercase tracking-widest text-[10px] hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Login
        </Link>

        <div className="space-y-4">
          <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            {isSubmitted ? 'Check Your Inbox' : 'Reset Password'}
          </h2>
          <p className="text-slate-500 font-medium italic">
            {isSubmitted 
              ? `We've sent a recovery link to ${email}. Please check your spam folder if you don't see it.`
              : "Don't worry, it happens to the best of us. Enter your email and we'll help you get back in the game."}
          </p>
        </div>

        {isSubmitted ? (
          <div className="space-y-8">
            <div className="p-8 bg-orange-50 rounded-[40px] flex flex-col items-center text-center space-y-4 border border-orange-100">
              <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center rotate-[-5deg] shadow-xl">
                <CheckCircle2 className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Email Sent!</h3>
            </div>
            
            <div className="space-y-4">
              <button 
                onClick={() => setIsSubmitted(false)}
                className="w-full py-5 rounded-3xl font-black uppercase italic tracking-tighter text-xl border-2 border-slate-100 hover:bg-slate-50 transition-all"
              >
                Try Another Email
              </button>
              <p className="text-center text-slate-400 text-xs font-bold uppercase tracking-widest">
                Didn&apos;t receive anything? <button className="text-orange-600 underline">Resend link</button>
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-600 focus:bg-white transition-all font-medium text-slate-900"
                />
              </div>
            </div>

            <button className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase italic tracking-tighter text-xl hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-4">
              <span>Send Recovery Link</span>
              <ArrowRight className="w-6 h-6" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
