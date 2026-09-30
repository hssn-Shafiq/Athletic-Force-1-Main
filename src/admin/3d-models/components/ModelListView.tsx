import React from "react";
import Link from "next/link";
import {
  Plus,
  Box,
  Edit3,
  Trash2,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles,
} from "lucide-react";
import { Model3D } from "../types";
import { ModelCardPreview } from "./ModelCardPreview";

interface ModelListViewProps {
  models: Model3D[];
  loading: boolean;
  page?: number;
  totalPages?: number;
  total?: number;
  limit?: number;
  search?: string;
  statusFilter?: "all" | "active" | "draft";
  onSearchChange?: (val: string) => void;
  onStatusFilterChange?: (val: "all" | "active" | "draft") => void;
  onPageChange?: (p: number) => void;
  onOpenEditor: (model?: Model3D) => void;
  onDelete: (id: string) => void;
}

export function ModelListView({
  models,
  loading,
  page = 1,
  totalPages = 1,
  total = 0,
  limit = 12,
  search = "",
  statusFilter = "all",
  onSearchChange,
  onStatusFilterChange,
  onPageChange,
  onOpenEditor,
  onDelete,
}: ModelListViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900">
              3D Product Models
            </h1>
            {total > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-100 text-slate-600">
                {total}
              </span>
            )}
          </div>
          <p className="text-slate-400 text-sm mt-1">
            Browse, manage, and configure 3D models with print zones for customer personalization.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/3d-models/add"
            className="flex items-center gap-2 px-5 py-3 bg-[#FF7348] text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-[#e86339] transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" /> Add New Model
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by model or product name..."
            value={search}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
          />
          {search && (
            <button
              onClick={() => onSearchChange?.("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
          {[
            { id: "all", label: "All Models" },
            { id: "active", label: "Active" },
            { id: "draft", label: "Draft" },
          ].map((tab) => {
            const isSel = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onStatusFilterChange?.(tab.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
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

      {/* Grid or Skeletons */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-slate-100 rounded-3xl h-72 animate-pulse" />
          ))}
        </div>
      ) : models.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
          <Box className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-700 font-black uppercase tracking-wider text-sm">
            No 3D Models Found
          </p>
          <p className="text-slate-400 text-xs mt-1 max-w-sm mx-auto">
            {search || statusFilter !== "all"
              ? "Try adjusting your search query or filters to find models."
              : "Get started by selecting a product and configuring its 3D model."}
          </p>
          <Link
            href="/admin/3d-models/add"
            className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 bg-black text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Add First Model
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models.map((m) => (
            <div
              key={m.id}
              className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg transition-all flex flex-col group"
            >
              {/* 3D Preview Box */}
              <div className="h-52 bg-slate-950 flex items-center justify-center relative overflow-hidden">
                {m.thumbnailUrl ? (
                  <img src={m.thumbnailUrl} alt={m.name} className="h-full w-full object-cover" />
                ) : m.modelUrl ? (
                  <ModelCardPreview url={m.modelUrl} />
                ) : (
                  <Box className="w-16 h-16 text-white/20" />
                )}

                {/* Status Pill */}
                <span
                  className={`absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider shadow-md ${
                    m.isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-600 text-slate-200"
                  }`}
                >
                  {m.isActive ? "Active" : "Draft"}
                </span>

                {/* Print Zones Count Pill */}
                <div className="absolute bottom-3 left-3 z-10 px-2.5 py-1 rounded-xl bg-black/70 backdrop-blur-md text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 border border-white/10">
                  <Layers className="w-3 h-3 text-[#FF7348]" />
                  <span>
                    {m.printZones?.length || 0} Zone{(m.printZones?.length || 0) !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>

              {/* Model Info */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <h3 className="font-black italic uppercase tracking-tight text-slate-900 text-base line-clamp-1">
                    {m.name}
                  </h3>
                  {m.description && (
                    <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">
                      {m.description}
                    </p>
                  )}

                  {/* Linked Product Card */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-1.5 flex items-center justify-between">
                      <span>Linked Product</span>
                      {m.product && (
                        <span className="text-emerald-600 font-bold">Connected</span>
                      )}
                    </div>

                    {m.product ? (
                      <div className="flex items-center gap-2.5">
                        {m.product.mainImageUrl ? (
                          <img
                            src={m.product.mainImageUrl}
                            alt={m.product.name}
                            className="w-9 h-9 rounded-xl object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-xl bg-slate-200 flex items-center justify-center text-slate-400">
                            <Box className="w-4 h-4" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-black uppercase text-slate-800 truncate">
                            {m.product.name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono">
                            {m.product.basePrice !== undefined ? `$${m.product.basePrice}` : ""} &bull;{" "}
                            {m.product.status}
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-400 italic">
                        Not linked to any store product
                      </p>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => onOpenEditor(m)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-black uppercase tracking-wider hover:bg-[#FF7348] transition-all shadow-sm"
                  >
                    <Edit3 className="w-3.5 h-3.5" /> Configure Zones
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(m.id)}
                    className="p-2.5 rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                    title="Delete 3D Model"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination Footer */}
      {!loading && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200/80">
          <p className="text-xs font-bold text-slate-400">
            Showing Page <span className="text-slate-800">{page}</span> of{" "}
            <span className="text-slate-800">{totalPages}</span> ({total} total models)
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => onPageChange?.(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Previous Page"
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
                      onClick={() => onPageChange?.(p)}
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
              onClick={() => onPageChange?.(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
