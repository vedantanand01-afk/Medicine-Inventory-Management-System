import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import DataTable from '../components/common/DataTable';
import StatusBadge from '../components/common/StatusBadge';
import Modal from '../components/common/Modal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import {
  Users as UsersIcon,
  Search,
  Plus,
  ShieldCheck,
  UserCheck,
  Edit2,
  Trash2,
  Lock,
  Mail,
  User,
  Phone,
} from 'lucide-react';
import { formatDate } from '../utils/formatters';

const Users = () => {
  const { user: currentUser } = useAuth();
  const { showSuccess, showError } = useNotification();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deleteDialogUser, setDeleteDialogUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Pharmacist',
    phone: '',
    status: 'Active',
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'All') params.role = roleFilter;
      const res = await api.get('/users', { params });
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load users:', err);
      showError('Failed to fetch system users');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, showError]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    if (editingUser) {
      setFormData({
        name: editingUser.name || '',
        email: editingUser.email || '',
        password: '',
        role: editingUser.role || 'Pharmacist',
        phone: editingUser.phone || '',
        status: editingUser.status || 'Active',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'Pharmacist',
        phone: '',
        status: 'Active',
      });
    }
  }, [editingUser, modalOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || (!editingUser && !formData.password)) {
      showError('Please fill in name, email, and password.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Do not overwrite if empty
        const res = await api.put(`/users/${editingUser._id}`, payload);
        if (res.data.success) {
          showSuccess('User account updated successfully!');
          setModalOpen(false);
          fetchUsers();
        }
      } else {
        const res = await api.post('/users', formData);
        if (res.data.success) {
          showSuccess('User registered successfully!');
          setModalOpen(false);
          fetchUsers();
        }
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to save user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialogUser) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/users/${deleteDialogUser._id}`);
      if (res.data.success) {
        showSuccess(`User '${deleteDialogUser.name}' removed successfully.`);
        setDeleteDialogUser(null);
        fetchUsers();
      }
    } catch (err) {
      showError(err.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeleting(false);
    }
  };

  const columns = [
    {
      header: 'Staff Member',
      key: 'name',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 text-white ${
              row.role === 'Admin' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}
          >
            {row.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div>
            <span className="font-bold text-slate-800 block">
              {row.name}
              {row._id === currentUser?._id && (
                <span className="text-[10px] text-emerald-600 ml-1 font-semibold">
                  (You)
                </span>
              )}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {row.userId}
            </span>
          </div>
        </div>
      ),
    },
    {
      header: 'Email & Phone',
      key: 'email',
      render: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-700">{row.email}</p>
          <p className="text-[11px] text-slate-400">{row.phone || 'No phone'}</p>
        </div>
      ),
    },
    {
      header: 'Assigned Role',
      key: 'role',
      render: (row) => (
        <span
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
            row.role === 'Admin'
              ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
          }`}
        >
          {row.role === 'Admin' ? (
            <ShieldCheck className="w-3.5 h-3.5" />
          ) : (
            <UserCheck className="w-3.5 h-3.5" />
          )}
          <span>{row.role}</span>
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (row) => <StatusBadge status={row.status} size="sm" />,
    },
    {
      header: 'Registered On',
      key: 'createdAt',
      render: (row) => (
        <span className="text-xs text-slate-500">
          {formatDate(row.createdAt)}
        </span>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      className: 'text-right',
      cellClassName: 'text-right',
      render: (row) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            onClick={() => {
              setEditingUser(row);
              setModalOpen(true);
            }}
            title="Edit User"
            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {row._id !== currentUser?._id && (
            <button
              onClick={() => setDeleteDialogUser(row)}
              title="Delete User"
              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            User Accounts & Permissions
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Control access roles, pharmacist authorizations, and system security credentials
          </p>
        </div>

        <button
          onClick={() => {
            setEditingUser(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add System User</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user name, email, user ID..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        <div className="w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          >
            <option value="All">All Roles</option>
            <option value="Admin">Administrators</option>
            <option value="Pharmacist">Pharmacists / Staff</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={loading}
        emptyMessage="No system users match your search"
        emptySubMessage="Click 'Add System User' to create a new staff account"
      />

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User Account' : 'Register New User'}
        subtitle={
          editingUser
            ? `Updating credentials for ${editingUser.name}`
            : 'Provide name, email, password, and assign authorization role'
        }
        maxWidth="max-w-md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Full Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="e.g. Dr. Arthur Vance"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Email Address *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="staff@medinventory.com"
              required
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {editingUser ? 'Reset Password (Leave blank to keep)' : 'Initial Password *'}
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="••••••••"
              required={!editingUser}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Authorization Role *
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, role: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Pharmacist">Pharmacist / Staff</option>
                <option value="Admin">Administrator</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Account Status *
              </label>
              <select
                value={formData.status}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, status: e.target.value }))
                }
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contact Phone
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, phone: e.target.value }))
              }
              placeholder="+1 (555) 000-0000"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-600/20 transition-all flex items-center gap-2"
            >
              {submitting && (
                <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
              )}
              <span>{editingUser ? 'Save Changes' : 'Create User'}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete User Dialog */}
      <ConfirmDialog
        isOpen={!!deleteDialogUser}
        onClose={() => setDeleteDialogUser(null)}
        onConfirm={handleDelete}
        title="Delete User Account"
        message={`Are you sure you want to delete '${deleteDialogUser?.name}' (${deleteDialogUser?.email})? This user will no longer be able to log in.`}
        confirmText="Delete User"
        isLoading={deleting}
      />
    </div>
  );
};

export default Users;
