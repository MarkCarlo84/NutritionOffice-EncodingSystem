import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import ExcelJS from 'exceljs';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  aggregateSummary,
  applyFilters,
  BARANGAYS,
  BARANGAY_DISPLAY,
  MONTH_OPTIONS,
  monthLabel,
  OCC_LABELS,
  ED_LABELS,
} from '../utils/surveySummary';
import { buildSummaryWorksheet } from '../utils/summaryExcel';
import { getBnsOptions, resolveBnsForBarangay } from '../utils/bnsByBarangay';
import DownwardSelect from '../components/DownwardSelect';
import { BNS_COL_WIDTHS } from '../utils/bnsFormTemplate';
import './ExportData.css';


const ExportData = () => {
  const [exporting, setExporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [summaryFilters, setSummaryFilters] = useState({
    bns: '',
    barangay: '',
    purokBlockStreet: '',
    combinedPuroks: [] as string[],
    customPurokText: '',
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

  const [isPurokModalOpen, setIsPurokModalOpen] = useState(false);

  // Households from system to build Purok options per barangay
  const [householdsForFilters, setHouseholdsForFilters] = useState<{ barangay: string; purok_sito: string }[]>([]);

  useEffect(() => {
    const fetchHouseholds = async () => {
      try {
        const res = await api.get('/households', { params: { per_page: 10000 } });
        const list = res.data?.data ?? res.data ?? [];
        const arr = Array.isArray(list) ? list : [];
        setHouseholdsForFilters(arr.map((h: any) => ({ barangay: h.barangay || '', purok_sito: String(h.purok_sito || '').trim() })));
      } catch {
        setHouseholdsForFilters([]);
      }
    };
    fetchHouseholds();
  }, []);

  const summaryPurokOptions = useMemo(() => {
    const empty = { value: '', label: 'All' };
    if (!summaryFilters.barangay) return [empty];
    const distinct = Array.from(
      new Set(
        householdsForFilters
          .filter((h) => h.barangay === summaryFilters.barangay && h.purok_sito)
          .map((h) => h.purok_sito)
      )
    ).sort();
    return [empty, ...distinct.map((p) => ({ value: p, label: p }))];
  }, [householdsForFilters, summaryFilters.barangay]);

  const bnsPurokOptions = useMemo(() => {
    const empty = { value: '', label: 'All' };
    if (!bnsFormFilters.barangay) return [empty];
    const distinct = Array.from(
      new Set(
        householdsForFilters
          .filter((h) => h.barangay === bnsFormFilters.barangay && h.purok_sito)
          .map((h) => h.purok_sito)
      )
    ).sort();
    return [empty, ...distinct.map((p) => ({ value: p, label: p }))];
  }, [householdsForFilters, bnsFormFilters.barangay]);

  const handleSummaryBarangayChange = (barangay: string) => {
    setSummaryFilters((f) => ({
      ...f,
      barangay,
      bns: resolveBnsForBarangay(barangay, f.bns),
      purokBlockStreet: '',
      combinedPuroks: [],
      customPurokText: '',
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
      const pageHeight = (doc.internal.pageSize as any).getHeight();
      const margin = 16;
      const startY = 78;
      const drawBnsHeader = () => {
        // ===== Header styled like sample image =====
        doc.setFontSize(8);
        doc.text('BNS Form No. 1A', margin, 16);
        doc.text('Philippine Plan of Action for Nutrition', margin, 28);
        doc.setFontSize(12);
        doc.text('HOUSEHOLD PROFILE', pageWidth / 2, 22, { align: 'center' });
        doc.setFontSize(7);
        doc.text(`Edited ${new Date().toLocaleDateString()}`, pageWidth - margin, 16, { align: 'right' });

        const barangayLabel = bnsFormFilters.barangay
          ? (BARANGAY_DISPLAY[bnsFormFilters.barangay] || bnsFormFilters.barangay)
          : '';
        // Lines Purok/Sitio, Barangay, Municipality/City, Province
        const lineY1 = 44;
        const lineY2 = 60;
        doc.setFontSize(9);
        // Row 1 labels
        doc.text('Purok/Sitio:', margin, lineY1);
        doc.text('Municipality/City:', pageWidth / 2 + 16, lineY1);
        // Row 2 labels
        doc.text('Barangay:', margin, lineY2);
        doc.text('Province:', pageWidth / 2 + 16, lineY2);
        // Underlines
        const drawUnderline = (x1: number, y: number, x2: number, text?: string) => {
          doc.setLineWidth(0.5);
          doc.line(x1, y + 2, x2, y + 2);
          if (text) {
            doc.setFontSize(9);
            doc.text(text, x1 + 2, y);
          }
        };
        drawUnderline(margin + 70, lineY1, pageWidth / 2 - 20, bnsFormFilters.purokSitio || '');
        drawUnderline(pageWidth / 2 + 120, lineY1, pageWidth - margin, 'Cabuyao');
        drawUnderline(margin + 56, lineY2, pageWidth / 2 - 20, barangayLabel);
        drawUnderline(pageWidth / 2 + 80, lineY2, pageWidth - margin, 'Laguna');
      };

      // ===== Table layout similar to form header rows =====
      const contentWidth = pageWidth - margin * 2;
      const totalExcelW = BNS_COL_WIDTHS.slice(0, 34).reduce((a, b) => a + b, 0);
      const scale = contentWidth / totalExcelW;
      const columns = Array.from({ length: 34 }, (_, i) => ({
        header: `C${i + 1}`,
        dataKey: `C${i + 1}`,
      }));
      // Column widths must sum exactly to contentWidth so C34's right edge aligns with the table border
      const colWidths = BNS_COL_WIDTHS.slice(0, 34).map((w) => Math.max(8, Math.floor(w * scale)));
      const widthSum = colWidths.reduce((a, b) => a + b, 0);
      const remainder = contentWidth - widthSum;
      if (remainder !== 0) colWidths[33] = Math.max(8, colWidths[33] + remainder); // give remainder to C34
      const columnStyles: Record<number, any> = {};
      colWidths.forEach((w, i) => {
        columnStyles[i] = { cellWidth: w };
      });

      // YES/NO strictly from data
      const yesNo = (val: any): string => {
        if (val === true || val === 1 || (typeof val === 'string' && val.toLowerCase() === 'yes')) return 'Yes';
        if (val === false || val === 0 || (typeof val === 'string' && val.toLowerCase() === 'no')) return 'No';
        return '';
      };

      const ageFields = ['newborn_male', 'newborn_female', 'infant_male', 'infant_female', 'under_five_male', 'under_five_female', 'children_male', 'children_female', 'adolescence_male', 'adolescence_female', 'pregnant', 'adolescent_pregnant', 'post_partum', 'women_15_49_not_pregnant', 'adult_male', 'adult_female', 'senior_citizen_male', 'senior_citizen_female', 'pwd_male', 'pwd_female'];

      // Build body: one row per household; row height varies so names fit (Fa/Mo/Ca in separate bands)
      const minRowH = 42; // original height so Fa/Mo/Ca names fit comfortably
      const nameFontSize = 4.5; // names: bigger so Father/Mother/Caregiver are readable
      const lineHeightPt = 6.5; // line height for name wrapping at larger font
      const wC26 = colWidths[25]; // C26 column width in pt
      const approxCharWidth = 2.2; // pt per char at nameFontSize
      const charsPerLineC26 = Math.max(8, Math.floor(wC26 / approxCharWidth));
      const nameTopInset = 3; // space from top of band so text isn't clipped

      const stripRolePrefix = (s?: string) => {
        if (!s) return '';
        let v = (s || '').trim();
        ['(Fa)', '(Mo)', '(Ca)'].forEach((tg) => {
          if (v.startsWith(tg)) v = v.substring(tg.length).trim();
        });
        return v;
      };
      const faMoCaLine = (tag: string, name?: string) => {
        const v = stripRolePrefix(name);
        return v ? `${tag} ${v}` : tag;
      };
      const linesNeeded = (text: string, charsPerLine: number) =>
        Math.max(1, Math.ceil((text || '').length / charsPerLine));

      const maxHouseholdsPerPage = 8;

      // Build multi-row header similar to the official form
      const headRows: any[] = [];
      headRows.push([
        { content: 'HH\nNo.', rowSpan: 3 },
        { content: 'No. of\nfamily\nliving in\nthe house', rowSpan: 3 },
        { content: 'Number\nof HH\nmembers', rowSpan: 3 },
        { content: 'NHTS Household\n1-NHTS 4Ps\n2-NHTS Non-4Ps\n3-Non-NHTS', rowSpan: 3 },
        { content: 'Indigenous Group\n1-IP  2-Non-IP', rowSpan: 3 },
        { content: 'Number of Family Members by Age Classification / Health Risk Group', colSpan: 20 },
        { content: 'Name of Father (Fa) and\nMother (Mo); Caregiver\n(Ca)', rowSpan: 3 },
        { content: 'Occupation', rowSpan: 3 },
        { content: 'Educational\nAttainment', rowSpan: 3 },
        { content: 'Couple Practicing\nFamily Planning', rowSpan: 3 },
        // Grouped headers on the far right to match "Fill in:" and "Check if" bands
        { content: 'Fill in:', colSpan: 3 },
        { content: 'Check if', colSpan: 2 },
      ]);
      headRows.push([
        { content: 'Newborn\n(0-28 days)', colSpan: 2 },
        { content: 'Infant\n(29 days-11 months)', colSpan: 2 },
        { content: 'Under-five\n(1-4 years old)', colSpan: 2 },
        { content: 'Children\n5-9 y.o.', colSpan: 2 },
        { content: 'Adolescence\n(10-19 y.o.)', colSpan: 2 },
        { content: 'Pregnant' },
        { content: 'Adolescent\nPregnant' },
        { content: 'Post-Partum\n(PP)' },
        { content: '15-49 y.o.\nnot pregnant & non PP' },
        { content: 'Adult\n20-59 y.o.', colSpan: 2 },
        { content: 'Senior\nCitizens', colSpan: 2 },
        { content: 'Person With\nDisability', colSpan: 2 },
        // Second-level headers for the grouped "Fill in:" and "Check if" columns,
        // each spanning down over the sex row so they visually match the sample form.
        { content: 'Toilet Type\n(1, 2, 3, 4)', rowSpan: 2 },
        { content: 'Water Source\n(1, 2)', rowSpan: 2 },
        { content: 'Food Production\nActivity (VG/FT/PL/FP/NA)', rowSpan: 2 },
        { content: 'HH using\nIodized Salt', rowSpan: 2 },
        { content: 'HH using Iron-Fortified Rice', rowSpan: 2 },
      ]);
      headRows.push([
        'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'M', 'F', 'F', 'F', 'F', 'F', 'M', 'F', 'M', 'F', 'M', 'F',
      ]);
      // C-label row under the header (C1..C34)
      headRows.push(Array.from({ length: 34 }, (_, i) => `C${i + 1}`));

      // Available vertical space for table rows under the header
      const availableH = pageHeight - startY - 16;

      let globalIndex = 0;
      let pageIndex = 0;

      while (globalIndex < households.length || (households.length === 0 && pageIndex === 0)) {
        if (pageIndex > 0) doc.addPage();
        drawBnsHeader();

        const body: any[] = [];
        const bodyLinesByRow: { c26: string[]; c27: string[]; c28: string[] }[] = [];
        const rowHeights: number[] = [];
        const bodyBandHeights: number[][] = [];
        let usedHeight = 0;
        let rowsOnPage = 0;

        // Render exactly 8 rows per page
        while (rowsOnPage < maxHouseholdsPerPage) {
          const hasData = globalIndex < households.length;
          const h: any = hasData ? households[globalIndex] : {};
          const father = h.members?.find((m: any) => m.role === 'father');
          const mother = h.members?.find((m: any) => m.role === 'mother');
          const caregiver = h.members?.find((m: any) => m.role === 'caregiver');

          const nameLines: string[] = [
            faMoCaLine('(Fa)', father?.name),
            faMoCaLine('(Mo)', mother?.name),
            faMoCaLine('(Ca)', caregiver?.name),
          ];
          const occLines: string[] = [
            father?.occupation != null && father?.occupation !== '' ? String(father.occupation) : '',
            mother?.occupation != null && mother?.occupation !== '' ? String(mother.occupation) : '',
            caregiver?.occupation != null && caregiver?.occupation !== '' ? String(caregiver.occupation) : '',
          ];
          const edLines: string[] = [
            father?.educational_attainment != null && father?.educational_attainment !== '' ? String(father.educational_attainment) : '',
            mother?.educational_attainment != null && mother?.educational_attainment !== '' ? String(mother.educational_attainment) : '',
            caregiver?.educational_attainment != null && caregiver?.educational_attainment !== '' ? String(caregiver.educational_attainment) : '',
          ];

          // Per-band height: each of the 3 rows (Fa, Mo, Ca) must fit name (may wrap)
          const bandHeights = [0, 1, 2].map((i) => {
            const nLines = linesNeeded(nameLines[i], charsPerLineC26);
            return Math.max(14, nLines * lineHeightPt + 2); // original 14pt minimum per band
          });
          const rowH = Math.max(minRowH, bandHeights[0] + bandHeights[1] + bandHeights[2]);

          if (rowsOnPage > 0 && usedHeight + rowH > availableH) break;

          usedHeight += rowH;
          rowHeights.push(rowH);
          bodyBandHeights.push(bandHeights);

          const r: Record<string, any> = {};
          r['C1'] = hasData ? (bnsFormFilters.purokSitio === '' ? '' : globalIndex + 1) : ''; // Sequential HH No. across pages if a specific Purok is selected
          r['C2'] = h.family_living_in_house ?? '';
          r['C3'] = h.number_of_members ?? '';
          r['C4'] = h.nhts_household_group || '';
          r['C5'] = h.indigenous_group || '';
          ageFields.forEach((f, idx) => {
            r[`C${6 + idx}`] = hasData ? ((h as any)[f] ?? 0) : '';
          });
          // C26/C27/C28 drawn in didDrawCell so each line is in its own row band; leave empty for table
          r['C26'] = '';
          r['C27'] = '';
          r['C28'] = '';
          bodyLinesByRow.push({ c26: nameLines, c27: occLines, c28: edLines });
          r['C29'] = yesNo(h.couple_practicing_family_planning);
          r['C30'] = h.toilet_type || '';
          r['C31'] = h.water_source || '';
          r['C32'] = h.food_production_activity || '';
          r['C33'] = yesNo(h.using_iodized_salt);
          r['C34'] = yesNo(h.using_iron_fortified_rice);

          body.push(r);
          if (hasData) {
            globalIndex += 1;
          }
          rowsOnPage += 1;
        }

        // Track header bottom to draw an outer border
        let headerBottomY = startY;

        autoTable(doc as any, {
          columns,
          head: headRows as any,
          body,
          startY,
          styles: {
            fontSize: 6.5,
            cellPadding: 1,
            halign: 'center',
            valign: 'middle',
            lineColor: [0, 0, 0],
            textColor: [0, 0, 0],
            lineWidth: 0.5,
          },
          bodyStyles: { minCellHeight: minRowH },
          headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontStyle: 'bold',
            lineColor: [0, 0, 0],
            lineWidth: 0.7,
          },
          theme: 'grid',
          margin: { left: margin, right: margin },
          columnStyles,
          didParseCell: (data: any) => {
            if (data.section === 'body') {
              const colIndex = data.column.index; // 0-based
              const rowIndex = (data as any).row?.index ?? 0;
              if (rowHeights[rowIndex] != null) {
                data.cell.styles.minCellHeight = rowHeights[rowIndex];
              }
              // Data centered (default halign: 'center'); only C26/C27/C28 use custom drawing
              if ([25, 26, 27].includes(colIndex)) {
                data.cell.styles.valign = 'top';
                data.cell.styles.fontSize = 5;
              }
            }
          },
          didDrawCell: (data: any) => {
            if (data.section === 'head') {
              const b = data.cell.y + data.cell.height;
              if (b > headerBottomY) headerBottomY = b;
            }
            if (data.section === 'body') {
              const colIndex = data.column.index; // 0-based
              const rowIndex = (data as any).row?.index ?? 0;
              const x = data.cell.x;
              const y = data.cell.y;
              const w = data.cell.width;
              const h = data.cell.height;
              const bands = bodyBandHeights[rowIndex] ?? [h / 3, h / 3, h / 3];
              const bandTops = [0, bands[0], bands[0] + bands[1]].map((sum) => y + sum);
              // Horizontal dividers between Fa / Mo / Ca bands (use stored band heights so names fit)
              if ([25, 26, 27].includes(colIndex)) {
                doc.setDrawColor(0);
                doc.setLineWidth(0.5);
                doc.line(x, bandTops[1], x + w, bandTops[1]);
                doc.line(x, bandTops[2], x + w, bandTops[2]);
              }
              // Draw name / occupation / education in the correct band (row 1 = Fa, row 2 = Mo, row 3 = Ca)
              if ([25, 26, 27].includes(colIndex) && bodyLinesByRow[rowIndex]) {
                const key = colIndex === 25 ? 'c26' : colIndex === 26 ? 'c27' : 'c28';
                const lines = bodyLinesByRow[rowIndex][key];
                const padding = 2;
                const maxW = w - padding * 2;
                [0, 1, 2].forEach((i) => {
                  const line = lines[i] ?? '';
                  if (!line) return;
                  const bandTop = bandTops[i];
                  const bandHeight = bands[i];
                  const bandMid = bandTop + bandHeight / 2;
                  if (colIndex === 25) {
                    // C26 names: top-aligned with inset so text isn't clipped at top of band
                    doc.setFontSize(nameFontSize);
                    doc.setTextColor(0, 0, 0);
                    const baseline = bandTop + nameTopInset + nameFontSize;
                    (doc as any).text(line, x + padding, baseline, { maxWidth: maxW, align: 'left' });
                  } else {
                    // C27 occupation, C28 education: center horizontally in the band
                    doc.setFontSize(5);
                    doc.setTextColor(0, 0, 0);
                    const baseline = bandMid + 2.5;
                    const centerX = x + w / 2;
                    (doc as any).text(line, centerX, baseline, {
                      maxWidth: maxW,
                      align: 'center',
                    });
                  }
                });
              }
            }
          },
        });

        // Draw a black rectangle around the entire table header block
        doc.setDrawColor(0);
        doc.setLineWidth(0.9);
        doc.rect(margin, startY, contentWidth, Math.max(0, headerBottomY - startY));

        // ===== Legend footer under the last household row on every page =====
        const tableBottomY = ((doc as any).lastAutoTable?.finalY as number) || (startY + usedHeight);
        const footerHeight = 58;
        const footerTop = Math.min(pageHeight - footerHeight - 6, tableBottomY + 8);
        const footerCols = [
          {
            title: 'Abbreviations',
            lines: [
              'HH – household',
              'No – number',
              'NHTS – National Household Targeting System',
              '4Ps – Pantawid Pamilyang Pilipino Program',
              'IP – indigenous people',
              'y.o. – year old',
              'PP – post partum',
              'M – male   F – female',
              'Fa – father   Mo – mother',
            ],
          },
          {
            title: 'Occupation',
            lines: [
              '1 – Manager',
              '2 – Professional',
              '3 – Technician & Associate Professionals',
              '4 – Clerical Support Workers',
              '5 – Service & Sales Worker',
              '6 – Skilled agricultural, forestry & fishery workers',
              '7 – Craft & related trade workers',
              '8 – Plant & machine operators & assemblers',
              '9 – Elementary occupations',
              '10 – Armed Forces Occupations',
              '11 – None',
            ],
          },
          {
            title: 'Educational Attainment',
            lines: [
              'N – None',
              'EU – Elementary undergraduate',
              'EG – Elementary graduate',
              'HU – High school undergraduate',
              'HG – High school graduate',
              'CU – College undergraduate',
              'CG – College graduate',
              'V – Vocational',
              'PG – Post graduate studies',
            ],
          },
          {
            title: 'Toilet',
            lines: [
              '1 – Improved sanitation',
              '2 – Shared facility',
              '3 – Unimproved',
              '4 – Open defecation',
            ],
          },
          {
            title: 'Water Source',
            lines: [
              '1 – Improved source',
              '2 – Unimproved source',
            ],
          },
          {
            title: 'Food Production',
            lines: [
              'VG – Vegetable garden',
              'FT – Fruit',
              'PL – Poultry/Livestock',
              'FP – Fish pond',
              'NA – None',
            ],
          },
        ];

        const footerColWidth = contentWidth / footerCols.length;
        doc.setLineWidth(0.5);
        // Legend font set to 4.5pt per your request
        doc.setFontSize(4.5);
        footerCols.forEach((col, idx) => {
          const x = margin + idx * footerColWidth;
          const midX = x + footerColWidth / 2;
          const rowH = 4.8; // line spacing tuned for 4.5pt font

          // Column box
          doc.rect(x, footerTop, footerColWidth, footerHeight);

          // Title
          doc.setFont('helvetica', 'bold');
          doc.text(col.title, x + 2, footerTop + 7, { align: 'left' });

          // Lines (two-column layout for some legends)
          doc.setFont('helvetica', 'normal');
          const textYStart = footerTop + 13;

          if (col.title === 'Abbreviations') {
            const leftCol = [
              'HH – household',
              'No – number',
              'NHTS – National Household Targeting System',
              '4Ps – Pantawid Pamilyang Pilipino Program',
              'IP – indigenous people',
              'y.o. – year old',
            ];
            const rightCol = [
              'M – male',
              'F – female',
              'Fa – father',
              'Mo – mother',
              '',
              'PP – post partum',
            ];
            let y = textYStart;
            leftCol.forEach((txt, i) => {
              let maxLines = 1;
              if (txt) {
                const wrappedLeft = (doc as any).splitTextToSize(txt, footerColWidth / 2 - 4);
                wrappedLeft.forEach((wl: string, li: number) => {
                  doc.text(wl, x + 2, y + li * rowH, { align: 'left' });
                });
                maxLines = Math.max(maxLines, wrappedLeft.length);
              }
              const rightTxt = rightCol[i];
              if (rightTxt) {
                const wrappedRight = (doc as any).splitTextToSize(rightTxt, footerColWidth / 2 - 4);
                wrappedRight.forEach((wr: string, li: number) => {
                  doc.text(wr, midX + 2, y + li * rowH, { align: 'left' });
                });
                maxLines = Math.max(maxLines, wrappedRight.length);
              }
              y += maxLines * rowH;
            });
          } else if (col.title === 'Occupation') {
            const leftCol = col.lines.slice(0, 5);
            const rightCol = col.lines.slice(5);
            const maxRows = Math.max(leftCol.length, rightCol.length);
            let y = textYStart;
            for (let i = 0; i < maxRows; i++) {
              const l = leftCol[i];
              const r = rightCol[i];
              let maxLines = 1;
              if (l) {
                const wrappedLeft = (doc as any).splitTextToSize(l, footerColWidth / 2 - 4);
                wrappedLeft.forEach((wl: string, li: number) => {
                  doc.text(wl, x + 2, y + li * rowH, { align: 'left' });
                });
                maxLines = Math.max(maxLines, wrappedLeft.length);
              }
              if (r) {
                const wrappedRight = (doc as any).splitTextToSize(r, footerColWidth / 2 - 4);
                wrappedRight.forEach((wr: string, li: number) => {
                  doc.text(wr, midX + 2, y + li * rowH, { align: 'left' });
                });
                maxLines = Math.max(maxLines, wrappedRight.length);
              }
              y += maxLines * rowH;
            }
          } else if (col.title === 'Educational Attainment') {
            const leftCol = col.lines.slice(0, 5);
            const rightCol = col.lines.slice(5);
            const maxRows = Math.max(leftCol.length, rightCol.length);
            let y = textYStart;
            for (let i = 0; i < maxRows; i++) {
              const l = leftCol[i];
              const r = rightCol[i];
              let maxLines = 1;
              if (l) {
                const wrappedLeft = (doc as any).splitTextToSize(l, footerColWidth / 2 - 4);
                wrappedLeft.forEach((wl: string, li: number) => {
                  doc.text(wl, x + 2, y + li * rowH, { align: 'left' });
                });
                maxLines = Math.max(maxLines, wrappedLeft.length);
              }
              if (r) {
                const wrappedRight = (doc as any).splitTextToSize(r, footerColWidth / 2 - 4);
                wrappedRight.forEach((wr: string, li: number) => {
                  doc.text(wr, midX + 2, y + li * rowH, { align: 'left' });
                });
                maxLines = Math.max(maxLines, wrappedRight.length);
              }
              y += maxLines * rowH;
            }
          } else {
            // Single-column legends (Toilet, Water Source, Food Production)
            (doc as any).text(col.lines.join('\n'), x + 2, textYStart, {
              maxWidth: footerColWidth - 4,
              align: 'left',
            });
          }
        });

        pageIndex += 1;
      }

      // Unique timestamped filename to avoid caches
      const now = new Date();
      const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      const fileName = `Nutrition_BNS_Form_${stamp}.pdf`;
      doc.save(fileName);
      const pageCount = Math.max(1, pageIndex);
      
      if (households.length === 0) {
        setMessage({ type: 'success', text: `No data found. Generated a blank PDF with a "No Survey Conducted" watermark.` });
      } else {
        setMessage({ type: 'success', text: `BNS Form PDF generated (${households.length} household${households.length === 1 ? '' : 's'}) on ${pageCount} page${pageCount === 1 ? '' : 's'} (8 households max per page).` });
      }
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
        combinedPuroks: summaryFilters.combinedPuroks,
        surveyYear: summaryFilters.surveyYear,
        surveyPeriodFrom: summaryFilters.surveyPeriodFrom,
        surveyPeriodTo: summaryFilters.surveyPeriodTo,
      });
      const s = aggregateSummary(filtered);
      s.basic.bns = summaryFilters.bns || '—';
      s.basic.barangay = summaryFilters.barangay ? (BARANGAY_DISPLAY[summaryFilters.barangay] || summaryFilters.barangay) : 'All Barangays';
      let displayPurok = summaryFilters.purokBlockStreet || '—';
      if (summaryFilters.combinedPuroks && summaryFilters.combinedPuroks.length > 0) {
        displayPurok = summaryFilters.customPurokText || summaryFilters.combinedPuroks.join(', ');
      }
      s.basic.purokBlockStreet = displayPurok;
      s.basic.surveyYear = summaryFilters.surveyYear || new Date().getFullYear().toString();
      if (summaryFilters.surveyPeriodFrom && summaryFilters.surveyPeriodTo) {
        s.basic.surveyPeriod = `${monthLabel(summaryFilters.surveyPeriodFrom)} - ${monthLabel(summaryFilters.surveyPeriodTo)} ${s.basic.surveyYear}`;
      } else if (summaryFilters.surveyPeriodFrom) {
        s.basic.surveyPeriod = `From ${monthLabel(summaryFilters.surveyPeriodFrom)} ${s.basic.surveyYear}`;
      } else if (summaryFilters.surveyPeriodTo) {
        s.basic.surveyPeriod = `To ${monthLabel(summaryFilters.surveyPeriodTo)} ${s.basic.surveyYear}`;
      } else {
        s.basic.surveyPeriod = s.basic.surveyYear;
      }

      const workbook = new ExcelJS.Workbook();
      const ws = workbook.addWorksheet('Family Profile Survey Summary', { views: [{ rightToLeft: false }] });
      buildSummaryWorksheet(ws, s);

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Family-Profile-Survey-Summary-${s.basic.surveyYear}-${summaryFilters.barangay || 'All'}.xlsx`;
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
        combinedPuroks: summaryFilters.combinedPuroks,
        surveyYear: summaryFilters.surveyYear,
        surveyPeriodFrom: summaryFilters.surveyPeriodFrom,
        surveyPeriodTo: summaryFilters.surveyPeriodTo,
      });
      const s = aggregateSummary(filtered);
      s.basic.bns = summaryFilters.bns || '—';
      s.basic.barangay = summaryFilters.barangay ? (BARANGAY_DISPLAY[summaryFilters.barangay] || summaryFilters.barangay) : 'All Barangays';
      let displayPurok = summaryFilters.purokBlockStreet || '—';
      if (summaryFilters.combinedPuroks && summaryFilters.combinedPuroks.length > 0) {
        displayPurok = summaryFilters.customPurokText || summaryFilters.combinedPuroks.join(', ');
      }
      s.basic.purokBlockStreet = displayPurok;
      s.basic.surveyYear = summaryFilters.surveyYear || new Date().getFullYear().toString();
      if (summaryFilters.surveyPeriodFrom && summaryFilters.surveyPeriodTo) {
        s.basic.surveyPeriod = `${monthLabel(summaryFilters.surveyPeriodFrom)} - ${monthLabel(summaryFilters.surveyPeriodTo)} ${s.basic.surveyYear}`;
      } else if (summaryFilters.surveyPeriodFrom) {
        s.basic.surveyPeriod = `From ${monthLabel(summaryFilters.surveyPeriodFrom)} ${s.basic.surveyYear}`;
      } else if (summaryFilters.surveyPeriodTo) {
        s.basic.surveyPeriod = `To ${monthLabel(summaryFilters.surveyPeriodTo)} ${s.basic.surveyYear}`;
      } else {
        s.basic.surveyPeriod = s.basic.surveyYear;
      }

      const year = new Date().getFullYear();
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [936, 612] /* 8.5 x 13 inches */ });
      const pageWidth = (doc.internal.pageSize as any).getWidth();

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

      // Calculate max content height (left column has the most lines, roughly 480pt total height including padding)
      const colH = 480;

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
      doc.text(`SURVEY PERIOD & YEAR: ${surveyText}`, colX[2] + colW - 8, labelY, { align: 'right' });

      // normalize columns: single starting Y and consistent line height
      const colStartY = colY + 12;
      const lineH = 10;

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
      doc.setFontSize(8.5);
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
      doc.setFontSize(8.5);
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
      doc.setFontSize(8.5);
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

      // Add footer text inside right box exactly at bottom right corner like Excel
      doc.setFontSize(8);
      doc.setFont('helvetica', 'italic');
      doc.text('1 copy BNS / 1 copy BNC / 1 copy CNO', colX[2] + colW - 6, colY + colH - 6, { align: 'right' });
      doc.setFont('helvetica', 'normal'); // Reset font style

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
            <div className={`filter-row ${summaryFilters.combinedPuroks.length > 0 ? 'span-2' : ''}`} style={{ minWidth: 0 }}>
              <label>Purok / Block / Street</label>
              <div style={{ display: 'flex', gap: '8px', minWidth: 0 }}>
                <div style={{ position: 'relative', flex: 1, minWidth: 0 }}>
                  <button
                    type="button"
                    onClick={() => setIsPurokModalOpen(true)}
                    style={{
                      width: '100%',
                      minHeight: '40px',
                      padding: '10px 30px 10px 12px',
                      border: '1px solid var(--color-border-neutral)',
                      borderRadius: 'var(--radius)',
                      background: 'var(--color-surface)',
                      color: 'var(--color-text)',
                      fontSize: '14px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'block',
                      boxShadow: 'none',
                      transition: 'all 0.2s',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--color-primary)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--color-border-neutral)'; }}
                  >
                    {summaryFilters.combinedPuroks.length === 0
                      ? 'All'
                      : summaryFilters.combinedPuroks.join(', ')}
                  </button>
                  {/* Arrow indicator */}
                  <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '11px', opacity: 0.8 }}>
                    ▼
                  </div>
                </div>
                {summaryFilters.combinedPuroks.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSummaryFilters((f) => ({ ...f, combinedPuroks: [], customPurokText: '' }))}
                    style={{
                      padding: '0 12px',
                      background: '#fef2f2',
                      color: '#ef4444',
                      border: '1px solid #fca5a5',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontSize: '13px',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: '0 0 auto',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fee2e2'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                  >
                    Clear
                  </button>
                )}
              </div>
              {/* Optional custom text input (only shows when multiple selected) */}
            </div>
            {/* Force year and survey periods to start on a new row safely given the auto-fill layout */}
            <div className="filter-row" style={{ gridColumn: '1 / 2' }}>
              <label>Survey Year</label>
              <input type="text" value={summaryFilters.surveyYear} onChange={(e) => setSummaryFilters((f) => ({ ...f, surveyYear: e.target.value }))} placeholder="e.g. 2026" />
            </div>
            <div className="filter-row">
              <label>Survey Period (From)</label>
              <DownwardSelect
                value={summaryFilters.surveyPeriodFrom}
                options={[{ value: '', label: '—' }, ...MONTH_OPTIONS]}
                placeholder="—"
                onChange={(v) => setSummaryFilters((f) => ({ ...f, surveyPeriodFrom: v }))}
              />
            </div>
            <div className="filter-row">
              <label>Survey Period (To)</label>
              <DownwardSelect
                value={summaryFilters.surveyPeriodTo}
                options={[{ value: '', label: '—' }, ...MONTH_OPTIONS]}
                placeholder="—"
                onChange={(v) => setSummaryFilters((f) => ({ ...f, surveyPeriodTo: v }))}
              />
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
              <DownwardSelect
                value={bnsFormFilters.purokSitio}
                options={bnsPurokOptions}
                placeholder="All"
                onChange={(v) => setBnsFormFilters((f) => ({ ...f, purokSitio: v }))}
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

      {isPurokModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsPurokModalOpen(false)}>
          <div style={{ background: '#fff', padding: '24px', borderRadius: '12px', width: '90%', maxWidth: '500px', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#1e293b' }}>Select Purok / Block / Street</h3>
              <button
                type="button"
                onClick={() => setIsPurokModalOpen(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#64748b' }}
              >
                &times;
              </button>
            </div>
            <p style={{ margin: '0 0 20px 0', fontSize: '14px', color: '#64748b' }}>Select multiple areas to combine their data. Leave empty or click "Clear All" to select all areas in the barangay.</p>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {summaryPurokOptions.filter(o => o.value !== '').map((opt) => {
                const isSelected = summaryFilters.combinedPuroks.includes(opt.value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSummaryFilters(f => ({ ...f, combinedPuroks: f.combinedPuroks.filter(p => p !== opt.value) }));
                      } else {
                        setSummaryFilters(f => ({ ...f, combinedPuroks: [...f.combinedPuroks, opt.value] }));
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      border: isSelected ? '2px solid var(--color-primary)' : '1px solid #cbd5e1',
                      background: isSelected ? 'var(--color-primary-light)' : '#f8fafc',
                      color: isSelected ? 'var(--color-primary)' : '#475569',
                      fontWeight: isSelected ? '600' : '400',
                      cursor: 'pointer',
                      transition: 'all 0.15s'
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
              {summaryPurokOptions.length <= 1 && (
                <div style={{ color: '#94a3b8', fontStyle: 'italic', fontSize: '14px' }}>Please select a Barangay first to see available puroks.</div>
              )}
            </div>

            {summaryFilters.combinedPuroks.length > 1 && (
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>Custom Display Name (Optional)</label>
                <input
                  type="text"
                  value={summaryFilters.customPurokText || ''}
                  onChange={(e) => setSummaryFilters(f => ({ ...f, customPurokText: e.target.value }))}
                  placeholder="e.g. Purok 1 & 2"
                  style={{ width: '100%', padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }}
                />
                <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#94a3b8' }}>This will be printed on the export header instead of listing all puroks.</p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #e2e8f0', paddingTop: '16px' }}>
              <button
                type="button"
                onClick={() => setSummaryFilters(f => ({ ...f, combinedPuroks: [], customPurokText: '' }))}
                style={{
                  padding: '10px 20px',
                  background: 'transparent',
                  border: 'none',
                  color: '#ef4444',
                  fontWeight: '600',
                  cursor: 'pointer',
                  borderRadius: '6px'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                Clear Selection
              </button>
              <button
                type="button"
                onClick={() => setIsPurokModalOpen(false)}
                style={{
                  padding: '10px 24px',
                  background: 'var(--color-primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.backgroundColor = 'var(--color-primary-hover)'}
                onMouseLeave={e => e.currentTarget.style.backgroundColor = 'var(--color-primary)'}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExportData;
