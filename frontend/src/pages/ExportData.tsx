import { useState } from 'react';
import axios from 'axios';
import api from '../lib/api';
import ExcelJS from 'exceljs';
import {
  aggregateSummary,
  applyFilters,
  BARANGAYS,
  BARANGAY_DISPLAY,
  type SurveySummary,
} from '../utils/surveySummary';
import { getBnsOptions, resolveBnsForBarangay } from '../utils/bnsByBarangay';
import DownwardSelect from '../components/DownwardSelect';
import { buildBnsFormHeader, applyBnsColumnWidths } from '../utils/bnsFormTemplate';
import './ExportData.css';

const OCC_LABELS = [
  '1_Manager', '2_Professional', '3_Technician & Associate Professionals', '4_Clerical Support Workers',
  '5_Service & Sales Workers', '6_Skilled agricultural, forestry & fishery workers', '7_Craft & related trade workers',
  '8_Plant & machine operators & assemblers', '9_Elementary occupations', '10_Armed Forces Occupations', '11_None',
];
const ED_LABELS = ['N_None', 'EU_Elem undergraduate', 'EG_Elem graduate', 'HU_High school undergraduate', 'HG_High school graduate', 'CU_College undergraduate', 'CG_College graduate', 'V_Vocational', 'PG_Post graduate studies'];

const ExportData = () => {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [summaryFilters, setSummaryFilters] = useState({
    bns: '',
    barangay: '',
    purokBlockStreet: '',
    surveyYear: '',
    surveyPeriodFrom: '',
    surveyPeriodTo: '',
  });
  const summaryBnsOptions = getBnsOptions(summaryFilters.barangay);
  const summaryHasMultipleBns = summaryBnsOptions.length > 1;

  const handleSummaryBarangayChange = (barangay: string) => {
    setSummaryFilters((f) => ({
      ...f,
      barangay,
      bns: resolveBnsForBarangay(barangay, f.bns),
    }));
  };

  const handleExport = async (format: 'json' | 'csv' | 'excel') => {
    setExporting(true);
    setMessage(null);

    try {
      const response = await api.get('/households', { params: { per_page: 10000 } });
      const households = response.data.data || [];

      if (format === 'json') {
        const dataStr = JSON.stringify(households, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `household-data-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Data exported successfully as JSON!' });
      } else if (format === 'csv') {
        // CSV export
        const headers = [
          'Household Number',
          'Barangay',
          'Municipality/City',
          'Province',
          'Number of Members',
          'NHTS Group',
          'Indigenous Group',
        ];
        
        const rows = households.map((h: any) => [
          h.household_number || '',
          h.barangay || '',
          h.municipality_city || '',
          h.province || '',
          h.number_of_members || 0,
          h.nhts_household_group || '',
          h.indigenous_group || '',
        ]);

        const csvContent = [
          headers.join(','),
          ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const dataBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `household-data-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Data exported successfully as CSV!' });
      } else if (format === 'excel') {
        // Excel (BNS Form) - same layout as Import page Download Template: rows 1-10 header, 3 rows per household
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Household Data', { properties: { defaultRowHeight: 18 } });
        buildBnsFormHeader(worksheet);

        const thinBorder = {
          top: { style: 'thin' as const },
          left: { style: 'thin' as const },
          bottom: { style: 'thin' as const },
          right: { style: 'thin' as const },
        };

        households.forEach((h: any) => {
          const father = h.members?.find((m: any) => m.role === 'father');
          const mother = h.members?.find((m: any) => m.role === 'mother');
          const caregiver = h.members?.find((m: any) => m.role === 'caregiver');
          const fpVal = h.couple_practicing_family_planning === true ? 'Yes' : h.couple_practicing_family_planning === false ? 'No' : '';
          const saltVal = h.using_iodized_salt ? 'Yes' : '';
          const riceVal = h.using_iron_fortified_rice ? 'Yes' : '';

          // Row 1 (Fa): HH data + age counts + Fa name, occupation, edu + household C29-C34
          const r1 = worksheet.addRow([]);
          r1.getCell(1).value = h.household_number || '';
          r1.getCell(2).value = h.family_living_in_house ?? '';
          r1.getCell(3).value = h.number_of_members ?? '';
          r1.getCell(4).value = h.nhts_household_group || '';
          r1.getCell(5).value = h.indigenous_group || '';
          const ageFields = ['newborn_male','newborn_female','infant_male','infant_female','under_five_male','under_five_female','children_male','children_female','adolescence_male','adolescence_female','pregnant','adolescent_pregnant','post_partum','women_15_49_not_pregnant','adult_male','adult_female','senior_citizen_male','senior_citizen_female','pwd_male','pwd_female'];
          for (let c = 6; c <= 25; c++) r1.getCell(c).value = (h as any)[ageFields[c - 6]] ?? 0;
          r1.getCell(26).value = father?.name || '(Fa)';
          r1.getCell(27).value = father?.occupation || '';
          r1.getCell(28).value = father?.educational_attainment || '';
          r1.getCell(29).value = fpVal;
          r1.getCell(30).value = h.toilet_type || '';
          r1.getCell(31).value = h.water_source || '';
          r1.getCell(32).value = h.food_production_activity || '';
          r1.getCell(33).value = saltVal;
          r1.getCell(34).value = riceVal;

          // Row 2 (Mo)
          const r2 = worksheet.addRow([]);
          r2.getCell(26).value = mother?.name || '(Mo)';
          r2.getCell(27).value = mother?.occupation || '';
          r2.getCell(28).value = mother?.educational_attainment || '';

          // Row 3 (Ca)
          const r3 = worksheet.addRow([]);
          r3.getCell(26).value = caregiver?.name || '(Ca)';
          r3.getCell(27).value = caregiver?.occupation || '';
          r3.getCell(28).value = caregiver?.educational_attainment || '';

          for (const row of [r1, r2, r3]) {
            for (let c = 1; c <= 34; c++) {
              row.getCell(c).border = thinBorder;
              if (c <= 25 || (c >= 29 && c <= 34)) row.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
            }
          }

          const startRow = worksheet.rowCount - 2;
          const endRow = worksheet.rowCount;
          worksheet.mergeCells(startRow, 1, endRow, 1);
          for (let c = 2; c <= 25; c++) worksheet.mergeCells(startRow, c, endRow, c);
          for (let c = 29; c <= 34; c++) worksheet.mergeCells(startRow, c, endRow, c);
        });

        applyBnsColumnWidths(worksheet);

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Nutrition BNS Form ${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Data exported successfully as Excel (BNS Form format)!' });
      }
    } catch (error: any) {
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error exporting data' 
      });
    } finally {
      setExporting(false);
    }
  };

  const handleExportSurveySummary = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const res = await api.get('/households', { params: { per_page: 10000 } });
      const list = res.data?.data ?? res.data ?? [];
      const households = Array.isArray(list) ? list : [];
      const filtered = applyFilters(households, {
        barangay: summaryFilters.barangay,
        purokBlockStreet: summaryFilters.purokBlockStreet,
        surveyYear: summaryFilters.surveyYear,
        surveyPeriodFrom: summaryFilters.surveyPeriodFrom,
        surveyPeriodTo: summaryFilters.surveyPeriodTo,
      });
      const s = aggregateSummary(filtered);
      s.basic.bns = summaryFilters.bns || '—';
      s.basic.barangay = summaryFilters.barangay ? (BARANGAY_DISPLAY[summaryFilters.barangay] || summaryFilters.barangay) : 'All Barangays';
      s.basic.purokBlockStreet = summaryFilters.purokBlockStreet || '—';
      if (summaryFilters.surveyPeriodFrom && summaryFilters.surveyPeriodTo) {
        s.basic.surveyPeriod = `${summaryFilters.surveyPeriodFrom} - ${summaryFilters.surveyPeriodTo}`;
      } else if (summaryFilters.surveyPeriodFrom) {
        s.basic.surveyPeriod = `From ${summaryFilters.surveyPeriodFrom}`;
      } else if (summaryFilters.surveyPeriodTo) {
        s.basic.surveyPeriod = `To ${summaryFilters.surveyPeriodTo}`;
      } else {
        s.basic.surveyPeriod = summaryFilters.surveyYear ? summaryFilters.surveyYear : '—';
      }
      s.basic.surveyYear = summaryFilters.surveyYear || new Date().getFullYear().toString();

      const year = new Date().getFullYear();
      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Family Profile Survey Summary', { views: [{ rightToLeft: false }] });
      ws.pageSetup.orientation = 'landscape';
      ws.pageSetup.fitToPage = true;
      ws.properties.defaultRowHeight = 18;

      const thinBorder = { top: { style: 'thin' as const }, left: { style: 'thin' as const }, bottom: { style: 'thin' as const }, right: { style: 'thin' as const } };
      const headerFont = { bold: true, size: 11 };
      const titleFont = { bold: true, size: 14 };

      const r1 = ws.addRow(['Republika ng Pilipinas']);
      ws.mergeCells(1, 1, 1, 6);
      r1.getCell(1).font = { size: 11 };
      r1.getCell(1).alignment = { horizontal: 'center' };

      const r2 = ws.addRow(['Lalawigan ng Laguna']);
      ws.mergeCells(2, 1, 2, 6);
      r2.getCell(1).font = { size: 11 };
      r2.getCell(1).alignment = { horizontal: 'center' };

      const r3 = ws.addRow(['Pamahalaang Lungsod ng CABUYAO']);
      ws.mergeCells(3, 1, 3, 6);
      r3.getCell(1).font = headerFont;
      r3.getCell(1).alignment = { horizontal: 'center' };

      const r4 = ws.addRow(['TANGGAPANG PANLUNGSOD NG NUTRISYON']);
      ws.mergeCells(4, 1, 4, 6);
      r4.getCell(1).font = headerFont;
      r4.getCell(1).alignment = { horizontal: 'center' };

      const r5 = ws.addRow([`FAMILY PROFILE Survey Summary ${year}`]);
      ws.mergeCells(5, 1, 5, 6);
      r5.getCell(1).font = titleFont;
      r5.getCell(1).alignment = { horizontal: 'center' };

      ws.addRow([]);
      const r7 = ws.addRow(['BARANGAY', '', 'PUROK / BLOCK / STREET', '', 'SURVEY PERIOD & YEAR', '']);
      r7.getCell(1).value = 'BARANGAY';
      r7.getCell(2).value = s.basic.barangay;
      r7.getCell(3).value = 'PUROK / BLOCK / STREET';
      r7.getCell(4).value = s.basic.purokBlockStreet;
      r7.getCell(5).value = 'SURVEY PERIOD & YEAR';
      r7.getCell(6).value = s.basic.surveyPeriod || s.basic.surveyYear;
      r7.eachCell((c, colNumber) => {
        c.font = headerFont;
        c.border = thinBorder;
        if (colNumber === 2 || colNumber === 4 || colNumber === 6) c.alignment = { ...c.alignment, horizontal: 'center' };
      });

      const col1: [string, string | number][] = [
        ['BARANGAY NUTRITION SCHOLAR', s.basic.bns],
        ['Total No. of Households', s.totals.households],
        ['Total No. of Families', s.totals.families],
        ['Family Size: more than 10', s.familySize.moreThan10],
        ['Family Size: 8-10', s.familySize.n8to10],
        ['Family Size: 6-7', s.familySize.n6to7],
        ['Family Size: 2-5', s.familySize.n2to5],
        ['Family Size: 1', s.familySize.n1],
        ['Total No. of Purok/Block/Street', s.totals.purokBlockStreet],
        ['Total Population', s.totals.population],
        ['No. of Family Members by Age Classification & Health Risk Group:', ''],
        ['Newborn 0-28 days', s.ageHealth.newborn],
        ['Infants 29 days - 11 mos', s.ageHealth.infants],
        ['Under-five 1-4 years old', s.ageHealth.underFive],
        ['Children 5-9 years old', s.ageHealth.children5_9],
        ['Adolescents 10-19 y.o.', s.ageHealth.adolescence],
        ['Pregnant', s.ageHealth.pregnant],
        ['Adolescent Pregnant', s.ageHealth.adolescentPregnant],
        ['Post-Partum', s.ageHealth.postPartum],
        ['15-49 y.o. (non pregnant & non-PP)', s.ageHealth.women15_49],
        ['Adult 20-59 y.o.', s.ageHealth.adult],
        ['Senior Citizens', s.ageHealth.seniorCitizens],
        ['Persons with Disability', s.ageHealth.pwd],
        ['Father Occupation', ''],
        ...OCC_LABELS.map((lbl, i) => [lbl, s.fatherOcc[i] ?? 0] as [string, number]),
        ['Father Educational Attainment', ''],
        ...ED_LABELS.map((lbl, i) => [lbl, s.fatherEd[i] ?? 0] as [string, number]),
      ];
      const col2: [string, string | number][] = [
        ['Mother Occupation', ''],
        ...OCC_LABELS.map((lbl, i) => [lbl, s.motherOcc[i] ?? 0] as [string, number]),
        ['Mother Educational Attainment', ''],
        ...ED_LABELS.map((lbl, i) => [lbl, s.motherEd[i] ?? 0] as [string, number]),
        ['Caregiver Occupation', ''],
        ...OCC_LABELS.map((lbl, i) => [lbl, s.caregiverOcc[i] ?? 0] as [string, number]),
        ['Caregiver Educational Attainment', ''],
        ...ED_LABELS.map((lbl, i) => [lbl, s.caregiverEd[i] ?? 0] as [string, number]),
      ];
      const col3: [string, string | number][] = [
        ['Total No. of Couple Practicing Family Planning', s.practices.coupleFP],
        ['Households with: Toilet Type', ''],
        ['Improved Sanitation', s.practices.toiletImproved],
        ['Shared Facility', s.practices.toiletShared],
        ['Unimproved', s.practices.toiletUnimproved],
        ['Open defecation', s.practices.toiletOpen],
        ['Water Source', ''],
        ['Improved water source', s.practices.waterImproved],
        ['Unimproved water source', s.practices.waterUnimproved],
        ['Food Production', ''],
        ['VG_Vegetable garden', s.practices.foodVG],
        ['FT_Fruit', s.practices.foodFruit],
        ['PL_Poultry/livestock', s.practices.foodPL],
        ['FP_Fishpond', s.practices.foodFP],
        ['NA_None', s.practices.foodNone],
        ['Households using: Iodized salt', s.practices.iodizedSalt],
        ['Households using: Iron-Fortified Rice', s.practices.ironFortifiedRice],
      ];
      const maxLen = Math.max(col1.length, col2.length, col3.length);
      for (let i = 0; i < maxLen; i++) {
        const row = ws.addRow([
          i < col1.length ? col1[i][0] : '',
          i < col1.length ? col1[i][1] : '',
          i < col2.length ? col2[i][0] : '',
          i < col2.length ? col2[i][1] : '',
          i < col3.length ? col3[i][0] : '',
          i < col3.length ? col3[i][1] : '',
        ]);
        row.eachCell((cell, colNumber) => {
          cell.border = thinBorder;
          cell.alignment = { vertical: 'middle', wrapText: true };
          if (colNumber === 2 || colNumber === 4 || colNumber === 6) cell.alignment = { ...cell.alignment, horizontal: 'center' };
        });
      }

      ws.getColumn(1).width = 42;
      ws.getColumn(2).width = 12;
      ws.getColumn(3).width = 42;
      ws.getColumn(4).width = 12;
      ws.getColumn(5).width = 42;
      ws.getColumn(6).width = 14;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Family-Profile-Survey-Summary-${year}-${summaryFilters.barangay || 'All'}.xlsx`;
      link.click();
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Family Profile Survey Summary exported as Excel.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Error exporting summary' });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="export-data">
      <div className="export-header">
        <h1>Export Data</h1>
        <p>Download household profile data in various formats</p>
      </div>

      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="export-options">
        <div className="export-card export-card-summary">
          <h2>Family Profile Survey Summary (Excel)</h2>
          <p>Export aggregated data in the form layout matching the &quot;FAMILY PROFILE Survey Summary&quot; sheet. Use filters to limit by barangay, purok, and survey period. Data is computed from household records.</p>
          <div className="summary-filters-inline">
            <div className="filter-row">
              <label>BNS</label>
              {summaryHasMultipleBns ? (
                <select value={summaryFilters.bns} onChange={(e) => setSummaryFilters((f) => ({ ...f, bns: e.target.value }))}>
                  {summaryBnsOptions.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
              ) : (
                <input type="text" value={summaryFilters.bns} onChange={(e) => setSummaryFilters((f) => ({ ...f, bns: e.target.value }))} placeholder="Barangay Nutrition Scholar" />
              )}
            </div>
            <div className="filter-row">
              <label>Barangay</label>
              <DownwardSelect
                value={summaryFilters.barangay}
                onChange={handleSummaryBarangayChange}
                options={[
                  { value: '', label: 'All Barangays' },
                  ...BARANGAYS.map((b) => ({ value: b, label: BARANGAY_DISPLAY[b] || b })),
                ]}
              />
            </div>
            <div className="filter-row">
              <label>Purok / Block / Street</label>
              <input type="text" value={summaryFilters.purokBlockStreet} onChange={(e) => setSummaryFilters((f) => ({ ...f, purokBlockStreet: e.target.value }))} placeholder="Optional" />
            </div>
            <div className="filter-row">
              <label>Survey Year</label>
              <input type="text" value={summaryFilters.surveyYear} onChange={(e) => setSummaryFilters((f) => ({ ...f, surveyYear: e.target.value }))} placeholder="e.g. 2026" />
            </div>
            <div className="filter-row">
              <label>Period From</label>
              <input type="date" value={summaryFilters.surveyPeriodFrom} onChange={(e) => setSummaryFilters((f) => ({ ...f, surveyPeriodFrom: e.target.value }))} />
            </div>
            <div className="filter-row">
              <label>Period To</label>
              <input type="date" value={summaryFilters.surveyPeriodTo} onChange={(e) => setSummaryFilters((f) => ({ ...f, surveyPeriodTo: e.target.value }))} />
            </div>
          </div>
          <button type="button" className="export-btn primary" disabled={exporting} onClick={handleExportSurveySummary}>
            {exporting ? 'Exporting...' : 'Export Family Profile Summary (Excel)'}
          </button>
        </div>

        <div className="export-card">
          <h2>Excel Format (BNS Form)</h2>
          <p>Export household data as Excel file matching the BNS Form No. 1A structure with all columns (C1-C34).</p>
          <button 
            onClick={() => handleExport('excel')} 
            className="export-btn primary"
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export as Excel (BNS Form)'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ExportData;
