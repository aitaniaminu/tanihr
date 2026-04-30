import React, { useState } from 'react';
import { Upload, Download, CheckCircle, XCircle, FileText } from 'lucide-react';
import { downloadTemplate, parseCSV, validateAndImport, importValidRecords } from '../../utils/csvValidator';

const ImportEmployees = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Preview, 3: Summary
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState([]);
  const [validationResults, setValidationResults] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Check file size (max 15MB)
    if (selectedFile.size > 15 * 1024 * 1024) {
      alert('File size exceeds 15MB limit');
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);

    try {
      const data = await parseCSV(selectedFile);
      setParsedData(data);
      
      // Validate the data
      const results = await validateAndImport(data);
      setValidationResults(results);
      setStep(2);
    } catch (error) {
      console.error('Error parsing CSV:', error);
      alert('Error parsing CSV file. Please check the format.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    if (!validationResults?.valid.length) return;

    setIsProcessing(true);
    try {
      const autoCreatedRefs = await importValidRecords(validationResults.valid);
      setImportSummary({
        successCount: validationResults.valid.length,
        errorCount: validationResults.invalid.length,
        autoCreatedReferences: autoCreatedRefs
      });
      setStep(3);
    } catch (error) {
      console.error('Error importing records:', error);
      alert('Error importing records. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetImport = () => {
    setStep(1);
    setFile(null);
    setParsedData([]);
    setValidationResults(null);
    setImportSummary(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Import Employees from CSV</h1>

      {/* Step Indicator */}
      <div className="flex items-center mb-8">
        <div className={`flex items-center ${step >= 1 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
            1
          </div>
          <span className="ml-2">Upload</span>
        </div>
        <div className={`flex-1 h-0.5 mx-4 ${step >= 2 ? 'bg-primary' : 'bg-gray-300'}`} />
        <div className={`flex items-center ${step >= 2 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
            2
          </div>
          <span className="ml-2">Validate & Preview</span>
        </div>
        <div className={`flex-1 h-0.5 mx-4 ${step >= 3 ? 'bg-primary' : 'bg-gray-300'}`} />
        <div className={`flex items-center ${step >= 3 ? 'text-primary' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-primary bg-primary text-white' : 'border-gray-300'}`}>
            3
          </div>
          <span className="ml-2">Summary</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center">
            <FileText className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold mb-2">Upload Employee CSV File</h2>
            <p className="text-gray-600 mb-6">
              Download the template, fill in employee data, and upload for bulk import.
            </p>
            
            <div className="flex justify-center gap-4 mb-6">
              <button
                onClick={downloadTemplate}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 flex items-center gap-2"
              >
                <Download size={20} />
                Download Template
              </button>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={isProcessing}
                className="hidden"
                id="csv-upload"
              />
              <label htmlFor="csv-upload" className="cursor-pointer">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <p className="text-gray-600">Click to select CSV file or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">Max file size: 15MB</p>
              </label>
            </div>

            {isProcessing && (
              <div className="mt-4 text-gray-600">Processing file...</div>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Preview & Validate */}
      {step === 2 && validationResults && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Validation Results</h2>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-green-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-green-800">
                  <CheckCircle size={20} />
                  <span className="font-semibold">Valid Records:</span>
                </div>
                <p className="text-2xl font-bold text-green-800">{validationResults.valid.length}</p>
              </div>
              <div className="bg-red-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle size={20} />
                  <span className="font-semibold">Invalid Records:</span>
                </div>
                <p className="text-2xl font-bold text-red-800">{validationResults.invalid.length}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-lg">
                <div className="flex items-center gap-2 text-blue-800">
                  <FileText size={20} />
                  <span className="font-semibold">Total Rows:</span>
                </div>
                <p className="text-2xl font-bold text-blue-800">{parsedData.length}</p>
              </div>
            </div>

            {validationResults.invalid.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-red-800 mb-2">Errors Found:</h3>
                <div className="max-h-64 overflow-auto border rounded-lg">
                  <table className="w-full text-sm">
                    <thead className="bg-red-50">
                      <tr>
                        <th className="px-4 py-2 text-left">Row</th>
                        <th className="px-4 py-2 text-left">Errors</th>
                      </tr>
                    </thead>
                    <tbody>
                      {validationResults.invalid.map((item, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="px-4 py-2">{item.row}</td>
                          <td className="px-4 py-2 text-red-600">
                            <ul className="list-disc list-inside">
                              {item.errors.map((err, i) => (
                                <li key={i}>{err}</li>
                              ))}
                            </ul>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-4">
              <button onClick={resetImport} className="px-4 py-2 border rounded-lg hover:bg-gray-50">
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!validationResults.valid.length || isProcessing}
                className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {isProcessing ? 'Importing...' : `Import ${validationResults.valid.length} Valid Records`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Summary */}
      {step === 3 && importSummary && (
        <div className="bg-white rounded-lg shadow p-8">
          <div className="text-center mb-6">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-800">Import Complete!</h2>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-green-100 p-4 rounded-lg text-center">
              <p className="text-green-800 font-semibold">Successfully Imported</p>
              <p className="text-3xl font-bold text-green-800">{importSummary.successCount}</p>
            </div>
            <div className="bg-red-100 p-4 rounded-lg text-center">
              <p className="text-red-800 font-semibold">Failed/Invalid</p>
              <p className="text-3xl font-bold text-red-800">{importSummary.errorCount}</p>
            </div>
          </div>

          {importSummary.autoCreatedReferences?.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Auto-Created References:</h3>
              <div className="max-h-48 overflow-auto border rounded-lg p-4">
                <ul className="list-disc list-inside text-sm">
                  {importSummary.autoCreatedReferences.map((ref, idx) => (
                    <li key={idx}>
                      {ref.type}: <span className="font-medium">{ref.name}</span>
                      {ref.state && <span> ({ref.state})</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="flex justify-center">
            <button onClick={resetImport} className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-green-700">
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportEmployees;
