import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/indexedDB';
import { User, Mail, Shield, Clock, Save, X, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = ['Super Admin', 'HR Manager', 'Line Manager', 'Employee', 'Recruiter', 'Executive'];

const ROLE_COLORS = {
  'Super Admin': 'bg-purple-100 text-purple-700',
  'HR Manager': 'bg-blue-100 text-blue-700',
  'Line Manager': 'bg-green-100 text-green-700',
  'Employee': 'bg-gray-100 text-gray-700',
  'Recruiter': 'bg-orange-100 text-orange-700',
  'Executive': 'bg-red-100 text-red-700',
};

export default function MyProfile() {
  const navigate = useNavigate();
  const { user, isAuthenticated, mapRoleToLegacy } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [isAuthenticated, navigate]);

  const loadProfile = async () => {
    try {
      if (user.username === 'aminua@tani.com.ng') {
        setProfileData({
          username: user.username,
          email: user.email || 'aminua@tani.com.ng',
          role: user.role,
          roleKey: user.roleKey || 'super_admin',
          createdAt: '2026-01-01',
          lastLogin: new Date().toISOString(),
        });
      } else {
        const localUser = await db.users.where('username').equals(user.username).first();
        if (localUser) {
          setProfileData({
            ...localUser,
            role: localUser.role,
            roleKey: user.roleKey,
          });
        }
      }
      setFormData({
        username: user.username,
        email: user.email || '',
      });
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      if (user.username === 'aminua@tani.com.ng') {
        setMessage({ type: 'error', text: 'Admin profile cannot be edited' });
        setSaving(false);
        return;
      }

      const localUser = await db.users.where('username').equals(user.username).first();
      if (localUser) {
        await db.users.update(localUser.id, {
          email: formData.email,
        });

        const updatedSession = { ...user, email: formData.email };
        sessionStorage.setItem('tanihr_user', JSON.stringify(updatedSession));

        setMessage({ type: 'success', text: 'Profile updated successfully!' });
        setEditMode(false);
        loadProfile();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Loading profile...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
        {!editMode && user.username !== 'aminua@tani.com.ng' && (
          <button
            onClick={() => setEditMode(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
          >
            <User size={20} />
            Edit Profile
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="w-24 h-24 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-4xl font-bold">
            {profileData.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-2xl font-semibold">{profileData.username}</h2>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 ${ROLE_COLORS[profileData.role]}`}>
              {profileData.role}
            </span>
          </div>
        </div>

        {editMode ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Username
              </label>
              <input
                type="text"
                value={formData.username}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Username cannot be changed</p>
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
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setEditMode(false);
                  setFormData({ username: user.username, email: user.email || '' });
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2 disabled:opacity-50"
              >
                <Save size={18} />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <User className="text-gray-400" size={24} />
              <div>
                <label className="text-sm text-gray-500">Username</label>
                <p className="font-medium">{profileData.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Mail className="text-gray-400" size={24} />
              <div>
                <label className="text-sm text-gray-500">Email</label>
                <p className="font-medium">{profileData.email || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Shield className="text-gray-400" size={24} />
              <div>
                <label className="text-sm text-gray-500">Role</label>
                <p className="font-medium">{profileData.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
              <Clock className="text-gray-400" size={24} />
              <div>
                <label className="text-sm text-gray-500">Last Login</label>
                <p className="font-medium">
                  {profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleString() : 'Unknown'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Lock size={20} />
          Security
        </h3>
        <p className="text-gray-600 mb-4">
          Keep your account secure by using a strong password and not sharing your credentials.
        </p>
        <button
          onClick={() => navigate('/change-password')}
          className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
        >
          <Lock size={18} />
          Change Password
        </button>
      </div>
    </div>
  );
}