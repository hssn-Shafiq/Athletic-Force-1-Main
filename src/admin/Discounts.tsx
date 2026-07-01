'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X, RefreshCw, Percent, DollarSign, Truck, Gift, Package, Layers,
  ShoppingCart, Tag, Trash2, Plus, Info, Check, ChevronRight, Edit2, AlertCircle
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';

// ─── Types (unchanged from original) ────────────────────────────────────────
type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping' | 'bogo' | 'bundle_fixed_price' | 'volume_tier';
type TargetScope = 'all' | 'specific_products' | 'specific_collections';

interface Discount {
  id: string;
  code: string;
  description?: string;
  type: DiscountType;
  isActive: boolean;
  isAutomatic: boolean;
  maxUsageCount: number;
  usedCount: number;
  perCustomerLimit: number;
  isFirstOrderOnly: boolean;
  startDate?: string;
  endDate?: string;
  value?: number;
  appliesTo?: TargetScope;
  appliesToProductIds?: string[];
  appliesToCollectionIds?: string[];
  minOrderAmount?: number;
  bogoBuyTarget?: TargetScope;
  bogoBuyProductIds?: string[];
  bogoBuyCollectionIds?: string[];
  bogoBuyQty?: number;
  bogoGetTarget?: TargetScope;
  bogoGetProductIds?: string[];
  bogoGetCollectionIds?: string[];
  bogoGetQty?: number;
  bogoGetDiscountType?: 'free' | 'percentage';
  bogoGetDiscountValue?: number;
  volumeTiers?: { quantity: number; discountPercentage: number }[];
  volumeTarget?: TargetScope;
  volumeProductIds?: string[];
  volumeCollectionIds?: string[];
  bundleProductIds?: string[];
  bundleFixedPrice?: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const STEPS = ['Discount type', 'Set the value', 'Rules & limits', 'Review'];

const TYPE_OPTIONS: {
  key: DiscountType;
  label: string;
  desc: string;
  icon: React.ReactNode;
}[] = [
  { key: 'percentage',       label: 'Percentage off',   desc: 'e.g. 20% off the whole order',        icon: <Percent  className="w-5 h-5" /> },
  { key: 'fixed_amount',     label: 'Fixed amount off', desc: 'e.g. $10 off orders over $50',         icon: <DollarSign className="w-5 h-5" /> },
  { key: 'free_shipping',    label: 'Free shipping',    desc: 'Waive delivery fees at checkout',       icon: <Truck    className="w-5 h-5" /> },
  { key: 'bogo',             label: 'Buy X, get Y',     desc: 'Customer buys 2, gets 1 free',          icon: <Gift     className="w-5 h-5" /> },
  { key: 'bundle_fixed_price', label: 'Bundle price',  desc: 'Sell a set of items at one price',      icon: <Package  className="w-5 h-5" /> },
  { key: 'volume_tier',      label: 'Bulk / Volume',    desc: 'More you buy, more you save',           icon: <Layers   className="w-5 h-5" /> },
];

const generateCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const emptyForm: Partial<Discount> = {
  code: '',
  description: '',
  type: 'percentage',
  isActive: true,
  isAutomatic: false,
  maxUsageCount: 0,
  perCustomerLimit: 1,
  isFirstOrderOnly: false,
  value: 20,
  minOrderAmount: 0,
  appliesTo: 'all',
  appliesToProductIds: [],
  appliesToCollectionIds: [],
  bogoBuyTarget: 'all',
  bogoBuyProductIds: [],
  bogoBuyCollectionIds: [],
  bogoBuyQty: 2,
  bogoGetTarget: 'all',
  bogoGetProductIds: [],
  bogoGetCollectionIds: [],
  bogoGetQty: 1,
  bogoGetDiscountType: 'free',
  bogoGetDiscountValue: 100,
  volumeTiers: [
    { quantity: 5,  discountPercentage: 10 },
    { quantity: 10, discountPercentage: 20 },
  ],
  volumeTarget: 'all',
  volumeProductIds: [],
  volumeCollectionIds: [],
  bundleProductIds: [],
  bundleFixedPrice: 0,
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function InfoBox({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex gap-2.5 items-start bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
      <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
      <p className="text-xs text-blue-700 leading-relaxed">{children}</p>
    </div>
  );
}

function FieldLabel({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-1">
      <label className="block text-xs font-semibold text-slate-600">{children}</label>
      {hint && <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{hint}</p>}
    </div>
  );
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`relative w-10 h-5 rounded-full transition-colors duration-200 shrink-0 ${on ? 'bg-slate-900' : 'bg-slate-200'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${on ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );
}

function ToggleRow({
  label, hint, on, onToggle,
}: { label: string; hint: string; on: boolean; onToggle: () => void }) {
  return (
    <div
      className="flex items-center justify-between gap-4 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 transition-colors mb-2"
      onClick={onToggle}
    >
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400 mt-0.5">{hint}</p>
      </div>
      <Toggle on={on} onToggle={onToggle} />
    </div>
  );
}

function ScopeSelector({
  scope, onScope, products, collections,
  selectedProducts, onProducts,
  selectedCollections, onCollections,
}: {
  scope: TargetScope;
  onScope: (s: TargetScope) => void;
  products: { id: string; name: string }[];
  collections: { id: string; name: string }[];
  selectedProducts: string[];
  onProducts: (ids: string[]) => void;
  selectedCollections: string[];
  onCollections: (ids: string[]) => void;
}) {
  return (
    <div>
      <FieldLabel hint="Leave as 'All products' unless you want to restrict which items qualify.">
        Which products does this apply to?
      </FieldLabel>
      <select
        value={scope}
        onChange={e => onScope(e.target.value as TargetScope)}
        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-slate-400 bg-white"
      >
        <option value="all">All products in the store</option>
        <option value="specific_collections">Specific collections only</option>
        <option value="specific_products">Specific products only</option>
      </select>
      {scope === 'specific_products' && (
        <CheckboxList
          options={products}
          selectedIds={selectedProducts}
          onChange={onProducts}
          placeholder="No products found"
        />
      )}
      {scope === 'specific_collections' && (
        <CheckboxList
          options={collections}
          selectedIds={selectedCollections}
          onChange={onCollections}
          placeholder="No collections found"
        />
      )}
    </div>
  );
}

function CheckboxList({
  options, selectedIds, onChange, placeholder,
}: {
  options: { id: string; name: string }[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
}) {
  const [search, setSearch] = useState('');
  const selected = options.filter(o => selectedIds.includes(o.id));
  const unselected = options.filter(o => !selectedIds.includes(o.id) && o.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden bg-white">
      {selected.length > 0 && (
        <div className="p-2.5 bg-slate-50 border-b border-slate-100 flex flex-wrap gap-1.5">
          {selected.map(opt => (
            <span key={opt.id} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700">
              {opt.name}
              <button type="button" onClick={() => onChange(selectedIds.filter(id => id !== opt.id))} className="text-slate-400 hover:text-red-500 ml-0.5">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="px-3 py-2 border-b border-slate-100 bg-white">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full text-xs outline-none text-slate-700 placeholder-slate-400"
        />
      </div>
      <div className="max-h-36 overflow-y-auto">
        {options.length === 0 && <p className="text-xs text-slate-400 p-3 italic">{placeholder}</p>}
        {options.length > 0 && unselected.length === 0 && <p className="text-xs text-slate-400 p-3 italic">No matches.</p>}
        {unselected.map(opt => (
          <label key={opt.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 cursor-pointer text-xs font-medium text-slate-700 border-b border-slate-50 last:border-0">
            <input
              type="checkbox"
              checked={false}
              onChange={() => onChange([...selectedIds, opt.id])}
              className="w-3.5 h-3.5 rounded accent-slate-800"
            />
            {opt.name}
          </label>
        ))}
      </div>
    </div>
  );
}

// ─── Step components ─────────────────────────────────────────────────────────

function Step1TypeAndCode({
  form, setForm,
}: { form: Partial<Discount>; setForm: (f: Partial<Discount>) => void }) {
  return (
    <div className="space-y-6">
      {/* Type picker */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">What kind of discount is this?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {TYPE_OPTIONS.map(({ key, label, desc, icon }) => (
            <button
              key={key}
              type="button"
              onClick={() => setForm({ ...form, type: key })}
              className={`flex flex-col items-start gap-1.5 p-3.5 rounded-xl border text-left transition-all ${
                form.type === key
                  ? 'border-slate-900 bg-slate-900 text-white shadow-lg'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50'
              }`}
            >
              <span className={form.type === key ? 'text-white' : 'text-slate-500'}>{icon}</span>
              <span className="text-xs font-bold leading-tight">{label}</span>
              <span className={`text-[10px] leading-snug ${form.type === key ? 'text-slate-300' : 'text-slate-400'}`}>{desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Code */}
      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Coupon code</p>
        <InfoBox>
          This is what customers type at checkout to redeem the discount. Turn on "auto-apply" below if you don't want them to enter a code.
        </InfoBox>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel>Code (customers will type this)</FieldLabel>
            <div className="flex gap-2">
              <input
                type="text"
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                placeholder="e.g. WELCOME20"
                className="flex-1 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold uppercase tracking-widest outline-none focus:border-slate-400 text-slate-900"
              />
              <button
                type="button"
                onClick={() => setForm({ ...form, code: generateCode() })}
                title="Generate random code"
                className="px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Only letters and numbers. Automatically uppercased.</p>
          </div>
          <div>
            <FieldLabel hint="Only you can see this — helps you stay organised.">Description (optional)</FieldLabel>
            <input
              type="text"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. Summer sale — 20% off"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-800"
            />
          </div>
        </div>
      </div>

      {/* Auto-apply */}
      <ToggleRow
        label="Apply automatically — no code needed"
        hint="Discount appears in the cart automatically, without the customer typing anything"
        on={!!form.isAutomatic}
        onToggle={() => setForm({ ...form, isAutomatic: !form.isAutomatic })}
      />
    </div>
  );
}

function Step2Value({
  form, setForm,
  products, collections,
}: {
  form: Partial<Discount>;
  setForm: (f: Partial<Discount>) => void;
  products: { id: string; name: string }[];
  collections: { id: string; name: string }[];
}) {
  const type = form.type;

  return (
    <div className="space-y-5">
      {/* Percentage / Fixed */}
      {(type === 'percentage' || type === 'fixed_amount') && (
        <>
          <InfoBox>
            {type === 'percentage'
              ? 'Enter how many percent off the customer gets. For example, 20 means 20% off.'
              : 'Enter the dollar amount to subtract from the order. For example, 10 means $10 off.'}
          </InfoBox>
          <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-2xl py-6 px-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black text-slate-400">{type === 'percentage' ? '' : '$'}</span>
              <input
                type="number"
                min={0}
                value={form.value}
                onChange={e => setForm({ ...form, value: +e.target.value })}
                className="w-28 text-5xl font-black text-center bg-transparent border-b-2 border-slate-300 focus:border-slate-900 outline-none text-slate-900 pb-1"
              />
              <span className="text-3xl font-black text-slate-400">{type === 'percentage' ? '%' : ''}</span>
            </div>
            <p className="text-xs text-slate-400 mt-3">{type === 'percentage' ? 'percent off the order total' : 'dollars off the order total'}</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel hint="Set to 0 if there's no minimum requirement.">Minimum cart total before this applies ($)</FieldLabel>
              <input
                type="number" min={0}
                value={form.minOrderAmount}
                onChange={e => setForm({ ...form, minOrderAmount: +e.target.value })}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400"
              />
            </div>
            <ScopeSelector
              scope={form.appliesTo!}
              onScope={s => setForm({ ...form, appliesTo: s })}
              products={products} collections={collections}
              selectedProducts={form.appliesToProductIds!}
              onProducts={ids => setForm({ ...form, appliesToProductIds: ids })}
              selectedCollections={form.appliesToCollectionIds!}
              onCollections={ids => setForm({ ...form, appliesToCollectionIds: ids })}
            />
          </div>
        </>
      )}

      {/* Free Shipping */}
      {type === 'free_shipping' && (
        <>
          <InfoBox>This discount removes the shipping fee at checkout. You can require a minimum cart amount before it kicks in.</InfoBox>
          <div>
            <FieldLabel hint="Example: set to 50 to offer free shipping on orders $50+. Set to 0 for always free.">
              Minimum cart total to qualify for free shipping ($)
            </FieldLabel>
            <input
              type="number" min={0}
              value={form.minOrderAmount}
              onChange={e => setForm({ ...form, minOrderAmount: +e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </>
      )}

      {/* BOGO */}
      {type === 'bogo' && (
        <>
          <InfoBox>Define what the customer has to buy, and what free/discounted item they get as a reward.</InfoBox>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Buy side */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50 space-y-3">
              <p className="text-xs font-bold text-slate-700 flex items-center gap-1.5"><ShoppingCart className="w-4 h-4 text-slate-500" /> Customer buys</p>
              <div>
                <FieldLabel hint="Minimum number of items they must add to their cart.">How many items must they add?</FieldLabel>
                <input
                  type="number" min={1}
                  value={form.bogoBuyQty}
                  onChange={e => setForm({ ...form, bogoBuyQty: +e.target.value })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 bg-white"
                />
              </div>
              <div>
                <FieldLabel>From which products?</FieldLabel>
                <select
                  value={form.bogoBuyTarget}
                  onChange={e => setForm({ ...form, bogoBuyTarget: e.target.value as TargetScope })}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none bg-white"
                >
                  <option value="all">Any product in store</option>
                  <option value="specific_products">Specific products</option>
                  <option value="specific_collections">Specific collections</option>
                </select>
                {form.bogoBuyTarget === 'specific_products' && (
                  <CheckboxList options={products} selectedIds={form.bogoBuyProductIds!} onChange={ids => setForm({ ...form, bogoBuyProductIds: ids })} placeholder="No products" />
                )}
                {form.bogoBuyTarget === 'specific_collections' && (
                  <CheckboxList options={collections} selectedIds={form.bogoBuyCollectionIds!} onChange={ids => setForm({ ...form, bogoBuyCollectionIds: ids })} placeholder="No collections" />
                )}
              </div>
            </div>

            {/* Get side */}
            <div className="border-2 border-slate-900 rounded-2xl p-4 bg-slate-900 space-y-3">
              <p className="text-xs font-bold text-white flex items-center gap-1.5"><Tag className="w-4 h-4 text-slate-300" /> Customer gets</p>
              <div>
                <FieldLabel hint="How many free or discounted items do they receive?"><span className="text-slate-300">How many reward items?</span></FieldLabel>
                <input
                  type="number" min={1}
                  value={form.bogoGetQty}
                  onChange={e => setForm({ ...form, bogoGetQty: +e.target.value })}
                  className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                />
              </div>
              <div>
                <FieldLabel><span className="text-slate-300">Discount on the reward</span></FieldLabel>
                <select
                  value={form.bogoGetDiscountType}
                  onChange={e => setForm({ ...form, bogoGetDiscountType: e.target.value as 'free' | 'percentage' })}
                  className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none"
                >
                  <option value="free">100% free (no charge)</option>
                  <option value="percentage">Custom % off</option>
                </select>
              </div>
              {form.bogoGetDiscountType === 'percentage' && (
                <div>
                  <FieldLabel><span className="text-slate-300">Percentage off (%)</span></FieldLabel>
                  <input
                    type="number" min={1} max={99}
                    value={form.bogoGetDiscountValue}
                    onChange={e => setForm({ ...form, bogoGetDiscountValue: +e.target.value })}
                    className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none"
                  />
                </div>
              )}
              <div>
                <FieldLabel><span className="text-slate-300">From which products?</span></FieldLabel>
                <select
                  value={form.bogoGetTarget}
                  onChange={e => setForm({ ...form, bogoGetTarget: e.target.value as TargetScope })}
                  className="w-full border border-slate-700 bg-slate-800 text-white rounded-xl px-3 py-2.5 text-sm outline-none"
                >
                  <option value="all">Any product</option>
                  <option value="specific_products">Specific products</option>
                  <option value="specific_collections">Specific collections</option>
                </select>
                {form.bogoGetTarget === 'specific_products' && (
                  <CheckboxList options={products} selectedIds={form.bogoGetProductIds!} onChange={ids => setForm({ ...form, bogoGetProductIds: ids })} placeholder="No products" />
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Bundle */}
      {type === 'bundle_fixed_price' && (
        <>
          <InfoBox>Select every product that must be in the bundle, then set one total price for all of them.</InfoBox>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel hint="Customer must add ALL selected items to qualify for the bundle price.">Products in this bundle</FieldLabel>
              <CheckboxList
                options={products}
                selectedIds={form.bundleProductIds!}
                onChange={ids => setForm({ ...form, bundleProductIds: ids })}
                placeholder="No products available"
              />
            </div>
            <div>
              <FieldLabel hint="The total price the customer pays for all bundle items together.">Total bundle price ($)</FieldLabel>
              <div className="flex flex-col items-center bg-slate-50 border border-slate-200 rounded-2xl py-6 px-4">
                <div className="flex items-center gap-1">
                  <span className="text-3xl font-black text-slate-400">$</span>
                  <input
                    type="number" min={0}
                    value={form.bundleFixedPrice}
                    onChange={e => setForm({ ...form, bundleFixedPrice: +e.target.value })}
                    className="w-28 text-5xl font-black text-center bg-transparent border-b-2 border-slate-300 focus:border-slate-900 outline-none text-slate-900 pb-1"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-3">for all selected items together</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Volume */}
      {type === 'volume_tier' && (
        <>
          <InfoBox>Add tiers — the more a customer buys, the bigger their discount. Each tier needs a quantity and a percentage off.</InfoBox>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Discount tiers</p>
            {(form.volumeTiers || []).map((tier, idx) => (
              <div key={idx} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3">
                <span className="text-xs text-slate-400 shrink-0">Buy</span>
                <input
                  type="number" min={1}
                  value={tier.quantity}
                  onChange={e => {
                    const t = [...(form.volumeTiers || [])];
                    t[idx] = { ...t[idx], quantity: +e.target.value };
                    setForm({ ...form, volumeTiers: t });
                  }}
                  className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-center outline-none focus:border-slate-400 bg-white"
                />
                <span className="text-xs text-slate-400 shrink-0">or more →</span>
                <input
                  type="number" min={1} max={100}
                  value={tier.discountPercentage}
                  onChange={e => {
                    const t = [...(form.volumeTiers || [])];
                    t[idx] = { ...t[idx], discountPercentage: +e.target.value };
                    setForm({ ...form, volumeTiers: t });
                  }}
                  className="w-16 border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-bold text-center text-slate-900 outline-none focus:border-slate-400 bg-white"
                />
                <span className="text-xs text-slate-400 shrink-0">% off</span>
                {idx > 0 && (
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, volumeTiers: form.volumeTiers!.filter((_, i) => i !== idx) })}
                    className="ml-auto p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setForm({ ...form, volumeTiers: [...(form.volumeTiers || []), { quantity: 20, discountPercentage: 30 }] })}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 mt-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" /> Add another tier
            </button>
          </div>
          <ScopeSelector
            scope={form.volumeTarget!}
            onScope={s => setForm({ ...form, volumeTarget: s })}
            products={products} collections={collections}
            selectedProducts={form.volumeProductIds!}
            onProducts={ids => setForm({ ...form, volumeProductIds: ids })}
            selectedCollections={form.volumeCollectionIds!}
            onCollections={ids => setForm({ ...form, volumeCollectionIds: ids })}
          />
        </>
      )}
    </div>
  );
}

function Step3Rules({ form, setForm }: { form: Partial<Discount>; setForm: (f: Partial<Discount>) => void }) {
  return (
    <div className="space-y-5">
      <InfoBox>All fields here are optional. Leave them blank if you don't need to restrict the discount.</InfoBox>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Usage limits</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel hint="Example: 100 means only the first 100 redemptions work. Set to 0 for unlimited.">
              Maximum total uses (across all customers)
            </FieldLabel>
            <input
              type="number" min={0}
              value={form.maxUsageCount}
              onChange={e => setForm({ ...form, maxUsageCount: +e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>
          <div>
            <FieldLabel hint="Set to 1 to prevent repeat use. 0 = unlimited.">
              How many times can one customer use it?
            </FieldLabel>
            <input
              type="number" min={0}
              value={form.perCustomerLimit}
              onChange={e => setForm({ ...form, perCustomerLimit: +e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Schedule</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel hint="Leave empty to activate right now.">Start date & time</FieldLabel>
            <input
              type="datetime-local"
              value={form.startDate || ''}
              onChange={e => setForm({ ...form, startDate: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700"
            />
          </div>
          <div>
            <FieldLabel hint="Leave empty if it never expires.">Expiry date & time</FieldLabel>
            <input
              type="datetime-local"
              value={form.endDate || ''}
              onChange={e => setForm({ ...form, endDate: e.target.value })}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-slate-400 text-slate-700"
            />
          </div>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Special conditions</p>
        <ToggleRow
          label="First-time customers only"
          hint="Only applies to customers placing their very first order"
          on={!!form.isFirstOrderOnly}
          onToggle={() => setForm({ ...form, isFirstOrderOnly: !form.isFirstOrderOnly })}
        />
        <ToggleRow
          label="Activate this discount immediately"
          hint="Turn off to save as a draft — it won't work at checkout until you activate it"
          on={!!form.isActive}
          onToggle={() => setForm({ ...form, isActive: !form.isActive })}
        />
      </div>
    </div>
  );
}

function Step4Review({ form }: { form: Partial<Discount> }) {
  const typeLabel = TYPE_OPTIONS.find(t => t.key === form.type)?.label ?? form.type;

  const rows: { label: string; value: string }[] = [
    { label: 'Coupon code',    value: form.code || '—' },
    { label: 'Discount type',  value: typeLabel ?? '—' },
    { label: 'Description',    value: form.description || '—' },
    { label: 'Min. cart total', value: form.minOrderAmount ? `$${form.minOrderAmount}` : 'No minimum' },
    { label: 'Max total uses', value: form.maxUsageCount ? String(form.maxUsageCount) : 'Unlimited' },
    { label: 'Per customer',   value: form.perCustomerLimit ? `${form.perCustomerLimit}×` : 'Unlimited' },
    { label: 'First order only', value: form.isFirstOrderOnly ? 'Yes' : 'No' },
    { label: 'Auto-apply',     value: form.isAutomatic ? 'Yes' : 'No (requires code)' },
    { label: 'Expires',        value: form.endDate ? new Date(form.endDate).toLocaleString() : 'Never' },
    { label: 'Status',         value: form.isActive ? 'Active immediately' : 'Draft (inactive)' },
  ];

  return (
    <div className="space-y-4">
      <InfoBox>Double-check everything below before launching. You can always edit it later.</InfoBox>
      <div className="border border-slate-200 rounded-2xl overflow-hidden">
        {rows.map((row, i) => (
          <div key={i} className={`flex justify-between items-center px-4 py-3 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-slate-50'} border-b border-slate-100 last:border-0`}>
            <span className="text-slate-500 font-medium">{row.label}</span>
            <span className={`font-semibold text-right ml-4 ${row.label === 'Coupon code' ? 'font-mono tracking-widest text-slate-900' : row.label === 'Status' && form.isActive ? 'text-green-700' : 'text-slate-800'}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Modal ──────────────────────────────────────────────────────────────

interface DiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (form: Partial<Discount>) => Promise<void>;
  editingDiscount?: Discount | null;
  products?: { id: string; name: string }[];
  collections?: { id: string; name: string }[];
  isSaving?: boolean;
}

export function DiscountModal({
  isOpen,
  onClose,
  onSave,
  editingDiscount,
  products = [],
  collections = [],
  isSaving = false,
}: DiscountModalProps) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Partial<Discount>>({
    ...emptyForm,
    code: generateCode(),
  });

  // Reset when opening
  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      if (editingDiscount) {
        setForm({
          ...emptyForm,
          ...editingDiscount,
          startDate: editingDiscount.startDate ? editingDiscount.startDate.slice(0, 16) : '',
          endDate: editingDiscount.endDate ? editingDiscount.endDate.slice(0, 16) : '',
        });
      } else {
        setForm({ ...emptyForm, code: generateCode() });
      }
    }
  }, [isOpen, editingDiscount]);

  if (!isOpen) return null;

  const totalSteps = STEPS.length;
  const progress = (step / totalSteps) * 100;

  const handleNext = async () => {
    if (step < totalSteps) {
      setStep(s => s + 1);
    } else {
      await onSave(form);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-6 pt-5 pb-4 border-b border-slate-100 flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              {editingDiscount ? 'Edit discount' : 'Create a discount'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">Follow the steps — takes about a minute</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-xl transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-slate-100 shrink-0">
          <div
            className="h-full bg-slate-900 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-0 px-6 py-3 bg-slate-50 border-b border-slate-100 shrink-0 overflow-x-auto">
          {STEPS.map((label, i) => {
            const n = i + 1;
            const isDone = n < step;
            const isActive = n === step;
            return (
              <React.Fragment key={n}>
                <div className="flex items-center gap-2 shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isDone  ? 'bg-slate-900 text-white' :
                    isActive ? 'bg-slate-900 text-white ring-4 ring-slate-200' :
                               'bg-white border border-slate-200 text-slate-400'
                  }`}>
                    {isDone ? <Check className="w-3 h-3" /> : n}
                  </div>
                  <span className={`text-xs font-semibold whitespace-nowrap ${isActive ? 'text-slate-900' : 'text-slate-400'}`}>
                    {label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-3.5 h-3.5 text-slate-300 mx-2 shrink-0" />
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && <Step1TypeAndCode form={form} setForm={setForm} />}
          {step === 2 && <Step2Value form={form} setForm={setForm} products={products} collections={collections} />}
          {step === 3 && <Step3Rules form={form} setForm={setForm} />}
          {step === 4 && <Step4Review form={form} />}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between shrink-0 bg-white">
          <span className="text-xs text-slate-400">Step {step} of {totalSteps}</span>
          <div className="flex gap-2">
            {step > 1 && (
              <button
                type="button"
                onClick={() => setStep(s => s - 1)}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={handleNext}
              disabled={isSaving || !form.code?.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-semibold hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              {isSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
              {step === totalSteps ? (editingDiscount ? 'Save changes' : 'Launch discount') : 'Next step →'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

export default function Discounts() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [products, setProducts] = useState<{id: string, name: string}[]>([]);
  const [collections, setCollections] = useState<{id: string, name: string}[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchDiscounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await apiClient.get('/api/discounts');
      if (data.ok) setDiscounts(data.discounts);
    } catch (err) {
      console.error('Failed to load discounts', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchOptions = useCallback(async () => {
    try {
      const [pRes, cRes] = await Promise.all([
        apiClient.get('/api/admin/products/options?pageSize=500'),
        apiClient.get('/api/admin/collections')
      ]);
      if (pRes.data?.ok) setProducts(pRes.data.items);
      if (cRes.data?.ok) setCollections(cRes.data.collections.map((c: any) => ({ id: c._id || c.id, name: c.name })));
    } catch (err) {
      console.error("Failed to load options", err);
    }
  }, []);

  useEffect(() => { fetchDiscounts(); fetchOptions(); }, [fetchDiscounts, fetchOptions]);

  const showStatus = (type: 'success' | 'error', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 4000);
  };

  const openCreate = () => {
    setEditingDiscount(null);
    setIsModalOpen(true);
  };

  const openEdit = (d: Discount) => {
    setEditingDiscount(d);
    setIsModalOpen(true);
  };

  const handleSave = async (form: Partial<Discount>) => {
    if (!form.code?.trim()) return;
    setIsSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.toUpperCase(),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : undefined,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : undefined,
      };

      if (editingDiscount) {
        await apiClient.patch(`/api/discounts/${editingDiscount.id}`, payload);
        showStatus('success', 'Discount updated successfully!');
      } else {
        await apiClient.post('/api/discounts', payload);
        showStatus('success', 'Discount created successfully!');
      }
      setIsModalOpen(false);
      fetchDiscounts();
    } catch (err: any) {
      showStatus('error', err?.response?.data?.message || 'Failed to save discount.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    try {
      await apiClient.delete(`/api/discounts/${deleteId}`);
      showStatus('success', 'Discount deleted.');
      setDeleteId(null);
      fetchDiscounts();
    } catch {
      showStatus('error', 'Failed to delete discount.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getStatusBadge = (d: Discount) => {
    const now = new Date();
    if (!d.isActive) return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-slate-100 text-slate-400 uppercase tracking-wider">Draft</span>;
    if (d.endDate && new Date(d.endDate) < now) return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-600 uppercase tracking-wider">Expired</span>;
    if (d.startDate && new Date(d.startDate) > now) return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-yellow-100 text-yellow-700 uppercase tracking-wider">Scheduled</span>;
    return <span className="px-2 py-1 rounded-full text-[10px] font-black bg-green-100 text-green-700 uppercase tracking-wider">Active</span>;
  };

  const filteredDiscounts = discounts.filter((d) =>
    d.code.toLowerCase().includes(search.toLowerCase()) ||
    (d.description || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Discounts</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Manage all promotional offers and automated rules</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all shadow-lg shadow-black/10"
        >
          <Plus className="w-4 h-4" /> Create Discount
        </button>
      </div>

      {status && (
        <div className={`flex items-center gap-3 p-4 rounded-2xl border ${
          status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {status.type === 'success' ? <Check className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
          <p className="text-sm font-bold">{status.message}</p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: discounts.length, color: 'text-slate-900' },
          { label: 'Active', value: discounts.filter((d) => d.isActive).length, color: 'text-green-600' },
          { label: 'Expired', value: discounts.filter((d) => d.endDate && new Date(d.endDate) < new Date()).length, color: 'text-red-500' },
          { label: 'Total Uses', value: discounts.reduce((sum, d) => sum + d.usedCount, 0), color: 'text-orange-500' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className={`text-3xl font-black italic tracking-tighter ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search discount codes or descriptions..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-slate-400 transition-all"
        />
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-6 h-6 animate-spin text-slate-300" />
          </div>
        ) : filteredDiscounts.length === 0 ? (
          <div className="text-center py-20 space-y-3">
            <Tag className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="text-slate-400 font-bold text-sm uppercase tracking-wider">
              {search ? 'No discounts match your search' : 'No discounts yet'}
            </p>
            {!search && (
              <button onClick={openCreate} className="text-slate-900 font-black text-xs uppercase tracking-widest hover:underline">
                Create your first discount →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="text-left px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Code</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Usage</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Expiry</th>
                  <th className="text-left px-4 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-4 py-4" />
                </tr>
              </thead>
              <tbody>
                {filteredDiscounts.map((d) => (
                  <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 tracking-wider text-sm">{d.code}</span>
                      </div>
                      {d.description && <p className="text-xs text-slate-400 mt-0.5 font-medium">{d.description}</p>}
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-slate-600">
                      {TYPE_OPTIONS.find(t => t.key === d.type)?.label || d.type}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-500">
                      <span className="font-black text-slate-900">{d.usedCount}</span>
                      {d.maxUsageCount ? <span className="text-slate-400"> / {d.maxUsageCount}</span> : <span className="text-slate-400"> / ∞</span>}
                    </td>
                    <td className="px-4 py-4 text-xs text-slate-400 font-medium">
                      {d.endDate ? new Date(d.endDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-4">{getStatusBadge(d)}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1 justify-end">
                        <button onClick={() => openEdit(d)} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-900">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteId(d.id)} className="p-2 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <DiscountModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingDiscount={editingDiscount}
        products={products}
        collections={collections}
        isSaving={isSaving}
      />

      {/* Delete Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl space-y-6">
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900">Delete Discount?</h3>
              <p className="text-sm text-slate-500 mt-2">This action is irreversible. The coupon code will instantly stop working for all customers.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-3 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                Cancel
              </button>
              <button onClick={handleDelete} disabled={isDeleting} className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50">
                {isDeleting ? 'Erasing...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}