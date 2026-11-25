"use client";

import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import {
  Check,
  Download,
  Eye,
  FileText,
  Loader2,
  Plus,
  Search,
  Send,
  Trash2,
  X,
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { getApiErrorMessage } from '@/lib/api/errors';
import { getAdminProductByIdApi, getAdminProductsApi } from '@/lib/api/products';
import type { AdminProduct, ProductVariant } from '@/lib/api/types';
import { toast } from 'react-toastify';

interface InvoiceAddress {
  firstName?: string;
  lastName?: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
}

interface InvoiceCustomer {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  billingAddress?: InvoiceAddress;
  shippingAddress?: InvoiceAddress;
}

interface CustomerOption extends InvoiceCustomer {
  isRegistered: boolean;
  savedAddresses?: Array<InvoiceAddress & { isDefault?: boolean }>;
}

interface InvoiceItem {
  productId?: string;
  productName?: string;
  productImageUrl?: string;
  variantSku?: string;
  productMode: 'simple' | '3d-modal';
  model3DId?: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  customer: InvoiceCustomer;
  items: InvoiceItem[];
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  total: number;
  issueDate: string;
  dueDate?: string;
  notes?: string;
  internalNotes?: string;
  status: 'draft' | 'sent' | 'cancelled';
  paymentStatus: 'unpaid' | 'paid';
  sentAt?: string;
  paidAt?: string;
  createdAt: string;
}

interface InvoiceLineForm {
  lineId: string;
  productId?: string;
  productName?: string;
  productImageUrl?: string;
  variantSku?: string;
  productMode: 'simple' | '3d-modal';
  model3DId?: string;
  name: string;
  description: string;
  quantity: string;
  unitPrice: string;
}

interface InvoiceForm {
  customerEmail: string;
  shippingAddress: InvoiceAddress;
  items: InvoiceLineForm[];
  taxAmount: string;
  shippingAmount: string;
  issueDate: string;
  dueDate: string;
  notes: string;
  internalNotes: string;
}

const newLine = (): InvoiceLineForm => ({
  lineId: crypto.randomUUID(),
  productMode: 'simple',
  name: '',
  description: '',
  quantity: '1',
  unitPrice: '',
});
const today = () => new Date().toISOString().slice(0, 10);
const emptyForm = (): InvoiceForm => ({
  customerEmail: '',
  shippingAddress: {},
  items: [newLine()],
  taxAmount: '0',
  shippingAmount: '0',
  issueDate: today(),
  dueDate: '',
  notes: '',
  internalNotes: '',
});
const currency = (value: number) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
const dateLabel = (value?: string) => value
  ? new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  : '—';

const statusClass: Record<Invoice['status'], string> = {
  draft: 'bg-slate-100 text-slate-600',
  sent: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
};

const paymentClass: Record<Invoice['paymentStatus'], string> = {
  unpaid: 'bg-orange-50 text-orange-700',
  paid: 'bg-green-50 text-green-700',
};

function getCatalogPrice(product: AdminProduct, variant?: ProductVariant) {
  const price = variant?.price || product.salePrice || product.regularPrice || product.basePrice || 0;
  return price > 0 ? price : undefined;
}

function getVariantLabel(variant: ProductVariant) {
  return variant.optionSummary || [variant.size, variant.color, variant.gender].filter(Boolean).join(' / ');
}

function getAddressLines(address?: InvoiceAddress) {
  if (!address) return [];
  return [
    `${address.firstName || ''} ${address.lastName || ''}`.trim(),
    address.address1,
    address.phone,
    address.country,
    address.city,
    address.postalCode,
  ].filter(Boolean);
}

const ADDRESS_FIELDS: Array<{ key: keyof InvoiceAddress; label: string }> = [
  { key: 'firstName', label: 'First name' },
  { key: 'lastName', label: 'Last name' },
  { key: 'address1', label: 'Address' },
  { key: 'phone', label: 'Number' },
  { key: 'country', label: 'Country' },
  { key: 'city', label: 'City' },
  { key: 'postalCode', label: 'Postal code' },
];

function copyInvoiceAddress(address?: InvoiceAddress): InvoiceAddress {
  return {
    firstName: address?.firstName,
    lastName: address?.lastName,
    address1: address?.address1,
    address2: address?.address2,
    city: address?.city,
    state: address?.state,
    postalCode: address?.postalCode,
    country: address?.country,
    phone: address?.phone,
  };
}

function getCustomerAddressDefaults(customer: CustomerOption) {
  const savedAddress = customer.savedAddresses?.find((address) => address.isDefault)
    || customer.savedAddresses?.[0];
  const shippingAddress = customer.shippingAddress || savedAddress || customer.billingAddress;
  return {
    shippingAddress: copyInvoiceAddress(shippingAddress),
  };
}

const InvoiceAddressFields: React.FC<{
  title: string;
  address: InvoiceAddress;
  onChange: (patch: Partial<InvoiceAddress>) => void;
}> = ({ title, address, onChange }) => (
  <fieldset className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
    <legend className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-600">{title}</legend>
    <div className="grid gap-3 sm:grid-cols-2">
      {ADDRESS_FIELDS.map(({ key, label }) => (
        <label key={key} className="block text-[9px] font-black uppercase tracking-wider text-slate-500">
          {label}
          <input
            type={key === 'phone' ? 'tel' : 'text'}
            maxLength={key === 'address1' || key === 'address2' ? 200 : key === 'phone' ? 50 : key === 'postalCode' ? 30 : 100}
            value={address[key] || ''}
            onChange={(event) => onChange({ [key]: event.target.value })}
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-500"
          />
        </label>
      ))}
    </div>
  </fieldset>
);

const InvoiceLineEditor: React.FC<{
  item: InvoiceLineForm;
  index: number;
  canRemove: boolean;
  onChange: (patch: Partial<InvoiceLineForm>) => void;
  onRemove: () => void;
}> = ({ item, index, canRemove, onChange, onRemove }) => {
  const [selectedProduct, setSelectedProduct] = useState<AdminProduct | null>(null);
  const [productQuery, setProductQuery] = useState(item.productName || '');
  const [productResults, setProductResults] = useState<AdminProduct[]>([]);
  const [isProductPickerOpen, setIsProductPickerOpen] = useState(false);
  const [isSearchingProducts, setIsSearchingProducts] = useState(false);

  useEffect(() => {
    if (!item.productId) return;

    let active = true;
    getAdminProductByIdApi(item.productId)
      .then((response) => {
        if (active && response.ok) {
          setSelectedProduct(response.product);
          setProductQuery(response.product.name);
        }
      })
      .catch((error) => {
        if (active) toast.error(getApiErrorMessage(error, 'Could not load the selected product.'));
      });

    return () => {
      active = false;
    };
  }, [item.productId]);

  useEffect(() => {
    if (!isProductPickerOpen) return;
    let active = true;
    const timer = window.setTimeout(() => {
      setIsSearchingProducts(true);
      getAdminProductsApi({
        page: 1,
        pageSize: 20,
        status: 'active',
        search: productQuery.trim() || undefined,
      })
        .then((response) => {
          if (active) setProductResults(response.items);
        })
        .catch((error) => {
          if (active) toast.error(getApiErrorMessage(error, 'Could not search products.'));
        })
        .finally(() => {
          if (active) setIsSearchingProducts(false);
        });
    }, productQuery ? 250 : 0);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [isProductPickerOpen, productQuery]);

  const selectProduct = (product: AdminProduct) => {
    setSelectedProduct(product);
    setProductQuery(product.name);
    setIsProductPickerOpen(false);
    onChange({
      productId: product.id,
      productName: product.name,
      productImageUrl: product.mainImageUrl,
      variantSku: undefined,
      productMode: 'simple',
      model3DId: undefined,
      name: product.name,
      unitPrice: String(getCatalogPrice(product) ?? ''),
    });
  };

  const selectedVariant = selectedProduct?.variants.find((variant) => variant.sku === item.variantSku);
  const variants = selectedProduct?.variants.filter((variant) => variant.isActive !== false) || [];
  const hasConfigured3D = Boolean(selectedProduct?.is3dModal && selectedProduct.modalId);
  const catalogPrice = selectedProduct ? getCatalogPrice(selectedProduct, selectedVariant) : undefined;

  const selectVariant = (variantSku: string) => {
    const variant = variants.find((entry) => entry.sku === variantSku);
    onChange({
      variantSku: variant?.sku || undefined,
      name: selectedProduct?.name || '',
      unitPrice: selectedProduct ? String(getCatalogPrice(selectedProduct, variant) ?? '') : item.unitPrice,
    });
  };

  return (
    <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50/50 p-4">
      <div className="relative">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
          Item name *
          <input
            required
            value={item.productId && selectedProduct?.id === item.productId ? selectedProduct.name : productQuery}
            onFocus={() => setIsProductPickerOpen(true)}
            onChange={(event) => {
              setProductQuery(event.target.value);
              setSelectedProduct(null);
              onChange({
                productId: undefined,
                productName: undefined,
                variantSku: undefined,
                productMode: 'simple',
                model3DId: undefined,
                name: '',
                unitPrice: '',
              });
              setIsProductPickerOpen(true);
            }}
            placeholder="Search website products..."
            autoComplete="off"
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-500"
          />
        </label>
        {isProductPickerOpen && (
          <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
            {isSearchingProducts ? (
              <p className="px-3 py-4 text-xs font-medium text-slate-400">Searching active products…</p>
            ) : productResults.length ? productResults.map((product) => (
              <button
                type="button"
                key={product.id}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectProduct(product)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-orange-50"
              >
                <Image
                  src={product.mainImageUrl}
                  alt=""
                  width={44}
                  height={44}
                  className="h-11 w-11 shrink-0 rounded-lg bg-slate-100 object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold text-slate-800">{product.name}</span>
                  <span className="block text-[10px] text-slate-400">{product.slug}</span>
                </span>
                <span className="shrink-0 text-xs font-black text-slate-700">
                  {getCatalogPrice(product) === undefined ? 'Set price' : currency(getCatalogPrice(product) ?? 0)}
                </span>
              </button>
            )) : (
              <p className="px-3 py-4 text-xs font-medium text-slate-400">
                {productQuery ? 'No products found.' : 'No active products available.'}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
          Description
          <input maxLength={1000} value={item.description} onChange={(event) => onChange({ description: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-500" />
        </label>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
          Quantity *
          <input required type="number" min="1" step="1" value={item.quantity} onChange={(event) => onChange({ quantity: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-500" />
        </label>
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
          Unit price (USD) *
          <input required type="number" min="0" step="0.01" value={item.unitPrice} onChange={(event) => onChange({ unitPrice: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-500" />
          <span className="mt-1 block text-[9px] font-medium normal-case tracking-normal text-slate-400">
            {item.productId && catalogPrice === undefined
              ? 'No catalog price set. Enter the unit price manually.'
              : item.productId ? 'Catalog price filled in; you can adjust it for this invoice.' : 'Select a website product first.'}
          </span>
        </label>
        <div className="flex items-end justify-between sm:col-span-2">
          <p className="text-xs font-bold text-slate-500">
            Line total: {currency((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))}
          </p>
          <button type="button" disabled={!canRemove} onClick={onRemove} aria-label={`Remove invoice line ${index + 1}`} className="rounded-xl p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"><X className="h-4 w-4" /></button>
        </div>
      </div>

      {variants.length > 0 && (
        <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">
          Product variant
          <select value={item.variantSku || ''} onChange={(event) => selectVariant(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium normal-case tracking-normal text-slate-800 outline-none focus:border-orange-500">
            <option value="">Product default price</option>
            {variants.map((variant) => (
              <option key={variant.sku} value={variant.sku}>
                {getVariantLabel(variant)} — {selectedProduct && getCatalogPrice(selectedProduct, variant) !== undefined
                  ? currency(getCatalogPrice(selectedProduct, variant) ?? 0)
                  : 'Enter price'}
              </option>
            ))}
          </select>
        </label>
      )}

      {hasConfigured3D && (
        <fieldset className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
          <legend className="px-1 text-[10px] font-black uppercase tracking-wider text-slate-700">Is this for a 3D modal or a simple product?</legend>
          <div className="mt-2 flex flex-wrap gap-5">
            {([
              ['simple', 'Simple product'],
              ['3d-modal', '3D modal'],
            ] as const).map(([value, label]) => (
              <label key={value} className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <input
                  type="radio"
                  name={`product-mode-${index}`}
                  value={value}
                  checked={(item.productMode || 'simple') === value}
                  onChange={() => onChange({
                    productMode: value,
                    model3DId: value === '3d-modal' ? selectedProduct?.modalId || undefined : undefined,
                  })}
                  className="accent-orange-600"
                />
                {label}
              </label>
            ))}
          </div>
          {item.productMode === '3d-modal' && <p className="mt-2 text-[10px] font-medium text-slate-500">Configured 3D model will be linked to this invoice item.</p>}
        </fieldset>
      )}
    </div>
  );
};

export const AdminInvoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerPickerOpen, setIsCustomerPickerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [form, setForm] = useState<InvoiceForm>(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [busyAction, setBusyAction] = useState('');

  const fetchInvoices = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data } = await apiClient.get<{ ok: boolean; invoices: Invoice[] }>('/api/admin/invoices', {
        params: {
          search: search.trim() || undefined,
          status: statusFilter || undefined,
          paymentStatus: paymentFilter || undefined,
        },
      });
      setInvoices(data.invoices);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load invoices.'));
    } finally {
      setIsLoading(false);
    }
  }, [paymentFilter, search, statusFilter]);

  const fetchCustomers = useCallback(async () => {
    try {
      const { data } = await apiClient.get<{ ok: boolean; customers: CustomerOption[] }>('/api/admin/customers');
      setCustomers(data.customers);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not load customers.'));
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchInvoices(), search ? 300 : 0);
    return () => window.clearTimeout(timer);
  }, [fetchInvoices, search]);

  useEffect(() => {
    const timer = window.setTimeout(() => void fetchCustomers(), 0);
    return () => window.clearTimeout(timer);
  }, [fetchCustomers]);

  const openNewInvoice = () => {
    setEditingInvoice(null);
    setForm(emptyForm());
    setIsFormOpen(true);
  };

  const openInvoiceEditor = (invoice: Invoice) => {
    setEditingInvoice(invoice);
    const existingCustomer = customers.find((customer) => customer.email === invoice.customer.email);
    const customerAddressDefaults = existingCustomer
      ? getCustomerAddressDefaults(existingCustomer)
      : { shippingAddress: {} };
    setForm({
      customerEmail: invoice.customer.email,
      shippingAddress: copyInvoiceAddress(
        invoice.customer.shippingAddress || invoice.customer.billingAddress || customerAddressDefaults.shippingAddress
      ),
      items: invoice.items.map((item) => ({
        lineId: crypto.randomUUID(),
        productId: item.productId,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        variantSku: item.variantSku,
        productMode: item.productMode || 'simple',
        model3DId: item.model3DId,
        name: item.name,
        description: item.description || '',
        quantity: String(item.quantity),
        unitPrice: String(item.unitPrice),
      })),
      taxAmount: String(invoice.taxAmount),
      shippingAmount: String(invoice.shippingAmount),
      issueDate: invoice.issueDate.slice(0, 10),
      dueDate: invoice.dueDate?.slice(0, 10) || '',
      notes: invoice.notes || '',
      internalNotes: invoice.internalNotes || '',
    });
    setSelectedInvoice(null);
    setIsFormOpen(true);
  };

  const updateLine = (index: number, patch: Partial<InvoiceLineForm>) => {
    setForm((current) => ({
      ...current,
      items: current.items.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item),
    }));
  };

  const updateAddress = (patch: Partial<InvoiceAddress>) => {
    setForm((current) => ({
      ...current,
      shippingAddress: { ...current.shippingAddress, ...patch },
    }));
  };

  const selectedCustomer = customers.find((customer) => customer.email === form.customerEmail);
  const filteredCustomers = customers.filter((customer) => {
    const query = customerSearch.trim().toLowerCase();
    return !query
      || customer.name.toLowerCase().includes(query)
      || customer.email.toLowerCase().includes(query)
      || customer.phone?.toLowerCase().includes(query);
  });
  const subtotal = form.items.reduce((sum, item) => {
    const quantity = Number(item.quantity) || 0;
    const unitPrice = Number(item.unitPrice) || 0;
    return sum + quantity * unitPrice;
  }, 0);
  const total = subtotal + (Number(form.taxAmount) || 0) + (Number(form.shippingAmount) || 0);

  const saveInvoice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedCustomer) {
      toast.error('Select a customer before saving the invoice.');
      return;
    }
    if (form.items.some((item) => !item.productId)) {
      toast.error('Select a website product for every invoice item.');
      return;
    }

    const payload = {
      customer: {
        id: selectedCustomer.id,
        name: selectedCustomer.name,
        email: selectedCustomer.email,
        phone: selectedCustomer.phone,
        shippingAddress: form.shippingAddress,
      },
      items: form.items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        productImageUrl: item.productImageUrl,
        variantSku: item.variantSku,
        productMode: item.productMode,
        model3DId: item.productMode === '3d-modal' ? item.model3DId : undefined,
        name: item.name.trim(),
        description: item.description.trim() || undefined,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
      })),
      taxAmount: Number(form.taxAmount),
      shippingAmount: Number(form.shippingAmount),
      issueDate: form.issueDate,
      dueDate: form.dueDate || null,
      notes: form.notes.trim() || null,
      internalNotes: form.internalNotes.trim() || null,
    };

    setIsSaving(true);
    try {
      const result = editingInvoice
        ? await apiClient.patch<{ ok: boolean; invoice: Invoice }>(`/api/admin/invoices/${editingInvoice._id}`, payload)
        : await apiClient.post<{ ok: boolean; invoice: Invoice }>('/api/admin/invoices', payload);
      setIsFormOpen(false);
      setEditingInvoice(null);
      setSelectedInvoice(result.data.invoice);
      toast.success(editingInvoice ? 'Draft invoice updated.' : 'Invoice draft created.');
      await fetchInvoices();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not save this invoice.'));
    } finally {
      setIsSaving(false);
    }
  };

  const sendInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`Send ${invoice.invoiceNumber} to ${invoice.customer.email}?`)) return;
    setBusyAction(`${invoice._id}-send`);
    try {
      const { data } = await apiClient.post<{ ok: boolean; invoice: Invoice }>(`/api/admin/invoices/${invoice._id}/send`);
      setSelectedInvoice(data.invoice);
      toast.success(`Invoice sent to ${invoice.customer.email}.`);
      await fetchInvoices();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invoice email could not be sent.'));
    } finally {
      setBusyAction('');
    }
  };

  const markInvoicePaid = async (invoice: Invoice) => {
    if (!window.confirm(`Mark ${invoice.invoiceNumber} as paid?`)) return;
    setBusyAction(`${invoice._id}-paid`);
    try {
      const { data } = await apiClient.post<{ ok: boolean; invoice: Invoice }>(`/api/admin/invoices/${invoice._id}/mark-paid`);
      setSelectedInvoice(data.invoice);
      toast.success('Invoice marked as paid.');
      await fetchInvoices();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not update payment status.'));
    } finally {
      setBusyAction('');
    }
  };

  const cancelInvoice = async (invoice: Invoice) => {
    if (!window.confirm(`Cancel ${invoice.invoiceNumber}?`)) return;
    setBusyAction(`${invoice._id}-cancel`);
    try {
      const { data } = await apiClient.post<{ ok: boolean; invoice: Invoice }>(`/api/admin/invoices/${invoice._id}/cancel`);
      setSelectedInvoice(data.invoice);
      toast.success('Invoice cancelled.');
      await fetchInvoices();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not cancel this invoice.'));
    } finally {
      setBusyAction('');
    }
  };

  const deleteInvoice = async (invoice: Invoice) => {
    const confirmed = window.confirm(
      `Permanently delete invoice ${invoice.invoiceNumber}? This cannot be undone.`
    );
    if (!confirmed) return;

    setBusyAction(`${invoice._id}-delete`);
    try {
      await apiClient.delete<{ ok: boolean; message?: string }>(`/api/admin/invoices/${invoice._id}`);
      setSelectedInvoice((current) => current?._id === invoice._id ? null : current);
      toast.success(`${invoice.invoiceNumber} deleted.`);
      await fetchInvoices();
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not delete this invoice.'));
    } finally {
      setBusyAction('');
    }
  };

  const downloadPdf = async (invoice: Invoice) => {
    setBusyAction(`${invoice._id}-pdf`);
    try {
      const { data } = await apiClient.get<Blob>(`/api/admin/invoices/${invoice._id}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `invoice-${invoice.invoiceNumber}.pdf`;
      anchor.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Could not download the invoice PDF.'));
    } finally {
      setBusyAction('');
    }
  };

  const openDetails = (invoice: Invoice) => setSelectedInvoice(invoice);
  const unpaidTotal = invoices.filter((invoice) => invoice.paymentStatus === 'unpaid' && invoice.status !== 'cancelled')
    .reduce((sum, invoice) => sum + invoice.total, 0);

  return (
    <div className="space-y-8 pb-16">
      <header className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
        <div>
          <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Invoices</h1>
          <p className="mt-2 text-sm font-medium italic text-slate-500">Prepare, review, and manually send customer invoices.</p>
        </div>
        <button onClick={openNewInvoice} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700">
          <Plus className="h-4 w-4" /> Create Invoice
        </button>
      </header>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Invoices shown</p>
          <p className="mt-2 text-3xl font-black italic text-slate-900">{invoices.length}</p>
        </div>
        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Unpaid balance shown</p>
          <p className="mt-2 text-3xl font-black italic text-orange-600">{currency(unpaidTotal)}</p>
        </div>
        <div className="rounded-[28px] border border-slate-100 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Customer records</p>
          <p className="mt-2 text-3xl font-black italic text-slate-900">{customers.length}</p>
        </div>
      </div>

      <section className="overflow-hidden rounded-[32px] border border-slate-100 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-5 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search invoice or customer..." className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-xs font-bold outline-none focus:border-orange-500 focus:bg-white" />
          </div>
          <div className="flex gap-2">
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[10px] font-black uppercase tracking-wider outline-none focus:border-orange-500">
              <option value="">All statuses</option>
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value)} className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-[10px] font-black uppercase tracking-wider outline-none focus:border-orange-500">
              <option value="">All payments</option>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[850px] text-left">
            <thead className="bg-slate-50">
              <tr>
                {['Invoice', 'Customer', 'Issue date', 'Total', 'Status', 'Payment', ''].map((heading) => (
                  <th key={heading} className="px-6 py-4 text-[9px] font-black uppercase tracking-widest text-slate-400">{heading}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center text-xs font-bold uppercase tracking-widest text-slate-400"><Loader2 className="mx-auto mb-3 h-5 w-5 animate-spin text-orange-600" />Loading invoices</td></tr>
              ) : invoices.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center"><FileText className="mx-auto mb-3 h-8 w-8 text-slate-200" /><p className="text-xs font-bold uppercase tracking-widest text-slate-400">No invoices found</p></td></tr>
              ) : invoices.map((invoice) => (
                <tr key={invoice._id} className="transition-colors hover:bg-slate-50/70">
                  <td className="px-6 py-5"><button onClick={() => openDetails(invoice)} className="text-sm font-black text-slate-900 hover:text-orange-600">{invoice.invoiceNumber}</button><p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Due {dateLabel(invoice.dueDate)}</p></td>
                  <td className="px-6 py-5"><p className="text-sm font-bold text-slate-800">{invoice.customer.name}</p><p className="mt-1 text-xs text-slate-400">{invoice.customer.email}</p></td>
                  <td className="px-6 py-5 text-xs font-bold text-slate-500">{dateLabel(invoice.issueDate)}</td>
                  <td className="px-6 py-5 text-sm font-black text-slate-900">{currency(invoice.total)}</td>
                  <td className="px-6 py-5"><span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${statusClass[invoice.status]}`}>{invoice.status}</span></td>
                  <td className="px-6 py-5"><span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase tracking-wider ${paymentClass[invoice.paymentStatus]}`}>{invoice.paymentStatus}</span></td>
                  <td className="px-6 py-5"><div className="flex justify-end gap-2">
                    <button aria-label={`View ${invoice.invoiceNumber}`} onClick={() => openDetails(invoice)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-orange-300 hover:text-orange-600"><Eye className="h-4 w-4" /></button>
                    <button aria-label={`Download ${invoice.invoiceNumber}`} onClick={() => void downloadPdf(invoice)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-orange-300 hover:text-orange-600"><Download className="h-4 w-4" /></button>
                    <button aria-label={`Delete ${invoice.invoiceNumber}`} disabled={busyAction === `${invoice._id}-delete`} onClick={() => void deleteInvoice(invoice)} className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:border-red-300 hover:text-red-600 disabled:opacity-50"><Trash2 className="h-4 w-4" /></button>
                  </div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {isFormOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4">
          <button aria-label="Close invoice editor" onClick={() => setIsFormOpen(false)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <form onSubmit={saveInvoice} className="relative my-6 max-h-[92vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl md:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div><h2 className="text-2xl font-black italic uppercase tracking-tight text-slate-900">{editingInvoice ? 'Edit draft' : 'Create invoice'}</h2><p className="mt-1 text-xs text-slate-500">Choose website products and set invoice-specific pricing, tax, and shipping.</p></div>
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="relative md:col-span-2">
                <label htmlFor="invoice-customer-search" className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Customer *
                  <span className="relative mt-2 block">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      id="invoice-customer-search"
                      type="search"
                      required
                      role="combobox"
                      aria-autocomplete="list"
                      aria-expanded={isCustomerPickerOpen}
                      aria-controls="invoice-customer-options"
                      value={isCustomerPickerOpen ? customerSearch : selectedCustomer ? `${selectedCustomer.name} — ${selectedCustomer.email}` : ''}
                      onFocus={() => {
                        setCustomerSearch('');
                        setIsCustomerPickerOpen(true);
                      }}
                      onBlur={() => window.setTimeout(() => setIsCustomerPickerOpen(false), 120)}
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') setIsCustomerPickerOpen(false);
                      }}
                      onChange={(event) => {
                        setCustomerSearch(event.target.value);
                        setIsCustomerPickerOpen(true);
                      }}
                      placeholder="Search by name, email, or phone..."
                      autoComplete="off"
                      className="w-full rounded-xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-medium normal-case text-slate-800 outline-none focus:border-orange-500"
                    />
                  </span>
                </label>
                {isCustomerPickerOpen && (
                  <div id="invoice-customer-options" role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                    {filteredCustomers.length ? filteredCustomers.map((customer) => (
                      <button
                        key={`${customer.email}-${customer.id}`}
                        type="button"
                        role="option"
                        aria-selected={customer.email === form.customerEmail}
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => {
                          const addressDefaults = getCustomerAddressDefaults(customer);
                          setForm((current) => ({
                            ...current,
                            customerEmail: customer.email,
                            ...addressDefaults,
                          }));
                          setCustomerSearch('');
                          setIsCustomerPickerOpen(false);
                        }}
                        className="w-full rounded-lg px-3 py-2.5 text-left hover:bg-orange-50"
                      >
                        <span className="block truncate text-xs font-bold text-slate-800">{customer.name}</span>
                        <span className="mt-0.5 block truncate text-[10px] text-slate-400">{customer.email}{customer.phone ? ` · ${customer.phone}` : ''}</span>
                      </button>
                    )) : (
                      <p className="px-3 py-4 text-xs font-medium text-slate-400">No customers found.</p>
                    )}
                  </div>
                )}
              </div>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Issue date *
                <input required type="date" value={form.issueDate} onChange={(event) => setForm((current) => ({ ...current, issueDate: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-orange-500" />
              </label>
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Due date
                <input type="date" value={form.dueDate} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-800 outline-none focus:border-orange-500" />
              </label>
            </div>

            {selectedCustomer && <p className="mt-3 text-xs text-slate-500">Invoice will be sent to <strong className="text-slate-800">{selectedCustomer.email}</strong>.</p>}

            <div className="mt-6">
              <InvoiceAddressFields
                title="Shipping address"
                address={form.shippingAddress}
                onChange={updateAddress}
              />
            </div>

            <div className="mt-8">
              <div className="mb-3 flex items-center justify-between"><h3 className="text-xs font-black uppercase tracking-widest text-slate-800">Line items</h3><button type="button" onClick={() => setForm((current) => ({ ...current, items: [newLine(), ...current.items] }))} className="text-[10px] font-black uppercase tracking-widest text-orange-600 hover:text-orange-700">+ Add item</button></div>
              <div className="space-y-3">
                {form.items.map((item, index) => (
                  <InvoiceLineEditor
                    key={item.lineId}
                    item={item}
                    index={index}
                    canRemove={form.items.length > 1}
                    onChange={(patch) => updateLine(index, patch)}
                    onRemove={() => setForm((current) => ({
                      ...current,
                      items: current.items.filter((_, itemIndex) => itemIndex !== index),
                    }))}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Customer notes
                  <textarea rows={3} maxLength={2000} value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm normal-case tracking-normal outline-none focus:border-orange-500" />
                </label>
                <label className="block text-[10px] font-black uppercase tracking-wider text-slate-500">Internal notes
                  <textarea rows={3} maxLength={2000} value={form.internalNotes} onChange={(event) => setForm((current) => ({ ...current, internalNotes: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm normal-case tracking-normal outline-none focus:border-orange-500" />
                </label>
              </div>
              <div className="space-y-3 rounded-2xl bg-slate-50 p-5">
                <label className="flex items-center justify-between gap-4 text-xs font-bold text-slate-600">Subtotal <span className="font-black text-slate-900">{currency(subtotal)}</span></label>
                <label className="flex items-center justify-between gap-4 text-xs font-bold text-slate-600">Tax amount
                  <input required type="number" min="0" step="0.01" value={form.taxAmount} onChange={(event) => setForm((current) => ({ ...current, taxAmount: event.target.value }))} className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm font-bold outline-none focus:border-orange-500" />
                </label>
                <label className="flex items-center justify-between gap-4 text-xs font-bold text-slate-600">Shipping amount
                  <input required type="number" min="0" step="0.01" value={form.shippingAmount} onChange={(event) => setForm((current) => ({ ...current, shippingAmount: event.target.value }))} className="w-32 rounded-lg border border-slate-200 bg-white px-3 py-2 text-right text-sm font-bold outline-none focus:border-orange-500" />
                </label>
                <div className="border-t border-slate-200 pt-3 text-right"><span className="mr-3 text-[10px] font-black uppercase tracking-widest text-slate-500">Total</span><strong className="text-xl font-black text-orange-600">{currency(total)}</strong></div>
              </div>
            </div>

            <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
              <button type="button" onClick={() => setIsFormOpen(false)} className="rounded-xl border border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600">Close</button>
              <button disabled={isSaving || customers.length === 0} className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
                {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingInvoice ? 'Save draft' : 'Save as draft'}
              </button>
            </div>
          </form>
        </div>
      )}

      {selectedInvoice && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto p-4">
          <button aria-label="Close invoice details" onClick={() => setSelectedInvoice(null)} className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm" />
          <section className="relative my-6 max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-orange-600">Invoice dossier</p><h2 className="mt-1 text-2xl font-black italic text-slate-900">{selectedInvoice.invoiceNumber}</h2><p className="mt-1 text-sm text-slate-500">{selectedInvoice.customer.name} · {selectedInvoice.customer.email}</p></div>
              <button aria-label="Close" onClick={() => setSelectedInvoice(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase ${statusClass[selectedInvoice.status]}`}>{selectedInvoice.status}</span>
              <span className={`rounded-full px-3 py-1.5 text-[9px] font-black uppercase ${paymentClass[selectedInvoice.paymentStatus]}`}>{selectedInvoice.paymentStatus}</span>
              <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[9px] font-black uppercase text-slate-600">Due {dateLabel(selectedInvoice.dueDate)}</span>
            </div>

            <div className="mt-4 rounded-xl bg-slate-50 p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Ship to</p>
              <p className="mt-2 whitespace-pre-line text-xs leading-5 text-slate-700">
                {getAddressLines(selectedInvoice.customer.shippingAddress || selectedInvoice.customer.billingAddress).join('\n') || 'No address provided'}
              </p>
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-[9px] font-black uppercase tracking-widest text-slate-500"><tr><th className="px-4 py-3">Item</th><th className="px-4 py-3 text-right">Qty</th><th className="px-4 py-3 text-right">Unit price</th><th className="px-4 py-3 text-right">Total</th></tr></thead>
                <tbody className="divide-y divide-slate-100">{selectedInvoice.items.map((item, index) => <tr key={`${item.name}-${index}`}><td className="px-4 py-3"><div className="flex items-start gap-3">{item.productImageUrl && <Image src={item.productImageUrl} alt="" width={48} height={48} className="h-12 w-12 shrink-0 rounded-lg bg-slate-100 object-cover" />}<div><p className="font-bold text-slate-800">{item.name}</p>{item.description && <p className="mt-1 text-xs text-slate-500">{item.description}</p>}{item.variantSku && <p className="mt-1 text-[10px] font-bold text-slate-400">SKU: {item.variantSku}</p>}{item.productMode === '3d-modal' && <p className="mt-1 text-[10px] font-black uppercase tracking-wider text-orange-600">3D modal</p>}</div></div></td><td className="px-4 py-3 text-right">{item.quantity}</td><td className="px-4 py-3 text-right">{currency(item.unitPrice)}</td><td className="px-4 py-3 text-right font-bold">{currency(item.lineTotal)}</td></tr>)}</tbody>
              </table>
            </div>

            <div className="ml-auto mt-5 max-w-xs space-y-2 text-sm">
              <div className="flex justify-between text-slate-500"><span>Subtotal</span><span>{currency(selectedInvoice.subtotal)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Tax</span><span>{currency(selectedInvoice.taxAmount)}</span></div>
              <div className="flex justify-between text-slate-500"><span>Shipping</span><span>{currency(selectedInvoice.shippingAmount)}</span></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-black text-slate-900"><span>Total</span><span>{currency(selectedInvoice.total)}</span></div>
            </div>
            {selectedInvoice.notes && <div className="mt-5 rounded-xl bg-slate-50 p-4"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Customer notes</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{selectedInvoice.notes}</p></div>}
            {selectedInvoice.internalNotes && <div className="mt-3 rounded-xl bg-orange-50 p-4"><p className="text-[9px] font-black uppercase tracking-widest text-orange-600">Internal notes</p><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{selectedInvoice.internalNotes}</p></div>}

            <div className="mt-7 flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-5">
              <button disabled={busyAction === `${selectedInvoice._id}-pdf`} onClick={() => void downloadPdf(selectedInvoice)} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:opacity-50"><Download className="h-4 w-4" /> PDF</button>
              {selectedInvoice.status === 'draft' && <button onClick={() => openInvoiceEditor(selectedInvoice)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-slate-600 hover:border-orange-300 hover:text-orange-600">Edit draft</button>}
              {selectedInvoice.status !== 'cancelled' && selectedInvoice.paymentStatus === 'unpaid' && <button disabled={busyAction === `${selectedInvoice._id}-send`} onClick={() => void sendInvoice(selectedInvoice)} className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-slate-800 disabled:opacity-50"><Send className="h-4 w-4" /> Send email</button>}
              {selectedInvoice.status !== 'cancelled' && selectedInvoice.paymentStatus === 'unpaid' && <button disabled={busyAction === `${selectedInvoice._id}-paid`} onClick={() => void markInvoicePaid(selectedInvoice)} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-white hover:bg-green-700 disabled:opacity-50"><Check className="h-4 w-4" /> Mark paid</button>}
              {selectedInvoice.status !== 'cancelled' && selectedInvoice.paymentStatus === 'unpaid' && <button disabled={busyAction === `${selectedInvoice._id}-cancel`} onClick={() => void cancelInvoice(selectedInvoice)} className="rounded-xl border border-red-200 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 disabled:opacity-50">Cancel</button>}
              <button disabled={busyAction === `${selectedInvoice._id}-delete`} onClick={() => void deleteInvoice(selectedInvoice)} className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2.5 text-[10px] font-black uppercase tracking-wider text-red-600 hover:bg-red-50 disabled:opacity-50"><Trash2 className="h-4 w-4" /> Delete invoice</button>
            </div>
            {busyAction.startsWith(`${selectedInvoice._id}-`) && <p className="mt-3 text-right text-[10px] font-bold uppercase tracking-widest text-slate-400"><Loader2 className="mr-2 inline h-3 w-3 animate-spin" />Working…</p>}
          </section>
        </div>
      )}
    </div>
  );
};
