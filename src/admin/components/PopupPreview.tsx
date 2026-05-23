"use client";

import React from 'react';
import type { Popup, PopupLayout, PopupSize } from '@/lib/api/popups';

// ─── Countdown mini-display ───────────────────────────────────────────────────
function CountdownDisplay({ deadline }: { deadline?: string }) {
  const [time, setTime] = React.useState({ d: 0, h: 0, m: 0, s: 0 });
  React.useEffect(() => {
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
        <div key={String(label)} className="flex flex-col items-center">
          <div className="bg-black/30 rounded px-1.5 py-0.5 text-white font-black text-sm tabular-nums">{pad(Number(val))}</div>
          <span className="text-[8px] text-white/60 font-bold uppercase mt-0.5">{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Size class helper ────────────────────────────────────────────────────────
function getSizeClass(size: PopupSize) {
  return size === 'small' ? 'max-w-sm' : size === 'large' ? 'max-w-2xl' : 'max-w-lg';
}

// ─── Template preview renderers ───────────────────────────────────────────────

function MinimalPreview({ p }: { p: Partial<Popup> }) {
  return (
    <div className={`${getSizeClass(p.size || 'medium')} w-full mx-auto bg-white rounded-3xl shadow-2xl border-t-4 overflow-hidden`}
      style={{ borderColor: p.accentColor || '#ea580c' }}>
      <div className="p-8">
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: p.accentColor || '#ea580c' }}>
          {p.type?.replace(/_/g, ' ')}
        </p>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">{p.title || 'Your Headline Here'}</h2>
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
            <input readOnly placeholder={p.emailPlaceholder || 'Enter your email'} className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none" />
            <button className="px-4 py-2 rounded-xl text-white text-xs font-black uppercase" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-3">
          {p.ctaLabel && <button className="px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-widest" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button className="px-4 py-2.5 rounded-xl text-slate-400 text-xs font-bold">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );
}

function BoldPreview({ p }: { p: Partial<Popup> }) {
  return (
    <div className={`${getSizeClass(p.size || 'medium')} w-full mx-auto rounded-3xl shadow-2xl overflow-hidden`}
      style={{ background: `linear-gradient(135deg, #0f0f0f 0%, #1c1c1c 100%)` }}>
      <div className="relative p-8">
        <div className="absolute top-0 right-0 w-40 h-40 rounded-full opacity-20 blur-3xl" style={{ background: p.accentColor || '#ea580c' }} />
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: p.accentColor || '#ea580c' }}>
          ⚡ {p.type?.replace(/_/g, ' ')}
        </p>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">{p.title || 'Big Bold Headline'}</h2>
        {p.subtitle && <p className="text-sm text-white/60 font-medium mb-4">{p.subtitle}</p>}
        {p.showCountdown && p.countdownDeadline && <div className="mb-4"><CountdownDisplay deadline={p.countdownDeadline} /></div>}
        {p.discountCode && (
          <div className="inline-flex items-center gap-2 border rounded-xl px-4 py-2 mb-4" style={{ borderColor: p.accentColor || '#ea580c' }}>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Code:</span>
            <span className="text-base font-black tracking-widest" style={{ color: p.accentColor || '#ea580c' }}>{p.discountCode}</span>
          </div>
        )}
        {p.showEmailCapture && (
          <div className="flex gap-2 mb-4">
            <input readOnly placeholder={p.emailPlaceholder || 'Enter your email'} className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-sm text-white outline-none" />
            <button className="px-4 py-2 rounded-xl text-white text-xs font-black uppercase" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-3">
          {p.ctaLabel && <button className="px-6 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest shadow-lg" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button className="px-4 py-3 rounded-xl text-white/40 text-xs font-bold">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );
}

function DarkPreview({ p }: { p: Partial<Popup> }) {
  return (
    <div className={`${getSizeClass(p.size || 'medium')} w-full mx-auto rounded-3xl shadow-2xl overflow-hidden bg-slate-900 border border-slate-700`}>
      <div className="h-1.5 w-full" style={{ background: `linear-gradient(90deg, ${p.accentColor || '#ea580c'}, #dc2626)` }} />
      <div className="p-8">
        <p className="text-[9px] font-black uppercase tracking-widest mb-3" style={{ color: p.accentColor || '#ea580c' }}>
          {p.type?.replace(/_/g, ' ')}
        </p>
        <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">{p.title || 'Dark Mode Popup'}</h2>
        {p.subtitle && <p className="text-sm text-slate-400 font-medium mb-4">{p.subtitle}</p>}
        {p.showCountdown && p.countdownDeadline && <div className="mb-4"><CountdownDisplay deadline={p.countdownDeadline} /></div>}
        {p.discountCode && (
          <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2 mb-4 w-fit">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Code:</span>
            <span className="text-sm font-black tracking-widest" style={{ color: p.accentColor || '#ea580c' }}>{p.discountCode}</span>
          </div>
        )}
        {p.showEmailCapture && (
          <div className="flex gap-2 mb-4">
            <input readOnly placeholder={p.emailPlaceholder || 'Enter your email'} className="flex-1 px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white outline-none" />
            <button className="px-4 py-2 rounded-xl text-white text-xs font-black uppercase" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-3">
          {p.ctaLabel && <button className="px-6 py-2.5 rounded-xl text-white text-xs font-black uppercase tracking-widest" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button className="px-4 py-2.5 rounded-xl text-slate-600 text-xs font-bold">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );
}

function SplitPreview({ p }: { p: Partial<Popup> }) {
  return (
    <div className={`${getSizeClass(p.size || 'medium')} w-full mx-auto rounded-3xl shadow-2xl overflow-hidden bg-white flex`}>
      {/* Image side */}
      <div className="w-2/5 shrink-0 relative flex items-center justify-center" style={{ background: `linear-gradient(135deg, #0f0f0f, #2d2d2d)` }}>
        {p.imageUrl ? (
          <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="text-center p-6">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-2 flex items-center justify-center" style={{ background: p.accentColor || '#ea580c' }}>
              <span className="text-white font-black text-2xl italic">A</span>
            </div>
            <p className="text-white/40 text-[9px] font-black uppercase tracking-widest">Image here</p>
          </div>
        )}
      </div>
      {/* Content side */}
      <div className="flex-1 p-6">
        <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: p.accentColor || '#ea580c' }}>{p.type?.replace(/_/g, ' ')}</p>
        <h2 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 mb-2">{p.title || 'Split Layout'}</h2>
        {p.subtitle && <p className="text-xs text-slate-500 mb-3">{p.subtitle}</p>}
        {p.showCountdown && p.countdownDeadline && <div className="mb-3"><CountdownDisplay deadline={p.countdownDeadline} /></div>}
        {p.discountCode && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 mb-3 w-fit">
            <span className="text-[9px] font-black text-slate-500 uppercase">Code:</span>
            <span className="text-xs font-black" style={{ color: p.accentColor || '#ea580c' }}>{p.discountCode}</span>
          </div>
        )}
        {p.showEmailCapture && (
          <div className="flex flex-col gap-2 mb-3">
            <input readOnly placeholder={p.emailPlaceholder || 'Enter your email'} className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none" />
            <button className="px-3 py-2 rounded-xl text-white text-[10px] font-black uppercase" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-2 flex-wrap">
          {p.ctaLabel && <button className="px-4 py-2 rounded-xl text-white text-[10px] font-black uppercase" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button className="px-3 py-2 rounded-xl text-slate-400 text-[10px] font-bold">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );
}

function FullscreenPreview({ p }: { p: Partial<Popup> }) {
  return (
    <div className="w-full mx-auto rounded-3xl shadow-2xl overflow-hidden relative min-h-[280px] flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 60%, #2a1a0a 100%)' }}>
      {p.imageUrl && <img src={p.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />}
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, rgba(0,0,0,0.85), rgba(0,0,0,0.5))` }} />
      <div className="relative z-10 text-center p-10">
        <p className="text-[9px] font-black uppercase tracking-widest mb-4" style={{ color: p.accentColor || '#ea580c' }}>{p.type?.replace(/_/g, ' ')}</p>
        <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-3">{p.title || 'Fullscreen Impact'}</h2>
        {p.subtitle && <p className="text-sm text-white/60 mb-4 max-w-sm mx-auto">{p.subtitle}</p>}
        {p.showCountdown && p.countdownDeadline && <div className="mb-4"><CountdownDisplay deadline={p.countdownDeadline} /></div>}
        {p.discountCode && (
          <div className="inline-flex items-center gap-2 border rounded-xl px-5 py-2 mb-4" style={{ borderColor: p.accentColor || '#ea580c' }}>
            <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">Code:</span>
            <span className="text-lg font-black tracking-widest" style={{ color: p.accentColor || '#ea580c' }}>{p.discountCode}</span>
          </div>
        )}
        {p.showEmailCapture && (
          <div className="flex gap-2 max-w-sm mx-auto mb-4">
            <input readOnly placeholder={p.emailPlaceholder || 'Enter your email'} className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-sm text-white outline-none" />
            <button className="px-5 py-2.5 rounded-xl text-white text-xs font-black uppercase" style={{ background: p.accentColor || '#ea580c' }}>{p.emailButtonLabel || 'Subscribe'}</button>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          {p.ctaLabel && <button className="px-8 py-3 rounded-2xl text-white text-xs font-black uppercase tracking-widest shadow-xl" style={{ background: p.accentColor || '#ea580c' }}>{p.ctaLabel}</button>}
          <button className="px-5 py-3 rounded-2xl text-white/40 text-xs font-bold">{p.dismissLabel || 'No thanks'}</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function PopupPreview({ popup }: { popup: Partial<Popup> }) {
  const layout = popup.layout || 'bold';
  return (
    <div className="w-full">
      {layout === 'minimal'    && <MinimalPreview p={popup} />}
      {layout === 'bold'       && <BoldPreview p={popup} />}
      {layout === 'dark'       && <DarkPreview p={popup} />}
      {layout === 'split_image'&& <SplitPreview p={popup} />}
      {layout === 'fullscreen' && <FullscreenPreview p={popup} />}
    </div>
  );
}
