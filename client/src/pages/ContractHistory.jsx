import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { Plus, Search, FileText, X, Check, Clock, Trash2, Edit, TrendingUp, DollarSign, Briefcase, Filter, Download } from 'lucide-react';

const CONTRACT_TYPES = ['Promotion', 'Salary Increase', 'Transfer', 'Demotion', 'Contract Renewal', 'Termination', 'Appointment'];
const CONTRACT_STATUS = ['Active', 'Expired', 'Pending', 'Cancelled'];

const ContractCard = ({ contract, onEdit }) => {
  const typeColors = {
    Promotion: 'bg-purple-100 text-purple-700',
    'Salary Increase': 'bg-green-100 text-green-700',
    Transfer: 'bg-blue-100 text-blue-700',
    Demotion: 'bg-red-100 text-red-700',
    'Contract Renewal': 'bg-cyan-100 text-cyan-700',
    Termination: 'bg-gray-100 text-gray-700',
    Appointment: 'bg-yellow-100 text-yellow-700',
  };

  const statusColors = {
    Active: 'bg-green-100 text-green-700',
    Expired: 'bg-gray-100 text-gray-700',
    Pending: 'bg-yellow-100 text-yellow-700',
    Cancelled: 'bg-red-100 text-red-700',
  };

  const salaryChange = contract.new_salary && contract.old_salary 
    ? ((contract.new_salary - contract.old_salary) / contract.old_salary * 100).toFixed(1)
    : null;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
            contract.contract_type === 'Promotion' ? 'bg-purple-100 text-purple-700' :
            contract.contract_type === 'Salary Increase' ? 'bg-green-100 text-green-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {contract.contract_type === 'Promotion' ? <TrendingUp size={20} /> :
             contract.contract_type === 'Salary Increase' ? <DollarSign size={20} /> :
             <FileText size={20} />}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{contract.employee_name}</h3>
            <p className="text-sm text-gray-500">{contract.contract_type}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[contract.contract_type]}`}>
            {contract.contract_type}
          </span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[contract.status]}`}>
            {contract.status}
          </span>
        </div>
      </div>
      
      <div className="mt-3 space-y-2 text-sm">
        {contract.old_department && contract.new_department && contract.old_department !== contract.new_department && (
          <div className="flex items-center gap-2 text-gray-600">
            <Briefcase size={14} />
            <span>{contract.old_department}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium">{contract.new_department}</span>
          </div>
        )}
        {contract.old_rank && contract.new_rank && contract.old_rank !== contract.new_rank && (
          <div className="flex items-center gap-2 text-gray-600">
            <TrendingUp size={14} />
            <span>{contract.old_rank}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium">{contract.new_rank}</span>
          </div>
        )}
        {salaryChange && (
          <div className="flex items-center gap-2 text-gray-600">
            <DollarSign size={14} />
            <span>₦{contract.old_salary?.toLocaleString()}</span>
            <span className="text-gray-400">→</span>
            <span className="font-medium text-green-600">₦{contract.new_salary?.toLocaleString()}</span>
            <span className="text-green-600 text-xs">(+{salaryChange}%)</span>
          </div>
        )}
      </div>

      <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          Effective: {contract.effective_date}
        </span>
        {contract.end_date && <span>to {contract.end_date}</span>}
        {contract.approval_letter_no && <span>• Ref: {contract.approval_letter_no}</span>}
      </div>

      {contract.remarks && (
        <p className="mt-2 text-sm text-gray-600">{contract.remarks}</p>
      )}

      <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
        <button onClick={() => onEdit(contract)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg">
          <Edit size={14} />
        </button>
      </div>
    </div>
  );
};

const ContractForm = ({ formData, setFormData, employees, onSubmit, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
      <div className="p-6 border-b border-gray-100 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {formData.id ? 'Edit Contract' : 'New Contract'}
        </h2>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X size={20} />
        </button>
      </div>
      <form onSubmit={onSubmit} className="p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
          <select
            value={formData.employee_id}
            onChange={e => setFormData({...formData, employee_id: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            required
          >
            <option value="">Select Employee</option>
            {employees.map(e => (
              <option key={e.id} value={e.id}>{e.surname}, {e.first_name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contract Type</label>
            <select
              value={formData.contract_type}
              onChange={e => setFormData({...formData, contract_type: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            >
              <option value="">Select Type</option>
              {CONTRACT_TYPES.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={formData.status}
              onChange={e => setFormData({...formData, status: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            >
              {CONTRACT_STATUS.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Department</label>
            <input
              type="text"
              value={formData.old_department}
              onChange={e => setFormData({...formData, old_department: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Previous department"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Department</label>
            <input
              type="text"
              value={formData.new_department}
              onChange={e => setFormData({...formData, new_department: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="New department"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Rank</label>
            <input
              type="text"
              value={formData.old_rank}
              onChange={e => setFormData({...formData, old_rank: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Previous rank"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Rank</label>
            <input
              type="text"
              value={formData.new_rank}
              onChange={e => setFormData({...formData, new_rank: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="New rank"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Old Salary (₦)</label>
            <input
              type="number"
              value={formData.old_salary}
              onChange={e => setFormData({...formData, old_salary: parseFloat(e.target.value) || null})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Previous salary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Salary (₦)</label>
            <input
              type="number"
              value={formData.new_salary}
              onChange={e => setFormData({...formData, new_salary: parseFloat(e.target.value) || null})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="New salary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Effective Date</label>
            <input
              type="date"
              value={formData.effective_date}
              onChange={e => setFormData({...formData, effective_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={formData.end_date}
              onChange={e => setFormData({...formData, end_date: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Approval Letter No.</label>
          <input
            type="text"
            value={formData.approval_letter_no}
            onChange={e => setFormData({...formData, approval_letter_no: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., HR/APP/2024/001"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
          <textarea
            value={formData.remarks}
            onChange={e => setFormData({...formData, remarks: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            rows={3}
            placeholder="Additional notes..."
          />
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
            {formData.id ? 'Update' : 'Create'} Contract
          </button>
        </div>
      </form>
    </div>
  </div>
);

const StatsCard = ({ title, value, subtext, icon: Icon, color }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtext && <p className="text-xs text-gray-500">{subtext}</p>}
      </div>
    </div>
  </div>
);

export default function ContractHistory() {
  const [employees, setEmployees] = useState([]);
  const [contracts, setContracts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [activeType, setActiveType] = useState('all');
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    employee_id: '',
    contract_type: 'Promotion',
    old_department: '',
    new_department: '',
    old_rank: '',
    new_rank: '',
    old_salary: '',
    new_salary: '',
    effective_date: '',
    end_date: '',
    status: 'Active',
    approval_letter_no: '',
    remarks: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, contractRes] = await Promise.all([
        supabase.from('employees').select('id, surname, first_name, department_name, rank_name').order('surname'),
        supabase.from('employee_contracts').select('*').order('effective_date', { ascending: false }),
      ]);

      const emps = empRes.data || [];
      setEmployees(emps.map(e => ({
        ...e,
        name: `${e.surname}, ${e.first_name}`,
      })));

      const empMap = Object.fromEntries(emps.map(e => [e.id, `${e.surname}, ${e.first_name}`]));
      setContracts((contractRes.data || []).map(c => ({
        ...c,
        employee_name: empMap[c.employee_id] || 'Unknown',
      })));
    } catch (err) {
      console.error('Error loading contracts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        old_salary: formData.old_salary ? parseFloat(formData.old_salary) : null,
        new_salary: formData.new_salary ? parseFloat(formData.new_salary) : null,
      };

      if (formData.id) {
        await supabase.from('employee_contracts').update(payload).eq('id', formData.id);
      } else {
        await supabase.from('employee_contracts').insert([payload]);
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({
        employee_id: '',
        contract_type: 'Promotion',
        old_department: '',
        new_department: '',
        old_rank: '',
        new_rank: '',
        old_salary: '',
        new_salary: '',
        effective_date: '',
        end_date: '',
        status: 'Active',
        approval_letter_no: '',
        remarks: '',
      });
      loadData();
    } catch (err) {
      console.error('Error saving contract:', err);
    }
  };

  const handleEdit = (contract) => {
    setEditingItem(contract);
    setFormData({
      ...contract,
      old_salary: contract.old_salary || '',
      new_salary: contract.new_salary || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contract?')) return;
    try {
      await supabase.from('employee_contracts').delete().eq('id', id);
      loadData();
    } catch (err) {
      console.error('Error deleting contract:', err);
    }
  };

  const filteredContracts = contracts.filter(c => {
    const matchesSearch = !searchTerm || 
      c.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contract_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.approval_letter_no?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = activeType === 'all' || c.contract_type === activeType;
    return matchesSearch && matchesType;
  });

  const stats = {
    total: contracts.length,
    promotions: contracts.filter(c => c.contract_type === 'Promotion').length,
    salary Increases: contracts.filter(c => c.contract_type === 'Salary Increase').length,
    active: contracts.filter(c => c.status === 'Active').length,
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contract History</h1>
          <p className="text-gray-500 mt-1">Track promotions, salary changes, and position changes</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus size={20} />
          New Contract
        </button>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatsCard title="Total Changes" value={stats.total} icon={FileText} color="bg-gray-100 text-gray-700" />
        <StatsCard title="Promotions" value={stats.promotions} icon={TrendingUp} color="bg-purple-100 text-purple-700" />
        <StatsCard title="Salary Increases" value={stats.salary Increases} icon={DollarSign} color="bg-green-100 text-green-700" />
        <StatsCard title="Active" value={stats.active} icon={Clock} color="bg-blue-100 text-blue-700" />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          />
        </div>
        <select
          value={activeType}
          onChange={e => setActiveType(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="all">All Types</option>
          {CONTRACT_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
          <Download size={20} />
          Export
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
          <p className="text-gray-500 mt-4">Loading contracts...</p>
        </div>
      ) : filteredContracts.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <FileText size={48} className="mx-auto text-gray-300" />
          <p className="text-gray-500 mt-4">No contracts found</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 text-green-600 hover:underline"
          >
            Create first contract
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredContracts.map(contract => (
            <ContractCard key={contract.id} contract={contract} onEdit={handleEdit} />
          ))}
        </div>
      )}

      {showForm && (
        <ContractForm
          formData={formData}
          setFormData={setFormData}
          employees={employees}
          onSubmit={handleSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
            setFormData({
              employee_id: '',
              contract_type: 'Promotion',
              old_department: '',
              new_department: '',
              old_rank: '',
              new_rank: '',
              old_salary: '',
              new_salary: '',
              effective_date: '',
              end_date: '',
              status: 'Active',
              approval_letter_no: '',
              remarks: '',
            });
          }}
        />
      )}
    </div>
  );
}