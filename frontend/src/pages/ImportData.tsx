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
    const thinBorder = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };
    const sc = (formCol: number) => formToSheet(formCol, BNS_FORM_COLS_35) || formCol; // form -> sheet (1-35, no AI/AK)
    const applyBorders = (row: ExcelJS.Row, maxCol: number = 35) => {
      for (let c = 1; c <= maxCol; c++) row.getCell(c).border = thinBorder;
    };
    // Template has 35 columns (no C, E, AI, AK). Sheet col 1=A, 2=B, ... 35=AI removed so last is 35.
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('BNS FORM 1A', { properties: { defaultRowHeight: 18 } });

    // Row 1: Purok/Sitio (sheet 1-8 merged), Municipality (sheet 9-20 merged)
    const r1 = worksheet.addRow([]);
    r1.getCell(1).value = 'Purok / Sitio:';
    r1.getCell(9).value = 'Municipality:';
    worksheet.mergeCells(1, 1, 1, 8);
    worksheet.mergeCells(1, 9, 1, 19);
    applyBorders(r1, 35);

    // Row 2: Barangay, Province
    const r2 = worksheet.addRow([]);
    r2.getCell(1).value = 'Barangay:';
    r2.getCell(9).value = 'Province:';
    worksheet.mergeCells(2, 1, 2, 8);
    worksheet.mergeCells(2, 9, 2, 19);
    applyBorders(r2, 35);

    const r3 = worksheet.addRow([]);
    applyBorders(r3);
    const r4 = worksheet.addRow([]);
    applyBorders(r4);

    // Row 5: "Check if" in AG (33) and AH (34) only; no merge; AI (35) empty
    const r5 = worksheet.addRow([]);
    r5.getCell(sc(6)).value = 'NHTS Household';
    r5.getCell(sc(7)).value = 'Indigenous Group';
    r5.getCell(sc(33)).value = 'Fill in:';
    r5.getCell(33).value = 'Check if';  // AG
    r5.getCell(34).value = 'Check if';  // AH (column AI = 35 left empty)
    applyBorders(r5, 35);

    // Row 6: Main headers (form -> sheet via sc)
    const r6 = worksheet.addRow([]);
    r6.getCell(sc(1)).value = 'HH No.';
    r6.getCell(sc(2)).value = 'No. of family living in the house';
    r6.getCell(sc(4)).value = '      Number of HH members';
    r6.getCell(sc(6)).value = '1-NHTS 4Ps   2-NHTS   Non-4Ps   3-Non-NHTS';
    r6.getCell(sc(7)).value = '1-IP   2-Non-IP';
    r6.getCell(sc(8)).value = 'Newborn (0-28 days)';
    r6.getCell(sc(10)).value = 'Infant (29 days - 11 months)';
    r6.getCell(sc(12)).value = 'Under five (1-4 y.o)';
    r6.getCell(sc(14)).value = 'Children 5-9 y.o';
    r6.getCell(sc(16)).value = 'Adolescence (10-19 y.o)';
    r6.getCell(sc(18)).value = 'Pregnant';
    r6.getCell(sc(19)).value = 'Adolescent Pregnant';
    r6.getCell(sc(20)).value = 'Post-Partum (PP)';
    r6.getCell(sc(21)).value = '15-49 y.o not pregnant & non PP';
    r6.getCell(sc(22)).value = 'Adult 20-59 y.o.';
    r6.getCell(sc(24)).value = 'Senior Citizens';
    r6.getCell(sc(26)).value = 'Person with Disabilities';
    r6.getCell(sc(28)).value = 'Name of Father (Fa) and Mother (Mo); Caregiver (Ca)';
    r6.getCell(sc(29)).value = 'Occupation';
    r6.getCell(sc(30)).value = 'Educational Attainment';
    r6.getCell(sc(33)).value = 'Toilet Type (1, 2, 3, 4)';
    r6.getCell(sc(34)).value = 'Water Source (1, 2)';
    // Form 35 (Food Production) = column AI removed
    r6.getCell(sc(31)).value = 'Couple Practicing Family Planning';
    r6.getCell(sc(36)).value = 'HH using Iodized Salt';
    r6.getCell(sc(38)).value = 'HH using Iron Fortified Rice';
    r6.font = { bold: true, size: 9 };
    r6.alignment = { vertical: 'middle', wrapText: true };
    applyBorders(r6, 35);

    // Row 7
    const r7 = worksheet.addRow([]);
    r7.getCell(sc(8)).value = 'M';
    r7.getCell(sc(9)).value = 'F';
    r7.getCell(sc(10)).value = 'M';
    r7.getCell(sc(11)).value = 'F';
    r7.getCell(sc(12)).value = 'M';
    r7.getCell(sc(13)).value = 'F';
    r7.getCell(sc(14)).value = 'M';
    r7.getCell(sc(15)).value = 'F';
    r7.getCell(sc(16)).value = 'M';
    r7.getCell(sc(17)).value = 'F';
    r7.getCell(sc(21)).value = 'F';
    r7.getCell(sc(22)).value = 'M';
    r7.getCell(sc(23)).value = 'F';
    r7.getCell(sc(24)).value = 'M';
    r7.getCell(sc(25)).value = 'F';
    r7.getCell(sc(26)).value = 'M';
    r7.getCell(sc(27)).value = 'F';
    // C29–C30 (Occupation, Educational Attainment): already in row 6
    // C31, C36, C38 (Couple Practicing FP, Iodized Salt, Iron Rice): moved to row 6
    r7.font = { bold: true, size: 9 };
    r7.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    applyBorders(r7, 35);

    // Rows 8-10: (Fa), (Mo), (Ca) in Name column
    const r8 = worksheet.addRow([]);
    r8.getCell(sc(28)).value = '(Fa)';
    applyBorders(r8, 35);
    const r9 = worksheet.addRow([]);
    r9.getCell(sc(28)).value = '(Mo)';
    applyBorders(r9, 35);
    const r10 = worksheet.addRow([]);
    r10.getCell(sc(28)).value = '(Ca)';
    applyBorders(r10, 35);

    [worksheet.addRow([]), worksheet.addRow([]), worksheet.addRow([])].forEach((row) => applyBorders(row, 35));

    // Column widths from content (35 columns)
    const rowCount = worksheet.rowCount || 13;
    const minWidth = 6;
    const maxWidth = 50;
    for (let c = 1; c <= 35; c++) {
      let maxLen = 0;
      for (let r = 1; r <= rowCount; r++) {
        const row = worksheet.getRow(r);
        const cell = row.getCell(c);
        const val = cell.value;
        const s = val == null ? '' : String(val).trim();
        if (s.length > maxLen) maxLen = s.length;
      }
      const width = Math.max(minWidth, Math.min(maxLen + 2, maxWidth));
      worksheet.getColumn(c).width = width;
    }

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
          <ul>
            <li>The download template matches <strong>Nutrition BNS Form.xlsx</strong> (BNS FORM 1A). Each household uses <strong>3 rows</strong>: first row = Father (Fa), second = Mother (Mo), third = Caregiver (Ca). Fill HH No. and household data on the first row of each 3-row block; fill names and occupation/education on each of the 3 rows.</li>
            <li>Columns: C1 = HH No., C2 = No. of family in house, C4 = Number of HH members, C6 = NHTS, C7 = Indigenous Group, C8–C27 = age/health counts (M/F), C28 = Name (Fa/Mo/Ca), C29 = Occupation, C30 = Educational Attainment, C31–C32 = Couple Practicing Family Planning (Yes/No), C33 = Toilet Type, C34 = Water Source, C35 = Food Production, C36–C39 = Iodized Salt and Iron-Fortified Rice (Yes/No).</li>
            <li>Required: <strong>HH No.</strong> (C1) on the first row of each 3-row household block.</li>
            <li>Maximum file size: 10MB. Supported: Excel (.xlsx, .xls) in this BNS Form layout, or CSV.</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImportData;
