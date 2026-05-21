import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, BookOpen, X, Trash2, Edit, User, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const COURSE_STATUSES = ['Draft', 'Published', 'Active', 'Completed', 'Cancelled'];
const ENROLLMENT_STATUSES = ['Enrolled', 'In Progress', 'Completed', 'Failed', 'Dropped'];
const COURSE_CATEGORIES = ['Technical', 'Leadership', 'Compliance', 'Soft Skills', 'Safety', 'Professional Development', 'Onboarding'];

export default function Training() {
  const [activeTab, setActiveTab] = useState('courses');
  const [courses, setCourses] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [courseFormData, setCourseFormData] = useState({
    title: '',
    provider: '',
    category: 'Technical',
    duration: '',
    cost: '',
    status: 'Draft',
    description: '',
    startDate: '',
    endDate: '',
    maxEnrollment: '',
  });

  const [enrollFormData, setEnrollFormData] = useState({
    courseId: '',
    employeeId: '',
    status: 'Enrolled',
  });

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [coursesData, enrollData, emps] = await Promise.all([
        db.trainingCourses.toArray(),
        db.trainingEnrollments.toArray(),
        db.employees.toArray(),
      ]);
      setCourses(coursesData);
      setEnrollments(enrollData);
      setEmployees(emps);
    } catch (err) {
      console.error('Error loading training data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCourseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCourse) {
        await db.trainingCourses.update(editingCourse.id, courseFormData);
      } else {
        await db.trainingCourses.add({
          ...courseFormData,
          createdAt: new Date().toISOString(),
          createdBy: user?.username || 'Unknown',
        });
      }
      setShowCourseForm(false);
      setEditingCourse(null);
      setCourseFormData({ title: '', provider: '', category: 'Technical', duration: '', cost: '', status: 'Draft', description: '', startDate: '', endDate: '', maxEnrollment: '' });
      loadData();
    } catch (err) {
      console.error('Error saving course:', err);
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.trainingEnrollments.add({
        ...enrollFormData,
        enrollmentDate: new Date().toISOString(),
      });
      setShowEnrollForm(false);
      setEnrollFormData({ courseId: '', employeeId: '', status: 'Enrolled' });
      loadData();
    } catch (err) {
      console.error('Error enrolling:', err);
    }
  };

  const handleDeleteCourse = async (id) => {
    if (!confirm('Delete this course?')) return;
    await db.trainingCourses.delete(id);
    loadData();
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setCourseFormData(course);
    setShowCourseForm(true);
  };

  const handleEnrollmentStatusChange = async (id, newStatus) => {
    const updates = { status: newStatus };
    if (newStatus === 'Completed') updates.completionDate = new Date().toISOString();
    await db.trainingEnrollments.update(id, updates);
    loadData();
  };

  const getEmployeeName = (employeeId) => {
    const emp = employees.find(e => e.id === employeeId);
    return emp ? `${emp.surname}, ${emp.firstName}` : 'Unknown';
  };

  const getCourseTitle = (courseId) => {
    const course = courses.find(c => c.id === courseId);
    return course ? course.title : 'Unknown';
  };

  const filteredCourses = courses.filter(c =>
    c.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.provider?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEnrollments = enrollments.filter(en =>
    getEmployeeName(en.employeeId).toLowerCase().includes(searchTerm.toLowerCase()) ||
    getCourseTitle(en.courseId).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCourses = courses.filter(c => c.status === 'Active').length;
  const totalEnrollments = enrollments.length;
  const completedEnrollments = enrollments.filter(e => e.status === 'Completed').length;
  const totalCost = courses.reduce((sum, c) => sum + (parseFloat(c.cost) || 0), 0);

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="text-gray-600 text-lg">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Training & Development</h1>
        <div className="flex gap-2">
          {activeTab === 'courses' && (
            <button onClick={() => { setEditingCourse(null); setCourseFormData({ title: '', provider: '', category: 'Technical', duration: '', cost: '', status: 'Draft', description: '', startDate: '', endDate: '', maxEnrollment: '' }); setShowCourseForm(true); }} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2">
              <Plus size={20} /> New Course
            </button>
          )}
          {activeTab === 'enrollments' && (
            <button onClick={() => setShowEnrollForm(true)} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2">
              <Plus size={20} /> Enroll Employee
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Active Courses</p><p className="text-2xl font-bold text-blue-600">{activeCourses}</p></div>
            <BookOpen className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Enrollments</p><p className="text-2xl font-bold text-purple-600">{totalEnrollments}</p></div>
            <User className="text-purple-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Completed</p><p className="text-2xl font-bold text-green-600">{completedEnrollments}</p></div>
            <CheckCircle className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div><p className="text-sm text-gray-500">Total Budget</p><p className="text-2xl font-bold text-gray-600">₦{totalCost.toLocaleString()}</p></div>
            <DollarSign className="text-gray-600" size={24} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        {[
          { key: 'courses', label: 'Course Catalogue', icon: BookOpen, count: courses.length },
          { key: 'enrollments', label: 'Enrollments', icon: User, count: enrollments.length },
        ].map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearchTerm(''); }} className={`pb-3 px-4 font-medium transition border-b-2 ${activeTab === tab.key ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <tab.icon className="inline mr-2" size={18} /> {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {activeTab === 'courses' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search courses..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
            <select value={selectedCourse || ''} onChange={(e) => setSelectedCourse(e.target.value || null)} className="px-3 py-2 border border-gray-300 rounded-lg">
              <option value="">All Categories</option>
              {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.filter(c => !selectedCourse || c.category === selectedCourse).map(course => {
              const enrollmentCount = enrollments.filter(e => e.courseId === course.id).length;
              return (
                <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{course.title}</h3>
                      <p className="text-sm text-gray-500">{course.provider}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${course.status === 'Active' ? 'bg-green-100 text-green-700' : course.status === 'Published' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>{course.status}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">{course.category}</span>
                    {course.duration && <span><Clock size={14} className="inline mr-1" /> {course.duration}</span>}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                    {course.startDate && <span><Calendar size={14} className="inline mr-1" /> {course.startDate}</span>}
                    {course.cost && <span><DollarSign size={14} className="inline mr-1" /> ₦{parseFloat(course.cost).toLocaleString()}</span>}
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-xs text-gray-400">{enrollmentCount} enrolled{course.maxEnrollment ? ` / ${course.maxEnrollment}` : ''}</span>
                    <div className="flex gap-2">
                      <button onClick={() => handleEditCourse(course)} className="p-1 text-gray-400 hover:text-yellow-600"><Edit size={16} /></button>
                      <button onClick={() => handleDeleteCourse(course.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredCourses.length === 0 && <div className="text-center py-12 text-gray-500">No courses found.</div>}
        </>
      )}

      {activeTab === 'enrollments' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input type="text" placeholder="Search enrollments..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Employee</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Course</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Enrolled</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Completed</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEnrollments.map(enrollment => (
                  <tr key={enrollment.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900">{getEmployeeName(enrollment.employeeId)}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{getCourseTitle(enrollment.courseId)}</td>
                    <td className="px-4 py-3">
                      <select
                        value={enrollment.status}
                        onChange={(e) => handleEnrollmentStatusChange(enrollment.id, e.target.value)}
                        className={`px-2 py-1 rounded-full text-xs font-medium border-0 ${enrollment.status === 'Completed' ? 'bg-green-100 text-green-700' : enrollment.status === 'In Progress' ? 'bg-blue-100 text-blue-700' : enrollment.status === 'Failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}
                      >
                        {ENROLLMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{enrollment.enrollmentDate?.split('T')[0]}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{enrollment.completionDate?.split('T')[0] || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{enrollment.score ? `${enrollment.score}%` : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredEnrollments.length === 0 && <div className="text-center py-12 text-gray-500">No enrollments found.</div>}
          </div>
        </>
      )}

      {showCourseForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingCourse ? 'Edit Course' : 'New Training Course'}</h2>
              <button onClick={() => { setShowCourseForm(false); setEditingCourse(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCourseSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course Title *</label>
                <input type="text" value={courseFormData.title} onChange={(e) => setCourseFormData(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                  <input type="text" value={courseFormData.provider} onChange={(e) => setCourseFormData(f => ({ ...f, provider: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={courseFormData.category} onChange={(e) => setCourseFormData(f => ({ ...f, category: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {COURSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                  <input type="text" value={courseFormData.duration} onChange={(e) => setCourseFormData(f => ({ ...f, duration: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="e.g., 3 days, 20 hours" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cost (₦)</label>
                  <input type="number" value={courseFormData.cost} onChange={(e) => setCourseFormData(f => ({ ...f, cost: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input type="date" value={courseFormData.startDate} onChange={(e) => setCourseFormData(f => ({ ...f, startDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" value={courseFormData.endDate} onChange={(e) => setCourseFormData(f => ({ ...f, endDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Max Enrollment</label>
                  <input type="number" value={courseFormData.maxEnrollment} onChange={(e) => setCourseFormData(f => ({ ...f, maxEnrollment: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select value={courseFormData.status} onChange={(e) => setCourseFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                    {COURSE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={courseFormData.description} onChange={(e) => setCourseFormData(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowCourseForm(false); setEditingCourse(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingCourse ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEnrollForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Enroll Employee</h2>
              <button onClick={() => setShowEnrollForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course *</label>
                <select value={enrollFormData.courseId} onChange={(e) => setEnrollFormData(f => ({ ...f, courseId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Course</option>
                  {courses.filter(c => c.status === 'Active' || c.status === 'Published').map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee *</label>
                <select value={enrollFormData.employeeId} onChange={(e) => setEnrollFormData(f => ({ ...f, employeeId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Employee</option>
                  {employees.filter(e => e.status === 'Active').map(emp => <option key={emp.id} value={emp.id}>{emp.surname}, {emp.firstName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={enrollFormData.status} onChange={(e) => setEnrollFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  {ENROLLMENT_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowEnrollForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Enroll</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
