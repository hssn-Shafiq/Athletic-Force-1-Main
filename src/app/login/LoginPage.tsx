
"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { ArrowRight, ArrowLeft, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { getApiErrorMessage } from '@/lib/api/errors';
import { getGoogleAuthUrl } from '@/lib/api/auth';

export const LoginPage: React.FC = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const router = useRouter();
  const { login, isAuthenticated, isLoading, user } = useAuth();
  const googleAuthUrl = useMemo(() => getGoogleAuthUrl(), []);
  const showLoggedInState = !isLoading && isAuthenticated;

  function handleBack() {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/');
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      router.push('/account');
    } catch (submitError) {
      setError(getApiErrorMessage(submitError, 'Unable to sign in.'));
    } finally {
      setIsSubmitting(false);
    }
  }

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
          <div className="inline-flex items-center rotate-[-4deg]">
            <Image
              src="/footer-logo.png"
              alt="Athletic Force 1"
              width={96}
              height={32}
              className="h-10 sm:h-12 w-auto drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
              priority
            />
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
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          {showLoggedInState ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
              <h2 className="text-4xl font-black italic uppercase tracking-tighter text-emerald-900">
                Already Logged In
              </h2>
              <p className="mt-2 text-base font-semibold text-emerald-900">
                You are already logged in as {user?.name ?? user?.email ?? 'this account'}.
              </p>
              <Link href="/account" className="mt-3 inline-block text-base font-black uppercase tracking-wider text-emerald-800 underline underline-offset-4">
                Go to My Account
              </Link>
            </div>
          ) : null}

          {!showLoggedInState ? (
            <>
              <div className="text-center lg:text-left space-y-2">
                <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Welcome Back</h2>
                <p className="text-slate-500 font-medium">
                  Don&apos;t have an account?{' '}
                  <Link href="/register" className="text-orange-600 font-bold hover:underline underline-offset-4">
                    Join now
                  </Link>
                </p>
              </div>

              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Email Address</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-orange-600 focus:bg-white transition-all font-medium text-slate-900"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Password</label>
                    <Link href="/forgetPassword" className="text-xs font-bold text-slate-400 hover:text-black transition-colors">
                      Forgot Password?
                    </Link>
                  </div>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-orange-600 transition-colors" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-12 pr-12 outline-none focus:border-orange-600 focus:bg-white transition-all font-medium text-slate-900"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
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

                {error ? <p className="text-sm text-red-600 font-semibold">{error}</p> : null}

                <button
                  className="w-full bg-black text-white py-5 rounded-3xl font-black uppercase italic tracking-tighter text-xl hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all shadow-xl flex items-center justify-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed"
                  type="submit"
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight className="w-6 h-6" />
                </button>
              </form>

              <a
                href={googleAuthUrl}
                className="block w-full border border-slate-200 text-slate-900 py-4 rounded-2xl font-bold text-center hover:bg-slate-50 transition-colors"
              >
                Continue with Google
              </a>
            </>
          ) : null}

        </div>
      </div>
    </div>
  );
};
