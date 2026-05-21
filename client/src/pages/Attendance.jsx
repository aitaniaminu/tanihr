import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Clock, LogIn, LogOut, Calendar, Search, AlertTriangle, CheckCircle, XCircle, BarChart3 } from 'lucide-react';

const HOURS_PER_WEEK = 40;
const HOURS_PER_DAY = 8;

function formatTime(dateStr) {
  if (!dateStr) return '--:--';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-NG', { hour: '2-digit', minute: '2-digit', hour12: true });
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-NG', { year: 'numeric', month: 'short', day: 'numeric' });
}

function calcHours(clockIn, clockOut) {
  if (!clockIn || !clockOut) return 0;
  const start = new Date(clockIn);
  const end = new Date(clockOut);
  return Math.round((end - start) / (1000 * 60 * 60) * 100) / 100;
}

function getWeekRange() {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString();
}

export default function Attendance() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState('');
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [clocking, setClocking] = useState(false);
  const [message, setMessage] = useState(null);

  const employeeId = selectedEmployee || user?.id;

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [emps, logs, users] = await Promise.all([
        db.employees.toArray(),
        db.attendanceLogs.toArray(),
        db.users.toArray(),
      ]);

      const userMap = new Map(users.map(u => [u.employeeId, u.username]));

      const empsMapped = emps.map(e => {
        const username = userMap.get(e.id);
        return {
          ...e,
          name: `${e.surname}, ${e.firstName}`,
          displayName: username ? `${e.surname}, ${e.firstName} (@${username})` : `${e.surname}, ${e.firstName}`,
          username: username || null,
        };
      });

      setEmployees(empsMapped);
      setAttendanceLogs(logs);
    } catch (err) {
      console.error('Error loading attendance data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const today = new Date().toISOString().split('T')[0];

  const todayLog = attendanceLogs.find(l =>
    l.employeeId === employeeId &&
    l.date === today
  );

  const todayHours = todayLog ? calcHours(todayLog.clockIn, todayLog.clockOut) : 0;

  const weekLogs = attendanceLogs.filter(l => {
    if (l.employeeId !== employeeId) return false;
    const weekStart = getWeekRange();
    return l.date >= weekStart.split('T')[0] && l.date <= today;
  });
  const weekHours = weekLogs.reduce((sum, l) => sum + calcHours(l.clockIn, l.clockOut), 0);

  const handleClockIn = async () => {
    setClocking(true);
    setMessage(null);
    try {
      const now = new Date().toISOString();
      const existing = await db.attendanceLogs
        .where({ employeeId, date: today })
        .first();

      if (existing) {
        if (existing.clockIn && !existing.clockOut) {
          setMessage({ type: 'error', text: 'Already clocked in. Clock out first.' });
          setClocking(false);
          return;
        }
        if (existing.clockIn && existing.clockOut) {
          setMessage({ type: 'error', text: 'Already clocked in and out for today.' });
          setClocking(false);
          return;
        }
        await db.attendanceLogs.update(existing.id, { clockIn: now });
      } else {
        await db.attendanceLogs.add({
          employeeId,
          date: today,
          clockIn: now,
          clockOut: null,
        });
      }
      setMessage({ type: 'success', text: `Clocked in at ${formatTime(now)}` });
      loadData();
    } catch (err) {
      console.error('Error clocking in:', err);
      setMessage({ type: 'error', text: 'Failed to clock in' });
    } finally {
      setClocking(false);
    }
  };

  const handleClockOut = async () => {
    setClocking(true);
    setMessage(null);
    try {
      const existing = await db.attendanceLogs
        .where({ employeeId, date: today })
        .first();

      if (!existing || !existing.clockIn) {
        setMessage({ type: 'error', text: 'Not clocked in today.' });
        setClocking(false);
        return;
      }

      if (existing.clockOut) {
        setMessage({ type: 'error', text: 'Already clocked out today.' });
        setClocking(false);
        return;
      }

      const now = new Date().toISOString();
      await db.attendanceLogs.update(existing.id, { clockOut: now });
      setMessage({ type: 'success', text: `Clocked out at ${formatTime(now)}` });
      loadData();
    } catch (err) {
      console.error('Error clocking out:', err);
      setMessage({ type: 'error', text: 'Failed to clock out' });
    } finally {
      setClocking(false);
    }
  };

  const filteredLogs = attendanceLogs
    .filter(l => {
      if (employeeId && l.employeeId !== employeeId) return false;
      if (dateFrom && l.date < dateFrom) return false;
      if (dateTo && l.date > dateTo) return false;
      const emp = employees.find(e => e.id === l.employeeId);
      const empName = emp?.name?.toLowerCase() || '';
      return !searchTerm || empName.includes(searchTerm.toLowerCase());
    })
    .sort((a, b) => b.date.localeCompare(a.date) || (b.clockIn || '').localeCompare(a.clockIn || ''));

  const monthLogs = attendanceLogs.filter(l => {
    if (l.employeeId !== employeeId) return false;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    return l.date >= monthStart && l.date <= today;
  });
  const monthHours = monthLogs.reduce((sum, l) => sum + calcHours(l.clockIn, l.clockOut), 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-64">
      <div className="text-gray-600 text-lg">Loading...</div>
    </div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Attendance</h1>
        <div className="flex items-center gap-2">
          <select
            value={selectedEmployee}
            onChange={(e) => setSelectedEmployee(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
          >
            <option value="">My Attendance</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.displayName || emp.name}</option>
            ))}
          </select>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Clock size={20} className="text-green-600" />
          Today&apos;s Attendance
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Clock In</p>
            <p className="text-2xl font-bold text-gray-900">{todayLog ? formatTime(todayLog.clockIn) : '--:--'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Clock Out</p>
            <p className="text-2xl font-bold text-gray-900">{todayLog?.clockOut ? formatTime(todayLog.clockOut) : '--:--'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Hours Today</p>
            <p className="text-2xl font-bold text-gray-900">{todayHours.toFixed(1)}h</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500 mb-1">Status</p>
            <p className={`text-lg font-bold ${todayLog?.clockOut ? 'text-green-600' : todayLog?.clockIn ? 'text-yellow-600' : 'text-gray-400'}`}>
              {todayLog?.clockOut ? 'Completed' : todayLog?.clockIn ? 'Active' : 'Not Started'}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleClockIn}
            disabled={clocking || (!!todayLog?.clockIn && !todayLog?.clockOut) || !!todayLog?.clockOut}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            <LogIn size={18} />
            {clocking ? 'Clocking...' : 'Clock In'}
          </button>
          <button
            onClick={handleClockOut}
            disabled={clocking || !todayLog?.clockIn || !!todayLog?.clockOut}
            className="flex items-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg font-medium transition"
          >
            <LogOut size={18} />
            {clocking ? 'Clocking...' : 'Clock Out'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Today</p>
              <p className="text-2xl font-bold text-gray-900">{todayHours.toFixed(1)}h</p>
            </div>
            <Clock className="text-green-600" size={24} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{todayHours >= HOURS_PER_DAY ? 'Goal met' : `${(HOURS_PER_DAY - todayHours).toFixed(1)}h remaining`}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Week</p>
              <p className="text-2xl font-bold text-gray-900">{weekHours.toFixed(1)}h</p>
            </div>
            <Calendar className="text-blue-600" size={24} />
          </div>
          <p className="text-xs text-gray-400 mt-1">{weekHours >= HOURS_PER_WEEK ? 'Weekly goal met' : `${(HOURS_PER_WEEK - weekHours).toFixed(1)}h remaining`}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">This Month</p>
              <p className="text-2xl font-bold text-gray-900">{monthHours.toFixed(1)}h</p>
            </div>
            <BarChart3 className="text-purple-600" size={24} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Across {monthLogs.length} day(s)</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Calendar size={20} className="text-blue-600" />
            Attendance History
          </h2>
        </div>

        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by employee..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            />
          </div>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="From"
          />
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            placeholder="To"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Employee</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Clock In</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Clock Out</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Hours</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map(log => {
                const emp = employees.find(e => e.id === log.employeeId);
                const hours = calcHours(log.clockIn, log.clockOut);
                return (
                  <tr key={log.id} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3">{formatDate(log.date)}</td>
                    <td className="px-4 py-3 font-medium">{emp?.name || 'Unknown'}</td>
                    <td className="px-4 py-3">{formatTime(log.clockIn)}</td>
                    <td className="px-4 py-3">{formatTime(log.clockOut)}</td>
                    <td className="px-4 py-3">{hours.toFixed(1)}h</td>
                    <td className="px-4 py-3">
                      {log.clockOut ? (
                        <span className="flex items-center gap-1 text-green-600"><CheckCircle size={14} /> Complete</span>
                      ) : log.clockIn ? (
                        <span className="flex items-center gap-1 text-yellow-600"><Clock size={14} /> Active</span>
                      ) : (
                        <span className="flex items-center gap-1 text-gray-400"><XCircle size={14} /> Missed</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">No attendance records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
