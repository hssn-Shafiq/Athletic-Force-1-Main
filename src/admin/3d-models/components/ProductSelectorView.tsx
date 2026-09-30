import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  X,
  Box,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  Filter,
} from "lucide-react";
import { getAdminProductsApi } from "@/lib/api/products";
import { AdminProduct } from "@/lib/api/types";

interface ProductSelectorViewProps {
  onSelectProduct: (product: AdminProduct) => void;
  onCancel: () => void;
}

export function ProductSelectorView({
  onSelectProduct,
  onCancel,
}: ProductSelectorViewProps) {
  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filter3D, setFilter3D] = useState<"all" | "needs_3d" | "has_3d">("all");

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAdminProductsApi({
        page,
        pageSize: 12,
        search: search.trim() || undefined,
        status: "active",
      });
      if (res.ok) {
        setProducts(res.items || []);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages || 1);
          setTotal(res.pagination.total || 0);
        }
      }
    } catch (err) {
      console.error("Failed to load products for 3D model config", err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Client-side 3D status filter
  const filteredProducts = products.filter((p) => {
    if (filter3D === "needs_3d") return !p.is3dModal && !p.Is3dModal;
    if (filter3D === "has_3d") return p.is3dModal || p.Is3dModal;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Step Indicator Header */}
      <div className="bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-orange-500/10 to-transparent pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#FF7348] text-white text-[10px] font-black uppercase tracking-wider">
                Step 1 of 2
              </span>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Product Selection
              </span>
            </div>
            <h1 className="text-2xl font-black italic uppercase tracking-tight text-white">
              Choose Product for 3D Customization
            </h1>
            <p className="text-slate-400 text-xs mt-1 max-w-xl">
              Select an apparel product from your catalog. You will then upload its 3D model (.glb)
              and map customizable print zones directly onto the 3D surface.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-black uppercase tracking-wider transition-all border border-white/10"
          >
            <ChevronLeft className="w-4 h-4" /> Cancel & Back
          </button>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search products by title or handle..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* 3D Filter Pills */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          {[
            { id: "all", label: "All Products" },
            { id: "needs_3d", label: "Needs 3D Setup" },
            { id: "has_3d", label: "3D Ready" },
          ].map((tab) => {
            const isSel = filter3D === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter3D(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                  isSel
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Product Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="bg-slate-100 rounded-3xl h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-24 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-black uppercase tracking-wider text-sm">
            No Products Found
          </p>
          <p className="text-slate-400 text-xs mt-1">
            Try adjusting your search query or 3D status filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((p) => {
            const is3D = Boolean(p.is3dModal || p.Is3dModal);

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-xl hover:border-orange-200 transition-all flex flex-col group relative"
              >
                {/* Product Thumbnail */}
                <div className="h-52 bg-slate-100 flex items-center justify-center relative overflow-hidden">
                  {p.mainImageUrl ? (
                    <img
                      src={p.mainImageUrl}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <Box className="w-12 h-12 text-slate-300" />
                  )}

                  {/* 3D Model Status Tag */}
                  <span
                    className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md flex items-center gap-1 ${
                      is3D
                        ? "bg-emerald-500 text-white"
                        : "bg-orange-500 text-white"
                    }`}
                  >
                    {is3D ? (
                      <>
                        <CheckCircle2 className="w-3 h-3" />
                        <span>3D Configured</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Needs 3D Setup</span>
                      </>
                    )}
                  </span>
                </div>

                {/* Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-black italic uppercase tracking-tight text-slate-900 text-sm line-clamp-2 group-hover:text-[#FF7348] transition-colors">
                      {p.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs font-mono font-black text-slate-900">
                        ${p.salePrice ?? p.basePrice ?? "—"}
                      </span>
                      {p.status && (
                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-500">
                          {p.status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Select CTA */}
                  <button
                    type="button"
                    onClick={() => onSelectProduct(p)}
                    className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-[#FF7348] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md group-hover:shadow-orange-500/20 active:scale-[0.98]"
                  >
                    <span>{is3D ? "Re-configure 3D Model" : "Select & Configure 3D"}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
          <p className="text-xs font-bold text-slate-400">
            Showing Page <span className="text-slate-800">{page}</span> of{" "}
            <span className="text-slate-800">{totalPages}</span> ({total} products)
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && p - prev > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-1 text-slate-400 text-xs">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        p === page
                          ? "bg-slate-900 text-white shadow-sm"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
