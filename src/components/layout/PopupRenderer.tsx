"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { X, Tag } from 'lucide-react';
import { fetchActivePopups, trackImpression, trackDismissal, type Popup } from '@/lib/api/popups';
import { useAuth } from '@/contexts/AuthContext';

// --- Shared Display Components (similar to preview but interactive) ---

function CountdownDisplay({ deadline }: { deadline?: string }) {
  const [time, setTime] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const diff = Math.max(0, new Date(deadline).getTime() - Date.now());
      setTime({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    <div className="flex items-center gap-1 justify-center">
      {[['d', time.d], ['h', time.h], ['m', time.m], ['s', time.s]].map(([label, val]) => (
        <div key={label} className="flex flex-col items-center">
          <div className="bg-black/30 rounded px-1.5 py-0.5 text-white font-black text-sm tabular-nums">{pad(Number(val))}</div>
          <span className="text-[8px] text-white/60 font-bold uppercase mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  );
}

function getSizeClass(size: string) {
  return size === 'small' ? 'max-w-sm' : size === 'large' ? 'max-w-2xl' : 'max-w-lg';
}

function PopupCard({ p, onClose }: { p: Popup; onClose: () => void }) {
  const layout = p.layout || 'bold';
  const sizeClass = getSizeClass(p.size);
  const handleCta = () => {
    if (p.ctaUrl) window.location.href = p.ctaUrl;
  };

  const closeBtn = p.showCloseButton ? (
    <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-slate-500 hover:text-slate-900 transition z-50">
      <X className="w-4 h-4" />
    </button>
  ) : null;

  if (layout === 'minimal') return (
    <div className={`${sizeClass} w-full mx-auto bg-white rounded-3xl shadow-2xl border-t-4 overflow-hidden relative pointer-events-auto`} style={{ borderColor: p.accentColor || '#ea580c' }}>
      {closeBtn}
      <div className="p-8">
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: p.accentColor || '#ea580c' }}>{p.type?.replace(/_/g, ' ')}</p>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">{p.title}</h2>
        {p.subtitle && <p className="text-sm text-slate-500 font-medium mb-4">{p.subtitle}</p>}
        {p.showCountdown && p.countdownDeadline && <div className="mb-4"><CountdownDisplay deadline={p.countdownDeadline} /></div>}
        {p.discountCode && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 mb-4 w-fit">
            <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Code:</span>
            <span className="text-sm font-black tracking-widest" style={{ color: p.accentColor || '#ea580c' }}>{p.discountCode}</span>
          </div>
        )}
        {p.showEmailCapture && (
          <div className="flex gap-2 mb-4">
            <input placeholder={p.emailPlaceholder || 'Enter your email'} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            <button className="px-4 py-2 rounded-xl text-white text-xs font-black uppercase" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-3">
          {p.ctaLabel && <button onClick={handleCta} className="px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 text-xs font-bold transition">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );

  if (layout === 'bold') return (
    <div className={`${sizeClass} w-full mx-auto rounded-3xl shadow-2xl overflow-hidden relative pointer-events-auto`} style={{ background: `linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%)` }}>
      {closeBtn && <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition z-50"><X className="w-4 h-4" /></button>}
      <div className="relative p-8">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl pointer-events-none" style={{ background: p.accentColor || '#ea580c' }} />
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: p.accentColor || '#ea580c' }}>⚡ {p.type?.replace(/_/g, ' ')}</p>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">{p.title}</h2>
        {p.subtitle && <p className="text-sm text-white/60 font-medium mb-4">{p.subtitle}</p>}
        {p.showCountdown && p.countdownDeadline && <div className="mb-4"><CountdownDisplay deadline={p.countdownDeadline} /></div>}
        {p.discountCode && (
          <div className="inline-flex items-center gap-2 border rounded-xl px-4 py-2 mb-4" style={{ borderColor: p.accentColor || '#ea580c' }}>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Code:</span>
            <span className="text-base font-black tracking-widest select-all" style={{ color: p.accentColor || '#ea580c' }}>{p.discountCode}</span>
          </div>
        )}
        {p.showEmailCapture && (
          <div className="flex gap-2 mb-4">
            <input placeholder={p.emailPlaceholder || 'Enter your email'} className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white outline-none" />
            <button className="px-4 py-2 rounded-xl text-white text-xs font-black uppercase hover:opacity-90 transition" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-3">
          {p.ctaLabel && <button onClick={handleCta} className="px-6 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg hover:opacity-90 transition" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button onClick={onClose} className="px-4 py-3 rounded-xl text-white/40 hover:text-white/80 text-xs font-bold transition">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );

  if (layout === 'dark') return (
    <div className={`${sizeClass} w-full mx-auto rounded-3xl shadow-2xl overflow-hidden bg-slate-900 border border-slate-700 relative pointer-events-auto`}>
      {closeBtn && <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition z-50"><X className="w-4 h-4" /></button>}
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${p.accentColor || '#ea580c'}, #dc2626)` }} />
      <div className="p-8">
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: p.accentColor || '#ea580c' }}>{p.type?.replace(/_/g, ' ')}</p>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">{p.title}</h2>
        {p.subtitle && <p className="text-sm text-slate-400 font-medium mb-4">{p.subtitle}</p>}
        {p.showCountdown && p.countdownDeadline && <div className="mb-4"><CountdownDisplay deadline={p.countdownDeadline} /></div>}
        {p.discountCode && (
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 mb-4 w-fit">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Code:</span>
            <span className="text-sm font-black tracking-widest select-all" style={{ color: p.accentColor || '#ea580c' }}>{p.discountCode}</span>
          </div>
        )}
        {p.showEmailCapture && (
          <div className="flex gap-2 mb-4">
            <input placeholder={p.emailPlaceholder || 'Enter your email'} className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none" />
            <button className="px-4 py-2 rounded-xl text-white text-xs font-black uppercase hover:opacity-90 transition" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-3">
          {p.ctaLabel && <button onClick={handleCta} className="px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-slate-500 hover:text-slate-300 text-xs font-bold transition">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );

  if (layout === 'split_image') return (
    <div className={`${sizeClass} w-full mx-auto rounded-3xl shadow-2xl overflow-hidden bg-white flex relative pointer-events-auto`}>
      {closeBtn}
      <div className="w-2/5 shrink-0 relative flex items-center justify-center bg-slate-900 pointer-events-none">
        {p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}
      </div>
      <div className="flex-1 p-8">
        <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: p.accentColor || '#ea580c' }}>{p.type?.replace(/_/g, ' ')}</p>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">{p.title}</h2>
        {p.subtitle && <p className="text-sm text-slate-500 mb-4">{p.subtitle}</p>}
        {p.showCountdown && p.countdownDeadline && <div className="mb-4"><CountdownDisplay deadline={p.countdownDeadline} /></div>}
        {p.discountCode && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 mb-4 w-fit">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Code:</span>
            <span className="text-sm font-black tracking-widest select-all" style={{ color: p.accentColor || '#ea580c' }}>{p.discountCode}</span>
          </div>
        )}
        {p.showEmailCapture && (
          <div className="flex flex-col gap-2 mb-4">
            <input placeholder={p.emailPlaceholder || 'Enter your email'} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            <button className="px-3 py-2 rounded-xl text-white text-[10px] font-black uppercase hover:opacity-90 transition" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-2 flex-wrap mt-2">
          {p.ctaLabel && <button onClick={handleCta} className="px-5 py-2.5 rounded-xl text-white text-[11px] font-black uppercase tracking-widest hover:opacity-90 transition" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-slate-600 text-[11px] font-bold transition">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );

  // fullscreen
  return (
    <div className="w-full h-full mx-auto shadow-2xl overflow-hidden relative flex items-center justify-center pointer-events-auto" style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #2a1a0a 100%)' }}>
      {closeBtn && <button onClick={onClose} className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white/50 hover:text-white transition z-50"><X className="w-6 h-6" /></button>}
      {p.imageUrl && <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 pointer-events-none" />}
      <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,0,0,0.4))` }} />
      <div className="relative z-10 text-center p-10 max-w-2xl w-full">
        <p className="text-[11px] font-black uppercase tracking-widest mb-4" style={{ color: p.accentColor || '#ea580c' }}>{p.type?.replace(/_/g, ' ')}</p>
        <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-4">{p.title}</h2>
        {p.subtitle && <p className="text-base text-white/70 mb-6 max-w-lg mx-auto">{p.subtitle}</p>}
        {p.showCountdown && p.countdownDeadline && <div className="mb-6"><CountdownDisplay deadline={p.countdownDeadline} /></div>}
        {p.discountCode && (
          <div className="inline-flex items-center gap-3 border rounded-xl px-6 py-3 mb-6" style={{ borderColor: p.accentColor || '#ea580c' }}>
            <span className="text-xs font-black text-white/50 uppercase tracking-widest">Code:</span>
            <span className="text-xl font-black tracking-widest select-all" style={{ color: p.accentColor || '#ea580c' }}>{p.discountCode}</span>
          </div>
        )}
        {p.showEmailCapture && (
          <div className="flex gap-2 max-w-md mx-auto mb-6">
            <input placeholder={p.emailPlaceholder || 'Enter your email'} className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-base text-white outline-none" />
            <button className="px-6 py-3 rounded-xl text-white text-sm font-black uppercase hover:opacity-90 transition" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-4 justify-center mt-4">
          {p.ctaLabel && <button onClick={handleCta} className="px-8 py-3.5 rounded-2xl text-white text-sm font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition hover:scale-105" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button onClick={onClose} className="px-6 py-3.5 rounded-2xl text-white/50 hover:text-white text-sm font-bold transition">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Renderer ────────────────────────────────────────────────────────────

export function PopupRenderer() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [activePopup, setActivePopup] = useState<Popup | null>(null);
  const [minimizedPopup, setMinimizedPopup] = useState<Popup | null>(null);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const pathname = usePathname();
  
  const hasTriggeredRef = useRef<Set<string>>(new Set());
  const timerRefs = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    fetchActivePopups().then(res => {
      if (res.ok) setPopups(res.popups);
    });
  }, []);

  const dismissPopup = useCallback((id: string) => {
    const p = popups.find(x => x._id === id);
    if (p) {
      setMinimizedPopup(p);
    }
    setActivePopup(null);
    hasTriggeredRef.current.add(id);
    trackDismissal(id);
    // Mark in storage based on frequency
    if (p) {
      const key = `af1_popup_${id}`;
      if (p.frequency === 'once_per_session') sessionStorage.setItem(key, 'true');
      if (p.frequency === 'once_per_day') localStorage.setItem(key, new Date().toISOString());
      if (p.frequency === 'once_ever') localStorage.setItem(key, 'true');
    }
  }, [popups]);

  const showPopup = useCallback((p: Popup) => {
    if (activePopup) return; // Only show one at a time
    if (hasTriggeredRef.current.has(p._id)) return;
    
    setActivePopup(p);
    hasTriggeredRef.current.add(p._id);
    trackImpression(p._id);
  }, [activePopup]);

  // Evaluate popups
  useEffect(() => {
    if (authLoading || activePopup) return;

    for (const p of popups) {
      if (hasTriggeredRef.current.has(p._id)) continue;

      // 1. Audience
      if (p.audience === 'logged_in' && !isAuthenticated) continue;
      if (p.audience === 'guests' && isAuthenticated) continue;

      // 2. Frequency
      const key = `af1_popup_${p._id}`;
      if (p.frequency === 'once_per_session' && sessionStorage.getItem(key)) continue;
      if (p.frequency === 'once_ever' && localStorage.getItem(key)) continue;
      if (p.frequency === 'once_per_day') {
        const last = localStorage.getItem(key);
        if (last && (Date.now() - new Date(last).getTime() < 86400000)) continue;
      }

      // 3. Page Target
      if (p.pageTarget === 'homepage' && pathname !== '/') continue;
      if (p.pageTarget === 'shop' && !pathname?.startsWith('/collections')) continue;
      if (p.pageTarget === 'custom' && p.pageTargetPattern) {
        const regex = new RegExp(p.pageTargetPattern.replace('*', '.*'));
        if (!regex.test(pathname || '')) continue;
      }

      // 4. Triggers
      if (p.trigger === 'page_load') {
        const delay = (p.triggerValue || 0) * 1000;
        if (!timerRefs.current[p._id]) {
          timerRefs.current[p._id] = setTimeout(() => showPopup(p), delay);
        }
      }
    }

    return () => {
      Object.values(timerRefs.current).forEach(clearTimeout);
    };
  }, [popups, pathname, authLoading, isAuthenticated, activePopup, showPopup]);

  // Handle Exit Intent & Scroll Percent
  useEffect(() => {
    if (activePopup) return;

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        const eiPopup = popups.find(p => p.trigger === 'exit_intent' && !hasTriggeredRef.current.has(p._id));
        if (eiPopup) showPopup(eiPopup);
      }
    };

    const handleScroll = () => {
      const spPopups = popups.filter(p => p.trigger === 'scroll_percent' && !hasTriggeredRef.current.has(p._id));
      if (spPopups.length > 0) {
        const percent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        for (const p of spPopups) {
          if (percent >= (p.triggerValue || 50)) {
            showPopup(p);
            break; // Show one at a time
          }
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    document.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      document.removeEventListener('scroll', handleScroll);
    };
  }, [popups, activePopup, showPopup]);

  if (!activePopup && !minimizedPopup) return null;

  return (
    <>
      <AnimatePresence>
        {activePopup && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none p-4">
            {activePopup.layout !== 'fullscreen' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto"
              />
            )}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className={`relative z-10 w-full pointer-events-none ${activePopup.layout === 'fullscreen' ? 'h-full flex items-center justify-center' : ''}`}
            >
              <PopupCard p={activePopup} onClose={() => dismissPopup(activePopup._id)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {minimizedPopup && !activePopup && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-6 right-6 z-[9990]"
          >
            <button
              onClick={() => {
                setActivePopup(minimizedPopup);
                setMinimizedPopup(null);
              }}
              className="flex items-center gap-3 px-4 py-3 bg-black text-white rounded-2xl shadow-2xl hover:scale-105 transition group"
              style={{ borderBottom: `2px solid ${minimizedPopup.accentColor || '#ea580c'}` }}
            >
              <Tag className="w-5 h-5 text-white group-hover:rotate-12 transition-transform" />
              <div className="text-left">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/50">{minimizedPopup.type.replace(/_/g, ' ')}</p>
                <p className="text-xs font-bold text-white uppercase tracking-wider">{minimizedPopup.discountCode || 'View Offer'}</p>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
