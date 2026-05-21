import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { Plus, Search, Award, X, Check, Trash2, Edit, Clock } from 'lucide-react';

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const CERT_STATUS = ['Pending', 'In Progress', 'Certified', 'Expired'];

const SkillCard = ({ skill, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-gray-900">{skill.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{skill.category}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        skill.level === 'Expert' ? 'bg-purple-100 text-purple-700' :
        skill.level === 'Advanced' ? 'bg-blue-100 text-blue-700' :
        skill.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-700' :
        'bg-gray-100 text-gray-700'
      }`}>
        {skill.level}
      </span>
    </div>
    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
      <span>{skill.employeeName}</span>
      {skill.dateObtained && <span>• Obtained: {skill.dateObtained}</span>}
      {skill.dateExpires && <span>• Expires: {skill.dateExpires}</span>}
    </div>
    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
      <button onClick={() => onEdit(skill)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg">
        <Edit size={14} />
      </button>
      <button onClick={() => onDelete(skill)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg">
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

const CertificationCard = ({ cert, onEdit, onDelete }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
    <div className="flex items-start justify-between">
      <div>
        <h3 className="font-semibold text-gray-900">{cert.name}</h3>
        <p className="text-sm text-gray-500 mt-1">{cert.provider}</p>
      </div>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
        cert.status === 'Certified' ? 'bg-green-100 text-green-700' :
        cert.status === 'Expired' ? 'bg-red-100 text-red-700' :
        cert.status === 'In Progress' ? 'bg-blue-100 text-blue-700' :
        'bg-yellow-100 text-yellow-700'
      }`}>
        {cert.status}
      </span>
    </div>
    <div className="mt-3 flex items-center gap-4 text-xs text-gray-500">
      <span>{cert.employeeName}</span>
      {cert.dateObtained && <span>• Issued: {cert.dateObtained}</span>}
      {cert.dateExpires && <span>• Expires: {cert.dateExpires}</span>}
    </div>
    {cert.description && (
      <p className="mt-2 text-sm text-gray-600">{cert.description}</p>
    )}
    <div className="mt-3 pt-3 border-t border-gray-100 flex justify-end gap-2">
      <button onClick={() => onEdit(cert)} className="text-green-600 hover:bg-green-50 p-1.5 rounded-lg">
        <Edit size={14} />
      </button>
      <button onClick={() => onDelete(cert)} className="text-red-600 hover:bg-red-50 p-1.5 rounded-lg">
        <Trash2 size={14} />
      </button>
    </div>
  </div>
);

export default function Skills() {
  const [employees, setEmployees] = useState([]);
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('skills');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [formData, setFormData] = useState({
    employeeId: '',
    name: '',
    category: '',
    level: 'Intermediate',
    status: 'Pending',
    dateObtained: '',
    dateExpires: '',
    provider: '',
    description: '',
  });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, skillData, certData] = await Promise.all([
        db.employees.toArray(),
        db.employeeSkills.toArray(),
        db.employeeCertifications.toArray(),
      ]);

      setEmployees(emps);

      const empMap = new Map(emps.map(e => [e.id, `${e.surname}, ${e.firstName}`]));

      const skillsMapped = skillData.map(s => ({
        ...s,
        employeeName: empMap.get(s.employeeId) || 'Unknown',
      }));
      setSkills(skillsMapped);

      const certsMapped = certData.map(c => ({
        ...c,
        employeeName: empMap.get(c.employeeId) || 'Unknown',
      }));
      setCertifications(certsMapped);
    } catch (err) {
      console.error('Error loading skills data:', err);
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
      const data = {
        employeeId: formData.employeeId,
        name: formData.name,
        category: formData.category,
        level: formData.level,
        status: formData.status,
        dateObtained: formData.dateObtained || null,
        dateExpires: formData.dateExpires || null,
        provider: formData.provider || null,
        description: formData.description || null,
      };

      const table = activeTab === 'skills' ? 'employeeSkills' : 'employeeCertifications';

      if (editingItem) {
        await db[table].update(editingItem.id, data);
      } else {
        await db[table].add(data);
      }

      setShowForm(false);
      setEditingItem(null);
      setFormData({
        employeeId: '', name: '', category: '', level: 'Intermediate',
        status: 'Pending', dateObtained: '', dateExpires: '',
        provider: '', description: '',
      });
      loadData();
    } catch (err) {
      console.error('Error saving:', err);
    }
  };

  const handleDelete = async (item) => {
    if (!confirm(`Delete ${item.name}?`)) return;
    try {
      const table = activeTab === 'skills' ? 'employeeSkills' : 'employeeCertifications';
      await db[table].delete(item.id);
      loadData();
    } catch (err) {
      console.error('Error deleting:', err);
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      employeeId: item.employeeId || '',
      name: item.name || '',
      category: item.category || '',
      level: item.level || 'Intermediate',
      status: item.status || 'Pending',
      dateObtained: item.dateObtained || '',
      dateExpires: item.dateExpires || '',
      provider: item.provider || '',
      description: item.description || '',
    });
    setShowForm(true);
  };

  const filteredSkills = skills.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCerts = certifications.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-64">
      <div className="text-gray-600 text-lg">Loading...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Skills & Certifications</h1>
        <button
          onClick={() => { setShowForm(true); setEditingItem(null); }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
        >
          <Plus size={20} /> Add {activeTab === 'skills' ? 'Skill' : 'Certification'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('skills')}
          className={`pb-3 px-4 font-medium transition border-b-2 ${
            activeTab === 'skills'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="inline mr-2" size={18} />
          Skills ({skills.length})
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`pb-3 px-4 font-medium transition border-b-2 ${
            activeTab === 'certifications'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Award className="inline mr-2" size={18} />
          Certifications ({certifications.length})
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeTab === 'skills' ? (
          filteredSkills.map(skill => (
            <SkillCard key={skill.id} skill={skill} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        ) : (
          filteredCerts.map(cert => (
            <CertificationCard key={cert.id} cert={cert} onEdit={handleEdit} onDelete={handleDelete} />
          ))
        )}
      </div>

      {((activeTab === 'skills' && filteredSkills.length === 0) ||
        (activeTab === 'certifications' && filteredCerts.length === 0)) && (
        <div className="text-center py-12 text-gray-500">
          No {activeTab} found. Add your first {activeTab === 'skills' ? 'skill' : 'certification'}!
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">
                {editingItem ? 'Edit' : 'Add'} {activeTab === 'skills' ? 'Skill' : 'Certification'}
              </h2>
              <button onClick={() => { setShowForm(false); setEditingItem(null); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select
                  value={formData.employeeId}
                  onChange={(e) => setFormData(f => ({ ...f, employeeId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  required
                >
                  <option value="">Select Employee</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.surname}, {emp.firstName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {activeTab === 'skills' ? 'Skill' : 'Certification'} Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder={activeTab === 'skills' ? 'e.g., Project Management' : 'e.g., PMP Certification'}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData(f => ({ ...f, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., Technical"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === 'skills' ? 'Level' : 'Status'}
                  </label>
                  <select
                    value={activeTab === 'skills' ? formData.level : formData.status}
                    onChange={(e) => setFormData(f => ({
                      ...f,
                      [activeTab === 'skills' ? 'level' : 'status']: e.target.value
                    }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    {(activeTab === 'skills' ? SKILL_LEVELS : CERT_STATUS).map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              {activeTab === 'certifications' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <input
                    type="text"
                    value={formData.provider}
                    onChange={(e) => setFormData(f => ({ ...f, provider: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder="e.g., AWS, Microsoft, PRINCE2"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {activeTab === 'certifications' ? 'Issue Date' : 'Date Obtained'}
                  </label>
                  <input
                    type="date"
                    value={formData.dateObtained}
                    onChange={(e) => setFormData(f => ({ ...f, dateObtained: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Expires</label>
                  <input
                    type="date"
                    value={formData.dateExpires}
                    onChange={(e) => setFormData(f => ({ ...f, dateExpires: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Additional details..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setEditingItem(null); }}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <Check size={18} />
                  {editingItem ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
