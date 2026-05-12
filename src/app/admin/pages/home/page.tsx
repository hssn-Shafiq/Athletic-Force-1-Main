
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
  Image as ImageIcon,
  Type,
  Link as LinkIcon,
  Flag,
  Grid,
  Share2,
  Clock,
  ExternalLink,
  Settings,
  Upload
} from "lucide-react";
import { getPageContentApi, updatePageContentApi } from "@/lib/api/pageContent";
import { MediaLibraryModal } from "@/admin/components/MediaLibraryModal";

export default function HomePageEditor() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [activeMediaTarget, setActiveMediaTarget] = useState<{ type: 'slide' | 'category' | 'social', index: number } | null>(null);

  const [data, setData] = useState({
    slides: [
      { image: "/Hero-Images/hero-1.webp", title: "ATHLETIC FORCE 1", subtitle: "Engineered For Victory" },
      { image: "/Hero-Images/hero-2.webp", title: "CUSTOM GEAR", subtitle: "Designed For Your Team" }
    ],
    promo: {
      discount: "10%",
      offText: "Off",
      text: "On Custom Kit,\nMake It Yours",
      buttonText: "Customize Your Kit",
      link: "/shop"
    },
    topCategories: [
      { title: "Custom Uniforms", image: "/after-hero-categories/Custom-Uniform.webp" },
      { title: "Merchandise", image: "/after-hero-categories/Marchandise.webp" },
      { title: "Accessories", image: "/after-hero-categories/Accessories.webp" },
      { title: "Team Store", image: "/after-hero-categories/Team%20Store.webp" }
    ],
    socialFeed: {
      username: "@AthleticForce1",
      buttonText: "View TikTok",
      cards: [
        { id: '1', title: "Game Day Energy", duration: "1 Min", image: "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=700&auto=format&fit=crop" },
        { id: '2', title: "Cheer Squad Goals", duration: "35 Sec", image: "https://images.unsplash.com/photo-1518611012118-696072aa579a?q=80&w=700&auto=format&fit=crop" },
        { id: '3', title: "Championship Moments", duration: "1 Min", image: "" },
        { id: '4', title: "Training Never Stops", duration: "54 Sec", image: "" },
        { id: '5', title: "7v7 Highlights", duration: "2.5 Min", image: "https://images.unsplash.com/photo-1551958219-acbc608c6377?q=80&w=700&auto=format&fit=crop" }
      ]
    }
  });

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setIsLoading(true);
    const res = await getPageContentApi("home");
    if (res.ok && res.data) {
      setData(res.data);
    }
    setIsLoading(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const res = await updatePageContentApi("home", data);
    if (res.ok) {
      toast.success("Strategic Directives Deployed Successfully");
    } else {
      toast.error(res.message || "Operation Failed");
    }
    setIsSaving(false);
  };

  const openMediaModal = (type: 'slide' | 'category' | 'social', index: number) => {
    setActiveMediaTarget({ type, index });
    setIsMediaModalOpen(true);
  };

  const handleMediaSelect = (item: any) => {
    if (!activeMediaTarget) return;

    const { type, index } = activeMediaTarget;
    const newData = JSON.parse(JSON.stringify(data));

    if (type === 'slide') {
      newData.slides[index].image = item.secureUrl;
    } else if (type === 'category') {
      newData.topCategories[index].image = item.secureUrl;
    } else if (type === 'social') {
      newData.socialFeed.cards[index].image = item.secureUrl;
    }

    setData(newData);
    setIsMediaModalOpen(false);
    setActiveMediaTarget(null);
  };

  const updateSocialCard = (index: number, field: string, value: string) => {
    const next = JSON.parse(JSON.stringify(data));
    next.socialFeed.cards[index][field] = value;
    setData(next);
  };

  const addSocialCard = () => {
    const next = JSON.parse(JSON.stringify(data));
    next.socialFeed.cards.push({ title: "NEW REEL", duration: "0 SEC", image: "" });
    setData(next);
  };

  const removeSocialCard = (index: number) => {
    if (data.socialFeed.cards.length <= 1) {
      toast.warning("At least one social card is required for engagement.");
      return;
    }
    const next = JSON.parse(JSON.stringify(data));
    next.socialFeed.cards.splice(index, 1);
    setData(next);
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
            Home Page Command
          </h1>
          <p className="text-slate-500 text-sm mt-1 font-medium italic">Configure the primary engagement vector for Athletic Force 1.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => router.push('/admin/seo?page=home')}
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

      <div className="grid grid-cols-1 gap-12">
        {/* Hero Slides */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Hero Intelligence</h3>
            </div>
            <button onClick={() => setData({ ...data, slides: [...data.slides, { image: "", title: "NEW SLIDE", subtitle: "" }] } as any)} className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-black transition-colors"><Plus className="w-5 h-5" /></button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {data.slides.map((slide: any, idx) => (
              <div key={idx} className="bg-slate-50 p-6 rounded-3xl relative group border border-transparent hover:border-slate-200 transition-all">
                <button onClick={() => setData({ ...data, slides: data.slides.filter((_, i) => i !== idx) })} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                <div className="space-y-4">
                  <div className="aspect-video w-full bg-white rounded-xl overflow-hidden border border-slate-200 relative group/img">
                    {slide.image ? (
                      <img src={slide.image} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                        <ImageIcon className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase">No Image Deployed</span>
                      </div>
                    )}
                    <button
                      onClick={() => openMediaModal('slide', idx)}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2"
                    >
                      <Upload className="w-6 h-6" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Deploy Asset</span>
                    </button>
                  </div>
                  <input type="text" value={slide.title} onChange={(e) => { const next = [...data.slides]; next[idx].title = e.target.value; setData({ ...data, slides: next }); }} className="w-full bg-white p-3 rounded-xl font-black italic uppercase text-xs outline-none" placeholder="Headline" />
                  <input type="text" value={slide.subtitle} onChange={(e) => { const next = [...data.slides]; next[idx].subtitle = e.target.value; setData({ ...data, slides: next }); }} className="w-full bg-white p-3 rounded-xl font-bold italic text-[10px] outline-none" placeholder="Sub-headline" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Categories */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <Grid className="w-5 h-5 text-orange-600" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Priority Sectors</h3>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.topCategories.map((cat: any, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-2xl space-y-3">
                <div className="aspect-square bg-white rounded-xl overflow-hidden border border-slate-100 shadow-inner relative group/img">
                  <img src={cat.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <button
                    onClick={() => openMediaModal('category', idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-[8px] font-black uppercase">Swap</span>
                  </button>
                </div>
                <input type="text" value={cat.title} onChange={(e) => { const next = [...data.topCategories]; next[idx].title = e.target.value; setData({ ...data, topCategories: next }); }} className="w-full bg-white p-2 rounded-lg font-black italic uppercase text-[9px] text-center outline-none" />
              </div>
            ))}
          </div>
        </div>

        {/* Promo Banner */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
            <Flag className="w-5 h-5 text-orange-600" />
            <h3 className="text-xl font-black italic uppercase tracking-tighter">Tactical Promo Banner</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic block">Discount Value</label>
              <input type="text" value={data.promo.discount} onChange={(e) => setData({ ...data, promo: { ...data.promo, discount: e.target.value } })} className="w-full bg-slate-50 p-4 rounded-2xl font-black text-2xl italic text-orange-600 outline-none" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic block">Headline Text (Use \n for new line)</label>
              <textarea rows={2} value={data.promo.text} onChange={(e) => setData({ ...data, promo: { ...data.promo, text: e.target.value } })} className="w-full bg-slate-50 p-4 rounded-2xl font-bold text-sm outline-none resize-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic block">Button Text</label>
              <input type="text" value={data.promo.buttonText} onChange={(e) => setData({ ...data, promo: { ...data.promo, buttonText: e.target.value } })} className="w-full bg-slate-50 p-4 rounded-2xl font-black uppercase italic text-[10px] outline-none" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 italic block">Action URL</label>
              <input type="text" value={data.promo.link} onChange={(e) => setData({ ...data, promo: { ...data.promo, link: e.target.value } })} className="w-full bg-slate-50 p-4 rounded-2xl font-mono text-[10px] outline-none" />
            </div>
          </div>
        </div>

        {/* Social Feed */}
        <div className="bg-white rounded-[40px] border border-slate-100 p-10 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-50">
            <div className="flex items-center gap-3">
              <Share2 className="w-5 h-5 text-orange-600" />
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Social Recon Feed</h3>
            </div>
            <div className="flex gap-4 items-center">
              <button
                onClick={addSocialCard}
                className="p-2 bg-slate-50 rounded-xl text-slate-400 hover:text-black transition-colors"
                title="Add New Reel"
              >
                <Plus className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <span className="text-[9px] font-black text-slate-400">@</span>
                <input type="text" value={data.socialFeed.username} onChange={(e) => setData({ ...data, socialFeed: { ...data.socialFeed, username: e.target.value } })} className="bg-transparent font-black italic text-[10px] outline-none w-28" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {data.socialFeed.cards.map((card: any, idx) => (
              <div key={idx} className="bg-slate-50 p-4 rounded-2xl space-y-3 relative group">
                <button
                  onClick={() => removeSocialCard(idx)}
                  className="absolute top-2 right-2 z-10 p-1.5 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
                <div className="aspect-[9/16] bg-white rounded-xl overflow-hidden border border-slate-100 relative shadow-sm group/img">
                  {card.image ? <img src={card.image} className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center"><ImageIcon className="text-slate-300" /></div>}
                  <button
                    onClick={() => openMediaModal('social', idx)}
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[7px] font-black uppercase">Swap</span>
                  </button>
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-300" />
                    <input type="text" value={card.duration} onChange={(e) => updateSocialCard(idx, 'duration', e.target.value)} className="w-full bg-white p-1 rounded font-bold text-[8px] outline-none" />
                  </div>
                  <input type="text" value={card.title} onChange={(e) => updateSocialCard(idx, 'title', e.target.value)} className="w-full bg-white p-1 rounded font-black italic uppercase text-[9px] outline-none" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end my-10 gap-4">
        <button
          onClick={() => router.push('/admin/seo?page=home')}
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

      <MediaLibraryModal
        isOpen={isMediaModalOpen}
        onClose={() => setIsMediaModalOpen(false)}
        onSelect={handleMediaSelect}
        folder="PagesMedia/Home"
        title="Home Page Tactical Assets"
      />
    </div>
  );
}
