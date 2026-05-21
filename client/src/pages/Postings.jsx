import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, MapPin, X, Trash2, Edit, ArrowRight, Calendar } from 'lucide-react';

const POSTING_TYPES = ['Transfer', 'Secondment', 'Deputation', 'Reposting', 'Promotion Transfer', 'Disciplinary Transfer'];

export default function Postings() {
  const [postings, setPostings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPosting, setEditingPosting] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    fromDepartment: '',
    toDepartment: '',
    fromLocation: '',
    toLocation: '',
    postingType: 'Transfer',
    effectiveDate: '',
    endDate: '',
    reason: '',
    authority: '',
    remarks: '',
  });

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [postingsData, emps] = await Promise.all([
        db.postings.toArray(),
        db.employees.toArray(),
      ]);
      setPostings(postingsData);
      setEmployees(emps);
    } catch (err) {
      console.error('Error loading postings:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingPosting) {
        await db.postings.update(editingPosting.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        if (formData.fromDepartment === formData.toDepartment && formData.fromLocation === formData.toLocation) {
          alert('Transfer must be to a different department or location');
          return;
        }
        await db.postings.add({
          ...formData,
          postingNumber: `POST-${new Date().getFullYear()}-${String(postings.length + 1).padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
          createdBy: user?.username || 'Unknown',
        });
      }
      setShowForm(false);
      setEditingPosting(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Error saving posting:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      fromDepartment: '',
      toDepartment: '',
      fromLocation: '',
      toLocation: '',
      postingType: 'Transfer',
      effectiveDate: '',
      endDate: '',
      reason: '',
      authority: '',
      remarks: '',
    });
  };

  const handleEdit = (posting) => {
    setEditingPosting(posting);
    setFormData(posting);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this posting record?')) return;
    await db.postings.delete(id);
    loadData();
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.surname}, ${emp.firstName}` : 'Unknown';
  };

  const filteredPostings = postings.filter(p => {
    const empName = getEmployeeName(p.employeeId).toLowerCase();
    return empName.includes(searchTerm.toLowerCase()) ||
      p.postingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.toDepartment?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const activeCount = postings.filter(p => !p.endDate || new Date(p.endDate) >= new Date()).length;
  const completedCount = postings.filter(p => p.endDate && new Date(p.endDate) < new Date()).length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="text-gray-600 text-lg">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Postings & Transfers</h1>
        <button
          onClick={() => { setEditingPosting(null); resetForm(); setShowForm(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={20} />
          New Posting
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Postings</p>
              <p className="text-2xl font-bold text-green-600">{postings.length}</p>
            </div>
            <MapPin className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-blue-600">{activeCount}</p>
            </div>
            <ArrowRight className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-gray-600">{completedCount}</p>
            </div>
            <Calendar className="text-gray-600" size={24} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search postings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Ref #</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Employee</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">From</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">To</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Effective</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPostings.map(posting => {
              const isActive = !posting.endDate || new Date(posting.endDate) >= new Date();
              return (
                <tr key={posting.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">{posting.postingNumber}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">{getEmployeeName(posting.employeeId)}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{posting.postingType}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {posting.fromDepartment}
                    {posting.fromLocation && <span className="text-gray-400"> ({posting.fromLocation})</span>}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-green-700">
                    {posting.toDepartment}
                    {posting.toLocation && <span className="text-gray-400"> ({posting.toLocation})</span>}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{posting.effectiveDate}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
                      {isActive ? 'Active' : 'Completed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleEdit(posting)} className="p-1 text-gray-400 hover:text-yellow-600"><Edit size={16} /></button>
                      <button onClick={() => handleDelete(posting.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {filteredPostings.length === 0 && (
          <div className="text-center py-12 text-gray-500">No posting records found.</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingPosting ? 'Edit Posting' : 'New Posting/Transfer'}</h2>
              <button onClick={() => { setShowForm(false); setEditingPosting(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={formData.employeeId} onChange={(e) => setFormData(f => ({ ...f, employeeId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.surname}, {emp.firstName} ({emp.departmentName || 'No Dept'})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Posting Type *</label>
                <select value={formData.postingType} onChange={(e) => setFormData(f => ({ ...f, postingType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  {POSTING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Department *</label>
                  <input type="text" value={formData.fromDepartment} onChange={(e) => setFormData(f => ({ ...f, fromDepartment: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Department *</label>
                  <input type="text" value={formData.toDepartment} onChange={(e) => setFormData(f => ({ ...f, toDepartment: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">From Location</label>
                  <input type="text" value={formData.fromLocation} onChange={(e) => setFormData(f => ({ ...f, fromLocation: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To Location</label>
                  <input type="text" value={formData.toLocation} onChange={(e) => setFormData(f => ({ ...f, toLocation: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
                  <input type="date" value={formData.effectiveDate} onChange={(e) => setFormData(f => ({ ...f, effectiveDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date (if temporary)</label>
                  <input type="date" value={formData.endDate} onChange={(e) => setFormData(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={formData.reason} onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authority</label>
                <input type="text" value={formData.authority} onChange={(e) => setFormData(f => ({ ...f, authority: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., Ministry Circular, Board Resolution" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={formData.remarks} onChange={(e) => setFormData(f => ({ ...f, remarks: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingPosting(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingPosting ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
