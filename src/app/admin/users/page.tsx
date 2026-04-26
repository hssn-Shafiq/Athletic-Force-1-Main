
"use client";

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ShieldCheck, 
  ShieldAlert, 
  Trash2, 
  UserPlus, 
  MoreVertical,
  XCircle,
  Loader2,
  Mail,
  Calendar,
  Eye,
  EyeOff,
  Lock,
  X,
  Fingerprint,
  Search as SearchIcon,
  CheckCircle2,
  ArrowLeft,
  RefreshCcw,
  Clock,
  Shield
} from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'motion/react';

interface AdminUser {
  _id: string;
  name: string;
  email: string;
  roles: string[];
  lastLoginAt?: string;
  createdAt: string;
}

const ALL_ROLES = [
  { 
    id: 'superadmin', 
    label: 'Super Admin', 
    color: 'bg-red-500', 
    icon: ShieldAlert, 
    desc: 'Full Spectrum Dominance',
    access: ['All Command Centers', 'Staff Management', 'Security Vault', 'Global Settings']
  },
  { 
    id: 'manager', 
    label: 'Manager', 
    color: 'bg-orange-500', 
    icon: ShieldCheck, 
    desc: 'Operations Intelligence',
    access: ['Products & Collections', 'Inventory Control', 'Journal Access']
  },
  { 
    id: 'sales_admin', 
    label: 'Sales Admin', 
    color: 'bg-blue-500', 
    icon: Users, 
    desc: 'Revenue Command',
    access: ['Orders Terminal', 'Customer Profiles', 'Direct Order Requests']
  },
  { 
    id: 'editor', 
    label: 'Editor', 
    color: 'bg-green-500', 
    icon: Fingerprint, 
    desc: 'Content Command',
    access: ['Journal Management', 'Media Library', 'Blog Categories']
  },
  { 
    id: 'seo_specialist', 
    label: 'SEO Specialist', 
    color: 'bg-purple-500', 
    icon: ShieldCheck, 
    desc: 'Visibility Command',
    access: ['SEO Control Room', 'Meta Tags Strategy', 'Search Optimization']
  },
  { 
    id: 'viewer', 
    label: 'Viewer', 
    color: 'bg-slate-500', 
    icon: Users, 
    desc: 'Observational Status',
    access: ['Read-only Insights', 'Passive Analytics']
  },
];

export default function UserManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Search & Recruitment State
  const [searchEmail, setSearchEmail] = useState('');
  const [foundUser, setFoundUser] = useState<AdminUser | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [searchDone, setSearchDone] = useState(false);

  // New Unit Form State
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    roles: ['viewer']
  });
  const [showPassword, setShowPassword] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get('/api/admin/users/all');
      console.log('[TACTICAL INTEL] Units detected:', data.users);
      if (data.ok) {
        setUsers(data.users);
      }
    } catch (err: any) {
      console.error('[TACTICAL FAILURE] Grid scan aborted:', err);
      const msg = err.response?.data?.message || 'Failed to fetch tactical units';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchEmail) return;
    setIsSearching(true);
    try {
      const { data } = await apiClient.get(`/api/admin/users/search?email=${searchEmail}`);
      if (data.ok) {
        if (data.user) {
          setFoundUser(data.user);
          setFormData(prev => ({ ...prev, roles: data.user.roles || ['viewer'] }));
          toast.success('Tactical Unit Identified');
        } else {
          setFoundUser(null);
          setFormData(prev => ({ ...prev, email: searchEmail }));
          toast.info('No Tactical Unit found. Pivot to Recruitment.');
        }
        setSearchDone(true);
      }
    } catch (err: any) {
      toast.error('Tactical Scan Failure');
    } finally {
      setIsSearching(false);
    }
  };

  const handleEnlistOrPromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (foundUser) {
        // Promote existing user
        const { data } = await apiClient.post('/api/admin/users/update-roles', { 
          userId: foundUser._id, 
          roles: formData.roles 
        });
        if (data.ok) {
          toast.success('Tactical Clearance Upgraded');
          fetchUsers(); // Refresh list
          setIsModalOpen(false);
          resetModal();
        }
      } else {
        // Enlist new user
        const { data } = await apiClient.post('/api/admin/users/enlist', formData);
        if (data.ok) {
          toast.success('New Tactical Unit Enlisted');
          setUsers(prev => [data.user, ...prev]);
          setIsModalOpen(false);
          resetModal();
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Operation Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetModal = () => {
    setSearchEmail('');
    setFoundUser(null);
    setSearchDone(false);
    setFormData({ name: '', email: '', password: '', roles: ['viewer'] });
    setShowPassword(false);
  };

  const handleRoleToggle = async (userId: string, currentRoles: string[], roleToToggle: string) => {
    setIsUpdating(userId);
    let newRoles = [...currentRoles];
    if (newRoles.includes(roleToToggle)) {
      newRoles = newRoles.filter(r => r !== roleToToggle);
    } else {
      newRoles.push(roleToToggle);
    }

    try {
      const { data } = await apiClient.post('/api/admin/users/update-roles', { userId, roles: newRoles });
      if (data.ok) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, roles: newRoles } : u));
        toast.success('Tactical clearance updated');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Update failed');
    } finally {
      setIsUpdating(null);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm('Decommission this tactical unit? This action is irreversible.')) return;

    try {
      const { data } = await apiClient.delete(`/api/admin/users/${id}`);
      if (data.ok) {
        setUsers(prev => prev.filter(u => u._id !== id));
        toast.success('Unit decommissioned');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Decommission failure');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="w-10 h-10 animate-spin text-orange-600" />
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 animate-pulse">Scanning Tactical Personnel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-red-50 rounded-[40px] border border-red-100">
        <ShieldAlert className="w-12 h-12 text-red-600 mb-4" />
        <h2 className="text-xl font-black italic uppercase text-red-700">Clearance Failure</h2>
        <p className="text-sm font-bold text-red-800 uppercase tracking-widest opacity-60 mt-2">{error}</p>
        <button 
          onClick={fetchUsers}
          className="mt-6 px-6 py-2 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20"
        >
          Retry Scan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none font-sora">Staff Management</h1>
          <p className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400 italic font-inter">Command Center clearance & permission matrix</p>
        </div>
        <button 
          onClick={() => {
            resetModal();
            setIsModalOpen(true);
          }}
          className="flex items-center gap-3 px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-black/20 hover:bg-orange-600 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Enlist New Unit
        </button>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[40px] shadow-2xl overflow-hidden border border-white/20 flex flex-col"
            >
              <div className="max-h-[85vh] overflow-y-auto p-8 md:p-12 scrollbar-thin scrollbar-thumb-slate-200">
                <div className="flex items-center justify-between mb-10 sticky top-0 bg-white/90 backdrop-blur-md z-10 pb-4">
                  <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-slate-900 leading-none">
                      {searchDone ? (foundUser ? 'Clearance Upgrade' : 'Personnel Recruitment') : 'Tactical Scan'}
                    </h2>
                    <p className="mt-2 text-xs font-black uppercase tracking-widest text-slate-400 italic">
                      {searchDone ? (foundUser ? `Upgrading clearance for ${foundUser.name}` : 'Enlisting new tactical unit') : 'Identify target personnel by email'}
                    </p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-slate-50 rounded-2xl transition-colors">
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>

                {!searchDone ? (
                  <form onSubmit={handleSearch} className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Target Email Terminal</label>
                      <div className="relative group">
                        <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                        <input 
                          required
                          type="email" 
                          autoFocus
                          value={searchEmail}
                          onChange={(e) => setSearchEmail(e.target.value)}
                          placeholder="target@clearance.com"
                          className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-5 pl-14 pr-6 outline-none text-sm font-bold transition-all"
                        />
                      </div>
                    </div>
                    <button 
                      type="submit"
                      disabled={isSearching}
                      className="w-full bg-black text-white rounded-3xl py-5 text-xs font-black uppercase tracking-widest shadow-2xl shadow-black/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <SearchIcon className="w-4 h-4" />}
                      Execute Tactical Scan
                    </button>
                  </form>
                ) : (
                  <form onSubmit={handleEnlistOrPromote} className="space-y-8">
                    <AnimatePresence mode="wait">
                      {foundUser ? (
                        <motion.div 
                          key="promotion"
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-6"
                        >
                          <div className="bg-slate-900 rounded-[32px] p-8 text-white relative overflow-hidden shadow-2xl shadow-slate-900/40">
                             {/* Ambient background effect */}
                             <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/20 blur-[60px]" />
                             <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-600/20 blur-[60px]" />

                             <div className="relative flex items-center gap-6">
                               <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-3xl flex items-center justify-center text-3xl font-black italic text-white shrink-0 border border-white/10">
                                 {foundUser.name.charAt(0)}
                               </div>
                               <div>
                                 <h3 className="text-2xl font-black italic uppercase tracking-tighter leading-tight">{foundUser.name}</h3>
                                 <div className="flex flex-col gap-1 mt-1">
                                   <span className="text-[10px] font-bold text-white/60 uppercase tracking-[0.2em]">{foundUser.email}</span>
                                   <div className="flex items-center gap-4 mt-2">
                                     <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-orange-400">
                                       <Clock className="w-3 h-3" /> Enlisted: {new Date(foundUser.createdAt).toLocaleDateString()}
                                     </span>
                                     <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-green-400">
                                       <Shield className="w-3 h-3" /> 
                                       {foundUser.roles.includes('customer') && foundUser.roles.length === 1 ? 'Customer Unit' : 'Administrative Unit'}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                               <div className="ml-auto">
                                 <CheckCircle2 className="w-10 h-10 text-white/20" />
                               </div>
                             </div>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div 
                          key="recruitment"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="space-y-8"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Full Name</label>
                              <div className="relative group">
                                <Users className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                                <input 
                                  required
                                  type="text" 
                                  value={formData.name}
                                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                                  placeholder="John Doe"
                                  className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-4 pl-14 pr-6 outline-none text-sm font-bold transition-all"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Email Terminal</label>
                              <div className="relative group">
                                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                                <input 
                                  readOnly
                                  type="email" 
                                  value={formData.email}
                                  className="w-full bg-slate-100 border-transparent rounded-2xl py-4 pl-14 pr-6 outline-none text-sm font-bold text-slate-500 cursor-not-allowed"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Security Password</label>
                            <div className="relative group">
                              <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-orange-600 transition-colors" />
                              <input 
                                required
                                type={showPassword ? "text" : "password"} 
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                                placeholder="••••••••"
                                className="w-full bg-slate-50 border border-transparent focus:border-slate-200 focus:bg-white rounded-2xl py-4 pl-14 pr-14 outline-none text-sm font-bold transition-all"
                              />
                              <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 transition-colors"
                              >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="space-y-6">
                      <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-4 italic">Operational Clearance Selection</label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {ALL_ROLES.map((role) => {
                          const isSelected = formData.roles.includes(role.id);
                          return (
                            <button
                              key={role.id}
                              type="button"
                              onClick={() => {
                                const newRoles = isSelected 
                                  ? formData.roles.filter(r => r !== role.id) 
                                  : [...formData.roles, role.id];
                                setFormData({...formData, roles: newRoles});
                              }}
                              className={`group relative flex flex-col items-start p-5 rounded-[24px] transition-all border ${
                                isSelected 
                                  ? `${role.color} text-white border-transparent shadow-xl shadow-${role.id}/20` 
                                  : 'bg-slate-50 border-transparent text-slate-400 hover:bg-white hover:border-slate-200'
                              }`}
                            >
                              <role.icon className={`w-5 h-5 mb-3 ${isSelected ? 'text-white' : 'text-slate-300'}`} />
                              <span className="text-[10px] font-black uppercase tracking-widest">{role.label}</span>
                              <span className={`text-[8px] font-bold mt-1 uppercase opacity-60 ${isSelected ? 'text-white' : 'text-slate-400'}`}>{role.desc}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Access Intelligence Display */}
                      <AnimatePresence>
                        {formData.roles.length > 0 && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-slate-50 rounded-[32px] p-8 border border-slate-100"
                          >
                            <div className="flex items-center gap-3 mb-6">
                               <div className="w-8 h-8 bg-black text-white rounded-xl flex items-center justify-center">
                                 <Shield className="w-4 h-4" />
                               </div>
                               <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-900">Tactical Clearance Blueprint</h4>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-3">
                              {Array.from(new Set(formData.roles.flatMap(r => ALL_ROLES.find(role => role.id === r)?.access || []))).map((area, i) => (
                                <div key={i} className="flex items-center gap-3">
                                  <div className="w-1.5 h-1.5 bg-orange-600 rounded-full shrink-0 shadow-lg shadow-orange-600/40" />
                                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">{area}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div className="pt-4 flex gap-4">
                      <button 
                        type="submit"
                        disabled={isSubmitting || formData.roles.length === 0}
                        className="flex-1 bg-black text-white rounded-[24px] py-6 text-xs font-black uppercase tracking-widest shadow-2xl shadow-black/20 hover:bg-orange-600 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : (foundUser ? <ShieldCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />)}
                        {foundUser ? 'Finalize Promotion' : 'Enlist Personnel'}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setSearchDone(false);
                          setFoundUser(null);
                        }}
                        className="px-10 bg-slate-50 text-slate-400 rounded-[24px] text-xs font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center gap-3 italic"
                      >
                        <RefreshCcw className="w-4 h-4" />
                        Abort
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-[40px] border border-slate-100 text-center">
           <Users className="w-16 h-16 text-slate-100 mb-4" />
           <p className="text-xs font-black uppercase tracking-widest text-slate-400 italic">No administrative tactical units identified in current sector.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {users.map((user) => (
          <motion.div 
            key={user._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-white rounded-[40px] border border-slate-100 p-8 shadow-sm hover:shadow-xl hover:shadow-slate-100/50 transition-all"
          >
            <div className="flex items-start justify-between mb-8">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center text-2xl font-black italic text-slate-400 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-black italic uppercase text-slate-900 leading-tight">{user.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1.5 text-[9px] font-black uppercase text-slate-400">
                      <Mail className="w-3 h-3" /> {user.email}
                    </span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => handleDeleteUser(user._id)}
                className="p-3 text-slate-300 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="pt-6 border-t border-slate-50">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-4 italic">Tactical Clearance</p>
                <div className="flex flex-wrap gap-2">
                  {ALL_ROLES.map((role) => {
                    const hasRole = user.roles.includes(role.id);
                    return (
                      <button
                        key={role.id}
                        disabled={isUpdating === user._id}
                        onClick={() => handleRoleToggle(user._id, user.roles, role.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${
                          hasRole 
                            ? `${role.color} text-white border-transparent shadow-lg shadow-${role.id}/20` 
                            : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <role.icon className={`w-3 h-3 ${hasRole ? 'text-white' : 'text-slate-300'}`} />
                        {role.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-between pt-6 border-t border-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Enlisted: {new Date(user.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> 
                  {user.roles.includes('superadmin') ? 'Super Admin' : `${user.roles.length} Roles Assigned`}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    )}
  </div>
  );
}
