
"use client";

import React from "react";
import Link from "next/link";
import { ShieldCheck, Lock, Eye, FileText, ChevronRight, Gavel, CheckCircle2, AlertCircle, FileStack } from "lucide-react";

const ICONS: Record<string, any> = {
  Eye: <Eye className="w-6 h-6" />,
  Lock: <Lock className="w-6 h-6" />,
  ShieldCheck: <ShieldCheck className="w-6 h-6" />,
  Gavel: <Gavel className="w-6 h-6" />,
  CheckCircle2: <CheckCircle2 className="w-6 h-6" />,
  AlertCircle: <AlertCircle className="w-6 h-6" />,
};

interface TermsClientProps {
  initialData?: any;
}

export default function TermsClient({ initialData }: TermsClientProps) {
  const data = initialData || {
    title: "Terms & <span class='text-black'>Conditions</span>",
    subtitle: "Review the rules of engagement for utilizing Athletic Force 1 services. These terms ensure a fair and elite experience for all squads.",
    sections: [
      {
        title: "Operational Agreement",
        icon: "Gavel",
        content: "By accessing Athletic Force 1 gear, you enter into a binding tactical agreement. All designs, logos, and technical specifications are the exclusive property of AF1 intelligence."
      },
      {
        title: "Mission Fulfillment",
        icon: "CheckCircle2",
        content: "Orders are processed following a strict operational briefing. Timelines provided are estimates based on current logistics; we prioritize quality over speed to ensure zero failure in the arena."
      },
      {
        title: "Rules of Engagement",
        icon: "AlertCircle",
        content: "Users are prohibited from reverse-engineering AF1 gear or utilizing our tactical branding for unauthorized commercial operations. Any breach of these rules will result in immediate termination of account access."
      }
    ],
    fullProtocol: `
      <h2 class="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-8 border-b border-slate-100 pb-4">Full Protocol Briefing</h2>
      <div class="prose prose-slate max-w-none italic font-medium text-slate-600 space-y-6">
         <p>
            All gear manufactured by Athletic Force 1 is subject to quality control inspections. Due to the custom nature of tactical uniforms, returns are only authorized for manufacturing defects identified within 48 hours of delivery.
         </p>
         <h3 class="text-lg font-black text-slate-900 italic uppercase">Payment Logistics</h3>
         <p>
            Mission deployment begins only after successful budget authorization. We utilize secure payment processing units to ensure financial security for all operations.
         </p>
         <h3 class="text-lg font-black text-slate-900 italic uppercase">Intellectual Property</h3>
         <p>
            AF1 reserves all rights to the designs and technologies integrated into our products. Unauthorized reproduction is a breach of mission protocol and will be met with legal counter-measures.
         </p>
      </div>
    `
  };

  return (
    <main className="bg-[#FAFAFA] min-h-screen pt-10 pb-20">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header Block */}
        <div className="bg-[var(--color-accent)] rounded-[40px] p-10 md:p-16 mb-10 relative overflow-hidden ">
           <div className="absolute top-0 right-0 w-64 h-64 bg-black/10 blur-[100px] -translate-y-1/2 translate-x-1/2" />
           <div className="relative z-10">
              <div className="inline-flex items-center gap-2 text-black text-[10px] font-black uppercase tracking-[0.4em] italic mb-6">
                 <FileStack className="w-4 h-4" />
                 Terms of Operations
              </div>
              <h1 
                className="text-4xl md:text-6xl font-black italic uppercase tracking-tighter text-white mb-6"
                dangerouslySetInnerHTML={{ __html: data.title }}
              />
              <p className="text-white/80 font-medium italic max-w-2xl leading-relaxed">
                {data.subtitle}
              </p>
           </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
           {data.sections.map((term: any, idx: number) => (
             <div key={idx} className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex flex-col md:flex-row gap-8">
                   <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-900 group-hover:bg-black group-hover:text-white transition-all duration-500 shrink-0 shadow-inner">
                      {ICONS[term.icon] || <FileText className="w-6 h-6" />}
                   </div>
                   <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 mb-4">{term.title}</h2>
                      <p className="text-slate-500 font-medium leading-relaxed italic">
                        {term.content}
                      </p>
                   </div>
                </div>
             </div>
           ))}

           {data.fullProtocol && (
             <div className="bg-white rounded-[32px] p-10 md:p-16 border border-slate-100 shadow-sm">
                <div 
                  className="prose prose-slate max-w-none italic font-medium text-slate-600"
                  dangerouslySetInnerHTML={{ __html: data.fullProtocol }}
                />
             </div>
           )}
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
