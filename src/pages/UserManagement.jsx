import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { UserDetailsDrawer } from '../components/UserDetailsDrawer';
import { useToast } from '../components/ui/ToastProvider';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';

export const UserManagement = () => {
  const { currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [confirmState, setConfirmState] = useState(null); // { title, description, confirmLabel, tone, action: fn }

  const adminLinks = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/events', label: 'Event Manager' },
    { path: '/admin/users', label: 'User Management' },
    { path: '/admin/reports', label: 'Approval Queue' },
    { path: '/admin/blog', label: 'Blog CMS' },
    { path: '/admin/partners', label: 'Partners' },
    { path: '/admin/messages', label: 'Partner Inbox' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.filter(doc => !doc.get('deletedAt')).map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(term) || 
        user.email?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => (user.role || 'member') === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => (user.isActive !== false) === isActive);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      } else if (sortBy === 'points') {
        return (b.greenPoints || 0) - (a.greenPoints || 0);
      } else if (sortBy === 'role') {
        return (b.role || 'member').localeCompare(a.role || 'member');
      }
      return 0;
    });

    return filtered;
  }, [users, searchTerm, roleFilter, statusFilter, sortBy]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      // Call the Cloud Function to update custom claims in Firebase Auth
      const updateUserRole = httpsCallable(functions, 'updateUserRole');
      await updateUserRole({ userId, role: newRole });
      
      toast.success('Role updated', `Set to ${newRole}. User must logout/login to see changes.`);
      fetchUsers();
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Update failed', 'Failed to update role. Please try again.');
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    try {
      // Call the Cloud Function to enable/disable user
      const updateUserStatus = httpsCallable(functions, isActive ? 'enableUser' : 'disableUser');
      await updateUserStatus({ userId });
      
      toast.success('Account updated', `Account ${isActive ? 'enabled' : 'disabled'} successfully.`);
      fetchUsers();
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Update failed', 'Failed to update account status. Please try again.');
    }
  };

  const handleDelete = async (userId) => {
    try {
      // Call the Cloud Function to delete user
      const deleteUserFn = httpsCallable(functions, 'deleteUser');
      await deleteUserFn({ userId });
      
      toast.success('User deleted', 'User deleted successfully.');
      fetchUsers();
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Delete failed', 'Failed to delete user. Please try again.');
    }
  };

  const requestRoleChange = (userId, newRole) => {
    const u = users.find((x) => x.id === userId);
    setConfirmState({
      title: `Change role to ${newRole}?`,
      description: `This will update ${u?.name ?? 'this user'} to role “${newRole}”. The user must logout/login to see claim changes.`,
      confirmLabel: 'Confirm',
      tone: 'primary',
      action: () => handleRoleChange(userId, newRole),
    });
  };

  const requestStatusChange = (userId, isActive) => {
    const u = users.find((x) => x.id === userId);
    setConfirmState({
      title: `${isActive ? 'Enable' : 'Disable'} this account?`,
      description: `${u?.name ?? 'This user'} will be ${isActive ? 'enabled' : 'disabled'}.`,
      confirmLabel: isActive ? 'Enable' : 'Disable',
      tone: isActive ? 'primary' : 'danger',
      action: () => handleStatusChange(userId, isActive),
    });
  };

  const requestDelete = (userId) => {
    const u = users.find((x) => x.id === userId);
    setConfirmState({
      title: 'Delete this user?',
      description: `This will permanently delete ${u?.name ?? 'this user'}. This action cannot be undone.`,
      confirmLabel: 'Delete user',
      tone: 'danger',
      action: () => handleDelete(userId),
    });
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  return (
    <DashboardLayout links={adminLinks} title="User Management">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm w-full">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900">
              Users <span className="text-gray-400">({filteredAndSortedUsers.length})</span>
            </h1>
            <p className="mt-2 text-sm text-gray-600">Search, filter, and manage roles and account status.</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            />
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="all">All Roles</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm shadow-sm outline-none transition focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
            >
              <option value="date">Sort by Date</option>
              <option value="points">Sort by Points</option>
              <option value="role">Sort by Role</option>
            </select>
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="h-4 w-40 animate-pulse rounded bg-gray-100" />
                <div className="mt-3 h-3 w-56 animate-pulse rounded bg-gray-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedUsers.map(user => (
              <div 
                key={user.id} 
                onClick={() => openUserDetails(user)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-extrabold tracking-tight text-gray-900">{user.name}</h3>
                      {user.isActive === false && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded-full">Disabled</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-sm text-gray-500">Branch: {user.branch || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Green Points: {user.greenPoints || 0}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-2 rounded-xl text-sm font-medium ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-700' 
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {user.role || 'member'}
                    </span>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <UserDetailsDrawer
        user={selectedUser}
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onRequestRoleChange={requestRoleChange}
        onRequestStatusChange={requestStatusChange}
        onRequestDelete={requestDelete}
        currentAdminId={currentUser?.uid}
      />

      <ConfirmDialog
        open={!!confirmState}
        title={confirmState?.title ?? ''}
        description={confirmState?.description ?? ''}
        confirmLabel={confirmState?.confirmLabel ?? 'Confirm'}
        tone={confirmState?.tone ?? 'danger'}
        onCancel={() => setConfirmState(null)}
        onConfirm={async () => {
          const action = confirmState?.action;
          setConfirmState(null);
          await action?.();
        }}
      />
    </DashboardLayout>
  );
};
