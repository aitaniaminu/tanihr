import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, LogOut, X, Check, Trash2, Edit, Calendar, AlertCircle } from 'lucide-react';

const OFFBOARDING_STAGES = ['Notice Given', 'Exit Interview', 'Asset Return', 'Clearance', 'Final Settlement', 'Completed'];
const RESIGNATION_REASONS = ['Career Growth', 'Better Compensation', 'Relocation', 'Personal Reasons', 'Retirement', 'Health', 'Dissatisfaction', 'End of Contract', 'Other'];

const defaultChecklistItems = [
  'Submit resignation letter',
  'Complete exit interview',
  'Return company laptop',
  'Return ID badge and access cards',
  'Return company phone',
  'Clear outstanding advances',
  'Hand over pending tasks',
  'Transfer knowledge to successor',
  'Clear desk and personal belongings',
  'Return company documents',
  'Deactivate system access',
  'Final salary processing',
  'Pension/Gratuity processing',
  'Issue experience letter',
];

export default function Offboarding() {
  const [offboardings, setOffboardings] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingOffboarding, setEditingOffboarding] = useState(null);
  const [selectedOffboarding, setSelectedOffboarding] = useState(null);
  const [stageFilter, setStageFilter] = useState('all');

  const [formData, setFormData] = useState({
    employeeId: '',
    type: 'Resignation',
    reason: '',
    otherReason: '',
    noticeDate: '',
    lastWorkingDay: '',
    exitInterviewDate: '',
    exitInterviewNotes: '',
    stage: 'Notice Given',
    checklist: defaultChecklistItems.map(item => ({ item, completed: false })),
    remarks: '',
  });

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [offData, emps] = await Promise.all([
        db.offboardings.toArray(),
        db.employees.toArray(),
      ]);
      setOffboardings(offData);
      setEmployees(emps);
    } catch (err) {
      console.error('Error loading offboarding data:', err);
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
      if (editingOffboarding) {
        await db.offboardings.update(editingOffboarding.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db.offboardings.add({
          ...formData,
          offboardingNumber: `OFF-${new Date().getFullYear()}-${String(offboardings.length + 1).padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
          createdBy: user?.username || 'Unknown',
        });
      }
      setShowForm(false);
      setEditingOffboarding(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Error saving offboarding:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      type: 'Resignation',
      reason: '',
      otherReason: '',
      noticeDate: '',
      lastWorkingDay: '',
      exitInterviewDate: '',
      exitInterviewNotes: '',
      stage: 'Notice Given',
      checklist: defaultChecklistItems.map(item => ({ item, completed: false })),
      remarks: '',
    });
  };

  const handleEdit = (off) => {
    setEditingOffboarding(off);
    setFormData(off);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this offboarding record?')) return;
    await db.offboardings.delete(id);
    loadData();
  };

  const handleToggleChecklist = (offboardingId, index) => {
    const off = offboardings.find(o => o.id === offboardingId);
    if (off && off.checklist) {
      const updated = [...off.checklist];
      updated[index] = { ...updated[index], completed: !updated[index].completed };
      db.offboardings.update(offboardingId, { checklist: updated });
      loadData();
    }
  };

  const handleStageChange = async (id, newStage) => {
    await db.offboardings.update(id, {
      stage: newStage,
      updatedAt: new Date().toISOString(),
    });
    loadData();
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.surname}, ${emp.firstName}` : 'Unknown';
  };

  const getChecklistProgress = (checklist) => {
    if (!checklist) return { completed: 0, total: 0 };
    const completed = checklist.filter(c => c.completed).length;
    return { completed, total: checklist.length };
  };

  const filteredOffboardings = offboardings
    .filter(o => stageFilter === 'all' || o.stage === stageFilter)
    .filter(o => {
      const empName = getEmployeeName(o.employeeId).toLowerCase();
      return empName.includes(searchTerm.toLowerCase()) ||
        o.offboardingNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.type?.toLowerCase().includes(searchTerm.toLowerCase());
    });

  const inProgressCount = offboardings.filter(o => o.stage !== 'Completed').length;
  const completedCount = offboardings.filter(o => o.stage === 'Completed').length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="text-gray-600 text-lg">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Offboarding</h1>
        <button
          onClick={() => { setEditingOffboarding(null); resetForm(); setShowForm(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={20} />
          Start Offboarding
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Offboardings</p>
              <p className="text-2xl font-bold text-gray-600">{offboardings.length}</p>
            </div>
            <LogOut className="text-gray-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Progress</p>
              <p className="text-2xl font-bold text-yellow-600">{inProgressCount}</p>
            </div>
            <AlertCircle className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <Check className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search offboardings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
          />
        </div>
        <select
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Stages</option>
          {OFFBOARDING_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {filteredOffboardings.map(off => {
          const progress = getChecklistProgress(off.checklist);
          const progressPercent = progress.total > 0 ? Math.round((progress.completed / progress.total) * 100) : 0;
          return (
            <div key={off.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold">
                    {getEmployeeName(off.employeeId).charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{getEmployeeName(off.employeeId)}</h3>
                    <p className="text-sm text-gray-500">{off.offboardingNumber} &middot; {off.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <select
                    value={off.stage}
                    onChange={(e) => handleStageChange(off.id, e.target.value)}
                    className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${off.stage === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}
                  >
                    {OFFBOARDING_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => setSelectedOffboarding(off)} className="p-1 text-gray-400 hover:text-blue-600" title="View"><Search size={16} /></button>
                  <button onClick={() => handleEdit(off)} className="p-1 text-gray-400 hover:text-yellow-600" title="Edit"><Edit size={16} /></button>
                  <button onClick={() => handleDelete(off.id)} className="p-1 text-gray-400 hover:text-red-600" title="Delete"><Trash2 size={16} /></button>
                </div>
              </div>
              <div className="mt-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-500">Checklist Progress</span>
                  <span className="font-medium">{progress.completed}/{progress.total} ({progressPercent}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full transition-all" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-4 text-sm text-gray-500">
                {off.noticeDate && <span className="flex items-center gap-1"><Calendar size={14} /> Notice: {off.noticeDate}</span>}
                {off.lastWorkingDay && <span className="flex items-center gap-1"><Calendar size={14} /> Last Day: {off.lastWorkingDay}</span>}
              </div>
            </div>
          );
        })}
        {filteredOffboardings.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-100">No offboarding records found.</div>
        )}
      </div>

      {selectedOffboarding && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Offboarding Details: {selectedOffboarding.offboardingNumber}</h2>
              <button onClick={() => setSelectedOffboarding(null)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Employee</p>
                  <p className="font-medium">{getEmployeeName(selectedOffboarding.employeeId)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Type</p>
                  <p className="font-medium">{selectedOffboarding.type}</p>
                </div>
              </div>
              {selectedOffboarding.reason && (
                <div>
                  <p className="text-sm text-gray-500">Reason</p>
                  <p>{selectedOffboarding.reason === 'Other' ? selectedOffboarding.otherReason : selectedOffboarding.reason}</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Notice Date</p>
                  <p>{selectedOffboarding.noticeDate || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Last Working Day</p>
                  <p>{selectedOffboarding.lastWorkingDay || '-'}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-gray-500 mb-2">Checklist</p>
                <div className="space-y-2">
                  {selectedOffboarding.checklist?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 rounded hover:bg-gray-50">
                      <button
                        onClick={() => handleToggleChecklist(selectedOffboarding.id, idx)}
                        className={`w-5 h-5 rounded border flex items-center justify-center ${item.completed ? 'bg-green-600 border-green-600 text-white' : 'border-gray-300'}`}
                      >
                        {item.completed && <Check size={12} />}
                      </button>
                      <span className={item.completed ? 'line-through text-gray-400' : 'text-gray-700'}>{item.item}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedOffboarding.exitInterviewNotes && (
                <div>
                  <p className="text-sm text-gray-500">Exit Interview Notes</p>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedOffboarding.exitInterviewNotes}</p>
                </div>
              )}
              {selectedOffboarding.remarks && (
                <div>
                  <p className="text-sm text-gray-500">Remarks</p>
                  <p className="text-gray-700">{selectedOffboarding.remarks}</p>
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
              <h2 className="text-xl font-semibold">{editingOffboarding ? 'Edit Offboarding' : 'Start Offboarding'}</h2>
              <button onClick={() => { setShowForm(false); setEditingOffboarding(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={formData.employeeId} onChange={(e) => setFormData(f => ({ ...f, employeeId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Employee</option>
                  {employees.filter(e => e.status === 'Active').map(emp => <option key={emp.id} value={emp.id}>{emp.surname}, {emp.firstName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select value={formData.type} onChange={(e) => setFormData(f => ({ ...f, type: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                    <option value="Resignation">Resignation</option>
                    <option value="Termination">Termination</option>
                    <option value="Retirement">Retirement</option>
                    <option value="End of Contract">End of Contract</option>
                    <option value="Mutual Separation">Mutual Separation</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                  <select value={formData.reason} onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="">Select</option>
                    {RESIGNATION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
              {formData.reason === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Specify Reason</label>
                  <input type="text" value={formData.otherReason} onChange={(e) => setFormData(f => ({ ...f, otherReason: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notice Date</label>
                  <input type="date" value={formData.noticeDate} onChange={(e) => setFormData(f => ({ ...f, noticeDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Working Day</label>
                  <input type="date" value={formData.lastWorkingDay} onChange={(e) => setFormData(f => ({ ...f, lastWorkingDay: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Stage</label>
                <select value={formData.stage} onChange={(e) => setFormData(f => ({ ...f, stage: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {OFFBOARDING_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exit Interview Date</label>
                <input type="date" value={formData.exitInterviewDate} onChange={(e) => setFormData(f => ({ ...f, exitInterviewDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exit Interview Notes</label>
                <textarea value={formData.exitInterviewNotes} onChange={(e) => setFormData(f => ({ ...f, exitInterviewNotes: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={formData.remarks} onChange={(e) => setFormData(f => ({ ...f, remarks: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingOffboarding(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingOffboarding ? 'Update' : 'Start'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
