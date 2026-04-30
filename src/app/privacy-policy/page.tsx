"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, ChevronRight } from "lucide-react";

export default function PrivacyPolicyPage() {
  const sections = [
    {
      title: "Data Intelligence Gathering",
      icon: <Eye className="w-6 h-6" />,
      content: "We collect only the essential intelligence required to fulfill your tactical gear orders and improve your operational experience on our platform. This includes contact details, shipping coordinates, and performance preferences."
    },
    {
      title: "Operational Security",
      icon: <Lock className="w-6 h-6" />,
      content: "Your data is protected by military-grade encryption protocols. We treat your personal intelligence as classified information and never authorize third-party access without your explicit operational consent."
    },
    {
      title: "Strategic Use of Intel",
      icon: <ShieldCheck className="w-6 h-6" />,
      content: "Collected intel is used strictly for mission fulfillment: processing orders, coordinating logistics with transport units, and providing you with critical updates regarding your gear's status."
    }
  ];

  return (
    <main className="bg-[#f3f3f3] min-h-screen pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Block */}
        <div className="bg-black rounded-[40px] p-10 md:p-16 mb-10 relative overflow-hidden shadow-2xl">
           <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF5A2A]/20 blur-[100px] -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-[#FF5A2A] text-[10px] font-black uppercase tracking-[0.4em] italic mb-6">
                 <FileText className="w-4 h-4" />
                 Legal Intelligence
              </div>
              <h1 className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-6">
                Privacy <span className="text-[#FF5A2A]">Policy</span>
              </h1>
              <p className="text-slate-400 font-medium italic max-w-2xl leading-relaxed">
                At Athletic Force 1, we value your privacy as much as your performance. This briefing outlines how we handle and protect your operational data.
              </p>
           </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
           {sections.map((section, idx) => (
             <div key={idx} className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row gap-8">
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-[#FF5A2A] group-hover:bg-[#FF5A2A] group-hover:text-white transition-all duration-500 shrink-0 shadow-inner">
                      {section.icon}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-4">{section.title}</h2>
                      <p className="text-slate-500 font-medium leading-relaxed italic">
                        {section.content}
                      </p>
                   </div>
                </div>
             </div>
           ))}

           <div className="bg-white rounded-[32px] p-10 md:p-16 border border-slate-100 shadow-sm">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-8 border-b border-slate-100 pb-4">Standard Legal Terms</h2>
              <div className="prose prose-slate max-w-none italic font-medium text-slate-600 space-y-6">
                 <p>
                    By utilizing the Athletic Force 1 platform, you acknowledge and agree to the terms outlined in this operational briefing. We reserve the right to update these protocols as the strategic landscape evolves.
                 </p>
                 <h3 className="text-lg font-black text-slate-900 italic uppercase">Cookie Logistics</h3>
                 <p>
                    Our site utilizes minor tracking units (cookies) to maintain your session integrity and remember your gear preferences during deployment.
                 </p>
                 <h3 className="text-lg font-black text-slate-900 italic uppercase">Contact HQ</h3>
                 <p>
                    If you have questions regarding your data security, contact our security bureau at: <span className="text-[#FF5A2A]">legal@athleticforce1.com</span>
                 </p>
              </div>
           </div>
        </div>

        {/* Back Link */}
        <div className="mt-12 text-center">
           <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-black transition-colors italic">
              Return to Operations HQ
              <ChevronRight className="w-4 h-4" />
           </Link>
        </div>
      </div>
    </main>
  );
}
