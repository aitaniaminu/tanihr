import { useState, useEffect } from 'react';
import { onSyncStatusChange, triggerFullSync, getOnlineStatus, clearAllData } from '../lib/syncEngine';
import { RefreshCw, Wifi, WifiOff, Database, CheckCircle, AlertCircle, ArrowDownUp, Trash2 } from 'lucide-react';

export default function SyncDatabase() {
  const [syncState, setSyncState] = useState({
    isOnline: getOnlineStatus(),
    isSyncing: false,
    syncStatus: 'idle',
    syncLogs: [],
    lastSyncTime: null,
  });
  const [syncing, setSyncing] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearResult, setClearResult] = useState(null);

  useEffect(() => {
    const unsub = onSyncStatusChange(setSyncState);
    return unsub;
  }, []);

  const handleFullSync = async () => {
    setSyncing(true);
    await triggerFullSync();
    setSyncing(false);
  };

  const handleClearData = async () => {
    setClearing(true);
    setClearResult(null);
    try {
      await clearAllData();
      setClearResult({ success: true, message: 'All local data cleared. Sync will repopulate on next connection.' });
    } catch (error) {
      setClearResult({ success: false, message: error.message });
    } finally {
      setClearing(false);
    }
  };

  const statusLabels = {
    idle: 'Not initialized',
    'syncing-from-supabase': 'Syncing from Supabase...',
    active: 'Active - Real-time sync enabled',
    offline: 'Offline - Changes queued locally',
  };

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Database Synchronization</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <ArrowDownUp size={20} className="text-green-600" />
          Sync Status
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              {syncState.isOnline ? (
                <Wifi size={16} className="text-green-600" />
              ) : (
                <WifiOff size={16} className="text-red-600" />
              )}
              <span className="text-xs text-gray-500 uppercase">Connection</span>
            </div>
            <p className={`text-sm font-medium ${syncState.isOnline ? 'text-green-600' : 'text-red-600'}`}>
              {syncState.isOnline ? 'Online' : 'Offline'}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
            <div className="flex items-center gap-2 mb-1">
              <Database size={16} className="text-blue-600" />
              <span className="text-xs text-gray-500 uppercase">Status</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {statusLabels[syncState.syncStatus] || syncState.syncStatus}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle size={16} className="text-purple-600" />
              <span className="text-xs text-gray-500 uppercase">Last Sync</span>
            </div>
            <p className="text-sm font-medium text-gray-900">
              {syncState.lastSyncTime
                ? new Date(syncState.lastSyncTime).toLocaleTimeString()
                : 'Never'}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleFullSync}
            disabled={syncing || !syncState.isOnline}
            className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base"
          >
            <RefreshCw size={18} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing...' : 'Force Sync Now'}
          </button>

          <button
            onClick={handleClearData}
            disabled={clearing}
            className="flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base"
          >
            <Trash2 size={18} />
            {clearing ? 'Clearing...' : 'Clear Local Data'}
          </button>
        </div>

        {clearResult && (
          <div className={`mt-3 p-3 rounded-lg ${clearResult.success ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
            <div className="flex items-center gap-2">
              {clearResult.success ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
              <span className="text-sm">{clearResult.message}</span>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Database size={20} className="text-blue-600" />
          Sync Log
        </h2>

        {syncState.syncLogs.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-8">No sync activity yet. Logs will appear here when sync starts.</p>
        ) : (
          <div className="bg-gray-50 rounded-lg p-3 sm:p-4 max-h-80 overflow-y-auto font-mono text-xs sm:text-sm">
            {syncState.syncLogs.map((log, i) => (
              <div key={i} className="mb-1 text-gray-700 border-b border-gray-100 last:border-0 pb-1 last:pb-0">
                {log}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 sm:p-6">
        <h2 className="text-sm font-semibold text-blue-800 mb-2">How It Works</h2>
        <ul className="text-sm text-blue-700 space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">↓</span>
            <span><strong>Supabase → IndexedDB:</strong> Automatic on login. Real-time updates via Supabase subscriptions.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">↑</span>
            <span><strong>IndexedDB → Supabase:</strong> Automatic. Changes are queued and synced after 2 seconds.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">⟳</span>
            <span><strong>Conflict Resolution:</strong> Supabase is the source of truth. Local changes are upserted to server.</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-500 mt-0.5">⚡</span>
            <span><strong>Offline Mode:</strong> App works offline. Changes queue locally and sync when connection restored.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
