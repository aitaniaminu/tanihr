import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { Network, Users, ChevronDown, ChevronRight, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

export default function OrgChart() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('department');
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [zoom, setZoom] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [empRes, deptRes] = await Promise.all([
        supabase.from('employees').select('*'),
        supabase.from('departments').select('id, name, parent_id')
      ]);
      setEmployees(empRes.data || []);
      setDepartments(deptRes.data || []);
      setExpandedNodes(new Set(['root']));
    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load organization data.');
    } finally {
      setLoading(false);
    }
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  };

  const zoomIn = () => setZoom(z => Math.min(1.5, z + 0.1));
  const zoomOut = () => setZoom(z => Math.max(0.5, z - 0.1));
  const resetZoom = () => setZoom(1);

const getEmployeeByManager = useMemo(() => {
    const directReports = {};
    employees.forEach(emp => {
      const mgrId = emp.manager_id;
      if (mgrId) {
        if (!directReports[mgrId]) directReports[mgrId] = [];
        directReports[mgrId].push(emp);
      }
    });
    return directReports;
  }, [employees]);

  const rootEmployees = useMemo(() => {
    const allManagerIds = new Set(employees.map(e => e.manager_id).filter(Boolean));
    return employees.filter(e => !e.manager_id || !allManagerIds.has(e.id));
  }, [employees]);

  const getDepartmentHierarchy = useMemo(() => {
    const deptMap = {};
departments.forEach(d => {
      deptMap[d.id] = { ...d, children: [], employees: [] };
    });

    departments.forEach(d => {
      if (d.parent_id && deptMap[d.parent_id]) {
        deptMap[d.parent_id].children.push(deptMap[d.id]);
      }
    });

    const rootDepts = departments.filter(d => !d.parent_id).map(d => deptMap[d.id]);
    
    employees.forEach(emp => {
      const empDeptName = emp.department_name?.toLowerCase().trim();
      const dept = departments.find(d => d.name?.toLowerCase().trim() === empDeptName);
      if (dept && deptMap[dept.id]) {
        deptMap[dept.id].employees.push(emp);
      }
    });

    const totalWithDept = departments.reduce((sum, d) => sum + (deptMap[d.id]?.employees.length || 0), 0);
    const unassignedCount = employees.length - totalWithDept;
    const rootWithUnassigned = [...rootDepts];
    if (unassignedCount > 0) {
      rootWithUnassigned.unshift({ id: 'unassigned', name: 'Unassigned', children: [], employees: [] });
    }

    return rootWithUnassigned;
  }, [departments, employees]);

  const renderEmployeeCard = (emp, isCompact = false) => {
    const reports = getEmployeeByManager[emp.id] || [];
    const hasChildren = reports.length > 0;
    const nodeId = `emp-${emp.id}`;
    const isExpanded = expandedNodes.has(nodeId);

    return (
      <div key={emp.id} className="flex flex-col items-center">
        <div 
          className={`bg-white rounded-lg shadow-md border-2 border-green-500 cursor-pointer hover:shadow-lg transition ${isCompact ? 'p-2 min-w-32' : 'p-4 min-w-48'}`}
          onClick={() => navigate(`/employees/${emp.id}`)}
        >
          <div className="flex items-center gap-2">
            {hasChildren && (
              <button 
                onClick={(e) => { e.stopPropagation(); toggleNode(nodeId); }}
                className="text-green-600 hover:text-green-800"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            {emp.avatar_url ? (
              <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
            ) : (
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-bold">
                {emp.surname?.charAt(0)}{emp.first_name?.charAt(0)}
              </div>
            )}
          </div>
          <div className={`${isCompact ? 'text-xs' : 'text-sm'} mt-2`}>
            <p className="font-semibold text-gray-800 truncate">{emp.surname}, {emp.first_name}</p>
            {!isCompact && (
              <>
                <p className="text-gray-500 text-xs">{emp.rank_name}</p>
                <p className="text-green-600 text-xs">{emp.department_name}</p>
              </>
            )}
          </div>
          {hasChildren && !isExpanded && (
            <div className="mt-2 text-xs text-gray-500 bg-gray-100 rounded px-2 py-1">
              +{reports.length} report{reports.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="flex gap-4 mt-4 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-4 bg-gray-300"></div>
            <div className="flex gap-2 pt-4">
              {reports.map(report => renderEmployeeCard(report, true))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderDepartmentTree = (dept, isRoot = false) => {
    const nodeId = `dept-${dept.id}`;
    const isExpanded = expandedNodes.has(nodeId);
    const hasChildren = dept.children.length > 0 || dept.employees.length > 0;

    return (
      <div key={dept.id} className="ml-6">
        <div className="flex items-center gap-2 my-2">
          {hasChildren && (
            <button 
              onClick={() => toggleNode(nodeId)}
              className="text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
          {!hasChildren && <div className="w-4"></div>}
          <div 
            className="bg-green-50 border border-green-200 rounded-lg px-4 py-2 cursor-pointer hover:bg-green-100 transition"
            onClick={() => {
              navigate(`/employees?filter=dept-${encodeURIComponent(dept.name)}`);
            }}
          >
            <span className="font-semibold text-green-800">{dept.name}</span>
            <span className="ml-2 text-sm text-green-600">({dept.employees.length})</span>
          </div>
        </div>
        
        {isExpanded && (
          <div className="ml-4 border-l-2 border-green-200 pl-4">
            {dept.employees.slice(0, 5).map(emp => (
              <div 
                key={emp.id}
                className="flex items-center gap-2 py-1 cursor-pointer hover:bg-gray-50 rounded"
                onClick={() => navigate(`/employees/${emp.id}`)}
              >
                {emp.avatar_url ? (
                  <img src={emp.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs">
                    {emp.surname?.charAt(0)}
                  </div>
                )}
                <span className="text-sm text-gray-700">{emp.surname}, {emp.first_name}</span>
                <span className="text-xs text-gray-400">- {emp.rank_name}</span>
              </div>
            ))}
            {dept.employees.length > 5 && (
              <p className="text-xs text-gray-500 ml-8">+{dept.employees.length - 5} more</p>
            )}
            {dept.children.map(child => renderDepartmentTree(child))}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Loading organization chart...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 p-4">
        <p className="text-red-700">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Network className="w-8 h-8 text-green-600" />
          Organization Chart
        </h1>
        <div className="flex items-center gap-4">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('department')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'department' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <Users className="w-4 h-4 inline mr-1" />
              By Department
            </button>
            <button
              onClick={() => setViewMode('manager')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition ${viewMode === 'manager' ? 'bg-white shadow text-green-600' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <Network className="w-4 h-4 inline mr-1" />
              By Manager
            </button>
          </div>
          <div className="flex items-center gap-2 border rounded-lg px-2">
            <button onClick={zoomOut} className="p-2 hover:bg-gray-100 rounded" aria-label="Zoom out">
              <ZoomOut size={18} />
            </button>
            <span className="text-sm text-gray-600 w-16 text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={zoomIn} className="p-2 hover:bg-gray-100 rounded" aria-label="Zoom in">
              <ZoomIn size={18} />
            </button>
            <button onClick={resetZoom} className="p-2 hover:bg-gray-100 rounded" aria-label="Reset zoom">
              <RotateCcw size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {employees.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <Network className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <p className="text-lg">No employees found.</p>
            <p className="text-sm">Add employees to see the organization chart.</p>
          </div>
        ) : viewMode === 'department' ? (
          <div className="p-6 overflow-auto" style={{ minHeight: '500px' }}>
            {getDepartmentHierarchy.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p>No departments configured.</p>
                <button onClick={() => navigate('/departments')} className="mt-2 text-green-600 hover:underline">
                  Go to Departments
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {getDepartmentHierarchy.map(dept => renderDepartmentTree(dept, true))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6 overflow-auto" style={{ minHeight: '500px' }}>
            <div 
              className="flex flex-wrap gap-8 justify-center"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              {getTopLevelEmployees.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <p>No manager relationships configured.</p>
                  <p className="text-sm">Add manager relationships to employees to see the hierarchy.</p>
                </div>
              ) : (
                getTopLevelEmployees.map(emp => renderEmployeeCard(emp))
              )}
            </div>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-semibold text-blue-800 mb-2">Org Chart Tips</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Click on a department to filter employees by that department</li>
          <li>• Click on an employee card to view their full profile</li>
          <li>• Use the toggle buttons to expand/collapse branches</li>
          <li>• Switch between Department view and Manager hierarchy view</li>
          <li>• Use zoom controls to adjust the chart size</li>
        </ul>
      </div>
    </div>
  );
}