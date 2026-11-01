"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Save, Truck, Package, Calendar, Loader2, FileText, Trophy, Eye, Download, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'react-toastify';

export default function OrderDetailClient({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [status, setStatus] = useState('pending');
  const [trackingId, setTrackingId] = useState('');
  const [carrier, setCarrier] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedPreview, setSelectedPreview] = useState<{ view: string; url: string } | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data } = await apiClient.get(`/api/orders/admin/${orderId}`);
        if (data.ok) {
          setOrder(data.order);
          setStatus(data.order.status);
          setTrackingId(data.order.trackingId || '');
          setCarrier(data.order.carrier || '');
          setTrackingUrl(data.order.trackingUrl || '');
          setNotes(data.order.notes || '');
        }
      } catch (err) {
        console.error('Failed to fetch order', err);
        toast.error('Failed to load order details');
        router.push('/admin/orders');
      } finally {
        setIsLoading(false);
      }
    };
    fetchOrder();
  }, [orderId, router]);

  const handleUpdate = async () => {
    try {
      setIsSaving(true);
      const { data } = await apiClient.put(`/api/orders/admin/${orderId}`, {
        status,
        trackingId: trackingId.trim() || null,
        carrier: carrier.trim() || null,
        trackingUrl: trackingUrl.trim() || null,
        notes: notes.trim() || null,
      });
      if (data.ok) {
        toast.success('Order updated successfully!');
        setOrder(data.order);
      }
    } catch (err) {
      toast.error('Failed to update order');
    } finally {
      setIsSaving(false);
    }
  };

  const downloadPreview = async (preview: { view: string; url: string }) => {
    try {
      const response = await fetch(preview.url);
      if (!response.ok) throw new Error('Preview download failed');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = `3d-${preview.view}-preview.${blob.type.includes('png') ? 'png' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (error) {
      console.error('Failed to download 3D preview', error);
      toast.error('Unable to download this preview.');
    }
  };

  if (isLoading || !order) {
    return (
      <div className="space-y-8">
        <div className="flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-40" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full rounded-[32px]" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-96 w-full rounded-[32px]" />
            <Skeleton className="h-64 w-full rounded-[32px]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
              Order <span className="text-orange-600">#{order.id.slice(-6).toUpperCase()}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <Calendar className="w-3.5 h-3.5" /> {new Date(order.createdAt).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">

          {/* Items */}
          <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm">
            <h3 className="text-xl font-black uppercase tracking-tighter italic text-slate-900 mb-6 flex items-center gap-2">
              <Package className="text-orange-600 w-5 h-5" /> Items Ordered
            </h3>
            <div className="space-y-6">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50">
                  <div className="w-20 h-20 bg-white rounded-xl overflow-hidden shrink-0">
                    <img src={item.imageUrl || '/placeholder.png'} className="w-full h-full object-cover" alt={item.name} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-slate-900 truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold mt-1 uppercase tracking-widest">
                      {[item.color, item.size].filter(Boolean).join(' / ')}
                    </p>
                    <p className="text-xs font-bold text-slate-500 mt-2">SKU: {item.variantSku}</p>
                  </div>
                  <div className="text-right flex flex-col justify-between">
                    <p className="text-sm font-black text-slate-900">
                      {order.type === 'request' ? 'QUOTE PENDING' : `$${item.price.toFixed(2)}`}
                    </p>
                    <p className="text-xs font-bold text-slate-400">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Customization Dossier (Only for Requests) */}
          {order.type === 'request' && (
            <div className="bg-[#141414] text-white rounded-[32px] p-8 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                <Package className="w-32 h-32 rotate-12" />
              </div>

              <h3 className="text-2xl font-black uppercase tracking-tighter italic text-orange-500 mb-8 flex items-center gap-3">
                <FileText className="w-6 h-6" /> Customization Dossier
              </h3>
              {order.source === '3d-customizer' && order.customization3d && (
                <div className="mb-8 space-y-5 relative z-10">
                  <div className="flex flex-wrap gap-3 text-xs font-black uppercase tracking-widest">
                    <span className="rounded-full bg-orange-500/15 px-4 py-2 text-orange-300">3D Customizer</span>
                    <span className="rounded-full bg-white/10 px-4 py-2 text-slate-300">{order.customization3d.modelName}</span>
                    <span className="rounded-full bg-white/10 px-4 py-2 text-slate-300">Qty: {order.customization3d.quantity}</span>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(order.customization3d.previewImages || []).map((preview: any) => (
                      <div key={preview.view} className="rounded-2xl bg-white p-2">
                        <button type="button" onClick={() => setSelectedPreview(preview)} className="group block w-full cursor-zoom-in" aria-label={`Open ${preview.view} preview`}>
                          <img src={preview.url} alt={`${preview.view} 3D preview`} className="h-36 w-full rounded-xl object-contain" />
                          <p className="pt-2 text-center text-[10px] font-black uppercase tracking-widest text-slate-500 group-hover:text-orange-600">{preview.view}</p>
                        </button>
                        <button type="button" onClick={() => downloadPreview(preview)} className="mt-2 flex w-full items-center justify-center gap-1 rounded-lg bg-slate-900 py-2 text-[9px] font-black uppercase tracking-widest text-white hover:bg-orange-600">
                          <Download className="h-3 w-3" /> Download
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Garment Colors</p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="text-[9px] uppercase tracking-widest text-slate-500">
                          <tr><th className="pb-2">Part</th><th className="pb-2">Color</th><th className="pb-2">Code</th></tr>
                        </thead>
                        <tbody>
                          {(order.customization3d.colorDetails || Object.entries(order.customization3d.colors || {}).map(([part, hex]: [string, any]) => ({ part, name: hex, hex }))).map((color: any) => (
                            <tr key={`${color.part}-${color.hex}`} className="border-t border-white/10">
                              <td className="py-2 font-bold text-slate-300">{color.part}</td>
                              <td className="py-2 font-bold text-white">
                                <span className="mr-2 inline-block h-4 w-4 rounded-full border border-white/30 align-middle" style={{ backgroundColor: color.hex }} />
                                {color.name}
                              </td>
                              <td className="py-2 font-mono text-slate-400">{color.hex}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Zone Details</p>
                    <div className="space-y-3">
                      {Object.entries(order.customization3d.zones || {}).map(([zoneId, zone]: [string, any]) => (
                        <div key={zoneId} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                          <p className="text-sm font-black text-white">{zone.label || zoneId}</p>
                          <p className="mt-1 text-xs text-slate-300">
                            {[zone.customText && `Text: ${zone.customText}`, zone.textColor && `Text color: ${zone.textColor}`, zone.fontFamily && `Font: ${zone.fontFamily}`, zone.fontSize && `Size: ${zone.fontSize}`, zone.align && `Align: ${zone.align}`, zone.logoUrl && 'Logo uploaded'].filter(Boolean).join(' · ') || 'No text or logo'}
                          </p>
                          {(zone.customLogoTransform || zone.width || zone.height) && (
                            <p className="mt-1 text-[11px] text-slate-400">
                              {zone.width && zone.height ? `Area: ${zone.width} × ${zone.height}` : ''}
                              {zone.customLogoTransform?.scale ? ` · Scale: ${zone.customLogoTransform.scale.x ?? '-'} / ${zone.customLogoTransform.scale.y ?? '-'}` : ''}
                              {zone.customLogoTransform?.rotation ? ` · Rotation: ${zone.customLogoTransform.rotation}°` : ''}
                            </p>
                          )}
                          {zone.logoUrl && <a className="mt-1 inline-block text-xs font-bold text-orange-400 underline" href={zone.logoUrl} target="_blank" rel="noreferrer">Open logo</a>}
                        </div>
                      ))}
                    </div>
                  </div>
                  {(order.teamName || order.notes) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {order.teamName && (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Team / Organization</p>
                          <p className="mt-2 text-sm font-bold text-white">{order.teamName}</p>
                        </div>
                      )}
                      {order.notes && (
                        <div className="rounded-2xl bg-white/5 border border-white/10 p-5">
                          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Additional Notes</p>
                          <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">{order.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {order.source !== '3d-customizer' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Team / Organization</p>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <Trophy className="w-5 h-5 text-orange-500" />
                      <p className="text-lg font-black italic uppercase tracking-tighter">{order.teamName || 'NOT SPECIFIED'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Deployment Deadline</p>
                    <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-4 rounded-2xl">
                      <Calendar className="w-5 h-5 text-orange-500" />
                      <p className="text-lg font-black italic uppercase tracking-tighter">
                        {order.expectedDeliveryDate ? new Date(order.expectedDeliveryDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Tactical Logo</p>
                    {order.logoUrl ? (
                      <div className="group relative bg-white/5 border border-white/10 p-4 rounded-2xl overflow-hidden">
                        <img src={order.logoUrl} className="w-full h-48 object-contain rounded-xl" alt="Custom Logo" />
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                          <a 
                            href={order.logoUrl.includes('cloudinary') ? order.logoUrl.replace('/upload/', '/upload/fl_attachment/') : order.logoUrl} 
                            download 
                            className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] italic hover:scale-105 transition-transform"
                          >
                            <Download className="w-4 h-4" /> Download Dossier Asset
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-white/5 border border-white/10 p-10 rounded-2xl text-center">
                        <p className="text-xs font-bold text-slate-500 italic uppercase">No Logo Provided</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Customization Intel</p>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl min-h-[200px]">
                      <p className="text-sm font-medium leading-relaxed text-slate-300 italic whitespace-pre-wrap">
                        {order.customizationDetails || 'No specific customization details provided.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Operational Notes</p>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                      <p className="text-sm font-medium leading-relaxed text-slate-300 italic whitespace-pre-wrap">
                        {order.notes || 'No additional notes provided by customer.'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Required Colors</p>
                    <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                      <p className="text-sm font-medium leading-relaxed text-slate-300 italic">
                        {order.items.map((item: any) => item.color || 'Not Specified').join(', ')}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Quantity</p>
                    <div className="bg-white/5 border border-white/10 p-4 rounded-2xl flex items-center gap-3">
                      <Package className="w-5 h-5 text-orange-500" />
                      <p className="text-lg font-black italic uppercase tracking-tighter">
                        {order.items.reduce((acc: number, item: any) => acc + (item.quantity || 0), 0)} Units
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>
          )}

          {/* Payment Breakdown (Only for Direct Orders) */}
          {order.type === 'direct' && (
            <div className="bg-slate-50 rounded-[32px] p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 mb-6">Payment Breakdown</h3>
              <div className="max-w-sm ml-auto space-y-3 text-xs font-bold uppercase tracking-widest text-slate-500">
                <div className="flex justify-between"><span>Subtotal:</span> <span className="text-slate-900">${order.subtotal.toFixed(2)}</span></div>
                {order.discountAmount > 0 && <div className="flex justify-between text-green-600"><span>Discount:</span> <span>-${order.discountAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between"><span>Shipping:</span> <span className="text-slate-900">${order.shippingFee.toFixed(2)}</span></div>
                {order.taxAmount > 0 && <div className="flex justify-between"><span>Tax:</span> <span className="text-slate-900">${order.taxAmount.toFixed(2)}</span></div>}
                <div className="flex justify-between pt-4 mt-2 border-t border-slate-200">
                  <span className="text-lg text-slate-900">Total:</span>
                  <span className="text-2xl font-black italic text-orange-600">${order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-8">

          {/* Action / Management Card */}
          <div className="bg-white border-2 border-orange-100 rounded-[32px] p-8 shadow-xl shadow-orange-100/50">
            <h3 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 mb-6">Manage Order</h3>

            <div className="space-y-5">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Order Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold uppercase tracking-widest outline-none focus:border-orange-500 focus:bg-white"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                  <option value="processing">Processing</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="refunded">Refunded</option>
                  <option value="failed">Failed</option>
                  <option value="dev_bypass">Dev Bypass</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Carrier</label>
                <input
                  type="text"
                  placeholder="e.g. FedEx, UPS"
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tracking ID</label>
                <div className="relative">
                  <Truck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Enter tracking number"
                    value={trackingId}
                    onChange={(e) => setTrackingId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tracking URL</label>
                <input
                  type="text"
                  placeholder="Direct link to tracking page"
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Admin Notes (Private)</label>
                <textarea
                  placeholder="Internal notes only"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-orange-500 focus:bg-white resize-none"
                />
              </div>

              <button
                onClick={handleUpdate}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-4 rounded-xl font-black uppercase tracking-widest text-xs italic hover:bg-orange-600 transition-colors disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          {/* Customer Card */}
          <div className="bg-white border text-left border-slate-100 rounded-[32px] p-8 shadow-sm">
            <h3 className="text-lg font-black uppercase tracking-tighter italic text-slate-900 border-b border-slate-50 pb-4 mb-4">Customer Info</h3>
            <p className="text-sm font-black text-slate-900 mb-1">
              {order.userId?.name || `${order.shippingAddress.firstName} ${order.shippingAddress.lastName}`}
            </p>
            <p className="text-xs font-bold text-slate-500 mb-4">{order.userId?.email || order.guestEmail || order.shippingAddress.email}</p>

            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 mt-6">Shipping Address</h4>
            <p className="text-xs text-slate-600 font-bold leading-relaxed">
              {order.shippingAddress.address1} {order.shippingAddress.address2}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.country}
            </p>
            {order.shippingAddress.phone && (
              <p className="text-xs text-slate-500 font-bold mt-2">Tel: {order.shippingAddress.phone}</p>
            )}
          </div>

        </div>
        {selectedPreview && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${selectedPreview.view} preview`}>
            <button type="button" onClick={() => setSelectedPreview(null)} className="absolute inset-0 cursor-default" aria-label="Close preview" />
            <div className="relative z-10 max-h-[90vh] max-w-4xl rounded-3xl bg-white p-4 shadow-2xl">
              <button type="button" onClick={() => setSelectedPreview(null)} className="absolute right-4 top-4 rounded-full bg-slate-900 p-2 text-white hover:bg-orange-600" aria-label="Close preview">
                <X className="h-5 w-5" />
              </button>
              <img src={selectedPreview.url} alt={`${selectedPreview.view} 3D preview enlarged`} className="max-h-[78vh] max-w-full rounded-2xl object-contain" />
              <div className="flex items-center justify-between gap-4 px-2 pt-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-600">{selectedPreview.view} preview</p>
                <button type="button" onClick={() => downloadPreview(selectedPreview)} className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white hover:bg-orange-600">
                  <Download className="h-3.5 w-3.5" /> Download image
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
