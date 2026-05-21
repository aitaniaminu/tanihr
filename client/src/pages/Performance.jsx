import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Star, X, Trash2, Edit, User, Calendar, MessageSquare, Target, CheckCircle, AlertCircle } from 'lucide-react';

const RATING_OPTIONS = [
  { value: 1, label: 'Unsatisfactory', color: 'text-red-600' },
  { value: 2, label: 'Needs Improvement', color: 'text-orange-600' },
  { value: 3, label: 'Meets Expectations', color: 'text-yellow-600' },
  { value: 4, label: 'Exceeds Expectations', color: 'text-blue-600' },
  { value: 5, label: 'Outstanding', color: 'text-green-600' },
];

const CYCLE_STATUSES = ['Draft', 'Active', 'In Review', 'Completed'];
const APPRAISAL_STATUSES = ['Not Started', 'In Progress', 'Self Review', 'Manager Review', 'Completed'];
const FEEDBACK_CATEGORIES = ['Strengths', 'Areas for Improvement', 'Communication', 'Teamwork', 'Leadership', 'Technical Skills', 'General'];

const StarRating = ({ value, onChange, readonly = false }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(n => (
      <button
        key={n}
        type="button"
        disabled={readonly}
        onClick={() => onChange && onChange(n)}
        className={`${readonly ? 'cursor-default' : 'cursor-pointer'} ${n <= value ? 'text-yellow-400' : 'text-gray-300'}`}
      >
        <Star size={20} fill={n <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

export default function Performance() {
  const [activeTab, setActiveTab] = useState('cycles');
  const [cycles, setCycles] = useState([]);
  const [appraisals, setAppraisals] = useState([]);
  const [goals, setGoals] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCycle, setSelectedCycle] = useState(null);
  const [selectedAppraisal, setSelectedAppraisal] = useState(null);
  const [showCycleForm, setShowCycleForm] = useState(false);
  const [showAppraisalForm, setShowAppraisalForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [editingCycle, setEditingCycle] = useState(null);

  const [cycleFormData, setCycleFormData] = useState({
    name: '',
    year: new Date().getFullYear(),
    period: 'Annual',
    status: 'Draft',
    startDate: '',
    endDate: '',
  });

  const [appraisalFormData, setAppraisalFormData] = useState({
    cycleId: '',
    employeeId: '',
    reviewerId: '',
    overallRating: 0,
    status: 'Not Started',
    comments: '',
  });

  const [feedbackFormData, setFeedbackFormData] = useState({
    appraisalId: '',
    toEmployeeId: '',
    feedback: '',
    category: 'General',
  });

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [cyclesData, appraisalsData, goalsData, feedbackData, emps] = await Promise.all([
        db.appraisalCycles.toArray(),
        db.appraisals.toArray(),
        db.appraisalGoals.toArray(),
        db.appraisalFeedback.toArray(),
        db.employees.toArray(),
      ]);
      setCycles(cyclesData);
      setAppraisals(appraisalsData);
      setGoals(goalsData);
      setFeedback(feedbackData);
      setEmployees(emps);
    } catch (err) {
      console.error('Error loading performance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCycleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCycle) {
        await db.appraisalCycles.update(editingCycle.id, cycleFormData);
      } else {
        await db.appraisalCycles.add({
          ...cycleFormData,
          createdAt: new Date().toISOString(),
        });
      }
      setShowCycleForm(false);
      setEditingCycle(null);
      setCycleFormData({ name: '', year: new Date().getFullYear(), period: 'Annual', status: 'Draft', startDate: '', endDate: '' });
      loadData();
    } catch (err) {
      console.error('Error saving cycle:', err);
    }
  };

  const handleAppraisalSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.appraisals.add({
        ...appraisalFormData,
        submittedDate: new Date().toISOString(),
        createdBy: user?.username || 'Unknown',
      });
      setShowAppraisalForm(false);
      setAppraisalFormData({ cycleId: '', employeeId: '', reviewerId: '', overallRating: 0, status: 'Not Started', comments: '' });
      loadData();
    } catch (err) {
      console.error('Error saving appraisal:', err);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.appraisalFeedback.add({
        ...feedbackFormData,
        fromEmployeeId: user?.employeeId || null,
        createdAt: new Date().toISOString(),
      });
      setShowFeedbackForm(false);
      setFeedbackFormData({ appraisalId: '', toEmployeeId: '', feedback: '', category: 'General' });
      loadData();
    } catch (err) {
      console.error('Error saving feedback:', err);
    }
  };

  const handleDeleteCycle = async (id) => {
    if (!confirm('Delete this appraisal cycle?')) return;
    await db.appraisalCycles.delete(id);
    loadData();
  };

  const handleEditCycle = (cycle) => {
    setEditingCycle(cycle);
    setCycleFormData(cycle);
    setShowCycleForm(true);
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.surname}, ${emp.firstName}` : 'Unknown';
  };

  const getCycleName = (cycleId) => {
    const cycle = cycles.find(c => c.id === cycleId);
    return cycle ? cycle.name : 'Unknown';
  };

  const getRatingLabel = (value) => {
    const rating = RATING_OPTIONS.find(r => r.value === value);
    return rating ? rating.label : 'Not Rated';
  };

  const getRatingColor = (value) => {
    const rating = RATING_OPTIONS.find(r => r.value === value);
    return rating ? rating.color : 'text-gray-400';
  };

  const filteredCycles = cycles.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.period?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAppraisals = appraisals.filter(a =>
    getEmployeeName(a.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCycleName(a.cycleId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCycles = cycles.filter(c => c.status === 'Active').length;
  const completedAppraisals = appraisals.filter(a => a.status === 'Completed').length;
  const avgRating = appraisals.filter(a => a.overallRating > 0).reduce((sum, a) => sum + a.overallRating, 0) / (appraisals.filter(a => a.overallRating > 0).length || 1);

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="text-gray-600 text-lg">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Performance Appraisals</h1>
        <div className="flex gap-2">
          {activeTab === 'cycles' && (
            <button onClick={() => { setEditingCycle(null); setCycleFormData({ name: '', year: new Date().getFullYear(), period: 'Annual', status: 'Draft', startDate: '', endDate: '' }); setShowCycleForm(true); }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2">
              <Plus size={20} /> New Cycle
            </button>
          )}
          {activeTab === 'appraisals' && (
            <button onClick={() => setShowAppraisalForm(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2">
              <Plus size={20} /> New Appraisal
            </button>
          )}
          {activeTab === 'feedback' && (
            <button onClick={() => setShowFeedbackForm(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2">
              <Plus size={20} /> Give Feedback
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Active Cycles</p><p className="text-2xl font-bold text-blue-600">{activeCycles}</p></div>
            <Calendar className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600">{completedAppraisals}</p></div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Avg Rating</p><p className="text-2xl font-bold text-yellow-600">{avgRating.toFixed(1)}</p></div>
            <Star className="text-yellow-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Feedback Given</p><p className="text-2xl font-bold text-purple-600">{feedback.length}</p></div>
            <MessageSquare className="text-purple-600" size={24} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        {[
          { key: 'cycles', label: 'Cycles', icon: Calendar, count: cycles.length },
          { key: 'appraisals', label: 'Appraisals', icon: Star, count: appraisals.length },
          { key: 'feedback', label: '360° Feedback', icon: MessageSquare, count: feedback.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }} className={`pb-3 px-4 font-medium transition border-b-2 ${activeTab === tab.key ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="inline mr-2" size={18} /> {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeTab === 'cycles' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search cycles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCycles.map(cycle => (
              <div key={cycle.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{cycle.name}</h3>
                    <p className="text-sm text-gray-500">{cycle.period} &middot; {cycle.year}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${cycle.status === 'Active' ? 'bg-green-100 text-green-700' : cycle.status === 'Completed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>{cycle.status}</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  {cycle.startDate && <span><Calendar size={14} className="inline mr-1" /> {cycle.startDate}</span>}
                  {cycle.endDate && <span>→ {cycle.endDate}</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{appraisals.filter(a => a.cycleId === cycle.id).length} appraisals</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditCycle(cycle)} className="p-1 text-gray-400 hover:text-yellow-600"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteCycle(cycle.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {filteredCycles.length === 0 && <div className="text-center py-12 text-gray-500">No appraisal cycles found.</div>}
        </>
      )}

      {activeTab === 'appraisals' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search appraisals..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
            <select value={selectedCycle || ''} onChange={(e) => setSelectedCycle(e.target.value || null)} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All Cycles</option>
              {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Employee</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Cycle</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Reviewer</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Rating</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAppraisals.filter(a => !selectedCycle || a.cycleId === selectedCycle).map(appraisal => (
                  <tr key={appraisal.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{getEmployeeName(appraisal.employeeId)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{getCycleName(appraisal.cycleId)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{getEmployeeName(appraisal.reviewerId)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${getRatingColor(appraisal.overallRating)}`}>
                        {appraisal.overallRating > 0 ? `${appraisal.overallRating}/5 - ${getRatingLabel(appraisal.overallRating)}` : 'Not Rated'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${appraisal.status === 'Completed' ? 'bg-green-100 text-green-700' : appraisal.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{appraisal.status}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{appraisal.submittedDate?.split('T')[0]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAppraisals.length === 0 && <div className="text-center py-12 text-gray-500">No appraisals found.</div>}
          </div>
        </>
      )}

      {activeTab === 'feedback' && (
        <div className="space-y-4">
          {feedback.map(fb => (
            <div key={fb.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  {getEmployeeName(fb.fromEmployeeId).charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{getEmployeeName(fb.fromEmployeeId)}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-sm">{getEmployeeName(fb.toEmployeeId)}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600`}>{fb.category}</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{fb.feedback}</p>
                  <p className="text-xs text-gray-400 mt-2">{fb.createdAt?.split('T')[0]}</p>
                </div>
              </div>
            </div>
          ))}
          {feedback.length === 0 && <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-gray-100">No feedback given yet.</div>}
        </div>
      )}

      {showCycleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingCycle ? 'Edit Cycle' : 'New Appraisal Cycle'}</h2>
              <button onClick={() => { setShowCycleForm(false); setEditingCycle(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCycleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle Name *</label>
                <input type="text" value={cycleFormData.name} onChange={(e) => setCycleFormData(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required placeholder="e.g., 2026 Annual Review" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input type="number" value={cycleFormData.year} onChange={(e) => setCycleFormData(f => ({ ...f, year: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select value={cycleFormData.period} onChange={(e) => setCycleFormData(f => ({ ...f, period: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="Annual">Annual</option>
                    <option value="Mid-Year">Mid-Year</option>
                    <option value="Quarterly">Quarterly</option>
                    <option value="Probation">Probation</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={cycleFormData.startDate} onChange={(e) => setCycleFormData(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={cycleFormData.endDate} onChange={(e) => setCycleFormData(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={cycleFormData.status} onChange={(e) => setCycleFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {CYCLE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowCycleForm(false); setEditingCycle(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingCycle ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAppraisalForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">New Appraisal</h2>
              <button onClick={() => setShowAppraisalForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleAppraisalSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cycle *</label>
                <select value={appraisalFormData.cycleId} onChange={(e) => setAppraisalFormData(f => ({ ...f, cycleId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Cycle</option>
                  {cycles.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={appraisalFormData.employeeId} onChange={(e) => setAppraisalFormData(f => ({ ...f, employeeId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Employee</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.surname}, {emp.firstName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reviewer *</label>
                <select value={appraisalFormData.reviewerId} onChange={(e) => setAppraisalFormData(f => ({ ...f, reviewerId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Reviewer</option>
                  {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.surname}, {emp.firstName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Overall Rating</label>
                <StarRating value={appraisalFormData.overallRating} onChange={(n) => setAppraisalFormData(f => ({ ...f, overallRating: n }))} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={appraisalFormData.status} onChange={(e) => setAppraisalFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {APPRAISAL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea value={appraisalFormData.comments} onChange={(e) => setAppraisalFormData(f => ({ ...f, comments: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowAppraisalForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFeedbackForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Give 360° Feedback</h2>
              <button onClick={() => setShowFeedbackForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleFeedbackSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">For Employee *</label>
                <select value={feedbackFormData.toEmployeeId} onChange={(e) => setFeedbackFormData(f => ({ ...f, toEmployeeId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Employee</option>
                  {employees.filter(emp => emp.id !== user?.employeeId).map(emp => <option key={emp.id} value={emp.id}>{emp.surname}, {emp.firstName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select value={feedbackFormData.category} onChange={(e) => setFeedbackFormData(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {FEEDBACK_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback *</label>
                <textarea value={feedbackFormData.feedback} onChange={(e) => setFeedbackFormData(f => ({ ...f, feedback: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={4} required placeholder="Provide constructive feedback..." />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowFeedbackForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Submit Feedback</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
