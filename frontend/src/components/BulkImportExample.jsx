import React, { useState } from 'react';
import * as XLSX from 'xlsx';

const BulkImportExample = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files).slice(0, 5);
    setSelectedFiles(files);
    setResults(null);
  };

  const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          
          // Transform Excel data to API format
          const households = jsonData.map(row => ({
            household_number: row['HH No.'] || row['Household Number'],
            barangay: row['Barangay'],
            purok_sito: row['Purok/Sitio'] || row['Purok'],
            family_living_in_house: row['Family Living in House'],
            number_of_members: row['Number of Members'] || 0,
            municipality_city: row['Municipality/City'] || 'Cabuyao',
            province: row['Province'] || 'Laguna',
            // Add more field mappings as needed
            members: [
              {
                role: 'father',
                name: row['Father Name'],
                occupation: row['Father Occupation'],
                educational_attainment: row['Father Education']
              },
              {
                role: 'mother',
                name: row['Mother Name'],
                occupation: row['Mother Occupation'],
                educational_attainment: row['Mother Education']
              }
            ].filter(m => m.name) // Only include members with names
          }));
          
          resolve({
            filename: file.name,
            households: households
          });
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  };

  const handleBulkImport = async () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one Excel file');
      return;
    }

    setImporting(true);
    setResults(null);

    try {
      // Parse all selected files
      const parsedFiles = await Promise.all(
        selectedFiles.map(file => parseExcelFile(file))
      );

      // Send to API
      const token = localStorage.getItem('token'); // Adjust based on your auth setup
      const response = await fetch('/api/households/bulk-import', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: parsedFiles
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        setResults(data);
      } else {
        alert('Import failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Bulk import error:', error);
      alert('Error during import: ' + error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="bulk-import-container">
      <h2>Bulk Import Households</h2>
      <p>Upload up to 5 Excel files at once</p>

      <div className="file-input-section">
        <input
          type="file"
          accept=".xlsx,.xls"
          multiple
          onChange={handleFileSelect}
          disabled={importing}
        />
        {selectedFiles.length > 0 && (
          <div className="selected-files">
            <h3>Selected Files ({selectedFiles.length}/5):</h3>
            <ul>
              {selectedFiles.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <button
        onClick={handleBulkImport}
        disabled={importing || selectedFiles.length === 0}
        className="import-button"
      >
        {importing ? 'Importing...' : 'Start Bulk Import'}
      </button>

      {results && (
        <div className="results-section">
          <h3>Import Results</h3>
          <div className="summary">
            <p><strong>Total Files:</strong> {results.summary.totalFiles}</p>
            <p><strong>Successful:</strong> {results.summary.totalSuccessful}</p>
            <p><strong>Failed:</strong> {results.summary.totalFailed}</p>
            <p><strong>Skipped:</strong> {results.summary.totalSkipped}</p>
          </div>

          <div className="file-results">
            <h4>Per-File Results:</h4>
            {results.fileResults.map((fileResult, index) => (
              <div key={index} className="file-result">
                <h5>{fileResult.filename}</h5>
                <p>
                  Total: {fileResult.stats.total} | 
                  Success: {fileResult.stats.successful} | 
                  Failed: {fileResult.stats.failed} | 
                  Skipped: {fileResult.stats.skipped}
                </p>
                
                {fileResult.errors && fileResult.errors.length > 0 && (
                  <div className="errors">
                    <strong>Errors:</strong>
                    <ul>
                      {fileResult.errors.map((error, i) => (
                        <li key={i} className="error">{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {fileResult.skipped_logs && fileResult.skipped_logs.length > 0 && (
                  <div className="skipped">
                    <strong>Skipped:</strong>
                    <ul>
                      {fileResult.skipped_logs.map((log, i) => (
                        <li key={i} className="warning">{log}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <style jsx>{`
        .bulk-import-container {
          padding: 20px;
          max-width: 800px;
          margin: 0 auto;
        }

        .file-input-section {
          margin: 20px 0;
        }

        .selected-files {
          margin-top: 10px;
          padding: 10px;
          background: #f5f5f5;
          border-radius: 4px;
        }

        .selected-files ul {
          list-style: none;
          padding: 0;
        }

        .selected-files li {
          padding: 5px 0;
        }

        .import-button {
          padding: 10px 20px;
          background: #4CAF50;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }

        .import-button:disabled {
          background: #ccc;
          cursor: not-allowed;
        }

        .results-section {
          margin-top: 30px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }

        .summary {
          padding: 15px;
          background: white;
          border-radius: 4px;
          margin-bottom: 20px;
        }

        .file-result {
          margin: 15px 0;
          padding: 15px;
          background: white;
          border-radius: 4px;
          border-left: 4px solid #4CAF50;
        }

        .errors, .skipped {
          margin-top: 10px;
        }

        .errors ul, .skipped ul {
          list-style: none;
          padding: 0;
        }

        .error {
          color: #d32f2f;
          padding: 5px 0;
        }

        .warning {
          color: #f57c00;
          padding: 5px 0;
        }
      `}</style>
    </div>
  );
};

export default BulkImportExample;
