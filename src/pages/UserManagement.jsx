import { useState, useEffect, useMemo } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../firebase/firebaseConfig';
import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { UserDetailsDrawer } from '../components/UserDetailsDrawer';

export const UserManagement = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const adminLinks = [
    { path: '/admin', label: 'Overview' },
    { path: '/admin/events', label: 'Event Manager' },
    { path: '/admin/users', label: 'User Management' },
    { path: '/admin/reports', label: 'Approval Queue' },
    { path: '/admin/blog', label: 'Blog CMS' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'users'));
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAndSortedUsers = useMemo(() => {
    let filtered = users;

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
    if (!confirm(`Change user role to ${newRole}?`)) return;
    
    try {
      // Call the Cloud Function to update custom claims in Firebase Auth
      const updateUserRole = httpsCallable(functions, 'updateUserRole');
      await updateUserRole({ userId, role: newRole });
      
      alert(`Role updated to ${newRole}. User must logout and login again to see changes.`);
      fetchUsers();
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error updating role:', error);
      alert('Failed to update role');
    }
  };

  const handleStatusChange = async (userId, isActive) => {
    if (!confirm(`${isActive ? 'Enable' : 'Disable'} this account?`)) return;
    
    try {
      // Call the Cloud Function to enable/disable user
      const updateUserStatus = httpsCallable(functions, isActive ? 'enableUser' : 'disableUser');
      await updateUserStatus({ userId });
      
      alert(`Account ${isActive ? 'enabled' : 'disabled'} successfully`);
      fetchUsers();
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    }
  };

  const handleDelete = async (userId) => {
    if (!confirm('Delete this user permanently? This cannot be undone!')) return;
    
    try {
      // Call the Cloud Function to delete user
      const deleteUserFn = httpsCallable(functions, 'deleteUser');
      await deleteUserFn({ userId });
      
      alert('User deleted successfully');
      fetchUsers();
      setDrawerOpen(false);
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('Failed to delete user');
    }
  };

  const openUserDetails = (user) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  return (
    <DashboardLayout links={adminLinks} title="User Management">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl md:text-3xl font-bold text-brand-green">Users ({filteredAndSortedUsers.length})</h1>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border rounded-xl"
            />
            
            <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="px-4 py-2 border rounded-xl">
              <option value="all">All Roles</option>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>

            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-xl">
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
            </select>

            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-4 py-2 border rounded-xl">
              <option value="date">Sort by Date</option>
              <option value="points">Sort by Points</option>
              <option value="role">Sort by Role</option>
            </select>
          </div>
        </div>

        {/* User List */}
        {loading ? (
          <p>Loading users...</p>
        ) : (
          <div className="space-y-4">
            {filteredAndSortedUsers.map(user => (
              <div 
                key={user.id} 
                onClick={() => openUserDetails(user)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-brand-green">{user.name}</h3>
                      {user.isActive === false && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">Disabled</span>
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
                        : 'bg-green-100 text-brand-green'
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
        onRoleChange={handleRoleChange}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        currentAdminId={currentUser?.uid}
      />
    </DashboardLayout>
  );
};
