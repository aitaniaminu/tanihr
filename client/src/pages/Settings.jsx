import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { assignEmployeeRoleToAllEmployees } from '../utils/employeeRoles';
import { Users, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

export default function Settings() {
  const { clientName, updateClientName } = useSettings();
  const [inputName, setInputName] = useState(clientName);
  const [saved, setSaved] = useState(false);
  const [assigningRoles, setAssigningRoles] = useState(false);
  const [roleResult, setRoleResult] = useState(null);

  const handleSave = () => {
    updateClientName(inputName);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAssignEmployeeRoles = async () => {
    setAssigningRoles(true);
    setRoleResult(null);
    
    try {
      const result = await assignEmployeeRoleToAllEmployees();
      setRoleResult(result);
    } catch (error) {
      setRoleResult({ success: false, error: error.message });
    } finally {
      setAssigningRoles(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6 px-2 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Settings</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Organization Details</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="clientName" className="block text-sm font-medium text-gray-700 mb-2">
              Client / Organization Name
            </label>
            <input
              id="clientName"
              type="text"
              value={inputName}
              onChange={(e) => setInputName(e.target.value)}
              className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="Enter organization name"
            />
            <p className="mt-2 text-sm text-gray-500">
              This name will appear on the login page and throughout the application.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 pt-4">
            <button
              onClick={handleSave}
              className="bg-gradient-to-r from-green-600 to-green-700 text-white px-5 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all w-full sm:w-auto"
            >
              Save Settings
            </button>
            {saved && (
              <span className="text-green-600 text-sm font-medium">Settings saved successfully!</span>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Users size={20} />
          User Role Management
        </h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Assign "Employee" role to all employees in the database. This creates user accounts for employees who don't have one yet.
        </p>

        <button
          onClick={handleAssignEmployeeRoles}
          disabled={assigningRoles}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
        >
          {assigningRoles ? (
            <>
              <RefreshCw size={18} className="animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <Users size={18} />
              Assign Employee Role to All Employees
            </>
          )}
        </button>

        {roleResult && (
          <div className={`mt-4 p-4 rounded-lg ${roleResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            {roleResult.success ? (
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle size={20} />
                <span>
                  Completed! Created {roleResult.created} user accounts, {roleResult.skipped} already existed (total: {roleResult.total} employees).
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle size={20} />
                <span>Error: {roleResult.error}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
