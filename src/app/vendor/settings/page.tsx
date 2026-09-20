"use client";

import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  KeyRound,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  User,
  Mail,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { changeVendorPasswordApi } from '@/lib/api/vendorDashboard';

export default function VendorSettingsPage() {
  const { user } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg('New password must be at least 8 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('New password and confirmation do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changeVendorPasswordApi({
        currentPassword,
        newPassword,
      });

      if (res?.ok) {
        setSuccessMsg(res.message || 'Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setErrorMsg(res?.message || 'Failed to update password.');
      }
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'Failed to change password. Please verify current password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div>
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#FF7348] italic">
          Security &amp; Account
        </span>
        <h1 className="text-3xl font-black italic uppercase tracking-tight text-white mt-1">
          Account Settings
        </h1>
        <p className="text-xs font-medium text-slate-400 mt-1">
          Manage your credentials, authentication security, and password keys.
        </p>
      </div>

      {/* ── Personal Info Card ────────────────────────────────────────────── */}
      <div className="p-6 rounded-3xl bg-[#151921] border border-white/10 space-y-4">
        <h2 className="text-sm font-black italic uppercase tracking-wider text-white flex items-center gap-2">
          <User className="w-4 h-4 text-[#FF7348]" /> Account Identification
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Full Name</span>
            <p className="font-bold text-white text-sm">{user?.name || 'Merchant'}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</span>
            <p className="font-bold text-white text-sm truncate">{user?.email || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* ── Change Password Card ─────────────────────────────────────────── */}
      <div className="p-8 rounded-3xl bg-[#151921] border border-white/10 space-y-6">
        <div>
          <h2 className="text-base font-black italic uppercase tracking-wider text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#FF7348]" /> Change Password
          </h2>
          <p className="text-xs font-medium text-slate-400 mt-0.5">
            Update your account password to protect access to your store and payouts.
          </p>
        </div>

        {successMsg && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-3 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-3 text-xs font-bold">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
              Current Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
              />
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
              New Password (Min 8 Characters)
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="text-xs font-black uppercase tracking-widest text-slate-300 italic mb-2 block">
              Confirm New Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#FF7348]"
              />
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isChangingPassword}
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF7348] hover:bg-[#ff8660] text-black font-black uppercase tracking-widest text-xs transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98] disabled:opacity-50"
            >
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> Updating Password...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Change Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
