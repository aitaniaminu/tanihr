import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../../db/indexedDB';
import supabase from '../../lib/supabase';

const Field = ({ label, value }) => (
  <div className="py-3 border-b border-gray-100">
    <dt className="text-sm font-medium text-gray-500">{label}</dt>
    <dd className="mt-1 text-sm text-gray-900 font-medium">{value || '-'}</dd>
  </div>
);

export default function EmployeeDetails({ employeeId }) {
  const navigate = useNavigate();
  const [emp, setEmp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
          const mapped = {
            ...data,
            firstName: data.first_name,
            dateOfBirth: data.date_of_birth,
            department: data.department_name,
            rank: data.rank_name,
            fileNumber: data.file_number,
            dateOfFirstAppointment: data.date_of_first_appointment,
            dateOfConfirmation: data.date_of_confirmation,
            dateOfPresentAppointment: data.date_of_present_appointment,
            salaryGradeLevel: data.salary_grade_level,
            appointmentType: data.appointment_type,
            pfaName: data.pfa_name,
            rsaPin: data.rsa_pin,
            state: data.state_of_origin,
            lga: data.lga,
            geopoliticalZone: data.geopolitical_zone,
            avatar: data.avatar_url,
          };
          setEmp(mapped);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Employee Details</h1>
        <div className="space-x-3">
          <button onClick={() => navigate('/employees')} className="px-4 py-2 text-gray-600 hover:text-gray-800">
            Back to List
          </button>
          <button
            onClick={() => navigate(`/employees/edit/${employeeId}`)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition"
          >
            Edit
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-green-600 to-green-700 text-white">
          <div className="flex items-center">
            {emp.avatar ? (
              <img
                src={emp.avatar}
                alt={`${emp.surname} ${emp.firstName}`}
                className="w-20 h-20 rounded-full object-cover border-2 border-white border-opacity-30 mr-6"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white bg-opacity-20 flex items-center justify-center text-3xl font-bold mr-6">
                {emp.surname?.charAt(0)}
                {emp.firstName?.charAt(0)}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold">
                {emp.surname}, {emp.firstName} {emp.middleName}
              </h2>
              <p className="text-green-100">
                {emp.rank} • {emp.department}
              </p>
              <p className="text-green-100 text-sm">{emp.fileNumber}</p>
            </div>
          </div>
        </div>

        <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Personal Information</h3>
            <dl>
              <Field label="Date of Birth" value={emp.dateOfBirth} />
              <Field label="Sex" value={emp.sex} />
              <Field label="Phone" value={emp.phone} />
              <Field label="Email" value={emp.email} />
              <Field label="State of Origin" value={emp.state} />
              <Field label="LGA" value={emp.lga} />
              <Field label="Geopolitical Zone" value={emp.geopoliticalZone} />
            </dl>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Service Information</h3>
            <dl>
              <Field label="Date of First Appointment" value={emp.dateOfFirstAppointment} />
              <Field label="Date of Present Appointment" value={emp.dateOfPresentAppointment} />
              <Field label="Appointment Type" value={emp.appointmentType} />
              <Field label="Salary Grade Level" value={emp.salaryGradeLevel} />
              <Field label="Step" value={emp.step} />
              <Field label="PFA" value={emp.pfaName} />
              <Field label="RSA PIN" value={emp.rsaPin} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
