import { useEffect, useState, useMemo } from 'react';
import { db } from '../../db/indexedDB';
import { Pencil, Trash2, Plus, Search } from 'lucide-react';
import { defaultDepartments } from '../../data/nigerianData';

export default function DepartmentList() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [deptName, setDeptName] = useState('');
  const [formError, setFormError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [employeeCounts, setEmployeeCounts] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const all = await db.departments.toArray();
      setDepartments(all);
      const counts = {};
      for (const dept of all) {
        const count = await db.employees.where('department').equals(dept.name).count();
        counts[dept.id] = count;
      }
      setEmployeeCounts(counts);
    } catch (err) {
      console.error('Error loading departments:', err);
      setError('Failed to load department data. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    if (!searchTerm) return departments;
    const term = searchTerm.toLowerCase();
    return departments.filter((d) => d.name.toLowerCase().includes(term));
  }, [departments, searchTerm]);

  const openAddModal = () => {
    setEditingDept(null);
    setDeptName('');
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (dept) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async () => {
    const trimmed = deptName.trim();
    if (!trimmed) {
      setFormError('Department name is required.');
      return;
    }

    try {
      if (editingDept) {
        await db.departments.update(editingDept.id, { name: trimmed });
      } else {
        await db.departments.add({ name: trimmed });
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      if (err.message?.includes('Key already exists') || err.name === 'ConstraintError') {
        setFormError('A department with this name already exists.');
      } else {
        setFormError('Failed to save department. Please try again.');
      }
    }
  };

  const handleDelete = async (id) => {
    try {
      await db.departments.delete(id);
      setDeleteConfirm(null);
      loadData();
    } catch (err) {
      console.error('Error deleting department:', err);
      alert('Failed to delete department. Please try again.');
    }
  };

  const seedDefaults = async () => {
    for (const name of defaultDepartments) {
      try {
        await db.departments.add({ name });
      } catch {
        // skip if already exists
      }
    }
    loadData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Loading departments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 p-4">
        <p className="text-red-700">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-2 text-red-600 underline">
          Refresh page
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Departments</h1>
        <button
          onClick={openAddModal}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition inline-flex items-center gap-2"
        >
          <Plus size={18} />
          Add Department
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {/* Search */}
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search departments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search departments"
            />
          </div>
          {searchTerm && (
            <p className="text-sm text-gray-500 mt-2">
              Showing {filtered.length} of {departments.length} departments
            </p>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Department
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employees
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.map((dept) => (
                <tr key={dept.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{dept.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{employeeCounts[dept.id] ?? 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                    <button
                      onClick={() => openEditModal(dept)}
                      className="text-green-600 hover:text-green-900 inline-flex items-center gap-1"
                      title="Edit department"
                      aria-label={`Edit ${dept.name}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(dept)}
                      className="text-red-600 hover:text-red-900 inline-flex items-center gap-1"
                      title="Delete department"
                      aria-label={`Delete ${dept.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? 'No departments match your search.' : 'No departments found. Add your first department.'}
              {!searchTerm && departments.length === 0 && (
                <div className="mt-4">
                  <button onClick={seedDefaults} className="text-blue-600 hover:underline font-medium">
                    Seed default departments
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              {editingDept ? 'Edit Department' : 'Add Department'}
            </h3>
            <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="dept-name">
              Department name
            </label>
            <input
              id="dept-name"
              type="text"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              value={deptName}
              onChange={(e) => {
                setDeptName(e.target.value);
                setFormError('');
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              autoFocus
            />
            {formError && <p className="text-red-600 text-sm mt-2">{formError}</p>}
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button onClick={handleSave} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 w-full">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Delete Department</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete <span className="font-medium">{deleteConfirm.name}</span>? This action
              cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
