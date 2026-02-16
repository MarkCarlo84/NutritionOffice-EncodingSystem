import { useState } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import api from '../lib/api';
import { buildBnsFormHeader, applyBnsColumnWidths } from '../utils/bnsFormTemplate';
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

    const worksheet = workbook.getWorksheet(1);
    if (!worksheet) {
      throw new Error('No worksheet found in the Excel file');
    }

    const sheetName = (worksheet.name || '').toUpperCase();
    const firstRow = worksheet.getRow(1);
    const firstCell = firstRow.getCell(1).value?.toString()?.trim() || '';

    // Nutrition BNS Form.xlsx format: sheet "BNS FORM 1A", row 1 has "Purok / Sitio:", headers in rows 5-7, data from row 8 in groups of 3 (Fa, Mo, Ca)
    const isBnsForm1ALayout =
      sheetName.includes('BNS FORM') ||
      firstCell.includes('Purok / Sitio') ||
      firstCell.includes('Purok/Sitio');

    if (isBnsForm1ALayout) {
      return parseBnsForm1AFormat(worksheet);
    }

    // Legacy format: "BNS Form No. 1A" in row 1 or single header row, data in sequential columns 1-44
    const isLegacySequential =
      firstCell.includes('BNS Form No. 1A') ||
      firstCell === 'BNS Form No. 1A';
    const dataStartRow = isLegacySequential ? 8 : findHeaderRow(worksheet);
    return parseSequentialFormat(worksheet, dataStartRow);
  };

  function findHeaderRow(worksheet: ExcelJS.Worksheet): number {
    let dataStartRow = 1;
    worksheet.eachRow((row, rowNumber) => {
      const cellValue = row.getCell(1).value?.toString()?.trim() || '';
      if (cellValue === 'Purok/Sitio' || cellValue === 'No. of HouseHold No.' || cellValue.includes('Purok')) {
        dataStartRow = rowNumber + 1;
        return false;
      }
    });
    if (dataStartRow === 1) {
      throw new Error('Could not find header row. Please use the Nutrition BNS Form.xlsx template.');
    }
    return dataStartRow;
  }

  // 35 columns: no C(3), E(5), AI(35), AK(37). 37 columns: no C(3), E(5).
  const BNS_FORM_COLS_35 = [1, 2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 36, 38, 39];
  const BNS_FORM_COLS_37 = [1, 2, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39];
  const formToSheet = (formCol: number, cols: number[]) => cols.indexOf(formCol) + 1;

  // Nutrition BNS Form.xlsx: 3 rows per household (Fa, Mo, Ca). Supports 35-col, 37-col, or 39-col layout.
  function parseBnsForm1AFormat(worksheet: ExcelJS.Worksheet): any[] {
    const headerRow = worksheet.getRow(6);
    const has39Cols = headerRow.getCell(39).value != null && String(headerRow.getCell(39).value).trim() !== '';
    const has37Cols = !has39Cols && (headerRow.getCell(37).value != null && String(headerRow.getCell(37).value).trim() !== '');
    const formCols = has39Cols ? null : (has37Cols ? BNS_FORM_COLS_37 : BNS_FORM_COLS_35);
    const col = (formCol: number) => {
      if (has39Cols) return formCol;
      const s = formCols ? formToSheet(formCol, formCols) : 0;
      return s || 0;
    };

    const households: any[] = [];
    const dataStartRow = 8;

    for (let r = dataStartRow; r <= (worksheet.rowCount || 0); r += 3) {
      const row1 = worksheet.getRow(r);
      const row2 = worksheet.getRow(r + 1);
      const row3 = worksheet.getRow(r + 2);
      if (!row1 || !row2 || !row3) break;

      const get = (row: ExcelJS.Row, formCol: number) => {
        const c = col(formCol);
        if (!c) return '';
        const v = row.getCell(c).value;
        return v === undefined || v === null ? '' : String(v).trim();
      };
      const getNum = (row: ExcelJS.Row, formCol: number) => {
        const c = col(formCol);
        if (!c) return undefined;
        const v = row.getCell(c).value;
        if (v === undefined || v === null || v === '') return undefined;
        return typeof v === 'number' ? v : parseInt(String(v), 10) || 0;
      };
      const getBool = (row: ExcelJS.Row, formCol: number) => {
        const s = get(row, formCol).toLowerCase();
        return s === 'yes' || s === '1' || s === 'true';
      };

      const hhNo = get(row1, 1);
      if (!hhNo) continue; // skip empty 3-row blocks

      const rowData: any = {
        household_number: hhNo,
        members: [],
      };

      const familyLiving = getNum(row1, 2);
      if (familyLiving !== undefined) rowData.family_living_in_house = familyLiving;
      const numMembers = getNum(row1, 4);
      if (numMembers !== undefined) rowData.number_of_members = numMembers;
      const nhts = get(row1, 6);
      if (nhts) rowData.nhts_household_group = nhts;
      const indigenous = get(row1, 7);
      if (indigenous) rowData.indigenous_group = indigenous;

      const ageFields = [
        { col: 8, field: 'newborn_male' }, { col: 9, field: 'newborn_female' },
        { col: 10, field: 'infant_male' }, { col: 11, field: 'infant_female' },
        { col: 12, field: 'under_five_male' }, { col: 13, field: 'under_five_female' },
        { col: 14, field: 'children_male' }, { col: 15, field: 'children_female' },
        { col: 16, field: 'adolescence_male' }, { col: 17, field: 'adolescence_female' },
        { col: 18, field: 'pregnant' }, { col: 19, field: 'adolescent_pregnant' },
        { col: 20, field: 'post_partum' }, { col: 21, field: 'women_15_49_not_pregnant' },
        { col: 22, field: 'adult_male' }, { col: 23, field: 'adult_female' },
        { col: 24, field: 'senior_citizen_male' }, { col: 25, field: 'senior_citizen_female' },
        { col: 26, field: 'pwd_male' }, { col: 27, field: 'pwd_female' },
      ];
      ageFields.forEach(({ col: formCol, field }) => {
        const val = getNum(row1, formCol);
        if (val !== undefined) rowData[field] = val;
      });

      const faName = get(row1, 28);
      if (faName && faName !== '(Fa)') {
        rowData.members.push({
          role: 'father',
          name: faName,
          occupation: get(row1, 29) || null,
          educational_attainment: get(row1, 30) || null,
        });
      }
      const moName = get(row2, 28);
      if (moName && moName !== '(Mo)') {
        rowData.members.push({
          role: 'mother',
          name: moName,
          occupation: get(row2, 29) || null,
          educational_attainment: get(row2, 30) || null,
        });
      }
      const caName = get(row3, 28);
      if (caName && caName !== '(Ca)') {
        rowData.members.push({
          role: 'caregiver',
          name: caName,
          occupation: get(row3, 29) || null,
          educational_attainment: get(row3, 30) || null,
        });
      }

      const fp1 = get(row1, 31);
      const fp2 = get(row1, 32);
      if (fp1 || fp2) rowData.couple_practicing_family_planning = getBool(row1, 31);
      const toilet = get(row1, 33);
      if (toilet) rowData.toilet_type = toilet;
      const water = get(row1, 34);
      if (water) rowData.water_source = water;
      const food = get(row1, 35);
      if (food) rowData.food_production_activity = food;
      const salt1 = get(row1, 36);
      const salt2 = get(row1, 37);
      if (salt1 || salt2) rowData.using_iodized_salt = getBool(row1, 36);
      const rice1 = get(row1, 38);
      const rice2 = get(row1, 39);
      if (rice1 || rice2) rowData.using_iron_fortified_rice = getBool(row1, 38);

      households.push(rowData);
    }

    return households;
  }

  function parseSequentialFormat(worksheet: ExcelJS.Worksheet, dataStartRow: number): any[] {
    const households: any[] = [];
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber < dataStartRow) return;

      const rowData: any = { members: [] };
      let hasData = false;

      const hhNo = row.getCell(1).value;
      if (hhNo) {
        rowData.household_number = String(hhNo).trim();
        hasData = true;
      }

      const familyLiving = row.getCell(2).value;
      if (familyLiving !== null && familyLiving !== undefined && familyLiving !== '') {
        rowData.family_living_in_house = typeof familyLiving === 'number' ? familyLiving : parseInt(String(familyLiving)) || 0;
        hasData = true;
      }
      const numberOfMembers = row.getCell(3).value;
      if (numberOfMembers !== null && numberOfMembers !== undefined && numberOfMembers !== '') {
        rowData.number_of_members = typeof numberOfMembers === 'number' ? numberOfMembers : parseInt(String(numberOfMembers)) || 0;
        hasData = true;
      }
      const nhtsGroup = row.getCell(4).value;
      if (nhtsGroup !== null && nhtsGroup !== undefined && nhtsGroup !== '') {
        rowData.nhts_household_group = String(nhtsGroup).trim();
        hasData = true;
      }
      const indigenousGroup = row.getCell(5).value;
      if (indigenousGroup !== null && indigenousGroup !== undefined && indigenousGroup !== '') {
        rowData.indigenous_group = String(indigenousGroup).trim();
        hasData = true;
      }

      const ageFields = [
        { col: 6, field: 'newborn_male' }, { col: 7, field: 'newborn_female' },
        { col: 8, field: 'infant_male' }, { col: 9, field: 'infant_female' },
        { col: 10, field: 'under_five_male' }, { col: 11, field: 'under_five_female' },
        { col: 12, field: 'children_male' }, { col: 13, field: 'children_female' },
        { col: 14, field: 'adolescence_male' }, { col: 15, field: 'adolescence_female' },
        { col: 16, field: 'pregnant' }, { col: 17, field: 'adolescent_pregnant' },
        { col: 18, field: 'post_partum' }, { col: 19, field: 'women_15_49_not_pregnant' },
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

      ['purok_sito', 'barangay', 'municipality_city', 'province'].forEach((field, i) => {
        const v = row.getCell(35 + i).value;
        if (v) { rowData[field] = String(v).trim(); hasData = true; }
      });
      const coupleFP = row.getCell(39).value;
      if (coupleFP !== null && coupleFP !== undefined && coupleFP !== '') {
        const strValue = String(coupleFP).toLowerCase().trim();
        rowData.couple_practicing_family_planning = strValue === 'yes' || strValue === '1' || strValue === 'true';
        hasData = true;
      }
      const toiletType = row.getCell(40).value;
      if (toiletType !== null && toiletType !== undefined && toiletType !== '') {
        rowData.toilet_type = String(toiletType).trim();
        hasData = true;
      }
      const waterSource = row.getCell(41).value;
      if (waterSource !== null && waterSource !== undefined && waterSource !== '') {
        rowData.water_source = String(waterSource).trim();
        hasData = true;
      }
      const foodProduction = row.getCell(42).value;
      if (foodProduction !== null && foodProduction !== undefined && foodProduction !== '') {
        rowData.food_production_activity = String(foodProduction).trim();
        hasData = true;
      }
      const iodizedSalt = row.getCell(43).value;
      if (iodizedSalt !== null && iodizedSalt !== undefined && iodizedSalt !== '') {
        const strValue = String(iodizedSalt).toLowerCase().trim();
        rowData.using_iodized_salt = strValue === 'yes' || strValue === '1' || strValue === 'true';
        hasData = true;
      }
      const ironRice = row.getCell(44).value;
      if (ironRice !== null && ironRice !== undefined && ironRice !== '') {
        const strValue = String(ironRice).toLowerCase().trim();
        rowData.using_iron_fortified_rice = strValue === 'yes' || strValue === '1' || strValue === 'true';
        hasData = true;
      }

      if (hasData) households.push(rowData);
    });
    return households;
  }

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
        
        const response = await api.post('/households/import', formData, {
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
      const response = await api.post('/households/import', {
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
    const thinBorder = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Household Data', { properties: { defaultRowHeight: 18 } });
    buildBnsFormHeader(worksheet);

    // Rows 11+: Sample data blocks (Fa), (Mo), (Ca) - 8 blocks of 3 rows each
    const addDataRow = (label: string) => {
      const row = worksheet.addRow([]);
      for (let c = 1; c <= 34; c++) {
        if (c === 26) row.getCell(c).value = label;
        else row.getCell(c).value = '';
        row.getCell(c).border = thinBorder;
        row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
      }
      return row;
    };
    for (let block = 0; block < 8; block++) {
      addDataRow('(Fa)');
      addDataRow('(Mo)');
      addDataRow('(Ca)');
    }
    // Merges for each 3-row block (rows 11-13, 14-16, ..., 32-34)
    for (let block = 0; block < 8; block++) {
      const startRow = 11 + block * 3;
      const endRow = startRow + 2;
      worksheet.mergeCells(startRow, 1, endRow, 1);
      for (let c = 2; c <= 25; c++) worksheet.mergeCells(startRow, c, endRow, c);
      for (let c = 29; c <= 34; c++) worksheet.mergeCells(startRow, c, endRow, c);
    }

    applyBnsColumnWidths(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Nutrition BNS Form.xlsx';
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
          <ol>
            <li><strong>Download the template</strong> (Nutrition BNS Form) and open it in Excel.</li>
            <li><strong>Each household = 3 rows:</strong> Row 1 = Father (Fa), Row 2 = Mother (Mo), Row 3 = Caregiver (Ca). Put HH No. and household info on the first row; put names and occupation/education on each of the 3 rows.</li>
            <li><strong>Required:</strong> Fill in <strong>HH No.</strong> (column A) on the first row of every 3-row block.</li>
            <li><strong>Upload</strong> your filled file (Excel .xlsx/.xls or CSV, max 10MB) and click Import Data.</li>
          </ol>
          <p className="import-instructions-note">Need column details? The template headers (C1–C34) match the BNS Form 1A layout.</p>
        </div>
      </div>
    </div>
  );
};

export default ImportData;
