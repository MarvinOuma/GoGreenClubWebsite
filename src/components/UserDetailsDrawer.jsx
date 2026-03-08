export const UserDetailsDrawer = ({ user, isOpen, onClose, onRoleChange, onStatusChange, onDelete, currentAdminId }) => {
  if (!isOpen || !user) return null;

  const canModify = currentAdminId !== user.id;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-brand-green">User Details</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div>
              <label className="text-sm text-gray-500">Name</label>
              <p className="text-lg font-semibold">{user.name}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="text-sm">{user.email}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Role</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-green-100 text-brand-green'
              }`}>
                {user.role || 'member'}
              </span>
            </div>

            <div>
              <label className="text-sm text-gray-500">Branch</label>
              <p>{user.branch || 'N/A'}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Green Points</label>
              <p className="text-2xl font-bold text-brand-green">{user.greenPoints || 0}</p>
            </div>

            <div>
              <label className="text-sm text-gray-500">Status</label>
              <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                user.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {user.isActive !== false ? 'Active' : 'Disabled'}
              </span>
            </div>

            <div>
              <label className="text-sm text-gray-500">Joined</label>
              <p>{user.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}</p>
            </div>

            {canModify && (
              <div className="space-y-3 pt-6 border-t">
                <h3 className="font-semibold text-gray-700">Actions</h3>
                
                {user.role !== 'admin' && (
                  <button onClick={() => onRoleChange(user.id, 'admin')} className="w-full btn-secondary text-sm">
                    Promote to Admin
                  </button>
                )}
                
                {user.role === 'admin' && (
                  <button onClick={() => onRoleChange(user.id, 'member')} className="w-full btn-secondary text-sm">
                    Demote to Member
                  </button>
                )}

                {user.isActive !== false ? (
                  <button onClick={() => onStatusChange(user.id, false)} className="w-full px-4 py-2 bg-yellow-500 text-white rounded-xl">
                    Disable Account
                  </button>
                ) : (
                  <button onClick={() => onStatusChange(user.id, true)} className="w-full px-4 py-2 bg-green-500 text-white rounded-xl">
                    Enable Account
                  </button>
                )}

                <button onClick={() => onDelete(user.id)} className="w-full px-4 py-2 bg-red-500 text-white rounded-xl">
                  Delete User
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};
