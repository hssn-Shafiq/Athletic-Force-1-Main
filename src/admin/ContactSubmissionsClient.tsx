"use client";

import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Mail, MessageSquare, RefreshCw, Search, X } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-toastify';

type ContactSubmission = {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  teamOrganization?: string;
  projectDetails: string;
  createdAt: string;
};

export default function ContactSubmissionsClient() {
  const [items, setItems] = useState<ContactSubmission[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<ContactSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const { data } = await apiClient.get('/api/admin/contact-submissions', {
          params: { page, limit: 15, search: search.trim() || undefined },
        });
        if (data.ok) {
          setItems(data.submissions);
          setTotalPages(data.totalPages || 1);
        }
      } catch (error) {
        console.error('Failed to load contact entries:', error);
        toast.error('Unable to load contact entries. Please try again.');
      } finally {
        setIsLoading(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [page, search, refreshKey]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">Contact Entries</h1>
        <p className="text-slate-500 font-bold text-sm mt-2 italic">Review messages submitted through the contact desk.</p>
      </div>
      <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Search contacts..." className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-12 pr-4 text-xs font-bold outline-none focus:border-orange-500 focus:bg-white" />
          </div>
          <button
            type="button"
            onClick={() => setRefreshKey((value) => value + 1)}
            disabled={isLoading}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black uppercase tracking-widest text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            title="Load latest contact entries"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                <th className="py-4 px-6">Name</th><th className="py-4 px-6">Email</th><th className="py-4 px-6">Team / Organization</th><th className="py-4 px-6">Received</th><th className="py-4 px-6 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? <tr><td colSpan={5} className="py-16 text-center text-slate-400">Loading contact entries...</td></tr> : items.length === 0 ? <tr><td colSpan={5} className="py-16 text-center text-slate-400"><MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />No contact entries found.</td></tr> : items.map((item) => (
                <tr key={item._id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="py-4 px-6 text-sm font-black text-slate-900">{item.firstName} {item.lastName}</td>
                  <td className="py-4 px-6 text-xs font-bold text-slate-500">{item.email}</td>
                  <td className="py-4 px-6 text-xs font-bold text-slate-500">{item.teamOrganization || '—'}</td>
                  <td className="py-4 px-6 text-xs font-bold text-slate-500">{new Date(item.createdAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6 text-center"><div className="flex justify-center gap-2"><button onClick={() => setSelected(item)} title="View details" className="p-2 bg-white border border-slate-200 rounded-lg hover:border-black hover:text-orange-600"><Eye className="w-4 h-4" /></button><a href={`mailto:${item.email}`} title="Email contact" className="p-2 bg-white border border-slate-200 rounded-lg hover:border-black hover:text-orange-600"><Mail className="w-4 h-4" /></a></div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-500"><span>Page {page} of {totalPages}</span><div className="flex gap-2"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="p-2 border rounded-lg disabled:opacity-40"><ChevronLeft className="w-4 h-4" /></button><button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="p-2 border rounded-lg disabled:opacity-40"><ChevronRight className="w-4 h-4" /></button></div></div>
      </div>
      {selected && <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setSelected(null)}><div className="bg-white rounded-3xl max-w-2xl w-full p-8 shadow-2xl" onClick={(event) => event.stopPropagation()}><div className="flex justify-between items-start mb-6"><div><h2 className="text-2xl font-black uppercase italic">{selected.firstName} {selected.lastName}</h2><p className="text-sm text-slate-500">{selected.email} · {selected.phone}</p></div><button onClick={() => setSelected(null)} aria-label="Close details"><X className="w-5 h-5" /></button></div><div className="space-y-4 text-sm"><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Team / Organization</p><p className="font-bold">{selected.teamOrganization || '—'}</p></div><div><p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Project Details</p><p className="whitespace-pre-wrap text-slate-600">{selected.projectDetails}</p></div></div></div></div>}
    </div>
  );
}
