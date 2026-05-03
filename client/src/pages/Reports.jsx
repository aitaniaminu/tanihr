import { useEffect, useState, useMemo } from 'react';
import supabase from '../../lib/supabase';
import { 
  BarChart3, PieChart, TrendingUp, Users, Building2, 
  UserPlus, UserMinus, Calendar, Download
} from 'lucide-react';

const StatCard = ({ title, value, change, icon: Icon, color }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={24} />
      </div>
    </div>
    {change && (
      <p className={`text-sm mt-2 ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {change > 0 ? '+' : ''}{change}% from last year
      </p>
    )}
  </div>
);

const BarChart = ({ data, title }) => {
  const max = Math.max(...data.map(d => d.value));
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="space-y-3">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <span className="w-24 text-sm text-gray-600 truncate">{item.label}</span>
            <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
            <span className="w-12 text-sm text-gray-900 text-right">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const PieChartComponent = ({ data, title }) => {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'];
  
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="flex items-center gap-6">
        <div className="w-32 h-32 rounded-full border-4 border-gray-100 flex items-center justify-center">
          <span className="text-lg font-bold text-gray-900">{total}</span>
        </div>
        <div className="flex-1 space-y-2">
          {data.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${colors[idx % colors.length]}`} />
              <span className="flex-1 text-sm text-gray-600">{item.label}</span>
              <span className="text-sm font-medium">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const PivotTable = ({ data, title }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
    <div className="p-4 border-b border-gray-100">
      <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Row</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Count</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">%</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-900">{row.label}</td>
              <td className="px-4 py-3 text-sm text-gray-900 text-right">{row.value}</td>
              <td className="px-4 py-3 text-sm text-gray-500 text-right">
                {((row.value / data.reduce((s, r) => s + r.value, 0)) * 100).toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50">
          <tr>
            <td className="px-4 py-3 text-sm font-medium text-gray-900">Total</td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
              {data.reduce((s, r) => s + r.value, 0)}
            </td>
            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">100%</td>
          </tr>
        </tfoot>
      </table>
    </div>
  </div>
);

export default function Reports() {
  const [stats, setStats] = useState({
    total: 0,
    newThisYear: 0,
    departed: 0,
    byDepartment: [],
    byStatus: [],
    byLocation: [],
    byRank: [],
    byGender: [],
  });
  const [loading, setLoading] = useState(true);
  const [chartType, setChartType] = useState('bar');

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      
      const empRes = await supabase.from('employees').select('*');
      const employees = empRes.data || [];
      
      const currentYear = new Date().getFullYear();
      const newThisYear = employees.filter(e => {
        const firstApp = e.date_of_first_appointment;
        return firstApp && new Date(firstApp).getFullYear() === currentYear;
      }).length;

      const byDept = {};
      employees.forEach(e => {
        const dept = e.department_name || 'Unassigned';
        byDept[dept] = (byDept[dept] || 0) + 1;
      });

      const byStatus = {};
      employees.forEach(e => {
        const status = e.status || 'Active';
        byStatus[status] = (byStatus[status] || 0) + 1;
      });

      const byLocation = {};
      employees.forEach(e => {
        const loc = e.location || 'Unassigned';
        byLocation[loc] = (byLocation[loc] || 0) + 1;
      });

      const byRank = {};
      employees.forEach(e => {
        const rank = e.rank_name || 'Unassigned';
        byRank[rank] = (byRank[rank] || 0) + 1;
      });

      const byGender = {};
      employees.forEach(e => {
        const sex = e.sex || 'Unknown';
        byGender[sex] = (byGender[sex] || 0) + 1;
      });

      setStats({
        total: employees.length,
        newThisYear,
        departed: byStatus['Resigned'] || 0,
        byDepartment: Object.entries(byDept).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
        byStatus: Object.entries(byStatus).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
        byLocation: Object.entries(byLocation).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value),
        byRank: Object.entries(byRank).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value).slice(0, 10),
        byGender: Object.entries(byGender).map(([label, value]) => ({ label, value })),
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-gray-600 text-lg">Loading reports...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">HR Reports</h1>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
          <Download size={18} />
          Export
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard 
          title="Total Employees" 
          value={stats.total.toLocaleString()} 
          icon={Users}
          color="bg-blue-100 text-blue-600"
        />
        <StatCard 
          title="New This Year" 
          value={stats.newThisYear} 
          icon={UserPlus}
          color="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Active" 
          value={stats.byStatus.find(s => s.label === 'Active')?.value || 0} 
          icon={TrendingUp}
          color="bg-green-100 text-green-600"
        />
        <StatCard 
          title="Departments" 
          value={stats.byDepartment.length} 
          icon={Building2}
          color="bg-purple-100 text-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BarChart 
          data={stats.byDepartment} 
          title="Employees by Department" 
        />
        <PieChartComponent 
          data={stats.byStatus} 
          title="Employees by Status" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BarChart 
          data={stats.byLocation} 
          title="Employees by Location" 
        />
        <PieChartComponent 
          data={stats.byGender} 
          title="Employees by Gender" 
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <PivotTable 
          data={stats.byRank} 
          title="Employees by Rank (Top 10)" 
        />
        <PivotTable 
          data={stats.byLocation} 
          title="Employees by Location" 
        />
      </div>
    </div>
  );
}