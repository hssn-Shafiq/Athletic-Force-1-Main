
"use client";

import React from 'react';
import { Settings as SettingsIcon, Bell, Lock, Globe, Mail, Shield } from 'lucide-react';

export const AdminSettings: React.FC = () => {
  return (
    <div className="max-w-4xl space-y-12">
      <div className="space-y-2">
        <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
          System Configuration
        </h1>
        <p className="text-slate-400 font-medium italic text-sm">Managing core backend protocols and operational security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { icon: Globe, title: 'Store Details', desc: 'Manage your storefront URL, name, and regional settings.' },
          { icon: Lock, title: 'Security', desc: 'Control access levels, 2FA, and authorized personnel logs.' },
          { icon: Mail, title: 'Communications', desc: 'Configure email triggers for direct and request orders.' },
          { icon: Bell, title: 'Notifications', desc: 'Internal alerts for low stock and high-value orders.' },
          { icon: Shield, title: 'Permissions', desc: 'Multi-vendor access control and role definitions.' },
          { icon: SettingsIcon, title: 'Advanced', desc: 'API keys, webhooks, and raw data structural exports.' },
        ].map((item, i) => (
          <div key={i} className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm hover:shadow-xl transition-all group cursor-pointer">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center rotate-[-5deg] group-hover:rotate-0 group-hover:bg-black group-hover:text-white transition-all">
                <item.icon className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black italic uppercase tracking-tighter text-slate-900 leading-none">{item.title}</h3>
                <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest leading-relaxed line-clamp-2">{item.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
