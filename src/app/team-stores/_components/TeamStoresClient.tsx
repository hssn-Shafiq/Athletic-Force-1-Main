'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Search, Shield, Store, ArrowRight, ChevronRight, Zap, Trophy, Users, Package } from 'lucide-react';
import { getPublicVendorStoresApi, type PublicVendorStore } from '@/lib/api/publicVendorStores';
import { getCollectionHierarchyApi } from '@/lib/api/publicCollections';
import { Skeleton } from '@/components/ui/skeleton';

interface CombinedTeamStore {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  productCount?: number;
}

const STATIC_TEAM_STORES: CombinedTeamStore[] = [
  { id: 'static-1', name: 'Bullard Jr Knights', slug: 'bullard-jr-knights' },
  { id: 'static-2', name: 'Exeter YFC', slug: 'exeter-yfc' },
  { id: 'static-3', name: 'Oxnard Knights', slug: 'oxnard-knights' },
];

export const TeamStoresClient: React.FC = () => {
  const [stores, setStores] = useState<CombinedTeamStore[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let mounted = true;

    async function loadStoresData() {
      setLoading(true);
      try {
        const [vendorRes, hierarchyRes] = await Promise.allSettled([
          getPublicVendorStoresApi(),
          getCollectionHierarchyApi(),
        ]);

        const approvedVendorStores: PublicVendorStore[] =
          vendorRes.status === 'fulfilled' && vendorRes.value?.ok ? vendorRes.value.stores : [];

        // Find subcategories under "Team Store" from collection hierarchy
        let hierarchySubCategories: Array<{ id: string; name: string; slug: string; productCount: number }> = [];
        if (hierarchyRes.status === 'fulfilled' && hierarchyRes.value?.ok && hierarchyRes.value.hierarchy) {
          const teamStoreParent = hierarchyRes.value.hierarchy.find(
            (h) => h.slug === 'team-store' || h.slug === 'team-stores' || h.name.toLowerCase().includes('team store')
          );
          if (teamStoreParent?.subcategories) {
            hierarchySubCategories = teamStoreParent.subcategories;
          }
        }

        const map = new Map<string, CombinedTeamStore>();

        // 1. Add static fallback team stores
        STATIC_TEAM_STORES.forEach((s) => map.set(s.slug.toLowerCase(), s));

        // 2. Merge hierarchy subcategories
        hierarchySubCategories.forEach((sub) => {
          const key = sub.slug.toLowerCase();
          const existing = map.get(key);
          map.set(key, {
            id: sub.id,
            name: sub.name,
            slug: sub.slug,
            productCount: sub.productCount,
            logoUrl: existing?.logoUrl,
          });
        });

        // 3. Merge approved vendor stores (highest priority for logos)
        approvedVendorStores.forEach((vendor) => {
          const key = vendor.slug.toLowerCase();
          const existing = map.get(key);
          map.set(key, {
            id: vendor.id,
            name: vendor.storeName,
            slug: vendor.slug,
            logoUrl: vendor.logoUrl || existing?.logoUrl,
            productCount: existing?.productCount,
          });
        });

        if (mounted) {
          setStores(Array.from(map.values()));
        }
      } catch (err) {
        console.error('[TeamStoresClient] Error loading team stores:', err);
        if (mounted) setStores(STATIC_TEAM_STORES);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void loadStoresData();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredStores = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter(
      (s) => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q)
    );
  }, [searchQuery, stores]);

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Hero Header */}
      <section className="relative bg-slate-950 text-white overflow-hidden pt-28 pb-20 md:pt-36 md:pb-28">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/40 via-slate-950 to-slate-950" />
        <div className="absolute -top-32 right-0 w-96 h-96 bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 left-0 w-96 h-96 bg-red-600/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-orange-400 text-xs font-black uppercase tracking-[0.2em] italic backdrop-blur-md"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Official Team Store Armory</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-6xl md:text-7xl font-black italic uppercase tracking-tighter text-white leading-none"
          >
            Find Your <span className="text-orange-500">Team Store</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 font-medium text-base sm:text-lg md:text-xl max-w-2xl mx-auto italic"
          >
            Explore custom athletic stores, spirit packs, and official partner gear engineered by Athletic Force 1.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-xl mx-auto pt-4"
          >
            <div className="relative">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search team or store name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/10 backdrop-blur-xl border border-white/20 focus:border-orange-500 focus:bg-white/15 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-bold placeholder:text-slate-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 hover:text-white px-2 py-1 bg-white/10 rounded-lg"
                >
                  Clear
                </button>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-20">
        {/* Counter Bar */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl mb-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase italic tracking-tight text-slate-900">Partner Squad Stores</h2>
              <p className="text-xs font-bold text-slate-400 italic">Official custom storefronts</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-4 py-2 rounded-full bg-slate-900 text-white text-xs font-black uppercase tracking-widest italic">
              {filteredStores.length} {filteredStores.length === 1 ? 'Store' : 'Stores'} Available
            </span>
          </div>
        </div>

        {/* Stores Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white p-8 rounded-[36px] border border-slate-100 shadow-sm space-y-4">
                <Skeleton className="h-16 w-16 rounded-2xl" />
                <Skeleton className="h-6 w-48 rounded-xl" />
                <Skeleton className="h-4 w-32 rounded-lg" />
              </div>
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="bg-white p-16 rounded-[40px] border border-slate-100 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
              <Store className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black uppercase italic tracking-tight text-slate-900">No Team Stores Found</h3>
            <p className="text-slate-400 text-sm font-medium italic max-w-sm mx-auto">
              No store matched &ldquo;{searchQuery}&rdquo;. Check spelling or clear your search query.
            </p>
            <button
              onClick={() => setSearchQuery('')}
              className="px-6 py-3 bg-black text-white text-xs font-black uppercase tracking-widest italic rounded-2xl hover:bg-orange-600 transition-colors"
            >
              Reset Search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.map((store, index) => (
              <Link key={store.id} href={`/team/${store.slug}`}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group relative bg-white border border-slate-100 rounded-[36px] p-8 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 shadow-sm overflow-hidden flex flex-col justify-between h-full"
                >
                  <div className="space-y-6">
                    {/* Header Icon/Logo */}
                    <div className="flex justify-between items-start">
                      <div className="w-20 h-20 bg-slate-50 border border-slate-100 rounded-3xl p-2.5 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform duration-300">
                        {store.logoUrl ? (
                          <img
                            src={store.logoUrl}
                            alt={store.name}
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <Trophy className="w-8 h-8 text-orange-600" />
                        )}
                      </div>
                      <div className="w-10 h-10 rounded-full bg-slate-50 group-hover:bg-orange-600 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Store Title */}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-600 italic">
                        Official Storefront
                      </span>
                      <h3 className="text-2xl font-black italic uppercase tracking-tighter text-slate-900 group-hover:text-orange-600 transition-colors mt-1">
                        {store.name}
                      </h3>
                      {store.productCount !== undefined && store.productCount > 0 && (
                        <p className="text-slate-400 text-xs font-bold italic mt-2 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-slate-400" />
                          <span>{store.productCount} Active Gear Items</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Footer Action Link */}
                  <div className="pt-8 mt-6 border-t border-slate-50 flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-widest text-slate-900 italic group-hover:text-orange-600 transition-colors">
                      Enter Armory
                    </span>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-orange-600 group-hover:translate-x-1 transition-all" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-20 sm:mt-28">
        <div className="bg-black rounded-[40px] p-8 sm:p-14 lg:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-10">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-orange-600/20 blur-[100px] rounded-full pointer-events-none" />

          <div className="relative z-10 max-w-xl text-center lg:text-left space-y-4">
            <span className="text-xs font-black uppercase tracking-[0.3em] text-orange-500 italic">
              Partner With AF1
            </span>
            <h2 className="text-3xl sm:text-5xl font-black italic uppercase tracking-tighter text-white leading-tight">
              Register Your Team Store
            </h2>
            <p className="text-slate-400 text-base font-medium italic">
              Launch a custom online armory for your organization. Seamless ordering, custom performance gear, and rapid fulfillment.
            </p>
          </div>

          <div className="relative z-10 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
            <Link
              href="/register-your-store"
              className="flex items-center justify-center gap-3 bg-orange-600 hover:bg-orange-500 text-white px-8 py-5 rounded-2xl font-black uppercase italic tracking-tighter text-lg transition-all shadow-xl shadow-orange-600/20 active:scale-[0.98]"
            >
              <span>Apply for Storefront</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
