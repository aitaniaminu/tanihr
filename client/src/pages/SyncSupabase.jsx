import { useState } from 'react';
import { syncEmployeesToSupabase } from '../lib/syncSupabase';
import { syncFromSupabase } from '../lib/offlineSync';

export default function SyncSupabase() {
  const [syncing, setSyncing] = useState(false);
  const [syncingFrom, setSyncingFrom] = useState(false);
  const [result, setResult] = useState(null);
  const [resultFrom, setResultFrom] = useState(null);
  const [logs, setLogs] = useState([]);
  const [logsFrom, setLogsFrom] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const addLogFrom = (msg) => {
    setLogsFrom(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSyncFromSupabase = async () => {
    setSyncingFrom(true);
    setResultFrom(null);
    setLogsFrom([]);

    try {
      addLogFrom('Starting sync from Supabase to IndexedDB...');
      await syncFromSupabase(addLogFrom);
      addLogFrom('Sync from Supabase completed!');
      setResultFrom({ success: true });
    } catch (err) {
      addLogFrom(`ERROR: ${err.message}`);
      setResultFrom({ error: err.message });
    } finally {
      setSyncingFrom(false);
    }
  };

  const handleSyncToSupabase = async () => {
    setSyncing(true);
    setResult(null);
    setLogs([]);

    try {
      addLog('Starting sync...');
      const result = await syncEmployeesToSupabase(addLog);
      
      setResult(result);
    } catch (err) {
      addLog(`ERROR: ${err.message}`);
      setResult({ error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Data Synchronization</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-blue-600">↓</span> Sync from Supabase
        </h2>
        <p className="text-gray-600 mb-4">
          Fetch all data from Supabase and store in IndexedDB (offline-first). Use this to populate local database with employees from the server.
        </p>
        
        <button
          onClick={handleSyncFromSupabase}
          disabled={syncingFrom}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 mb-4 flex items-center gap-2"
        >
          {syncingFrom ? (
            <>
              <span className="animate-spin">⟳</span> Syncing from Supabase...
            </>
          ) : (
            <>
              <span>↓</span> Sync from Supabase
            </>
          )}
        </button>
        
        {logsFrom.length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logsFrom.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))}
          </div>
        )}
        
        {resultFrom && (
          <div className={`mt-4 p-4 rounded-lg ${resultFrom.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            <p className="font-medium">{resultFrom.success ? 'Sync from Supabase completed!' : 'Error'}</p>
            {resultFrom.error && <p>{resultFrom.error}</p>}
          </div>
        )}
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <span className="text-green-600">↑</span> Sync to Supabase
        </h2>
        <p className="text-gray-600 mb-4">
          Copy employees from IndexedDB to Supabase (uploads local changes to server).
        </p>
        
        <button
          onClick={handleSyncToSupabase}
          disabled={syncing}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 mb-4 flex items-center gap-2"
        >
          {syncing ? (
            <>
              <span className="animate-spin">⟳</span> Syncing to Supabase...
            </>
          ) : (
            <>
              <span>↑</span> Sync to Supabase
            </>
          )}
        </button>
        
        {logs.length > 0 && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="mb-1">{log}</div>
            ))}
          </div>
        )}
        
        {result && !result.error && (
          <div className="mt-4 p-4 bg-green-100 text-green-700 rounded-lg">
            <p className="font-medium">Success!</p>
            <p>{result.synced} of {result.total} employees synced to Supabase</p>
            {result.failed > 0 && <p>{result.failed} failed</p>}
          </div>
        )}
        
        {result?.error && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded-lg">
            <p className="font-medium">Error</p>
            <p>{result.error}</p>
          </div>
        )}
      </div>
    </div>
  );
}