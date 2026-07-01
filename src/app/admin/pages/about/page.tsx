
"use client";

import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";
import { 
  Save, 
  RefreshCcw, 
  Plus, 
  Trash2, 
  Layout, 
  Layers,
  History,
  Activity,
  Search,
  Image as ImageIcon,
  Settings
} from "lucide-react";
import { getPageContentApi, updatePageContentApi } from "@/lib/api/pageContent";
import { MediaLibraryModal } from "@/admin/components/MediaLibraryModal";

export default function AboutPageEditor() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<{type: string, index?: number} | null>(null);

  const [data, setData] = useState({
    heroTitle: "About Athletic Force 1",
    mission: "We don't just make uniforms. We forge identity. Athletic Force 1 was founded on the belief that every team deserves gear as elite as their ambition.",
    stats: [
      { label: "Elite Squads", value: "500+" },
      { label: "Global Brands", value: "500+" },
      { label: "Win Rate", value: "98%" },
      { label: "Ops Support", value: "24/7" },
    ],
    timeline: [
      { year: "2018", title: "The Inception", desc: "Athletic Force 1 is born from a garage with a single mission: to revolutionize custom athletic gear." },
      { year: "2020", title: "The Expansion", desc: "We scaled our manufacturing capabilities and partnered with our first 100 professional squads." },
      { year: "2022", title: "The Evolution", desc: "Launched our tactical digital platform, bringing elite design tools to every coach and athlete." },
      { year: "2024", title: "The Dominance", desc: "Now the industry standard for premium, high-speed custom uniforms across all major sports." },
    ]
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setIsLoading(true);
    const res = await getPageContentApi("about");
    if (res.ok && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updatePageContentApi("about", data);
    if (res.ok) {
      toast.success("Operational Intel Updated Successfully");
    } else {
      toast.error(res.message || "Failed to update content");
    }
    setIsSaving(false);
  };

  const handleMediaSelect = (item: any) => {
    setIsMediaModalOpen(false);
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
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-3">
            <Layout className="w-8 h-8 text-orange-600" />
            About Page Command
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Configure the tactical narrative for your organization.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/admin/seo?page=about')}
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
            Deploy Updates
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8">
        {/* Hero Section */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <Layers className="w-5 h-5 text-orange-600" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Hero & Mission</h3>
          </div>
          
          <div className="space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2 block">Hero Title</label>
              <input 
                type="text" 
                value={data.heroTitle}
                onChange={(e) => setData({ ...data, heroTitle: e.target.value })}
                className="w-full bg-slate-50 border border-transparent focus:border-slate-100 p-4 rounded-2xl font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic mb-2 block">Mission Statement</label>
              <textarea 
                rows={4}
                value={data.mission}
                onChange={(e) => setData({ ...data, mission: e.target.value })}
                className="w-full bg-slate-50 border border-transparent focus:border-slate-100 p-4 rounded-2xl font-bold text-slate-900 outline-none resize-none"
              />
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Operational Stats</h3>
            </div>
            <button 
              onClick={() => setData({ ...data, stats: [...data.stats, { label: "", value: "" }] })}
              className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-black transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.stats.map((stat, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-3xl relative group">
                <button 
                  onClick={() => setData({ ...data, stats: data.stats.filter((_, i) => i !== idx) })}
                  className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Label</label>
                    <input 
                      type="text" 
                      value={stat.label}
                      onChange={(e) => {
                        const next = [...data.stats];
                        next[idx].label = e.target.value;
                        setData({...data, stats: next});
                      }}
                      className="w-full bg-white p-3 rounded-xl font-black italic uppercase text-xs outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Value</label>
                    <input 
                      type="text" 
                      value={stat.value}
                      onChange={(e) => {
                        const next = [...data.stats];
                        next[idx].value = e.target.value;
                        setData({...data, stats: next});
                      }}
                      className="w-full bg-white p-3 rounded-xl font-black italic text-xs outline-none"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Tactical Journey</h3>
            </div>
            <button 
              onClick={() => setData({ ...data, timeline: [...data.timeline, { year: "", title: "", desc: "" }] })}
              className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-black transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-6">
            {data.timeline.map((item, idx) => (
              <div key={idx} className="bg-slate-50 p-8 rounded-[32px] relative group border border-transparent hover:border-slate-200 transition-all">
                <button 
                  onClick={() => setData({ ...data, timeline: data.timeline.filter((_, i) => i !== idx) })}
                  className="absolute top-6 right-6 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="md:col-span-1">
                    <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Year</label>
                    <input 
                      type="text" 
                      value={item.year}
                      onChange={(e) => {
                        const next = [...data.timeline];
                        next[idx].year = e.target.value;
                        setData({...data, timeline: next});
                      }}
                      className="w-full bg-white p-3 rounded-xl font-black italic text-xs outline-none"
                    />
                  </div>
                  <div className="md:col-span-3 space-y-4">
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Title</label>
                      <input 
                        type="text" 
                        value={item.title}
                        onChange={(e) => {
                          const next = [...data.timeline];
                          next[idx].title = e.target.value;
                          setData({...data, timeline: next});
                        }}
                        className="w-full bg-white p-3 rounded-xl font-black italic uppercase text-xs outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1 block">Description</label>
                      <textarea 
                        rows={2}
                        value={item.desc}
                        onChange={(e) => {
                          const next = [...data.timeline];
                          next[idx].desc = e.target.value;
                          setData({...data, timeline: next});
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
      </div>

      <MediaLibraryModal 
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
        folder="PagesMedia/About"
        title="About Page Media Assets"
      />
    </div>
  );
}
