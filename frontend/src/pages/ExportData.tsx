import { useState } from 'react';
import api from '../lib/api';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  aggregateSummary,
  applyFilters,
  BARANGAYS,
  BARANGAY_DISPLAY,
} from '../utils/surveySummary';
import { getBnsOptions, resolveBnsForBarangay } from '../utils/bnsByBarangay';
import DownwardSelect from '../components/DownwardSelect';
import {  } from '../utils/bnsFormTemplate';
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

  // Separate BNS Form filter state
  const [bnsFormFilters, setBnsFormFilters] = useState({
    barangay: '',
    purokSitio: '',
  });

  const handleSummaryBarangayChange = (barangay: string) => {
    setSummaryFilters((f) => ({
      ...f,
      barangay,
      bns: resolveBnsForBarangay(barangay, f.bns),
    }));
  };

  const handleBnsFormBarangayChange = (barangay: string) => {
    setBnsFormFilters((f) => ({
      ...f,
      barangay,
      purokSitio: '',
    }));
  };

  const handleExportBnsPdf = async () => {
    setExporting(true);
    setMessage(null);
    try {
      const res = await api.get('/households', { params: { per_page: 10000 } });
      const list = res.data?.data ?? res.data ?? [];
      let households = Array.isArray(list) ? list : [];
      // Use separate BNS Form filters
      households = applyFilters(households, {
        barangay: bnsFormFilters.barangay,
        purokBlockStreet: bnsFormFilters.purokSitio,
        surveyYear: '',
        surveyPeriodFrom: '',
        surveyPeriodTo: '',
      });

      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = (doc.internal.pageSize as any).getWidth();

      // Header
      doc.setFontSize(12);
      doc.text('HOUSEHOLD PROFILE', pageWidth / 2, 30, { align: 'center' });
      const barangayLabel = bnsFormFilters.barangay ? (BARANGAY_DISPLAY[bnsFormFilters.barangay] || bnsFormFilters.barangay) : 'All Barangays';
      doc.setFontSize(9);
      doc.text(`Barangay: ${barangayLabel}`, 40, 50);
      doc.text(`Purok/Sitio: ${bnsFormFilters.purokSitio || '—'}`, 300, 50);

      // Build table head (C1..C34)
      const head = [[
        'C1','C2','C3','C4','C5',
        'C6','C7','C8','C9','C10','C11','C12','C13','C14','C15','C16','C17','C18','C19','C20','C21','C22','C23','C24','C25',
        'C26','C27','C28','C29','C30','C31','C32','C33','C34'
      ]];

      const ageFields = ['newborn_male','newborn_female','infant_male','infant_female','under_five_male','under_five_female','children_male','children_female','adolescence_male','adolescence_female','pregnant','adolescent_pregnant','post_partum','women_15_49_not_pregnant','adult_male','adult_female','senior_citizen_male','senior_citizen_female','pwd_male','pwd_female'];

      const body: any[] = [];
      households.forEach((h: any) => {
        const father = h.members?.find((m: any) => m.role === 'father');
        const mother = h.members?.find((m: any) => m.role === 'mother');
        const caregiver = h.members?.find((m: any) => m.role === 'caregiver');
        const fpVal = h.couple_practicing_family_planning === true ? 'Yes' : h.couple_practicing_family_planning === false ? 'No' : '';
        const saltVal = h.using_iodized_salt ? 'Yes' : '';
        const riceVal = h.using_iron_fortified_rice ? 'Yes' : '';

        const r1: any[] = [];
        r1[0] = h.household_number || '';
        r1[1] = h.family_living_in_house ?? '';
        r1[2] = h.number_of_members ?? '';
        r1[3] = h.nhts_household_group || '';
        r1[4] = h.indigenous_group || '';
        for (let i = 0; i < 20; i++) r1[5 + i] = (h as any)[ageFields[i]] ?? 0;
        r1[25] = father?.name || '(Fa)';
        r1[26] = father?.occupation || '';
        r1[27] = father?.educational_attainment || '';
        r1[28] = fpVal;
        r1[29] = h.toilet_type || '';
        r1[30] = h.water_source || '';
        r1[31] = h.food_production_activity || '';
        r1[32] = saltVal;
        r1[33] = riceVal;

        const r2 = new Array(34).fill('');
        r2[25] = mother?.name || '(Mo)';
        r2[26] = mother?.occupation || '';
        r2[27] = mother?.educational_attainment || '';

        const r3 = new Array(34).fill('');
        r3[25] = caregiver?.name || '(Ca)';
        r3[26] = caregiver?.occupation || '';
        r3[27] = caregiver?.educational_attainment || '';

        body.push(r1);
        body.push(r2);
        body.push(r3);
      });

      autoTable(doc as any, {
        head,
        body,
        startY: 70,
        styles: { fontSize: 7 },
        headStyles: { fillColor: [220,220,220] },
        theme: 'grid',
        columnStyles: {
          // make columns narrow to fit
          0: { cellWidth: 30 },
        }
      });

      const fileName = `Nutrition_BNS_Form_${new Date().toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);
      setMessage({ type: 'success', text: `BNS Form PDF generated (${households.length} households).` });
    } catch (err: any) {
      console.error('handleExportBnsPdf error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Error generating BNS PDF' });
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
      const r7 = ws.addRow(['BARANGAY', '', 'PUROK / BLOCK / SITIO', '', 'SURVEY PERIOD & YEAR', '']);
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

  const handleExportSurveySummaryPdf = async () => {
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
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = (doc.internal.pageSize as any).getWidth();
      const pageHeight = (doc.internal.pageSize as any).getHeight();

      // Header block (centered) - smaller fonts for single-page fit
      const headerTop = 14;
      doc.setFontSize(9);
      doc.text('Republika ng Pilipinas', pageWidth / 2, headerTop, { align: 'center' });
      doc.text('Lalawigan ng Laguna', pageWidth / 2, headerTop + 12, { align: 'center' });
      doc.setFontSize(10);
      doc.text('Pamahalaang Lungsod ng CABUYAO', pageWidth / 2, headerTop + 24, { align: 'center' });
      doc.text('TANGGAPANG PANLUNGSOD NG NUTRISYON', pageWidth / 2, headerTop + 36, { align: 'center' });
      doc.setFontSize(12);
      const titleY = headerTop + 48;
      doc.text(`FAMILY PROFILE Survey Summary ${year}`, pageWidth / 2, titleY, { align: 'center' });

      // Draw three main column boxes with smaller margins
      const smallMargin = 16;
      const colW = (pageWidth - smallMargin * 2) / 3;
      const colX = [smallMargin, smallMargin + colW, smallMargin + 2 * colW];
      const colY = 96;
      const colH = pageHeight - colY - smallMargin;
      doc.setLineWidth(0.5);
      for (let i = 0; i < 3; i++) {
        doc.rect(colX[i], colY, colW, colH);
      }

      // Top labels and values (single-line layout)
      const labelY = colY - 6;
      doc.setFontSize(9.5);
      // Prepare and truncate long values to avoid overlap
      const bnsText = String(s.basic.bns || '—');
      let barangayText = String(s.basic.barangay || '—');
      let purokText = String(s.basic.purokBlockStreet || '—');
      const surveyText = String(s.basic.surveyPeriod || s.basic.surveyYear || '—');
      const maxMidLen = 28;
      if (barangayText.length > maxMidLen) barangayText = barangayText.slice(0, maxMidLen) + '...';
      if (purokText.length > maxMidLen) purokText = purokText.slice(0, maxMidLen) + '...';

      // Left: BNS
      doc.text(`BARANGAY NUTRITION SCHOLAR: ${bnsText}`, colX[0] + 6, labelY);
      // Middle: Barangay left-aligned in middle column
      doc.text(`BARANGAY: ${barangayText}`, colX[1] + 6, labelY);
      // Middle: Purok right-aligned in middle column to avoid collision
      doc.text(`PUROK / BLOCK / SITIO: ${purokText}`, colX[1] + colW + 6, labelY, { align: 'right' });
      // Right: Survey period & year
      doc.text(`SURVEY PERIOD & YEAR: ${surveyText}`, colX[2] + colW - 46, labelY, { align: 'right' });

      // normalize columns: single starting Y and consistent line height
      const colStartY = colY + 10;
      const lineH = 9;

      // helper: write a right-aligned value and draw an underline under it
      const drawValue = (xRight: number, yPos: number, val: any, underlineWidth = 36) => {
        const text = String(val ?? '');
        const xEnd = xRight - 2;
        const xStart = xEnd - underlineWidth;
        const centerX = (xStart + xEnd) / 2;
        const textWidth = (doc as any).getTextWidth ? (doc as any).getTextWidth(text) : text.length * 6;
        const textX = centerX - textWidth / 2;
        doc.text(text, textX, yPos);
        const lineY = yPos + 2;
        doc.setLineWidth(0.5);
        doc.line(xStart, lineY, xEnd, lineY);
      };

      // Left column
      let yLeft = colStartY;
      doc.setFontSize(8);
      const leftLines2 = [
        ['Total No. of Households', String(s.totals.households ?? '')],
        ['Total No. of Families', String(s.totals.families ?? '')],
        ['Family Size: more than 10', String(s.familySize.moreThan10 ?? 0)],
        ['Family Size: 8-10', String(s.familySize.n8to10 ?? 0)],
        ['Family Size: 6-7', String(s.familySize.n6to7 ?? 0)],
        ['Family Size: 2-5', String(s.familySize.n2to5 ?? 0)],
        ['Family Size: 1', String(s.familySize.n1 ?? 0)],
        ['Total No. of Purok/Block/Street', String(s.totals.purokBlockStreet ?? '')],
        ['Total Population', String(s.totals.population ?? '')],
      ];
      leftLines2.forEach(([label, val]) => {
        doc.text(String(label), colX[0] + 8, yLeft);
        drawValue(colX[0] + colW - 20, yLeft, val, 28);
        yLeft += lineH;
      });

      yLeft += lineH;
      doc.text('No. of Family Members by Age Classification & Health Risk Group:', colX[0] + 8, yLeft);
      yLeft += lineH;
      const ageRows2 = [
        ['Newborn 0-28 days', s.ageHealth.newborn ?? 0],
        ['Infants 29 days - 11 mos', s.ageHealth.infants ?? 0],
        ['Under-five 1-4 years old', s.ageHealth.underFive ?? 0],
        ['Children 5-9 years old', s.ageHealth.children5_9 ?? 0],
        ['Adolescents 10-19 y.o.', s.ageHealth.adolescence ?? 0],
        ['Pregnant', s.ageHealth.pregnant ?? 0],
        ['Adolescent Pregnant', s.ageHealth.adolescentPregnant ?? 0],
        ['Post-Partum', s.ageHealth.postPartum ?? 0],
        ['15-49 y.o. (non pregnant & non-PP)', s.ageHealth.women15_49 ?? 0],
        ['Adult 20-59 y.o.', s.ageHealth.adult ?? 0],
        ['Senior Citizens', s.ageHealth.seniorCitizens ?? 0],
        ['Persons with Disability', s.ageHealth.pwd ?? 0],
      ];
      ageRows2.forEach(([label, val]) => {
        doc.text(String(label), colX[0] + 8, yLeft);
        drawValue(colX[0] + colW - 18, yLeft, val, 28);
        yLeft += lineH;
      });

      yLeft += lineH;
      doc.text('Father Occupation', colX[0] + 8, yLeft);
      yLeft += lineH;
      OCC_LABELS.forEach((lbl, i) => {
        doc.text(String(`${i + 1}. ${lbl}`), colX[0] + 8, yLeft);
        drawValue(colX[0] + colW - 18, yLeft, s.fatherOcc?.[i] ?? 0, 28);
        yLeft += lineH;
      });
      yLeft += lineH;
      doc.text('Father Educational Attainment', colX[0] + 8, yLeft);
      yLeft += lineH;
      ED_LABELS.forEach((lbl, i) => {
        doc.text(String(lbl), colX[0] + 8, yLeft);
        drawValue(colX[0] + colW - 18, yLeft, s.fatherEd?.[i] ?? 0, 28);
        yLeft += lineH;
      });

      // Middle column
      let yMid = colStartY;
      doc.setFontSize(8);
      doc.text('Mother - Occupation', colX[1] + 6, yMid);
      yMid += lineH;
      OCC_LABELS.forEach((lbl, i) => {
        doc.text(String(`${i + 1}. ${lbl}`), colX[1] + 6, yMid);
        drawValue(colX[1] + colW - 16, yMid, s.motherOcc?.[i] ?? 0, 28);
        yMid += lineH;
      });
      yMid += lineH;
      doc.text('Mother - Educational Attainment', colX[1] + 6, yMid);
      yMid += lineH;
      ED_LABELS.forEach((lbl, i) => {
        doc.text(String(lbl), colX[1] + 6, yMid);
        drawValue(colX[1] + colW - 16, yMid, s.motherEd?.[i] ?? 0, 28);
        yMid += lineH;
      });

      yMid += lineH;
      doc.text('Caregiver - Occupation', colX[1] + 6, yMid);
      yMid += lineH;
      OCC_LABELS.forEach((lbl, i) => {
        doc.text(String(`${i + 1}. ${lbl}`), colX[1] + 6, yMid);
        drawValue(colX[1] + colW - 16, yMid, s.caregiverOcc?.[i] ?? 0, 28);
        yMid += lineH;
      });
      yMid += lineH;
      doc.text('Caregiver - Educational Attainment', colX[1] + 6, yMid);
      yMid += lineH;
      ED_LABELS.forEach((lbl, i) => {
        doc.text(String(lbl), colX[1] + 6, yMid);
        drawValue(colX[1] + colW - 16, yMid, s.caregiverEd?.[i] ?? 0, 28);
        yMid += lineH;
      });

      // Right column
      let yRight = colStartY;
      doc.setFontSize(8);
      doc.text('Total No. of Couple Practicing Family Planning', colX[2] + 8, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.coupleFP ?? 0, 28);
      yRight += lineH;
      doc.text('Households with:', colX[2] + 8, yRight);
      yRight += lineH;
      doc.text('Toilet Type:', colX[2] + 8, yRight);
      yRight += lineH;
      doc.text('Improved Sanitation', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.toiletImproved ?? 0, 28);
      yRight += lineH;
      doc.text('Shared Facility', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.toiletShared ?? 0, 28);
      yRight += lineH;
      doc.text('Unimproved', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.toiletUnimproved ?? 0, 28);
      yRight += lineH;
      doc.text('Open defecation', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.toiletOpen ?? 0, 28);
      yRight += lineH;
      doc.text('Water Source:', colX[2] + 8, yRight);
      yRight += lineH;
      doc.text('Improved water source', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.waterImproved ?? 0, 28);
      yRight += lineH;
      doc.text('Unimproved water source', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.waterUnimproved ?? 0, 28);
      yRight += lineH;
      doc.text('Food Production:', colX[2] + 8, yRight);
      yRight += lineH;
      doc.text('VG_Vegetable garden', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.foodVG ?? 0, 28);
      yRight += lineH;
      doc.text('FT_Fruit', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.foodFruit ?? 0, 28);
      yRight += lineH;
      doc.text('PL_Poultry/livestock', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.foodPL ?? 0, 28);
      yRight += lineH;
      doc.text('FP_Fishpond', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.foodFP ?? 0, 28);
      yRight += lineH;
      doc.text('Households using:', colX[2] + 8, yRight);
      yRight += lineH;
      doc.text('Iodized salt', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.iodizedSalt ?? 0, 28);
      yRight += lineH;
      doc.text('Iron-Fortified Rice', colX[2] + 14, yRight);
      drawValue(colX[2] + colW - 18, yRight, s.practices.ironFortifiedRice ?? 0, 28);

      const fileName = `Family-Profile-Survey-Summary-${year}-${summaryFilters.barangay || 'All'}.pdf`;
      doc.save(fileName);
      setMessage({ type: 'success', text: 'Family Profile Survey Summary exported as PDF (form layout).' });
    } catch (err: any) {
      console.error('handleExportSurveySummaryPdf error:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || err.message || 'Error exporting summary to PDF' });
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
          <h2>Family Profile Survey Summary </h2>
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
          <div className="export-actions">
            <button type="button" className="export-btn primary" disabled={exporting} onClick={handleExportSurveySummary}>
              {exporting ? 'Exporting...' : 'Export Family Profile Summary (Excel)'}
            </button>
            <button type="button" className="export-btn primary" disabled={exporting} onClick={handleExportSurveySummaryPdf}>
              {exporting ? 'Exporting...' : 'Export Family Profile Summary (PDF)'}
            </button>
          </div>
        </div>

        <div className="export-card export-card-bns">
          <h2>BNS Form (PDF)</h2>
          <p>Download printable BNS Form (PDF). Filter by barangay and purok/sitio to generate the form for specific areas.</p>
          
          {/* BNS Form Filter Section */}
          <div className="bns-form-filters">
            <div className="filter-row">
              <label>Barangay <span className="required">*</span></label>
              <DownwardSelect
                value={bnsFormFilters.barangay}
                onChange={handleBnsFormBarangayChange}
                options={[
                  { value: '', label: 'Select Barangay' },
                  ...BARANGAYS.map((b) => ({ value: b, label: BARANGAY_DISPLAY[b] || b })),
                ]}
              />
            </div>
            <div className="filter-row">
              <label>Purok / Sitio</label>
              <input 
                type="text" 
                value={bnsFormFilters.purokSitio} 
                onChange={(e) => setBnsFormFilters((f) => ({ ...f, purokSitio: e.target.value }))}
                placeholder="Enter Purok/Sitio (optional)"
                disabled={!bnsFormFilters.barangay}
              />
            </div>
          </div>
          
          <button
            onClick={handleExportBnsPdf}
            className="export-btn primary"
            disabled={exporting || !bnsFormFilters.barangay}
          >
            {exporting ? 'Exporting...' : 'Download BNS Form (PDF)'}
          </button>
          {!bnsFormFilters.barangay && (
            <p className="filter-hint">Please select a barangay to generate the BNS Form</p>
          )}
        </div>

      </div>
    </div>
  );
};

export default ExportData;
