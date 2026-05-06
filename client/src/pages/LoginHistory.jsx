import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../db/indexedDB';
import { Search, UserCheck, UserX, Clock, History, Filter, RefreshCw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginHistory() {
  const navigate = useNavigate();
  const { user, isSuperAdmin, isAuthenticated } = useAuth();
  const [history, setHistory] = useState([]);
  const [filteredHistory, setFilteredHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterSuccess, setFilterSuccess] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    loadHistory();
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    filterHistory();
  }, [searchTerm, filterAction, filterSuccess, history]);

  const loadHistory = async () => {
    try {
      const data = await db.loginHistory
        .orderBy('createdAt')
        .reverse()
        .limit(200)
        .toArray();
      setHistory(data);
    } catch (error) {
      console.error('Error loading login history:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterHistory = () => {
    let filtered = [...history];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(h =>
        h.username.toLowerCase().includes(term) ||
        (h.failureReason && h.failureReason.toLowerCase().includes(term))
      );
    }

    if (filterAction) {
      filtered = filtered.filter(h => h.action === filterAction);
    }

    if (filterSuccess !== '') {
      filtered = filtered.filter(h => h.success === (filterSuccess === 'true'));
    }

    setFilteredHistory(filtered);
  };

  const getActionIcon = (action, success) => {
    if (!success) return <UserX size={16} className="text-red-600" />;
    switch (action) {
      case 'login':
        return <UserCheck size={16} className="text-green-600" />;
      case 'logout':
        return <Clock size={16} className="text-gray-600" />;
      case 'password_change':
        return <RefreshCw size={16} className="text-blue-600" />;
      case 'password_reset':
        return <RefreshCw size={16} className="text-orange-600" />;
      default:
        return <History size={16} className="text-gray-600" />;
    }
  };

  const getActionLabel = (action) => {
    switch (action) {
      case 'login':
        return 'Login';
      case 'logout':
        return 'Logout';
      case 'failed_attempt':
        return 'Failed Attempt';
      case 'password_change':
        return 'Password Change';
      case 'password_reset':
        return 'Password Reset';
      default:
        return action;
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Access denied. Admin only.</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Loading history...</div>
      </div>
    );
  }

  const successCount = history.filter(h => h.success).length;
  const failureCount = history.filter(h => !h.success).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Login History</h1>
        <button
          onClick={loadHistory}
          className="p-2 hover:bg-gray-100 rounded-lg transition"
          title="Refresh"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-500">Total Events</div>
          <div className="text-3xl font-bold">{history.length}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-500">Successful</div>
          <div className="text-3xl font-bold text-green-600">{successCount}</div>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-sm text-gray-500">Failed</div>
          <div className="text-3xl font-bold text-red-600">{failureCount}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Actions</option>
            <option value="login">Login</option>
            <option value="logout">Logout</option>
            <option value="failed_attempt">Failed Attempt</option>
            <option value="password_change">Password Change</option>
            <option value="password_reset">Password Reset</option>
          </select>
          <select
            value={filterSuccess}
            onChange={(e) => setFilterSuccess(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Status</option>
            <option value="true">Successful</option>
            <option value="false">Failed</option>
          </select>
        </div>

        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredHistory.length} of {history.length} events
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Username</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Action</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Details</th>
                <th className="text-left py-3 px-4 font-medium text-gray-600">Time</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    No history found
                  </td>
                </tr>
              ) : (
                filteredHistory.map((record, idx) => (
                  <tr key={idx} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4">
                      {getActionIcon(record.action, record.success)}
                    </td>
                    <td className="py-3 px-4 font-medium">{record.username}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.success
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {getActionLabel(record.action)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {record.failureReason || '-'}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {new Date(record.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}