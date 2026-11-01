"use client";

import React, { useState, useEffect } from 'react';
import {
    UserPlus,
    ShoppingBag,
    Banknote,
    Truck,
    PackageCheck,
    XCircle,
    RotateCcw,
    ShoppingCart,
    FileText,
    ShieldCheck,
    ShieldAlert,
    KeyRound,
    AlertCircle,
    RefreshCcw,
    Save,
    Eye,
    Type
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-toastify';

// ─── TYPES ───────────────────────────────────────────────────────────────────
type EmailType =
    | 'welcome'
    | 'order_placed'
    | 'order_paid'
    | 'order_shipped'
    | 'order_delivered'
    | 'order_cancelled'
    | 'order_refunded'
    | 'abandoned_cart'
    | 'quote_request'
    | 'admin_new_order_direct'
    | 'admin_new_order_request'
    | 'password_reset'
    | 'low_stock_alert';

interface EmailTemplateData {
    type: string;
    subject: string;
    heading: string;
    body: string;
    buttonText: string;
}

// ─── TOKENS (mirrors the email HTML) ─────────────────────────────────────────
const C = {
    page: '#FAFAFA',
    card: '#FFFFFF',
    heading: '#050505',
    muted: '#9CA3AF',
    body: '#4B5563',
    accent: '#DD6132',
    accentSoft: '#FCEFEA',
    border: '#E5E7EB'
};

// ─── MOCK DATA ────────────────────────────────────────────────────────────────
const MOCK_ORDER = {
    id: 'AF1-69EB6',
    total: 129.99,
    subtotal: 129.99,
    items: [
        {
            name: 'Tactical Drift Pro Shirt',
            quantity: 1,
            price: 89.99,
            size: 'XL',
            image: 'https://res.cloudinary.com/dv1xqw5um/image/upload/v1776781646/af1/products/ci8kjg6q3sb55eyvulsn.png'
        },
        {
            name: 'Elite Training Shorts',
            quantity: 1,
            price: 40.0,
            size: 'L',
            image: 'https://res.cloudinary.com/dv1xqw5um/image/upload/v1776781646/af1/products/ci8kjg6q3sb55eyvulsn.png'
        }
    ]
};

// ─── EMAIL BUILDING BLOCKS ───────────────────────────────────────────────────
const Label = ({ children }: { children: React.ReactNode }) => (
    <p style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 600, color: C.muted }}>{children}</p>
);

const Block = ({ children, top = 24 }: { children: React.ReactNode; top?: number }) => (
    <div style={{ padding: `${top}px 40px 0` }}>{children}</div>
);

const Hero = ({ title, text }: { title: string; text: React.ReactNode }) => (
    <Block top={40}>
        <h1 style={{ margin: '0 0 12px', fontSize: 26, lineHeight: 1.3, fontWeight: 700, color: C.heading, whiteSpace: 'pre-wrap' }}>{title}</h1>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: C.body, whiteSpace: 'pre-wrap' }}>{text}</p>
    </Block>
);

const Accent = ({ children }: { children: React.ReactNode }) => (
    <span style={{ color: C.accent }}>{children}</span>
);

const InfoBox = ({ items }: { items: [string, React.ReactNode][] }) => (
    <Block top={28}>
        <div style={{ display: 'flex', background: C.page, border: `1px solid ${C.border}`, borderRadius: 10 }}>
            {items.map(([l, v]) => (
                <div key={l} style={{ flex: 1, padding: '18px 20px' }}>
                    <Label>{l}</Label>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.heading }}>{v}</p>
                </div>
            ))}
        </div>
    </Block>
);

const DetailRows = ({ items }: { items: [string, string][] }) => (
    <div style={{ fontSize: 14 }}>
        {items.map(([l, v], i) => (
            <div
                key={l}
                style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: 24,
                    padding: '12px 0',
                    borderTop: i > 0 ? `1px solid ${C.border}` : 'none'
                }}
            >
                <span style={{ color: C.muted }}>{l}</span>
                <span style={{ fontWeight: 600, color: C.heading, textAlign: 'right' }}>{v}</span>
            </div>
        ))}
    </div>
);

const OrderSummary = ({ title, faded = false }: { title: string; faded?: boolean }) => (
    <Block top={32}>
        <Label>{title}</Label>
        <div style={{ opacity: faded ? 0.6 : 1 }}>
            {MOCK_ORDER.items.map((item, i) => (
                <div
                    key={i}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        padding: '12px 0',
                        borderTop: i > 0 ? `1px solid ${C.border}` : 'none'
                    }}
                >
                    <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: 56, height: 56, borderRadius: 8, objectFit: 'cover', border: `1px solid ${C.border}` }}
                    />
                    <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.heading }}>{item.name}</p>
                        <p style={{ margin: '2px 0 0', fontSize: 12, color: C.muted }}>
                            Size {item.size} · Qty {item.quantity}
                        </p>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.heading }}>${item.price.toFixed(2)}</p>
                </div>
            ))}
        </div>
    </Block>
);

const TotalRow = ({ title }: { title: string }) => (
    <Block top={12}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${C.border}`, paddingTop: 16 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: C.heading }}>{title}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: C.heading }}>${MOCK_ORDER.total.toFixed(2)}</span>
        </div>
    </Block>
);

const Steps = ({ items, active = 0 }: { items: [string, string][]; active?: number }) => (
    <Block top={32}>
        <Label>What happens next</Label>
        {items.map(([title, text], i) => (
            <div key={title} style={{ display: 'flex', gap: 14, padding: '8px 0' }}>
                <div
                    style={{
                        width: 28,
                        height: 28,
                        flexShrink: 0,
                        borderRadius: '50%',
                        textAlign: 'center',
                        lineHeight: '26px',
                        fontSize: 13,
                        fontWeight: 700,
                        background: i === active ? C.accent : C.page,
                        color: i === active ? '#fff' : C.muted,
                        border: `1px solid ${i === active ? C.accent : C.border}`
                    }}
                >
                    {i + 1}
                </div>
                <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: C.heading }}>{title}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, lineHeight: 1.6, color: C.body }}>{text}</p>
                </div>
            </div>
        ))}
    </Block>
);

const Cta = ({ children }: { children: React.ReactNode }) => (
    <Block top={32}>
        <span
            style={{
                display: 'inline-block',
                background: C.accent,
                color: '#fff',
                padding: '14px 32px',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600
            }}
        >
            {children}
        </span>
    </Block>
);

const Callout = ({ title, text }: { title: string; text: string }) => (
    <Block top={28}>
        <div style={{ background: C.accentSoft, borderRadius: 10, padding: '18px 20px' }}>
            <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: C.heading }}>{title}</p>
            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.body }}>{text}</p>
        </div>
    </Block>
);

const Person = ({ title, name, email }: { title: string; name: string; email: string }) => (
    <Block top={28}>
        <Label>{title}</Label>
        <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.heading }}>{name}</p>
        <p style={{ margin: '2px 0 0', fontSize: 14, color: C.body }}>{email}</p>
    </Block>
);

const TrackingBox = () => (
    <Block top={28}>
        <div style={{ background: C.page, border: `1px solid ${C.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <Label>Tracking number</Label>
            <p style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 600, color: C.heading, fontFamily: 'monospace', letterSpacing: 1 }}>TRK-AF1-9284-XKPL</p>
            <Label>Carrier</Label>
            <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: C.heading }}>FedEx</p>
        </div>
    </Block>
);

const EmailWrapper = ({ children }: { children: React.ReactNode }) => (
    <div style={{ width: '100%', maxWidth: 600, margin: '0 auto', background: C.card, border: `1px solid ${C.border}` }}>
        {children}
    </div>
);

// ─── TEMPLATE SWITCH ─────────────────────────────────────────────────────────
const DynamicTemplate = ({ type, data }: { type: EmailType; data: EmailTemplateData }) => {
    const cta = (fallback: string) => <Cta>{data.buttonText || fallback}</Cta>;

    switch (type) {
        case 'welcome':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    {cta('Start shopping')}
                </>
            );

        case 'order_placed':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <InfoBox items={[['Order number', '#AF1-69EB6'], ['Status', <Accent key="s">Verifying</Accent>]]} />
                    <OrderSummary title="Order summary" />
                    <Steps
                        items={[
                            ['Payment verification', 'We’re verifying your transaction.'],
                            ['Packed and shipped', 'Your items are handed to the carrier within 1–2 business days.']
                        ]}
                    />
                    {cta('View my order')}
                </>
            );

        case 'order_paid':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <InfoBox items={[['Order number', '#AF1-69EB6'], ['Status', <Accent key="s">Paid</Accent>]]} />
                    <OrderSummary title="Order summary" />
                    <Steps
                        active={1}
                        items={[
                            ['Payment confirmed', 'Your transaction was verified.'],
                            ['Preparing your order', 'We’re packing your items for dispatch.']
                        ]}
                    />
                    {cta('Track my order')}
                </>
            );

        case 'order_shipped':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <TrackingBox />
                    <OrderSummary title="Order summary" />
                    <TotalRow title="Total" />
                    {cta('Track my package')}
                </>
            );

        case 'order_delivered':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <InfoBox items={[['Order number', '#AF1-69EB6'], ['Status', <Accent key="s">Delivered</Accent>]]} />
                    <OrderSummary title="Order summary" />
                    <TotalRow title="Total paid" />
                    <Callout title="Enjoying your order?" text="A quick review helps other shoppers and means a lot to us." />
                    {cta('Write a review')}
                </>
            );

        case 'order_cancelled':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <InfoBox items={[['Order number', '#AF1-69EB6'], ['Status', 'Cancelled']]} />
                    <OrderSummary title="Cancelled items" faded />
                    <TotalRow title="Total refund" />
                    <Callout title="Your refund is on its way" text="It will be credited to your original payment method within 5–7 business days." />
                    {cta('Shop again')}
                </>
            );

        case 'order_refunded':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <InfoBox items={[['Order number', '#AF1-69EB6'], ['Refund amount', <Accent key="r">${MOCK_ORDER.total.toFixed(2)}</Accent>]]} />
                    {cta('View order status')}
                </>
            );

        case 'abandoned_cart':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <OrderSummary title="Your cart" />
                    {cta('Complete my order')}
                    <Block top={32}>
                        <div style={{ border: `1px dashed ${C.accent}`, borderRadius: 10, padding: 20, textAlign: 'center' }}>
                            <p style={{ margin: '0 0 8px', fontSize: 14, color: C.body }}>Take 10% off your order. Expires in 24 hours.</p>
                            <p style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: 4, color: C.accent, fontFamily: 'monospace' }}>ELITE10</p>
                        </div>
                    </Block>
                </>
            );

        case 'quote_request':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <InfoBox items={[['Request ID', '#AF1-QUOTE'], ['Status', <Accent key="s">Under review</Accent>]]} />
                    <OrderSummary title="Requested items" />
                    <Steps
                        items={[
                            ['Request review', 'We evaluate your design, quantity and delivery requirements.'],
                            ['Quote sent', 'A proposal with pricing and timelines arrives in your inbox.']
                        ]}
                    />
                </>
            );

        case 'admin_new_order_direct':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <Person title="Customer" name="Alex Johnson" email="alex.j@example.com" />
                    <InfoBox items={[['Order number', '#AF1-69EB6'], ['Revenue', <Accent key="r">${MOCK_ORDER.total.toFixed(2)}</Accent>]]} />
                    <OrderSummary title="Order contents" />
                    <Block top={28}>
                        <Label>Shipping address</Label>
                        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: C.body }}>4807 Greenleaf Ct, Ste D, Modesto, CA 95356</p>
                    </Block>
                    {cta('Open order in admin')}
                </>
            );

        case 'admin_new_order_request':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    <Person title="Requester" name="Hassan Shafiq" email="shafiq@example.com" />
                    <InfoBox items={[['Request ID', '#AF1-QUOTE-782'], ['Type', <Accent key="t">Custom request</Accent>]]} />
                    <Block top={28}>
                        <Label>Requirements</Label>
                        <DetailRows
                            items={[
                                ['Team name', 'Shadow Wolves'],
                                ['Deployment date', 'May 15, 2026'],
                                ['Notes', 'Reflective silver logo, contrast stitching on sleeves']
                            ]}
                        />
                    </Block>
                    <OrderSummary title="Selected gear" />
                    {cta('Review request')}
                </>
            );

        case 'password_reset':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    {cta('Reset my password')}
                    <Block top={28}>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: C.muted }}>
                            This link expires in 30 minutes. If the button doesn’t work, copy and paste the reset link into your browser.
                        </p>
                    </Block>
                </>
            );

        case 'low_stock_alert':
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    {cta('Manage inventory')}
                </>
            );

        default:
            return (
                <>
                    <Hero title={data.heading} text={data.body} />
                    {data.buttonText && <Cta>{data.buttonText}</Cta>}
                </>
            );
    }
};

// ─── PAGE ────────────────────────────────────────────────────────────────────
export const EmailPreviews: React.FC = () => {
    const [activeTab, setActiveTab] = useState<EmailType>('welcome');
    const [formData, setFormData] = useState<EmailTemplateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const tabs: { id: EmailType; label: string; icon: any }[] = [
        { id: 'welcome', label: 'Welcome', icon: UserPlus },
        { id: 'order_placed', label: 'New order', icon: ShoppingBag },
        { id: 'order_paid', label: 'Payment', icon: Banknote },
        { id: 'order_shipped', label: 'Shipped', icon: Truck },
        { id: 'order_delivered', label: 'Delivered', icon: PackageCheck },
        { id: 'order_cancelled', label: 'Cancelled', icon: XCircle },
        { id: 'order_refunded', label: 'Refunded', icon: RotateCcw },
        { id: 'abandoned_cart', label: 'Cart reminder', icon: ShoppingCart },
        { id: 'quote_request', label: 'Quote request', icon: FileText },
        { id: 'admin_new_order_direct', label: 'Admin: order', icon: ShieldCheck },
        { id: 'admin_new_order_request', label: 'Admin: quote', icon: ShieldAlert },
        { id: 'password_reset', label: 'Password reset', icon: KeyRound },
        { id: 'low_stock_alert', label: 'Low stock', icon: AlertCircle }
    ];

    const fetchTemplate = async (type: string) => {
        setIsLoading(true);
        try {
            const res = await apiClient.get(`/api/admin/emails/templates/${type}`);
            if (res.data.ok) {
                setFormData(res.data.template);
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to load template.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTemplate(activeTab);
    }, [activeTab]);

    const handleSave = async () => {
        if (!formData) return;
        setIsSaving(true);
        try {
            const res = await apiClient.put(`/api/admin/emails/templates/${activeTab}`, formData);
            if (res.data.ok) {
                toast.success('Template saved.');
            }
        } catch (err) {
            console.error(err);
            toast.error('Failed to save template.');
        } finally {
            setIsSaving(false);
        }
    };

    const inputClass =
        'w-full bg-page-background border border-slate-200 p-3.5 rounded-xl text-sm text-heading outline-none focus:border-accent focus:bg-white transition-colors';

    return (
        <div className="min-h-screen bg-page-background p-6 lg:p-12">
            <div className="max-w-[1600px] mx-auto space-y-10">

                {/* HEADER + TABS */}
                <div className="space-y-6">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-semibold text-heading">Email templates</h1>
                        <p className="text-sm text-content">Edit the content of every email your store sends and preview it live.</p>
                    </div>

                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {tabs.map((t) => {
                            const isActive = activeTab === t.id;
                            return (
                                <button
                                    key={t.id}
                                    onClick={() => setActiveTab(t.id)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm whitespace-nowrap border transition-colors ${
                                        isActive
                                            ? 'bg-heading text-white border-heading'
                                            : 'bg-white text-content border-slate-200 hover:text-heading hover:border-slate-300'
                                    }`}
                                >
                                    <t.icon className={`w-4 h-4 ${isActive ? 'text-accent' : ''}`} />
                                    {t.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* EDITOR */}
                    <div className="lg:col-span-4">
                        <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-base font-semibold text-heading">Content</h3>
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving || !formData}
                                    className={`flex items-center gap-2 px-5 py-2.5 bg-accent text-white rounded-lg text-sm font-semibold transition-opacity ${
                                        isSaving ? 'opacity-50' : 'hover:opacity-90'
                                    }`}
                                >
                                    {isSaving ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Save
                                </button>
                            </div>

                            {!formData || isLoading ? (
                                <div className="space-y-5">
                                    <div className="h-11 bg-slate-100 animate-pulse rounded-xl" />
                                    <div className="h-11 bg-slate-100 animate-pulse rounded-xl" />
                                    <div className="h-32 bg-slate-100 animate-pulse rounded-xl" />
                                </div>
                            ) : (
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-content flex items-center gap-2">
                                            <Type className="w-3.5 h-3.5" /> Subject line
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.subject}
                                            onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-content flex items-center gap-2">
                                            <Type className="w-3.5 h-3.5" /> Heading
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.heading}
                                            onChange={(e) => setFormData({ ...formData, heading: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-content flex items-center gap-2">
                                            <FileText className="w-3.5 h-3.5" /> Message
                                        </label>
                                        <textarea
                                            value={formData.body}
                                            rows={8}
                                            onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                            className={`${inputClass} no-scrollbar leading-relaxed`}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-content flex items-center gap-2">
                                            <Type className="w-3.5 h-3.5" /> Button text
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.buttonText}
                                            onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                                            className={inputClass}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* LIVE PREVIEW */}
                    <div className="lg:col-span-8 bg-slate-100 rounded-3xl p-6 lg:p-12 border border-slate-200 flex items-start justify-center relative sticky top-12 overflow-y-auto no-scrollbar h-[calc(100vh-100px)]">
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-1.5 bg-white rounded-full border border-slate-200 z-10">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="text-xs font-medium text-content">Live preview</span>
                            <Eye className="w-3.5 h-3.5 text-content" />
                        </div>

                        <div className="w-full mt-10">
                            {!formData ? (
                                <div className="flex flex-col items-center justify-center pt-40 gap-3 opacity-30">
                                    <RefreshCcw className="w-8 h-8 animate-spin" />
                                    <p className="text-sm">Loading preview…</p>
                                </div>
                            ) : (
                                <EmailWrapper>
                                    <DynamicTemplate type={activeTab} data={formData} />
                                </EmailWrapper>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};