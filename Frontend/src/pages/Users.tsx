import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Edit3, Trash2, Shield, ShieldAlert, ShieldCheck, UserCheck, UserX, Calendar, ChevronDown } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../api/analyze';
import type { UserRole, UserStatus } from '../types';

interface UserData {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

interface UsersProps {
  token: string | null;
}

export const Users: React.FC<UsersProps> = ({ token }) => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [editRole, setEditRole] = useState<UserRole>('citizen');
  const [editStatus, setEditStatus] = useState<UserStatus>('active');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' });
      if (search) params.append('search', search);
      if (roleFilter !== 'All') params.append('role', roleFilter);
      if (statusFilter !== 'All') params.append('status', statusFilter);

      const res = await axios.get(`${API_BASE_URL}/api/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data.data.users);
      setTotalPages(res.data.data.pages);
      setTotal(res.data.data.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [token, page, search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUpdateUser = async (id: string) => {
    try {
      const res = await axios.put(`${API_BASE_URL}/api/users/${id}`,
        { role: editRole, status: editStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers(prev => prev.map(u => u._id === id ? res.data.data : u));
      setEditingUser(null);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
    try {
      await axios.delete(`${API_BASE_URL}/api/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(prev => prev.filter(u => u._id !== id));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <ShieldCheck className="w-4 h-4 text-purple-400" />;
      case 'officer': return <Shield className="w-4 h-4 text-blue-400" />;
      default: return <UserCheck className="w-4 h-4 text-green-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/30">Active</span>;
      case 'inactive': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/15 text-warning border border-warning/30">Inactive</span>;
      case 'suspended': return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/15 text-danger border border-danger/30">Suspended</span>;
      default: return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-muted-text border border-white/5">{status}</span>;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <div className="space-y-1">
        <span className="text-xs font-bold text-secondary uppercase tracking-widest block">Administration</span>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">User Management</h1>
        <p className="text-sm text-muted-text">Manage citizens, officers, and administrators across the platform.</p>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-text" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/5 hover:border-white/10 focus:border-secondary/50 rounded-xl text-sm text-white placeholder-muted-text outline-none transition-all" />
        </div>
        <div className="flex gap-2 shrink-0">
          <div className="relative flex items-center bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5 gap-2 text-sm text-muted-text">
            <Filter className="w-4 h-4" />
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-white text-xs font-semibold outline-none border-none cursor-pointer pr-4">
              <option value="All">All Roles</option>
              <option value="citizen">Citizen</option>
              <option value="officer">Officer</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div className="relative flex items-center bg-slate-900 border border-white/5 rounded-xl px-3 py-1.5 gap-2 text-sm text-muted-text">
            <Filter className="w-4 h-4" />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="bg-transparent text-white text-xs font-semibold outline-none border-none cursor-pointer pr-4">
              <option value="All">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {error && <div className="p-3 rounded-xl bg-danger/20 border border-danger/40 text-xs text-white">{error}</div>}

      <div className="glass-panel border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead className="bg-slate-900/80 border-b border-white/5 text-xs text-muted-text font-bold uppercase tracking-wider">
              <tr>
                <th className="p-4 pl-6">User</th>
                <th className="p-4">Email</th>
                <th className="p-4">Role</th>
                <th className="p-4">Status</th>
                <th className="p-4">Created</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-text">Loading users...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={6} className="p-12 text-center text-muted-text">No users found.</td></tr>
              ) : (
                users.map(user => (
                  <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-white">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-muted-text">{user.email}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 capitalize">
                        {getRoleIcon(user.role)}
                        <span className="text-white text-xs font-semibold">{user.role}</span>
                      </div>
                    </td>
                    <td className="p-4">{getStatusBadge(user.status)}</td>
                    <td className="p-4 text-xs text-muted-text">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-secondary" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4 text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditingUser(user); setEditRole(user.role); setEditStatus(user.status); }}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 hover:text-secondary text-muted-text border border-white/5 transition-all"
                          title="Edit User">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(user._id)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-danger/20 hover:text-danger text-muted-text border border-white/5 transition-all"
                          title="Delete User">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="bg-slate-900/60 border-t border-white/5 px-6 py-4 flex items-center justify-between">
          <span className="text-xs text-muted-text">Total: <strong className="text-white">{total}</strong> users</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-all disabled:pointer-events-none">Previous</button>
            <span className="flex items-center text-xs text-muted-text px-2">Page <strong className="text-white mx-1">{page}</strong> of <strong className="text-white mx-1">{totalPages}</strong></span>
            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-xs font-semibold text-white transition-all disabled:pointer-events-none">Next</button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm" onClick={() => setEditingUser(null)}>
          <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-white mb-4">Edit User: {editingUser.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-text block mb-1">Role</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['citizen', 'officer', 'admin'] as UserRole[]).map(r => (
                    <button key={r} onClick={() => setEditRole(r)}
                      className={`py-2 text-xs font-semibold rounded-lg capitalize border transition-all ${editRole === r ? 'border-secondary bg-secondary/15 text-white' : 'border-slate-800 bg-slate-950 text-muted-text hover:text-white'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-muted-text block mb-1">Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['active', 'inactive', 'suspended'] as UserStatus[]).map(s => (
                    <button key={s} onClick={() => setEditStatus(s)}
                      className={`py-2 text-xs font-semibold rounded-lg capitalize border transition-all ${editStatus === s ? 'border-secondary bg-secondary/15 text-white' : 'border-slate-800 bg-slate-950 text-muted-text hover:text-white'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setEditingUser(null)} className="flex-1 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold border border-slate-700">Cancel</button>
                <button onClick={() => handleUpdateUser(editingUser._id)} className="flex-1 py-2 rounded-xl bg-gradient-primary-to-secondary text-white text-sm font-semibold">Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};