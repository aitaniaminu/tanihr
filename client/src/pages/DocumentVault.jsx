import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Upload, FileText, Image, File, Trash2, Download, Eye, X } from 'lucide-react';

const DOC_TYPES = [
  { value: 'certificate', label: 'Certificate', icon: FileText },
  { value: 'id_card', label: 'ID Card', icon: Image },
  { value: 'contract', label: 'Contract', icon: File },
  { value: 'cv', label: 'CV/Resume', icon: FileText },
  { value: 'other', label: 'Other', icon: File },
];

export default function DocumentVault() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [documents, setDocuments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedEmployee) {
      loadDocuments(selectedEmployee);
    } else {
      setDocuments([]);
    }
  }, [selectedEmployee]);

  const loadData = async () => {
    try {
      const emps = await db.employees.toArray();
      setEmployees(emps);
      if (emps.length > 0) {
        setSelectedEmployee(emps[0].id);
      }
    } catch (err) {
      console.error('Error loading employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async (empId) => {
    try {
      const docs = await db.documents.where('employeeId').equals(empId).toArray();
      setDocuments(docs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt)));
    } catch (err) {
      console.error('Error loading documents:', err);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !selectedEmployee) return;

    setUploading(true);
    try {
      const docType = e.target.dataset.type || 'other';
      const base64 = await toBase64(file);
      
      await db.documents.add({
        employeeId: selectedEmployee,
        type: docType,
        fileName: file.name,
        fileType: file.type,
        fileData: base64,
        uploadedAt: new Date().toISOString(),
        uploadedBy: user?.username || 'admin',
      });

      await logAudit(selectedEmployee, 'document_upload', '', file.name, user?.username);
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
      await db.documents.delete(docId);
      await loadDocuments(selectedEmployee);
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const logAudit = async (empId, field, oldVal, newVal, changedBy) => {
    try {
      await db.auditLog.add({
        employeeId: empId,
        field,
        oldValue: oldVal,
        newValue: newVal,
        changedAt: new Date().toISOString(),
        changedBy: changedBy || 'system',
      });
    } catch (err) {
      console.error('Audit log error:', err);
    }
  };

  const getIcon = (type) => {
    const docType = DOC_TYPES.find(t => t.value === type);
    return docType?.icon || File;
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-600">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800">Document Vault</h1>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Employee
        </label>
        <select
          value={selectedEmployee || ''}
          onChange={(e) => setSelectedEmployee(Number(e.target.value))}
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
          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Upload Document</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {DOC_TYPES.map(type => (
                <label
                  key={type.value}
                  className="flex flex-col items-center p-4 border-2 border-dashed rounded-lg cursor-pointer hover:border-green-500 hover:bg-green-50 transition"
                >
                  <input
                    type="file"
                    className="hidden"
                    data-type={type.value}
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <type.icon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-sm text-gray-600 text-center">{type.label}</span>
                </label>
              ))}
            </div>
            {uploading && (
              <p className="mt-4 text-sm text-gray-600">Uploading...</p>
            )}
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Uploaded Documents</h2>
            {documents.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No documents uploaded yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map(doc => {
                  const Icon = getIcon(doc.type);
                  return (
                    <div
                      key={doc.id}
                      className="flex items-start p-4 border rounded-lg hover:shadow-md transition"
                    >
                      <Icon className="w-10 h-10 text-gray-400 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {doc.fileName}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">
                          {DOC_TYPES.find(t => t.value === doc.type)?.label || doc.type}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(doc.uploadedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2 ml-2">
                        <button
                          onClick={() => setPreviewDoc(doc)}
                          className="p-1 text-gray-400 hover:text-green-600"
                          title="Preview"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-1 text-gray-400 hover:text-red-600"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {previewDoc && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="font-semibold text-gray-800">{previewDoc.fileName}</h3>
              <button
                onClick={() => setPreviewDoc(null)}
                className="p-2 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {previewDoc.fileType?.startsWith('image/') || previewDoc.fileName.match(/\.(jpg|jpeg|png)$/i) ? (
                <img
                  src={previewDoc.fileData}
                  alt={previewDoc.fileName}
                  className="max-w-full h-auto"
                />
              ) : previewDoc.fileType === 'application/pdf' || previewDoc.fileName.match(/\.pdf$/i) ? (
                <iframe
                  src={previewDoc.fileData}
                  className="w-full h-[70vh]"
                  title={previewDoc.fileName}
                />
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <File className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>Preview not available</p>
                  <a
                    href={previewDoc.fileData}
                    download={previewDoc.fileName}
                    className="mt-4 inline-block px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Download
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}