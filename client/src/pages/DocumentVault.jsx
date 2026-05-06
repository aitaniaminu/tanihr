import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, Image, File, Trash2, Eye, X, User } from 'lucide-react';

const DOC_TYPES = [
  { value: 'certificate', label: 'Certificate' },
  { value: 'id_card', label: 'ID Card' },
  { value: 'contract', label: 'Contract' },
  { value: 'cv', label: 'CV/Resume' },
  { value: 'other', label: 'Other' },
];

export default function DocumentVault() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    loadEmployees();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadDocuments(selectedEmployee);
    } else {
      setDocuments([]);
    }
  }, [selectedEmployee]);

  const loadEmployees = async () => {
    try {
      const { data } = await supabase
        .from('employees')
        .select('id, surname, first_name, file_number')
        .order('surname');
      setEmployees(data || []);
      if (data?.length > 0) {
        setSelectedEmployee(data[0].id);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (empId) => {
    try {
      console.log('Loading documents for employee:', empId);
      const { data, error } = await supabase
        .from('employee_documents')
        .select('*')
        .eq('employee_id', empId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error loading documents:', error);
      }
      console.log('Documents loaded:', data);
      setDocuments(data || []);
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEmployee) return;

setUploading(true);
    try {
      let fileUrl = null;
      const fileName = `${selectedEmployee}/${Date.now()}_${file.name}`;
      
      try {
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(fileName, file);
        
        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(fileName);
          fileUrl = publicUrl;
        } else {
          throw new Error('Storage not available');
        }
      } catch (storageErr) {
        console.log('Using base64 fallback:', storageErr.message);
        const base64 = await toBase64(file);
        fileUrl = base64;
      }
      
      const { error: insertError } = await supabase.from('employee_documents').insert({
        employee_id: selectedEmployee,
        document_type: docType,
        file_name: file.name,
        file_url: fileUrl,
        file_data: fileUrl.startsWith('data:') ? fileUrl : null,
      });
      
      if (insertError) {
        console.error('Insert error:', insertError);
        alert('Error saving: ' + insertError.message);
        return;
      }
      
      await loadDocuments(selectedEmployee);
    } catch (err) {
      console.error('Error uploading file:', err);
    } finally {
      setUploading(false);
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

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await supabase.from('employee_documents').delete().eq('id', docId);
      await loadDocuments(selectedEmployee);
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const selectedEmpData = employees.find(e => e.id === selectedEmployee);

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Document Vault</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Employee
        </label>
        <select
          value={selectedEmployee || ''}
          onChange={(e) => {
            console.log('Selected employee:', e.target.value);
            setSelectedEmployee(e.target.value);
          }}
          className="w-full md:w-1/2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          <option value="">-- Select Employee --</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.surname}, {emp.first_name} ({emp.file_number})
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <>
          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <div className="flex items-center gap-4 mb-4">
              <User className="w-8 h-8 text-gray-400" />
              <div>
                <h2 className="text-lg font-semibold text-gray-800">
                  {selectedEmpData?.surname}, {selectedEmpData?.first_name}
                </h2>
                <p className="text-sm text-gray-500">{selectedEmpData?.file_number}</p>
              </div>
            </div>

            <h3 className="text-md font-semibold text-gray-700 mb-4">Upload Document</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {DOC_TYPES.map(type => (
                <label
                  key={type.value}
                  className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
                >
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, type.value)}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    disabled={uploading}
                  />
                  <FileText className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 text-center">{type.label}</span>
                </label>
              ))}
            </div>
            {uploading && (
              <p className="mt-4 text-sm text-gray-600">Uploading...</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-4 sm:p-6">
            <h3 className="text-md font-semibold text-gray-700 mb-4">Uploaded Documents</h3>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => (
                  <div
                    key={doc.id}
                    className="flex items-start p-4 border rounded-lg hover:shadow-md transition"
                  >
                    <FileText className="w-10 h-10 text-gray-400 mr-3 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {doc.file_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {DOC_TYPES.find(t => t.value === doc.document_type)?.label || doc.document_type}
                      </p>
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
                        onClick={() => handleDelete(doc.id)}
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
          </div>
        </>
      )}
    </div>
  );
}