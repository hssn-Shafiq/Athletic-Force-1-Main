
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { 
  Save, 
  RefreshCcw, 
  Plus, 
  Trash2, 
  FileText, 
  Settings,
  ArrowLeft,
  Layout,
  Eye,
  Lock,
  ShieldCheck,
  Gavel,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { getPageContentApi, updatePageContentApi } from "@/lib/api/pageContent";
import dynamic from "next/dynamic";
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const ICONS = {
  Eye: <Eye className="w-4 h-4" />,
  Lock: <Lock className="w-4 h-4" />,
  ShieldCheck: <ShieldCheck className="w-4 h-4" />,
  Gavel: <Gavel className="w-4 h-4" />,
  CheckCircle2: <CheckCircle2 className="w-4 h-4" />,
  AlertCircle: <AlertCircle className="w-4 h-4" />,
};

export default function LegalPageEditor() {
  const { pageKey } = useParams();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const isPrivacy = pageKey === 'privacy';
  const pageTitle = isPrivacy ? "Privacy Policy" : "Terms & Conditions";

  const [data, setData] = useState({
    title: pageTitle,
    subtitle: isPrivacy 
      ? "At Athletic Force 1, we value your privacy as much as your performance." 
      : "Review the rules of engagement for utilizing Athletic Force 1 services.",
    sections: isPrivacy ? [
      { title: "Data Intelligence Gathering", icon: "Eye", content: "We collect only the essential intelligence required..." },
      { title: "Operational Security", icon: "Lock", content: "Your data is protected by military-grade encryption..." },
      { title: "Strategic Use of Intel", icon: "ShieldCheck", content: "Collected intel is used strictly for mission fulfillment..." }
    ] : [
      { title: "Operational Agreement", icon: "Gavel", content: "By accessing Athletic Force 1 gear, you enter into a binding tactical agreement..." },
      { title: "Mission Fulfillment", icon: "CheckCircle2", content: "Orders are processed following a strict operational briefing..." },
      { title: "Rules of Engagement", icon: "AlertCircle", content: "Users are prohibited from reverse-engineering AF1 gear..." }
    ],
    fullProtocol: ""
  });

  useEffect(() => {
    fetchContent();
  }, [pageKey]);

  const fetchContent = async () => {
    setIsLoading(true);
    const res = await getPageContentApi(pageKey as string);
    if (res.ok && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updatePageContentApi(pageKey as string, data);
    if (res.ok) {
      toast.success(`${pageTitle} Updated Successfully`);
    } else {
      toast.error(res.message || "Failed to update content");
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto pb-20">
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-3 bg-white border border-slate-100 rounded-2xl hover:bg-slate-50 transition-all shadow-sm">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
              <FileText className="w-8 h-8 text-orange-600" />
              {pageTitle} Editor
            </h1>
            <p className="text-slate-500 text-sm mt-1 font-medium italic">Configure legal briefings and operational protocols.</p>
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => router.push(`/admin/seo?page=${pageKey}`)}
            className="px-6 py-4 rounded-2xl border border-slate-200 font-black uppercase italic tracking-widest text-[10px] flex items-center gap-3 hover:bg-slate-50 transition-all"
          >
            <Settings className="w-4 h-4" />
            Manage SEO
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-widest text-[10px] flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-2xl shadow-black/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Header Section */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <Layout className="w-5 h-5 text-orange-600" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Header Briefing</h3>
          </div>
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2 block">Hero Title (Rich Text Support)</label>
              <input 
                type="text" 
                value={data.title}
                onChange={(e) => setData({ ...data, title: e.target.value })}
                className="w-full bg-slate-50 border border-transparent focus:border-slate-100 p-4 rounded-2xl font-black italic uppercase text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2 block">Briefing Description</label>
              <textarea 
                rows={3}
                value={data.subtitle}
                onChange={(e) => setData({ ...data, subtitle: e.target.value })}
                className="w-full bg-slate-50 border border-transparent focus:border-slate-100 p-4 rounded-2xl font-bold text-slate-900 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Tactical Sections */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Operational Sections</h3>
            </div>
            <button 
              onClick={() => setData({ ...data, sections: [...data.sections, { title: "", icon: "Eye", content: "" }] })}
              className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-black transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {data.sections.map((section, idx) => (
              <div key={idx} className="bg-slate-50 p-8 rounded-[32px] relative group border border-transparent hover:border-slate-200 transition-all">
                <button 
                  onClick={() => setData({ ...data, sections: data.sections.filter((_, i) => i !== idx) })}
                  className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1 space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Sector Icon</label>
                      <select 
                        value={section.icon}
                        onChange={(e) => {
                          const next = [...data.sections];
                          next[idx].icon = e.target.value;
                          setData({...data, sections: next});
                        }}
                        className="w-full bg-white p-3 rounded-xl font-black italic uppercase text-[10px] outline-none"
                      >
                        {Object.keys(ICONS).map(k => <option key={k} value={k}>{k}</option>)}
                      </select>
                    </div>
                    <div className="flex items-center justify-center h-20 bg-white rounded-xl border border-slate-100 text-orange-600">
                      {(ICONS as any)[section.icon]}
                    </div>
                  </div>
                  <div className="md:col-span-3 space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Section Title</label>
                      <input 
                        type="text" 
                        value={section.title}
                        onChange={(e) => {
                          const next = [...data.sections];
                          next[idx].title = e.target.value;
                          setData({...data, sections: next});
                        }}
                        className="w-full bg-white p-3 rounded-xl font-black italic uppercase text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Briefing Content</label>
                      <textarea 
                        rows={3}
                        value={section.content}
                        onChange={(e) => {
                          const next = [...data.sections];
                          next[idx].content = e.target.value;
                          setData({...data, sections: next});
                        }}
                        className="w-full bg-white p-3 rounded-xl font-bold italic text-xs outline-none resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full Protocol Editor */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <Gavel className="w-5 h-5 text-orange-600" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Full Protocol Briefing (Rich Text)</h3>
          </div>
          <div className="min-h-[300px]">
             <ReactQuill 
                theme="snow" 
                value={data.fullProtocol} 
                onChange={(val) => setData({ ...data, fullProtocol: val })}
                className="h-[250px] mb-12"
             />
          </div>
        </div>
      </div>
    </div>
  );
}
