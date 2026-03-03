import { useState } from 'react';
import ExcelJS from 'exceljs';
import api from '../lib/api';
import { buildBnsFormHeader, applyBnsColumnWidths } from '../utils/bnsFormTemplate';
import { BARANGAYS, BARANGAY_DISPLAY } from '../utils/surveySummary';
import DownwardSelect from '../components/DownwardSelect';
import './ImportData.css';

interface FieldDiff {
  field: string;
  label: string;
  oldValue: any;
  newValue: any;
}

interface ChangedHousehold {
  index: number;
  existingId: number;
  household_number: string;
  barangay: string;
  purok_sito: string;
  diffs: FieldDiff[];
}

const ImportData = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importStats, setImportStats] = useState<{
    total: number;
    successful: number;
    failed: number;
    skipped?: number;
  } | null>(null);
  const [importErrors, setImportErrors] = useState<string[]>([]);
  const [skippedLogs, setSkippedLogs] = useState<string[]>([]);
  const [templateBarangay, setTemplateBarangay] = useState('');
  const [showAbbreviations, setShowAbbreviations] = useState(false);

  // Change-confirmation state
  const [showChangeModal, setShowChangeModal] = useState(false);
  const [changedHouseholds, setChangedHouseholds] = useState<ChangedHousehold[]>([]);
  const [selectedForUpdate, setSelectedForUpdate] = useState<Set<number>>(new Set());
  const [parsedHouseholds, setParsedHouseholds] = useState<any[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setMessage(null);
      setImportStats(null);
      setImportErrors([]);
      setSkippedLogs([]);
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

    // Nutrition BNS Form layout: data rows start at row 11 in 3-row blocks (Fa, Mo, Ca).
    const isBnsForm1ALayout =
      sheetName.includes('BNS FORM') ||
      firstCell.includes('BNS Form No. 1A') ||
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

  // Nutrition BNS Form.xlsx: read only rows 11+ and columns A:AH (1..34), 3 rows per household (Fa, Mo, Ca).
  function parseBnsForm1AFormat(worksheet: ExcelJS.Worksheet): any[] {
    const households: any[] = [];
    // BNS template data starts at row 11 (rows 1-10 are headers/subheaders/C-labels).
    const dataStartRow = 11;
    const asText = (value: any): string => {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value).trim();
      if (value?.text) return String(value.text).trim();
      if (Array.isArray(value?.richText)) return value.richText.map((r: any) => r?.text || '').join('').trim();
      if (value?.result !== undefined && value?.result !== null) return String(value.result).trim();
      return String(value).trim();
    };

    // Header-level location values from the BNS form.
    // Purok/Sitio is intentionally free text (e.g., "Purok 1").
    const headerPurokSitio = asText(worksheet.getRow(5).getCell(3).value);
    const headerBarangay = asText(worksheet.getRow(6).getCell(3).value);
    const headerMunicipalityCity = asText(worksheet.getRow(5).getCell(22).value);
    const headerProvince = asText(worksheet.getRow(6).getCell(22).value);

    for (let r = dataStartRow; r <= (worksheet.rowCount || 0); r += 3) {
      const row1 = worksheet.getRow(r);
      const row2 = worksheet.getRow(r + 1);
      const row3 = worksheet.getRow(r + 2);
      if (!row1 || !row2 || !row3) break;

      const get = (row: ExcelJS.Row, col: number) => {
        if (col < 1 || col > 34) return '';
        const v = row.getCell(col).value;
        return v === undefined || v === null ? '' : String(v).trim();
      };
      const getNum = (row: ExcelJS.Row, col: number) => {
        if (col < 1 || col > 34) return undefined;
        const v = row.getCell(col).value;
        if (v === undefined || v === null || v === '') return undefined;
        return typeof v === 'number' ? v : parseInt(String(v), 10) || 0;
      };
      const getBool = (row: ExcelJS.Row, col: number) => {
        const s = get(row, col).toLowerCase();
        return s === 'yes' || s === '1' || s === 'true';
      };

      const hhNo = get(row1, 1);
      if (!hhNo) continue; // skip empty 3-row blocks

      const rowData: any = {
        household_number: hhNo,
        members: [],
      };
      if (headerPurokSitio) rowData.purok_sito = headerPurokSitio;
      if (headerBarangay) rowData.barangay = headerBarangay;
      if (headerMunicipalityCity) rowData.municipality_city = headerMunicipalityCity;
      if (headerProvince) rowData.province = headerProvince;

      const familyLiving = getNum(row1, 2);
      if (familyLiving !== undefined) rowData.family_living_in_house = familyLiving;
      const numMembers = getNum(row1, 3);
      if (numMembers !== undefined) rowData.number_of_members = numMembers;
      const nhts = get(row1, 4);
      if (nhts) rowData.nhts_household_group = nhts;
      const indigenous = get(row1, 5);
      if (indigenous) rowData.indigenous_group = indigenous;

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
        const val = getNum(row1, col);
        if (val !== undefined) rowData[field] = val;
      });

      const faName = get(row1, 26);
      if (faName && faName !== '(Fa)') {
        rowData.members.push({
          role: 'father',
          name: faName,
          occupation: get(row1, 27) || null,
          educational_attainment: get(row1, 28) || null,
        });
      }
      const moName = get(row2, 26);
      if (moName && moName !== '(Mo)') {
        rowData.members.push({
          role: 'mother',
          name: moName,
          occupation: get(row2, 27) || null,
          educational_attainment: get(row2, 28) || null,
        });
      }
      const caName = get(row3, 26);
      if (caName && caName !== '(Ca)') {
        rowData.members.push({
          role: 'caregiver',
          name: caName,
          occupation: get(row3, 27) || null,
          educational_attainment: get(row3, 28) || null,
        });
      }

      const fp = get(row1, 29);
      if (fp) rowData.couple_practicing_family_planning = getBool(row1, 29);
      const toilet = get(row1, 30);
      if (toilet) rowData.toilet_type = toilet;
      const water = get(row1, 31);
      if (water) rowData.water_source = water;
      const food = get(row1, 32);
      if (food) rowData.food_production_activity = food;
      const salt = get(row1, 33);
      if (salt) rowData.using_iodized_salt = getBool(row1, 33);
      const rice = get(row1, 34);
      if (rice) rowData.using_iron_fortified_rice = getBool(row1, 34);

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
    setImportErrors([]);
    setSkippedLogs([]);

    try {
      let households: any[] = [];

      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        households = await parseExcelFile(file);
      } else if (fileExtension === 'csv') {
        // CSV: send directly to backend (legacy path)
        const formData = new FormData();
        formData.append('file', file);
        const response = await api.post('/households/import', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setMessage({ type: 'success', text: response.data.message || 'Data imported successfully!' });
        if (response.data.stats) setImportStats(response.data.stats);
        setImportErrors(Array.isArray(response.data.errors) ? response.data.errors : []);
        setSkippedLogs(Array.isArray(response.data.skipped_logs) ? response.data.skipped_logs : []);
        setFile(null);
        const fi = document.getElementById('file-input') as HTMLInputElement;
        if (fi) fi.value = '';
        setImporting(false);
        return;
      } else {
        throw new Error('Unsupported file format. Please use Excel (.xlsx, .xls) or CSV files.');
      }

      if (households.length === 0) {
        throw new Error('No data found in the file. Please check the file format.');
      }

      // ── PHASE 1: Preview — detect changed households ──────────────────────
      const previewResponse = await api.post('/households/preview-import', {
        households,
      });

      const preview: any[] = previewResponse.data.preview ?? [];
      const changed: ChangedHousehold[] = preview
        .filter((p) => p.status === 'changed')
        .map((p) => ({
          index: p.index,
          existingId: p.existingId,
          household_number: p.household_number,
          barangay: p.barangay,
          purok_sito: p.purok_sito,
          diffs: p.diffs,
        }));

      if (changed.length > 0) {
        // Show confirmation modal — keep households in state for Phase 2
        setParsedHouseholds(households);
        setChangedHouseholds(changed);
        setSelectedForUpdate(new Set(changed.map((c) => c.index)));
        setShowChangeModal(true);
        setImporting(false);
        return;
      }

      // No changed households — run import directly
      await runImport(households);
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Error importing data. Please check the file format.',
      });
      setImporting(false);
    }
  };

  // ── PHASE 2: Actual import (called after confirmation or directly) ────────
  const runImport = async (households: any[], forceUpdateIndices?: Set<number>) => {
    try {
      const payload = households.map((hh, idx) => {
        if (forceUpdateIndices && forceUpdateIndices.has(idx)) {
          return { ...hh, force_update: true };
        }
        return hh;
      });

      const response = await api.post(
        '/households/import',
        { households: payload },
        { headers: { 'Content-Type': 'application/json' } },
      );

      setMessage({
        type: 'success',
        text: response.data.message || `Successfully imported ${households.length} household(s)!`,
      });
      if (response.data.stats) {
        setImportStats(response.data.stats);
      } else {
        setImportStats({
          total: households.length,
          successful: response.data.successful || households.length,
          failed: response.data.failed || 0,
          skipped: response.data.skipped || 0,
        });
      }
      setImportErrors(Array.isArray(response.data.errors) ? response.data.errors : []);
      setSkippedLogs(Array.isArray(response.data.skipped_logs) ? response.data.skipped_logs : []);

      // Reset file input
      setFile(null);
      const fileInput = document.getElementById('file-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
    } catch (error: any) {
      setMessage({
        type: 'error',
        text: error.response?.data?.message || error.message || 'Error importing data.',
      });
    } finally {
      setImporting(false);
    }
  };

  const handleConfirmedImport = async () => {
    setShowChangeModal(false);
    setImporting(true);
    await runImport(parsedHouseholds, selectedForUpdate);
  };

  const handleSkipAllChanges = async () => {
    setShowChangeModal(false);
    setImporting(true);
    // Run import with no force_update flags — changed ones will be skipped as duplicates
    await runImport(parsedHouseholds);
  };

  const toggleHouseholdForUpdate = (index: number) => {
    setSelectedForUpdate((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const formatDisplayValue = (value: any): string => {
    if (value === null || value === undefined || value === '') return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    return String(value);
  };

  const downloadTemplate = async () => {
    if (!templateBarangay) {
      setMessage({ type: 'error', text: 'Please select a barangay before downloading the template.' });
      return;
    }

    const thinBorder = {
      top: { style: 'thin' as const },
      left: { style: 'thin' as const },
      bottom: { style: 'thin' as const },
      right: { style: 'thin' as const },
    };
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Household Data', { properties: { defaultRowHeight: 18 } });
    buildBnsFormHeader(worksheet, {
      barangay: templateBarangay,
      municipalityCity: 'Cabuyao',
      province: 'Laguna',
    });

    // Rows 11+: Sample data blocks (Fa), (Mo), (Ca) - 8 blocks of 3 rows each
    const addDataRow = (label: string) => {
      const row = worksheet.addRow([]);
      for (let c = 1; c <= 34; c++) {
        if (c === 26) row.getCell(c).value = label;
        else row.getCell(c).value = '';
        row.getCell(c).border = thinBorder;
        row.getCell(c).alignment = { horizontal: c === 26 ? 'left' : 'center', vertical: 'middle' };
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

    // Add validation rules for template rows.
    // Note: merged columns are validated on the top row of each 3-row household block.
    const blockStartRows = Array.from({ length: 8 }, (_, i) => 11 + i * 3);
    const allDetailRows = Array.from({ length: 24 }, (_, i) => 11 + i);

    const setListValidation = (row: number, col: number, csvOptions: string) => {
      worksheet.getCell(row, col).dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`"${csvOptions}"`],
        showErrorMessage: true,
      };
    };

    const setWholeNonNegativeValidation = (row: number, col: number) => {
      worksheet.getCell(row, col).dataValidation = {
        type: 'whole',
        operator: 'greaterThanOrEqual',
        allowBlank: true,
        formulae: [0],
        showErrorMessage: true,
      };
    };

    for (const row of blockStartRows) {
      // B, C, and age/risk count fields (all must be whole numbers >= 0)
      setWholeNonNegativeValidation(row, 2);
      setWholeNonNegativeValidation(row, 3);
      for (let c = 6; c <= 25; c++) setWholeNonNegativeValidation(row, c);

      // D, E, AC, AD, AE, AF, AG, AH
      setListValidation(row, 4, '1,2,3'); // NHTS
      setListValidation(row, 5, '1,2'); // Indigenous group
      setListValidation(row, 29, 'Yes,No'); // Couple practicing family planning
      setListValidation(row, 30, '1,2,3,4'); // Toilet type
      setListValidation(row, 31, '1,2'); // Water source
      setListValidation(row, 32, 'VG,FT,PL,FP,NA'); // Food production activity
      setListValidation(row, 33, 'Yes,No'); // Iodized salt
      setListValidation(row, 34, 'Yes,No'); // Iron-fortified rice
    }

    for (const row of allDetailRows) {
      // AA, AB (each of Fa/Mo/Ca rows)
      setListValidation(row, 27, '1,2,3,4,5,6,7,8,9,10,11'); // Occupation
      setListValidation(row, 28, 'N,EU,EG,HU,HG,CU,CG,V,PG'); // Educational attainment
    }

    applyBnsColumnWidths(worksheet);

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeBarangay = templateBarangay.replace(/[\\/:*?"<>|]/g, '').trim();
    link.download = `Nutrition BNS Form - ${safeBarangay}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const downloadFailedLogs = () => {
    if (importErrors.length === 0) return;
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const lines = [
      `Import failed logs`,
      `Generated: ${now.toLocaleString()}`,
      `Total failed rows: ${importErrors.length}`,
      '',
      ...importErrors.map((err, idx) => `${idx + 1}. ${err}`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `import-failed-logs-${timestamp}.txt`;
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
            <div className="stat-item">
              <span className="stat-label">Skipped:</span>
              <span className="stat-value">{importStats.skipped ?? 0}</span>
            </div>
            <div className="stat-item error">
              <span className="stat-label">Failed:</span>
              <span className="stat-value">{importStats.failed}</span>
            </div>
          </div>
        </div>
      )}

      {skippedLogs.length > 0 && (
        <div className="import-instructions" style={{ marginBottom: '24px' }}>
          <h3>Skipped Duplicate Logs</h3>
          <ol className="scrollable-logs">
            {skippedLogs.map((log, idx) => (
              <li key={`${idx}-${log}`}>{log}</li>
            ))}
          </ol>
        </div>
      )}

      {importErrors.length > 0 && (
        <div className="import-instructions" style={{ marginBottom: '24px' }}>
          <div className="import-error-header">
            <h3>Failed Import Logs</h3>
            <button type="button" className="template-btn logs-btn" onClick={downloadFailedLogs}>
              Download Failed Logs
            </button>
          </div>
          <ol>
            {importErrors.map((err, idx) => (
              <li key={`${idx}-${err}`}>{err}</li>
            ))}
          </ol>
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

          <div className="template-barangay-select">
            <label htmlFor="template-barangay">Template Barangay</label>
            <DownwardSelect
              id="template-barangay"
              value={templateBarangay}
              onChange={setTemplateBarangay}
              options={[
                { value: '', label: 'Select barangay' },
                ...BARANGAYS.map((b) => ({ value: b, label: BARANGAY_DISPLAY[b] || b })),
              ]}
            />
          </div>

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
              disabled={!templateBarangay}
            >
              Download Template
            </button>
          </div>
        </div>

        <div className="import-instructions">
          <div className="import-instructions-header">
            <h3>Import Instructions</h3>
            <button
              type="button"
              className="abbr-info-btn"
              onClick={() => setShowAbbreviations((v) => !v)}
              aria-label="Toggle abbreviation guide"
              title="Show abbreviation guide"
            >
              i
            </button>
          </div>
          <div className="instruction-block">
            <h4>Quick Start</h4>
            <ol>
              <li><strong>Select barangay</strong> then click <strong>Download Template</strong>.</li>
              <li><strong>Open Excel template</strong> and fill row 5–6 header fields.</li>
              <li><strong>Fill household data</strong> using the 3-row format per household.</li>
              <li><strong>Upload file</strong> and click <strong>Import Data</strong>.</li>
            </ol>
          </div>

          <div className="instruction-block">
            <h4>Header Fields (Rows 5-6)</h4>
            <ul>
              <li><strong>Purok/Sitio:</strong> Free text (example: <strong>Purok 1</strong>).</li>
              <li><strong>Barangay:</strong> Auto-filled from selected template barangay.</li>
              <li><strong>Municipality/City:</strong> Cabuyao.</li>
              <li><strong>Province:</strong> Laguna.</li>
            </ul>
          </div>

          <div className="instruction-block">
            <h4>Household Row Format</h4>
            <ul>
              <li><strong>1 household = 3 rows:</strong> Fa (Father), Mo (Mother), Ca (Caregiver).</li>
              <li><strong>Required:</strong> Household No. in <strong>column A</strong> on the Father row.</li>
              <li><strong>Members count:</strong> Should match total values in age/health columns (<strong>C6-C25</strong>).</li>
              <li><strong>Import behavior:</strong> Duplicates are skipped; only new rows are imported.</li>
            </ul>
          </div>

          <p className="import-instructions-note">Tip: Keep one household per 3-row block and avoid editing the template headers (C1-C34) to prevent mapping errors.</p>
        </div>
      </div>

      {showAbbreviations && (
        <div className="abbr-modal-overlay" onClick={() => setShowAbbreviations(false)}>
          <div className="abbr-modal" onClick={(e) => e.stopPropagation()}>
            <div className="abbr-modal-header">
              <h3>Abbreviation Guide</h3>
              <button
                type="button"
                className="abbr-modal-close"
                aria-label="Close abbreviation guide"
                onClick={() => setShowAbbreviations(false)}
              >
                &times;
              </button>
            </div>
            <div className="abbr-modal-body">
              <p className="abbr-modal-intro">Use these codes when filling columns in the template. You can copy the code exactly as shown.</p>

              <div className="abbr-section">
                <h4>Quick Labels</h4>
                <div className="abbr-grid two-col">
                  <div className="abbr-item"><span className="code">HH</span><span className="desc">Household</span></div>
                  <div className="abbr-item"><span className="code">Fa</span><span className="desc">Father</span></div>
                  <div className="abbr-item"><span className="code">Mo</span><span className="desc">Mother</span></div>
                  <div className="abbr-item"><span className="code">Ca</span><span className="desc">Caregiver</span></div>
                </div>
              </div>

              <div className="abbr-section">
                <h4>NHTS (col D)</h4>
                <div className="abbr-grid">
                  <div className="abbr-item"><span className="code">1</span><span className="desc">NHTS 4Ps</span></div>
                  <div className="abbr-item"><span className="code">2</span><span className="desc">NHTS Non-4Ps</span></div>
                  <div className="abbr-item"><span className="code">3</span><span className="desc">Non-NHTS</span></div>
                </div>
              </div>

              <div className="abbr-section">
                <h4>Indigenous (col E)</h4>
                <div className="abbr-grid">
                  <div className="abbr-item"><span className="code">1</span><span className="desc">IP</span></div>
                  <div className="abbr-item"><span className="code">2</span><span className="desc">Non-IP</span></div>
                </div>
              </div>

              <div className="abbr-section">
                <h4>Occupation (col AA)</h4>
                <div className="abbr-grid">
                  <div className="abbr-item"><span className="code">1</span><span className="desc">Manager</span></div>
                  <div className="abbr-item"><span className="code">2</span><span className="desc">Professional</span></div>
                  <div className="abbr-item"><span className="code">3</span><span className="desc">Technician &amp; Associate Professionals</span></div>
                  <div className="abbr-item"><span className="code">4</span><span className="desc">Clerical Support Workers</span></div>
                  <div className="abbr-item"><span className="code">5</span><span className="desc">Service &amp; Sales Workers</span></div>
                  <div className="abbr-item"><span className="code">6</span><span className="desc">Skilled agricultural/forestry/fishery workers</span></div>
                  <div className="abbr-item"><span className="code">7</span><span className="desc">Craft &amp; related trade workers</span></div>
                  <div className="abbr-item"><span className="code">8</span><span className="desc">Plant &amp; machine operators &amp; assemblers</span></div>
                  <div className="abbr-item"><span className="code">9</span><span className="desc">Elementary occupations</span></div>
                  <div className="abbr-item"><span className="code">10</span><span className="desc">Armed Forces Occupations</span></div>
                  <div className="abbr-item"><span className="code">11</span><span className="desc">None</span></div>
                </div>
              </div>

              <div className="abbr-section">
                <h4>Educational Attainment (col AB)</h4>
                <div className="abbr-grid">
                  <div className="abbr-item"><span className="code">N</span><span className="desc">None</span></div>
                  <div className="abbr-item"><span className="code">EU</span><span className="desc">Elementary undergraduate</span></div>
                  <div className="abbr-item"><span className="code">EG</span><span className="desc">Elementary graduate</span></div>
                  <div className="abbr-item"><span className="code">HU</span><span className="desc">High school undergraduate</span></div>
                  <div className="abbr-item"><span className="code">HG</span><span className="desc">High school graduate</span></div>
                  <div className="abbr-item"><span className="code">CU</span><span className="desc">College undergraduate</span></div>
                  <div className="abbr-item"><span className="code">CG</span><span className="desc">College graduate</span></div>
                  <div className="abbr-item"><span className="code">V</span><span className="desc">Vocational</span></div>
                  <div className="abbr-item"><span className="code">PG</span><span className="desc">Post graduate studies</span></div>
                </div>
              </div>

              <div className="abbr-section">
                <h4>Toilet (col AD)</h4>
                <div className="abbr-grid">
                  <div className="abbr-item"><span className="code">1</span><span className="desc">Improved sanitation</span></div>
                  <div className="abbr-item"><span className="code">2</span><span className="desc">Shared facility</span></div>
                  <div className="abbr-item"><span className="code">3</span><span className="desc">Unimproved</span></div>
                  <div className="abbr-item"><span className="code">4</span><span className="desc">Open defecation</span></div>
                </div>
              </div>

              <div className="abbr-section">
                <h4>Water Source (col AE)</h4>
                <div className="abbr-grid">
                  <div className="abbr-item"><span className="code">1</span><span className="desc">Improved source</span></div>
                  <div className="abbr-item"><span className="code">2</span><span className="desc">Unimproved source</span></div>
                </div>
              </div>

              <div className="abbr-section">
                <h4>Food Production (col AF)</h4>
                <div className="abbr-grid">
                  <div className="abbr-item"><span className="code">VG</span><span className="desc">Vegetable Garden</span></div>
                  <div className="abbr-item"><span className="code">FT</span><span className="desc">Fruit</span></div>
                  <div className="abbr-item"><span className="code">PL</span><span className="desc">Poultry/Livestock</span></div>
                  <div className="abbr-item"><span className="code">FP</span><span className="desc">Fish pond</span></div>
                  <div className="abbr-item"><span className="code">NA</span><span className="desc">None</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Change Confirmation Modal ──────────────────────────────── */}
      {showChangeModal && (
        <div className="change-modal-overlay" onClick={() => setShowChangeModal(false)}>
          <div className="change-modal" onClick={(e) => e.stopPropagation()}>
            <div className="change-modal-header">
              <div>
                <h3>Changes Detected</h3>
                <p className="change-modal-subtitle">
                  {changedHouseholds.length} household{changedHouseholds.length > 1 ? 's have' : ' has'} different data
                  compared to what is already in the system. Select which ones to update.
                </p>
              </div>
              <button
                type="button"
                className="abbr-modal-close"
                aria-label="Close"
                onClick={() => setShowChangeModal(false)}
              >
                &times;
              </button>
            </div>

            <div className="change-modal-body">
              {changedHouseholds.map((ch) => (
                <div key={ch.index} className={`change-household-card ${selectedForUpdate.has(ch.index) ? 'selected' : ''}`}>
                  <div className="change-household-card-header">
                    <label className="change-checkbox-label">
                      <input
                        type="checkbox"
                        checked={selectedForUpdate.has(ch.index)}
                        onChange={() => toggleHouseholdForUpdate(ch.index)}
                        className="change-checkbox"
                      />
                      <span className="change-hh-title">
                        Household No. <strong>{ch.household_number}</strong>
                      </span>
                    </label>
                    <span className="change-hh-location">
                      {ch.barangay} / {ch.purok_sito}
                    </span>
                  </div>
                  <div className="change-diff-table-wrapper">
                    <table className="change-diff-table">
                      <thead>
                        <tr>
                          <th>Field</th>
                          <th>Current (in system)</th>
                          <th>New (from Excel)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ch.diffs.map((diff) => (
                          <tr key={diff.field}>
                            <td className="diff-field-label">{diff.label}</td>
                            <td className="diff-old">{formatDisplayValue(diff.oldValue)}</td>
                            <td className="diff-new">{formatDisplayValue(diff.newValue)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>

            <div className="change-modal-footer">
              <button
                type="button"
                className="change-skip-btn"
                onClick={handleSkipAllChanges}
              >
                Skip All Changes
              </button>
              <button
                type="button"
                className="change-confirm-btn"
                onClick={handleConfirmedImport}
                disabled={selectedForUpdate.size === 0}
              >
                Confirm Update ({selectedForUpdate.size} household{selectedForUpdate.size !== 1 ? 's' : ''})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportData;
