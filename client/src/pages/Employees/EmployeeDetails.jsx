import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/indexedDB';
import supabase from '../../lib/supabase';
import { mapEmployeeFromSupabase } from '../../utils/employeeMapper';
import { formatDDMMYYYY, calculateAge, calculateYearsOfService, calculateRetirementDate, parseDDMMYYYY } from '../../utils/dateHelpers';
import { ArrowLeft, Pencil, Award, FileText, Upload, Trash2, Eye, X as XIcon } from 'lucide-react';

const DetailField = ({ label, value }) => (
  <div>
    <label className="block text-sm font-medium text-gray-500 mb-1">{label}</label>
    <div className="w-full px-3 py-2 border rounded-lg bg-gray-50 text-gray-900">
      {value || '-'}
    </div>
  </div>
);

export default function EmployeeDetails({ employeeId }) {
  const navigate = useNavigate();
  const [emp, setEmp] = useState(null);
  const [manager, setManager] = useState(null);
  const [skills, setSkills] = useState([]);
  const [certifications, setCertifications] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loadingDoc, setLoadingDoc] = useState(false);
  const [showDocUpload, setShowDocUpload] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [computedFields, setComputedFields] = useState({ age: '', yearsOfService: '' });

  useEffect(() => {
    const load = async () => {
      try {
        await db.employees.get(employeeId);
        
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .eq('id', employeeId)
          .single();
        
        if (data) {
          await db.employees.put(data);
          const mapped = mapEmployeeFromSupabase(data);
          setEmp(mapped);
          
          if (data.manager_id) {
            const { data: mgrData } = await supabase
              .from('employees')
              .select('surname, first_name, rank_name')
              .eq('id', data.manager_id)
              .single();
            if (mgrData) setManager(mgrData);
          }

          const [skillsRes, certsRes, docsRes] = await Promise.all([
            supabase.from('employee_skills').select('*').eq('employee_id', employeeId),
            supabase.from('employee_certifications').select('*').eq('employee_id', employeeId),
            supabase.from('employee_documents').select('*').eq('employee_id', employeeId).order('created_at', { ascending: false }),
          ]);
          setSkills(skillsRes.data || []);
          setCertifications(certsRes.data || []);
          setDocuments(docsRes.data || []);
          
          if (mapped.dateOfBirth && mapped.dateOfFirstAppointment) {
            const dob = parseDDMMYYYY(mapped.dateOfBirth);
            const firstAppt = parseDDMMYYYY(mapped.dateOfFirstAppointment);
            
            const age = calculateAge(dob);
            const yearsService = calculateYearsOfService(firstAppt);
            const retirementD = calculateRetirementDate(dob, firstAppt);
            const ageOnEntry = dob && firstAppt ? firstAppt.getFullYear() - dob.getFullYear() : null;
            
            setComputedFields({
              age: age?.toString() || '',
              yearsOfService: yearsService?.toString() || '',
              retirementDate: retirementD ? formatDDMMYYYY(retirementD) : '',
              ageOnEntry: ageOnEntry?.toString() || '',
            });
          }
        } else if (error) {
          console.error('Supabase error:', error);
          setError('Employee not found');
        } else {
          setError('Employee not found');
        }
      } catch (err) {
        console.error('Error loading employee:', err);
        setError('Failed to load employee data');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [employeeId]);

  const handleDocUpload = async (e, empId) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoadingDoc(true);
    try {
      const fileName = `${empId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, file);
      
      let fileUrl = null;
      
      if (!uploadError && uploadData) {
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(fileName);
        fileUrl = publicUrl;
      } else {
        const base64 = await toBase64(file);
        fileUrl = base64;
      }
      
      await supabase.from('employee_documents').insert({
        employee_id: empId,
        document_type: 'other',
        file_name: file.name,
        file_url: fileUrl,
      });
      
      const { data: docs } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', empId)
        .order('created_at', { ascending: false });
      setDocuments(docs || []);
    } catch (err) {
      console.error('Error uploading document:', err);
    } finally {
      setLoadingDoc(false);
    }
  };

  const toBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleDocDelete = async (docId, empId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await supabase.from('employee_documents').delete().eq('id', docId);
      const { data: docs } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', empId)
        .order('created_at', { ascending: false });
      setDocuments(docs || []);
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-600">Loading...</div>;

  if (error) {
    return (
      <div className="p-8">
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-4">
          <p className="text-red-700">{error}</p>
        </div>
        <button onClick={() => navigate('/employees')} className="text-primary underline">
          Back to Employee List
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600 text-lg">Loading employee data...</p>
        </div>
      )}
      {error && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{error}</p>
          <button onClick={() => navigate('/employees')} className="mt-2 text-red-600 underline">
            Go back
          </button>
        </div>
      )}
      {!loading && !error && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={() => navigate('/employees')} className="text-gray-600 hover:text-gray-800">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-3xl font-bold text-gray-800">Employee Details</h1>
            </div>
            <button
              type="button"
              onClick={() => navigate(`/employees/edit/${employeeId}`)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
            >
              <Pencil size={18} /> Edit
            </button>
          </div>

          <div className="space-y-6">
            {/* Avatar */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Employee Photo</h2>

              <div className="flex items-center gap-6">
                {emp.avatar ? (
                  <img
                    src={emp.avatar}
                    alt={`${emp.surname} ${emp.firstName}`}
                    className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <span className="text-3xl font-bold text-gray-400">
                      {emp.surname?.charAt(0)}{emp.firstName?.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="text-lg font-bold text-gray-800">
                    {emp.surname}, {emp.firstName} {emp.middleName}
                  </p>
                  <p className="text-gray-600">{emp.rank} • {emp.department}</p>
                  <p className="text-sm text-gray-500">{emp.fileNumber}</p>
                </div>
              </div>
            </section>

            {/* Section 1: File Number, IPPIS, PSN */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Identification</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="File Number" value={emp.fileNumber} />
                <DetailField label="IPPIS Number" value={emp.ippisNumber} />
                <DetailField label="PSN" value={emp.psn} />
              </div>
            </section>

            {/* Section 2: Personal Info */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Personal Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="Surname" value={emp.surname} />
                <DetailField label="First Name" value={emp.firstName} />
                <DetailField label="Middle Name" value={emp.middleName} />
                <DetailField label="Date of Birth" value={emp.dateOfBirth} />
                <DetailField label="Sex" value={emp.sex} />
                <DetailField label="Phone" value={emp.phone} />
                <DetailField label="Email" value={emp.email} />
              </div>
            </section>

            {/* Section 3: Employment */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Employment Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="Department" value={emp.department} />
                <DetailField label="Cadre" value={emp.cadre} />
                <DetailField label="Rank" value={emp.rank} />
                <DetailField label="Salary Grade Level" value={emp.salaryGradeLevel} />
                <DetailField label="Step" value={emp.step} />
                <DetailField label="Type of Appointment" value={emp.appointmentType} />
                <DetailField label="Date of First Appointment" value={emp.dateOfFirstAppointment} />
                <DetailField label="Date of Confirmation" value={emp.dateOfConfirmation} />
                <DetailField label="Date of Present Appointment" value={emp.dateOfPresentAppointment} />
                <DetailField label="Reports To (Manager)" value={manager ? `${manager.surname}, ${manager.first_name}` : '-'} />
                <DetailField label="Nature of Job" value={emp.natureOfJob} />
              </div>
            </section>

            {/* Section 4: Pension */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Pension Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="PFA Name" value={emp.pfaName} />
                <DetailField label="RSA Pin" value={emp.rsaPin} />
              </div>
            </section>

            {/* Section 5: State of Origin */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">State of Origin</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="State" value={emp.state} />
                <DetailField label="LGA" value={emp.lga} />
                <DetailField label="Geopolitical Zone" value={emp.geopoliticalZone} />
              </div>
            </section>

            {/* Section 6: Additional */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Additional Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <DetailField label="Status" value={emp.status} />
                <DetailField label="Location (Duty Station)" value={emp.location} />
                <DetailField label="Salary Structure" value={emp.salaryStructure} />
                <DetailField label="Qualification" value={emp.qualification} />
                <DetailField label="Reports To (Manager)" value={manager ? `${manager.surname}, ${manager.first_name}` : '-'} />
                <DetailField label="Nature of Job" value={emp.natureOfJob} />
                <div className="md:col-span-3">
                  <DetailField label="Remark" value={emp.remark} />
                </div>
              </div>
            </section>

            {/* Section 7: Skills */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
                <Award size={20} /> Skills
              </h2>

              {skills.length === 0 ? (
                <p className="text-gray-500">No skills added.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {skills.map(skill => (
                    <div key={skill.id} className="p-3 border rounded-lg bg-gray-50">
                      <p className="font-medium text-gray-800">{skill.name}</p>
                      <p className="text-sm text-gray-500">{skill.category} • {skill.level}</p>
                      {skill.date_obtained && (
                        <p className="text-xs text-gray-400">Obtained: {skill.date_obtained}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 8: Certifications */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary flex items-center gap-2">
                <FileText size={20} /> Certifications
              </h2>

              {certifications.length === 0 ? (
                <p className="text-gray-500">No certifications added.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {certifications.map(cert => (
                    <div key={cert.id} className="p-3 border rounded-lg bg-gray-50">
                      <p className="font-medium text-gray-800">{cert.name}</p>
                      <p className="text-sm text-gray-500">{cert.provider} • {cert.status}</p>
                      {cert.date_obtained && (
                        <p className="text-xs text-gray-400">Obtained: {cert.date_obtained}</p>
                      )}
                      {cert.date_expires && (
                        <p className="text-xs text-gray-400">Expires: {cert.date_expires}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 9: Documents */}
            <section className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-primary flex items-center gap-2">
                  <Upload size={20} /> Documents
                </h2>
                <button
                  onClick={() => setShowDocUpload(!showDocUpload)}
                  className="text-sm text-green-600 hover:text-green-700"
                >
                  {showDocUpload ? 'Cancel' : '+ Add Document'}
                </button>
              </div>

              {showDocUpload && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="file"
                    onChange={(e) => handleDocUpload(e, employeeId)}
                    className="w-full text-sm"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                </div>
              )}

              {documents.length === 0 ? (
                <p className="text-gray-500">No documents uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map(doc => (
                    <div key={doc.id} className="p-3 border rounded-lg bg-gray-50 flex items-start">
                      <FileText className="w-8 h-8 text-gray-400 mr-3" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">{doc.file_name}</p>
                        <p className="text-xs text-gray-500 capitalize">{doc.document_type}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-2">
                        {doc.file_url && (
                          <button
                            onClick={() => window.open(doc.file_url, '_blank')}
                            className="p-1 text-gray-400 hover:text-green-600"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDocDelete(doc.id, employeeId)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Section 10: Computed */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Computed Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <DetailField label="Computed Age" value={computedFields.age} />
                <DetailField label="Years of Service" value={computedFields.yearsOfService} />
                <DetailField label="Retirement Date" value={computedFields.retirementDate} />
                <DetailField label="Age on Entry" value={computedFields.ageOnEntry} />
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}