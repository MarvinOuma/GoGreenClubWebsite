const formatDate = (value) => {
  if (!value) return 'N/A';
  const d = typeof value?.toDate === 'function' ? value.toDate() : new Date(value);
  return Number.isNaN(d.getTime())
    ? 'N/A'
    : new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'short', day: 'numeric' }).format(d);
};

export const UserDetailsDrawer = ({
  user,
  isOpen,
  onClose,
  onRequestRoleChange,
  onRequestStatusChange,
  onRequestDelete,
  currentAdminId,
}) => {
  if (!isOpen || !user) return null;

  const canModify = currentAdminId !== user.id;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-500">User</p>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900">Details</h2>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-emerald-50 rounded-xl" aria-label="Close">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">
              <p className="text-xs font-semibold text-gray-500">Name</p>
              <p className="mt-1 text-lg font-extrabold tracking-tight text-gray-900">{user.name || 'N/A'}</p>
              <p className="mt-1 text-sm text-gray-600">{user.email || 'N/A'}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Role</label>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {user.role || 'member'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Status</label>
              <div className="mt-2">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${
                    user.isActive !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.isActive !== false ? 'Active' : 'Disabled'}
                </span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Branch</label>
              <p className="mt-1 text-sm text-gray-800">{user.branch || 'N/A'}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Green Points</label>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-emerald-700">{user.greenPoints || 0}</p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500">Joined</label>
              <p className="mt-1 text-sm text-gray-800">{formatDate(user.createdAt)}</p>
            </div>

            {canModify && (
              <div className="space-y-3 pt-6 border-t border-gray-100">
                <h3 className="text-sm font-extrabold tracking-tight text-gray-900">Actions</h3>
                
                {user.role !== 'admin' && (
                  <button
                    onClick={() => onRequestRoleChange?.(user.id, 'admin')}
                    className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                  >
                    Promote to Admin
                  </button>
                )}
                
                {user.role === 'admin' && (
                  <button
                    onClick={() => onRequestRoleChange?.(user.id, 'member')}
                    className="w-full rounded-xl bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-gray-200 hover:bg-gray-50"
                  >
                    Demote to Member
                  </button>
                )}

                {user.isActive !== false ? (
                  <button
                    onClick={() => onRequestStatusChange?.(user.id, false)}
                    className="w-full rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-600"
                  >
                    Disable Account
                  </button>
                ) : (
                  <button
                    onClick={() => onRequestStatusChange?.(user.id, true)}
                    className="w-full rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                  >
                    Enable Account
                  </button>
                )}

                <button
                  onClick={() => onRequestDelete?.(user.id)}
                  className="w-full rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700"
                >
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
