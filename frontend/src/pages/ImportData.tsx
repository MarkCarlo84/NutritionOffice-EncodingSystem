import { useState } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { API_BASE_URL } from '../config/api';
import './ImportData.css';

const ImportData = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importStats, setImportStats] = useState<{
    total: number;
    successful: number;
    failed: number;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
      setImportStats(null);
    }
  };

  const parseExcelFile = async (file: File): Promise<any[]> => {
    const workbook = new ExcelJS.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    
    const worksheet = workbook.getWorksheet(1); // Get first worksheet
    if (!worksheet) {
      throw new Error('No worksheet found in the Excel file');
    }

    const households: any[] = [];
    
    // New Excel format has headers in rows 1-7, data starts from row 8
    // Check if this is the new format by looking for "BNS Form No. 1A" in row 1
    const firstRow = worksheet.getRow(1);
    const firstCell = firstRow.getCell(1).value?.toString()?.trim() || '';
    const isNewFormat = firstCell.includes('BNS Form No. 1A') || firstCell === 'BNS Form No. 1A';
    
    let dataStartRow = 8; // Default for new format
    
    if (!isNewFormat) {
      // Old format - find header row
      let headerRowIndex = -1;
      worksheet.eachRow((row, rowNumber) => {
        const cellValue = row.getCell(1).value?.toString()?.trim() || '';
        if (cellValue === 'Purok/Sitio' || cellValue === 'No. of HouseHold No.' || cellValue.includes('Purok')) {
          headerRowIndex = rowNumber;
          dataStartRow = rowNumber + 1;
          return false;
        }
      });
      
      if (headerRowIndex === -1) {
        throw new Error('Could not find header row in Excel file. Please ensure the file matches the BNS Form format.');
      }
    }

    // Process data rows - map by column position (C1-C34, then additional columns)
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) return; // Skip header rows

      const rowData: any = { members: [] };
      let hasData = false;

      // Map columns by position (matching PDF structure C1-C34, then additional)
      // C1: HH No.
      const householdNumber = row.getCell(1).value;
      if (householdNumber) {
        rowData.household_number = String(householdNumber).trim();
        hasData = true;
      }

      // C2: No. of family living in the house
      const familyLiving = row.getCell(2).value;
      if (familyLiving !== null && familyLiving !== undefined && familyLiving !== '') {
        rowData.family_living_in_house = typeof familyLiving === 'number' ? familyLiving : parseInt(String(familyLiving)) || 0;
        hasData = true;
      }

      // C3: Number of HH members
      const numberOfMembers = row.getCell(3).value;
      if (numberOfMembers !== null && numberOfMembers !== undefined && numberOfMembers !== '') {
        rowData.number_of_members = typeof numberOfMembers === 'number' ? numberOfMembers : parseInt(String(numberOfMembers)) || 0;
        hasData = true;
      }

      // C4: NHTS Household
      const nhtsGroup = row.getCell(4).value;
      if (nhtsGroup !== null && nhtsGroup !== undefined && nhtsGroup !== '') {
        rowData.nhts_household_group = String(nhtsGroup).trim();
        hasData = true;
      }

      // C5: Indigenous Group
      const indigenousGroup = row.getCell(5).value;
      if (indigenousGroup !== null && indigenousGroup !== undefined && indigenousGroup !== '') {
        rowData.indigenous_group = String(indigenousGroup).trim();
        hasData = true;
      }

      // C6-C25: Age classifications (M/F pairs)
      const ageFields = [
        { col: 6, field: 'newborn_male' }, { col: 7, field: 'newborn_female' },
        { col: 8, field: 'infant_male' }, { col: 9, field: 'infant_female' },
        { col: 10, field: 'under_five_male' }, { col: 11, field: 'under_five_female' },
        { col: 12, field: 'children_male' }, { col: 13, field: 'children_female' },
        { col: 14, field: 'adolescence_male' }, { col: 15, field: 'adolescence_female' },
        { col: 16, field: 'pregnant' },
        { col: 17, field: 'adolescent_pregnant' },
        { col: 18, field: 'post_partum' },
        { col: 19, field: 'women_15_49_not_pregnant' },
        { col: 20, field: 'adult_male' }, { col: 21, field: 'adult_female' },
        { col: 22, field: 'senior_citizen_male' }, { col: 23, field: 'senior_citizen_female' },
        { col: 24, field: 'pwd_male' }, { col: 25, field: 'pwd_female' },
      ];

      ageFields.forEach(({ col, field }) => {
        const value = row.getCell(col).value;
        if (value !== null && value !== undefined && value !== '') {
          rowData[field] = typeof value === 'number' ? value : parseInt(String(value)) || 0;
          hasData = true;
        }
      });

      // C26-C28: Names (Father, Mother, Caregiver)
      const fatherName = row.getCell(26).value;
      const motherName = row.getCell(27).value;
      const caregiverName = row.getCell(28).value;

      if (fatherName || motherName || caregiverName) {
        if (fatherName) {
          rowData.members.push({
            role: 'father',
            name: String(fatherName).trim(),
            occupation: row.getCell(29).value ? String(row.getCell(29).value).trim() : null,
            educational_attainment: row.getCell(32).value ? String(row.getCell(32).value).trim() : null,
          });
        }
        if (motherName) {
          rowData.members.push({
            role: 'mother',
            name: String(motherName).trim(),
            occupation: row.getCell(30).value ? String(row.getCell(30).value).trim() : null,
            educational_attainment: row.getCell(33).value ? String(row.getCell(33).value).trim() : null,
          });
        }
        if (caregiverName) {
          rowData.members.push({
            role: 'caregiver',
            name: String(caregiverName).trim(),
            occupation: row.getCell(31).value ? String(row.getCell(31).value).trim() : null,
            educational_attainment: row.getCell(34).value ? String(row.getCell(34).value).trim() : null,
          });
        }
        hasData = true;
      }

      // Additional columns (35-44): Location and other fields
      const purokSito = row.getCell(35).value;
      if (purokSito) {
        rowData.purok_sito = String(purokSito).trim();
        hasData = true;
      }

      const barangay = row.getCell(36).value;
      if (barangay) {
        rowData.barangay = String(barangay).trim();
        hasData = true;
      }

      const municipality = row.getCell(37).value;
      if (municipality) {
        rowData.municipality_city = String(municipality).trim();
        hasData = true;
      }

      const province = row.getCell(38).value;
      if (province) {
        rowData.province = String(province).trim();
        hasData = true;
      }

      // Couple Practicing Family Planning
      const coupleFP = row.getCell(39).value;
      if (coupleFP !== null && coupleFP !== undefined && coupleFP !== '') {
        const strValue = String(coupleFP).toLowerCase().trim();
        rowData.couple_practicing_family_planning = strValue === 'yes' || strValue === '1' || strValue === 'true';
        hasData = true;
      }

      // Toilet Type
      const toiletType = row.getCell(40).value;
      if (toiletType !== null && toiletType !== undefined && toiletType !== '') {
        rowData.toilet_type = String(toiletType).trim();
        hasData = true;
      }

      // Water Source
      const waterSource = row.getCell(41).value;
      if (waterSource !== null && waterSource !== undefined && waterSource !== '') {
        rowData.water_source = String(waterSource).trim();
        hasData = true;
      }

      // Food Production Activity
      const foodProduction = row.getCell(42).value;
      if (foodProduction !== null && foodProduction !== undefined && foodProduction !== '') {
        rowData.food_production_activity = String(foodProduction).trim();
        hasData = true;
      }

      // HH using Iodized Salt
      const iodizedSalt = row.getCell(43).value;
      if (iodizedSalt !== null && iodizedSalt !== undefined && iodizedSalt !== '') {
        const strValue = String(iodizedSalt).toLowerCase().trim();
        rowData.using_iodized_salt = strValue === 'yes' || strValue === '1' || strValue === 'true';
        hasData = true;
      }

      // HH using Iron-Fortified Rice
      const ironRice = row.getCell(44).value;
      if (ironRice !== null && ironRice !== undefined && ironRice !== '') {
        const strValue = String(ironRice).toLowerCase().trim();
        rowData.using_iron_fortified_rice = strValue === 'yes' || strValue === '1' || strValue === 'true';
        hasData = true;
      }

      if (hasData) {
        households.push(rowData);
      }
    });

    return households;
  };

  const handleImport = async () => {
    if (!file) {
      setMessage({ type: 'error', text: 'Please select a file to import' });
      return;
    }

    setImporting(true);
    setMessage(null);
    setImportStats(null);

    try {
      let households: any[] = [];

      // Check file type
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        // Parse Excel file (BNS Form format)
        households = await parseExcelFile(file);
      } else if (fileExtension === 'csv') {
        // For CSV, we'll still send to backend for parsing
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post(`${API_BASE_URL}/api/households/import`, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        setMessage({ 
          type: 'success', 
          text: response.data.message || 'Data imported successfully!' 
        });
        
        if (response.data.stats) {
          setImportStats(response.data.stats);
        }

        // Reset file input
        setFile(null);
        const fileInput = document.getElementById('file-input') as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
        setImporting(false);
        return;
      } else {
        throw new Error('Unsupported file format. Please use Excel (.xlsx, .xls) or CSV files.');
      }

      if (households.length === 0) {
        throw new Error('No data found in the file. Please check the file format.');
      }

      // Send parsed data to backend
      const response = await axios.post(`${API_BASE_URL}/api/households/import`, {
        households: households
      }, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      setMessage({ 
        type: 'success', 
        text: response.data.message || `Successfully imported ${households.length} household(s)!` 
      });
      
      if (response.data.stats) {
        setImportStats(response.data.stats);
      } else {
        setImportStats({
          total: households.length,
          successful: response.data.successful || households.length,
          failed: response.data.failed || 0,
        });
      }

      // Reset file input
      setFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || error.message || 'Error importing data. Please check the file format.' 
      });
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    // Create an Excel template matching the BNS Form format
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Household Data');

    // Define column headers matching BNS Form (same as export)
    const headers = [
      'Purok/Sitio',
      'Barangay',
      'Municipality/City',
      'Province',
      'No. of HouseHold No.',
      'Number of Family living in the House',
      'No. of HouseHold Member',
      'NHTS Household Group',
      'Indigenous Group',
      'Newborn (0-28 days) - Male',
      'Newborn (0-28 days) - Female',
      'Infant (29 days - 11 months) - Male',
      'Infant (29 days - 11 months) - Female',
      'Under-five (1-4 yrs old) - Male',
      'Under-five (1-4 yrs old) - Female',
      'Children 5-9 y.o. - Male',
      'Children 5-9 y.o. - Female',
      'Adolescence (10-19 y.o.) - Male',
      'Adolescence (10-19 y.o.) - Female',
      'Pregnant',
      'Adolescence Pregnant',
      'Post-Partnum (PP)',
      '15-49 y.o. not pregnant & non PP Female',
      'Adult 20-59 y.o. - Male',
      'Adult 20-59 y.o. - Female',
      'Senior Citizens - Male',
      'Senior Citizens - Female',
      'Person with Disability - Male',
      'Person with Disability - Female',
      'Name of the Father',
      'Father Occupation',
      'Father Educational Attainment',
      'Name of the Mother',
      'Mother Occupation',
      'Mother Educational Attainment',
      'Name of the Caregiver',
      'Caregiver Occupation',
      'Caregiver Educational Attainment',
      'Toilet Type',
      'Water Source',
      'Food Production Activity',
      'Couple Practicing Family Planning',
      'Household using Iodized Salt',
      'Household using Iron-Fortified Rice',
    ];

    // Add header row with formatting
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, size: 11 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8E8E8' }
    };
    headerRow.alignment = { 
      vertical: 'middle', 
      horizontal: 'center',
      wrapText: true 
    };
    headerRow.border = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' }
    };
    headerRow.height = 30;

    // Set column widths
    worksheet.columns = [
      { width: 15 }, { width: 18 }, { width: 20 }, { width: 15 },
      { width: 18 }, { width: 25 }, { width: 20 }, { width: 20 }, { width: 18 },
      { width: 25 }, { width: 25 }, { width: 30 }, { width: 30 }, { width: 25 }, { width: 25 },
      { width: 20 }, { width: 20 }, { width: 25 }, { width: 25 },
      { width: 12 }, { width: 20 }, { width: 18 }, { width: 35 },
      { width: 22 }, { width: 22 }, { width: 20 }, { width: 20 },
      { width: 28 }, { width: 28 },
      { width: 20 }, { width: 15 }, { width: 25 },
      { width: 20 }, { width: 15 }, { width: 25 },
      { width: 20 }, { width: 15 }, { width: 25 },
      { width: 15 }, { width: 15 }, { width: 22 },
      { width: 30 }, { width: 28 }, { width: 32 },
    ];

    // Freeze header row
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];

    // Generate buffer and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'BNS Form Import Template.xlsx';
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="import-data">
      <div className="import-header">
        <h1>Import Data</h1>
        <p>Upload household profile data from a CSV or Excel file</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {importStats && (
        <div className="import-stats">
          <h3>Import Statistics</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Records:</span>
              <span className="stat-value">{importStats.total}</span>
            </div>
            <div className="stat-item success">
              <span className="stat-label">Successful:</span>
              <span className="stat-value">{importStats.successful}</span>
            </div>
            <div className="stat-item error">
              <span className="stat-label">Failed:</span>
              <span className="stat-value">{importStats.failed}</span>
            </div>
          </div>
        </div>
      )}

      <div className="import-content">
        <div className="import-card">
          <h2>Upload File</h2>
          <p>Select a CSV or Excel file containing household data to import.</p>
          
          <div className="file-upload-area">
            <input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="file-input"
            />
            <label htmlFor="file-input" className="file-label">
              {file ? file.name : 'Choose file or drag it here'}
            </label>
          </div>

          {file && (
            <div className="file-info">
              <p><strong>Selected file:</strong> {file.name}</p>
              <p><strong>File size:</strong> {(file.size / 1024).toFixed(2)} KB</p>
            </div>
          )}

          <div className="import-actions">
            <button 
              onClick={handleImport} 
              className="import-btn"
              disabled={!file || importing}
            >
              {importing ? 'Importing...' : 'Import Data'}
            </button>
            <button 
              onClick={downloadTemplate} 
              className="template-btn"
            >
              Download Template
            </button>
          </div>
        </div>

        <div className="import-instructions">
          <h3>Import Instructions</h3>
          <ul>
            <li>Download the BNS Form template to see the required format</li>
            <li>The Excel file should match the BNS Form No. 1A structure (same format as export)</li>
            <li>Ensure all required fields are filled (household_number is mandatory)</li>
            <li>For boolean fields (Couple Practicing Family Planning, Household using Iodized Salt, etc.), use: Yes/No</li>
            <li>For numeric fields, enter numbers only</li>
            <li>For dropdown fields, use the exact codes as specified in the API documentation</li>
            <li>Maximum file size: 10MB</li>
            <li>Supported formats: Excel (.xlsx, .xls) - BNS Form format, CSV</li>
            <li><strong>Note:</strong> The Excel file must have the same column headers as the export format</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportData;
