import { useState } from 'react';
import axios from 'axios';
import ExcelJS from 'exceljs';
import { API_BASE_URL } from '../config/api';
import {
  aggregateSummary,
  applyFilters,
  BARANGAYS,
  BARANGAY_DISPLAY,
  type SurveySummary,
} from '../utils/surveySummary';
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

  const handleExport = async (format: 'json' | 'csv' | 'excel') => {
    setExporting(true);
    setMessage(null);

    try {
      const response = await axios.get(`${API_BASE_URL}/api/households?per_page=10000`);
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
        // Excel export matching BNS Form structure with proper layout using ExcelJS
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Household Data');

        // Add form header (rows 1-3)
        const titleRow1 = worksheet.addRow(['BNS Form No. 1A']);
        titleRow1.getCell(1).font = { bold: true, size: 14 };
        titleRow1.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells(1, 1, 1, 34);

        const titleRow2 = worksheet.addRow(['Philippine Plan of Action for Nutrition']);
        titleRow2.getCell(1).font = { bold: true, size: 12 };
        titleRow2.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells(2, 1, 2, 34);

        const titleRow3 = worksheet.addRow(['HOUSEHOLD PROFILE']);
        titleRow3.getCell(1).font = { bold: true, size: 12 };
        titleRow3.getCell(1).alignment = { horizontal: 'center' };
        worksheet.mergeCells(3, 1, 3, 34);

        // Add empty row
        worksheet.addRow([]);

        // Define column headers matching BNS Form PDF structure (C1-C34)
        // Row 5: Main header row with merged cells for categories
        const mainHeaderRow = worksheet.addRow([]);
        
        // C1-C5: Basic Info
        mainHeaderRow.getCell(1).value = 'HH\nNo.';
        mainHeaderRow.getCell(2).value = 'No. of\nfamily\nliving in\nthe house';
        mainHeaderRow.getCell(3).value = 'Number\nof HH\nmembers';
        mainHeaderRow.getCell(4).value = 'NHTS\nHousehold';
        mainHeaderRow.getCell(5).value = 'Indigenous\nGroup';
        
        // C6-C25: Age Classification / Health Risk Group (with M/F subheaders)
        // Newborn (0-28 days) - C6, C7
        worksheet.mergeCells(5, 6, 5, 7);
        mainHeaderRow.getCell(6).value = 'Newborn\n(0-28 days)';
        
        // Infant (29 days-11 months) - C8, C9
        worksheet.mergeCells(5, 8, 5, 9);
        mainHeaderRow.getCell(8).value = 'Infant\n(29 days-\n11 months)';
        
        // Under-five (1-4 years old) - C10, C11
        worksheet.mergeCells(5, 10, 5, 11);
        mainHeaderRow.getCell(10).value = 'Under-five\n(1-4 years\nold)';
        
        // Children 5-9 y.o. - C12, C13
        worksheet.mergeCells(5, 12, 5, 13);
        mainHeaderRow.getCell(12).value = 'Children\n5-9 y.o.';
        
        // Adolescence (10-19 y.o.) - C14, C15
        worksheet.mergeCells(5, 14, 5, 15);
        mainHeaderRow.getCell(14).value = 'Adolescence\n(10-19 y.o.)';
        
        // Pregnant - C16
        mainHeaderRow.getCell(16).value = 'Pregnant';
        
        // Adolescent Pregnant - C17
        mainHeaderRow.getCell(17).value = 'Adolescent\nPregnant';
        
        // Post-Partum (PP) - C18
        mainHeaderRow.getCell(18).value = 'Post-\nPartum\n(PP)';
        
        // 15-49 y.o. not pregnant & non PP - C19
        mainHeaderRow.getCell(19).value = '15-49 y.o.\nnot pregnant\n& non PP';
        
        // Adult 20-59 y.o. - C20, C21
        worksheet.mergeCells(5, 20, 5, 21);
        mainHeaderRow.getCell(20).value = 'Adult\n20-59 y.o.';
        
        // Senior Citizens - C22, C23
        worksheet.mergeCells(5, 22, 5, 23);
        mainHeaderRow.getCell(22).value = 'Senior\nCitizens';
        
        // Person With Disability - C24, C25
        worksheet.mergeCells(5, 24, 5, 25);
        mainHeaderRow.getCell(24).value = 'Person\nWith\nDisability';
        
        // Name of Father (Fa), Mother (Mo), Caregiver (Ca) - C26, C27, C28
        mainHeaderRow.getCell(26).value = 'Name of\nFather\n(Fa)';
        mainHeaderRow.getCell(27).value = 'Name of\nMother\n(Mo)';
        mainHeaderRow.getCell(28).value = 'Name of\nCaregiver\n(Ca)';
        
        // Occupation - C29, C30, C31
        mainHeaderRow.getCell(29).value = 'Occupation\n(Fa)';
        mainHeaderRow.getCell(30).value = 'Occupation\n(Mo)';
        mainHeaderRow.getCell(31).value = 'Occupation\n(Ca)';
        
        // Educational Attainment - C32, C33, C34
        mainHeaderRow.getCell(32).value = 'Educational\nAttainment\n(Fa)';
        mainHeaderRow.getCell(33).value = 'Educational\nAttainment\n(Mo)';
        mainHeaderRow.getCell(34).value = 'Educational\nAttainment\n(Ca)';

        // Add headers for additional columns in main header row (empty for now, will be in row 7)
        for (let i = 35; i <= 44; i++) {
          mainHeaderRow.getCell(i).value = '';
          mainHeaderRow.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }

        // Format main header row
        mainHeaderRow.font = { bold: true, size: 9 };
        mainHeaderRow.alignment = { 
          vertical: 'middle', 
          horizontal: 'center',
          wrapText: true 
        };
        mainHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8E8E8' }
        };
        mainHeaderRow.height = 60;
        mainHeaderRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Row 6: M/F subheaders for age groups
        const subHeaderRow = worksheet.addRow([]);
        // C1-C5: Empty or labels
        subHeaderRow.getCell(1).value = 'C1';
        subHeaderRow.getCell(2).value = 'C2';
        subHeaderRow.getCell(3).value = 'C3';
        subHeaderRow.getCell(4).value = 'C4';
        subHeaderRow.getCell(5).value = 'C5';
        
        // C6-C25: M/F labels
        subHeaderRow.getCell(6).value = 'M';
        subHeaderRow.getCell(7).value = 'F';
        subHeaderRow.getCell(8).value = 'M';
        subHeaderRow.getCell(9).value = 'F';
        subHeaderRow.getCell(10).value = 'M';
        subHeaderRow.getCell(11).value = 'F';
        subHeaderRow.getCell(12).value = 'M';
        subHeaderRow.getCell(13).value = 'F';
        subHeaderRow.getCell(14).value = 'M';
        subHeaderRow.getCell(15).value = 'F';
        subHeaderRow.getCell(16).value = 'F';
        subHeaderRow.getCell(17).value = 'F';
        subHeaderRow.getCell(18).value = 'F';
        subHeaderRow.getCell(19).value = 'F';
        subHeaderRow.getCell(20).value = 'M';
        subHeaderRow.getCell(21).value = 'F';
        subHeaderRow.getCell(22).value = 'M';
        subHeaderRow.getCell(23).value = 'F';
        subHeaderRow.getCell(24).value = 'M';
        subHeaderRow.getCell(25).value = 'F';
        
        // C26-C34: Column labels
        subHeaderRow.getCell(26).value = 'C26';
        subHeaderRow.getCell(27).value = 'C27';
        subHeaderRow.getCell(28).value = 'C28';
        subHeaderRow.getCell(29).value = 'C29';
        subHeaderRow.getCell(30).value = 'C30';
        subHeaderRow.getCell(31).value = 'C31';
        subHeaderRow.getCell(32).value = 'C32';
        subHeaderRow.getCell(33).value = 'C33';
        subHeaderRow.getCell(34).value = 'C34';
        
        // Additional columns (35-44) - empty in subheader
        for (let i = 35; i <= 44; i++) {
          subHeaderRow.getCell(i).value = '';
        }

        // Format subheader row
        subHeaderRow.font = { bold: true, size: 9 };
        subHeaderRow.alignment = { 
          vertical: 'middle', 
          horizontal: 'center',
          wrapText: true 
        };
        subHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF0F0F0' }
        };
        subHeaderRow.height = 25;
        subHeaderRow.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Row 7: Additional headers for location and other fields
        const additionalHeaderRow = worksheet.addRow([]);
        // C1-C34 already have headers, now add headers for additional columns
        additionalHeaderRow.getCell(35).value = 'Purok/Sito';
        additionalHeaderRow.getCell(36).value = 'Barangay';
        additionalHeaderRow.getCell(37).value = 'Municipality/City';
        additionalHeaderRow.getCell(38).value = 'Province';
        additionalHeaderRow.getCell(39).value = 'Couple Practicing\nFamily Planning';
        additionalHeaderRow.getCell(40).value = 'Toilet Type\n(1,2,3,4)';
        additionalHeaderRow.getCell(41).value = 'Water Source\n(1,2)';
        additionalHeaderRow.getCell(42).value = 'Food Production\nActivity\n(VG/PL/FP)';
        additionalHeaderRow.getCell(43).value = 'HH using\nIodized Salt';
        additionalHeaderRow.getCell(44).value = 'HH using\nIron-Fortified\nRice';

        // Format additional header row
        additionalHeaderRow.font = { bold: true, size: 9 };
        additionalHeaderRow.alignment = { 
          vertical: 'middle', 
          horizontal: 'center',
          wrapText: true 
        };
        additionalHeaderRow.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFE8E8E8' }
        };
        additionalHeaderRow.height = 40;
        additionalHeaderRow.eachCell((cell, colNumber) => {
          if (colNumber >= 35) {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
          }
        });

        // Also update subheader row to include empty cells for additional columns
        for (let i = 35; i <= 44; i++) {
          subHeaderRow.getCell(i).value = '';
          subHeaderRow.getCell(i).border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        }

        // Add data rows starting from row 8
        households.forEach((h: any) => {
          // Get members data
          const father = h.members?.find((m: any) => m.role === 'father');
          const mother = h.members?.find((m: any) => m.role === 'mother');
          const caregiver = h.members?.find((m: any) => m.role === 'caregiver');

          // Create row with C1-C34 data matching PDF structure
          const row = worksheet.addRow([
            // C1: HH No.
            h.household_number || '',
            // C2: No. of family living in the house
            h.family_living_in_house || 0,
            // C3: Number of HH members
            h.number_of_members || 0,
            // C4: NHTS Household
            h.nhts_household_group || '',
            // C5: Indigenous Group
            h.indigenous_group || '',
            // C6-C7: Newborn (0-28 days) M/F
            h.newborn_male || 0,
            h.newborn_female || 0,
            // C8-C9: Infant (29 days-11 months) M/F
            h.infant_male || 0,
            h.infant_female || 0,
            // C10-C11: Under-five (1-4 years old) M/F
            h.under_five_male || 0,
            h.under_five_female || 0,
            // C12-C13: Children 5-9 y.o. M/F
            h.children_male || 0,
            h.children_female || 0,
            // C14-C15: Adolescence (10-19 y.o.) M/F
            h.adolescence_male || 0,
            h.adolescence_female || 0,
            // C16: Pregnant F
            h.pregnant || 0,
            // C17: Adolescent Pregnant F
            h.adolescent_pregnant || 0,
            // C18: Post-Partum (PP) F
            h.post_partum || 0,
            // C19: 15-49 y.o. not pregnant & non PP F
            h.women_15_49_not_pregnant || 0,
            // C20-C21: Adult 20-59 y.o. M/F
            h.adult_male || 0,
            h.adult_female || 0,
            // C22-C23: Senior Citizens M/F
            h.senior_citizen_male || 0,
            h.senior_citizen_female || 0,
            // C24-C25: Person With Disability M/F
            h.pwd_male || 0,
            h.pwd_female || 0,
            // C26: Name of Father (Fa)
            father?.name || '',
            // C27: Name of Mother (Mo)
            mother?.name || '',
            // C28: Name of Caregiver (Ca)
            caregiver?.name || '',
            // C29: Occupation (Fa)
            father?.occupation || '',
            // C30: Occupation (Mo)
            mother?.occupation || '',
            // C31: Occupation (Ca)
            caregiver?.occupation || '',
            // C32: Educational Attainment (Fa)
            father?.educational_attainment || '',
            // C33: Educational Attainment (Mo)
            mother?.educational_attainment || '',
            // C34: Educational Attainment (Ca)
            caregiver?.educational_attainment || '',
          ]);

          // Add location info and additional fields in merged cells or separate columns
          // For now, we'll add them as additional columns after C34, or we can add them in a separate section
          // Actually, looking at the PDF, location info (Purok/Sito, Barangay, etc.) appears to be per-row info
          // Let's add them as columns after C34
          row.getCell(35).value = h.purok_sito || '';
          row.getCell(36).value = h.barangay || '';
          row.getCell(37).value = h.municipality_city || '';
          row.getCell(38).value = h.province || '';
          row.getCell(39).value = h.couple_practicing_family_planning === true ? 'Yes' : h.couple_practicing_family_planning === false ? 'No' : '';
          row.getCell(40).value = h.toilet_type || '';
          row.getCell(41).value = h.water_source || '';
          row.getCell(42).value = h.food_production_activity || '';
          row.getCell(43).value = h.using_iodized_salt ? 'Yes' : 'No';
          row.getCell(44).value = h.using_iron_fortified_rice ? 'Yes' : 'No';

          // Style data rows
          row.eachCell((cell, colNumber) => {
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };
            // C1-C34: Center align numbers, left align text
            if (colNumber >= 1 && colNumber <= 25 && typeof cell.value === 'number') {
              cell.alignment = { 
                vertical: 'middle', 
                horizontal: 'center'
              };
            } else if (colNumber >= 26 && colNumber <= 44) {
              // C26-C44: Left align text
              cell.alignment = { 
                vertical: 'middle', 
                horizontal: 'left',
                wrapText: true 
              };
            } else {
              cell.alignment = { 
                vertical: 'middle', 
                horizontal: 'left',
                wrapText: true 
              };
            }
          });
        });

        // Set column widths for C1-C34 matching PDF layout
        worksheet.columns = [
          { width: 10 }, // C1: HH No.
          { width: 8 }, // C2: No. of family living in the house
          { width: 8 }, // C3: Number of HH members
          { width: 12 }, // C4: NHTS Household
          { width: 12 }, // C5: Indigenous Group
          { width: 6 }, // C6: Newborn M
          { width: 6 }, // C7: Newborn F
          { width: 6 }, // C8: Infant M
          { width: 6 }, // C9: Infant F
          { width: 6 }, // C10: Under-five M
          { width: 6 }, // C11: Under-five F
          { width: 6 }, // C12: Children 5-9 M
          { width: 6 }, // C13: Children 5-9 F
          { width: 6 }, // C14: Adolescence M
          { width: 6 }, // C15: Adolescence F
          { width: 6 }, // C16: Pregnant F
          { width: 8 }, // C17: Adolescent Pregnant F
          { width: 6 }, // C18: Post-Partum F
          { width: 10 }, // C19: 15-49 y.o. not pregnant & non PP F
          { width: 6 }, // C20: Adult M
          { width: 6 }, // C21: Adult F
          { width: 8 }, // C22: Senior Citizens M
          { width: 8 }, // C23: Senior Citizens F
          { width: 8 }, // C24: Person With Disability M
          { width: 8 }, // C25: Person With Disability F
          { width: 18 }, // C26: Name of Father
          { width: 18 }, // C27: Name of Mother
          { width: 18 }, // C28: Name of Caregiver
          { width: 12 }, // C29: Occupation (Fa)
          { width: 12 }, // C30: Occupation (Mo)
          { width: 12 }, // C31: Occupation (Ca)
          { width: 15 }, // C32: Educational Attainment (Fa)
          { width: 15 }, // C33: Educational Attainment (Mo)
          { width: 15 }, // C34: Educational Attainment (Ca)
          { width: 12 }, // Additional: Purok/Sito
          { width: 15 }, // Additional: Barangay
          { width: 18 }, // Additional: Municipality/City
          { width: 12 }, // Additional: Province
          { width: 12 }, // Additional: Couple Practicing Family Planning
          { width: 10 }, // Additional: Toilet Type
          { width: 10 }, // Additional: Water Source
          { width: 15 }, // Additional: Food Production Activity
          { width: 12 }, // Additional: HH using Iodized Salt
          { width: 15 }, // Additional: HH using Iron-Fortified Rice
        ];

        // Freeze header rows (rows 1-7)
        worksheet.views = [{ state: 'frozen', ySplit: 7 }];

        // Generate buffer and download
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
      const res = await axios.get(`${API_BASE_URL}/api/households?per_page=10000`);
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
      r7.eachCell((c) => { c.font = headerFont; c.border = thinBorder; });

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
          if (colNumber % 2 === 0) cell.alignment = { ...cell.alignment, horizontal: 'right' };
        });
      }

      ws.getColumn(1).width = 42;
      ws.getColumn(2).width = 12;
      ws.getColumn(3).width = 42;
      ws.getColumn(4).width = 12;
      ws.getColumn(5).width = 42;
      ws.getColumn(6).width = 14;
      ws.views = [{ state: 'frozen' as const, ySplit: 7 }];

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
              <input type="text" value={summaryFilters.bns} onChange={(e) => setSummaryFilters((f) => ({ ...f, bns: e.target.value }))} placeholder="Barangay Nutrition Scholar" />
            </div>
            <div className="filter-row">
              <label>Barangay</label>
              <select value={summaryFilters.barangay} onChange={(e) => setSummaryFilters((f) => ({ ...f, barangay: e.target.value }))}>
                <option value="">All Barangays</option>
                {BARANGAYS.map((b) => (
                  <option key={b} value={b}>{BARANGAY_DISPLAY[b] || b}</option>
                ))}
              </select>
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

        <div className="export-card">
          <h2>JSON Format</h2>
          <p>Export all household data as JSON file. Includes all fields and relationships.</p>
          <button 
            onClick={() => handleExport('json')} 
            className="export-btn"
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export as JSON'}
          </button>
        </div>

        <div className="export-card">
          <h2>CSV Format</h2>
          <p>Export household data as CSV file. Suitable for spreadsheet applications.</p>
          <button 
            onClick={() => handleExport('csv')} 
            className="export-btn"
            disabled={exporting}
          >
            {exporting ? 'Exporting...' : 'Export as CSV'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExportData;
