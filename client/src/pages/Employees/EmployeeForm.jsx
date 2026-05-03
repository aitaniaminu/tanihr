import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, Save, Camera, X, FileText } from 'lucide-react';
import {
  formatDDMMYYYY,
  parseDDMMYYYY,
  toISODate,
  calculateAge,
  isAtLeast18Years,
} from '../../utils/dateHelpers';
import {
  nigerianStates,
  getLGAsForState,
  getGeoPoliticalZone,
  defaultPFAs,
  defaultDepartments,
  defaultRanks,
  defaultSalaryStructures,
  defaultSites,
} from '../../data/nigerianData';

const EmployeeForm = ({ employee, employeeId, onBack }) => {
  const isEdit = !!employeeId || !!employee?.id;
  const [loading, setLoading] = useState(isEdit);
  const [fetchError, setFetchError] = useState(null);
  const [updateId, setUpdateId] = useState(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fileNumber: '',
    ippisNumber: '',
    psn: '',
    surname: '',
    firstName: '',
    middleName: '',
    dateOfBirth: '',
    sex: '',
    phone: '',
    department: '',
    cadre: '',
    rank: '',
    salaryGradeLevel: '',
    step: '',
    appointmentType: 'Permanent',
    dateOfFirstAppointment: '',
    dateOfConfirmation: '',
    dateOfPresentAppointment: '',
    pfaName: '',
    rsaPin: '',
    email: '',
    state: '',
    lga: '',
    geopoliticalZone: '',
    remark: '',
    status: 'Active',
    location: '',
    qualification: '',
    natureOfJob: '',
    salaryStructure: '',
    managerId: '',
  });

  const [errors, setErrors] = useState({});
  const [lgas, setLgas] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [ranks, setRanks] = useState([]);
  const [pfas, setPfas] = useState([]);
  const [salaryStructures, setSalaryStructures] = useState([]);
  const [managers, setManagers] = useState([]);
  const [sites, setSites] = useState([]);
  const [computedFields, setComputedFields] = useState({
    age: '',
    yearsOfService: '',
  });
  const [avatarPreview, setAvatarPreview] = useState('');

  const MAX_AVATAR_SIZE = 500 * 1024; // 500KB

  useEffect(() => {
    loadReferenceData();
    if (employee?.id) {
      loadEmployeeData();
      setLoading(false);
    } else if (employeeId) {
      fetchEmployeeById(employeeId);
    }
  }, []);

  useEffect(() => {
    if (formData.state) {
      setLgas(getLGAsForState(formData.state));
      const zone = getGeoPoliticalZone(formData.state);
      if (!formData.geopoliticalZone && zone) {
        setFormData((prev) => ({ ...prev, geopoliticalZone: zone }));
      }
    }
  }, [formData.state]);

  useEffect(() => {
    computeRetirementAndAge();
  }, [formData.dateOfBirth, formData.dateOfFirstAppointment]);

  const loadReferenceData = async () => {
    try {
      const [deptsRes, rksRes, pfAsRes, salRes, empsRes] = await Promise.all([
        supabase.from('departments').select('name'),
        supabase.from('ranks').select('name'),
        supabase.from('pfas').select('name'),
        supabase.from('salary_structures').select('name'),
        supabase.from('employees').select('id, file_number, surname, first_name, rank_name'),
      ]);

      setDepartments(deptsRes.data?.map(d => d.name) || []);
      setRanks(rksRes.data?.map(r => r.name) || []);
      setPfas(pfAsRes.data?.map(p => p.name) || []);
      setSalaryStructures(salRes.data?.map(s => s.name) || []);
      setManagers(empsRes.data || []);
      setSites(defaultSites);
    } catch (error) {
      console.error('Error loading reference data:', error);
    }
  };

  const fetchEmployeeById = async (id) => {
    try {
      console.log('Fetching employee with id:', id);
      const { data: emp, error } = await supabase
        .from('employees')
        .select('*')
        .eq('id', id)
        .single();

      console.log('Query result:', { emp, error });

      if (error || !emp) {
        setFetchError('Employee not found');
        setLoading(false);
        return;
      }

      setUpdateId(emp.id);
      setFormData({
        fileNumber: emp.file_number || '',
        ippisNumber: emp.ippis_number || '',
        psn: emp.psn || '',
        surname: emp.surname || '',
        firstName: emp.first_name || '',
        middleName: emp.middle_name || '',
        dateOfBirth: formatDDMMYYYY(emp.date_of_birth),
        sex: emp.sex || '',
        phone: emp.phone || '',
        department: emp.department_name || '',
        cadre: emp.cadre || '',
        rank: emp.rank_name || '',
        salaryGradeLevel: emp.salary_grade_level || '',
        step: emp.step?.toString() || '',
        appointmentType: emp.appointment_type || 'Permanent',
        dateOfFirstAppointment: formatDDMMYYYY(emp.date_of_first_appointment),
        dateOfConfirmation: formatDDMMYYYY(emp.date_of_confirmation),
        dateOfPresentAppointment: formatDDMMYYYY(emp.date_of_present_appointment),
        pfaName: emp.pfa_name || '',
        rsaPin: emp.rsa_pin || '',
        email: emp.email || '',
        state: emp.state_of_origin || '',
        lga: emp.lga || '',
        geopoliticalZone: emp.geopolitical_zone || '',
        remark: emp.remark || '',
        status: emp.status || 'Active',
        location: emp.location || '',
        qualification: emp.qualification || '',
        natureOfJob: emp.nature_of_job || '',
        salaryStructure: emp.salary_structure || '',
        managerId: emp.manager_id || '',
      });
      setAvatarPreview(emp.avatar_url || '');
    } catch (error) {
      console.error('Error loading employee:', error);
      setFetchError('Failed to load employee data');
    } finally {
      setLoading(false);
    }
  };

  const loadEmployeeData = () => {
    if (employee?.id) {
      setUpdateId(employee.id);
    }
    setFormData({
      fileNumber: employee.fileNumber || '',
      ippisNumber: employee.ippisNumber || '',
      psn: employee.psn || '',
      surname: employee.surname || '',
      firstName: employee.firstName || '',
      middleName: employee.middleName || '',
      dateOfBirth: formatDDMMYYYY(employee.dateOfBirth),
      sex: employee.sex || '',
      phone: employee.phone || '',
      department: employee.department || '',
      cadre: employee.cadre || '',
      rank: employee.rank || '',
      salaryGradeLevel: employee.salaryGradeLevel || '',
      step: employee.step?.toString() || '',
      appointmentType: employee.appointmentType || 'Permanent',
      dateOfFirstAppointment: formatDDMMYYYY(employee.dateOfFirstAppointment),
      dateOfConfirmation: formatDDMMYYYY(employee.dateOfConfirmation),
      dateOfPresentAppointment: formatDDMMYYYY(employee.dateOfPresentAppointment),
      pfaName: employee.pfaName || '',
      rsaPin: employee.rsaPin || '',
      email: employee.email || '',
      state: employee.state || '',
      lga: employee.lga || '',
      geopoliticalZone: employee.geopoliticalZone || '',
      remark: employee.remark || '',
      status: employee.status || 'Active',
      location: employee.location || '',
      qualification: employee.qualification || '',
      natureOfJob: employee.natureOfJob || '',
      salaryStructure: employee.salaryStructure || '',
      managerId: employee.managerId || '',
    });
    setAvatarPreview(employee.avatar || '');
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file.');
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      alert('Image must be smaller than 500KB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatarPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const removeAvatar = () => {
    setAvatarPreview('');
  };

  const computeRetirementAndAge = () => {
    const dob = parseDDMMYYYY(formData.dateOfBirth);
    const firstAppt = parseDDMMYYYY(formData.dateOfFirstAppointment);

    if (dob) {
      const age = calculateAge(dob);
      setComputedFields((prev) => ({ ...prev, age: age?.toString() || '' }));
    }

    if (firstAppt) {
      const today = new Date();
      const startD = firstAppt;
      let years = today.getFullYear() - startD.getFullYear();
      const monthDiff = today.getMonth() - startD.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < startD.getDate())) years--;
      setComputedFields((prev) => ({ ...prev, yearsOfService: Math.max(0, years)?.toString() || '' }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fileNumber.trim()) newErrors.fileNumber = 'File Number is required';
    if (!formData.surname.trim()) newErrors.surname = 'Surname is required';
    if (!formData.firstName.trim()) newErrors.firstName = 'First Name is required';

    const dob = parseDDMMYYYY(formData.dateOfBirth);
    if (!dob) {
      newErrors.dateOfBirth = 'Valid Date of Birth is required (DD-MM-YYYY)';
    } else if (!isAtLeast18Years(dob)) {
      newErrors.dateOfBirth = 'Employee must be at least 18 years old';
    }

    if (!formData.sex) newErrors.sex = 'Sex is required';
    if (!formData.department.trim()) newErrors.department = 'Department is required';
    if (!formData.rank.trim()) newErrors.rank = 'Rank is required';
    if (!formData.salaryGradeLevel.trim()) newErrors.salaryGradeLevel = 'Salary Grade Level is required';
    if (!formData.appointmentType) newErrors.appointmentType = 'Type of Appointment is required';

    const firstAppt = parseDDMMYYYY(formData.dateOfFirstAppointment);
    if (!firstAppt) {
      newErrors.dateOfFirstAppointment = 'Valid Date of First Appointment is required (DD-MM-YYYY)';
    } else if (dob && firstAppt <= dob) {
      newErrors.dateOfFirstAppointment = 'First Appointment must be after Date of Birth';
    }

    const presentAppt = parseDDMMYYYY(formData.dateOfPresentAppointment);
    if (!presentAppt) {
      newErrors.dateOfPresentAppointment = 'Valid Date of Present Appointment is required (DD-MM-YYYY)';
    } else if (firstAppt && presentAppt < firstAppt) {
      newErrors.dateOfPresentAppointment = 'Present Appointment cannot be before First Appointment';
    }

    if (!formData.state.trim()) newErrors.state = 'State is required';
    if (!formData.lga.trim()) newErrors.lga = 'LGA is required';
    if (!formData.status) newErrors.status = 'Status is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});

    // Validate required fields
    const required = ['fileNumber', 'surname', 'firstName', 'dateOfBirth', 'sex', 'department', 'rank', 'salaryGradeLevel', 'appointmentType', 'dateOfFirstAppointment', 'dateOfPresentAppointment', 'state', 'lga'];
    const newErrors = {};
    required.forEach(field => {
      if (!formData[field]) newErrors[field] = 'Required';
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const employeeData = {
      file_number: formData.fileNumber,
      ippis_number: formData.ippisNumber || null,
      psn: formData.psn || null,
      surname: formData.surname,
      first_name: formData.firstName,
      middle_name: formData.middleName || null,
      date_of_birth: toISODate(formData.dateOfBirth),
      sex: formData.sex,
      phone: formData.phone || null,
      email: formData.email || null,
      department_name: formData.department || null,
      cadre: formData.cadre || null,
      rank_name: formData.rank || null,
      salary_grade_level: formData.salaryGradeLevel || null,
      step: formData.step?.toString() || null,
      appointment_type: formData.appointmentType,
      date_of_first_appointment: toISODate(formData.dateOfFirstAppointment),
      date_of_confirmation: formData.dateOfConfirmation ? toISODate(formData.dateOfConfirmation) : null,
      date_of_present_appointment: toISODate(formData.dateOfPresentAppointment),
      pfa_name: formData.pfaName || null,
      rsa_pin: formData.rsaPin || null,
      state_of_origin: formData.state,
      lga: formData.lga,
      geopolitical_zone: formData.geopoliticalZone || null,
      remark: formData.remark || null,
      status: formData.status,
      location: formData.location || null,
      qualification: formData.qualification || null,
      nature_of_job: formData.natureOfJob || null,
      salary_structure: formData.salaryStructure || null,
      avatar_url: avatarPreview || null,
      updated_at: new Date().toISOString(),
    };

    try {
      // Auto-create references in Supabase
      if (formData.department && !departments.includes(formData.department)) {
        await supabase.from('departments').upsert({ name: formData.department }, { onConflict: 'name' });
      }
      
      if (formData.rank && !ranks.includes(formData.rank)) {
        const level = parseInt(String(formData.rank).replace(/\D/g,'')) || 1;
        await supabase.from('ranks').upsert({ name: formData.rank, level }, { onConflict: 'name' });
      }
      
      if (formData.pfaName && !pfas.includes(formData.pfaName)) {
        await supabase.from('pfas').upsert({ name: formData.pfaName }, { onConflict: 'name' });
      }
      
      if (formData.salaryStructure && !salaryStructures.includes(formData.salaryStructure)) {
        await supabase.from('salary_structures').upsert({ name: formData.salaryStructure }, { onConflict: 'name' });
      }

if (isEdit) {
        const { error } = await supabase
          .from('employees')
          .update(employeeData)
          .eq('id', updateId);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('employees')
          .insert(employeeData);
        
        if (error) throw error;
      }

      onBack();
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(`Error saving employee: ${error.message}`);
    }
  };

  const inputClass = (fieldName) =>
    `w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${errors[fieldName] ? 'border-red-500' : ''}`;
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {loading && (
        <div className="flex items-center justify-center min-h-screen">
          <p className="text-gray-600 text-lg">Loading employee data...</p>
        </div>
      )}
      {fetchError && (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
          <p className="text-red-700">{fetchError}</p>
          <button onClick={onBack} className="mt-2 text-red-600 underline">
            Go back
          </button>
        </div>
      )}
      {!loading && !fetchError && (
        <>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <button onClick={onBack} className="text-gray-600 hover:text-gray-800">
                <ArrowLeft size={24} />
              </button>
              <h1 className="text-3xl font-bold text-gray-800">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
            </div>
            {isEdit && (
              <button
                type="button"
                onClick={() => navigate('/documents')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition flex items-center gap-2"
              >
                <FileText size={18} /> Documents
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar upload */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Employee Photo</h2>

              <div className="flex items-center gap-6">
                <div className="relative">
                  {avatarPreview ? (
                    <div className="relative">
                      <img
                        src={avatarPreview}
                        alt="Employee avatar preview"
                        className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                        aria-label="Remove photo"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                      <Camera size={28} className="text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 cursor-pointer bg-primary text-white px-4 py-2 rounded-lg hover:bg-green-700 inline-block">
                    Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      aria-label="Upload photo"
                    />
                  </label>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG or GIF. Max 500KB.</p>
                </div>
              </div>
            </section>

            {/* Section 1: File Number, IPPIS, PSN */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Identification</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>File Number *</label>
                  <input
                    type="text"
                    name="fileNumber"
                    value={formData.fileNumber}
                    onChange={handleChange}
                    className={inputClass('fileNumber')}
                  />
                  {errors.fileNumber && <p className="text-red-500 text-xs mt-1">{errors.fileNumber}</p>}
                </div>
                <div>
                  <label className={labelClass}>IPPIS Number</label>
                  <input
                    type="text"
                    name="ippisNumber"
                    value={formData.ippisNumber}
                    onChange={handleChange}
                    className={inputClass('ippisNumber')}
                  />
                </div>
                <div>
                  <label className={labelClass}>PSN</label>
                  <input
                    type="text"
                    name="psn"
                    value={formData.psn}
                    onChange={handleChange}
                    className={inputClass('psn')}
                  />
                </div>
              </div>
            </section>

            {/* Section 2: Personal Info - Name, DOB, Sex, Phone */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Personal Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Surname *</label>
                  <input
                    type="text"
                    name="surname"
                    value={formData.surname}
                    onChange={handleChange}
                    className={inputClass('surname')}
                  />
                  {errors.surname && <p className="text-red-500 text-xs mt-1">{errors.surname}</p>}
                </div>
                <div>
                  <label className={labelClass}>First Name *</label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={inputClass('firstName')}
                  />
                  {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                </div>
                <div>
                  <label className={labelClass}>Middle Name</label>
                  <input
                    type="text"
                    name="middleName"
                    value={formData.middleName}
                    onChange={handleChange}
                    className={inputClass('middleName')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date of Birth *</label>
                  <input
                    type="text"
                    name="dateOfBirth"
                    value={formData.dateOfBirth}
                    onChange={handleChange}
                    placeholder="DD-MM-YYYY"
                    className={inputClass('dateOfBirth')}
                  />
                  {errors.dateOfBirth && <p className="text-red-500 text-xs mt-1">{errors.dateOfBirth}</p>}
                </div>
                <div>
                  <label className={labelClass}>Sex *</label>
                  <select name="sex" value={formData.sex} onChange={handleChange} className={inputClass('sex')}>
                    <option value="">Select</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                  {errors.sex && <p className="text-red-500 text-xs mt-1">{errors.sex}</p>}
                </div>
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass('phone')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass('email')}
                  />
                </div>
              </div>
            </section>

            {/* Section 3: Employment - Department, Cadre, Rank, Salary */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Employment Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Department *</label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    list="departments-list"
                    className={inputClass('department')}
                  />
                  <datalist id="departments-list">
                    {departments.map((d) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                  {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                </div>
                <div>
                  <label className={labelClass}>Cadre</label>
                  <input
                    type="text"
                    name="cadre"
                    value={formData.cadre}
                    onChange={handleChange}
                    className={inputClass('cadre')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Rank *</label>
                  <input
                    type="text"
                    name="rank"
                    value={formData.rank}
                    onChange={handleChange}
                    list="ranks-list"
                    className={inputClass('rank')}
                  />
                  <datalist id="ranks-list">
                    {ranks.map((r) => (
                      <option key={r} value={r} />
                    ))}
                  </datalist>
                  {errors.rank && <p className="text-red-500 text-xs mt-1">{errors.rank}</p>}
                </div>
                <div>
                  <label className={labelClass}>Salary Grade Level *</label>
                  <input
                    type="text"
                    name="salaryGradeLevel"
                    value={formData.salaryGradeLevel}
                    onChange={handleChange}
                    className={inputClass('salaryGradeLevel')}
                  />
                  {errors.salaryGradeLevel && <p className="text-red-500 text-xs mt-1">{errors.salaryGradeLevel}</p>}
                </div>
                <div>
                  <label className={labelClass}>Step</label>
                  <input
                    type="number"
                    name="step"
                    value={formData.step}
                    onChange={handleChange}
                    min="1"
                    max="17"
                    className={inputClass('step')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Type of Appointment *</label>
                  <select
                    name="appointmentType"
                    value={formData.appointmentType}
                    onChange={handleChange}
                    className={inputClass('appointmentType')}
                  >
                    <option value="Permanent">Permanent</option>
                    <option value="Contract">Contract</option>
                    <option value="Temporary">Temporary</option>
                  </select>
                  {errors.appointmentType && <p className="text-red-500 text-xs mt-1">{errors.appointmentType}</p>}
                </div>
                <div>
                  <label className={labelClass}>Date of First Appointment *</label>
                  <input
                    type="text"
                    name="dateOfFirstAppointment"
                    value={formData.dateOfFirstAppointment}
                    onChange={handleChange}
                    placeholder="DD-MM-YYYY"
                    className={inputClass('dateOfFirstAppointment')}
                  />
                  {errors.dateOfFirstAppointment && (
                    <p className="text-red-500 text-xs mt-1">{errors.dateOfFirstAppointment}</p>
                  )}
                </div>
                <div>
                  <label className={labelClass}>Date of Confirmation</label>
                  <input
                    type="text"
                    name="dateOfConfirmation"
                    value={formData.dateOfConfirmation}
                    onChange={handleChange}
                    placeholder="DD-MM-YYYY"
                    className={inputClass('dateOfConfirmation')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Date of Present Appointment *</label>
                  <input
                    type="text"
                    name="dateOfPresentAppointment"
                    value={formData.dateOfPresentAppointment}
                    onChange={handleChange}
                    placeholder="DD-MM-YYYY"
                    className={inputClass('dateOfPresentAppointment')}
                  />
                  {errors.dateOfPresentAppointment && (
                    <p className="text-red-500 text-xs mt-1">{errors.dateOfPresentAppointment}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Section 4: Pension - PFA, RSA */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Pension Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>PFA Name</label>
                  <input
                    type="text"
                    name="pfaName"
                    value={formData.pfaName}
                    onChange={handleChange}
                    list="pfas-list"
                    className={inputClass('pfaName')}
                  />
                  <datalist id="pfas-list">
                    {pfas.map((p) => (
                      <option key={p} value={p} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={labelClass}>RSA Pin</label>
                  <input
                    type="text"
                    name="rsaPin"
                    value={formData.rsaPin}
                    onChange={handleChange}
                    className={inputClass('rsaPin')}
                  />
                </div>
              </div>
            </section>

            {/* Section 5: Origin - State, LGA, Zone */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">State of Origin</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>State *</label>
                  <select name="state" value={formData.state} onChange={handleChange} className={inputClass('state')}>
                    <option value="">Select State</option>
                    {nigerianStates.map((s) => (
                      <option key={s.name} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>
                <div>
                  <label className={labelClass}>LGA *</label>
                  <select
                    name="lga"
                    value={formData.lga}
                    onChange={handleChange}
                    className={inputClass('lga')}
                    disabled={!formData.state}
                  >
                    <option value="">Select LGA</option>
                    {lgas.map((l) => (
                      <option key={l} value={l}>
                        {l}
                      </option>
                    ))}
                  </select>
                  {errors.lga && <p className="text-red-500 text-xs mt-1">{errors.lga}</p>}
                </div>
                <div>
                  <label className={labelClass}>Geopolitical Zone</label>
                  <input
                    type="text"
                    name="geopoliticalZone"
                    value={formData.geopoliticalZone}
                    onChange={handleChange}
                    className={inputClass('geopoliticalZone')}
                  />
                </div>
              </div>
            </section>

            {/* Section 6: Additional - Status, Location, Qualification, Job, Salary Structure, Remark */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Additional Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={labelClass}>Status *</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className={inputClass('status')}
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Retired">Retired</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                  {errors.status && <p className="text-red-500 text-xs mt-1">{errors.status}</p>}
                </div>
                <div>
                  <label className={labelClass}>Location (Duty Station)</label>
                  <select
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    className={inputClass('location')}
                  >
                    <option value="">-- Select Location --</option>
                    {sites.map(site => (
                      <option key={site} value={site}>{site}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Salary Structure</label>
                  <input
                    type="text"
                    name="salaryStructure"
                    value={formData.salaryStructure}
                    onChange={handleChange}
                    list="salary-structures-list"
                    className={inputClass('salaryStructure')}
                  />
                  <datalist id="salary-structures-list">
                    {salaryStructures.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                </div>
                <div>
                  <label className={labelClass}>Qualification</label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleChange}
                    className={inputClass('qualification')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Nature of Job</label>
                  <input
                    type="text"
                    name="natureOfJob"
                    value={formData.natureOfJob}
                    onChange={handleChange}
                    className={inputClass('natureOfJob')}
                  />
                </div>
                <div>
                  <label className={labelClass}>Reports To (Manager)</label>
                  <select
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleChange}
                    className={inputClass('managerId')}
                  >
                    <option value="">-- No Manager --</option>
                    {managers
                      .filter(m => m.id !== updateId)
                      .map(m => (
                        <option key={m.id} value={m.id}>
                          {m.surname}, {m.first_name} ({m.rank_name || 'No rank'})
                        </option>
                      ))}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className={labelClass}>Remark</label>
                  <textarea
                    name="remark"
                    value={formData.remark}
                    onChange={handleChange}
                    rows="3"
                    className={inputClass('remark')}
                  />
                </div>
              </div>
            </section>

            {/* Section 7: Computed Fields */}
            <section className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4 text-primary">Computed Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <label className={labelClass}>Computed Age</label>
                  <input
                    type="text"
                    value={computedFields.age}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  />
                </div>
                <div>
                  <label className={labelClass}>Years of Service</label>
                  <input
                    type="text"
                    value={computedFields.yearsOfService}
                    disabled
                    className="w-full px-3 py-2 border rounded-lg bg-gray-100"
                  />
                </div>
              </div>
            </section>

            <div className="flex justify-end gap-4">
              <button type="button" onClick={onBack} className="px-6 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                type="submit"
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
              >
                <Save size={20} />
                {isEdit ? 'Update Employee' : 'Create Employee'}
              </button>
            </div>
            {isEdit && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => navigate('/documents')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <FileText size={20} /> Manage Employee Documents
                </button>
              </div>
            )}
          </form>
        </>
      )}
    </div>
  );
};

export default EmployeeForm;
