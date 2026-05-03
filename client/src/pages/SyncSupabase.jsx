import { useState } from 'react';
import { syncEmployeesToSupabase } from '../lib/syncSupabase';

export default function SyncSupabase() {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState(null);
  const [logs, setLogs] = useState([]);

  const addLog = (msg) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleSync = async () => {
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
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Sync to Supabase</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600 mb-4">
          Copy employees from IndexedDB to Supabase.
        </p>
        
        <button
          onClick={handleSync}
          disabled={syncing}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 mb-4"
        >
          {syncing ? 'Syncing...' : 'Sync Employees'}
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