import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, AlertTriangle, X, Check, Clock, Trash2, Edit, FileText, User, Calendar } from 'lucide-react';

const OFFENSE_CATEGORIES = ['Misconduct', 'Insubordination', 'Negligence', 'Absenteeism', 'Fraud', 'Harassment', 'Breach of Policy', 'Other'];
const SANCTION_TYPES = ['Verbal Warning', 'Written Warning', 'Final Warning', 'Suspension', 'Demotion', 'Termination'];
const CASE_STATUSES = ['Open', 'Under Investigation', 'Hearing Scheduled', 'Decision Pending', 'Resolved', 'Appealed', 'Closed'];

const statusColors = {
  Open: 'bg-blue-100 text-blue-700',
  'Under Investigation': 'bg-yellow-100 text-yellow-700',
  'Hearing Scheduled': 'bg-purple-100 text-purple-700',
  'Decision Pending': 'bg-orange-100 text-orange-700',
  Resolved: 'bg-green-100 text-green-700',
  Appealed: 'bg-red-100 text-red-700',
  Closed: 'bg-gray-100 text-gray-700',
};

export default function Discipline() {
  const [cases, setCases] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCase, setEditingCase] = useState(null);
  const [selectedCase, setSelectedCase] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const [formData, setFormData] = useState({
    employeeId: '',
    offenseCategory: '',
    offenseDescription: '',
    sanctionType: '',
    sanctionDetails: '',
    status: 'Open',
    reportedBy: '',
    reportedDate: '',
    investigationNotes: '',
    hearingDate: '',
    decisionDate: '',
    decision: '',
  });

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [casesData, emps] = await Promise.all([
        db.disciplineCases.toArray(),
        db.employees.toArray(),
      ]);
      setCases(casesData);
      setEmployees(emps);
    } catch (err) {
      console.error('Error loading discipline data:', err);
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
      if (editingCase) {
        await db.disciplineCases.update(editingCase.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db.disciplineCases.add({
          ...formData,
          caseNumber: `DIS-${new Date().getFullYear()}-${String(cases.length + 1).padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
          createdBy: user?.username || 'Unknown',
        });
      }
      setShowForm(false);
      setEditingCase(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Error saving discipline case:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      offenseCategory: '',
      offenseDescription: '',
      sanctionType: '',
      sanctionDetails: '',
      status: 'Open',
      reportedBy: '',
      reportedDate: '',
      investigationNotes: '',
      hearingDate: '',
      decisionDate: '',
      decision: '',
    });
  };

  const handleEdit = (caseItem) => {
    setEditingCase(caseItem);
    setFormData(caseItem);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this discipline case?')) return;
    await db.disciplineCases.delete(id);
    loadData();
  };

  const handleStatusChange = async (id, newStatus) => {
    await db.disciplineCases.update(id, {
      status: newStatus,
      updatedAt: new Date().toISOString(),
    });
    loadData();
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.surname}, ${emp.firstName}` : 'Unknown';
  };

  const filteredCases = cases
    .filter(c => statusFilter === 'all' || c.status === statusFilter)
    .filter(c => {
      const empName = getEmployeeName(c.employeeId).toLowerCase();
      return empName.includes(searchTerm.toLowerCase()) ||
        c.offenseCategory?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.caseNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const openCount = cases.filter(c => c.status === 'Open').length;
  const investigationCount = cases.filter(c => c.status === 'Under Investigation').length;
  const resolvedCount = cases.filter(c => c.status === 'Resolved').length;
  const appealedCount = cases.filter(c => c.status === 'Appealed').length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="text-gray-600 text-lg">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Discipline</h1>
        <button
          onClick={() => { setEditingCase(null); resetForm(); setShowForm(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={20} />
          New Case
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Cases</p>
              <p className="text-2xl font-bold text-blue-600">{openCount}</p>
            </div>
            <AlertTriangle className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Under Investigation</p>
              <p className="text-2xl font-bold text-yellow-600">{investigationCount}</p>
            </div>
            <Search className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved</p>
              <p className="text-2xl font-bold text-green-600">{resolvedCount}</p>
            </div>
            <Check className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Appealed</p>
              <p className="text-2xl font-bold text-red-600">{appealedCount}</p>
            </div>
            <FileText className="text-red-600" size={24} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Status</option>
          {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Case #</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Employee</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Offense</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Sanction</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredCases.map(caseItem => (
              <tr key={caseItem.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{caseItem.caseNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{getEmployeeName(caseItem.employeeId)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{caseItem.offenseCategory}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{caseItem.sanctionType || '-'}</td>
                <td className="px-4 py-3">
                  <select
                    value={caseItem.status}
                    onChange={(e) => handleStatusChange(caseItem.id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${statusColors[caseItem.status]}`}
                  >
                    {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{caseItem.reportedDate || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => setSelectedCase(caseItem)} className="p-1 text-gray-400 hover:text-blue-600" title="View"><FileText size={16} /></button>
                    <button onClick={() => handleEdit(caseItem)} className="p-1 text-gray-400 hover:text-yellow-600" title="Edit"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(caseItem.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredCases.length === 0 && (
          <div className="text-center py-12 text-gray-500">No discipline cases found.</div>
        )}
      </div>

      {selectedCase && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Case Details: {selectedCase.caseNumber}</h2>
              <button onClick={() => setSelectedCase(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium">{getEmployeeName(selectedCase.employeeId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[selectedCase.status]}`}>{selectedCase.status}</span>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Offense Category</p>
                <p className="font-medium">{selectedCase.offenseCategory}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Description</p>
                <p className="text-gray-700">{selectedCase.offenseDescription}</p>
              </div>
              {selectedCase.sanctionType && (
                <div>
                  <p className="text-sm text-gray-500">Sanction</p>
                  <p className="font-medium">{selectedCase.sanctionType}</p>
                  {selectedCase.sanctionDetails && <p className="text-gray-700 mt-1">{selectedCase.sanctionDetails}</p>}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Reported By</p>
                  <p>{selectedCase.reportedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reported Date</p>
                  <p>{selectedCase.reportedDate}</p>
                </div>
              </div>
              {selectedCase.investigationNotes && (
                <div>
                  <p className="text-sm text-gray-500">Investigation Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedCase.investigationNotes}</p>
                </div>
              )}
              {selectedCase.hearingDate && (
                <div>
                  <p className="text-sm text-gray-500">Hearing Date</p>
                  <p>{selectedCase.hearingDate}</p>
                </div>
              )}
              {selectedCase.decision && (
                <div>
                  <p className="text-sm text-gray-500">Decision</p>
                  <p className="text-gray-700">{selectedCase.decision}</p>
                  {selectedCase.decisionDate && <p className="text-sm text-gray-400 mt-1">Date: {selectedCase.decisionDate}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingCase ? 'Edit Case' : 'New Discipline Case'}</h2>
              <button onClick={() => { setShowForm(false); setEditingCase(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={formData.employeeId} onChange={(e) => setFormData(f => ({ ...f, employeeId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.surname}, {emp.firstName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Offense Category *</label>
                  <select value={formData.offenseCategory} onChange={(e) => setFormData(f => ({ ...f, offenseCategory: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                    <option value="">Select</option>
                    {OFFENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reported Date</label>
                  <input type="date" value={formData.reportedDate} onChange={(e) => setFormData(f => ({ ...f, reportedDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <textarea value={formData.offenseDescription} onChange={(e) => setFormData(f => ({ ...f, offenseDescription: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sanction Type</label>
                  <select value={formData.sanctionType} onChange={(e) => setFormData(f => ({ ...f, sanctionType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">None</option>
                    {SANCTION_TYPES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={formData.status} onChange={(e) => setFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {CASE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              {formData.sanctionType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sanction Details</label>
                  <textarea value={formData.sanctionDetails} onChange={(e) => setFormData(f => ({ ...f, sanctionDetails: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investigation Notes</label>
                <textarea value={formData.investigationNotes} onChange={(e) => setFormData(f => ({ ...f, investigationNotes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hearing Date</label>
                  <input type="date" value={formData.hearingDate} onChange={(e) => setFormData(f => ({ ...f, hearingDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Decision Date</label>
                  <input type="date" value={formData.decisionDate} onChange={(e) => setFormData(f => ({ ...f, decisionDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              {formData.decisionDate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Decision</label>
                  <textarea value={formData.decision} onChange={(e) => setFormData(f => ({ ...f, decision: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
                </div>
              )}
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingCase(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingCase ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
