"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  AlertTriangle, 
  TrendingDown, 
  Package, 
  Box,
  RotateCcw,
  RefreshCw,
  X,
  Loader2,
  Check,
  ChevronRight,
  Database
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';
import { AnimatePresence, motion } from 'framer-motion';

// ─── Variant Stock Row Component ──────────────────────────────────────────────
const VariantStockRow = ({ variant, productId, onUpdate }: { variant: any, productId: string, onUpdate: () => void }) => {
  const [adjustment, setAdjustment] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleRestock = async () => {
    if (adjustment === 0) return;
    setIsSaving(true);
    try {
      const res = await apiClient.post('/api/admin/inventory/restock', {
        productId,
        sku: variant.sku,
        adjustment
      });
      if (res.data.ok) {
        toast.success(`Updated ${variant.sku}`);
        setAdjustment(0);
        onUpdate();
      }
    } catch (err) {
      toast.error("Update failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all group">
      <div className="flex-1">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{variant.sku}</p>
        <p className="text-sm font-black text-slate-900">{variant.variantName}</p>
        <div className="flex items-center gap-4 mt-1">
           <span className="text-[10px] font-bold text-slate-500 italic">Stock: <span className={variant.currentStock < 10 ? 'text-orange-600 font-black' : 'text-slate-900'}>{variant.currentStock}</span></span>
           <span className="text-[10px] font-bold text-slate-500 italic">Commitments: <span className="text-slate-900">{variant.commitments}</span></span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <input 
            type="number" 
            value={adjustment || ''}
            onChange={(e) => setAdjustment(parseInt(e.target.value) || 0)}
            placeholder="± Add"
            className="w-20 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-black outline-none focus:border-orange-500 transition-all text-center"
          />
        </div>
        <button 
          onClick={handleRestock}
          disabled={adjustment === 0 || isSaving}
          className="p-2 bg-black text-white rounded-xl hover:bg-orange-600 transition-all disabled:opacity-20 disabled:hover:bg-black"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

// ─── Manage Stock Modal Component ──────────────────────────────────────────────
const ManageStockModal = ({ 
  isOpen, 
  onClose, 
  product, 
  onUpdate 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  product: any; 
  onUpdate: () => void;
}) => {
  const [innerSearch, setInnerSearch] = useState('');

  if (!isOpen || !product) return null;

  const filteredVariants = product.variants
    .filter((v: any) => 
      v.sku.toLowerCase().includes(innerSearch.toLowerCase()) || 
      v.variantName.toLowerCase().includes(innerSearch.toLowerCase())
    )
    .sort((a: any, b: any) => {
      // Prioritize low stock (< 10)
      const aLow = a.currentStock < 10 ? 0 : 1;
      const bLow = b.currentStock < 10 ? 0 : 1;
      if (aLow !== bLow) return aLow - bLow;
      return a.currentStock - b.currentStock;
    });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-2xl rounded-[40px] shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
      >
        <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
               <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase italic tracking-tighter text-slate-900 leading-none">{product.name}</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 italic">{product.skuCount} SKUs</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-8 py-4 border-b border-slate-50 shrink-0">
           <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search variant or SKU..." 
                value={innerSearch}
                onChange={(e) => setInnerSearch(e.target.value)}
                className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-3 pl-12 pr-4 outline-none text-xs font-bold transition-all"
              />
           </div>
        </div>

        <div className="p-8 overflow-y-auto no-scrollbar space-y-4">
          {filteredVariants.length === 0 ? (
            <div className="py-12 text-center text-slate-400 italic font-black uppercase tracking-widest text-xs">No variations found</div>
          ) : (
            filteredVariants.map((v: any) => (
              <VariantStockRow 
                key={v.sku} 
                variant={v} 
                productId={product.id} 
                onUpdate={onUpdate} 
              />
            ))
          )}
        </div>

        <div className="p-6 bg-slate-50 flex items-center justify-between shrink-0 px-8">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Low Stock Priority Active</span>
           </div>
           <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Units: {product.totalStock}</p>
        </div>
      </motion.div>
    </div>
  );
};

export const AdminInventory: React.FC = () => {
  const [items, setItems] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchInventory = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [sumRes, itemsRes] = await Promise.all([
        apiClient.get('/api/admin/inventory/summary'),
        apiClient.get(`/api/admin/inventory/items?search=${search}`)
      ]);
      if (sumRes.data.ok) setSummary(sumRes.data.summary);
      if (itemsRes.data.ok) setItems(itemsRes.data.items);
      
      // If modal is open, update the selected product state to reflect changes
      if (isModalOpen && selectedProduct) {
        const updated = itemsRes.data.items.find((i: any) => i.id === selectedProduct.id);
        if (updated) setSelectedProduct(updated);
      }
    } catch (err) {
      console.error('Inventory fetch failed', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchInventory();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
            Inventory Terminal
          </h1>
          <p className="text-slate-400 font-medium italic text-sm">Aggregated stock control across all product lines.</p>
        </div>
        <div className="flex gap-4">
          <button 
            onClick={() => fetchInventory()}
            disabled={isLoading}
            className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center justify-center hover:bg-slate-50 transition-all shadow-sm"
          >
            <RotateCcw className={`w-5 h-5 text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <Link href="/admin/products" className="bg-black text-white px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter text-sm flex items-center gap-2 hover:scale-105 transition-all shadow-xl">
            <Plus className="w-5 h-5" />
            <span>New Product</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Out of Stock', key: 'outOfStock', color: 'bg-red-500', icon: AlertTriangle },
          { label: 'Low Stock Items', key: 'lowStock', color: 'bg-orange-500', icon: TrendingDown },
          { label: 'Total Units', key: 'totalUnits', color: 'bg-black', icon: Box },
          { label: 'Valuation', key: 'valuation', color: 'bg-[#FF7348]', icon: Package },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[30px] border border-slate-100 shadow-sm space-y-3">
             <div className="flex items-center justify-between">
              <div className={`p-2 rounded-xl ${stat.color} rotate-[-5deg]`}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest italic">{stat.label}</p>
              {isLoading || !summary ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <h4 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">{summary[stat.key]}</h4>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[40px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between">
           <h3 className="text-xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-2">
             <Database className="w-5 h-5 text-orange-600" />
             Master Catalog
           </h3>
           <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search product name..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-xl py-2 pl-12 pr-4 w-64 outline-none text-xs font-medium transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left min-w-200">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Product</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Variations</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Total Levels</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">Commitments</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-slate-400 italic text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
                         <Skeleton className="h-5 w-40" />
                      </div>
                    </td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-16" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-32" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-6 w-12" /></td>
                    <td className="px-8 py-6"><Skeleton className="h-10 w-32 mx-auto rounded-xl" /></td>
                  </tr>
                ))
              ) : items.length === 0 ? (
                <tr>
                   <td colSpan={5} className="py-20 text-center text-slate-400 italic font-black uppercase tracking-widest">No matching products</td>
                </tr>
              ) : (
                items.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-slate-100 bg-slate-50 shrink-0 relative">
                           <img src={product.thumbnail} alt="" className="w-full h-full object-cover" />
                           {product.hasOutOfStock && (
                              <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px] flex items-center justify-center">
                                 <AlertTriangle className="w-4 h-4 text-white drop-shadow-md" />
                              </div>
                           )}
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h5 className="font-black italic uppercase tracking-tighter text-slate-900 line-clamp-1">{product.name}</h5>
                            {product.hasOutOfStock ? (
                               <span className="px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-md animate-pulse">Out of Stock</span>
                            ) : product.hasLowStock ? (
                               <span className="px-2 py-0.5 bg-orange-500 text-white text-[8px] font-black uppercase tracking-widest rounded-md">Low Stock</span>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black uppercase tracking-widest italic">{product.skuCount} SKUs</span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1.5 w-24 bg-slate-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full bg-slate-900`} 
                            style={{ width: `${Math.min(100, (product.totalStock / 200) * 100)}%` }}
                          />
                        </div>
                        <span className="font-black italic tracking-tighter text-sm text-slate-900">{product.totalStock}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-bold text-slate-600 italic">{product.totalCommitments}</td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        onClick={() => {
                          setSelectedProduct(product);
                          setIsModalOpen(true);
                        }}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-xl shadow-sm hover:bg-black hover:text-white transition-all text-[10px] font-black uppercase italic tracking-widest"
                      >
                        Manage Variants
                        <ChevronRight className="w-4 h-4 translate-x-0 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <ManageStockModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            product={selectedProduct}
            onUpdate={() => fetchInventory(true)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};
