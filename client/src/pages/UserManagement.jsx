import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/indexedDB';
import { Plus, Search, X, Check, Trash2, Edit, Shield, User, UserCheck, UserX, Clock, History, Power } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Super Admin', 'HR Manager', 'Line Manager', 'Employee', 'Recruiter', 'Executive'];

const ROLE_KEYS_DISPLAY = {
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
  line_manager: 'Line Manager',
  employee: 'Employee',
  recruiter: 'Recruiter',
  executive: 'Executive',
};

const ROLE_COLORS = {
  'Super Admin': 'bg-purple-100 text-purple-700',
  'HR Manager': 'bg-blue-100 text-blue-700',
  'Line Manager': 'bg-green-100 text-green-700',
  'Employee': 'bg-gray-100 text-gray-700',
  'Recruiter': 'bg-orange-100 text-orange-700',
  'Executive': 'bg-red-100 text-red-700',
};

const ROLE_KEYS = {
  'Super Admin': 'super_admin',
  'HR Manager': 'hr_manager',
  'Line Manager': 'line_manager',
  'Employee': 'employee',
  'Recruiter': 'recruiter',
  'Executive': 'executive',
};

const ROLE_KEYS_REVERSE = {
  super_admin: 'Super Admin',
  hr_manager: 'HR Manager',
  line_manager: 'Line Manager',
  employee: 'Employee',
  recruiter: 'Recruiter',
  executive: 'Executive',
};

const getUserRoles = (user) => {
  if (user.roles && Array.isArray(user.roles)) {
    return user.roles.map(r => ROLE_KEYS_REVERSE[r] || r);
  }
  return [user.role || 'Employee'];
};

const UserDetailModal = ({ user, onClose, onEdit, onToggleStatus }) => {
  const [loginHistory, setLoginHistory] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('profile');

  useEffect(() => {
    loadUserData();
  }, [user.id]);

  const loadUserData = async () => {
    const history = await db.loginHistory
      .where('username')
      .equals(user.username)
      .reverse()
      .limit(10)
      .toArray();
    setLoginHistory(history);

    const userSessions = await db.userSessions
      .where('userId')
      .equals(user.id.toString())
      .filter(s => s.isActive)
      .toArray();
    setSessions(userSessions);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm sm:max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-4 sm:p-6 border-b">
          <h2 className="text-lg sm:text-xl font-semibold truncate">{user.username} Details</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 flex-shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="flex border-b overflow-x-auto">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 sm:px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'profile' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`px-4 sm:px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'activity' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab('sessions')}
            className={`px-4 sm:px-6 py-3 font-medium whitespace-nowrap ${activeTab === 'sessions' ? 'border-b-2 border-green-600 text-green-600' : 'text-gray-500'}`}
          >
            Sessions
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-2xl font-bold">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-semibold">{user.username}</h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {getUserRoles(user).map((role, idx) => (
                      <span key={idx} className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[role]}`}>
                        {role}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-4">
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium">{user.email || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <p className="font-medium">{user.status === 'active' ? 'Active' : 'Inactive'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Created At</label>
                  <p className="font-medium">{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Last Login</label>
                  <p className="font-medium">{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-2">
              {loginHistory.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No activity recorded</p>
              ) : (
                loginHistory.map((record, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {record.success ? (
                        <UserCheck size={16} className="text-green-600" />
                      ) : (
                        <UserX size={16} className="text-red-600" />
                      )}
                      <span className="font-medium capitalize">{record.action.replace('_', ' ')}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-2">
              {sessions.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No active sessions</p>
              ) : (
                sessions.map((session, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Clock size={16} className="text-blue-600" />
                      <span className="font-medium">{session.deviceInfo || 'Unknown Device'}</span>
                    </div>
                    <span className="text-sm text-gray-500">
                      Expires: {new Date(session.expiresAt).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="flex justify-between p-6 border-t bg-gray-50">
          <button
            onClick={() => onToggleStatus(user)}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${user.status === 'active' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
          >
            <Power size={16} />
            {user.status === 'active' ? 'Deactivate' : 'Activate'}
          </button>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Close
            </button>
            <button onClick={() => { onClose(); onEdit(user); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
              Edit User
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const UserCard = ({ user, onEdit, onDelete, onViewDetails, currentUser }) => {
  const userRoles = getUserRoles(user);
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => onViewDetails(user)}>
          <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{user.username}</h3>
            <p className="text-sm text-gray-500">{user.email || 'No email'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex flex-wrap gap-1">
            {userRoles.map((role, idx) => (
              <span key={idx} className={`px-2 py-1 rounded-full text-xs font-medium ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-700'}`}>
                {role}
              </span>
            ))}
          </div>
          {user.username !== currentUser?.username && (
            <>
              <button
                onClick={() => onViewDetails(user)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                aria-label={`View ${user.username}`}
              >
                <User size={16} />
              </button>
              <button
                onClick={() => onEdit(user)}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                aria-label={`Edit ${user.username}`}
              >
                <Edit size={16} />
              </button>
              <button
                onClick={() => onDelete(user.id)}
                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                aria-label={`Delete ${user.username}`}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <Shield size={12} />
            {userRoles.join(', ')}
          </span>
          <span className={`flex items-center gap-1 ${user.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
            <Power size={12} />
            {user.status === 'active' ? 'Active' : 'Inactive'}
          </span>
          {user.lastLogin && (
            <span className="flex items-center gap-1">
              <Clock size={12} />
              Last: {new Date(user.lastLogin).toLocaleDateString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default function UserManagement() {
  const navigate = useNavigate();
  const { user: currentUser, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [viewingUser, setViewingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    roles: ['employee'],
    primaryRole: 'employee',
    status: 'active',
  });

  useEffect(() => {
    if (!isSuperAdmin) {
      navigate('/dashboard');
      return;
    }
    loadUsers();
  }, [isSuperAdmin, navigate]);

  useEffect(() => {
    filterUsers();
  }, [searchTerm, filterRole, filterStatus, users]);

  const loadUsers = async () => {
    try {
      const data = await db.users.toArray();
      setUsers(data.map(u => ({ ...u, status: u.status || 'active' })));
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(u => {
        const userRoles = getUserRoles(u);
        return (
          u.username.toLowerCase().includes(term) ||
          (u.email && u.email.toLowerCase().includes(term)) ||
          userRoles.some(r => r.toLowerCase().includes(term))
        );
      });
    }

    if (filterRole) {
      const roleKey = ROLE_KEYS[filterRole];
      filtered = filtered.filter(u => {
        const userRoles = u.roles || [ROLE_KEYS_REVERSE[u.primaryRole] || u.role];
        return userRoles.includes(roleKey);
      });
    }

    if (filterStatus) {
      filtered = filtered.filter(u => (u.status || 'active') === filterStatus);
    }

    setFilteredUsers(filtered);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userRoles = formData.roles || ['employee'];
      const roleDisplay = userRoles.map(r => ROLE_KEYS_REVERSE[r] || r);
      const primaryRoleDisplay = ROLE_KEYS_REVERSE[formData.primaryRole] || formData.primaryRole;

      if (editingUser) {
        const updateData = {
          roles: userRoles,
          primaryRole: formData.primaryRole,
          role: primaryRoleDisplay,
        };
        if (formData.email) updateData.email = formData.email;
        if (formData.password) updateData.password = formData.password;
        if (formData.status) updateData.status = formData.status;
        await db.users.update(editingUser.id, updateData);
      } else {
        await db.users.add({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          roles: userRoles,
          primaryRole: formData.primaryRole,
          role: primaryRoleDisplay,
          createdAt: new Date().toISOString(),
          lastLogin: null,
          status: 'active',
        });
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({ username: '', email: '', password: '', roles: ['employee'], primaryRole: 'employee', status: 'active' });
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Error saving user. Username may already exist.');
    }
  };

  const handleEdit = (user) => {
    const userRoles = user.roles || [ROLE_KEYS[user.role] || 'employee'];
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email || '',
      password: '',
      roles: userRoles,
      primaryRole: user.primaryRole || userRoles[0],
      status: user.status || 'active',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await db.users.delete(id);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    if (!confirm(`Are you sure you want to ${newStatus === 'active' ? 'activate' : 'deactivate'} this user?`)) return;
    try {
      await db.users.update(user.id, { status: newStatus });
      loadUsers();
      setViewingUser(null);
    } catch (error) {
      console.error('Error updating user status:', error);
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
        <button
          onClick={() => {
            setEditingUser(null);
            setFormData({ username: '', email: '', password: '', roles: ['employee'], primaryRole: 'employee', status: 'active' });
            setShowForm(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
          data-testid="add-user-btn"
        >
          <Plus size={20} />
          Add User
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold" data-testid="form-heading">
                {editingUser ? 'Edit User' : 'Add New User'}
              </h2>
          <button
            onClick={() => {
              setShowForm(false);
              setEditingUser(null);
            }}
            className="text-gray-500 hover:text-gray-700"
            data-testid="close-form"
          >
            <X size={20} />
          </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username *
              </label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Enter email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {editingUser ? '(leave blank to keep unchanged)' : '*'}
              </label>
              <input
                type="password"
                required={!editingUser}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder={editingUser ? 'Leave blank to keep current' : 'Enter password'}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roles *
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {Object.entries(ROLE_KEYS).map(([display, key]) => (
                  <label key={key} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.roles.includes(key)}
                      onChange={(e) => {
                        const newRoles = e.target.checked
                          ? [...formData.roles, key]
                          : formData.roles.filter(r => r !== key);
                        const primaryRole = formData.primaryRole;
                        const newPrimary = newRoles.includes(primaryRole) ? primaryRole : (newRoles[0] || 'employee');
                        setFormData({ ...formData, roles: newRoles.length ? newRoles : ['employee'], primaryRole: newPrimary });
                      }}
                      className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                    />
                    <span className="text-sm">{display}</span>
                  </label>
                ))}
              </div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Primary Role (display role) *
              </label>
              <select
                required
                value={formData.primaryRole}
                onChange={(e) => setFormData({ ...formData, primaryRole: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                {formData.roles.map(roleKey => (
                  <option key={roleKey} value={roleKey}>{ROLE_KEYS_REVERSE[roleKey]}</option>
                ))}
              </select>
            </div>
            {editingUser && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status *
                </label>
                <select
                  required
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingUser(null);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                data-testid="cancel-form"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                data-testid="submit-user"
              >
                {editingUser ? 'Update User' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Roles</option>
            {ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>

        <div className="space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm || filterRole || filterStatus ? 'No users match your filters.' : 'No users yet. Add your first user.'}
            </div>
          ) : (
            filteredUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onViewDetails={setViewingUser}
                currentUser={currentUser}
              />
            ))
          )}
        </div>
      </div>

      {viewingUser && (
        <UserDetailModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onEdit={handleEdit}
          onToggleStatus={handleToggleStatus}
        />
      )}
    </div>
  );
}