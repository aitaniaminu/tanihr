import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, ArrowUpRight, X, Trash2, Edit, User, Briefcase } from 'lucide-react';

export default function Promotions() {
  const [promotions, setPromotions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    previousRank: '',
    newRank: '',
    previousCadre: '',
    newCadre: '',
    effectiveDate: '',
    promotionType: 'Regular',
    reason: '',
    isActing: false,
    actingEndDate: '',
    approvedBy: '',
    remarks: '',
  });

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [promos, emps] = await Promise.all([
        db.promotions.toArray(),
        db.employees.toArray(),
      ]);
      setPromotions(promos);
      setEmployees(emps);
    } catch (err) {
      console.error('Error loading promotions:', err);
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
      if (editingPromotion) {
        await db.promotions.update(editingPromotion.id, {
          ...formData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db.promotions.add({
          ...formData,
          promotionNumber: `PROM-${new Date().getFullYear()}-${String(promotions.length + 1).padStart(4, '0')}`,
          createdAt: new Date().toISOString(),
          createdBy: user?.username || 'Unknown',
        });
      }
      setShowForm(false);
      setEditingPromotion(null);
      resetForm();
      loadData();
    } catch (err) {
      console.error('Error saving promotion:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      employeeId: '',
      previousRank: '',
      newRank: '',
      previousCadre: '',
      newCadre: '',
      effectiveDate: '',
      promotionType: 'Regular',
      reason: '',
      isActing: false,
      actingEndDate: '',
      approvedBy: '',
      remarks: '',
    });
  };

  const handleEdit = (promo) => {
    setEditingPromotion(promo);
    setFormData(promo);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this promotion record?')) return;
    await db.promotions.delete(id);
    loadData();
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.surname}, ${emp.firstName}` : 'Unknown';
  };

  const filteredPromotions = promotions.filter(p => {
    const empName = getEmployeeName(p.employeeId).toLowerCase();
    return empName.includes(searchTerm.toLowerCase()) ||
      p.promotionNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.newRank?.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const actingCount = promotions.filter(p => p.isActing).length;
  const regularCount = promotions.filter(p => !p.isActing).length;

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="text-gray-600 text-lg">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Promotions</h1>
        <button
          onClick={() => { setEditingPromotion(null); resetForm(); setShowForm(true); }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={20} />
          Record Promotion
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Promotions</p>
              <p className="text-2xl font-bold text-green-600">{promotions.length}</p>
            </div>
            <ArrowUpRight className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Regular</p>
              <p className="text-2xl font-bold text-blue-600">{regularCount}</p>
            </div>
            <Briefcase className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Acting Capacity</p>
              <p className="text-2xl font-bold text-orange-600">{actingCount}</p>
            </div>
            <User className="text-orange-600" size={24} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search promotions..."
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
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">From</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">To</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Effective</th>
              <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredPromotions.map(promo => (
              <tr key={promo.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-mono text-gray-900">{promo.promotionNumber}</td>
                <td className="px-4 py-3 text-sm text-gray-900">{getEmployeeName(promo.employeeId)}</td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {promo.previousRank}
                  {promo.previousCadre && <span className="text-gray-400"> ({promo.previousCadre})</span>}
                </td>
                <td className="px-4 py-3 text-sm font-medium text-green-700">
                  {promo.newRank}
                  {promo.newCadre && <span className="text-gray-400"> ({promo.newCadre})</span>}
                </td>
                <td className="px-4 py-3">
                  {promo.isActing ? (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-700">
                      Acting {promo.actingEndDate ? `(until ${promo.actingEndDate})` : ''}
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Regular</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">{promo.effectiveDate}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => handleEdit(promo)} className="p-1 text-gray-400 hover:text-yellow-600"><Edit size={16} /></button>
                    <button onClick={() => handleDelete(promo.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredPromotions.length === 0 && (
          <div className="text-center py-12 text-gray-500">No promotion records found.</div>
        )}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingPromotion ? 'Edit Promotion' : 'Record Promotion'}</h2>
              <button onClick={() => { setShowForm(false); setEditingPromotion(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Rank</label>
                  <input type="text" value={formData.previousRank} onChange={(e) => setFormData(f => ({ ...f, previousRank: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Rank *</label>
                  <input type="text" value={formData.newRank} onChange={(e) => setFormData(f => ({ ...f, newRank: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Cadre</label>
                  <input type="text" value={formData.previousCadre} onChange={(e) => setFormData(f => ({ ...f, previousCadre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Cadre</label>
                  <input type="text" value={formData.newCadre} onChange={(e) => setFormData(f => ({ ...f, newCadre: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date *</label>
                  <input type="date" value={formData.effectiveDate} onChange={(e) => setFormData(f => ({ ...f, effectiveDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Promotion Type</label>
                  <select value={formData.promotionType} onChange={(e) => setFormData(f => ({ ...f, promotionType: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    <option value="Regular">Regular</option>
                    <option value="Merit">Merit</option>
                    <option value="Restructuring">Restructuring</option>
                    <option value="Acting to Substantive">Acting to Substantive</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is-acting"
                  checked={formData.isActing}
                  onChange={(e) => setFormData(f => ({ ...f, isActing: e.target.checked }))}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded"
                />
                <label htmlFor="is-acting" className="text-sm font-medium text-gray-700">Acting Capacity</label>
              </div>
              {formData.isActing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Acting End Date</label>
                  <input type="date" value={formData.actingEndDate} onChange={(e) => setFormData(f => ({ ...f, actingEndDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <textarea value={formData.reason} onChange={(e) => setFormData(f => ({ ...f, reason: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea value={formData.remarks} onChange={(e) => setFormData(f => ({ ...f, remarks: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={2} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowForm(false); setEditingPromotion(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingPromotion ? 'Update' : 'Record'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
