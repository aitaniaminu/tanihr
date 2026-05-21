import { useEffect, useState, useCallback } from 'react';
import { db } from '../db/indexedDB';
import { useAuth } from '../context/AuthContext';
import { Plus, Search, Briefcase, Users, Calendar, X, Check, Clock, Trash2, Edit, ExternalLink } from 'lucide-react';

const STAGES = ['Applied', 'Screening', 'Interview', 'Assessment', 'Offer', 'Hired', 'Rejected'];

const stageColors = {
  Applied: 'bg-blue-100 text-blue-700',
  Screening: 'bg-yellow-100 text-yellow-700',
  Interview: 'bg-purple-100 text-purple-700',
  Assessment: 'bg-indigo-100 text-indigo-700',
  Offer: 'bg-orange-100 text-orange-700',
  Hired: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState('postings');
  const [jobPostings, setJobPostings] = useState([]);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showJobForm, setShowJobForm] = useState(false);
  const [showCandidateForm, setShowCandidateForm] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [selectedJobId, setSelectedJobId] = useState('all');
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const [jobFormData, setJobFormData] = useState({
    title: '',
    department: '',
    description: '',
    requirements: '',
    referenceNumber: '',
    postedDate: '',
    closingDate: '',
    status: 'Open',
  });

  const [candidateFormData, setCandidateFormData] = useState({
    jobId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    resume: '',
    coverLetter: '',
    stage: 'Applied',
  });

  const { user } = useAuth();

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [postings, candidatesData] = await Promise.all([
        db.jobPostings.toArray(),
        db.candidates.toArray(),
      ]);
      setJobPostings(postings);
      setCandidates(candidatesData);
    } catch (err) {
      console.error('Error loading recruitment data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleJobSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingJob) {
        await db.jobPostings.update(editingJob.id, {
          ...jobFormData,
          updatedAt: new Date().toISOString(),
        });
      } else {
        await db.jobPostings.add({
          ...jobFormData,
          createdAt: new Date().toISOString(),
          createdBy: user?.username || 'Unknown',
        });
      }
      setShowJobForm(false);
      setEditingJob(null);
      setJobFormData({
        title: '',
        department: '',
        description: '',
        requirements: '',
        referenceNumber: '',
        postedDate: '',
        closingDate: '',
        status: 'Open',
      });
      loadData();
    } catch (err) {
      console.error('Error saving job posting:', err);
    }
  };

  const handleCandidateSubmit = async (e) => {
    e.preventDefault();
    try {
      await db.candidates.add({
        ...candidateFormData,
        appliedDate: new Date().toISOString(),
      });
      setShowCandidateForm(false);
      setCandidateFormData({
        jobId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        resume: '',
        coverLetter: '',
        stage: 'Applied',
      });
      loadData();
    } catch (err) {
      console.error('Error adding candidate:', err);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!confirm('Delete this job posting?')) return;
    await db.jobPostings.delete(id);
    loadData();
  };

  const handleEditJob = (job) => {
    setEditingJob(job);
    setJobFormData(job);
    setShowJobForm(true);
  };

  const handleMoveCandidate = async (candidateId, newStage) => {
    const existing = await db.candidates.get(candidateId);
    if (existing) {
      await db.candidates.update(candidateId, {
        stage: newStage,
        updatedAt: new Date().toISOString(),
      });
      loadData();
    }
  };

  const handleDeleteCandidate = async (id) => {
    if (!confirm('Delete this candidate?')) return;
    await db.candidates.delete(id);
    loadData();
  };

  const filteredPostings = jobPostings.filter(j =>
    j.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.department?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    j.referenceNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCandidates = candidates
    .filter(c => selectedJobId === 'all' || c.jobId === selectedJobId)
    .filter(c =>
      c.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  const getJobTitle = (jobId) => {
    const job = jobPostings.find(j => j.id === jobId);
    return job ? job.title : 'Unknown';
  };

  const openCount = jobPostings.filter(j => j.status === 'Open').length;
  const candidateCounts = {};
  STAGES.forEach(stage => {
    candidateCounts[stage] = candidates.filter(c => c.stage === stage).length;
  });

  if (loading) {
    return <div className="flex items-center justify-center min-h-64"><div className="text-gray-600 text-lg">Loading...</div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Recruitment</h1>
        <div className="flex gap-2">
          {activeTab === 'postings' && (
            <button
              onClick={() => { setEditingJob(null); setJobFormData({ title: '', department: '', description: '', requirements: '', referenceNumber: '', postedDate: '', closingDate: '', status: 'Open' }); setShowJobForm(true); }}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
            >
              <Plus size={20} />
              New Job Posting
            </button>
          )}
          {activeTab === 'candidates' && (
            <button
              onClick={() => setShowCandidateForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition flex items-center gap-2"
            >
              <Plus size={20} />
              Add Candidate
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Open Positions</p>
              <p className="text-2xl font-bold text-green-600">{openCount}</p>
            </div>
            <Briefcase className="text-green-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Candidates</p>
              <p className="text-2xl font-bold text-blue-600">{candidates.length}</p>
            </div>
            <Users className="text-blue-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">In Interview</p>
              <p className="text-2xl font-bold text-purple-600">{candidateCounts['Interview'] || 0}</p>
            </div>
            <Calendar className="text-purple-600" size={24} />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Hired</p>
              <p className="text-2xl font-bold text-green-600">{candidateCounts['Hired'] || 0}</p>
            </div>
            <Check className="text-green-600" size={24} />
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => { setActiveTab('postings'); setSearchTerm(''); }}
          className={`pb-3 px-4 font-medium transition border-b-2 ${activeTab === 'postings' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Briefcase className="inline mr-2" size={18} />
          Job Postings ({jobPostings.length})
        </button>
        <button
          onClick={() => { setActiveTab('candidates'); setSearchTerm(''); }}
          className={`pb-3 px-4 font-medium transition border-b-2 ${activeTab === 'candidates' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <Users className="inline mr-2" size={18} />
          Candidates ({candidates.length})
        </button>
        <button
          onClick={() => setActiveTab('pipeline')}
          className={`pb-3 px-4 font-medium transition border-b-2 ${activeTab === 'pipeline' ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          <ExternalLink className="inline mr-2" size={18} />
          Pipeline
        </button>
      </div>

      {activeTab === 'postings' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search job postings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPostings.map(job => (
              <div key={job.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{job.title}</h3>
                    <p className="text-sm text-gray-500">{job.department}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === 'Open' ? 'bg-green-100 text-green-700' : job.status === 'Closed' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {job.status}
                  </span>
                </div>
                {job.referenceNumber && <p className="text-xs text-gray-400 mb-2">Ref: {job.referenceNumber}</p>}
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  {job.postedDate && <span className="flex items-center gap-1"><Calendar size={14} /> Posted: {job.postedDate}</span>}
                  {job.closingDate && <span className="flex items-center gap-1"><Clock size={14} /> Closes: {job.closingDate}</span>}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{candidates.filter(c => c.jobId === job.id).length} candidates</span>
                  <div className="flex gap-2">
                    <button onClick={() => handleEditJob(job)} className="p-1 text-gray-400 hover:text-blue-600"><Edit size={16} /></button>
                    <button onClick={() => handleDeleteJob(job.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredPostings.length === 0 && (
            <div className="text-center py-12 text-gray-500">No job postings found.</div>
          )}
        </>
      )}

      {activeTab === 'candidates' && (
        <>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
              />
            </div>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
            >
              <option value="all">All Positions</option>
              {jobPostings.filter(j => j.status === 'Open').map(j => (
                <option key={j.id} value={j.id}>{j.title}</option>
              ))}
            </select>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Position</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Stage</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Applied</th>
                  <th className="text-right px-4 py-3 text-sm font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCandidates.map(candidate => (
                  <tr key={candidate.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{candidate.firstName} {candidate.lastName}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{candidate.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">{getJobTitle(candidate.jobId)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${stageColors[candidate.stage]}`}>{candidate.stage}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{candidate.appliedDate?.split('T')[0]}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <select
                          value={candidate.stage}
                          onChange={(e) => handleMoveCandidate(candidate.id, e.target.value)}
                          className="text-xs px-2 py-1 border border-gray-300 rounded"
                        >
                          {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <button onClick={() => handleDeleteCandidate(candidate.id)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredCandidates.length === 0 && (
              <div className="text-center py-12 text-gray-500">No candidates found.</div>
            )}
          </div>
        </>
      )}

      {activeTab === 'pipeline' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map(stage => (
            <div key={stage} className="min-w-[280px] flex-1">
              <div className={`p-3 rounded-t-lg ${stageColors[stage]}`}>
                <h3 className="font-semibold text-sm">{stage}</h3>
                <p className="text-xs opacity-75">{candidateCounts[stage] || 0} candidates</p>
              </div>
              <div className="bg-gray-50 rounded-b-lg p-2 space-y-2 min-h-[200px]">
                {candidates.filter(c => c.stage === stage).map(candidate => (
                  <div key={candidate.id} className="bg-white rounded-lg shadow-sm border border-gray-100 p-3">
                    <h4 className="font-medium text-sm text-gray-900">{candidate.firstName} {candidate.lastName}</h4>
                    <p className="text-xs text-gray-500">{getJobTitle(candidate.jobId)}</p>
                    <p className="text-xs text-gray-400 mt-1">{candidate.email}</p>
                    <div className="flex gap-1 mt-2">
                      {STAGES.filter(s => s !== stage).map(s => (
                        <button
                          key={s}
                          onClick={() => handleMoveCandidate(candidate.id, s)}
                          className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded"
                          title={`Move to ${s}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {candidateCounts[stage] === 0 && (
                  <div className="text-center py-8 text-gray-400 text-xs">No candidates</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showJobForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">{editingJob ? 'Edit Job Posting' : 'New Job Posting'}</h2>
              <button onClick={() => { setShowJobForm(false); setEditingJob(null); }} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleJobSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input type="text" value={jobFormData.title} onChange={(e) => setJobFormData(f => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <input type="text" value={jobFormData.department} onChange={(e) => setJobFormData(f => ({ ...f, department: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Number</label>
                <input type="text" value={jobFormData.referenceNumber} onChange={(e) => setJobFormData(f => ({ ...f, referenceNumber: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Posted Date</label>
                  <input type="date" value={jobFormData.postedDate} onChange={(e) => setJobFormData(f => ({ ...f, postedDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Closing Date</label>
                  <input type="date" value={jobFormData.closingDate} onChange={(e) => setJobFormData(f => ({ ...f, closingDate: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select value={jobFormData.status} onChange={(e) => setJobFormData(f => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg">
                  <option value="Open">Open</option>
                  <option value="Closed">Closed</option>
                  <option value="Draft">Draft</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea value={jobFormData.description} onChange={(e) => setJobFormData(f => ({ ...f, description: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea value={jobFormData.requirements} onChange={(e) => setJobFormData(f => ({ ...f, requirements: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowJobForm(false); setEditingJob(null); }} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">{editingJob ? 'Update' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCandidateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add Candidate</h2>
              <button onClick={() => setShowCandidateForm(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <form onSubmit={handleCandidateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                <select value={candidateFormData.jobId} onChange={(e) => setCandidateFormData(f => ({ ...f, jobId: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required>
                  <option value="">Select Position</option>
                  {jobPostings.filter(j => j.status === 'Open').map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={candidateFormData.firstName} onChange={(e) => setCandidateFormData(f => ({ ...f, firstName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" value={candidateFormData.lastName} onChange={(e) => setCandidateFormData(f => ({ ...f, lastName: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input type="email" value={candidateFormData.email} onChange={(e) => setCandidateFormData(f => ({ ...f, email: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input type="tel" value={candidateFormData.phone} onChange={(e) => setCandidateFormData(f => ({ ...f, phone: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Resume URL</label>
                <input type="text" value={candidateFormData.resume} onChange={(e) => setCandidateFormData(f => ({ ...f, resume: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cover Letter</label>
                <textarea value={candidateFormData.coverLetter} onChange={(e) => setCandidateFormData(f => ({ ...f, coverLetter: e.target.value }))} className="w-full px-3 py-2 border border-gray-300 rounded-lg" rows={3} />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => setShowCandidateForm(false)} className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Add Candidate</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
